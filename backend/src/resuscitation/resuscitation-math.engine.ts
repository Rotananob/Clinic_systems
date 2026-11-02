// Mathematical & Algorithmic Engine for Emergency Sepsis & Trauma Resuscitation Protocols
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  QsofaAssessment,
  SofaOrganScores,
  SepsisHourOneBundlePlan,
  LactateClearanceKinetics,
  ParklandBurnCalculation,
  BurnUopTitrationFeedback,
  PediatricResuscitationCard,
  BroselowColorCode,
  ShockIndexAssessment,
  MassiveTransfusionProtocolAssessment,
} from './resuscitation.types.ts';

export class ResuscitationMathEngine {
  /**
   * quick SOFA (qSOFA) Score:
   * 1. Respiratory Rate >= 22 breaths/min (1 pt)
   * 2. Altered mentation GCS < 15 (1 pt)
   * 3. Systolic blood pressure <= 100 mmHg (1 pt)
   * Score >= 2 triggers high-risk sepsis alert.
   */
  public static calculateQsofa(
    respiratoryRate: number,
    glasgowComaScale: number,
    systolicBp: number
  ): QsofaAssessment {
    const validRr = Math.max(0, respiratoryRate);
    const validGcs = Math.max(3, Math.min(15, glasgowComaScale));
    const validSbp = Math.max(0, systolicBp);

    let score = 0;
    if (validRr >= 22) score += 1;
    if (validGcs < 15) score += 1;
    if (validSbp <= 100) score += 1;

    const isHighRisk = score >= 2;

    const clinicalActionEn = isHighRisk
      ? 'High Risk: qSOFA >= 2 indicates substantial risk of prolonged ICU stay and in-hospital mortality. Immediately initiate Surviving Sepsis Hour-1 bundle.'
      : 'Low to Intermediate Risk: qSOFA < 2. Monitor vital signs closely and perform serial reassessments.';

    const clinicalActionKm = isHighRisk
      ? 'ហានិភ័យខ្ពស់ខ្លាំង៖ ពិន្ទុ qSOFA ចាប់ពី ២ ឡើង បង្ហាញពីហានិភ័យមរណភាពខ្ពស់ ត្រូវអនុវត្តកញ្ចប់សង្គ្រោះបន្ទាន់ Sepsis Hour-1 ជាបន្ទាន់'
      : 'ហានិភ័យទាបទៅមធ្យម៖ ពិន្ទុ qSOFA ក្រោម ២ ត្រូវតាមដានសញ្ញាជីវិតជាប្រចាំ និងវាយតម្លៃឡើងវិញជាបន្តបន្ទាប់';

    return {
      respiratoryRate: validRr,
      glasgowComaScale: validGcs,
      systolicBp: validSbp,
      score,
      isHighRisk,
      clinicalActionEn,
      clinicalActionKm,
    };
  }

