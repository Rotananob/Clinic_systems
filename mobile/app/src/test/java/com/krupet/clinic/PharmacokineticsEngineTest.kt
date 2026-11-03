package com.krupet.clinic

import com.krupet.clinic.core.math.PharmacokineticsEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Test

class PharmacokineticsEngineTest {

    @Test
    fun testIbwCalculation_StandardAdultMaleAndFemale() {
        // 5 feet 10 inches = 70 inches = 177.8 cm. 10 inches over 60.
        // Male: 50 + 2.3 * 10 = 73.0 kg
        val maleIbw = PharmacokineticsEngine.calculateIbwKg(177.8, PharmacokineticsEngine.BiologicalSex.MALE)
        assertEquals(73.0, maleIbw, 0.5)

        // Female 5 feet 4 inches = 64 inches = 162.56 cm. 4 inches over 60.
        // Female: 45.5 + 2.3 * 4 = 54.7 kg
        val femaleIbw = PharmacokineticsEngine.calculateIbwKg(162.56, PharmacokineticsEngine.BiologicalSex.FEMALE)
        assertEquals(54.7, femaleIbw, 0.5)
    }

    @Test
    fun testCockcroftGaultCrCl_NormalRenalFunction() {
        // 40y male, 70kg, 175cm, SCr 1.0 mg/dL
        val crCl = PharmacokineticsEngine.calculateCockcroftGaultCrCl(
            ageYears = 40,
            actualWeightKg = 70.0,
            heightCm = 175.0,
            serumCreatinineMgDl = 1.0,
            sex = PharmacokineticsEngine.BiologicalSex.MALE
        )
        // CrCl = (100 * ~70) / 72 = ~97.2 mL/min
        assertTrue(crCl in 90.0..105.0)
    }

    @Test
    fun testCockcroftGaultCrCl_FemaleDosingAdjustment() {
        val crCl = PharmacokineticsEngine.calculateCockcroftGaultCrCl(
            ageYears = 40,
            actualWeightKg = 60.0,
            heightCm = 165.0,
            serumCreatinineMgDl = 1.0,
            sex = PharmacokineticsEngine.BiologicalSex.FEMALE
        )
        // Female factor 0.85
        assertTrue(crCl < 85.0)
    }

    @Test
    fun testVancomycinAuc24_TherapeuticTargetMet() {
        // Daily dose 2000 mg (1000 mg q12h), CrCl 85 mL/min, Weight 70 kg
        val result = PharmacokineticsEngine.estimateVancomycinAuc24(
            totalDailyDoseMg = 2000.0,
            crClMlMin = 85.0,
            patientWeightKg = 70.0,
            micMgL = 1.0
        )
        // Ke = 0.00083 * 85 + 0.0044 = ~0.075
        // Vd = 0.7 * 70 = 49 L
        // CL = 0.075 * 49 = ~3.67 L/h
        // AUC24 = 2000 / 3.67 = ~544 mg*h/L (Target is 400-600)
        assertTrue(result.targetMet)
        assertEquals(PharmacokineticsEngine.VancomycinAucResult.AucCategory.OPTIMAL, result.category)
    }

    @Test
    fun testVancomycinAuc24_NephrotoxicityDangerZone() {
        // High dose in renal impairment: 3000 mg in CrCl 30 mL/min
        val result = PharmacokineticsEngine.estimateVancomycinAuc24(
            totalDailyDoseMg = 3000.0,
            crClMlMin = 30.0,
            patientWeightKg = 70.0
        )
        assertEquals(PharmacokineticsEngine.VancomycinAucResult.AucCategory.SUPRATHERAPEUTIC, result.category)
        assertFalse(result.targetMet)
    }

    @Test
    fun testAspMetrics_DotAndLotComputation() {
        // Concurrent Meropenem (5 days) + Vancomycin (5 days) = DOT 10, LOT 5
        val result = PharmacokineticsEngine.calculateAspMetrics(
            agentDays = listOf(5, 5),
            distinctCalendarDays = 5,
            predictedDot = 10.0
        )
        assertEquals(10, result.dotTotal)
        assertEquals(5, result.lotTotal)
        assertEquals(1.0, result.saarRatio, 0.01)
        assertEquals(PharmacokineticsEngine.AspMetricsResult.SaarCategory.BENCHMARK, result.saarCategory)
    }

    @Test
    fun testPctKinetics_SuccessfulClearance_CessationAdvised() {
        // Baseline 4.5 mcg/L dropping to 0.4 mcg/L (>80% drop) with clinical stability
        val result = PharmacokineticsEngine.evaluatePctKinetics(
            baselinePctMcgL = 4.5,
            currentPctMcgL = 0.4,
            isHemodynamicallyStable = true,
            isAfebrileOver24h = true
        )
        assertTrue(result.cessationAdvised)
        assertTrue(result.deltaPercentage >= 80.0)
    }

    @Test
    fun testIvToPoValidation_FullCriteriaMet() {
        val criteria = PharmacokineticsEngine.IvToPoCriteria(
            ivDurationHours = 52,
            isAfebrileOver24h = true,
            isHemodynamicallyStable = true,
            isGastrointestinalTractFunctional = true,
            hasOralBioequivalent = true
        )
        val result = PharmacokineticsEngine.validateIvToPoSwitch(criteria)
        assertTrue(result.isEligible)
    }

    @Test
    fun testIvToPoValidation_Under48Hours_Blocked() {
        val criteria = PharmacokineticsEngine.IvToPoCriteria(
            ivDurationHours = 24,
            isAfebrileOver24h = true,
            isHemodynamicallyStable = true,
            isGastrointestinalTractFunctional = true,
            hasOralBioequivalent = true
        )
        val result = PharmacokineticsEngine.validateIvToPoSwitch(criteria)
        assertFalse(result.isEligible)
    }
}
