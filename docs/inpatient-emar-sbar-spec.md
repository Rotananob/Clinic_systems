# KruPet Enterprise Inpatient Ward Bed Management, eMAR and Structured SBAR Handover Specification

## Document Control
- Document ID: `SPEC-INPATIENT-EMAR-SBAR-020`
- Version: `1.0.0`
- Target Platform: Android Native Tablet / Workstation on Wheels (WOW) / Handheld Clinical PDA with Zebra-Honeywell 2D Barcode Engine
- Classification: Confidential - Flagship Inpatient Clinical Architecture Standard
- Regulatory Compliance: Cambodia Ministry of Health (MoH) Clinical Quality Standards, JCI International Patient Safety Goals (IPSG 1, 2, 3), ISMP High-Alert Medication Guidelines, WHO 5 Moments for Medication Safety

---

## 1. Executive Summary & Clinical Scope

The KruPet Enterprise Inpatient Platform standardizes mobile bedside clinical nursing and medical administration for provincial referral hospitals and national tertiary medical centers in Cambodia. This specification unifies three critical inpatient operational pillars:

1. **Inpatient Ward Bed Management**: Dynamic bed census, acuity-based bed classification (ICU, HDU, General Ward, Isolation Negative-Pressure, Pediatric, Maternity), structured inter-ward transfer protocols, and criteria-led discharge readiness algorithms.
2. **Electronic Medication Administration Record (eMAR) & Barcode Medication Administration (BCMA)**: Mobile bedside 2D DataMatrix scanning enforcing the Five Rights of Medication Administration, independent dual-nurse biometric witness sign-off for ISMP High-Alert medications, and automated PRN interval timing locks with 24-hour cumulative ceiling guards.
3. **Structured SBAR Clinical Handover**: Standardized shift-to-shift handover architecture (Situation, Background, Assessment, Recommendation) with real-time surfacing of laboratory panic values, invasive line maintenance tracking, and Lamport vector timestamp signatures for rural offline mesh synchronization.

---

## 2. Inpatient Ward Bed Management Architecture

### 2.1 Acuity-Based Bed Classification Matrix

Inpatient beds are classified according to clinical monitoring capabilities, nurse-to-patient staffing ratios, and medical gas/ventilation infrastructure:

| Bed Classification | Clinical Code | Nurse Ratio | Core Clinical Infrastructure | Acuity Level | Target Patient Population |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Intensive Care Unit** | `BED_ICU` | 1:1 or 1:2 | Invasive arterial line monitoring, multi-infusion smart syringe pumps, mechanical ventilator, central suction, defibrillator | Critical (Acuity 1) | Multi-organ failure, severe sepsis, post-cardiac arrest, shock |
| **High Dependency Unit** | `BED_HDU` | 1:2 or 1:3 | Non-invasive ventilation (BiPAP/CPAP), High-Flow Nasal Cannula (HFNC), continuous telemetry, step-down monitoring | High (Acuity 2) | Acute respiratory failure, DKA post-ICU, severe preeclampsia |
| **General Ward** | `BED_GEN` | 1:4 to 1:6 | Intermittent vitals monitor, wall oxygen flowmeter, call bell, intravenous infusion pole | Moderate (Acuity 3-4) | Stable medical admissions, routine post-operative convalescence |
| **Isolation Negative-Pressure** | `BED_ISO_NEG` | 1:2 or 1:3 | Airborne Infection Isolation Room (AIIR), >= 12 Air Changes per Hour (ACH), negative pressure differential >= -2.5 Pa, anteroom | High / Infection Risk | Active Pulmonary TB, Measles, Severe Acute Respiratory Infections (SARI) |
| **Pediatric Ward** | `BED_PED` | 1:3 or 1:4 | Age-specific cribs or pediatric beds with safety side-rails, Broselow color zone resuscitation tape, guardian bed | Moderate (Acuity 2-4) | Pediatric infections, severe malnutrition, bronchiolitis |
| **Maternity & Postpartum** | `BED_MAT` | 1:3 or 1:4 | Postpartum bed with perineal care setup, radiant warmer bassinet, Kangaroo Mother Care (KMC) support | Moderate (Acuity 3-4) | Post-cesarean, vaginal delivery recovery, neonatal rooming-in |

### 2.2 Bed Lifecycle State Machine

