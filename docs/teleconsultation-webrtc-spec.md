# KruPet Healthcare Mobile WebRTC Teleconsultation and Remote Outpatient Architecture Specification

## Document Control
- Document ID: `SPEC-MOB-TELECONSULT-019`
- Version: `1.0.0`
- Target Platform: Android Native (Target SDK 35, Min SDK 26) / Kotlin 2.0 / WebRTC Native M124+
- Classification: Confidential - Clinical Telemedicine Architecture Standard
- Regulatory Compliance: Cambodia Ministry of Health (MoH) Telemedicine Guidelines, HIPAA Security Rule (45 CFR Part 160/164), ITU-T H.323/H.264/VP9 Recommendations

---

## 1. Executive Summary & Clinical Scope

The KruPet Teleconsultation Architecture establishes a secure, low-latency, bandwidth-resilient peer-to-peer and relayed clinical video consultation system. The platform connects remote rural commune health centers - Health Centers - មណ្ឌលសុខភាព - in geographically isolated provinces such as Mondulkiri, Ratanakiri, Koh Kong, Pursat, and Preah Vihear directly with provincial referral hospitals - មន្ទីរពេទ្យបង្អែកខេត្ត - and national tertiary centers in Phnom Penh, such as Calmette Hospital, National Pediatric Hospital, and Khmer-Soviet Friendship Hospital.

### Key Clinical Objectives
1. Remote Outpatient Consultations: Specialized physician assessments for rural outpatients without demanding arduous multi-day journeys.
2. Clinical Tele-Triage and Referral Escalation: Real-time specialist triage for maternal complications, acute pediatric distress, and surgical emergencies.
3. Live In-Call Clinical Interventions: Concurrent electronic prescribing (e-Rx), digital lab requisition, vital signs streaming, and SOAP note authoring without video interruption.
4. Resilient Media Pipeline: Uninterrupted clinical consultations across unstable rural Cambodian 3G and congested 4G cellular links with dynamic bitrate adaptation and automatic fallback to audio-only mode during severe network degradation.
5. Inviolable Security: DTLS-SRTP end-to-end media encryption, ephemeral single-use session tokens, and zero unencrypted local caching of consultations.

---

## 2. WebRTC Infrastructure and Signaling Topology

### 2.1 Network Topology Overview

```
 +------------------------+                      +------------------------+
 |   Rural Mobile Client  |                      | Specialist Physician   |
 |  (Android / Health Ctr)|                      | Mobile / Web Terminal  |
 +-----------+------------+                      +-----------+------------+
             |                                               |
             | 1. WSS Auth & Connect                         | 1. WSS Auth & Connect
             v                                               v
 +------------------------------------------------------------------------+
 |            KruPet Signaling Gateway (Node.js / Go Cluster)             |
 |            wss://teleconsult.krupet.com/v1/signaling                   |
 +------------------------------------------------------------------------+
             |                                               |
             | 2. SDP Offer/Answer Exchange                  |
             | 3. Trickle ICE Candidates                     |
             v                                               v
 +------------------------+                      +------------------------+
 | Direct Media P2P Stream| <==================> | Direct Media P2P Stream|
 | (DTLS-SRTP Audio/Video)|                      | (DTLS-SRTP Audio/Video)|
 +------------------------+                      +------------------------+
             ^                                               ^
             |                4. Symmetric NAT               |
             +-------------> Relay Fallback <---------------+
                                     |
                       +---------------------------+
                       | STUN / TURN Server Cluster|
                       |  coturn-kh-01.krupet.com  |
                       | (UDP/TCP/TLS Port 443/3478)
                       +---------------------------+
```

### 2.2 Signaling State Machine

The signaling protocol follows a deterministic state machine managing the consultation lifecycle:

