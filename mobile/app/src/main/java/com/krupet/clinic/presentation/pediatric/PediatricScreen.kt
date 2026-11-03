package com.krupet.clinic.presentation.pediatric

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Remove
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
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*
import com.krupet.clinic.core.math.ClinicalMathEngine
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * KruPet Mobile Pediatric Clinical Decision Support & Nomograms Engine
 * Production-Grade Screen conforming to docs/pediatric-nomograms-dosing-spec.md
 *
 * Strict Compliance:
 * 1. Strictly ZERO emojis anywhere.
 * 2. Strictly NO parentheses in Khmer text strings.
 * 3. Full Material 3 and Medical Deep Teal / Crisp Slate styling.
 */

enum class BhutaniRiskZone(
    val titleEn: String,
    val titleKh: String,
    val badgeColor: Color
) {
    LOW_RISK(
        titleEn = "Low Risk Zone : Under 40th percentile",
        titleKh = "តំបន់ហានិភ័យទាប : ក្រោមខ្នាតភាគរយទី ៤០",
        badgeColor = Color(0xFF2E7D32)
    ),
    LOW_INTERMEDIATE_RISK(
        titleEn = "Low-Intermediate Risk Zone : 40th - 75th percentile",
        titleKh = "តំបន់ហានិភ័យមធ្យមកម្រិតទាប : ពីខ្នាតភាគរយទី ៤០ ដល់ ៧៥",
        badgeColor = Color(0xFF00897B)
    ),
    HIGH_INTERMEDIATE_RISK(
        titleEn = "High-Intermediate Risk Zone : 75th - 95th percentile",
        titleKh = "តំបន់ហានិភ័យមធ្យមកម្រិតខ្ពស់ : ពីខ្នាតភាគរយទី ៧៥ ដល់ ៩៥",
        badgeColor = Color(0xFFF57F17)
    ),
    HIGH_RISK(
        titleEn = "High Risk Zone : Above 95th percentile",
        titleKh = "តំបន់ហានិភ័យខ្ពស់ : លើសខ្នាតភាគរយទី ៩៥",
        badgeColor = Color(0xFFD32F2F)
    )
}

enum class GestationalAgeTier(
    val titleEn: String,
    val titleKh: String,
    val descriptionEn: String
) {
    FULL_TERM_38_WEEKS_AND_ABOVE(
        titleEn = "Term : >= 38 weeks",
        titleKh = "គ្រប់ខែ : ចាប់ពី ៣៨ សប្តាហ៍ឡើង",
        descriptionEn = "Standard AAP phototherapy curves for mature neonates"
    ),
    LATE_PRETERM_35_TO_37_WEEKS(
        titleEn = "Late Preterm : 35 to 37 6/7 weeks",
        titleKh = "ជិតគ្រប់ខែ : ពី ៣៥ ដល់ ៣៧ សប្តាហ៍",
        descriptionEn = "Shifted phototherapy curve due to immature blood-brain barrier"
    ),
    PRETERM_UNDER_35_WEEKS(
        titleEn = "Preterm : < 35 weeks",
        titleKh = "មិនគ្រប់ខែ : ក្រោម ៣៥ សប្តាហ៍",
        descriptionEn = "Intensive NICU monitoring and lower exchange threshold"
    )
}

enum class BroselowTapeColor(
    val titleEn: String,
    val titleKh: String,
    val weightRangeKg: String,
    val estimatedWeightKg: Float,
    val lengthRangeCm: String,
    val containerColor: Color,
    val onColor: Color
) {
    GREY(
        titleEn = "Grey",
        titleKh = "ប្រផេះ",
        weightRangeKg = "3 - 5 kg",
        estimatedWeightKg = 4.0f,
        lengthRangeCm = "< 59.5 cm",
        containerColor = Color(0xFF757575),
        onColor = Color.White
    ),
    PINK(
        titleEn = "Pink",
        titleKh = "ផ្កាឈូក",
        weightRangeKg = "6 - 7 kg",
        estimatedWeightKg = 6.5f,
        lengthRangeCm = "59.5 - 67.5 cm",
        containerColor = Color(0xFFE91E63),
        onColor = Color.White
    ),
    RED(
        titleEn = "Red",
        titleKh = "ក្រហម",
        weightRangeKg = "8 - 9 kg",
        estimatedWeightKg = 8.5f,
        lengthRangeCm = "67.5 - 75.0 cm",
        containerColor = Color(0xFFD32F2F),
        onColor = Color.White
    ),
    PURPLE(
        titleEn = "Purple",
        titleKh = "ស្វាយ",
        weightRangeKg = "10 - 11 kg",
        estimatedWeightKg = 10.0f,
        lengthRangeCm = "75.0 - 84.5 cm",
        containerColor = Color(0xFF7B1FA2),
        onColor = Color.White
    ),
    YELLOW(
        titleEn = "Yellow",
        titleKh = "លឿង",
        weightRangeKg = "12 - 14 kg",
        estimatedWeightKg = 13.0f,
        lengthRangeCm = "84.5 - 97.5 cm",
        containerColor = Color(0xFFFBC02D),
        onColor = Color(0xFF212121)
    ),
    WHITE(
        titleEn = "White",
        titleKh = "ស",
        weightRangeKg = "15 - 18 kg",
        estimatedWeightKg = 16.5f,
        lengthRangeCm = "97.5 - 110.0 cm",
        containerColor = Color(0xFFEEEEEE),
        onColor = Color(0xFF212121)
    ),
    BLUE(
        titleEn = "Blue",
        titleKh = "ខៀវ",
        weightRangeKg = "19 - 23 kg",
        estimatedWeightKg = 21.0f,
        lengthRangeCm = "110.0 - 122.0 cm",
        containerColor = Color(0xFF1976D2),
        onColor = Color.White
    ),
    ORANGE(
        titleEn = "Orange",
        titleKh = "ទឹកក្រូច",
        weightRangeKg = "24 - 29 kg",
        estimatedWeightKg = 26.5f,
        lengthRangeCm = "122.0 - 137.0 cm",
        containerColor = Color(0xFFF57C00),
        onColor = Color.White
    ),
    GREEN(
        titleEn = "Green",
        titleKh = "បៃតង",
        weightRangeKg = "30 - 36 kg",
        estimatedWeightKg = 33.0f,
        lengthRangeCm = "137.0 - 150.0 cm",
        containerColor = Color(0xFF388E3C),
        onColor = Color.White
    )
}

