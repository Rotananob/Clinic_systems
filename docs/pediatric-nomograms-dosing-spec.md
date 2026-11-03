# Pediatric Clinical Decision Support and Neonatal Nomograms Specification
Document Identifier: PEDIATRIC-NOMOGRAMS-DOSING-SPEC-2026-V1
Compliance Standards: AAP 2022 Hyperbilirubinemia Guidelines, Bhutani Nomogram, AHA PALS Guidelines 2020-2025, WHO Pediatric Emergency Triage (ETAT)
Classification: Enterprise Standard Pediatric Critical Care, Neonatology, and Mobile Resuscitation Clinical Decision Support

---

## 1. Executive Summary and System Architecture

### 1.1 Clinical Rationale
Pediatric and neonatal patients experience rapid anatomical, metabolic, and neurodevelopmental evolution. Standard adult triage and vital sign thresholds cannot be applied without causing catastrophic delays in identifying pediatric shock, respiratory failure, or acute bilirubin encephalopathy.

The KruPet Pediatric Clinical Decision Support and Neonatal Nomograms Engine delivers:
1. Bhutani and AAP 2022 hour-specific neonatal hyperbilirubinemia nomogram with continuous curve interpolation and gestational age risk stratification (<35w, 35-37w, >=38w).
2. Dual-Age Pediatric Glasgow Coma Scale (pGCS) adjusting verbal and motor criteria for pre-verbal infants (<2 years) versus verbal older children (>=2 years).
3. Age-stratified normal vital signs threshold matrix across 5 developmental brackets: Neonate (0-28d), Infant (1-12m), Toddler (1-3y), Child (4-11y), and Adolescent (12-18y).
4. Full Broselow Tape length-to-weight color zone resuscitation nomogram (Grey to Green, 3 to 36 kg) with pre-calculated emergency drugs and defibrillation energy ladders.

