package com.krupet.clinic.presentation.resuscitation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*
import com.krupet.clinic.core.math.ClinicalMathEngine

@Composable
fun ResuscitationScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Sepsis Hour-1", "Parkland Burn", "Shock Index", "TXA Window")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
    ) {
        Text(
            text = "Emergency Resuscitation Protocol Engine",
            style = MaterialTheme.typography.titleLarge,
            color = MedicalDeepTeal,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Evidence-Based Resuscitation Protocols - 2026 Standards",
            style = MaterialTheme.typography.bodyMedium,
            color = MedicalSlate,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = MedicalSurfaceVariant,
            contentColor = MedicalDeepTeal
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            text = title,
                            fontSize = 12.sp,
                            fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (selectedTab) {
            0 -> SepsisSection()
            1 -> ParklandSection()
            2 -> ShockIndexSection()
            3 -> TxaSection()
        }
    }
}

@Composable
private fun SepsisSection() {
    var weightInput by remember { mutableStateOf("70") }
    var lactateInput by remember { mutableStateOf("2.5") }

    val weight = weightInput.toDoubleOrNull() ?: 0.0
    val lactate = lactateInput.toDoubleOrNull() ?: 0.0

    val result = remember(weight, lactate) {
        if (weight > 0) ClinicalMathEngine.calculateSepsisFluid(weight, lactate) else null
    }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = weightInput,
            onValueChange = { weightInput = it },
            label = { Text("Patient Weight in kg") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = lactateInput,
            onValueChange = { lactateInput = it },
            label = { Text("Initial Serum Lactate in mmol/L") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        result?.let {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "30 mL/kg Crystalloid Bolus Target",
                        style = MaterialTheme.typography.titleMedium,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Total Fluid Required: ${it.totalFluidMl.toInt()} mL",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MedicalOnSurface,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Target 3h Infusion Rate: ${it.infusionRateMlPerHour.toInt()} mL/h",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MedicalSlate
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        color = if (it.isLactateElevated) AcuityEsi1Resus.copy(alpha = 0.12f) else MedicalLightTeal.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = if (it.isLactateElevated) "ELEVATED LACTATE > 2.0 mmol/L: Repeat measurement within 2-4 hours to verify clearance >= 20%." else "Initial lactate within normal limits.",
                            color = if (it.isLactateElevated) AcuityEsi1Resus else MedicalDeepTeal,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(8.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = it.clinicalRationale,
                        fontSize = 11.sp,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun ParklandSection() {
    var weightInput by remember { mutableStateOf("70") }
    var tbsaInput by remember { mutableStateOf("30") }

    val weight = weightInput.toDoubleOrNull() ?: 0.0
    val tbsa = tbsaInput.toDoubleOrNull() ?: 0.0

    val result = remember(weight, tbsa) {
        if (weight > 0 && tbsa in 1.0..100.0) ClinicalMathEngine.calculateParkland(weight, tbsa) else null
    }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = weightInput,
            onValueChange = { weightInput = it },
            label = { Text("Weight in kg") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = tbsaInput,
            onValueChange = { tbsaInput = it },
            label = { Text("Total Body Surface Area % TBSA") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        result?.let {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Baxter Parkland 24h Schedule",
                        style = MaterialTheme.typography.titleMedium,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Total 24h Fluid: ${it.totalFluid24hMl.toInt()} mL",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "First 8 Hours: ${it.first8HoursFluidMl.toInt()} mL at ${it.first8HoursRateMlPerHour.toInt()} mL/h",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "Next 16 Hours: ${it.remaining16HoursFluidMl.toInt()} mL at ${it.remaining16HoursRateMlPerHour.toInt()} mL/h",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MedicalSlate
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Target Urine Output: ${it.targetUrineOutputMlPerHourMin}-${it.targetUrineOutputMlPerHourMax} mL/h",
                        fontSize = 12.sp,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun ShockIndexSection() {
    var hrInput by remember { mutableStateOf("115") }
    var sbpInput by remember { mutableStateOf("90") }

    val hr = hrInput.toIntOrNull() ?: 0
    val sbp = sbpInput.toIntOrNull() ?: 0

    val result = remember(hr, sbp) {
        if (hr > 0 && sbp > 0) ClinicalMathEngine.calculateShockIndex(hr, sbp) else null
    }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = hrInput,
            onValueChange = { hrInput = it },
            label = { Text("Heart Rate in bpm") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = sbpInput,
            onValueChange = { sbpInput = it },
            label = { Text("Systolic Blood Pressure in mmHg") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        result?.let {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Shock Index Evaluation: ${it.shockIndex}",
                        style = MaterialTheme.typography.headlineMedium,
                        color = if (it.isSevereShock) AcuityEsi1Resus else MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = it.clinicalInterpretation,
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (it.isSevereShock) AcuityEsi1Resus else MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun TxaSection() {
    var minutesInput by remember { mutableStateOf("90") }
    val minutes = minutesInput.toIntOrNull() ?: 0
    val result = remember(minutes) { ClinicalMathEngine.evaluateTxaWindow(minutes) }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = minutesInput,
            onValueChange = { minutesInput = it },
            label = { Text("Minutes Since Traumatic Injury") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = if (result.isEligible) "CRASH-2 TXA INDICATION: ELIGIBLE" else "CRASH-2 CONTRAINDICATION: WINDOW EXCEEDED",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (result.isEligible) MedicalDeepTeal else AcuityEsi1Resus,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = result.reason,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )
                if (result.isEligible) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Loading Dose: 1 g IV over 10 minutes",
                        fontWeight = FontWeight.SemiBold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "Maintenance Infusion: 1 g IV over 8 hours",
                        fontWeight = FontWeight.SemiBold,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}
