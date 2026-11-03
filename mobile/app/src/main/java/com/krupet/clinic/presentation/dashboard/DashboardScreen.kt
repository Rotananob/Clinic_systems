package com.krupet.clinic.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*

data class DepartmentModule(
    val titleKh: String,
    val titleEn: String,
    val subtitleKh: String,
    val acronym: String,
    val accentColor: Color,
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
    onNavigateToWarehouse: () -> Unit = {},
    onNavigateToNssf: () -> Unit = {},
    onNavigateToChemo: () -> Unit = {}
) {
    var selectedBranch by remember { mutableStateOf("រាជធានីភ្នំពេញ - មន្ទីរពេទ្យកណ្ដាល") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top App Bar - Official KruPet Hospital Header
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, MedicalBorder, RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Monogram Hospital Cross
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MedicalDeepTeal),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "KP",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                        }
                        Column {
                            Text(
                                text = "មន្ទីរពេទ្យ គ្រូពេទ្យ",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MedicalDeepTeal
                            )
                            Text(
                                text = "KRUPET CLINICAL HUB 2026",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = MedicalSlate,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }

                    // Online TLS 1.3 Gateway Status
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFFE8F5E9))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF2E7D32))
                            )
                            Text(
                                text = "TLS 1.3 Online",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF2E7D32)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider(color = MedicalBorder)
                Spacer(modifier = Modifier.height(10.dp))

                // Duty Physician Strip
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF004D40)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("SR", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Column {
                            Text(
                                text = "វេជ្ជ. រ័ត្ន សុខា - ឯកទេស ICU",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalOnSurface
                            )
                            Text(
                                text = selectedBranch,
                                fontSize = 10.sp,
                                color = MedicalSlate
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFFE0F2F1))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("On Duty", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MedicalDeepTeal)
                    }
                }
            }
        }

        // Live KPI Metric Stat Grid - 4 Key Indicators
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Stat 1: Total Patients Today
            Card(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp)),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "អ្នកជំងឺថ្ងៃនេះ",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = MedicalSlate
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "148",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "+14% ធៀបម្សិលមិញ",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E6B37)
                    )
                }
            }

            // Stat 2: Bed Census
            Card(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp)),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "គ្រែសម្រាកព្យាបាល",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = MedicalSlate
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "34/40",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0D47A1)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "85% អត្រាប្រើប្រាស់",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE65100)
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Stat 3: ER Triage Queue
            Card(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp)),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "រង់ចាំសង្គ្រោះបន្ទាន់",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = MedicalSlate
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "4 នាក់",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = AcuityEsi1Resus
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "1 ករណីធ្ងន់ធ្ងរ ESI-1",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = AcuityEsi1Resus
                    )
                }
            }

            // Stat 4: Revenue & Bakong POS
            Card(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp)),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalSurface)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "ចំណូលសរុបថ្ងៃនេះ",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = MedicalSlate
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$4,850.00",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = BankAbaNavy
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "19,885,000 ៛ Bakong",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = BankBakongRed
                    )
                }
            }
        }

        // Quick Clinical Action Bar
        Text(
            text = "សកម្មភាពបន្ទាន់ - Quick Clinical Actions",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MedicalOnSurface
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Quick Button: Scan Patient QR
            Button(
                onClick = onNavigateToPatient,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MedicalSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MedicalBorder),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "ស្កេនកងដៃ Scan QR",
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }

            // Quick Button: Bakong KHQR Pay
            Button(
                onClick = onNavigateToBilling,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BankBakongRed),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "Bakong KHQR POS",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }

            // Quick Button: ECG Telemetry
            Button(
                onClick = onNavigateToTelemetry,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF004D40)),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "ECG Lead II 75 BPM",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }

            // Quick Button: Panic Lab Alert
            Button(
                onClick = onNavigateToLab,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AcuityEsi1Resus),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "Troponin Panic Alert",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }

        // Inpatient Bed Census - Real Clinical Cases
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "អ្នកជំងឺសម្រាកពេទ្យបច្ចុប្បន្ន - Inpatient Bed Census",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MedicalOnSurface
            )
            TextButton(onClick = onNavigateToWard) {
                Text("មើលទាំងអស់", color = MedicalDeepTeal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Case 1: Sokha Rath Bed 01 ICU
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp))
                .clickable { onNavigateToWard() },
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(AcuityEsi1Resus)
                                .padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text("BED 01 ICU", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            text = "រ័ត្ន សុខា - Sokha Rath",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalOnSurface
                        )
                    }
                    Text("HN-10492 : ប្រុស 42 ឆ្នាំ", fontSize = 11.sp, color = MedicalSlate)
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "រោគវិនិច្ឆ័យ: រលាកខ្នែងពោះវៀនធ្ងន់ធ្ងរ ក្រោយវះកាត់ថ្ងៃទី១",
                    fontSize = 12.sp,
                    color = MedicalSlate,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "BP 118/76 | HR 74 | SpO2 99% | T 36.8 C",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFFFEBEE))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("ប្រតិកម្ម Penicillin", color = AcuityEsi1Resus, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Case 2: Bopha Chann Bed 04 ICU
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp))
                .clickable { onNavigateToWard() },
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(AcuityEsi2Emergent)
                                .padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text("BED 04 ICU", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            text = "ចាន់ បុប្ផា - Bopha Chann",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalOnSurface
                        )
                    }
                    Text("HN-10501 : ស្រី 28 ឆ្នាំ", fontSize = 11.sp, color = MedicalSlate)
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "រោគវិនិច្ឆ័យ: គ្រុនឈាមកម្រិតធ្ងន់ Dengue Hemorrhagic Fever Grade 2",
                    fontSize = 12.sp,
                    color = MedicalSlate,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ប្លាកែត 42k កម្រិតគ្រោះថ្នាក់ | Shock Index 1.22",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AcuityEsi2Emergent
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFE0F2F1))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("IV Ringers Lactate", color = MedicalDeepTeal, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Complete 15 Clinical Modules Directory by Category
        Text(
            text = "គ្រប់ផ្នែកវេជ្ជសាស្ត្រ និង ប្រតិបត្តិការ - Clinical Stations",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MedicalOnSurface
        )

        val emergencyModules = listOf(
            DepartmentModule("ការពិនិត្យបន្ទាន់ Triage", "ESI v4 & NEWS2", "វាយតម្លៃកម្រិតអាទិភាព", "TRG", AcuityEsi1Resus, onNavigateToTriage),
            DepartmentModule("សង្គ្រោះបន្ទាន់ ACLS", "Resuscitation & Sepsis", "ACLS, CPR Timer, Sepsis 30mL/kg", "RES", AcuityEsi2Emergent, onNavigateToResus),
            DepartmentModule("ម៉ូនីទ័របេះដូង Telemetry", "ECG Waveform & DSP", "Lead II Real-Time Canvas", "ECG", Color(0xFF004D40), onNavigateToTelemetry)
        )

        val inpatientModules = listOf(
            DepartmentModule("សុវត្ថិភាពវះកាត់ Surgical", "WHO OR Checklist", "Sign-in, Time-out, Sign-out", "OR", Color(0xFF055E7C), onNavigateToSurgical),
            DepartmentModule("សម្រាកព្យាបាល Ward Bed", "Bed Census & SBAR", "ស្ថានភាពគ្រែ និង ទឹកសេរ៉ូម", "WRD", Color(0xFF1E6B37), onNavigateToWard),
            DepartmentModule("រូបភាពវេជ្ជសាស្ត្រ PACS", "DICOM Viewer & Calipers", "កាំរស្មីអ៊ិច និង CT Scan", "RAD", Color(0xFF3949AB), onNavigateToPacs),
            DepartmentModule("មន្ទីរពិសោធន៍ LIS Lab", "Panic Values & Blood Work", "CBC, Troponin, អេឡិចត្រូឡីត", "LAB", Color(0xFFD81B60), onNavigateToLab)
        )

        val pharmacyModules = listOf(
            DepartmentModule("ឱសថស្ថានគ្លីនិក ASP", "Antimicrobial Stewardship", "គណនា CrCl និង Vanco AUC24", "ASP", Color(0xFF6A1B9A), onNavigateToStewardship),
            DepartmentModule("ទូថ្នាំញៀន Narcotics Vault", "Double-Witness Ledger", "ចុះហត្ថលេខាទ្វេភាគីច្បាប់ MoH", "NAR", Color(0xFFB71C1C), onNavigateToNarcotics),
            DepartmentModule("ឃ្លាំងឱសថ Warehouse", "FEFO Stock & Reorder", "គ្រប់គ្រងស្តុក និង លេខឡូតិ៍", "WHS", Color(0xFFE65100), onNavigateToWarehouse)
        )

        val specialtyModules = listOf(
            DepartmentModule("កុមារ Pediatric Dosing", "Bhutani Bilirubin & Nomogram", "គណនាកម្រិតថ្នាំតាមទម្ងន់កុមារ", "PED", Color(0xFF00897B), onNavigateToPediatric),
            DepartmentModule("ទន្តសាស្ត្រ Dental Charting", "FDI 32-Tooth Odontogram", "កំណត់ត្រាធ្មេញ និង អញ្ចាញ", "DEN", Color(0xFF00796B), onNavigateToDental),
            DepartmentModule("ពិគ្រោះពីចម្ងាយ Teleconsult", "WebRTC Video & e-Prescription", "ការពិគ្រោះជំងឺក្រៅបណ្ដាញ", "TLC", Color(0xFF0277BD), onNavigateToTeleconsult),
            DepartmentModule("សំណុំរឿងអ្នកជំងឺ EHR", "Patient Dossier & Records", "ប្រវត្តិជំងឺ និង ការព្យាបាល", "EHR", MedicalDeepTeal, onNavigateToPatient),
            DepartmentModule("គិតលុយ Bakong KHQR POS", "Bakong USD/KHR Dual Engine", "ទូទាត់ភ្លាមៗតាម KHQR និង ABA", "POS", BankBakongRed, onNavigateToBilling),
            DepartmentModule("សំណើសងប្រាក់ ប.ស.ស.", "NSSF e-Claim Portal", "CamDX K, B, R Tariff Engine", "NSF", Color(0xFF00695C), onNavigateToNssf),
            DepartmentModule("បញ្ចូលថ្នាំគីមីមហារីក Chemo", "Oncology Infusion Station", "Calvert AUC, BSA & Dual-Nurse", "CHM", Color(0xFF4A148C), onNavigateToChemo)
        )

        val allCategories = listOf(
            "ផ្នែកសង្គ្រោះបន្ទាន់ Emergency" to emergencyModules,
            "ផ្នែកវះកាត់ និង សម្រាកព្យាបាល Inpatient & Diagnostics" to inpatientModules,
            "ផ្នែកឱសថស្ថាន និង សុវត្ថិភាព Pharmacy & Safety" to pharmacyModules,
            "ផ្នែកឯកទេស និង ហិរញ្ញវត្ថុ Specialty & Finance" to specialtyModules
        )

        allCategories.forEach { (catTitle, moduleList) ->
            Text(
                text = catTitle,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate,
                modifier = Modifier.padding(top = 4.dp)
            )

            moduleList.chunked(2).forEach { rowModules ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    rowModules.forEach { mod ->
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, MedicalBorder, RoundedCornerShape(14.dp))
                                .clickable { mod.onClick() },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MedicalSurface)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(mod.accentColor.copy(alpha = 0.12f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = mod.acronym,
                                            color = mod.accentColor,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = mod.titleKh,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MedicalOnSurface,
                                    maxLines = 1
                                )
                                Text(
                                    text = mod.titleEn,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = mod.accentColor,
                                    maxLines = 1
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = mod.subtitleKh,
                                    fontSize = 10.sp,
                                    color = MedicalSlate,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                    if (rowModules.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}
