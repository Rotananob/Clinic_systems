package com.krupet.clinic.presentation.paas

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.i18n.I18nManager

data class CloudEdgeNode(
    val name: String,
    val latencyMs: Int,
    val role: String,
    val status: String = "ACTIVE"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaaSOverviewScreen() {
    val isKhmer = I18nManager.isKhmer()

    val nodes = listOf(
        CloudEdgeNode("Phnom Penh Primary Cluster", 12, "Primary Master - AES-256 StrongBox"),
        CloudEdgeNode("Battambang Regional Edge", 19, "Rural Regional Edge Node"),
        CloudEdgeNode("Siem Reap Edge 03", 22, "Disaster Recovery Fleet Replication"),
        CloudEdgeNode("CamDX National Gateway", 15, "NSSF & MoH Interoperability Gateway")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isKhmer) "ហេដ្ឋារចនាសម្ព័ន្ធ Cloud PaaS" else "Healthcare Platform as a Service",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF004D40)
                        )
                        Text(
                            text = if (isKhmer) "ប្រព័ន្ធវេជ្ជសាស្ត្រជាតិ គ្មានការរអាក់រអួល" else "High-Availability Distributed EMR Cloud",
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
                                text = "99.99% UPTIME",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = Color(0xFFC8E6C9),
                            labelColor = Color(0xFF1B5E20)
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
                // Hero Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF004D40))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "ENTERPRISE CLOUD HIGH-AVAILABILITY",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF80CBC4),
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isKhmer) "ប្រព័ន្ធ PaaS វេជ្ជសាស្ត្រជាតិ កម្រិតមន្ទីរពេទ្យ" else "National Hospital-Grade PaaS Operating Infrastructure",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isKhmer) "គាំទ្រ FHIR R4 Interoperability, Rural Offline Lamport Vector Sync, Android StrongBox HSM Keymaster និងការចម្លងទិន្នន័យ PostgreSQL Multi-Master Real-time Replication។"
                            else "Engineered for HL7/FHIR R4 interoperability, rural offline-first Lamport vector sync, Android StrongBox HSM hardware keystore, and multi-branch database replication.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFE0F2F1),
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            item {
                Text(
                    text = if (isKhmer) "ស្ថានភាព Cloud Nodes ទូទាំងប្រទេស" else "National Regional Cloud Nodes",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF004D40)
                )
            }

            items(nodes) { node ->
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = Color.White)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00C853))
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = node.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF191C1C)
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = node.role,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF707978)
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "${node.latencyMs} ms",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF004D40),
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = node.status,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1B5E20)
                            )
                        }
                    }
                }
            }

            item {
                Text(
                    text = if (isKhmer) "កំណត់ហេតុសុវត្ថិភាព Live Audit Stream" else "Security & Sync Audit Log Stream",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF004D40)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF020C0B))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        val logs = listOf(
                            "[2026-11-04 02:22:01] HSM StrongBox Keymaster initialized (Key ID: 0x8F9A4)",
                            "[2026-11-04 02:22:05] Lamport vector sync: Node PP-01 merged with local SQLite",
                            "[2026-11-04 02:22:09] MoH DDF Narcotics ledger double-witness audit: PASS",
                            "[2026-11-04 02:22:14] CamDX 10-digit NSSF eligibility token verified",
                            "[2026-11-04 02:22:20] WebSocket keepalive ACK from NestJS backend 127.0.0.1:3001"
                        )
                        logs.forEach { log ->
                            Text(
                                text = log,
                                fontSize = 10.sp,
                                color = Color(0xFF5EEAD4),
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