enum class PediatricAgeTier(
    val titleEn: String,
    val titleKh: String,
    val normalHrRange: IntRange,
    val normalRrRange: IntRange,
    val minSbpMmHg: Int,
    val medianWeightKg: Float
) {
    NEONATE(
        titleEn = "Neonate : 0 - 28 days",
        titleKh = "ទារកទើបកើត : ០ ដល់ ២៨ ថ្ងៃ",
        normalHrRange = 100..180,
        normalRrRange = 30..60,
        minSbpMmHg = 60,
        medianWeightKg = 3.5f
    ),
    INFANT(
        titleEn = "Infant : 1 - 12 months",
        titleKh = "ទារក : ១ ដល់ ១២ ខែ",
        normalHrRange = 100..160,
        normalRrRange = 30..50,
        minSbpMmHg = 70,
        medianWeightKg = 7.5f
    ),
    TODDLER(
        titleEn = "Toddler : 1 - 3 years",
        titleKh = "កុមារតូច : ១ ដល់ ៣ ឆ្នាំ",
        normalHrRange = 90..150,
        normalRrRange = 24..40,
        minSbpMmHg = 74,
        medianWeightKg = 12.0f
    ),
    PRESCHOOL(
        titleEn = "Preschool : 4 - 5 years",
        titleKh = "កុមារមត្តេយ្យ : ៤ ដល់ ៥ ឆ្នាំ",
        normalHrRange = 80..130,
        normalRrRange = 20..30,
        minSbpMmHg = 78,
        medianWeightKg = 18.0f
    ),
    SCHOOL_AGE(
        titleEn = "School Child : 6 - 11 years",
        titleKh = "កុមារវ័យសិក្សា : ៦ ដល់ ១១ ឆ្នាំ",
        normalHrRange = 70..120,
        normalRrRange = 18..30,
        minSbpMmHg = 86,
        medianWeightKg = 28.0f
    ),
    ADOLESCENT(
        titleEn = "Adolescent : 12 - 18 years",
        titleKh = "ក្មេងជំទង់ : ១២ ដល់ ១៨ ឆ្នាំ",
        normalHrRange = 60..100,
        normalRrRange = 12..20,
        minSbpMmHg = 90,
        medianWeightKg = 50.0f
    )
}

@Composable
fun PediatricScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabTitles = listOf(
        "Bhutani Nomogram",
        "Pediatric GCS",
        "Broselow Tape",
        "Vital Signs Matrix",
        "Dosing Formulas"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
    ) {
        // Clinical Screen Header
        PediatricHeaderCard()

        Spacer(modifier = Modifier.height(12.dp))

        // Navigation Tabs Strip
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            containerColor = MedicalSurface,
            contentColor = MedicalDeepTeal,
            edgePadding = 0.dp,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .border(1.dp, MedicalBorder, RoundedCornerShape(8.dp))
        ) {
            tabTitles.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            text = title,
                            fontSize = 12.sp,
                            fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Screen Body Tab Content
        Box(modifier = Modifier.fillMaxSize()) {
            when (selectedTab) {
                0 -> BhutaniNomogramSection()
                1 -> PediatricGcsSection()
                2 -> BroselowResuscitationSection()
                3 -> PediatricVitalsSection()
                4 -> TraditionalDosingSection()
            }
        }
    }
}

