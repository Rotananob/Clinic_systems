// Clinical Decision Support System (CDSS) Client-Side Engine for ClinicOS
// Pure TypeScript engine for instant offline DDI validation, allergy checks, and NEWS2 triage scoring

export type DdiSeverity = 'SEVERE' | 'MODERATE' | 'MILD';
export type DdiAction = 'BLOCK' | 'WARNING_REQUIRES_OVERRIDE' | 'INFORMATIONAL';
export type TriageRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ClientDdiAlert {
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

export interface ClientAllergyAlert {
  matchedAllergy: string;
  offendingMedication: string;
  severity: 'SEVERE' | 'MODERATE';
  mechanism: string;
  recommendation: string;
  isCrossReactivity: boolean;
}

export interface ClientNews2Input {
  respiratoryRate?: number;
  spO2?: number;
  oxygenSaturation?: number;
  onSupplementalOxygen?: boolean;
  supplementalOxygen?: boolean;
  systolicBp?: number;
  heartRate?: number;
  temperature?: number;
  consciousness?: 'ALERT' | 'CONFUSED' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE' | string;
}

export interface ClientNews2Result {
  totalScore: number;
  riskLevel: TriageRiskLevel;
  colorCode: 'GREEN' | 'YELLOW' | 'RED';
  hasSevereSingleParameter: boolean;
  recommendationKh: string;
  recommendationEn: string;
}

export interface ClientIcd11Item {
  icd11Code: string;
  icd10Code: string;
  titleEn: string;
  titleKh: string;
  category: string;
}

const CLIENT_DDI_RULES = [
  {
    id: 'DDI-001',
    drug1: ['warfarin', 'coumadin', 'rivaroxaban', 'apixaban', 'dabigatran'],
    drug2: ['ibuprofen', 'diclofenac', 'aspirin', 'naproxen', 'ketorolac', 'mefenamic', 'meloxicam'],
    severity: 'SEVERE' as DdiSeverity,
    action: 'BLOCK' as DdiAction,
    riskKh: 'ការហូរឈាមក្រពះពោះវៀនធ្ងន់ធ្ងរ និងគ្រោះថ្នាក់ដល់អាយុជីវិត។',
    riskEn: 'Severe gastrointestinal hemorrhage and life-threatening systemic bleeding.',
    recKh: 'ចៀសវាងការចេញថ្នាំរួមគ្នា។ ប្រើ Paracetamol ជំនួស ឬបន្ថែមថ្នាំការពារក្រពះ PPI។',
    recEn: 'Avoid co-prescription. Use Paracetamol for pain or co-prescribe PPI.',
    altKh: 'Paracetamol 500mg - 1000mg',
    altEn: 'Paracetamol 500mg - 1000mg',
  },
  {
    id: 'DDI-002',
    drug1: ['enalapril', 'lisinopril', 'ramipril', 'captopril', 'losartan', 'valsartan'],
    drug2: ['spironolactone', 'eplerenone', 'potassium', 'aldactone'],
    severity: 'SEVERE' as DdiSeverity,
    action: 'WARNING_REQUIRES_OVERRIDE' as DdiAction,
    riskKh: 'ការលើសជាតិប៉ូតាស្យូមធ្ងន់ធ្ងរដែលអាចបណ្ដាលឱ្យចង្វាក់បេះដូងលោតខុសប្រក្រតី។',
    riskEn: 'Severe hyperkalemia (> 6.0 mEq/L) leading to fatal cardiac dysrhythmias.',
    recKh: 'ពិនិត្យជាតិ K+ និងមុខងារតម្រងនោមមុនពេលប្រើ និងតាមដានឡើងវិញក្នុងរយៈពេល ៧ ថ្ងៃ។',
    recEn: 'Check baseline serum K+ and creatinine; monitor within 7 days.',
    altKh: 'Hydrochlorothiazide ឬ Furosemide',
    altEn: 'Hydrochlorothiazide or Furosemide',
  },
  {
    id: 'DDI-003',
    drug1: ['simvastatin', 'atorvastatin', 'lovastatin'],
    drug2: ['clarithromycin', 'erythromycin', 'ketoconazole'],
    severity: 'SEVERE' as DdiSeverity,
    action: 'BLOCK' as DdiAction,
    riskKh: 'ការរលាយសាច់ដុំស្រួចស្រាវ (Rhabdomyolysis) និងខ្សោយតម្រងនោមធ្ងន់ធ្ងរ។',
    riskEn: 'Severe rhabdomyolysis, muscle breakdown, and acute renal failure.',
    recKh: 'ផ្អាកថ្នាំ Statin បណ្ដោះអាសន្នអំឡុងពេលលេបថ្នាំផ្សះ ឬប្តូរមកប្រើ Azithromycin។',
    recEn: 'Temporarily suspend Statin during antibiotic course, or substitute Azithromycin.',
    altKh: 'Azithromycin 500mg ឬ Rosuvastatin',
    altEn: 'Azithromycin 500mg or Rosuvastatin',
  },
  {
    id: 'DDI-004',
    drug1: ['ciprofloxacin', 'levofloxacin', 'norfloxacin'],
    drug2: ['antacid', 'magnesium', 'aluminum', 'calcium', 'iron', 'sucralfate'],
    severity: 'MODERATE' as DdiSeverity,
    action: 'WARNING_REQUIRES_OVERRIDE' as DdiAction,
    riskKh: 'ការស្រូបយកថ្នាំផ្សះធ្លាក់ចុះរហូតដល់ ៩០% បង្កឱ្យការព្យាបាលមិនជាសះស្បើយ។',
    riskEn: 'Chelation reduces quinolone absorption by up to 90%, risking therapeutic failure.',
    recKh: 'លេបថ្នាំផ្សះ Quinolone យ៉ាងតិច ២ ម៉ោងមុន ឬ ៤ ម៉ោងក្រោយពេលលេបថ្នាំបន្សាបអាស៊ីត។',
    recEn: 'Administer fluoroquinolone at least 2 hours before or 4 hours after cations.',
    altKh: 'ញែកពេលវេលាលេបថ្នាំទាំងពីរឱ្យឃ្លាតគ្នា ២ ម៉ោង',
    altEn: 'Stagger administration timing by minimum 2 hours',
  },
  {
    id: 'DDI-007',
    drug1: ['atenolol', 'metoprolol', 'propranolol', 'bisoprolol'],
    drug2: ['verapamil', 'diltiazem'],
    severity: 'SEVERE' as DdiSeverity,
    action: 'BLOCK' as DdiAction,
    riskKh: 'ចង្វាក់បេះដូងដើរយឺតខ្លាំង ខូចចរន្តអគ្គិសនីបេះដូង (AV Block) និងខ្សោយបេះដូង។',
    riskEn: 'Profound bradycardia, high-grade AV block, and acute heart failure.',
    recKh: 'ហាមប្រើថ្នាំ Verapamil/Diltiazem ជាមួយថ្នាំ Beta-blocker ដាច់ខាត។ ប្រើ Amlodipine ជំនួស។',
    recEn: 'Do not combine non-dihydropyridine CCBs with beta-blockers. Use Amlodipine instead.',
    altKh: 'Amlodipine 5mg ក្នុងមួយថ្ងៃ',
    altEn: 'Amlodipine 5mg daily',
  },
  {
    id: 'DDI-008',
    drug1: ['sildenafil', 'tadalafil', 'viagra'],
    drug2: ['nitroglycerin', 'isosorbide', 'nitrate'],
    severity: 'SEVERE' as DdiSeverity,
    action: 'BLOCK' as DdiAction,
    riskKh: 'ការធ្លាក់ចុះសម្ពាធឈាមធ្ងន់ធ្ងរមិនអាចស្រោចស្រង់បាន និងដាច់សរសៃឈាមបេះដូង។',
    riskEn: 'Catastrophic refractory hypotension, myocardial infarction, and shock.',
    recKh: 'ជាការហាមឃាត់ដាច់ខាត (Absolute Contraindication)។ មិនត្រូវប្រើថ្នាំ Nitrate ឡើយ។',
    recEn: 'Absolute Contraindication. Do not administer nitrates concurrently.',
    altKh: 'ប្រើថ្នាំបេះដូងជម្រើសផ្សេងដែលមិនមែនជា Nitrate',
    altEn: 'Alternative non-nitrate anti-anginal therapy',
  },
];

const CLIENT_ALLERGY_RULES = [
  {
    allergyKeywords: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'ប៉េនីស៊ីលីន'],
    offendingKeywords: ['amoxicillin', 'ampicillin', 'augmentin', 'penicillin', 'piperacillin', 'cloxacillin'],
    severity: 'SEVERE' as const,
    nameKh: 'អាលែកហ្ស៊ីពពួកប៉េនីស៊ីលីន (Penicillin Allergy)',
    isCross: false,
  },
  {
    allergyKeywords: ['penicillin', 'ប៉េនីស៊ីលីន'],
    offendingKeywords: ['cefixime', 'ceftriaxone', 'cephalexin', 'cefuroxime'],
    severity: 'MODERATE' as const,
    nameKh: 'ប្រតិកម្មឆ្លង Cephalosporin (Cross-Reactivity ~2-5%)',
    isCross: true,
  },
  {
    allergyKeywords: ['sulfa', 'sulfonamide', 'bactrim', 'ស៊ុលហ្វា'],
    offendingKeywords: ['cotrimoxazole', 'bactrim', 'sulfamethoxazole'],
    severity: 'SEVERE' as const,
    nameKh: 'អាលែកហ្ស៊ីពពួកស៊ុលហ្វា (Sulfa Allergy)',
    isCross: false,
  },
  {
    allergyKeywords: ['nsaid', 'aspirin', 'ibuprofen', 'អាស្ពីរីន'],
    offendingKeywords: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'mefenamic'],
    severity: 'SEVERE' as const,
    nameKh: 'អាលែកហ្ស៊ីថ្នាំបំបាត់ការរលាក NSAID / Aspirin',
    isCross: true,
  },
];

