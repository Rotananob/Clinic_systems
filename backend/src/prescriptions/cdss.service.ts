import { Injectable, Logger } from '@nestjs/common';

export type DdiSeverity = 'SEVERE' | 'MODERATE' | 'MILD';
export type DdiAction = 'BLOCK' | 'WARNING_REQUIRES_OVERRIDE' | 'INFORMATIONAL';
export type TriageRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DrugInteractionRule {
  id: string;
  drug1Keywords: string[];
  drug2Keywords: string[];
  severity: DdiSeverity;
  action: DdiAction;
  drug1Label: string;
  drug2Label: string;
  mechanismEn: string;
  mechanismKh: string;
  clinicalRiskEn: string;
  clinicalRiskKh: string;
  recommendationEn: string;
  recommendationKh: string;
  safeAlternativeEn: string;
  safeAlternativeKh: string;
}

export interface DdiAlert {
  ruleId: string;
  drug1: string;
  drug2: string;
  severity: DdiSeverity;
  action: DdiAction;
  mechanism: string;
  clinicalRisk: string;
  recommendation: string;
  safeAlternative: string;
}

export interface AllergyAlert {
  matchedAllergy: string;
  offendingMedication: string;
  severity: 'SEVERE' | 'MODERATE';
  mechanism: string;
  recommendation: string;
  isCrossReactivity: boolean;
}

export interface ContraindicationAlert {
  condition: string;
  medication: string;
  severity: 'SEVERE' | 'MODERATE';
  reason: string;
  action: 'BLOCK' | 'WARNING_REQUIRES_OVERRIDE';
}

export interface News2VitalsInput {
  respiratoryRate?: number; // breaths/min
  spO2?: number; // %
  onSupplementalOxygen?: boolean;
  systolicBp?: number; // mmHg
  heartRate?: number; // bpm
  temperature?: number; // °C
  consciousness?: 'ALERT' | 'CONFUSED' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
}

export interface News2ScoreResult {
  totalScore: number;
  riskLevel: TriageRiskLevel;
  colorCode: 'GREEN' | 'YELLOW' | 'RED';
  hasSevereSingleParameter: boolean;
  breakdown: {
    respiratoryRateScore: number;
    spO2Score: number;
    oxygenScore: number;
    systolicBpScore: number;
    heartRateScore: number;
    temperatureScore: number;
    consciousnessScore: number;
  };
  clinicalRecommendationEn: string;
  clinicalRecommendationKh: string;
}

export interface Icd11SearchResult {
  icd11Code: string;
  icd10Code: string;
  titleEn: string;
  titleKh: string;
  category: string;
  keywords: string[];
}

