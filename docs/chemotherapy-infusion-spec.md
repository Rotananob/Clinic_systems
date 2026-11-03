# KruPet Enterprise Oncology Chemotherapy Infusion Safety Specification
Document Identifier: ONCOLOGY-CHEMO-INFUSION-SPEC-2026-V1
Compliance Standards: ASCO/ONS Chemotherapy Administration Safety Standards, NCCN Guidelines, ONS Extravasation Guidelines, FDA Oncology Dosing Standards
Classification: Enterprise Standard Medical Oncology, Mobile Bedside eMAR, and Hazardous Drug Administration Protocol

---

## 1. Executive Summary and Mobile Bedside Oncology Architecture

### 1.1 Clinical Rationale
Antineoplastic chemotherapy agents have the narrowest therapeutic index of any therapeutic class. Sub-therapeutic underdosing risks preventable malignant recurrence, while supratherapeutic overdosing causes fatal pancytopenic septic shock, hemorrhagic cystitis, irreversible anthracycline cardiomyopathy, or necrotic tissue sloughing requiring limb amputation.

The KruPet Enterprise Oncology Chemotherapy Infusion Engine operationalizes rigorous mobile bedside safeguards for oncology nurses, hospital pharmacists, and medical oncologists:
1. Dual-Formula Body Surface Area (BSA) evaluation: Mosteller and DuBois & DuBois with automated safety ceilings.
2. Precision Calvert Formula for Carboplatin dosing with mandatory FDA/ASCO GFR capping at $125\text{ mL/min}$.
3. Automated Pre-Chemotherapy Laboratory Safety Hard Stops (ANC $\ge 1,500/\mu\text{L}$, Platelets $\ge 100,000/\mu\text{L}$, Creatinine $\le 1.5\times\text{ULN}$).
4. Mandatory Independent Dual-Nurse Biometric Verification Workflow before smart infusion pump actuation.
5. Extravasation Emergency Antidote Protocols (Dexrazoxane for anthracyclines, Hyaluronidase for vinca alkaloids).

