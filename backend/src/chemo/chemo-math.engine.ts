// Mathematical & Algorithmic Engine for Chemotherapy Oncology Precision Dosing
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  BsaCalculationResult,
  CalvertDosingResult,
  AnthracyclineCumulativeExposure,
  LabSafetyCheckResult
} from './chemo.types.ts';

export class ChemoMathEngine {
  /**
   * Calculates Body Surface Area (BSA) using Mosteller, DuBois, and Haycock formulas.
   * Optionally enforces the 2.0 m^2 safety cap for obese patients to avoid chemotherapy overdosage.
   */
  public static calculateBsa(heightCm: number, weightKg: number, capAt2_0: boolean = false): BsaCalculationResult {
    const validHeight = Math.max(10, heightCm);
    const validWeight = Math.max(1, weightKg);

    // Mosteller Formula: sqrt((Height * Weight) / 3600)
    const mostellerRaw = Math.sqrt((validHeight * validWeight) / 3600);
    const mostellerBsa = Math.round(mostellerRaw * 100) / 100;

    // DuBois & DuBois Formula: 0.007184 * (Height^0.725) * (Weight^0.425)
    const duboisRaw = 0.007184 * Math.pow(validHeight, 0.725) * Math.pow(validWeight, 0.425);
    const duboisBsa = Math.round(duboisRaw * 100) / 100;

    // Haycock Formula: 0.024265 * (Height^0.3964) * (Weight^0.5378)
    const haycockRaw = 0.024265 * Math.pow(validHeight, 0.3964) * Math.pow(validWeight, 0.5378);
    const haycockBsa = Math.round(haycockRaw * 100) / 100;

    let clinicalDosingBsa = mostellerBsa;
    let isCapped = false;

    if (capAt2_0 && clinicalDosingBsa > 2.0) {
      clinicalDosingBsa = 2.0;
      isCapped = true;
    }

    return {
      heightCm: validHeight,
      weightKg: validWeight,
      mostellerBsa,
      duboisBsa,
      haycockBsa,
      clinicalDosingBsa,
      isCappedAt2_0: isCapped
    };
  }

  /**
   * Calculates Carboplatin dose using the Calvert Formula:
   * Total Dose (mg) = Target AUC * (GFR + 25)
   * Enforces FDA and ASCO safety cap of 125 mL/min on GFR to prevent severe myelosuppression.
   */
  public static calculateCalvertCarboplatin(targetAuc: number, measuredGfr: number): CalvertDosingResult {
    const validAuc = Math.max(1, Math.min(8, targetAuc));
    const safeMeasuredGfr = Math.max(10, measuredGfr);
    const GFR_CAP = 125; // mL/min

    const isGfrCapped = safeMeasuredGfr > GFR_CAP;
    const cappedGfr = isGfrCapped ? GFR_CAP : safeMeasuredGfr;

    // Total Carboplatin Dose = Target AUC * (cappedGfr + 25)
    const rawDose = validAuc * (cappedGfr + 25);
    const calculatedCarboplatinDoseMg = Math.round(rawDose);
    const maximumRecommendedDoseMg = Math.round(validAuc * (GFR_CAP + 25));

    let clinicalRationaleEn = '';
    let clinicalRationaleKm = '';

    if (isGfrCapped) {
      clinicalRationaleEn = `Measured GFR of ${safeMeasuredGfr} mL/min exceeded the FDA/ASCO safety ceiling. Dosing calculated using capped GFR of 125 mL/min to prevent fatal thrombocytopenia.`;
      clinicalRationaleKm = `កម្រិត GFR វាស់ឃើញ ${safeMeasuredGfr} mL/min លើសពីដែនកំណត់សុវត្ថិភាពជាតិ ត្រូវបានកែតម្រូវមកត្រឹម ១២៥ mL/min តាមស្តង់ដារ ASCO ដើម្បីការពារការធ្លាក់ចុះផ្លាកែតធ្ងន់ធ្ងរ`;
    } else {
      clinicalRationaleEn = `Carboplatin Calvert dose of ${calculatedCarboplatinDoseMg} mg calculated using Target AUC ${validAuc} and patient GFR of ${cappedGfr} mL/min.`;
      clinicalRationaleKm = `កម្រិតថ្នាំ Carboplatin ចំនួន ${calculatedCarboplatinDoseMg} mg ត្រូវបានគណនាយ៉ាងត្រឹមត្រូវតាម Target AUC ${validAuc} និងកម្រិតតម្រងនោម GFR ${cappedGfr} mL/min`;
    }

    return {
      targetAuc: validAuc,
      measuredGfr: safeMeasuredGfr,
      cappedGfr,
      calculatedCarboplatinDoseMg,
      isGfrCapped,
      maximumRecommendedDoseMg,
      clinicalRationaleEn,
      clinicalRationaleKm
    };
  }