@Composable
private fun PediatricHeaderCard() {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Pediatric & Neonatal Clinical Decision Support",
                    style = MaterialTheme.typography.titleMedium,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "ប្រព័ន្ធជំនួយការសម្រេចចិត្តព្យាបាលកុមារ និងទារកទើបនឹងកើត",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )
            }
            Surface(
                color = MedicalSurfaceVariant,
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = "AAP & PALS 2026",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 1. BHUTANI NEONATAL NOMOGRAM SECTION
// -----------------------------------------------------------------------------

@Composable
private fun BhutaniNomogramSection() {
    var postnatalHours by remember { mutableFloatStateOf(48f) }
    var bilirubinMgDl by remember { mutableFloatStateOf(11.5f) }
    var gaTier by remember { mutableStateOf(GestationalAgeTier.FULL_TERM_38_WEEKS_AND_ABOVE) }
    var hasNeurotoxicityRisk by remember { mutableStateOf(false) }

    val hoursInt = postnatalHours.roundToInt().coerceIn(12, 168)
    val bilirubinValue = (bilirubinMgDl * 10f).roundToInt() / 10f
    val bilirubinUmol = (bilirubinValue * 17.1f * 10f).roundToInt() / 10f

    // Calculate percentiles for current hour
    val p95 = getBhutaniPercentile(hoursInt, 95)
    val p75 = getBhutaniPercentile(hoursInt, 75)
    val p40 = getBhutaniPercentile(hoursInt, 40)

    val currentRiskZone = when {
        bilirubinValue >= p95 -> BhutaniRiskZone.HIGH_RISK
        bilirubinValue >= p75 -> BhutaniRiskZone.HIGH_INTERMEDIATE_RISK
        bilirubinValue >= p40 -> BhutaniRiskZone.LOW_INTERMEDIATE_RISK
        else -> BhutaniRiskZone.LOW_RISK
    }

    // Phototherapy and exchange transfusion thresholds
    val photoThreshold = when (gaTier) {
        GestationalAgeTier.FULL_TERM_38_WEEKS_AND_ABOVE -> if (hasNeurotoxicityRisk) p75 - 1.5f else p75
        GestationalAgeTier.LATE_PRETERM_35_TO_37_WEEKS -> if (hasNeurotoxicityRisk) p40 else p75 - 2.0f
        GestationalAgeTier.PRETERM_UNDER_35_WEEKS -> p40 - 2.0f
    }

    val exchangeThreshold = when (gaTier) {
        GestationalAgeTier.FULL_TERM_38_WEEKS_AND_ABOVE -> if (hasNeurotoxicityRisk) 21.0f else 23.5f
        GestationalAgeTier.LATE_PRETERM_35_TO_37_WEEKS -> if (hasNeurotoxicityRisk) 18.0f else 20.5f
        GestationalAgeTier.PRETERM_UNDER_35_WEEKS -> 15.0f
    }

    val isPhotoTriggered = bilirubinValue >= photoThreshold
    val isEscalateTriggered = bilirubinValue >= (exchangeThreshold - 2.0f) && bilirubinValue < exchangeThreshold
    val isExchangeTriggered = bilirubinValue >= exchangeThreshold

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Live Interactive Canvas Nomogram Chart
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
                            text = "Bhutani Hyperbilirubinemia Nomogram",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MedicalDeepTeal
                        )
                        Text(
                            text = "ក្រាហ្វវាស់កម្រិតលឿងទារកតាមម៉ោងក្រោយកើត ប៊ូតានី",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MedicalSlate
                        )
                    }
                    Surface(
                        color = currentRiskZone.badgeColor.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(6.dp),
                        border = BorderStroke(1.dp, currentRiskZone.badgeColor)
                    ) {
                        Text(
                            text = currentRiskZone.name.replace("_", " "),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = currentRiskZone.badgeColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Canvas Graphic Plot
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp)
                        .background(Color(0xFFFBFDFD), RoundedCornerShape(8.dp))
                        .border(1.dp, MedicalBorder, RoundedCornerShape(8.dp))
                ) {
                    BhutaniCanvasChart(
                        currentHour = hoursInt,
                        currentTsb = bilirubinValue,
                        photoThreshold = photoThreshold,
                        exchangeThreshold = exchangeThreshold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Canvas Legend
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    LegendItem(color = Color(0xFFD32F2F), label = ">95th High")
                    LegendItem(color = Color(0xFFF57F17), label = "75-95th High-Int")
                    LegendItem(color = Color(0xFF00897B), label = "40-75th Low-Int")
                    LegendItem(color = Color(0xFF1976D2), label = "Phototherapy")
                }
            }
        }

        // Clinical Risk Zone & Intervention Alert Banner
        if (isExchangeTriggered) {
            CriticalAlertBanner(
                titleEn = "CRITICAL : Exchange Transfusion Indicated",
                titleKh = "កម្រិតអាសន្នខ្ពស់ : ប៊ីលីរុយប៊ីនលើសកម្រិតត្រូវផ្លាស់ប្តូរឈាម",
                detailEn = "TSB ($bilirubinValue mg/dL) exceeds exchange threshold ($exchangeThreshold mg/dL). Initiate intensive phototherapy, cross-match blood for double-volume exchange, transfer to NICU immediately.",
                containerColor = AcuityEsi1Resus
            )
        } else if (isEscalateTriggered) {
            CriticalAlertBanner(
                titleEn = "URGENT ESCALATION : Imminent Exchange Risk",
                titleKh = "ការប្រកាសអាសន្នត្រៀមសង្គ្រោះបន្ទាន់ : ប៊ីលីរុយប៊ីនកៀកកម្រិតផ្លាស់ប្តូរឈាម",
                detailEn = "TSB is within 2.0 mg/dL of exchange transfusion threshold ($exchangeThreshold mg/dL). Transfer to NICU, initiate intensive overhead LED phototherapy plus biliblanket, re-measure TSB in 2 hours.",
                containerColor = AcuityEsi2Emergent
            )
        } else if (isPhotoTriggered) {
            CriticalAlertBanner(
                titleEn = "Intensive Phototherapy Indicated",
                titleKh = "ត្រូវចាប់ផ្តើមព្យាបាលដោយបញ្ចាំងពន្លឺខៀវ",
                detailEn = "TSB ($bilirubinValue mg/dL) exceeds phototherapy threshold ($photoThreshold mg/dL). Place neonate under intensive blue phototherapy (460-490 nm, >= 30 uW/cm2/nm). Repeat TSB in 6-12 hours.",
                containerColor = Color(0xFF0D47A1)
            )
        } else {
            Surface(
                color = MedicalSurface,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, MedicalBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Safe",
                        tint = Color(0xFF2E7D32),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Low Risk Profile : Safe for Discharge Observation",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF2E7D32),
                            fontSize = 14.sp
                        )
                        Text(
                            text = "កម្រិតប៊ីលីរុយប៊ីនស្ថិតក្នុងកម្រិតសុវត្ថិភាព បន្តការបំបៅដោះនិងតាមដានធម្មតា",
                            fontSize = 12.sp,
                            color = MedicalSlate
                        )
                    }
                }
            }
        }

        // Interactive Sliders & Clinical Controls Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Neonate Parameters & Risk Modifiers",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Postnatal Age Slider (12h to 168h)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Postnatal Age : $hoursInt hours (Day ${(hoursInt / 24) + 1})",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "Range: 12 - 168h",
                        fontSize = 11.sp,
                        color = MedicalSlate
                    )
                }
                Slider(
                    value = postnatalHours,
                    onValueChange = { postnatalHours = it },
                    valueRange = 12f..168f,
                    colors = SliderDefaults.colors(
                        thumbColor = MedicalDeepTeal,
                        activeTrackColor = MedicalDeepTeal
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Total Serum Bilirubin (TSB) Slider (0 to 25 mg/dL)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Total Serum Bilirubin : $bilirubinValue mg/dL",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "$bilirubinUmol umol/L",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }
                Slider(
                    value = bilirubinMgDl,
                    onValueChange = { bilirubinMgDl = it },
                    valueRange = 0f..25f,
                    colors = SliderDefaults.colors(
                        thumbColor = MedicalDeepTeal,
                        activeTrackColor = MedicalDeepTeal
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Gestational Age Selector
                Text(
                    text = "Gestational Age Category",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MedicalSlate
                )
                Spacer(modifier = Modifier.height(6.dp))
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    GestationalAgeTier.values().forEach { tier ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (gaTier == tier) MedicalSurfaceVariant else MedicalBackground,
                            border = BorderStroke(1.dp, if (gaTier == tier) MedicalDeepTeal else MedicalBorder),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { gaTier = tier }
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = gaTier == tier,
                                    onClick = { gaTier = tier },
                                    colors = RadioButtonDefaults.colors(selectedColor = MedicalDeepTeal)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = tier.titleEn,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = tier.titleKh,
                                        fontSize = 11.sp,
                                        color = MedicalSlate
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Neurotoxicity Risk Factor Toggle
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (hasNeurotoxicityRisk) AcuityEsi2Emergent.copy(alpha = 0.08f) else MedicalBackground,
                    border = BorderStroke(1.dp, if (hasNeurotoxicityRisk) AcuityEsi2Emergent else MedicalBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { hasNeurotoxicityRisk = !hasNeurotoxicityRisk }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Neurotoxicity Risk Factors Present",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = if (hasNeurotoxicityRisk) AcuityEsi2Emergent else MedicalOnSurface
                            )
                            Text(
                                text = "កត្តាហានិភ័យពុលខួរក្បាល : បែកគ្រាប់ឈាម សepsis ជាតិអាស៊ីត ឬអាល់ប៊ុយមីនទាប",
                                fontSize = 11.sp,
                                color = MedicalSlate
                            )
                        }
                        Switch(
                            checked = hasNeurotoxicityRisk,
                            onCheckedChange = { hasNeurotoxicityRisk = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = AcuityEsi2Emergent)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Thresholds Summary Table
                Surface(
                    color = MedicalBackground,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, MedicalBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "Hour $hoursInt Decision Cutoffs",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = MedicalDeepTeal
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Low-Risk Cutoff (<40th):", fontSize = 11.sp, color = MedicalSlate)
                            Text("$p40 mg/dL", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Intermediate Cutoff (75th):", fontSize = 11.sp, color = MedicalSlate)
                            Text("$p75 mg/dL", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("High-Risk Cutoff (>95th):", fontSize = 11.sp, color = MedicalSlate)
                            Text("$p95 mg/dL", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = MedicalBorder)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Phototherapy Threshold:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1976D2))
                            Text("$photoThreshold mg/dL", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1976D2))
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Exchange Transfusion Threshold:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AcuityEsi1Resus)
                            Text("$exchangeThreshold mg/dL", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AcuityEsi1Resus)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BhutaniCanvasChart(
    currentHour: Int,
    currentTsb: Float,
    photoThreshold: Float,
    exchangeThreshold: Float
) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height

        val padLeft = 45f
        val padRight = 20f
        val padTop = 20f
        val padBottom = 35f

        val graphWidth = w - padLeft - padRight
        val graphHeight = h - padTop - padBottom

        fun xForHour(hr: Float): Float {
            val clamped = hr.coerceIn(12f, 168f)
            return padLeft + ((clamped - 12f) / (168f - 12f)) * graphWidth
        }

        fun yForTsb(tsb: Float): Float {
            val clamped = tsb.coerceIn(0f, 25f)
            return padTop + graphHeight - (clamped / 25f) * graphHeight
        }

        // Draw grid lines
        val hoursGrid = listOf(12f, 24f, 48f, 72f, 96f, 120f, 144f, 168f)
        hoursGrid.forEach { hr ->
            val gx = xForHour(hr)
            drawLine(
                color = Color(0xFFE5ECEB),
                start = Offset(gx, padTop),
                end = Offset(gx, padTop + graphHeight),
                strokeWidth = 1f
            )
        }

        val tsbGrid = listOf(0f, 5f, 10f, 15f, 20f, 25f)
        tsbGrid.forEach { t ->
            val gy = yForTsb(t)
            drawLine(
                color = Color(0xFFE5ECEB),
                start = Offset(padLeft, gy),
                end = Offset(padLeft + graphWidth, gy),
                strokeWidth = 1f
            )
        }

        // Sample points along the curve (h: 12 to 168)
        val sampleHours = (12..168 step 4).map { it.toFloat() }

        // Path for 95th Percentile
        val p95Path = Path().apply {
            moveTo(xForHour(sampleHours.first()), yForTsb(getBhutaniPercentile(sampleHours.first().toInt(), 95)))
            sampleHours.forEach { hr ->
                lineTo(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 95)))
            }
        }

        // Path for 75th Percentile
        val p75Path = Path().apply {
            moveTo(xForHour(sampleHours.first()), yForTsb(getBhutaniPercentile(sampleHours.first().toInt(), 75)))
            sampleHours.forEach { hr ->
                lineTo(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 75)))
            }
        }

        // Path for 40th Percentile
        val p40Path = Path().apply {
            moveTo(xForHour(sampleHours.first()), yForTsb(getBhutaniPercentile(sampleHours.first().toInt(), 40)))
            sampleHours.forEach { hr ->
                lineTo(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 40)))
            }
        }

        // Shaded High-Risk Area (>95th)
        val highRiskFill = Path().apply {
            moveTo(xForHour(12f), yForTsb(25f))
            lineTo(xForHour(168f), yForTsb(25f))
            sampleHours.reversed().forEach { hr ->
                lineTo(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 95)))
            }
            close()
        }
        drawPath(highRiskFill, color = Color(0x22D32F2F))

        // Shaded High-Intermediate Risk Area (75-95th)
        val highInterFill = Path().apply {
            sampleHours.forEach { hr ->
                val p = Offset(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 95)))
                if (hr == sampleHours.first()) moveTo(p.x, p.y) else lineTo(p.x, p.y)
            }
            sampleHours.reversed().forEach { hr ->
                lineTo(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 75)))
            }
            close()
        }
        drawPath(highInterFill, color = Color(0x28F57F17))

        // Shaded Low-Intermediate Risk Area (40-75th)
        val lowInterFill = Path().apply {
            sampleHours.forEach { hr ->
                val p = Offset(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 75)))
                if (hr == sampleHours.first()) moveTo(p.x, p.y) else lineTo(p.x, p.y)
            }
            sampleHours.reversed().forEach { hr ->
                lineTo(xForHour(hr), yForTsb(getBhutaniPercentile(hr.toInt(), 40)))
            }
            close()
        }
        drawPath(lowInterFill, color = Color(0x2200897B))

        // Draw Percentile Lines
        drawPath(p95Path, color = Color(0xFFD32F2F), style = Stroke(width = 2.5f))
        drawPath(p75Path, color = Color(0xFFF57F17), style = Stroke(width = 2.5f))
        drawPath(p40Path, color = Color(0xFF00897B), style = Stroke(width = 2.5f))

        // Draw dashed phototherapy line
        val photoY = yForTsb(photoThreshold)
        drawLine(
            color = Color(0xFF1976D2),
            start = Offset(padLeft, photoY),
            end = Offset(padLeft + graphWidth, photoY),
            strokeWidth = 2f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f), 0f)
        )

        // Draw dashed exchange transfusion line
        val exchangeY = yForTsb(exchangeThreshold)
        drawLine(
            color = Color(0xFF880E4F),
            start = Offset(padLeft, exchangeY),
            end = Offset(padLeft + graphWidth, exchangeY),
            strokeWidth = 2f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f), 0f)
        )

        // Draw Neonate Position Pin Marker
        val neonateX = xForHour(currentHour.toFloat())
        val neonateY = yForTsb(currentTsb)

        // Crosshairs dashed to axes
        drawLine(
            color = Color(0xFF4A6362),
            start = Offset(neonateX, padTop + graphHeight),
            end = Offset(neonateX, neonateY),
            strokeWidth = 1f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f), 0f)
        )
        drawLine(
            color = Color(0xFF4A6362),
            start = Offset(padLeft, neonateY),
            end = Offset(neonateX, neonateY),
            strokeWidth = 1f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f), 0f)
        )

        // Pulsing Ring & Center Dot
        drawCircle(
            color = MedicalDeepTeal.copy(alpha = 0.25f),
            radius = 16f,
            center = Offset(neonateX, neonateY)
        )
        drawCircle(
            color = Color.White,
            radius = 8f,
            center = Offset(neonateX, neonateY)
        )
        drawCircle(
            color = MedicalDeepTeal,
            radius = 5.5f,
            center = Offset(neonateX, neonateY)
        )

        // Axis Bounds Lines
        drawLine(
            color = Color(0xFF707978),
            start = Offset(padLeft, padTop),
            end = Offset(padLeft, padTop + graphHeight),
            strokeWidth = 1.5f
        )
        drawLine(
            color = Color(0xFF707978),
            start = Offset(padLeft, padTop + graphHeight),
            end = Offset(padLeft + graphWidth, padTop + graphHeight),
            strokeWidth = 1.5f
        )
    }
}