const CLIENT_ICD11_DB: ClientIcd11Item[] = [
  { icd11Code: 'CA42', icd10Code: 'J02.9', titleEn: 'Acute Pharyngitis', titleKh: 'រលាកបំពង់កស្រួចស្រាវ', category: 'ENT' },
  { icd11Code: 'CA45', icd10Code: 'J06.9', titleEn: 'Acute Upper Respiratory Tract Infection (URTI)', titleKh: 'ការឆ្លងរោគផ្លូវដង្ហើមផ្នែកខាងលើ', category: 'Respiratory' },
  { icd11Code: 'CA42.0', icd10Code: 'J20.9', titleEn: 'Acute Bronchitis', titleKh: 'រលាកទងសួតស្រួចស្រាវ', category: 'Respiratory' },
  { icd11Code: 'DA42', icd10Code: 'K29.7', titleEn: 'Gastritis and Duodenitis', titleKh: 'រលាកក្រពះ / ដំបៅក្រពះ', category: 'GI' },
  { icd11Code: '1A40', icd10Code: 'A09', titleEn: 'Acute Gastroenteritis', titleKh: 'រលាកក្រពះពោះវៀនស្រួចស្រាវ', category: 'GI' },
  { icd11Code: 'BA00', icd10Code: 'I10', titleEn: 'Essential Hypertension', titleKh: 'លើសសម្ពាធឈាមបឋម', category: 'Cardiovascular' },
  { icd11Code: '5A11', icd10Code: 'E11', titleEn: 'Type 2 Diabetes Mellitus', titleKh: 'ជំងឺទឹកនោមផ្អែមប្រភេទទី ២', category: 'Endocrine' },
  { icd11Code: '1D20', icd10Code: 'A90', titleEn: 'Dengue Fever', titleKh: 'ជំងឺគ្រុនឈាម', category: 'Infectious' },
  { icd11Code: '1A07', icd10Code: 'A01.0', titleEn: 'Typhoid Fever', titleKh: 'ជំងឺគ្រុនពោះវៀន', category: 'Infectious' },
  { icd11Code: '4A80', icd10Code: 'J30.4', titleEn: 'Allergic Rhinitis', titleKh: 'រលាកច្រមុះដោយសារអាលែកហ្ស៊ី', category: 'Allergy' },
];

