/**
 * Smart Infusion Pump Dose Error Reduction System (DERS) Drug Library
 * Clinical guardrails, concentration formulations, and route safety limits
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

export type VascularRoute = 'PERIPHERAL_IV' | 'CENTRAL_LINE';
export type DosingUnit = 'mcg/kg/min' | 'mg/kg/hr' | 'units/hr' | 'mEq/hr' | 'mcg/hr' | 'ml/hr';
export type GuardrailSeverity = 'SAFE' | 'SOFT_LIMIT_BREACH' | 'HARD_LIMIT_BREACH';

export const VascularRoute = {};
export const DosingUnit = {};
export const GuardrailSeverity = {};

export interface DersConcentration {
  id: string;
  drugAmount: number;
  drugAmountUnit: 'mcg' | 'mg' | 'units' | 'mEq';
  diluentVolumeMl: number;
  diluentType: 'D5W' | 'NS' | 'LR' | 'D5_HALF_NS' | 'NEAT';
  calculatedConcentrationPerMl: number; // in base units: mcg/ml, units/ml, mEq/ml
  isStandardRecommended: boolean;
}

export interface DersDrugProfile {
  substanceCode: string;
  genericNameEn: string;
  genericNameKh: string;
  therapeuticCategory: string;
  dosingUnit: DosingUnit;
  requiresPatientWeight: boolean;
  standardConcentrations: DersConcentration[];
  guardrails: {
    softMin: number;
    softMax: number;
    hardMin: number;
    hardMax: number;
    routeSpecificLimits?: {
      PERIPHERAL_IV?: { hardMax: number; alertReasonKh: string; alertReasonEn: string };
      CENTRAL_LINE?: { hardMax: number; alertReasonKh: string; alertReasonEn: string };
    };
  };
  pcaConfig?: {
    isPcaAllowed: boolean;
    standardBolusDose: number;
    hardMaxBolusDose: number;
    standardLockoutMinutes: number;
    hardMinLockoutMinutes: number;
    fourHourMaxLimit: number;
  };
  clinicalNotesKh: string;
  clinicalNotesEn: string;
}

export const DersConcentration = {};
export const DersDrugProfile = {};

export const DERS_DRUG_LIBRARY: DersDrugProfile[] = [
  {
    substanceCode: 'DRUG-NOREP-01',
    genericNameEn: 'Norepinephrine Bitartrate',
    genericNameKh: 'ណរអេពីណេហ្វ្រីន - Levophed',
    therapeuticCategory: 'VASOPRESSOR',
    dosingUnit: 'mcg/kg/min',
    requiresPatientWeight: true,
    standardConcentrations: [
      {
        id: 'CONC-NOREP-STD',
        drugAmount: 4,
        drugAmountUnit: 'mg',
        diluentVolumeMl: 250,
        diluentType: 'D5W',
        calculatedConcentrationPerMl: 16, // 16 mcg/ml
        isStandardRecommended: true,
      },
      {
        id: 'CONC-NOREP-CONC',
        drugAmount: 8,
        drugAmountUnit: 'mg',
        diluentVolumeMl: 250,
        diluentType: 'D5W',
        calculatedConcentrationPerMl: 32, // 32 mcg/ml
        isStandardRecommended: false,
      },
    ],
    guardrails: {
      softMin: 0.01,
      softMax: 0.5,
      hardMin: 0.005,
      hardMax: 2.0,
      routeSpecificLimits: {
        PERIPHERAL_IV: {
          hardMax: 0.2,
          alertReasonKh: 'ការចាក់តាមសរសៃវ៉ែនគ្រឿងកៀកលើសកម្រិត ០.២ mcg/kg/min អាចបណ្តាលឱ្យរលួយជាលិកាធ្ងន់ធ្ងរ - ត្រូវប្រើ Central Line',
          alertReasonEn: 'Peripheral extravasation risk with Norepinephrine above 0.2 mcg/kg/min causes severe tissue necrosis: Central line required',
        },
      },
    },
    clinicalNotesKh: 'ថ្នាំបង្កើនសម្ពាធឈាមសរសៃរោហិតបន្ទាន់ - តម្រូវឱ្យតាមដានសម្ពាធឈាមតាមសរសៃអាទែជាប្រចាំ',
    clinicalNotesEn: 'First-line vasopressor for septic shock: Titrate to target MAP 65 mmHg with continuous arterial line monitoring',
  },
  {
    substanceCode: 'DRUG-DOPAM-02',
    genericNameEn: 'Dopamine Hydrochloride',
    genericNameKh: 'ដូប៉ាមីន អ៊ីដ្រូក្លរីត',
    therapeuticCategory: 'INOTROPE_VASOPRESSOR',
    dosingUnit: 'mcg/kg/min',
    requiresPatientWeight: true,
    standardConcentrations: [
      {
        id: 'CONC-DOPAM-STD',
        drugAmount: 400,
        drugAmountUnit: 'mg',
        diluentVolumeMl: 250,
        diluentType: 'D5W',
        calculatedConcentrationPerMl: 1600, // 1600 mcg/ml
        isStandardRecommended: true,
      },
    ],
    guardrails: {
      softMin: 2.0,
      softMax: 20.0,
      hardMin: 0.5,
      hardMax: 50.0,
    },
    clinicalNotesKh: 'កម្រិតទាប ២ ទៅ ៥ បង្កើនទឹកនោម: កម្រិតមធ្យម ៥ ទៅ ១០ ជួយកម្លាំងបេះដូង: កម្រិតខ្ពស់លើស ១០ រួញសរសៃឈាម',
    clinicalNotesEn: 'Dose-dependent adrenergic inotrope: Renal dose 2 to 5, inotropic dose 5 to 10, vasoconstriction above 10 mcg/kg/min',
  },
  {
    substanceCode: 'DRUG-HEPAR-03',
    genericNameEn: 'Heparin Sodium',
    genericNameKh: 'ហេប៉ារីន សូដ្យូម',
    therapeuticCategory: 'ANTICOAGULANT',
    dosingUnit: 'units/hr',
    requiresPatientWeight: false,
    standardConcentrations: [
      {
        id: 'CONC-HEPAR-STD',
        drugAmount: 25000,
        drugAmountUnit: 'units',
        diluentVolumeMl: 250,
        diluentType: 'D5W',
        calculatedConcentrationPerMl: 100, // 100 units/ml
        isStandardRecommended: true,
      },
    ],
    guardrails: {
      softMin: 200,
      softMax: 2000,
      hardMin: 100,
      hardMax: 3500,
    },
    clinicalNotesKh: 'ថ្នាំប្រឆាំងកំណកឈាម - ត្រូវផ្ទៀងផ្ទាត់តេស្ត aPTT រៀងរាល់ ៦ ម៉ោងម្តងដើម្បីកែសម្រួលល្បឿន',
    clinicalNotesEn: 'High-alert anticoagulant: Monitor aPTT every 6 hours and adjust according to weight-based nomogram',
  },
  {
    substanceCode: 'DRUG-INSUL-04',
    genericNameEn: 'Regular Human Insulin',
    genericNameKh: 'អាំងស៊ុយលីនធម្មតា - Regular Insulin',
    therapeuticCategory: 'ANTIDIABETIC',
    dosingUnit: 'units/hr',
    requiresPatientWeight: false,
    standardConcentrations: [
      {
        id: 'CONC-INSUL-STD',
        drugAmount: 100,
        drugAmountUnit: 'units',
        diluentVolumeMl: 100,
        diluentType: 'NS',
        calculatedConcentrationPerMl: 1.0, // 1 unit/ml
        isStandardRecommended: true,
      },
    ],
    guardrails: {
      softMin: 0.5,
      softMax: 15.0,
      hardMin: 0.1,
      hardMax: 30.0,
    },
    clinicalNotesKh: 'ថ្នាំបញ្ចុះជាតិស្ករក្នុងឈាមបន្ទាន់ - ត្រូវវាស់ជាតិស្ករតាមចុងម្រាមដៃរៀងរាល់ ១ ម៉ោងម្តង',
    clinicalNotesEn: 'Continuous IV insulin infusion for DKA / HHS: Check bedside capillary blood glucose every 1 hour',
  },
  {
    substanceCode: 'DRUG-PROP-05',
    genericNameEn: 'Propofol 1% Emulsion',
    genericNameKh: 'ប្រូប៉ូហ្វូល ១ ភាគរយ - សណ្តំសន្លប់',
    therapeuticCategory: 'SEDATIVE_HYPNOTIC',
    dosingUnit: 'mcg/kg/min',
    requiresPatientWeight: true,
    standardConcentrations: [
      {
        id: 'CONC-PROP-NEAT',
        drugAmount: 1000, // 1000 mg in 100 ml = 10 mg/ml = 10,000 mcg/ml
        drugAmountUnit: 'mg',
        diluentVolumeMl: 100,
        diluentType: 'NEAT',
        calculatedConcentrationPerMl: 10000,
        isStandardRecommended: true,
      },
    ],
    guardrails: {
      softMin: 5.0,
      softMax: 50.0,
      hardMin: 1.0,
      hardMax: 80.0,
    },
    clinicalNotesKh: 'ថ្នាំសណ្តំសន្លប់ ICU - កម្រិតលើស ៨០ mcg/kg/min ប្រឈមនឹងរោគសញ្ញា Propofol Infusion Syndrome ធ្ងន់ធ្ងរ',
    clinicalNotesEn: 'Sedative for mechanically ventilated ICU patients: Rates exceeding 80 mcg/kg/min risk fatal PRIS syndrome',
  },
  {
    substanceCode: 'DRUG-KCL-06',
    genericNameEn: 'Potassium Chloride',
    genericNameKh: 'ប៉ូតាស្យូមក្លរីត - KCl',
    therapeuticCategory: 'ELECTROLYTE',
    dosingUnit: 'mEq/hr',
    requiresPatientWeight: false,
    standardConcentrations: [
      {
        id: 'CONC-KCL-STD',
        drugAmount: 20,
        drugAmountUnit: 'mEq',
        diluentVolumeMl: 100,
        diluentType: 'NS',
        calculatedConcentrationPerMl: 0.2, // 0.2 mEq/ml
        isStandardRecommended: true,
      },
    ],
    guardrails: {
      softMin: 5.0,
      softMax: 10.0,
      hardMin: 1.0,
      hardMax: 20.0,
      routeSpecificLimits: {
        PERIPHERAL_IV: {
          hardMax: 10.0,
          alertReasonKh: 'កម្រិតប៉ូតាស្យូមចាក់តាមសរសៃវ៉ែនគ្រឿងកៀកហាមលើសពី ១០ mEq ក្នុងមួយម៉ោង - អាចរលាកសរសៃឈាម និងស្លាប់',
          alertReasonEn: 'Strict peripheral line hard limit: Infusions exceeding 10 mEq/hr cause severe chemical phlebitis and cardiac arrest',
        },
        CENTRAL_LINE: {
          hardMax: 20.0,
          alertReasonKh: 'កម្រិតប៉ូតាស្យូមចាក់តាម Central Line អតិបរមា ២០ mEq ក្នុងមួយម៉ោង - តម្រូវឱ្យតាមដាន ECG បេះដូងផ្ទាល់',
          alertReasonEn: 'Central line hard limit 20 mEq/hr: Mandatory continuous cardiac telemetry monitor required',
        },
      },
    },
    clinicalNotesKh: 'សារធាតុអេឡិចត្រូឡីតគ្រោះថ្នាក់បំផុត - ហាមចាក់លឿនដាច់ខាត អាចបណ្តាលឱ្យបេះដូងឈប់លោតភ្លាមៗ',
    clinicalNotesEn: 'High-risk concentrated electrolyte: NEVER administer by IV push / bolus: Fatal cardiac arrest risk',
  },
  {
    substanceCode: 'DRUG-FENT-07',
    genericNameEn: 'Fentanyl Citrate',
    genericNameKh: 'ហ្វេនតានីល - ថ្នាំបំបាត់ការឈឺចាប់ខ្លាំង',
    therapeuticCategory: 'OPIOID_ANALGESIC',
    dosingUnit: 'mcg/hr',
    requiresPatientWeight: false,
    standardConcentrations: [
      {
        id: 'CONC-FENT-STD',
        drugAmount: 1000,
        drugAmountUnit: 'mcg',
        diluentVolumeMl: 100,
        diluentType: 'NS',
        calculatedConcentrationPerMl: 10, // 10 mcg/ml
        isStandardRecommended: true,
      },
    ],
    guardrails: {
      softMin: 10.0,
      softMax: 100.0,
      hardMin: 2.0,
      hardMax: 250.0,
    },
    pcaConfig: {
      isPcaAllowed: true,
      standardBolusDose: 20.0, // mcg
      hardMaxBolusDose: 50.0, // mcg
      standardLockoutMinutes: 10, // 10 minutes between patient clicks
      hardMinLockoutMinutes: 6, // Cannot be set shorter than 6 min
      fourHourMaxLimit: 300.0, // 300 mcg in 4 hours
    },
    clinicalNotesKh: 'ថ្នាំបំបាត់ការឈឺចាប់សរសៃប្រសាទ - ត្រូវតាមដានកម្រិតដង្ហើម និង SpO2 ជានិច្ច ការពារការថយចុះដង្ហើម',
    clinicalNotesEn: 'High-potency synthetic opioid: Monitor respiratory rate and continuous pulse oximetry for respiratory depression',
  },
];
