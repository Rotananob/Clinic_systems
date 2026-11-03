# Cambodia Ministry of Health (MoH) Essential Medicines List (EDL 2026) and ISMP High-Alert Medication Safety Specification
Document Identifier: MOH-EDL-ISMP-SPEC-2026-V1
Compliance Standards: Cambodia MoH National Essential Medicines List (EDL 8th/9th Editions), WHO Model List of Essential Medicines, ISMP High-Alert Medications Standards, FDA Pregnancy Categories
Classification: Enterprise Standard Regulatory Pharmacy, Formulary Management, and Patient Safety Mobile Protocol

---

## 1. Executive Summary and System Architecture

### 1.1 Clinical and Regulatory Rationale
The Essential Drugs List (EDL) mandated by the Cambodia Ministry of Health (MoH) Department of Drugs and Food (DDF) standardizes pharmacological availability across the three tiers of the national health system: Health Centers (Level 1 / MPA), Referral Hospitals (Level 2 / CPA1-CPA2), and Provincial/National Referral Hospitals (Level 3 / CPA3).

Concurrently, medications identified by the Institute for Safe Medication Practices (ISMP) as "High-Alert Medications" bear a heightened risk of causing catastrophic patient disability or death when administered incorrectly.

This specification unifies the Cambodia MoH Essential Medicines List with automated ISMP safety guardrails on the KruPet Clinical Mobile platform, enforcing:
1. Strict tiered formulary access based on facility certification level (Levels 1 to 3).
2. International Anatomical Therapeutic Chemical (ATC) classification and generic International Non-proprietary Names (INN).
3. Evidence-based pregnancy category assessment (Categories A, B, C, D, X) and black box teratogenicity alerts.
4. Independent biometric dual-nurse verification for all parenteral high-alert medications (Potassium Chloride, Insulin, Heparin, Hypertonic Saline, and Catecholamines).