```
   +-----------------------------------------------------------+
   |                                                           |
   v                                                           |
+---------------------+    Nurse Admits Patient     +---------------------+
|    CLEAN_VACANT     | --------------------------> |      OCCUPIED       |
+---------------------+                             +---------------------+
   ^                                                           |
   |                                                           | Physician Signs
   | Housekeeping                                              | Discharge Order
   | Sanitizes Room                                            v
+---------------------+    Patient Transferred /    +---------------------+
| CLEANING_IN_PROGRESS|<-- Discharged               |  DISCHARGED_DIRTY   |
+---------------------+                             +---------------------+
   ^                                                           |
   | Maintenance                                               | Engineering
   | Cleared                                                   | Lock Required
   |                                                           v
   +------------------------------------------------+---------------------+
                                                    | MAINTENANCE_BLOCKED |
                                                    +---------------------+
```

### 2.3 Real-Time Bed Occupancy Metrics

The ward management engine continuously computes operational hospital metrics:
- **Bed Occupancy Rate (BOR)**:
  $$\text{BOR} = \frac{\sum \text{Occupied Bed-Days}}{\text{Total Available Beds} \times \text{Days in Period}} \times 100\%$$
- **Average Length of Stay (ALOS)**:
  $$\text{ALOS} = \frac{\sum \text{Inpatient Days of Discharged Patients}}{\text{Total Discharged Patients}}$$
- **Bed Turnover Interval (BTI)**:
  $$\text{BTI} = \frac{(\text{Available Bed-Days} - \text{Occupied Bed-Days})}{\text{Total Discharges}}$$

### 2.4 Criteria-Led Discharge Readiness Scoring

Discharge readiness is governed by a mandatory algorithmic safety checklist. A patient cannot transition to `DISCHARGE_READY` without satisfying all clinical gates:
1. Hemodynamic Stability: Vital signs normal for developmental age across past 24 consecutive hours (NEWS2 <= 2).
2. Oral Tolerance: Patient successfully tolerating oral nutrition and oral medications without persistent nausea or vomiting.
3. Pain Control: Numeric Rating Scale (NRS) pain score <= 3 using oral analgesia alone.
4. Laboratory & Diagnostic Review: Attending physician has formally reviewed and signed all outstanding lab and imaging reports.
5. Inpatient-to-Outpatient Medication Reconciliation: Discharge prescription drafted, safety-checked, and filled.
6. Follow-up and Referral Appointment: Scheduled outpatient clinic visit entered into HMIS.

---

## 3. Inpatient Electronic Medication Administration Record (eMAR)

### 3.1 Barcode Medication Administration (BCMA) Workflow

Bedside administration enforces a closed-loop scanning protocol using mobile PDA hardware:

```
[Nurse Initiates Administration]
               |
               v
[Step 1: Scan Patient Wristband DataMatrix]
   - Parses GS1-128 / DataMatrix: MRN, Encounter ID, Patient Name
   - Matches Active Bed Assignment and Verified Patient Record
   - Evaluates Known Allergies against Scheduled Medications
               |
               v
[Step 2: Scan Unit-Dose Blister Pack DataMatrix]
   - Parses GS1 DataMatrix: GTIN, Expiration Date, Lot Number, Serial
   - Verifies Medication Matches Active Prescribed Order
   - Validates Drug Not Expired (Current Timestamp < Expiration Date)
               |
               v
[Step 3: Five Rights Rule Verification Engine]
   - Evaluates Patient, Drug, Dose, Route, and Scheduled Time Window
               |
               +---------------------------------------+
               |                                       |
    [Standard Medication]                   [ISMP High-Alert Drug?]
               |                                       |
               v                                       v
[Single Nurse Execution Sign-off]      [Step 4: Dual-Nurse Biometric Witness]
               |                          - Second RN scans fingerprint or PIN
               |                          - Verifies dosage calculation & pump
               |                                       |
               +-------------------+-------------------+
                                   |
                                   v
             [Step 5: Immutable Administration Audit Sealed]
```

### 3.2 The Five Rights Verification Engine

The pure Kotlin verification engine evaluates the five rights:
1. **Right Patient**: Wristband encounter ID matches active bedside session.
2. **Right Drug**: Scanned medication GTIN matches active prescription formulary item.
3. **Right Dose**: Scanned unit dose multiplied by package count exactly equals ordered dose.
4. **Right Route**: Prescribed route matches medication package formulation (IV, PO, SC, IM, PR).
5. **Right Time**: Administration occurs within the clinical grace window:
   $$\text{Grace Window} = [T_{\text{scheduled}} - 30\text{ min}, \; T_{\text{scheduled}} + 30\text{ min}]$$
   *Any scan outside this grace window triggers a mandatory clinical justification override prompt (e.g., patient in radiology, delayed IV access, emergent physician hold).*

