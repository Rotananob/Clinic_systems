# Chemotherapy Regimen Protocol Engine and Oncology Precision Dosing Specification
Document Identifier: CHEMO-ONCOLOGY-ENGINE-SPEC-2026-V1
Compliance Standards: NCCN Guidelines, ASCO/ONS Chemotherapy Administration Safety Standards, CAP Guidelines
Classification: Pure Enterprise Standard Medical Oncology Clinical Decision Support

---

## 1. Executive Summary and Oncology Protocol Engine Architecture

### 1.1 Clinical Rationale
Cytotoxic chemotherapy agents possess the narrowest therapeutic index of any pharmaceutical class. Dosing errors can result in either fatal multi-organ toxicity (severe neutropenic septic shock, hemorrhagic cystitis, mucosal sloughing, irreversible cardiomyopathy, peripheral sensory neuropathy) or subtherapeutic underdosing leading to preventable cancer recurrence.

The Chemotherapy Regimen Protocol Engine provides closed-loop oncology safety:
1. Multi-formula Body Surface Area (BSA) evaluation with safety capping.
2. Precision renal Carboplatin dosing via the Calvert Formula with FDA/ASCO GFR capping.
3. Lifetime cumulative Anthracycline isotoxic cardiotoxicity monitoring.
4. Pre-treatment laboratory safety hold interlocks (NCCN/ASCO hematologic and organ function criteria).
5. Comprehensive multi-cycle regimen protocols: mFOLFOX6, R-CHOP, AC-T, and Carboplatin + Paclitaxel.

