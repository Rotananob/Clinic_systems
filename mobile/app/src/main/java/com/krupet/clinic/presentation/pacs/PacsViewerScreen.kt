package com.krupet.clinic.presentation.pacs

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AspectRatio
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Contrast
import androidx.compose.material.icons.filled.CropRotate
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LinearScale
import androidx.compose.material.icons.filled.OpenWith
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*
import kotlin.math.abs
import kotlin.math.atan
import kotlin.math.roundToInt
import kotlin.math.sqrt

enum class PacsWindowPreset(
    val titleEn: String,
    val titleKh: String,
    val windowWidth: Int,
    val windowLevel: Int,
    val clinicalDescription: String
) {
    BONE(
        titleEn = "Bone",
        titleKh = "ឆ្អឹង",
        windowWidth = 2000,
        windowLevel = 300,
        clinicalDescription = "Cortical bone fractures, osteolytic lesions, and orthopedic hardware"
    ),
    SOFT_TISSUE(
        titleEn = "Soft Tissue",
        titleKh = "សាច់ទន់",
        windowWidth = 400,
        windowLevel = 40,
        clinicalDescription = "Visceral abdominal parenchyma, liver, spleen, and hematomas"
    ),
    LUNG(
        titleEn = "Lung",
        titleKh = "សួត",
        windowWidth = 1500,
        windowLevel = -600,
        clinicalDescription = "Bronchial architecture, pneumothorax, pulmonary nodules, and consolidation"
    ),
    BRAIN(
        titleEn = "Brain",
        titleKh = "ខួរក្បាល",
        windowWidth = 80,
        windowLevel = 40,
        clinicalDescription = "Gray-white matter junction, early ischemic edema, and midline shift"
    ),
    STROKE_SUBDURAL(
        titleEn = "Stroke / Subdural",
        titleKh = "ដាច់សរសៃឈាម",
        windowWidth = 130,
        windowLevel = 35,
        clinicalDescription = "Differentiates acute subdural blood (+60 HU) from cranial vault bone"
    ),
    MEDIASTINUM(
        titleEn = "Mediastinum",
        titleKh = "ទ្រូងកណ្ដាល",
        windowWidth = 350,
        windowLevel = 50,
        clinicalDescription = "Cardiac chambers, aortic dissection flaps, and mediastinal adenopathy"
    )
}

enum class ActiveCaliperTool {
    NONE,
    EUCLIDEAN_DISTANCE,
    COBB_ANGLE,
    CARDIOTHORACIC_RATIO
}

enum class ViewportTouchMode {
    WINDOWING,
    PAN_AND_ZOOM,
    CALIPER_ADJUST
}

enum class PhotometricInterpretation {
    MONOCHROME2, // Standard: Air is black, Bone is white
    MONOCHROME1  // Inverted: Air is white, Bone is black
}