/**
 * Check real-time drug interactions on the client side
 */
export function checkClientDrugInteractions(medications: string[]): ClientDdiAlert[] {
  const alerts: ClientDdiAlert[] = [];
  if (!medications || medications.length < 2) return alerts;

  const normalized = medications.map((m) => m.toLowerCase().trim());

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i];
      const b = normalized[j];

      for (const rule of CLIENT_DDI_RULES) {
        const matchA1 = rule.drug1.some((k) => a.includes(k));
        const matchB2 = rule.drug2.some((k) => b.includes(k));
        const matchA2 = rule.drug2.some((k) => a.includes(k));
        const matchB1 = rule.drug1.some((k) => b.includes(k));

        if ((matchA1 && matchB2) || (matchA2 && matchB1)) {
          alerts.push({
            ruleId: rule.id,
            drug1: medications[i],
            drug2: medications[j],
            severity: rule.severity,
            action: rule.action,
            mechanism: rule.riskKh,
            clinicalRisk: rule.riskKh,
            recommendation: rule.recKh,
            safeAlternative: rule.altKh,
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Check client-side allergy conflicts against documented patient allergies
 */
export function checkClientAllergyConflicts(
  medications: string[],
  patientAllergiesRaw?: string | null
): ClientAllergyAlert[] {
  const alerts: ClientAllergyAlert[] = [];
  if (!medications || medications.length === 0 || !patientAllergiesRaw) return alerts;

  const allergyStr = patientAllergiesRaw.toLowerCase();
  const normalizedMeds = medications.map((m) => m.toLowerCase().trim());

  for (const rule of CLIENT_ALLERGY_RULES) {
    const hasAllergy = rule.allergyKeywords.some((k) => allergyStr.includes(k));
    if (hasAllergy) {
      for (let idx = 0; idx < normalizedMeds.length; idx++) {
        const med = normalizedMeds[idx];
        const isOffending = rule.offendingKeywords.some((k) => med.includes(k));
        if (isOffending) {
          alerts.push({
            matchedAllergy: rule.nameKh,
            offendingMedication: medications[idx],
            severity: rule.severity,
            mechanism: rule.nameKh,
            recommendation: rule.isCross
              ? 'មានហានិភ័យប្រតិកម្មឆ្លង (Cross-reactivity)។ គួរជ្រើសរើសថ្នាំក្រុមផ្សេង។'
              : 'ហាមប្រើថ្នាំនេះដាច់ខាតដោយសារអ្នកជំងឺមានប្រវត្តិប្រតិកម្មអាលែកហ្ស៊ីធ្ងន់ធ្ងរ។',
            isCrossReactivity: rule.isCross,
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Calculate NEWS2 triage score on client side
 */
export function calculateClientNews2(vitals: ClientNews2Input): ClientNews2Result {
  let rr = 0;
  if (vitals.respiratoryRate !== undefined) {
    const v = vitals.respiratoryRate;
    if (v <= 8) rr = 3;
    else if (v >= 9 && v <= 11) rr = 1;
    else if (v >= 12 && v <= 20) rr = 0;
    else if (v >= 21 && v <= 24) rr = 2;
    else if (v >= 25) rr = 3;
  }

  let spO2 = 0;
  const satVal = vitals.spO2 !== undefined ? vitals.spO2 : vitals.oxygenSaturation;
  if (satVal !== undefined) {
    const v = satVal;
    if (v <= 91) spO2 = 3;
    else if (v >= 92 && v <= 93) spO2 = 2;
    else if (v >= 94 && v <= 95) spO2 = 1;
    else if (v >= 96) spO2 = 0;
  }

  const o2Supp = (vitals.onSupplementalOxygen || vitals.supplementalOxygen) ? 2 : 0;

  let bp = 0;
  if (vitals.systolicBp !== undefined) {
    const v = vitals.systolicBp;
    if (v <= 90) bp = 3;
    else if (v >= 91 && v <= 100) bp = 2;
    else if (v >= 101 && v <= 110) bp = 1;
    else if (v >= 111 && v <= 219) bp = 0;
    else if (v >= 220) bp = 3;
  }

  let hr = 0;
  if (vitals.heartRate !== undefined) {
    const v = vitals.heartRate;
    if (v <= 40) hr = 3;
    else if (v >= 41 && v <= 50) hr = 1;
    else if (v >= 51 && v <= 90) hr = 0;
    else if (v >= 91 && v <= 110) hr = 1;
    else if (v >= 111 && v <= 130) hr = 2;
    else if (v >= 131) hr = 3;
  }

  let temp = 0;
  if (vitals.temperature !== undefined) {
    const v = vitals.temperature;
    if (v <= 35.0) temp = 3;
    else if (v >= 35.1 && v <= 36.0) temp = 1;
    else if (v >= 36.1 && v <= 38.0) temp = 0;
    else if (v >= 38.1 && v <= 39.0) temp = 1;
    else if (v >= 39.1) temp = 2;
  }

  const conscious = vitals.consciousness && vitals.consciousness !== 'ALERT' ? 3 : 0;

  const totalScore = rr + spO2 + o2Supp + bp + hr + temp + conscious;
  const hasSevereSingleParameter =
    rr === 3 || spO2 === 3 || bp === 3 || hr === 3 || temp === 3 || conscious === 3;

  let riskLevel: TriageRiskLevel = 'LOW';
  let colorCode: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  let recKh = 'ហានិភ័យកម្រិតស្រាល (ធម្មតា)។ តាមដានសញ្ញាជីវិតជាប្រចាំ និងពិគ្រោះជំងឺតាមវេនធម្មតា។';
  let recEn = 'Low clinical risk. Routine vital signs monitoring and standard outpatient consultation.';

  if (totalScore >= 7) {
    riskLevel = 'HIGH';
    colorCode = 'RED';
    recKh = 'ហានិភ័យកម្រិតខ្ពស់ / សង្គ្រោះបន្ទាន់។ តម្រូវឱ្យវេជ្ជបណ្ឌិតជាន់ខ្ពស់ពិនិត្យជាបន្ទាន់។';
    recEn = 'High clinical risk / Emergency. Immediate emergency evaluation by senior physician required.';
  } else if (totalScore >= 5 || hasSevereSingleParameter) {
    riskLevel = 'MEDIUM';
    colorCode = 'YELLOW';
    recKh = 'ហានិភ័យកម្រិតមធ្យម។ តម្រូវឱ្យគ្រូពេទ្យពិនិត្យឡើងវិញជាបន្ទាន់ក្នុងរយៈពេល ៣០ នាទី។';
    recEn = 'Medium clinical risk. Urgent review by clinician within 30 minutes.';
  }

  return {
    totalScore,
    riskLevel,
    colorCode,
    hasSevereSingleParameter,
    recommendationKh: recKh,
    recommendationEn: recEn,
  };
}

/**
 * Fast search client ICD-11 entities
 */
export function searchClientIcd11(query: string): ClientIcd11Item[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return CLIENT_ICD11_DB.slice(0, 8);

  return CLIENT_ICD11_DB.filter(
    (item) =>
      item.icd11Code.toLowerCase().includes(q) ||
      item.icd10Code.toLowerCase().includes(q) ||
      item.titleEn.toLowerCase().includes(q) ||
      item.titleKh.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );
}