  /**
   * Calculates Absolute Neutrophil Count (ANC):
   * ANC = WBC * ((Neutrophils % + Bands %) / 100)
   */
  public static calculateAnc(wbc: number, neutrophilPercent: number, bandPercent: number): number {
    const validWbc = Math.max(0, wbc);
    const totalNeutrophilsFraction = Math.max(0, neutrophilPercent + bandPercent) / 100;
    return Math.round(validWbc * totalNeutrophilsFraction);
  }

  /**
   * Cumulative Anthracycline Cardiotoxicity Lifetime Ceiling Tracker.
   * Converts anthracyclines to Doxorubicin isotoxic equivalents and enforces lifetime ceilings.
   */
  public static calculateAnthracyclineCumulativeExposure(
    currentCumulativeDoxorubicinEquiv: number,
    newDoseMgM2: number,
    agentCode: string = 'DOXORUBICIN',
    lifetimeCeilingMgM2: number = 450
  ): AnthracyclineCumulativeExposure {
    const conversionFactors: Record<string, number> = {
      DOXORUBICIN: 1.0,
      DAUNORUBICIN: 0.5,
      EPIRUBICIN: 0.6,
      IDARUBICIN: 5.0
    };

    const factor = conversionFactors[agentCode.toUpperCase()] || 1.0;
    const newEquivalentDose = newDoseMgM2 * factor;
    const projectedCumulative = Math.round((currentCumulativeDoxorubicinEquiv + newEquivalentDose) * 10) / 10;
    const percentOfCeiling = Math.round((projectedCumulative / lifetimeCeilingMgM2) * 100 * 10) / 10;

    let status: AnthracyclineCumulativeExposure['status'] = 'SAFE_RANGE';
    let actionEn = '';
    let actionKm = '';

    if (projectedCumulative >= lifetimeCeilingMgM2) {
      status = 'HARD_CARDIOTOXICITY_BLOCK';
      actionEn = `Lifetime anthracycline ceiling of ${lifetimeCeilingMgM2} mg/m2 reached or exceeded (${projectedCumulative} mg/m2). Dispensing blocked due to extreme irreversible cardiomyopathy and congestive heart failure risk.`;
      actionKm = `កម្រិតប្រមូលផ្តុំអតិបរមាពេញមួយជីវិតនៃថ្នាំ Anthracycline ${lifetimeCeilingMgM2} mg/m2 ត្រូវបានឆ្លងកាត់ ដែលមានហានិភ័យខ្ពស់បំផុតបង្កឱ្យខ្សោយបេះដូងធ្ងន់ធ្ងរ ប្រព័ន្ធបានចាក់សោសុវត្ថិភាពមិនឱ្យបញ្ចេញថ្នាំឡើយ`;
    } else if (projectedCumulative >= lifetimeCeilingMgM2 * 0.8) {
      status = 'CARDIOTOXICITY_WARNING';
      actionEn = `Approaching lifetime anthracycline ceiling (${percentOfCeiling}% of ${lifetimeCeilingMgM2} mg/m2 limit). Mandatory baseline echocardiogram LVEF > 50% and dexrazoxane cardioprotectant recommended.`;
      actionKm = `កម្រិតថ្នាំគីមី Anthracycline កំពុងខិតជិតដល់កម្រិតគ្រោះថ្នាក់អតិបរមា ${percentOfCeiling} ភាគរយ តម្រូវឱ្យធ្វើតេស្តអេកូបេះដូង LVEF លើស ៥០ ភាគរយ និងពិចារណាប្រើថ្នាំការពារបេះដូង Dexrazoxane`;
    } else {
      status = 'SAFE_RANGE';
      actionEn = `Cumulative anthracycline exposure within standard therapeutic window (${percentOfCeiling}% of lifetime limit).`;
      actionKm = `កម្រិតថ្នាំគីមី Anthracycline សរុបស្ថិតក្នុងដែនកំណត់សុវត្ថិភាពធម្មតា ${percentOfCeiling} ភាគរយ នៃកម្រិតអតិបរមាពេញមួយជីវិត`;
    }

    return {
      currentLifetimeCumulativeDoseMgM2: currentCumulativeDoxorubicinEquiv,
      lifetimeCeilingMgM2,
      percentOfLifetimeCeiling: percentOfCeiling,
      proposedDoseMgM2: newDoseMgM2,
      projectedCumulativeDoseMgM2: projectedCumulative,
      status,
      actionEn,
      actionKm
    };
  }