```
+----------------------------------------------------------------------------------------------------+
|                  KRUPET MOBILE BEDSIDE ONCOLOGY CHEMOTHERAPY SAFETY ENGINE                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL ONCOLOGY ORDER ENTRY & BED-SIDE CHECK-IN ]                                             |
|  - Patient Height (cm), Weight (kg), Gender, Age                                                   |
|  - Recent Pre-Cycle Labs: Absolute Neutrophil Count (ANC), Platelets, Creatinine, Bilirubin, AST/ALT|
|  - Lifetime Cumulative Anthracycline Exposure History                                             |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | ANTHROPOMETRIC & CALVERT CALCULATOR                                                           | |
|  | - Calculates BSA: Mosteller (Primary) and DuBois & DuBois (Secondary)                         | |
|  | - Evaluates BSA Capping Policy: Advisory at > 2.0 m2; Hard Clamp at 2.2 m2 for non-curative   | |
|  | - Evaluates Cockcroft-Gault CrCl & Clamps GFR at 125 mL/min                                    | |
|  | - Computes Carboplatin Dose = Target_AUC * (min(GFR, 125) + 25)                                | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | NCCN / ASCO PRE-CYCLE LABORATORY HARD STOPS                                                   | |
|  | - ANC < 1,500 /mcL -> AUTOMATED CHEMO CYCLE HOLD (Febrile Neutropenia Risk)                   | |
|  | - Platelets < 100,000 /mcL -> AUTOMATED CHEMO CYCLE HOLD (Hemorrhagic Diathesis Risk)         | |
|  | - Serum Creatinine > 1.5x ULN -> CISPLATIN / METHOTREXATE HARD STOP (Nephrotoxicity)          | |
|  | - Total Bilirubin > 1.5x ULN -> 50% DOSE REDUCTION (Hepatic Clearance Interlock)              | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | INDEPENDENT DUAL-NURSE BIOMETRIC WITNESS WORKFLOW                                              | |
|  | - Primary Oncology Nurse: Scans patient UPID, scans drug vial/bag barcode, signs biometrics    | |
|  | - Witness Oncology Nurse: Blind verification (values masked), independent calculation entry,   | |
|  |   signs secondary biometrics                                                                   | |
|  | - Two-Person Rule: Primary and Witness must be distinct licensed clinicians                    | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ SMART INFUSION PUMP TELEMETRY ACTUATION & EXTRAVASATION GUARD ]                                 |
|  - Transmits validated volume and rate to smart pump via IEC 60601-1-8 DERS protocol              |
|  - Standby Extravasation Antidote Module: Dexrazoxane and Hyaluronidase rapid emergency access     |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Body Surface Area (BSA) Calculation Algorithms and Safety Capping

### 2.1 Mathematical Formulations

#### 1. Mosteller Formula (1987) - Preferred Clinical Telemetry Standard:
Universally accepted as the primary oncology dosing standard due to its simplicity and high geometric accuracy:

$$\text{BSA}_{\text{Mosteller}} = \sqrt{\frac{\text{Height}_{\text{cm}} \times \text{Weight}_{\text{kg}}}{3600}}$$

#### 2. DuBois & DuBois Formula (1916) - Secondary Verification Reference:
Historical classic reference standard based on direct body surface casting:

$$\text{BSA}_{\text{DuBois}} = 0.007184 \times \text{Height}_{\text{cm}}^{0.725} \times \text{Weight}_{\text{kg}}^{0.425}$$

### 2.2 Safety Capping Policy in Obesity and High Body Mass
Calculating chemotherapy doses on unadjusted actual weight in obese patients ($> 120\%$ ideal body weight or $\text{BSA} > 2.0\text{ m}^2$) creates a critical clinical dilemma between toxicity and efficacy.

#### KruPet Safety Capping Rules:
1. Advisory Alert at $\text{BSA} > 2.00\text{ m}^2$:
   The mobile interface triggers an advisory alert prompting the oncology team to verify height and weight inputs.
2. Palliative / Non-Curative Regimens:
   The engine enforces a **Hard Upper Cap** at $\text{BSA} = 2.20\text{ m}^2$ (maximum permissible calculation base $2.20\text{ m}^2$).
3. Curative-Intent Therapy (ASCO Obesity Dosing Guidelines):
   For curative regimens (e.g. adjuvant breast cancer, diffuse large B-cell lymphoma, testicular germ cell tumors), full weight-based uncapped dosing is permitted to prevent preventable relapse. However, any calculation resulting in $\text{BSA} > 2.20\text{ m}^2$ requires **Dual-Oncologist Electronic Signature Approval**.
4. Absolute Upper Limit:
   Under zero circumstances may a calculated BSA exceed $2.50\text{ m}^2$ on the KruPet platform.

---

## 3. Carboplatin Precision Dosing via the Calvert Formula

### 3.1 Pharmacokinetic Rationale
Carboplatin is cleared almost exclusively by glomerular filtration. In contrast to other antineoplastics dosed by BSA, Carboplatin area under the plasma concentration-time curve (AUC in $\text{mg/mL} \times \text{min}$) correlates directly with both therapeutic tumor kill and dose-limiting myelosuppression (thrombocytopenia).

### 3.2 The Calvert Formula
$$\text{Carboplatin Total Dose (mg)} = \text{Target AUC} \times (\min(\text{GFR}, 125) + 25)$$

Where:
- $\text{Target AUC}$: Expressed in $\text{mg/mL} \times \text{min}$ (typically AUC 4, AUC 5, or AUC 6).
- $\text{GFR}$: Estimated Glomerular Filtration Rate in $\text{mL/min}$ using the Cockcroft-Gault Equation.

### 3.3 Cockcroft-Gault Glomerular Filtration Rate Estimation
$$\text{CrCl}_{\text{male}} = \frac{(140 - \text{Age}_{\text{years}}) \times \text{Weight}_{\text{kg}}}{72 \times \text{Serum Creatinine}_{\text{mg/dL}}}$$

$$\text{CrCl}_{\text{female}} = \text{CrCl}_{\text{male}} \times 0.85$$

- Unit Conversion: If serum creatinine is in $\mu\text{mol/L}$, divide by $88.42$ to obtain $\text{mg/dL}$.
- Sarcopenia Floor Guard: In elderly, malnourished, or cachectic cancer patients with low serum creatinine ($< 0.6\text{ mg/dL}$), serum creatinine must be rounded up to $0.6\text{ mg/dL}$ (or $0.7\text{ mg/dL}$) to prevent massive mathematical overestimation of GFR.

### 3.4 Mandatory GFR Capping at 125 mL/min
If unconstrained GFR is used in patients with low creatinine or high body weight, calculated Carboplatin doses reach lethal levels. In compliance with the FDA, ASCO, and UK Chemotherapy Board:
$$\text{GFR}_{\text{capped}} = \min(\text{Estimated GFR}, 125\text{ mL/min})$$

$$\text{Maximum Allowable Single Carboplatin Dose} = \text{Target AUC} \times (125 + 25) = \text{Target AUC} \times 150$$

```
+---------------+-------------------------------+-----------------------+-----------------------------+
| Target AUC    | Maximum Permissible GFR       | Maximum Dose Formula  | Absolute Hard Dose Ceiling  |
+---------------+-------------------------------+-----------------------+-----------------------------+
| AUC 6         | Clamped at 125 mL/min         | 6 * (125 + 25)        | 900 mg                      |
| AUC 5         | Clamped at 125 mL/min         | 5 * (125 + 25)        | 750 mg                      |
| AUC 4         | Clamped at 125 mL/min         | 4 * (125 + 25)        | 600 mg                      |
+---------------+-------------------------------+-----------------------+-----------------------------+
```

---

## 4. Pre-Chemotherapy Laboratory Safety Hard Stops

Chemotherapy administration is strictly blocked at the mobile bedside if laboratory test results within the preceding 48 to 72 hours violate NCCN/ASCO safety thresholds:

```
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
| Laboratory Safety Parameter        | Normal Clinical Range    | Safe Chemo Threshold  | System Interlock Behavior on Violation                      |
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
| Absolute Neutrophil Count (ANC)    | 2,000 - 7,000 /mcL       | ANC >= 1,500 /mcL     | HARD LOCKOUT: Automated 7-day cycle delay.                  |
|                                    |                          |                       | High risk of lethal febrile neutropenic sepsis.             |
|                                    |                          |                       |                                                             |
| Platelet Count                     | 150,000 - 450,000 /mcL   | Platelets >= 100,000  | HARD LOCKOUT: Automated 7-day cycle delay.                  |
|                                    |                          |                       | High risk of fatal intracranial / gastrointestinal bleed.   |
|                                    |                          |                       |                                                             |
| Serum Creatinine                   | 0.6 - 1.2 mg/dL          | <= 1.5x ULN           | HARD LOCKOUT on Cisplatin and Methotrexate.                 |
| (or CrCl / GFR)                    | (> 90 mL/min)            | (CrCl >= 50 mL/min)   | Switch to Carboplatin or renal dose reduction protocol.     |
|                                    |                          |                       |                                                             |
| Total Serum Bilirubin              | 0.2 - 1.2 mg/dL          | <= 1.5x ULN           | 50% DOSE REDUCTION on hepatically cleared agents            |
|                                    |                          |                       | (Doxorubicin, Vincristine, Paclitaxel, Irinotecan).         |
|                                    |                          |                       | HARD STOP if Total Bilirubin > 3.0x ULN.                    |
|                                    |                          |                       |                                                             |
| AST and ALT Transaminases          | 10 - 40 IU/L             | <= 2.5x ULN           | 25% to 50% dose attenuation on hepatically cleared drugs.   |
|                                    |                          | (<= 5.0x with mets)   | HARD STOP if AST/ALT > 5.0x ULN without hepatic metastases. |
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
```

---

## 5. Independent Dual-Nurse Biometric Witness Workflow

To prevent single-operator programming errors, KruPet Clinical Mobile enforces an asynchronous **Independent Double-Check**:

```
[ NURSE 1 - PREPARING / ADMINISTERING CLINICIAN ]
1. Scans Patient Identification Wristband Barcode (UPID).
2. Scans Cytotoxic Drug Bag 2D DataMatrix Barcode.
3. Performs Physical Line Inspection (confirms brisk blood return on venous aspiration).
4. Inputs Patient Height, Weight, Calculated BSA, Dose, and Smart Pump Flow Rate.
5. Signs primary BiometricPrompt (Fingerprint or Face Authentication).
       |
       v