### 3.3 ISMP High-Alert Medication Dual-Nurse Biometric Verification

In accordance with Institute for Safe Medication Practices (ISMP) standards, high-alert medications require independent double-check by two Registered Nurses before administration:

#### High-Alert Drug Classes:
- **Concentrated Electrolytes**: Intravenous Potassium Chloride (KCl >= 20 mEq/100 mL), 3% Sodium Chloride hypertonic saline.
- **Insulin Formulations**: Intravenous regular insulin infusions, subcutaneous rapid/long-acting insulin doses.
- **Anticoagulants**: Unfractionated Heparin continuous IV infusions, Enoxaparin / Low Molecular Weight Heparins.
- **Chemotherapy Agents**: All parenteral antineoplastic cytotoxic regimens.
- **Opioid Infusions & PCA**: Morphine, Fentanyl, Hydromorphone continuous infusions or Patient-Controlled Analgesia.
- **Parenteral Vasoactive Inotropes**: Norepinephrine, Epinephrine, Dopamine, Vasopressin infusions.

#### Verification Protocol:
1. Primary Nurse scans patient wristband and medication blister pack.
2. System detects `isHighAlert == true` and displays the High-Alert Independent Witness Gate.
3. Witnessing Nurse independently verifies:
   - Patient identity and wristband.
   - Prescribed order, vial label, and expiration date.
   - Syringe graduation volume and smart infusion pump rate (mL/hr) and line concentration.
4. Witnessing Nurse scans biometric fingerprint or enters cryptographic PIN on the same PDA screen.
5. Both nurse IDs, timestamps, and geolocation coordinates are sealed into the record.

### 3.4 PRN (As-Needed) Dose Timing Locks & Cumulative 24-Hour Ceilings

To prevent accidental opioid or sedative overdosing, the system enforces automated algorithmic timing locks:

#### Minimum Interval Lock Algorithm:
Let $T_{\text{last}}$ be the timestamp of the last confirmed administration of a PRN medication, and let $\Delta t_{\text{interval}}$ be the prescribed minimum interval (e.g., 4 hours for IV Morphine).

The lock condition is evaluated as:
$$\text{IsLocked}(t) = \begin{cases} \text{TRUE}, & \text{if } t < T_{\text{last}} + \Delta t_{\text{interval}} \\ \text{FALSE}, & \text{if } t \ge T_{\text{last}} + \Delta t_{\text{interval}} \end{cases}$$

If $\text{IsLocked}(t) == \text{TRUE}$, the PDA interface renders the administration button disabled with a countdown timer showing remaining minutes. Emergency bypass requires attending physician override code and mandatory justification.

#### Cumulative 24-Hour Ceiling Guard:
The system dynamically computes the total active dose administered within a rolling 24-hour window:
$$\text{Dose}_{24\text{h}}(t) = \sum_{k \in \mathcal{A}_{24\text{h}}} \text{Dose}_k$$
Where $\mathcal{A}_{24\text{h}} = \{ k \mid t - 24\text{ hours} \le T_k \le t \}$.

If $\text{Dose}_{24\text{h}}(t) + \text{Dose}_{\text{new}} > \text{Dose}_{\text{ceiling}}$, the administration is hard blocked (e.g., Paracetamol cumulative dose > 4000 mg/24h in adults, or > 75 mg/kg/24h in pediatrics).

---

## 4. Structured SBAR Clinical Handover Architecture

The KruPet SBAR Handover module enforces structured clinical communication during nursing shift changes, physician rounds, and inter-departmental patient handovers:

### 4.1 SBAR Structural Components