  /**
   * ASCO and NCCN Chemotherapy Laboratory Safety Hold Gate.
   * Evaluates hematologic, hepatic, and renal parameters prior to dispensing.
   */
  public static evaluateLabSafetyGate(
    anc: number,
    platelets: number,
    totalBilirubinMgDl: number,
    astAltUlnRatio: number,
    crCl: number
  ): LabSafetyCheckResult {
    const violations: string[] = [];
    let doseAdjustmentFactor = 1.0;

    // 1. Absolute Neutrophil Count Check (Hold if ANC < 1,500/uL)
    if (anc < 1500) {
      violations.push(`ANC ${anc}/uL is below the 1,500/uL threshold (Severe Neutropenia)`);
    }

    // 2. Platelet Count Check (Hold if Platelets < 100,000/uL)
    if (platelets < 100000) {
      violations.push(`Platelet count ${platelets}/uL is below the 100,000/uL threshold (Thrombocytopenia)`);
    }

    // Determine status
    if (violations.length > 0) {
      return {
        absoluteNeutrophilCount: anc,
        platelets,
        totalBilirubinMgDl,
        astAltUlnRatio,
        crCl,
        overallStatus: 'CHEMOTHERAPY_HOLD',
        violations,
        recommendationEn: `CHEMOTHERAPY HOLD. Cycle administration contraindicated due to severe hematologic toxicity: ${violations.join(', ')}. Re-evaluate CBC in 48-72 hours.`,
        recommendationKm: `ផ្អាកការផ្តល់ថ្នាំគីមីបណ្តោះអាសន្ន ដោយសារគ្រាប់ឈាមស ឬផ្លាកែតធ្លាក់ចុះទាបជាងកម្រិតសុវត្ថិភាព តម្រូវឱ្យពិនិត្យឈាមឡើងវិញក្នុងរយៈពេល ៤៨ ទៅ ៧២ ម៉ោង`,
        doseAdjustmentFactor: 0.0
      };
    }

    // 3. Hepatic impairment check: Total Bilirubin > 1.5x ULN (ULN ~ 1.2 mg/dL -> > 1.8 mg/dL)
    if (totalBilirubinMgDl > 1.8 || astAltUlnRatio > 3.0) {
      doseAdjustmentFactor = 0.50; // 50% dose attenuation
      violations.push(`Elevated bilirubin ${totalBilirubinMgDl} mg/dL or transaminases indicates significant hepatic impairment`);
      return {
        absoluteNeutrophilCount: anc,
        platelets,
        totalBilirubinMgDl,
        astAltUlnRatio,
        crCl,
        overallStatus: 'DOSE_REDUCTION_RECOMMENDED',
        violations,
        recommendationEn: `DOSE REDUCTION RECOMMENDED. Administer 50% of nominal protocol dose due to hepatic impairment (delayed drug clearance and elevated toxicity risk).`,
        recommendationKm: `ណែនាំឱ្យបន្ថយកម្រិតថ្នាំគីមីមកត្រឹម ៥០ ភាគរយ ដោយសារមុខងារថ្លើមមានការចុះខ្សោយ ដែលអាចបង្កឱ្យថ្នាំសេសសល់យូរក្នុងរាងកាយ`,
        doseAdjustmentFactor
      };
    }

    // 4. Renal impairment check: CrCl < 50 mL/min
    if (crCl < 50) {
      doseAdjustmentFactor = 0.75; // 25% dose reduction
      violations.push(`CrCl ${crCl} mL/min indicates moderate renal insufficiency`);
      return {
        absoluteNeutrophilCount: anc,
        platelets,
        totalBilirubinMgDl,
        astAltUlnRatio,
        crCl,
        overallStatus: 'DOSE_REDUCTION_RECOMMENDED',
        violations,
        recommendationEn: `DOSE REDUCTION RECOMMENDED. Administer 75% of nominal dose due to renal clearance impairment (CrCl < 50 mL/min).`,
        recommendationKm: `ណែនាំឱ្យបន្ថយកម្រិតថ្នាំគីមីមកត្រឹម ៧៥ ភាគរយ ដោយសារកម្រិតបន្សុទ្ធតម្រងនោម CrCl ទាបជាង ៥០ mL/min`,
        doseAdjustmentFactor
      };
    }

    // 5. All parameters normal
    return {
      absoluteNeutrophilCount: anc,
      platelets,
      totalBilirubinMgDl,
      astAltUlnRatio,
      crCl,
      overallStatus: 'PROCEED',
      violations: [],
      recommendationEn: 'All pre-chemotherapy hematologic, hepatic, and renal laboratory parameters meet full ASCO/NCCN safety thresholds. Proceed with full protocol dose.',
      recommendationKm: 'លទ្ធផលតេស្តឈាម មុខងារថ្លើម និងតម្រងនោម ឆ្លើយតបតាមស្តង់ដារសុវត្ថិភាពពេញលេញ អាចបន្តផ្តល់ថ្នាំគីមីតាមកម្រិតស្តង់ដារបាន',
      doseAdjustmentFactor: 1.0
    };
  }
}