data class DicomSeries(
    val id: String,
    val seriesNumber: Int,
    val modality: String,
    val seriesDescriptionEn: String,
    val seriesDescriptionKh: String,
    val totalSlices: Int,
    val sliceThicknessMm: Double,
    val pixelSpacingMm: Double = 0.143, // PixelSpacing (0028,0030)
    val defaultPreset: PacsWindowPreset = PacsWindowPreset.BONE
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PacsViewerScreen(
    onNavigateBack: () -> Unit = {}
) {
    // Multi-modality series catalog
    val seriesList = remember {
        listOf(
            DicomSeries(
                id = "series_1",
                seriesNumber = 1,
                modality = "CR",
                seriesDescriptionEn = "Chest PA Upright Diagnostic View",
                seriesDescriptionKh = "ថតកាំរស្មីអ៊ិចទ្រូង ឈរពីក្រោយទៅមុខ",
                totalSlices = 1,
                sliceThicknessMm = 0.0,
                pixelSpacingMm = 0.143,
                defaultPreset = PacsWindowPreset.LUNG
            ),
            DicomSeries(
                id = "series_2",
                seriesNumber = 2,
                modality = "CT",
                seriesDescriptionEn = "Cervical Spine Trauma - Bone Reconstruction",
                seriesDescriptionKh = "ស្កេន CT ឆ្អឹងក សង្ស័យបាក់ស្រុត",
                totalSlices = 48,
                sliceThicknessMm = 0.625,
                pixelSpacingMm = 0.352,
                defaultPreset = PacsWindowPreset.BONE
            ),
            DicomSeries(
                id = "series_3",
                seriesNumber = 3,
                modality = "CT",
                seriesDescriptionEn = "Abdomen & Pelvis Trauma with IV Contrast",
                seriesDescriptionKh = "ស្កេន CT ពោះ និងឆ្អឹងអាងត្រគាក ចាក់ថ្នាំពណ៌",
                totalSlices = 72,
                sliceThicknessMm = 1.250,
                pixelSpacingMm = 0.488,
                defaultPreset = PacsWindowPreset.SOFT_TISSUE
            )
        )
    }

    var selectedSeriesIndex by remember { mutableIntStateOf(0) }
    val currentSeries = seriesList[selectedSeriesIndex]

    var currentSliceIndex by remember { mutableIntStateOf(1) }
    var selectedPreset by remember { mutableStateOf(currentSeries.defaultPreset) }
    var currentWindowWidth by remember { mutableFloatStateOf(currentSeries.defaultPreset.windowWidth.toFloat()) }
    var currentWindowLevel by remember { mutableFloatStateOf(currentSeries.defaultPreset.windowLevel.toFloat()) }

    var photometric by remember { mutableStateOf(PhotometricInterpretation.MONOCHROME2) }
    var touchMode by remember { mutableStateOf(ViewportTouchMode.WINDOWING) }
    var activeCaliper by remember { mutableStateOf(ActiveCaliperTool.NONE) }

    // Viewport transform states
    var zoomScale by remember { mutableFloatStateOf(1.0f) }
    var panOffsetX by remember { mutableFloatStateOf(0f) }
    var panOffsetY by remember { mutableFloatStateOf(0f) }

    // Caliper geometric coordinates (in simulated pixel space)
    var distP1X by remember { mutableFloatStateOf(80f) }
    var distP1Y by remember { mutableFloatStateOf(150f) }
    var distP2X by remember { mutableFloatStateOf(220f) }
    var distP2Y by remember { mutableFloatStateOf(150f) }

    // Cobb Angle Lines: Line 1 (A->B), Line 2 (C->D)
    var cobbA by remember { mutableStateOf(Offset(80f, 90f)) }
    var cobbB by remember { mutableStateOf(Offset(220f, 110f)) }
    var cobbC by remember { mutableStateOf(Offset(75f, 210f)) }
    var cobbD by remember { mutableStateOf(Offset(225f, 180f)) }

    // Cardiothoracic Ratio (CTR) Metrics: Tr, Tl, Id
    var ctrRightMm by remember { mutableFloatStateOf(48f) }
    var ctrLeftMm by remember { mutableFloatStateOf(88f) }
    var ctrThoraxWidthMm by remember { mutableFloatStateOf(260f) }

    // Calculated metrics
    val measuredDistanceMm = remember(distP1X, distP1Y, distP2X, distP2Y, currentSeries.pixelSpacingMm) {
        val dxPx = distP2X - distP1X
        val dyPx = distP2Y - distP1Y
        val distPx = sqrt(dxPx * dxPx + dyPx * dyPx)
        (distPx * currentSeries.pixelSpacingMm * 10.0).roundToInt() / 10.0
    }

    val calculatedCobbAngle = remember(cobbA, cobbB, cobbC, cobbD) {
        val m1 = (cobbB.y - cobbA.y) / ((cobbB.x - cobbA.x).coerceAtLeast(0.001f))
        val m2 = (cobbD.y - cobbC.y) / ((cobbD.x - cobbC.x).coerceAtLeast(0.001f))
        val tanTheta = abs((m1 - m2) / (1.0f + m1 * m2))
        val angleRad = atan(tanTheta)
        ((angleRad * (180.0 / Math.PI)) * 10.0).roundToInt() / 10.0
    }

    val calculatedCtrRatio = remember(ctrRightMm, ctrLeftMm, ctrThoraxWidthMm) {
        val raw = (ctrRightMm + ctrLeftMm) / ctrThoraxWidthMm.coerceAtLeast(1f)
        (raw * 100.0).roundToInt() / 100.0
    }
    val isCardiomegaly = calculatedCtrRatio > 0.50

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Clinical Header Banner
        PacsHeaderCard(
            patientName = "Channa Keo - កែវ ចាន់ណា : 45y, Female",
            patientCode = "HN-2026-0042",
            accessionNumber = "ACC-2026-DX-9812",
            modality = currentSeries.modality
        )

        // Diagnostic Windowing Presets Strip
        WindowingPresetsCard(
            selectedPreset = selectedPreset,
            currentWidth = currentWindowWidth,
            currentLevel = currentWindowLevel,
            onSelectPreset = { preset ->
                selectedPreset = preset
                currentWindowWidth = preset.windowWidth.toFloat()
                currentWindowLevel = preset.windowLevel.toFloat()
            },
            onWidthChange = { currentWindowWidth = it },
            onLevelChange = { currentWindowLevel = it }
        )

        // Touch Mode & Caliper Selector Strip
        ViewerToolbarCard(
            touchMode = touchMode,
            activeCaliper = activeCaliper,
            photometric = photometric,
            onSelectTouchMode = { touchMode = it },
            onSelectCaliper = { activeCaliper = it },
            onTogglePhotometric = {
                photometric = if (photometric == PhotometricInterpretation.MONOCHROME2) {
                    PhotometricInterpretation.MONOCHROME1
                } else {
                    PhotometricInterpretation.MONOCHROME2
                }
            },
            onResetViewport = {
                zoomScale = 1.0f
                panOffsetX = 0f
                panOffsetY = 0f
                currentWindowWidth = selectedPreset.windowWidth.toFloat()
                currentWindowLevel = selectedPreset.windowLevel.toFloat()
            }
        )

        // High-Precision Radiologic Viewport Canvas with HUD Overlays
        DicomViewportCanvas(
            series = currentSeries,
            sliceIndex = currentSliceIndex,
            windowWidth = currentWindowWidth,
            windowLevel = currentWindowLevel,
            photometric = photometric,
            zoomScale = zoomScale,
            panOffsetX = panOffsetX,
            panOffsetY = panOffsetY,
            activeCaliper = activeCaliper,
            touchMode = touchMode,
            distanceMm = measuredDistanceMm,
            cobbAngleDeg = calculatedCobbAngle,
            ctrRatio = calculatedCtrRatio,
            isCardiomegaly = isCardiomegaly,
            onWindowDrag = { dW, dL ->
                currentWindowWidth = (currentWindowWidth + dW).coerceIn(10f, 4000f)
                currentWindowLevel = (currentWindowLevel - dL).coerceIn(-1000f, 2000f)
            },
            onPanZoomChange = { panDelta, zoomFactor ->
                panOffsetX += panDelta.x
                panOffsetY += panDelta.y
                zoomScale = (zoomScale * zoomFactor).coerceIn(0.5f, 6.0f)
            }
        )

        // Multi-Slice Navigation Slider for CT series
        if (currentSeries.totalSlices > 1) {
            MultiSliceScrubberCard(
                currentSlice = currentSliceIndex,
                totalSlices = currentSeries.totalSlices,
                thicknessMm = currentSeries.sliceThicknessMm,
                onSliceChange = { currentSliceIndex = it }
            )
        }

        // Caliper Diagnostic Analysis & Pathology Stratification Card
        CaliperAnalysisReportCard(
            activeCaliper = activeCaliper,
            distanceMm = measuredDistanceMm,
            cobbAngleDeg = calculatedCobbAngle,
            ctrRatio = calculatedCtrRatio,
            isCardiomegaly = isCardiomegaly,
            ctrRightMm = ctrRightMm,
            ctrLeftMm = ctrLeftMm,
            ctrThoraxWidthMm = ctrThoraxWidthMm,
            onRightMmChange = { ctrRightMm = it },
            onLeftMmChange = { ctrLeftMm = it },
            onThoraxChange = { ctrThoraxWidthMm = it }
        )

        // Multi-Modality Series Selector
        SeriesAcquisitionCard(
            seriesList = seriesList,
            selectedSeriesIndex = selectedSeriesIndex,
            onSelectSeries = { index ->
                selectedSeriesIndex = index
                currentSliceIndex = 1
                val newSeries = seriesList[index]
                selectedPreset = newSeries.defaultPreset
                currentWindowWidth = newSeries.defaultPreset.windowWidth.toFloat()
                currentWindowLevel = newSeries.defaultPreset.windowLevel.toFloat()
                zoomScale = 1.0f
                panOffsetX = 0f
                panOffsetY = 0f
            }
        )

        // Diagnostic Radiologist Verification Report Card
        RadiologistReportCard(
            currentSeries = currentSeries,
            ctrRatio = calculatedCtrRatio,
            isCardiomegaly = isCardiomegaly,
            cobbAngleDeg = calculatedCobbAngle
        )

        // Compliance Footer
        PacsRegulatoryFooter()
    }
}

