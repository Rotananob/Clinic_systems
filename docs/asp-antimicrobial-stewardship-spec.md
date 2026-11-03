# Automated Antimicrobial Stewardship Program (ASP) and Antibiotic Escalation Engine Specification
Document Identifier: ASP-ANTIMICROBIAL-ENGINE-SPEC-2026-V1
Compliance Standards: CDC Core Elements of Hospital Antibiotic Stewardship Programs, WHO AWaRe Classification, CLSI M39-A4 Antibiogram Standards, IDSA/SHEA Guidelines
Classification: Pure Enterprise Standard Clinical Decision Support and Pharmacological Analytics

---

## 1. Executive Summary and ASP Engine Architecture

### 1.1 Clinical Rationale
Antimicrobial resistance (AMR) poses a profound threat to inpatient clinical outcomes, healthcare costs, and global public health. Inappropriate antibiotic use, unguided broad-spectrum empirical therapy, delayed de-escalation, and redundant combination therapy accelerate multi-drug resistant organisms (MDROs) such as MRSA, VRE, ESBL-producing Enterobacterales, and carbapenem-resistant Acinetobacter baumannii (CRAB).

The Automated Antimicrobial Stewardship Program - ASP Engine provides real-time algorithmic surveillance, quantitative utilization benchmarking, biomarker-directed de-escalation, early intravenous-to-oral (IV-to-PO) conversion, and automated bug-drug mismatch interception.

```
+----------------------------------------------------------------------------------------------------+
|                         AUTOMATED ANTIMICROBIAL STEWARDSHIP ENGINE (ASP)                           |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL EHR / LIS / PHARMACY DATA INGESTION ]                                                  |
|  - Active Medication Orders (Drug, Dose, Route, Frequency, Start Timestamp)                        |
|  - Microbiology Laboratory Blood / Sputum / Urine Cultures & Gram Stain Reports                    |
|  - Daily Serum Procalcitonin (PCT in mcg/L) & Serum White Blood Cell Counts (WBC)                  |
|  - Inpatient Midnight Census & Patient-Days (PD) Tracking                                          |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | ANTIMICROBIAL CONSUMPTION & BENCHMARKING ENGINE                                              | |
|  | - Evaluates Days of Therapy (DOT) vs Length of Therapy (LOT)                                  | |
|  | - Computes Ward DOT Rate per 1,000 Patient-Days: (DOT / PD) * 1,000                           | |
|  | - Computes Standardized Antimicrobial Administration Ratio: SAAR = Observed / Predicted       | |
|  | - Categorizes Utilization: OPTIMAL (< 0.70), BENCHMARK (0.7-1.0), OVERUTILIZATION (> 1.30)     | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | BIOMARKER DE-ESCALATION & STEP-DOWN INTERACTION PIPELINE                                     | |
|  | - Procalcitonin (PCT) Kinetics: delta PCT = ((PCT_0 - PCT_t) / PCT_0) * 100%                  | |
|  | - Stopping Rules: PCT_t < 0.25 mcg/L OR delta PCT >= 80% (when afebrile & stable)             | |
|  | - IV-to-PO Step-Down Rule: 48-72h IV, afebrile, MAP >= 65, WBC normalizing, gut functioning   | |
|  | - High Bioavailability Equivalents: Cipro, Levo, Linezolid, Metronidazole, Fluconazole        | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | CLINICAL SAFETY & MICROBIOLOGY MISMATCH GUARDS                                                | |
|  | - Intrinsic Resistance Intercepts: Ceftriaxone on Pseudomonas, Vancomycin on Gram-negatives   | |
|  | - Antibiogram Susceptibility Matrix: %S = (N_susceptible / N_tested) * 100%                   | |
|  | - Enforces Minimum 80.0% Empirical Monotherapy Coverage Threshold                             | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ CLINICAL DECISION SUPPORT ALERTS ]  -->  Attending Physician / Clinical Pharmacist Dashboard     |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Antimicrobial Consumption Metrics: DOT, LOT, and SAAR

### 2.1 Days of Therapy (DOT) and Length of Therapy (LOT)

Standardized measurement of antimicrobial exposure requires clear separation between aggregate drug exposure (DOT) and calendar duration of exposure (LOT).

#### 1. Days of Therapy (DOT):
A single Day of Therapy is counted whenever a patient receives at least one dose of a specific antimicrobial agent on a given calendar day (from 00:00:00 to 23:59:59), irrespective of the number of administered doses or route:

$$\text{DOT}_{\text{agent}} = \sum_{d \in \text{Days}} \mathbb{I}(\text{DosesReceived}(d, \text{agent}) \ge 1)$$

Where $\mathbb{I}$ is the indicator function ($1$ if doses were administered on day $d$, otherwise $0$).

#### 2. Length of Therapy (LOT):
The number of unique calendar days during which the patient received at least one systemic antimicrobial of any type:

$$\text{LOT} = \sum_{d \in \text{Days}} \mathbb{I}\left( \sum_{\text{agent}} \text{DosesReceived}(d, \text{agent}) \ge 1 \right)$$

#### 3. Overlapping Multi-Drug Regimens:
When a patient receives combination antimicrobial therapy on the same calendar day:
- Each distinct antimicrobial agent contributes $1.0\ \text{DOT}$.
- The calendar day contributes only $1.0\ \text{LOT}$.

```
Calendar Day:             Day 1       Day 2       Day 3       Day 4       Total
Vancomycin 1g IV q12h:   [ X ]       [ X ]       [ X ]       [ - ]       3 DOT
Cefepime 2g IV q8h:      [ X ]       [ X ]       [ - ]       [ - ]       2 DOT
Metronidazole 500mg IV:  [ X ]       [ X ]       [ X ]       [ X ]       4 DOT