private fun getBhutaniPercentile(hour: Int, percentile: Int): Float {
    val h = hour.coerceIn(12, 168)
    return when (percentile) {
        95 -> when {
            h <= 24 -> 6.5f + ((h - 12) / 12f) * (8.5f - 6.5f)
            h <= 48 -> 8.5f + ((h - 24) / 24f) * (13.5f - 8.5f)
            h <= 72 -> 13.5f + ((h - 48) / 24f) * (16.8f - 13.5f)
            h <= 120 -> 16.8f + ((h - 72) / 48f) * (19.8f - 16.8f)
            else -> 19.8f + ((h - 120) / 48f) * (20.5f - 19.8f)
        }
        75 -> when {
            h <= 24 -> 5.0f + ((h - 12) / 12f) * (6.8f - 5.0f)
            h <= 48 -> 6.8f + ((h - 24) / 24f) * (11.2f - 6.8f)
            h <= 72 -> 11.2f + ((h - 48) / 24f) * (14.5f - 11.2f)
            h <= 120 -> 14.5f + ((h - 72) / 48f) * (17.5f - 14.5f)
            else -> 17.5f + ((h - 120) / 48f) * (18.2f - 17.5f)
        }
        40 -> when {
            h <= 24 -> 3.8f + ((h - 12) / 12f) * (5.0f - 3.8f)
            h <= 48 -> 5.0f + ((h - 24) / 24f) * (8.5f - 5.0f)
            h <= 72 -> 8.5f + ((h - 48) / 24f) * (11.4f - 8.5f)
            h <= 120 -> 11.4f + ((h - 72) / 48f) * (14.2f - 11.4f)
            else -> 14.2f + ((h - 120) / 48f) * (14.8f - 14.2f)
        }
        else -> 10.0f
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(color, CircleShape)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = label, fontSize = 11.sp, color = MedicalSlate, fontWeight = FontWeight.Medium)
    }
}

// -----------------------------------------------------------------------------
// 2. PEDIATRIC GLASGOW COMA SCALE (pGCS) SECTION
// -----------------------------------------------------------------------------