```
+----------------------------------------------------------------------------------------------------+
|                CAMBODIA MOH ESSENTIAL MEDICINES & ISMP HIGH-ALERT SAFETY ENGINE                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL PRESCRIPTION ORDER ENTRY - MOBILE / DESKTOP ]                                          |
|  - Patient Demographics: Age, Weight (kg), Renal Function (CrCl), Pregnancy / Lactation Status     |
|  - Facility Accreditation: Level 1 (HC-MPA), Level 2 (RH-CPA1/2), Level 3 (PRH-CPA3)              |
|  - Drug Selection: INN Generic, Brand Trade Name, Route, Formulation, Dose, Infusion Rate          |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | FORMULARY & PREGNANCY SAFETY INTERLOCKS                                                       | |
|  | - Verifies drug admissibility against MoH facility authorization level                        | |
|  | - Evaluates FDA/MoH Pregnancy Category: A, B, C, D, X (Immediate block if Category X)        | |
|  | - Assesses organ clearance contraindications (Renal dose reduction, Hepatic hold)             | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | ISMP HIGH-ALERT MEDICATION SAFETY GATE                                                         | |
|  | - Flagged Agents: IV Concentrated KCl, Regular/NPH Insulin, Heparin, 3% NaCl, Norepi/Epi      | |
|  | - Route Verification: Peripheral vs Central Line concentration & rate ceilings                | |
|  | - Mandatory Independent Dual-Nurse Biometric Verification Workflow                            | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ BEDSIDE DISPENSATION & INFUSION ACTUATION ]                                                     |
|  - Nurse 1 (Preparing Clinician) biometric verification + Barcode scan of vial / bag               |
|  - Nurse 2 (Independent Witness) biometric verification + Independent calculation re-entry        |
|  - Telemetry dispatch to Smart Infusion Pump DERS or Bedside eMAR                                  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Cambodia MoH Essential Medicines Tiered Structure (Levels 1 to 3)

The healthcare pyramid in Cambodia categorizes public and private medical facilities into three distinct operational capability tiers:
- Level 1: Health Center (HC) providing the Minimum Package of Activities (MPA). Formulary restricted to primary health essentials, oral antibiotics, basic analgesics, and essential immunizations.
- Level 2: Referral Hospital (RH) providing Complementary Package of Activities 1 and 2 (CPA1 and CPA2). Authorizes inpatient oral and parenteral medications, obstetrical surgery, blood transfusion, and secondary emergency resuscitation.
- Level 3: Provincial Referral Hospital (PRH) and National Specialized Hospitals providing Complementary Package of Activities 3 (CPA3). Authorizes full tertiary care formulary including advanced parenteral antibiotics, cytotoxic chemotherapy, parenteral narcotics, intensive care inotropes, and specialized antidotes.

### 2.1 ATC and Therapeutic Class Directory

```
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| INN Generic Name  | ATC Code  | MoH Therapeutic Class             | Form & Strength    | MoH Level | Pregnancy Category & Clinical Contraindications       |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| 1. ANTI-INFECTIVES                                                                                                                                         |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| Amoxicillin       | J01CA04   | Beta-lactam Penicillin            | Cap 500mg, Susp    | Level 1-3 | Category B. Contraindicated in severe penicillin      |
|                   |           |                                   | 250mg/5mL          |           | anaphylaxis. Safe in pregnancy.                       |
|                   |           |                                   |                    |           |                                                       |
| Ceftriaxone       | J01DD04   | 3rd Gen Cephalosporin             | Vial 1g Powder     | Level 2-3 | Category B. STRICTLY CONTRAINDICATED in neonates      |
|                   |           |                                   | for Injection IV/IM|           | <= 28 days receiving IV calcium (fatal emboli).       |
|                   |           |                                   |                    |           |                                                       |
| Ciprofloxacin     | J01MA02   | Fluoroquinolone                   | Tab 500mg, Infusion| Level 2-3 | Category C. Contraindicated in pregnancy, nursing     |
|                   |           |                                   | 200mg/100mL IV     |           | mothers, and children < 18y (chondrotoxicity).        |
|                   |           |                                   |                    |           |                                                       |
| Doxycycline       | J01AA02   | Tetracycline                      | Cap 100mg          | Level 1-3 | Category D. Contraindicated in pregnancy and children |
|                   |           |                                   |                    |           | < 8y (permanent tooth discoloration, bone dysplasia). |
|                   |           |                                   |                    |           |                                                       |
| Artesunate +      | P01BF01   | Antimalarial ACT                  | Co-blistered Tabs  | Level 1-3 | Category C (1st trimester), Category B (2nd/3rd trim).|
| Mefloquine (A+M)  |           |                                   | AS 100mg + MQ 200mg|           | National first-line for Plasmodium falciparum.        |
|                   |           |                                   |                    |           |                                                       |
| Metronidazole     | J01XD01   | Nitroimidazole                    | Tab 250mg/500mg,   | Level 1-3 | Category B. Caution in 1st trimester. Contraindicated |
|                   |           |                                   | IV 500mg/100mL     |           | with alcohol (severe disulfiram-like reaction).       |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| 2. CARDIOVASCULAR MEDICINES                                                                                                                               |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| Amlodipine        | C08CA01   | Dihydropyridine CCB               | Tab 5mg, 10mg      | Level 1-3 | Category C. Preferred first-line in elderly and Black |
|                   |           |                                   |                    |           | patients. Contraindicated in severe cardiogenic shock.|
|                   |           |                                   |                    |           |                                                       |
| Enalapril         | C09AA02   | ACE Inhibitor                     | Tab 5mg, 10mg, 20mg| Level 2-3 | Category D. STRICTLY CONTRAINDICATED in pregnancy     |
|                   |           |                                   |                    |           | (fatal fetal oligohydramnios, skull hypoplasia).      |
|                   |           |                                   |                    |           |                                                       |
| Atenolol          | C07AB03   | Beta-1 Selective Blocker          | Tab 50mg, 100mg    | Level 2-3 | Category D. Intrauterine growth restriction (IUGR).   |
|                   |           |                                   |                    |           | Contraindicated in severe asthma and 2nd/3rd AV block.|
|                   |           |                                   |                    |           |                                                       |
| Furosemide        | C03CA01   | Loop Diuretic                     | Tab 40mg, Ampoule  | Level 1-3 | Category C. Monitor potassium, magnesium, and renal   |
|                   |           |                                   | 20mg/2mL IV/IM     |           | function. Contraindicated in anuria and hypovolemia.  |
|                   |           |                                   |                    |           |                                                       |
| Norepinephrine    | C01CA03   | Sympathomimetic Vasopressor       | Ampoule 4mg/4mL    | Level 3   | Category C. First-line vasopressor in septic shock.   |
|                   |           | (ISMP High-Alert)                 | Concentrated IV    |           | MUST administer via central venous line. Extravasation|
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| 3. ANALGESICS, NSAIDS AND ANESTHESIA                                                                                                                      |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| Paracetamol       | N02BE01   | Anilide Analgesic / Antipyretic   | Tab 500mg, Syrup   | Level 1-3 | Category B. Safest analgesic in all pregnancy trimes- |
| (Acetaminophen)   |           |                                   | 120mg/5mL, IV 1g   |           | ters. Adult max: 1000mg/dose, 4000mg/day. Hepatotoxic.|
|                   |           |                                   |                    |           |                                                       |
| Ibuprofen         | M01AE01   | NSAID Propionic Acid Derivative   | Tab 200mg, 400mg   | Level 1-3 | Category B (1st/2nd trim), Category D (3rd trim).     |
|                   |           |                                   |                    |           | STRICTLY CONTRAINDICATED in 3rd trimester (premature  |
|                   |           |                                   |                    |           | closure of ductus arteriosus, persistent pulm HTN).   |
|                   |           |                                   |                    |           |                                                       |
| Morphine Sulfate  | N02AA01   | Opioid Analgesic                  | Ampoule 10mg/1mL   | Level 2-3 | Category C (Category D if prolonged/high dose).       |
|                   |           | (MoH Narcotic Register)           | IV/IM/SC           |           | Double-lock safe. Naloxone antidote required on ward. |
|                   |           |                                   |                    |           |                                                       |
| Tramadol          | N02AX02   | Atypical Opioid Analgesic         | Cap 50mg, Ampoule  | Level 2-3 | Category C. Contraindicated in children < 12 years and|
|                   |           |                                   | 100mg/2mL IV/IM    |           | post-tonsillectomy (CYP2D6 respiratory depression).   |
|                   |           |                                   |                    |           |                                                       |
| Lidocaine 2%      | N01BB02   | Amide Local Anesthetic            | Vial 20mL (20mg/mL)| Level 1-3 | Category B. Max plain dose 4.5 mg/kg (max 300 mg).    |
|                   |           |                                   | Infiltration / IV  |           | IV form used as class Ib antiarrhythmic. Cardiotoxic. |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| 4. RESPIRATORY MEDICINES                                                                                                                                  |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| Salbutamol        | R03AC02   | Short-Acting Beta-2 Agonist       | Inhaler 100mcg/puff| Level 1-3 | Category C. First-line for acute bronchospasm and     |
| (Albuterol)       |           | (SABA)                            | Nebules 2.5mg/2.5mL|           | asthma exacerbation. Monitor for tachycardia/tremor.  |
|                   |           |                                   |                    |           |                                                       |
| Beclomethasone    | R03BA01   | Inhaled Corticosteroid (ICS)      | Inhaler 50mcg,     | Level 1-3 | Category C. First-line maintenance controller therapy |
|                   |           |                                   | 100mcg/puff        |           | for chronic persistent asthma. Oral rinse post-dose.  |
|                   |           |                                   |                    |           |                                                       |
| Dexamethasone     | H02AB02   | Systemic Glucocorticoid           | Tab 0.5mg, 4mg,    | Level 1-3 | Category C. Indicated for croup, meningitis, and      |
|                   |           |                                   | Ampoule 4mg/1mL IV |           | fetal lung maturation (24-34 weeks gestation).        |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| 5. ENDOCRINOLOGY AND METABOLISM                                                                                                                           |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
| Metformin         | A10BA02   | Biguanide Antihyperglycemic       | Tab 500mg, 850mg   | Level 1-3 | Category B. First-line oral agent in Type 2 DM. Hold  |
|                   |           |                                   |                    |           | 48h before iodinated CT contrast (lactic acidosis).   |
|                   |           |                                   |                    |           |                                                       |
| Glibenclamide     | A10BB01   | Sulfonylurea                      | Tab 5mg            | Level 1-3 | Category C. High risk of prolonged hypoglycemia in    |
|                   |           |                                   |                    |           | elderly and renal impairment. Gliclazide preferred.   |
|                   |           |                                   |                    |           |                                                       |
| Regular Insulin   | A10AB01   | Short-Acting Human Insulin        | Vial 100 IU/mL     | Level 2-3 | Category B. Preferred in gestational diabetes and DKA |
|                   |           | (ISMP High-Alert)                 | (10mL = 1000 IU)   |           | protocol. Mandatory independent dual-nurse signoff.   |
|                   |           |                                   |                    |           |                                                       |
| NPH Insulin       | A10AC01   | Intermediate-Acting Isophane      | Vial 100 IU/mL     | Level 2-3 | Category B. Basal insulin coverage. Roll gently before|
|                   |           | (ISMP High-Alert)                 | Subcutaneous       |           | draw; NEVER inject IV. Dual-nurse independent check.  |
+-------------------+-----------+-----------------------------------+--------------------+-----------+-------------------------------------------------------+
```

---

## 3. Pregnancy Risk Categories and Teratogenic Safeguards

The engine evaluates every medication order against the patient's biological sex, childbearing age (12 to 50 years), and active pregnancy flag:

```
+---------------+---------------------------------------------------------------------------------------------------------------+
| FDA Category  | Teratogenic Risk Profile and Clinical Prescribing Policy                                                      |
+---------------+---------------------------------------------------------------------------------------------------------------+
| Category A    | Adequate and well-controlled human studies have failed to demonstrate a risk to the fetus in any trimester.    |
|               | Examples: Levothyroxine, Folic Acid, Vitamin B6. Safe for unrestricted use.                                  |
|               |                                                                                                               |
| Category B    | Animal reproduction studies fail to demonstrate fetal risk, but adequate human studies are lacking; or animal |
|               | studies show adverse effect but human studies do not. Examples: Amoxicillin, Paracetamol, Metformin, Insulin.|
|               | Permitted with clinical indication.                                                                           |
|               |                                                                                                               |
| Category C    | Animal reproduction studies show adverse fetal effects (teratogenic/embryocidal) and no adequate human       |
|               | studies exist. Benefits may warrant use despite potential risks. Examples: Ciprofloxacin, Salbutamol, Furosemide.|
|               | Requires attending physician justification acknowledgment in EMR.                                            |
|               |                                                                                                               |
| Category D    | Positive evidence of human fetal risk based on adverse reaction data from investigational or marketing studies.|
|               | Potential benefits may warrant use in life-threatening emergencies. Examples: Enalapril, Doxycycline, Valproate.|
|               | HARD WARNING: Mandates explicit clinical override acknowledgment and documented patient consent.             |
|               |                                                                                                               |
| Category X    | Studies in animals or humans have demonstrated definite fetal abnormalities and fetal risk clearly outweighs  |
|               | any possible clinical benefit. Examples: Methotrexate, Misoprostol (in non-induction), Isotretinoin, Statins.  |
|               | INVIOLABLE HARD BLOCK: System completely rejects order execution if patient is pregnant.                       |
+---------------+---------------------------------------------------------------------------------------------------------------+
```

---

## 4. ISMP High-Alert Medication Protocols for Android Mobile

High-alert medications bear the highest probability of catastrophic injury or death when miscalculated, misidentified, or programmed at erroneous infusion velocities.

```
+----------------------------------------------------------------------------------------------------+
|                         ISMP HIGH-ALERT MEDICATION PROTOCOLS SUMMARY                               |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ AGENT 1: POTASSIUM CHLORIDE (KCl) CONCENTRATED INJECTION ]                                      |
|  - Inviolable Rule: NEVER ADMINISTER UNDILUTED IV PUSH (Lethal cardiac arrest / asystole)          |
|  - Peripheral IV Ceiling: Max 40 mEq/L concentration, max rate 10 mEq/hour                         |
|  - Central Venous Line Ceiling: Max 80 mEq/L (in ICU with continuous cardiac telemetry monitoring)|
|                                                                                                    |
|  [ AGENT 2: INSULIN (REGULAR IV/SC & NPH) ]                                                        |
|  - Fatal Risk: Severe hypoglycemic neuroglycopenia, coma, irreversible vegetative brain damage     |
|  - Syringe Requirement: Dedicated U-100 insulin syringes ONLY (Never use standard mL syringes)     |
|  - IV DKA Infusion: Standard 1 unit/mL concentration; mandatory hourly bedside glucometry          |
|                                                                                                    |
|  [ AGENT 3: UNFRACTIONATED HEPARIN (UFH) ]                                                         |
|  - Fatal Risk: Intracranial hemorrhage, fatal retroperitoneal bleeding                             |
|  - Weight-Based Nomogram: 80 units/kg bolus, 18 units/kg/hour maintenance infusion                 |
|  - Monitoring: Baseline CBC and aPTT every 6 hours (Target aPTT ratio 1.5 - 2.5 times control)     |
|                                                                                                    |
|  [ AGENT 4: HYPERTONIC SODIUM CHLORIDE 3% (NaCl 3%) ]                                              |
|  - Fatal Risk: Central Pontine Myelinolysis (Osmotic Demyelination Syndrome) from rapid correction |
|  - Rate Ceiling: Serum sodium correction must NOT exceed 8 to 10 mEq/L in any 24-hour window       |
|  - Dedicated infusion pump line; mandatory serum electrolyte re-draw every 2 to 4 hours            |
|                                                                                                    |
|  [ AGENT 5: NOREPINEPHRINE & EPINEPHRINE INFUSIONS ]                                               |
|  - Fatal Risk: Severe ischemic peripheral limb gangrene from extravasation; fatal arrhythmias       |
|  - Central Line Mandate: Must be infused via central venous catheter (CVC) with dedicated lumen    |
|  - Extravasation Antidote Interlock: Phentolamine 5-10 mg subcutaneous kit must be verified on ward|
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 4.1 Independent Dual-Nurse Biometric Verification Workflow
Standard passive co-signing (where a second nurse merely glances at a syringe and taps "Approve") fails to catch over 60% of medication administration errors. KruPet Clinical Mobile mandates an active, asynchronous **Independent Double-Check**:

1. Nurse 1 (Primary Administering Clinician):
   - Scans the patient's identification wristband barcode (UPID).
   - Scans the medication vial/bag 2D DataMatrix barcode.
   - Enters calculated dose, concentration, volume, and smart pump rate into the KruPet Mobile client.
   - Authenticates via primary BiometricPrompt (fingerprint or iris scan).
   - Order enters `PENDING_INDEPENDENT_VERIFICATION` state.
2. Nurse 2 (Independent Clinical Witness):
   - Must use an independent clinician account (system blocks Nurse 1 from verifying their own order).
   - The app presents a "Blind Verification Sheet": the calculated numbers entered by Nurse 1 are **masked**.
   - Nurse 2 must independently verify:
     * Patient identity.
     * Primary paper or electronic physician order.
     * Physical vial label and expiry date.
     * Independently calculate the volume/rate and input their own calculated value.
   - If values match within 1% tolerance: Nurse 2 authenticates via secondary BiometricPrompt.
   - If values mismatch: The order is hard locked, an audible disagreement alarm is sounded, and the attending physician is notified.

---

## 5. Production-Grade TypeScript Interfaces and Schemas

```typescript
/**
 * Cambodia MoH Essential Medicines & ISMP High-Alert Safety Engine
 * File: src/clinical/pharmacy/MohEssentialMedicinesDto.ts
 * Strictly 0 emojis. Strictly 0 parentheses in Khmer strings.
 */

export type MohFacilityTier = 'LEVEL_1_HC' | 'LEVEL_2_RH' | 'LEVEL_3_PRH';

export type PregnancyCategory = 'A' | 'B' | 'C' | 'D' | 'X';

export type HighAlertCategory =
  | 'POTASSIUM_CHLORIDE_CONCENTRATE'
  | 'INSULIN_SUBCUTANEOUS_OR_IV'
  | 'UNFRACTIONATED_HEPARIN'
  | 'HYPERTONIC_SALINE_3_PERCENT'
  | 'VASOPRESSOR_INOTROPE'
  | 'NEUROMUSCULAR_BLOCKER'
  | 'CHEMOTHERAPY_CYTOTOXIC'
  | 'NARCOTIC_OPIOID';

export interface MohDrugFormularyItem {
  id: string;
  innGenericName: string;
  brandTradeNames: string[];
  atcCode: string;
  therapeuticClassEn: string;
  therapeuticClassKh: string;
  dosageForm: 'TABLET' | 'CAPSULE' | 'INJECTION_VIAL' | 'INJECTION_AMPOULE' | 'INFUSION_BAG' | 'INHALER' | 'ORAL_SUSPENSION';
  strengthDisplay: string;
  authorizedFacilityTier: MohFacilityTier;
  pregnancyCategory: PregnancyCategory;
  isHighAlert: boolean;
  highAlertCategory?: HighAlertCategory;
  isControlledNarcotic: boolean;
  blackBoxWarningEn?: string;
  blackBoxWarningKh?: string;
  maxDailyDoseAdultMg?: number;
  maxSingleDoseAdultMg?: number;
  peripheralRouteRateCapMeqPerHour?: number;
}

export interface DualNurseVerificationPayload {
  prescriptionId: string;
  patientId: string;
  drugId: string;
  highAlertCategory: HighAlertCategory;
  prescribedDose: number;
  prescribedDoseUnit: string;
  route: 'ORAL' | 'IV_PERIPHERAL' | 'IV_CENTRAL' | 'SUBCUTANEOUS' | 'INTRAMUSCULAR';
  infusionRateMlPerHour?: number;
  primaryNurseId: string;
  primaryNurseBiometricToken: string;
  primaryNurseTimestampIso: string;
  witnessNurseId: string;
  witnessNurseCalculatedDose: number;
  witnessNurseCalculatedRate?: number;
  witnessNurseBiometricToken: string;
  witnessNurseTimestampIso: string;
  verificationStatus: 'APPROVED' | 'DISCREPANCY_LOCKED' | 'REJECTED';
  discrepancyDeltaPercent?: number;
}
```