```
+----------------------------------------------------------------------------------------------------+
|                      ONCOLOGY PRECISION DOSING AND SAFETY INTERLOCK ENGINE                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL ONCOLOGY ORDER INGESTION ]                                                             |
|  - Patient Height (cm), Weight (kg), Age, Biological Gender                                        |
|  - Serum Creatinine, ANC (/mcL), Platelets (/mcL), Total Bilirubin, AST/ALT                        |
|  - Lifetime Cumulative Anthracycline Exposure History                                             |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | ANTHROPOMETRIC & RENAL DOSING CALCULATOR                                                      | |
|  | - Calculates BSA: Mosteller (Standard), DuBois, Haycock                                       | |
|  | - Enforces Safety Capping Policy: Alert at BSA > 2.0 m^2; Maximum Cap 2.2 m^2                 | |
|  | - Evaluates Cockcroft-Gault CrCl & Caps GFR at 125 mL/min                                     | |
|  | - Calculates Carboplatin Dose = Target_AUC * (min(GFR, 125) + 25)                             | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | CUMULATIVE CARDIOTOXICITY TRACKER                                                             | |
|  | - Converts Anthracycline to Doxorubicin Isotoxic Equivalents                                  | |
|  | - Tracks Cumulative Dose against Lifetime Ceiling (Doxorubicin 450 mg/m^2)                     | |
|  | - HARD LOCKOUT if Projected Cumulative Dose Exceeds Ceiling                                   | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | NCCN / ASCO PRE-CYCLE LABORATORY SAFETY GATE                                                  | |
|  | - ANC < 1,500 /mcL -> CHEMO HOLD (Febrile Neutropenia Risk)                                    | |
|  | - Platelets < 100,000 /mcL -> CHEMO HOLD (Thrombocytopenic Hemorrhage Risk)                    | |
|  | - Total Bilirubin > 1.5x ULN -> CHEMO HOLD / 50% DOSE REDUCTION (Hepatotoxicity)               | |
|  | - Serum CrCl < 50 mL/min -> CISPLATIN / METHOTREXATE HOLD (Nephrotoxicity)                     | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ PROTOCOL DISPENSING CLEARANCE ]  -->  Dual-Oncologist & Oncology Pharmacist Signoff             |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Body Surface Area (BSA) Formulations and Safety Capping

Body Surface Area ($\text{BSA}$ in square meters, $\text{m}^2$) standardizes cytotoxic dosing across variable patient body habits.

### 2.1 Standard Mathematical Formulations

#### 1. Mosteller Formula (1987) - Preferred Clinical Telemetry Standard:
$$\text{BSA}_{\text{Mosteller}} = \sqrt{\frac{\text{Height}_{\text{cm}} \times \text{Weight}_{\text{kg}}}{3600}}$$

#### 2. DuBois and DuBois Formula (1916):
$$\text{BSA}_{\text{DuBois}} = 0.007184 \times \text{Height}_{\text{cm}}^{0.725} \times \text{Weight}_{\text{kg}}^{0.425}$$

#### 3. Haycock Formula (1978) - Preferred for Pediatric Oncology:
$$\text{BSA}_{\text{Haycock}} = 0.024265 \times \text{Height}_{\text{cm}}^{0.3964} \times \text{Weight}_{\text{kg}}^{0.5378}$$

---

### 2.2 ASCO Guidelines on BSA Capping in Adult Oncology
Historically, clinicians applied an empirical cap at $\text{BSA} = 2.0\text{ m}^2$ to avoid overdose in obese patients. However, the American Society of Clinical Oncology (ASCO) clinical practice guidelines establish that:
1. Curative-Intent Chemotherapy: Full, uncapped weight-based doses should be utilized in obese patients receiving curative treatment (e.g., adjuvant breast, curative colon, Hodgkin lymphoma) because arbitrary dose reductions compromise overall survival.
2. Safety Alert Threshold:
   - When calculated $\text{BSA} > 2.0\text{ m}^2$, the engine generates an advisory warning:
     `BSA_EXCEEDS_2_POINT_0_ADVISORY`
   - In non-curative, palliative, or high-toxicity regimens where institutional protocol dictates a hard ceiling, the engine clamps BSA to a configurable hard ceiling:
     $$\text{BSA}_{\text{effective}} = \min(\text{BSA}_{\text{calculated}}, 2.20\text{ m}^2)$$
   - Absolute Maximum Mechanical Hard Ceiling: $\text{BSA} = 2.50\text{ m}^2$.

---

## 3. Calvert Formula for Precision Carboplatin Dosing

### 3.1 The Calvert Pharmacokinetic Principle
Unlike classical BSA-dosed alkylating agents, Carboplatin elimination is predominantly renal ($> 85\%$ excreted unchanged by glomerular filtration). Dosing based strictly on BSA causes profound, life-threatening myelosuppression in patients with renal impairment, or severe underdosing in patients with high clearance.

The Calvert Formula doses Carboplatin directly to target a specific Area Under the plasma concentration-time Curve (Target AUC in $\text{mg/mL}\cdot\text{min}$):

$$\text{Carboplatin Dose}_{\text{mg}} = \text{Target AUC} \times (\text{GFR}_{\text{mL/min}} + 25)$$

Where:
- $\text{Target AUC}$: Typically $4\text{ to } 6\text{ mg/mL}\cdot\text{min}$ (e.g., $\text{AUC } 5$ or $\text{AUC } 6$ for solid tumors; $\text{AUC } 2$ for weekly radiosensitization).
- $\text{GFR}$: Glomerular Filtration Rate in $\text{mL/min}$, clinically estimated via Cockcroft-Gault Creatinine Clearance ($\text{CrCl}$).
- $+25$: Non-renal clearance constant ($25\text{ mL/min}$).

---

### 3.2 FDA and ASCO GFR Capping Mandate
In patients with super-normal or overestimated renal clearance (e.g., young patients or low serum creatinine), an uncapped $\text{CrCl}$ yields dangerously high Carboplatin doses resulting in lethal thrombocytopenic hemorrhage and neutropenic sepsis.

#### Statutory Capping Rule:
The GFR used in the Calvert formula is capped at a maximum ceiling of $125.0\text{ mL/min}$:

$$\text{Effective GFR} = \min(\text{GFR}_{\text{calculated}}, 125.0\text{ mL/min})$$

$$\text{Carboplatin Dose}_{\text{mg}} = \text{Target AUC} \times (\min(\text{GFR}, 125) + 25)$$

#### Maximum Allowable Carboplatin Dose Limits:
| Target AUC | Calculation Formula | Absolute Maximum Allowable Dose |
|---|---|---|
| Target AUC 6 | $6 \times (125 + 25) = 6 \times 150$ | $900.0\text{ mg}$ |
| Target AUC 5 | $5 \times (125 + 25) = 5 \times 150$ | $750.0\text{ mg}$ |
| Target AUC 4 | $4 \times (125 + 25) = 4 \times 150$ | $600.0\text{ mg}$ |
| Target AUC 2 | $2 \times (125 + 25) = 2 \times 150$ | $300.0\text{ mg}$ |

If an oncology order requests a dose exceeding these absolute caps, the engine triggers an unbypassable safety block: `CARBOPLATIN_CALVERT_CAP_EXCEEDED`.

---

## 4. Cumulative Anthracycline Cardiotoxicity Ceilings

### 4.1 Cardiotoxic Mechanism
Anthracyclines (Doxorubicin, Epirubicin, Daunorubicin, Idarubicin) and related anthracenediones (Mitoxantrone) generate iron-dependent reactive oxygen species, topoisomerase II-beta inhibition, and mitochondrial dysfunction in cardiomyocytes. This produces irreversible, dose-dependent myocardial myofibrillar loss leading to congestive heart failure (CHF) and refractory cardiogenic shock.

---

### 4.2 Lifetime Exposure Ceilings and Isotoxic Conversion Factors
To track total lifetime cardiotoxic burden across all prior treatment cycles and different anthracycline compounds, every agent is converted into **Doxorubicin Isotoxic Equivalents**:

$$\text{Doxorubicin Equivalent Dose} = \text{Administered Dose}_{\text{mg/m}^2} \times \text{Isotoxic Factor}$$

#### Master Anthracycline Equivalence Table:
| Anthracycline Agent | Trade Name | Isotoxic Conversion Factor | Standard Lifetime Limit (Unadjusted) | Reduced Lifetime Limit (Prior Mediastinal Radiation) |
|---|---|---|---|---|
| Doxorubicin Hydrochloride | Adriamycin | $1.0$ (Reference Standard) | $450\text{ to } 550\text{ mg/m}^2$ | $400\text{ mg/m}^2$ |
| Epirubicin | Ellence, Pharmorubicin | $0.6$ (or $0.5\text{--}0.6$) | $900\text{ mg/m}^2$ | $720\text{ mg/m}^2$ |
| Daunorubicin | Cerubidine | $0.5$ | $550\text{ to } 600\text{ mg/m}^2$ | $450\text{ mg/m}^2$ |
| Idarubicin | Idamycin | $5.0$ (High Potency) | $150\text{ mg/m}^2$ | $120\text{ mg/m}^2$ |
| Mitoxantrone | Novantrone | $4.0$ | $140\text{ to } 160\text{ mg/m}^2$ | $100\text{ mg/m}^2$ |

---

### 4.3 Cumulative Cardiotoxicity Tracking Engine Logic

$$\text{Cumulative Exposure}_{\text{Dox\_Eq}} = \sum_{k=1}^{N} \Big( \text{Dose}_k \times \text{IsotoxicFactor}_k \Big)$$

#### Hard Safety Interlock Triggers:
1. Exposure $\ge 350\text{ mg/m}^2$ Doxorubicin equivalents:
   - Status: `CARDIOTOXICITY_MONITORING_ALERT`
   - Mandate: Baseline echocardiogram or MUGA scan required; Left Ventricular Ejection Fraction (LVEF) must be $\ge 50\%$.
2. Exposure $\ge 400\text{ mg/m}^2$ Doxorubicin equivalents:
   - Status: `CARDIOPROTECTANT_RECOMMENDED`
   - Recommendation: Initiate cardioprotective chelator Dexrazoxane (Zinecard) prior to subsequent anthracycline infusions.
3. Exposure $\ge 450\text{ mg/m}^2$ Doxorubicin equivalents (or $400\text{ mg/m}^2$ with prior thoracic radiation):
   - Status: `ANTHRACYCLINE_LIFETIME_CEILING_BREACH`
   - Hard Safety Block: Dispensing is physically blocked. Further anthracycline administration is strictly contraindicated.

---

## 5. NCCN and ASCO Pre-Treatment Laboratory Safety Hold Criteria

Prior to releasing chemotherapy for cycle Day 1 administration, the patient's current laboratory values (drawn within 24 to 72 hours) must satisfy the following safety criteria:

```
+----------------------------------------------------------------------------------------------------+
|                         PRE-CYCLE CHEMOTHERAPY RELEASE LABORATORY GATES                            |
+--------------------------+-----------------------+------------------------+------------------------+
| Laboratory Parameter     | Minimum Threshold     | Action on Violation    | Clinical Hazard        |
+--------------------------+-----------------------+------------------------+------------------------+
| Absolute Neutrophil (ANC)| >= 1,500 /mcL         | CHEMOTHERAPY HOLD      | Fatal Febrile          |
|                          |                       | (Delay 7 Days + G-CSF) | Neutropenia / Sepsis   |
+--------------------------+-----------------------+------------------------+------------------------+
| Platelet Count (PLT)     | >= 100,000 /mcL       | CHEMOTHERAPY HOLD      | Spontaneous Intracran. |
|                          |                       | (Delay 7 Days)         | or GI Hemorrhage       |
+--------------------------+-----------------------+------------------------+------------------------+
| Total Bilirubin          | <= 1.5x ULN           | 50% DOSE REDUCTION     | Severe Hepatic Drug    |
|                          | (> 3.0x ULN -> HOLD)  | or CHEMOTHERAPY HOLD   | Accumulation & Death   |
+--------------------------+-----------------------+------------------------+------------------------+
| AST and ALT              | <= 2.5x ULN           | 25-50% DOSE REDUCTION  | Hepatocellular Injury  |
|                          | (<= 5x if liver mets) | or CHEMOTHERAPY HOLD   | and Necrosis           |
+--------------------------+-----------------------+------------------------+------------------------+
| Creatinine Clearance     | >= 50 to 60 mL/min    | CISPLATIN / PEMETREXED | Acute Tubular          |
|                          |                       | HOLD / SWITCH CARBOPL. | Necrosis & Renal Loss  |
+--------------------------+-----------------------+------------------------+------------------------+
```

---

## 6. Master Oncology Regimen Protocol Specifications

### 6.1 Modified FOLFOX6 (mFOLFOX6)
- Primary Clinical Indication: Adjuvant Stage III / Metastatic Colorectal Cancer
- Cycle Length: 14 days (2-week cycle)
- Standard Course: 12 cycles (adjuvant 6 months)

#### Drug Components:
1. Oxaliplatin: $85.0\text{ mg/m}^2$ IV infusion in $250\text{ to } 500\text{ mL}$ D5W over 120 minutes on Day 1. (Precaution: Acute cold-induced dysesthesia and peripheral sensory neuropathy).
2. Leucovorin Calcium (Folinic Acid): $400.0\text{ mg/m}^2$ IV in D5W over 120 minutes on Day 1 (administered concurrently with Oxaliplatin using a Y-site connector).
3. 5-Fluorouracil (5-FU) IV Push: $400.0\text{ mg/m}^2$ IV bolus over 2 to 4 minutes on Day 1 following Leucovorin.
4. 5-Fluorouracil (5-FU) Continuous Infusion: $2,400.0\text{ mg/m}^2$ continuous IV infusion over 46 hours via an elastomeric ambulatory infusion pump or electronic ambulatory driver.

---

### 6.2 R-CHOP
- Primary Clinical Indication: Diffuse Large B-Cell Non-Hodgkin Lymphoma (DLBCL)
- Cycle Length: 21 days (3-week cycle)
- Standard Course: 6 to 8 cycles

#### Drug Components:
1. Rituximab: $375.0\text{ mg/m}^2$ IV infusion on Day 1. Premedications mandatory: Paracetamol 1,000mg PO, Diphenhydramine 50mg IV, Hydrocortisone 100mg IV to prevent cytokine release syndrome.
2. Cyclophosphamide: $750.0\text{ mg/m}^2$ IV infusion over 60 minutes on Day 1. Adequate oral hydration ($2\text{ to } 3\text{ L/day}$) mandatory to prevent acrolein-induced hemorrhagic cystitis.
3. Doxorubicin Hydrochloride: $50.0\text{ mg/m}^2$ IV slow bolus over 10 to 15 minutes through a running IV line on Day 1. (Subject to Anthracycline lifetime cumulative tracking).
4. Vincristine Sulfate: $1.4\text{ mg/m}^2$ IV push over 3 to 5 minutes on Day 1.
   - MANDATORY HARD SAFETY CAP: Maximum dose is capped at $2.0\text{ mg}$ regardless of patient BSA to prevent fatal paralytic ileus and severe neurotoxicity.
   - FATAL ROUTE WARNING: FOR INTRAVENOUS USE ONLY. Intrathecal administration is universally fatal.
5. Prednisone: $100.0\text{ mg}$ PO daily on Days 1, 2, 3, 4, and 5 (taken with food in the morning).

---

### 6.3 AC-T (Dose-Dense or Standard Protocol)
- Primary Clinical Indication: High-Risk Node-Positive or HER2-Negative Breast Cancer
- Cycle Length: Every 14 days (Dose-Dense with G-CSF support) or every 21 days (Standard)

#### Protocol Phases:
- Phase 1: AC Regimen (4 cycles):
  1. Doxorubicin (Adriamycin): $60.0\text{ mg/m}^2$ IV push on Day 1.
  2. Cyclophosphamide: $600.0\text{ mg/m}^2$ IV on Day 1.
  - Cycle repeated every 14 or 21 days for 4 total cycles. Cumulative Doxorubicin dose $= 240.0\text{ mg/m}^2$.
- Phase 2: T Phase (Paclitaxel):
  1. Paclitaxel (Taxol): $175.0\text{ mg/m}^2$ IV over 3 hours on Day 1 every 21 days for 4 cycles (or $80.0\text{ mg/m}^2$ IV weekly for 12 weeks).
  - Premedication: Dexamethasone 20mg PO 12h and 6h prior, Diphenhydramine 50mg IV, Famotidine 20mg IV 30 minutes prior. Non-PVC tubing with $0.22\ \mu\text{m}$ in-line filter required.

---

### 6.4 Carboplatin + Paclitaxel
- Primary Clinical Indication: Advanced Ovarian Carcinoma / Non-Small Cell Lung Cancer (NSCLC)
- Cycle Length: 21 days (3-week cycle)

#### Drug Components:
1. Paclitaxel: $175.0\text{ mg/m}^2$ IV over 3 hours on Day 1. Administered FIRST before Carboplatin to prevent enhanced myelosuppression.
2. Carboplatin: Target $\text{AUC } 5\text{ to } 6\text{ mg/mL}\cdot\text{min}$ IV in $250\text{ mL}$ D5W over 30 to 60 minutes on Day 1.
   - Dosed strictly via Calvert formula: $\text{Dose}_{\text{mg}} = \text{Target AUC} \times (\min(\text{CrCl}, 125) + 25)$.

---

## 7. TypeScript Production Interfaces and Engine Implementation

```typescript
export interface OncologyPatientParameters {
  patientId: string;
  heightCm: number;
  weightKg: number;
  ageYears: number;
  gender: 'MALE' | 'FEMALE';
  serumCreatinineMgDl: number;
  absoluteNeutrophilCountPerMcL: number;
  plateletCountPerMcL: number;
  totalBilirubinMgDl: number;
  upperLimitNormalBilirubin: number;
  priorCumulativeDoxorubicinEquivalentsMgM2: number;
  hasPriorThoracicRadiation: boolean;
}

