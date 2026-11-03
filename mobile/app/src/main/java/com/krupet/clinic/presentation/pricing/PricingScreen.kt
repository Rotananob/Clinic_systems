package com.krupet.clinic.presentation.pricing

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.i18n.I18nManager

data class MobilePricingPlan(
    val id: String,
    val nameKh: String,
    val nameEn: String,
    val monthlyUsd: Int,
    val yearlyUsd: Int,
    val descKh: String,
    val descEn: String,
    val isRecommended: Boolean = false,
    val featuresKh: List<String>,
    val featuresEn: List<String>
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PricingScreen(
    currentTier: String = "FREE",
    onSelectPlan: (MobilePricingPlan, Boolean) -> Unit = { _, _ -> }
) {
    var isYearly by remember { mutableStateOf(false) }
    val isKhmer = I18nManager.isKhmer()

    val plans = remember {
        listOf(
            MobilePricingPlan(
                id = "FREE",
                nameKh = "គម្រោង Free Forever",
                nameEn = "Free Forever",
                monthlyUsd = 0,
                yearlyUsd = 0,
                descKh = "ឥតគិតថ្លៃរហូតសម្រាប់គ្លីនិកតូច - ៥ មុខងារស្នូល, ៥០ អ្នកជំងឺ, ៥ KHQR/ថ្ងៃ",
                descEn = "Free forever for small practices - 5 core modules, 50 patients, 5 KHQR/day",
                featuresKh = listOf(
                    "៥ មុខងារស្នូល Triage, Census, ECG, POS",
                    "៥០ អ្នកជំងឺក្នុងប្រព័ន្ធ",
                    "៥ Dynamic KHQR ក្នុងមួយថ្ងៃ",
                    "ពិគ្រោះ និងសញ្ញាជីវិត Vitals Notes"
                ),
                featuresEn = listOf(
                    "5 core modules (Triage, Census, ECG, POS)",
                    "50 patient capacity",
                    "5 dynamic KHQR / day",
                    "Basic vitals & SOAP consultation notes"
                )
            ),
            MobilePricingPlan(
                id = "STARTER_5",
                nameKh = "គម្រោង Clinic Starter",
                nameEn = "Clinic Starter $5/mo",
                monthlyUsd = 5,
                yearlyUsd = 48,
                descKh = "គ្រឹះប្រតិបត្តិការពេញលេញ - ១០ ឧបករណ៍ស្នូល, ១,០០០ អ្នកជំងឺ, ២៥០ KHQR/ថ្ងៃ, ហៅសំឡេងខ្មែរ",
                descEn = "Complete clinical foundation - 10 core modules, 1,000 patients, 250 KHQR/day, Khmer voice queue",
                featuresKh = listOf(
                    "១០ ឧបករណ៍ស្នូលពេញលេញ",
                    "១,០០០ អ្នកជំងឺក្នុងប្រព័ន្ធ",
                    "២៥០ Dynamic KHQR / ថ្ងៃ",
                    "ហៅអ្នកជំងឺជាសំឡេងខ្មែរ Khmer Voice Queue",
                    "ម៉ាស៊ីនព្រីន 80mm ESC/POS Thermal"
                ),
                featuresEn = listOf(
                    "10 complete core modules",
                    "1,000 patient capacity",
                    "250 dynamic KHQR / day",
                    "Khmer audio voice queue calling",
                    "80mm thermal receipt printing"
                )
            ),
            MobilePricingPlan(
                id = "PRO_8",
                nameKh = "គម្រោង Polyclinic Pro - ពេញនិយមបំផុត",
                nameEn = "Polyclinic Pro $8/mo - RECOMMENDED",
                monthlyUsd = 8,
                yearlyUsd = 76,
                isRecommended = true,
                descKh = "ពេញនិយមបំផុតសម្រាប់មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ - ២០ ឧបករណ៍ទំនើប (PACS, ធ្មេញ, LIS, IPD, CDSS)",
                descEn = "Most popular tier for polyclinics - 20 advanced modules (PACS, Dental, LIS Lab, IPD, CDSS)",
                featuresKh = listOf(
                    "២០ ឧបករណ៍ទំនើបរួមបញ្ចូល FDI ធ្មេញ និង WebGL PACS",
                    "៨,០០០ អ្នកជំងឺក្នុងប្រព័ន្ធ",
                    "១,៥០០ Dynamic KHQR / ថ្ងៃ",
                    "មន្ទីរពិសោធន៍ LIS និង Panic Value Alerts",
                    "គ្រែសម្រាក IPD និង e-MAR 5-Rights",
                    "CDSS ឆ្លាតវៃពិនិត្យប្រតិកម្មថ្នាំ DDI Guard"
                ),
                featuresEn = listOf(
                    "20 advanced modules including FDI Dental & WebGL PACS",
                    "8,000 patient capacity",
                    "1,500 dynamic KHQR / day",
                    "LIS lab panic value alert alerts",
                    "Inpatient IPD ward & bedside e-MAR",
                    "Intelligent CDSS drug-drug interaction safety"
                )
            ),
            MobilePricingPlan(
                id = "ENTERPRISE_12",
                nameKh = "គម្រោង Hospital Enterprise",
                nameEn = "Hospital Enterprise $12/mo",
                monthlyUsd = 12,
                yearlyUsd = 115,
                descKh = "អំណាចប្រតិបត្តិការពេញលេញសម្រាប់មន្ទីរពេទ្យ - គ្មានដែនកំណត់ KHQR, Teleconsultation HD, MoH DHIS2",
                descEn = "Full hospital operating OS - unlimited KHQR, WebRTC HD teleconsultation, custom subdomain",
                featuresKh = listOf(
                    "មិនកំណត់ចំនួនអ្នកជំងឺ និង Unlimited KHQR",
                    "ពិគ្រោះជំងឺពីចម្ងាយតាមវីដេអូ WebRTC Teleconsultation HD",
                    "ចេញវេជ្ជបញ្ជាឌីជីថល Signed QR e-Prescription",
                    "បញ្ជូនរបាយការណ៍ MoH DHIS2 និង e-Claim",
                    "ដូមេនផ្លូវការផ្ទាល់ខ្លួន Custom Subdomain"
                ),
                featuresEn = listOf(
                    "Unlimited patient capacity & unlimited KHQR",
                    "Encrypted WebRTC HD video teleconsultations",
                    "Digitally signed cryptographic e-prescriptions",
                    "MoH DHIS2 surveillance & eClaim reporting",
                    "Dedicated custom workspace subdomain"
                )
            ),
            MobilePricingPlan(
                id = "UNLIMITED_20",
                nameKh = "គម្រោង Unlimited PaaS",
                nameEn = "Unlimited Enterprise PaaS $20/mo",
                monthlyUsd = 20,
                yearlyUsd = 192,
                descKh = "ដំណោះស្រាយ Platform as a Service ពេញលេញ - ទូស្តុកថ្នាំញៀន MoH Vault, Dedicated DB, White-label",
                descEn = "Full Platform as a Service solution - MoH Narcotics Vault, dedicated database, 24/7 VIP SLA",
                featuresKh = listOf(
                    "ដំណោះស្រាយ PaaS ពេញលេញសម្រាប់បណ្តាញមន្ទីរពេទ្យ",
                    "សៀវភៅតាមដានឱសថញៀន MoH Controlled Vault សាក្សីពីររូប",
                    "Multi-Branch Cloud Fleet Real-time Replication",
                    "Dedicated Isolated Cloud Database Instance",
                    "White-label Custom Domain និង 24/7 VIP SLA"
                ),
                featuresEn = listOf(
                    "Complete hospital PaaS operating infrastructure",
                    "MoH Controlled Substances Vault with dual-signoff witness",
                    "Multi-Branch cloud fleet real-time replication",
                    "Dedicated isolated cloud database instance",
                    "White-label custom domain and 24/7 dedicated engineering SLA"
                )
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isKhmer) "គម្រោងសេវាកម្ម SaaS" else "SaaS Subscription Plans",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40)
                        )
                        Text(
                            text = if (isKhmer) "ដំឡើងគម្រោងជាមួយ Bakong KHQR POS" else "Instant Upgrade with Bakong KHQR POS",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF5B6A68)
                        )
                    }
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
            // Billing Cycle Switcher
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                SingleChoiceSegmentedButtonRow {
                    SegmentedButton(
                        selected = !isYearly,
                        onClick = { isYearly = false },
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                    ) {
                        Text(if (isKhmer) "ប្រចាំខែ" else "Monthly", fontSize = 12.sp)
                    }
                    SegmentedButton(
                        selected = isYearly,
                        onClick = { isYearly = true },
                        shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                    ) {
                        Text(if (isKhmer) "ប្រចាំឆ្នាំ - សន្សំ ២០%" else "Yearly - Save 20%", fontSize = 12.sp)
                    }
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(plans) { plan ->
                    val isCurrent = currentTier == plan.id
                    val price = if (isYearly) plan.yearlyUsd else plan.monthlyUsd
                    val period = if (isYearly) (if (isKhmer) "/ឆ្នាំ" else "/yr") else (if (isKhmer) "/ខែ" else "/mo")

                    ElevatedCard(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.elevatedCardColors(
                            containerColor = Color.White
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            if (plan.isRecommended) {
                                SuggestionChip(
                                    onClick = {},
                                    label = {
                                        Text(
                                            text = "RECOMMENDED",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF004D40)
                                        )
                                    },
                                    colors = SuggestionChipDefaults.suggestionChipColors(
                                        containerColor = Color(0xFFE0F2F1)
                                    )
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                Text(
                                    text = if (isKhmer) plan.nameKh else plan.nameEn,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF004D40)
                                )
                                Row(verticalAlignment = Alignment.Bottom) {
                                    Text(
                                        text = "\$$price",
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF191C1C)
                                    )
                                    Text(
                                        text = period,
                                        fontSize = 12.sp,
                                        color = Color(0xFF707978)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = if (isKhmer) plan.descKh else plan.descEn,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF3F4948)
                            )

                            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                            val features = if (isKhmer) plan.featuresKh else plan.featuresEn
                            features.forEach { feature ->
                                Row(
                                    verticalAlignment = Alignment.Top,
                                    modifier = Modifier.padding(vertical = 3.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color(0xFF1E6B37),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = feature,
                                        fontSize = 11.sp,
                                        color = Color(0xFF191C1C),
                                        lineHeight = 16.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Button(
                                onClick = { onSelectPlan(plan, isYearly) },
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !isCurrent,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF004D40),
                                    disabledContainerColor = Color(0xFFE8EEED),
                                    disabledContentColor = Color(0xFF5B6A68)
                                )
                            ) {
                                Text(
                                    text = if (isCurrent) (if (isKhmer) "✓ គម្រោងបច្ចុប្បន្ន" else "✓ Current Plan")
                                    else (if (isKhmer) "ដំឡើងឥឡូវនេះ" else "Upgrade with Bakong KHQR"),
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}
