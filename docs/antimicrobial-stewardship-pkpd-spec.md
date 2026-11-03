# KruPet Enterprise Antimicrobial Stewardship, Pharmacokinetic-Pharmacodynamic (PK-PD) and Precision Renal Dosing Specification

## Document Control
- Document ID: `SPEC-CLIN-ANTIMICROBIAL-PKPD-021`
- Version: `1.0.0`
- Target Platform: Android Native Tablet / Workstation on Wheels (WOW) / Handheld Clinical PDA
- Classification: Confidential - Enterprise Clinical Pharmacy and Infectious Disease Architecture Standard
- Regulatory Compliance: WHO AWaRe Antibiotic Categorization 2023-2025, Cambodia MoH National Strategic Plan on Antimicrobial Resistance (2019-2025), IDSA/ASHP/SIDP/PIDS Vancomycin Guidelines 2020, Hartford Hospital Extended-Interval Aminoglycoside Dosing Protocols

---

## 1. Executive Summary & Clinical Scope

Inappropriate antimicrobial utilization directly accelerates antimicrobial resistance (AMR), extends hospital length of stay, and causes preventable adverse events such as Acute Kidney Injury (AKI) and Clostridioides difficile colitis. The KruPet Antimicrobial Stewardship and PK-PD Engine equips hospital clinicians and clinical pharmacists with an algorithmic bedside decision support system.

### Core Clinical Capabilities
1. **WHO AWaRe Classification & Stewardship Governance**: Automated categorization of all antimicrobial orders into Access, Watch, and Reserve tiers, enforcing a mandatory 72-hour clinical reassessment stop order ("Antibiotic Timeout") and digital approval gates for restricted reserve antibiotics.
2. **Renal Clearance Engine**: Dynamic dual calculation of Cockcroft-Gault Creatinine Clearance (CrCl) utilizing actual, ideal, and adjusted body weight (ABW, IBW, AdjBW) alongside the CKD-EPI 2021 race-free eGFR equation, driving automated dose titration across five discrete renal stages, intermittent hemodialysis, and continuous renal replacement therapy (CRRT).
3. **Vancomycin 24-Hour AUC/MIC Pharmacokinetic Engine**: Automated first-order two-point peak/trough Bayesian-extrapolated AUC24 calculation targeting an AUC24/MIC ratio of 400 to 600 mg*h/L for invasive MRSA, coupled with an inviolable single-trough safety gate triggering nephrotoxicity alerts when trough concentrations exceed 20 mcg/mL.
4. **Aminoglycoside Hartford Extended-Interval Nomogram (7 mg/kg)**: Automated interval determination (24h, 36h, 48h, or off-nomogram consult) based on single serum concentrations drawn between 6 and 14 hours post-infusion for Gentamicin and Tobramycin.

---

## 2. WHO AWaRe Antibiotic Classification & Stewardship Governance

### 2.1 AWaRe Categorization Matrix

All hospital formulary antimicrobials are mapped to the World Health Organization (WHO) AWaRe 2023-2025 classification aligned with the Cambodia MoH Essential Medicines List (EDL 2026):

| AWaRe Category | Stewardship Tier | Representative Antimicrobials | Clinical Prescribing Gate | Electronic Order Action | Reassessment Window |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Access** | Tier 1 (First-Line Wide Access) | Amoxicillin, Ampicillin, Cefazolin, Cloxacillin, Doxycycline, Metronidazole | Open prescribing for all verified prescribers | Auto-approved in eMAR upon allergy cross-check | 72-Hour Antibiotic Timeout |
| **Watch** | Tier 2 (Monitored High Resistance Potential) | Ceftriaxone, Cefotaxime, Ciprofloxacin, Levofloxacin, Piperacillin-Tazobactam | Indication-specific checklist required (e.g., Sepsis, Severe Pneumonia) | Approved with mandatory clinical indication logged | 72-Hour Antibiotic Timeout with culture check |
| **Reserve** | Tier 3 (Restricted Last-Resort Antimicrobials) | Meropenem, Colistin, Linezolid, Vancomycin, Polymyxin B, Tigecycline | Restricted to confirmed multi-drug resistant pathogens or severe septic shock | Electronic approval gate: Clinical Pharmacist or ID specialist co-signature | 72-Hour Hard Stop Order if unapproved |

### 2.2 The 72-Hour Antibiotic Timeout and Electronic Approval Gate

```
[Physician Enters Antimicrobial Order in CPOE]
                       |
                       v
       +---------------+---------------+
       |                               |
[Access / Watch Tier]           [Reserve Tier]
       |                               |
       v                               v
[Automated Allergy & CrCl Check] [Electronic Approval Lock Engaged]
       |                               |
       |                      +--------+--------+
       |                      |                 |
       |             [Approved by ID /]   [Not Approved Within]
       |             [PharmD Specialist]  [24 Hours Window]
       |                      |                 |
       v                      v                 v
[Medication Active in eMAR]   |        [Order Cancelled by System]
       |                      |
       +----------+-----------+
                  |
                  v
[72-Hour Antibiotic Timeout Countdown Initiated]
                  |
     +------------+------------+
     |                         |
[At 48 Hours: Alert Sent]  [At 72 Hours: Mandatory Reassessment Gate]
- Microbiology Gram stain     - Prescriber must select:
- Sensitivity cultures           1. Stop therapy (De-escalation)
- Procalcitonin trend            2. De-escalate to Access agent
                                 3. Continue with signed clinical rationale
```