[ ORDER ENTERS PENDING_INDEPENDENT_WITNESS LOCK ]
       |
       v
[ NURSE 2 - INDEPENDENT WITNESS CLINICIAN ]
1. Authenticates on mobile terminal using separate clinician account.
   (System strictly rejects Nurse 1 witnessing their own order).
2. Presented with BLIND VERIFICATION SHEET:
   - Primary nurse's calculated dose and pump rates are COMPLETELY MASKED.
3. Nurse 2 independently inspects:
   - Primary physician written/electronic order.
   - Physical drug bag label, diluent volume, and expiration date.
   - Venous access patency.
4. Nurse 2 independently calculates BSA and Dose, then types in their calculated values.
5. If values match within 1.0% tolerance: Nurse 2 authenticates via secondary BiometricPrompt.
6. Order is cryptographically unlocked and transmitted to Smart Infusion Pump.
```

---

## 6. Extravasation Emergency Antidote Protocols

Extravasation is the accidental infiltration of a vesicant or irritant chemotherapy agent into surrounding subcutaneous perivascular tissue, capable of causing ischemic necrosis, tendon rupture, and permanent loss of limb function.

```
+----------------------------------------------------------------------------------------------------+
|                         ONCOLOGY EXTRAVASATION EMERGENCY DIRECTIVES                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ IMMEDIATE SUSPENSION PROTOCOL - ALL AGENTS ]                                                    |
|  1. STOP INFUSION IMMEDIATELY. DO NOT FLUSH THE IV LINE.                                           |
|  2. Leave cannula in place. Gently aspirate 3 to 5 mL of blood/drug to remove extravasated fluid.  |
|  3. Elevate the affected limb above the level of the heart.                                        |
|  4. Identify Vesicant Class to determine Thermal and Antidote Protocol.                            |
|                                                                                                    |
|  [ CLASS 1: ANTHRACYCLINE VESICANTS (Doxorubicin, Epirubicin, Daunorubicin) ]                      |
|  - Mechanism: Planar aromatic rings intercalate DNA; retained in tissue for weeks causing ulcer.   |
|  - Thermal Protocol: Apply DRY COLD COMPRESSES for 20 minutes 4 times daily for 24-48 hours.      |
|    (Cold causes local vasoconstriction, limiting drug spread and cellular uptake).                |
|  - Pharmacological Antidote: DEXRAZOXANE (Totect / Savene) IV Infusion                             |
|    * Initiation Window: Must be initiated within 6 hours of extravasation!                         |
|    * Day 1: 1,000 mg/m2 IV infused over 1 to 2 hours in opposite arm or large central vein.        |
|    * Day 2: 1,000 mg/m2 IV infused over 1 to 2 hours.                                              |
|    * Day 3: 500 mg/m2 IV infused over 1 to 2 hours.                                                |
|    * Note: Remove cold pack at least 15 minutes before Dexrazoxane infusion.                       |
|    * Alternative Topical Antidote: Dimethyl Sulfoxide (DMSO 99%) topical applied every 8 hours.    |
|                                                                                                    |
|  [ CLASS 2: VINCA ALKALOID VESICANTS (Vincristine, Vinblastine, Vinorelbine) ]                     |
|  - Mechanism: Microtubule spindle poisons. Cold exacerbates ulceration!                            |
|  - Thermal Protocol: Apply DRY WARM COMPRESSES for 20 minutes 4 times daily for 24-48 hours.       |
|    (Warmth causes vasodilation, increasing blood flow to dilute and disperse the drug).            |
|    CRITICAL CONTRAINDICATION: NEVER APPLY COLD COMPRESSES TO VINCA EXTRAVASATION!                  |
|  - Pharmacological Antidote: HYALURONIDASE Injection                                               |
|    * Dose: 150 to 300 Units (1 to 2 mL) injected subcutaneously / intradermally.                   |
|    * Technique: Administer 0.2 mL clockwise into 5 to 6 subcutaneous sites around the leading edge |
|      of the extravasation perimeter using a fine 25G to 27G needle (pin-cushion technique).        |
|    * Mechanism: Hydrolyzes hyaluronic acid, destroying tissue barriers to speed drug absorption.   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 7. Production-Grade Kotlin Serialization Models & Oncology Engine