export const DDI_KNOWLEDGE_BASE: DrugInteractionRule[] = [
  {
    id: 'DDI-001',
    drug1Keywords: ['warfarin', 'coumadin', 'rivaroxaban', 'apixaban', 'dabigatran'],
    drug2Keywords: ['ibuprofen', 'diclofenac', 'aspirin', 'naproxen', 'ketorolac', 'mefenamic', 'meloxicam'],
    severity: 'SEVERE',
    action: 'BLOCK',
    drug1Label: 'Anticoagulant (Warfarin/DOAC)',
    drug2Label: 'NSAID / Anti-inflammatory',
    mechanismEn: 'Concurrent platelet inhibition and gastric mucosal injury dramatically increases bleeding risk.',
    mechanismKh: 'ការទប់ស្កាត់ផ្លាកែតដំណាលគ្នា និងការរលាកភ្នាសក្រពះបង្កើនហានិភ័យនៃការធ្លាយឈាមយ៉ាងធ្ងន់ធ្ងរ។',
    clinicalRiskEn: 'Severe gastrointestinal hemorrhage and life-threatening systemic bleeding.',
    clinicalRiskKh: 'ការហូរឈាមក្រពះពោះវៀនធ្ងន់ធ្ងរ និងគ្រោះថ្នាក់ដល់អាយុជីវិត។',
    recommendationEn: 'Avoid co-prescription. Use Paracetamol for pain or co-prescribe PPI with close INR/coagulation monitoring.',
    recommendationKh: 'ចៀសវាងការចេញថ្នាំរួមគ្នា។ ប្រើ Paracetamol ជំនួស ឬបន្ថែមថ្នាំការពារក្រពះ PPI ជាមួយការតាមដានឈាមយ៉ាងដិតដល់។',
    safeAlternativeEn: 'Paracetamol 500mg - 1000mg for mild to moderate analgesia.',
    safeAlternativeKh: 'Paracetamol 500mg - 1000mg សម្រាប់ការបំបាត់ការឈឺចាប់កម្រិតស្រាលទៅមធ្យម។',
  },
  {
    id: 'DDI-002',
    drug1Keywords: ['enalapril', 'lisinopril', 'ramipril', 'perindopril', 'captopril', 'losartan', 'valsartan', 'telmisartan'],
    drug2Keywords: ['spironolactone', 'eplerenone', 'potassium', 'aldactone'],
    severity: 'SEVERE',
    action: 'WARNING_REQUIRES_OVERRIDE',
    drug1Label: 'ACE Inhibitor / ARB',
    drug2Label: 'Potassium-Sparing Diuretic / K+ Supplement',
    mechanismEn: 'Additive suppression of aldosterone-mediated renal potassium excretion.',
    mechanismKh: 'ការបន្ថយការបញ្ចេញជាតិប៉ូតាស្យូមតាមតម្រងនោមបណ្តាលឱ្យលើសជាតិប៉ូតាស្យូមក្នុងឈាម។',
    clinicalRiskEn: 'Severe hyperkalemia (> 6.0 mEq/L) leading to fatal cardiac dysrhythmias and cardiac arrest.',
    clinicalRiskKh: 'ការលើសជាតិប៉ូតាស្យូមធ្ងន់ធ្ងរដែលអាចបណ្ដាលឱ្យចង្វាក់បេះដូងលោតខុសប្រក្រតី និងគាំងបេះដូង។',
    recommendationEn: 'Check baseline serum creatinine and potassium. Monitor K+ within 7 days of initiation.',
    recommendationKh: 'ពិនិត្យជាតិ K+ និងមុខងារតម្រងនោមមុនពេលប្រើ និងតាមដានឡើងវិញក្នុងរយៈពេល ៧ ថ្ងៃ។',
    safeAlternativeEn: 'Hydrochlorothiazide or Furosemide if diuretic effect is needed without K+ sparing.',
    safeAlternativeKh: 'Hydrochlorothiazide ឬ Furosemide ប្រសិនបើតម្រូវឱ្យបញ្ចុះទឹកនោមដោយមិនរក្សាជាតិប៉ូតាស្យូម។',
  },
  {
    id: 'DDI-003',
    drug1Keywords: ['simvastatin', 'atorvastatin', 'lovastatin'],
    drug2Keywords: ['clarithromycin', 'erythromycin', 'ketoconazole', 'itraconazole'],
    severity: 'SEVERE',
    action: 'BLOCK',
    drug1Label: 'CYP3A4-Metabolized Statin',
    drug2Label: 'Strong CYP3A4 Inhibitor (Macrolide/Azole)',
    mechanismEn: 'Inhibition of CYP3A4 hepatic clearance increases serum statin concentrations up to 10-fold.',
    mechanismKh: 'ការរារាំងអង់ស៊ីម CYP3A4 ធ្វើឱ្យកម្រិតថ្នាំ Statin ក្នុងឈាមកើនឡើងខ្ពស់ហួសប្រមាណរហូតដល់ ១០ ដង។',
    clinicalRiskEn: 'Severe rhabdomyolysis, profound muscle breakdown, myoglobinuria, and acute renal failure.',
    clinicalRiskKh: 'ការរលាយសាច់ដុំស្រួចស្រាវ - Rhabdomyolysis និងខ្សោយតម្រងនោមធ្ងន់ធ្ងរ។',
    recommendationEn: 'Temporarily suspend Statin during the antibiotic course, or substitute Azithromycin.',
    recommendationKh: 'ផ្អាកថ្នាំ Statin បណ្ដោះអាសន្នអំឡុងពេលលេបថ្នាំផ្សះ ឬប្តូរមកប្រើ Azithromycin ជំនួសវិញ។',
    safeAlternativeEn: 'Azithromycin 500mg daily (does not significantly inhibit CYP3A4) or Rosuvastatin.',
    safeAlternativeKh: 'Azithromycin 500mg ក្នុងមួយថ្ងៃ - គ្មានប្រតិកម្ម CYP3A4 ឬ Rosuvastatin។',
  },
  {
    id: 'DDI-004',
    drug1Keywords: ['ciprofloxacin', 'levofloxacin', 'norfloxacin', 'ofloxacin'],
    drug2Keywords: ['antacid', 'magnesium', 'aluminum', 'calcium', 'iron', 'ferrous', 'sucralfate'],
    severity: 'MODERATE',
    action: 'WARNING_REQUIRES_OVERRIDE',
    drug1Label: 'Fluoroquinolone Antibiotic',
    drug2Label: 'Multivalent Cation / Antacid / Iron',
    mechanismEn: 'Chelation with multivalent metal cations forms insoluble complexes, reducing antibiotic absorption by up to 90%.',
    mechanismKh: 'ការភ្ជាប់ធាតុដែក/កាល់ស្យូមបង្កើតជាកករមិនរលាយ កាត់បន្ថយការស្រូបយកថ្នាំផ្សះរហូតដល់ ៩០%។',
    clinicalRiskEn: 'Clinical antibiotic treatment failure and emergence of bacterial resistance.',
    clinicalRiskKh: 'ការព្យាបាលការឆ្លងរោគមិនជាសះស្បើយ និងបង្កើតភាពស៊ាំនឹងថ្នាំផ្សះ។',
    recommendationEn: 'Administer fluoroquinolone at least 2 hours before or 4 to 6 hours after cation-containing agents.',
    recommendationKh: 'លេបថ្នាំផ្សះ Quinolone យ៉ាងតិច ២ ម៉ោងមុន ឬ ៤ ទៅ ៦ ម៉ោងក្រោយពេលលេបថ្នាំបន្សាបអាស៊ីត/ជាតិដែក។',
    safeAlternativeEn: 'Stagger administration timing by minimum 2 hours.',
    safeAlternativeKh: 'ញែកពេលវេលាលេបថ្នាំទាំងពីរឱ្យឃ្លាតគ្នាពី ២ ទៅ ៤ ម៉ោង។',
  },
  {
    id: 'DDI-005',
    drug1Keywords: ['metformin', 'glucophage'],
    drug2Keywords: ['contrast', 'iodinated', 'iohexol', 'iopamidol', 'ct contrast'],
    severity: 'SEVERE',
    action: 'BLOCK',
    drug1Label: 'Metformin',
    drug2Label: 'Iodinated Radiocontrast Media',
    mechanismEn: 'Contrast-induced acute kidney injury leads to Metformin accumulation.',
    mechanismKh: 'សារធាតុចាក់ថតកាំរស្មីអ៊ិចអាចបណ្តាលឱ្យតម្រងនោមដំណើរការខ្សោយ ធ្វើឱ្យថ្នាំ Metformin កើនឡើងខ្លាំង។',
    clinicalRiskEn: 'Potentially fatal Metformin-associated lactic acidosis (MALA).',
    clinicalRiskKh: 'ការលើសជាតិអាស៊ីតឡាក់ទិកក្នុងឈាមដែលអាចបណ្ដាលឱ្យបាត់បង់ជីវិត។',
    recommendationEn: 'Discontinue Metformin prior to or at the time of contrast procedure; withhold for 48 hours until normal renal function verified.',
    recommendationKh: 'ផ្អាកថ្នាំ Metformin មុនពេលចាក់ថ្នាំថតកាំរស្មី និងបន្តផ្អាក ៤៨ ម៉ោងក្រោយពិនិត្យមុខងារតម្រងនោមធម្មតា។',
    safeAlternativeEn: 'Short-acting regular insulin sliding scale during withholding period if needed.',
    safeAlternativeKh: 'ប្រើថ្នាំអាំងស៊ុយលីនចាក់បណ្ដោះអាសន្នអំឡុងពេលផ្អាក Metformin។',
  },
  {
    id: 'DDI-006',
    drug1Keywords: ['fluoxetine', 'sertraline', 'paroxetine', 'citalopram', 'escitalopram', 'venlafaxine'],
    drug2Keywords: ['tramadol', 'linezolid', 'dextromethorphan'],
    severity: 'SEVERE',
    action: 'WARNING_REQUIRES_OVERRIDE',
    drug1Label: 'Serotonergic Antidepressant (SSRI/SNRI)',
    drug2Label: 'Tramadol / Serotonergic Analgesic',
    mechanismEn: 'Synergistic elevation of synaptic serotonin levels through reuptake inhibition and stimulated release.',
    mechanismKh: 'ការកើនឡើងជាតិសេរ៉ូតូនីនក្នុងប្រព័ន្ធប្រសាទខ្លាំងហួសកម្រិត។',
    clinicalRiskEn: 'Life-threatening Serotonin Syndrome (hyperthermia, autonomic instability, neuromuscular rigidity, seizures).',
    clinicalRiskKh: 'រោគសញ្ញាសេរ៉ូតូនីនធ្ងន់ធ្ងរ: គ្រុនក្ដៅខ្លាំង រមួលសាច់ដុំ និងប្រកាច់។',
    recommendationEn: 'Avoid combination where possible. Monitor for agitation, tremor, clonus, and diaphoresis.',
    recommendationKh: 'ចៀសវាងការប្រើរួមគ្នា។ តាមដានអាការៈញ័រដៃជើង បែកញើស និងរមួលសាច់ដុំ។',
    safeAlternativeEn: 'Paracetamol or Codeine-based alternative for analgesia without strong serotonergic activity.',
    safeAlternativeKh: 'ប្រើ Paracetamol ឬថ្នាំបំបាត់ការឈឺចាប់ដែលមិនប៉ះពាល់ប្រព័ន្ធសេរ៉ូតូនីន។',
  },
  {
    id: 'DDI-007',
    drug1Keywords: ['atenolol', 'metoprolol', 'propranolol', 'bisoprolol', 'carvedilol'],
    drug2Keywords: ['verapamil', 'diltiazem'],
    severity: 'SEVERE',
    action: 'BLOCK',
    drug1Label: 'Beta-Blocker',
    drug2Label: 'Non-Dihydropyridine Calcium Channel Blocker',
    mechanismEn: 'Additive negative inotropic, chronotropic, and dromotropic cardiac effects.',
    mechanismKh: 'ការទប់ស្កាត់ចង្វាក់បេះដូង និងកម្លាំងកន្ត្រាក់នៃសាច់ដុំបេះដូងដំណាលគ្នា។',
    clinicalRiskEn: 'Profound bradycardia, high-grade atrioventricular (AV) block, and acute cardiogenic shock.',
    clinicalRiskKh: 'ចង្វាក់បេះដូងដើរយឺតខ្លាំង ខូចចរន្តអគ្គិសនីបេះដូង - AV Block និងខ្សោយបេះដូងស្រួចស្រាវ។',
    recommendationEn: 'Do not combine non-dihydropyridine CCBs with beta-blockers. Use Dihydropyridine (Amlodipine) instead.',
    recommendationKh: 'ហាមប្រើថ្នាំ Verapamil/Diltiazem ជាមួយថ្នាំ Beta-blocker ដាច់ខាត។ ប្រើ Amlodipine ជំនួសវិញ។',
    safeAlternativeEn: 'Amlodipine 5mg daily (dihydropyridine CCB does not depress cardiac conduction).',
    safeAlternativeKh: 'Amlodipine 5mg ក្នុងមួយថ្ងៃ - មិនប៉ះពាល់ចរន្តអគ្គិសនីបេះដូង។',
  },
  {
    id: 'DDI-008',
    drug1Keywords: ['sildenafil', 'tadalafil', 'vardenafil', 'viagra'],
    drug2Keywords: ['nitroglycerin', 'isosorbide', 'nitrate', 'monoket', 'nitrostat'],
    severity: 'SEVERE',
    action: 'BLOCK',
    drug1Label: 'PDE5 Inhibitor (Sildenafil/Tadalafil)',
    drug2Label: 'Organic Nitrate (Nitroglycerin)',
    mechanismEn: 'Dramatic synergism in cyclic GMP-mediated vascular smooth muscle relaxation.',
    mechanismKh: 'ការរីកសរសៃឈាមទូទាំងរាងកាយខ្លាំងក្លាដោយសារការកើនឡើង cyclic GMP។',
    clinicalRiskEn: 'Catastrophic refractory hypotension, myocardial infarction, and cardiovascular collapse.',
    clinicalRiskKh: 'ការធ្លាក់ចុះសម្ពាធឈាមធ្ងន់ធ្ងរមិនអាចស្រោចស្រង់បាន និងដាច់សរសៃឈាមបេះដូង។',
    recommendationEn: 'Absolute Contraindication. Do not administer nitrates within 24 hours of Sildenafil or 48 hours of Tadalafil.',
    recommendationKh: 'ជាការហាមឃាត់ដាច់ខាត - Absolute Contraindication។ មិនត្រូវប្រើថ្នាំ Nitrate ក្នុងរយៈពេល ២៤ ទៅ ៤៨ ម៉ោងឡើយ។',
    safeAlternativeEn: 'Alternative angina management with beta-blockers, CCBs, or Ranolazine.',
    safeAlternativeKh: 'ប្រើថ្នាំបេះដូងជម្រើសផ្សេងដែលមិនមែនជាពពួក Nitrate។',
  },
  {
    id: 'DDI-009',
    drug1Keywords: ['allopurinol', 'zyloprim'],
    drug2Keywords: ['amoxicillin', 'ampicillin', 'augmentin'],
    severity: 'MODERATE',
    action: 'WARNING_REQUIRES_OVERRIDE',
    drug1Label: 'Allopurinol (Uric Acid Reducer)',
    drug2Label: 'Aminopenicillin (Amoxicillin/Ampicillin)',
    mechanismEn: 'Unknown immunological mechanism significantly elevates the incidence of erythematous skin eruptions.',
    mechanismKh: 'ការកើនឡើងនៃប្រតិកម្មអាលែកហ្ស៊ីបង្កឱ្យមានកន្ទួលរមាស់ក្រហមពេញស្បែក។',
    clinicalRiskEn: 'High incidence (up to 20%) of severe maculopapular drug rash and cutaneous hypersensitivity.',
    clinicalRiskKh: 'កើតមានកន្ទួលរមាស់ក្រហមលើស្បែកធ្ងន់ធ្ងររហូតដល់ ២០% នៃអ្នកជំងឺ។',
    recommendationEn: 'Warn patient to discontinue medication immediately and seek medical care if skin rash occurs.',
    recommendationKh: 'ណែនាំអ្នកជំងឺឱ្យឈប់លេបថ្នាំភ្លាមៗប្រសិនបើមានកន្ទួលរមាស់លើស្បែក។',
    safeAlternativeEn: 'Cefixime or Azithromycin if penicillin-class antibiotic is not mandatory.',
    safeAlternativeKh: 'Cefixime ឬ Azithromycin ប្រសិនបើមិនចាំបាច់ប្រើពពួក Penicillin។',
  },
  {
    id: 'DDI-010',
    drug1Keywords: ['clopidogrel', 'plavix'],
    drug2Keywords: ['omeprazole', 'esomeprazole'],
    severity: 'MODERATE',
    action: 'WARNING_REQUIRES_OVERRIDE',
    drug1Label: 'Clopidogrel (Antiplatelet)',
    drug2Label: 'Omeprazole / Esomeprazole (PPI)',
    mechanismEn: 'Competitive CYP2C19 inhibition reduces hepatic bioactivation of Clopidogrel to its active metabolite.',
    mechanismKh: 'ការរារាំងអង់ស៊ីម CYP2C19 ធ្វើឱ្យការបំលែងថ្នាំ Clopidogrel ទៅជាសារធាតុកាត់បន្ថយកំណកឈាមចុះខ្សោយ។',
    clinicalRiskEn: 'Reduced antiplatelet efficacy and increased risk of recurrent thromboembolic and coronary events.',
    clinicalRiskKh: 'ប្រសិទ្ធភាពការពារការកកឈាមធ្លាក់ចុះ បង្កើនហានិភ័យស្ទះសរសៃឈាមបេះដូងឡើងវិញ។',
    recommendationEn: 'Switch to Pantoprazole or Rabeprazole, which have significantly less CYP2C19 inhibitory potency.',
    recommendationKh: 'ប្តូរមកប្រើ Pantoprazole ឬ Rabeprazole ដែលមិនរំខានដល់ថ្នាំ Clopidogrel។',
    safeAlternativeEn: 'Pantoprazole 40mg daily or Famotidine 20mg twice daily.',
    safeAlternativeKh: 'Pantoprazole 40mg ក្នុងមួយថ្ងៃ ឬ Famotidine 20mg ពីរដងក្នុងមួយថ្ងៃ។',
  },
];

