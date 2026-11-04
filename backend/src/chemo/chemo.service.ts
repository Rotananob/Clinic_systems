// Chemotherapy Oncology Service
// Manages protocols, patient cycles, lifetime anthracycline cardiotoxicity tracking, and lab gates.
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  ChemoRegimen,
  PatientOncologyProfile,
  BsaCalculationResult,
  CalvertDosingResult,
  AnthracyclineCumulativeExposure,
  LabSafetyCheckResult
} from './chemo.types';
import { ChemoMathEngine } from './chemo-math.engine';

export class ChemoService {
  private static instance: ChemoService;

  private readonly regimens: Map<string, ChemoRegimen> = new Map();
  private readonly patients: Map<string, PatientOncologyProfile> = new Map();

  private constructor() {
    this.seedMasterRegimens();
    this.seedSamplePatients();
  }

  public static getInstance(): ChemoService {
    if (!ChemoService.instance) {
      ChemoService.instance = new ChemoService();
    }
    return ChemoService.instance;
  }

  private seedMasterRegimens(): void {
    const list: ChemoRegimen[] = [
      {
        code: 'FOLFOX6',
        name: 'mFOLFOX6 (Oxaliplatin + Leucovorin + 5-FU)',
        tumorType: 'Colorectal Adenocarcinoma',
        cycleLengthDays: 14,
        totalCyclesRecommended: 12,
        drugs: [
          {
            drugCode: 'OXALIPLATIN',
            drugName: 'Oxaliplatin IV',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 85,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 120,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: 'LEUCOVORIN',
            drugName: 'Leucovorin (Folinic Acid) IV',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 400,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 120,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: '5FU_BOLUS',
            drugName: 'Fluorouracil (5-FU) IV Bolus',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 400,
            route: 'IV_BOLUS',
            infusionDurationMinutes: 15,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: '5FU_CONTINUOUS',
            drugName: 'Fluorouracil (5-FU) Continuous Infusion',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 2400,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 2760, // 46 hours
            dayOfCycle: [1, 2],
            isAnthracycline: false
          }
        ],
        premedications: ['Dexamethasone 12 mg IV', 'Ondansetron 16 mg IV', 'Aprepitant 125 mg PO'],
        hydrationProtocolEn: 'Dextrose 5% in Water 500 mL pre and post Oxaliplatin infusion. Strictly avoid cold liquids or exposure.',
        hydrationProtocolKm: 'ផ្តល់សេរ៉ូម Dextrose 5% 500 mL មុននិងក្រោយចាក់ថ្នាំ Oxaliplatin និងចៀសវាងប៉ះពាល់វត្ថុត្រជាក់'
      },
      {
        code: 'R_CHOP',
        name: 'R-CHOP (Rituximab + Cyclophosphamide + Doxorubicin + Vincristine + Prednisone)',
        tumorType: 'Diffuse Large B-Cell Lymphoma (DLBCL)',
        cycleLengthDays: 21,
        totalCyclesRecommended: 6,
        drugs: [
          {
            drugCode: 'RITUXIMAB',
            drugName: 'Rituximab IV',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 375,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 240,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: 'CYCLOPHOSPHAMIDE',
            drugName: 'Cyclophosphamide IV',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 750,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 60,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: 'DOXORUBICIN',
            drugName: 'Doxorubicin (Adriamycin) IV',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 50,
            route: 'IV_BOLUS',
            infusionDurationMinutes: 30,
            dayOfCycle: [1],
            isAnthracycline: true,
            anthracyclineEquivalentFactor: 1.0
          },
          {
            drugCode: 'VINCRISTINE',
            drugName: 'Vincristine IV (Capped at 2.0 mg)',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 1.4,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 15,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: 'PREDNISONE',
            drugName: 'Prednisone Tablets',
            dosingBasis: 'FLAT_DOSE',
            standardDoseUnit: 'mg',
            nominalDoseValue: 100,
            route: 'ORAL',
            infusionDurationMinutes: 0,
            dayOfCycle: [1, 2, 3, 4, 5],
            isAnthracycline: false
          }
        ],
        premedications: ['Diphenhydramine 50 mg IV', 'Paracetamol 1000 mg PO', 'Ondansetron 8 mg IV'],
        hydrationProtocolEn: 'Normal Saline 1,000 mL hydration to prevent Cyclophosphamide-induced hemorrhagic cystitis.',
        hydrationProtocolKm: 'ផ្តល់សេរ៉ូម Normal Saline ១០០០ mL ដើម្បីការពារការរលាកប្លោកនោមចេញឈាមពីថ្នាំ Cyclophosphamide'
      },
      {
        code: 'CARBO_PACLI',
        name: 'Carboplatin + Paclitaxel',
        tumorType: 'Non-Small Cell Lung Cancer & Ovarian Cancer',
        cycleLengthDays: 21,
        totalCyclesRecommended: 6,
        drugs: [
          {
            drugCode: 'PACLITAXEL',
            drugName: 'Paclitaxel IV',
            dosingBasis: 'BSA_M2',
            standardDoseUnit: 'mg/m2',
            nominalDoseValue: 175,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 180,
            dayOfCycle: [1],
            isAnthracycline: false
          },
          {
            drugCode: 'CARBOPLATIN',
            drugName: 'Carboplatin IV (Calvert Formula)',
            dosingBasis: 'CALVERT_AUC',
            standardDoseUnit: 'AUC',
            nominalDoseValue: 5.0,
            route: 'IV_INFUSION',
            infusionDurationMinutes: 60,
            dayOfCycle: [1],
            isAnthracycline: false
          }
        ],
        premedications: ['Dexamethasone 20 mg PO 12h and 6h prior', 'Diphenhydramine 50 mg IV', 'Famotidine 20 mg IV'],
        hydrationProtocolEn: 'Pre-hydration with Normal Saline 500 mL over 60 minutes.',
        hydrationProtocolKm: 'ផ្តល់ជាតិទឹក Normal Saline ៥០០ mL ក្នុងរយៈពេល ៦០ នាទីមុនពេលចាក់ថ្នាំ'
      }
    ];

    for (const reg of list) {
      this.regimens.set(reg.code, reg);
    }
  }

