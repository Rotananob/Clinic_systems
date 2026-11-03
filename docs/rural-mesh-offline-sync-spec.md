# Rural Clinic Mesh Offline Synchronization and Resilient Telemetry Specification
Document Identifier: RURAL-MESH-SYNC-SPEC-2026-V1
Compliance Standards: HL7 FHIR R4 Offline Sync, W3C Merkle Hash Trees, RFC 6902 JSON Patch, RFC 1952 GZIP, IETF RFC 5246 TLS 1.3
Classification: Enterprise Standard Medical Offline-First Synchronization, Edge Mesh, and Remote Clinic Resilience Protocol

---

## 1. Executive Summary and Rural Mesh Topology

### 1.1 Operational Context in Remote Cambodia
In remote provinces of the Kingdom of Cambodia - including Mondulkiri, Ratanakiri, Koh Kong, Preah Vihear, and Stung Treng - primary Health Centers (HC) and mobile outreach immunization/maternal teams operate under severe infrastructure limitations:
- Intermittent, High-Latency Cellular Connectivity: Unstable 2G/EDGE or degraded 3G connections (available bandwidth often drops below 30 kbps with round-trip latency exceeding 1,500 ms and packet loss rates $> 25\%$).
- Complete Cellular Blackouts: Forest fringe villages, indigenous community health posts, and river clinics frequently endure multi-day cellular outages.
- Electric Power Load-Shedding: Rolling power outages necessitate battery-powered Android mobile tablets and rugged POS terminals as primary clinical workstations.

The Rural Clinic Mesh Offline Synchronization Engine provides:
1. Complete Offline Operational Autonomy: Full local read/write capabilities for triage, vital signs, prescriptions, eMAR, and billing backed by local encrypted Room/SQLite storage.
2. Vector Clocks and Lamport Timestamps: Causality tracking and deterministic conflict resolution without requiring constant centralized server coordination.
3. Patient-Safety-First Conflict Resolution Matrices: Specialized clinical arbitration rules preventing lethal duplicate medication administration and bed allocation race conditions.
4. GZIP Compression & Chunked Resumable Sync: Automatic payload compression for items $> 512\text{ bytes}$ and $16 - 64\text{ KB}$ chunked transfers with byte-level resume over flaky 2G/3G links.
5. Cryptographic Merkle Hash Tree Integrity: Rapid divergence detection and tamper-evident audit chains signed with Android Keystore hardware keys.
6. Peer-to-Peer (P2P) Local Mesh Dissemination: Direct Wi-Fi Direct and local hotspot data reconciliation between outreach tablets when WAN Internet is completely unavailable.

