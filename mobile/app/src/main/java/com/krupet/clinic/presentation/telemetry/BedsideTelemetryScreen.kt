package com.krupet.clinic.presentation.telemetry

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BedsideTelemetryScreen(
    modifier: Modifier = Modifier
) {
    // Patient weight & infusion parameters
    var patientWeightKgText by remember { mutableStateOf("70") }
    var selectedDrug by remember { mutableStateOf("Norepinephrine") }
    var drugMassMgText by remember { mutableStateOf("4") }
    var bagVolumeMlText by remember { mutableStateOf("250") }
    var targetDoseMcgKgMinText by remember { mutableStateOf("0.10") }
    var dropFactorGttPerMl by remember { mutableIntStateOf(60) } // Microdrip

    val weightKg = patientWeightKgText.toDoubleOrNull() ?: 70.0
    val drugMg = drugMassMgText.toDoubleOrNull() ?: 4.0
    val bagMl = bagVolumeMlText.toDoubleOrNull() ?: 250.0
    val targetDose = targetDoseMcgKgMinText.toDoubleOrNull() ?: 0.10

    // Concentration: mcg / mL
    val concentrationMcgPerMl = if (bagMl > 0) (drugMg * 1000.0) / bagMl else 16.0
    // Desired dose rate: mcg / min = dose * weight
    val dosePerMinMcg = targetDose * weightKg
    // Rate in mL/hr = (dosePerMin * 60) / concentration
    val infusionRateMlHr = if (concentrationMcgPerMl > 0) (dosePerMinMcg * 60.0) / concentrationMcgPerMl else 0.0
    // Drop rate gtt / min = (infusionRateMlHr * dropFactor) / 60
    val dropRateGttMin = (infusionRateMlHr * dropFactorGttPerMl) / 60.0

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Bedside Telemetry & Infusion Pump", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Live Physiological Waveforms & Vasoactive Guardrails", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Live Telemetry Waveform Monitor Canvas (Pure Black Background)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    // Header Bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("BED 01: SOKHA MEAS (M, 45y)", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF2E7D32))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("TELEMETRY SYNC OK", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Waveform Canvas (ECG + Plethysmograph)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .background(Color.Black)
                            .border(1.dp, Color.DarkGray, RoundedCornerShape(6.dp))
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val w = size.width
                            val h = size.height

                            // Draw subtle grid
                            val gridStep = 20f
                            var gx = 0f
                            while (gx < w) {
                                drawLine(Color(0xFF1E293B), Offset(gx, 0f), Offset(gx, h), 0.5f)
                                gx += gridStep
                            }
                            var gy = 0f
                            while (gy < h) {
                                drawLine(Color(0xFF1E293B), Offset(0f, gy), Offset(w, gy), 0.5f)
                                gy += gridStep
                            }

                            // ECG Lead II trace (Green)
                            val ecgPath = Path()
                            val ecgMidY = h * 0.35f
                            ecgPath.moveTo(0f, ecgMidY)

                            val period = 120f
                            var x = 0f
                            while (x < w) {
                                val relX = x % period
                                val y = when {
                                    relX in 15f..25f -> ecgMidY - 8f // P wave
                                    relX in 38f..42f -> ecgMidY + 12f // Q dip
                                    relX in 43f..47f -> ecgMidY - 38f // R peak
                                    relX in 48f..52f -> ecgMidY + 18f // S dip
                                    relX in 70f..85f -> ecgMidY - 14f // T wave
                                    else -> ecgMidY
                                }
                                ecgPath.lineTo(x, y)
                                x += 2f
                            }
                            drawPath(ecgPath, Color(0xFF00E676), style = Stroke(width = 2.5f))

                            // SpO2 Plethysmograph (Cyan)
                            val plethPath = Path()
                            val plethMidY = h * 0.78f
                            plethPath.moveTo(0f, plethMidY)
                            x = 0f
                            while (x < w) {
                                val relX = x % 90f
                                val y = plethMidY - (sin(relX / 90f * Math.PI) * 22f).toFloat()
                                plethPath.lineTo(x, y)
                                x += 2f
                            }
                            drawPath(plethPath, Color(0xFF00E5FF), style = Stroke(width = 2.0f))
                        }

                        Text("ECG II", color = Color(0xFF00E676), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(4.dp))
                        Text("PLETH", color = Color(0xFF00E5FF), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 4.dp, top = 70.dp))
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Numerical Telemetry Digits Bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("HR bpm", color = Color.Gray, fontSize = 10.sp)
                            Text("75", color = Color(0xFF00E676), fontSize = 28.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                        Column {
                            Text("SpO2 %", color = Color.Gray, fontSize = 10.sp)
                            Text("98", color = Color(0xFF00E5FF), fontSize = 28.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                        Column {
                            Text("NIBP mmHg", color = Color.Gray, fontSize = 10.sp)
                            Text("118/76", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                        Column {
                            Text("RR /min", color = Color.Gray, fontSize = 10.sp)
                            Text("16", color = Color(0xFFFFD600), fontSize = 28.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }

            // Smart Bedside Infusion Pump Section
            Text("Smart Infusion Pump & Vasoactive Titration", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)

            // Drug Selector Chips
            val drugs = listOf("Norepinephrine", "Dopamine", "Dobutamine", "Propofol")
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                drugs.forEach { drug ->
                    val isSelected = drug == selectedDrug
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedDrug = drug
                            when (drug) {
                                "Norepinephrine" -> {
                                    drugMassMgText = "4"
                                    bagVolumeMlText = "250"
                                    targetDoseMcgKgMinText = "0.10"
                                }
                                "Dopamine" -> {
                                    drugMassMgText = "200"
                                    bagVolumeMlText = "250"
                                    targetDoseMcgKgMinText = "5.0"
                                }
                                "Dobutamine" -> {
                                    drugMassMgText = "250"
                                    bagVolumeMlText = "250"
                                    targetDoseMcgKgMinText = "5.0"
                                }
                                "Propofol" -> {
                                    drugMassMgText = "1000"
                                    bagVolumeMlText = "100"
                                    targetDoseMcgKgMinText = "25.0"
                                }
                            }
                        },
                        label = { Text(drug) }
                    )
                }
            }

            // Infusion Input Grid
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = patientWeightKgText,
                    onValueChange = { patientWeightKgText = it },
                    label = { Text("Weight kg") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = drugMassMgText,
                    onValueChange = { drugMassMgText = it },
                    label = { Text("Mass mg") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = bagVolumeMlText,
                    onValueChange = { bagVolumeMlText = it },
                    label = { Text("Bag mL") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }

            OutlinedTextField(
                value = targetDoseMcgKgMinText,
                onValueChange = { targetDoseMcgKgMinText = it },
                label = { Text("Target Dose (mcg/kg/min)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            // Calculated Infusion Pump Results Card
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Calculated IV Pump Delivery Rate", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Volumetric Pump Rate", style = MaterialTheme.typography.labelSmall)
                            Text(
                                text = String.format("%.1f mL/hr", infusionRateMlHr),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Gravity Drip Rate (60 gtt)", style = MaterialTheme.typography.labelSmall)
                            Text(
                                text = String.format("%.0f gtt/min", dropRateGttMin),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Concentration: ${String.format("%.1f", concentrationMcgPerMl)} mcg/mL | Total Delivery: ${String.format("%.1f", dosePerMinMcg)} mcg/min",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            // Transmit Rate to Smart Infusion Pump Button
            Button(
                onClick = { /* Send BLE/NFC protocol to IV pump */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Transmit Rate to Alaris/Baxter Infusion Pump", fontWeight = FontWeight.Bold)
            }
        }
    }
}
