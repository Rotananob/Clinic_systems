package com.krupet.clinic.presentation.pacs

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class PacsWindowPreset(val label: String, val windowWidth: Int, val windowLevel: Int) {
    BONE("Bone", 2000, 300),
    SOFT_TISSUE("Soft Tissue", 400, 50),
    LUNG("Lung", 1500, -600),
    BRAIN("Brain", 80, 40)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PacsViewerScreen(
    modifier: Modifier = Modifier
) {
    var selectedPreset by remember { mutableStateOf(PacsWindowPreset.BONE) }
    var currentWindowWidth by remember { mutableFloatStateOf(2000f) }
    var currentWindowLevel by remember { mutableFloatStateOf(300f) }
    var zoomScale by remember { mutableFloatStateOf(1.0f) }
    var showMeasurementGrid by remember { mutableStateOf(true) }
    var selectedSeriesIndex by remember { mutableIntStateOf(0) }

    val seriesList = listOf("PA Chest", "Lateral Chest", "Apical Lordotic")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("PACS Diagnostic Imaging Viewer", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("DICOM Modality Worklist & Caliper Analysis", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Patient & Study Info Banner
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
                        Text("Channa Keo (F, 45y) - HN-2026-0042", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text("Study: DX Chest 2 Views | ACC# 2026-DX-9812", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF006A6A))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("CR/DX", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            // Window Presets Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                PacsWindowPreset.values().forEach { preset ->
                    val isSelected = selectedPreset == preset
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedPreset = preset
                            currentWindowWidth = preset.windowWidth.toFloat()
                            currentWindowLevel = preset.windowLevel.toFloat()
                        },
                        label = { Text(preset.label) }
                    )
                }
            }

            // Simulated High-Contrast Medical Canvas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black)
                    .border(1.dp, Color.DarkGray, RoundedCornerShape(12.dp))
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val canvasWidth = size.width
                    val canvasHeight = size.height

                    // Simulated anatomical thoracic cage outline
                    val centerX = canvasWidth / 2
                    val centerY = canvasHeight / 2

                    // Anatomical Spine Column
                    drawLine(
                        color = Color.LightGray.copy(alpha = 0.6f),
                        start = Offset(centerX, centerY - 100),
                        end = Offset(centerX, centerY + 110),
                        strokeWidth = 14f * zoomScale
                    )

                    // Left & Right Rib Contours
                    for (i in -3..3) {
                        val yOffset = centerY + (i * 24f * zoomScale)
                        val ribWidth = 90f * zoomScale
                        // Right hemithorax
                        drawArc(
                            color = Color.White.copy(alpha = 0.5f),
                            startAngle = 180f,
                            sweepAngle = 120f,
                            useCenter = false,
                            topLeft = Offset(centerX - ribWidth - 20, yOffset - 20),
                            size = androidx.compose.ui.geometry.Size(ribWidth, 40f * zoomScale),
                            style = Stroke(width = 4f)
                        )
                        // Left hemithorax
                        drawArc(
                            color = Color.White.copy(alpha = 0.5f),
                            startAngle = 240f,
                            sweepAngle = 120f,
                            useCenter = false,
                            topLeft = Offset(centerX + 20, yOffset - 20),
                            size = androidx.compose.ui.geometry.Size(ribWidth, 40f * zoomScale),
                            style = Stroke(width = 4f)
                        )
                    }

                    // Cardiac Silhouette
                    drawCircle(
                        color = Color.LightGray.copy(alpha = 0.35f),
                        radius = 45f * zoomScale,
                        center = Offset(centerX + 25, centerY + 25)
                    )

                    // Caliper Measurement Grid
                    if (showMeasurementGrid) {
                        drawLine(
                            color = Color.Yellow.copy(alpha = 0.8f),
                            start = Offset(centerX - 60, centerY + 80),
                            end = Offset(centerX + 80, centerY + 80),
                            strokeWidth = 2f
                        )
                        drawLine(
                            color = Color.Yellow.copy(alpha = 0.8f),
                            start = Offset(centerX - 60, centerY + 75),
                            end = Offset(centerX - 60, centerY + 85),
                            strokeWidth = 2f
                        )
                        drawLine(
                            color = Color.Yellow.copy(alpha = 0.8f),
                            start = Offset(centerX + 80, centerY + 75),
                            end = Offset(centerX + 80, centerY + 85),
                            strokeWidth = 2f
                        )
                    }
                }

                // HUD Overlays (Medical standard 4-corner telemetry)
                Column(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp)
                ) {
                    Text("CHANNA, KEO", color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Text("ID: 20260042", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    Text("KV: 120  mA: 250", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }

                Column(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp),
                    horizontalAlignment = Alignment.End
                ) {
                    Text("KRUPET RADIOLOGY", color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Text("MOD: DX", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    Text("LATERALITY: R", color = Color.Red, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(10.dp)
                ) {
                    Text("W: ${currentWindowWidth.toInt()} L: ${currentWindowLevel.toInt()}", color = Color.Yellow, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    Text("ZOOM: ${String.format("%.1f", zoomScale)}x", color = Color.LightGray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }

                Column(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(10.dp),
                    horizontalAlignment = Alignment.End
                ) {
                    Text("CTR: 0.48 Normal", color = Color.Green, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    Text("CALIPER: 140 mm", color = Color.Yellow, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }
            }

            // Viewport Controls Bar: Zoom & Measurement Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { zoomScale = (zoomScale - 0.25f).coerceAtLeast(0.75f) },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("- Zoom")
                    }
                    Button(
                        onClick = { zoomScale = (zoomScale + 0.25f).coerceAtMost(2.5f) },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("+ Zoom")
                    }
                    Button(
                        onClick = { zoomScale = 1.0f },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("Reset")
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Caliper", style = MaterialTheme.typography.bodySmall)
                    Spacer(modifier = Modifier.width(4.dp))
                    Switch(checked = showMeasurementGrid, onCheckedChange = { showMeasurementGrid = it })
                }
            }

            // Series Selector Strip
            Text("Series Acquisition (3)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                seriesList.forEachIndexed { index, name ->
                    val isSelected = selectedSeriesIndex == index
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .clickable { selectedSeriesIndex = index }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = name,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // Diagnostic Radiology Report Card
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Radiologist Diagnostic Report", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "FINDINGS: Cardiothoracic ratio is normal (0.48). Trachea is midline. Costophrenic angles are sharp with no pleural effusion. Normal bronchovascular markings without consolidation or pneumothorax.",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "IMPRESSION: Negative for acute cardiopulmonary abnormality.",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF006A6A)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Verified by: Dr. Rothana Lim, MD, Radiologist - 2026-11-03 14:15 UTC",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
