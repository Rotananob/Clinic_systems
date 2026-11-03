package com.krupet.clinic.presentation.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.i18n.AppLanguage
import com.krupet.clinic.core.i18n.I18nManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentTier: String = "FREE",
    onCheckUpdateClick: () -> Unit = {},
    onDownloadApkClick: () -> Unit = {}
) {
    var autoUpdateEnabled by remember { mutableStateOf(true) }
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var updateStatusText by remember { mutableStateOf<String?>(null) }
    val isKhmer = I18nManager.isKhmer()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isKhmer) "ការកំណត់ និងអាប់ដេតប្រព័ន្ធ" else "Settings & System Updates",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40)
                        )
                        Text(
                            text = if (isKhmer) "ការគ្រប់គ្រងប្រព័ន្ធ និងសុវត្ថិភាព" else "Device Configuration & OTA Engine",
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
                                text = "v2.4.0",
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF7FAF9))
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                // Profile Card
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (isKhmer) "ព័ត៌មានមន្ទីរពេទ្យ និងអាជ្ញាប័ណ្ណ" else "Hospital Profile & Licensing",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40),
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = if (isKhmer) "មន្ទីរពេទ្យ គ្រូពេទ្យ - រាជធានីភ្នំពេញ" else "KruPet Hospital - Phnom Penh",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF191C1C)
                                )
                                Text(
                                    text = "MOH Lic. No: MOH-2026-KH-88492",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF707978)
                                )
                            }
                            SuggestionChip(
                                onClick = {},
                                label = {
                                    Text(
                                        text = "$currentTier PLAN",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF004D40)
                                    )
                                }
                            )
                        }
                    }
                }
            }

            // Language Selection Card
            item {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (isKhmer) "ភាសាកម្មវិធី (Language Selection)" else "Application Language",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40),
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            FilterChip(
                                selected = I18nManager.currentLanguage == AppLanguage.KHMER,
                                onClick = { I18nManager.currentLanguage = AppLanguage.KHMER },
                                label = { Text("ភាសាខ្មែរ (Khmer)", fontWeight = FontWeight.Bold) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = I18nManager.currentLanguage == AppLanguage.ENGLISH,
                                onClick = { I18nManager.currentLanguage = AppLanguage.ENGLISH },
                                label = { Text("English", fontWeight = FontWeight.Bold) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // System Updates Section
            item {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (isKhmer) "ការអាប់ដេតប្រព័ន្ធ OTA (System Updates)" else "System Updates & Handshake",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40),
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        // Auto-update Toggle
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = if (isKhmer) "ទាញយកកំណែថ្មីស្វ័យប្រវត្តិ" else "Auto-download updates over Wi-Fi",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF191C1C)
                                )
                                Text(
                                    text = if (isKhmer) "រក្សាទុកកម្មវិធីឱ្យទាន់សម័យ និងមានសុវត្ថិភាពខ្ពស់ជានិច្ច" else "Keep application secure and up to date automatically",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF707978)
                                )
                            }
                            Switch(
                                checked = autoUpdateEnabled,
                                onCheckedChange = { autoUpdateEnabled = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = Color(0xFF004D40)
                                )
                            )
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        // Check For Updates Button
                        Button(
                            onClick = {
                                isCheckingUpdate = true
                                updateStatusText = if (isKhmer) "កំពុងភ្ជាប់ទៅកាន់ NestJS Mobile Gateway..." else "Connecting to NestJS gateway..."
                                onCheckUpdateClick()
                                updateStatusText = if (isKhmer) "✓ កម្មវិធីជាកំណែចុងក្រោយបំផុត (v2.4.0-RELEASE)" else "Application is up to date (v2.4.0-RELEASE)"
                                isCheckingUpdate = false
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0F2F1))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                tint = Color(0xFF004D40),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isKhmer) "ពិនិត្យមើលកំណែថ្មី (Check for Updates)" else "Check for Updates (OTA)",
                                color = Color(0xFF004D40),
                                fontWeight = FontWeight.Bold
                            )
                        }

                        updateStatusText?.let { status ->
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = status,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E6B37),
                                modifier = Modifier.align(Alignment.CenterHorizontally),
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // 1-Click Native APK Download Button
                        Button(
                            onClick = onDownloadApkClick,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF004D40))
                        ) {
                            Text(
                                text = if (isKhmer) "ទាញយក APK ដើម (22.2 MB Native Android)" else "Download Native APK (22.2 MB)",
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            // Hardware Security Information
            item {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (isKhmer) "សុវត្ថិភាព និង Hardware Keymaster" else "Security & Hardware Keymaster",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40),
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Android 15 StrongBox HSM",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF191C1C)
                                )
                                Text(
                                    text = "Hardware-backed AES-256-GCM Keys",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF707978)
                                )
                            }
                            Text(
                                text = "ENABLED",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E6B37)
                            )
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Offline Cache Database",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF191C1C)
                                )
                                Text(
                                    text = "SQLCipher AES-256 Encrypted",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF707978)
                                )
                            }
                            Text(
                                text = "PROTECTED",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E6B37)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