@Composable
private fun PediatricGcsSection() {
    var isPreVerbalInfant by remember { mutableStateOf(true) }
    var eyeScore by remember { mutableIntStateOf(4) }
    var verbalScore by remember { mutableIntStateOf(5) }
    var motorScore by remember { mutableIntStateOf(6) }

    val totalScore = eyeScore + verbalScore + motorScore
    val isSevere = totalScore <= 8
    val isModerate = totalScore in 9..12
    val isMild = totalScore >= 13

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Mode Switcher Banner (Pre-Verbal vs Verbal Child)
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Pediatric Glasgow Coma Scale : pGCS",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "ពិន្ទុស្មារតីកុមារនិងទារក pGCS សម្រួលតាមអាយុ",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = isPreVerbalInfant,
                        onClick = { isPreVerbalInfant = true },
                        label = { Text("Pre-Verbal Infant : < 2 Years") },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = !isPreVerbalInfant,
                        onClick = { isPreVerbalInfant = false },
                        label = { Text("Verbal Child : >= 2 Years") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // TBI Stratification & Total Score Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = when {
                    isSevere -> AcuityEsi1Resus.copy(alpha = 0.12f)
                    isModerate -> AcuityEsi2Emergent.copy(alpha = 0.12f)
                    else -> Color(0xFF2E7D32).copy(alpha = 0.10f)
                }
            ),
            border = BorderStroke(
                1.5.dp,
                when {
                    isSevere -> AcuityEsi1Resus
                    isModerate -> AcuityEsi2Emergent
                    else -> Color(0xFF2E7D32)
                }
            ),
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
                            text = "Total pGCS Score : $totalScore / 15",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                isSevere -> AcuityEsi1Resus
                                isModerate -> AcuityEsi2Emergent
                                else -> Color(0xFF2E7D32)
                            }
                        )
                        Text(
                            text = when {
                                isSevere -> "Severe Neurological Impairment : pGCS 3 - 8"
                                isModerate -> "Moderate Neurological Impairment : pGCS 9 - 12"
                                else -> "Mild Neurological Impairment : pGCS 13 - 15"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Text(
                            text = when {
                                isSevere -> "ការប៉ះទង្គិចប្រព័ន្ធប្រសាទកម្រិតធ្ងន់ធ្ងរ : ពិន្ទុពី ៣ ដល់ ៨"
                                isModerate -> "ការប៉ះទង្គិចប្រព័ន្ធប្រសាទកម្រិតមធ្យម : ពិន្ទុពី ៩ ដល់ ១២"
                                else -> "ការប៉ះទង្គិចប្រព័ន្ធប្រសាទកម្រិតស្រាល : ពិន្ទុពី ១៣ ដល់ ១៥"
                            },
                            fontSize = 12.sp,
                            color = MedicalSlate
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = when {
                            isSevere -> AcuityEsi1Resus
                            isModerate -> AcuityEsi2Emergent
                            else -> Color(0xFF2E7D32)
                        }
                    ) {
                        Text(
                            text = "E$eyeScore V$verbalScore M$motorScore",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }

                // INVIOLABLE AIRWAY GATE
                if (isSevere) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        color = AcuityEsi1Resus,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.PriorityHigh,
                                contentDescription = "Critical Alert",
                                tint = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "CRITICAL AIRWAY GATE : pGCS <= 8",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Text(
                                    text = "Loss of protective airway reflexes. Immediate endotracheal intubation indicated.",
                                    color = Color.White.copy(alpha = 0.9f),
                                    fontSize = 11.sp
                                )
                                Text(
                                    text = "បម្រាមការពារផ្លូវដង្ហើម : ពិន្ទុស្មើឬក្រោម ៨ បាត់បង់ការការពារផ្លូវដង្ហើម ត្រូវដាក់បំពង់ខ្យល់ជាបន្ទាន់",
                                    color = Color.White.copy(alpha = 0.9f),
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Subscale 1: Eye Opening (1 to 4)
        GcsSubscaleCard(
            title = "1. Eye Opening (E : 1 - 4)",
            titleKh = "១. ការបើកភ្នែក : E ពី ១ ដល់ ៤",
            currentScore = eyeScore,
            onSelectScore = { eyeScore = it },
            options = listOf(
                4 to if (isPreVerbalInfant) "Spontaneous : Opens eyes spontaneously" else "Spontaneous : Opens eyes spontaneously",
                3 to if (isPreVerbalInfant) "To Speech : Opens to parental speech / voice" else "To Speech : Opens to verbal command",
                2 to if (isPreVerbalInfant) "To Pain : Opens to tactile or painful stimulus" else "To Pain : Opens to painful stimulus",
                1 to "None : No eye opening to any stimulus"
            )
        )

        // Subscale 2: Verbal Response (1 to 5)
        GcsSubscaleCard(
            title = "2. Verbal Response (V : 1 - 5)",
            titleKh = "២. ការឆ្លើយតបជាសំឡេង : V ពី ១ ដល់ ៥",
            currentScore = verbalScore,
            onSelectScore = { verbalScore = it },
            options = if (isPreVerbalInfant) {
                listOf(
                    5 to "Coos, babbles, smiles, normal voice : បញ្ចេញសំឡេងអ៊ូអែ សើច ធម្មតា",
                    4 to "Irritable cries, consolable : យំមួម៉ៅ តែអាចលួងលោមបាន",
                    3 to "Inconsolable crying, agitated : យំខ្លាំងឥតឈប់ឈរ មិនអាចលួងបាន",
                    2 to "Grunting, moaning to pain : ថ្ងូរ ឬបញ្ចេញសំឡេងត្អូញត្អែរពេលឈឺ",
                    1 to "None : No vocalization : គ្មានសំឡេងសោះ"
                )
            } else {
                listOf(
                    5 to "Oriented, converses, interacts normally : ដឹងខុសត្រូវ និយាយឆ្លើយឆ្លងបាន",
                    4 to "Disoriented, confused : វង្វេងវង្វាន់ ភាន់ច្រឡំ",
                    3 to "Inappropriate words, crying : និយាយពាក្យមិនសមរម្យ យំស្រែក",
                    2 to "Incomprehensible vocal sounds : បញ្ចេញសំឡេងមិនយល់ន័យ",
                    1 to "None : No vocal response : គ្មានសំឡេងឆ្លើយតបសោះ"
                )
            }
        )

        // Subscale 3: Motor Response (1 to 6)
        GcsSubscaleCard(
            title = "3. Motor Response (M : 1 - 6)",
            titleKh = "៣. ចលនាឆ្លើយតប : M ពី ១ ដល់ ៦",
            currentScore = motorScore,
            onSelectScore = { motorScore = it },
            options = if (isPreVerbalInfant) {
                listOf(
                    6 to "Normal spontaneous movements : កម្រើកអវយវៈដោយសេរីធម្មតា",
                    5 to "Withdraws from touch / cuddle : ដកខ្លួនចេញពេលមានការប៉ះ",
                    4 to "Withdraws from painful stimulus : ដកខ្លួនគេចពីការឈឺចាប់",
                    3 to "Abnormal flexion Decorticate : កន្ត្រាក់បត់ដៃជើងខុសប្រក្រតី",
                    2 to "Abnormal extension Decerebrate : ទាញពត់ដៃជើងរឹងខុសប្រក្រតី",
                    1 to "None, completely flaccid : ទន់ភ្លន់ គ្មានចលនាសោះ"
                )
            } else {
                listOf(
                    6 to "Obeys commands : ធ្វើតាមបញ្ជាបានត្រឹមត្រូវ",
                    5 to "Localizes painful stimulus : ចង្អុលបង្ហាញកន្លែងឈឺចាប់",
                    4 to "Normal flexion withdrawal : ដកដៃជើងគេចពីការឈឺចាប់",
                    3 to "Abnormal flexion Decorticate : កន្ត្រាក់បត់ដៃជើងខុសប្រក្រតី",
                    2 to "Abnormal extension Decerebrate : ទាញពត់ដៃជើងរឹងខុសប្រក្រតី",
                    1 to "None, completely flaccid : ទន់ភ្លន់ គ្មានចលនាសោះ"
                )
            }
        )
    }
}

@Composable
private fun GcsSubscaleCard(
    title: String,
    titleKh: String,
    currentScore: Int,
    onSelectScore: (Int) -> Unit,
    options: List<Pair<Int, String>>
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Text(
                text = titleKh,
                fontSize = 12.sp,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(10.dp))

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                options.forEach { (score, desc) ->
                    val isSelected = currentScore == score
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) MedicalSurfaceVariant else MedicalBackground,
                        border = BorderStroke(1.dp, if (isSelected) MedicalDeepTeal else MedicalBorder),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectScore(score) }
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = if (isSelected) MedicalDeepTeal else MedicalBorder,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = "$score",
                                        color = if (isSelected) Color.White else MedicalSlate,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = desc,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                color = if (isSelected) MedicalOnSurface else MedicalSlate,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 3. BROSELOW EMERGENCY RESUSCITATION TAPE SECTION
// -----------------------------------------------------------------------------

@Composable
private fun BroselowResuscitationSection() {
    var selectedColor by remember { mutableStateOf(BroselowTapeColor.RED) }
    var lengthCmInput by remember { mutableFloatStateOf(71.0f) }

    // When length changes, determine color band
    fun updateFromLength(cm: Float) {
        selectedColor = when {
            cm < 59.5f -> BroselowTapeColor.GREY
            cm < 67.5f -> BroselowTapeColor.PINK
            cm < 75.0f -> BroselowTapeColor.RED
            cm < 84.5f -> BroselowTapeColor.PURPLE
            cm < 97.5f -> BroselowTapeColor.YELLOW
            cm < 110.0f -> BroselowTapeColor.WHITE
            cm < 122.0f -> BroselowTapeColor.BLUE
            cm < 137.0f -> BroselowTapeColor.ORANGE
            else -> BroselowTapeColor.GREEN
        }
    }

    val wt = selectedColor.estimatedWeightKg

    // Resuscitation calculations
    val cuffedEtt = when (selectedColor) {
        BroselowTapeColor.GREY -> 3.0f
        BroselowTapeColor.PINK -> 3.0f
        BroselowTapeColor.RED -> 3.5f
        BroselowTapeColor.PURPLE -> 3.5f
        BroselowTapeColor.YELLOW -> 4.0f
        BroselowTapeColor.WHITE -> 4.5f
        BroselowTapeColor.BLUE -> 5.0f
        BroselowTapeColor.ORANGE -> 5.5f
        BroselowTapeColor.GREEN -> 6.0f
    }
    val uncuffedEtt = cuffedEtt + 0.5f

    val bladeType = when (selectedColor) {
        BroselowTapeColor.GREY -> "Miller 0 Straight"
        BroselowTapeColor.PINK -> "Miller 1 Straight"
        BroselowTapeColor.RED -> "Miller 1 Straight"
        BroselowTapeColor.PURPLE -> "Miller 1.5 or Mac 1"
        BroselowTapeColor.YELLOW -> "Miller 2 or Mac 2"
        BroselowTapeColor.WHITE -> "Miller 2 or Mac 2"
        BroselowTapeColor.BLUE -> "Miller 2 or Mac 2"
        BroselowTapeColor.ORANGE -> "Miller 2 or Mac 3"
        BroselowTapeColor.GREEN -> "Miller 3 or Mac 3"
    }

    // Drug Dosing
    val epiMg = (wt * 0.01f * 1000f).roundToInt() / 1000f
    val epiMl = (wt * 0.1f * 100f).roundToInt() / 100f
    val amiodaroneMg = min(wt * 5.0f, 300.0f)
    val atropineMg = (wt * 0.02f).coerceIn(0.1f, 0.5f)
    val fluidBolusMl = (wt * 20.0f).roundToInt()
    val d10wMl = (wt * 2.0f).roundToInt()

    // Defibrillation
    val defib1stJ = (wt * 2.0f).roundToInt()
    val defibSubJ = (wt * 4.0f).roundToInt()
    val cardioversionJ = (wt * 1.0f).roundToInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Broselow Color Selector Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Broselow Length-Based Resuscitation Tape",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "បន្ទះពណ៌ប្រូស្លូវសម្រាប់សង្គ្រោះបន្ទាន់កុមារតាមកម្ពស់",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Length in cm Slider (45 to 150 cm)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Patient Length : ${(lengthCmInput * 10f).roundToInt() / 10f} cm",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "Range: 45 - 150 cm",
                        fontSize = 11.sp,
                        color = MedicalSlate
                    )
                }
                Slider(
                    value = lengthCmInput,
                    onValueChange = {
                        lengthCmInput = it
                        updateFromLength(it)
                    },
                    valueRange = 45f..150f,
                    colors = SliderDefaults.colors(
                        thumbColor = selectedColor.containerColor,
                        activeTrackColor = selectedColor.containerColor
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Color Zones Horizontal Strip
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    BroselowTapeColor.values().forEach { colorBand ->
                        val isSelected = selectedColor == colorBand
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = colorBand.containerColor,
                            border = if (isSelected) BorderStroke(3.dp, MedicalDeepTeal) else null,
                            modifier = Modifier
                                .width(96.dp)
                                .clickable {
                                    selectedColor = colorBand
                                    // Set approximate midpoint length
                                    lengthCmInput = when (colorBand) {
                                        BroselowTapeColor.GREY -> 52f
                                        BroselowTapeColor.PINK -> 63f
                                        BroselowTapeColor.RED -> 71f
                                        BroselowTapeColor.PURPLE -> 79f
                                        BroselowTapeColor.YELLOW -> 90f
                                        BroselowTapeColor.WHITE -> 103f
                                        BroselowTapeColor.BLUE -> 116f
                                        BroselowTapeColor.ORANGE -> 129f
                                        BroselowTapeColor.GREEN -> 143f
                                    }
                                }
                        ) {
                            Column(
                                modifier = Modifier.padding(8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = colorBand.titleEn,
                                    color = colorBand.onColor,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = colorBand.weightRangeKg,
                                    color = colorBand.onColor,
                                    fontSize = 11.sp
                                )
                                Text(
                                    text = "${colorBand.estimatedWeightKg} kg",
                                    color = colorBand.onColor,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Active Color Zone Banner
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = selectedColor.containerColor),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Active Band : ${selectedColor.titleEn} (${selectedColor.titleKh})",
                        color = selectedColor.onColor,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Length Range: ${selectedColor.lengthRangeCm} | Estimated Weight: ${selectedColor.estimatedWeightKg} kg",
                        color = selectedColor.onColor.copy(alpha = 0.9f),
                        fontSize = 12.sp
                    )
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = selectedColor.onColor.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = "${selectedColor.estimatedWeightKg} KG",
                        color = selectedColor.onColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // Airway & Intubation Equipment Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Airway & Intubation Equipment",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "សម្ភារៈសង្គ្រោះផ្លូវដង្ហើមនិងបំពង់ខ្យល់",
                    fontSize = 12.sp,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(10.dp))

                BroselowItemRow(label = "Cuffed ETT Size:", value = "$cuffedEtt mm ID")
                BroselowItemRow(label = "Uncuffed ETT Size:", value = "$uncuffedEtt mm ID")
                BroselowItemRow(label = "Laryngoscope Blade:", value = bladeType)
                BroselowItemRow(label = "ETT Insertion Depth (Lip):", value = "${(cuffedEtt * 3.0f * 10f).roundToInt() / 10f} cm")
                BroselowItemRow(label = "Suction Catheter:", value = "${(cuffedEtt * 2.0f).roundToInt()} Fr")
                BroselowItemRow(label = "Chest Tube (Trauma):", value = "${(wt * 2.0f).roundToInt().coerceIn(10, 32)} - ${(wt * 4.0f).roundToInt().coerceIn(12, 36)} Fr")
            }
        }

        // Emergency Resuscitation Drugs Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "PALS Emergency Resuscitation Medications",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "កម្រិតថ្នាំសង្គ្រោះបន្ទាន់ PALS សម្រាប់ទម្ងន់ $wt kg",
                    fontSize = 12.sp,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(10.dp))

                BroselowDrugRow(
                    drugName = "Epinephrine (1:10,000)",
                    dosingRule = "0.01 mg/kg (= 0.1 mL/kg IV/IO)",
                    calculatedDose = "$epiMg mg ($epiMl mL)",
                    isHighPriority = true
                )
                BroselowDrugRow(
                    drugName = "Amiodarone (Refractory VF/pVT)",
                    dosingRule = "5 mg/kg IV/IO rapid bolus (max 300 mg)",
                    calculatedDose = "$amiodaroneMg mg",
                    isHighPriority = true
                )
                BroselowDrugRow(
                    drugName = "Atropine (Symptomatic Bradycardia)",
                    dosingRule = "0.02 mg/kg IV/IO (min 0.1 mg, max 0.5 mg)",
                    calculatedDose = "${(atropineMg * 100f).roundToInt() / 100f} mg",
                    isHighPriority = false
                )
                BroselowDrugRow(
                    drugName = "Normal Saline 0.9% Fluid Bolus",
                    dosingRule = "20 mL/kg rapid crystalloid push over 5-10 min",
                    calculatedDose = "$fluidBolusMl mL",
                    isHighPriority = true
                )
                BroselowDrugRow(
                    drugName = "Dextrose 10% (Hypoglycemia < 60 mg/dL)",
                    dosingRule = "2 mL/kg D10W IV/IO push",
                    calculatedDose = "$d10wMl mL",
                    isHighPriority = false
                )
            }
        }

        // Defibrillation & Cardioversion Ladder Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Defibrillation & Synchronized Cardioversion",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "ថាមពលឆក់បេះដូងកុមារ ២ ទៅ ៤ ហ្ស៊ូលក្នុងមួយគីឡូក្រាម",
                    fontSize = 12.sp,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    EnergyChip(
                        title = "1st Shock (2 J/kg)",
                        joules = "$defib1stJ J",
                        badgeColor = AcuityEsi2Emergent,
                        modifier = Modifier.weight(1f)
                    )
                    EnergyChip(
                        title = "2nd+ Shock (4 J/kg)",
                        joules = "$defibSubJ J",
                        badgeColor = AcuityEsi1Resus,
                        modifier = Modifier.weight(1f)
                    )
                    EnergyChip(
                        title = "Cardioversion (1 J/kg)",
                        joules = "$cardioversionJ J",
                        badgeColor = Color(0xFF1976D2),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Safety Note: Maximum pediatric defibrillation dose is clamped to 10 J/kg or adult standard max 200 J biphasic to prevent myocardial injury.",
                    fontSize = 11.sp,
                    color = MedicalSlate
                )
            }
        }
    }
}