export const ALLERGY_CROSS_REFERENCE: Array<{
  allergyKeywords: string[];
  contraindicatedKeywords: string[];
  severity: 'SEVERE' | 'MODERATE';
  allergyNameEn: string;
  allergyNameKh: string;
  mechanismEn: string;
  mechanismKh: string;
  isCrossReactivity: boolean;
}> = [
  {
    allergyKeywords: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'ប៉េនីស៊ីលីន'],
    contraindicatedKeywords: ['amoxicillin', 'ampicillin', 'augmentin', 'penicillin', 'piperacillin', 'cloxacillin'],
    severity: 'SEVERE',
    allergyNameEn: 'Penicillin / Beta-Lactam Allergy',
    allergyNameKh: 'អាលែកហ្ស៊ីពពួកថ្នាំផ្សះប៉េនីស៊ីលីន',
    mechanismEn: 'Direct IgE-mediated anaphylaxis / Type I hypersensitivity to beta-lactam core.',
    mechanismKh: 'ប្រតិកម្មអាលែកហ្ស៊ីធ្ងន់ធ្ងរ - Anaphylaxis ប្រឆាំងនឹងរចនាសម្ព័ន្ធ Beta-lactam។',
    isCrossReactivity: false,
  },
  {
    allergyKeywords: ['penicillin', 'ប៉េនីស៊ីលីន'],
    contraindicatedKeywords: ['cefixime', 'ceftriaxone', 'cephalexin', 'cefuroxime', 'cefazolin'],
    severity: 'MODERATE',
    allergyNameEn: 'Penicillin Allergy (Cephalosporin Cross-Reactivity)',
    allergyNameKh: 'អាលែកហ្ស៊ីប៉េនីស៊ីលីន - ប្រតិកម្មឆ្លងជាមួយ Cephalosporin',
    mechanismEn: 'Potential cross-reactivity (~2-5%) between beta-lactam ring structures.',
    mechanismKh: 'មានហានិភ័យប្រតិកម្មឆ្លងរវាង ២ ទៅ ៥% ដោយសាររចនាសម្ព័ន្ធស្រដៀងគ្នា។',
    isCrossReactivity: true,
  },
  {
    allergyKeywords: ['sulfa', 'sulfonamide', 'bactrim', 'ស៊ុលហ្វា'],
    contraindicatedKeywords: ['cotrimoxazole', 'bactrim', 'sulfamethoxazole', 'sulfasalazine'],
    severity: 'SEVERE',
    allergyNameEn: 'Sulfa / Sulfonamide Allergy',
    allergyNameKh: 'អាលែកហ្ស៊ីពពួកថ្នាំស៊ុលហ្វា',
    mechanismEn: 'Immune-mediated hypersensitivity; high risk of Stevens-Johnson syndrome (SJS) and toxic epidermal necrolysis.',
    mechanismKh: 'ប្រតិកម្មអាលែកហ្ស៊ីប្រព័ន្ធភាពស៊ាំ ដែលអាចបង្កជារោគសញ្ញាស្បែកធ្ងន់ធ្ងរ Stevens-Johnson Syndrome។',
    isCrossReactivity: false,
  },
  {
    allergyKeywords: ['nsaid', 'aspirin', 'ibuprofen', 'diclofenac', 'អាស្ពីរីន'],
    contraindicatedKeywords: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'mefenamic', 'meloxicam'],
    severity: 'SEVERE',
    allergyNameEn: 'NSAID / Aspirin Hypersensitivity',
    allergyNameKh: 'អាលែកហ្ស៊ីថ្នាំបំបាត់ការរលាក NSAID / Aspirin',
    mechanismEn: 'COX-1 inhibition redirects arachidonic acid to leukotriene pathway, inducing severe bronchospasm and angioedema.',
    mechanismKh: 'ការទប់ស្កាត់ COX-1 បង្កើនសារធាតុ Leukotriene បណ្ដាលឱ្យត្បៀតទងសួត និងហើមមុខមាត់ធ្ងន់ធ្ងរ។',
    isCrossReactivity: true,
  },
  {
    allergyKeywords: ['paracetamol', 'acetaminophen', 'ប៉ារ៉ាសេតាម៉ុល'],
    contraindicatedKeywords: ['paracetamol', 'acetaminophen', 'panadol', 'tylenol'],
    severity: 'SEVERE',
    allergyNameEn: 'Paracetamol / Acetaminophen Allergy',
    allergyNameKh: 'អាលែកហ្ស៊ីថ្នាំប៉ារ៉ាសេតាម៉ុល',
    mechanismEn: 'Rare but severe cutaneous adverse reactions and anaphylaxis.',
    mechanismKh: 'ប្រតិកម្មអាលែកហ្ស៊ីស្បែកធ្ងន់ធ្ងរ និងតឹងផ្លូវដង្ហើម។',
    isCrossReactivity: false,
  },
];