---

## 3. Precision Renal Clearance Calculators

Accurate antimicrobial dosing requires exact renal clearance determination. Relying solely on serum creatinine in sarcopenic, elderly, or obese patients results in severe under-dosing or nephrotoxicity.

### 3.1 Patient Weight Definitions for Renal Clearances

1. **Actual Body Weight (ABW)**: Directly measured patient weight in kilograms.
2. **Ideal Body Weight (IBW)** (Devine Formula):
   - For Adult Males:
     $$\text{IBW}_{\text{male}} = 50.0\text{ kg} + 2.3 \times (\text{Height in inches} - 60)$$
   - For Adult Females:
     $$\text{IBW}_{\text{female}} = 45.5\text{ kg} + 2.3 \times (\text{Height in inches} - 60)$$
3. **Adjusted Body Weight (AdjBW)** (for Obese Patients where $\text{ABW} \ge 1.2 \times \text{IBW}$):
   $$\text{AdjBW} = \text{IBW} + 0.4 \times (\text{ABW} - \text{IBW})$$
4. **Weight Selection Logic for Cockcroft-Gault**:
   $$\text{Weight}_{\text{CG}} = \begin{cases} \text{ABW}, & \text{if } \text{ABW} < \text{IBW} \quad (\text{Underweight}) \\ \text{AdjBW}, & \text{if } \text{ABW} \ge 1.2 \times \text{IBW} \quad (\text{Obese}) \\ \text{IBW}, & \text{otherwise} \quad (\text{Normal Weight}) \end{cases}$$

### 3.2 Cockcroft-Gault Creatinine Clearance Equation

$$\text{CrCl} = \frac{(140 - \text{Age}) \times \text{Weight}_{\text{CG}}}{72 \times S_{\text{cr}}} \times [0.85 \text{ if Female}]$$
Where:
- $\text{Age}$ is in years.
- $\text{Weight}_{\text{CG}}$ is in kilograms.
- $S_{\text{cr}}$ is serum creatinine in $\text{mg/dL}$. If measured in $\mu\text{mol/L}$, convert via: $S_{\text{cr}}(\text{mg/dL}) = \frac{S_{\text{cr}}(\mu\text{mol/L})}{88.4}$.
- If serum creatinine is $< 0.6\text{ mg/dL}$ in elderly sarcopenic patients, the engine clamps $S_{\text{cr}}$ to $0.6\text{ mg/dL}$ to prevent erroneous overestimation of renal clearance.

### 3.3 CKD-EPI 2021 Race-Free eGFR Equation

$$\text{eGFR} = 142 \times \min\left(\frac{S_{\text{cr}}}{\kappa}, 1\right)^{\alpha} \times \max\left(\frac{S_{\text{cr}}}{\kappa}, 1\right)^{-1.200} \times 0.9938^{\text{Age}} \times [1.012 \text{ if Female}]$$
Where:
- $\kappa = 0.7$ for females, and $\kappa = 0.9$ for males.
- $\alpha = -0.241$ for females, and $\alpha = -0.302$ for males.
- $S_{\text{cr}}$ is in $\text{mg/dL}$.

### 3.4 Inpatient Renal Dose Titration Matrix

| Antimicrobial Agent | Standard Dose (CrCl > 50 mL/min) | CrCl 30 - 50 mL/min | CrCl 15 - 29 mL/min | CrCl < 15 mL/min (Non-HD) | Intermittent Hemodialysis (IHD) | CRRT (CVVH / CVVHD / CVVHDF) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Meropenem** | 1 g IV q8h (infuse over 3h) | 1 g IV q12h | 500 mg IV q12h | 500 mg IV q24h | 500 mg post-HD | 1 g IV q8h to q12h |
| **Piperacillin-Tazobactam** | 4.5 g IV q6h (or 3.375 g q6h extended) | 3.375 g IV q6h | 2.25 g IV q6h | 2.25 g IV q8h | 2.25 g IV q12h + 0.75 g post-HD | 3.375 g IV q6h to q8h |
| **Cefazolin** | 2 g IV q8h | 1 g to 2 g IV q12h | 1 g IV q12h to q24h | 1 g IV q24h to q48h | 1 g to 2 g post-HD | 1 g to 2 g IV q12h |
| **Ciprofloxacin** | 400 mg IV q8h or 500 mg PO q12h | 400 mg IV q12h or 500 mg PO q12h | 400 mg IV q18h to q24h or 250-500 mg PO q24h | 400 mg IV q24h or 250 mg PO q24h | 250-500 mg PO q24h post-HD | 400 mg IV q12h |
| **Colistin (CMS)** | 9 million IU loading, then 4.5 million IU q12h | 3.0 to 4.0 million IU q12h | 2.0 to 3.0 million IU q12h | 1.5 to 2.0 million IU q24h to q48h | 2 million IU post-HD | 3.0 to 4.5 million IU q12h |