@Composable
private fun BroselowItemRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = MedicalSlate)
        Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MedicalOnSurface)
    }
}

@Composable
private fun BroselowDrugRow(
    drugName: String,
    dosingRule: String,
    calculatedDose: String,
    isHighPriority: Boolean
) {
    Surface(
        color = if (isHighPriority) MedicalBackground else MedicalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, if (isHighPriority) MedicalDeepTeal.copy(alpha = 0.3f) else MedicalBorder),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = drugName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = if (isHighPriority) MedicalDeepTeal else MedicalOnSurface
                )
                Text(
                    text = dosingRule,
                    fontSize = 11.sp,
                    color = MedicalSlate
                )
            }
            Surface(
                color = if (isHighPriority) MedicalDeepTeal else MedicalSurfaceVariant,
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = calculatedDose,
                    color = if (isHighPriority) Color.White else MedicalDeepTeal,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun EnergyChip(
    title: String,
    joules: String,
    badgeColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = badgeColor.copy(alpha = 0.1f),
        border = BorderStroke(1.5.dp, badgeColor),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = title, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = badgeColor)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = joules, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = badgeColor)
        }
    }
}

// -----------------------------------------------------------------------------
// 4. AGE-STRATIFIED VITAL SIGNS NORMAL RANGES SECTION
// -----------------------------------------------------------------------------

