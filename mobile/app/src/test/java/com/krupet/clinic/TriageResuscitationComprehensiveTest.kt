package com.krupet.clinic

import com.krupet.clinic.core.math.ClinicalMathEngine
import com.krupet.clinic.core.math.TriageAssessmentEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

/**
 * Comprehensive Unit Test Suite for Triage Assessment Engine and Clinical Resuscitation Math
 * Covers NEWS2 edge cases, GCS 3-15 boundary transitions, Shock Index hemodynamics,
 * and Pediatric Parkland burn resuscitation formulas.
 * Strictly ZERO emojis. Strictly NO parentheses in Khmer text.
 */
class TriageResuscitationComprehensiveTest {

    // =========================================================================
    // 1. NEWS2 (National Early Warning Score 2) Boundary and Edge Cases
    // =========================================================================

    @Test
    fun testNews2RespirationRateBoundaries() {
        fun makeInput(rr: Int) = TriageAssessmentEngine.News2Input(
            respirationRate = rr,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 120,
            pulseRate = 75,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 37.0
        )

        // Respiration <= 8: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(8)).respirationScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(5)).respirationScore)

        // Respiration 9-11: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(9)).respirationScore)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(11)).respirationScore)

        // Respiration 12-20: Score 0
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(12)).respirationScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(16)).respirationScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(20)).respirationScore)

        // Respiration 21-24: Score 2
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(21)).respirationScore)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(24)).respirationScore)

        // Respiration >= 25: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(25)).respirationScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(38)).respirationScore)
    }

    @Test
    fun testNews2SpO2Scale1StandardBoundaries() {
        fun makeInput(spo2: Double) = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = spo2,
            onSupplementalOxygen = false,
            systolicBloodPressure = 120,
            pulseRate = 75,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 37.0,
            isHypercapnicRespiratoryFailureTarget = false
        )

        // SpO2 <= 91: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(91.0)).spO2Score)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(84.5)).spO2Score)

        // SpO2 92-93: Score 2
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(92.0)).spO2Score)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(93.0)).spO2Score)

        // SpO2 94-95: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(94.0)).spO2Score)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(95.0)).spO2Score)

        // SpO2 >= 96: Score 0
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(96.0)).spO2Score)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(99.5)).spO2Score)
    }

    @Test
    fun testNews2SpO2Scale2HypercapnicTargetBoundaries() {
        fun makeInput(spo2: Double, onO2: Boolean) = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = spo2,
            onSupplementalOxygen = onO2,
            systolicBloodPressure = 120,
            pulseRate = 75,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 37.0,
            isHypercapnicRespiratoryFailureTarget = true
        )

        // Scale 2: SpO2 <= 83: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(83.0, false)).spO2Score)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(80.0, true)).spO2Score)

        // Scale 2: SpO2 84-85: Score 2
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(84.0, false)).spO2Score)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(85.0, true)).spO2Score)

        // Scale 2: SpO2 86-87: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(86.0, false)).spO2Score)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(87.0, true)).spO2Score)

        // Scale 2: SpO2 88-92 (Target therapeutic range): Score 0 regardless of oxygen
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(88.0, false)).spO2Score)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(90.0, true)).spO2Score)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(92.0, true)).spO2Score)

        // Scale 2: SpO2 93-94: Score 0 on air, Score 1 on supplemental O2
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(93.0, false)).spO2Score)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(94.0, true)).spO2Score)

        // Scale 2: SpO2 95-96: Score 0 on air, Score 2 on supplemental O2
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(95.0, false)).spO2Score)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(96.0, true)).spO2Score)

        // Scale 2: SpO2 >= 97: Score 0 on air, Score 3 on supplemental O2 (hyperoxia risk in COPD)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(97.0, false)).spO2Score)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(99.0, true)).spO2Score)
    }

    @Test
    fun testNews2SystolicBloodPressureBoundaries() {
        fun makeInput(sbp: Int) = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = sbp,
            pulseRate = 75,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 37.0
        )

        // SBP <= 90: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(90)).systolicBpScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(70)).systolicBpScore)

        // SBP 91-100: Score 2
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(91)).systolicBpScore)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(100)).systolicBpScore)

        // SBP 101-110: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(101)).systolicBpScore)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(110)).systolicBpScore)

        // SBP 111-219: Score 0
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(111)).systolicBpScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(150)).systolicBpScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(219)).systolicBpScore)

        // SBP >= 220: Score 3 (hypertensive emergency threshold)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(220)).systolicBpScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(245)).systolicBpScore)
    }

    @Test
    fun testNews2PulseRateBoundaries() {
        fun makeInput(pulse: Int) = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 120,
            pulseRate = pulse,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = 37.0
        )

        // Pulse <= 40: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(40)).pulseScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(32)).pulseScore)

        // Pulse 41-50: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(41)).pulseScore)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(50)).pulseScore)

        // Pulse 51-90: Score 0
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(51)).pulseScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(75)).pulseScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(90)).pulseScore)

        // Pulse 91-110: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(91)).pulseScore)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(110)).pulseScore)

        // Pulse 111-130: Score 2
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(111)).pulseScore)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(130)).pulseScore)

        // Pulse >= 131: Score 3
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(131)).pulseScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(165)).pulseScore)
    }

    @Test
    fun testNews2TemperatureBoundaries() {
        fun makeInput(temp: Double) = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 120,
            pulseRate = 75,
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT,
            temperatureCelsius = temp
        )

        // Temp <= 35.0: Score 3 (Hypothermia)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(35.0)).temperatureScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(33.8)).temperatureScore)

        // Temp 35.1-36.0: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(35.1)).temperatureScore)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(36.0)).temperatureScore)

        // Temp 36.1-38.0: Score 0
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(36.1)).temperatureScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(37.0)).temperatureScore)
        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(38.0)).temperatureScore)

        // Temp 38.1-39.0: Score 1
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(38.1)).temperatureScore)
        assertEquals(1, TriageAssessmentEngine.calculateNews2(makeInput(39.0)).temperatureScore)

        // Temp >= 39.1: Score 2
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(39.1)).temperatureScore)
        assertEquals(2, TriageAssessmentEngine.calculateNews2(makeInput(40.6)).temperatureScore)
    }

    @Test
    fun testNews2ConsciousnessLevels() {
        fun makeInput(level: TriageAssessmentEngine.ConsciousnessLevel) = TriageAssessmentEngine.News2Input(
            respirationRate = 16,
            spO2Percentage = 98.0,
            onSupplementalOxygen = false,
            systolicBloodPressure = 120,
            pulseRate = 75,
            consciousness = level,
            temperatureCelsius = 37.0
        )

        assertEquals(0, TriageAssessmentEngine.calculateNews2(makeInput(TriageAssessmentEngine.ConsciousnessLevel.ALERT)).consciousnessScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(TriageAssessmentEngine.ConsciousnessLevel.CONFUSED_OR_NEW_VOICE)).consciousnessScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(TriageAssessmentEngine.ConsciousnessLevel.RESPONDS_TO_PAIN)).consciousnessScore)
        assertEquals(3, TriageAssessmentEngine.calculateNews2(makeInput(TriageAssessmentEngine.ConsciousnessLevel.UNRESPONSIVE)).consciousnessScore)
    }

    @Test
    fun testNews2EscalationRulesAndClinicalRiskStratification() {
        // Case A: Total score 4, no single 3 -> LOW
        val inputLow = TriageAssessmentEngine.News2Input(
            respirationRate = 10, // 1
            spO2Percentage = 95.0, // 1
            onSupplementalOxygen = false, // 0
            systolicBloodPressure = 105, // 1
            pulseRate = 95, // 1
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT, // 0
            temperatureCelsius = 37.0 // 0
        )
        val resLow = TriageAssessmentEngine.calculateNews2(inputLow)
        assertEquals(4, resLow.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.LOW, resLow.clinicalRiskCategory)

        // Case B: Total score 3, but single parameter = 3 (e.g. SBP 85) -> LOW_MEDIUM
        val inputSingle3 = TriageAssessmentEngine.News2Input(
            respirationRate = 16, // 0
            spO2Percentage = 98.0, // 0
            onSupplementalOxygen = false, // 0
            systolicBloodPressure = 85, // 3
            pulseRate = 75, // 0
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT, // 0
            temperatureCelsius = 37.0 // 0
        )
        val resSingle3 = TriageAssessmentEngine.calculateNews2(inputSingle3)
        assertEquals(3, resSingle3.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.LOW_MEDIUM, resSingle3.clinicalRiskCategory)

        // Case C: Total score 5 -> MEDIUM
        val inputMed = TriageAssessmentEngine.News2Input(
            respirationRate = 22, // 2
            spO2Percentage = 93.0, // 2
            onSupplementalOxygen = false, // 0
            systolicBloodPressure = 108, // 1
            pulseRate = 80, // 0
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT, // 0
            temperatureCelsius = 37.0 // 0
        )
        val resMed = TriageAssessmentEngine.calculateNews2(inputMed)
        assertEquals(5, resMed.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.MEDIUM, resMed.clinicalRiskCategory)

        // Case D: Total score 7 -> HIGH
        val inputHigh = TriageAssessmentEngine.News2Input(
            respirationRate = 26, // 3
            spO2Percentage = 91.0, // 3
            onSupplementalOxygen = false, // 0
            systolicBloodPressure = 105, // 1
            pulseRate = 80, // 0
            consciousness = TriageAssessmentEngine.ConsciousnessLevel.ALERT, // 0
            temperatureCelsius = 37.0 // 0
        )
        val resHigh = TriageAssessmentEngine.calculateNews2(inputHigh)
        assertEquals(7, resHigh.totalScore)
        assertEquals(TriageAssessmentEngine.News2Result.RiskCategory.HIGH, resHigh.clinicalRiskCategory)
    }

    // =========================================================================
    // 2. Glasgow Coma Scale (GCS 3-15) and Shock Index
    // =========================================================================

    @Test
    fun testGcsSpectrumAndAirwayProtectionThreshold() {
        // Minimum score: 1 + 1 + 1 = 3 (Deep Coma, Intubation Mandated)
        val gcs3 = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 1, verbalResponse = 1, motorResponse = 1)
        )
        assertEquals(3, gcs3.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.SEVERE_BRAIN_INJURY, gcs3.severityCategory)
        assertTrue("GCS 3 requires airway protection", gcs3.airwayProtectionIndicated)

        // Intubation cutoff edge: GCS = 8 (2 + 2 + 4) -> SEVERE, airwayProtectionIndicated = true
        val gcs8 = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 2, verbalResponse = 2, motorResponse = 4)
        )
        assertEquals(8, gcs8.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.SEVERE_BRAIN_INJURY, gcs8.severityCategory)
        assertTrue("GCS 8 requires airway protection", gcs8.airwayProtectionIndicated)

        // Above cutoff edge: GCS = 9 (3 + 3 + 3) -> MODERATE, airwayProtectionIndicated = false
        val gcs9 = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 3, verbalResponse = 3, motorResponse = 3)
        )
        assertEquals(9, gcs9.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.MODERATE_BRAIN_INJURY, gcs9.severityCategory)
        assertFalse("GCS 9 does not automatically trigger airway protection", gcs9.airwayProtectionIndicated)

        // Moderate Brain Injury upper boundary: GCS = 12 (3 + 4 + 5)
        val gcs12 = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 3, verbalResponse = 4, motorResponse = 5)
        )
        assertEquals(12, gcs12.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.MODERATE_BRAIN_INJURY, gcs12.severityCategory)
        assertFalse(gcs12.airwayProtectionIndicated)

        // Mild Brain Injury lower boundary: GCS = 13 (4 + 4 + 5)
        val gcs13 = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 4, verbalResponse = 4, motorResponse = 5)
        )
        assertEquals(13, gcs13.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.MILD_BRAIN_INJURY, gcs13.severityCategory)
        assertFalse(gcs13.airwayProtectionIndicated)

        // Maximum score: GCS = 15 (4 + 5 + 6)
        val gcs15 = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 4, verbalResponse = 5, motorResponse = 6)
        )
        assertEquals(15, gcs15.totalScore)
        assertEquals(TriageAssessmentEngine.GcsResult.Severity.MILD_BRAIN_INJURY, gcs15.severityCategory)
        assertFalse(gcs15.airwayProtectionIndicated)
    }

    @Test
    fun testGcsInputBoundaryCoercion() {
        // Values outside standard subscale limits are coerced to 1..4, 1..5, 1..6
        val coercedLow = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 0, verbalResponse = 0, motorResponse = 0)
        )
        assertEquals(3, coercedLow.totalScore)

        val coercedHigh = TriageAssessmentEngine.calculateGcs(
            TriageAssessmentEngine.GcsInput(eyeOpening = 10, verbalResponse = 10, motorResponse = 10)
        )
        assertEquals(15, coercedHigh.totalScore)
    }

    @Test
    fun testShockIndexHemodynamicStratification() {
        // Normal profile: SI < 0.70 (HR 60, SBP 120 -> 0.50)
        val normal = ClinicalMathEngine.calculateShockIndex(heartRateBpm = 60, systolicBpMmHg = 120)
        assertEquals(0.50, normal.shockIndex, 0.001)
        assertFalse(normal.isSevereShock)
        assertTrue(normal.clinicalInterpretation.contains("Normal"))

        // Borderline occult hypoperfusion: 0.70 <= SI < 0.90 (HR 80, SBP 100 -> 0.80)
        val borderline = ClinicalMathEngine.calculateShockIndex(heartRateBpm = 80, systolicBpMmHg = 100)
        assertEquals(0.80, borderline.shockIndex, 0.001)
        assertFalse(borderline.isSevereShock)
        assertTrue(borderline.clinicalInterpretation.contains("Mild occult hypoperfusion"))

        // Severe shock threshold: SI >= 0.90 (HR 90, SBP 100 -> 0.90)
        val thresholdShock = ClinicalMathEngine.calculateShockIndex(heartRateBpm = 90, systolicBpMmHg = 100)
        assertEquals(0.90, thresholdShock.shockIndex, 0.001)
        assertTrue(thresholdShock.isSevereShock)
        assertTrue(thresholdShock.clinicalInterpretation.contains("Severe shock"))

        // Profound hemorrhagic collapse: HR 140, SBP 70 -> SI 2.00
        val profoundShock = ClinicalMathEngine.calculateShockIndex(heartRateBpm = 140, systolicBpMmHg = 70)
        assertEquals(2.00, profoundShock.shockIndex, 0.001)
        assertTrue(profoundShock.isSevereShock)

        // Invalid zero or negative SBP throws IllegalArgumentException
        try {
            ClinicalMathEngine.calculateShockIndex(heartRateBpm = 100, systolicBpMmHg = 0)
            fail("Expected IllegalArgumentException for SBP <= 0")
        } catch (_: IllegalArgumentException) {
            // Success
        }
    }

    // =========================================================================
    // 3. Pediatric Parkland Burn Resuscitation Formula (Baxter Protocol)
    // =========================================================================

    @Test
    fun testPediatricParklandBurnResuscitationInfant() {
        // Infant: 10 kg, 15% Total Body Surface Area (TBSA)
        // Formula: 4 mL * 10 kg * 15% = 600 mL total crystalloid over 24 hours
        val res = ClinicalMathEngine.calculateParkland(
            weightKg = 10.0,
            tbsaPercentage = 15.0,
            hoursSinceBurn = 0.0
        )

        assertEquals(600.0, res.totalFluid24hMl, 0.01)
        assertEquals(300.0, res.first8HoursFluidMl, 0.01)
        assertEquals(38.0, res.first8HoursRateMlPerHour, 0.01) // 300 / 8 = 37.5 -> roundToInt 38 mL/h
        assertEquals(300.0, res.remaining16HoursFluidMl, 0.01)
        assertEquals(19.0, res.remaining16HoursRateMlPerHour, 0.01) // 300 / 16 = 18.75 -> roundToInt 19 mL/h

        // Pediatric target urine output: 0.5 - 1.0 mL/kg/h -> 5.0 to 10.0 mL/h
        assertEquals(5.0, res.targetUrineOutputMlPerHourMin, 0.01)
        assertEquals(10.0, res.targetUrineOutputMlPerHourMax, 0.01)
    }

    @Test
    fun testPediatricParklandBurnResuscitationChild() {
        // Child: 20 kg, 25% TBSA
        // Formula: 4 mL * 20 kg * 25% = 2000 mL total crystalloid over 24 hours
        val res = ClinicalMathEngine.calculateParkland(
            weightKg = 20.0,
            tbsaPercentage = 25.0,
            hoursSinceBurn = 0.0
        )

        assertEquals(2000.0, res.totalFluid24hMl, 0.01)
        assertEquals(1000.0, res.first8HoursFluidMl, 0.01)
        assertEquals(125.0, res.first8HoursRateMlPerHour, 0.01) // 1000 / 8 = 125 mL/h
        assertEquals(1000.0, res.remaining16HoursFluidMl, 0.01)
        assertEquals(63.0, res.remaining16HoursRateMlPerHour, 0.01) // 1000 / 16 = 62.5 -> roundToInt 63 mL/h

        // Child target urine output: 10.0 to 20.0 mL/h
        assertEquals(10.0, res.targetUrineOutputMlPerHourMin, 0.01)
        assertEquals(20.0, res.targetUrineOutputMlPerHourMax, 0.01)
    }

    @Test
    fun testPediatricParklandTimeDelayedPresentation() {
        // 15 kg child presenting 3 hours after burn injury with 20% TBSA
        // Total fluid: 4 * 15 * 20 = 1200 mL
        // First 8-hour target: 600 mL, but only (8 - 3) = 5 hours remaining
        // First phase rate: 600 / 5 = 120 mL/h (instead of standard 75 mL/h)
        val delayed = ClinicalMathEngine.calculateParkland(
            weightKg = 15.0,
            tbsaPercentage = 20.0,
            hoursSinceBurn = 3.0
        )

        assertEquals(1200.0, delayed.totalFluid24hMl, 0.01)
        assertEquals(600.0, delayed.first8HoursFluidMl, 0.01)
        assertEquals(120.0, delayed.first8HoursRateMlPerHour, 0.01)
        assertEquals(600.0, delayed.remaining16HoursFluidMl, 0.01)
        assertEquals(38.0, delayed.remaining16HoursRateMlPerHour, 0.01) // 600 / 16 = 37.5 -> 38 mL/h
        assertTrue(delayed.timingWarning.contains("Remaining time for phase 1: 5.0 hours"))
    }

    @Test
    fun testParklandInputValidationBoundaries() {
        try {
            ClinicalMathEngine.calculateParkland(weightKg = 0.0, tbsaPercentage = 20.0)
            fail("Expected exception for zero weight")
        } catch (_: IllegalArgumentException) {
            // Expected
        }

        try {
            ClinicalMathEngine.calculateParkland(weightKg = 50.0, tbsaPercentage = 0.5)
            fail("Expected exception for TBSA < 1%")
        } catch (_: IllegalArgumentException) {
            // Expected
        }

        try {
            ClinicalMathEngine.calculateParkland(weightKg = 50.0, tbsaPercentage = 101.0)
            fail("Expected exception for TBSA > 100%")
        } catch (_: IllegalArgumentException) {
            // Expected
        }
    }
}