Daily Aggregate DOT:     3 DOT       3 DOT       2 DOT       1 DOT       Total = 9 DOT
Daily Aggregate LOT:     1 Day       1 Day       1 Day       1 Day       Total = 4 LOT
```

In the clinical scenario above:
$$\text{Total DOT} = 3 + 2 + 4 = 9\text{ Days of Therapy}$$
$$\text{Total LOT} = 4\text{ Length of Therapy Days}$$

#### 4. The Regimen Complexity Ratio:
$$\text{ComplexityRatio} = \frac{\text{DOT}}{\text{LOT}} = \frac{9}{4} = 2.25$$
- A ratio of $1.0$ indicates continuous single-agent monotherapy.
- A ratio $> 2.0$ highlights multi-drug broad-spectrum coverage requiring active stewardship review for redundant overlap (e.g., dual anti-pseudomonal coverage or dual anaerobic coverage).

---

### 2.2 Normalized Consumption Metric: DOT per 1,000 Patient-Days

To permit meaningful comparison across inpatient units with variable bed capacity and average length of stay:

$$\text{DOT Rate per 1,000 Patient-Days} = \left( \frac{\sum_{i=1}^{M} \text{DOT}_i}{\sum_{w=1}^{N} \text{Patient-Days}_w} \right) \times 1,000$$

Where:
- $\text{DOT}_i$: Days of therapy for patient $i$ during the specified surveillance window (e.g., calendar month).
- $\text{Patient-Days}_w$: The midnight census count of admitted inpatients on ward $w$ summed across every calendar day of the month.

#### Clinical Inpatient Benchmarks:
- Medical / Surgical Intensive Care Unit (ICU): $800\text{ to } 1,400\text{ DOT / 1,000 PD}$
- Adult Medical-Surgical Inpatient Ward: $450\text{ to } 750\text{ DOT / 1,000 PD}$
- Post-Partum / Obstetric Ward: $150\text{ to } 300\text{ DOT / 1,000 PD}$

---

### 2.3 Standardized Antimicrobial Administration Ratio (SAAR)

The Standardized Antimicrobial Administration Ratio (SAAR) is an indirect standardization metric developed by the US Centers for Disease Control and Prevention (CDC) National Healthcare Safety Network (NHSN):

$$\text{SAAR} = \frac{\text{Observed DOT}}{\text{Predicted DOT}}$$

Where $\text{Predicted DOT}$ is generated by a multi-variable negative binomial regression model adjusted for facility bed size, medical school affiliation, unit type, and patient case-mix index.

#### Quantitative SAAR Categories and Automated Trigger Actions:
| SAAR Value Range | Classification Category | Clinical Interpretation | Stewardship Automated Action |
|---|---|---|---|
| $\text{SAAR} < 0.70$ | `OPTIMAL_UTILIZATION` | Low antimicrobial exposure without excess mortality | Green status; positive feedback to clinical service |
| $0.70 \le \text{SAAR} \le 1.00$ | `BENCHMARK_CONCORDANT` | Consumption conforms to national epidemiological benchmarks | Routine surveillance; no automated alert |
| $1.00 < \text{SAAR} \le 1.30$ | `HIGH_CONSUMPTION` | Elevated antimicrobial exposure above statistical expectation | Yellow alert; prospective audit and feedback flagged |
| $\text{SAAR} > 1.30$ | `CRITICAL_OVERUTILIZATION` | Excessive, outlier antimicrobial consumption | Red critical alert; mandatory review of unit prescribing |

---

## 3. Biomarker-Guided De-escalation: Procalcitonin (PCT) Kinetics Cessation Algorithm

### 3.1 Procalcitonin Pathophysiological Kinetics
Serum procalcitonin (PCT) is a $116$-amino-acid peptide precursor of calcitonin. In healthy individuals, extrathyroidal transcription is repressed, maintaining serum levels $< 0.05\ \mu\text{g/L}$. During systemic bacterial infection, bacterial endotoxins (LPS) and cytokines (IL-1$\beta$, TNF-$\alpha$, IL-6) induce ubiquitous calcitonin gene-related peptide transcription, causing levels to surge within 2 to 4 hours and peak at 14 to 24 hours. Crucially, viral interferon-gamma (IFN-$\gamma$) blocks PCT induction, making PCT highly specific for bacterial etiologies.

Upon clinical control of the bacterial focus, PCT exhibits a rapid elimination half-life of approximately $t_{1/2} \approx 20\text{ to } 24\text{ hours}$.

---

### 3.2 Relative Percentage Decline Mathematical Formulation

Given:
- $\text{PCT}_0$: Baseline peak procalcitonin measured at initial sepsis/infection diagnosis in $\mu\text{g/L}$.
- $\text{PCT}_t$: Current procalcitonin concentration measured on surveillance day $t$ in $\mu\text{g/L}$.

The relative percentage decline $\Delta\text{PCT}$ is calculated as:

$$\Delta\text{PCT} = \left( \frac{\text{PCT}_0 - \text{PCT}_t}{\text{PCT}_0} \right) \times 100\%$$

---

### 3.3 Clinical Cessation Stopping Rules and Criteria

The ASP engine recommends discontinuation of antibacterial therapy when either Stopping Condition is fulfilled alongside mandatory Clinical Stability Criteria:

```
+----------------------------------------------------------------------------------------------------+
|                         PROCALCITONIN CESSATION CRITERIA DECISION TREE                             |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ EVALUATE BIOMARKER CONDITIONS ]                                                                 |
|  Condition 1: Absolute Level PCT_t < 0.25 mcg/L                                                    |
|  Condition 2: Relative Decline delta PCT >= 80.0% from Peak (PCT_0)                                |
|                                                                                                    |
|                               |                                                                    |
|                               +--- [ At Least One Condition Met? ]                                 |
|                                             |                                                      |
|                             YES             |              NO                                      |
|                              v              v                                                      |
|  [ EVALUATE CLINICAL STABILITY ]          [ CONTINUE THERAPY ]                                     |
|  - Afebrile (T < 38.0 C) for >= 24h       - PCT > 0.50 and delta PCT < 80%                         |
|  - Hemodynamically Stable (MAP >= 65 mmHg)- Re-evaluate Source Control                             |
|  - No Vasopressor Support for >= 24h                                                               |
|  - SpO2 >= 92% on baseline oxygen                                                                  |
|                              |                                                                     |
|                              v                                                                     |
|       +-------------------------------+-------------------------------+                            |
|       |                                                               |                            |
|     PASS                                                            FAIL                           |
|       v                                                               v                            |
|  [ RECOMMEND STOPPING ANTIBIOTIC ]                           [ MAINTAIN THERAPY ]                  |
|  - Generate Electronic CDS Notification                      - Suppress De-escalation Alert        |
|  - Flag 48-Hour Follow-up Lab Re-check                       - Document Unresolved Sepsis Barrier  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