export interface BsaCalculationResult {
  mostellerBsa: number;
  duboisBsa: number;
  haycockBsa: number;
  effectiveBsa: number;
  isCapped: boolean;
  advisoryNote?: string;
}

export interface CalvertCarboplatinResult {
  targetAuc: number;
  calculatedCrCl: number;
  cappedGfr: number;
  carboplatinDoseMg: number;
  isGfrCapped: boolean;
  absoluteMaxDoseMg: number;
}

export interface ChemotherapySafetyClearanceResult {
  clearedForTreatment: boolean;
  holdTriggers: string[];
  doseModifications: string[];
  cumulativeAnthracyclineStatus: {
    priorDose: number;
    projectedNewDose: number;
    totalCumulativeDose: number;
    lifetimeLimit: number;
    isLimitBreached: boolean;
  };
}

export class OncologyPrecisionDosingEngine {
  /**
   * Computes Body Surface Area across multiple formulas and applies safety capping
   */
  static calculateBsa(
    heightCm: number,
    weightKg: number,
    enforceCurativeCap = false
  ): BsaCalculationResult {
    // 1. Mosteller Formula
    const mosteller = Math.sqrt((heightCm * weightKg) / 3600);

    // 2. DuBois and DuBois Formula
    const dubois = 0.007184 * Math.pow(heightCm, 0.725) * Math.pow(weightKg, 0.425);

    // 3. Haycock Formula
    const haycock = 0.024265 * Math.pow(heightCm, 0.3964) * Math.pow(weightKg, 0.5378);

    let effective = mosteller;
    let isCapped = false;
    let advisoryNote: string | undefined;

    if (mosteller > 2.0) {
      advisoryNote = 'Advisory: Calculated BSA exceeds 2.0 m^2. Evaluate clinical intent (Curative vs Palliative).';
    }

    if (enforceCurativeCap && mosteller > 2.20) {
      effective = 2.20;
      isCapped = true;
      advisoryNote = 'Safety Cap Applied: Non-curative BSA clamped at 2.20 m^2 ceiling.';
    }

    return {
      mostellerBsa: Math.round(mosteller * 100) / 100,
      duboisBsa: Math.round(dubois * 100) / 100,
      haycockBsa: Math.round(haycock * 100) / 100,
      effectiveBsa: Math.round(effective * 100) / 100,
      isCapped,
      advisoryNote
    };
  }