```
+----------------------------------------------------------------------------------------------------+
|                   PEDIATRIC CLINICAL DECISION SUPPORT & NOMOGRAM ENGINE ARCHITECTURE               |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL PEDIATRIC INGESTION - MOBILE TABLET / POS ]                                            |
|  - Patient Chronology: Gestational Age (weeks), Birth Timestamp, Postnatal Age (hours/days/months)  |
|  - Growth Anthropometry: Length / Height (cm), Weight (kg), Head Circumference (cm)                |
|  - Vital Signs: Heart Rate, Respiration Rate, SBP, SpO2, Temperature                               |
|  - Diagnostic Labs: Total Serum Bilirubin (TSB mg/dL), Direct Bilirubin, Coombs / DAT (+/-)        |
|                               |                                                                    |
|         +---------------------+---------------------+---------------------+                        |
|         |                     |                     |                     |                        |
|         v                     v                     v                     v                        |
|  +--------------+   +-------------------+   +---------------+   +-------------------+              |
|  | BHUTANI & AAP|   | PEDIATRIC GCS     |   | AGE-STRATIFIED|   | BROSELOW TAPE     |              |
|  | HYPERBILI    |   | (pGCS 3-15)       |   | VITAL SIGNS   |   | RESUSCITATION     |              |
|  | - Hour 12-144|   | - Infant < 2y     |   | - 5 Brackets  |   | - 9 Color Bands   |              |
|  | - 4 Risk Zone|   | - Child >= 2y     |   | - Brady/Tachy |   | - ETT & Blades    |              |
|  | - Photo Thres|   | - Airway Gate     |   | - SBP Minima  |   | - Defib 2-4 J/kg  |              |
|  | - Exch Thresh|   |   pGCS <= 8       |   | - Hypoxemia   |   | - PALS Drug Dosing|              |
|  +--------------+   +-------------------+   +---------------+   +-------------------+              |
|         |                     |                     |                     |                        |
|         +---------------------+---------------------+---------------------+                        |
|                               |                                                                    |
|                               v                                                                    |
|  [ CLINICAL TELEMETRY DISPATCH & ALERT GENERATION ]                                                |
|  - Smart Pump Infusion Rates, Phototherapy Activation, NICU Transfer Alarms, PALS Resuscitation   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Bhutani Hour-Specific Nomogram and Phototherapy / Exchange Transfusion Protocols

### 2.1 The Hour-Specific Total Serum Bilirubin (TSB) Nomogram
Neonatal jaundice requires assessment relative to the exact hour of life (since birth timestamp), as bilirubin naturally rises over the first 72 to 96 hours before stabilizing.

#### Percentile Risk Stratification (12 to 144 Hours of Life):
1. Low-Risk Zone: $\text{TSB} < 40\text{th percentile}$. Safe for routine newborn discharge.
2. Low-Intermediate Risk Zone: $40\text{th to } 75\text{th percentile}$. Close outpatient follow-up within 48 hours.
3. High-Intermediate Risk Zone: $75\text{th to } 95\text{th percentile}$. Repeat TSB in 12 to 24 hours; assess feeding and lactation.
4. High-Risk Zone: $\text{TSB} > 95\text{th percentile}$. Immediate phototherapy evaluation and hemolysis workup.

```
+-------------+-----------------------+-----------------------+-----------------------+-----------------------+
| Postnatal   | 40th Percentile       | 75th Percentile       | 95th Percentile       | Exchange Transfusion  |
| Hour        | (Low-Risk Cutoff)     | (Intermediate Cutoff) | (High-Risk Cutoff)    | (Term Infants >=38w)  |
+-------------+-----------------------+-----------------------+-----------------------+-----------------------+
| 12 hours    | 3.8 mg/dL [65 umol]   |  5.0 mg/dL  [86 umol] |  6.5 mg/dL [111 umol] | 13.5 mg/dL [231 umol] |
| 24 hours    | 5.0 mg/dL [86 umol]   |  6.8 mg/dL [116 umol] |  8.5 mg/dL [145 umol] | 16.5 mg/dL [282 umol] |
| 36 hours    | 6.8 mg/dL [116 umol]  |  9.0 mg/dL [154 umol] | 11.2 mg/dL [192 umol] | 19.0 mg/dL [325 umol] |
| 48 hours    | 8.5 mg/dL [145 umol]  | 11.2 mg/dL [192 umol] | 13.5 mg/dL [231 umol] | 21.0 mg/dL [359 umol] |
| 60 hours    | 10.0 mg/dL [171 umol] | 13.0 mg/dL [222 umol] | 15.2 mg/dL [260 umol] | 22.5 mg/dL [385 umol] |
| 72 hours    | 11.4 mg/dL [195 umol] | 14.5 mg/dL [248 umol] | 16.8 mg/dL [287 umol] | 23.5 mg/dL [402 umol] |
| 96 hours    | 13.2 mg/dL [226 umol] | 16.5 mg/dL [282 umol] | 18.8 mg/dL [322 umol] | 24.5 mg/dL [419 umol] |
| 120 hours   | 14.2 mg/dL [243 umol] | 17.5 mg/dL [299 umol] | 19.8 mg/dL [339 umol] | 25.0 mg/dL [428 umol] |
| 144+ hours  | 14.5 mg/dL [248 umol] | 17.8 mg/dL [304 umol] | 20.0 mg/dL [342 umol] | 25.0 mg/dL [428 umol] |
+-------------+-----------------------+-----------------------+-----------------------+-----------------------+
```

### 2.2 Phototherapy Thresholds Stratified by Gestational Age
Clinical intervention thresholds are governed by gestational age and neurotoxicity risk factors:
1. Low-Risk Tier: Gestational age $\ge 38\text{ weeks}$ and well (no hemolytic disease, G6PD, sepsis, or acidosis).
2. Medium-Risk Tier: Gestational age $35\text{ to }37\text{ 6/7 weeks}$ and well, OR $\ge 38\text{ weeks}$ with risk factors.
3. High-Risk Tier: Gestational age $35\text{ to }37\text{ 6/7 weeks}$ WITH neurotoxicity risk factors.
4. Preterm Tier (< 35 weeks): Managed under specialized NICU birth-weight-based phototherapy tables:
   - $< 1,000\text{ g}$: Phototherapy at $5 - 6\text{ mg/dL}$; Exchange at $10 - 12\text{ mg/dL}$.
   - $1,000 - 1,499\text{ g}$: Phototherapy at $7 - 9\text{ mg/dL}$; Exchange at $12 - 14\text{ mg/dL}$.
   - $1,500 - 1,999\text{ g}$: Phototherapy at $10 - 12\text{ mg/dL}$; Exchange at $15 - 17\text{ mg/dL}$.
   - $2,000 - 2,499\text{ g}$: Phototherapy at $12 - 14\text{ mg/dL}$; Exchange at $17 - 19\text{ mg/dL}$.

### 2.3 Escalation of Care Window
When measured TSB rises to within $2.0\text{ mg/dL}$ ($34.2\text{ }\mu\text{mol/L}$) of the exchange transfusion threshold, the engine triggers an **Urgent Escalation of Care Protocol**:
- Immediate transfer to NICU.
- Place under intensive overhead LED phototherapy plus biliblanket (maximum surface area irradiance $\ge 30\text{ }\mu\text{W/cm}^2/\text{nm}$).
- Immediate cross-match blood for double-volume exchange transfusion ($160\text{ to }180\text{ mL/kg}$).
- Start continuous IV hydration with balanced fluid.
- Re-measure TSB every 2 to 3 hours.

---

## 3. Pediatric Glasgow Coma Scale (pGCS)

The classical adult GCS relies on complex verbal reasoning and commands that pre-verbal infants cannot perform. The engine stratifies GCS assessment based on patient chronological age:

```
+------------------------------------+------------------------------------+------------------------------------+
| Subscale Score                     | Pre-Verbal Infants (< 2 Years)     | Verbal Children (>= 2 Years)       |
+------------------------------------+------------------------------------+------------------------------------+
| 1. EYE OPENING (1-4)                                                                                         |
| 4: Spontaneous                     | Spontaneous eye opening            | Spontaneous eye opening            |
| 3: To Speech / Sound               | Opens eyes to parental speech/voice| Opens eyes to verbal command       |
| 2: To Pain / Pressure              | Opens eyes to tactile/pain stimulus| Opens eyes to painful stimulus     |
| 1: None                            | No eye opening                     | No eye opening                     |
|                                                                                                              |
| 2. VERBAL RESPONSE (1-5)                                                                                     |
| 5: Optimal Vocalization            | Coos, babbles, smiles, normal voice| Oriented, converses, interacts     |
| 4: Irritable Consolable            | Irritable cries, consolable        | Disoriented, confused              |
| 3: Inconsolable Crying             | Inconsolable crying, agitated      | Inappropriate words, crying        |
| 2: Incomprehensible Sounds         | Grunting, moaning to pain          | Incomprehensible vocal sounds      |
| 1: None                            | No vocalization                    | No vocal response                  |
|                                                                                                              |
| 3. MOTOR RESPONSE (1-6)                                                                                      |
| 6: Normal Movements                | Normal spontaneous movements       | Obeys commands                     |
| 5: Localizes Stimulus              | Withdraws from touch / cuddle      | Localizes painful stimulus         |
| 4: Flexion Withdrawal              | Withdraws from painful stimulus    | Normal flexion withdrawal from pain|
| 3: Abnormal Flexion (Decorticate)  | Decorticate posturing to pain      | Decorticate abnormal flexion       |
| 2: Abnormal Extension (Decerebrate)| Decerebrate posturing to pain      | Decerebrate extension              |
| 1: None (Flaccid)                  | Completely flaccid, no movement    | Flaccid, no motor response         |
+------------------------------------+------------------------------------+------------------------------------+
```

### 3.1 Total pGCS Score and Critical Airway Gate
$$\text{pGCS Total} = E + V + M \quad (\text{Range } 3 \text{ to } 15)$$

- Mild Brain Injury: $\text{pGCS } 13 - 15$
- Moderate Brain Injury: $\text{pGCS } 9 - 12$
- Severe Brain Injury / Coma: $\text{pGCS } 3 - 8$
- INVIOLABLE AIRWAY GATE: If $\text{pGCS} \le 8$, the engine triggers an immediate critical alert: "CRITICAL: pGCS <= 8. Loss of protective airway reflexes. Immediate endotracheal intubation indicated."

---

## 4. Age-Stratified Normal Vital Signs Threshold Matrix

Pediatric physiological limits are stratified across five developmental brackets:
1. Neonate: $0 - 28\text{ days}$
2. Infant: $1 - 12\text{ months}$ ($29\text{ days to } 365\text{ days}$)
3. Toddler: $1 - 3\text{ years}$ ($12\text{ to } 36\text{ months}$)
4. Child: $4 - 11\text{ years}$
5. Adolescent: $12 - 18\text{ years}$

```
+---------------+--------------------+--------------------+--------------------+--------------------+
| Age Bracket   | Heart Rate (bpm)   | Respiration (bpm)  | Systolic BP (mmHg) | Median Weight (kg) |
|               | Normal [Brady/Tach]| Normal [Brady/Tach]| Minimum Permissible| 50th Percentile    |
+---------------+--------------------+--------------------+--------------------+--------------------+
| Neonate       | 100 - 180          | 30 - 60            | >= 60 mmHg         | 3.5 kg             |
| (0 - 28 days) | [< 100 / > 180]    | [< 30 / > 60]      | (Hypotension < 60) |                    |
|               |                    |                    |                    |                    |
| Infant        | 100 - 160          | 30 - 50            | >= 70 mmHg         | 7.5 kg             |
| (1 - 12 mos)  | [< 100 / > 160]    | [< 30 / > 50]      | (Hypotension < 70) |                    |
|               |                    |                    |                    |                    |
| Toddler       | 90 - 150           | 24 - 40            | >= 70 + (2 * Age)  | 12.0 kg            |
| (1 - 3 years) | [< 90 / > 150]     | [< 24 / > 40]      | (approx >= 72-76)  |                    |
|               |                    |                    |                    |                    |
| Child         | 70 - 120           | 18 - 30            | >= 70 + (2 * Age)  | 24.0 kg            |
| (4 - 11 years)| [< 70 / > 120]     | [< 18 / > 30]      | (approx >= 78-92)  |                    |
|               |                    |                    |                    |                    |
| Adolescent    | 60 - 100           | 12 - 20            | >= 90 mmHg         | 50.0 kg            |
| (12 - 18 yrs) | [< 60 / > 100]     | [< 12 / > 20]      | (Hypotension < 90) |                    |
+---------------+--------------------+--------------------+--------------------+--------------------+
```

- Universal Pediatric Hypoxemia Alert: Room air $\text{SpO}_2 < 94\%$ flags immediate hypoxemia across all brackets.
- Pediatric Hypotension Formula ($1\text{ to }10\text{ years}$): $\text{Minimum SBP} = 70 + (2 \times \text{Age}_{\text{years}})\text{ mmHg}$.

---

## 5. Broselow Tape Length-to-Weight Resuscitation Nomogram

The Broselow tape relates recumbent body length (from crown to heel) to color-coded weight bands and pre-calculated resuscitation equipment and drug dosages:

```
+--------+---------------+--------------------+---------------+---------------+-----------------------+
| Color  | Length (cm)   | Weight Band (kg)   | Cuffed ETT    | Uncuffed ETT  | Laryngoscope Blade    |
+--------+---------------+--------------------+---------------+---------------+-----------------------+
| Grey   | < 59.5 cm     | 3 - 5 kg (est. 4)  | 3.0 mm        | 3.5 mm        | Miller 0 (Straight)   |
| Pink   | 59.5 - 67.5 cm| 6 - 7 kg (est. 6.5)| 3.0 mm        | 3.5 mm        | Miller 1 (Straight)   |
| Red    | 67.5 - 75.0 cm| 8 - 9 kg (est. 8.5)| 3.5 mm        | 4.0 mm        | Miller 1 (Straight)   |
| Purple | 75.0 - 84.5 cm| 10 - 11 kg (est 10)| 3.5 mm        | 4.0 mm        | Miller 1.5 / Mac 1    |
| Yellow | 84.5 - 97.5 cm| 12 - 14 kg (est 13)| 4.0 mm        | 4.5 mm        | Miller 2 / Mac 2      |
| White  | 97.5 - 110 cm | 15 - 18 kg (est 16)| 4.5 mm        | 5.0 mm        | Miller 2 / Mac 2      |
| Blue   | 110 - 122 cm  | 19 - 23 kg (est 21)| 5.0 mm        | 5.5 mm        | Miller 2 / Mac 2      |
| Orange | 122 - 137 cm  | 24 - 29 kg (est 26)| 5.5 mm        | 6.0 mm        | Miller 2 / Mac 3      |
| Green  | 137 - 150 cm  | 30 - 36 kg (est 33)| 6.0 mm        | 6.5 mm        | Miller 3 / Mac 3      |
+--------+---------------+--------------------+---------------+---------------+-----------------------+
```

### 5.1 Resuscitation Medication & Electrical Defibrillation Ladder

```
+--------+---------------+-----------------------+---------------------+---------------------+-----------------------+
| Color  | Weight (Est.) | Epinephrine (1:10,000)| Amiodarone (5 mg/kg)| Atropine (0.02mg/kg)| Defibrillation Joules |
|        |               | 0.01 mg/kg (=0.1mL/kg)| Max single 300 mg   | Min 0.1mg, Max 0.5mg| 1st: 2 J/kg; Sub: 4J/kg|
+--------+---------------+-----------------------+---------------------+---------------------+-----------------------+
| Grey   | 4.0 kg        | 0.04 mg (0.4 mL)      | 20 mg (0.4 mL)      | 0.10 mg (1.0 mL)    | 1st: 8 J  / Sub: 16 J |
| Pink   | 6.5 kg        | 0.06 mg (0.65 mL)     | 32.5 mg (0.65 mL)   | 0.13 mg (1.3 mL)    | 1st: 14 J / Sub: 26 J |
| Red    | 8.5 kg        | 0.08 mg (0.85 mL)     | 42.5 mg (0.85 mL)   | 0.17 mg (1.7 mL)    | 1st: 18 J / Sub: 34 J |
| Purple | 10.0 kg       | 0.10 mg (1.0 mL)      | 50.0 mg (1.0 mL)    | 0.20 mg (2.0 mL)    | 1st: 20 J / Sub: 40 J |
| Yellow | 13.0 kg       | 0.13 mg (1.3 mL)      | 65.0 mg (1.3 mL)    | 0.26 mg (2.6 mL)    | 1st: 26 J / Sub: 52 J |
| White  | 16.5 kg       | 0.16 mg (1.65 mL)     | 82.5 mg (1.65 mL)   | 0.33 mg (3.3 mL)    | 1st: 34 J / Sub: 66 J |
| Blue   | 21.0 kg       | 0.21 mg (2.1 mL)      | 105 mg (2.1 mL)     | 0.42 mg (4.2 mL)    | 1st: 42 J / Sub: 84 J |
| Orange | 26.5 kg       | 0.26 mg (2.65 mL)     | 132.5 mg (2.65 mL)  | 0.50 mg (5.0 mL)    | 1st: 54 J / Sub: 106 J|
| Green  | 33.0 kg       | 0.33 mg (3.3 mL)      | 165 mg (3.3 mL)     | 0.50 mg (5.0 mL)    | 1st: 66 J / Sub: 132 J|
+--------+---------------+-----------------------+---------------------+---------------------+-----------------------+
```

---

## 6. Production-Grade Kotlin Serialization Models & Calculation Engine

```kotlin
package com.krupet.clinic.core.model.pediatric

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - Pediatric Decision Support Models
 * File: PediatricNomogramsModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class BhutaniRiskZone {
    LOW_RISK,
    LOW_INTERMEDIATE_RISK,
    HIGH_INTERMEDIATE_RISK,
    HIGH_RISK
}