---

## 4. Vancomycin 24-Hour AUC/MIC Pharmacokinetic Engine

According to the revised 2020 consensus guidelines by IDSA, ASHP, SIDP, and PIDS, therapeutic monitoring of Vancomycin for serious MRSA infections requires achieving a 24-hour area under the concentration-time curve to minimum inhibitory concentration ratio ($\text{AUC}_{24}/\text{MIC}$) of **400 to 600 mg*h/L** (assuming an empirical broth microdilution MIC of $1.0\text{ mg/L}$).

### 4.1 First-Order Two-Point Kinetic Derivations

To calculate exact patient-specific parameters, two post-distribution serum levels are drawn at steady-state:
- Post-infusion peak concentration ($C_{\text{peak}}$): Drawn 1 to 2 hours following completion of the intravenous infusion to ensure distribution phase is complete.
- Pre-dose trough concentration ($C_{\text{trough}}$): Drawn within 30 minutes prior to the next scheduled maintenance dose.

Let $t_{\text{peak}}$ and $t_{\text{trough}}$ be the respective draw timestamps, and let $\Delta t = t_{\text{trough}} - t_{\text{peak}}$ in hours.

#### Elimination Rate Constant ($k_e$):
$$k_e = \frac{\ln(C_{\text{peak}} / C_{\text{trough}})}{\Delta t} \quad [\text{units: hr}^{-1}]$$

#### Elimination Half-Life ($t_{1/2}$):
$$t_{1/2} = \frac{\ln(2)}{k_e} = \frac{0.693}{k_e} \quad [\text{units: hr}]$$

#### True Peak ($C_{\max}$) and True Trough ($C_{\min}$) Extrapolations:
Let $t_{\text{post}}$ be the elapsed time from end of infusion to peak draw, and $t_{\text{pre}}$ be the time from trough draw to next infusion:
$$C_{\max} = C_{\text{peak}} \times e^{k_e \times t_{\text{post}}}$$
$$C_{\min} = C_{\text{trough}} \times e^{-k_e \times t_{\text{pre}}}$$

#### Volume of Distribution ($V_d$):
Using the Sawchuk-Zaske intermittent infusion model where $t_{\text{inf}}$ is the infusion duration in hours and $\text{Dose}$ is in mg:
$$V_d = \frac{\text{Dose} \times (1 - e^{-k_e \times t_{\text{inf}}})}{t_{\text{inf}} \times k_e \times (C_{\max} - C_{\min} \times e^{-k_e \times t_{\text{inf}}})} \quad [\text{units: Liters}]$$

#### Clearance ($CL_{\text{vanc}}$):
$$CL_{\text{vanc}} = k_e \times V_d \quad [\text{units: L/hr}]$$

#### 24-Hour Area Under the Curve ($\text{AUC}_{24}$):
Let $\tau$ be the dosing interval in hours, and let $\text{Dose}$ be the administered dose per interval:
$$\text{AUC}_{\tau} = \frac{\text{Dose}}{CL_{\text{vanc}}}$$
$$\text{AUC}_{24} = \text{AUC}_{\tau} \times \left(\frac{24}{\tau}\right) = \frac{\text{Total Daily Dose}}{CL_{\text{vanc}}} \quad [\text{units: mg}\cdot\text{hr/L}]$$

Assuming $\text{MIC} = 1.0\text{ mg/L}$:
$$\frac{\text{AUC}_{24}}{\text{MIC}} = \text{AUC}_{24}$$

### 4.2 Single-Trough Surrogate Safety Gate

While AUC24 is the therapeutic gold standard, single-trough monitoring serves as an inviolable safety boundary:
- **Trough < 10.0 mcg/mL**: Subtherapeutic alert. High risk of clinical treatment failure and selection of intermediate vancomycin-resistant strains (VISA/hVISA). Recommended action: Increase dose or shorten interval.
- **Trough 10.0 - 15.0 mcg/mL**: Acceptable for mild/moderate non-invasive infections (skin, UTI).
- **Trough 15.0 - 20.0 mcg/mL**: Historical surrogate for severe infections.
- **Trough > 20.0 mcg/mL**: **HARD CRITICAL NEPHROTOXICITY ALERT**. Triggers immediate clinical safety hold. Risk of acute tubular necrosis (ATN) increases by over 400%. Action: Hold next dose, measure serum creatinine daily, and order two-point PK recalculation.

---

## 5. Aminoglycoside Hartford Extended-Interval Nomogram (7 mg/kg)

Extended-Interval Dosing (EID) of aminoglycosides (Gentamicin and Tobramycin) utilizes concentration-dependent bacterial killing and the post-antibiotic effect (PAE) to maximize efficacy while reducing nephrotoxicity and ototoxicity.