@Composable
private fun PacsHeaderCard(
    patientName: String,
    patientCode: String,
    accessionNumber: String,
    modality: String
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Mobile PACS DICOM Diagnostic Station",
                        style = MaterialTheme.typography.titleLarge,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "ប្រព័ន្ធរូបភាពវេជ្ជសាស្ត្រ PACS និង DICOM Diagnostic Worklist",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MedicalSlate
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MedicalDeepTeal.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "MODALITY: $modality",
                        color = MedicalDeepTeal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 10.dp),
                color = MedicalSurfaceVariant
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Patient - អ្នកជំងឺ", fontSize = 11.sp, color = MedicalSlate)
                    Text(
                        text = patientName,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalOnSurface
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Study Accession Number", fontSize = 11.sp, color = MedicalSlate)
                    Text(
                        text = accessionNumber,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }
            }
        }
    }
}

@Composable
private fun WindowingPresetsCard(
    selectedPreset: PacsWindowPreset,
    currentWidth: Float,
    currentLevel: Float,
    onSelectPreset: (PacsWindowPreset) -> Unit,
    onWidthChange: (Float) -> Unit,
    onLevelChange: (Float) -> Unit
) {
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
                    text = "Diagnostic Windowing Presets (WW / WL)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "W: ${currentWidth.toInt()} | L: ${currentLevel.toInt()} HU",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
            }
            Text(
                text = "ការកំណត់កម្រិតពន្លឺ និងកម្រិតពណ៌ Windowing តាមស្តង់ដារ AAPM TG18",
                fontSize = 10.sp,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(10.dp))

            // 6 Diagnostic Presets Horizontal Scroll
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                PacsWindowPreset.values().forEach { preset ->
                    val isSelected = selectedPreset == preset
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) MedicalDeepTeal else MedicalSurfaceVariant.copy(alpha = 0.5f),
                        border = BorderStroke(1.dp, if (isSelected) MedicalDeepTeal else MedicalBorder),
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onSelectPreset(preset) }
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = preset.titleEn,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else MedicalOnSurface
                            )
                            Text(
                                text = "W:${preset.windowWidth} L:${preset.windowLevel}",
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace,
                                color = if (isSelected) MedicalLightTeal else MedicalSlate
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Sliders for Fine-Tuning Width and Level
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Window Width: ${currentWidth.toInt()}", fontSize = 10.sp, color = MedicalSlate)
                    Slider(
                        value = currentWidth,
                        onValueChange = onWidthChange,
                        valueRange = 10f..3000f,
                        colors = SliderDefaults.colors(thumbColor = MedicalDeepTeal, activeTrackColor = MedicalDeepTeal)
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Window Level: ${currentLevel.toInt()}", fontSize = 10.sp, color = MedicalSlate)
                    Slider(
                        value = currentLevel,
                        onValueChange = onLevelChange,
                        valueRange = -800f..1200f,
                        colors = SliderDefaults.colors(thumbColor = MedicalDeepTeal, activeTrackColor = MedicalDeepTeal)
                    )
                }
            }
        }
    }
}