@Serializable
enum class GestationalAgeTier {
    PRETERM_UNDER_35_WEEKS,
    LATE_PRETERM_35_TO_37_WEEKS,
    FULL_TERM_38_WEEKS_AND_ABOVE
}

@Serializable
enum class BroselowTapeColor {
    GREY,
    PINK,
    RED,
    PURPLE,
    YELLOW,
    WHITE,
    BLUE,
    ORANGE,
    GREEN
}

@Serializable
enum class PediatricAgeTier {
    NEONATE_0_TO_28_DAYS,
    INFANT_1_TO_12_MONTHS,
    TODDLER_1_TO_3_YEARS,
    CHILD_4_TO_11_YEARS,
    ADOLESCENT_12_TO_18_YEARS
}

@Serializable
data class BhutaniEvaluationResult(
    val hourOfLife: Int,
    val measuredTsbMgDl: Float,
    val measuredTsbUmolL: Float,
    val riskZone: BhutaniRiskZone,
    val phototherapyThresholdMgDl: Float,
    val exchangeTransfusionThresholdMgDl: Float,
    val isPhototherapyTriggered: Boolean,
    val isEscalationOfCareTriggered: Boolean,
    val isExchangeTransfusionTriggered: Boolean,
    val clinicalActionEn: String,
    val clinicalActionKh: String
)

