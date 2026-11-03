package com.krupet.clinic

import com.krupet.clinic.core.math.ClinicalMathEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit Test Suite for Clinical and Mathematical Resuscitation Algorithms
 * Validates deterministic clinical calculations against international medical guidelines.
 */
class ClinicalMathEngineTest {

    @Test
    fun testSepsisResuscitationFluidCalculation() {
        // Standard 70 kg adult patient: 70 * 30 mL = 2100 mL
        val res70 = ClinicalMathEngine.calculateSepsisFluid(weightKg = 70.0, initialLactateMmolL = 2.4)
        assertEquals(2100.0, res70.totalFluidMl, 0.01)
        assertEquals(700.0, res70.infusionRateMlPerHour, 0.01) // 2100 / 3h
        assertEquals(65, res70.targetMapMmHg)
        assertTrue(res70.isLactateElevated)

        // 50 kg adult patient: 50 * 30 mL = 1500 mL
        val res50 = ClinicalMathEngine.calculateSepsisFluid(weightKg = 50.0, initialLactateMmolL = 1.2)
        assertEquals(1500.0, res50.totalFluidMl, 0.01)
        assertEquals(500.0, res50.infusionRateMlPerHour, 0.01)
        assertFalse(res50.isLactateElevated)
    }

    @Test
    fun testShockIndexEvaluation() {
        // Normal Hemodynamics: HR 72 bpm, SBP 120 mmHg -> SI 0.60
        val normal = ClinicalMathEngine.calculateShockIndex(heartRateBpm = 72, systolicBpMmHg = 120)
        assertEquals(0.60, normal.shockIndex, 0.01)
        assertFalse(normal.isSevereShock)

        // Hemorrhagic Shock: HR 125 bpm, SBP 85 mmHg -> SI 1.47
        val shock = ClinicalMathEngine.calculateShockIndex(heartRateBpm = 125, systolicBpMmHg = 85)
        assertEquals(1.47, shock.shockIndex, 0.01)
        assertTrue(shock.isSevereShock)
    }

    @Test
    fun testParklandBurnFormula() {
        // 70 kg adult with 40% TBSA: 4 * 70 * 40 = 11,200 mL
        val res = ClinicalMathEngine.calculateParkland(
            weightKg = 70.0,
            tbsaPercentage = 40.0,
            hoursSinceBurn = 0.0
        )
        assertEquals(11200.0, res.totalFluid24hMl, 0.01)
        assertEquals(5600.0, res.first8HoursFluidMl, 0.01)
        assertEquals(700.0, res.first8HoursRateMlPerHour, 0.01) // 5600 / 8h
        assertEquals(5600.0, res.remaining16HoursFluidMl, 0.01)
        assertEquals(350.0, res.remaining16HoursRateMlPerHour, 0.01) // 5600 / 16h
        assertEquals(35.0, res.targetUrineOutputMlPerHourMin, 0.01) // 0.5 mL/kg/h
        assertEquals(70.0, res.targetUrineOutputMlPerHourMax, 0.01) // 1.0 mL/kg/h
    }

    @Test
    fun testPediatricPharmacotherapyRules() {
        // Clark's Rule: 30 lbs child, 500 mg adult dose -> (30 / 150) * 500 = 100 mg
        val clarkDose = ClinicalMathEngine.PediatricNomogram.clarksRule(weightPounds = 30.0, adultDoseMg = 500.0)
        assertEquals(100.0, clarkDose, 0.01)

        // Young's Rule: 6 year old child, 500 mg adult dose -> (6 / (6 + 12)) * 500 = 166.67 mg
        val youngDose = ClinicalMathEngine.PediatricNomogram.youngsRule(ageYears = 6.0, adultDoseMg = 500.0)
        assertEquals(166.67, youngDose, 0.01)

        // Fried's Rule: 15 month infant, 200 mg adult dose -> (15 / 150) * 200 = 20 mg
        val friedDose = ClinicalMathEngine.PediatricNomogram.friedsRule(ageMonths = 15, adultDoseMg = 200.0)
        assertEquals(20.0, friedDose, 0.01)
    }

    @Test
    fun testBhutaniPhototherapyNomogram() {
        // 72 hours postnatal, 18.0 mg/dL -> High Risk
        val highRisk = ClinicalMathEngine.PediatricNomogram.bhutaniRiskZone(
            postnatalHours = 72,
            totalBilirubinMgDl = 18.0
        )
        assertTrue(highRisk.contains("HIGH RISK"))

        // 24 hours postnatal, 4.0 mg/dL -> Low Risk
        val lowRisk = ClinicalMathEngine.PediatricNomogram.bhutaniRiskZone(
            postnatalHours = 24,
            totalBilirubinMgDl = 4.0
        )
        assertTrue(lowRisk.contains("LOW RISK"))
    }

    @Test
    fun testCrash2TranexamicAcidWindow() {
        // 90 minutes post-trauma: Eligible
        val eligible = ClinicalMathEngine.evaluateTxaWindow(minutesSinceTrauma = 90)
        assertTrue(eligible.isEligible)
        assertEquals(1.0, eligible.loadingDoseGram, 0.01)

        // 210 minutes (3.5 hours) post-trauma: Contraindicated
        val contraindicated = ClinicalMathEngine.evaluateTxaWindow(minutesSinceTrauma = 210)
        assertFalse(contraindicated.isEligible)
        assertEquals(0.0, contraindicated.loadingDoseGram, 0.01)
    }
}
