// Mathematical & Algorithmic Engine for Neonatal & Pediatric Precision Pharmacotherapy
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  NeonatalAminoglycosideDosing,
  PhototherapyNomogramAssessment,
  PhototherapyRiskCategory,
  PhototherapyAction
} from './pediatric.types';

export class PediatricMathEngine {
  /**
   * Clark's Rule:
   * Pediatric Dose = (Weight in lbs / 150) * Adult Dose
   * (1 kg = 2.20462 lbs)
   */
  public static calculateClarksDose(weightKg: number, adultDoseMg: number): number {
    const validWeight = Math.max(0.5, weightKg);
    const validAdultDose = Math.max(1, adultDoseMg);
    const weightLbs = validWeight * 2.20462;
    const dose = (weightLbs / 150) * validAdultDose;
    return Math.round(dose * 10) / 10;
  }

  /**
   * Young's Rule for children 1 year and older:
   * Pediatric Dose = (Age in years / (Age in years + 12)) * Adult Dose
   */
  public static calculateYoungsDose(ageYears: number, adultDoseMg: number): number {
    const validAge = Math.max(1, ageYears);
    const validAdultDose = Math.max(1, adultDoseMg);
    const dose = (validAge / (validAge + 12)) * validAdultDose;
    return Math.round(dose * 10) / 10;
  }

  /**
   * Fried's Rule for infants under 1 year:
   * Pediatric Dose = (Age in months / 150) * Adult Dose
   */
  public static calculateFriedsDose(ageMonths: number, adultDoseMg: number): number {
    const validMonths = Math.max(0.5, ageMonths);
    const validAdultDose = Math.max(1, adultDoseMg);
    const dose = (validMonths / 150) * validAdultDose;
    return Math.round(dose * 10) / 10;
  }

  /**
   * Calculates weight-based dose with mandatory adult single-dose ceiling clamping:
   * Dose = min(Weight * mgPerKg, AdultMaxSingleDose)
   */
  public static calculateWeightBasedDose(
    weightKg: number,
    doseMgPerKg: number,
    adultMaxSingleDoseMg: number
  ): { rawDoseMg: number; finalCappedDoseMg: number; isCapped: boolean } {
    const validWeight = Math.max(0.5, weightKg);
    const validDosePerKg = Math.max(0.1, doseMgPerKg);
    const rawDose = Math.round(validWeight * validDosePerKg * 10) / 10;

    let finalDose = rawDose;
    let isCapped = false;

    if (adultMaxSingleDoseMg > 0 && finalDose > adultMaxSingleDoseMg) {
      finalDose = adultMaxSingleDoseMg;
      isCapped = true;
    }

    return {
      rawDoseMg: rawDose,
      finalCappedDoseMg: finalDose,
      isCapped
    };
  }