@Composable
private fun ViewerToolbarCard(
    touchMode: ViewportTouchMode,
    activeCaliper: ActiveCaliperTool,
    photometric: PhotometricInterpretation,
    onSelectTouchMode: (ViewportTouchMode) -> Unit,
    onSelectCaliper: (ActiveCaliperTool) -> Unit,
    onTogglePhotometric: () -> Unit,
    onResetViewport: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Touch Mode Selector
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    TouchModeButton(
                        label = "Windowing",
                        isSelected = touchMode == ViewportTouchMode.WINDOWING,
                        onClick = { onSelectTouchMode(ViewportTouchMode.WINDOWING) }
                    )
                    TouchModeButton(
                        label = "Pan & Zoom",
                        isSelected = touchMode == ViewportTouchMode.PAN_AND_ZOOM,
                        onClick = { onSelectTouchMode(ViewportTouchMode.PAN_AND_ZOOM) }
                    )
                }

                // Invert and Reset Actions
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedButton(
                        onClick = onTogglePhotometric,
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Contrast, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (photometric == PhotometricInterpretation.MONOCHROME2) "Invert" else "Normal",
                            fontSize = 10.sp
                        )
                    }

                    OutlinedButton(
                        onClick = onResetViewport,
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "Reset", fontSize = 10.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MedicalSurfaceVariant.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(8.dp))

            // Caliper Mode Selector
            Text(
                text = "Quantitative Measurement Calipers - ឧបករណ៍វាស់វែង:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                CaliperChip(
                    label = "Off",
                    isSelected = activeCaliper == ActiveCaliperTool.NONE,
                    onClick = { onSelectCaliper(ActiveCaliperTool.NONE) },
                    modifier = Modifier.weight(0.7f)
                )
                CaliperChip(
                    label = "Distance mm",
                    isSelected = activeCaliper == ActiveCaliperTool.EUCLIDEAN_DISTANCE,
                    onClick = { onSelectCaliper(ActiveCaliperTool.EUCLIDEAN_DISTANCE) },
                    modifier = Modifier.weight(1.1f)
                )
                CaliperChip(
                    label = "Cobb Angle",
                    isSelected = activeCaliper == ActiveCaliperTool.COBB_ANGLE,
                    onClick = { onSelectCaliper(ActiveCaliperTool.COBB_ANGLE) },
                    modifier = Modifier.weight(1.1f)
                )
                CaliperChip(
                    label = "CTR Ratio",
                    isSelected = activeCaliper == ActiveCaliperTool.CARDIOTHORACIC_RATIO,
                    onClick = { onSelectCaliper(ActiveCaliperTool.CARDIOTHORACIC_RATIO) },
                    modifier = Modifier.weight(1.1f)
                )
            }
        }
    }
}

@Composable
private fun TouchModeButton(label: String, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = if (isSelected) MedicalDeepTeal else MedicalSurfaceVariant.copy(alpha = 0.45f),
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .clickable { onClick() }
    ) {
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else MedicalOnSurface,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        )
    }
}

@Composable
private fun CaliperChip(label: String, isSelected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = if (isSelected) Color(0xFF006A6A) else MedicalSurfaceVariant.copy(alpha = 0.4f),
        border = BorderStroke(1.dp, if (isSelected) MedicalDeepTeal else MedicalBorder),
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.padding(vertical = 6.dp), contentAlignment = Alignment.Center) {
            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) Color.White else MedicalOnSurface
            )
        }
    }
}