  /**
   * Full Sequential Organ Failure Assessment (SOFA) Score.
   * Total range: 0 to 24 points.
   */
  public static calculateSofa(params: {
    pao2Fio2Ratio: number;
    plateletsPerUl: number;
    bilirubinMgDl: number;
    meanArterialPressure: number;
    vasopressorTier: 0 | 1 | 2 | 3 | 4;
    glasgowComaScale: number;
    creatinineMgDl: number;
    urineOutputMlPerDay?: number;
  }): SofaOrganScores {
    // 1. Respiration (PaO2/FiO2)
    let respirationScore = 0;
    if (params.pao2Fio2Ratio < 100) respirationScore = 4;
    else if (params.pao2Fio2Ratio < 200) respirationScore = 3;
    else if (params.pao2Fio2Ratio < 300) respirationScore = 2;
    else if (params.pao2Fio2Ratio < 400) respirationScore = 1;

    // 2. Coagulation (Platelets x 10^3/uL)
    let coagulationScore = 0;
    if (params.plateletsPerUl < 20000) coagulationScore = 4;
    else if (params.plateletsPerUl < 50000) coagulationScore = 3;
    else if (params.plateletsPerUl < 100000) coagulationScore = 2;
    else if (params.plateletsPerUl < 150000) coagulationScore = 1;

    // 3. Liver (Bilirubin mg/dL)
    let liverScore = 0;
    if (params.bilirubinMgDl >= 12.0) liverScore = 4;
    else if (params.bilirubinMgDl >= 6.0) liverScore = 3;
    else if (params.bilirubinMgDl >= 2.0) liverScore = 2;
    else if (params.bilirubinMgDl >= 1.2) liverScore = 1;

    // 4. Cardiovascular (MAP / Vasopressors)
    let cardiovascularScore = 0;
    if (params.vasopressorTier > 0) {
      cardiovascularScore = params.vasopressorTier;
    } else if (params.meanArterialPressure < 70) {
      cardiovascularScore = 1;
    }

    // 5. Central Nervous System (GCS)
    let neurologicalScore = 0;
    if (params.glasgowComaScale < 6) neurologicalScore = 4;
    else if (params.glasgowComaScale <= 9) neurologicalScore = 3;
    else if (params.glasgowComaScale <= 12) neurologicalScore = 2;
    else if (params.glasgowComaScale <= 14) neurologicalScore = 1;

    // 6. Renal (Creatinine mg/dL or UOP)
    let renalScore = 0;
    const uop = params.urineOutputMlPerDay !== undefined ? params.urineOutputMlPerDay : 1500;
    if (params.creatinineMgDl >= 5.0 || uop < 200) renalScore = 4;
    else if (params.creatinineMgDl >= 3.5 || uop < 500) renalScore = 3;
    else if (params.creatinineMgDl >= 2.0) renalScore = 2;
    else if (params.creatinineMgDl >= 1.2) renalScore = 1;

    const totalScore =
      respirationScore +
      coagulationScore +
      liverScore +
      cardiovascularScore +
      neurologicalScore +
      renalScore;

    // Projected in-hospital mortality benchmark correlation
    let projectedMortalityRatePercent = 3.0;
    if (totalScore >= 15) projectedMortalityRatePercent = 85.0;
    else if (totalScore >= 12) projectedMortalityRatePercent = 60.0;
    else if (totalScore >= 10) projectedMortalityRatePercent = 50.0;
    else if (totalScore >= 8) projectedMortalityRatePercent = 30.0;
    else if (totalScore >= 6) projectedMortalityRatePercent = 20.0;
    else if (totalScore >= 4) projectedMortalityRatePercent = 15.0;
    else if (totalScore >= 2) projectedMortalityRatePercent = 8.0;

    return {
      respirationScore,
      coagulationScore,
      liverScore,
      cardiovascularScore,
      neurologicalScore,
      renalScore,
      totalScore,
      projectedMortalityRatePercent,
      sepsisAlertTriggered: totalScore >= 2,
    };
  }

  /**
   * Surviving Sepsis Campaign (SSC) Hour-1 Bundle Calculator:
   * 30 mL/kg balanced crystalloids (Lactated Ringer's) for hypotension (MAP < 65) or Lactate >= 4.0 mmol/L.
   */
  public static calculateSepsisHourOneBundle(
    weightKg: number,
    initialLactateMmolL: number,
    measuredMapMmHg: number
  ): SepsisHourOneBundlePlan {
    const validWeight = Math.max(1, weightKg);
    const bolusVolume = Math.round(validWeight * 30);
    const hourlyRate = Math.round(bolusVolume / 3);

    return {
      weightKg: validWeight,
      initialLactateMmolL,
      measuredMapMmHg,
      crystalloidBolusVolumeMl: bolusVolume,
      preferredFluid: 'LACTATED_RINGERS',
      infusionTargetMinutes: 180,
      hourlyInfusionRateMlH: hourlyRate,
      vasopressorFirstLine: 'Norepinephrine IV Titration',
      vasopressorTargetMapMmHg: 65,
      bloodCulturesProtocolEn:
        'Obtain blood cultures prior to antibiotic administration, but do not delay antibiotics by more than 45 minutes.',
      bloodCulturesProtocolKm:
        'ត្រូវយកឈាមបណ្តុះមេរោគមុនពេលផ្តល់ថ្នាំផ្សះ ប៉ុន្តែមិនត្រូវពន្យារពេលផ្តល់ថ្នាំផ្សះលើសពី ៤៥ នាទីឡើយ',
      broadSpectrumAntimicrobialWindowMinutes: 60,
    };
  }

