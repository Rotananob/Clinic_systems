package com.krupet.clinic.presentation.surgical

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

enum class WhoChecklistPhase(val label: String, val timing: String) {
    SIGN_IN("Sign In", "Before Induction of Anesthesia"),
    TIME_OUT("Time Out", "Before Skin Incision"),
    SIGN_OUT("Sign Out", "Before Patient Leaves OR")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurgicalChecklistScreen(
    modifier: Modifier = Modifier
) {
    var selectedPhase by remember { mutableStateOf(WhoChecklistPhase.SIGN_IN) }
    var selectedAsaClass by remember { mutableStateOf("ASA II") }
    var isEmergencySurgery by remember { mutableStateOf(false) }

    // Phase 1: Sign In state
    var signInIdConfirmed by remember { mutableStateOf(true) }
    var signInSiteMarked by remember { mutableStateOf(true) }
    var signInAnesthesiaCheck by remember { mutableStateOf(true) }
    var signInPulseOximeter by remember { mutableStateOf(true) }
    var signInAllergyChecked by remember { mutableStateOf(true) }
    var signInAirwayEvaluated by remember { mutableStateOf(false) }
    var signInBloodLossRisk by remember { mutableStateOf(false) }

    // Phase 2: Time Out state
    var timeOutTeamIntroduced by remember { mutableStateOf(true) }
    var timeOutProcedureConfirmed by remember { mutableStateOf(true) }
    var timeOutAntibioticGiven by remember { mutableStateOf(true) }
    var timeOutSurgeonReview by remember { mutableStateOf(true) }
    var timeOutAnesthesiaReview by remember { mutableStateOf(true) }
    var timeOutNursingSterility by remember { mutableStateOf(true) }
    var timeOutImagingDisplayed by remember { mutableStateOf(true) }

    // Phase 3: Sign Out state
    var signOutProcedureRecorded by remember { mutableStateOf(false) }
    var signOutCountsCorrect by remember { mutableStateOf(false) }
    var signOutSpecimenLabeled by remember { mutableStateOf(false) }
    var signOutEquipmentProblems by remember { mutableStateOf(false) }
    var signOutRecoveryConcerns by remember { mutableStateOf(false) }

    val asaClasses = listOf("ASA I", "ASA II", "ASA III", "ASA IV", "ASA V")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("WHO Surgical Safety Checklist", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Operating Theater #2 - Laparoscopic Cholecystectomy", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Patient & Surgical Team Card
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
                        Text("Sophea Nuon (F, 41y) - HN-2026-0914", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text("Surgeon: Dr. Virak | Anesthesiologist: Dr. Chan", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF006A6A))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (isEmergencySurgery) "$selectedAsaClass-E" else selectedAsaClass,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }

            // ASA Stratification & Emergency Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Emergency Surgery Case", style = MaterialTheme.typography.bodyMedium)
                Switch(checked = isEmergencySurgery, onCheckedChange = { isEmergencySurgery = it })
            }

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                asaClasses.forEach { asa ->
                    val isSelected = asa == selectedAsaClass
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedAsaClass = asa },
                        label = { Text(asa) }
                    )
                }
            }

            // Phase Navigation Selector
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                WhoChecklistPhase.values().forEach { phase ->
                    val isSelected = selectedPhase == phase
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .clickable { selectedPhase = phase }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = phase.label,
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = phase.timing.take(16),
                                fontSize = 9.sp,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f) else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Phase Content
            when (selectedPhase) {
                WhoChecklistPhase.SIGN_IN -> {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Phase 1: Sign In (Before Induction)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)

                            ChecklistRow("Patient identity, site, and procedure confirmed", signInIdConfirmed) { signInIdConfirmed = it }
                            ChecklistRow("Surgical site marked with indelible ink", signInSiteMarked) { signInSiteMarked = it }
                            ChecklistRow("Anesthesia machine and medication safety check complete", signInAnesthesiaCheck) { signInAnesthesiaCheck = it }
                            ChecklistRow("Pulse oximeter on patient and functioning properly", signInPulseOximeter) { signInPulseOximeter = it }
                            ChecklistRow("Known drug and latex allergies verified", signInAllergyChecked) { signInAllergyChecked = it }
                            ChecklistRow("Difficult airway and aspiration risk evaluated (Equipment ready)", signInAirwayEvaluated) { signInAirwayEvaluated = it }
                            ChecklistRow("Risk of >500 mL blood loss (>7 mL/kg in children) assessed", signInBloodLossRisk) { signInBloodLossRisk = it }
                        }
                    }
                }
                WhoChecklistPhase.TIME_OUT -> {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Phase 2: Time Out (Before Skin Incision)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)

                            ChecklistRow("Entire team introduced themselves by name and role", timeOutTeamIntroduced) { timeOutTeamIntroduced = it }
                            ChecklistRow("Surgeon, anesthesia, and nurse confirm patient and procedure verbally", timeOutProcedureConfirmed) { timeOutProcedureConfirmed = it }
                            ChecklistRow("Antibiotic prophylaxis administered within past 60 minutes", timeOutAntibioticGiven) { timeOutAntibioticGiven = it }
                            ChecklistRow("Surgeon reviews anticipated critical steps, operative duration and blood loss", timeOutSurgeonReview) { timeOutSurgeonReview = it }
                            ChecklistRow("Anesthesia team reviews patient-specific concerns", timeOutAnesthesiaReview) { timeOutAnesthesiaReview = it }
                            ChecklistRow("Nursing team reviews sterility confirmed with indicator results", timeOutNursingSterility) { timeOutNursingSterility = it }
                            ChecklistRow("Essential diagnostic imaging displayed on OR monitors", timeOutImagingDisplayed) { timeOutImagingDisplayed = it }
                        }
                    }
                }
                WhoChecklistPhase.SIGN_OUT -> {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Phase 3: Sign Out (Before Patient Leaves OR)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)

                            ChecklistRow("Nurse verbally confirms name of procedure recorded", signOutProcedureRecorded) { signOutProcedureRecorded = it }
                            ChecklistRow("Instrument, sponge, and needle counts are correct", signOutCountsCorrect) { signOutCountsCorrect = it }
                            ChecklistRow("Surgical specimen correctly labeled with patient name and source", signOutSpecimenLabeled) { signOutSpecimenLabeled = it }
                            ChecklistRow("Any equipment problems or malfunction addressed", signOutEquipmentProblems) { signOutEquipmentProblems = it }
                            ChecklistRow("Surgeon, anesthesia, and nurse review key concerns for PACU recovery", signOutRecoveryConcerns) { signOutRecoveryConcerns = it }
                        }
                    }
                }
            }

            // Sign Checklist Button
            Button(
                onClick = { /* Sign phase */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Verify & Digitally Sign ${selectedPhase.label} Phase", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ChecklistRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f)
        )
        Checkbox(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}