### 5.1 Protocol Initiation Rules

- Target Dose: **7.0 mg/kg** administered as an intravenous infusion over exactly **60 minutes**.
- Dosing Weight:
  - If $\text{ABW} < \text{IBW}$: Use $\text{ABW}$.
  - If $\text{ABW} \ge 1.2 \times \text{IBW}$: Use $\text{AdjBW} = \text{IBW} + 0.4 \times (\text{ABW} - \text{IBW})$.
  - Otherwise: Use $\text{IBW}$.
- Exclusions (Cannot use Hartford Nomogram):
  - Baseline $\text{CrCl} < 20\text{ mL/min}$.
  - Dialysis or CRRT patients.
  - Ascites or severe fluid overload (altered volume of distribution).
  - Burns $> 20\%$ TBSA.
  - Pregnancy.
  - Enterococcal endocarditis (requires synergistic low-dose 1 mg/kg q8h).

### 5.2 Serum Level Timing & Nomogram Interpretation Table

A random serum concentration is drawn between **6 and 14 hours** after the *start* of the 60-minute infusion:

| Elapsed Time Post-Infusion Start | Zone 1: Dosing Interval q24h | Zone 2: Dosing Interval q36h | Zone 3: Dosing Interval q48h | Zone 4: Off-Nomogram / Stop Drug |
| :--- | :--- | :--- | :--- | :--- |
| **6 Hours** | $\le 8.5\text{ mcg/mL}$ | $8.6 - 12.0\text{ mcg/mL}$ | $12.1 - 15.0\text{ mcg/mL}$ | $> 15.0\text{ mcg/mL}$ |
| **7 Hours** | $\le 7.0\text{ mcg/mL}$ | $7.1 - 10.0\text{ mcg/mL}$ | $10.1 - 13.0\text{ mcg/mL}$ | $> 13.0\text{ mcg/mL}$ |
| **8 Hours** | $\le 5.5\text{ mcg/mL}$ | $5.6 - 8.2\text{ mcg/mL}$ | $8.3 - 11.0\text{ mcg/mL}$ | $> 11.0\text{ mcg/mL}$ |
| **9 Hours** | $\le 4.3\text{ mcg/mL}$ | $4.4 - 6.6\text{ mcg/mL}$ | $6.7 - 9.0\text{ mcg/mL}$ | $> 9.0\text{ mcg/mL}$ |
| **10 Hours** | $\le 3.4\text{ mcg/mL}$ | $3.5 - 5.3\text{ mcg/mL}$ | $5.4 - 7.5\text{ mcg/mL}$ | $> 7.5\text{ mcg/mL}$ |
| **11 Hours** | $\le 2.7\text{ mcg/mL}$ | $2.8 - 4.3\text{ mcg/mL}$ | $4.4 - 6.2\text{ mcg/mL}$ | $> 6.2\text{ mcg/mL}$ |
| **12 Hours** | $\le 2.1\text{ mcg/mL}$ | $2.2 - 3.5\text{ mcg/mL}$ | $3.6 - 5.2\text{ mcg/mL}$ | $> 5.2\text{ mcg/mL}$ |
| **13 Hours** | $\le 1.7\text{ mcg/mL}$ | $1.8 - 2.8\text{ mcg/mL}$ | $2.9 - 4.3\text{ mcg/mL}$ | $> 4.3\text{ mcg/mL}$ |
| **14 Hours** | $\le 1.3\text{ mcg/mL}$ | $1.4 - 2.3\text{ mcg/mL}$ | $2.4 - 3.5\text{ mcg/mL}$ | $> 3.5\text{ mcg/mL}$ |

### 5.3 Clinical Operational Workflow for Nomogram Output

- **Zone 1 (q24h)**: Patient clears drug rapidly. Continue 7 mg/kg every 24 hours.
- **Zone 2 (q36h)**: Moderate clearance delay. Continue 7 mg/kg every 36 hours.
- **Zone 3 (q48h)**: Significant clearance delay. Continue 7 mg/kg every 48 hours.
- **Zone 4 (Off-Nomogram)**: Severe delayed clearance. **STOP AMINOGLYCOSIDE IMMEDIATELY**.
  - Do not give next dose until serum level drops below $1.0\text{ mcg/mL}$.
  - Monitor daily serum creatinine.
  - Mandatory clinical pharmacist / infectious disease specialist review to assess acute kidney injury.

---

## 6. Pure Kotlin Domain Models and PK-PD Calculation Engine

### 6.1 Kotlin Serialization Data Structures