  /**
   * Lactate Clearance Kinetics:
   * Relative clearance = ((Baseline - Repeat) / Baseline) * 100
   * Target is >= 20% decline every 2 hours indicating tissue reperfusion.
   */
  public static calculateLactateClearance(
    baselineLactateMmolL: number,
    repeatLactateMmolL: number,
    elapsedHours: number
  ): LactateClearanceKinetics {
    const baseline = Math.max(0.1, baselineLactateMmolL);
    const repeat = Math.max(0, repeatLactateMmolL);
    const validHours = Math.max(0.5, elapsedHours);

    const relativeClearancePercent = Math.round(((baseline - repeat) / baseline) * 1000) / 10;
    const isAdequate = relativeClearancePercent >= 20.0;

    let statusEn = '';
    let statusKm = '';
    let actionEn = '';
    let actionKm = '';

    if (isAdequate) {
      statusEn = `Adequate Lactate Clearance: ${relativeClearancePercent}% decline observed over ${validHours} hours.`;
      statusKm = `ការបញ្ចុះជាតិអាស៊ីតឡាក់ទិកល្អ៖ កម្រិតបានធ្លាក់ចុះ ${relativeClearancePercent}% ក្នុងរយៈពេល ${validHours} ម៉ោង`;
      actionEn = 'Continue current resuscitation protocol and wean vasopressors as hemodynamically tolerated.';
      actionKm = 'បន្តពិធីការសង្គ្រោះបច្ចុប្បន្ន និងកាត់បន្ថយកម្រិតថ្នាំទប់សម្ពាធឈាមតាមសភាពជាក់ស្តែង';
    } else {
      statusEn = `Impaired Lactate Clearance: Only ${relativeClearancePercent}% decline observed. Ongoing tissue hypoperfusion.`;
      statusKm = `ការបញ្ចុះជាតិអាស៊ីតឡាក់ទិកមិនគ្រប់គ្រាន់៖ ធ្លាក់ចុះបានត្រឹមតែ ${relativeClearancePercent}% បង្ហាញពីកង្វះអុកស៊ីសែនក្នុងជាលិកា`;
      actionEn = 'Escalate resuscitation: evaluate fluid responsiveness, optimize cardiac output, and re-assess source control.';
      actionKm = 'បង្កើនការសង្គ្រោះបន្ទាន់៖ ពិនិត្យការឆ្លើយតបនឹងការបញ្ចូលសេរ៉ូម បង្កើនកម្លាំងច្របាច់បេះដូង និងពិនិត្យប្រភពមេរោគឡើងវិញ';
    }

    return {
      baselineLactateMmolL: baseline,
      repeatLactateMmolL: repeat,
      elapsedHours: validHours,
      relativeClearancePercent,
      isAdequateClearance: isAdequate,
      statusEn,
      statusKm,
      actionEn,
      actionKm,
    };
  }

  /**
   * Parkland Burn Resuscitation Formula (Baxter):
   * Total 24h Fluid = 4 mL * Weight (kg) * %TBSA
   * - First 8 hours: 50% of total (timed from injury, NOT hospital arrival)
   * - Next 16 hours: remaining 50% of total
   */
  public static calculateParklandBurnFluid(
    weightKg: number,
    tbsaPercentage: number,
    hoursSinceInjury: number
  ): ParklandBurnCalculation {
    const validWeight = Math.max(1, weightKg);
    const validTbsa = Math.max(1, Math.min(100, tbsaPercentage));
    const validElapsed = Math.max(0, hoursSinceInjury);

    const totalFluid = Math.round(4 * validWeight * validTbsa);
    const first8hTotal = Math.round(totalFluid * 0.5);
    const next16hTotal = Math.round(totalFluid * 0.5);

    let remainingHoursInFirstPhase = Math.max(1, 8 - validElapsed);
    let remainingFirst8hVolume = first8hTotal;

    if (validElapsed >= 8) {
      remainingHoursInFirstPhase = 1;
      remainingFirst8hVolume = 0;
    }

    const first8hRate = Math.round(remainingFirst8hVolume / remainingHoursInFirstPhase);
    const next16hRate = Math.round(next16hTotal / 16);

    const titrationEn =
      'Titrate infusion rate by 20% hourly based on urine output: target 30-50 mL/h in adults to avoid abdominal compartment syndrome.';
    const titrationKm =
      'កែសម្រួលល្បឿនបញ្ចូលសេរ៉ូម ២០% រៀងរាល់ម៉ោងតាមបរិមាណទឹកនោម៖ គោលដៅ ៣០ ដល់ ៥០ mL ក្នុងមួយម៉ោងសម្រាប់មនុស្សពេញវ័យ';

    return {
      weightKg: validWeight,
      tbsaPercentage: validTbsa,
      hoursSinceInjury: validElapsed,
      total24HourFluidMl: totalFluid,
      first8HourTotalMl: first8hTotal,
      remainingFirst8HourMl: remainingFirst8hVolume,
      first8HourHourlyRateMlH: first8hRate,
      next16HourTotalMl: next16hTotal,
      next16HourHourlyRateMlH: next16hRate,
      targetAdultUopMlH: '30 - 50 mL/h (0.5 - 1.0 mL/kg/h)',
      titrationProtocolEn: titrationEn,
      titrationProtocolKm: titrationKm,
    };
  }