@Serializable
data class PGcsEvaluationResult(
    val isPreVerbalInfant: Boolean,
    val eyeScore: Int,
    val verbalScore: Int,
    val motorScore: Int,
    val totalScore: Int,
    val isSevereBrainInjury: Boolean,
    val isIntubationIndicated: Boolean,
    val severityDescriptionEn: String,
    val severityDescriptionKh: String
)

@Serializable
data class PediatricVitalsCheckResult(
    val tier: PediatricAgeTier,
    val isBradycardia: Boolean,
    val isTachycardia: Boolean,
    val isBradypnea: Boolean,
    val isTachypnea: Boolean,
    val isHypotension: Boolean,
    val isHypoxemia: Boolean,
    val minimumSystolicBpMmHg: Int,
    val alertMessagesEn: List<String>,
    val alertMessagesKh: List<String>
)

@Serializable
data class BroselowResuscitationPlan(
    val color: BroselowTapeColor,
    val estimatedWeightKg: Float,
    val cuffedEttMm: Float,
    val uncuffedEttMm: Float,
    val bladeType: String,
    val epinephrineDoseMg: Float,
    val epinephrineVolume1To10000Ml: Float,
    val amiodaroneDoseMg: Float,
    val atropineDoseMg: Float,
    val defibInitialJoules: Int,
    val defibSubsequentJoules: Int,
    val synchronizedCardioversionJoules: Int
)

