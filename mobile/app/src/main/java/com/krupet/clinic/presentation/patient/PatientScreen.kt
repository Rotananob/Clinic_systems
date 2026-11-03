package com.krupet.clinic.presentation.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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

data class PatientRecord(
    val id: String,
    val hn: String,
    val nameEn: String,
    val nameKm: String,
    val gender: String,
    val age: Int,
    val bloodType: String,
    val phone: String,
    val allergies: List<String>,
    val chronicConditions: List<String>,
    val activeMedications: List<String>,
    val lastVisitDate: String,
    val status: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientScreen(
    modifier: Modifier = Modifier,
    onNavigateToTriage: (() -> Unit)? = null,
    onNavigateToBilling: (() -> Unit)? = null
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedPatientId by remember { mutableStateOf<String?>("p1") }

    val patients = remember {
        listOf(
            PatientRecord(
                id = "p1",
                hn = "HN-2026-0042",
                nameEn = "Channa Keo",
                nameKm = "កែវ ចាន់ណា",
                gender = "Female",
                age = 45,
                bloodType = "O Rh+",
                phone = "012 889 912",
                allergies = listOf("Penicillin (Anaphylaxis)", "NSAIDs (Urticaria)"),
                chronicConditions = listOf("Essential Hypertension", "Type 2 Diabetes Mellitus"),
                activeMedications = listOf("Amlodipine 5mg PO OD", "Metformin 500mg PO BID"),
                lastVisitDate = "2026-11-02",
                status = "Inpatient - Bed ICU-01"
            ),
            PatientRecord(
                id = "p2",
                hn = "HN-2026-0118",
                nameEn = "Sopheap Ly",
                nameKm = "លី សុភាព",
                gender = "Male",
                age = 62,
                bloodType = "A Rh+",
                phone = "098 776 543",
                allergies = listOf("Sulfa Drugs"),
                chronicConditions = listOf("Coronary Artery Disease", "Hyperlipidemia"),
                activeMedications = listOf("Aspirin 81mg PO OD", "Atorvastatin 40mg PO QPM"),
                lastVisitDate = "2026-11-01",
                status = "Inpatient - Bed ICU-02"
            ),
            PatientRecord(
                id = "p3",
                hn = "HN-2026-0205",
                nameEn = "Vannak Nguon",
                nameKm = "ងួន វណ្ណៈ",
                gender = "Male",
                age = 58,
                bloodType = "B Rh+",
                phone = "077 123 456",
                allergies = emptyList(),
                chronicConditions = listOf("Chronic Kidney Disease Stage 3a"),
                activeMedications = listOf("Losartan 50mg PO OD"),
                lastVisitDate = "2026-10-28",
                status = "Outpatient"
            ),
            PatientRecord(
                id = "p4",
                hn = "HN-2026-0312",
                nameEn = "Dara Seng",
                nameKm = "សេង ដារ៉ា",
                gender = "Male",
                age = 22,
                bloodType = "AB Rh+",
                phone = "010 334 556",
                allergies = emptyList(),
                chronicConditions = emptyList(),
                activeMedications = emptyList(),
                lastVisitDate = "2026-11-03",
                status = "Emergency Observation"
            )
        )
    }

    val filteredPatients = patients.filter {
        it.nameEn.contains(searchQuery, ignoreCase = true) ||
                it.hn.contains(searchQuery, ignoreCase = true) ||
                it.phone.contains(searchQuery)
    }

    val selectedPatient = patients.find { it.id == selectedPatientId } ?: patients.first()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Patient Electronic Health Records", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Clinical Registry, Allergies & Longitudinal Dossier", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search Patient by Name, HN or Phone") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            // Patient Selector Chips / Mini-List
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                filteredPatients.forEach { patient ->
                    val isSelected = patient.id == selectedPatientId
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedPatientId = patient.id },
                        label = { Text(patient.nameEn) }
                    )
                }
            }

            // Detailed Patient Dossier View (Scrollable)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Identity Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = selectedPatient.nameEn.take(2).uppercase(),
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${selectedPatient.nameEn} (${selectedPatient.nameKm})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${selectedPatient.hn} | ${selectedPatient.gender}, ${selectedPatient.age}y | Blood: ${selectedPatient.bloodType}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Color(0xFF006A6A).copy(alpha = 0.12f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = selectedPatient.status,
                                    color = Color(0xFF006A6A),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                // Critical Allergies Banner
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFBA1A1A).copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.border(1.dp, Color(0xFFBA1A1A).copy(alpha = 0.35f), RoundedCornerShape(10.dp))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "CRITICAL DRUG ALLERGIES & ADVERSE REACTIONS",
                            color = Color(0xFFBA1A1A),
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        if (selectedPatient.allergies.isNotEmpty()) {
                            selectedPatient.allergies.forEach { allergy ->
                                Text(
                                    text = "- $allergy",
                                    color = Color(0xFFBA1A1A),
                                    fontWeight = FontWeight.SemiBold,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        } else {
                            Text("No Known Drug Allergies (NKDA)", color = Color(0xFF2E7D32), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                // Chronic Medical Conditions
                Text("Chronic Medical Problem List", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(8.dp))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (selectedPatient.chronicConditions.isNotEmpty()) {
                            selectedPatient.chronicConditions.forEach { condition ->
                                Text("• $condition", style = MaterialTheme.typography.bodyMedium)
                            }
                        } else {
                            Text("No active chronic conditions recorded.", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                    }
                }

                // Current Active Prescriptions
                Text("Active Outpatient & Inpatient Pharmacotherapy", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(8.dp))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (selectedPatient.activeMedications.isNotEmpty()) {
                            selectedPatient.activeMedications.forEach { med ->
                                Text("Rx: $med", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall)
                            }
                        } else {
                            Text("No active medications prescribed.", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                    }
                }

                // Longitudinal Visit Timeline
                Text("Encounter History", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Encounter on ${selectedPatient.lastVisitDate}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                        Text("Attending Physician: Dr. Virak - Chief Complaint: Severe Acute Infection", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // Quick Navigation Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { onNavigateToTriage?.invoke() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Open Triage")
                    }
                    Button(
                        onClick = { onNavigateToBilling?.invoke() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Open POS")
                    }
                }
            }
        }
    }
}