  /**
   * Titrates Burn Resuscitation Fluid based on hourly Urine Output (UOP).
   */
  public static titrateBurnFluidByUop(
    currentHourlyRateMlH: number,
    measuredHourlyUopMlH: number,
    isPediatric: boolean = false,
    weightKg: number = 70
  ): BurnUopTitrationFeedback {
    const minTarget = isPediatric ? weightKg * 1.0 : 30;
    const maxTarget = isPediatric ? weightKg * 1.5 : 50;

    let adjustedRate = currentHourlyRateMlH;
    let action: 'MAINTAIN' | 'INCREASE_20_PERCENT' | 'DECREASE_20_PERCENT' = 'MAINTAIN';
    let rationaleEn = '';
    let rationaleKm = '';

    if (measuredHourlyUopMlH < minTarget) {
      adjustedRate = Math.round(currentHourlyRateMlH * 1.2);
      action = 'INCREASE_20_PERCENT';
      rationaleEn = `Oliguria detected (${measuredHourlyUopMlH} mL/h < target ${minTarget} mL/h). Escalated infusion rate by 20% to prevent acute kidney injury.`;
      rationaleKm = `ទឹកនោមតិចជាងកម្រិតស្តង់ដារ ត្រូវបង្កើនល្បឿនសេរ៉ូម ២០% ដើម្បីការពារតម្រងនោមមិនឱ្យខូចស្រួចស្រាវ`;
    } else if (measuredHourlyUopMlH > maxTarget) {
      adjustedRate = Math.round(currentHourlyRateMlH * 0.8);
      action = 'DECREASE_20_PERCENT';
      rationaleEn = `Polyuria detected (${measuredHourlyUopMlH} mL/h > target ${maxTarget} mL/h). Reduced infusion rate by 20% to prevent fluid creep and pulmonary edema.`;
      rationaleKm = `ទឹកនោមលើសកម្រិតស្តង់ដារ ត្រូវបន្ថយល្បឿនសេរ៉ូម ២០% ដើម្បីការពារកុំឱ្យលើសជាតិទឹក និងហើមសួត`;
    } else {
      action = 'MAINTAIN';
      rationaleEn = `Adequate end-organ perfusion (${measuredHourlyUopMlH} mL/h within target ${minTarget}-${maxTarget} mL/h). Maintain current rate.`;
      rationaleKm = `បរិមាណទឹកនោមស្ថិតក្នុងកម្រិតល្អប្រសើរ ត្រូវរក្សាល្បឿនបញ្ចូលសេរ៉ូមដដែល`;
    }

    return {
      currentHourlyRateMlH,
      measuredHourlyUopMlH,
      adjustedHourlyRateMlH: adjustedRate,
      titrationAction: action,
      rationaleEn,
      rationaleKm,
    };
  }