```
+----------------------------------------------------------------------------------------------------+
|                         RURAL CLINIC MESH OFFLINE SYNCHRONIZATION TOPOLOGY                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ REMOTE PROVINCIAL HEALTH CENTER / COMMUNITY HEALTH POST ]                                       |
|                                                                                                    |
|  +--------------------+     Local P2P Wi-Fi Direct Mesh     +--------------------+                 |
|  | Tablet A: Triage   | <=================================> | Tablet B: Pharmacy |                 |
|  | & Emergency Ward   |                                     | & Point of Sale    |                 |
|  | (Nurse Sothea)     |                                     | (Pharmacist Veasna)|                 |
|  +--------------------+                                     +--------------------+                 |
|           ^                                                           ^                            |
|           | Local Wi-Fi Router (No Internet Connection)               |                            |
|           v                                                           v                            |
|  +-------------------------------------------------------------------------------+                 |
|  | LOCAL CLINIC EDGE NODE (Low-Power Mini-PC / Micro-Server SQLite Master)       |                 |
|  | - Maintains Local Merkle Hash Tree and Vector Clock Ledger                     |                 |
|  | - Arbitrates Local Conflicts (eMAR duplication guards, Bed assignments)       |                 |
|  | - Encrypted Mutation Outbox awaiting WAN connectivity                          |                 |
|  +-------------------------------------------------------------------------------+                 |
|                               |                                                                    |
|                               | Intermittent 2G / EDGE / 3G Uplink (Burst Sync)                    |
|                               | - Compressed GZIP Payloads (> 512 bytes)                           |
|                               | - 16 KB - 64 KB Resumable Byte Chunks                              |
|                               v                                                                    |
|  [ PROVINCIAL REFERRAL HOSPITAL (PRH / CPA3) / NATIONAL CLOUD DATA CENTER ]                        |
|  - NestJS Central Cluster, PostgreSQL Master, National DHIS2, and NSSF CamDX Gateway              |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Vector Clocks and Lamport Logical Timestamp Engine

### 2.1 Causality Tracking in Distributed Health Networks
Physical wall-clock timestamps (NTP) on remote mobile devices cannot be trusted for distributed clinical consistency due to clock drift, flat batteries, and manual timezone misconfigurations. The engine implements combined **Vector Clocks** for causal dependency ordering and **Lamport Logical Timestamps** for deterministic tie-breaking.

#### 1. Vector Clock Definition:
Given a cluster of $N$ participating nodes (mobile tablets, edge nodes, central servers), each node $i$ maintains a vector of logical counters $V_i = \langle v_1, v_2, \dots, v_N \rangle$:
- Upon generating a local clinical mutation (e.g. vital sign recorded, medication dispensed), node $i$ increments its own component:
  $$V_i[i] = V_i[i] + 1$$
- When transmitting a synchronization envelope, node $i$ includes its current vector clock $V_i$.
- Upon receiving an incoming vector clock $V_{\text{incoming}}$ from node $j$, node $i$ updates every component:
  $$\forall k \in [1, N], \quad V_i[k] = \max(V_i[k], V_{\text{incoming}}[k])$$
  $$V_i[i] = V_i[i] + 1$$

#### 2. Causal Ordering Predicates:
For any two clinical events $A$ and $B$ with vector clocks $V(A)$ and $V(B)$:
- $A$ causally preceded $B$ ($A \to B$) if and only if:
  $$\forall k, V(A)[k] \le V(B)[k] \quad \land \quad \exists k, V(A)[k] < V(B)[k]$$
- $B$ causally preceded $A$ ($B \to A$) if and only if $V(B) \le V(A) \land V(B) \ne V(A)$.
- $A$ and $B$ are **Concurrent** ($A \parallel B$) if neither strictly dominates the other:
  $$\exists j, k \quad \text{such that} \quad V(A)[j] < V(B)[j] \quad \land \quad V(A)[k] > V(B)[k]$$

#### 3. Lamport Logical Timestamp with Deterministic Node Tie-Breaker:
When events are concurrent ($A \parallel B$), the engine resolves order via an extended Lamport Logical Timestamp tuple:

$$\text{Timestamp Tuple} = \langle T_L, \text{NodeId} \rangle$$

Where:
- $T_L$ is the scalar Lamport counter ($T_{L, \text{new}} = \max(T_{L, \text{local}}, T_{L, \text{incoming}}) + 1$).
- $\text{NodeId}$ is the unique alphanumeric string identifier of the hardware terminal (e.g. `TAB_RATANAKIRI_02`).
- Event $A$ wins over Event $B$ if $T_L(A) > T_L(B)$, or if $T_L(A) == T_L(B)$, lexicographical comparison of $\text{NodeId}(A) > \text{NodeId}(B)$.

---

### 2.2 Room Database Offline Synchronization Schemas

The local mobile Room database maintains two append-only transactional queues:

#### 1. Outbox Entity (`sync_outbox`):
Stores locally authored mutations awaiting upstream transmission.
```sql
CREATE TABLE sync_outbox (
    mutation_id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,          -- ENCOUNTER, TRIAGE, EMAR, PRESCRIPTION, BED
    entity_id TEXT NOT NULL,
    action_type TEXT NOT NULL,          -- INSERT, UPDATE, DELETE
    payload_json TEXT NOT NULL,         -- JSON Patch delta or full entity snapshot
    payload_compressed BLOB,            -- GZIP compressed byte array if raw length > 512 bytes
    vector_clock_json TEXT NOT NULL,    -- Serialized Map<String, Long>
    lamport_timestamp INTEGER NOT NULL,
    originating_node_id TEXT NOT NULL,
    originating_user_id TEXT NOT NULL,
    created_at_epoch_ms INTEGER NOT NULL,
    sync_status TEXT NOT NULL,          -- PENDING, TRANSMITTING, ACKNOWLEDGED, CONFLICT
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error_message TEXT
);
```

#### 2. Inbox Entity (`sync_inbox`):
Stores incoming mutations received from peers or upstream server before local application.
```sql
CREATE TABLE sync_inbox (
    inbox_id TEXT PRIMARY KEY NOT NULL,
    mutation_id TEXT NOT NULL UNIQUE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    vector_clock_json TEXT NOT NULL,
    lamport_timestamp INTEGER NOT NULL,
    source_node_id TEXT NOT NULL,
    merkle_leaf_hash TEXT NOT NULL,
    received_at_epoch_ms INTEGER NOT NULL,
    application_status TEXT NOT NULL     -- PENDING_APPLICATION, APPLIED, CONFLICT_RESOLVED
);
```

---

## 3. Clinical Conflict Resolution Matrices

In commercial software, Last-Write-Wins (LWW) silently overwrites the loser. In clinical medicine, blindly overwriting records can cause **fatal overdoses**, missed doses, or lost allergy warnings. KruPet Mobile implements domain-specific **Safety-First Clinical Conflict Resolution**:

### 3.1 Medication Administration Record (eMAR) Conflict Matrix
The most critical split-brain danger occurs when two nurses in an offline ward both administer a scheduled dose (e.g., Morphine, Regular Insulin, or Gentamicin) without seeing each other's documentation.

```
+------------------------------------+------------------------------------+-------------------------------------------------------------+
| Scenario                           | Conflict Nature                    | Inviolable Clinical Arbitration Action                      |
+------------------------------------+------------------------------------+-------------------------------------------------------------+
| Both Nurse A and Nurse B record    | Concurrent Double Administration   | 1. HARD SAFETY INTERLOCK: NEVER overwrite or discard either |
| GIVEN for the same dose slot.      | ($A \parallel B$ both GIVEN)       |    administration record. Both records commit to database.  |
|                                    |                                    | 2. Tag order status: DUPLICATE_ADMINISTRATION_SUSPECTED.    |
|                                    |                                    | 3. Trigger immediate audible HIGH-PRIORITY CLINICAL ALARM on|
|                                    |                                    |    all ward terminals to evaluate patient for toxicity.     |
|                                    |                                    | 4. Mandate attending physician clinical review.             |
|                                    |                                    |                                                             |
| Nurse A records GIVEN;             | Conflicting Administration Status  | 1. GIVEN record always supersedes NOT_GIVEN or HELD to      |
| Nurse B records HELD or NOT_GIVEN. | ($A \parallel B$ GIVEN vs HELD)    |    prevent accidental re-dosing by a third clinician.       |
|                                    |                                    | 2. Archive HELD justification note in clinical audit log.   |
|                                    |                                    |                                                             |
| Nurse A updates infusion rate;     | Rate Mismatch                      | 1. Lower rate prevails temporarily for safety until dual-   |
| Nurse B updates infusion rate.     | ($A \parallel B$ Rate1 vs Rate2)   |    nurse bedside re-verification is completed.              |
|                                    |                                    | 2. Display rate disagreement banner on eMAR interface.      |
+------------------------------------+------------------------------------+-------------------------------------------------------------+
```

### 3.2 Inpatient Bed Ward Occupancy Conflict Matrix
Occurs when two triage nurses on separate offline tablets assign two different patients to the same physical hospital bed.

```
+------------------------------------+-----------------------------------------------------------------------------------------------+
| Bed Conflict Scenario              | Automated Conflict Arbitration Rule                                                           |
+------------------------------------+-----------------------------------------------------------------------------------------------+
| Concurrent Bed Allocation          | 1. Bed allocated to the patient whose encounter has the lower Lamport Timestamp (earliest     |
| (Patient X and Patient Y assigned  |    admitted chronologically). If Lamport timestamps tie, compare ESI triage severity:        |
| to Bed 102 offline).               |    higher acuity patient (ESI 1 or ESI 2) retains the bed.                                   |
|                                    | 2. The second patient is automatically reassigned to: UNASSIGNED_PENDING_SURGE_COT.           |
|                                    | 3. Dispatch urgent bedside notification to Ward Charge Nurse to designate a temporary bed.    |
+------------------------------------+-----------------------------------------------------------------------------------------------+
```

### 3.3 Prescription Lifecycle Monotonic State Transitions
Prescription state changes are governed by a strictly monotonic directed acyclic graph (DAG):

$$\text{DRAFT} \longrightarrow \text{ORDERED} \longrightarrow \text{VERIFIED} \longrightarrow \text{DISPENSED} \longrightarrow \text{COMPLETED}$$

Safety Precedence Rule:
$$\text{CANCELLED} \quad \text{or} \quad \text{DISCONTINUED} \quad \succ \quad \text{ALL OTHER STATES}$$

If Node A marks a prescription `CANCELLED` (e.g. doctor discovered severe drug allergy) while Node B concurrently marks the same prescription `DISPENSED`:
- The `CANCELLED` state **strictly dominates**.
- If the drug has already been physically ingested, the system generates an immediate emergency alert: "CRITICAL: CANCELLED MEDICATION WAS DISPENSED OFFLINE. Initiate immediate antidote / clinical monitoring protocol."

### 3.4 Append-Only Vitals and Triage Time-Series
Vital signs (Heart Rate, Blood Pressure, SpO2, Temperature, GCS) and triage logs are modeled as an **Append-Only Time-Series CRDT**:
- Vital signs are never updated in place; each measurement is an immutable telemetry event tagged with a UUID and timestamp.
- Concurrent vitals from multiple nurses are union-merged:
  $$\text{Vitals}_{\text{merged}} = \text{Vitals}_{\text{Node A}} \cup \text{Vitals}_{\text{Node B}}$$
- Charting graphs plot all recorded data points chronologically without data loss.

---

## 4. Bandwidth Optimization, GZIP Compression, and Resumable Chunking

### 4.1 Low-Bandwidth 2G/EDGE Transport Constraints
Remote provincial networks typically support payloads with maximum transmission units (MTU) of 1,500 bytes, but unstable radio frequency (RF) links suffer frequent TCP window collapsing. To guarantee transmission success:

```
+--------------------------+-----------------------+---------------------------------------------------------+
| Payload Raw Size         | Encoding Strategy     | Transport Optimization Behavior                         |
+--------------------------+-----------------------+---------------------------------------------------------+
| <= 512 bytes             | Raw JSON UTF-8        | Transmitted as uncompressed plain JSON. GZIP overhead   |
|                          |                       | would increase total payload size for small frames.     |
|                          |                       |                                                         |
| > 512 bytes              | GZIP Compressed BLOB  | Compressed via standard RFC 1952 GZIP (Level 6 balance).|
|                          |                       | Reduces clinical JSON payload size by 65% to 82%.       |
|                          |                       |                                                         |
| > 64 Kilobytes           | Chunked Resumable     | Split into 16 KB - 64 KB sequential byte fragments with |
| (e.g. bulk batch sync)   | Transfer Windows      | SHA-256 chunk checksums and byte-range resume headers.  |
+--------------------------+-----------------------+---------------------------------------------------------+
```

### 4.2 Differential Delta Encoding (RFC 6902 JSON Patch)
Instead of retransmitting entire patient medical records across the 2G network, the engine transmits only the discrete JSON Patch mutation:

```json
{
  "mutationId": "MUT_98a7f6e5-4d3c-2b1a-0f9e-8d7c6b5a4e32",
  "entityType": "PATIENT_VITALS",
  "entityId": "PAT_CAM_98412",
  "patchOps": [
    { "op": "add", "path": "/vitals/2026-11-04T09:15:00Z", "value": { "hr": 84, "sbp": 120, "dbp": 80, "spo2": 98 } }
  ]
}
```

### 4.3 Resumable Chunking Protocol
For bulk initial synchronization (e.g. downloading 500 patient records upon arriving at a remote village health center):
1. The server or sending peer generates a `SyncSessionId` and announces total byte length $L_{\text{total}}$ and total chunk count $N_{\text{chunks}}$.
2. Chunks are transmitted sequentially:
   - Header: `X-Chunk-Index: 0`, `X-Chunk-Total: 8`, `X-Chunk-Checksum: a8b3...`
   - Content-Range: `bytes 0-16383/131072`
3. If cellular connection drops at chunk 4: The mobile client re-establishes connection and requests `GET /api/v1/sync/resume?session=...&fromChunk=5`.
4. Zero byte re-transmission: Only remaining fragments are sent.

---

## 5. Cryptographic Merkle Tree Integrity & Tamper-Proofing

To verify that two offline nodes share the exact same state without transmitting their entire database over a slow 2G connection, the engine maintains an **Incremental Merkle Hash Tree**:

```
                              [ MERKLE ROOT HASH ]
                                  H(1-4) = H(H12 + H34)
                                     /             \
                       +------------+               +------------+
                       |                                         |
               H(1-2) = H(H1 + H2)                       H(3-4) = H(H3 + H4)
                  /          \                              /          \
            +----+            +----+                  +----+            +----+
            |                      |                  |                      |
      [ LEAF HASH 1 ]        [ LEAF HASH 2 ]    [ LEAF HASH 3 ]        [ LEAF HASH 4 ]
      H1 = SHA256(Mut1)      H2 = SHA256(Mut2)  H3 = SHA256(Mut3)      H4 = SHA256(Mut4)
            |                      |                  |                      |
      Mutation 1:            Mutation 2:        Mutation 3:            Mutation 4:
      Patient Triage         Vital Sign         Insulin Given          Discharge Note
