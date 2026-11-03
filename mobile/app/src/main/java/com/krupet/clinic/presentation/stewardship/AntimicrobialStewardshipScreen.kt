package com.krupet.clinic.presentation.stewardship

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.krupet.clinic.core.math.PharmacokineticsEngine

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AntimicrobialStewardshipScreen(
    modifier: Modifier = Modifier
) {
    // Patient Renal & Biomarker Inputs
    var ageText by remember { mutableStateOf("54") }
    var weightText by remember { mutableStateOf("72") }
    var heightText by remember { mutableStateOf("170") }
    var scrText by remember { mutableStateOf("1.1") }
    var isMale by remember { mutableStateOf(true) }

    // Vancomycin Parameters
    var vancoDoseText by remember { mutableStateOf("2000") } // mg / day

    // PCT Parameters
    var baselinePctText by remember { mutableStateOf("3.8") }
    var currentPctText by remember { mutableStateOf("0.5") }
    var isAfebrile by remember { mutableStateOf(true) }
    var isStable by remember { mutableStateOf(true) }

    // IV-to-PO Parameters
    var ivHoursText by remember { mutableStateOf("56") }
    var isGiFunctional by remember { mutableStateOf(true) }
    var hasBioequivalent by remember { mutableStateOf(true) }

    val age = ageText.toIntOrNull() ?: 54
    val weight = weightText.toDoubleOrNull() ?: 72.0
    val height = heightText.toDoubleOrNull() ?: 170.0
    val scr = scrText.toDoubleOrNull() ?: 1.1
    val sex = if (isMale) PharmacokineticsEngine.BiologicalSex.MALE else PharmacokineticsEngine.BiologicalSex.FEMALE
    val vancoDose = vancoDoseText.toDoubleOrNull() ?: 2000.0
    val basePct = baselinePctText.toDoubleOrNull() ?: 3.8
    val curPct = currentPctText.toDoubleOrNull() ?: 0.5
    val ivHours = ivHoursText.toIntOrNull() ?: 56

    // Calculations
    val crCl = remember(age, weight, height, scr, sex) {
        PharmacokineticsEngine.calculateCockcroftGaultCrCl(age, weight, height, scr, sex)
    }

    val vancoResult = remember(vancoDose, crCl, weight) {
        PharmacokineticsEngine.estimateVancomycinAuc24(vancoDose, crCl, weight)
    }

    val pctResult = remember(basePct, curPct, isStable, isAfebrile) {
        PharmacokineticsEngine.evaluatePctKinetics(basePct, curPct, isStable, isAfebrile)
    }

    val ivToPoResult = remember(ivHours, isAfebrile, isStable, isGiFunctional, hasBioequivalent) {
        PharmacokineticsEngine.validateIvToPoSwitch(
            PharmacokineticsEngine.IvToPoCriteria(
                ivDurationHours = ivHours,
                isAfebrileOver24h = isAfebrile,
                isHemodynamicallyStable = isStable,
                isGastrointestinalTractFunctional = isGiFunctional,
                hasOralBioequivalent = hasBioequivalent
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Antimicrobial Stewardship & PK", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("CrCl Dosing, Vancomycin AUC24 & PCT De-escalation", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Renal Function Status Banner
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
                        Text("Creatinine Clearance (Cockcroft-Gault)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (crCl >= 60.0) Color(0xFF2E7D32).copy(alpha = 0.15f) else Color(0xFFBA1A1A).copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (crCl >= 60.0) "NORMAL RENAL" else "RENAL IMPAIRMENT",
                                color = if (crCl >= 60.0) Color(0xFF2E7D32) else Color(0xFFBA1A1A),
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = String.format("%.1f mL/min", crCl),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Calculated with Devine Ideal Body Weight adjustment for accurate pharmacokinetics.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Renal Parameters Inputs
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = ageText,
                    onValueChange = { ageText = it },
                    label = { Text("Age") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = weightText,
                    onValueChange = { weightText = it },
                    label = { Text("Weight kg") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = scrText,
                    onValueChange = { scrText = it },
                    label = { Text("SCr mg/dL") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }

            // Vancomycin AUC24 Target Card
            val vancoColor = when (vancoResult.category) {
                PharmacokineticsEngine.VancomycinAucResult.AucCategory.OPTIMAL -> Color(0xFF2E7D32)
                PharmacokineticsEngine.VancomycinAucResult.AucCategory.SUBTHERAPEUTIC -> Color(0xFF1565C0)
                PharmacokineticsEngine.VancomycinAucResult.AucCategory.SUPRATHERAPEUTIC -> Color(0xFFBA1A1A)
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = vancoColor.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.border(1.dp, vancoColor.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Vancomycin AUC24/MIC Target",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = vancoColor
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(vancoColor)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = vancoResult.category.name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = String.format("%.0f mg*h/L", vancoResult.estimatedAuc24),
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = vancoColor
                    )
                    Text(
                        text = "Therapeutic Target: 400 - 600 mg*h/L (IDSA/ASHP 2026 Consensus Guidelines)",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = vancoResult.recommendation,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Procalcitonin (PCT) Kinetics De-escalation Card
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Procalcitonin (PCT) Biomarker Kinetics", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = baselinePctText,
                            onValueChange = { baselinePctText = it },
                            label = { Text("Baseline PCT") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = currentPctText,
                            onValueChange = { currentPctText = it },
                            label = { Text("Current PCT") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Delta Reduction: ${String.format("%.1f%%", pctResult.deltaPercentage)}",
                            fontWeight = FontWeight.Bold,
                            color = if (pctResult.deltaPercentage >= 80.0) Color(0xFF2E7D32) else Color(0xFFE65100)
                        )
                        Text(
                            text = if (pctResult.cessationAdvised) "CESSATION ADVISED" else "CONTINUE REGIMEN",
                            fontWeight = FontWeight.Bold,
                            color = if (pctResult.cessationAdvised) Color(0xFF2E7D32) else Color(0xFF1565C0)
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = pctResult.recommendation, style = MaterialTheme.typography.bodySmall)
                }
            }

            // IV-to-Oral (PO) Step-down Suitability Card
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (ivToPoResult.isEligible) Color(0xFF2E7D32).copy(alpha = 0.08f) else MaterialTheme.colorScheme.surfaceVariant
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.border(
                    1.dp,
                    if (ivToPoResult.isEligible) Color(0xFF2E7D32).copy(alpha = 0.35f) else Color.Transparent,
                    RoundedCornerShape(12.dp)
                )
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("IV-to-Oral Step-Down Switch", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (ivToPoResult.isEligible) Color(0xFF2E7D32) else Color.Gray)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = if (ivToPoResult.isEligible) "QUALIFIED" else "IV CONTINUATION",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    if (ivToPoResult.isEligible) {
                        Text(
                            text = "Patient meets all 5 clinical criteria: IV >48h, afebrile 24h, stable vitals, functioning GI, oral agent available.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF2E7D32)
                        )
                    } else {
                        Text(
                            text = "Contraindication: ${ivToPoResult.contraindicationReason}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFBA1A1A)
                        )
                    }
                }
            }

            // Action Button
            Button(
                onClick = { /* Submit ASP Note */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Transmit ASP Recommendation to Prescriber", fontWeight = FontWeight.Bold)
            }
        }
    }
}