  /**
   * Pediatric Broselow Color Zone & Resuscitation Equipment/Drug Sizing.
   */
  public static calculatePediatricResuscitation(
    ageYears: number,
    weightKg: number
  ): PediatricResuscitationCard {
    const validWeight = Math.max(3, weightKg);
    const validAge = Math.max(0, ageYears);

    // Broselow Color Zone mapping
    let color: BroselowColorCode = 'GREY';
    let colorEn = 'Grey (3 - 5 kg)';
    let colorKm = 'ពណ៌ប្រផេះ ៣ ដល់ ៥ គីឡូក្រាម';

    if (validWeight >= 30) {
      color = 'GREEN';
      colorEn = 'Green (30 - 36 kg)';
      colorKm = 'ពណ៌បៃតង ៣០ ដល់ ៣៦ គីឡូក្រាម';
    } else if (validWeight >= 24) {
      color = 'ORANGE';
      colorEn = 'Orange (24 - 29 kg)';
      colorKm = 'ពណ៌ទឹកក្រូច ២៤ ដល់ ២៩ គីឡូក្រាម';
    } else if (validWeight >= 19) {
      color = 'BLUE';
      colorEn = 'Blue (19 - 23 kg)';
      colorKm = 'ពណ៌ខៀវ ១៩ ដល់ ២៣ គីឡូក្រាម';
    } else if (validWeight >= 15) {
      color = 'WHITE';
      colorEn = 'White (15 - 18 kg)';
      colorKm = 'ពណ៌ស ១៥ ដល់ ១៨ គីឡូក្រាម';
    } else if (validWeight >= 12) {
      color = 'YELLOW';
      colorEn = 'Yellow (12 - 14 kg)';
      colorKm = 'ពណ៌លឿង ១២ ដល់ ១៤ គីឡូក្រាម';
    } else if (validWeight >= 10) {
      color = 'PURPLE';
      colorEn = 'Purple (10 - 11 kg)';
      colorKm = 'ពណ៌ស្វាយ ១០ ដល់ ១១ គីឡូក្រាម';
    } else if (validWeight >= 8) {
      color = 'RED';
      colorEn = 'Red (8 - 9 kg)';
      colorKm = 'ពណ៌ក្រហម ៨ ដល់ ៩ គីឡូក្រាម';
    } else if (validWeight >= 6) {
      color = 'PINK';
      colorEn = 'Pink (6 - 7 kg)';
      colorKm = 'ពណ៌ផ្កាឈូក ៦ ដល់ ៧ គីឡូក្រាម';
    }

    // Equipment Sizing
    let ettUncuffed = 3.5;
    let ettCuffed = 3.0;
    let ettDepth = 10.0;

    if (validAge >= 1) {
      ettUncuffed = Math.round(((validAge / 4) + 4) * 10) / 10;
      ettCuffed = Math.round(((validAge / 4) + 3.5) * 10) / 10;
      ettDepth = Math.round(((validAge / 2) + 12) * 10) / 10;
    } else {
      ettDepth = Math.round(validWeight + 6); // infant rule of thumb: wt + 6 cm
    }

    // Defibrillation
    const defibFirst = Math.round(validWeight * 2);
    const defibSubsequent = Math.min(200, Math.round(validWeight * 4));
    const cardioversion = Math.min(100, Math.round(validWeight * 1.0));

    // Emergency Medications
    const epiDose = Math.min(1.0, Math.round(validWeight * 0.01 * 100) / 100);
    const epiVol = Math.round(validWeight * 0.1 * 10) / 10;
    const amiodarone = Math.min(300, Math.round(validWeight * 5));
    const atropine = Math.min(0.5, Math.max(0.1, Math.round(validWeight * 0.02 * 100) / 100));
    const nsBolus = Math.round(validWeight * 20);

    return {
      estimatedWeightKg: validWeight,
      ageYears: validAge,
      broselowColor: color,
      colorNameEn: colorEn,
      colorNameKm: colorKm,
      ettUncuffedSizeMm: ettUncuffed,
      ettCuffedSizeMm: ettCuffed,
      ettDepthCm: ettDepth,
      defibrillationFirstJoules: defibFirst,
      defibrillationSubsequentJoules: defibSubsequent,
      cardioversionJoules: cardioversion,
      epinephrineDoseMg: epiDose,
      epinephrineVolumeMl1To10000: epiVol,
      amiodaroneBolusMg: amiodarone,
      atropineDoseMg: atropine,
      normalSalineBolusMl: nsBolus,
    };
  }

  /**
   * Shock Index (SI) = Heart Rate / Systolic BP.
   * Normal: 0.5 - 0.7
   * Elevated (occult shock): 0.7 - 0.9
   * Critical (imminent arrest): > 0.9
   */
  public static calculateShockIndex(
    heartRate: number,
    systolicBp: number
  ): ShockIndexAssessment {
    const validHr = Math.max(20, heartRate);
    const validSbp = Math.max(20, systolicBp);
    const si = Math.round((validHr / validSbp) * 100) / 100;

    let status: 'NORMAL' | 'ELEVATED' | 'CRITICAL_IMMINENT_ARREST' = 'NORMAL';
    let interpEn = '';
    let interpKm = '';

    if (si > 0.9) {
      status = 'CRITICAL_IMMINENT_ARREST';
      interpEn = `Critical Shock Index (${si} > 0.9): Severe hemorrhagic or cardiogenic shock. High risk of decompensation and massive transfusion requirement.`;
      interpKm = `សន្ទស្សន៍ឆក់ធ្ងន់ធ្ងរខ្លាំង ${si} បង្ហាញពីការបាត់បង់ឈាមធ្ងន់ធ្ងរ ឬខ្សោយបេះដូងស្រួចស្រាវ ត្រូវត្រៀមបញ្ចូលឈាមបន្ទាន់`;
    } else if (si >= 0.7) {
      status = 'ELEVATED';
      interpEn = `Elevated Shock Index (${si}): Early occult hypovolemia. Compensatory sympathetic response active.`;
      interpKm = `សន្ទស្សន៍ឆក់កើនឡើង ${si} បង្ហាញពីការខ្វះជាតិទឹក ឬឈាមក្នុងដំណាក់កាលដំបូង ត្រូវតាមដានយ៉ាងដិតដល់`;
    } else {
      status = 'NORMAL';
      interpEn = `Normal Shock Index (${si}): Hemodynamically stable compensatory parameters.`;
      interpKm = `សន្ទស្សន៍ឆក់ធម្មតា ${si} សម្ពាធឈាម និងចង្វាក់បេះដូងមានស្ថិរភាពល្អ`;
    }

    return {
      heartRate: validHr,
      systolicBp: validSbp,
      shockIndex: si,
      status,
      clinicalInterpretationEn: interpEn,
      clinicalInterpretationKm: interpKm,
    };
  }

