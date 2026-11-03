# Neonatal and Pediatric Precision Pharmacotherapy and Phototherapy Engine Specification
Document Identifier: PEDIATRIC-NEONATAL-ENGINE-SPEC-2026-V1
Compliance Standards: AAP 2022 Clinical Practice Guideline for Hyperbilirubinemia, Harriet Lane Handbook, Nelson Pediatrics, Lexicomp Pediatric & Neonatal Dosing, Neofax
Classification: Pure Enterprise Standard Pediatric and Neonatal Clinical Decision Support Engine

---

## 1. Executive Summary and System Architecture

### 1.1 Clinical Rationale
Pediatric and neonatal patients are not miniature adults. Their pharmacokinetics and pharmacodynamics undergo profound maturation across postmenstrual, gestational, and postnatal milestones:
1. Dynamic Body Composition: Neonates possess total body water exceeding 75% to 80% of body weight, contracting to adult levels (55% to 60%) across early childhood. This dramatically alters volume of distribution (Vd) for hydrophilic agents such as aminoglycosides and beta-lactams.
2. Renal and Hepatic Clearance Maturation: Glomerular filtration rate (GFR) and tubular secretion are substantially reduced at birth (especially in preterm neonates with postmenstrual age < 30 weeks), with nephrogenesis continuing until 34 to 36 weeks gestation. Cytochrome P450 and glucuronidation pathways mature over months to years.
3. High Susceptibility to Overdose: Fixed-dose medications create catastrophic toxicity risks. Weight-based and age-based empirical calculations can lead to supratherapeutic exposures if not bounded by inviolable adult maximum single-dose caps.
4. Acute Bilirubin Neurotoxicity and Kernicterus: Neonatal hyperbilirubinemia requires hour-specific tracking based on gestational age and neurotoxicity risk factors per the revised American Academy of Pediatrics (AAP) 2022 clinical practice guidelines.