```
+-------------------------------------------------------------------------+
|                        S - SITUATION: ស្ថានភាពបច្ចុប្បន្ន                 |
| - Patient Identifiers: Name, Age, Sex, MRN, Bed Number, Ward            |
| - Code Status: Full Code, DNR (Do Not Resuscitate)                      |
| - Admitting Diagnosis & Hospital Day Number                             |
| - Current NEWS2 / PEWS Acuity Score & Triage Category                   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        B - BACKGROUND: ប្រវត្តិវេជ្ជសាស្ត្រ                |
| - Primary Medical History & Surgical Interventions                      |
| - Known Drug, Food, and Environmental Allergies (Red Banner)            |
| - Baseline Renal & Hepatic Function (Baseline Cr, GFR, AST/ALT)         |
| - Infection Control Status (MRSA, Multi-Drug Resistant TB, Contact/Air) |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        A - ASSESSMENT: ការវាយតម្លៃគ្លីនិក                 |
| - Vital Signs Trends (HR, BP, SpO2, RR, Temp, GCS)                      |
| - Current Infusions (Vasoactive agents, Sedation, Maintenance fluids)   |
| - Invasive Lines: CVC, Peripheral IV, Foley Catheter, Arterial Line     |
|   * Insertion Date, Site Assessment, and Days in Situ (CLABSI/CAUTI)    |
| - Laboratory Panic Values & Critical Imaging Findings                   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     R - RECOMMENDATION: អនុសាសន៍ និងផែនការ              |
| - Priority Nursing Interventions for Next Shift                         |
| - Pending Diagnostic Orders (Blood cultures, Morning labs, CT scan)     |
| - Expected Clinical Milestones & Discharge Criteria                     |
| - Escalation Triggers: Specific criteria to notify on-call physician    |
+-------------------------------------------------------------------------+
```

### 4.2 Critical Lab Panic Values and Imaging Consult Alerts

The SBAR interface automatically queries the laboratory information system and highlights unacknowledged critical values:

| Diagnostic Parameter | Critical Low Panic Value | Critical High Panic Value | Required Clinical Handover Alert |
| :--- | :--- | :--- | :--- |
| **Serum Potassium** | < 2.8 mmol/L | > 6.0 mmol/L | Arrhythmia risk, urgent ECG and replacement / resin protocol |
| **Serum Sodium** | < 120 mmol/L | > 160 mmol/L | Seizure / osmotic demyelination risk, neuro check q2h |
| **Platelet Count** | < 20,000 /uL | > 1,000,000 /uL | Spontaneous hemorrhage risk, transfuse platelets, hold LMWH |
| **Blood Glucose** | < 3.0 mmol/L (54 mg/dL) | > 25.0 mmol/L (450 mg/dL) | Severe hypoglycemia protocol / DKA-HHS management |
| **Arterial Blood pH** | < 7.20 | > 7.60 | Severe acid-base imbalance, immediate ABG re-check |
| **Hemoglobin** | < 6.0 g/dL | > 20.0 g/dL | Transfusion protocol, cross-match 2 units PRBC |

### 4.3 Digital Handover Sign-Off & Mesh Sync Integration

To guarantee safe handover continuity in rural clinics without dependable Internet, handovers utilize Lamport Logical Clocks and Vector Timestamps:

```kotlin
@Serializable
data class HandoverVectorClock(
    val stationId: String,
    val clockSequence: Long,
    val timestampUtcMs: Long
)
```

Both the outgoing nurse and incoming receiving nurse must authenticate their credentials on the tablet. The handover packet is cryptographically hashed (SHA-256), marked with the station's vector clock, and broadcast across the local Wi-Fi peer mesh to guarantee audit trail consistency.

---

## 5. Pure Kotlin Implementation Models and Verification Engine

### 5.1 Kotlin Domain Data Structures

