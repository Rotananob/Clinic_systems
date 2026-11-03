package com.krupet.clinic.presentation.dental

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Security
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*
import kotlin.math.roundToInt

enum class ToothSurface {
    OCCLUSAL_INCISAL, // Center
    MESIAL,           // Proximal toward midline
    DISTAL,           // Proximal away from midline
    BUCCAL_FACIAL,    // Outer facing cheek/lips
    LINGUAL_PALATAL   // Inner facing tongue/palate
}

enum class SurfaceRestoration(
    val labelEn: String,
    val labelKh: String,
    val color: Color
) {
    SOUND("Sound", "ធ្មេញធម្មតា", Color.White),
    CARIES("Caries", "ធ្មេញពុក", Color(0xFFD32F2F)),
    AMALGAM("Amalgam", "ប៉ះស្មាច់", Color(0xFF455A64)),
    COMPOSITE("Composite", "ប៉ះពណ៌ធ្មេញ", Color(0xFF2E7D32))
}

enum class ToothLevelCondition(
    val labelEn: String,
    val labelKh: String,
    val badgeColor: Color
) {
    NONE("Normal", "ធម្មតា", Color.Transparent),
    CROWN("Crown", "ស្រោបធ្មេញ", Color(0xFFFFA000)),
    ROOT_CANAL("RCT", "ព្យាបាលឫសធ្មេញ", Color(0xFF7B1FA2)),
    MISSING("Missing", "ដកធ្មេញ", Color(0xFF9E9E9E)),
    IMPLANT("Implant", "ដាំបង្គោល", Color(0xFF1976D2))
}

data class PeriodontalSite(
    val depthMm: Int = 2,
    val hasBleeding: Boolean = false
)

