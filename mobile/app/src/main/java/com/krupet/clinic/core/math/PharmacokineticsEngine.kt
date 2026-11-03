package com.krupet.clinic.core.math

import kotlin.math.roundToInt

/**
 * KruPet Native Clinical Pharmacokinetics & Antimicrobial Stewardship Engine.
 * Pure Kotlin, zero-dependency clinical algorithms:
 * 1. Cockcroft-Gault Creatinine Clearance (CrCl) with Devine IBW & AdjBW
 * 2. Vancomycin Area Under Curve (AUC24/MIC) Bayesian Target (400-600 mg*h/L)
 * 3. Antimicrobial Stewardship Program (ASP) Metrics: DOT, LOT, SAAR
 * 4. Procalcitonin (PCT) Kinetics Cessation Algorithm
 * 5. IV-to-Oral (PO) Step-down Suitability Validator
 */
object PharmacokineticsEngine {

    enum class BiologicalSex {
        MALE,
        FEMALE
    }

    /**
     * Compute Ideal Body Weight (IBW) using Devine formula.
     * Height in cm converted to inches over 60.
     */
    fun calculateIbwKg(heightCm: Double, sex: BiologicalSex): Double {
        val totalInches = heightCm / 2.54
        val inchesOver60 = (totalInches - 60.0).coerceAtLeast(0.0)
        val baseIbw = if (sex == BiologicalSex.MALE) 50.0 else 45.5
        return baseIbw + (2.3 * inchesOver60)
    }

    /**
     * Compute Adjusted Body Weight (AdjBW) for obese patients (Actual > 120% IBW).
     */
    fun calculateAdjBwKg(actualWeightKg: Double, ibwKg: Double): Double {
        return if (actualWeightKg > (1.2 * ibwKg)) {
            ibwKg + (0.4 * (actualWeightKg - ibwKg))
        } else {
            actualWeightKg
        }
    }

    /**
     * Cockcroft-Gault Creatinine Clearance (CrCl) in mL/min.
     * Dosing Weight Selection:
     * - Underweight (Actual < IBW): Use Actual Weight
     * - Normal weight (Actual 100-120% IBW): Use IBW
     * - Obese (Actual > 120% IBW): Use Adjusted Body Weight
     */
    fun calculateCockcroftGaultCrCl(
        ageYears: Int,
        actualWeightKg: Double,
        heightCm: Double,
        serumCreatinineMgDl: Double,
        sex: BiologicalSex
    ): Double {
        val safeScr = serumCreatinineMgDl.coerceAtLeast(0.4)
        val ibw = calculateIbwKg(heightCm, sex)
        val dosingWeight = when {
            actualWeightKg < ibw -> actualWeightKg
            actualWeightKg > (1.2 * ibw) -> calculateAdjBwKg(actualWeightKg, ibw)
            else -> ibw
        }

        val baseCrCl = ((140.0 - ageYears) * dosingWeight) / (72.0 * safeScr)
        return if (sex == BiologicalSex.FEMALE) baseCrCl * 0.85 else baseCrCl
    }

    /**
     * Vancomycin 24-hour Area Under the Curve (AUC24/MIC) Estimation.
     * Target: 400 - 600 mg*h/L for severe MRSA infections (Infectious Diseases Society of America guidelines).
     * Ke = 0.00083 * CrCl + 0.0044
     * Vd = 0.7 L/kg * Weight
     * Clearance (CL) = Ke * Vd (L/hr)
     * AUC24 = Total Daily Dose (mg) / Clearance (L/hr)
     */
    data class VancomycinAucResult(
        val estimatedAuc24: Double,
        val targetMet: Boolean,
        val category: AucCategory,
        val recommendation: String
    ) {
        enum class AucCategory {
            SUBTHERAPEUTIC, // < 400: Risk of clinical treatment failure
            OPTIMAL,        // 400 - 600: Maximum efficacy, minimal nephrotoxicity
            SUPRATHERAPEUTIC // > 600: High risk of acute kidney injury (nephrotoxicity)
        }
    }

    fun estimateVancomycinAuc24(
        totalDailyDoseMg: Double,
        crClMlMin: Double,
        patientWeightKg: Double,
        micMgL: Double = 1.0
    ): VancomycinAucResult {
        val ke = (0.00083 * crClMlMin) + 0.0044
        val vd = 0.7 * patientWeightKg
        val clLitersPerHr = (ke * vd).coerceAtLeast(0.5)

        val auc24 = totalDailyDoseMg / clLitersPerHr
        val aucOverMic = auc24 / micMgL.coerceAtLeast(0.5)

        val (category, rec) = when {
            aucOverMic < 400.0 -> Pair(
                VancomycinAucResult.AucCategory.SUBTHERAPEUTIC,
                "AUC < 400 mg*h/L: Subtherapeutic exposure. Increase total daily dose or shorten dosing interval."
            )
            aucOverMic > 600.0 -> Pair(
                VancomycinAucResult.AucCategory.SUPRATHERAPEUTIC,
                "AUC > 600 mg*h/L: Nephrotoxicity danger zone. Decrease total daily dose or lengthen interval."
            )
            else -> Pair(
                VancomycinAucResult.AucCategory.OPTIMAL,
                "AUC 400-600 mg*h/L: Optimal therapeutic window achieved. Maintain current regimen with serial SCr monitoring."
            )
        }

        return VancomycinAucResult(
            estimatedAuc24 = aucOverMic,
            targetMet = category == VancomycinAucResult.AucCategory.OPTIMAL,
            category = category,
            recommendation = rec
        )
    }