1. `IDLE`: Client is unauthenticated and disconnected from the signaling gateway.
2. `AUTHENTICATING`: Client presents an ephemeral HMAC-SHA256 JWT consultation token.
3. `ROOM_JOINED`: Client has entered the virtual examination room and waits for the peer.
4. `OFFERING`: Primary initiator (typically the referring rural clinic) dispatches the SDP Offer.
5. `ANSWERING`: Answering peer (the specialist physician) dispatches the SDP Answer.
6. `CONNECTING`: ICE candidate gathering and DTLS handshake in progress.
7. `CONNECTED`: P2P or TURN-relayed media session actively flowing with RTCP telemetry.
8. `RECONNECTING`: Signal dropout detected; ICE restart initiated within a 20-second timeout window.
9. `TERMINATED`: Call ended cleanly by clinician or system; media streams and encryption keys destroyed.

### 2.3 STUN/TURN Relayed Traversal Architecture

Rural cellular towers in Cambodia frequently employ Carrier-Grade NAT (CGNAT) with aggressive UDP timeout windows (often 30 seconds). The WebRTC client implements the following ICE server configuration:

- Primary STUN Servers: `stun:stun-kh.krupet.com:3478`, `stun:stun.l.google.com:19302`.
- Primary TURN Server: `turn:coturn-kh-01.krupet.com:3478?transport=udp` (Low-latency UDP relay).
- Fallback TURN Server: `turn:coturn-kh-01.krupet.com:443?transport=tcp` (TCP port 443 relay bypasses restrictive enterprise or cellular firewalls).
- Secure TURN Server (TURNS): `turns:coturn-kh-01.krupet.com:443?transport=tcp` (TLS-encapsulated relay).
- Ephemeral TURN Credentials: Generated via RFC 5766 REST API mechanism using shared secret HMAC-SHA1 with a 1-hour expiration timestamp.

---

## 3. Signaling Message Protocol Specification

All signaling frames are encoded as JSON payloads transmitted over an authenticated WebSocket connection (`wss://teleconsult.krupet.com/v1/signaling`).

### 3.1 Signaling Frame Structure

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | Message action type: `join`, `offer`, `answer`, `ice_candidate`, `renegotiate`, `quality_probe`, `leave`, `error` |
| `sessionId` | String | UUID v4 identifying the teleconsultation encounter |
| `senderId` | String | Unique identifier of the transmitting user |
| `senderRole` | String | Role enum: `REFERRING_CLINICIAN`, `SPECIALIST_PHYSICIAN`, `SYSTEM_SUPERVISOR` |
| `payload` | Object | Message-specific payload (SDP description or ICE candidate details) |
| `timestamp` | Long | Epoch milliseconds of generation |
| `token` | String | Ephemeral JWT token attached on connection |

### 3.2 Sample Signaling Payloads

#### SDP Offer Message
```json
{
  "type": "offer",
  "sessionId": "tc-encounter-2026-908124",
  "senderId": "usr-nurse-mondulkiri-04",
  "senderRole": "REFERRING_CLINICIAN",
  "payload": {
    "sdp": "v=0\r\no=- 4829104812 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1 2\r\n...",
    "type": "offer"
  },
  "timestamp": 1772676000100
}
```

#### ICE Candidate Message
```json
{
  "type": "ice_candidate",
  "sessionId": "tc-encounter-2026-908124",
  "senderId": "usr-doc-calmette-12",
  "senderRole": "SPECIALIST_PHYSICIAN",
  "payload": {
    "candidate": "candidate:842163049 1 udp 1677729535 203.144.68.10 49152 typ srflx raddr 10.0.0.5 rport 49152",
    "sdpMid": "1",
    "sdpMLineIndex": 1
  },
  "timestamp": 1772676000250
}
```

---

## 4. Adaptive Bitrate (ABR) and Network Resilience Engine

Rural telecommunication infrastructure in remote Cambodian districts presents significant technical challenges: intermittent 3G HSPA+ connections, cell tower congestion during heavy monsoon rains, high latency jitter (250-900 ms), and high packet drop rates. The KruPet ABR Engine dynamically adjusts media pipelines to preserve diagnostic fidelity while eliminating call disconnections.

### 4.1 Resolution and Bitrate Ladder