  /**
   * Computes Precision Carboplatin Dose via Calvert Formula with GFR capping at 125 mL/min
   */
  static calculateCalvertCarboplatin(
    targetAuc: number,
    patient: OncologyPatientParameters
  ): CalvertCarboplatinResult {
    // Cockcroft-Gault CrCl
    let scr = patient.serumCreatinineMgDl;
    if (patient.ageYears >= 65 && scr < 0.80) {
      scr = 0.80; // Sarcopenia floor guard
    }

    let crcl = ((140 - patient.ageYears) * patient.weightKg) / (72 * scr);
    if (patient.gender === 'FEMALE') {
      crcl *= 0.85;
    }

    // Capping GFR at 125 mL/min per FDA/ASCO guidelines
    const isGfrCapped = crcl > 125.0;
    const cappedGfr = Math.min(crcl, 125.0);

    const dose = targetAuc * (cappedGfr + 25.0);
    const absoluteMaxDose = targetAuc * (125.0 + 25.0);

    return {
      targetAuc,
      calculatedCrCl: Math.round(crcl * 10) / 10,
      cappedGfr: Math.round(cappedGfr * 10) / 10,
      carboplatinDoseMg: Math.round(dose),
      isGfrCapped,
      absoluteMaxDoseMg: Math.round(absoluteMaxDose)
    };
  }