    /**
     * Antimicrobial Stewardship Program (ASP) Metrics:
     * - Days of Therapy (DOT): Sum of days each antimicrobial agent was received.
     * - Length of Therapy (LOT): Number of distinct calendar days patient received any systemic antibiotic.
     * - Standardized Antimicrobial Administration Ratio (SAAR): Observed DOT / Predicted DOT.
     */
    data class AspMetricsResult(
        val dotTotal: Int,
        val lotTotal: Int,
        val saarRatio: Double,
        val saarCategory: SaarCategory
    ) {
        enum class SaarCategory {
            OPTIMAL,               // SAAR < 0.70
            BENCHMARK,             // SAAR 0.70 - 1.00
            HIGH_CONSUMPTION,      // SAAR 1.01 - 1.30
            CRITICAL_OVERUTILIZATION // SAAR > 1.30
        }
    }

    fun calculateAspMetrics(
        agentDays: List<Int>,
        distinctCalendarDays: Int,
        predictedDot: Double
    ): AspMetricsResult {
        val totalDot = agentDays.sum()
        val totalLot = distinctCalendarDays
        val saar = if (predictedDot > 0) totalDot.toDouble() / predictedDot else 1.0

        val category = when {
            saar > 1.30 -> AspMetricsResult.SaarCategory.CRITICAL_OVERUTILIZATION
            saar in 1.01..1.30 -> AspMetricsResult.SaarCategory.HIGH_CONSUMPTION
            saar in 0.70..1.00 -> AspMetricsResult.SaarCategory.BENCHMARK
            else -> AspMetricsResult.SaarCategory.OPTIMAL
        }

        return AspMetricsResult(
            dotTotal = totalDot,
            lotTotal = totalLot,
            saarRatio = saar,
            saarCategory = category
        )
    }

    /**
     * Procalcitonin (PCT) Kinetics Cessation Algorithm.
     * If Delta PCT >= 80% reduction from peak or absolute PCT < 0.25 mcg/L,
     * strong recommendation to de-escalate or discontinue empiric antibiotics.
     */
    data class PctKineticsResult(
        val deltaPercentage: Double,
        val recommendation: String,
        val cessationAdvised: Boolean
    )

    fun evaluatePctKinetics(
        baselinePctMcgL: Double,
        currentPctMcgL: Double,
        isHemodynamicallyStable: Boolean,
        isAfebrileOver24h: Boolean
    ): PctKineticsResult {
        val delta = if (baselinePctMcgL > 0) {
            ((baselinePctMcgL - currentPctMcgL) / baselinePctMcgL) * 100.0
        } else {
            0.0
        }

        val isCessationIndicated = (delta >= 80.0 || currentPctMcgL < 0.25) &&
                isHemodynamicallyStable && isAfebrileOver24h

        val rec = when {
            isCessationIndicated -> "Strong recommendation to discontinue antimicrobial therapy. PCT decreased by >=80% with resolved clinical signs."
            delta >= 80.0 && (!isHemodynamicallyStable || !isAfebrileOver24h) -> "Consider de-escalation: Biomarker clearance achieved, but clinical instability or fever persists."
            currentPctMcgL >= baselinePctMcgL -> "WARNING: Procalcitonin rising. Suspect treatment failure, superinfection, or uncontrolled septic source."
            else -> "Continue current antimicrobial regimen with repeat PCT in 48 hours."
        }

        return PctKineticsResult(
            deltaPercentage = delta,
            recommendation = rec,
            cessationAdvised = isCessationIndicated
        )
    }

    /**
     * IV-to-Oral (PO) Step-down Suitability Validator.
     */
    data class IvToPoCriteria(
        val ivDurationHours: Int,
        val isAfebrileOver24h: Boolean,
        val isHemodynamicallyStable: Boolean,
        val isGastrointestinalTractFunctional: Boolean,
        val hasOralBioequivalent: Boolean
    )

    data class IvToPoResult(
        val isEligible: Boolean,
        val contraindicationReason: String? = null
    )

    fun validateIvToPoSwitch(criteria: IvToPoCriteria): IvToPoResult {
        if (criteria.ivDurationHours < 48) {
            return IvToPoResult(false, "Patient has received IV antibiotics for less than 48 hours.")
        }
        if (!criteria.isAfebrileOver24h) {
            return IvToPoResult(false, "Patient has not been afebrile for at least 24 consecutive hours.")
        }
        if (!criteria.isHemodynamicallyStable) {
            return IvToPoResult(false, "Patient remains hemodynamically unstable or requires vasopressor support.")
        }
        if (!criteria.isGastrointestinalTractFunctional) {
            return IvToPoResult(false, "Gastrointestinal tract is non-functional or severe malabsorption present.")
        }
        if (!criteria.hasOralBioequivalent) {
            return IvToPoResult(false, "No suitable bioequivalent oral formulation available for this pathogen.")
        }

        return IvToPoResult(true, null)
    }
}