  /**
   * Assessment of Blood Consumption (ABC) Score & Massive Transfusion Protocol (MTP):
   * 1. Penetrating trauma mechanism (1 pt)
   * 2. Emergency department SBP <= 90 mmHg (1 pt)
   * 3. Emergency department HR >= 120 bpm (1 pt)
   * 4. Positive FAST ultrasound examination (1 pt)
   * Score >= 2 activates Massive Transfusion Protocol (1:1:1 balanced ratio).
   * Also verifies Tranexamic Acid (TXA) eligibility within 3-hour CRASH-2 therapeutic window.
   */
  public static evaluateMtpCriteria(params: {
    heartRate: number;
    systolicBp: number;
    isPenetratingInjury: boolean;
    fastUltrasoundPositive: boolean;
    hoursSinceInjury: number;
  }): MassiveTransfusionProtocolAssessment {
    const siObj = this.calculateShockIndex(params.heartRate, params.systolicBp);

    let abcScore = 0;
    if (params.isPenetratingInjury) abcScore += 1;
    if (params.systolicBp <= 90) abcScore += 1;
    if (params.heartRate >= 120) abcScore += 1;
    if (params.fastUltrasoundPositive) abcScore += 1;

    const mtpActivated = abcScore >= 2 || siObj.shockIndex >= 1.0;

    const withinWindow = params.hoursSinceInjury <= 3.0;
    const txaIndicated = mtpActivated && withinWindow;
    const txaStatus = withinWindow ? 'GIVE_IMMEDIATELY' : 'CONTRAINDICATED_WINDOW_EXCEEDED';

    let txaProtocolEn = '';
    let txaProtocolKm = '';

    if (withinWindow) {
      txaProtocolEn =
        'CRASH-2 Protocol Indicated: Administer Tranexamic Acid (TXA) 1 g IV bolus over 10 minutes, followed by 1 g IV maintenance infusion over 8 hours.';
      txaProtocolKm =
        'ពិធីការ CRASH-2៖ ផ្តល់ថ្នាំ Tranexamic Acid ១ ក្រាម ចាក់តាមសរសៃវ៉ែនក្នុងរយៈពេល ១០ នាទី រួចបន្ត ១ ក្រាម ទៀតតាមសេរ៉ូមរយៈពេល ៨ ម៉ោង';
    } else {
      txaProtocolEn =
        'TXA Contraindicated: Injury elapsed time exceeds 3 hours. Administration beyond 3 hours is associated with increased bleeding and mortality in CRASH-2.';
      txaProtocolKm =
        'មិនអនុញ្ញាតឱ្យប្រើ TXA ឡើយ៖ ពេលវេលាក្រោយរបួសលើសពី ៣ ម៉ោង ការផ្តល់ហួស ៣ ម៉ោងបង្កើនហានិភ័យហូរឈាម និងមរណភាព';
    }

    return {
      shockIndex: siObj.shockIndex,
      isPenetratingInjury: params.isPenetratingInjury,
      systolicBpBelow90: params.systolicBp <= 90,
      heartRateAbove120: params.heartRate >= 120,
      fastUltrasoundPositive: params.fastUltrasoundPositive,
      abcScore,
      mtpActivated,
      balancedRatioDescription: '1:1:1 Hemostatic Ratio: 1 Unit PRBC : 1 Unit FFP : 1 Unit Platelets',
      txaIndicated,
      txaAdministrationStatus: txaStatus,
      txaProtocolEn,
      txaProtocolKm,
    };
  }
}