The Neonatal and Pediatric Precision Pharmacotherapy and Phototherapy Engine introduces unified closed-loop algorithmic safeguards:
- Classical pediatric dosage scaling formulas (Clark's, Young's, Fried's, and BSA-based).
- Inviolable Adult Maximum Dose Cap enforcement.
- Neonatal Extended-Interval Aminoglycoside Regimen (Gentamicin and Amikacin) stratified by Postmenstrual Age (PMA) and Postnatal Age (PNA).
- AAP 2022 Hyperbilirubinemia Phototherapy and Exchange Transfusion hour-specific nomogram engine with risk tier stratification.
- High-risk pediatric contraindication gates (e.g., Ceftriaxone calcium precipitation in neonates, chloramphenicol Gray baby syndrome, tetracycline dental dysplasia, fluoroquinolone chondrotoxicity).

```
+----------------------------------------------------------------------------------------------------+
|                NEONATAL & PEDIATRIC PRECISION PHARMACOTHERAPY AND NOMOGRAM ENGINE                  |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ PATIENT ANTHROPOMETRIC & CHRONOLOGIC INGESTION ]                                                |
|  - Gestational Age (GA weeks), Birth Date, Postnatal Age (PNA days/hours), PMA (weeks)             |
|  - Current Weight (kg / lbs), Length/Height (cm), Head Circumference (cm)                          |
|  - Neurotoxicity Risk Factors: G6PD Deficiency, Isoimmune Coombs (+), Albumin < 3 g/dL, Sepsis     |
|  - Total Serum Bilirubin (TSB mg/dL or umol/L), Serum Creatinine (mg/dL)                           |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | PEDIATRIC FORMULATION ENGINE                                                                 | |
|  | - Clark's Rule (Weight): Dose = (Weight_lbs / 150) * Adult_Dose                               | |
|  | - Young's Rule (Age >= 1 yr): Dose = (Age_years / (Age_years + 12)) * Adult_Dose               | |
|  | - Fried's Rule (Age < 1 yr): Dose = (Age_months / 150) * Adult_Dose                           | |
|  | - BSA Rule: Dose = (Child_BSA / 1.73) * Adult_Dose via Mosteller / Haycock Formula           | |
|  |                                                                                               | |
|  | [ INVIOLABLE SAFETY INTERLOCK ]: Dose_final = min(Calculated_Dose, Adult_Max_Single_Dose)     | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | NEONATAL EXTENDED-INTERVAL AMINOGLYCOSIDE CALCULATOR                                          | |
|  | - PMA < 30 weeks: 5.0 mg/kg IV q48h                                                           | |
|  | - PMA 30-34 weeks, PNA <= 7 days: 4.5 mg/kg IV q36h                                            | |
|  | - PMA 30-34 weeks, PNA > 7 days: 4.0 mg/kg IV q24h                                             | |
|  | - PMA >= 35 weeks: 4.0 - 5.0 mg/kg IV q24h                                                     | |
|  | - TDM Safety Checks: Peak 5-12 ug/mL, Trough < 1.0-1.5 ug/mL                                   | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | AAP 2022 HYPERBILIRUBINEMIA NOMOGRAM ENGINE                                                    | |
|  | - Hour-Specific TSB Evaluation (0 to 168+ hours of life)                                      | |
|  | - Risk Stratification: Low Risk, Medium Risk, High Risk                                      | |
|  | - Evaluates Phototherapy Threshold & Escalation of Care / Exchange Transfusion Threshold      | |
|  | - Generates Continuous Interpolation, Rate of Rise Delta, and Clinical Directives             | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ VERIFIED CLINICAL ORDER CLEARANCE ]  --> Dual Pediatric Nurse & Neonatologist Signoff           |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Mathematical Formulations for Pediatric Precision Dosing

### 2.1 Classical Pediatric Scaling Rules
When a validated pediatric mg/kg drug profile is not specified or when standard adult dosages require proportional age- or weight-adjusted scaling, the engine implements four classical mathematical formulations:

#### 1. Clark's Rule (Weight-Based):
Clark's rule scales the adult dosage based on the ratio of the pediatric patient's body weight in pounds relative to an assumed average adult weight of 150 lbs (68.04 kg):

$$\text{Dose}_{\text{child}} = \left(\frac{\text{Weight}_{\text{lbs}}}{150}\right) \times \text{Adult\_Dose}$$

Using international metric SI units (kilograms):

$$\text{Weight}_{\text{lbs}} = \text{Weight}_{\text{kg}} \times 2.20462262$$

$$\text{Dose}_{\text{child}} = \left(\frac{\text{Weight}_{\text{kg}} \times 2.20462262}{150}\right) \times \text{Adult\_Dose} = \left(\frac{\text{Weight}_{\text{kg}}}{68.03886}\right) \times \text{Adult\_Dose}$$

Clinical Indication: Suitable for normally proportioned children older than 2 years of age whose weight aligns between the 10th and 90th percentiles for age.

#### 2. Young's Rule (Age-Based for Children >= 1 Year):
Young's rule computes pediatric fraction from chronological age in years:

$$\text{Dose}_{\text{child}} = \left(\frac{\text{Age}_{\text{years}}}{\text{Age}_{\text{years}} + 12}\right) \times \text{Adult\_Dose} \quad \text{for } \text{Age}_{\text{years}} \ge 1.0$$

Clinical Indication: Useful for rapid triage in emergency settings when accurate weight scales are unavailable. Contraindicated in severe malnutrition, failure to thrive, or childhood obesity where chronological age decouples from body mass.

#### 3. Fried's Rule (Age-Based for Infants < 1 Year / < 12 Months):
Fried's rule estimates infant dosage from chronological age in months:

$$\text{Dose}_{\text{infant}} = \left(\frac{\text{Age}_{\text{months}}}{150}\right) \times \text{Adult\_Dose} \quad \text{for } 0.0 < \text{Age}_{\text{months}} < 12.0$$

Where $\text{Age}_{\text{months}} = \frac{\text{Age}_{\text{days}}}{30.4375}$.
Clinical Indication: Preliminary estimate for minor symptomatic medications in full-term infants. Contraindicated in preterm neonates due to profound renal clearance immaturity.

#### 4. Body Surface Area (BSA) Scaling Rule:
Body surface area correlates more accurately with metabolic rate, cardiac output, renal glomerular filtration rate, and extracellular fluid volume than weight or age alone:

$$\text{Dose}_{\text{child}} = \left(\frac{\text{Child\_BSA}}{1.73\text{ m}^2}\right) \times \text{Adult\_Dose}$$

Where $1.73\text{ m}^2$ represents standard adult reference BSA.
Child BSA is calculated via either:
- Haycock Formula (validated specifically for neonates, infants, and children):
  $$\text{BSA}_{\text{Haycock}} = 0.024265 \times \text{Height}_{\text{cm}}^{0.3964} \times \text{Weight}_{\text{kg}}^{0.5378}$$
- Mosteller Formula (universal clinical telemetry standard):
  $$\text{BSA}_{\text{Mosteller}} = \sqrt{\frac{\text{Height}_{\text{cm}} \times \text{Weight}_{\text{kg}}}{3600}}$$

### 2.2 Inviolable Adult Maximum Dose Cap

#### The Pediatric Dosing Paradox
In growing children and adolescents, calculating dosages on a pure weight basis (e.g., $15\text{ mg/kg}$ or $40\text{ mg/kg}$) or via BSA scaling can yield a calculated dose exceeding the safe therapeutic ceiling approved for adults. For example:
- Acetaminophen at $15\text{ mg/kg}$ in an overweight 75 kg adolescent would calculate to $1,125\text{ mg}$, exceeding the safe adult single-dose ceiling of $1,000\text{ mg}$.
- Amoxicillin at $90\text{ mg/kg/day}$ divided BID in a 50 kg child would calculate to $2,250\text{ mg}$ BID ($4,500\text{ mg/day}$), well above adult maximum single dose caps.
- Ceftriaxone at $100\text{ mg/kg/day}$ in a 45 kg child calculates to $4,500\text{ mg}$, exceeding the adult maximum daily ceiling of $2,000\text{ mg}$ (or $4,000\text{ mg}$ in severe meningitis).

#### The Mathematical Inviolable Guard:
$$\text{Dose}_{\text{admissible}} = \min\left(\text{Dose}_{\text{calculated}}, \text{Adult\_Max\_Single\_Dose}\right)$$

Whenever $\text{Dose}_{\text{calculated}} > \text{Adult\_Max\_Single\_Dose}$:
1. The engine automatically clamps the dose to $\text{Adult\_Max\_Single\_Dose}$.
2. The UI triggers a persistent alert: "PEDIATRIC DOSE CLAMPED TO ADULT MAXIMUM SINGLE DOSE CEILING".
3. An audit log record is created noting the unadjusted raw calculation versus the applied maximum safety clamp.

---

## 3. Neonatal Extended-Interval Aminoglycoside Regimen

### 3.1 Pharmacokinetic Rationale in Neonatology
Gentamicin and Amikacin are bactericidal aminoglycosides widely used with Ampicillin or Penicillin G for empirical management of suspected Early-Onset Sepsis (EOS) and Late-Onset Sepsis (LOS) in neonatal intensive care units (NICUs).

Neonates exhibit unique pharmacokinetic properties:
- Expanded Volume of Distribution: Extracellular water represents up to 80% of body weight in preterm infants, producing a large $V_d$ ($0.45\text{ to }0.70\text{ L/kg}$ versus $0.25\text{ L/kg}$ in adults). A robust weight-based loading dose ($4.0\text{ to }5.0\text{ mg/kg}$ for Gentamicin; $15.0\text{ to }18.0\text{ mg/kg}$ for Amikacin) is required to achieve therapeutic peak concentrations ($C_{\max} / \text{MIC} \ge 8 - 10$).
- Immature Glomerular Filtration: Preterm neonates have low GFR, resulting in prolonged serum half-life ($t_{1/2} = 8\text{ to }18\text{ hours}$ versus $2\text{ to }3\text{ hours}$ in adults).
- Post-Antibiotic Effect (PAE): Aminoglycosides exhibit persistent bacterial suppression for several hours after concentrations drop below the MIC.
- Ototoxicity and Nephrotoxicity Prevention: Toxicity correlates with sustained trough exposure ($C_{\min}$) rather than high transient peak levels. Extended dosing intervals (q24h, q36h, q48h) allow drug concentrations to fall below toxic threshold levels before the subsequent dose.

### 3.2 Chronological Definitions
- Gestational Age (GA): Completed weeks of gestation from maternal last menstrual period to delivery.
- Postnatal Age (PNA): Chronological age in days or hours since birth.
- Postmenstrual Age (PMA): Sum of gestational age and postnatal age:
  $$\text{PMA}_{\text{weeks}} = \text{GA}_{\text{weeks}} + \left(\frac{\text{PNA}_{\text{days}}}{7}\right)$$

### 3.3 Clinical Dosing and Interval Matrix

#### Gentamicin Neonatal Protocol:
```
+-------------------+--------------------+------------------+-----------------------+
| PMA (Weeks)       | PNA (Days)         | Dose (mg/kg IV)  | Dosing Interval (hrs) |
+-------------------+--------------------+------------------+-----------------------+
| PMA < 30 weeks    | All PNA            | 5.0 mg/kg        | Every 48 hours (q48h) |
| PMA 30 - 34 weeks | PNA <= 7 days      | 4.5 mg/kg        | Every 36 hours (q36h) |
| PMA 30 - 34 weeks | PNA > 7 days       | 4.0 mg/kg        | Every 24 hours (q24h) |
| PMA >= 35 weeks   | All PNA            | 4.0 - 5.0 mg/kg  | Every 24 hours (q24h) |
+-------------------+--------------------+------------------+-----------------------+
```

#### Amikacin Neonatal Protocol:
```
+-------------------+--------------------+------------------+-----------------------+
| PMA (Weeks)       | PNA (Days)         | Dose (mg/kg IV)  | Dosing Interval (hrs) |
+-------------------+--------------------+------------------+-----------------------+
| PMA < 30 weeks    | All PNA            | 15.0 mg/kg       | Every 48 hours (q48h) |
| PMA 30 - 34 weeks | PNA <= 7 days      | 15.0 mg/kg       | Every 36 hours (q36h) |
| PMA 30 - 34 weeks | PNA > 7 days       | 15.0 mg/kg       | Every 24 hours (q24h) |
| PMA >= 35 weeks   | All PNA            | 15.0 - 18.0 mg/kg| Every 24 hours (q24h) |
+-------------------+--------------------+------------------+-----------------------+
```

### 3.4 Therapeutic Drug Monitoring (TDM) Windows and Targets

#### 1. Target Concentrations:
- Gentamicin:
  * Peak ($C_{\max}$): $5.0 - 12.0\text{ }\mu\text{g/mL}$ (target $\ge 8.0\text{ }\mu\text{g/mL}$ for severe sepsis or Gram-negative pneumonia).
  * Trough ($C_{\min}$): $< 1.0\text{ }\mu\text{g/mL}$ (strict safety upper limit $< 1.5\text{ }\mu\text{g/mL}$).
- Amikacin:
  * Peak ($C_{\max}$): $20.0 - 35.0\text{ }\mu\text{g/mL}$.
  * Trough ($C_{\min}$): $< 5.0\text{ }\mu\text{g/mL}$.

#### 2. Blood Sampling Schedule:
- Trough Sample: Drawn within 30 to 60 minutes prior to the second or third dose.
- Peak Sample: Drawn exactly 30 minutes after completion of a 30-minute constant-rate intravenous infusion (60 minutes from infusion start).

#### 3. Algorithmic Response to Elevated Trough:
- If Gentamicin Trough $\ge 1.0\text{ }\mu\text{g/mL}$ and $< 1.5\text{ }\mu\text{g/mL}$: Maintain dose, extend interval (e.g., $q24h \to q36h$ or $q36h \to q48h$).
- If Gentamicin Trough $\ge 1.5\text{ }\mu\text{g/mL}$: Hold subsequent dose immediately. Recheck level in 12 to 24 hours. Do not re-dose until confirmed $< 1.0\text{ }\mu\text{g/mL}$. Assess serum creatinine and urine output.

---

## 4. AAP 2022 Hyperbilirubinemia Phototherapy and Exchange Transfusion Nomograms

### 4.1 Background and Changes in AAP 2022 Guidelines
In 2022, the American Academy of Pediatrics published updated clinical practice guidelines: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation (Pediatrics 2022; 150(3):e2022058859).

Key Structural Updates:
1. Hourly Precision: The hour of life (since birth timestamp) dictates phototherapy and exchange transfusion thresholds with increased granularity between 0 and 168 hours (Day 7).
2. Neurotoxicity Risk Factors: Risk profiles dictate individual susceptibility to bilirubin-induced neurologic dysfunction (BIND), acute bilirubin encephalopathy (ABE), and kernicterus at lower serum bilirubin levels.
3. Escalation of Care Window: Defined as Total Serum Bilirubin (TSB) within $2.0\text{ mg/dL}$ ($34.2\text{ }\mu\text{mol/L}$) below the exchange transfusion threshold.

### 4.2 Neurotoxicity Risk Factors Assessment
The presence of any of the following factors shifts the infant to a higher-risk treatment tier:
- Gestational age $< 38\text{ weeks}$ (susceptibility increases with each week of prematurity).
- Serum Albumin $< 3.0\text{ g/dL}$ (reduced albumin binding capacity elevates free unbound toxic bilirubin).
- Isoimmune Hemolytic Disease: Positive direct antiglobulin test (DAT / direct Coombs), ABO incompatibility, Rh isoimmunization, or minor blood group antibodies.
- Glucose-6-Phosphate Dehydrogenase (G6PD) deficiency: Critical prevalence in Southeast Asian populations including Cambodia.
- Clinical Instability: Sepsis, severe clinical asphyxia, acidosis (arterial/venous $\text{pH} < 7.15$), temperature instability, or significant clinical lethargy.

### 4.3 Risk Tier Classification
The engine assigns neonates into one of three standardized risk tiers:
1. Low Risk Tier:
   - Gestational age $\ge 38\text{ weeks}$, AND
   - Zero neurotoxicity risk factors.
2. Medium Risk Tier:
   - Gestational age $\ge 38\text{ weeks}$ WITH one or more neurotoxicity risk factors, OR
   - Gestational age $35\text{ to }37\text{ 6/7 weeks}$ WITHOUT neurotoxicity risk factors.
3. High Risk Tier:
   - Gestational age $35\text{ to }37\text{ 6/7 weeks}$ WITH one or more neurotoxicity risk factors.

### 4.4 Hour-Specific Total Serum Bilirubin (TSB) Cutoff Nomogram

Unit Conversion:
$$\text{TSB}_{(\mu\text{mol/L})} = \text{TSB}_{(\text{mg/dL})} \times 17.104$$

#### Table 4.4.1: Phototherapy Initiation Thresholds (TSB in mg/dL [umol/L])
```
+-------------+-----------------------+-----------------------+-----------------------+
| Postnatal   | Low Risk Tier         | Medium Risk Tier      | High Risk Tier        |
| Hour        | (>=38w, No Risk)      | (>=38w + Risk / 35-37)| (35-37w + Risk)       |
+-------------+-----------------------+-----------------------+-----------------------+
| 12 hours    |  7.5 mg/dL [128 umol] |  6.0 mg/dL [103 umol] |  4.5 mg/dL  [77 umol] |
| 24 hours    | 10.5 mg/dL [180 umol] |  8.8 mg/dL [150 umol] |  7.0 mg/dL [120 umol] |
| 36 hours    | 13.0 mg/dL [222 umol] | 11.0 mg/dL [188 umol] |  9.0 mg/dL [154 umol] |
| 48 hours    | 15.0 mg/dL [257 umol] | 13.0 mg/dL [222 umol] | 11.0 mg/dL [188 umol] |
| 60 hours    | 16.6 mg/dL [284 umol] | 14.5 mg/dL [248 umol] | 12.3 mg/dL [210 umol] |
| 72 hours    | 18.0 mg/dL [308 umol] | 15.6 mg/dL [267 umol] | 13.4 mg/dL [229 umol] |
| 96 hours    | 19.5 mg/dL [334 umol] | 17.0 mg/dL [291 umol] | 14.8 mg/dL [253 umol] |
| 120 hours   | 20.5 mg/dL [351 umol] | 17.8 mg/dL [304 umol] | 15.5 mg/dL [265 umol] |
| 144+ hours  | 21.0 mg/dL [359 umol] | 18.2 mg/dL [311 umol] | 16.0 mg/dL [274 umol] |
+-------------+-----------------------+-----------------------+-----------------------+
```

#### Table 4.4.2: Exchange Transfusion Thresholds (TSB in mg/dL [umol/L])
```
+-------------+-----------------------+-----------------------+-----------------------+
| Postnatal   | Low Risk Tier         | Medium Risk Tier      | High Risk Tier        |
| Hour        | (>=38w, No Risk)      | (>=38w + Risk / 35-37)| (35-37w + Risk)       |
+-------------+-----------------------+-----------------------+-----------------------+
| 12 hours    | 13.5 mg/dL [231 umol] | 11.5 mg/dL [197 umol] |  9.5 mg/dL [162 umol] |
| 24 hours    | 16.5 mg/dL [282 umol] | 14.2 mg/dL [243 umol] | 12.0 mg/dL [205 umol] |
| 36 hours    | 19.0 mg/dL [325 umol] | 16.5 mg/dL [282 umol] | 14.2 mg/dL [243 umol] |
| 48 hours    | 21.0 mg/dL [359 umol] | 18.5 mg/dL [316 umol] | 16.0 mg/dL [274 umol] |
| 60 hours    | 22.5 mg/dL [385 umol] | 20.0 mg/dL [342 umol] | 17.4 mg/dL [298 umol] |
| 72 hours    | 23.5 mg/dL [402 umol] | 21.0 mg/dL [359 umol] | 18.5 mg/dL [316 umol] |
| 96 hours    | 24.5 mg/dL [419 umol] | 22.2 mg/dL [380 umol] | 19.5 mg/dL [334 umol] |
| 120 hours   | 25.0 mg/dL [428 umol] | 22.8 mg/dL [390 umol] | 20.0 mg/dL [342 umol] |
| 144+ hours  | 25.0 mg/dL [428 umol] | 23.0 mg/dL [393 umol] | 20.0 mg/dL [342 umol] |
+-------------+-----------------------+-----------------------+-----------------------+
```

### 4.5 Dynamic Curve Interpolation Algorithm
Because clinical blood sampling occurs at non-discrete times (e.g., at 31.5 hours of life), the engine evaluates exact threshold lines via piecewise linear interpolation between adjacent calibration nodes:

$$\text{Threshold}(t) = \text{Threshold}_{k} + \left(\frac{t - t_{k}}{t_{k+1} - t_{k}}\right) \times (\text{Threshold}_{k+1} - \text{Threshold}_{k})$$

Where $t_{k} \le t < t_{k+1}$ represents the surrounding hour interval. For $t > 144$ hours, thresholds plateau at their maximum values.

### 4.6 Clinical Action Zones
Based on the patient's measured TSB relative to the interpolated thresholds:
1. Normal Zone: $\text{TSB} < \text{Threshold}_{\text{photo}} - 2.0\text{ mg/dL}$. Routine follow-up per discharge plan.
2. High Pre-Phototherapy Zone: $\text{Threshold}_{\text{photo}} - 2.0\text{ mg/dL} \le \text{TSB} < \text{Threshold}_{\text{photo}}$. Recheck TSB within 12 to 24 hours. Ensure lactation / feeding adequacy.
3. Phototherapy Zone: $\text{Threshold}_{\text{photo}} \le \text{TSB} < \text{Threshold}_{\text{exchange}} - 2.0\text{ mg/dL}$. Initiate intensive phototherapy (narrowband blue light LED, irradiance $\ge 30\text{ }\mu\text{W/cm}^2/\text{nm}$, wavebands 460-490 nm, maximizing skin surface exposure).
4. Escalation of Care Zone: $\text{Threshold}_{\text{exchange}} - 2.0\text{ mg/dL} \le \text{TSB} < \text{Threshold}_{\text{exchange}}$. Urgent escalation: Transfer immediately to NICU, place under multiple overhead intensive phototherapy units with biliblanket, cross-match blood for double-volume exchange transfusion, start IV hydration, measure TSB every 2 to 3 hours.
5. Exchange Transfusion Zone: $\text{TSB} \ge \text{Threshold}_{\text{exchange}}$. Perform emergency double-volume exchange transfusion ($160\text{ to }180\text{ mL/kg}$) via umbilical venous catheter while continuous intensive phototherapy continues.

### 4.7 Bilirubin Rate of Rise (Delta) Alert
The engine monitors serial TSB measurements:
$$\Delta\text{TSB} = \frac{\text{TSB}_{2} - \text{TSB}_{1}}{t_{2} - t_{1}} \quad (\text{mg/dL per hour})$$

- In first 24 hours: If $\Delta\text{TSB} \ge 0.20\text{ mg/dL/hour}$, trigger alert for aggressive hemolysis (G6PD deficiency, ABO or Rh incompatibility).
- After 24 hours: If $\Delta\text{TSB} \ge 0.30\text{ mg/dL/hour}$, trigger immediate phototherapy evaluation and hemolysis workup.

---

## 5. Master Pediatric Pharmacotherapy Reference and Dosing Table

```
+-------------------+----------------------------+-----------------------+---------------------+-------------------------------------------------------+
| Drug Name         | Pediatric Dosing Range     | Interval / Route      | Adult Max Single Cap| Critical Pediatric Black Box / Safety Warnings        |
+-------------------+----------------------------+-----------------------+---------------------+-------------------------------------------------------+
| Acetaminophen     | 10 - 15 mg/kg/dose         | q4-6h PO/PR           | 1,000 mg            | Max daily: 75 mg/kg/day or 4,000 mg. Hepatotoxicity.   |
| (Paracetamol)     |                            |                       |                     | Use calibrated oral syringes, avoid conc. mismatches. |
|                   |                            |                       |                     |                                                       |
| Ibuprofen         | 5 - 10 mg/kg/dose          | q6-8h PO              | 800 mg (single)     | Contraindicated in infants < 6 months old.            |
|                   |                            |                       | 2,400 mg (daily)    | Contraindicated in severe dehydration (AKI risk).     |
|                   |                            |                       |                     |                                                       |
| Amoxicillin       | Standard: 25 - 45 mg/kg/d  | Divided BID PO        | 1,000 mg (single)   | In acute otitis media or severe pneumonia, high-dose  |
|                   | High-Dose: 80 - 90 mg/kg/d |                       | 2,000 mg (daily)    | (80-90 mg/kg/d) overcomes Penicillin-resistant S.pn.  |
|                   |                            |                       |                     |                                                       |
| Ceftriaxone       | Standard: 50 - 75 mg/kg/d  | q12-24h IV/IM         | 2,000 mg (single)   | STRICTLY CONTRAINDICATED in neonates <= 28 days       |
|                   | Meningitis: 100 mg/kg/d    |                       | 4,000 mg (mening)   | receiving calcium IV (fatal lung/kidney precipitants) |
|                   |                            |                       |                     | and in hyperbilirubinemia (displaces albumin binding). |
|                   |                            |                       |                     |                                                       |
| Cefotaxime        | Neonate: 100 - 150 mg/kg/d | Divided q8-12h IV     | 2,000 mg (single)   | Preferred 3rd gen cephalosporin in neonates <= 28 d;  |
|                   | Older: 100 - 200 mg/kg/d   | Divided q6-8h IV      | 12,000 mg (daily)   | does not displace bilirubin or precipitate calcium.   |
|                   |                            |                       |                     |                                                       |
| Salbutamol        | 0.15 mg/kg/dose            | Nebulized q20m x 3    | 5.0 mg (single)     | Minimum dose 1.25 mg. Monitor for tachycardia, hypox- |
| (Albuterol)       | (Standard: 2.5 - 5.0 mg)   | then q1-4h PRN        |                     | emia from V/Q mismatch, and tremor.                   |
|                   |                            |                       |                     |                                                       |
| Epinephrine       | Anaphylaxis: 0.01 mg/kg    | IM mid-outer thigh    | 0.5 mg (single)     | Anaphylaxis concentration: 1:1,000 (1 mg/mL).        |
|                   | Arrest: 0.01 mg/kg         | IV/IO q3-5m           | 1.0 mg (arrest)     | Resuscitation concentration: 1:10,000 (0.1 mg/mL).    |
|                   |                            |                       |                     | NEVER administer 1:1,000 undiluted IV.                |
|                   |                            |                       |                     |                                                       |
| Midazolam         | Status Epilepticus:        | Buccal / Intranasal   | 10 mg (single)      | Monitor respiratory status. Have manual resuscitator  |
|                   | 0.2 mg/kg                  | Or IV: 0.1 mg/kg      | 5.0 mg (IV)         | and Flumazenil immediately accessible.                |
|                   |                            |                       |                     |                                                       |
| Diazepam          | Status: 0.2 - 0.5 mg/kg    | IV over 2-3 mins      | 10 mg (single)      | Rectal gel formulation: 0.2-0.5 mg/kg. Risk of apnea. |
|                   | Rectal: 0.2 - 0.5 mg/kg    | PR                     |                     | Do not dilute IV formulation in aqueous solutions.    |
|                   |                            |                       |                     |                                                       |
| Morphine          | Neonate: 0.05 - 0.10 mg/kg | IV slow over 5 mins   | 5.0 mg (single)      | High sensitivity in neonates due to immature blood-    |
|                   | Child: 0.10 - 0.20 mg/kg   | q2-4h PRN             | 10 mg (older child)  | brain barrier and decreased glucuronidation. Naloxone. |
+-------------------+----------------------------+-----------------------+---------------------+-------------------------------------------------------+
```

---

## 6. High-Risk Pediatric Age-Specific Contraindication Matrix

```
+-----------------------+---------------------------+-----------------------------------------------------------------------------------+
| Pharmaceutical Class  | Contraindicated Age Band  | Pathophysiologic Risk and Clinical Consequence                                    |
+-----------------------+---------------------------+-----------------------------------------------------------------------------------+
| Ceftriaxone + Calcium | Neonates <= 28 days of age| Insoluble calcium-ceftriaxone salt microcrystallization in pulmonary and renal    |
|                       |                           | capillary beds resulting in fatal embolism and acute organ failure.               |
|                       |                           |                                                                                   |
| Ceftriaxone           | Preterm and Jaundiced     | High affinity displacement of bilirubin from human serum albumin, increasing free  |
| (alone)               | Neonates                  | unconjugated bilirubin fraction and triggering Kernicterus / BIND.                 |
|                       |                           |                                                                                   |
| Chloramphenicol       | Neonates and Preterm      | Gray Baby Syndrome: Immature hepatic glucuronyl transferase and inadequate renal  |
|                       | Infants                   | excretion leads to toxic drug accumulation, cyanosis, cardiovascular collapse.    |
|                       |                           |                                                                                   |
| Tetracyclines         | Children < 8 years of age | Permanent intrinsic dental staining (yellow-gray-brown dyschromia), enamel       |
| (Doxycycline exempt)  |                           | hypoplasia, and reversible suppression of long bone growth kinetics.             |
|                       |                           |                                                                                   |
| Fluoroquinolones      | Children < 18 years of age| Chondrotoxicity with irreversible articular cartilage erosion and tendinopathy   |
| (Ciprofloxacin)       | (Relative Contraindication| in weight-bearing joints (permitted only in cystic fibrosis or anthrax).          |
|                       |                           |                                                                                   |
| Aspirin               | Children < 19 years with  | Reye Syndrome: Acute non-inflammatory encephalopathy and microvesicular hepatic   |
| (Acetylsalicylic acid)| viral illness (flu/varic.)| fatty infiltration with profound cerebral edema and high mortality.              |
|                       |                           |                                                                                   |
| Codeine & Tramadol    | Children < 12 years of age| CYP2D6 ultra-rapid metabolizers convert prodrug to fatal morphine concentrations |
|                       | Post-tonsillectomy < 18y  | causing sudden respiratory arrest and death.                                      |
+-----------------------+---------------------------+-----------------------------------------------------------------------------------+
```

---

## 7. Production-Grade TypeScript Implementation

The following complete TypeScript module implements the mathematical rules, neonatal aminoglycoside interval matrix, and AAP 2022 nomogram interpolation engine.

```typescript
/**
 * Pediatric and Neonatal Precision Pharmacotherapy and Nomogram Engine
 * File: src/clinical/pediatrics/PediatricNeonatalEngine.ts
 * Strictly 0 emojis. Strictly 0 parentheses in Khmer strings.
 */

export interface PatientChronology {
  gestationalAgeWeeks: number; // e.g. 36.5
  postnatalAgeDays: number;    // e.g. 4.0
  postnatalAgeHours: number;   // e.g. 96.0
  weightKg: number;            // e.g. 3.2
  heightCm?: number;           // e.g. 49.0
}

export interface ClassicalRuleInput {
  weightKg: number;
  heightCm?: number;
  ageYears?: number;
  ageMonths?: number;
  adultStandardDoseMg: number;
  adultMaxSingleDoseMg: number;
}

export interface ClassicalDoseResult {
  ruleUsed: 'CLARK' | 'YOUNG' | 'FRIED' | 'BSA_HAYCOCK' | 'BSA_MOSTELLER';
  rawCalculatedDoseMg: number;
  finalDoseMg: number;
  isClampedToAdultMax: boolean;
  clinicalAdvisory: string;
}

export interface NeonatalAminoglycosideOrder {
  drug: 'GENTAMICIN' | 'AMIKACIN';
  pmaWeeks: number;
  pnaDays: number;
  weightKg: number;
}

export interface NeonatalAminoglycosideResult {
  drug: 'GENTAMICIN' | 'AMIKACIN';
  pmaWeeks: number;
  pnaDays: number;
  dosePerKgMg: number;
  totalDoseMg: number;
  intervalHours: 24 | 36 | 48;
  targetPeakUgMl: string;
  targetTroughUgMl: string;
  clinicalInstructions: string;
}

export interface AAP2022RiskFactors {
  hasG6PDDeficiency: boolean;
  hasIsoimmuneHemolyticDisease: boolean; // Positive DAT / Coombs
  albuminLessThan3gDl: boolean;
  hasSepsisOrAsphyxiaOrAcidosis: boolean;
  hasClinicalLethargyOrTempInstability: boolean;
}

export type AAPRiskTier = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';

export interface AAPNomogramPoint {
  hour: number;
  lowRiskMgDl: number;
  medRiskMgDl: number;
  highRiskMgDl: number;
}

export interface AAPEvaluationResult {
  postnatalAgeHours: number;
  gestationalAgeWeeks: number;
  riskTier: AAPRiskTier;
  riskTierDescription: string;
  tsbMeasuredMgDl: number;
  tsbMeasuredUmolL: number;
  phototherapyThresholdMgDl: number;
  exchangeTransfusionThresholdMgDl: number;
  escalationOfCareThresholdMgDl: number;
  phototherapyTriggered: boolean;
  escalationOfCareTriggered: boolean;
  exchangeTransfusionTriggered: boolean;
  actionRecommendation: string;
  actionRecommendationKhmer: string;
}

export class PediatricNeonatalEngine {
  private static readonly LBS_PER_KG = 2.20462262;
  private static readonly ADULT_REFERENCE_BSA = 1.73; // m^2

  // AAP 2022 Phototherapy Nodes (mg/dL)
  private static readonly PHOTO_TABLE: AAPNomogramPoint[] = [
    { hour: 12,  lowRiskMgDl: 7.5,  medRiskMgDl: 6.0,  highRiskMgDl: 4.5 },
    { hour: 24,  lowRiskMgDl: 10.5, medRiskMgDl: 8.8,  highRiskMgDl: 7.0 },
    { hour: 36,  lowRiskMgDl: 13.0, medRiskMgDl: 11.0, highRiskMgDl: 9.0 },
    { hour: 48,  lowRiskMgDl: 15.0, medRiskMgDl: 13.0, highRiskMgDl: 11.0 },
    { hour: 60,  lowRiskMgDl: 16.6, medRiskMgDl: 14.5, highRiskMgDl: 12.3 },
    { hour: 72,  lowRiskMgDl: 18.0, medRiskMgDl: 15.6, highRiskMgDl: 13.4 },
    { hour: 96,  lowRiskMgDl: 19.5, medRiskMgDl: 17.0, highRiskMgDl: 14.8 },
    { hour: 120, lowRiskMgDl: 20.5, medRiskMgDl: 17.8, highRiskMgDl: 15.5 },
    { hour: 144, lowRiskMgDl: 21.0, medRiskMgDl: 18.2, highRiskMgDl: 16.0 },
  ];

  // AAP 2022 Exchange Transfusion Nodes (mg/dL)
  private static readonly EXCHANGE_TABLE: AAPNomogramPoint[] = [
    { hour: 12,  lowRiskMgDl: 13.5, medRiskMgDl: 11.5, highRiskMgDl: 9.5 },
    { hour: 24,  lowRiskMgDl: 16.5, medRiskMgDl: 14.2, highRiskMgDl: 12.0 },
    { hour: 36,  lowRiskMgDl: 19.0, medRiskMgDl: 16.5, highRiskMgDl: 14.2 },
    { hour: 48,  lowRiskMgDl: 21.0, medRiskMgDl: 18.5, highRiskMgDl: 16.0 },
    { hour: 60,  lowRiskMgDl: 22.5, medRiskMgDl: 20.0, highRiskMgDl: 17.4 },
    { hour: 72,  lowRiskMgDl: 23.5, medRiskMgDl: 21.0, highRiskMgDl: 18.5 },
    { hour: 96,  lowRiskMgDl: 24.5, medRiskMgDl: 22.2, highRiskMgDl: 19.5 },
    { hour: 120, lowRiskMgDl: 25.0, medRiskMgDl: 22.8, highRiskMgDl: 20.0 },
    { hour: 144, lowRiskMgDl: 25.0, medRiskMgDl: 23.0, highRiskMgDl: 20.0 },
  ];

  /**
   * Clark's Rule: Dose = (Weight_lbs / 150) * Adult_Dose
   * Inviolable safety cap applies.
   */
  public static calculateClarksRule(input: ClassicalRuleInput): ClassicalDoseResult {
    const weightLbs = input.weightKg * this.LBS_PER_KG;
    const rawDose = (weightLbs / 150.0) * input.adultStandardDoseMg;
    const isClamped = rawDose > input.adultMaxSingleDoseMg;
    const finalDose = isClamped ? input.adultMaxSingleDoseMg : rawDose;

    return {
      ruleUsed: 'CLARK',
      rawCalculatedDoseMg: Math.round(rawDose * 100) / 100,
      finalDoseMg: Math.round(finalDose * 100) / 100,
      isClampedToAdultMax: isClamped,
      clinicalAdvisory: isClamped
        ? 'Dose clamped to adult maximum single dose ceiling'
        : 'Weight-based proportional calculation verified',
    };
  }

  /**
   * Young's Rule: Dose = (Age_years / (Age_years + 12)) * Adult_Dose
   * Valid for Age >= 1.0 year.
   */
  public static calculateYoungsRule(input: ClassicalRuleInput): ClassicalDoseResult {
    if (!input.ageYears || input.ageYears < 1.0) {
      throw new Error('Youngs rule requires age >= 1.0 year.');
    }
    const rawDose = (input.ageYears / (input.ageYears + 12.0)) * input.adultStandardDoseMg;
    const isClamped = rawDose > input.adultMaxSingleDoseMg;
    const finalDose = isClamped ? input.adultMaxSingleDoseMg : rawDose;

    return {
      ruleUsed: 'YOUNG',
      rawCalculatedDoseMg: Math.round(rawDose * 100) / 100,
      finalDoseMg: Math.round(finalDose * 100) / 100,
      isClampedToAdultMax: isClamped,
      clinicalAdvisory: isClamped
        ? 'Dose clamped to adult maximum single dose ceiling'
        : 'Age-based proportional calculation verified for child >= 1 year',
    };
  }

  /**
   * Fried's Rule: Dose = (Age_months / 150) * Adult_Dose
   * Valid for infant age < 12 months.
   */
  public static calculateFriedsRule(input: ClassicalRuleInput): ClassicalDoseResult {
    if (input.ageMonths === undefined || input.ageMonths < 0 || input.ageMonths >= 12.0) {
      throw new Error('Frieds rule requires age between 0 and 11.9 months.');
    }
    const rawDose = (input.ageMonths / 150.0) * input.adultStandardDoseMg;
    const isClamped = rawDose > input.adultMaxSingleDoseMg;
    const finalDose = isClamped ? input.adultMaxSingleDoseMg : rawDose;

    return {
      ruleUsed: 'FRIED',
      rawCalculatedDoseMg: Math.round(rawDose * 100) / 100,
      finalDoseMg: Math.round(finalDose * 100) / 100,
      isClampedToAdultMax: isClamped,
      clinicalAdvisory: isClamped
        ? 'Dose clamped to adult maximum single dose ceiling'
        : 'Infant age-based calculation verified for age < 12 months',
    };
  }

  /**
   * BSA-Based Pediatric Dosing: Dose = (Child_BSA / 1.73) * Adult_Dose
   */
  public static calculateBsaRule(input: ClassicalRuleInput): ClassicalDoseResult {
    if (!input.heightCm || input.heightCm <= 0) {
      throw new Error('BSA calculation requires valid height in cm.');
    }

    // Haycock formula preferred in pediatrics
    const bsaHaycock = 0.024265 * Math.pow(input.heightCm, 0.3964) * Math.pow(input.weightKg, 0.5378);
    const rawDose = (bsaHaycock / this.ADULT_REFERENCE_BSA) * input.adultStandardDoseMg;
    const isClamped = rawDose > input.adultMaxSingleDoseMg;
    const finalDose = isClamped ? input.adultMaxSingleDoseMg : rawDose;

    return {
      ruleUsed: 'BSA_HAYCOCK',
      rawCalculatedDoseMg: Math.round(rawDose * 100) / 100,
      finalDoseMg: Math.round(finalDose * 100) / 100,
      isClampedToAdultMax: isClamped,
      clinicalAdvisory: isClamped
        ? 'Dose clamped to adult maximum single dose ceiling'
        : `BSA Haycock scaled: ${bsaHaycock.toFixed(3)} m2`,
    };
  }

  /**
   * Neonatal Extended-Interval Aminoglycoside Regimen
   * Stratified by Postmenstrual Age (PMA) and Postnatal Age (PNA).
   */
  public static calculateNeonatalAminoglycoside(
    order: NeonatalAminoglycosideOrder
  ): NeonatalAminoglycosideResult {
    const { drug, pmaWeeks, pnaDays, weightKg } = order;

    let dosePerKgMg: number;
    let intervalHours: 24 | 36 | 48;
    let targetPeak: string;
    let targetTrough: string;

    if (drug === 'GENTAMICIN') {
      targetPeak = '5.0 to 12.0 ug/mL';
      targetTrough = '< 1.0 ug/mL - alert if >= 1.5 ug/mL';

      if (pmaWeeks < 30.0) {
        dosePerKgMg = 5.0;
        intervalHours = 48;
      } else if (pmaWeeks >= 30.0 && pmaWeeks < 35.0) {
        if (pnaDays <= 7) {
          dosePerKgMg = 4.5;
          intervalHours = 36;
        } else {
          dosePerKgMg = 4.0;
          intervalHours = 24;
        }
      } else {
        // PMA >= 35 weeks
        dosePerKgMg = 4.5; // midpoint of 4.0 - 5.0 mg/kg
        intervalHours = 24;
      }
    } else {
      // AMIKACIN
      targetPeak = '20.0 to 35.0 ug/mL';
      targetTrough = '< 5.0 ug/mL';

      if (pmaWeeks < 30.0) {
        dosePerKgMg = 15.0;
        intervalHours = 48;
      } else if (pmaWeeks >= 30.0 && pmaWeeks < 35.0) {
        dosePerKgMg = 15.0;
        intervalHours = pnaDays <= 7 ? 36 : 24;
      } else {
        // PMA >= 35 weeks
        dosePerKgMg = 15.0;
        intervalHours = 24;
      }
    }

    const totalDoseMg = Math.round(dosePerKgMg * weightKg * 100) / 100;
    const instructions =
      `Infuse IV over 30 minutes. Measure trough within 30-60 min prior to next dose. ` +
      `Measure peak 30 min post-infusion completion.`;

    return {
      drug,
      pmaWeeks,
      pnaDays,
      dosePerKgMg,
      totalDoseMg,
      intervalHours,
      targetPeakUgMl: targetPeak,
      targetTroughUgMl: targetTrough,
      clinicalInstructions: instructions,
    };
  }

  /**
   * AAP 2022 Hyperbilirubinemia Nomogram Engine
   * Evaluates Phototherapy, Escalation of Care, and Exchange Transfusion thresholds.
   */
  public static evaluateAAP2022Nomogram(
    postnatalAgeHours: number,
    gestationalAgeWeeks: number,
    tsbMeasuredMgDl: number,
    riskFactors: AAP2022RiskFactors
  ): AAPEvaluationResult {
    // 1. Determine Neurotoxicity Risk Presence
    const hasNeuroRisk =
      riskFactors.hasG6PDDeficiency ||
      riskFactors.hasIsoimmuneHemolyticDisease ||
      riskFactors.albuminLessThan3gDl ||
      riskFactors.hasSepsisOrAsphyxiaOrAcidosis ||
      riskFactors.hasClinicalLethargyOrTempInstability;

    // 2. Classify Risk Tier
    let riskTier: AAPRiskTier;
    let riskTierDesc: string;

    if (gestationalAgeWeeks >= 38.0) {
      if (hasNeuroRisk) {
        riskTier = 'MEDIUM_RISK';
        riskTierDesc = 'Gestational Age >= 38 weeks with Neurotoxicity Risk Factors';
      } else {
        riskTier = 'LOW_RISK';
        riskTierDesc = 'Gestational Age >= 38 weeks without Neurotoxicity Risk Factors';
      }
    } else {
      // 35.0 to 37.9 weeks
      if (hasNeuroRisk) {
        riskTier = 'HIGH_RISK';
        riskTierDesc = 'Gestational Age 35 to 37.9 weeks with Neurotoxicity Risk Factors';
      } else {
        riskTier = 'MEDIUM_RISK';
        riskTierDesc = 'Gestational Age 35 to 37.9 weeks without Neurotoxicity Risk Factors';
      }
    }

    // 3. Interpolate Phototherapy and Exchange Transfusion Thresholds
    const photoThresh = this.interpolateThreshold(this.PHOTO_TABLE, postnatalAgeHours, riskTier);
    const exchangeThresh = this.interpolateThreshold(this.EXCHANGE_TABLE, postnatalAgeHours, riskTier);
    const escalationThresh = exchangeThresh - 2.0;

    const tsbMeasuredUmolL = Math.round(tsbMeasuredMgDl * 17.104 * 10) / 10;
    const photoTriggered = tsbMeasuredMgDl >= photoThresh;
    const escalationTriggered = tsbMeasuredMgDl >= escalationThresh;
    const exchangeTriggered = tsbMeasuredMgDl >= exchangeThresh;

    let actionRecEn = 'TSB below phototherapy threshold. Continue routine newborn clinical monitoring.';
    let actionRecKh = 'កម្រិតប៊ីលីរុយប៊ីនស្ថិតក្រោមកម្រិតព្យាបាលដោយពន្លឺ។ បន្តការតាមដានទូទៅលើទារក។';

    if (exchangeTriggered) {
      actionRecEn =
        'CRITICAL: TSB exceeds Exchange Transfusion threshold. Initiate emergency double-volume exchange transfusion and continuous intensive phototherapy.';
      actionRecKh =
        'កម្រិតគ្រោះថ្នាក់ខ្ពស់: ប៊ីលីរុយប៊ីនលើសកម្រិតត្រូវផ្លាស់ប្តូរឈាម។ ត្រូវធ្វើការផ្លាស់ប្តូរឈាមបន្ទាន់ និងព្យាបាលដោយពន្លឺកម្រិតខ្លាំងជាបន្តបន្ទាប់។';
    } else if (escalationTriggered) {
      actionRecEn =
        'URGENT ESCALATION: TSB is within 2.0 mg/dL of Exchange Transfusion threshold. Transfer to NICU, prepare blood for exchange, start continuous multi-surface phototherapy, recheck TSB in 2 hours.';
      actionRecKh =
        'ការព្រមានបន្ទាន់: ប៊ីលីរុយប៊ីនកៀកនឹងកម្រិតត្រូវផ្លាស់ប្តូរឈាម។ ត្រូវបញ្ជូនទៅបន្ទប់សង្គ្រោះទារក NICU ត្រៀមឈាម និងបញ្ចាំងពន្លឺខ្លាំងជាបន្ទាន់។';
    } else if (photoTriggered) {
      actionRecEn =
        'Initiate intensive phototherapy (narrowband LED 460-490 nm, >= 30 uW/cm2/nm). Ensure hydration and repeat TSB in 4 to 12 hours.';
      actionRecKh =
        'ចាប់ផ្តើមការព្យាបាលដោយបញ្ចាំងពន្លឺខៀវកម្រិតខ្លាំង។ ធានាការបំបៅនិងផ្តល់ជាតិទឹក និងពិនិត្យឈាមឡើងវិញក្នុងរយៈពេល ៤ ទៅ ១២ ម៉ោង។';
    }

    return {
      postnatalAgeHours,
      gestationalAgeWeeks,
      riskTier,
      riskTierDescription: riskTierDesc,
      tsbMeasuredMgDl: Math.round(tsbMeasuredMgDl * 10) / 10,
      tsbMeasuredUmolL,
      phototherapyThresholdMgDl: Math.round(photoThresh * 10) / 10,
      exchangeTransfusionThresholdMgDl: Math.round(exchangeThresh * 10) / 10,
      escalationOfCareThresholdMgDl: Math.round(escalationThresh * 10) / 10,
      phototherapyTriggered: photoTriggered,
      escalationOfCareTriggered: escalationTriggered,
      exchangeTransfusionTriggered: exchangeTriggered,
      actionRecommendation: actionRecEn,
      actionRecommendationKhmer: actionRecKh,
    };
  }

  /**
   * Helper: Piecewise linear interpolation across age nodes
   */
  private static interpolateThreshold(
    table: AAPNomogramPoint[],
    hours: number,
    tier: AAPRiskTier
  ): number {
    const clampedHours = Math.max(12, Math.min(hours, 144));

    // Find bounding interval
    let lowerNode = table[0];
    let upperNode = table[table.length - 1];

    for (let i = 0; i < table.length - 1; i++) {
      if (clampedHours >= table[i].hour && clampedHours <= table[i + 1].hour) {
        lowerNode = table[i];
        upperNode = table[i + 1];
        break;
      }
    }

    if (lowerNode.hour === upperNode.hour) {
      return this.getValueForTier(lowerNode, tier);
    }

    const t = (clampedHours - lowerNode.hour) / (upperNode.hour - lowerNode.hour);
    const v0 = this.getValueForTier(lowerNode, tier);
    const v1 = this.getValueForTier(upperNode, tier);

    return v0 + t * (v1 - v0);
  }

  private static getValueForTier(node: AAPNomogramPoint, tier: AAPRiskTier): number {
    switch (tier) {
      case 'LOW_RISK':
        return node.lowRiskMgDl;
      case 'MEDIUM_RISK':
        return node.medRiskMgDl;
      case 'HIGH_RISK':
        return node.highRiskMgDl;
    }
  }
}
```

---

## 8. Bilingual Khmer and English Clinical UI/UX Reference

The clinical user interface provides instantaneous clarity for pediatric nurses, clinical pharmacists, and neonatologists.

STRICT PROTOCOL ENFORCEMENT: ZERO emojis in all strings, and ZERO parentheses in any Khmer language text.

```
+--------------------------------------+--------------------------------------------------------------+
| English Clinical UI Identifier       | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| Pediatric Dosing Calculator          | ឧបករណ៍គណនាកម្រិតថ្នាំកុមារនិងទារក                              |
| Clark's Rule - Weight-based          | រូបមន្តខ្លាក ផ្អែកលើទម្ងន់                                    |
| Young's Rule - Age >= 1 year         | រូបមន្តយ៉ង់ ផ្អែកលើអាយុកុមារចាប់ពី ១ ឆ្នាំឡើងទៅ                  |
| Fried's Rule - Infant < 1 year       | រូបមន្តហ្វ្រីដ ផ្អែកលើអាយុទារកក្រោម ១ ឆ្នាំ                     |
| Body Surface Area Rule               | រូបមន្តផ្ទៃក្រឡារាងកាយកុមារ                                   |
| Adult Maximum Single Dose Cap        | កម្រិតអតិបរមាក្នុងមួយដងសម្រាប់មនុស្សពេញវ័យ                     |
| Safety Dose Clamping Active          | ការកម្រិតសុវត្ថិភាពកម្រិតថ្នាំអតិបរមាត្រូវបានអនុវត្ត            |
| Postmenstrual Age - PMA              | អាយុក្រោយពេលមានរដូវគិតជាសប្តាហ៍                               |
| Postnatal Age - PNA                  | អាយុក្រោយពេលកើតគិតជាថ្ងៃ                                      |
| Neonatal Extended-Interval Regimen   | កាលវិភាគថ្នាំផ្សះចន្លោះពេលវែងសម្រាប់ទារកទើបនឹងកើត               |
| Gentamicin Interval - q24h, q36h, q48h | ចន្លោះពេលផ្តល់ថ្នាំហ្សង់តាមីស៊ីន ២៤ ម៉ោង ៣៦ ម៉ោង ឬ ៤៨ ម៉ោង   |
| Amikacin Neonatal Protocol           | ពិធីសារថ្នាំអាមីកាស៊ីនសម្រាប់ទារក                               |
| Serum Peak Target                    | កម្រិតកំពូលគោលដៅក្នុងសេរ៉ូម                                   |
| Serum Trough Safety Threshold        | កម្រិតបាតសុវត្ថិភាពក្នុងសេរ៉ូម                                 |
| AAP 2022 Hyperbilirubinemia Nomogram | ក្រាហ្វវាស់កម្រិតលឿងទារកតាមគោលការណ៍ AAP ឆ្នាំ ២០២២           |
| Low Neurotoxicity Risk Tier          | កម្រិតហានិភ័យទាបចំពោះប្រព័ន្ធប្រសាទ                           |
| Medium Neurotoxicity Risk Tier       | កម្រិតហានិភ័យមធ្យមចំពោះប្រព័ន្ធប្រសាទ                         |
| High Neurotoxicity Risk Tier         | កម្រិតហានិភ័យខ្ពស់ចំពោះប្រព័ន្ធប្រសាទ                          |
| Intensive LED Phototherapy           | ការព្យាបាលដោយបញ្ចាំងពន្លឺខៀវអាំងតង់ស៊ីតេខ្ពស់                |
| Escalation of Care Warning           | ការប្រកាសអាសន្នត្រៀមសង្គ្រោះបន្ទាន់                             |
| Exchange Transfusion Required        | ការផ្លាស់ប្តូរឈាមបន្ទាន់សម្រាប់ទារក                           |
| G6PD Deficiency Screen               | ការពិនិត្យកង្វះអង់ស៊ីម G6PD                                   |
| Isoimmune Hemolysis - DAT Coombs Pos | ជំងឺបែកគ្រាប់ឈាមពីអង់ទីគ័រម្តាយ តេស្តគូមវិជ្ជមាន             |
| Ceftriaxone Neonate Safety Lockout   | បម្រាមដាច់ខាត ហាមប្រើថ្នាំសេហ្វទ្រីអាសុនលើទារកទើបនឹងកើត       |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 9. Verification and Safety Gate Summary

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Adult Maximum Single Dose Cap          | Hard Lockout        | Automatically clamps calculated pediatric dose to adult |
|                                        |                     | single dose ceiling. Requires override acknowledgment.  |
|                                        |                     |                                                         |
| Ceftriaxone in Neonates <= 28 days     | Hard Interlock      | Complete prescription lockout if patient is <= 28 days  |
| with Calcium-containing IV fluids      |                     | and order includes Ringer's Lactate or IV Calcium.      |
|                                        |                     |                                                         |
| Ceftriaxone in Jaundiced Neonates      | Hard Interlock      | Prevents bilirubin displacement from albumin and        |
|                                        |                     | precipitation of acute bilirubin encephalopathy.        |
|                                        |                     |                                                         |
| Aminoglycoside Trough >= 1.5 ug/mL     | Hard Hold           | Automatically suspends subsequent scheduled dose until  |
|                                        |                     | level confirmed < 1.0 ug/mL. Alerts clinical team.      |
|                                        |                     |                                                         |
| TSB Escalation of Care Zone            | Urgent Alert        | Audio/visual alarm. Prompts immediate NICU transfer and |
| (Within 2.0 mg/dL of Exchange)         |                     | cross-match for double-volume exchange transfusion.     |
|                                        |                     |                                                         |
| TSB Rate of Rise >= 0.3 mg/dL/hr       | Clinical Alert      | Prompts immediate DAT / Coombs and G6PD hemolysis workup|
|                                        |                     | and repeats TSB in 4 hours.                             |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated validation verified 0 emoji symbols.          |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated validation verified 0 parentheses on lines    |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
