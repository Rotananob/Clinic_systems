package com.krupet.clinic.core.math

/**
 * KruPet Native Clinical Triage & Early Warning Scoring Engine.
 * Pure Kotlin, zero-dependency clinical algorithms:
 * 1. Royal College of Physicians NEWS2 (National Early Warning Score 2)
 * 2. Glasgow Coma Scale (GCS 3-15)
 * 3. Emergency Severity Index (ESI Version 4)
 * 4. Pediatric Vital Sign Thresholds (APLS / PALS age brackets)
 */
object TriageAssessmentEngine {

    enum class ConsciousnessLevel {
        ALERT,
        CONFUSED_OR_NEW_VOICE,
        RESPONDS_TO_PAIN,
        UNRESPONSIVE
    }

    data class News2Input(
        val respirationRate: Int,
        val spO2Percentage: Double,
        val onSupplementalOxygen: Boolean,
        val systolicBloodPressure: Int,
        val pulseRate: Int,
        val consciousness: ConsciousnessLevel,
        val temperatureCelsius: Double,
        val isHypercapnicRespiratoryFailureTarget: Boolean = false // Scale 2 for COPD target 88-92%
    )

    data class News2Result(
        val totalScore: Int,
        val respirationScore: Int,
        val spO2Score: Int,
        val oxygenScore: Int,
        val systolicBpScore: Int,
        val pulseScore: Int,
        val consciousnessScore: Int,
        val temperatureScore: Int,
        val clinicalRiskCategory: RiskCategory,
        val responseRecommendation: String
    ) {
        enum class RiskCategory {
            LOW,          // Score 0-4
            LOW_MEDIUM,   // Score 3 in single parameter
            MEDIUM,       // Score 5-6
            HIGH          // Score 7 or more
        }
    }

    /**
     * Compute RCP NEWS2 Score.
     * Guidelines:
     * - Respiration rate (bpm): <=8: 3, 9-11: 1, 12-20: 0, 21-24: 2, >=25: 3
     * - SpO2 Scale 1: <=91: 3, 92-93: 2, 94-95: 1, >=96: 0
     * - SpO2 Scale 2 (Hypercapnic): <=83: 3, 84-85: 2, 86-87: 1, 88-92: 0, 93-94 (on O2): 1, 95-96 (on O2): 2, >=97 (on O2): 3
     * - Air or Oxygen: Room air: 0, Supplemental O2: 2
     * - Systolic BP (mmHg): <=90: 3, 91-100: 2, 101-110: 1, 111-219: 0, >=220: 3
     * - Pulse (bpm): <=40: 3, 41-50: 1, 51-90: 0, 91-110: 1, 111-130: 2, >=131: 3
     * - Consciousness: Alert: 0, CVPU: 3
     * - Temperature (C): <=35.0: 3, 35.1-36.0: 1, 36.1-38.0: 0, 38.1-39.0: 1, >=39.1: 2
     */
    fun calculateNews2(input: News2Input): News2Result {
        val respScore = when {
            input.respirationRate <= 8 -> 3
            input.respirationRate in 9..11 -> 1
            input.respirationRate in 12..20 -> 0
            input.respirationRate in 21..24 -> 2
            else -> 3
        }

        val spo2Score = if (!input.isHypercapnicRespiratoryFailureTarget) {
            when {
                input.spO2Percentage <= 91.0 -> 3
                input.spO2Percentage in 92.0..93.0 -> 2
                input.spO2Percentage in 94.0..95.0 -> 1
                else -> 0
            }
        } else {
            // Scale 2 for COPD with hypercapnic respiratory drive
            when {
                input.spO2Percentage <= 83.0 -> 3
                input.spO2Percentage in 84.0..85.0 -> 2
                input.spO2Percentage in 86.0..87.0 -> 1
                input.spO2Percentage in 88.0..92.0 -> 0
                input.spO2Percentage in 93.0..94.0 -> if (input.onSupplementalOxygen) 1 else 0
                input.spO2Percentage in 95.0..96.0 -> if (input.onSupplementalOxygen) 2 else 0
                else -> if (input.onSupplementalOxygen) 3 else 0
            }
        }

        val oxygenScore = if (input.onSupplementalOxygen) 2 else 0

        val sbpScore = when {
            input.systolicBloodPressure <= 90 -> 3
            input.systolicBloodPressure in 91..100 -> 2
            input.systolicBloodPressure in 101..110 -> 1
            input.systolicBloodPressure in 111..219 -> 0
            else -> 3
        }

        val pulseScore = when {
            input.pulseRate <= 40 -> 3
            input.pulseRate in 41..50 -> 1
            input.pulseRate in 51..90 -> 0
            input.pulseRate in 91..110 -> 1
            input.pulseRate in 111..130 -> 2
            else -> 3
        }

        val cvpuScore = when (input.consciousness) {
            ConsciousnessLevel.ALERT -> 0
            else -> 3
        }

        val tempScore = when {
            input.temperatureCelsius <= 35.0 -> 3
            input.temperatureCelsius in 35.1..36.0 -> 1
            input.temperatureCelsius in 36.1..38.0 -> 0
            input.temperatureCelsius in 38.1..39.0 -> 1
            else -> 2
        }

        val total = respScore + spo2Score + oxygenScore + sbpScore + pulseScore + cvpuScore + tempScore

        val hasSingleParameterScore3 = respScore == 3 || spo2Score == 3 || sbpScore == 3 ||
                pulseScore == 3 || cvpuScore == 3 || tempScore == 3

        val (risk, recommendation) = when {
            total >= 7 -> Pair(
                News2Result.RiskCategory.HIGH,
                "Emergency response: Immediate assessment by clinical team or ICU outreach with continuous vital monitoring."
            )
            total in 5..6 -> Pair(
                News2Result.RiskCategory.MEDIUM,
                "Urgent response: Ward-based doctor review within 30 minutes, increase observation to at least hourly."
            )
            hasSingleParameterScore3 -> Pair(
                News2Result.RiskCategory.LOW_MEDIUM,
                "Targeted review: Single extreme red score of 3 requires registered nurse escalation and physician review."
            )
            else -> Pair(
                News2Result.RiskCategory.LOW,
                "Routine monitoring: Minimum 12-hourly observation frequency."
            )
        }

        return News2Result(
            totalScore = total,
            respirationScore = respScore,
            spO2Score = spo2Score,
            oxygenScore = oxygenScore,
            systolicBpScore = sbpScore,
            pulseScore = pulseScore,
            consciousnessScore = cvpuScore,
            temperatureScore = tempScore,
            clinicalRiskCategory = risk,
            responseRecommendation = recommendation
        )
    }