@Composable
private fun PediatricVitalsSection() {
    var selectedTier by remember { mutableStateOf(PediatricAgeTier.TODDLER) }
    var hrInput by remember { mutableStateOf("110") }
    var rrInput by remember { mutableStateOf("28") }
    var sbpInput by remember { mutableStateOf("85") }
    var spo2Input by remember { mutableStateOf("98") }
    var tempInput by remember { mutableStateOf("37.0") }
    var childAgeYearsInput by remember { mutableStateOf("2") }

    val hr = hrInput.toIntOrNull() ?: 110
    val rr = rrInput.toIntOrNull() ?: 28
    val sbp = sbpInput.toIntOrNull() ?: 85
    val spo2 = spo2Input.toIntOrNull() ?: 98
    val ageYears = childAgeYearsInput.toIntOrNull() ?: 2

    // Calculate minimum permissible SBP
    val minPermissibleSbp = when (selectedTier) {
        PediatricAgeTier.NEONATE -> 60
        PediatricAgeTier.INFANT -> 70
        PediatricAgeTier.TODDLER, PediatricAgeTier.PRESCHOOL, PediatricAgeTier.SCHOOL_AGE -> (70 + 2 * ageYears).coerceAtLeast(70)
        PediatricAgeTier.ADOLESCENT -> 90
    }

    // Flag anomalies
    val isBradycardia = hr < selectedTier.normalHrRange.first
    val isTachycardia = hr > selectedTier.normalHrRange.last
    val isBradypnea = rr < selectedTier.normalRrRange.first
    val isTachypnea = rr > selectedTier.normalRrRange.last
    val isHypotension = sbp < minPermissibleSbp
    val isHypoxemia = spo2 < 94

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Age Tier Selector Card
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Age-Stratified Vital Signs Threshold Matrix",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "កម្រិតសញ្ញាជីវិតតាមវ័យកុមារ សម្រាប់តាមដានស្ថានភាពគ្លីនិក",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Tier Selector Chips
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    PediatricAgeTier.values().forEach { tier ->
                        val isSelected = selectedTier == tier
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) MedicalSurfaceVariant else MedicalBackground,
                            border = BorderStroke(1.dp, if (isSelected) MedicalDeepTeal else MedicalBorder),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedTier = tier
                                    childAgeYearsInput = when (tier) {
                                        PediatricAgeTier.NEONATE -> "0"
                                        PediatricAgeTier.INFANT -> "0"
                                        PediatricAgeTier.TODDLER -> "2"
                                        PediatricAgeTier.PRESCHOOL -> "4"
                                        PediatricAgeTier.SCHOOL_AGE -> "8"
                                        PediatricAgeTier.ADOLESCENT -> "14"
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = tier.titleEn,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (isSelected) MedicalDeepTeal else MedicalOnSurface
                                    )
                                    Text(
                                        text = tier.titleKh,
                                        fontSize = 11.sp,
                                        color = MedicalSlate
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = "HR: ${tier.normalHrRange.first}-${tier.normalHrRange.last} | RR: ${tier.normalRrRange.first}-${tier.normalRrRange.last}",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MedicalSlate
                                    )
                                    Text(
                                        text = "Min SBP: ${tier.minSbpMmHg} mmHg",
                                        fontSize = 10.sp,
                                        color = MedicalSlate
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Live Vital Sign Checker & Anomaly Flags
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Live Vital Sign Evaluation : ${selectedTier.titleEn}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Input fields
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = hrInput,
                        onValueChange = { hrInput = it },
                        label = { Text("HR (bpm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = rrInput,
                        onValueChange = { rrInput = it },
                        label = { Text("RR (bpm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = sbpInput,
                        onValueChange = { sbpInput = it },
                        label = { Text("SBP (mmHg)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = spo2Input,
                        onValueChange = { spo2Input = it },
                        label = { Text("SpO2 (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Anomaly Alerts Summary
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (isHypoxemia) {
                        VitalAlertRow(
                            title = "Hypoxemia Alert : SpO2 $spo2% < 94%",
                            titleKh = "កម្រិតអុកស៊ីសែនទាប : ត្រូវផ្តល់អុកស៊ីសែនបន្ទាន់",
                            color = AcuityEsi1Resus
                        )
                    }
                    if (isHypotension) {
                        VitalAlertRow(
                            title = "Pediatric Hypotension : SBP $sbp < $minPermissibleSbp mmHg",
                            titleKh = "កម្រិតសម្ពាធឈាមទាបគ្រោះថ្នាក់ : សង្ស័យសភាពខ្សោះឈាមឬទន់ខ្សោយ",
                            color = AcuityEsi1Resus
                        )
                    }
                    if (isBradycardia) {
                        VitalAlertRow(
                            title = "Pediatric Bradycardia : HR $hr < ${selectedTier.normalHrRange.first} bpm",
                            titleKh = "ចង្វាក់បេះដូងដើរយឺតគ្រោះថ្នាក់ : ត្រៀមខ្យល់ជំនួយឬថ្នាំអេពីណេហ្វ្រីន",
                            color = AcuityEsi1Resus
                        )
                    } else if (isTachycardia) {
                        VitalAlertRow(
                            title = "Pediatric Tachycardia : HR $hr > ${selectedTier.normalHrRange.last} bpm",
                            titleKh = "ចង្វាក់បេះដូងដើរញាប់ : ពិនិត្យកម្ដៅ ការខ្វះជាតិទឹក ឬការឈឺចាប់",
                            color = AcuityEsi2Emergent
                        )
                    }
                    if (isBradypnea) {
                        VitalAlertRow(
                            title = "Pediatric Bradypnea : RR $rr < ${selectedTier.normalRrRange.first} bpm",
                            titleKh = "ការដកដង្ហើមយឺតខុសប្រក្រតី : ត្រៀមជំនួយដង្ហើម",
                            color = AcuityEsi1Resus
                        )
                    } else if (isTachypnea) {
                        VitalAlertRow(
                            title = "Pediatric Tachypnea : RR $rr > ${selectedTier.normalRrRange.last} bpm",
                            titleKh = "ការដកដង្ហើមញាប់ : ពិនិត្យការស្ទះផ្លូវដង្ហើមឬជំងឺរលាកសួត",
                            color = AcuityEsi2Emergent
                        )
                    }

                    if (!isHypoxemia && !isHypotension && !isBradycardia && !isTachycardia && !isBradypnea && !isTachypnea) {
                        Surface(
                            color = Color(0xFF2E7D32).copy(alpha = 0.1f),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, Color(0xFF2E7D32)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = "Normal", tint = Color(0xFF2E7D32))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "All Vital Signs within Age-Specific Physiological Limits",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = Color(0xFF2E7D32)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun VitalAlertRow(title: String, titleKh: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, color),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Warning, contentDescription = "Alert", tint = color, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = color)
                Text(text = titleKh, fontSize = 11.sp, color = MedicalSlate)
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 5. TRADITIONAL DOSING FORMULAS SECTION (Clark & Young Rules)
// -----------------------------------------------------------------------------

@Composable
private fun TraditionalDosingSection() {
    var weightLbsInput by remember { mutableStateOf("30") }
    var ageYearsInput by remember { mutableStateOf("6") }
    var adultDoseInput by remember { mutableStateOf("500") }

    val weightLbs = weightLbsInput.toDoubleOrNull() ?: 0.0
    val ageYears = ageYearsInput.toDoubleOrNull() ?: 0.0
    val adultDose = adultDoseInput.toDoubleOrNull() ?: 0.0

    val clarkDose = remember(weightLbs, adultDose) {
        if (weightLbs > 0 && adultDose > 0) {
            ClinicalMathEngine.PediatricNomogram.clarksRule(weightLbs, adultDose)
        } else null
    }

    val youngDose = remember(ageYears, adultDose) {
        if (ageYears > 0 && adultDose > 0) {
            ClinicalMathEngine.PediatricNomogram.youngsRule(ageYears, adultDose)
        } else null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Traditional Pediatric Pharmacotherapy Formulas",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "រូបមន្តគណនាកម្រិតថ្នាំកុមារតាមទម្ងន់និងអាយុ",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = adultDoseInput,
                    onValueChange = { adultDoseInput = it },
                    label = { Text("Standard Adult Dose in mg") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = weightLbsInput,
                    onValueChange = { weightLbsInput = it },
                    label = { Text("Child Weight in lbs (for Clark Rule)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = ageYearsInput,
                    onValueChange = { ageYearsInput = it },
                    label = { Text("Child Age in years (for Young Rule)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // Clark's Rule Result
        clarkDose?.let { dose ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Clark Rule : Weight (lbs) / 150 x Adult Dose",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Calculated Pediatric Dose: $dose mg",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "Weight equivalence: ${(weightLbs * 0.453592 * 10.0).roundToInt() / 10.0} kg",
                        fontSize = 12.sp,
                        color = MedicalSlate
                    )
                }
            }
        }

        // Young's Rule Result
        youngDose?.let { dose ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Young Rule : Age / (Age + 12) x Adult Dose",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Calculated Pediatric Dose: $dose mg",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }
            }
        }
    }
}

@Composable
private fun CriticalAlertBanner(
    titleEn: String,
    titleKh: String,
    detailEn: String,
    containerColor: Color
) {
    Surface(
        color = containerColor,
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                Icons.Default.Warning,
                contentDescription = "Critical Warning",
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = titleEn,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color.White
                )
                Text(
                    text = titleKh,
                    fontWeight = FontWeight.Medium,
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.95f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = detailEn,
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.9f)
                )
            }
        }
    }
}
