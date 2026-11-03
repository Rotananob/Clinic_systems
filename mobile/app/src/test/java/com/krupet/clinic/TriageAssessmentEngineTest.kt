package com.krupet.clinic

import com.krupet.clinic.core.math.TriageAssessmentEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Test

class TriageAssessmentEngineTest {

    @Test
    fun testNews2_NormalPhysiology_ScoreZeroLowRisk() {
        val input = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 120,
            pulseRate = 72,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 37.0
        )
        val result = TriageAssessmentEngine.calculateNews2(input)
        assertEquals(0, result.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.LOW, result.clinicalRiskCategory)
    }

    @Test
    fun testNews2_SevereSepticShock_ScoreHighRisk() {
        val input = TriageAssessmentEngine.News2Input(
            respirationRate = 28,      // 3
            spO2Percentage = 89.0,         // 3
            onSupplementalOxygen = true,   // 2
            systolicBloodPressure = 82,    // 3
            pulseRate = 138,               // 3
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.CONFUSED_OR_NEW_VOICE, // 3
            temperatureCelsius = 39.5      // 2
        )
        val result = TriageAssessmentEngine.calculateNews2(input)
        // 3 + 3 + 2 + 3 + 3 + 3 + 2 = 19
        assertEquals(19, result.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.HIGH, result.clinicalRiskCategory)
    }

    @Test
    fun testNews2_SingleExtremeParameter_TriggersLowMediumEscalation() {
        val input = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 88,    // score 3
            pulseRate = 75,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 36.8
        )
        val result = TriageAssessmentEngine.calculateNews2(input)
        assertEquals(3, result.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.LOW_MEDIUM, result.clinicalRiskCategory)
    }

    @Test
    fun testNews2_HypercapnicScale2_ValidTargetRange() {
        val input = TriageAssessmentEngine.News2Input(
            respirationRate = 18,
            spO2Percentage = 90.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 130,
            pulseRate = 80,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 36.6,
            isHypercapnicRespiratoryFailureTarget = true
        )
        val result = TriageAssessmentEngine.calculateNews2(input)
        assertEquals(0, result.spO2Score)
        assertEquals(0, result.totalScore)
    }

    @Test
    fun testGcs_IntactNeuro_Score15Mild() {
        val input = TriageAssessmentEngine.GcsInput(eyeOpening = 4, verbalResponse = 5, motorResponse = 6)
        val result = TriageAssessmentEngine.calculateGcs(input)
        assertEquals(15, result.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.MILD_BRAIN_INJURY, result.severityCategory)
        assertFalse(result.airwayProtectionIndicated)
    }

    @Test
    fun testGcs_SevereComa_Score7IntubationRequired() {
        val input = TriageAssessmentEngine.GcsInput(eyeOpening = 1, verbalResponse = 2, motorResponse = 4)
        val result = TriageAssessmentEngine.calculateGcs(input)
        assertEquals(7, result.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.SEVERE_BRAIN_INJURY, result.severityCategory)
        assertTrue(result.airwayProtectionIndicated)
    }

    @Test
    fun testEsi_ImmediateLifeSaving_Level1() {
        val input = TriageAssessmentEngine.EsiInput(
            requiresImmediateLifeSaving = true,
            isHighRiskOrConfusedOrSeverePain = false,
            predictedResourceCount = 3,
            ageYears = 45,
            heartRateBpm = 110,
            respiratoryRateBpm = 22,
            spO2Percentage = 95.0
        )
        val level = TriageAssessmentEngine.calculateEsi(input)
        assertEquals(TriageAssessmentEngine.EsiLevel.LEVEL_1_RESUSCITATION, level)
    }

    @Test
    fun testEsi_HighRiskSituation_Level2() {
        val input = TriageAssessmentEngine.EsiInput(
            requiresImmediateLifeSaving = false,
            isHighRiskOrConfusedOrSeverePain = true,
            predictedResourceCount = 2,
            ageYears = 62,
            heartRateBpm = 85,
            respiratoryRateBpm = 18,
            spO2Percentage = 98.0
        )
        val level = TriageAssessmentEngine.calculateEsi(input)
        assertEquals(TriageAssessmentEngine.EsiLevel.LEVEL_2_EMERGENT, level)
    }

    @Test
    fun testEsi_VitalSignDangerZoneUpgrade_Level3UpgradedToLevel2() {
        // Adult with predicted resources 2 (normally Level 3), but HR 135 bpm > 100
        val input = TriageAssessmentEngine.EsiInput(
            requiresImmediateLifeSaving = false,
            isHighRiskOrConfusedOrSeverePain = false,
            predictedResourceCount = 2,
            ageYears = 30,
            heartRateBpm = 135,
            respiratoryRateBpm = 18,
            spO2Percentage = 98.0
        )
        val level = TriageAssessmentEngine.calculateEsi(input)
        assertEquals(TriageAssessmentEngine.EsiLevel.LEVEL_2_EMERGENT, level)
    }
}