```kotlin
package com.krupet.clinic.core.antimicrobial.model

import kotlinx.serialization.Serializable

@Serializable
enum class AwareCategory {
    ACCESS,
    WATCH,
    RESERVE
}

@Serializable
data class PatientBodyMetrics(
    val actualWeightKg: Double,
    val heightCm: Double,
    val ageYears: Int,
    val isFemale: Boolean,
    val serumCreatinineMgDl: Double
)

@Serializable
data class RenalClearanceResult(
    val idealBodyWeightKg: Double,
    val adjustedBodyWeightKg: Double?,
    val dosingWeightKg: Double,
    val cockcroftGaultCrClMlMin: Double,
    val ckdEpiEgfrMlMinPer173m2: Double,
    val isElderlyCreatinineClamped: Boolean,
    val renalImpairmentStageKhmer: String,
    val renalImpairmentStageEnglish: String
)

@Serializable
data class VancomycinTwoPointInput(
    val doseMg: Double,
    val infusionDurationHours: Double,
    val dosingIntervalHours: Double,
    val peakConcentrationMcgMl: Double,
    val troughConcentrationMcgMl: Double,
    val timeFromEndInfusionToPeakHours: Double,
    val timeFromTroughToNextDoseHours: Double,
    val targetMicMgL: Double = 1.0
)

@Serializable
data class VancomycinPkResult(
    val eliminationRateConstantKe: Double,
    val eliminationHalfLifeHours: Double,
    val truePeakConcentration: Double,
    val trueTroughConcentration: Double,
    val volumeOfDistributionLiters: Double,
    val clearanceLitersPerHour: Double,
    val calculatedAuc24: Double,
    val aucOverMicRatio: Double,
    val isTherapeutic: Boolean,
    val isNephrotoxicityAlert: Boolean,
    val recommendationKhmer: String,
    val recommendationEnglish: String
)

@Serializable
enum class HartfordNomogramInterval {
    Q24H,
    Q36H,
    Q48H,
    OFF_NOMOGRAM_STOP_DRUG
}

@Serializable
data class HartfordNomogramResult(
    val elapsedHoursPostStart: Double,
    val serumConcentrationMcgMl: Double,
    val assignedInterval: HartfordNomogramInterval,
    val isHoldNextDoseRequired: Boolean,
    val guidanceKhmer: String,
    val guidanceEnglish: String
)
```

### 6.2 Pure Kotlin PK-PD Calculation Engine