  /**
   * Neonatal Extended-Interval Gentamicin/Amikacin Regimen.
   * Dynamically adjusts dosing interval (24h, 36h, 48h) and mg/kg based on PMA and PNA.
   */
  public static calculateNeonatalGentamicinRegimen(
    gestationalAgeWeeks: number,
    postnatalAgeDays: number,
    weightKg: number
  ): NeonatalAminoglycosideDosing {
    const validGa = Math.max(23, Math.min(42, gestationalAgeWeeks));
    const validPna = Math.max(0, postnatalAgeDays);
    const validWeight = Math.max(0.4, weightKg);

    const postmenstrualAgeWeeks = Math.round((validGa + validPna / 7) * 10) / 10;

    let nominalDose = 4.0;
    let interval: 24 | 36 | 48 = 24;
    let renalStageEn = '';
    let renalStageKm = '';

    if (postmenstrualAgeWeeks < 30) {
      // Extremely preterm: profound glomerular immaturity
      nominalDose = 5.0;
      interval = 48;
      renalStageEn = 'Extremely preterm neonatal physiology. Severely reduced GFR requiring extended 48-hour elimination clearance.';
      renalStageKm = 'សរីរវិទ្យាទារកកើតមិនគ្រប់ខែខ្លាំង កម្រិតបន្សុទ្ធតម្រងនោមទាបខ្លាំង តម្រូវឱ្យពន្យារចន្លោះពេលចាក់រហូតដល់ ៤៨ ម៉ោង';
    } else if (postmenstrualAgeWeeks <= 34) {
      // Moderate preterm
      if (validPna <= 7) {
        nominalDose = 4.5;
        interval = 36;
        renalStageEn = 'Moderate preterm early neonatal period. Transitional nephrogenesis requiring 36-hour dosing interval.';
        renalStageKm = 'ទារកកើតមិនគ្រប់ខែកម្រិតមធ្យមអាយុក្រោម ៧ ថ្ងៃ តម្រូវឱ្យប្រើចន្លោះពេលចាក់ ៣៦ ម៉ោង';
      } else {
        nominalDose = 4.0;
        interval = 24;
        renalStageEn = 'Moderate preterm maturing renal clearance after first week of life. 24-hour interval indicated.';
        renalStageKm = 'ទារកកើតមិនគ្រប់ខែកម្រិតមធ្យមអាយុលើស ៧ ថ្ងៃ មុខងារតម្រងនោមចាប់ផ្តើមប្រសើរឡើង អាចប្រើចន្លោះពេល ២៤ ម៉ោង';
      }
    } else if (postmenstrualAgeWeeks < 40) {
      // Late preterm & early term
      nominalDose = 4.0;
      interval = 24;
      renalStageEn = 'Near-term neonatal physiology with functional tubular secretion. Standard 24-hour interval.';
      renalStageKm = 'ទារកជិតគ្រប់ខែ មានមុខងារបន្សុទ្ធតម្រងនោមល្អប្រសើរ ប្រើចន្លោះពេលស្តង់ដារ ២៤ ម៉ោង';
    } else {
      // Full term
      nominalDose = validPna <= 7 ? 4.0 : 5.0;
      interval = 24;
      renalStageEn = 'Full term infant renal clearance. Robust glomerular filtration supporting 24-hour interval.';
      renalStageKm = 'ទារកកើតគ្រប់ខែពេញលេញ មានមុខងារតម្រងនោមរឹងមាំ ប្រើប្រាស់ចន្លោះពេល ២៤ ម៉ោង';
    }

    const calculatedDose = Math.round(validWeight * nominalDose * 10) / 10;

    return {
      gestationalAgeWeeks: validGa,
      postnatalAgeDays: validPna,
      postmenstrualAgeWeeks,
      weightKg: validWeight,
      recommendedAgent: 'GENTAMICIN',
      nominalDoseMgPerKg: nominalDose,
      calculatedDoseMg: calculatedDose,
      dosingIntervalHours: interval,
      targetTroughUgMl: '< 1.0 ug/mL (ideally < 0.5 ug/mL)',
      targetPeakUgMl: '5.0 - 10.0 ug/mL',
      renalMaturityStageEn: renalStageEn,
      renalMaturityStageKm: renalStageKm,
      monitoringProtocolEn: 'Draw serum trough concentration 30 minutes prior to 2nd dose. Serum peak 30 minutes after 30-minute IV infusion.',
      monitoringProtocolKm: 'បូមឈាមវាស់កំហាប់ទាបបំផុត Trough ៣០ នាទីមុនចាក់លើកទីពីរ និងវាស់កំហាប់ខ្ពស់បំផុត Peak ៣០ នាទីក្រោយចាក់រួច'
    };
  }

