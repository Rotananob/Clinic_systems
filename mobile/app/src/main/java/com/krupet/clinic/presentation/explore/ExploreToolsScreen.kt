package com.krupet.clinic.presentation.explore

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.i18n.I18nManager

data class ClinicalToolItem(
    val id: String,
    val category: String,
    val minTier: String,
    val color: Color,
    val titleKh: String,
    val titleEn: String,
    val descKh: String,
    val descEn: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreToolsScreen(
    currentTier: String = "FREE",
    onToolClick: (ClinicalToolItem) -> Unit = {},
    onUpgradeClick: (String) -> Unit = {}
) {
    var selectedCategory by remember { mutableStateOf("ALL") }
    val isKhmer = I18nManager.isKhmer()

    val tools = remember {
        listOf(
            ClinicalToolItem(
                id = "triage",
                category = "CLINICAL",
                minTier = "FREE",
                color = Color(0xFF004D40),
                titleKh = "ប្រព័ន្ធវាយតម្លៃបន្ទាន់ Triage ESI v4",
                titleEn = "Emergency Triage ESI v4 & NEWS2",
                descKh = "គណនាពិន្ទុ NEWS2 និងចាត់ថ្នាក់កម្រិតសង្គ្រោះបន្ទាន់ ESI 1 ដល់ ESI 5",
                descEn = "Automated NEWS2 score & ESI 1-5 triage acuity classification"
            ),
            ClinicalToolItem(
                id = "telemetry",
                category = "CLINICAL",
                minTier = "FREE",
                color = Color(0xFF00C853),
                titleKh = "ម៉ូនីទ័រតាមដានរលកបេះដូង Bedside ECG",
                titleEn = "Bedside ECG Telemetry & Vitals",
                descKh = "រលកបេះដូង 60 FPS Lead II, SpO2, NIBP និងម៉ាស៊ីនគិត Infusion Pump",
                descEn = "Real-time 60 FPS Lead II waveform, SpO2, NIBP, and infusion pump calculator"
            ),
            ClinicalToolItem(
                id = "ward",
                category = "INPATIENT",
                minTier = "FREE",
                color = Color(0xFF0288D1),
                titleKh = "គ្រប់គ្រងគ្រែសម្រាកពេទ្យ Ward Bed Census",
                titleEn = "Ward Bed Census & SBAR Handover",
                descKh = "តាមដានគ្រែសម្រាក IPD 40 គ្រែ, Fluid Balance Net និងរបាយការណ៍ SBAR",
                descEn = "40 IPD bed status tracking, fluid balance net, and SBAR handover"
            ),
            ClinicalToolItem(
                id = "khqr_pos",
                category = "CLINICAL",
                minTier = "FREE",
                color = Color(0xFFE21A1A),
                titleKh = "ទូទាត់ប្រាក់ Bakong KHQR POS",
                titleEn = "Bakong KHQR Dual-Currency POS",
                descKh = "បង្កើត Dynamic KHQR ភ្លាមៗ រូបិយប័ណ្ណ KHR និង USD ជាមួយ ABA Payway",
                descEn = "Instant dynamic KHQR generation in USD/KHR with official ABA Payway bridge"
            ),
            ClinicalToolItem(
                id = "dental",
                category = "CLINICAL",
                minTier = "PRO_8",
                color = Color(0xFF00838F),
                titleKh = "គំនូសធ្មេញ FDI 32-Tooth Odontogram",
                titleEn = "FDI 32-Tooth Dental Odontogram",
                descKh = "គំនូសធ្មេញ 32 ធ្មេញមនុស្សពេញវ័យ និង 20 ធ្មេញកុមារ ជាមួយ DMFT Index",
                descEn = "Adult 32-tooth and pediatric 20-tooth charting with WHO DMFT index"
            ),
            ClinicalToolItem(
                id = "pacs",
                category = "DIAGNOSTICS",
                minTier = "PRO_8",
                color = Color(0xFF1565C0),
                titleKh = "រូបភាពវេជ្ជសាស្ត្រ WebGL PACS DICOM",
                titleEn = "WebGL PACS DICOM Radiography Viewer",
                descKh = "មើល X-Ray, CT, MRI, Caliper វាស់ប្រវែង និង Presets សាច់ទន់ និងឆ្អឹង",
                descEn = "High-performance DICOM viewer with windowing presets and caliper measurements"
            ),
            ClinicalToolItem(
                id = "lis_lab",
                category = "DIAGNOSTICS",
                minTier = "PRO_8",
                color = Color(0xFFD84315),
                titleKh = "មន្ទីរពិសោធន៍ LIS Panic Lab Alerts",
                titleEn = "LIS Panic Laboratory Alerts",
                descKh = "ជូនដំណឹងតម្លៃអាសន្ន Troponin, Potassium និងកត់ត្រាការទទួលដំណឹងផ្ទាល់មាត់",
                descEn = "Automated critical panic lab value alerts with mandatory verbal readback signoff"
            ),
            ClinicalToolItem(
                id = "cdss",
                category = "PHARMACY",
                minTier = "PRO_8",
                color = Color(0xFFE65100),
                titleKh = "ប្រព័ន្ធសុវត្ថិភាពថ្នាំ CDSS DDI Guard",
                titleEn = "Intelligent CDSS Drug-Drug Interaction",
                descKh = "ត្រួតពិនិត្យអន្តរកម្មថ្នាំ DDI, អាលែកហ្ស៊ី និងកម្រិតតម្រងនោម CrCl",
                descEn = "Real-time drug-drug interaction, allergy cross-reactivity, and renal dosage check"
            ),
            ClinicalToolItem(
                id = "teleconsult",
                category = "CLINICAL",
                minTier = "ENTERPRISE_12",
                color = Color(0xFF2E7D32),
                titleKh = "ពិគ្រោះជំងឺពីចម្ងាយ WebRTC Teleconsultation",
                titleEn = "WebRTC HD Video Teleconsultation",
                descKh = "វីដេអូពិគ្រោះជំងឺកម្រិត HD មានសុវត្ថិភាពខ្ពស់ End-to-End Encryption",
                descEn = "Encrypted WebRTC telemedicine conference room with digital stethoscope sync"
            ),
            ClinicalToolItem(
                id = "narcotics",
                category = "ENTERPRISE",
                minTier = "UNLIMITED_20",
                color = Color(0xFF4A148C),
                titleKh = "ទូស្តុកថ្នាំញៀន MoH Controlled Vault",
                titleEn = "Controlled Substances Double-Witness Vault",
                descKh = "សៀវភៅតាមដានថ្នាំញៀន Morphine & Fentanyl ផ្ទៀងផ្ទាត់សាក្សីពីររូប",
                descEn = "Statutory narcotics register with cryptographic dual-nurse witness signoff"
            )
        )
    }

    val tierRanks = mapOf(
        "FREE" to 0,
        "STARTER_5" to 1,
        "PRO_8" to 2,
        "ENTERPRISE_12" to 3,
        "UNLIMITED_20" to 4
    )
    val userLevel = tierRanks[currentTier] ?: 0

    val filteredTools = remember(selectedCategory, tools) {
        if (selectedCategory == "ALL") tools
        else tools.filter { it.category == selectedCategory }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isKhmer) "រុករកឧបករណ៍គ្លីនិក" else "Explore Clinical Tools",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40)
                        )
                        Text(
                            text = if (isKhmer) "ប្រព័ន្ធវេជ្ជសាស្ត្រ និងឧបករណ៍ឯកទេស" else "Specialty Clinical Modules & Gated Tools",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF5B6A68)
                        )
                    }
                },
                actions = {
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(
                                text = "$currentTier PLAN",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = Color(0xFFE0F2F1),
                            labelColor = Color(0xFF004D40)
                        )
                    )
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF7FAF9))
        ) {
            // Category Filter Chips
            val categories = listOf(
                "ALL" to if (isKhmer) "ទាំងអស់" else "All",
                "CLINICAL" to if (isKhmer) "គ្លីនិកបន្ទាន់" else "Clinical",
                "DIAGNOSTICS" to if (isKhmer) "រូបភាព & តេស្ត" else "Diagnostics",
                "INPATIENT" to if (isKhmer) "សម្រាកពេទ្យ" else "Inpatient",
                "PHARMACY" to if (isKhmer) "ឱសថ" else "Pharmacy",
                "ENTERPRISE" to if (isKhmer) "សហគ្រាស PaaS" else "Enterprise"
            )

            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { (key, label) ->
                    FilterChip(
                        selected = selectedCategory == key,
                        onClick = { selectedCategory = key },
                        label = { Text(text = label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                    )
                }
            }

            // Tools Directory List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredTools) { tool ->
                    val requiredLevel = tierRanks[tool.minTier] ?: 0
                    val isUnlocked = userLevel >= requiredLevel

                    ElevatedCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isUnlocked) onToolClick(tool)
                                else onUpgradeClick(tool.minTier)
                            },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.elevatedCardColors(
                            containerColor = if (isUnlocked) Color.White else Color(0xFFFCFDFD)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(tool.color),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isUnlocked) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Active",
                                        tint = Color.White,
                                        modifier = Modifier.size(22.dp)
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Locked",
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = if (isKhmer) tool.titleKh else tool.titleEn,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF191C1C)
                                    )
                                    SuggestionChip(
                                        onClick = {},
                                        label = {
                                            Text(
                                                text = tool.minTier.replace("_", " "),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    )
                                }

                                Spacer(modifier = Modifier.height(2.dp))

                                Text(
                                    text = if (isKhmer) tool.descKh else tool.descEn,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF3F4948),
                                    lineHeight = 16.sp
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                if (isUnlocked) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = null,
                                            tint = Color(0xFF1E6B37),
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = if (isKhmer) "បានបើកដំណើរការ" else "Active & Unlocked",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF1E6B37)
                                        )
                                    }
                                } else {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Lock,
                                            contentDescription = null,
                                            tint = Color(0xFFBA1A1A),
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = if (isKhmer) "ចាក់សោ - តម្រូវឱ្យមាន ${tool.minTier.replace("_", " ")}" else "Locked - Upgrade Required",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFFBA1A1A)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Navigate",
                                tint = if (isUnlocked) Color(0xFF004D40) else Color(0xFF707978),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}