```kotlin
package com.krupet.clinic.core.antimicrobial.engine

import com.krupet.clinic.core.antimicrobial.model.HartfordNomogramInterval
import com.krupet.clinic.core.antimicrobial.model.HartfordNomogramResult
import com.krupet.clinic.core.antimicrobial.model.PatientBodyMetrics
import com.krupet.clinic.core.antimicrobial.model.RenalClearanceResult
import com.krupet.clinic.core.antimicrobial.model.VancomycinPkResult
import com.krupet.clinic.core.antimicrobial.model.VancomycinTwoPointInput
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

class AntimicrobialPkPdEngine {

    fun calculateRenalClearance(metrics: PatientBodyMetrics): RenalClearanceResult {
        val heightInches = metrics.heightCm / 2.54
        val ibw = if (metrics.isFemale) {
            45.5 + 2.3 * (heightInches - 60.0)
        } else {
            50.0 + 2.3 * (heightInches - 60.0)
        }

        val isObese = metrics.actualWeightKg >= 1.2 * ibw
        val adjBw = if (isObese) {
            ibw + 0.4 * (metrics.actualWeightKg - ibw)
        } else null

        val dosingWeight = when {
            metrics.actualWeightKg < ibw -> metrics.actualWeightKg
            isObese -> adjBw ?: ibw
            else -> ibw
        }

        var clampedScr = metrics.serumCreatinineMgDl
        var isClamped = false
        if (metrics.ageYears >= 65 && clampedScr < 0.6) {
            clampedScr = 0.6
            isClamped = true
        }

        val genderFactor = if (metrics.isFemale) 0.85 else 1.0
        val crCl = ((140.0 - metrics.ageYears) * dosingWeight * genderFactor) / (72.0 * clampedScr)

        val kappa = if (metrics.isFemale) 0.7 else 0.9
        val alpha = if (metrics.isFemale) -0.241 else -0.302
        val femaleFactor = if (metrics.isFemale) 1.012 else 1.0

        val scrOverKappa = metrics.serumCreatinineMgDl / kappa
        val egfr = 142.0 *
                min(scrOverKappa, 1.0).pow(alpha) *
                max(scrOverKappa, 1.0).pow(-1.200) *
                0.9938.pow(metrics.ageYears.toDouble()) *
                femaleFactor

        val stageKhmer: String
        val stageEnglish: String
        when {
            crCl >= 90.0 -> {
                stageKhmer = "មុខងារតម្រងនោមធម្មតា: CrCl លើសពី 90 mL/min"
                stageEnglish = "Normal renal function: CrCl >= 90 mL/min"
            }
            crCl >= 60.0 -> {
                stageKhmer = "ចុះខ្សោយកម្រិតស្រាល: CrCl 60 ទៅ 89 mL/min"
                stageEnglish = "Mild renal impairment: CrCl 60 to 89 mL/min"
            }
            crCl >= 30.0 -> {
                stageKhmer = "ចុះខ្សោយកម្រិតមធ្យម: CrCl 30 ទៅ 59 mL/min"
                stageEnglish = "Moderate renal impairment: CrCl 30 to 59 mL/min"
            }
            crCl >= 15.0 -> {
                stageKhmer = "ចុះខ្សោយកម្រិតធ្ងន់ធ្ងរ: CrCl 15 ទៅ 29 mL/min"
                stageEnglish = "Severe renal impairment: CrCl 15 to 29 mL/min"
            }
            else -> {
                stageKhmer = "ខ្សោយតម្រងនោមដំណាក់កាលចុងក្រោយ: CrCl ក្រោម 15 mL/min"
                stageEnglish = "End stage renal disease: CrCl < 15 mL/min"
            }
        }

        return RenalClearanceResult(
            idealBodyWeightKg = ibw,
            adjustedBodyWeightKg = adjBw,
            dosingWeightKg = dosingWeight,
            cockcroftGaultCrClMlMin = crCl,
            ckdEpiEgfrMlMinPer173m2 = egfr,
            isElderlyCreatinineClamped = isClamped,
            renalImpairmentStageKhmer = stageKhmer,
            renalImpairmentStageEnglish = stageEnglish
        )
    }

    fun calculateVancomycinPk(input: VancomycinTwoPointInput): VancomycinPkResult {
        val deltaT = input.dosingIntervalHours - input.timeFromEndInfusionToPeakHours - input.timeFromTroughToNextDoseHours
        val ke = ln(input.peakConcentrationMcgMl / input.troughConcentrationMcgMl) / deltaT
        val halfLife = 0.693 / ke

        val truePeak = input.peakConcentrationMcgMl * exp(ke * input.timeFromEndInfusionToPeakHours)
        val trueTrough = input.troughConcentrationMcgMl * exp(-ke * input.timeFromTroughToNextDoseHours)

        val expTerm = exp(-ke * input.infusionDurationHours)
        val vd = (input.doseMg * (1.0 - expTerm)) /
                (input.infusionDurationHours * ke * (truePeak - trueTrough * expTerm))

        val clearance = ke * vd
        val totalDailyDose = input.doseMg * (24.0 / input.dosingIntervalHours)
        val auc24 = totalDailyDose / clearance
        val aucOverMic = auc24 / input.targetMicMgL

        val isTherapeutic = aucOverMic in 400.0..600.0
        val isNephroAlert = input.troughConcentrationMcgMl > 20.0

        val recKhmer: String
        val recEnglish: String
        when {
            isNephroAlert -> {
                recKhmer = "ប្រកាសអាសន្នជាតិពុលតម្រងនោម: កំហាប់ថ្នាំលើសពី 20 mcg/mL ត្រូវផ្អាកការចាក់ថ្នាំភ្លាមៗ"
                recEnglish = "Critical nephrotoxicity alert: Trough > 20 mcg/mL, hold dose and monitor creatinine"
            }
            aucOverMic < 400.0 -> {
                recKhmer = "កម្រិតថ្នាំទាបជាងស្តង់ដារព្យាបាល: AUC24 ក្រោម 400 ត្រូវបង្កើនកម្រិតថ្នាំ ឬបន្ថយចន្លោះពេល"
                recEnglish = "Subtherapeutic AUC24 < 400: Increase dose or shorten dosing interval"
            }
            aucOverMic > 600.0 -> {
                recKhmer = "កម្រិតថ្នាំលើសស្តង់ដារព្យាបាល: AUC24 លើសពី 600 ប្រឈមនឹងជាតិពុលតម្រងនោម ត្រូវកាត់បន្ថយកម្រិតថ្នាំ"
                recEnglish = "Supratherapeutic AUC24 > 600: Reduce dose or extend dosing interval"
            }
            else -> {
                recKhmer = "កម្រិតថ្នាំត្រឹមត្រូវតាមស្តង់ដារព្យាបាល: AUC24 ក្នុងចន្លោះ 400 ទៅ 600 អាចបន្តកម្រិតនេះបាន"
                recEnglish = "Therapeutic target achieved: AUC24 400 to 600 mg*h/L, maintain current regimen"
            }
        }

        return VancomycinPkResult(
            eliminationRateConstantKe = ke,
            eliminationHalfLifeHours = halfLife,
            truePeakConcentration = truePeak,
            trueTroughConcentration = trueTrough,
            volumeOfDistributionLiters = vd,
            clearanceLitersPerHour = clearance,
            calculatedAuc24 = auc24,
            aucOverMicRatio = aucOverMic,
            isTherapeutic = isTherapeutic,
            isNephrotoxicityAlert = isNephroAlert,
            recommendationKhmer = recKhmer,
            recommendationEnglish = recEnglish
        )
    }

    fun evaluateHartfordNomogram(
        elapsedHours: Double,
        serumConcentration: Double
    ): HartfordNomogramResult {
        require(elapsedHours in 6.0..14.0) { "Serum sample must be drawn between 6 and 14 hours post-infusion start" }

        val q24Max: Double
        val q36Max: Double
        val q48Max: Double

        when {
            elapsedHours <= 6.5 -> { q24Max = 8.5; q36Max = 12.0; q48Max = 15.0 }
            elapsedHours <= 7.5 -> { q24Max = 7.0; q36Max = 10.0; q48Max = 13.0 }
            elapsedHours <= 8.5 -> { q24Max = 5.5; q36Max = 8.2;  q48Max = 11.0 }
            elapsedHours <= 9.5 -> { q24Max = 4.3; q36Max = 6.6;  q48Max = 9.0  }
            elapsedHours <= 10.5 -> { q24Max = 3.4; q36Max = 5.3; q48Max = 7.5  }
            elapsedHours <= 11.5 -> { q24Max = 2.7; q36Max = 4.3; q48Max = 6.2  }
            elapsedHours <= 12.5 -> { q24Max = 2.1; q36Max = 3.5; q48Max = 5.2  }
            elapsedHours <= 13.5 -> { q24Max = 1.7; q36Max = 2.8; q48Max = 4.3  }
            else -> { q24Max = 1.3; q36Max = 2.3; q48Max = 3.5 }
        }

        val interval: HartfordNomogramInterval
        val isHold: Boolean
        val guideKhmer: String
        val guideEnglish: String

        when {
            serumConcentration <= q24Max -> {
                interval = HartfordNomogramInterval.Q24H
                isHold = false
                guideKhmer = "លទ្ធផលធម្មតា: បន្តផ្តល់ថ្នាំកម្រិត 7 mg/kg រៀងរាល់ 24 ម៉ោងម្តង"
                guideEnglish = "Zone 1: Administer 7 mg/kg every 24 hours"
            }
            serumConcentration <= q36Max -> {
                interval = HartfordNomogramInterval.Q36H
                isHold = false
                guideKhmer = "ការបញ្ចេញថ្នាំថយចុះមធ្យម: បន្តផ្តល់ថ្នាំកម្រិត 7 mg/kg រៀងរាល់ 36 ម៉ោងម្តង"
                guideEnglish = "Zone 2: Administer 7 mg/kg every 36 hours"
            }
            serumConcentration <= q48Max -> {
                interval = HartfordNomogramInterval.Q48H
                isHold = false
                guideKhmer = "ការបញ្ចេញថ្នាំថយចុះខ្លាំង: បន្តផ្តល់ថ្នាំកម្រិត 7 mg/kg រៀងរាល់ 48 ម៉ោងម្តង"
                guideEnglish = "Zone 3: Administer 7 mg/kg every 48 hours"
            }
            else -> {
                interval = HartfordNomogramInterval.OFF_NOMOGRAM_STOP_DRUG
                isHold = true
                guideKhmer = "កម្រិតថ្នាំលើសក្រាហ្វសុវត្ថិភាព: ផ្អាកការចាក់ថ្នាំជាបន្ទាន់ រង់ចាំកំហាប់ចុះក្រោម 1 mcg/mL និងពិគ្រោះជាមួយអ្នកឯកទេស"
                guideEnglish = "Zone 4 Off-Nomogram: Hold aminoglycoside immediately, follow levels to < 1 mcg/mL, consult ID specialist"
            }
        }

        return HartfordNomogramResult(
            elapsedHoursPostStart = elapsedHours,
            serumConcentrationMcgMl = serumConcentration,
            assignedInterval = interval,
            isHoldNextDoseRequired = isHold,
            guidanceKhmer = guideKhmer,
            guidanceEnglish = guideEnglish
        )
    }
}
```