| Tier | Quality Level | Video Resolution | Framerate | Target Video Bitrate | Min Video Bitrate | Audio Bitrate | Target Cellular Tech |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | High Definition (HD) | 1280x720 (720p) | 30 fps | 1200 kbps | 800 kbps | 48 kbps (Opus) | 4G LTE / Wi-Fi |
| **Tier 2** | Standard Definition (SD) | 854x480 (480p) | 24 fps | 500 kbps | 300 kbps | 32 kbps (Opus) | Stable 3G / Congested 4G |
| **Tier 3** | Low Definition (LD) | 426x240 (240p) | 15 fps | 150 kbps | 80 kbps | 24 kbps (Opus) | Weak 3G / Edge cell fringe |
| **Tier 4** | Audio-Only Fallback | Video Disabled | 0 fps | 0 kbps | 0 kbps | 24 kbps (Opus) | Degraded 3G / High packet loss |

### 4.2 Dynamic Congestion Control and Audio-Only Degradation Algorithm

```
                             +------------------------+
                             | Continuous RTCP Stats  |
                             |  Polled Every 2000 ms  |
                             +-----------+------------+
                                         |
                                         v
                         +-------------------------------+
                         | Compute 3-Cycle Moving Average|
                         |  Packet Loss, RTT, Jitter     |
                         +---------------+---------------+
                                         |
                    +--------------------+--------------------+
                    |                                         |
                    v                                         v
     [Packet Loss > 15% OR RTT > 600ms]        [Packet Loss Between 8% & 15%]
                    |                                         |
                    v                                         v
     +-------------------------------+         +-------------------------------+
     | IMMEDIATE EMERGENCY FALLBACK  |         | STEP DOWN ONE RESOLUTION TIER |
     | Mode: AUDIO-ONLY              |         | 720p -> 480p OR 480p -> 240p  |
     | Action: Disable Video Track   |         | Adjust SDP Bitrate Constraint |
     +-------------------------------+         +-------------------------------+
                    |                                         |
                    |                                         |
                    +--------------------+--------------------+
                                         |
                                         v
                      +-------------------------------------+
                      | HYSTERESIS RECOVERY VERIFICATION    |
                      | Packet Loss < 3% AND RTT < 250ms    |
                      | Must Sustain for 15 Continuous Sec  |
                      +------------------+------------------+
                                         |
                                  [Criteria Met?]
                                         |
                       +-----------------+-----------------+
                       |                                   |
                     [YES]                               [NO]
                       |                                   |
                       v                                   v
        +-----------------------------+     +-----------------------------+
        | STEP UP ONE RESOLUTION TIER |     | Retain Current Quality Tier |
        | Enable Video / Boost Bitrate|     | Continue Monitoring RTCP    |
        +-----------------------------+     +-----------------------------+
```

### 4.3 Mathematical Formulation of Quality Degradation

Let $PL_i$ denote the packet loss fraction in reporting interval $i \in \{1, 2, 3\}$, and let $RTT_i$ denote the Round Trip Time in milliseconds.

The moving averages are defined as:
$$\overline{PL} = \frac{1}{3} \sum_{i=1}^{3} PL_i$$
$$\overline{RTT} = \frac{1}{3} \sum_{i=1}^{3} RTT_i$$

The operational state transitions follow:

1. **Audio-Only Degradation Gate**:
   $$\text{IF } \overline{PL} > 0.15 \lor \overline{RTT} > 600\text{ ms} \implies \text{State} \leftarrow \text{AUDIO\_ONLY}$$

2. **Step-Down Degradation Gate**:
   $$\text{IF } 0.08 < \overline{PL} \le 0.15 \lor (350\text{ ms} < \overline{RTT} \le 600\text{ ms}) \implies \text{Tier} \leftarrow \max(\text{Tier} + 1, \text{Tier 3})$$

3. **Step-Up Hysteresis Recovery Gate**:
   $$\text{IF } \forall t \in [t_0, t_0 + 15\text{ s}], \quad PL(t) \le 0.03 \land RTT(t) \le 250\text{ ms} \implies \text{Tier} \leftarrow \min(\text{Tier} - 1, \text{Tier 1})$$