  private seedSamplePatients(): void {
    this.patients.set('ONCO-PT-001', {
      patientId: 'ONCO-PT-001',
      patientName: 'Chan Moni',
      tumorDiagnosis: 'Colorectal Adenocarcinoma Stage III',
      regimenCode: 'FOLFOX6',
      currentCycle: 3,
      heightCm: 165,
      weightKg: 62,
      serumCreatinine: 0.9,
      totalBilirubin: 0.8,
      wbc: 5500,
      neutrophilPercent: 58,
      bandPercent: 2,
      platelets: 195000,
      lifetimeAnthracyclineDoxorubicinEquivMgM2: 0
    });

    this.patients.set('ONCO-PT-002', {
      patientId: 'ONCO-PT-002',
      patientName: 'Khem Veasna',
      tumorDiagnosis: 'Diffuse Large B-Cell Lymphoma Stage IV',
      regimenCode: 'R_CHOP',
      currentCycle: 4,
      heightCm: 172,
      weightKg: 78,
      serumCreatinine: 1.1,
      totalBilirubin: 1.0,
      wbc: 4200,
      neutrophilPercent: 48,
      bandPercent: 4,
      platelets: 145000,
      lifetimeAnthracyclineDoxorubicinEquivMgM2: 150 // 3 prior cycles of 50 mg/m2
    });
  }

  public getRegimens(): ChemoRegimen[] {
    return Array.from(this.regimens.values());
  }

  public getRegimenByCode(code: string): ChemoRegimen | undefined {
    return this.regimens.get(code);
  }