  /**
   * AAP 2022 Clinical Practice Guideline Hyperbilirubinemia Phototherapy & Exchange Nomogram.
   * Hour-specific Total Serum Bilirubin (TSB) cutoffs based on Bhutani curves.
   */
  public static evaluatePhototherapyNomogram(
    postnatalHours: number,
    totalSerumBilirubinMgDl: number,
    gestationalAgeWeeks: number,
    hasNeurotoxicityRiskFactors: boolean
  ): PhototherapyNomogramAssessment {
    const validHours = Math.max(12, Math.min(168, postnatalHours));
    const validTsb = Math.max(0, totalSerumBilirubinMgDl);

    // Risk category stratification
    let riskCategory: PhototherapyRiskCategory = 'LOW_RISK';
    if (gestationalAgeWeeks >= 38 && !hasNeurotoxicityRiskFactors) {
      riskCategory = 'LOW_RISK';
    } else if (
      (gestationalAgeWeeks >= 38 && hasNeurotoxicityRiskFactors) ||
      (gestationalAgeWeeks >= 35 && gestationalAgeWeeks < 38 && !hasNeurotoxicityRiskFactors)
    ) {
      riskCategory = 'MEDIUM_RISK';
    } else {
      riskCategory = 'HIGH_RISK';
    }

    // Piecewise anchor thresholds for Phototherapy at hours [24, 48, 72, 96]
    // Low Risk: [12.0, 15.0, 18.0, 20.0]
    // Med Risk: [10.0, 13.0, 15.5, 17.0]
    // High Risk: [8.0, 11.0, 13.5, 15.0]
    const anchors: Record<PhototherapyRiskCategory, { h24: number; h48: number; h72: number; h96: number; h12: number }> = {
      LOW_RISK: { h12: 8.0, h24: 12.0, h48: 15.0, h72: 18.0, h96: 20.0 },
      MEDIUM_RISK: { h12: 6.5, h24: 10.0, h48: 13.0, h72: 15.5, h96: 17.0 },
      HIGH_RISK: { h12: 5.0, h24: 8.0, h48: 11.0, h72: 13.5, h96: 15.0 }
    };

    const curve = anchors[riskCategory];
    let photoThreshold = curve.h96;

    if (validHours <= 24) {
      const frac = (validHours - 12) / 12;
      photoThreshold = curve.h12 + frac * (curve.h24 - curve.h12);
    } else if (validHours <= 48) {
      const frac = (validHours - 24) / 24;
      photoThreshold = curve.h24 + frac * (curve.h48 - curve.h24);
    } else if (validHours <= 72) {
      const frac = (validHours - 48) / 24;
      photoThreshold = curve.h48 + frac * (curve.h72 - curve.h48);
    } else if (validHours <= 96) {
      const frac = (validHours - 72) / 24;
      photoThreshold = curve.h72 + frac * (curve.h96 - curve.h72);
    } else {
      photoThreshold = curve.h96;
    }

    photoThreshold = Math.round(photoThreshold * 10) / 10;
    const exchangeThreshold = Math.min(25.0, Math.round((photoThreshold + 5.0) * 10) / 10);
    const distanceToThreshold = Math.round((photoThreshold - validTsb) * 10) / 10;

    let action: PhototherapyAction = 'LOW_RISK_CONTINUE_NORMAL_CARE';
    let actionEn = '';
    let actionKm = '';
    let irradianceRecommendation = 'None';

    if (validTsb >= exchangeThreshold) {
      action = 'EXCHANGE_TRANSFUSION_THRESHOLD_EXCEEDED';
      actionEn = `Critical hyperbilirubinemia (${validTsb} mg/dL). Immediate intensive phototherapy and emergency preparation for double-volume exchange transfusion to prevent acute bilirubin encephalopathy.`;
      actionKm = `កម្រិតជាតិលឿង Bilirubin ឡើងខ្ពស់កម្រិតធ្ងន់ធ្ងរ ${validTsb} mg/dL តម្រូវឱ្យបញ្ចាំងពន្លឺកម្រិតខ្លាំងជាបន្ទាន់ និងត្រៀមប្តូរឈាមសង្គ្រោះបន្ទាន់ ដើម្បីការពារការខូចខួរក្បាល Kernicterus`;
      irradianceRecommendation = 'Maximum intensive irradiance (>= 35 uW/cm2/nm) continuous with multiple light sources';
    } else if (validTsb >= photoThreshold + 2.0) {
      action = 'INTENSIVE_PHOTOTHERAPY_RECOMMENDED';
      actionEn = `TSB of ${validTsb} mg/dL exceeds phototherapy cutoff by >= 2.0 mg/dL. Initiate intensive narrow-band blue LED phototherapy with maximum body surface exposure.`;
      actionKm = `កម្រិត Bilirubin ${validTsb} mg/dL លើសកម្រិតកំណត់លើសពី ២.០ mg/dL ណែនាំឱ្យបញ្ចាំងពន្លឺភ្លើងពណ៌ខៀវកម្រិតខ្លាំងជាបន្ទាន់`;
      irradianceRecommendation = 'Intensive irradiance (30-35 uW/cm2/nm) narrow-band blue LED';
    } else if (validTsb >= photoThreshold) {
      action = 'STANDARD_PHOTOTHERAPY_RECOMMENDED';
      actionEn = `TSB of ${validTsb} mg/dL meets standard phototherapy threshold (${photoThreshold} mg/dL). Initiate phototherapy and verify feeding adequacy.`;
      actionKm = `កម្រិត Bilirubin ${validTsb} mg/dL បានដល់កម្រិតកំណត់បញ្ចាំងពន្លឺស្តង់ដារ ${photoThreshold} mg/dL ណែនាំឱ្យចាប់ផ្តើមបញ្ចាំងពន្លឺ និងតាមដានការបំបៅទឹកដោះ`;
      irradianceRecommendation = 'Standard irradiance (15-20 uW/cm2/nm)';
    } else if (distanceToThreshold <= 2.0) {
      action = 'MONITOR_REPEAT_TSB_12H';
      actionEn = `TSB of ${validTsb} mg/dL is within 2.0 mg/dL of phototherapy threshold (${photoThreshold} mg/dL). Monitor clinical jaundice closely and repeat TSB in 12 hours.`;
      actionKm = `កម្រិត Bilirubin ${validTsb} mg/dL នៅកៀកនឹងកម្រិតកំណត់ ក្នុងគម្លាតក្រោម ២.០ mg/dL គួរតែតាមដានពណ៌សម្បុរ និងពិនិត្យឈាមម្តងទៀតក្នុងរយៈពេល ១២ ម៉ោង`;
      irradianceRecommendation = 'None currently. Serial monitoring indicated.';
    } else {
      action = 'LOW_RISK_CONTINUE_NORMAL_CARE';
      actionEn = `TSB of ${validTsb} mg/dL is safely below phototherapy cutoff (${photoThreshold} mg/dL). Continue standard neonatal nursery care and lactation support.`;
      actionKm = `កម្រិត Bilirubin ${validTsb} mg/dL ស្ថិតក្នុងដែនកំណត់សុវត្ថិភាពល្អ អាចបន្តការថែទាំទារកទូទៅ និងបំបៅដោះម្តាយធម្មតា`;
      irradianceRecommendation = 'None';
    }

    return {
      postnatalHours: validHours,
      totalSerumBilirubinMgDl: validTsb,
      gestationalAgeWeeks,
      hasNeurotoxicityRiskFactors,
      riskCategory,
      phototherapyThresholdMgDl: photoThreshold,
      exchangeTransfusionThresholdMgDl: exchangeThreshold,
      distanceToPhototherapyThresholdMgDl: distanceToThreshold,
      action,
      actionEn,
      actionKm,
      irradianceRecommendation
    };
  }
}