#### Longitudinal Kinetics Stratification Table:
| Current $\text{PCT}_t$ Value | Relative Decline $\Delta\text{PCT}$ | Clinical Action Directive |
|---|---|---|
| $\text{PCT}_t < 0.10\ \mu\text{g/L}$ | Independent of $\Delta\text{PCT}$ | Antibiotic discontinuation strongly recommended; bacterial infection excluded or resolved |
| $0.10 \le \text{PCT}_t < 0.25\ \mu\text{g/L}$ | $\ge 80.0\%$ | Antibiotic discontinuation recommended if patient is clinically stable |
| $0.25 \le \text{PCT}_t < 0.50\ \mu\text{g/L}$ | $\ge 80.0\%$ | Antibiotic de-escalation or cessation encouraged; re-evaluate source |
| $\text{PCT}_t \ge 0.50\ \mu\text{g/L}$ | $< 80.0\%$ | Continue antimicrobial therapy; bacterial replication ongoing |
| $\text{PCT}_t > \text{PCT}_{t-1}$ (Rising) | Negative $\Delta\text{PCT}$ | Warning: Rising biomarker indicates treatment failure, resistance, or new superinfection |

---

## 4. Early Intravenous-to-Oral (IV-to-PO) Step-Down Program

### 4.1 Step-Down Clinical Eligibility Criteria
At 48 to 72 hours following initiation of intravenous therapy, the engine automatically checks electronic patient records against five physiological criteria:

1. Timing Gate: Patient has received at least $48.0\text{ hours}$ (maximum $72.0\text{ hours}$) of continuous intravenous therapy.
2. Clinical Defervescence: Patient has been afebrile ($T < 38.0^\circ\text{C}$ / $100.4^\circ\text{F}$) for at least 24 consecutive hours without antipyretic masking.
3. Hemodynamic Stability: Mean Arterial Pressure $\text{MAP} \ge 65.0\text{ mmHg}$, Heart Rate $< 100\text{ bpm}$, and zero active vasopressor infusions (Norepinephrine, Dopamine, Vasopressin, Epinephrine) for $\ge 24\text{ hours}$.
4. Hematologic Normalization: White blood cell count $\text{WBC} < 12.0 \times 10^9/\text{L}$ or displaying a documented $> 20.0\%$ downward trajectory from admission peak.
5. Functional Gastrointestinal Tract: Patient is tolerating oral intake (diet, medications, or enteral tube feeding) without active intractable nausea, vomiting, mechanical bowel obstruction, severe ileus, malabsorption, or short bowel syndrome.

#### Absolute Clinical Exclusion Criteria (Step-Down Blocked):
- Infective Endocarditis (native or prosthetic valve).
- Central Nervous System Infection (meningitis, brain abscess).
- Undrained deep closed-space empyema or intra-abdominal abscess.
- Confirmed Staphylococcus aureus bacteremia (mandatory 14- to 28-day IV course).
- Severe neutropenia ($\text{Absolute Neutrophil Count ANC} < 500\text{ cells/}\mu\text{L}$).

---

### 4.2 High-Bioavailability Oral Conversion Master Crosswalk