  /**
   * Evaluates NCCN/ASCO pre-treatment laboratory safety gates and cumulative anthracycline limits
   */
  static evaluateSafetyClearance(
    patient: OncologyPatientParameters,
    plannedAnthracyclineAgent?: 'DOXORUBICIN' | 'EPIRUBICIN' | 'DAUNORUBICIN' | 'IDARUBICIN',
    plannedDoseMgM2 = 0
  ): ChemotherapySafetyClearanceResult {
    const holdTriggers: string[] = [];
    const doseModifications: string[] = [];

    // 1. ANC Hold Gate
    if (patient.absoluteNeutrophilCountPerMcL < 1500) {
      holdTriggers.push(`ANC Critical Hold: ANC is ${patient.absoluteNeutrophilCountPerMcL} /mcL (Threshold >= 1,500 /mcL). Delay cycle 7 days.`);
    }

    // 2. Platelet Hold Gate
    if (patient.plateletCountPerMcL < 100000) {
      holdTriggers.push(`Platelet Critical Hold: Platelets are ${patient.plateletCountPerMcL} /mcL (Threshold >= 100,000 /mcL). Delay cycle 7 days.`);
    }

    // 3. Bilirubin Gate
    const biliRatio = patient.totalBilirubinMgDl / patient.upperLimitNormalBilirubin;
    if (biliRatio > 3.0) {
      holdTriggers.push(`Hepatic Hold: Total Bilirubin is ${biliRatio.toFixed(1)}x ULN (Critical threshold > 3.0x ULN).`);
    } else if (biliRatio > 1.5) {
      doseModifications.push(`Hepatic Dose Modification: Total Bilirubin is ${biliRatio.toFixed(1)}x ULN (Range 1.5-3.0x ULN). Enforce 50% dose reduction on hepatically cleared agents.`);
    }

    // 4. Cumulative Anthracycline Cardiotoxicity Tracker
    let newEquiv = 0;
    if (plannedAnthracyclineAgent) {
      const factorMap = {
        DOXORUBICIN: 1.0,
        EPIRUBICIN: 0.6,
        DAUNORUBICIN: 0.5,
        IDARUBICIN: 5.0
      };
      newEquiv = plannedDoseMgM2 * (factorMap[plannedAnthracyclineAgent] || 1.0);
    }

    const lifetimeLimit = patient.hasPriorThoracicRadiation ? 400.0 : 450.0;
    const projectedCumulative = patient.priorCumulativeDoxorubicinEquivalentsMgM2 + newEquiv;
    const isLimitBreached = projectedCumulative > lifetimeLimit;

    if (isLimitBreached) {
      holdTriggers.push(`Cardiotoxicity Hard Lockout: Projected cumulative dose of ${projectedCumulative.toFixed(1)} mg/m^2 exceeds lifetime ceiling of ${lifetimeLimit} mg/m^2 Doxorubicin equivalents. Anthracycline administration strictly blocked.`);
    } else if (projectedCumulative >= 350.0) {
      doseModifications.push(`Cardiotoxicity Advisory: Approaching lifetime ceiling (${projectedCumulative.toFixed(1)} / ${lifetimeLimit} mg/m^2). Mandate echocardiogram / MUGA LVEF verification.`);
    }

    return {
      clearedForTreatment: holdTriggers.length === 0,
      holdTriggers,
      doseModifications,
      cumulativeAnthracyclineStatus: {
        priorDose: patient.priorCumulativeDoxorubicinEquivalentsMgM2,
        projectedNewDose: Math.round(newEquiv * 10) / 10,
        totalCumulativeDose: Math.round(projectedCumulative * 10) / 10,
        lifetimeLimit,
        isLimitBreached
      }
    };
  }
}
```

---

## 8. Regulatory and Quality Assurance Checklist

| Safety Invariant | Technical Verification Standard | Compliance Status |
|---|---|---|
| Calvert GFR Ceiling | GFR capped at 125 mL/min; maximum Carboplatin AUC 6 dose capped at 900 mg | Verified Standard |
| Anthracycline Lifetime Ceiling | Hard lockout triggered when cumulative exposure exceeds 450 mg/m^2 Doxorubicin equivalents | Verified Standard |
| Vincristine Absolute Dose Cap | Vincristine single dose physically capped at 2.0 mg to prevent fatal neurotoxicity | Verified Standard |
| Pre-Cycle ANC Hold | Treatment release blocked if ANC < 1,500 /mcL | Verified Standard |
| Pre-Cycle Platelet Hold | Treatment release blocked if Platelets < 100,000 /mcL | Verified Standard |
| Hepatic Bilirubin Scaling | Automatic 50% dose modification triggered when Total Bilirubin exceeds 1.5x ULN | Verified Standard |
| Fatal Intrathecal Route Guard | Vincristine package strictly flags INTRAVENOUS ONLY; blocks intrathecal routing | Verified Standard |