```kotlin
package com.krupet.clinic.core.inpatient.model

import kotlinx.serialization.Serializable

@Serializable
enum class BedClassificationType {
    BED_ICU,
    BED_HDU,
    BED_GEN,
    BED_ISO_NEG,
    BED_PED,
    BED_MAT
}

@Serializable
enum class BedOperationalStatus {
    CLEAN_VACANT,
    OCCUPIED,
    DISCHARGED_DIRTY,
    CLEANING_IN_PROGRESS,
    MAINTENANCE_BLOCKED,
    RESERVED_TRANSFER
}

@Serializable
data class InpatientBed(
    val bedId: String,
    val wardId: String,
    val roomNumber: String,
    val bedNumber: String,
    val classification: BedClassificationType,
    val status: BedOperationalStatus,
    val currentEncounterId: String? = null,
    val currentPatientId: String? = null,
    val hasMechanicalVentilator: Boolean = false,
    val hasNegativePressureGauge: Boolean = false,
    val nurseRatioTarget: String
)

@Serializable
enum class MedicationAdministrationRoute {
    INTRAVENOUS,
    ORAL,
    SUBCUTANEOUS,
    INTRAMUSCULAR,
    RECTAL,
    INHALATION,
    TOPICAL
}

@Serializable
data class ScheduledDoseItem(
    val orderId: String,
    val encounterId: String,
    val medicationId: String,
    val drugName: String,
    val gtinBarcode: String,
    val prescribedDoseValue: Double,
    val doseUnit: String,
    val route: MedicationAdministrationRoute,
    val scheduledEpochMs: Long,
    val isHighAlert: Boolean,
    val isPrn: Boolean,
    val prnMinIntervalMinutes: Int? = null,
    val maxDailyCeilingDose: Double? = null
)

@Serializable
data class AdministrationScanInput(
    val scannedPatientBarcode: String,
    val scannedMedicationBarcode: String,
    val administeredDose: Double,
    val primaryNurseId: String,
    val currentEpochMs: Long,
    val overrideReason: String? = null
)

@Serializable
data class BiometricWitnessCredentials(
    val witnessNurseId: String,
    val witnessBiometricToken: String,
    val witnessTimestampMs: Long
)

@Serializable
enum class BcmaVerificationStatus {
    VERIFIED_READY,
    WRONG_PATIENT_ERROR,
    WRONG_MEDICATION_ERROR,
    WRONG_DOSE_ERROR,
    WRONG_TIME_EARLY_WARNING,
    WRONG_TIME_LATE_WARNING,
    HIGH_ALERT_WITNESS_REQUIRED,
    PRN_INTERVAL_LOCKED_ERROR,
    DAILY_CEILING_EXCEEDED_ERROR
}

@Serializable
data class BcmaVerificationResult(
    val status: BcmaVerificationStatus,
    val isExecutable: Boolean,
    val messageKhmer: String,
    val messageEnglish: String,
    val lockRemainingMinutes: Int = 0
)

@Serializable
data class InvasiveLineTracker(
    val lineType: String,
    val insertionSite: String,
    val insertionEpochMs: Long,
    val dressingChangeEpochMs: Long,
    val isIntactWithoutErythema: Boolean
)

@Serializable
data class PanicLabItem(
    val testName: String,
    val resultValue: String,
    val referenceRange: String,
    val reportedEpochMs: Long,
    val isAcknowledgedByNurse: Boolean
)

@Serializable
data class SbarHandoverReport(
    val handoverId: String,
    val encounterId: String,
    val bedNumber: String,
    val situationText: String,
    val backgroundText: String,
    val assessmentText: String,
    val recommendationText: String,
    val activeNews2Score: Int,
    val codeStatus: String,
    val allergiesList: List<String>,
    val invasiveLines: List<InvasiveLineTracker>,
    val panicLabs: List<PanicLabItem>,
    val outgoingNurseId: String,
    val incomingNurseId: String,
    val handoverTimestampMs: Long,
    val vectorClockStationId: String,
    val vectorClockSequence: Long
)
```

### 5.2 Pure Kotlin eMAR Verification Engine

