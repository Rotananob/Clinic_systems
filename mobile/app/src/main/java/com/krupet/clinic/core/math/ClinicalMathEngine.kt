package com.krupet.clinic.core.math

import kotlin.math.roundToInt

/**
 * KruPet Clinical Mathematical & Resuscitation Engine (Pure Kotlin)
 * Zero external dependencies, deterministic clinical algorithms.
 */
object ClinicalMathEngine {

    // 1. Sepsis Resuscitation (Surviving Sepsis Campaign 2021)
    data class SepsisResuscitationResult(
        val weightKg: Double,
        val totalFluidMl: Double,
        val fluidType: String,
        val infusionRateMlPerHour: Double,
        val targetMapMmHg: Int,
        val isLactateElevated: Boolean,
        val clinicalRationale: String
    )

    fun calculateSepsisFluid(weightKg: Double, initialLactateMmolL: Double = 0.0): SepsisResuscitationResult {
        require(weightKg > 0) { "Weight must be greater than 0 kg" }
        val totalFluid = (weightKg * 30.0).roundToInt().toDouble()
        val infusionRate = (totalFluid / 3.0).roundToInt().toDouble() // completed within 3 hours
        val isElevated = initialLactateMmolL > 2.0

        val rationale = "Lactated Ringer is preferred over 0.9% Normal Saline to prevent hyperchloremic acidosis and renal vasoconstriction."

        return SepsisResuscitationResult(
            weightKg = weightKg,
            totalFluidMl = totalFluid,
            fluidType = "Lactated Ringer / Plasma-Lyte (Balanced Crystalloid)",
            infusionRateMlPerHour = infusionRate,
            targetMapMmHg = 65,
            isLactateElevated = isElevated,
            clinicalRationale = rationale
        )
    }

    // 2. Shock Index & Critical Acuity Stratification
    data class ShockIndexResult(
        val shockIndex: Double,
        val isSevereShock: Boolean,
        val clinicalInterpretation: String
    )

    fun calculateShockIndex(heartRateBpm: Int, systolicBpMmHg: Int): ShockIndexResult {
        require(systolicBpMmHg > 0) { "Systolic BP must be greater than 0 mmHg" }
        val rawSi = heartRateBpm.toDouble() / systolicBpMmHg.toDouble()
        val si = (rawSi * 100.0).roundToInt() / 100.0
        val isSevere = si >= 0.9

        val interpretation = when {
            si < 0.7 -> "Normal hemodynamic profile"
            si < 0.9 -> "Mild occult hypoperfusion risk"
            else -> "Severe shock state: high risk of occult hypoperfusion and mortality"
        }

        return ShockIndexResult(
            shockIndex = si,
            isSevereShock = isSevere,
            clinicalInterpretation = interpretation
        )
    }

    // 3. Parkland Burn Resuscitation Formula (Baxter Protocol)
    data class ParklandResult(
        val totalFluid24hMl: Double,
        val first8HoursFluidMl: Double,
        val first8HoursRateMlPerHour: Double,
        val remaining16HoursFluidMl: Double,
        val remaining16HoursRateMlPerHour: Double,
        val targetUrineOutputMlPerHourMin: Double,
        val targetUrineOutputMlPerHourMax: Double,
        val timingWarning: String
    )

    fun calculateParkland(
        weightKg: Double,
        tbsaPercentage: Double,
        hoursSinceBurn: Double = 0.0
    ): ParklandResult {
        require(weightKg > 0) { "Weight must be greater than 0 kg" }
        require(tbsaPercentage in 1.0..100.0) { "TBSA must be between 1% and 100%" }

        val total = (4.0 * weightKg * tbsaPercentage).roundToInt().toDouble()
        val first8 = total / 2.0
        val remaining16 = total / 2.0

        val remainingFirst8Hours = (8.0 - hoursSinceBurn).coerceAtLeast(0.5)
        val first8Rate = (first8 / remainingFirst8Hours).roundToInt().toDouble()
        val next16Rate = (remaining16 / 16.0).roundToInt().toDouble()

        val uoMin = (weightKg * 0.5 * 10.0).roundToInt() / 10.0
        val uoMax = (weightKg * 1.0 * 10.0).roundToInt() / 10.0

        val warning = if (hoursSinceBurn > 0) {
            "First 8h starts strictly from the time of burn injury, not hospital arrival. Remaining time for phase 1: $remainingFirst8Hours hours."
        } else {
            "First 8h begins at time of injury."
        }

        return ParklandResult(
            totalFluid24hMl = total,
            first8HoursFluidMl = first8,
            first8HoursRateMlPerHour = first8Rate,
            remaining16HoursFluidMl = remaining16,
            remaining16HoursRateMlPerHour = next16Rate,
            targetUrineOutputMlPerHourMin = uoMin,
            targetUrineOutputMlPerHourMax = uoMax,
            timingWarning = warning
        )
    }