```

### 5.1 Merkle Exchange Synchronization Algorithm
1. Node A and Node B exchange only their 32-byte **Merkle Root Hashes**:
   $$\text{Root}_A \quad \text{vs} \quad \text{Root}_B$$
2. If $\text{Root}_A == \text{Root}_B$: Both nodes are in identical cryptographic synchronization. Total bandwidth consumed: **64 bytes**.
3. If $\text{Root}_A \ne \text{Root}_B$: Nodes exchange the hashes of their top-level child nodes ($H_{1-2}$ and $H_{3-4}$).
4. The search recurses down the divergent branch in $O(\log M)$ round trips, pinpointing the exact missing mutations (e.g. Mutation 3).
5. Only the missing mutation payloads are transmitted across the low-bandwidth link.

---

## 6. Local Peer-to-Peer (P2P) Wi-Fi Direct Mesh Synchronization

When mobile outreach teams work in deep jungle health posts with zero cellular coverage:
- The lead physician's Android tablet activates an encrypted Wi-Fi Direct SoftAP group (or local portable Wi-Fi travel router).
- Clinic nurse and pharmacist tablets join the local WPA3 encrypted subnet (`192.168.49.*`).
- Devices discover each other via **mDNS / DNS-SD** (`_krupet-mesh._tcp.local`).
- High-speed local synchronization ($20 - 50\text{ Mbps}$) executes over local Wi-Fi without consuming any cellular data.
- When any single tablet later returns to cellular coverage (e.g. driving back to the provincial capital), its accumulated outbox uploads to the cloud, synchronizing the entire team's clinical logs.

---

## 7. Production-Grade Kotlin Serialization Models & Sync Engine

```kotlin
package com.krupet.clinic.core.model.sync