---

## 5. In-Call Concurrent Clinical Actions

To ensure maximum clinical productivity without interrupting real-time video, the platform multiplexes a dedicated WebRTC RTCDataChannel (`clinical-actions-channel`) alongside audio/video RTP streams. All in-call actions are simultaneously broadcast over the data channel to the peer and synced with the backend cloud database.

### 5.1 Concurrent Electronic Prescribing (e-Rx)

Physicians can formulate and modify electronic prescriptions while examining the patient on video:
- Real-time Prescription Drafting: The remote nurse and specialist view the identical e-Rx draft in real time.
- Integrated Safety Checks: Instant validation against patient allergies, drug-drug interactions, and Cambodia MoH Essential Medicines List (EDL 2026).
- Pediatric & Neonatal Dosing Verification: Clark, Young, and BSA dosing equations checked directly against patient weight pulled from the session vitals.
- Digital Signature: When finalized, the prescription is sealed using the physician's ECDSA private key stored in Android Keystore / KeyStore HSM.

### 5.2 Real-Time Live Vital Signs Review

Vital signs acquired at the rural health center (via manual entry or paired Bluetooth BLE clinical monitors) stream directly into the teleconsultation overlay:
- Monitored Parameters: Heart Rate (HR), Blood Pressure (NIBP), Oxygen Saturation (SpO2), Respiratory Rate (RR), Temperature (Temp), Blood Glucose.
- Automated Triage Badges: Instant NEWS2 (National Early Warning Score 2) calculation. If NEWS2 >= 5, a high-priority visual alert highlights the telemetry card without obstructing the physician's view of the patient's face.

### 5.3 Diagnostic Lab and Imaging Order Dispatch

- Requisition Dispatch: Rapid ordering of point-of-care tests (e.g., Dengue NS1 RDT, Malaria Pf/Pv combo RDT, Rapid HBsAg, Urine Dipstick) or referral lab panels (CBC, Serum Creatinine, Liver Enzymes).
- Imaging Orders: Referral requests for Ultrasound or Chest X-Ray with clinical indication notes transmitted instantly to the local clinic tablet.

### 5.4 Consultation Session Summary Notes (SOAP Architecture)

The teleconsultation interface provides a responsive, voice-dictation-enabled SOAP note editor:
- Subjective (S): Chief complaint, history of presenting illness, patient reported symptoms.
- Objective (O): Physical exam observations, inspected lesions via high-resolution camera freeze-frame, streamed vitals.
- Assessment (A): Primary ICD-10 clinical diagnosis, differential diagnoses, MoH disease classification.
- Plan (P): Medication regimen, diet/lifestyle instructions, follow-up schedule, emergency return criteria.

---

## 6. End-to-End Security, Cryptography & Compliance

### 6.1 Media Encryption Pipeline

```
+-------------------------------------------------------------------------+
|                              Media Layer                                |
|  Audio (Opus Codec)                    Video (VP8 / VP9 / H.264)        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  DTLS Handshake (Version 1.2 or 1.3)                    |
|    - ECDHE Key Exchange with Curve25519 or P-256                        |
|    - Ephemeral X.509 Certificates Generated Per Session                 |
|    - Authentication via Fingerprint in Signed SDP                       |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                 SRTP / SRTCP Symmetric Encryption                       |
|    - AEAD_AES_128_GCM or AEAD_AES_256_GCM                              |
|    - Replay Protection via 64-bit Sequence Counters                     |
|    - Zero Intermediary Decryption on STUN/TURN Relays                   |
+-------------------------------------------------------------------------+
```

### 6.2 Ephemeral Meeting Token Specification

Teleconsultation rooms cannot be accessed via static URLs. Every access request requires an Ephemeral HMAC-SHA256 JWT Token with the following cryptographic claims:

```json
{
  "iss": "krupet-identity-authority",
  "sub": "usr-doc-calmette-12",
  "aud": "krupet-teleconsult-gateway",
  "exp": 1772676900,
  "nbf": 1772676000,
  "iat": 1772676000,
  "jti": "nonce-9f823a-bc12-4e89",
  "encounterId": "enc-2026-08129",
  "patientId": "kh-pid-0091823",
  "clinicId": "clinic-hc-mondulkiri-02",
  "role": "SPECIALIST_PHYSICIAN",
  "allowedActions": [
    "MEDIA_PUBLISH",
    "MEDIA_SUBSCRIBE",
    "ERX_AUTHOR",
    "LAB_ORDER",
    "SOAP_SIGN"
  ]
}
```

### 6.3 MoH & HIPAA Compliance Policies

1. Zero Local Retention: Android WebRTC client forbids saving unencrypted raw video/audio frames to disk or external storage.
2. In-Call Recording Restrictions: Clinical sessions are strictly not recorded by default. If tele-mentoring or medical-legal documentation requires recording, both clinician and patient must execute a cryptographic dual-party consent handshake. Recorded media is immediately encrypted using AES-256-GCM with a key derived from the clinic HSM public key.
3. Cryptographic Audit Logging: Call connect times, disconnect times, network telemetry histograms, and in-call clinical actions are cryptographically hashed (SHA-256) and submitted to the MoH HMIS compliance audit ledger.

---

## 7. Kotlin Data Models and ABR Engine Implementation

### 7.1 Kotlin Serialization Data Structures

The following pure Kotlin data models define the teleconsultation domain.

```kotlin
package com.krupet.clinic.core.teleconsult.model

import kotlinx.serialization.Serializable

@Serializable
enum class CallParticipantRole {
    REFERRING_CLINICIAN,
    SPECIALIST_PHYSICIAN,
    SUPERVISING_CONSULTANT,
    PATIENT_REPRESENTATIVE
}

@Serializable
enum class SignalingMessageType {
    JOIN_ROOM,
    OFFER,
    ANSWER,
    ICE_CANDIDATE,
    QUALITY_STATE_CHANGE,
    CALL_ACTION,
    LEAVE_ROOM,
    ERROR
}

@Serializable
data class IceCandidatePayload(
    val candidate: String,
    val sdpMid: String?,
    val sdpMLineIndex: Int
)

@Serializable
data class SessionDescriptionPayload(
    val sdp: String,
    val type: String
)

@Serializable
data class SignalingEnvelope(
    val type: SignalingMessageType,
    val sessionId: String,
    val senderId: String,
    val senderRole: CallParticipantRole,
    val sdpOffer: SessionDescriptionPayload? = null,
    val sdpAnswer: SessionDescriptionPayload? = null,
    val iceCandidate: IceCandidatePayload? = null,
    val timestamp: Long,
    val token: String
)

@Serializable
enum class VideoResolutionTier(
    val width: Int,
    val height: Int,
    val fps: Int,
    val targetBitrateKbps: Int,
    val minBitrateKbps: Int
) {
    TIER_1_HD(1280, 720, 30, 1200, 800),
    TIER_2_SD(854, 480, 24, 500, 300),
    TIER_3_LD(426, 240, 15, 150, 80),
    TIER_4_AUDIO_ONLY(0, 0, 0, 0, 0)
}

@Serializable
data class NetworkTelemetrySample(
    val packetLossPercent: Double,
    val roundTripTimeMs: Double,
    val jitterMs: Double,
    val availableBandwidthKbps: Int,
    val timestampMs: Long
)

@Serializable
enum class InCallActionType {
    PRESCRIPTION_UPDATE,
    VITALS_STREAM_UPDATE,
    LAB_ORDER_DISPATCHED,
    SOAP_NOTE_SAVED
}

@Serializable
data class TelePrescriptionItem(
    val medicationId: String,
    val genericName: String,
    val dosageForm: String,
    val dose: String,
    val frequency: String,
    val durationDays: Int,
    val route: String,
    val instructionsKhmer: String
)

@Serializable
data class LiveVitalsOverlay(
    val heartRateBpm: Int,
    val systolicBpMmHg: Int,
    val diastolicBpMmHg: Int,
    val spO2Percent: Int,
    val respRateBpm: Int,
    val temperatureCelsius: Double,
    val news2Score: Int,
    val isCriticalAlert: Boolean
)

@Serializable
data class InCallClinicalPayload(
    val actionType: InCallActionType,
    val sessionId: String,
    val authorId: String,
    val prescriptionDraft: List<TelePrescriptionItem>? = null,
    val vitalsOverlay: LiveVitalsOverlay? = null,
    val labOrderIds: List<String>? = null,
    val timestampMs: Long
)
```

