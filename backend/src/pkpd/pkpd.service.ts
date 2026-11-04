/**
 * Clinical Pharmacokinetics (PK/PD) Precision Dosing Service
 * Therapeutic Drug Monitoring (TDM) and Bayesian Forecasting
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import {
  PatientAnthropometrics,
  DerivedBiometrics,
  TdmDrugCode,
  TdmDrugModel,
  PkParameters,
  MeasuredSerumLevel,
  DosingRegimenOption,
  TdmConsultationRecord
} from './pkpd.types';
import { PkPdMathEngine } from './pkpd-math.engine';

export const MASTER_TDM_DRUGS: TdmDrugModel[] = [
  {
    code: 'VANCOMYCIN',
    nameEn: 'Vancomycin Glycopeptide',
    nameKh: 'ថ្នាំសម្លាប់មេរោគ វ៉ាន់កូម៉ៃស៊ីន',
    therapeuticCategory: 'Glycopeptide Antibacterial',
    defaultInfusionHours: 1.5,
    targetMetrics: {
      targetAuc24Min: 400,
      targetAuc24Max: 600,
      targetTroughMin: 10.0,
      targetTroughMax: 15.0,
      toxicityTroughThreshold: 20.0,
      toxicityAlertEn: 'CRITICAL TOXICITY: Trough exceeds 20.0 mg/L or AUC24 exceeds 650. High nephrotoxicity risk.',
      toxicityAlertKh: 'អាសន្ន: កំហាប់ថ្នាំ Trough លើស ២០.០ mg/L ឬ AUC24 លើស ៦៥០ - ហានិភ័យខូចតម្រងនោមស្រួចស្រាវ'
    },
    populationVdPerKg: 0.7
  },
  {
    code: 'GENTAMICIN',
    nameEn: 'Gentamicin Aminoglycoside',
    nameKh: 'ថ្នាំសម្លាប់មេរោគ ហ្សង់តាម៉ៃស៊ីន',
    therapeuticCategory: 'Aminoglycoside Antibacterial',
    defaultInfusionHours: 0.5,
    targetMetrics: {
      targetPeakMin: 6.0,
      targetPeakMax: 10.0,
      targetTroughMin: 0.2,
      targetTroughMax: 1.0,
      toxicityTroughThreshold: 2.0,
      toxicityAlertEn: 'CRITICAL TOXICITY: Trough exceeds 2.0 mcg/mL. Elevated ototoxicity and acute tubular necrosis risk.',
      toxicityAlertKh: 'អាសន្ន: កំហាប់ថ្នាំ Trough លើស ២.០ mcg/mL - ហានិភ័យពុលសរសៃប្រសាទត្រចៀក និងខូចតម្រងនោម'
    },
    populationVdPerKg: 0.26
  },
  {
    code: 'AMIKACIN',
    nameEn: 'Amikacin Aminoglycoside',
    nameKh: 'ថ្នាំសម្លាប់មេរោគ អាមីកាស៊ីន',
    therapeuticCategory: 'Aminoglycoside Antibacterial',
    defaultInfusionHours: 0.5,
    targetMetrics: {
      targetPeakMin: 20.0,
      targetPeakMax: 30.0,
      targetTroughMin: 1.0,
      targetTroughMax: 5.0,
      toxicityTroughThreshold: 10.0,
      toxicityAlertEn: 'CRITICAL TOXICITY: Amikacin trough exceeds 10.0 mcg/mL.',
      toxicityAlertKh: 'អាសន្ន: កំហាប់ថ្នាំ Amikacin Trough លើស ១០.០ mcg/mL'
    },
    populationVdPerKg: 0.27
  },
  {
    code: 'DIGOXIN',
    nameEn: 'Digoxin Cardiac Glycoside',
    nameKh: 'ថ្នាំបេះដូង ឌីហ្សូស៊ីន',
    therapeuticCategory: 'Inotropic Cardiac Glycoside',
    defaultInfusionHours: 0.5,
    targetMetrics: {
      targetTroughMin: 0.5,
      targetTroughMax: 0.9,
      toxicityTroughThreshold: 2.0,
      toxicityAlertEn: 'CRITICAL DIGITALIS TOXICITY: Serum level exceeds 2.0 ng/mL. Lethal arrhythmia risk.',
      toxicityAlertKh: 'អាសន្នពុលថ្នាំបេះដូង Digitalis: កម្រិតថ្នាំក្នុងឈាមលើស ២.០ ng/mL - ហានិភ័យចង្វាក់បេះដូងស្លាប់'
    },
    populationVdPerKg: 7.0
  }
];

export class PkPdService {
  private consultations: Map<string, TdmConsultationRecord> = new Map();

  constructor() {
    this.initializeDefaultConsultations();
  }

  private initializeDefaultConsultations(): void {
    const vancoDrug = MASTER_TDM_DRUGS.find((d) => d.code === 'VANCOMYCIN')!;
    const patient1: PatientAnthropometrics = {
      patientId: 'P-10024',
      patientName: 'Sokha Chea',
      ageYears: 62,
      gender: 'MALE',
      actualWeightKg: 78,
      heightCm: 172,
      serumCreatinineMgDl: 1.4
    };

    const biometrics1 = PkPdMathEngine.deriveBiometrics(patient1);
    const popPk1 = PkPdMathEngine.calculatePopulationPk('VANCOMYCIN', biometrics1);
    const { recommended, alternatives } = PkPdMathEngine.recommendOptimalRegimen(vancoDrug, popPk1);

    const measuredLevels1: MeasuredSerumLevel[] = [
      {
        sampleId: 'SMPL-01-TROUGH',
        drawTimestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        hoursPostDose: 11.5,
        measuredConcentration: 13.8, // mg/L
        assayCvPercent: 6.0
      }
    ];

    const bayesianPk1 = PkPdMathEngine.runBayesianFitting(
      popPk1,
      measuredLevels1,
      recommended.doseMg,
      vancoDrug.defaultInfusionHours,
      recommended.intervalHours
    );

    this.consultations.set('TDM-VANCO-01', {
      consultationId: 'TDM-VANCO-01',
      bedId: 'BED-ICU-01',
      patient: patient1,
      biometrics: biometrics1,
      drug: vancoDrug,
      baselinePk: popPk1,
      measuredLevels: measuredLevels1,
      bayesianAdjustedPk: bayesianPk1,
      recommendedRegimen: recommended,
      alternativeRegimens: alternatives,
      consultantStaffId: 'CLINICAL-PHARMACIST-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  public getDrugLibrary(): TdmDrugModel[] {
    return [...MASTER_TDM_DRUGS];
  }

  public getDrugByCode(code: TdmDrugCode): TdmDrugModel {
    const drug = MASTER_TDM_DRUGS.find((d) => d.code === code);
    if (!drug) {
      throw new Error(`TDM Drug with code ${code} not supported`);
    }
    return drug;
  }

  public calculateBiometrics(patient: PatientAnthropometrics): {
    biometrics: DerivedBiometrics;
    baselinePk: Record<TdmDrugCode, PkParameters>;
  } {
    const biometrics = PkPdMathEngine.deriveBiometrics(patient);
    const baselinePk = {
      VANCOMYCIN: PkPdMathEngine.calculatePopulationPk('VANCOMYCIN', biometrics),
      GENTAMICIN: PkPdMathEngine.calculatePopulationPk('GENTAMICIN', biometrics),
      AMIKACIN: PkPdMathEngine.calculatePopulationPk('AMIKACIN', biometrics),
      DIGOXIN: PkPdMathEngine.calculatePopulationPk('DIGOXIN', biometrics),
      TOBRAMYCIN: PkPdMathEngine.calculatePopulationPk('TOBRAMYCIN', biometrics)
    };

    return { biometrics, baselinePk };
  }

  public optimizeDosing(drugCode: TdmDrugCode, patient: PatientAnthropometrics): {
    biometrics: DerivedBiometrics;
    drug: TdmDrugModel;
    baselinePk: PkParameters;
    recommendedRegimen: DosingRegimenOption;
    alternativeRegimens: DosingRegimenOption[];
  } {
    const drug = this.getDrugByCode(drugCode);
    const biometrics = PkPdMathEngine.deriveBiometrics(patient);
    const baselinePk = PkPdMathEngine.calculatePopulationPk(drugCode, biometrics);
    const { recommended, alternatives } = PkPdMathEngine.recommendOptimalRegimen(drug, baselinePk);

    return {
      biometrics,
      drug,
      baselinePk,
      recommendedRegimen: recommended,
      alternativeRegimens: alternatives
    };
  }

  public runBayesianFitting(
    drugCode: TdmDrugCode,
    patient: PatientAnthropometrics,
    currentDoseMg: number,
    intervalHours: number,
    measuredLevels: MeasuredSerumLevel[]
  ): {
    biometrics: DerivedBiometrics;
    drug: TdmDrugModel;
    baselinePk: PkParameters;
    bayesianPk: PkParameters;
    recommendedRegimen: DosingRegimenOption;
    alternativeRegimens: DosingRegimenOption[];
  } {
    const drug = this.getDrugByCode(drugCode);
    const biometrics = PkPdMathEngine.deriveBiometrics(patient);
    const baselinePk = PkPdMathEngine.calculatePopulationPk(drugCode, biometrics);

    const bayesianPk = PkPdMathEngine.runBayesianFitting(
      baselinePk,
      measuredLevels,
      currentDoseMg,
      drug.defaultInfusionHours,
      intervalHours
    );

    const { recommended, alternatives } = PkPdMathEngine.recommendOptimalRegimen(drug, bayesianPk);

    return {
      biometrics,
      drug,
      baselinePk,
      bayesianPk,
      recommendedRegimen: recommended,
      alternativeRegimens: alternatives
    };
  }

  public getAllConsultations(): TdmConsultationRecord[] {
    return Array.from(this.consultations.values());
  }

  public getConsultationById(id: string): TdmConsultationRecord {
    const consult = this.consultations.get(id);
    if (!consult) {
      throw new Error(`Consultation with ID ${id} not found`);
    }
    return consult;
  }
}