data class ToothState(
    val fdiNumber: Int,
    val isPrimary: Boolean = false,
    val surfaces: Map<ToothSurface, SurfaceRestoration> = mapOf(
        ToothSurface.OCCLUSAL_INCISAL to SurfaceRestoration.SOUND,
        ToothSurface.MESIAL to SurfaceRestoration.SOUND,
        ToothSurface.DISTAL to SurfaceRestoration.SOUND,
        ToothSurface.BUCCAL_FACIAL to SurfaceRestoration.SOUND,
        ToothSurface.LINGUAL_PALATAL to SurfaceRestoration.SOUND
    ),
    val toothCondition: ToothLevelCondition = ToothLevelCondition.NONE,
    // 6-site periodontal probing (DB, B, MB, DL, L, ML)
    val distoBuccal: PeriodontalSite = PeriodontalSite(2, false),
    val midBuccal: PeriodontalSite = PeriodontalSite(2, false),
    val mesioBuccal: PeriodontalSite = PeriodontalSite(2, false),
    val distoLingual: PeriodontalSite = PeriodontalSite(2, false),
    val midLingual: PeriodontalSite = PeriodontalSite(2, false),
    val mesioLingual: PeriodontalSite = PeriodontalSite(2, false),
    val clinicalNotes: String = ""
) {
    val isDecayed: Boolean
        get() = toothCondition != ToothLevelCondition.MISSING &&
                surfaces.values.any { it == SurfaceRestoration.CARIES }

    val isMissing: Boolean
        get() = toothCondition == ToothLevelCondition.MISSING

    val isFilled: Boolean
        get() = toothCondition != ToothLevelCondition.MISSING &&
                !isDecayed &&
                (surfaces.values.any { it == SurfaceRestoration.AMALGAM || it == SurfaceRestoration.COMPOSITE } ||
                        toothCondition == ToothLevelCondition.CROWN)

    val maxPocketDepth: Int
        get() = maxOf(
            distoBuccal.depthMm, midBuccal.depthMm, mesioBuccal.depthMm,
            distoLingual.depthMm, midLingual.depthMm, mesioLingual.depthMm
        )

    val hasAnyBleeding: Boolean
        get() = distoBuccal.hasBleeding || midBuccal.hasBleeding || mesioBuccal.hasBleeding ||
                distoLingual.hasBleeding || midLingual.hasBleeding || mesioLingual.hasBleeding

    val hasSeverePeriodontitis: Boolean
        get() = maxPocketDepth >= 6

    val hasModeratePeriodontitis: Boolean
        get() = maxPocketDepth in 4..5
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DentalScreen(
    onNavigateBack: () -> Unit = {}
) {
    var isAdultMode by remember { mutableStateOf(true) }
    var selectedToothNum by remember { mutableStateOf(16) }
    var activeSurfaceToEdit by remember { mutableStateOf(ToothSurface.OCCLUSAL_INCISAL) }

    // Permanent 32 Teeth FDI Arches
    val permanentUpperArch = remember {
        listOf(18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28)
    }
    val permanentLowerArch = remember {
        listOf(48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38)
    }

    // Primary 20 Teeth Deciduous FDI Arches
    val primaryUpperArch = remember {
        listOf(55, 54, 53, 52, 51, 61, 62, 63, 64, 65)
    }
    val primaryLowerArch = remember {
        listOf(85, 84, 83, 82, 81, 71, 72, 73, 74, 75)
    }

    // Initialize interactive tooth states
    var toothRecords by remember {
        val initialMap = mutableMapOf<Int, ToothState>()
        (permanentUpperArch + permanentLowerArch).forEach { num ->
            initialMap[num] = ToothState(fdiNumber = num, isPrimary = false)
        }
        (primaryUpperArch + primaryLowerArch).forEach { num ->
            initialMap[num] = ToothState(fdiNumber = num, isPrimary = true)
        }

        // Pre-populate realistic clinical sample cases
        initialMap[16] = initialMap[16]!!.copy(
            surfaces = mapOf(
                ToothSurface.OCCLUSAL_INCISAL to SurfaceRestoration.CARIES,
                ToothSurface.MESIAL to SurfaceRestoration.CARIES,
                ToothSurface.DISTAL to SurfaceRestoration.SOUND,
                ToothSurface.BUCCAL_FACIAL to SurfaceRestoration.SOUND,
                ToothSurface.LINGUAL_PALATAL to SurfaceRestoration.SOUND
            ),
            distoBuccal = PeriodontalSite(5, true),
            midBuccal = PeriodontalSite(4, false),
            mesioBuccal = PeriodontalSite(6, true),
            clinicalNotes = "Deep occlusal-mesial caries with bleeding pocket"
        )
        initialMap[21] = initialMap[21]!!.copy(
            toothCondition = ToothLevelCondition.CROWN,
            clinicalNotes = "Porcelain-fused-to-zirconia crown"
        )
        initialMap[36] = initialMap[36]!!.copy(
            toothCondition = ToothLevelCondition.MISSING,
            clinicalNotes = "Extracted due to severe chronic apical periodontitis"
        )
        initialMap[46] = initialMap[46]!!.copy(
            surfaces = mapOf(
                ToothSurface.OCCLUSAL_INCISAL to SurfaceRestoration.AMALGAM,
                ToothSurface.MESIAL to SurfaceRestoration.SOUND,
                ToothSurface.DISTAL to SurfaceRestoration.SOUND,
                ToothSurface.BUCCAL_FACIAL to SurfaceRestoration.SOUND,
                ToothSurface.LINGUAL_PALATAL to SurfaceRestoration.SOUND
            ),
            clinicalNotes = "Intact occlusal amalgam restoration"
        )

        mutableStateOf<Map<Int, ToothState>>(initialMap)
    }

    val selectedTooth = toothRecords[selectedToothNum] ?: ToothState(fdiNumber = selectedToothNum)

    // Calculate WHO DMFT Metrics for permanent dentition
    val relevantTeeth = if (isAdultMode) {
        (permanentUpperArch + permanentLowerArch).mapNotNull { toothRecords[it] }
    } else {
        (primaryUpperArch + primaryLowerArch).mapNotNull { toothRecords[it] }
    }

    val decayedCount = relevantTeeth.count { it.isDecayed }
    val missingCount = relevantTeeth.count { it.isMissing }
    val filledCount = relevantTeeth.count { it.isFilled }
    val totalDmft = decayedCount + missingCount + filledCount

    // Full-Mouth Bleeding Score (FMBS)
    val totalProbedSites = (relevantTeeth.size * 6).coerceAtLeast(1)
    val bleedingSitesCount = relevantTeeth.sumOf { tooth ->
        listOf(
            tooth.distoBuccal, tooth.midBuccal, tooth.mesioBuccal,
            tooth.distoLingual, tooth.midLingual, tooth.mesioLingual
        ).count { it.hasBleeding }
    }
    val fmbsPercent = ((bleedingSitesCount.toDouble() / totalProbedSites) * 100.0).roundToInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Clinical Odontogram Header
        DentalHeaderCard(
            isAdultMode = isAdultMode,
            onModeToggle = { isAdultMode = it }
        )

        // Real-Time WHO DMFT / dft Index & Bleeding Score Bar
        WhoDmftKpiCard(
            isAdultMode = isAdultMode,
            decayed = decayedCount,
            missing = missingCount,
            filled = filledCount,
            dmftTotal = totalDmft,
            fmbsPercent = fmbsPercent
        )

        // FDI Interactive Odontogram Arch Display
        OdontogramArchCard(
            isAdultMode = isAdultMode,
            upperArch = if (isAdultMode) permanentUpperArch else primaryUpperArch,
            lowerArch = if (isAdultMode) permanentLowerArch else primaryLowerArch,
            toothRecords = toothRecords,
            selectedToothNum = selectedToothNum,
            onToothSelect = { selectedToothNum = it }
        )

        // 5-Surface Anatomical Restorative Editor
        ToothSurfaceEditorCard(
            tooth = selectedTooth,
            activeSurface = activeSurfaceToEdit,
            onSurfaceSelect = { activeSurfaceToEdit = it },
            onSurfaceConditionChange = { surface, condition ->
                val updatedSurfaces = selectedTooth.surfaces.toMutableMap()
                updatedSurfaces[surface] = condition
                val updatedTooth = selectedTooth.copy(surfaces = updatedSurfaces)
                toothRecords = toothRecords + (selectedToothNum to updatedTooth)
            },
            onToothConditionChange = { condition ->
                val updatedTooth = selectedTooth.copy(toothCondition = condition)
                toothRecords = toothRecords + (selectedToothNum to updatedTooth)
            }
        )

        // 6-Site Periodontal Pocket Probing Depth Chart
        PeriodontalChartingCard(
            tooth = selectedTooth,
            onUpdateSite = { siteUpdater ->
                val updatedTooth = siteUpdater(selectedTooth)
                toothRecords = toothRecords + (selectedToothNum to updatedTooth)
            }
        )

        // Clinical Safety & Standards Footer
        DentalComplianceFooter()
    }
}