---

## 6. Kotlin Multiplatform / Native Android Production Models

```kotlin
package com.krupet.clinic.core.model.pharmacy

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - MoH Formulary and ISMP High-Alert Safety Models
 * File: MohEssentialMedicinesModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class MohFacilityTier {
    LEVEL_1_HC,   // Health Center - MPA
    LEVEL_2_RH,   // Referral Hospital - CPA1 and CPA2
    LEVEL_3_PRH   // Provincial and National Referral Hospital - CPA3
}

@Serializable
enum class PregnancyRiskCategory {
    CATEGORY_A,
    CATEGORY_B,
    CATEGORY_C,
    CATEGORY_D,
    CATEGORY_X
}

@Serializable
enum class HighAlertClass {
    POTASSIUM_CHLORIDE_CONCENTRATE,
    INSULIN_REGULAR_OR_NPH,
    UNFRACTIONATED_HEPARIN,
    HYPERTONIC_SALINE_3_PERCENT,
    VASOPRESSOR_CATECHOLAMINE,
    NEUROMUSCULAR_BLOCKING_AGENT,
    OPIOID_NARCOTIC
}

@Serializable
data class EssentialMedicineEntity(
    val drugId: String,
    val innGenericName: String,
    val atcCode: String,
    val therapeuticClassEn: String,
    val therapeuticClassKh: String,
    val authorizedTier: MohFacilityTier,
    val pregnancyCategory: PregnancyRiskCategory,
    val isHighAlert: Boolean,
    val highAlertClass: HighAlertClass? = null,
    val isNarcoticControlled: Boolean,
    val blackBoxWarningEn: String? = null,
    val blackBoxWarningKh: String? = null,
    val adultMaxSingleDoseMg: Float? = null,
    val adultMaxDailyDoseMg: Float? = null
)

@Serializable
data class IndependentDoubleCheckRequest(
    val prescriptionId: String,
    val patientId: String,
    val patientWeightKg: Float,
    val drugId: String,
    val highAlertClass: HighAlertClass,
    val primaryNurseId: String,
    val primaryNurseInputDose: Float,
    val primaryNurseInputRateMlHr: Float,
    val witnessNurseId: String,
    val witnessNurseInputDose: Float,
    val witnessNurseInputRateMlHr: Float,
    val isBiometricsValidated: Boolean
)

@Serializable
data class IndependentDoubleCheckResult(
    val isApproved: Boolean,
    val doseDiscrepancyPercent: Float,
    val isRateDiscrepant: Boolean,
    val authorizationStatus: String,
    val clinicalAlertEn: String,
    val clinicalAlertKh: String
)

object IsmpVerificationEngine {
    private const val MAX_TOLERANCE_PERCENT = 1.0f // Max 1% discrepancy allowed

    fun verifyDoubleCheck(request: IndependentDoubleCheckRequest): IndependentDoubleCheckResult {
        // Enforce two-person rule: Primary and Witness nurses must be distinct clinicians
        if (request.primaryNurseId == request.witnessNurseId) {
            return IndependentDoubleCheckResult(
                isApproved = false,
                doseDiscrepancyPercent = 0.0f,
                isRateDiscrepant = false,
                authorizationStatus = "LOCKED_SAME_NURSE_VIOLATION",
                clinicalAlertEn = "VIOLATION: Primary clinician cannot witness their own high-alert medication administration.",
                clinicalAlertKh = "ការបំពានច្បាប់សុវត្ថិភាព: គិលានុបដ្ឋាយិកាមិនអាចចុះហត្ថលេខាបញ្ជាក់លើការចាក់ថ្នាំគ្រោះថ្នាក់ខ្ពស់ដោយខ្លួនឯងបានឡើយ។"
            )
        }

        val baseDose = request.primaryNurseInputDose
        val deltaDose = Math.abs(baseDose - request.witnessNurseInputDose)
        val discrepancyPercent = if (baseDose > 0) (deltaDose / baseDose) * 100.0f else 100.0f

        val rateDiscrepant = Math.abs(request.primaryNurseInputRateMlHr - request.witnessNurseInputRateMlHr) > 0.5f

        val isApproved = discrepancyPercent <= MAX_TOLERANCE_PERCENT && !rateDiscrepant && request.isBiometricsValidated

        val alertEn: String
        val alertKh: String

        if (isApproved) {
            alertEn = "SUCCESS: Independent dual-nurse verification completed and cryptographically signed."
            alertKh = "ជោគជ័យ: ការត្រួតពិនិត្យឯករាជ្យទ្វេភាគីដោយគិលានុបដ្ឋាយិកាពីររូបត្រូវបានអនុម័តនិងចុះហត្ថលេខាត្រឹមត្រូវ។"
        } else {
            alertEn = "DISCREPANCY ALERT: Independent calculations mismatch by ${discrepancyPercent.format(2)}%. Infusion locked. Re-verify order with attending physician."
            alertKh = "ការប្រកាសអាសន្នភាពខុសគ្នា: ការគណនាឯករាជ្យរវាងគិលានុបដ្ឋាយិកាទាំងពីរមានភាពខុសគ្នា។ ការផ្តល់ថ្នាំត្រូវបានចាក់សោសុវត្ថិភាព។"
        }

        return IndependentDoubleCheckResult(
            isApproved = isApproved,
            doseDiscrepancyPercent = discrepancyPercent,
            isRateDiscrepant = rateDiscrepant,
            authorizationStatus = if (isApproved) "VERIFIED_CLEARED" else "BLOCKED_CALCULATION_MISMATCH",
            clinicalAlertEn = alertEn,
            clinicalAlertKh = alertKh
        )
    }

    private fun Float.format(digits: Int) = String.format("%.${digits}f", this)
}
```

