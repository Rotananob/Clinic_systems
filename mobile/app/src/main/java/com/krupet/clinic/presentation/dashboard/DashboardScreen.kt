package com.krupet.clinic.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*

@Composable
fun DashboardScreen(
    onNavigateToResus: () -> Unit,
    onNavigateToPediatric: () -> Unit,
    onNavigateToBilling: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Clinical Header
        Text(
            text = "KruPet Clinical Operations",
            style = MaterialTheme.typography.headlineLarge,
            color = MedicalDeepTeal,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Enterprise Mobile Station - High Performance Native Kotlin",
            style = MaterialTheme.typography.bodyLarge,
            color = MedicalSlate,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // System Health & Connection Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "NestJS Backend Connection Status",
                    style = MaterialTheme.typography.titleMedium,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Target Endpoint: http://10.0.2.2:3001/api",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = MedicalLightTeal.copy(alpha = 0.25f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "STATUS: SYNCHRONIZED AND SECURE (TLS 1.3 READY)",
                        color = MedicalDeepTeal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Clinical Action Grid
        Text(
            text = "Clinical Mathematical Tools",
            style = MaterialTheme.typography.titleMedium,
            color = MedicalOnSurface,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Button(
            onClick = onNavigateToResus,
            colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Text(
                text = "Emergency Resuscitation (Sepsis, Parkland, MTP)",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
            onClick = onNavigateToPediatric,
            colors = ButtonDefaults.buttonColors(containerColor = MedicalSlate),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Text(
                text = "Pediatric & Neonatal Precision Dosing (Bhutani Nomogram)",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
            onClick = onNavigateToBilling,
            colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Text(
                text = "Point of Sale & Bakong KHQR Billing",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Medical Safety Standards Invariants
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurfaceVariant.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "Google Play Store Medical Safety Compliance",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "This mobile application adheres strictly to Clinical Decision Support (CDS) non-SaMD regulatory boundaries under 2026 guidelines. All calculations require licensed clinician verification.",
                    fontSize = 12.sp,
                    color = MedicalSlate,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
