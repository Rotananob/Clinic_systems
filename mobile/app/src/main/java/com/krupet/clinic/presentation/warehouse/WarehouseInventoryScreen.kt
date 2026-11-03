package com.krupet.clinic.presentation.warehouse

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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

data class WarehouseDrug(
    val id: String,
    val genericName: String,
    val tradeName: String,
    val lotNumber: String,
    val expiryDate: String,
    val daysToExpiry: Int,
    val currentStock: Int,
    val minReorderLevel: Int,
    val unitCostUsd: Double,
    val unit: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WarehouseInventoryScreen(
    modifier: Modifier = Modifier
) {
    var filterCategory by remember { mutableStateOf("All") }
    var barcodeQuery by remember { mutableStateOf("") }

    val inventoryList = remember {
        listOf(
            WarehouseDrug("w1", "Meropenem 1g IV Vial", "Meronem", "LOT-2026-MR01", "2026-12-20", 47, 18, 50, 14.50, "Vials"),
            WarehouseDrug("w2", "Amoxicillin-Clavulanate 1000mg", "Augmentin", "LOT-2026-AG44", "2027-06-15", 224, 240, 100, 0.85, "Tabs"),
            WarehouseDrug("w3", "Vancomycin 500mg IV Vial", "Vancocin", "LOT-2026-VN12", "2026-11-30", 27, 8, 30, 9.20, "Vials"),
            WarehouseDrug("w4", "Paracetamol 500mg", "Panadol", "LOT-2026-PC88", "2028-01-10", 433, 1500, 500, 0.05, "Tabs"),
            WarehouseDrug("w5", "Normal Saline 0.9% 500mL", "NS 0.9%", "LOT-2026-NS99", "2027-10-05", 336, 45, 100, 1.20, "Bags")
        )
    }

    val filteredList = when (filterCategory) {
        "Low Stock" -> inventoryList.filter { it.currentStock <= it.minReorderLevel }
        "Near Expiry" -> inventoryList.filter { it.daysToExpiry < 90 }
        else -> inventoryList
    }

    val lowStockCount = inventoryList.count { it.currentStock <= it.minReorderLevel }
    val nearExpiryCount = inventoryList.count { it.daysToExpiry < 90 }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Pharmacy Warehouse & FEFO Stock", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("First-Expired First-Out Surveillance & Barcode Worklist", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Warehouse Overview Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Total SKUs", style = MaterialTheme.typography.labelSmall)
                        Text("${inventoryList.size}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Low Stock", style = MaterialTheme.typography.labelSmall)
                        Text("$lowStockCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFFBA1A1A))
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Near Expiry", style = MaterialTheme.typography.labelSmall)
                        Text("$nearExpiryCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color(0xFFE65100))
                    }
                }
            }

            // Barcode Search
            OutlinedTextField(
                value = barcodeQuery,
                onValueChange = { barcodeQuery = it },
                label = { Text("Scan Medication Barcode or Enter LOT #") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            // Filter Chips
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("All", "Low Stock", "Near Expiry").forEach { cat ->
                    val isSelected = cat == filterCategory
                    FilterChip(
                        selected = isSelected,
                        onClick = { filterCategory = cat },
                        label = { Text(cat) }
                    )
                }
            }

            // Inventory List
            Text("Medication Stock Worklist (${filteredList.size} Items)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)

            filteredList.forEach { drug ->
                val isLowStock = drug.currentStock <= drug.minReorderLevel
                val isNearExpiry = drug.daysToExpiry < 90

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(drug.genericName, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                                Text("${drug.tradeName} | ${drug.lotNumber}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (isNearExpiry) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFFE65100).copy(alpha = 0.15f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "FEFO ${drug.daysToExpiry}d",
                                        color = Color(0xFFE65100),
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Stock / Min Reorder", style = MaterialTheme.typography.labelSmall)
                                Text(
                                    text = "${drug.currentStock} / ${drug.minReorderLevel} ${drug.unit}",
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    color = if (isLowStock) Color(0xFFBA1A1A) else MaterialTheme.colorScheme.primary
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Expiry Date", style = MaterialTheme.typography.labelSmall)
                                Text(drug.expiryDate, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
                            }
                        }

                        if (isLowStock) {
                            Button(
                                onClick = { /* Quick PO reorder */ },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFBA1A1A))
                            ) {
                                Text("Urgent Purchase Order Requisition (${drug.minReorderLevel - drug.currentStock + 50} ${drug.unit})", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