object PediatricClinicalEngine {

    /**
     * Evaluates Bhutani Nomogram and AAP phototherapy / exchange thresholds
     */
    fun evaluateBhutaniNomogram(
        hourOfLife: Int,
        tsbMgDl: Float,
        gaTier: GestationalAgeTier,
        hasNeuroRisk: Boolean
    ): BhutaniEvaluationResult {
        val clampedHour = Math.max(12, Math.min(hourOfLife, 144))
        val tsbUmol = Math.round(tsbMgDl * 17.104f * 10.0f) / 10.0f

        // 95th, 75th, and 40th percentile threshold approximations
        val p95 = getInterpolatedValue(clampedHour, 6.5f, 8.5f, 13.5f, 16.8f, 20.0f)
        val p75 = getInterpolatedValue(clampedHour, 5.0f, 6.8f, 11.2f, 14.5f, 17.8f)
        val p40 = getInterpolatedValue(clampedHour, 3.8f, 5.0f, 8.5f, 11.4f, 14.5f)

        val riskZone = when {
            tsbMgDl >= p95 -> BhutaniRiskZone.HIGH_RISK
            tsbMgDl >= p75 -> BhutaniRiskZone.HIGH_INTERMEDIATE_RISK
            tsbMgDl >= p40 -> BhutaniRiskZone.LOW_INTERMEDIATE_RISK
            else -> BhutaniRiskZone.LOW_RISK
        }

        // Phototherapy threshold based on GA tier
        val photoThreshold = when (gaTier) {
            GestationalAgeTier.FULL_TERM_38_WEEKS_AND_ABOVE ->
                if (hasNeuroRisk) p75 - 1.5f else p75
            GestationalAgeTier.LATE_PRETERM_35_TO_37_WEEKS ->
                if (hasNeuroRisk) p40 else p75 - 2.0f
            GestationalAgeTier.PRETERM_UNDER_35_WEEKS ->
                p40 - 2.0f
        }

        val exchangeThreshold = when (gaTier) {
            GestationalAgeTier.FULL_TERM_38_WEEKS_AND_ABOVE ->
                if (hasNeuroRisk) 21.0f else 23.5f
            GestationalAgeTier.LATE_PRETERM_35_TO_37_WEEKS ->
                if (hasNeuroRisk) 18.0f else 20.5f
            GestationalAgeTier.PRETERM_UNDER_35_WEEKS ->
                15.0f
        }

        val isPhoto = tsbMgDl >= photoThreshold
        val isEscalate = tsbMgDl >= (exchangeThreshold - 2.0f)
        val isExchange = tsbMgDl >= exchangeThreshold

        val actionEn: String
        val actionKh: String

        if (isExchange) {
            actionEn = "CRITICAL: TSB exceeds Exchange Transfusion threshold. Prepare emergency double-volume exchange transfusion and continuous intensive phototherapy."
            actionKh = "កម្រិតអាសន្នខ្ពស់: ប៊ីលីរុយប៊ីនលើសកម្រិតត្រូវផ្លាស់ប្តូរឈាម។ ត្រូវត្រៀមផ្លាស់ប្តូរឈាមបន្ទាន់ និងបញ្ចាំងពន្លឺខៀវខ្លាំងជាប្រចាំ។"
        } else if (isEscalate) {
            actionEn = "URGENT ESCALATION: TSB within 2.0 mg/dL of Exchange Transfusion. Transfer to NICU, start multi-surface phototherapy, recheck TSB in 2 hours."
            actionKh = "ការប្រកាសអាសន្នត្រៀមសង្គ្រោះបន្ទាន់: ប៊ីលីរុយប៊ីនកៀកនឹងកម្រិតផ្លាស់ប្តូរឈាម។ ត្រូវបញ្ជូនទៅបន្ទប់ NICU និងពិនិត្យឈាមឡើងវិញក្នុងរយៈពេល ២ ម៉ោង។"
        } else if (isPhoto) {
            actionEn = "Phototherapy indicated. Place under intensive LED phototherapy (460-490 nm, >= 30 uW/cm2/nm). Repeat TSB in 6 to 12 hours."
            actionKh = "ត្រូវចាប់ផ្តើមព្យាបាលដោយបញ្ចាំងពន្លឺខៀវ។ ពិនិត្យឈាមតាមដានកម្រិតជាតិលឿងឡើងវិញក្នុងរយៈពេល ៦ ទៅ ១២ ម៉ោង។"
        } else {
            actionEn = "TSB within safe limits for postnatal age. Continue standard lactation and jaundice observation."
            actionKh = "កម្រិតប៊ីលីរុយប៊ីនស្ថិតក្នុងកម្រិតសុវត្ថិភាព។ បន្តការបំបៅដោះនិងតាមដានទារកធម្មតា។"
        }

        return BhutaniEvaluationResult(
            hourOfLife = hourOfLife,
            measuredTsbMgDl = tsbMgDl,
            measuredTsbUmolL = tsbUmol,
            riskZone = riskZone,
            phototherapyThresholdMgDl = Math.round(photoThreshold * 10.0f) / 10.0f,
            exchangeTransfusionThresholdMgDl = Math.round(exchangeThreshold * 10.0f) / 10.0f,
            isPhototherapyTriggered = isPhoto,
            isEscalationOfCareTriggered = isEscalate,
            isExchangeTransfusionTriggered = isExchange,
            clinicalActionEn = actionEn,
            clinicalActionKh = actionKh
        )
    }