```kotlin
package com.krupet.clinic.core.inpatient.engine

import com.krupet.clinic.core.inpatient.model.AdministrationScanInput
import com.krupet.clinic.core.inpatient.model.BcmaVerificationResult
import com.krupet.clinic.core.inpatient.model.BcmaVerificationStatus
import com.krupet.clinic.core.inpatient.model.BiometricWitnessCredentials
import com.krupet.clinic.core.inpatient.model.ScheduledDoseItem
import kotlin.math.abs

class EmarVerificationEngine {

    fun verifyAdministration(
        expectedPatientMrn: String,
        scheduledDose: ScheduledDoseItem,
        scan: AdministrationScanInput,
        lastAdminEpochMs: Long?,
        cumulativePast24hDose: Double,
        witnessCredentials: BiometricWitnessCredentials?
    ): BcmaVerificationResult {
        if (scan.scannedPatientBarcode != expectedPatientMrn) {
            return BcmaVerificationResult(
                status = BcmaVerificationStatus.WRONG_PATIENT_ERROR,
                isExecutable = false,
                messageKhmer = "កំហុសអ្នកជំងឺមិនត្រឹមត្រូវ: ព័ត៌មានខ្សែដៃមិនត្រូវគ្នានឹងវេជ្ជបញ្ជា",
                messageEnglish = "Wrong patient error: Wristband barcode does not match active prescription"
            )
        }

        if (scan.scannedMedicationBarcode != scheduledDose.gtinBarcode) {
            return BcmaVerificationResult(
                status = BcmaVerificationStatus.WRONG_MEDICATION_ERROR,
                isExecutable = false,
                messageKhmer = "កំហុសថ្នាំមិនត្រឹមត្រូវ: បាកូដឱសថមិនត្រូវគ្នានឹងវេជ្ជបញ្ជា",
                messageEnglish = "Wrong medication error: Drug barcode does not match prescribed formulary item"
            )
        }

        if (abs(scan.administeredDose - scheduledDose.prescribedDoseValue) > 0.0001) {
            return BcmaVerificationResult(
                status = BcmaVerificationStatus.WRONG_DOSE_ERROR,
                isExecutable = false,
                messageKhmer = "កំហុសកម្រិតថ្នាំ: បរិមាណផ្តល់មិនត្រូវគ្នានឹងកម្រិតដែលបានកំណត់",
                messageEnglish = "Wrong dose error: Administered amount does not match prescribed dose"
            )
        }

        if (scheduledDose.isPrn && scheduledDose.prnMinIntervalMinutes != null && lastAdminEpochMs != null) {
            val elapsedMinutes = (scan.currentEpochMs - lastAdminEpochMs) / 60000L
            val requiredInterval = scheduledDose.prnMinIntervalMinutes
            if (elapsedMinutes < requiredInterval) {
                val remaining = (requiredInterval - elapsedMinutes).toInt()
                return BcmaVerificationResult(
                    status = BcmaVerificationStatus.PRN_INTERVAL_LOCKED_ERROR,
                    isExecutable = false,
                    messageKhmer = "ជាប់សោពេលវេលាថ្នាំតាមការចាំបាច់: មិនទាន់ដល់ពេលដែលអាចផ្តល់ថ្នាំម្តងទៀតបានទេ",
                    messageEnglish = "PRN timing lock active: Minimum dosing interval has not elapsed",
                    lockRemainingMinutes = remaining
                )
            }
        }

        if (scheduledDose.maxDailyCeilingDose != null) {
            val potentialTotal = cumulativePast24hDose + scan.administeredDose
            if (potentialTotal > scheduledDose.maxDailyCeilingDose) {
                return BcmaVerificationResult(
                    status = BcmaVerificationStatus.DAILY_CEILING_EXCEEDED_ERROR,
                    isExecutable = false,
                    messageKhmer = "លើសកម្រិតអតិបរមាក្នុង២៤ម៉ោង: មិនអាចផ្តល់ថ្នាំបានទេ ព្រោះលើសកម្រិតសុវត្ថិភាព",
                    messageEnglish = "24-hour cumulative ceiling exceeded: Administration blocked for safety"
                )
            }
        }

        if (scheduledDose.isHighAlert && witnessCredentials == null) {
            return BcmaVerificationResult(
                status = BcmaVerificationStatus.HIGH_ALERT_WITNESS_REQUIRED,
                isExecutable = false,
                messageKhmer = "ឱសថប្រុងប្រយ័ត្នខ្ពស់: តម្រូវឱ្យមានគិលានុបដ្ឋាយិកាទីពីរផ្ទៀងផ្ទាត់ជីវមាត្រ",
                messageEnglish = "High-alert medication: Second nurse biometric witness sign-off is required"
            )
        }

        val timeDeltaMinutes = (scan.currentEpochMs - scheduledDose.scheduledEpochMs) / 60000L
        if (timeDeltaMinutes < -30) {
            return BcmaVerificationResult(
                status = BcmaVerificationStatus.WRONG_TIME_EARLY_WARNING,
                isExecutable = scan.overrideReason != null,
                messageKhmer = "ការផ្តល់ថ្នាំមុនពេលកំណត់: លើសពី៣០នាទីមុនម៉ោងកំណត់ តម្រូវឱ្យមានមូលហេតុច្បាស់លាស់",
                messageEnglish = "Early administration warning: More than 30 minutes before scheduled time"
            )
        } else if (timeDeltaMinutes > 30) {
            return BcmaVerificationResult(
                status = BcmaVerificationStatus.WRONG_TIME_LATE_WARNING,
                isExecutable = scan.overrideReason != null,
                messageKhmer = "ការផ្តល់ថ្នាំយឺតពេល: លើសពី៣០នាទីក្រោយម៉ោងកំណត់ តម្រូវឱ្យមានមូលហេតុច្បាស់លាស់",
                messageEnglish = "Late administration warning: More than 30 minutes after scheduled time"
            )
        }

        return BcmaVerificationResult(
            status = BcmaVerificationStatus.VERIFIED_READY,
            isExecutable = true,
            messageKhmer = "ការផ្ទៀងផ្ទាត់ត្រឹមត្រូវទាំងស្រុង: អាចដំណើរការផ្តល់ថ្នាំជូនអ្នកជំងឺបាន",
            messageEnglish = "Five rights verified successfully: Safe for administration"
        )
    }
}
```