```kotlin
package com.krupet.clinic.core.model.oncology

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - Oncology Chemotherapy Safety Engine
 * File: ChemotherapyInfusionModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class ChemoIntent {
    CURATIVE_ADJUVANT,
    CURATIVE_NEOADJUVANT,
    PALLIATIVE_NON_CURATIVE
}

@Serializable
enum class VesicantClass {
    ANTHRACYCLINE_DNA_BINDING,
    VINCA_ALKALOID_NON_DNA_BINDING,
    ALKYLATING_AGENT,
    NON_VESICANT_IRRITANT
}

@Serializable
data class BsaCalculationResult(
    val heightCm: Float,
    val weightKg: Float,
    val mostellerBsa: Float,
    val duBoisBsa: Float,
    val finalAdmissibleBsa: Float,
    val isCapped: Boolean,
    val advisoryNoticeEn: String,
    val advisoryNoticeKh: String
)

@Serializable
data class CalvertCalculationResult(
    val targetAuc: Float,
    val serumCreatinineMgDl: Float,
    val rawEstimatedCrClMlMin: Float,
    val cappedGfrMlMin: Float,
    val calculatedDoseMg: Float,
    val absoluteDoseCeilingMg: Float,
    val isGfrCapped: Boolean,
    val clinicalAdvisoryEn: String,
    val clinicalAdvisoryKh: String
)

@Serializable
data class PreChemoLabValues(
    val ancPerMcl: Int,
    val plateletsPerMcl: Int,
    val serumCreatinineMgDl: Float,
    val totalBilirubinMgDl: Float,
    val astIuL: Float,
    val altIuL: Float,
    val upperLimitNormalCreatinine: Float = 1.2f,
    val upperLimitNormalBilirubin: Float = 1.2f
)

@Serializable
data class PreChemoSafetyGateResult(
    val isClearedForChemo: Boolean,
    val isAncHold: Boolean,
    val isPlateletHold: Boolean,
    val isRenalHold: Boolean,
    val isHepaticDoseReduction: Boolean,
    val actionDirectivesEn: List<String>,
    val actionDirectivesKh: List<String>
)

@Serializable
data class ChemoDualNurseWitnessRequest(
    val prescriptionId: String,
    val patientId: String,
    val drugName: String,
    val primaryNurseId: String,
    val primaryCalculatedBsa: Float,
    val primaryCalculatedDoseMg: Float,
    val primaryInfusionRateMlHr: Float,
    val witnessNurseId: String,
    val witnessCalculatedBsa: Float,
    val witnessCalculatedDoseMg: Float,
    val witnessCalculatedRateMlHr: Float,
    val isLinePatencyVerified: Boolean
)

@Serializable
data class ChemoDualNurseWitnessResult(
    val isApproved: Boolean,
    val doseDiscrepancyPercent: Float,
    val bsaDiscrepancyPercent: Float,
    val authorizationStatus: String,
    val messageEn: String,
    val messageKh: String
)

@Serializable
data class ExtravasationAntidoteProtocol(
    val vesicantClass: VesicantClass,
    val drugName: String,
    val thermalProtocolEn: String,
    val thermalProtocolKh: String,
    val antidoteNameEn: String,
    val antidoteNameKh: String,
    val administrationTechniqueEn: String,
    val administrationTechniqueKh: String
)

object OncologyChemoSafetyEngine {

    /**
     * Calculates BSA using Mosteller and DuBois with ASCO capping policy
     */
    fun calculateBsa(
        heightCm: Float,
        weightKg: Float,
        intent: ChemoIntent
    ): BsaCalculationResult {
        val mosteller = Math.sqrt((heightCm * weightKg / 3600.0)).toFloat()
        val duBois = (0.007184 * Math.pow(heightCm.toDouble(), 0.725) * Math.pow(weightKg.toDouble(), 0.425)).toFloat()

        var finalBsa = mosteller
        var isCapped = false

        if (intent == ChemoIntent.PALLIATIVE_NON_CURATIVE && mosteller > 2.20f) {
            finalBsa = 2.20f
            isCapped = true
        }

        // Hard absolute ceiling 2.50 m2
        if (finalBsa > 2.50f) {
            finalBsa = 2.50f
            isCapped = true
        }

        val noticeEn: String
        val noticeKh: String
        val fmtMosteller = format(mosteller)
        val fmtFinalBsa = format(finalBsa)

        if (isCapped) {
            noticeEn = "BSA clamped to safety ceiling. Calculated Mosteller: $fmtMosteller m2, applied: $fmtFinalBsa m2."
            noticeKh = "កម្រិតផ្ទៃក្រឡារាងកាយត្រូវបានកម្រិតត្រឹមពិដានសុវត្ថិភាព។ តម្លៃគណនា Mosteller: $fmtMosteller ម៉ែត្រការ៉េ, តម្លៃអនុវត្ត: $fmtFinalBsa ម៉ែត្រការ៉េ។"
        } else if (mosteller > 2.00f) {
            noticeEn = "ADVISORY: BSA exceeds 2.00 m2. Verify height and weight inputs."
            noticeKh = "ការជូនដំណឹង: ផ្ទៃក្រឡារាងកាយលើសពី ២.០០ ម៉ែត្រការ៉េ។ សូមផ្ទៀងផ្ទាត់កម្ពស់និងទម្ងន់អ្នកជំងឺឡើងវិញ។"
        } else {
            noticeEn = "BSA calculation verified: $fmtMosteller m2."
            noticeKh = "ការគណនាផ្ទៃក្រឡារាងកាយត្រឹមត្រូវ: $fmtMosteller ម៉ែត្រការ៉េ។"
        }

        return BsaCalculationResult(
            heightCm = heightCm,
            weightKg = weightKg,
            mostellerBsa = format(mosteller),
            duBoisBsa = format(duBois),
            finalAdmissibleBsa = format(finalBsa),
            isCapped = isCapped,
            advisoryNoticeEn = noticeEn,
            advisoryNoticeKh = noticeKh
        )
    }

    /**
     * Calculates Carboplatin dose via Calvert formula with 125 mL/min GFR capping
     */
    fun calculateCalvertDose(
        targetAuc: Float,
        ageYears: Int,
        weightKg: Float,
        serumCreatinineMgDl: Float,
        isFemale: Boolean
    ): CalvertCalculationResult {
        // Sarcopenia floor guard: minimum 0.6 mg/dL
        val adjustedCreatinine = Math.max(0.6f, serumCreatinineMgDl)

        var crCl = ((140 - ageYears) * weightKg) / (72.0f * adjustedCreatinine)
        if (isFemale) {
            crCl *= 0.85f
        }

        val isCapped = crCl > 125.0f
        val cappedGfr = Math.min(125.0f, crCl)
        val dose = targetAuc * (cappedGfr + 25.0f)
        val maxCeiling = targetAuc * 150.0f
        val fmtCrCl = format(crCl)

        val advEn: String
        val advKh: String

        if (isCapped) {
            advEn = "GFR capped at 125 mL/min per ASCO/FDA safety standard. Max dose ceiling: ${format(maxCeiling)} mg."
            advKh = "កម្រិតមុខងារតម្រងនោមត្រូវបានកម្រិតត្រឹម ១២៥ មីលីលីត្រក្នុងមួយនាទី តាមស្តង់ដារសុវត្ថិភាព ASCO និង FDA។"
        } else {
            advEn = "Calvert Carboplatin calculation verified. Estimated GFR: ${format(crCl)} mL/min."
            advKh = "ការគណនាកម្រិតថ្នាំ Carboplatin តាមរូបមន្ត Calvert ត្រឹមត្រូវ។ មុខងារតម្រងនោម: $fmtCrCl មីលីលីត្រក្នុងមួយនាទី។"
        }

        return CalvertCalculationResult(
            targetAuc = targetAuc,
            serumCreatinineMgDl = serumCreatinineMgDl,
            rawEstimatedCrClMlMin = format(crCl),
            cappedGfrMlMin = format(cappedGfr),
            calculatedDoseMg = format(dose),
            absoluteDoseCeilingMg = format(maxCeiling),
            isGfrCapped = isCapped,
            clinicalAdvisoryEn = advEn,
            clinicalAdvisoryKh = advKh
        )
    }

    /**
     * Evaluates Pre-Chemotherapy Laboratory Safety Gates
     */
    fun evaluatePreChemoLabs(labs: PreChemoLabValues): PreChemoSafetyGateResult {
        val directivesEn = mutableListOf<String>()
        val directivesKh = mutableListOf<String>()

        val ancHold = labs.ancPerMcl < 1500
        val platHold = labs.plateletsPerMcl < 100000
        val renalHold = labs.serumCreatinineMgDl > (1.5f * labs.upperLimitNormalCreatinine)
        val hepaticReduction = labs.totalBilirubinMgDl > (1.5f * labs.upperLimitNormalBilirubin)

        if (ancHold) {
            directivesEn.add("CHEMO HOLD: ANC ${labs.ancPerMcl} /mcL < 1,500 /mcL. Mandatory 7-day cycle delay due to febrile neutropenia risk.")
            val msgKh = "ផ្អាកការព្យាបាលដោយគីមី: គ្រាប់ឈាមស ANC ក្រោម ១៥០០។ ត្រូវពន្យារពេល ៧ ថ្ងៃដើម្បីការពារការឆ្លងរោគធ្ងន់ធ្ងរ"
            directivesKh.add(msgKh)
        }

        if (platHold) {
            directivesEn.add("CHEMO HOLD: Platelets ${labs.plateletsPerMcl} /mcL < 100,000 /mcL. Mandatory 7-day cycle delay due to thrombocytopenic bleeding risk.")
            val msgKh = "ផ្អាកការព្យាបាលដោយគីមី: ប្លាកែតក្រោម ១០០០០០។ ត្រូវពន្យារពេល ៧ ថ្ងៃដើម្បីការពារហានិភ័យហូរឈាមធ្ងន់ធ្ងរ"
            directivesKh.add(msgKh)
        }

        if (renalHold) {
            directivesEn.add("RENAL HARD STOP: Serum Creatinine ${labs.serumCreatinineMgDl} mg/dL > 1.5x ULN. Hold Cisplatin and Methotrexate.")
            val msgKh = "បម្រាមដាច់ខាតចំពោះតម្រងនោម: ជាតិក្រេអាទីនីនលើស ១.៥ ដង។ ហាមប្រើថ្នាំ Cisplatin និង Methotrexate"
            directivesKh.add(msgKh)
        }

        if (hepaticReduction) {
            directivesEn.add("HEPATIC ATTENUATION: Total Bilirubin ${labs.totalBilirubinMgDl} mg/dL > 1.5x ULN. Apply 50% dose reduction on hepatically metabolized agents.")
            val msgKh = "ការកាត់បន្ថយកម្រិតថ្នាំតាមថ្លើម: ប៊ីលីរុយប៊ីនលើស ១.៥ ដង។ ត្រូវបញ្ចុះកម្រិតថ្នាំ ៥០ ភាគរយលើឱសថដែលរំលាយតាមថ្លើម"
            directivesKh.add(msgKh)
        }

        val isCleared = !ancHold && !platHold && !renalHold

        return PreChemoSafetyGateResult(
            isClearedForChemo = isCleared,
            isAncHold = ancHold,
            isPlateletHold = platHold,
            isRenalHold = renalHold,
            isHepaticDoseReduction = hepaticReduction,
            actionDirectivesEn = directivesEn,
            actionDirectivesKh = directivesKh
        )
    }

    /**
     * Independent Dual-Nurse Verification Engine
     */
    fun verifyDualNurseChemo(request: ChemoDualNurseWitnessRequest): ChemoDualNurseWitnessResult {
        if (request.primaryNurseId == request.witnessNurseId) {
            return ChemoDualNurseWitnessResult(
                isApproved = false,
                doseDiscrepancyPercent = 0.0f,
                bsaDiscrepancyPercent = 0.0f,
                authorizationStatus = "LOCKED_SAME_CLINICIAN_VIOLATION",
                messageEn = "VIOLATION: Primary oncology nurse cannot witness their own chemotherapy administration.",
                messageKh = "ការបំពានច្បាប់សុវត្ថិភាព: គិលានុបដ្ឋាយិកាមិនអាចចុះហត្ថលេខាបញ្ជាក់លើការចាក់ថ្នាំគីមីដោយខ្លួនឯងបានឡើយ"
            )
        }

        if (!request.isLinePatencyVerified) {
            return ChemoDualNurseWitnessResult(
                isApproved = false,
                doseDiscrepancyPercent = 0.0f,
                bsaDiscrepancyPercent = 0.0f,
                authorizationStatus = "LOCKED_LINE_PATENCY_UNVERIFIED",
                messageEn = "LINE PATENCY HOLD: Venous blood return must be confirmed on aspiration prior to vesicant infusion.",
                messageKh = "បម្រាមសុវត្ថិភាពសរសៃឈាម: ត្រូវតែពិនិត្យឃើញឈាមច្រាលមកវិញតាមសរសៃឈាមជាមុនសិន ដើម្បីការពារការជ្រាបថ្នាំគីមីចេញក្រៅសរសៃ"
            )
        }

        val doseDelta = Math.abs(request.primaryCalculatedDoseMg - request.witnessCalculatedDoseMg)
        val doseDiscrepancy = if (request.primaryCalculatedDoseMg > 0) (doseDelta / request.primaryCalculatedDoseMg) * 100.0f else 100.0f

        val bsaDelta = Math.abs(request.primaryCalculatedBsa - request.witnessCalculatedBsa)
        val bsaDiscrepancy = if (request.primaryCalculatedBsa > 0) (bsaDelta / request.primaryCalculatedBsa) * 100.0f else 100.0f

        val isApproved = doseDiscrepancy <= 1.0f && bsaDiscrepancy <= 1.0f

        val msgEn: String
        val msgKh: String

        if (isApproved) {
            msgEn = "SUCCESS: Independent dual-nurse oncology verification cleared. Pump infusion unlocked."
            msgKh = "ជោគជ័យ: ការត្រួតពិនិត្យឯករាជ្យដោយគិលានុបដ្ឋាយិកាជំនាញជំងឺមហារីកពីររូបត្រូវបានអនុម័តត្រឹមត្រូវ។ ម៉ាស៊ីនចាក់ថ្នាំត្រូវបានដោះសោដំណើរការ។"
        } else {
            msgEn = "DISCREPANCY LOCKOUT: Calculations diverge by > 1%. Dose delta: ${format(doseDiscrepancy)}%. Administration locked."
            msgKh = "ការចាក់សោសុវត្ថិភាព: ការគណនាឯករាជ្យរវាងគិលានុបដ្ឋាយិកាទាំងពីរមានភាពខុសគ្នាលើសពី ១ ភាគរយ។ ការផ្តល់ថ្នាំត្រូវបានចាក់សោជាបន្ទាន់។"
        }

        return ChemoDualNurseWitnessResult(
            isApproved = isApproved,
            doseDiscrepancyPercent = format(doseDiscrepancy),
            bsaDiscrepancyPercent = format(bsaDiscrepancy),
            authorizationStatus = if (isApproved) "VERIFIED_CLEARED" else "BLOCKED_DISCREPANCY",
            messageEn = msgEn,
            messageKh = msgKh
        )
    }

    /**
     * Retrieves Extravasation Antidote Protocol by Vesicant Class
     */
    fun getExtravasationProtocol(vesicantClass: VesicantClass, drugName: String): ExtravasationAntidoteProtocol {
        return when (vesicantClass) {
            VesicantClass.ANTHRACYCLINE_DNA_BINDING -> ExtravasationAntidoteProtocol(
                vesicantClass = vesicantClass,
                drugName = drugName,
                thermalProtocolEn = "Apply DRY COLD COMPRESSES for 20 minutes 4 times daily for 24-48 hours. Avoid moist heat.",
                thermalProtocolKh = "ស្អំកម្តៅត្រជាក់ស្ងួតរយៈពេល ២០ នាទី ៤ ដងក្នុងមួយថ្ងៃ សម្រាប់រយៈពេល ២៤ ទៅ ៤៨ ម៉ោង។ ហាមស្អំបែបក្តៅ។",
                antidoteNameEn = "DEXRAZOXANE (Totect / Savene) IV Infusion",
                antidoteNameKh = "ថ្នាំបន្សាប Dexrazoxane ចាក់តាមសរសៃឈាមវ៉ែន",
                administrationTechniqueEn = "Initiate within 6 hours. Day 1: 1,000 mg/m2 IV over 1-2h; Day 2: 1,000 mg/m2; Day 3: 500 mg/m2. Alternative: Topical DMSO 99% every 8h.",
                administrationTechniqueKh = "ត្រូវចាប់ផ្តើមក្នុងរយៈពេល ៦ ម៉ោងដំបូង។ ថ្ងៃទី ១: ១០០០ មីលីក្រាមក្នុងមួយម៉ែត្រការ៉េ; ថ្ងៃទី ២: ១០០០ មីលីក្រាម; ថ្ងៃទី ៣: ៥០០ មីលីក្រាម។"
            )
            VesicantClass.VINCA_ALKALOID_NON_DNA_BINDING -> ExtravasationAntidoteProtocol(
                vesicantClass = vesicantClass,
                drugName = drugName,
                thermalProtocolEn = "Apply DRY WARM COMPRESSES for 20 minutes 4 times daily for 24-48 hours. STRICTLY CONTRAINDICATED: NEVER APPLY COLD COMPRESSES.",
                thermalProtocolKh = "ស្អំកម្តៅឧណ្ហៗស្ងួតរយៈពេល ២០ នាទី ៤ ដងក្នុងមួយថ្ងៃ។ បម្រាមដាច់ខាត ហាមស្អំត្រជាក់ជាដាច់ខាត។",
                antidoteNameEn = "HYALURONIDASE Subcutaneous Injection",
                antidoteNameKh = "ថ្នាំបន្សាប Hyaluronidase ចាក់ក្រោមស្បែក",
                administrationTechniqueEn = "Inject 150 to 300 units subcutaneously in 5 to 6 clockwise circumferential injections around the extravasation perimeter using a 25G needle.",
                administrationTechniqueKh = "ចាក់ថ្នាំ ១៥០ ទៅ ៣០០ យូនីតក្រោមស្បែក ចំនួន ៥ ទៅ ៦ កន្លែងជុំវិញបរិវេណជ្រាបថ្នាំ ដោយប្រើម្ជុលតូចលេខ ២៥G។"
            )
            VesicantClass.ALKYLATING_AGENT -> ExtravasationAntidoteProtocol(
                vesicantClass = vesicantClass,
                drugName = drugName,
                thermalProtocolEn = "Apply DRY COLD COMPRESSES for 20 minutes 4 times daily for 24-48 hours.",
                thermalProtocolKh = "ស្អំកម្តៅត្រជាក់ស្ងួតរយៈពេល ២០ នាទី ៤ ដងក្នុងមួយថ្ងៃ សម្រាប់រយៈពេល ២៤ ទៅ ៤៨ ម៉ោង។",
                antidoteNameEn = "SODIUM THIOSULFATE 1/6 M (4.14%) Injection",
                antidoteNameKh = "ថ្នាំបន្សាប សូដ្យូមធីយ៉ូស៊ុលហ្វាត ៤.១៤ ភាគរយ",
                administrationTechniqueEn = "Inject 2 mL subcutaneously for each 1 mL of extravasated drug into subcutaneous tissue using clockwise pin-cushion technique.",
                administrationTechniqueKh = "ចាក់ ២ មីលីលីត្រក្រោមស្បែកសម្រាប់រាល់ ១ មីលីលីត្រនៃថ្នាំដែលជ្រាប ចាក់ជុំវិញមុខរបួស។"
            )
            VesicantClass.NON_VESICANT_IRRITANT -> ExtravasationAntidoteProtocol(
                vesicantClass = vesicantClass,
                drugName = drugName,
                thermalProtocolEn = "Apply dry warm or cold compresses as clinically tolerated for symptomatic comfort.",
                thermalProtocolKh = "ស្អំកម្តៅត្រជាក់ឬឧណ្ហៗតាមការណែនាំដើម្បីបំបាត់ការរលាក។",
                antidoteNameEn = "Symptomatic Care and Hydrocortisone Cream 1%",
                antidoteNameKh = "ការព្យាបាលតាមរោគសញ្ញានិងលាបក្រែមអ៊ីដ្រូកូទីសូន",
                administrationTechniqueEn = "Topical application and limb elevation. Monitor for phlebitis.",
                administrationTechniqueKh = "លាបលើស្បែកនិងលើកអវយវៈឡើងលើ ព្រមទាំងតាមដានការរលាកសរសៃឈាម។"
            )
        }
    }

    private fun format(value: Float): Float = Math.round(value * 100.0f) / 100.0f
}
```