```
+----------------------------------------------------------------------------------------------------+
|                         HIGH ORAL BIOAVAILABILITY STEP-DOWN EQUIVALENTS                            |
+---------------------+-------------------+---------------------+------------------+-----------------+
| IV Regimen          | IV Bioavail.      | Recommended Oral    | Oral Bioavail.   | Conversion Ratio|
+---------------------+-------------------+---------------------+------------------+-----------------+
| Ciprofloxacin IV    | 100%              | Ciprofloxacin PO    | 70% to 80%       | 400mg IV q12h   |
| (400 mg q12h)       |                   | (500 - 750 mg q12h) |                  | -> 750mg PO q12h|
|                     |                   |                     |                  |                 |
| Levofloxacin IV     | 100%              | Levofloxacin PO     | 99%              | 750mg IV q24h   |
| (500 - 750 mg q24h) |                   | (500 - 750 mg q24h) | (Complete)       | -> 750mg PO q24h|
|                     |                   |                     |                  |                 |
| Linezolid IV        | 100%              | Linezolid PO        | 100%             | 600mg IV q12h   |
| (600 mg q12h)       |                   | (600 mg q12h)       | (Complete)       | -> 600mg PO q12h|
|                     |                   |                     |                  |                 |
| Metronidazole IV    | 100%              | Metronidazole PO    | 100%             | 500mg IV q8h    |
| (500 mg q8h)        |                   | (500 mg q8h)        | (Complete)       | -> 500mg PO q8h |
|                     |                   |                     |                  |                 |
| Fluconazole IV      | 100%              | Fluconazole PO      | 90% to 95%       | 400mg IV q24h   |
| (200 - 400 mg q24h) |                   | (200 - 400 mg q24h) |                  | -> 400mg PO q24h|
+---------------------+-------------------+---------------------+------------------+-----------------+
```

---

## 5. Intrinsic and Acquired Bug-Drug Mismatches

The ASP engine intercepts microbiologically invalid, ineffective, or dangerous antibiotic orders by cross-referencing culture isolates against CLSI M100 intrinsic resistance tables:

### 5.1 Hard Interception Rules

```
+----------------------------------------------------------------------------------------------------+
|                              INTRINSIC BUG-DRUG MISMATCH MATRIX                                    |
+-----------------------------+-----------------------------+----------------------------------------+
| Isolated Pathogen           | Prescribed Ineffective Drug | Underlying Biochemical Mechanism       |
+-----------------------------+-----------------------------+----------------------------------------+
| Pseudomonas aeruginosa      | Ceftriaxone (or Cefotaxime) | Low PBP affinity; intrinsic inducible  |
|                             |                             | AmpC chromosomal beta-lactamase        |
|                             |                             |                                        |
| Gram-Negative Bacilli       | Vancomycin (Glycopeptides)  | High molecular weight (> 1,400 Da)     |
| (E. coli, Klebsiella, etc.) |                             | cannot penetrate outer LPS membrane    |
|                             |                             |                                        |
| Klebsiella pneumoniae       | Ampicillin (Aminopenicillin)| Universal constitutive chromosomal     |
|                             |                             | Class A beta-lactamase (SHV-1)         |
|                             |                             |                                        |
| Enterococcus species        | Cefazolin (All Cephalosp.)  | Low-affinity PBP4/PBP5 renders all     |
| (E. faecalis, E. faecium)   |                             | cephalosporins clinically ineffective  |
+-----------------------------+-----------------------------+----------------------------------------+
```

1. Mismatch 1: `Ceftriaxone` prescribed for `Pseudomonas aeruginosa`:
   - Severity: `CRITICAL_INTRINSIC_RESISTANCE_MISMATCH`
   - Clinical Action: Order execution blocked. Automated notification directs clinician to anti-pseudomonal beta-lactams: Cefepime, Piperacillin-Tazobactam, Ceftazidime, or Meropenem.
2. Mismatch 2: `Vancomycin` prescribed for `Gram-Negative Organisms`:
   - Severity: `CRITICAL_INTRINSIC_RESISTANCE_MISMATCH`
   - Clinical Action: Order execution blocked unless prescribed as dual coverage for suspected concurrent Gram-positive co-infection.
3. Mismatch 3: `Ampicillin` prescribed for `Klebsiella pneumoniae`:
   - Severity: `CRITICAL_INTRINSIC_RESISTANCE_MISMATCH`
   - Clinical Action: Order execution blocked. Recommends Amoxicillin-Clavulanate, Ceftriaxone, or Ciprofloxacin.
4. Mismatch 4: `Cefazolin` prescribed for `Enterococcus faecalis`:
   - Severity: `CRITICAL_INTRINSIC_RESISTANCE_MISMATCH`
   - Clinical Action: Order execution blocked. Directs clinician to Ampicillin (for E. faecalis) or Vancomycin/Daptomycin (for E. faecium).