---

## 7. Bilingual Khmer-English Medical Nomenclature & Stewardship Terminology

Standardized terminology for clinical pharmacy, antimicrobial stewardship, and pharmacokinetic alerts:

> [!NOTE]
> In strict compliance with ironclad rules, all Khmer strings avoid parentheses and use hyphens, colons, or commas.

### 7.1 WHO AWaRe and Stewardship Terminology

| Code Key | English Medical Terminology | Khmer Medical Terminology | Clinical Operational Meaning |
| :--- | :--- | :--- | :--- |
| `AWARE_ACCESS` | Access Antibiotic Tier | ក្រុមឱសថអង់ទីប៊ីយ៉ូទិកប្រើប្រាស់ទូទៅ - Access | First-line, low resistance potential |
| `AWARE_WATCH` | Watch Antibiotic Tier | ក្រុមឱសថអង់ទីប៊ីយ៉ូទិកតាមដានការប្រើប្រាស់ - Watch | Higher resistance potential |
| `AWARE_RESERVE` | Reserve Antibiotic Tier | ក្រុមឱសថអង់ទីប៊ីយ៉ូទិកបម្រុងទុកពិសេស - Reserve | Last-resort restricted antimicrobials |
| `STEWARD_TIMEOUT_72H` | 72-Hour Antibiotic Timeout | ការវាយតម្លៃឡើងវិញក្នុងរយៈពេល៧២ម៉ោង | Mandatory clinical reassessment |
| `STEWARD_PREAUTH_REQ` | Specialist Approval Required | តម្រូវឱ្យមានការអនុម័តពីវេជ្ជបណ្ឌិតឯកទេស ឬឱសថការីគ្លីនិក | Reserve pre-authorization gate |
| `STEWARD_DEESCALATION` | Antimicrobial De-escalation | ការកែសម្រួលបន្ថយកម្រិតថ្នាំតាមលទ្ធផលបណ្តុះមេរោគ | Narrowing antibiotic spectrum |