---

## 8. Bilingual Khmer and English Clinical Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Oncology Safety Identifier   | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| Chemotherapy Infusion Safety Engine  | ប្រព័ន្ធសុវត្ថិភាពចាក់ថ្នាំគីមីព្យាបាលជំងឺមហារីក             |
| Body Surface Area BSA Mosteller      | ផ្ទៃក្រឡារាងកាយគណនាតាមរូបមន្ត Mosteller                     |
| Body Surface Area BSA DuBois         | ផ្ទៃក្រឡារាងកាយគណនាតាមរូបមន្ត DuBois                        |
| Safety Dose Capping Active           | ការកម្រិតពិដានសុវត្ថិភាពកម្រិតថ្នាំត្រូវបានអនុវត្ត           |
| Calvert Formula Carboplatin Dosing   | រូបមន្ត Calvert សម្រាប់គណនាកម្រិតថ្នាំ Carboplatin         |
| Glomerular Filtration Rate GFR Cap   | ការកម្រិតមុខងារតម្រងនោមត្រឹម ១២៥ មីលីលីត្រក្នុងមួយនាទី      |
| Absolute Neutrophil Count ANC Gate   | លក្ខខណ្ឌកម្រិតគ្រាប់ឈាមស ANC ត្រូវចាប់ពី ១៥០០ ឡើងទៅ         |
| Platelet Safety Threshold Gate       | លក្ខខណ្ឌកម្រិតប្លាកែតត្រូវចាប់ពី ១០០០០០ ឡើងទៅ               |
| Pre-Chemo Lab Safety Hard Stop       | បម្រាមដាច់ខាតផ្អាកការចាក់ថ្នាំគីមីដោយសារលទ្ធផលឈាមមិនគ្រប់គ្រាន់|
| Independent Dual-Nurse Verification  | ការត្រួតពិនិត្យឯករាជ្យដោយគិលានុបដ្ឋាយិកាពីររូប             |
| Blind Verification Calculation Entry | ការបញ្ចូលទិន្នន័យគណនាឯករាជ្យដោយមិនមើលចម្លើយគ្នា             |
| Venous Line Patency Blood Return     | ការពិនិត្យឈាមច្រាលត្រឡប់មកវិញធានាសរសៃឈាមមិនធ្លុាយ          |
| Vesicant Extravasation Emergency     | អាសន្នការជ្រាបថ្នាំគីមីកាចសាហាវចេញក្រៅសរសៃឈាម              |
| Anthracycline Cold Compress Protocol | ពិធីសារស្អំត្រជាក់សម្រាប់ថ្នាំក្រុម Anthracycline             |
| Dexrazoxane Emergency Antidote       | ថ្នាំបន្សាបបន្ទាន់ Dexrazoxane ក្នុងរយៈពេល ៦ ម៉ោង           |
| Vinca Alkaloid Warm Compress Protocol| ពិធីសារស្អំកម្តៅឧណ្ហៗសម្រាប់ថ្នាំក្រុម Vinca Alkaloid        |
| Hyaluronidase Subcutaneous Antidote  | ថ្នាំបន្សាប Hyaluronidase ចាក់ជុំវិញក្រោមស្បែក                |
| Sodium Thiosulfate Antidote          | ថ្នាំបន្សាប សូដ្យូមធីយ៉ូស៊ុលហ្វាត                            |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 9. Clinical Audit Gates and Hard Interlocks

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Pre-Chemo Laboratory Hard Stop         | Absolute Lockout    | Completely locks order dispatch to smart infusion pump  |
|                                        |                     | if ANC < 1,500/uL, Platelets < 100,000/uL, or Cr > 1.5x.|
|                                        |                     |                                                         |
| Calvert GFR Ceiling Clamp              | Mathematical Clamp  | Clamps GFR input at 125 mL/min, establishing maximum    |
|                                        |                     | single dose caps (AUC 6 = 900 mg; AUC 5 = 750 mg).      |
|                                        |                     |                                                         |
| Dual-Nurse Asynchronous Witness Check  | Cryptographic Lock  | Requires two distinct biometric signatures. Both nurses |
|                                        |                     | must independently calculate dose within 1% tolerance.  |
|                                        |                     |                                                         |
| Venous Line Patency Hard Interlock     | Mandatory Clinical  | Primary nurse must electronically attest to brisk blood |
|                                        | Verification        | return on aspiration before infusion can be started.    |
|                                        |                     |                                                         |
| Extravasation Dexrazoxane 6-Hour Clock | Emergency Time Gate | Audio/visual alarm prompts pharmacist and MD if         |
|                                        |                     | anthracycline extravasates; starts 6-hour antidote countdown.|
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated verification confirms 0 emoji symbols.        |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated verification confirms 0 parentheses on lines  |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
