package com.krupet.clinic.presentation.ward

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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

data class InpatientBed(
    val id: String,
    val bedNumber: String,
    val wardName: String,
    val status: BedStatus,
    val patientName: String? = null,
    val hn: String? = null,
    val diagnosis: String? = null,
    val attendingDoctor: String? = null,
    val admissionDays: Int = 0,
    val fluidIntakeMl: Int = 0,
    val fluidOutputMl: Int = 0,
    val acuityLevel: BedAcuity = BedAcuity.STABLE
) {
    enum class BedStatus {
        OCCUPIED,
        AVAILABLE,
        CLEANING,
        MAINTENANCE
    }

    enum class BedAcuity {
        STABLE,
        OBSERVATION,
        CRITICAL
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WardBedScreen(
    modifier: Modifier = Modifier
) {
    var selectedWard by remember { mutableStateOf("ICU") }
    var selectedBed by remember { mutableStateOf<InpatientBed?>(null) }
    var sbarSituation by remember { mutableStateOf("Post-op laparotomy day 1, febrile spike 38.6 C") }
    var sbarBackground by remember { mutableStateOf("Known hypertension, penicillin allergy") }
    var sbarAssessment by remember { mutableStateOf("Tachycardia 112 bpm, soft abdomen, dressing clean") }
    var sbarRecommendation by remember { mutableStateOf("Blood cultures drawn, start IV Piperacillin-Tazobactam") }

    val sampleBeds = remember {
        listOf(
            InpatientBed("b1", "ICU-01", "ICU", InpatientBed.BedStatus.OCCUPIED, "Channa Keo", "HN-2026-0042", "Septic Shock, Pneumonia", "Dr. Virak", 3, 2450, 1800, InpatientBed.BedAcuity.CRITICAL),
            InpatientBed("b2", "ICU-02", "ICU", InpatientBed.BedStatus.OCCUPIED, "Sopheap Ly", "HN-2026-0118", "Acute STEMI, Post-PCI", "Dr. Serey", 1, 1600, 1450, InpatientBed.BedAcuity.OBSERVATION),
            InpatientBed("b3", "ICU-03", "ICU", InpatientBed.BedStatus.AVAILABLE),
            InpatientBed("b4", "ICU-04", "ICU", InpatientBed.BedStatus.CLEANING),
            InpatientBed("b5", "ICU-05", "ICU", InpatientBed.BedStatus.OCCUPIED, "Vannak Nguon", "HN-2026-0205", "DKA Resolution", "Dr. Bunthoeun", 2, 3200, 2900, InpatientBed.BedAcuity.STABLE),
            InpatientBed("b6", "ICU-06", "ICU", InpatientBed.BedStatus.AVAILABLE),
            InpatientBed("b7", "MED-01", "Medical Ward", InpatientBed.BedStatus.OCCUPIED, "Dara Seng", "HN-2026-0312", "Dengue Fever with Warning Signs", "Dr. Pich", 4, 2100, 1950, InpatientBed.BedAcuity.OBSERVATION),
            InpatientBed("b8", "MED-02", "Medical Ward", InpatientBed.BedStatus.AVAILABLE),
            InpatientBed("b9", "SURG-01", "Surgical Ward", InpatientBed.BedStatus.OCCUPIED, "Kanha Roeun", "HN-2026-0419", "Acute Appendicitis, Post-Op", "Dr. Chantrea", 2, 1850, 1600, InpatientBed.BedAcuity.STABLE),
            InpatientBed("b10", "SURG-02", "Surgical Ward", InpatientBed.BedStatus.OCCUPIED, "Borey Chea", "HN-2026-0520", "Femur Fracture Open Reduction", "Dr. Sopheak", 1, 2000, 1750, InpatientBed.BedAcuity.OBSERVATION)
        )
    }

    val wards = listOf("ICU", "Medical Ward", "Surgical Ward")
    val filteredBeds = sampleBeds.filter { it.wardName == selectedWard }

    val occupiedCount = filteredBeds.count { it.status == InpatientBed.BedStatus.OCCUPIED }
    val availableCount = filteredBeds.count { it.status == InpatientBed.BedStatus.AVAILABLE }
    val cleaningCount = filteredBeds.count { it.status == InpatientBed.BedStatus.CLEANING }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Inpatient Ward Management", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Bed Allocation, Fluid Balance & SBAR Handoff", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Ward Selector Chips
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                wards.forEach { ward ->
                    val isSelected = ward == selectedWard
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedWard = ward
                            selectedBed = null
                        },
                        label = { Text(ward) }
                    )
                }
            }

            // Ward Census Statistics Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Occupied", style = MaterialTheme.typography.labelSmall)
                        Text("$occupiedCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFFBA1A1A))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Available", style = MaterialTheme.typography.labelSmall)
                        Text("$availableCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFF006A6A))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Turnaround", style = MaterialTheme.typography.labelSmall)
                        Text("$cleaningCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFFE65100))
                    }
                }
            }

            // Beds Grid (upper half)
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredBeds) { bed ->
                    val isSelected = selectedBed?.id == bed.id
                    val statusColor = when (bed.status) {
                        InpatientBed.BedStatus.OCCUPIED -> if (bed.acuityLevel == InpatientBed.BedAcuity.CRITICAL) Color(0xFFBA1A1A) else Color(0xFF006A6A)
                        InpatientBed.BedStatus.AVAILABLE -> Color(0xFF2E7D32)
                        InpatientBed.BedStatus.CLEANING -> Color(0xFFE65100)
                        InpatientBed.BedStatus.MAINTENANCE -> Color.Gray
                    }

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedBed = bed }
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.LightGray.copy(alpha = 0.5f),
                                shape = RoundedCornerShape(8.dp)
                            ),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(bed.bedNumber, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(statusColor.copy(alpha = 0.15f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = bed.status.name,
                                        color = statusColor,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            if (bed.patientName != null) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(bed.patientName, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall)
                                Text(bed.hn ?: "", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(bed.diagnosis ?: "", style = MaterialTheme.typography.labelSmall, maxLines = 1)
                            } else {
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("Ready for Admission", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            }
                        }
                    }
                }
            }

            // Bed Detail / SBAR / Fluid Balance Section (lower half, scrollable)
            val currentBed = selectedBed ?: filteredBeds.firstOrNull { it.status == InpatientBed.BedStatus.OCCUPIED }
            if (currentBed != null && currentBed.patientName != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Divider()

                    // Patient Quick Card
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "${currentBed.bedNumber}: ${currentBed.patientName}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Attending: ${currentBed.attendingDoctor} - Day ${currentBed.admissionDays} in Ward",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF006A6A).copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = currentBed.acuityLevel.name,
                                color = Color(0xFF006A6A),
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }

                    // 24H Fluid Balance Calculator Card
                    val netBalance = currentBed.fluidIntakeMl - currentBed.fluidOutputMl
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("24h Fluid Balance Surveillance", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Total Intake", style = MaterialTheme.typography.labelSmall)
                                    Text("${currentBed.fluidIntakeMl} mL", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                                Column {
                                    Text("Total Output", style = MaterialTheme.typography.labelSmall)
                                    Text("${currentBed.fluidOutputMl} mL", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                }
                                Column {
                                    Text("Net Balance", style = MaterialTheme.typography.labelSmall)
                                    Text(
                                        text = "${if (netBalance >= 0) "+" else ""}$netBalance mL",
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (netBalance > 1000) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }

                    // SBAR Shift Handover Note Editor
                    Text("SBAR Shift Handover Handoff", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)

                    OutlinedTextField(
                        value = sbarSituation,
                        onValueChange = { sbarSituation = it },
                        label = { Text("S - Situation") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false,
                        maxLines = 2
                    )

                    OutlinedTextField(
                        value = sbarBackground,
                        onValueChange = { sbarBackground = it },
                        label = { Text("B - Background") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false,
                        maxLines = 2
                    )

                    OutlinedTextField(
                        value = sbarAssessment,
                        onValueChange = { sbarAssessment = it },
                        label = { Text("A - Assessment") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false,
                        maxLines = 2
                    )

                    OutlinedTextField(
                        value = sbarRecommendation,
                        onValueChange = { sbarRecommendation = it },
                        label = { Text("R - Recommendation") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false,
                        maxLines = 2
                    )

                    Button(
                        onClick = { /* Sign and transfer shift note */ },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Sign & Transmit SBAR Nursing Handover", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
