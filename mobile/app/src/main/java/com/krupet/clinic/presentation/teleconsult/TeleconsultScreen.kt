package com.krupet.clinic.presentation.teleconsult

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeleconsultScreen(
    modifier: Modifier = Modifier
) {
    var isMicMuted by remember { mutableStateOf(false) }
    var isVideoDisabled by remember { mutableStateOf(false) }
    var isOtoscopeActive by remember { mutableStateOf(false) }
    var callDurationSeconds by remember { mutableIntStateOf(342) }
    var clinicalNotes by remember { mutableStateOf("Patient reports persistent productive cough for 4 days with low-grade fever. No dyspnea or hemoptysis.") }
    var rxPrescription by remember { mutableStateOf("Amoxicillin-Clavulanate 875/125 mg PO BID x 7 days\nParacetamol 500 mg PO Q6H PRN fever") }

    val formattedDuration = String.format("%02d:%02d", callDurationSeconds / 60, callDurationSeconds % 60)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Teleconsultation Session", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Encrypted WebRTC Telehealth - Room #TC-8821", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Patient Quick Bar with Live Telemetry
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Sokleang Kim (F, 32y) - HN-2026-0671", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text("Home Pulse Oximeter & BP Cuff Connected", style = MaterialTheme.typography.bodySmall, color = Color(0xFF006A6A))
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF2E7D32).copy(alpha = 0.15f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("LIVE $formattedDuration", color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            // Remote Video Frame & Doctor PIP
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFF1E293B))
                    .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
            ) {
                // Simulated Remote Patient Face / Video Canvas
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height

                    // Subtle background gradient grid
                    drawLine(Color(0xFF334155), Offset(0f, h * 0.5f), Offset(w, h * 0.5f), 1f)
                    drawLine(Color(0xFF334155), Offset(w * 0.5f, 0f), Offset(w * 0.5f, h), 1f)

                    // Patient silhouette representation
                    drawCircle(
                        color = Color(0xFF475569),
                        radius = 48f,
                        center = Offset(w * 0.5f, h * 0.42f)
                    )
                    drawArc(
                        color = Color(0xFF475569),
                        startAngle = 180f,
                        sweepAngle = 180f,
                        useCenter = true,
                        topLeft = Offset(w * 0.5f - 75f, h * 0.42f + 35f),
                        size = androidx.compose.ui.geometry.Size(150f, 90f)
                    )
                }

                // Overlay Call Quality Indicators
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color.Black.copy(alpha = 0.6f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("HD 1080p | 32 ms", color = Color.Green, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color.Black.copy(alpha = 0.6f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("AES-256 GCM", color = Color.White, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    }
                }

                // Doctor Picture-In-Picture (PIP) Thumbnail
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                        .width(90.dp)
                        .height(115.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF0F172A))
                        .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        drawCircle(
                            color = Color(0xFF006A6A),
                            radius = 18f,
                            center = Offset(size.width * 0.5f, size.height * 0.4f)
                        )
                    }
                    Text(
                        text = "Dr. Virak (You)",
                        color = Color.White,
                        fontSize = 9.sp,
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 4.dp)
                    )
                }

                // Remote Vitals Floating Strip
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color.Black.copy(alpha = 0.7f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("HR: 78 bpm", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color.Black.copy(alpha = 0.7f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("SpO2: 98%", color = Color(0xFF00E5FF), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color.Black.copy(alpha = 0.7f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("BP: 118/76", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Call Actions Control Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Mic Button
                IconButton(
                    onClick = { isMicMuted = !isMicMuted },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (isMicMuted) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Text(if (isMicMuted) "Unmute" else "Mute", style = MaterialTheme.typography.labelSmall, color = if (isMicMuted) Color.White else MaterialTheme.colorScheme.onSurface)
                }

                // Video Toggle Button
                IconButton(
                    onClick = { isVideoDisabled = !isVideoDisabled },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (isVideoDisabled) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Text(if (isVideoDisabled) "Start Cam" else "Cam Off", style = MaterialTheme.typography.labelSmall, color = if (isVideoDisabled) Color.White else MaterialTheme.colorScheme.onSurface)
                }

                // Otoscope / Dermatoscope Feed Switcher
                IconButton(
                    onClick = { isOtoscopeActive = !isOtoscopeActive },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (isOtoscopeActive) Color(0xFF006A6A) else MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Text("Scope", style = MaterialTheme.typography.labelSmall, color = if (isOtoscopeActive) Color.White else MaterialTheme.colorScheme.onSurface)
                }

                // End Call Button
                Button(
                    onClick = { /* End consultation */ },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFBA1A1A)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("End Call", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            // In-Call Doctor Clinical Notes
            Text("Consultation Clinical Notes", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            OutlinedTextField(
                value = clinicalNotes,
                onValueChange = { clinicalNotes = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false,
                maxLines = 3
            )

            // Live e-Prescription Pad
            Text("Digital e-Prescription (Direct Patient Dispatch)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            OutlinedTextField(
                value = rxPrescription,
                onValueChange = { rxPrescription = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false,
                maxLines = 4
            )

            Button(
                onClick = { /* Issue eRx with digital signature */ },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Sign & Dispatch e-Prescription to Patient Mobile", fontWeight = FontWeight.Bold)
            }
        }
    }
}
