package com.krupet.clinic.presentation.triage

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.math.TriageAssessmentEngine

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TriageScreen(
    modifier: Modifier = Modifier,
    onNavigateBack: (() -> Unit)? = null
) {
    // Patient header state
    var hnNumber by remember { mutableStateOf("HN-2026-0841") }
    var patientName by remember { mutableStateOf("Sokha Meas") }
    var patientAge by remember { mutableStateOf("45") }
    var arrivalMethod by remember { mutableStateOf("Ambulance") }

    // Vital signs state
    var respirationRateText by remember { mutableStateOf("24") }
    var spo2Text by remember { mutableStateOf("93") }
    var onSupplementalO2 by remember { mutableStateOf(true) }
    var isCopdTarget by remember { mutableStateOf(false) }
    var systolicBpText by remember { mutableStateOf("94") }
    var diastolicBpText by remember { mutableStateOf("58") }
    var pulseRateText by remember { mutableStateOf("118") }
    var temperatureText by remember { mutableStateOf("38.8") }
    var selectedAvpu by remember { mutableStateOf(TriageAssessmentEngine.ConsciousnessLevel.ALERT) }

    // GCS state
    var gcsEye by remember { mutableIntStateOf(4) }
    var gcsVerbal by remember { mutableIntStateOf(4) }
    var gcsMotor by remember { mutableIntStateOf(6) }

    // ESI decision wizard state
    var requiresLifeSaving by remember { mutableStateOf(false) }
    var isHighRiskOrSeverePain by remember { mutableStateOf(true) }
    var resourceCount by remember { mutableIntStateOf(2) }

    // Conversions
    val rr = respirationRateText.toIntOrNull() ?: 16
    val spo2 = spo2Text.toDoubleOrNull() ?: 98.0
    val sbp = systolicBpText.toIntOrNull() ?: 120
    val dbp = diastolicBpText.toIntOrNull() ?: 80
    val hr = pulseRateText.toIntOrNull() ?: 75
    val temp = temperatureText.toDoubleOrNull() ?: 37.0
    val age = patientAge.toIntOrNull() ?: 45

    // Calculated Clinical Indicators
    val map = (sbp + (2 * dbp)) / 3.0
    val shockIndex = hr.toDouble() / (if (sbp > 0) sbp else 120)

    val news2Result = remember(rr, spo2, onSupplementalO2, sbp, hr, selectedAvpu, temp, isCopdTarget) {
        TriageAssessmentEngine.calculateNews2(
            TriageAssessmentEngine.News2Input(
                respirationRate = rr,
                spO2Percentage = spo2,
                onSupplementalOxygen = onSupplementalO2,
                systolicBloodPressure = sbp,
                pulseRate = hr,
                consciousness = selectedAvpu,
                temperatureCelsius = temp,
                isHypercapnicRespiratoryFailureTarget = isCopdTarget
            )
        )
    }

    val gcsResult = remember(gcsEye, gcsVerbal, gcsMotor) {
        TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(
                eyeOpening = gcsEye,
                verbalResponse = gcsVerbal,
                motorResponse = gcsMotor
            )
        )
    }

    val esiLevel = remember(requiresLifeSaving, isHighRiskOrSeverePain, resourceCount, age, hr, rr, spo2) {
        TriageAssessmentEngine.calculateEsi(
            TriageAssessmentEngine.EsiInput(
                requiresImmediateLifeSaving = requiresLifeSaving,
                isHighRiskOrConfusedOrSeverePain = isHighRiskOrSeverePain,
                predictedResourceCount = resourceCount,
                ageYears = age,
                heartRateBpm = hr,
                respiratoryRateBpm = rr,
                spO2Percentage = spo2
            )
        )
    }

    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Emergency Triage Assessment",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Clinical Acuity Protocol - ESI v4 & NEWS2",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Patient Bar
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "$patientName - Age: $patientAge",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$hnNumber | Arrival: $arrivalMethod",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // Acuity Badge
                    val (badgeBg, badgeFg) = when (esiLevel) {
                        TriageAssessmentEngine.EsiLevel.LEVEL_1_RESUSCITATION -> Pair(Color(0xFFBA1A1A), Color.White)
                        TriageAssessmentEngine.EsiLevel.LEVEL_2_EMERGENT -> Pair(Color(0xFFE65100), Color.White)
                        TriageAssessmentEngine.EsiLevel.LEVEL_3_URGENT -> Pair(Color(0xFFF9A825), Color.Black)
                        TriageAssessmentEngine.EsiLevel.LEVEL_4_LESS_URGENT -> Pair(Color(0xFF2E7D32), Color.White)
                        TriageAssessmentEngine.EsiLevel.LEVEL_5_NON_URGENT -> Pair(Color(0xFF1565C0), Color.White)
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(badgeBg)
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "ESI ${esiLevel.code}",
                            color = badgeFg,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // NEWS2 Clinical Status Banner
            val news2Color = when (news2Result.clinicalRiskCategory) {
                TriageAssessmentEngine.News2Result.RiskCategory.HIGH -> Color(0xFFBA1A1A)
                TriageAssessmentEngine.News2Result.RiskCategory.MEDIUM -> Color(0xFFE65100)
                TriageAssessmentEngine.News2Result.RiskCategory.LOW_MEDIUM -> Color(0xFFF9A825)
                TriageAssessmentEngine.News2Result.RiskCategory.LOW -> Color(0xFF006A6A)
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = news2Color.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.border(1.dp, news2Color.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "NEWS2 Score: ${news2Result.totalScore}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = news2Color
                        )
                        Text(
                            text = "Risk: ${news2Result.clinicalRiskCategory.name}",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = news2Color
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = news2Result.responseRecommendation,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Hemodynamics Quick Bar: MAP & Shock Index
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Mean Arterial BP", style = MaterialTheme.typography.labelSmall)
                        Text(
                            text = String.format("%.1f mmHg", map),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = if (map < 65.0) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = if (map < 65.0) "Hypoperfusion Risk" else "Adequate Organ Perfusion",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (map < 65.0) Color(0xFFBA1A1A) else Color(0xFF2E7D32)
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Shock Index (HR/SBP)", style = MaterialTheme.typography.labelSmall)
                        Text(
                            text = String.format("%.2f", shockIndex),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = if (shockIndex >= 0.9) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = if (shockIndex >= 0.9) "Occult Shock / Bleed" else "Normal range: 0.5-0.7",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (shockIndex >= 0.9) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Vitals Input Grid
            Text(
                text = "Physiological Vitals",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = systolicBpText,
                    onValueChange = { systolicBpText = it },
                    label = { Text("Sys BP") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = diastolicBpText,
                    onValueChange = { diastolicBpText = it },
                    label = { Text("Dia BP") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = pulseRateText,
                    onValueChange = { pulseRateText = it },
                    label = { Text("Pulse bpm") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = respirationRateText,
                    onValueChange = { respirationRateText = it },
                    label = { Text("Resp Rate") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = spo2Text,
                    onValueChange = { spo2Text = it },
                    label = { Text("SpO2 %") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = temperatureText,
                    onValueChange = { temperatureText = it },
                    label = { Text("Temp C") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }

            // Oxygen & Respiratory Target Toggles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Supplemental O2 Support", style = MaterialTheme.typography.bodyMedium)
                Switch(checked = onSupplementalO2, onCheckedChange = { onSupplementalO2 = it })
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("COPD Scale 2 Target", style = MaterialTheme.typography.bodyMedium)
                    Text("Target 88-92% for hypercapnic risk", style = MaterialTheme.typography.bodySmall)
                }
                Switch(checked = isCopdTarget, onCheckedChange = { isCopdTarget = it })
            }

            // AVPU Consciousness Selector
            Text(
                text = "Consciousness Level (AVPU)",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TriageAssessmentEngine.ConsciousnessLevel.values().forEach { level ->
                    val isSelected = selectedAvpu == level
                    val label = when (level) {
                        TriageAssessmentEngine.ConsciousnessLevel.ALERT -> "Alert"
                        TriageAssessmentEngine.ConsciousnessLevel.CONFUSED_OR_NEW_VOICE -> "Voice"
                        TriageAssessmentEngine.ConsciousnessLevel.RESPONDS_TO_PAIN -> "Pain"
                        TriageAssessmentEngine.ConsciousnessLevel.UNRESPONSIVE -> "Unresp"
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .clickable { selectedAvpu = level }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // Glasgow Coma Scale (GCS) Card
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Glasgow Coma Scale: ${gcsResult.totalScore}/15",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = gcsResult.severityCategory.name.replace("_", " "),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    if (gcsResult.airwayProtectionIndicated) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFBA1A1A).copy(alpha = 0.15f))
                                .padding(8.dp)
                        ) {
                            Text(
                                text = "CRITICAL: GCS 8 or less. High risk of aspiration. Secure definitive airway immediately.",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFBA1A1A),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Eye Opening (1-4): $gcsEye", style = MaterialTheme.typography.bodySmall)
                    Slider(
                        value = gcsEye.toFloat(),
                        onValueChange = { gcsEye = it.toInt() },
                        valueRange = 1f..4f,
                        steps = 2
                    )

                    Text("Verbal Response (1-5): $gcsVerbal", style = MaterialTheme.typography.bodySmall)
                    Slider(
                        value = gcsVerbal.toFloat(),
                        onValueChange = { gcsVerbal = it.toInt() },
                        valueRange = 1f..5f,
                        steps = 3
                    )

                    Text("Motor Response (1-6): $gcsMotor", style = MaterialTheme.typography.bodySmall)
                    Slider(
                        value = gcsMotor.toFloat(),
                        onValueChange = { gcsMotor = it.toInt() },
                        valueRange = 1f..6f,
                        steps = 4
                    )
                }
            }

            // ESI Decision Wizard
            Text(
                text = "ESI Version 4 Decision Factors",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Requires immediate life saving intervention", style = MaterialTheme.typography.bodySmall)
                Switch(checked = requiresLifeSaving, onCheckedChange = { requiresLifeSaving = it })
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("High risk situation or acute lethargy or severe pain", style = MaterialTheme.typography.bodySmall)
                Switch(checked = isHighRiskOrSeverePain, onCheckedChange = { isHighRiskOrSeverePain = it })
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Predicted hospital resources needed", style = MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(0, 1, 2).forEach { count ->
                        val isSelected = resourceCount == count
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    if (isSelected) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.surfaceVariant
                                )
                                .clickable { resourceCount = count }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (count == 2) "2+" else count.toString(),
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                    }
                }
            }

            // Commit Triage Assessment Button
            Button(
                onClick = { /* Save triage record */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "Assign Triage Bed & Alert Clinical Team",
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