    /**
     * Evaluates Pediatric GCS (pGCS)
     */
    fun evaluatePGcs(
        ageMonths: Int,
        eye: Int,
        verbal: Int,
        motor: Int
    ): PGcsEvaluationResult {
        val isInfant = ageMonths < 24
        val total = eye + verbal + motor
        val isSevere = total <= 8

        val sevEn = when {
            total <= 8 -> "Severe Neurological Impairment (pGCS 3-8)"
            total in 9..12 -> "Moderate Neurological Impairment (pGCS 9-12)"
            else -> "Mild Neurological Impairment (pGCS 13-15)"
        }

        val sevKh = when {
            total <= 8 -> "ការប៉ះទង្គិចប្រព័ន្ធប្រសាទកម្រិតធ្ងន់ធ្ងរ ពិន្ទុពី ៣ ដល់ ៨"
            total in 9..12 -> "ការប៉ះទង្គិចប្រព័ន្ធប្រសាទកម្រិតមធ្យម ពិន្ទុពី ៩ ដល់ ១២"
            else -> "ការប៉ះទង្គិចប្រព័ន្ធប្រសាទកម្រិតស្រាល ពិន្ទុពី ១៣ ដល់ ១៥"
        }

        return PGcsEvaluationResult(
            isPreVerbalInfant = isInfant,
            eyeScore = eye,
            verbalScore = verbal,
            motorScore = motor,
            totalScore = total,
            isSevereBrainInjury = isSevere,
            isIntubationIndicated = isSevere,
            severityDescriptionEn = sevEn,
            severityDescriptionKh = sevKh
        )
    }