### 7.2 Adaptive Bitrate (ABR) Controller Engine

The following pure Kotlin class implements the network degradation and recovery state machine.

```kotlin
package com.krupet.clinic.core.teleconsult.engine

import com.krupet.clinic.core.teleconsult.model.NetworkTelemetrySample
import com.krupet.clinic.core.teleconsult.model.VideoResolutionTier

class AdaptiveBitrateController(
    private val packetLossEmergencyThreshold: Double = 15.0,
    private val rttEmergencyThresholdMs: Double = 600.0,
    private val packetLossDegradeThreshold: Double = 8.0,
    private val rttDegradeThresholdMs: Double = 350.0,
    private val recoveryLossThreshold: Double = 3.0,
    private val recoveryRttThresholdMs: Double = 250.0,
    private val recoveryHysteresisSeconds: Int = 15
) {
    var currentTier: VideoResolutionTier = VideoResolutionTier.TIER_2_SD
        private set

    private val recentSamples = ArrayDeque<NetworkTelemetrySample>(5)
    private var recoveryStableCounter: Int = 0

    fun processTelemetry(sample: NetworkTelemetrySample): TierAdjustmentResult {
        if (recentSamples.size >= 3) {
            recentSamples.removeFirst()
        }
        recentSamples.addLast(sample)

        if (recentSamples.size < 3) {
            return TierAdjustmentResult(currentTier, false, "Initial telemetry gathering")
        }

        val avgLoss = recentSamples.map { it.packetLossPercent }.average()
        val avgRtt = recentSamples.map { it.roundTripTimeMs }.average()

        if (avgLoss >= packetLossEmergencyThreshold || avgRtt >= rttEmergencyThresholdMs) {
            recoveryStableCounter = 0
            if (currentTier != VideoResolutionTier.TIER_4_AUDIO_ONLY) {
                currentTier = VideoResolutionTier.TIER_4_AUDIO_ONLY
                return TierAdjustmentResult(
                    tier = currentTier,
                    changed = true,
                    reasonKhmer = "បណ្តាញខ្សោយខ្លាំង ប្តូរទៅប្រើតែសំឡេងដើម្បីរក្សាការសន្ទនា",
                    reasonEnglish = "Severe network congestion: Fallback to audio-only"
                )
            }
            return TierAdjustmentResult(currentTier, false, "Maintained audio-only")
        }

        if (avgLoss >= packetLossDegradeThreshold || avgRtt >= rttDegradeThresholdMs) {
            recoveryStableCounter = 0
            val nextLowerTier = getNextLowerTier(currentTier)
            if (nextLowerTier != currentTier) {
                currentTier = nextLowerTier
                return TierAdjustmentResult(
                    tier = currentTier,
                    changed = true,
                    reasonKhmer = "បណ្តាញមិនថេរ កាត់បន្ថយគុណភាពរូបភាពដើម្បីបញ្ចៀសការរអាក់រអួល",
                    reasonEnglish = "Network unstable: Downgrading video resolution"
                )
            }
            return TierAdjustmentResult(currentTier, false, "Maintained degraded tier")
        }

        if (avgLoss <= recoveryLossThreshold && avgRtt <= recoveryRttThresholdMs) {
            recoveryStableCounter++
            val requiredIntervals = recoveryHysteresisSeconds / 2
            if (recoveryStableCounter >= requiredIntervals) {
                val nextHigherTier = getNextHigherTier(currentTier)
                if (nextHigherTier != currentTier) {
                    currentTier = nextHigherTier
                    recoveryStableCounter = 0
                    return TierAdjustmentResult(
                        tier = currentTier,
                        changed = true,
                        reasonKhmer = "បណ្តាញប្រសើរឡើងវិញ ដំឡើងគុណភាពរូបភាព",
                        reasonEnglish = "Network recovered: Upgrading video resolution"
                    )
                }
            }
        } else {
            recoveryStableCounter = 0
        }

        return TierAdjustmentResult(currentTier, false, "Optimal tier maintained")
    }

    private fun getNextLowerTier(tier: VideoResolutionTier): VideoResolutionTier {
        return when (tier) {
            VideoResolutionTier.TIER_1_HD -> VideoResolutionTier.TIER_2_SD
            VideoResolutionTier.TIER_2_SD -> VideoResolutionTier.TIER_3_LD
            VideoResolutionTier.TIER_3_LD -> VideoResolutionTier.TIER_4_AUDIO_ONLY
            VideoResolutionTier.TIER_4_AUDIO_ONLY -> VideoResolutionTier.TIER_4_AUDIO_ONLY
        }
    }

    private fun getNextHigherTier(tier: VideoResolutionTier): VideoResolutionTier {
        return when (tier) {
            VideoResolutionTier.TIER_4_AUDIO_ONLY -> VideoResolutionTier.TIER_3_LD
            VideoResolutionTier.TIER_3_LD -> VideoResolutionTier.TIER_2_SD
            VideoResolutionTier.TIER_2_SD -> VideoResolutionTier.TIER_1_HD
            VideoResolutionTier.TIER_1_HD -> VideoResolutionTier.TIER_1_HD
        }
    }
}

data class TierAdjustmentResult(
    val tier: VideoResolutionTier,
    val changed: Boolean,
    val reasonKhmer: String = "",
    val reasonEnglish: String = ""
)
```