    /**
     * Glasgow Coma Scale (GCS)
     * Eye: 1-4
     * Verbal: 1-5
     * Motor: 1-6
     * Total: 3-15
     */
    data class GcsInput(
        val eyeOpening: Int,
        val verbalResponse: Int,
        val motorResponse: Int
    )

    data class GcsResult(
        val totalScore: Int,
        val severityCategory: Severity,
        val airwayProtectionIndicated: Boolean
    ) {
        enum class Severity {
            SEVERE_BRAIN_INJURY,    // GCS 3-8
            MODERATE_BRAIN_INJURY,  // GCS 9-12
            MILD_BRAIN_INJURY       // GCS 13-15
        }
    }

    fun calculateGcs(input: GcsInput): GcsResult {
        val eye = input.eyeOpening.coerceIn(1, 4)
        val verbal = input.verbalResponse.coerceIn(1, 5)
        val motor = input.motorResponse.coerceIn(1, 6)
        val total = eye + verbal + motor

        val severity = when {
            total <= 8 -> GcsResult.Severity.SEVERE_BRAIN_INJURY
            total in 9..12 -> GcsResult.Severity.MODERATE_BRAIN_INJURY
            else -> GcsResult.Severity.MILD_BRAIN_INJURY
        }

        // Standard trauma clinical aphorism: GCS 8 or less: intubate
        val airwayProtection = total <= 8

        return GcsResult(
            totalScore = total,
            severityCategory = severity,
            airwayProtectionIndicated = airwayProtection
        )
    }

    /**
     * Emergency Severity Index (ESI v4)
     * Algorithm Decision Tree:
     * A: Requires immediate life-saving intervention? -> Level 1 (Resuscitation)
     * B: High risk situation, confused/lethargic/disoriented, or severe pain/distress? -> Level 2 (Emergent)
     * C: Resource prediction (0 -> Level 5, 1 -> Level 4, >=2 -> Level 3)
     * D: Vital sign danger zone upgrade check for Level 3 to Level 2.
     */
    enum class EsiLevel(val code: Int, val description: String) {
        LEVEL_1_RESUSCITATION(1, "Level 1 Immediate Resuscitation"),
        LEVEL_2_EMERGENT(2, "Level 2 Emergent High Risk"),
        LEVEL_3_URGENT(3, "Level 3 Urgent Multiple Resources"),
        LEVEL_4_LESS_URGENT(4, "Level 4 Less Urgent Single Resource"),
        LEVEL_5_NON_URGENT(5, "Level 5 Non-Urgent No Resources")
    }

    data class EsiInput(
        val requiresImmediateLifeSaving: Boolean,
        val isHighRiskOrConfusedOrSeverePain: Boolean,
        val predictedResourceCount: Int,
        val ageYears: Int,
        val heartRateBpm: Int,
        val respiratoryRateBpm: Int,
        val spO2Percentage: Double
    )

    fun calculateEsi(input: EsiInput): EsiLevel {
        if (input.requiresImmediateLifeSaving) {
            return EsiLevel.LEVEL_1_RESUSCITATION
        }

        if (input.isHighRiskOrConfusedOrSeverePain) {
            return EsiLevel.LEVEL_2_EMERGENT
        }

        val baseLevel = when {
            input.predictedResourceCount == 0 -> EsiLevel.LEVEL_5_NON_URGENT
            input.predictedResourceCount == 1 -> EsiLevel.LEVEL_4_LESS_URGENT
            else -> EsiLevel.LEVEL_3_URGENT
        }

        // Vital sign danger zone: If patient is in Level 3, check abnormal vitals to consider upgrade to Level 2
        if (baseLevel == EsiLevel.LEVEL_3_URGENT) {
            val isVitalInDangerZone = when {
                input.ageYears >= 8 -> {
                    input.heartRateBpm > 100 || input.respiratoryRateBpm > 20 || input.spO2Percentage < 92.0
                }
                input.ageYears in 3..7 -> {
                    input.heartRateBpm > 140 || input.respiratoryRateBpm > 30 || input.spO2Percentage < 92.0
                }
                input.ageYears in 1..2 -> {
                    input.heartRateBpm > 160 || input.respiratoryRateBpm > 40 || input.spO2Percentage < 92.0
                }
                else -> { // < 1 year
                    input.heartRateBpm > 180 || input.respiratoryRateBpm > 50 || input.spO2Percentage < 92.0
                }
            }

            if (isVitalInDangerZone) {
                return EsiLevel.LEVEL_2_EMERGENT
            }
        }

        return baseLevel
    }
}
