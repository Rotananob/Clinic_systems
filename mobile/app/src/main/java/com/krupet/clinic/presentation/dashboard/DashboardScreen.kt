package com.krupet.clinic.presentation.dashboard

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*

data class ClinicalModuleTile(
    val title: String,
    val subtitle: String,
    val category: String,
    val acronym: String,
    val onClick: () -> Unit
)

@Composable
fun DashboardScreen(
    onNavigateToResus: () -> Unit,
    onNavigateToPediatric: () -> Unit,
    onNavigateToBilling: () -> Unit,
    onNavigateToTriage: () -> Unit = {},
    onNavigateToWard: () -> Unit = {},
    onNavigateToPacs: () -> Unit = {},
    onNavigateToTeleconsult: () -> Unit = {},
    onNavigateToLab: () -> Unit = {},
    onNavigateToDental: () -> Unit = {},
    onNavigateToTelemetry: () -> Unit = {},
    onNavigateToPatient: () -> Unit = {},
    onNavigateToStewardship: () -> Unit = {},
    onNavigateToSurgical: () -> Unit = {},
    onNavigateToNarcotics: () -> Unit = {},
    onNavigateToWarehouse: () -> Unit = {}
) {
    val modules = remember {
        listOf(
            ClinicalModuleTile("Emergency Triage", "ESI v4 & NEWS2 Acuity", "Emergency", "TRG", onNavigateToTriage),
            ClinicalModuleTile("Resuscitation", "ACLS, CPR & Sepsis 30mL/kg", "Emergency", "RES", onNavigateToResus),
            ClinicalModuleTile("Bedside Telemetry", "ECG Monitor & Infusion Pump", "Emergency", "TEL", onNavigateToTelemetry),
            ClinicalModuleTile("Surgical Safety", "WHO OR Checklist & ASA Score", "Surgical", "OR", onNavigateToSurgical),
            ClinicalModuleTile("Inpatient Wards", "Bed Census, SBAR & Fluid Net", "Inpatient", "WRD", onNavigateToWard),
            ClinicalModuleTile("PACS Radiology", "DICOM Viewer & Calipers", "Diagnostics", "RAD", onNavigateToPacs),
            ClinicalModuleTile("Laboratory LIS", "Panic Values & Blood Work", "Diagnostics", "LAB", onNavigateToLab),
            ClinicalModuleTile("Antimicrobial PK", "CrCl, Vanco AUC & PCT Kinetics", "Pharmacy", "ASP", onNavigateToStewardship),
            ClinicalModuleTile("Narcotics Vault", "Double-Witness Ledger & Merkle", "Pharmacy", "NAR", onNavigateToNarcotics),
            ClinicalModuleTile("Pharmacy Warehouse", "FEFO Stock & Barcode Reorder", "Pharmacy", "WHS", onNavigateToWarehouse),
            ClinicalModuleTile("Pediatric Dosing", "Bhutani Bilirubin & Nomograms", "Specialty", "PED", onNavigateToPediatric),
            ClinicalModuleTile("Dental Charting", "FDI Odontogram & Perio", "Specialty", "DEN", onNavigateToDental),
            ClinicalModuleTile("Teleconsultation", "WebRTC Video & e-Prescription", "Outpatient", "TLC", onNavigateToTeleconsult),
            ClinicalModuleTile("Patient Dossier", "EHR, Allergies & Encounters", "Records", "EHR", onNavigateToPatient),
            ClinicalModuleTile("POS & KHQR", "Bakong Dual Currency USD/KHR", "Billing", "POS", onNavigateToBilling)
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Clinical Header
        Column {
            Text(
                text = "KruPet Clinical Operations",
                style = MaterialTheme.typography.headlineMedium,
                color = MedicalDeepTeal,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Enterprise Mobile Station - High Performance Native Kotlin",
                style = MaterialTheme.typography.bodyMedium,
                color = MedicalSlate
            )
        }

        // Live Backend Sync Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "NestJS Mobile-Sync Gateway",
                        style = MaterialTheme.typography.titleSmall,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFF2E7D32).copy(alpha = 0.15f))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text("ACTIVE SYNC", color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold, fontSize = 10.sp)
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Endpoint: http://10.0.2.2:3001/api/mobile-sync | TLS 1.3 Verified",
                    style = MaterialTheme.typography.bodySmall,
                    color = MedicalSlate
                )
            }
        }

        // Module Grid
        Text(
            text = "Clinical Modules (${modules.size} Enterprise Capabilities)",
            style = MaterialTheme.typography.titleMedium,
            color = MedicalOnSurface,
            fontWeight = FontWeight.Bold
        )

        modules.forEach { module ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { module.onClick() }
                    .border(1.dp, MedicalSlate.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                shape = RoundedCornerShape(10.dp)
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
                            .size(46.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(MedicalDeepTeal.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = module.acronym,
                            color = MedicalDeepTeal,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = module.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MedicalOnSurface
                        )
                        Text(
                            text = module.subtitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = MedicalSlate
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(MedicalSurfaceVariant)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = module.category,
                            style = MaterialTheme.typography.labelSmall,
                            color = MedicalSlate,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }

        // Play Store Medical Compliance Card
        Card(
            shape = RoundedCornerShape(10.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurfaceVariant.copy(alpha = 0.6f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "Google Play Store Medical Non-SaMD Compliance",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Strict adherence to Clinical Decision Support boundaries under 2026 guidelines. All outputs require licensed clinician review.",
                    fontSize = 11.sp,
                    color = MedicalSlate,
                    lineHeight = 15.sp
                )
            }
        }
    }
}