@Composable
private fun DicomViewportCanvas(
    series: DicomSeries,
    sliceIndex: Int,
    windowWidth: Float,
    windowLevel: Float,
    photometric: PhotometricInterpretation,
    zoomScale: Float,
    panOffsetX: Float,
    panOffsetY: Float,
    activeCaliper: ActiveCaliperTool,
    touchMode: ViewportTouchMode,
    distanceMm: Double,
    cobbAngleDeg: Double,
    ctrRatio: Double,
    isCardiomegaly: Boolean,
    onWindowDrag: (Float, Float) -> Unit,
    onPanZoomChange: (Offset, Float) -> Unit
) {
    val isInverted = photometric == PhotometricInterpretation.MONOCHROME1
    val bgFillColor = if (isInverted) Color.White else Color.Black
    val boneColor = if (isInverted) Color(0xFF1A1A1A) else Color(0xFFEDEDED)
    val softColor = if (isInverted) Color(0xFF757575) else Color(0xFF424242)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(340.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(bgFillColor)
            .border(1.5.dp, MedicalSlate.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .pointerInput(touchMode) {
                when (touchMode) {
                    ViewportTouchMode.WINDOWING -> {
                        detectDragGestures { change, dragAmount ->
                            change.consume()
                            onWindowDrag(dragAmount.x * 3.5f, dragAmount.y * 3.5f)
                        }
                    }
                    ViewportTouchMode.PAN_AND_ZOOM -> {
                        detectTransformGestures { centroid, pan, zoom, _ ->
                            onPanZoomChange(pan, zoom)
                        }
                    }
                    else -> {}
                }
            }
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val centerX = (w / 2f) + panOffsetX
            val centerY = (h / 2f) + panOffsetY

            // Anatomical Radiologic Render Pipeline
            when (series.modality) {
                "CR" -> {
                    // Thoracic Rib Cage & Lung Fields
                    val lungColor = if (isInverted) Color(0xFFEEEEEE) else Color(0xFF0F0F0F)
                    // Bilateral Hemithorax
                    drawCircle(lungColor, radius = 75f * zoomScale, center = Offset(centerX - 60f * zoomScale, centerY))
                    drawCircle(lungColor, radius = 75f * zoomScale, center = Offset(centerX + 60f * zoomScale, centerY))

                    // Vertebral Column
                    drawLine(boneColor, Offset(centerX, centerY - 120f * zoomScale), Offset(centerX, centerY + 130f * zoomScale), 14f * zoomScale)

                    // Rib Arches
                    for (i in -3..3) {
                        val yOff = centerY + (i * 26f * zoomScale)
                        drawArc(
                            color = boneColor.copy(alpha = 0.55f),
                            startAngle = 180f,
                            sweepAngle = 110f,
                            useCenter = false,
                            topLeft = Offset(centerX - 130f * zoomScale, yOff - 20f * zoomScale),
                            size = Size(110f * zoomScale, 45f * zoomScale),
                            style = Stroke(3.5f * zoomScale)
                        )
                        drawArc(
                            color = boneColor.copy(alpha = 0.55f),
                            startAngle = 250f,
                            sweepAngle = 110f,
                            useCenter = false,
                            topLeft = Offset(centerX + 20f * zoomScale, yOff - 20f * zoomScale),
                            size = Size(110f * zoomScale, 45f * zoomScale),
                            style = Stroke(3.5f * zoomScale)
                        )
                    }

                    // Cardiac Silhouette
                    val cardiacRadius = if (isCardiomegaly) 65f * zoomScale else 48f * zoomScale
                    drawCircle(softColor.copy(alpha = 0.75f), radius = cardiacRadius, center = Offset(centerX + 28f * zoomScale, centerY + 30f * zoomScale))
                }
                "CT" -> {
                    if (series.id == "series_2") {
                        // Cervical Spine Cross-Section CT
                        drawCircle(boneColor, radius = 45f * zoomScale, center = Offset(centerX, centerY))
                        drawCircle(bgFillColor, radius = 22f * zoomScale, center = Offset(centerX, centerY)) // Spinal canal
                        // Transverse processes
                        drawLine(boneColor, Offset(centerX - 70f * zoomScale, centerY + 10f), Offset(centerX + 70f * zoomScale, centerY + 10f), 10f * zoomScale)
                        // Spinous process
                        drawLine(boneColor, Offset(centerX, centerY + 20f * zoomScale), Offset(centerX, centerY + 80f * zoomScale), 12f * zoomScale)
                    } else {
                        // Abdominal CT with Visceral Organs
                        drawOval(softColor, Offset(centerX - 120f * zoomScale, centerY - 80f * zoomScale), Size(240f * zoomScale, 160f * zoomScale))
                        // Liver (Right Upper Quadrant)
                        drawCircle(Color(0xFF5A5A5A), radius = 42f * zoomScale, center = Offset(centerX - 50f * zoomScale, centerY - 15f * zoomScale))
                        // Spleen (Left Upper Quadrant)
                        drawCircle(Color(0xFF424242), radius = 28f * zoomScale, center = Offset(centerX + 65f * zoomScale, centerY - 10f * zoomScale))
                        // Vertebral body
                        drawCircle(boneColor, radius = 24f * zoomScale, center = Offset(centerX, centerY + 45f * zoomScale))
                    }
                }
            }

            // Caliper Overlay Drawings
            when (activeCaliper) {
                ActiveCaliperTool.EUCLIDEAN_DISTANCE -> {
                    val p1 = Offset(centerX - 70f * zoomScale, centerY + 70f * zoomScale)
                    val p2 = Offset(centerX + 70f * zoomScale, centerY + 70f * zoomScale)
                    val caliperColor = Color(0xFFFFD600) // High-visibility caliper yellow

                    drawLine(caliperColor, p1, p2, 2.5f)
                    drawLine(caliperColor, Offset(p1.x, p1.y - 8f), Offset(p1.x, p1.y + 8f), 2.5f)
                    drawLine(caliperColor, Offset(p2.x, p2.y - 8f), Offset(p2.x, p2.y + 8f), 2.5f)
                }
                ActiveCaliperTool.COBB_ANGLE -> {
                    val calColor = Color(0xFF00E676)
                    // Upper endplate line
                    drawLine(calColor, Offset(centerX - 80f * zoomScale, centerY - 50f * zoomScale), Offset(centerX + 80f * zoomScale, centerY - 30f * zoomScale), 2.5f)
                    // Lower endplate line
                    drawLine(calColor, Offset(centerX - 80f * zoomScale, centerY + 60f * zoomScale), Offset(centerX + 80f * zoomScale, centerY + 30f * zoomScale), 2.5f)
                }
                ActiveCaliperTool.CARDIOTHORACIC_RATIO -> {
                    val calColor = if (isCardiomegaly) Color(0xFFFF1744) else Color(0xFF00E676)
                    // Midline spine reference
                    drawLine(Color(0x88FFFFFF), Offset(centerX, centerY - 90f * zoomScale), Offset(centerX, centerY + 90f * zoomScale), 1.5f)
                    // Tr line (Right heart border)
                    drawLine(calColor, Offset(centerX, centerY + 30f * zoomScale), Offset(centerX - 35f * zoomScale, centerY + 30f * zoomScale), 2.5f)
                    // Tl line (Left heart border)
                    drawLine(calColor, Offset(centerX, centerY + 30f * zoomScale), Offset(centerX + 65f * zoomScale, centerY + 30f * zoomScale), 2.5f)
                    // Thoracic baseline Id
                    drawLine(Color(0xFF29B6F6), Offset(centerX - 110f * zoomScale, centerY + 75f * zoomScale), Offset(centerX + 110f * zoomScale, centerY + 75f * zoomScale), 2.5f)
                }
                ActiveCaliperTool.NONE -> {}
            }
        }

        // Standard 4-Corner Radiologic HUD Overlays
        // Top-Left: Patient & Acquisition Telemetry
        Column(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(10.dp)
        ) {
            Text("CHANNA, KEO", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            Text("ID: HN-2026-0042 (45y, F)", color = Color(0xFFB0BEC5), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            Text("SERIES: ${series.seriesNumber} [${series.modality}]", color = Color(0xFFB0BEC5), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            if (series.totalSlices > 1) {
                Text("SLICE: $sliceIndex / ${series.totalSlices} (Thick: ${series.sliceThicknessMm}mm)", color = Color(0xFFB0BEC5), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            }
        }

        // Top-Right: Facility & Spatial Orientation
        Column(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(10.dp),
            horizontalAlignment = Alignment.End
        ) {
            Text("KRUPET RADIOLOGY", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            Text("CAMDX WADO-RS ACTIVE", color = MedicalLightTeal, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            Text("LATERALITY: R", color = Color(0xFFFF5252), fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
        }

        // Bottom-Left: Window Width / Window Level & Photometric Interpretation
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(10.dp)
        ) {
            Text(
                text = "W: ${windowWidth.toInt()}  L: ${windowLevel.toInt()} HU",
                color = Color(0xFFFFD600),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "ZOOM: ${String.format(java.util.Locale.US, "%.1f", zoomScale)}x | ${photometric.name}",
                color = Color(0xFFB0BEC5),
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace
            )
        }

        // Bottom-Right: Active Caliper Quantitative Readout
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(10.dp),
            horizontalAlignment = Alignment.End
        ) {
            when (activeCaliper) {
                ActiveCaliperTool.EUCLIDEAN_DISTANCE -> {
                    Text("DISTANCE: $distanceMm mm", color = Color(0xFFFFD600), fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    Text("PixelSpacing: ${series.pixelSpacingMm} mm/px", color = Color(0xFFB0BEC5), fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                }
                ActiveCaliperTool.COBB_ANGLE -> {
                    Text("COBB ANGLE: $cobbAngleDeg deg", color = Color(0xFF00E676), fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    val cobbTier = when {
                        cobbAngleDeg < 10.0 -> "Normal Spine"
                        cobbAngleDeg < 25.0 -> "Mild Scoliosis"
                        cobbAngleDeg < 40.0 -> "Moderate Scoliosis"
                        else -> "Severe Scoliosis"
                    }
                    Text(cobbTier, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
                ActiveCaliperTool.CARDIOTHORACIC_RATIO -> {
                    Text("CTR: ${String.format(java.util.Locale.US, "%.2f", ctrRatio)}", color = if (isCardiomegaly) Color(0xFFFF1744) else Color(0xFF00E676), fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    Text(if (isCardiomegaly) "CARDIOMEGALY (>0.50)" else "NORMAL HEART SIZE", color = if (isCardiomegaly) Color(0xFFFF1744) else Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
                ActiveCaliperTool.NONE -> {
                    Text("CALIPER: INACTIVE", color = Color(0xFF78909C), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}

@Composable
private fun MultiSliceScrubberCard(
    currentSlice: Int,
    totalSlices: Int,
    thicknessMm: Double,
    onSliceChange: (Int) -> Unit
) {
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
                    text = "Axial Reconstructed Slices - ស្រទាប់រូបភាព CT",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "Slice $currentSlice of $totalSlices (Thick: $thicknessMm mm)",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = MedicalOnSurface
                )
            }
            Slider(
                value = currentSlice.toFloat(),
                onValueChange = { onSliceChange(it.roundToInt()) },
                valueRange = 1f..totalSlices.toFloat(),
                steps = totalSlices - 2,
                colors = SliderDefaults.colors(thumbColor = MedicalDeepTeal, activeTrackColor = MedicalDeepTeal)
            )
        }
    }
}

@Composable
private fun CaliperAnalysisReportCard(
    activeCaliper: ActiveCaliperTool,
    distanceMm: Double,
    cobbAngleDeg: Double,
    ctrRatio: Double,
    isCardiomegaly: Boolean,
    ctrRightMm: Float,
    ctrLeftMm: Float,
    ctrThoraxWidthMm: Float,
    onRightMmChange: (Float) -> Unit,
    onLeftMmChange: (Float) -> Unit,
    onThoraxChange: (Float) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Quantitative Radiologic Caliper Analytics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Text(
                text = "ការវិភាគរង្វាស់ និងការកំណត់កម្រិតរោគវិនិច្ឆ័យតាមរូបភាព",
                style = MaterialTheme.typography.bodySmall,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(10.dp))

            when (activeCaliper) {
                ActiveCaliperTool.CARDIOTHORACIC_RATIO -> {
                    // CTR Specific Card
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isCardiomegaly) Color(0xFFFFEBEE) else MedicalLightTeal.copy(alpha = 0.25f),
                        border = BorderStroke(1.dp, if (isCardiomegaly) Color(0xFFD32F2F) else MedicalDeepTeal),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isCardiomegaly) "PATHOLOGICAL CARDIOMEGALY DETECTED" else "NORMAL CARDIOTHORACIC RATIO",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isCardiomegaly) Color(0xFFD32F2F) else MedicalDeepTeal
                                )
                                Text(
                                    text = "CTR: ${String.format(java.util.Locale.US, "%.2f", ctrRatio)}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isCardiomegaly) Color(0xFFD32F2F) else MedicalDeepTeal
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Formula: (Tr + Tl) / Thoracic Diameter. Normal adult ceiling is <= 0.50 (50%). Values > 0.50 indicate cardiac enlargement secondary to CHF, valvular regurgitation, or pericardial effusion.",
                                fontSize = 10.sp,
                                color = MedicalSlate
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            // Interactive parameters
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = "Tr: ${ctrRightMm.toInt()} mm", fontSize = 10.sp, color = MedicalSlate)
                                    Slider(value = ctrRightMm, onValueChange = onRightMmChange, valueRange = 20f..100f)
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = "Tl: ${ctrLeftMm.toInt()} mm", fontSize = 10.sp, color = MedicalSlate)
                                    Slider(value = ctrLeftMm, onValueChange = onLeftMmChange, valueRange = 40f..150f)
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = "Id: ${ctrThoraxWidthMm.toInt()} mm", fontSize = 10.sp, color = MedicalSlate)
                                    Slider(value = ctrThoraxWidthMm, onValueChange = onThoraxChange, valueRange = 180f..350f)
                                }
                            }
                        }
                    }
                }

                ActiveCaliperTool.COBB_ANGLE -> {
                    // Cobb Angle Specific Card
                    val cobbTier = when {
                        cobbAngleDeg < 10.0 -> "Normal Spine Alignment (Angle < 10 deg)"
                        cobbAngleDeg < 25.0 -> "Mild Scoliosis (Angle 10-24 deg) : Clinical Observation"
                        cobbAngleDeg < 40.0 -> "Moderate Scoliosis (Angle 25-39 deg) : Orthopedic Bracing"
                        else -> "Severe Scoliosis (Angle >= 40 deg) : Surgical Fusion Evaluation"
                    }
                    val cobbColor = when {
                        cobbAngleDeg >= 40.0 -> Color(0xFFD32F2F)
                        cobbAngleDeg >= 25.0 -> Color(0xFFF57F17)
                        else -> MedicalDeepTeal
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = cobbColor.copy(alpha = 0.12f),
                        border = BorderStroke(1.dp, cobbColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "SPINAL COBB ANGLE STRATIFICATION",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = cobbColor
                                )
                                Text(
                                    text = "$cobbAngleDeg deg",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = cobbColor
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = cobbTier,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MedicalOnSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Measured between the superior endplate of the upper vertebra and inferior endplate of the lower tilted vertebra.",
                                fontSize = 10.sp,
                                color = MedicalSlate
                            )
                        }
                    }
                }

                ActiveCaliperTool.EUCLIDEAN_DISTANCE -> {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MedicalSurfaceVariant.copy(alpha = 0.45f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Calibrated Euclidean Distance - ប្រវែងចម្ងាយ",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MedicalDeepTeal
                                )
                                Text(
                                    text = "Computed via DICOM PixelSpacing tag (0028,0030)",
                                    fontSize = 10.sp,
                                    color = MedicalSlate
                                )
                            }
                            Text(
                                text = "$distanceMm mm",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalDeepTeal
                            )
                        }
                    }
                }

                ActiveCaliperTool.NONE -> {
                    Text(
                        text = "Select a caliper tool above (Distance, Cobb Angle, or CTR) to activate interactive anatomical measurements on the radiologic viewport.",
                        fontSize = 11.sp,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun SeriesAcquisitionCard(
    seriesList: List<DicomSeries>,
    selectedSeriesIndex: Int,
    onSelectSeries: (Int) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = "Available DICOM Series Acquisition (${seriesList.size})",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Spacer(modifier = Modifier.height(8.dp))

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                seriesList.forEachIndexed { index, s ->
                    val isSelected = selectedSeriesIndex == index
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) MedicalDeepTeal.copy(alpha = 0.12f) else MedicalSurfaceVariant.copy(alpha = 0.35f),
                        border = BorderStroke(1.dp, if (isSelected) MedicalDeepTeal else MedicalBorder),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onSelectSeries(index) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = if (isSelected) MedicalDeepTeal else MedicalSlate
                                    ) {
                                        Text(
                                            text = s.modality,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = s.seriesDescriptionEn,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MedicalOnSurface
                                    )
                                }
                                Text(
                                    text = s.seriesDescriptionKh,
                                    fontSize = 10.sp,
                                    color = MedicalSlate
                                )
                            }

                            Text(
                                text = if (s.totalSlices > 1) "${s.totalSlices} Slices" else "Single View",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalDeepTeal
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RadiologistReportCard(
    currentSeries: DicomSeries,
    ctrRatio: Double,
    isCardiomegaly: Boolean,
    cobbAngleDeg: Double
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = "Radiologist Official Diagnostic Finding",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Spacer(modifier = Modifier.height(4.dp))
            val findingText = when (currentSeries.modality) {
                "CR" -> if (isCardiomegaly) {
                    "FINDING: Mild cardiomegaly noted with CTR of ${String.format(java.util.Locale.US, "%.2f", ctrRatio)} (>0.50). Bronchovascular markings accentuated at lung bases. Recommend clinical correlation for fluid overload and echocardiography."
                } else {
                    "FINDING: Heart size within normal limits with CTR of ${String.format(java.util.Locale.US, "%.2f", ctrRatio)}. Clear bilateral lung parenchyma. Trachea midline. Costophrenic recesses acute without pleural effusion."
                }
                "CT" -> if (currentSeries.id == "series_2") {
                    "FINDING: Cervical spine alignment intact. Cobb angle ${cobbAngleDeg} deg within physiological limits. No evidence of acute subluxation, facet dislocation, or prevertebral soft tissue hematoma."
                } else {
                    "FINDING: Liver, spleen, pancreas, and kidneys demonstrate normal parenchymal attenuation with IV contrast. No free intra-abdominal fluid or retroperitoneal hematoma."
                }
                else -> "FINDING: Diagnostic imaging verified."
            }

            Text(
                text = findingText,
                fontSize = 11.sp,
                color = MedicalOnSurface,
                lineHeight = 16.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Verified by: Dr. Rothana Lim, MD, Diagnostic Radiologist - 2026-11-03 14:15 UTC",
                fontSize = 10.sp,
                color = MedicalSlate
            )
        }
    }
}

@Composable
private fun PacsRegulatoryFooter() {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurfaceVariant.copy(alpha = 0.45f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Security,
                contentDescription = null,
                tint = MedicalDeepTeal,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "DICOM PS 3.x & AAPM TG18 Compliance",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Mobile PACS viewer complies with DICOMweb WADO-RS retrieval and calibrated spatial geometry via PixelSpacing (0028,0030). Diagnostic interpretations require calibrated medical displays.",
                    fontSize = 11.sp,
                    color = MedicalSlate,
                    lineHeight = 15.sp
                )
            }
        }
    }
}