export const CONTRAINDICATION_RULES: Array<{
  conditionKeywords: string[];
  contraindicatedKeywords: string[];
  severity: 'SEVERE' | 'MODERATE';
  conditionNameEn: string;
  conditionNameKh: string;
  reasonEn: string;
  reasonKh: string;
  action: 'BLOCK' | 'WARNING_REQUIRES_OVERRIDE';
}> = [
  {
    conditionKeywords: ['pregnancy', 'pregnant', 'មានផ្ទៃពោះ', 'ទម្ងន់', 'គភ៌'],
    contraindicatedKeywords: ['enalapril', 'lisinopril', 'losartan', 'valsartan', 'simvastatin', 'atorvastatin', 'doxycycline', 'methotrexate', 'warfarin', 'misoprostol', 'ciprofloxacin'],
    severity: 'SEVERE',
    conditionNameEn: 'Pregnancy',
    conditionNameKh: 'ស្ត្រីមានផ្ទៃពោះ',
    reasonEn: 'Teratogenic risks, fetal renal dysgenesis, skull hypoplasia, or fetal demise.',
    reasonKh: 'បង្កឱ្យគភ៌ខូចទ្រង់ទ្រាយ ខូចតម្រងនោម ឬគ្រោះថ្នាក់ដល់ជីវិតគភ៌ក្នុងផ្ទៃ។',
    action: 'BLOCK',
  },
  {
    conditionKeywords: ['asthma', 'bronchospasm', 'ហឺត', 'ជំងឺហឺត'],
    contraindicatedKeywords: ['propranolol', 'timolol', 'atenolol', 'ibuprofen', 'aspirin', 'diclofenac'],
    severity: 'SEVERE',
    conditionNameEn: 'Bronchial Asthma',
    conditionNameKh: 'ជំងឺហឺតរ៉ាំរ៉ៃ',
    reasonEn: 'Beta-2 blockade and COX-1 inhibition trigger acute life-threatening bronchoconstriction.',
    reasonKh: 'អាចបង្កឱ្យមានការកន្ត្រាក់ត្បៀតទងសួតស្រួចស្រាវ ថប់ដង្ហើមធ្ងន់ធ្ងរ។',
    action: 'WARNING_REQUIRES_OVERRIDE',
  },
  {
    conditionKeywords: ['renal failure', 'ckd', 'kidney failure', 'ខ្សោយតម្រងនោម'],
    contraindicatedKeywords: ['ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'gentamicin', 'amikacin'],
    severity: 'SEVERE',
    conditionNameEn: 'Chronic Kidney Disease / Renal Failure',
    conditionNameKh: 'ជំងឺខ្សោយតម្រងនោម',
    reasonEn: 'NSAID-induced renal vasoconstriction and aminoglycoside nephrotoxicity accelerate renal decompensation.',
    reasonKh: 'ការរួញសរសៃឈាមតម្រងនោម និងជាតិពុលនៃថ្នាំអាចបណ្តាលឱ្យខ្សោយតម្រងនោមដំណាក់កាលចុងក្រោយ។',
    action: 'BLOCK',
  },
];

export const ICD11_DATABASE: Icd11SearchResult[] = [
  {
    icd11Code: 'CA42',
    icd10Code: 'J02.9',
    titleEn: 'Acute Pharyngitis',
    titleKh: 'រលាកបំពង់កស្រួចស្រាវ',
    category: 'Respiratory / ENT',
    keywords: ['sore throat', 'pharyngitis', 'tonsil', 'ឈឺបំពង់ក', 'រលាកបំពង់ក'],
  },
  {
    icd11Code: 'CA45',
    icd10Code: 'J06.9',
    titleEn: 'Acute Upper Respiratory Tract Infection (URTI)',
    titleKh: 'ការឆ្លងរោគផ្លូវដង្ហើមផ្នែកខាងលើស្រួចស្រាវ',
    category: 'Respiratory',
    keywords: ['urti', 'common cold', 'cough', 'runny nose', 'ផ្តាសាយ', 'ក្អក', 'ហៀរសំបោរ'],
  },
  {
    icd11Code: 'CA42.0',
    icd10Code: 'J20.9',
    titleEn: 'Acute Bronchitis',
    titleKh: 'រលាកទងសួតស្រួចស្រាវ',
    category: 'Respiratory',
    keywords: ['bronchitis', 'cough with phlegm', 'wheezing', 'រលាកទងសួត', 'ក្អកមានស្លេស្ម'],
  },
  {
    icd11Code: 'DA42',
    icd10Code: 'K29.7',
    titleEn: 'Gastritis and Duodenitis',
    titleKh: 'រលាកក្រពះ និងពោះវៀនតូចបឋម',
    category: 'Gastroenterology',
    keywords: ['gastritis', 'epigastric pain', 'heartburn', 'ឈឺក្រពះ', 'ចុកពោះលើ', 'ក្រហាយទ្រូង'],
  },
  {
    icd11Code: '1A40',
    icd10Code: 'A09',
    titleEn: 'Gastroenteritis of Infectious Origin',
    titleKh: 'រលាកក្រពះពោះវៀនស្រួចស្រាវដោយសារមេរោគ',
    category: 'Infectious Disease',
    keywords: ['gastroenteritis', 'diarrhea', 'vomiting', 'រាក', 'ក្អួត', 'ពុលចំណី'],
  },
  {
    icd11Code: 'BA00',
    icd10Code: 'I10',
    titleEn: 'Essential Hypertension',
    titleKh: 'លើសសម្ពាធឈាមបឋម',
    category: 'Cardiovascular',
    keywords: ['hypertension', 'high blood pressure', 'លើសឈាម', 'លើសសម្ពាធឈាម'],
  },
  {
    icd11Code: '5A11',
    icd10Code: 'E11',
    titleEn: 'Type 2 Diabetes Mellitus',
    titleKh: 'ជំងឺទឹកនោមផ្អែមប្រភេទទី ២',
    category: 'Endocrinology',
    keywords: ['diabetes', 'hyperglycemia', 'high blood sugar', 'ទឹកនោមផ្អែម'],
  },
  {
    icd11Code: '1D20',
    icd10Code: 'A90',
    titleEn: 'Dengue Fever',
    titleKh: 'ជំងឺគ្រុនឈាម',
    category: 'Infectious Disease',
    keywords: ['dengue', 'mosquito fever', 'thrombocytopenia', 'គ្រុនឈាម'],
  },
  {
    icd11Code: '1A07',
    icd10Code: 'A01.0',
    titleEn: 'Typhoid Fever',
    titleKh: 'ជំងឺគ្រុនពោះវៀន',
    category: 'Infectious Disease',
    keywords: ['typhoid', 'enteric fever', 'គ្រុនពោះវៀន'],
  },
  {
    icd11Code: '4A80',
    icd10Code: 'J30.4',
    titleEn: 'Allergic Rhinitis',
    titleKh: 'រលាកច្រមុះដោយសារអាលែកហ្ស៊ី',
    category: 'Allergy / Immunology',
    keywords: ['allergy', 'allergic rhinitis', 'sneezing', 'អាលែកហ្ស៊ី', 'កណ្ដាស់'],
  },
  {
    icd11Code: 'EA90',
    icd10Code: 'L20.9',
    titleEn: 'Atopic Eczema / Dermatitis',
    titleKh: 'រលាកស្បែកប្រភេទអេកហ្ស៊ីម៉ា',
    category: 'Dermatology',
    keywords: ['eczema', 'dermatitis', 'rash', 'itchy skin', 'អេកហ្ស៊ីម៉ា', 'រមាស់ស្បែក'],
  },
  {
    icd11Code: '1C60',
    icd10Code: 'B54',
    titleEn: 'Malaria',
    titleKh: 'ជំងឺគ្រុនចាញ់',
    category: 'Infectious Disease',
    keywords: ['malaria', 'plasmodium', 'chills and rigor', 'គ្រុនចាញ់'],
  },
  {
    icd11Code: '8A80',
    icd10Code: 'G43.9',
    titleEn: 'Migraine',
    titleKh: 'ជំងឺឈឺក្បាលមួយចំហៀង - មីក្រែន',
    category: 'Neurology',
    keywords: ['migraine', 'throbbing headache', 'photophobia', 'មីក្រែន', 'ឈឺក្បាលមួយចំហៀង'],
  },
  {
    icd11Code: 'FA20',
    icd10Code: 'M19.9',
    titleEn: 'Osteoarthritis',
    titleKh: 'ជំងឺរលាកសន្លាក់ឆ្អឹង',
    category: 'Rheumatology',
    keywords: ['osteoarthritis', 'joint pain', 'knee pain', 'ឈឺសន្លាក់', 'រលាកសន្លាក់'],
  },
];

export class ClinicalDecisionSupportService {
  private readonly logger = new Logger(ClinicalDecisionSupportService.name);

  /**
   * Check for Drug-Drug Interactions between prescribed medications
   */
  public checkDrugDrugInteractions(medications: string[]): DdiAlert[] {
    const alerts: DdiAlert[] = [];
    if (!medications || medications.length < 2) return alerts;

    const normalizedMeds = (medications || []).map((m) => (typeof m === 'string' ? m : String(m || '')).toLowerCase().trim()).filter(Boolean);

    for (let i = 0; i < normalizedMeds.length; i++) {
      for (let j = i + 1; j < normalizedMeds.length; j++) {
        const medA = normalizedMeds[i];
        const medB = normalizedMeds[j];

        for (const rule of DDI_KNOWLEDGE_BASE) {
          const matchA1 = rule.drug1Keywords.some((k) => medA.includes(k));
          const matchB2 = rule.drug2Keywords.some((k) => medB.includes(k));
          const matchA2 = rule.drug2Keywords.some((k) => medA.includes(k));
          const matchB1 = rule.drug1Keywords.some((k) => medB.includes(k));

          if ((matchA1 && matchB2) || (matchA2 && matchB1)) {
            alerts.push({
              ruleId: rule.id,
              drug1: medications[i],
              drug2: medications[j],
              severity: rule.severity,
              action: rule.action,
              mechanism: rule.mechanismKh,
              clinicalRisk: rule.clinicalRiskKh,
              recommendation: rule.recommendationKh,
              safeAlternative: rule.safeAlternativeKh,
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Check patient documented allergies and contraindications
   */
  public checkAllergiesAndContraindications(
    medications: string[],
    patientAllergiesRaw?: string | null,
    patientConditions?: string[]
  ): { allergyAlerts: AllergyAlert[]; contraindicationAlerts: ContraindicationAlert[] } {
    const allergyAlerts: AllergyAlert[] = [];
    const contraindicationAlerts: ContraindicationAlert[] = [];

    if (!medications || medications.length === 0) {
      return { allergyAlerts, contraindicationAlerts };
    }

    const normalizedMeds = medications.map((m) => m.toLowerCase().trim());

    // 1. Cross-check Allergies
    if (patientAllergiesRaw && patientAllergiesRaw.trim() !== '') {
      const allergyString = patientAllergiesRaw.toLowerCase();

      for (const ref of ALLERGY_CROSS_REFERENCE) {
        const patientHasAllergy = ref.allergyKeywords.some((k) => allergyString.includes(k));

        if (patientHasAllergy) {
          for (let mIdx = 0; mIdx < normalizedMeds.length; mIdx++) {
            const med = normalizedMeds[mIdx];
            const isOffending = ref.contraindicatedKeywords.some((k) => med.includes(k));

            if (isOffending) {
              allergyAlerts.push({
                matchedAllergy: ref.allergyNameKh,
                offendingMedication: medications[mIdx],
                severity: ref.severity,
                mechanism: ref.mechanismKh,
                recommendation: ref.isCrossReactivity
                  ? 'មានហានិភ័យប្រតិកម្មឆ្លង - Cross-reactivity។ គួរពិចារណាប្រើប្រាស់ថ្នាំក្រុមផ្សេងជំនួសវិញ។'
                  : 'ហាមប្រើថ្នាំនេះដាច់ខាតដោយសារអ្នកជំងឺមានប្រវត្តិប្រតិកម្មអាលែកហ្ស៊ីធ្ងន់ធ្ងរ។',
                isCrossReactivity: ref.isCrossReactivity,
              });
            }
          }
        }
      }
    }

    // 2. Cross-check Contraindications against patient clinical conditions
    if (patientConditions && patientConditions.length > 0) {
      const normalizedConditions = patientConditions.map((c) => c.toLowerCase().trim());

      for (const rule of CONTRAINDICATION_RULES) {
        const patientHasCondition = normalizedConditions.some((c) =>
          rule.conditionKeywords.some((k) => c.includes(k))
        );

        if (patientHasCondition) {
          for (let mIdx = 0; mIdx < normalizedMeds.length; mIdx++) {
            const med = normalizedMeds[mIdx];
            const isContraindicated = rule.contraindicatedKeywords.some((k) => med.includes(k));

            if (isContraindicated) {
              contraindicationAlerts.push({
                condition: rule.conditionNameKh,
                medication: medications[mIdx],
                severity: rule.severity,
                reason: rule.reasonKh,
                action: rule.action,
              });
            }
          }
        }
      }
    }

    return { allergyAlerts, contraindicationAlerts };
  }

  /**
   * Search ICD-11 knowledge base by Khmer or English keywords
   */
  public searchIcd11(query: string): Icd11SearchResult[] {
    const cleanQuery = (query || '').toLowerCase().trim();
    if (!cleanQuery) return ICD11_DATABASE.slice(0, 10);

    return ICD11_DATABASE.filter((entry) => {
      if (entry.icd11Code.toLowerCase().includes(cleanQuery)) return true;
      if (entry.icd10Code.toLowerCase().includes(cleanQuery)) return true;
      if (entry.titleEn.toLowerCase().includes(cleanQuery)) return true;
      if (entry.titleKh.toLowerCase().includes(cleanQuery)) return true;
      if (entry.category.toLowerCase().includes(cleanQuery)) return true;
      return entry.keywords.some((k) => k.toLowerCase().includes(cleanQuery));
    });
  }

  /**
   * Calculate National Early Warning Score 2 (NEWS2) from clinical vital signs
   */
  public calculateNews2(vitals: News2VitalsInput): News2ScoreResult {
    let rrScore = 0;
    if (vitals.respiratoryRate !== undefined) {
      const rr = vitals.respiratoryRate;
      if (rr <= 8) rrScore = 3;
      else if (rr >= 9 && rr <= 11) rrScore = 1;
      else if (rr >= 12 && rr <= 20) rrScore = 0;
      else if (rr >= 21 && rr <= 24) rrScore = 2;
      else if (rr >= 25) rrScore = 3;
    }

    let spO2Score = 0;
    if (vitals.spO2 !== undefined) {
      const o2 = vitals.spO2;
      if (o2 <= 91) spO2Score = 3;
      else if (o2 >= 92 && o2 <= 93) spO2Score = 2;
      else if (o2 >= 94 && o2 <= 95) spO2Score = 1;
      else if (o2 >= 96) spO2Score = 0;
    }

    const oxygenScore = vitals.onSupplementalOxygen ? 2 : 0;

    let bpScore = 0;
    if (vitals.systolicBp !== undefined) {
      const sbp = vitals.systolicBp;
      if (sbp <= 90) bpScore = 3;
      else if (sbp >= 91 && sbp <= 100) bpScore = 2;
      else if (sbp >= 101 && sbp <= 110) bpScore = 1;
      else if (sbp >= 111 && sbp <= 219) bpScore = 0;
      else if (sbp >= 220) bpScore = 3;
    }

    let hrScore = 0;
    if (vitals.heartRate !== undefined) {
      const hr = vitals.heartRate;
      if (hr <= 40) hrScore = 3;
      else if (hr >= 41 && hr <= 50) hrScore = 1;
      else if (hr >= 51 && hr <= 90) hrScore = 0;
      else if (hr >= 91 && hr <= 110) hrScore = 1;
      else if (hr >= 111 && hr <= 130) hrScore = 2;
      else if (hr >= 131) hrScore = 3;
    }

    let tempScore = 0;
    if (vitals.temperature !== undefined) {
      const temp = vitals.temperature;
      if (temp <= 35.0) tempScore = 3;
      else if (temp >= 35.1 && temp <= 36.0) tempScore = 1;
      else if (temp >= 36.1 && temp <= 38.0) tempScore = 0;
      else if (temp >= 38.1 && temp <= 39.0) tempScore = 1;
      else if (temp >= 39.1) tempScore = 2;
    }

    let consciousScore = 0;
    if (vitals.consciousness && vitals.consciousness !== 'ALERT') {
      consciousScore = 3;
    }

    const totalScore =
      rrScore + spO2Score + oxygenScore + bpScore + hrScore + tempScore + consciousScore;

    const hasSevereSingleParameter =
      rrScore === 3 ||
      spO2Score === 3 ||
      bpScore === 3 ||
      hrScore === 3 ||
      tempScore === 3 ||
      consciousScore === 3;

    let riskLevel: TriageRiskLevel = 'LOW';
    let colorCode: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    let recEn = 'Low clinical risk. Routine vital signs monitoring and standard outpatient consultation.';
    let recKh = 'ហានិភ័យកម្រិតស្រាល: ធម្មតា។ តាមដានសញ្ញាជីវិតជាប្រចាំ និងពិគ្រោះជំងឺតាមវេនធម្មតា។';

    if (totalScore >= 7) {
      riskLevel = 'HIGH';
      colorCode = 'RED';
      recEn = 'High clinical risk / Emergency. Immediate emergency evaluation by senior physician and continuous vital monitoring required.';
      recKh = 'ហានិភ័យកម្រិតខ្ពស់ / សង្គ្រោះបន្ទាន់។ តម្រូវឱ្យវេជ្ជបណ្ឌិតជាន់ខ្ពស់ពិនិត្យជាបន្ទាន់ និងតាមដានសញ្ញាជីវិតជាប់ជាប្រចាំ។';
    } else if (totalScore >= 5 || hasSevereSingleParameter) {
      riskLevel = 'MEDIUM';
      colorCode = 'YELLOW';
      recEn = 'Medium clinical risk. Urgent review by clinician within 30 minutes. Increase monitoring frequency to every 1 hour.';
      recKh = 'ហានិភ័យកម្រិតមធ្យម។ តម្រូវឱ្យគ្រូពេទ្យពិនិត្យឡើងវិញជាបន្ទាន់ក្នុងរយៈពេល ៣០ នាទី និងវាស់សញ្ញាជីវិតរៀងរាល់ ១ ម៉ោង។';
    }

    return {
      totalScore,
      riskLevel,
      colorCode,
      hasSevereSingleParameter,
      breakdown: {
        respiratoryRateScore: rrScore,
        spO2Score,
        oxygenScore,
        systolicBpScore: bpScore,
        heartRateScore: hrScore,
        temperatureScore: tempScore,
        consciousnessScore: consciousScore,
      },
      clinicalRecommendationEn: recEn,
      clinicalRecommendationKh: recKh,
    };
  }
}

Injectable()(ClinicalDecisionSupportService);