---

## 8. Bilingual Khmer-English Teleconsultation Dictionary

The following clinical dictionary standardizes all user interface labels, status notifications, network alerts, and concurrent actions.

> [!NOTE]
> In strict accordance with platform typographic rules, all Khmer strings avoid parentheses and use hyphens, commas, or colons.

### 8.1 Connection Status and Signaling UI Labels

| Key Code | English Terminology | Khmer Terminology | Clinical Meaning |
| :--- | :--- | :--- | :--- |
| `TC_STATUS_CONNECTING` | Connecting to remote clinic | កំពុងភ្ជាប់ទៅកាន់មណ្ឌលសុខភាព | Initial signaling handshake |
| `TC_STATUS_ROOM_WAITING` | Waiting for specialist to join | កំពុងរង់ចាំគ្រូពេទ្យឯកទេសចូលរួម | Room active, awaiting physician |
| `TC_STATUS_CONNECTED` | Secure consultation active | ការពិគ្រោះជំងឺកំពុងដំណើរការដោយសុវត្ថិភាព | DTLS-SRTP active session |
| `TC_STATUS_RECONNECTING` | Network lost, reconnecting | បាត់បង់ប្រព័ន្ធ កំពុងភ្ជាប់ឡើងវិញ | ICE restart in progress |
| `TC_STATUS_ENDED` | Consultation completed | ការពិគ្រោះជំងឺបានបញ្ចប់ | Call closed and signed |
| `TC_ERR_TOKEN_EXPIRED` | Meeting token expired | សញ្ញាសម្ងាត់ចូលបន្ទប់ផុតកំណត់ | Ephemeral JWT expiry error |

### 8.2 Network Quality and ABR Alerts