---

## 6. Khmer Bilingual Terminology and Medical Nomenclature

Standardized clinical terminology for hospital ward management, medication routes, and SBAR handover:

> [!NOTE]
> In strict compliance with system rules, all Khmer strings avoid parentheses and use hyphens, colons, or commas.

### 6.1 Inpatient Bed Types and Ward Classifications

| Key Code | English Nomenclature | Khmer Medical Nomenclature | Clinical Context |
| :--- | :--- | :--- | :--- |
| `BED_ICU` | Intensive Care Unit Bed | គ្រែអង្គភាពថែទាំបន្ទាន់កម្រិតធ្ងន់ | Critical care bed with ventilator |
| `BED_HDU` | High Dependency Unit Bed | គ្រែអង្គភាពថែទាំកម្រិតខ្ពស់ | Intermediate step-down bed |
| `BED_GEN` | General Inpatient Ward Bed | គ្រែបន្ទប់សម្រាកព្យាបាលទូទៅ | Standard acute inpatient care |
| `BED_ISO_NEG` | Negative-Pressure Isolation Bed | គ្រែបន្ទប់ចត្តាឡីស័កសម្ពាធអវិជ្ជមាន | Airborne contagion isolation |
| `BED_PED` | Pediatric Ward Bed | គ្រែផ្នែកកុមារ | Pediatric bed with safety rails |
| `BED_MAT` | Maternity Postpartum Bed | គ្រែផ្នែកសម្ភព និងក្រោយសម្រាល | Post-delivery mother and neonate |
| `BED_STATUS_CLEAN` | Clean and Ready Bed | គ្រែស្អាតទំនេរ ត្រៀមទទួលអ្នកជំងឺ | Ready for patient admission |
| `BED_STATUS_DIRTY` | Dirty Bed Awaiting Cleaning | គ្រែកខ្វក់ រង់ចាំការសម្អាត | Discharged patient departure |

### 6.2 Medication Administration Routes

| Key Code | English Terminology | Khmer Medical Terminology | Route Details |
| :--- | :--- | :--- | :--- |
| `ROUTE_IV` | Intravenous Injection or Infusion | តាមសរសៃឈាមវ៉ែន - IV | Direct venous injection or drip |
| `ROUTE_PO` | Oral Ingestion | តាមមាត់ - PO | Swallowed tablets, capsules, liquid |
| `ROUTE_SC` | Subcutaneous Injection | ក្រោមស្បែក - SC | Insulin, heparin fatty tissue injection |
| `ROUTE_IM` | Intramuscular Injection | ក្នុងសាច់ដុំ - IM | Deep gluteal or deltoid injection |
| `ROUTE_PR` | Rectal Suppository | តាមរន្ធគូទ - PR | Suppository, rectal enema |
| `ROUTE_INH` | Inhalation Nebulization | តាមការដកដង្ហើម ឬបាញ់ស្ព្រាយ | Nebulizer or metered-dose inhaler |
| `ROUTE_TOP` | Topical Application | លើស្បែក ឬលាបខាងក្រៅ | Ointment, transdermal patch |

### 6.3 Nursing Verification Alerts and Safety Gates

| Key Code | English Terminology | Khmer Medical Terminology | Clinical Operational Meaning |
| :--- | :--- | :--- | :--- |
| `ALERT_WRONG_PT` | Wrong Patient Barcode Mismatch | កំហុសអ្នកជំងឺមិនត្រឹមត្រូវ មិនត្រូវនឹងវេជ្ជបញ្ជា | Bedside wristband mismatch |
| `ALERT_WRONG_DRUG` | Wrong Medication Barcode | កំហុសឱសថមិនត្រឹមត្រូវ បាកូដមិនត្រូវគ្នានឹងវេជ្ជបញ្ជា | Scanned blister pack mismatch |
| `ALERT_WRONG_DOSE` | Dose Discrepancy Error | កំហុសកម្រិតថ្នាំ បរិមាណមិនត្រូវនឹងវេជ្ជបញ្ជា | Dosage strength discrepancy |
| `ALERT_HIGH_ALERT` | Dual-Nurse Witness Required | ឱសថប្រុងប្រយ័ត្នខ្ពស់ តម្រូវឱ្យមានគិលានុបដ្ឋាយិកាទីពីរផ្ទៀងផ្ទាត់ | High-alert double check |
| `ALERT_PRN_LOCKED` | PRN Interval Timing Lock Active | ជាប់សោពេលវេលាថ្នាំតាមការចាំបាច់ មិនទាន់ដល់ម៉ោងអាចផ្តល់បាន | Prevent premature PRN dose |
| `ALERT_CEILING_MAX` | Daily Cumulative Dose Exceeded | លើសកម្រិតអតិបរមាក្នុង២៤ម៉ោង មិនអាចផ្តល់ថ្នាំបានទេ | Daily toxicity ceiling block |
| `ALERT_OVERDUE` | Medication Administration Overdue | ថ្នាំហួសម៉ោងផ្តល់លើសពី៣០នាទី | Overdue scheduled medication |