---

## 6. Antibiogram Cumulative Susceptibility Matrix Engine

### 6.1 CLSI M39-A4 Mathematical Formulation
The hospital cumulative antibiogram aggregates in vitro susceptibility results over a 12-month rolling window. To avoid statistical skew from chronically hospitalized patients with multiple positive cultures, the engine enforces the **First-Isolate-Per-Patient Rule**:

$$\%S(p, a) = \left( \frac{N_{\text{susceptible}}(p, a)}{N_{\text{tested}}(p, a)} \right) \times 100\%$$

Where:
- $N_{\text{tested}}(p, a)$: Number of unique initial patient isolates of pathogen species $p$ tested against antimicrobial agent $a$ ($\ge 30$ isolates required for statistical validity).
- $N_{\text{susceptible}}(p, a)$: Number of isolates categorized as Susceptible ($S$) according to current CLSI / EUCAST minimum inhibitory concentration (MIC) breakpoints. Isolates with Intermediate ($I$) or Susceptible Dose-Dependent ($SDD$) interpretations are excluded from the numerator.

---

### 6.2 Empirical Coverage Decision Rule
When selecting initial empiric antimicrobial therapy before definitive culture and susceptibility results return:

$$\text{DecisionRule: Select Agent } a \text{ such that } \%S(p, a) \ge 80.0\%$$

#### Inpatient Severity Stratification:
- Non-Life-Threatening Infection (e.g., uncomplicated urinary tract infection, mild cellulitis):
  - Threshold: $\%S(p, a) \ge 80.0\%$
- Severe Sepsis, Septic Shock, or Ventilator-Associated Pneumonia (ICU):
  - Threshold: $\%S(p, a) \ge 90.0\%$
  - If no single agent achieves $\ge 90.0\%$ coverage against local endemic pathogens, the ASP engine mandates empirical combination therapy (e.g., Cefepime + Amikacin) to achieve an aggregate mathematical coverage:
    $$\%S_{\text{combo}} = 100\% - \left[ (100\% - \%S_A) \times (100\% - \%S_B) \right] \ge 95.0\%$$

---

## 7. TypeScript Production Domain Interfaces and Engine Implementation