@Composable
private fun DentalHeaderCard(
    isAdultMode: Boolean,
    onModeToggle: (Boolean) -> Unit
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
                        text = "FDI World Dental Odontogram",
                        style = MaterialTheme.typography.titleLarge,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "គ្លីនិកទន្តសាស្ត្រ និងការកត់ត្រាធ្មេញ FDI - ISO 3950 Standard",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MedicalSlate
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    FilterChip(
                        selected = isAdultMode,
                        onClick = { onModeToggle(true) },
                        label = { Text("Adult 32", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MedicalDeepTeal,
                            selectedLabelColor = Color.White
                        )
                    )
                    FilterChip(
                        selected = !isAdultMode,
                        onClick = { onModeToggle(false) },
                        label = { Text("Primary 20", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MedicalDeepTeal,
                            selectedLabelColor = Color.White
                        )
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
                Text(
                    text = "Patient: Bopha Chey - HN-2026-0742 (28y, Female)",
                    fontSize = 11.sp,
                    color = MedicalOnSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Station: Dental Operatory 1",
                    fontSize = 11.sp,
                    color = MedicalSlate
                )
            }
        }
    }
}

@Composable
private fun WhoDmftKpiCard(
    isAdultMode: Boolean,
    decayed: Int,
    missing: Int,
    filled: Int,
    dmftTotal: Int,
    fmbsPercent: Int
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
                    text = if (isAdultMode) "WHO DMFT Caries Index - សន្ទស្សន៍សុខភាពមាត់ធ្មេញ" else "WHO dft Pediatric Index",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )

                val severityTier = when {
                    dmftTotal < 1.2 -> "VERY LOW"
                    dmftTotal <= 2.6 -> "LOW"
                    dmftTotal <= 4.4 -> "MODERATE"
                    dmftTotal <= 6.5 -> "HIGH"
                    else -> "VERY HIGH"
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (dmftTotal > 4) Color(0xFFFFEBEE) else MedicalLightTeal.copy(alpha = 0.25f)
                ) {
                    Text(
                        text = "CARIES RISK: $severityTier",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (dmftTotal > 4) MedicalError else MedicalDeepTeal,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DmftMetricBox("Decayed - D", "ធ្មេញពុក", "$decayed", Color(0xFFD32F2F), Modifier.weight(1f))
                DmftMetricBox("Missing - M", "ធ្មេញបាត់", "$missing", Color(0xFF9E9E9E), Modifier.weight(1f))
                DmftMetricBox("Filled - F", "ធ្មេញប៉ះ", "$filled", Color(0xFF2E7D32), Modifier.weight(1f))
                DmftMetricBox("Total DMFT", "សរុប", "$dmftTotal", MedicalDeepTeal, Modifier.weight(1f))
                DmftMetricBox("BOP %", "ហូរឈាម", "$fmbsPercent%", if (fmbsPercent >= 25) Color(0xFFD32F2F) else MedicalSlate, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun DmftMetricBox(
    titleEn: String,
    titleKh: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.10f),
        border = BorderStroke(1.dp, color.copy(alpha = 0.35f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = titleEn, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MedicalSlate, maxLines = 1)
            Text(text = titleKh, fontSize = 8.sp, color = MedicalSlate, maxLines = 1)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
private fun OdontogramArchCard(
    isAdultMode: Boolean,
    upperArch: List<Int>,
    lowerArch: List<Int>,
    toothRecords: Map<Int, ToothState>,
    selectedToothNum: Int,
    onToothSelect: (Int) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = "Interactive Dental Arch - ចុចលើធ្មេញដើម្បីពិនិត្យលម្អិត",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Spacer(modifier = Modifier.height(8.dp))

            // Upper Arch Label
            Text(
                text = "Maxillary Arch - ធ្មេញថ្គាមលើ",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))

            // Upper Arch Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                upperArch.forEach { toothNum ->
                    val tooth = toothRecords[toothNum] ?: ToothState(fdiNumber = toothNum)
                    ToothArchItem(
                        tooth = tooth,
                        isSelected = selectedToothNum == toothNum,
                        onClick = { onToothSelect(toothNum) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MedicalSurfaceVariant.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(10.dp))

            // Lower Arch Label
            Text(
                text = "Mandibular Arch - ធ្មេញថ្គាមក្រោម",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))

            // Lower Arch Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                lowerArch.forEach { toothNum ->
                    val tooth = toothRecords[toothNum] ?: ToothState(fdiNumber = toothNum)
                    ToothArchItem(
                        tooth = tooth,
                        isSelected = selectedToothNum == toothNum,
                        onClick = { onToothSelect(toothNum) }
                    )
                }
            }
        }
    }
}