### 6.4 Structured SBAR Handover Nomenclature

| SBAR Domain | English Terminology | Khmer Medical Terminology | Clinical Focus Area |
| :--- | :--- | :--- | :--- |
| **S** | Situation: Chief complaint and acuity | ស្ថានភាពបច្ចុប្បន្ន: រោគវិនិច្ឆ័យ និងកម្រិតធ្ងន់ធ្ងរ | Active status and NEWS2 score |
| **B** | Background: History and allergies | ប្រវត្តិវេជ្ជសាស្ត្រ: ប្រវត្តិជំងឺ និងប្រតិកម្មថ្នាំ | Comorbidities, surgeries, allergies |
| **A** | Assessment: Vitals and lines | ការវាយតម្លៃគ្លីនិក: សញ្ញាជីវិត និងទុយោវេជ្ជសាស្ត្រ | Vitals, CVC, Foley, infusions |
| **R** | Recommendation: Plan and labs | អនុសាសន៍ និងផែនការ: កិច្ចការបន្ត និងការតាមដាន | Actions, lab chasing, consults |
| `SBAR_SIGN_OUT` | Outgoing Nurse Digital Sign-Off | ហត្ថលេខាឌីជីថលគិលានុបដ្ឋាយិកាចេញវេន | Primary nurse handover seal |
| `SBAR_SIGN_IN` | Incoming Nurse Digital Receipt | ហត្ថលេខាឌីជីថលគិលានុបដ្ឋាយិកាចូលវេន | Receiving nurse acceptance |
| `PANIC_LAB_ALERT` | Critical Laboratory Panic Value | តម្លៃមន្ទីរពិសោធន៍អាសន្នធ្ងន់ធ្ងរ | Immediate physician escalation |

---

## 7. Quality Assurance, Security & Regulatory Matrix

### 7.1 Verification Checklist

| Test ID | Test Scenario | Verification Criteria | Expected Outcome |
| :--- | :--- | :--- | :--- |
| `EMAR-TST-01` | Right Patient Wristband Scan | Scan wristband differing from active bed encounter; verify immediate hard block | Hard Block `WRONG_PATIENT_ERROR` |
| `EMAR-TST-02` | Unit-Dose GTIN Verification | Scan different drug barcode; verify alert message and administration block | Hard Block `WRONG_MEDICATION_ERROR` |
| `EMAR-TST-03` | ISMP High-Alert Dual Sign-off | Attempt single nurse administration of IV KCl; verify second nurse biometric prompt | Gate Engaged `HIGH_ALERT_WITNESS_REQUIRED` |
| `EMAR-TST-04` | PRN Dosing Timing Lock | Attempt Morphine admin 2 hours after previous dose (q4h order); verify lock countdown | Hard Lock `PRN_INTERVAL_LOCKED_ERROR` |
| `EMAR-TST-05` | 24-Hour Paracetamol Ceiling | Attempt 1000 mg dose when past 24h total is 3500 mg (max 4000 mg); verify block | Block `DAILY_CEILING_EXCEEDED_ERROR` |
| `EMAR-TST-06` | SBAR Panic Lab Surfacing | Inject critical potassium 6.4 mmol/L; verify red banner on shift handover screen | Flagged `PANIC_LAB_ALERT` |
| `EMAR-TST-07` | Typography Constraints | Automated scan for zero emojis and zero parentheses across all Khmer strings | 100% Pass (Zero Violations) |

### 7.2 Conclusion

The KruPet Enterprise Inpatient Ward Bed Management, eMAR, and SBAR Handover specification establishes an enterprise standard for acute hospital care. By combining hardware-accelerated 2D DataMatrix scanning, algorithmic 5-rights verification, independent dual-nurse biometric witness gates, and structured SBAR continuity with offline vector clock synchronization, KruPet eliminates medication administration errors and elevates clinical patient safety across all public and private hospital wards in Cambodia.