  public getPatients(): PatientOncologyProfile[] {
    return Array.from(this.patients.values());
  }

  public getPatientById(id: string): PatientOncologyProfile | undefined {
    return this.patients.get(id);
  }

  public calculateBsa(heightCm: number, weightKg: number, capAt2_0?: boolean): BsaCalculationResult {
    return ChemoMathEngine.calculateBsa(heightCm, weightKg, capAt2_0);
  }

  public calculateCalvert(targetAuc: number, measuredGfr: number): CalvertDosingResult {
    return ChemoMathEngine.calculateCalvertCarboplatin(targetAuc, measuredGfr);
  }

  public checkAnthracyclineSafety(
    currentCumulative: number,
    newDoseMgM2: number,
    agentCode?: string
  ): AnthracyclineCumulativeExposure {
    return ChemoMathEngine.calculateAnthracyclineCumulativeExposure(currentCumulative, newDoseMgM2, agentCode);
  }

  public checkLabSafetyGate(
    wbc: number,
    neutrophilPercent: number,
    bandPercent: number,
    platelets: number,
    totalBilirubin: number,
    astAltRatio: number,
    crCl: number
  ): LabSafetyCheckResult {
    const anc = ChemoMathEngine.calculateAnc(wbc, neutrophilPercent, bandPercent);
    return ChemoMathEngine.evaluateLabSafetyGate(anc, platelets, totalBilirubin, astAltRatio, crCl);
  }

  public calculatePatientCycleDosing(patientId: string, regimenCode: string): any {
    const patient = this.patients.get(patientId);
    const regimen = this.regimens.get(regimenCode);

    if (!patient || !regimen) {
      throw new Error('Patient or regimen not found.');
    }

    const bsa = ChemoMathEngine.calculateBsa(patient.heightCm, patient.weightKg, true);
    const anc = ChemoMathEngine.calculateAnc(patient.wbc, patient.neutrophilPercent, patient.bandPercent);
    const crCl = Math.round(((140 - 55) * patient.weightKg) / (72 * patient.serumCreatinine)); // standard approx
    const labGate = ChemoMathEngine.evaluateLabSafetyGate(anc, patient.platelets, patient.totalBilirubin, 1.0, crCl);

    const calculatedDrugs = regimen.drugs.map((drug) => {
      let nominalDose = 0;
      let unit = 'mg';

      if (drug.dosingBasis === 'BSA_M2') {
        nominalDose = Math.round(drug.nominalDoseValue * bsa.clinicalDosingBsa * 10) / 10;
        // Vincristine safety capping at 2.0 mg absolute maximum
        if (drug.drugCode === 'VINCRISTINE' && nominalDose > 2.0) {
          nominalDose = 2.0;
        }
      } else if (drug.dosingBasis === 'CALVERT_AUC') {
        const calvert = ChemoMathEngine.calculateCalvertCarboplatin(drug.nominalDoseValue, crCl);
        nominalDose = calvert.calculatedCarboplatinDoseMg;
      } else if (drug.dosingBasis === 'FLAT_DOSE') {
        nominalDose = drug.nominalDoseValue;
      }

      const finalAdjustedDose = Math.round(nominalDose * labGate.doseAdjustmentFactor * 10) / 10;

      let anthracyclineSafety = null;
      if (drug.isAnthracycline) {
        anthracyclineSafety = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(
          patient.lifetimeAnthracyclineDoxorubicinEquivMgM2,
          drug.nominalDoseValue,
          drug.drugCode
        );
      }

      return {
        drugCode: drug.drugCode,
        drugName: drug.drugName,
        dosingBasis: drug.dosingBasis,
        nominalDose,
        finalAdjustedDose,
        unit,
        dayOfCycle: drug.dayOfCycle,
        route: drug.route,
        anthracyclineSafety
      };
    });

    return {
      patient,
      regimen,
      bsa,
      labGate,
      calculatedDrugs
    };
  }
}