@Composable
private fun ToothArchItem(
    tooth: ToothState,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable { onClick() }
            .padding(horizontal = 1.dp)
    ) {
        Text(
            text = "${tooth.fdiNumber}",
            fontSize = 9.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) MedicalDeepTeal else MedicalOnSurface
        )

        Spacer(modifier = Modifier.height(2.dp))

        // Mini 5-Surface Tooth Glyph via Canvas
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(RoundedCornerShape(3.dp))
                .border(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MedicalDeepTeal else MedicalBorder,
                    shape = RoundedCornerShape(3.dp)
                )
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height

                if (tooth.toothCondition == ToothLevelCondition.MISSING) {
                    // Draw bold cross X
                    drawLine(Color(0xFF9E9E9E), Offset(0f, 0f), Offset(w, h), 2.5f)
                    drawLine(Color(0xFF9E9E9E), Offset(w, 0f), Offset(0f, h), 2.5f)
                } else {
                    // Draw 5 mini surfaces
                    val cW = w * 0.44f
                    val cH = h * 0.44f
                    val cX = (w - cW) / 2f
                    val cY = (h - cH) / 2f

                    // Buccal (top)
                    drawRect(tooth.surfaces[ToothSurface.BUCCAL_FACIAL]?.color ?: Color.White, Offset(0f, 0f), Size(w, cY))
                    // Lingual (bottom)
                    drawRect(tooth.surfaces[ToothSurface.LINGUAL_PALATAL]?.color ?: Color.White, Offset(0f, cY + cH), Size(w, h - (cY + cH)))
                    // Mesial (left)
                    drawRect(tooth.surfaces[ToothSurface.MESIAL]?.color ?: Color.White, Offset(0f, cY), Size(cX, cH))
                    // Distal (right)
                    drawRect(tooth.surfaces[ToothSurface.DISTAL]?.color ?: Color.White, Offset(cX + cW, cY), Size(w - (cX + cW), cH))
                    // Center (Occlusal)
                    drawRect(tooth.surfaces[ToothSurface.OCCLUSAL_INCISAL]?.color ?: Color.White, Offset(cX, cY), Size(cW, cH))

                    // Draw inner grid lines
                    drawRect(Color(0x33000000), Offset(cX, cY), Size(cW, cH), style = Stroke(0.5f))

                    // Crown encasing border
                    if (tooth.toothCondition == ToothLevelCondition.CROWN) {
                        drawRect(Color(0xFFFFA000), Offset(0f, 0f), Size(w, h), style = Stroke(1.5f))
                    }
                }
            }
        }

        // Pocket depth badge
        if (tooth.maxPocketDepth >= 4) {
            Text(
                text = "${tooth.maxPocketDepth}",
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                color = if (tooth.maxPocketDepth >= 6) Color(0xFFD32F2F) else Color(0xFFF57F17)
            )
        } else {
            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

@Composable
private fun ToothSurfaceEditorCard(
    tooth: ToothState,
    activeSurface: ToothSurface,
    onSurfaceSelect: (ToothSurface) -> Unit,
    onSurfaceConditionChange: (ToothSurface, SurfaceRestoration) -> Unit,
    onToothConditionChange: (ToothLevelCondition) -> Unit
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
                        text = "FDI #${tooth.fdiNumber} - 5-Surface Anatomical Restorative Editor",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "ការកែសម្រួលស្ថានភាពផ្ទៃធ្មេញទាំង ៥ និងកម្រិតស្រោប/ដក",
                        style = MaterialTheme.typography.bodySmall,
                        color = MedicalSlate
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = MedicalDeepTeal.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "TOOTH #${tooth.fdiNumber}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Canvas Anatomical 5-Facet Odontogram Interactive Graphic
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Interactive 5-Facet Canvas
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .background(Color(0xFFFAFAFA), RoundedCornerShape(12.dp))
                        .border(1.5.dp, MedicalSurfaceVariant, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(14.dp)
                    ) {
                        val w = size.width
                        val h = size.height

                        val cX1 = w * 0.28f
                        val cY1 = h * 0.28f
                        val cX2 = w * 0.72f
                        val cY2 = h * 0.72f

                        // 1. Buccal / Facial Facet (Top)
                        val buccalPath = Path().apply {
                            moveTo(0f, 0f)
                            lineTo(w, 0f)
                            lineTo(cX2, cY1)
                            lineTo(cX1, cY1)
                            close()
                        }
                        drawPath(buccalPath, tooth.surfaces[ToothSurface.BUCCAL_FACIAL]?.color ?: Color.White)
                        drawPath(buccalPath, Color(0xFF333333), style = Stroke(1.5f))

                        // 2. Lingual / Palatal Facet (Bottom)
                        val lingualPath = Path().apply {
                            moveTo(0f, h)
                            lineTo(cX1, cY2)
                            lineTo(cX2, cY2)
                            lineTo(w, h)
                            close()
                        }
                        drawPath(lingualPath, tooth.surfaces[ToothSurface.LINGUAL_PALATAL]?.color ?: Color.White)
                        drawPath(lingualPath, Color(0xFF333333), style = Stroke(1.5f))

                        // 3. Mesial Facet (Left)
                        val mesialPath = Path().apply {
                            moveTo(0f, 0f)
                            lineTo(cX1, cY1)
                            lineTo(cX1, cY2)
                            lineTo(0f, h)
                            close()
                        }
                        drawPath(mesialPath, tooth.surfaces[ToothSurface.MESIAL]?.color ?: Color.White)
                        drawPath(mesialPath, Color(0xFF333333), style = Stroke(1.5f))

                        // 4. Distal Facet (Right)
                        val distalPath = Path().apply {
                            moveTo(w, 0f)
                            lineTo(w, h)
                            lineTo(cX2, cY2)
                            lineTo(cX2, cY1)
                            close()
                        }
                        drawPath(distalPath, tooth.surfaces[ToothSurface.DISTAL]?.color ?: Color.White)
                        drawPath(distalPath, Color(0xFF333333), style = Stroke(1.5f))

                        // 5. Occlusal / Incisal Facet (Center)
                        drawRect(
                            color = tooth.surfaces[ToothSurface.OCCLUSAL_INCISAL]?.color ?: Color.White,
                            topLeft = Offset(cX1, cY1),
                            size = Size(cX2 - cX1, cY2 - cY1)
                        )
                        drawRect(
                            color = Color(0xFF333333),
                            topLeft = Offset(cX1, cY1),
                            size = Size(cX2 - cX1, cY2 - cY1),
                            style = Stroke(1.5f)
                        )

                        // Missing X overlay
                        if (tooth.toothCondition == ToothLevelCondition.MISSING) {
                            drawLine(Color(0xFFD32F2F), Offset(0f, 0f), Offset(w, h), 4f)
                            drawLine(Color(0xFFD32F2F), Offset(w, 0f), Offset(0f, h), 4f)
                        }

                        // Crown border
                        if (tooth.toothCondition == ToothLevelCondition.CROWN) {
                            drawRect(Color(0xFFFFA000), Offset(-4f, -4f), Size(w + 8f, h + 8f), style = Stroke(4f))
                        }
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                // Surface Selection Radios
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Active Surface: ${activeSurface.name.replace("_", "/")}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        SurfaceChipItem("B - Buccal", activeSurface == ToothSurface.BUCCAL_FACIAL) {
                            onSurfaceSelect(ToothSurface.BUCCAL_FACIAL)
                        }
                        SurfaceChipItem("L - Lingual", activeSurface == ToothSurface.LINGUAL_PALATAL) {
                            onSurfaceSelect(ToothSurface.LINGUAL_PALATAL)
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        SurfaceChipItem("M - Mesial", activeSurface == ToothSurface.MESIAL) {
                            onSurfaceSelect(ToothSurface.MESIAL)
                        }
                        SurfaceChipItem("D - Distal", activeSurface == ToothSurface.DISTAL) {
                            onSurfaceSelect(ToothSurface.DISTAL)
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    SurfaceChipItem("O - Occlusal", activeSurface == ToothSurface.OCCLUSAL_INCISAL) {
                        onSurfaceSelect(ToothSurface.OCCLUSAL_INCISAL)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Surface Restoration Buttons
            Text(
                text = "Apply Condition to Active Surface - ${activeSurface.name}:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                SurfaceRestoration.values().forEach { restoration ->
                    val isCurrent = tooth.surfaces[activeSurface] == restoration
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { onSurfaceConditionChange(activeSurface, restoration) },
                        color = if (isCurrent) restoration.color.copy(alpha = 0.25f) else MedicalSurfaceVariant.copy(alpha = 0.5f),
                        border = BorderStroke(1.dp, if (isCurrent) restoration.color else MedicalBorder),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = restoration.labelEn,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (restoration == SurfaceRestoration.SOUND) MedicalDeepTeal else restoration.color
                            )
                            Text(
                                text = restoration.labelKh,
                                fontSize = 8.sp,
                                color = MedicalSlate
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Tooth-Level Conditions (Crown, RCT, Missing, Implant)
            Text(
                text = "Tooth-Level Status & Prosthetics - ស្ថានភាពធ្មេញទាំងមូល:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                ToothLevelCondition.values().forEach { cond ->
                    val isSelected = tooth.toothCondition == cond
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { onToothConditionChange(cond) },
                        color = if (isSelected) MedicalDeepTeal else MedicalSurfaceVariant.copy(alpha = 0.4f),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Box(modifier = Modifier.padding(vertical = 6.dp), contentAlignment = Alignment.Center) {
                            Text(
                                text = cond.labelEn,
                                fontSize = 9.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else MedicalOnSurface
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SurfaceChipItem(label: String, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(4.dp),
        color = if (isSelected) MedicalDeepTeal else MedicalSurfaceVariant.copy(alpha = 0.6f),
        modifier = Modifier
            .clickable { onClick() }
            .padding(vertical = 1.dp)
    ) {
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) Color.White else MedicalOnSurface,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun PeriodontalChartingCard(
    tooth: ToothState,
    onUpdateSite: ((ToothState) -> ToothState) -> Unit
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
                        text = "6-Site Periodontal Pocket Probing Chart",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "ការវាស់ជម្រៅហោប៉ៅអញ្ចាញធ្មេញ ៦ ទីតាំង និងការហូរឈាម BOP",
                        style = MaterialTheme.typography.bodySmall,
                        color = MedicalSlate
                    )
                }

                val hasSevere = tooth.hasSeverePeriodontitis
                val hasMod = tooth.hasModeratePeriodontitis
                val alarmText = when {
                    hasSevere -> "POCKET >= 6 mm : SEVERE"
                    hasMod -> "POCKET >= 4 mm : WARNING"
                    else -> "SULCUS HEALTHY"
                }
                val alarmColor = when {
                    hasSevere -> Color(0xFFD32F2F)
                    hasMod -> Color(0xFFF57F17)
                    else -> MedicalDeepTeal
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = alarmColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = alarmText,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = alarmColor,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Facial / Buccal 3 Sites (DB, B, MB)
            Text(
                text = "Facial / Buccal Sites - ផ្ទៃខាងក្រៅ:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PeriodontalSiteItem(
                    siteName = "Disto-Buccal",
                    site = tooth.distoBuccal,
                    onDepthChange = { delta ->
                        onUpdateSite { t ->
                            val newDepth = (t.distoBuccal.depthMm + delta).coerceIn(1, 9)
                            t.copy(distoBuccal = t.distoBuccal.copy(depthMm = newDepth))
                        }
                    },
                    onToggleBop = {
                        onUpdateSite { t ->
                            t.copy(distoBuccal = t.distoBuccal.copy(hasBleeding = !t.distoBuccal.hasBleeding))
                        }
                    },
                    modifier = Modifier.weight(1f)
                )

                PeriodontalSiteItem(
                    siteName = "Mid-Buccal",
                    site = tooth.midBuccal,
                    onDepthChange = { delta ->
                        onUpdateSite { t ->
                            val newDepth = (t.midBuccal.depthMm + delta).coerceIn(1, 9)
                            t.copy(midBuccal = t.midBuccal.copy(depthMm = newDepth))
                        }
                    },
                    onToggleBop = {
                        onUpdateSite { t ->
                            t.copy(midBuccal = t.midBuccal.copy(hasBleeding = !t.midBuccal.hasBleeding))
                        }
                    },
                    modifier = Modifier.weight(1f)
                )

                PeriodontalSiteItem(
                    siteName = "Mesio-Buccal",
                    site = tooth.mesioBuccal,
                    onDepthChange = { delta ->
                        onUpdateSite { t ->
                            val newDepth = (t.mesioBuccal.depthMm + delta).coerceIn(1, 9)
                            t.copy(mesioBuccal = t.mesioBuccal.copy(depthMm = newDepth))
                        }
                    },
                    onToggleBop = {
                        onUpdateSite { t ->
                            t.copy(mesioBuccal = t.mesioBuccal.copy(hasBleeding = !t.mesioBuccal.hasBleeding))
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Lingual / Palatal 3 Sites (DL, L, ML)
            Text(
                text = "Lingual / Palatal Sites - ផ្ទៃខាងក្នុង:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PeriodontalSiteItem(
                    siteName = "Disto-Lingual",
                    site = tooth.distoLingual,
                    onDepthChange = { delta ->
                        onUpdateSite { t ->
                            val newDepth = (t.distoLingual.depthMm + delta).coerceIn(1, 9)
                            t.copy(distoLingual = t.distoLingual.copy(depthMm = newDepth))
                        }
                    },
                    onToggleBop = {
                        onUpdateSite { t ->
                            t.copy(distoLingual = t.distoLingual.copy(hasBleeding = !t.distoLingual.hasBleeding))
                        }
                    },
                    modifier = Modifier.weight(1f)
                )

                PeriodontalSiteItem(
                    siteName = "Mid-Lingual",
                    site = tooth.midLingual,
                    onDepthChange = { delta ->
                        onUpdateSite { t ->
                            val newDepth = (t.midLingual.depthMm + delta).coerceIn(1, 9)
                            t.copy(midLingual = t.midLingual.copy(depthMm = newDepth))
                        }
                    },
                    onToggleBop = {
                        onUpdateSite { t ->
                            t.copy(midLingual = t.midLingual.copy(hasBleeding = !t.midLingual.hasBleeding))
                        }
                    },
                    modifier = Modifier.weight(1f)
                )

                PeriodontalSiteItem(
                    siteName = "Mesio-Lingual",
                    site = tooth.mesioLingual,
                    onDepthChange = { delta ->
                        onUpdateSite { t ->
                            val newDepth = (t.mesioLingual.depthMm + delta).coerceIn(1, 9)
                            t.copy(mesioLingual = t.mesioLingual.copy(depthMm = newDepth))
                        }
                    },
                    onToggleBop = {
                        onUpdateSite { t ->
                            t.copy(mesioLingual = t.mesioLingual.copy(hasBleeding = !t.mesioLingual.hasBleeding))
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun PeriodontalSiteItem(
    siteName: String,
    site: PeriodontalSite,
    onDepthChange: (Int) -> Unit,
    onToggleBop: () -> Unit,
    modifier: Modifier = Modifier
) {
    val depthColor = when {
        site.depthMm >= 6 -> Color(0xFFD32F2F)
        site.depthMm >= 4 -> Color(0xFFF57F17)
        else -> MedicalDeepTeal
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MedicalSurfaceVariant.copy(alpha = 0.45f),
        border = BorderStroke(1.dp, if (site.hasBleeding) Color(0xFFD32F2F) else MedicalBorder),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = siteName, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MedicalSlate, maxLines = 1)
            Spacer(modifier = Modifier.height(2.dp))

            // Depth Stepper
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Surface(
                    shape = CircleShape,
                    color = MedicalSurfaceVariant,
                    modifier = Modifier
                        .size(20.dp)
                        .clip(CircleShape)
                        .clickable { onDepthChange(-1) }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(imageVector = Icons.Default.Remove, contentDescription = null, modifier = Modifier.size(12.dp))
                    }
                }

                Text(
                    text = "${site.depthMm}mm",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = depthColor,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )

                Surface(
                    shape = CircleShape,
                    color = MedicalSurfaceVariant,
                    modifier = Modifier
                        .size(20.dp)
                        .clip(CircleShape)
                        .clickable { onDepthChange(1) }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(12.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Bleeding on probing (BOP) toggle
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = if (site.hasBleeding) Color(0xFFFFCDD2) else MedicalSurfaceVariant,
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .clickable { onToggleBop() }
            ) {
                Text(
                    text = if (site.hasBleeding) "BOP +" else "BOP -",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (site.hasBleeding) Color(0xFFB71C1C) else MedicalSlate,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun DentalComplianceFooter() {
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
                    text = "ISO 3950 & WHO Oral Health Standards Compliant",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Odontogram uses FDI Two-Digit designation, 5-surface anatomical segmentation, AAP/EFP 2018 periodontal classification, and automated WHO DMFT calculation.",
                    fontSize = 11.sp,
                    color = MedicalSlate,
                    lineHeight = 15.sp
                )
            }
        }
    }
}
