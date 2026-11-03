package com.krupet.clinic.presentation.laboratory

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class LabTestItem(
    val name: String,
    val value: Double,
    val unit: String,
    val minRef: Double,
    val maxRef: Double,
    val panicLow: Double? = null,
    val panicHigh: Double? = null
) {
    enum class Flag {
        NORMAL,
        LOW,
        HIGH,
        PANIC_LOW,
        PANIC_HIGH
    }

    val flag: Flag
        get() = when {
            panicHigh != null && value >= panicHigh -> Flag.PANIC_HIGH
            panicLow != null && value <= panicLow -> Flag.PANIC_LOW
            value > maxRef -> Flag.HIGH
            value < minRef -> Flag.LOW
            else -> Flag.NORMAL
        }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LabScreen(
    modifier: Modifier = Modifier
) {
    var selectedPanel by remember { mutableStateOf("CBC") }

    val cbcItems = remember {
        listOf(
            LabTestItem("White Blood Cells (WBC)", 14.8, "x10^9/L", 4.0, 11.0, 2.0, 30.0),
            LabTestItem("Hemoglobin (Hb)", 9.2, "g/dL", 12.0, 16.0, 7.0, 20.0),
            LabTestItem("Hematocrit (Hct)", 28.5, "%", 36.0, 48.0, 21.0, 60.0),
            LabTestItem("Platelets (PLT)", 85.0, "x10^9/L", 150.0, 450.0, 50.0, 1000.0),
            LabTestItem("Neutrophils %", 82.0, "%", 40.0, 75.0),
            LabTestItem("Lymphocytes %", 12.0, "%", 20.0, 45.0)
        )
    }

    val rftItems = remember {
        listOf(
            LabTestItem("Serum Creatinine", 2.1, "mg/dL", 0.6, 1.2, null, 5.0),
            LabTestItem("Blood Urea Nitrogen (BUN)", 38.0, "mg/dL", 7.0, 20.0, null, 100.0),
            LabTestItem("Serum Potassium (K+)", 5.9, "mmol/L", 3.5, 5.1, 2.8, 6.0),
            LabTestItem("Serum Sodium (Na+)", 136.0, "mmol/L", 135.0, 145.0, 120.0, 160.0),
            LabTestItem("Chloride (Cl-)", 101.0, "mmol/L", 98.0, 107.0),
            LabTestItem("Estimated GFR (CKD-EPI)", 32.0, "mL/min/1.73m2", 90.0, 140.0)
        )
    }

    val cardiacItems = remember {
        listOf(
            LabTestItem("hs-Troponin I", 2.45, "ng/mL", 0.0, 0.04, null, 0.5),
            LabTestItem("CK-MB", 45.0, "U/L", 0.0, 25.0, null, 100.0),
            LabTestItem("NT-proBNP", 1850.0, "pg/mL", 0.0, 300.0, null, 5000.0),
            LabTestItem("D-Dimer", 0.42, "ug/mL FEU", 0.0, 0.50)
        )
    }

    val panels = listOf("CBC", "Renal & Electrolytes", "Cardiac Biomarkers")
    val currentItems = when (selectedPanel) {
        "CBC" -> cbcItems
        "Renal & Electrolytes" -> rftItems
        else -> cardiacItems
    }

    val panicCount = currentItems.count { it.flag == LabTestItem.Flag.PANIC_HIGH || it.flag == LabTestItem.Flag.PANIC_LOW }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Laboratory Information System", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Specimen Tracking & Critical Panic Value Alerts", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Patient Specimen Header
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
                        Text("Vannak Nguon (M, 58y) - HN-2026-0205", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text("Sample: Venous Blood | Barcode: 202611030911", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF006A6A))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("VERIFIED", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            // Panic Alert Banner
            if (panicCount > 0) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFBA1A1A).copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.border(1.dp, Color(0xFFBA1A1A).copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "CRITICAL ALERT: $panicCount Panic Value Detected",
                                color = Color(0xFFBA1A1A),
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                            Text(
                                text = "Mandatory immediate physician verbal read-back required.",
                                color = MaterialTheme.colorScheme.onSurface,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        Button(
                            onClick = { /* Call Attending */ },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFBA1A1A)),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Call Doctor", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Panel Selection Chips
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                panels.forEach { panel ->
                    val isSelected = panel == selectedPanel
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedPanel = panel },
                        label = { Text(panel) }
                    )
                }
            }

            // Lab Results List
            Text("Diagnostic Findings (${currentItems.size} Analytes)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)

            currentItems.forEach { item ->
                val (flagText, flagColor, flagBg) = when (item.flag) {
                    LabTestItem.Flag.NORMAL -> Triple("NORMAL", Color(0xFF2E7D32), Color(0xFF2E7D32).copy(alpha = 0.12f))
                    LabTestItem.Flag.HIGH -> Triple("HIGH", Color(0xFFE65100), Color(0xFFE65100).copy(alpha = 0.12f))
                    LabTestItem.Flag.LOW -> Triple("LOW", Color(0xFF1565C0), Color(0xFF1565C0).copy(alpha = 0.12f))
                    LabTestItem.Flag.PANIC_HIGH -> Triple("PANIC HIGH", Color(0xFFBA1A1A), Color(0xFFBA1A1A).copy(alpha = 0.18f))
                    LabTestItem.Flag.PANIC_LOW -> Triple("PANIC LOW", Color(0xFFBA1A1A), Color(0xFFBA1A1A).copy(alpha = 0.18f))
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(8.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                            Text(
                                text = "Ref Range: ${item.minRef} - ${item.maxRef} ${item.unit}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "${item.value} ${item.unit}",
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                style = MaterialTheme.typography.titleSmall,
                                color = if (item.flag != LabTestItem.Flag.NORMAL) flagColor else MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(flagBg)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = flagText,
                                    color = flagColor,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }
                }
            }

            // Quick Order New Test Button
            Button(
                onClick = { /* Order Lab */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Order Add-on STAT Laboratory Tests", fontWeight = FontWeight.Bold)
            }
        }
    }
}
