package com.krupet.clinic.presentation.pediatric

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*
import com.krupet.clinic.core.math.ClinicalMathEngine

@Composable
fun PediatricScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Clark Rule", "Young Rule", "Bhutani Nomogram")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
    ) {
        Text(
            text = "Neonatal & Pediatric Pharmacotherapy",
            style = MaterialTheme.typography.titleLarge,
            color = MedicalDeepTeal,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Precision Dosing & Phototherapy Nomogram - 2026 Standards",
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
            0 -> ClarkSection()
            1 -> YoungSection()
            2 -> BhutaniSection()
        }
    }
}

@Composable
private fun ClarkSection() {
    var weightLbsInput by remember { mutableStateOf("30") }
    var adultDoseInput by remember { mutableStateOf("500") }

    val weightLbs = weightLbsInput.toDoubleOrNull() ?: 0.0
    val adultDose = adultDoseInput.toDoubleOrNull() ?: 0.0

    val calculatedDose = remember(weightLbs, adultDose) {
        if (weightLbs > 0 && adultDose > 0) {
            ClinicalMathEngine.PediatricNomogram.clarksRule(weightLbs, adultDose)
        } else null
    }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = weightLbsInput,
            onValueChange = { weightLbsInput = it },
            label = { Text("Child Weight in lbs") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = adultDoseInput,
            onValueChange = { adultDoseInput = it },
            label = { Text("Standard Adult Dose in mg") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        calculatedDose?.let {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Clark Rule: Weight (lbs) / 150 x Adult Dose",
                        style = MaterialTheme.typography.titleMedium,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Calculated Pediatric Dose: $it mg",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Weight equivalence: ${(weightLbs * 0.453592 * 10.0).toInt() / 10.0} kg",
                        fontSize = 12.sp,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun YoungSection() {
    var ageYearsInput by remember { mutableStateOf("6") }
    var adultDoseInput by remember { mutableStateOf("500") }

    val ageYears = ageYearsInput.toDoubleOrNull() ?: 0.0
    val adultDose = adultDoseInput.toDoubleOrNull() ?: 0.0

    val calculatedDose = remember(ageYears, adultDose) {
        if (ageYears > 0 && adultDose > 0) {
            ClinicalMathEngine.PediatricNomogram.youngsRule(ageYears, adultDose)
        } else null
    }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = ageYearsInput,
            onValueChange = { ageYearsInput = it },
            label = { Text("Child Age in years (1 to 12 years)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = adultDoseInput,
            onValueChange = { adultDoseInput = it },
            label = { Text("Standard Adult Dose in mg") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        calculatedDose?.let {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Young Rule: Age / (Age + 12) x Adult Dose",
                        style = MaterialTheme.typography.titleMedium,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Calculated Pediatric Dose: $it mg",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun BhutaniSection() {
    var postnatalHoursInput by remember { mutableStateOf("48") }
    var bilirubinInput by remember { mutableStateOf("13.5") }

    val hours = postnatalHoursInput.toIntOrNull() ?: 0
    val bilirubin = bilirubinInput.toDoubleOrNull() ?: 0.0

    val riskResult = remember(hours, bilirubin) {
        if (hours >= 12 && bilirubin > 0) {
            ClinicalMathEngine.PediatricNomogram.bhutaniRiskZone(hours, bilirubin)
        } else null
    }

    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(
            value = postnatalHoursInput,
            onValueChange = { postnatalHoursInput = it },
            label = { Text("Postnatal Age in hours (>= 12h)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = bilirubinInput,
            onValueChange = { bilirubinInput = it },
            label = { Text("Total Serum Bilirubin in mg/dL") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        riskResult?.let {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "AAP 2022 / Bhutani Phototherapy Stratification",
                        style = MaterialTheme.typography.titleMedium,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = it,
                        style = MaterialTheme.typography.headlineMedium,
                        color = if (it.contains("HIGH RISK")) AcuityEsi1Resus else MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