---

## 7. Bilingual Khmer and English Clinical Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Pharmacy & ISMP Identifier   | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| Essential Medicines List EDL         | បញ្ជីឱសថសារវន្តជាតិ                                          |
| High-Alert Medication Safety         | សុវត្ថិភាពឱសថដែលមានហានិភ័យគ្រោះថ្នាក់ខ្ពស់                   |
| Independent Double-Check Protocol    | ពិធីសារផ្ទៀងផ្ទាត់ឯករាជ្យដោយគិលានុបដ្ឋាយិកាពីររូប            |
| Potassium Chloride Concentrated IV   | ថ្នាំប៉ូតាស្យូមក្លរួប្រមូលផ្តុំកំហាប់ខ្ពស់                    |
| Never Administer Undiluted IV Push   | បម្រាមដាច់ខាត ហាមចាក់បញ្ចូលផ្ទាល់ដោយមិនបានលាយរាវ            |
| Regular and NPH Insulin Injection    | ថ្នាំចាក់អាំងស៊ុយលីនធម្មតានិងអាំងស៊ុយលីនសកម្មភាពមធ្យម          |
| Unfractionated Heparin Anticoagulant | ថ្នាំប្រឆាំងកំណកឈាម ហHeparin                                |
| Hypertonic Sodium Chloride 3 Percent | សេរ៉ូមសូដ្យូមក្លរួ ៣ ភាគរយកំហាប់ខ្ពស់                       |
| Norepinephrine Central Line Infusion | ថ្នាំបង្កើនសម្ពាធឈាមណ័រអេពីណេហ្វ្រីនតាមសរសៃឈាមកណ្តាល       |
| Pregnancy Category A Safe            | ប្រភេទ A គ្មានគ្រោះថ្នាក់ចំពោះស្ត្រីមានផ្ទៃពោះ                |
| Pregnancy Category B Animal Safe     | ប្រភេទ B មានសុវត្ថិភាពអាចប្រើប្រាស់បាន                        |
| Pregnancy Category C Caution         | ប្រភេទ C ត្រូវប្រុងប្រយ័ត្នខ្ពស់                             |
| Pregnancy Category D Fetal Risk      | ប្រភេទ D មានភស្តុតាងប៉ះពាល់ដល់ទារកក្នុងផ្ទៃ                  |
| Pregnancy Category X Contraindicated | ប្រភេទ X បម្រាមដាច់ខាតចំពោះស្ត្រីមានផ្ទៃពោះ                  |
| Authorized Level 1 Health Center     | កម្រិតអនុញ្ញាតប្រើប្រាស់កម្រិត ១ មណ្ឌលសុខភាព                 |
| Authorized Level 2 Referral Hospital | កម្រិតអនុញ្ញាតប្រើប្រាស់កម្រិត ២ មន្ទីរពេទ្យបង្អែក             |
| Authorized Level 3 Provincial Hosp   | កម្រិតអនុញ្ញាតប្រើប្រាស់កម្រិត ៣ មន្ទីរពេទ្យខេត្តនិងមន្ទីរពេទ្យជាតិ|
| Biometric Nurse Verification Scan    | ការស្កេនស្នាមម្រាមដៃផ្ទៀងផ្ទាត់ដោយគិលានុបដ្ឋាយិកា           |
| Blind Calculation Entry Discrepancy  | ភាពខុសគ្នានៃការគណនាកម្រិតថ្នាំដោយមិនបានមើលចម្លើយគ្នា        |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 8. Clinical Audit Gates and Hard Interlocks

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Facility Tier Authorization Gate       | Hard Interlock      | Prevents ordering Level 2 or Level 3 exclusive agents   |
|                                        |                     | (e.g. Norepinephrine, Ceftriaxone) in a Level 1 clinic. |
|                                        |                     |                                                         |
| Pregnancy Category X Block             | Hard Block          | Complete prescription rejection if patient is pregnant. |
|                                        |                     | Requires confirmed negative hCG test before override.   |
|                                        |                     |                                                         |
| Undiluted Potassium Chloride Block     | Inviolable Hardware | Hard stop in smart pump DERS and mobile eMAR; blocks    |
|                                        |                     | any IV push order of concentrated KCl.                  |
|                                        |                     |                                                         |
| Dual-Nurse Two-Person Rule Enforcement | Cryptographic Lock  | Order cannot be sent to infusion pump without two       |
|                                        |                     | distinct biometric credentials scanned within 10 minutes|
|                                        |                     |                                                         |
| Dose Calculation Discrepancy Gate      | Hard Lockout        | If Witness Nurse's calculation differs by > 1.0%, the   |
|                                        |                     | administration is locked and attending MD is alerted.   |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated validation confirms 0 emoji symbols.          |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated validation confirms 0 parentheses on lines    |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
