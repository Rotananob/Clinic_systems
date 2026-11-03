package com.krupet.clinic.presentation.dental

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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

enum class ToothStatus(val label: String, val color: Color) {
    SOUND("Sound", Color(0xFF2E7D32)),
    CARIES("Caries", Color(0xFFBA1A1A)),
    RESTORED("Filled", Color(0xFF1565C0)),
    CROWN("Crown", Color(0xFFF57F17)),
    ROOT_CANAL("RCT", Color(0xFF6A1B9A)),
    MISSING("Missing", Color.Gray)
}

data class DentalTooth(
    val fdiNumber: Int,
    val status: ToothStatus,
    val note: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DentalScreen(
    modifier: Modifier = Modifier
) {
    var isAdultMode by remember { mutableStateOf(true) }
    var selectedToothNumber by remember { mutableStateOf<Int?>(16) }
    var selectedToothStatus by remember { mutableStateOf(ToothStatus.CARIES) }
    var toothNoteText by remember { mutableStateOf("Deep occlusal caries requiring composite restoration") }

    // Adult 32 teeth (Upper: 18..11, 21..28. Lower: 48..41, 31..38)
    val upperArch = remember {
        listOf(18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28)
    }
    val lowerArch = remember {
        listOf(48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38)
    }

    var toothMap by remember {
        mutableStateOf(
            mapOf(
                16 to ToothStatus.CARIES,
                21 to ToothStatus.CROWN,
                36 to ToothStatus.MISSING,
                46 to ToothStatus.RESTORED
            )
        )
    }

    val cariesCount = toothMap.values.count { it == ToothStatus.CARIES }
    val restoredCount = toothMap.values.count { it == ToothStatus.RESTORED }
    val missingCount = toothMap.values.count { it == ToothStatus.MISSING }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Dental Odontogram Charting", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("FDI Two-Digit Notation & Periodontal Assessment", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Patient Header
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
                        Text("Bopha Chey (F, 28y) - HN-2026-0742", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Text("Comprehensive Oral Examination & Periodontal Screen", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Row {
                        FilterChip(
                            selected = isAdultMode,
                            onClick = { isAdultMode = true },
                            label = { Text("Adult") }
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        FilterChip(
                            selected = !isAdultMode,
                            onClick = { isAdultMode = false },
                            label = { Text("Pediatric") }
                        )
                    }
                }
            }

            // DMF Index Summary Bar (Decayed, Missing, Filled)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Decayed (D)", style = MaterialTheme.typography.labelSmall)
                        Text("$cariesCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFFBA1A1A))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Missing (M)", style = MaterialTheme.typography.labelSmall)
                        Text("$missingCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color.Gray)
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Filled (F)", style = MaterialTheme.typography.labelSmall)
                        Text("$restoredCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFF1565C0))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Total DMFT", style = MaterialTheme.typography.labelSmall)
                        Text("${cariesCount + missingCount + restoredCount}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            // Maxillary Upper Arch Grid
            Text("Maxillary Arch (Upper Dentition)", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            LazyVerticalGrid(
                columns = GridCells.Fixed(8),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(upperArch) { toothNum ->
                    val status = toothMap[toothNum] ?: ToothStatus.SOUND
                    val isSelected = selectedToothNumber == toothNum

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(status.color.copy(alpha = if (isSelected) 0.35f else 0.15f))
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else status.color,
                                shape = RoundedCornerShape(6.dp)
                            )
                            .clickable {
                                selectedToothNumber = toothNum
                                selectedToothStatus = status
                            }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$toothNum",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Black
                            )
                            Text(
                                text = status.label.take(1),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = status.color
                            )
                        }
                    }
                }
            }

            // Mandibular Lower Arch Grid
            Text("Mandibular Arch (Lower Dentition)", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            LazyVerticalGrid(
                columns = GridCells.Fixed(8),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(lowerArch) { toothNum ->
                    val status = toothMap[toothNum] ?: ToothStatus.SOUND
                    val isSelected = selectedToothNumber == toothNum

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(status.color.copy(alpha = if (isSelected) 0.35f else 0.15f))
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else status.color,
                                shape = RoundedCornerShape(6.dp)
                            )
                            .clickable {
                                selectedToothNumber = toothNum
                                selectedToothStatus = status
                            }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$toothNum",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Black
                            )
                            Text(
                                text = status.label.take(1),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = status.color
                            )
                        }
                    }
                }
            }

            // Tooth Condition Editor
            if (selectedToothNumber != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Selected Tooth #$selectedToothNumber Diagnostic Condition",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleSmall
                        )

                        // Condition selector chips
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            ToothStatus.values().forEach { status ->
                                val isSelected = selectedToothStatus == status
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (isSelected) status.color else Color.White)
                                        .border(1.dp, status.color, RoundedCornerShape(6.dp))
                                        .clickable {
                                            selectedToothStatus = status
                                            toothMap = toothMap + (selectedToothNumber!! to status)
                                        }
                                        .padding(vertical = 6.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = status.label,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else status.color
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = toothNoteText,
                            onValueChange = { toothNoteText = it },
                            label = { Text("Clinical Procedure & Treatment Plan") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = false,
                            maxLines = 2
                        )

                        Button(
                            onClick = {
                                toothMap = toothMap + (selectedToothNumber!! to selectedToothStatus)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Save Tooth Chart & Generate Procedure Estimate", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