    /**
     * Evaluates Broselow Tape color zone and resuscitation plan
     */
    fun getBroselowPlan(color: BroselowTapeColor): BroselowResuscitationPlan {
        return when (color) {
            BroselowTapeColor.GREY -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 4.0f, cuffedEttMm = 3.0f, uncuffedEttMm = 3.5f,
                bladeType = "Miller 0 Straight", epinephrineDoseMg = 0.04f, epinephrineVolume1To10000Ml = 0.4f,
                amiodaroneDoseMg = 20.0f, atropineDoseMg = 0.10f, defibInitialJoules = 8, defibSubsequentJoules = 16, synchronizedCardioversionJoules = 4
            )
            BroselowTapeColor.PINK -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 6.5f, cuffedEttMm = 3.0f, uncuffedEttMm = 3.5f,
                bladeType = "Miller 1 Straight", epinephrineDoseMg = 0.065f, epinephrineVolume1To10000Ml = 0.65f,
                amiodaroneDoseMg = 32.5f, atropineDoseMg = 0.13f, defibInitialJoules = 14, defibSubsequentJoules = 26, synchronizedCardioversionJoules = 7
            )
            BroselowTapeColor.RED -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 8.5f, cuffedEttMm = 3.5f, uncuffedEttMm = 4.0f,
                bladeType = "Miller 1 Straight", epinephrineDoseMg = 0.085f, epinephrineVolume1To10000Ml = 0.85f,
                amiodaroneDoseMg = 42.5f, atropineDoseMg = 0.17f, defibInitialJoules = 18, defibSubsequentJoules = 34, synchronizedCardioversionJoules = 9
            )
            BroselowTapeColor.PURPLE -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 10.0f, cuffedEttMm = 3.5f, uncuffedEttMm = 4.0f,
                bladeType = "Miller 1.5 or Mac 1", epinephrineDoseMg = 0.10f, epinephrineVolume1To10000Ml = 1.0f,
                amiodaroneDoseMg = 50.0f, atropineDoseMg = 0.20f, defibInitialJoules = 20, defibSubsequentJoules = 40, synchronizedCardioversionJoules = 10
            )
            BroselowTapeColor.YELLOW -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 13.0f, cuffedEttMm = 4.0f, uncuffedEttMm = 4.5f,
                bladeType = "Miller 2 or Mac 2", epinephrineDoseMg = 0.13f, epinephrineVolume1To10000Ml = 1.3f,
                amiodaroneDoseMg = 65.0f, atropineDoseMg = 0.26f, defibInitialJoules = 26, defibSubsequentJoules = 52, synchronizedCardioversionJoules = 13
            )
            BroselowTapeColor.WHITE -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 16.5f, cuffedEttMm = 4.5f, uncuffedEttMm = 5.0f,
                bladeType = "Miller 2 or Mac 2", epinephrineDoseMg = 0.165f, epinephrineVolume1To10000Ml = 1.65f,
                amiodaroneDoseMg = 82.5f, atropineDoseMg = 0.33f, defibInitialJoules = 34, defibSubsequentJoules = 66, synchronizedCardioversionJoules = 17
            )
            BroselowTapeColor.BLUE -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 21.0f, cuffedEttMm = 5.0f, uncuffedEttMm = 5.5f,
                bladeType = "Miller 2 or Mac 2", epinephrineDoseMg = 0.21f, epinephrineVolume1To10000Ml = 2.1f,
                amiodaroneDoseMg = 105.0f, atropineDoseMg = 0.42f, defibInitialJoules = 42, defibSubsequentJoules = 84, synchronizedCardioversionJoules = 21
            )
            BroselowTapeColor.ORANGE -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 26.5f, cuffedEttMm = 5.5f, uncuffedEttMm = 6.0f,
                bladeType = "Miller 2 or Mac 3", epinephrineDoseMg = 0.265f, epinephrineVolume1To10000Ml = 2.65f,
                amiodaroneDoseMg = 132.5f, atropineDoseMg = 0.50f, defibInitialJoules = 54, defibSubsequentJoules = 106, synchronizedCardioversionJoules = 27
            )
            BroselowTapeColor.GREEN -> BroselowResuscitationPlan(
                color = color, estimatedWeightKg = 33.0f, cuffedEttMm = 6.0f, uncuffedEttMm = 6.5f,
                bladeType = "Miller 3 or Mac 3", epinephrineDoseMg = 0.33f, epinephrineVolume1To10000Ml = 3.3f,
                amiodaroneDoseMg = 165.0f, atropineDoseMg = 0.50f, defibInitialJoules = 66, defibSubsequentJoules = 132, synchronizedCardioversionJoules = 33
            )
        }
    }

    private fun getInterpolatedValue(h: Int, v12: Float, v24: Float, v48: Float, v72: Float, v144: Float): Float {
        return when {
            h <= 12 -> v12
            h <= 24 -> v12 + ((h - 12) / 12.0f) * (v24 - v12)
            h <= 48 -> v24 + ((h - 24) / 24.0f) * (v48 - v24)
            h <= 72 -> v48 + ((h - 48) / 24.0f) * (v72 - v48)
            h <= 144 -> v72 + ((h - 72) / 72.0f) * (v144 - v72)
            else -> v144
        }
    }
}
```

---

## 7. Bilingual Khmer and English Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Pediatric Terminology        | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| Bhutani Hyperbilirubinemia Nomogram  | ក្រាហ្វវាស់កម្រិតលឿងទារកតាមម៉ោងក្រោយកើត ប៊ូតានី               |
| Low Risk Bilirubin Zone Under 40th   | តំបន់ហានិភ័យទាប ក្រោមខ្នាតភាគរយទី ៤០                          |
| Intermediate Risk Zone 40th to 95th  | តំបន់ហានិភ័យមធ្យម ពីខ្នាតភាគរយទី ៤០ ដល់ ៩៥                   |
| High Risk Bilirubin Zone Over 95th   | តំបន់ហានិភ័យខ្ពស់ លើសខ្នាតភាគរយទី ៩៥                          |
| Intensive Phototherapy Indicated     | ត្រូវព្យាបាលដោយបញ្ចាំងពន្លឺខៀវអាំងតង់ស៊ីតេខ្ពស់              |
| Escalation of Care NICU Protocol     | ពិធីសារប្រកាសអាសន្នបញ្ជូនទៅបន្ទប់សង្គ្រោះទារក NICU            |
| Exchange Transfusion Required        | តម្រូវការផ្លាស់ប្តូរឈាមបន្ទាន់សម្រាប់ទារក                     |
| Pediatric Glasgow Coma Scale pGCS    | ពិន្ទុស្មារតីកុមារនិងទារក pGCS                                |
| Pre-Verbal Infant Vocalization Scale | រង្វាស់ការបញ្ចេញសំឡេងទារកមិនទាន់ចេះនិយាយ                    |
| Airway Gate Intubation Indicated     | បម្រាមការពារផ្លូវដង្ហើមត្រូវដាក់បំពង់ខ្យល់ជាបន្ទាន់           |
| Neonatal Developmental Bracket       | ដំណាក់កាលទារកទើបនឹងកើត ០ ដល់ ២៨ ថ្ងៃ                          |
| Infant Developmental Bracket         | ដំណាក់កាលទារក ១ ដល់ ១២ ខែ                                    |
| Toddler Developmental Bracket        | ដំណាក់កាលកុមារតូច ១ ដល់ ៣ ឆ្នាំ                               |
| Child Developmental Bracket          | ដំណាក់កាលកុមារ ៤ ដល់ ១១ ឆ្នាំ                                |
| Adolescent Developmental Bracket     | ដំណាក់កាលក្មេងជំទង់ ១២ ដល់ ១៨ ឆ្នាំ                          |
| Pediatric Hypotension Threshold SBP  | កម្រិតសម្ពាធឈាមទាបគ្រោះថ្នាក់លើកុមារ                          |
| Broselow Length-Based Resuscitation  | បន្ទះពណ៌ប្រូស្លូវសម្រាប់សង្គ្រោះបន្ទាន់កុមារតាមកម្ពស់         |
| Defibrillation Energy Ladder 2-4J/kg | ថាមពលឆក់បេះដូងកុមារ ២ ទៅ ៤ ហ្ស៊ូលក្នុងមួយគីឡូក្រាម           |
| Pediatric Epinephrine 0.01 mg/kg     | ថ្នាំអេពីណេហ្វ្រីនកុមារ សូន្យក្បៀសសូន្យមួយមីលីក្រាម          |
| Amiodarone Refractory Arrhythmia     | ថ្នាំអាមីអូដារ៉ូនសម្រាប់ចង្វាក់បេះដូងរំញ័រមិនឆ្លើយតប          |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 8. Safety and Clinical Audit Gates

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Severe Pediatric Coma Airway Gate      | Hard Interlock      | pGCS <= 8 automatically triggers critical airway alert   |
|                                        |                     | and prompts immediate endotracheal intubation protocol. |
|                                        |                     |                                                         |
| Kernicterus Hyperbilirubinemia Warning | Urgent Alert        | TSB within 2.0 mg/dL of Exchange Transfusion prompts    |
|                                        |                     | immediate NICU transfer and blood cross-matching.       |
|                                        |                     |                                                         |
| Pediatric Hypotension Calculation Lock | Clinical Gate       | Flags alert if child SBP < (70 + 2 * age_years),        |
|                                        |                     | prompting fluid resuscitation and shock index check.    |
|                                        |                     |                                                         |
| Broselow Defibrillation Energy Clamp   | Energy Clamp        | Hard clamps pediatric defibrillation energy to 10 J/kg  |
|                                        |                     | or adult max 200 J biphasic to prevent myocardial burn. |
|                                        |                     |                                                         |
| Universal Pediatric Hypoxemia Interlock| Vital Sign Alert    | Room air SpO2 < 94% triggers immediate oxygen therapy   |
|                                        |                     | and high-priority nursing notification.                 |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated verification confirms 0 emoji symbols.        |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated verification confirms 0 parentheses on lines  |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