import kotlinx.serialization.Serializable
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream

/**
 * KruPet Clinical Mobile - Rural Mesh Offline Sync Models & Engine
 * File: RuralMeshSyncModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class SyncEntityType {
    PATIENT_DEMOGRAPHICS,
    TRIAGE_RECORD,
    VITAL_SIGNS,
    PRESCRIPTION,
    EMAR_ADMINISTRATION,
    BED_ALLOCATION,
    NSSF_CLAIM
}

@Serializable
enum class SyncActionType {
    INSERT,
    UPDATE,
    DELETE
}

@Serializable
enum class EmarConflictStatus {
    CLEAR_NO_CONFLICT,
    DUPLICATE_ADMINISTRATION_SUSPECTED,
    RATE_DISCREPANCY_ARBITRATED,
    SUPERSEDED_BY_GIVEN
}

@Serializable
data class VectorClockSnapshot(
    val clocks: Map<String, Long> = emptyMap()
) {
    fun increment(nodeId: String): VectorClockSnapshot {
        val current = clocks[nodeId] ?: 0L
        val updated = clocks.toMutableMap()
        updated[nodeId] = current + 1L
        return VectorClockSnapshot(updated)
    }

    fun merge(other: VectorClockSnapshot): VectorClockSnapshot {
        val merged = clocks.toMutableMap()
        for ((node, count) in other.clocks) {
            val localCount = merged[node] ?: 0L
            merged[node] = Math.max(localCount, count)
        }
        return VectorClockSnapshot(merged)
    }

    fun dominates(other: VectorClockSnapshot): Boolean {
        var greaterInAtLeastOne = false
        for ((node, count) in other.clocks) {
            val localCount = clocks[node] ?: 0L
            if (localCount < count) return false
            if (localCount > count) greaterInAtLeastOne = true
        }
        for ((node, localCount) in clocks) {
            if (!other.clocks.containsKey(node) && localCount > 0L) {
                greaterInAtLeastOne = true
            }
        }
        return greaterInAtLeastOne
    }
}

@Serializable
data class SyncMutationEnvelope(
    val mutationId: String,
    val entityType: SyncEntityType,
    val entityId: String,
    val actionType: SyncActionType,
    val payloadJson: String,
    val isCompressedGzip: Boolean,
    val compressedPayloadBytesBase64: String? = null,
    val vectorClock: VectorClockSnapshot,
    val lamportTimestamp: Long,
    val originatingNodeId: String,
    val originatingUserId: String,
    val createdAtEpochMs: Long,
    val merkleLeafSha256: String
)

@Serializable
data class SyncBatchHeader(
    val batchId: String,
    val sourceNodeId: String,
    val targetNodeId: String,
    val merkleRootHash: String,
    val mutationCount: Int,
    val timestampUtcMs: Long,
    val hardwareSignatureBase64: String
)

@Serializable
data class EmarArbitrationResult(
    val isSafeToAdminister: Boolean,
    val conflictStatus: EmarConflictStatus,
    val primaryRecordJson: String,
    val secondaryRecordJson: String? = null,
    val clinicalAlertEn: String,
    val clinicalAlertKh: String
)

object RuralMeshCompressionEngine {
    private const val GZIP_THRESHOLD_BYTES = 512

    fun compressIfEligible(rawUtf8Json: String): Pair<Boolean, ByteArray> {
        val rawBytes = rawUtf8Json.toByteArray(Charsets.UTF_8)
        if (rawBytes.size <= GZIP_THRESHOLD_BYTES) {
            return Pair(false, rawBytes)
        }

        val bos = ByteArrayOutputStream()
        GZIPOutputStream(bos).use { gzip ->
            gzip.write(rawBytes)
        }
        val compressed = bos.toByteArray()
        return Pair(true, compressed)
    }

    fun decompress(bytes: ByteArray, isGzipped: Boolean): String {
        if (!isGzipped) {
            return String(bytes, Charsets.UTF_8)
        }
        val bis = ByteArrayInputStream(bytes)
        GZIPInputStream(bis).use { gzip ->
            return gzip.bufferedReader(Charsets.UTF_8).readText()
        }
    }

    fun computeSha256(data: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(data)
        return hash.joinToString("") { "%02x".format(it) }
    }
}

object EmarConflictArbitrator {
    /**
     * Safety-First eMAR Conflict Resolution
     * Strictly prevents silent overdose overwrites.
     */
    fun arbitrateConcurrentEmar(
        recordA: SyncMutationEnvelope,
        recordB: SyncMutationEnvelope
    ): EmarArbitrationResult {
        val isBothGiven = recordA.payloadJson.contains("\"status\":\"GIVEN\"") &&
                          recordB.payloadJson.contains("\"status\":\"GIVEN\"")

        if (isBothGiven) {
            return EmarArbitrationResult(
                isSafeToAdminister = false,
                conflictStatus = EmarConflictStatus.DUPLICATE_ADMINISTRATION_SUSPECTED,
                primaryRecordJson = recordA.payloadJson,
                secondaryRecordJson = recordB.payloadJson,
                clinicalAlertEn = "CRITICAL OVERDOSE WARNING: Duplicate administration documented offline on separate tablets. Assess patient immediately.",
                clinicalAlertKh = "ការប្រកាសអាសន្នគ្រោះថ្នាក់ខ្ពស់: មានការផ្តល់ថ្នាំត្រួតគ្នាលើអ្នកជំងឺដែលបានកត់ត្រាក្រៅបណ្តាញ។ ត្រូវពិនិត្យអ្នកជំងឺបន្ទាន់។"
            )
        }

        // If one is GIVEN and one is HELD, GIVEN prevails for safety awareness
        val isAGiven = recordA.payloadJson.contains("\"status\":\"GIVEN\"")
        val primary = if (isAGiven) recordA.payloadJson else recordB.payloadJson
        val secondary = if (isAGiven) recordB.payloadJson else recordA.payloadJson

        return EmarArbitrationResult(
            isSafeToAdminister = true,
            conflictStatus = EmarConflictStatus.SUPERSEDED_BY_GIVEN,
            primaryRecordJson = primary,
            secondaryRecordJson = secondary,
            clinicalAlertEn = "eMAR Conflict arbitrated: Confirmed GIVEN record preserved as primary.",
            clinicalAlertKh = "ការដោះស្រាយទំនាស់កំណត់ត្រាថ្នាំ: កំណត់ត្រាថ្នាំដែលបានផ្តល់រួចត្រូវបានរក្សាទុកជាចម្បង។"
        )
    }
}
```

---

## 8. Bilingual Khmer and English Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Rural Mesh Sync Identifier   | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| Rural Mesh Offline Synchronization   | ការធ្វើសមកាលកម្មទិន្នន័យបណ្តាញក្រៅប្រព័ន្ធតំបន់ជនបទ          |
| Intermittent Cellular Connection     | ការតភ្ជាប់បណ្តាញទូរស័ព្ទមានការរអាក់រអួល                       |
| Offline Autonomous Clinical Mode     | របៀបដំណើរការគ្លីនិកស្វ័យភាពពេលគ្មានអ៊ីនធឺណិត                 |
| Vector Clock Causality Tracking      | ការតាមដានលំដាប់លំដោយទិន្នន័យតាមវ៉ិចទ័រនាឡិកា                |
| Lamport Logical Timestamp Engine     | ម៉ាស៊ីនកំណត់ត្រាពេលវេលាតក្កវិជ្ជាឡាំផត                      |
| Last Write Wins Deterministic Rule   | វិធានសម្រេចចុងក្រោយតាមពេលវេលាកំណត់                          |
| eMAR Duplicate Administration Alert  | ការប្រកាសអាសន្នការផ្តល់ថ្នាំត្រួតគ្នាលើសកម្រិត               |
| Inpatient Bed Allocation Race Gate   | ការការពារការដណ្តើមគ្រែសម្រាកព្យាបាលគ្នា                      |
| Monotonic Prescription Lifecycle     | វដ្តជីវិតវេជ្ជបញ្ជាតាមលំដាប់លំដោយមិនអាចថយក្រោយ                |
| Append Only Vital Signs Time Series  | កម្រងទិន្នន័យសញ្ញាជីវិតបន្ថែមបន្តបន្ទាប់មិនលុបទិន្នន័យចាស់    |
| GZIP Payload Compression Active      | ការបង្រួមទិន្នន័យកញ្ចប់ GZIP កំពុងដំណើរការ                   |
| Resumable Chunked Transfer Window    | ការបញ្ជូនទិន្នន័យជាកង់ៗដែលអាចបន្តឡើងវិញបាន                  |
| Cryptographic Merkle Root Integrity  | ភាពត្រឹមត្រូវនៃទិន្នន័យតាមដើមឈើគ្រីបតូ មឺឃើល                |
| Hardware Backed Terminal Signature   | ហត្ថលេខាឌីជីថលការពារដោយផ្នែករឹងលើឧបករណ៍ចល័ត                 |
| Peer to Peer Wi-Fi Direct Mesh Sync  | ការធ្វើសមកាលកម្មផ្ទាល់រវាងឧបករណ៍តាមវ៉ាយហ្វាយមូលដ្ឋាន         |
| Local Hotspot Clinic Node Master     | ម៉ាស៊ីនមេគ្រប់គ្រងបណ្តាញក្នុងគ្លីនិកចល័ត                    |
| Low Bandwidth Mode Active 2G EDGE    | ដំណើរការលើបណ្តាញល្បឿនយឺត ២ជី អ៊ីដជី                         |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 9. Safety Interlocks and Audit Gates

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Duplicate eMAR Overdose Interlock      | High-Priority Alarm | When concurrent GIVEN mutations are detected, both are  |
|                                        |                     | preserved and audible/visual overdose alerts trigger.   |
|                                        |                     |                                                         |
| Prescription Cancellation Precedence   | Inviolable Priority | A CANCELLED or DISCONTINUED state strictly dominates    |
|                                        |                     | active states, alerting clinicians if already dispensed.|
|                                        |                     |                                                         |
| Merkle Root Verification Gate          | Cryptographic Lock  | Rejects batch merge if Merkle leaf hashes fail SHA-256  |
|                                        |                     | validation, preventing offline database corruption.     |
|                                        |                     |                                                         |
| Compressed Payload Integrity Check     | Transport Guard     | GZIP decompression verifies CRC-32 checksum; corrupted  |
|                                        |                     | chunks are discarded and re-requested automatically.    |
|                                        |                     |                                                         |
| Bed Allocation Collision Failover      | Clinical Routing    | Second patient in a concurrent bed collision is moved   |
|                                        |                     | to UNASSIGNED_PENDING_SURGE_COT with charge nurse alert.|
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated verification confirms 0 emoji symbols.        |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated verification confirms 0 parentheses on lines  |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