    // 4. Pediatric & Neonatal Pharmacotherapy Nomograms
    object PediatricNomogram {

        fun clarksRule(weightPounds: Double, adultDoseMg: Double): Double {
            require(weightPounds > 0) { "Weight in lbs must be greater than 0" }
            val raw = (weightPounds / 150.0) * adultDoseMg
            return (raw * 100.0).roundToInt() / 100.0
        }

        fun youngsRule(ageYears: Double, adultDoseMg: Double): Double {
            require(ageYears > 0) { "Age in years must be greater than 0" }
            val raw = (ageYears / (ageYears + 12.0)) * adultDoseMg
            return (raw * 100.0).roundToInt() / 100.0
        }

        fun friedsRule(ageMonths: Int, adultDoseMg: Double): Double {
            require(ageMonths > 0) { "Age in months must be greater than 0" }
            val raw = (ageMonths.toDouble() / 150.0) * adultDoseMg
            return (raw * 100.0).roundToInt() / 100.0
        }

        // Bhutani Phototherapy Risk Stratification (Total Serum Bilirubin mg/dL at postnatal hours)
        fun bhutaniRiskZone(postnatalHours: Int, totalBilirubinMgDl: Double): String {
            require(postnatalHours >= 12) { "Postnatal age must be at least 12 hours" }

            // 95th, 75th, and 40th percentile threshold approximations (AAP / Bhutani 2022)
            val p95 = when {
                postnatalHours < 24 -> 8.0
                postnatalHours < 48 -> 12.0
                postnatalHours < 72 -> 15.5
                else -> 17.5
            }
            val p75 = when {
                postnatalHours < 24 -> 6.5
                postnatalHours < 48 -> 10.0
                postnatalHours < 72 -> 13.5
                else -> 15.0
            }
            val p40 = when {
                postnatalHours < 24 -> 5.0
                postnatalHours < 48 -> 8.0
                postnatalHours < 72 -> 11.0
                else -> 13.0
            }

            return when {
                totalBilirubinMgDl >= p95 -> "HIGH RISK (Above 95th Percentile: Phototherapy Indicated)"
                totalBilirubinMgDl >= p75 -> "HIGH INTERMEDIATE RISK (75th-95th Percentile: Close Monitoring)"
                totalBilirubinMgDl >= p40 -> "LOW INTERMEDIATE RISK (40th-75th Percentile)"
                else -> "LOW RISK (Below 40th Percentile)"
            }
        }
    }

    // 5. CRASH-2 Tranexamic Acid (TXA) Hard Window Validation
    data class TxaEligibility(
        val isEligible: Boolean,
        val reason: String,
        val loadingDoseGram: Double,
        val maintenanceDoseGram: Double
    )

    fun evaluateTxaWindow(minutesSinceTrauma: Int): TxaEligibility {
        return if (minutesSinceTrauma <= 180) {
            TxaEligibility(
                isEligible = true,
                reason = "Eligible: Within strict 3-hour (180 min) CRASH-2 trauma resuscitation window.",
                loadingDoseGram = 1.0, // 1g IV over 10 min
                maintenanceDoseGram = 1.0 // 1g IV over 8h
            )
        } else {
            TxaEligibility(
                isEligible = false,
                reason = "Contraindicated: Exceeds 3-hour window ($minutesSinceTrauma min). Administration after 3h increases thrombotic mortality.",
                loadingDoseGram = 0.0,
                maintenanceDoseGram = 0.0
            )
        }
    }
}
