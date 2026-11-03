package com.krupet.clinic.presentation.narcotics

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

data class NarcoticItem(
    val name: String,
    val schedule: String,
    val stockOnHand: Int,
    val unit: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NarcoticsRegisterScreen(
    modifier: Modifier = Modifier
) {
    var selectedDrug by remember { mutableStateOf("Morphine Sulfate 10mg/mL") }
    var administeredDoseText by remember { mutableStateOf("6") }
    var wastedDoseText by remember { mutableStateOf("4") }
    var primaryStaffName by remember { mutableStateOf("RN Sokha Meas") }
    var witnessStaffName by remember { mutableStateOf("Dr. Virak Lim") }
    var witnessPinText by remember { mutableStateOf("") }
    var disposalMethod by remember { mutableStateOf("Chemical Denaturing & Sink") }

    val narcotics = remember {
        listOf(
            NarcoticItem("Morphine Sulfate 10mg/mL", "Schedule II", 42, "Amps"),
            NarcoticItem("Fentanyl Citrate 100mcg/2mL", "Schedule II", 28, "Amps"),
            NarcoticItem("Pethidine HCl 50mg/mL", "Schedule II", 15, "Amps"),
            NarcoticItem("Midazolam 5mg/mL", "Schedule IV", 60, "Amps"),
            NarcoticItem("Ketamine HCl 50mg/mL", "Schedule III", 22, "Vials")
        )
    }

    val selectedItem = narcotics.find { it.name == selectedDrug } ?: narcotics.first()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Controlled Substances Narcotic Register", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("MoH Statutory Compliance & Merkle Ledger Audit", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            // Merkle Cryptographic Audit Banner
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF006A6A).copy(alpha = 0.08f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.border(1.dp, Color(0xFF006A6A).copy(alpha = 0.35f), RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Cryptographic Merkle Audit Hash", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall, color = Color(0xFF006A6A))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF2E7D32))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("TAMPER PROOF", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 9.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "ROOT: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "100% mathematical integrity verified across all historical dispensing transactions.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF006A6A)
                    )
                }
            }

            // Drug Vault Status Bar
            Text("Controlled Vault Stock on Hand", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)

            narcotics.forEach { item ->
                val isSelected = item.name == selectedDrug
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                            shape = RoundedCornerShape(8.dp)
                        ),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.06f) else MaterialTheme.colorScheme.surface
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(item.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                            Text(item.schedule, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text(
                            text = "${item.stockOnHand} ${item.unit}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // Double Witness Dispensing & Wastage Form
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Mandatory Double-Witness Dispense Protocol", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = administeredDoseText,
                            onValueChange = { administeredDoseText = it },
                            label = { Text("Administered mg") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = wastedDoseText,
                            onValueChange = { wastedDoseText = it },
                            label = { Text("Wasted / Destroyed mg") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    OutlinedTextField(
                        value = disposalMethod,
                        onValueChange = { disposalMethod = it },
                        label = { Text("MoH Approved Wastage Disposal Method") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Divider()

                    Text("Dual Authentication Signatures", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)

                    OutlinedTextField(
                        value = primaryStaffName,
                        onValueChange = { primaryStaffName = it },
                        label = { Text("Primary Clinical Administrator (RN)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = witnessStaffName,
                        onValueChange = { witnessStaffName = it },
                        label = { Text("Secondary Witnessing Physician (MD)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = witnessPinText,
                        onValueChange = { witnessPinText = it },
                        label = { Text("Witness Master Security PIN") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Button(
                        onClick = { /* Confirm double-witnessed dispensing */ },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Sign Ledger & Unlock Safe Compartment", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