| Key Code | English Terminology | Khmer Terminology | Clinical Meaning |
| :--- | :--- | :--- | :--- |
| `TC_NET_EXCELLENT` | High definition video enabled | គុណភាពរូបភាពកម្រិតខ្ពស់ | Tier 1 - 720p - active |
| `TC_NET_MODERATE` | Standard video quality | គុណភាពរូបភាពកម្រិតមធ្យម | Tier 2 - 480p - active |
| `TC_NET_DEGRADED` | Low video quality, network poor | គុណភាពរូបភាពកម្រិតទាប ដោយសារបណ្តាញខ្សោយ | Tier 3 - 240p - active |
| `TC_NET_AUDIO_ONLY` | Audio only mode, high packet loss | ដំណើរការតែសំឡេង ដោយសារបាត់បង់ទិន្នន័យច្រើន | Tier 4 fallback engaged |
| `TC_NET_RECOVERING` | Network stabilizing, restoring video | បណ្តាញមានលំនឹងឡើងវិញ កំពុងបើករូបភាព | Recovery hysteresis passed |

### 8.3 In-Call Clinical Workspace Controls

| Key Code | English Terminology | Khmer Terminology | Clinical Meaning |
| :--- | :--- | :--- | :--- |
| `TC_ACTION_ERX_DRAFT` | Draft electronic prescription | រៀបចំវេជ្ជបញ្ជាអេឡិចត្រូនិក | In-call e-Rx editing |
| `TC_ACTION_ERX_SIGN` | Sign and dispatch prescription | ចុះហត្ថលេខាឌីជីថល និងបញ្ជូនវេជ្ជបញ្ជា | ECDSA signing of e-Rx |
| `TC_ACTION_LAB_ORDER` | Dispatch rapid lab test | បញ្ជាការពិនិត្យមន្ទីរពិសោធន៍បន្ទាន់ | In-call diagnostic requisition |
| `TC_ACTION_VITALS_VIEW` | Review streamed vital signs | ពិនិត្យសញ្ញាជីវិតតាមពេលជាក់ស្តែង | Live vitals overlay toggle |
| `TC_ACTION_SOAP_NOTE` | Clinical consultation notes | កំណត់ត្រាវេជ្ជសាស្ត្រការពិគ្រោះជំងឺ | In-call SOAP note authoring |
| `TC_ACTION_END_CALL` | Complete and finalize encounter | បញ្ចប់ការពិគ្រោះ និងរក្សាទុកកំណត់ត្រា | End call and seal encounter |
| `TC_ACTION_MIC_MUTE` | Mute microphone | បិទសំឡេងមីក្រូហ្វូន | Mute local audio |
| `TC_ACTION_CAM_SWITCH` | Switch camera: front or rear | ប្តូរកាមេរ៉ា: ខាងមុខ ឬខាងក្រោយ | Toggle camera for skin exam |

---

## 9. Implementation Roadmap and Verification Matrix

### 9.1 Verification Checklist

| ID | Test Scenario | Acceptance Criteria | Target Result |
| :--- | :--- | :--- | :--- |
| `TC-TST-01` | Signaling Offer/Answer | Valid SDP exchange and ICE gathering completion < 2.5s | Pass |
| `TC-TST-02` | DTLS-SRTP Media Security | AES-128/256-GCM cipher negotiated; unencrypted media rejected | Pass |
| `TC-TST-03` | Emergency ABR Degradation | Instant fallback to audio-only within 2s of packet loss > 15% | Pass |
| `TC-TST-04` | Step-Up ABR Hysteresis | 15s stable network window required before resolution upgrade | Pass |
| `TC-TST-05` | Concurrent e-Rx Sync | In-call prescription updates synced over DataChannel < 100ms | Pass |
| `TC-TST-06` | Typography Compliance | Strictly zero emojis and zero parentheses in all Khmer text strings | Pass |
| `TC-TST-07` | Ephemeral Token Auth | Expired or modified tokens immediately rejected with HTTP 401 | Pass |

### 9.2 Conclusion

This specification provides the operational framework for high-availability, low-bandwidth WebRTC teleconsultations across remote Cambodian clinical networks. By combining robust DTLS-SRTP encryption, real-time ABR fallback mechanisms, and concurrent clinical workflows, KruPet ensures uninterrupted, specialist-grade healthcare delivery across every rural province.