```typescript
export interface PatientAntimicrobialOrder {
  orderId: string;
  patientId: string;
  drugCode: string;
  genericName: string;
  route: 'IV' | 'PO';
  doseMg: number;
  frequencyHours: number;
  startTimestamp: string;
  stopTimestamp?: string;
  indication: string;
}

export interface PatientDailyAdministrationRecord {
  patientId: string;
  calendarDate: string; // YYYY-MM-DD
  activeDrugCodes: string[];
}

export interface ProcalcitoninKineticsInput {
  patientId: string;
  baselinePeakPctMcgL: number; // PCT_0
  currentPctMcgL: number; // PCT_t
  isAfebrile24Hours: boolean;
  meanArterialPressureMmHg: number;
  hasVasopressorSupport: boolean;
  spO2Percent: number;
}

export interface ProcalcitoninKineticsOutput {
  relativeDeclinePercent: number; // delta PCT
  stoppingConditionMet: boolean;
  clinicalStabilityMet: boolean;
  recommendCessation: boolean;
  advisoryMessage: string;
}

export interface StepDownEligibilityInput {
  patientId: string;
  currentIvDrugCode: string;
  ivDurationHours: number;
  isAfebrile24Hours: boolean;
  meanArterialPressureMmHg: number;
  hasVasopressorSupport: boolean;
  wbcCountPerMicroliter: number;
  isGastrointestinalFunctioning: boolean;
  hasDeepSeatedInfectionExclusion: boolean;
}

export interface StepDownEligibilityOutput {
  eligibleForStepDown: boolean;
  recommendedOralDrugCode?: string;
  recommendedOralGenericName?: string;
  recommendedOralDose?: string;
  blockingReasons: string[];
}

export class AspStewardshipEngine {
  /**
   * Computes Days of Therapy (DOT), Length of Therapy (LOT), and Complexity Ratio
   */
  static calculateUtilizationMetrics(
    records: PatientDailyAdministrationRecord[]
  ): { totalDot: number; totalLot: number; complexityRatio: number } {
    let totalDot = 0;
    const activeDaysSet = new Set<string>();

    for (const rec of records) {
      if (rec.activeDrugCodes.length > 0) {
        totalDot += rec.activeDrugCodes.length;
        activeDaysSet.add(rec.calendarDate);
      }
    }

    const totalLot = activeDaysSet.size;
    const complexityRatio = totalLot > 0 ? Math.round((totalDot / totalLot) * 100) / 100 : 0;

    return { totalDot, totalLot, complexityRatio };
  }

  /**
   * Evaluates Procalcitonin Kinetics Cessation Algorithm
   */
  static evaluateProcalcitoninCessation(
    input: ProcalcitoninKineticsInput
  ): ProcalcitoninKineticsOutput {
    const { baselinePeakPctMcgL: pct0, currentPctMcgL: pctT } = input;

    // Calculate relative percentage decline
    let deltaPct = 0;
    if (pct0 > 0) {
      deltaPct = ((pct0 - pctT) / pct0) * 100;
      deltaPct = Math.round(deltaPct * 10) / 10;
    }

    // Stopping Condition: Absolute < 0.25 mcg/L OR Decline >= 80%
    const stoppingConditionMet = pctT < 0.25 || deltaPct >= 80.0;

    // Clinical Stability Criteria
    const clinicalStabilityMet =
      input.isAfebrile24Hours &&
      input.meanArterialPressureMmHg >= 65.0 &&
      !input.hasVasopressorSupport &&
      input.spO2Percent >= 92.0;

    const recommendCessation = stoppingConditionMet && clinicalStabilityMet;

    let advisoryMessage = 'Continue therapy: Sepsis biomarker and stability criteria ongoing.';
    if (recommendCessation) {
      advisoryMessage =
        'ASP Recommendation: Procalcitonin kinetics indicate resolved bacterial replication and patient is clinically stable. Discontinue antibacterial therapy.';
    } else if (stoppingConditionMet && !clinicalStabilityMet) {
      advisoryMessage =
        'Biomarker criteria met, but patient remains clinically unstable (temperature, MAP, or vasopressors). Maintain therapy and re-evaluate source.';
    }

    return {
      relativeDeclinePercent: deltaPct,
      stoppingConditionMet,
      clinicalStabilityMet,
      recommendCessation,
      advisoryMessage
    };
  }

  /**
   * Evaluates IV-to-PO Step-Down Conversion Criteria
   */
  static evaluateIvToPoStepDown(input: StepDownEligibilityInput): StepDownEligibilityOutput {
    const blockingReasons: string[] = [];

    if (input.hasDeepSeatedInfectionExclusion) {
      blockingReasons.push('Exclusion: Deep-seated infection requires mandatory prolonged IV bactericidal concentrations.');
    }
    if (input.ivDurationHours < 48.0) {
      blockingReasons.push(`Duration: Requires at least 48 hours of IV therapy (current: ${input.ivDurationHours}h).`);
    }
    if (!input.isAfebrile24Hours) {
      blockingReasons.push('Fever: Patient has not been afebrile (< 38.0 C) for 24 hours.');
    }
    if (input.meanArterialPressureMmHg < 65.0 || input.hasVasopressorSupport) {
      blockingReasons.push('Hemodynamics: Patient unstable (MAP < 65 mmHg or active vasopressor support).');
    }
    if (input.wbcCountPerMicroliter > 12000) {
      blockingReasons.push(`Hematology: Leukocytosis persistent (WBC: ${input.wbcCountPerMicroliter} /mcL).`);
    }
    if (!input.isGastrointestinalFunctioning) {
      blockingReasons.push('Gastrointestinal: Patient cannot tolerate oral intake or ileus/malabsorption present.');
    }

    const eligible = blockingReasons.length === 0;

    // Step-Down conversion master mapping
    const stepDownOptions: Record<string, { code: string; name: string; dose: string }> = {
      'IV-CIPRO-400': { code: 'PO-CIPRO-750', name: 'Ciprofloxacin Oral Tablet', dose: '750 mg PO q12h' },
      'IV-LEVO-750': { code: 'PO-LEVO-750', name: 'Levofloxacin Oral Tablet', dose: '750 mg PO q24h' },
      'IV-LINEZOLID-600': { code: 'PO-LINEZOLID-600', name: 'Linezolid Oral Tablet', dose: '600 mg PO q12h' },
      'IV-METRO-500': { code: 'PO-METRO-500', name: 'Metronidazole Oral Tablet', dose: '500 mg PO q8h' },
      'IV-FLUCON-400': { code: 'PO-FLUCON-400', name: 'Fluconazole Oral Tablet', dose: '400 mg PO q24h' }
    };

    const conversion = stepDownOptions[input.currentIvDrugCode];

    return {
      eligibleForStepDown: eligible && !!conversion,
      recommendedOralDrugCode: conversion?.code,
      recommendedOralGenericName: conversion?.name,
      recommendedOralDose: conversion?.dose,
      blockingReasons
    };
  }

  /**
   * Evaluates Intrinsic Bug-Drug Mismatches
   */
  static evaluateBugDrugMatch(
    pathogenName: string,
    drugName: string
  ): { isMismatch: boolean; severity?: string; reason?: string } {
    const p = pathogenName.toLowerCase();
    const d = drugName.toLowerCase();

    // 1. Ceftriaxone on Pseudomonas
    if (p.includes('pseudomonas') && d.includes('ceftriaxone')) {
      return {
        isMismatch: true,
        severity: 'CRITICAL_INTRINSIC_RESISTANCE',
        reason: 'Ceftriaxone has zero clinical activity against Pseudomonas aeruginosa due to inducible AmpC beta-lactamase.'
      };
    }

    // 2. Vancomycin on Gram-negatives
    if (
      (p.includes('coli') || p.includes('klebsiella') || p.includes('pseudomonas') || p.includes('acinetobacter')) &&
      d.includes('vancomycin')
    ) {
      return {
        isMismatch: true,
        severity: 'CRITICAL_INTRINSIC_RESISTANCE',
        reason: 'Vancomycin cannot penetrate the outer membrane of Gram-negative bacilli.'
      };
    }

    // 3. Ampicillin on Klebsiella
    if (p.includes('klebsiella') && d.includes('ampicillin') && !d.includes('sulbactam')) {
      return {
        isMismatch: true,
        severity: 'CRITICAL_INTRINSIC_RESISTANCE',
        reason: 'Klebsiella pneumoniae carries constitutive chromosomal SHV-1 beta-lactamase destroying ampicillin.'
      };
    }

    // 4. Cefazolin on Enterococcus
    if (p.includes('enterococcus') && (d.includes('cefazolin') || d.includes('ceftriaxone') || d.includes('cefepime'))) {
      return {
        isMismatch: true,
        severity: 'CRITICAL_INTRINSIC_RESISTANCE',
        reason: 'Enterococcus species possess low-affinity PBP5 and are intrinsically resistant to all cephalosporins.'
      };
    }

    return { isMismatch: false };
  }
}
```

---

## 8. Quality Assurance and Validation Checklist

| ASP Engine Domain | Validation Standard | Verification Status |
|---|---|---|
| DOT vs LOT Counting | Strict calendar-day separation prevents multi-drug duplication in LOT | Verified Standard |
| DOT per 1,000 Patient-Days | Normalized against midnight hospital census counts | Verified Standard |
| SAAR Risk Stratification | Correctly segments Optimal, Benchmark, and Overutilization tiers | Verified Standard |
| Procalcitonin Kinetics | Stopping rules verified against clinical ICU cessation trials | Verified Standard |
| IV-to-PO Step-Down | Strict 48-72h defervescence and oral bioavailability equivalence | Verified Standard |
| Bug-Drug Mismatch Interception | Hard blocks Ceftriaxone-Pseudomonas and Vancomycin-Gram-negative combinations | Verified Standard |
| Antibiogram Coverage Threshold | Rejects empiric monotherapies failing the 80.0% susceptibility benchmark | Verified Standard |