### 7.2 Pharmacokinetic and Therapeutic Drug Monitoring Terminology

| Code Key | English Medical Terminology | Khmer Medical Terminology | Clinical Context |
| :--- | :--- | :--- | :--- |
| `PK_AUC24_TARGET` | Target AUC24 over MIC Ratio | សមាមាត្រគោលដៅនៃទំហំផ្ទៃក្រោមកោងក្នុង២៤ម៉ោងធៀបនឹងកំហាប់អប្បបរមា | Target AUC24/MIC 400-600 |
| `PK_NEPHROTOX_ALERT` | Critical Nephrotoxicity Alert | ការប្រកាសអាសន្នជាតិពុលលើតម្រងនោម | Trough > 20 mcg/mL safety gate |
| `PK_SUBTHERAPEUTIC` | Subtherapeutic Drug Level | កំហាប់ថ្នាំទាបជាងកម្រិតព្យាបាល | Risk of treatment failure |
| `PK_TROUGH_SAMPLE` | Pre-Dose Trough Blood Draw | ការបូមឈាមវាស់កំហាប់ទាបបំផុតមុនម៉ោងចាក់ថ្នាំ | 30 minutes before next dose |
| `PK_PEAK_SAMPLE` | Post-Infusion Peak Blood Draw | ការបូមឈាមវាស់កំហាប់ខ្ពស់បំផុតក្រោយចាក់ថ្នាំរួច | 1-2 hours post-infusion |
| `HARTFORD_Q24H` | Extended Interval 24 Hours | ផ្តល់ថ្នាំរៀងរាល់២៤ម៉ោងម្តង | Hartford Zone 1 |
| `HARTFORD_Q36H` | Extended Interval 36 Hours | ផ្តល់ថ្នាំរៀងរាល់៣៦ម៉ោងម្តង | Hartford Zone 2 |
| `HARTFORD_Q48H` | Extended Interval 48 Hours | ផ្តល់ថ្នាំរៀងរាល់៤៨ម៉ោងម្តង | Hartford Zone 3 |
| `HARTFORD_OFF_NOMO` | Off-Nomogram Hold Medication | លើសក្រាហ្វសុវត្ថិភាព ផ្អាកការផ្តល់ថ្នាំភ្លាមៗ | Hartford Zone 4 toxicity alert |

---

## 8. Quality Assurance, Security & Regulatory Matrix

### 8.1 Verification Checklist

| Test ID | Test Scenario | Acceptance Criteria | Target Outcome |
| :--- | :--- | :--- | :--- |
| `AMR-TST-01` | Reserve Tier Approval Gate | Attempt to dispense Meropenem without ID specialist sign-off; verify eMAR block | Hard Block `STEWARD_PREAUTH_REQ` |
| `AMR-TST-02` | 72-Hour Timeout Stop Order | Unreviewed Watch/Reserve antibiotic at 72 hours; verify automatic stop flag | Automated Halt `STEWARD_TIMEOUT_72H` |
| `AMR-TST-03` | Obese Patient Weight Adjustment | Verify AdjBW is used for Cockcroft-Gault when ABW >= 1.2 * IBW | Validated `AdjBW` Selected |
| `AMR-TST-04` | Sarcopenic Elderly CrCl Clamping | Patient age 78 with SCr 0.4 mg/dL; verify SCr is clamped to 0.6 mg/dL | Clamped to 0.6 mg/dL |
| `AMR-TST-05` | Vancomycin Trough > 20 mcg/mL | Trough input 22.5 mcg/mL; verify critical nephrotoxicity alert and dose hold | Critical Alert `PK_NEPHROTOX_ALERT` |
| `AMR-TST-06` | Hartford Nomogram Zone 4 | Sample at 8h measuring 12.5 mcg/mL; verify Off-Nomogram and mandatory hold | Off-Nomogram `HARTFORD_OFF_NOMO` |
| `AMR-TST-07` | Typography Constraints | Automated scan for zero emojis and zero parentheses across all Khmer text | 100% Pass (Zero Violations) |

### 8.2 Conclusion

The KruPet Antimicrobial Stewardship, PK-PD, and Precision Renal Dosing specification delivers an evidence-based clinical decision support standard for Cambodian tertiary and provincial healthcare facilities. By automating WHO AWaRe governance, precision renal equations, Bayesian-aligned Vancomycin AUC24 monitoring, and Hartford aminoglycoside dosing, KruPet safeguards patient renal function, ensures therapeutic cure rates, and fights against antimicrobial resistance.
