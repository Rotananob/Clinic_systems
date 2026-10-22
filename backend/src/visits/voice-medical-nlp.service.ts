import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

export interface ClinicalVitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  spO2?: number;
  weightKg?: number;
  heightCm?: number;
}

export interface PrescriptionItemDraft {
  medicineName: string;
  dosage: string;
  quantity: number;
  route: string;
  frequency: string;
  timing: string;
  durationDays: number;
  instructions: string;
}

export interface SoapNoteStructure {
  subjective: {
    chiefComplaint: string;
    symptoms: string[];
    duration?: string;
    history?: string;
  };
  objective: {
    vitals: ClinicalVitals;
    physicalExamFindings: string[];
    observations?: string;
  };
  assessment: {
    primaryDiagnosis: string;
    icd11Code?: string;
    icd10Code?: string;
    differentialDiagnoses: string[];
    severity?: 'MILD' | 'MODERATE' | 'SEVERE';
  };
  plan: {
    prescriptions: PrescriptionItemDraft[];
    treatmentAdvice: string[];
    followUpDays?: number;
    labTestsOrdered: string[];
  };
  rawTranscription: string;
  formattedSoapKhmer: string;
  formattedSoapEnglish: string;
  confidenceScore: number;
  aiProvider?: string;
}

export interface DiagnosticReference {
  keywords: string[];
  primaryDiagnosisKhmer: string;
  primaryDiagnosisEnglish: string;
  icd11Code: string;
  icd10Code: string;
  defaultSeverity: 'MILD' | 'MODERATE' | 'SEVERE';
  recommendedAdviceKhmer: string[];
  recommendedAdviceEnglish: string[];
}

export const CLINICAL_DIAGNOSTIC_DB: DiagnosticReference[] = [
  {
    keywords: ['pharyngitis', 'sore throat', 'ឈឺបំពង់ក', 'រលាកបំពង់ក', 'tonsil', 'កូនកណ្តុរ'],
    primaryDiagnosisKhmer: 'រលាកបំពង់កស្រួចស្រាវ (Acute Pharyngitis)',
    primaryDiagnosisEnglish: 'Acute Pharyngitis',
    icd11Code: 'CA42',
    icd10Code: 'J02.9',
    defaultSeverity: 'MILD',
    recommendedAdviceKhmer: ['ខ្ពុរមាត់ជាមួយទឹកអំបិលក្ដៅឧណ្ហៗ', 'ញ៉ាំទឹកក្ដៅឧណ្ហៗឱ្យបានច្រើន', 'ចៀសវាងអាហារហឹរ ឬត្រជាក់ខ្លាំង'],
    recommendedAdviceEnglish: ['Warm saline gargles 3-4 times daily', 'Hydrate with warm fluids', 'Avoid cold and spicy foods'],
  },
  {
    keywords: ['urti', 'common cold', 'ផ្តាសាយ', 'ក្អក', 'ហៀរសំបោរ', 'cough', 'runny nose', 'congestion', 'ផ្តាសាយធំ'],
    primaryDiagnosisKhmer: 'ការឆ្លងរោគផ្លូវដង្ហើមផ្នែកខាងលើ (URTI)',
    primaryDiagnosisEnglish: 'Acute Upper Respiratory Tract Infection (URTI)',
    icd11Code: 'CA45',
    icd10Code: 'J06.9',
    defaultSeverity: 'MILD',
    recommendedAdviceKhmer: ['សម្រាកឱ្យបានគ្រប់គ្រាន់', 'ញ៉ាំទឹកក្ដៅឧណ្ហៗឱ្យបានច្រើន', 'ពាក់ម៉ាសការពារការចម្លង'],
    recommendedAdviceEnglish: ['Adequate bed rest', 'Drink plenty of warm fluids', 'Wear a mask in crowded areas'],
  },
  {
    keywords: ['bronchitis', 'wheezing', 'ក្អកមានស្លេស្ម', 'រលាកទងសួត', 'chest tightness', 'cough with phlegm'],
    primaryDiagnosisKhmer: 'រលាកទងសួតស្រួចស្រាវ (Acute Bronchitis)',
    primaryDiagnosisEnglish: 'Acute Bronchitis',
    icd11Code: 'CA42.0',
    icd10Code: 'J20.9',
    defaultSeverity: 'MODERATE',
    recommendedAdviceKhmer: ['ចៀសវាងផ្សែងបារី និងធូលីដី', 'ញ៉ាំទឹកក្ដៅឧណ្ហៗដើម្បីសម្រួលស្លេស្ម', 'ប្រសិនបើពិបាកដកដង្ហើមត្រូវមកជួបគ្រូពេទ្យជាបន្ទាន់'],
    recommendedAdviceEnglish: ['Avoid cigarette smoke and dust exposure', 'Steam inhalation for airway relief', 'Seek emergency care if shortness of breath worsens'],
  },
  {
    keywords: ['gastritis', 'peptic', 'epigastric', 'ឈឺក្រពះ', 'ចុកពោះលើ', 'ក្រហាយទ្រូង', 'heartburn', 'acid reflux'],
    primaryDiagnosisKhmer: 'រលាកក្រពះ / ដំបៅក្រពះ (Gastritis / Peptic Ulcer)',
    primaryDiagnosisEnglish: 'Gastritis / Peptic Ulcer Disease',
    icd11Code: 'DA42',
    icd10Code: 'K29.7',
    defaultSeverity: 'MODERATE',
    recommendedAdviceKhmer: ['ញ៉ាំបាយឱ្យទៀងពេល', 'ចៀសវាងអាហារហឹរ ជូរ និងភេសជ្ជៈមានជាតិហ្គាស ឬជាតិស្រវឹង', 'កុំគេងភ្លាមៗក្រោយពេលញ៉ាំបាយរួច'],
    recommendedAdviceEnglish: ['Eat meals at regular scheduled hours', 'Avoid acidic, spicy food, coffee and alcohol', 'Do not lie down within 2 hours of eating'],
  },
  {
    keywords: ['gastroenteritis', 'diarrhea', 'រាក', 'ក្អួត', 'vomiting', 'loose stool', 'ពុលចំណី', 'food poisoning'],
    primaryDiagnosisKhmer: 'រលាកក្រពះពោះវៀនស្រួចស្រាវ (Acute Gastroenteritis)',
    primaryDiagnosisEnglish: 'Acute Gastroenteritis',
    icd11Code: '1A40',
    icd10Code: 'A09',
    defaultSeverity: 'MODERATE',
    recommendedAdviceKhmer: ['ញ៉ាំទឹកអូរ៉ាលីត (ORS) បន្ទាប់ពីរាកម្ដងៗ', 'ញ៉ាំបបរ ឬអាហារទន់ៗរាវៗ', 'ចៀសវាងទឹកដោះគោ និងអាហារមានជាតិខ្លាញ់ខ្លាំង'],
    recommendedAdviceEnglish: ['Oral rehydration salts (ORS) after each watery stool', 'Soft bland diet (congee, banana)', 'Avoid dairy and fatty foods until recovered'],
  },
  {
    keywords: ['hypertension', 'high blood pressure', 'លើសឈាម', 'លើសសម្ពាធឈាម', 'bp high', 'hypertensive'],
    primaryDiagnosisKhmer: 'លើសសម្ពាធឈាមបឋម (Essential Hypertension)',
    primaryDiagnosisEnglish: 'Essential Hypertension',
    icd11Code: 'BA00',
    icd10Code: 'I10',
    defaultSeverity: 'MODERATE',
    recommendedAdviceKhmer: ['កាត់បន្ថយការញ៉ាំប្រៃ និងអាហារខ្លាញ់', 'ហាត់ប្រាណជាប្រចាំយ៉ាងតិច ៣០ នាទីក្នុងមួយថ្ងៃ', 'តាមដានសម្ពាធឈាមរាល់ព្រឹក និងលេបថ្នាំទៀងទាត់'],
    recommendedAdviceEnglish: ['Low sodium, low fat diet (DASH diet)', 'Regular aerobic exercise 30 mins daily', 'Daily morning BP log and strict medication adherence'],
  },
  {
    keywords: ['diabetes', 'high blood sugar', 'ទឹកនោមផ្អែម', 'hyperglycemia', 'sugar high'],
    primaryDiagnosisKhmer: 'ជំងឺទឹកនោមផ្អែមប្រភេទទី ២ (Type 2 Diabetes Mellitus)',
    primaryDiagnosisEnglish: 'Type 2 Diabetes Mellitus',
    icd11Code: '5A11',
    icd10Code: 'E11',
    defaultSeverity: 'MODERATE',
    recommendedAdviceKhmer: ['កាត់បន្ថយជាតិស្ករ ភេសជ្ជៈផ្អែម និងបាយសច្រើនហួសហេតុ', 'ពិនិត្យជាតិស្ករក្នុងឈាមជាប្រចាំ', 'ពិនិត្យបាតជើងរាល់ថ្ងៃដើម្បីបង្ការដំបៅ'],
    recommendedAdviceEnglish: ['Strict carbohydrate and refined sugar restriction', 'Regular blood glucose monitoring', 'Daily foot inspection to prevent ulcers'],
  },
  {
    keywords: ['dengue', 'គ្រុនឈាម', 'petechiae', 'thrombocytopenia', 'mosquito bite', 'high continuous fever'],
    primaryDiagnosisKhmer: 'ជំងឺគ្រុនឈាម (Dengue Fever)',
    primaryDiagnosisEnglish: 'Dengue Fever',
    icd11Code: '1D20',
    icd10Code: 'A90',
    defaultSeverity: 'SEVERE',
    recommendedAdviceKhmer: ['ពិនិត្យឈាមតាមដានចំនួនប្លាកែត (CBC/Platelet) រៀងរាល់ ២៤ ម៉ោង', 'ហាមប្រើថ្នាំ Aspirin ឬ Ibuprofen ដាច់ខាត', 'ញ៉ាំទឹកឱ្យបានច្រើន និងសម្រាកនៅផ្ទះ'],
    recommendedAdviceEnglish: ['Serial CBC monitoring every 24 hours', 'Strictly avoid Aspirin and NSAIDs', 'Aggressive oral fluid intake and bed rest'],
  },
  {
    keywords: ['typhoid', 'គ្រុនពោះវៀន', 'enteric fever', 'step-ladder fever'],
    primaryDiagnosisKhmer: 'ជំងឺគ្រុនពោះវៀន (Typhoid Fever)',
    primaryDiagnosisEnglish: 'Typhoid Fever',
    icd11Code: '1A07',
    icd10Code: 'A01.0',
    defaultSeverity: 'MODERATE',
    recommendedAdviceKhmer: ['ញ៉ាំទឹកដាំពុះស្អាត និងអាហារចម្អិនឆ្អិនល្អ', 'លេបថ្នាំអង់ទីប៊ីយ៉ូទិកឱ្យគ្រប់ចំនួនថ្ងៃដែលបានចេញវេជ្ជបញ្ជា', 'លាងដៃជាមួយសាប៊ូមុនពេលញ៉ាំអាហារ'],
    recommendedAdviceEnglish: ['Drink boiled water and well-cooked food', 'Complete full course of antibiotics as prescribed', 'Strict hand hygiene before meals'],
  },
  {
    keywords: ['allergic rhinitis', 'allergy', 'អាលែកហ្ស៊ី', 'កណ្ដាស់', 'sneezing', 'itchy nose'],
    primaryDiagnosisKhmer: 'រលាកច្រមុះដោយសារអាលែកហ្ស៊ី (Allergic Rhinitis)',
    primaryDiagnosisEnglish: 'Allergic Rhinitis',
    icd11Code: '4A80',
    icd10Code: 'J30.4',
    defaultSeverity: 'MILD',
    recommendedAdviceKhmer: ['ចៀសវាងសារធាតុបង្កអាលែកហ្ស៊ី ដូចជាធូលី លម្អងផ្កា និងរោមសត្វ', 'លាងសម្អាតច្រមុះជាមួយទឹកអំបិល (Nasal Saline Spray)', 'ពាក់ម៉ាសពេលចេញក្រៅ'],
    recommendedAdviceEnglish: ['Identify and avoid allergic triggers (dust mites, pollen)', 'Saline nasal irrigation twice daily', 'Wear protective mask outdoors'],
  },
];

export interface StandardMedication {
  brandName: string;
  genericName: string;
  defaultDosage: string;
  defaultRoute: string;
  defaultFrequency: string;
  defaultTiming: string;
  defaultDurationDays: number;
  unitsPerDose: number;
}

export const COMMON_MEDICATIONS: StandardMedication[] = [
  {
    brandName: 'Amoxicillin',
    genericName: 'Amoxicillin',
    defaultDosage: '500mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'TID (៣ ដង/ថ្ងៃ)',
    defaultTiming: 'After meals (ក្រោយបាយ)',
    defaultDurationDays: 5,
    unitsPerDose: 1,
  },
  {
    brandName: 'Paracetamol',
    genericName: 'Acetaminophen',
    defaultDosage: '500mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'Q6H PRN (រៀងរាល់ ៦ ម៉ោងពេលក្តៅខ្លួន/ឈឺ)',
    defaultTiming: 'After meals (ក្រោយបាយ)',
    defaultDurationDays: 3,
    unitsPerDose: 1,
  },
  {
    brandName: 'Ibuprofen',
    genericName: 'Ibuprofen',
    defaultDosage: '400mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'BID (២ ដង/ថ្ងៃ)',
    defaultTiming: 'After meals (ក្រោយបាយភ្លាមៗ)',
    defaultDurationDays: 3,
    unitsPerDose: 1,
  },
  {
    brandName: 'Omeprazole',
    genericName: 'Omeprazole',
    defaultDosage: '20mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'OD (១ ដង/ថ្ងៃ)',
    defaultTiming: 'Before breakfast (៣០ នាទីមុនអាហារពេលព្រឹក)',
    defaultDurationDays: 14,
    unitsPerDose: 1,
  },
  {
    brandName: 'Azithromycin',
    genericName: 'Azithromycin',
    defaultDosage: '500mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'OD (១ ដង/ថ្ងៃ)',
    defaultTiming: 'Before meals (១ ម៉ោងមុនបាយ ឬ ២ ម៉ោងក្រោយបាយ)',
    defaultDurationDays: 3,
    unitsPerDose: 1,
  },
  {
    brandName: 'Cetirizine',
    genericName: 'Cetirizine HCl',
    defaultDosage: '10mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'OD (១ ដង/ថ្ងៃ)',
    defaultTiming: 'At bedtime (មុនចូលគេង)',
    defaultDurationDays: 5,
    unitsPerDose: 1,
  },
  {
    brandName: 'Oral Rehydration Salts',
    genericName: 'ORS (អូរ៉ាលីត)',
    defaultDosage: '1 Sachet',
    defaultRoute: 'Oral (លាយទឹកផឹក)',
    defaultFrequency: 'After each loose stool (ក្រោយរាកម្ដងៗ)',
    defaultTiming: 'As needed (តាមតម្រូវការ)',
    defaultDurationDays: 3,
    unitsPerDose: 1,
  },
  {
    brandName: 'Metformin',
    genericName: 'Metformin HCl',
    defaultDosage: '500mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'BID (២ ដង/ថ្ងៃ)',
    defaultTiming: 'With meals (ជាមួយបាយ)',
    defaultDurationDays: 30,
    unitsPerDose: 1,
  },
  {
    brandName: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    defaultDosage: '5mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'OD (១ ដង/ថ្ងៃ)',
    defaultTiming: 'Morning (ពេលព្រឹក)',
    defaultDurationDays: 30,
    unitsPerDose: 1,
  },
  {
    brandName: 'Cefixime',
    genericName: 'Cefixime',
    defaultDosage: '200mg',
    defaultRoute: 'Oral (លេប)',
    defaultFrequency: 'BID (២ ដង/ថ្ងៃ)',
    defaultTiming: 'After meals (ក្រោយបាយ)',
    defaultDurationDays: 7,
    unitsPerDose: 1,
  },
];

export class VoiceMedicalNlpService {
  private readonly logger = new Logger(VoiceMedicalNlpService.name);
  private static readonly rateLimitMap = new Map<string, number[]>();

  /**
   * Enforce rate limit (1-2 calls per 60 seconds per user/clinic)
   */
  public enforceRateLimit(key: string, maxRequests = 2, windowMs = 60000): void {
    const now = Date.now();
    const timestamps = (VoiceMedicalNlpService.rateLimitMap.get(key) || []).filter(ts => now - ts < windowMs);
    if (timestamps.length >= maxRequests) {
      const oldestTimestamp = timestamps[0];
      const remainingSeconds = Math.max(1, Math.ceil((windowMs - (now - oldestTimestamp)) / 1000));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `សូមរង់ចាំបន្តិច! លោកអ្នកអាចប្រើមុខងារ AI Medical Voice/SOAP បានត្រឹមតែ ១ ទៅ ២ ដងប៉ុណ្ណោះក្នុង ១ នាទី ដើម្បីការពារការ Spam ប្រព័ន្ធ។ សូមព្យាយាមម្តងទៀតនៅ ${remainingSeconds} វិនាទីទៀត។`,
          retryAfterSeconds: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    timestamps.push(now);
    VoiceMedicalNlpService.rateLimitMap.set(key, timestamps);
  }

  /**
   * Parse clinical consultation transcript into structured SOAP notes using Google Gemini 3.8 Flash
   * Automatically falls back to deterministic rule-based NLP engine if Gemini is unreachable or rate limited externally.
   */
  public async parseWithGemini(transcript: string, doctorName = 'Doctor'): Promise<SoapNoteStructure> {
    const cleanText = (transcript || '').trim();
    if (!cleanText) {
      return this.parseClinicalDictation(cleanText, doctorName);
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured. Falling back to local deterministic rule engine.');
      return this.parseClinicalDictation(cleanText, doctorName);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const systemInstruction = `You are an expert clinical physician and medical AI parser specializing in Khmer and English clinical documentation for private clinics and polyclinics in Cambodia.
Parse the doctor's spoken medical consultation dictation into a structured clinical SOAP note.
Return strictly valid JSON conforming to this schema:
{
  "subjective": {
    "chiefComplaint": string,
    "symptoms": string[],
    "duration": string,
    "history": string
  },
  "objective": {
    "vitals": {
      "bloodPressure": string,
      "heartRate": number,
      "temperature": number,
      "respiratoryRate": number,
      "spO2": number,
      "weightKg": number,
      "heightCm": number
    },
    "physicalExamFindings": string[],
    "observations": string
  },
  "assessment": {
    "primaryDiagnosis": string,
    "icd11Code": string,
    "icd10Code": string,
    "differentialDiagnoses": string[],
    "severity": "MILD" | "MODERATE" | "SEVERE"
  },
  "plan": {
    "prescriptions": [
      {
        "medicineName": string,
        "dosage": string,
        "quantity": number,
        "route": string,
        "frequency": string,
        "timing": string,
        "durationDays": number,
        "instructions": string
      }
    ],
    "treatmentAdvice": string[],
    "followUpDays": number,
    "labTestsOrdered": string[]
  },
  "rawTranscription": string,
  "formattedSoapKhmer": string,
  "formattedSoapEnglish": string,
  "confidenceScore": number
}
CRITICAL RULES:
- ZERO emojis anywhere across all keys and text.
- Accurately parse numbers for vitals: bloodPressure (e.g. "120/80"), heartRate (e.g. 78), temperature (e.g. 38.5), spO2 (e.g. 98).
- Structure prescriptions with exact medicine names, dosages, frequencies, and instructions.
- Provide clean formatted SOAP summaries in Khmer and English.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Doctor consultation transcript to parse:\n${cleanText}` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        this.logger.error(`Gemini API HTTP ${response.status}: ${errBody}`);
        return this.parseClinicalDictation(cleanText, doctorName);
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('Empty response parts from Gemini API');
      }

      const parsed = JSON.parse(rawJson);

      const vitals: ClinicalVitals = {
        bloodPressure: parsed.objective?.vitals?.bloodPressure || undefined,
        heartRate: typeof parsed.objective?.vitals?.heartRate === 'number' ? parsed.objective.vitals.heartRate : undefined,
        temperature: typeof parsed.objective?.vitals?.temperature === 'number' ? parsed.objective.vitals.temperature : undefined,
        respiratoryRate: typeof parsed.objective?.vitals?.respiratoryRate === 'number' ? parsed.objective.vitals.respiratoryRate : undefined,
        spO2: typeof parsed.objective?.vitals?.spO2 === 'number' ? parsed.objective.vitals.spO2 : undefined,
        weightKg: typeof parsed.objective?.vitals?.weightKg === 'number' ? parsed.objective.vitals.weightKg : undefined,
        heightCm: typeof parsed.objective?.vitals?.heightCm === 'number' ? parsed.objective.vitals.heightCm : undefined,
      };

      const fallback = this.parseClinicalDictation(cleanText, doctorName);

      return {
        subjective: {
          chiefComplaint: parsed.subjective?.chiefComplaint || fallback.subjective.chiefComplaint,
          symptoms: Array.isArray(parsed.subjective?.symptoms) && parsed.subjective.symptoms.length > 0 ? parsed.subjective.symptoms : fallback.subjective.symptoms,
          duration: parsed.subjective?.duration || fallback.subjective.duration,
          history: parsed.subjective?.history || fallback.subjective.history,
        },
        objective: {
          vitals: Object.keys(vitals).some(k => vitals[k] !== undefined) ? vitals : fallback.objective.vitals,
          physicalExamFindings: Array.isArray(parsed.objective?.physicalExamFindings) && parsed.objective.physicalExamFindings.length > 0 ? parsed.objective.physicalExamFindings : fallback.objective.physicalExamFindings,
          observations: parsed.objective?.observations || fallback.objective.observations,
        },
        assessment: {
          primaryDiagnosis: parsed.assessment?.primaryDiagnosis || fallback.assessment.primaryDiagnosis,
          icd11Code: parsed.assessment?.icd11Code || fallback.assessment.icd11Code,
          icd10Code: parsed.assessment?.icd10Code || fallback.assessment.icd10Code,
          differentialDiagnoses: Array.isArray(parsed.assessment?.differentialDiagnoses) && parsed.assessment.differentialDiagnoses.length > 0 ? parsed.assessment.differentialDiagnoses : fallback.assessment.differentialDiagnoses,
          severity: (['MILD', 'MODERATE', 'SEVERE'].includes(parsed.assessment?.severity) ? parsed.assessment.severity : fallback.assessment.severity),
        },
        plan: {
          prescriptions: Array.isArray(parsed.plan?.prescriptions) && parsed.plan.prescriptions.length > 0 ? parsed.plan.prescriptions : fallback.plan.prescriptions,
          treatmentAdvice: Array.isArray(parsed.plan?.treatmentAdvice) && parsed.plan.treatmentAdvice.length > 0 ? parsed.plan.treatmentAdvice : fallback.plan.treatmentAdvice,
          followUpDays: typeof parsed.plan?.followUpDays === 'number' ? parsed.plan.followUpDays : fallback.plan.followUpDays,
          labTestsOrdered: Array.isArray(parsed.plan?.labTestsOrdered) ? parsed.plan.labTestsOrdered : fallback.plan.labTestsOrdered,
        },
        rawTranscription: cleanText,
        formattedSoapKhmer: parsed.formattedSoapKhmer || fallback.formattedSoapKhmer,
        formattedSoapEnglish: parsed.formattedSoapEnglish || fallback.formattedSoapEnglish,
        confidenceScore: typeof parsed.confidenceScore === 'number' ? (parsed.confidenceScore <= 1 ? Math.round(parsed.confidenceScore * 100) : Math.min(parsed.confidenceScore, 100)) : fallback.confidenceScore,
        aiProvider: 'Next-Gen Intelligent Medical AI',
      };
    } catch (err) {
      this.logger.error(`Error during Gemini SOAP parsing: ${err.message}. Falling back to rule engine.`);
      return this.parseClinicalDictation(cleanText, doctorName);
    }
  }

  /**
   * Parse clinical voice transcript or dictation text into structured SOAP format
   */
  public parseClinicalDictation(transcript: string, doctorName = 'Doctor'): SoapNoteStructure {
    const cleanText = (transcript || '').trim();

    // 1. Extract Vitals
    const vitals = this.extractVitals(cleanText);

    // 2. Extract Subjective Symptoms
    const subjective = this.extractSubjective(cleanText);

    // 3. Extract Objective Findings
    const objectiveFindings = this.extractObjectiveFindings(cleanText);

    // 4. Determine Assessment & ICD Codes
    const assessment = this.determineAssessment(cleanText, subjective.symptoms);

    // 5. Extract Prescriptions & Plan
    const plan = this.extractPlan(cleanText, assessment);

    // 6. Build Formatted Notes
    const formattedSoapKhmer = this.formatSoapKhmer(doctorName, subjective, vitals, objectiveFindings, assessment, plan);
    const formattedSoapEnglish = this.formatSoapEnglish(doctorName, subjective, vitals, objectiveFindings, assessment, plan);

    // Confidence heuristic based on extracted fields
    let score = 50;
    if (vitals.bloodPressure || vitals.temperature || vitals.heartRate) score += 20;
    if (subjective.symptoms.length > 0) score += 15;
    if (plan.prescriptions.length > 0) score += 15;

    return {
      subjective,
      objective: {
        vitals,
        physicalExamFindings: objectiveFindings,
        observations: objectiveFindings.join('; ') || undefined,
      },
      assessment,
      plan,
      rawTranscription: cleanText,
      formattedSoapKhmer,
      formattedSoapEnglish,
      confidenceScore: Math.min(score, 100),
    };
  }

  /**
   * Extract clinical vital signs using medical regex patterns
   */
  public extractVitals(text: string): ClinicalVitals {
    const vitals: ClinicalVitals = {};

    // Blood Pressure: "BP 120/80", "130/85 mmHg", "ឈាម 120 លើ 80"
    const bpMatch = text.match(/(?:\bbp\b|\bblood pressure\b|ឈាម|សម្ពាធឈាម)[:\s]*([0-9]{2,3})\s*(?:\/|លើ|-)\s*([0-9]{2,3})/i);
    if (bpMatch) {
      vitals.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
    } else {
      const bareBp = text.match(/\b([1-2][0-9]{2})\/([6-9][0-9]|1[0-2][0-9])\b/);
      if (bareBp) {
        vitals.bloodPressure = `${bareBp[1]}/${bareBp[2]}`;
      }
    }

    // Heart Rate / Pulse: "HR 78", "Pulse 82 bpm", "ជីពចរ 80"
    const hrMatch = text.match(/(?:\bhr\b|\bheart rate\b|\bpulse\b|\bpr\b|ជីពចរ)[:\s]*([0-9]{2,3})/i);
    if (hrMatch) {
      const val = parseInt(hrMatch[1], 10);
      if (val >= 40 && val <= 220) vitals.heartRate = val;
    }

    // Temperature: "Temp 38.5 C", "កម្ដៅ 39", "37.8 C", "កម្តៅ 38"
    const tempMatch = text.match(/(?:\btemp\b|\btemperature\b|កម្ដៅ|កម្តៅ)[:\s]*([0-9]{2}(?:\.[0-9])?)/i);
    if (tempMatch) {
      const val = parseFloat(tempMatch[1]);
      if (val >= 34 && val <= 43) vitals.temperature = val;
    }

    // Respiratory Rate: "RR 18", "ដង្ហើម 20"
    const rrMatch = text.match(/(?:\brr\b|\brespiratory rate\b|ដង្ហើម)[:\s]*([0-9]{1,2})/i);
    if (rrMatch) {
      const val = parseInt(rrMatch[1], 10);
      if (val >= 8 && val <= 60) vitals.respiratoryRate = val;
    }

    // SpO2: "SpO2 98%", "អុកស៊ីសែន 99"
    const spo2Match = text.match(/(?:\bspo2\b|\bo2 sat\b|\boximeter\b|អុកស៊ីសែន)[:\s]*([0-9]{2,3})\s*%?/i);
    if (spo2Match) {
      const val = parseInt(spo2Match[1], 10);
      if (val >= 50 && val <= 100) vitals.spO2 = val;
    }

    // Weight: "Weight 65 kg", "wt: 65", "ទម្ងន់ 58"
    const wtMatch = text.match(/(?:\bweight\b|\bwt\b|ទម្ងន់)[:\s]*([0-9]{2,3}(?:\.[0-9])?)\s*(?:kg|គីឡូ)?/i);
    if (wtMatch) {
      const val = parseFloat(wtMatch[1]);
      if (val >= 2 && val <= 300) vitals.weightKg = val;
    }

    // Height: "Height 168 cm", "ht: 170", "កម្ពស់ 170"
    const htMatch = text.match(/(?:\bheight\b|\bht\b|កម្ពស់)[:\s]*([0-9]{2,3}(?:\.[0-9])?)\s*(?:cm|សង់ទីម៉ែត្រ)?/i);
    if (htMatch) {
      const val = parseFloat(htMatch[1]);
      if (val >= 30 && val <= 250) vitals.heightCm = val;
    }

    return vitals;
  }

  /**
   * Extract subjective symptoms and complaints
   */
  private extractSubjective(text: string) {
    const lower = text.toLowerCase();
    const symptoms: string[] = [];

    const symptomDict: { pattern: RegExp; nameKh: string; nameEn: string }[] = [
      { pattern: /គ្រុនក្តៅ|ក្តៅខ្លួន|fever|chills|ញាក់/i, nameKh: 'គ្រុនក្តៅ (Fever)', nameEn: 'Fever' },
      { pattern: /ក្អក|cough/i, nameKh: 'ក្អក (Cough)', nameEn: 'Cough' },
      { pattern: /ឈឺក្បាល|headache/i, nameKh: 'ឈឺក្បាល (Headache)', nameEn: 'Headache' },
      { pattern: /ឈឺបំពង់ក|sore throat|pharynx/i, nameKh: 'ឈឺបំពង់ក (Sore throat)', nameEn: 'Sore throat' },
      { pattern: /ហៀរសំបោរ|runny nose|rhinorrhea/i, nameKh: 'ហៀរសំបោរ (Rhinorrhea)', nameEn: 'Runny nose' },
      { pattern: /ឈឺពោះ|abdominal pain|belly ache/i, nameKh: 'ឈឺពោះ (Abdominal pain)', nameEn: 'Abdominal pain' },
      { pattern: /ចង្អោរ|nausea/i, nameKh: 'ចង្អោរ (Nausea)', nameEn: 'Nausea' },
      { pattern: /ក្អួត|vomit/i, nameKh: 'ក្អួត (Vomiting)', nameEn: 'Vomiting' },
      { pattern: /រាក|diarrhea|loose stool/i, nameKh: 'រាក (Diarrhea)', nameEn: 'Diarrhea' },
      { pattern: /ហត់|ពិបាកដកដង្ហើម|dyspnea|shortness of breath/i, nameKh: 'ពិបាកដកដង្ហើម (Dyspnea)', nameEn: 'Dyspnea' },
      { pattern: /វិលមុខ|dizziness|vertigo/i, nameKh: 'វិលមុខ (Dizziness)', nameEn: 'Dizziness' },
      { pattern: /អស់កម្លាំង|fatigue|weakness/i, nameKh: 'អស់កម្លាំង (Fatigue)', nameEn: 'Fatigue' },
      { pattern: /កន្ទួល|រមាស់|rash|itchy/i, nameKh: 'កន្ទួលរមាស់ (Skin rash)', nameEn: 'Skin rash' },
    ];

    for (const item of symptomDict) {
      if (item.pattern.test(lower)) {
        symptoms.push(item.nameKh);
      }
    }

    // Extract duration: "3 ថ្ងៃ", "2 days", "ម្សិលមិញ", "yesterday", "1 week"
    let duration: string | undefined;
    const durMatch = text.match(/([0-9]+\s*(?:ថ្ងៃ|days?|សប្តាហ៍|weeks?|ខែ|months?)|ម្សិលមិញ|yesterday)/i);
    if (durMatch) {
      duration = durMatch[1].trim();
    }

    const chiefComplaint = symptoms.length > 0 ? symptoms.join(', ') : 'ការពិនិត្យសុខភាពទូទៅ (General Consultation)';

    return {
      chiefComplaint,
      symptoms,
      duration,
    };
  }

  /**
   * Extract physical examination findings
   */
  private extractObjectiveFindings(text: string): string[] {
    const findings: string[] = [];
    const lower = text.toLowerCase();

    if (/សួតឮធម្មតា|clear to auscultation|lungs clear|breath sounds normal/i.test(lower)) {
      findings.push('សួតឮសូរធម្មតាទាំងសងខាង (Lungs clear to auscultation bilaterally)');
    } else if (/wheezing|rhonchi|crackles|សួតឮសំឡេង/i.test(lower)) {
      findings.push('សួតឮសំឡេងខ្យល់ត្បៀត (Bilateral wheezing/adventitious sounds noted)');
    }

    if (/បំពង់កក្រហម|pharyngeal erythema|tonsillar|injected throat/i.test(lower)) {
      findings.push('បំពង់កឡើងក្រហម (Injected pharynx and mild tonsillar hypertrophy)');
    }

    if (/ពោះទន់|abdomen soft|non-tender/i.test(lower)) {
      findings.push('ពោះទន់ គ្មានការឈឺចុកចាប់ពេលចុច (Abdomen soft, non-tender)');
    } else if (/epigastric tender|ចុកចុងដង្ហើម|tender/i.test(lower)) {
      findings.push('ឈឺចុកចាប់តំបន់ចុងដង្ហើម (Epigastric tenderness noted upon palpation)');
    }

    if (/alert|cooperative|ស្មារតីល្អ/i.test(lower)) {
      findings.push('អ្នកជំងឺមានស្មារតីល្អ សហការបានល្អ (Patient alert, oriented, cooperative)');
    }

    return findings;
  }

  /**
   * Match diagnosis against Clinical Knowledge Base
   */
  private determineAssessment(text: string, symptoms: string[]) {
    const lower = text.toLowerCase();

    for (const entry of CLINICAL_DIAGNOSTIC_DB) {
      const match = entry.keywords.some((kw) => lower.includes(kw.toLowerCase()));
      if (match) {
        return {
          primaryDiagnosis: entry.primaryDiagnosisKhmer,
          icd11Code: entry.icd11Code,
          icd10Code: entry.icd10Code,
          differentialDiagnoses: CLINICAL_DIAGNOSTIC_DB.filter((d) => d.icd11Code !== entry.icd11Code)
            .slice(0, 2)
            .map((d) => d.primaryDiagnosisKhmer),
          severity: entry.defaultSeverity,
        };
      }
    }

    // Default assessment
    return {
      primaryDiagnosis: 'ការពិនិត្យសុខភាពបឋម (Observation / General Evaluation)',
      icd11Code: 'QA02',
      icd10Code: 'Z00.0',
      differentialDiagnoses: ['Acute Upper Respiratory Tract Infection (URTI)'],
      severity: 'MILD' as const,
    };
  }

  /**
   * Extract prescribed medications and treatment plan
   */
  private extractPlan(text: string, assessment: { icd11Code?: string }) {
    const prescriptions: PrescriptionItemDraft[] = [];
    const lower = text.toLowerCase();

    for (const med of COMMON_MEDICATIONS) {
      if (lower.includes(med.brandName.toLowerCase()) || lower.includes(med.genericName.toLowerCase())) {
        const qty = med.defaultDurationDays * (med.defaultFrequency.includes('TID') ? 3 : med.defaultFrequency.includes('BID') ? 2 : 1) * med.unitsPerDose;

        prescriptions.push({
          medicineName: `${med.brandName} ${med.defaultDosage}`,
          dosage: med.defaultDosage,
          quantity: qty,
          route: med.defaultRoute,
          frequency: med.defaultFrequency,
          timing: med.defaultTiming,
          durationDays: med.defaultDurationDays,
          instructions: `${med.brandName} ${med.defaultDosage} - ${med.defaultRoute}, ${med.defaultFrequency}, ${med.defaultTiming} រយៈពេល ${med.defaultDurationDays} ថ្ងៃ`,
        });
      }
    }

    // If no specific medications mentioned in dictation, auto-suggest based on primary diagnosis
    if (prescriptions.length === 0) {
      if (assessment.icd11Code === 'CA42' || assessment.icd11Code === 'CA45') {
        prescriptions.push({
          medicineName: 'Paracetamol 500mg',
          dosage: '500mg',
          quantity: 10,
          route: 'Oral (លេប)',
          frequency: 'Q6H PRN (រៀងរាល់ ៦ ម៉ោងពេលក្តៅខ្លួន/ឈឺ)',
          timing: 'After meals (ក្រោយបាយ)',
          durationDays: 3,
          instructions: 'Paracetamol 500mg 1 គ្រាប់ លេបរៀងរាល់ ៦ ម៉ោងពេលមានកម្ដៅ ឬឈឺក្បាល (ក្រោយបាយ)',
        });
        prescriptions.push({
          medicineName: 'Cetirizine 10mg',
          dosage: '10mg',
          quantity: 5,
          route: 'Oral (លេប)',
          frequency: 'OD (១ ដង/ថ្ងៃ)',
          timing: 'At bedtime (មុនចូលគេង)',
          durationDays: 5,
          instructions: 'Cetirizine 10mg 1 គ្រាប់ លេបពេលយប់មុនចូលគេង',
        });
      } else if (assessment.icd11Code === 'DA42') {
        prescriptions.push({
          medicineName: 'Omeprazole 20mg',
          dosage: '20mg',
          quantity: 14,
          route: 'Oral (លេប)',
          frequency: 'OD (១ ដង/ថ្ងៃ)',
          timing: 'Before breakfast (៣០ នាទីមុនអាហារពេលព្រឹក)',
          durationDays: 14,
          instructions: 'Omeprazole 20mg 1 គ្រាប់ លេប ៣០ នាទីមុនអាហារពេលព្រឹក រយៈពេល ១៤ ថ្ងៃ',
        });
      }
    }

    // Advice matching
    const matchingRef = CLINICAL_DIAGNOSTIC_DB.find((d) => d.icd11Code === assessment.icd11Code);
    const treatmentAdvice = matchingRef?.recommendedAdviceKhmer || [
      'សម្រាកឱ្យបានគ្រប់គ្រាន់ និងញ៉ាំទឹកស្អាតឱ្យបានច្រើន',
      'លេបថ្នាំទៀងទាត់តាមវេជ្ជបញ្ជា',
    ];

    return {
      prescriptions,
      treatmentAdvice,
      followUpDays: 3,
      labTestsOrdered: text.includes('cbc') || text.includes('ឈាម') ? ['Full Blood Count (CBC)'] : [],
    };
  }

  /**
   * Format Khmer medical summary for Telegram or clinical report
   */
  private formatSoapKhmer(
    doctor: string,
    s: any,
    vitals: ClinicalVitals,
    exam: string[],
    a: any,
    p: any
  ): string {
    const lines: string[] = [
      `[កំណត់ត្រាវេជ្ជសាស្ត្រ SOAP - Voice Transcription]`,
      `វេជ្ជបណ្ឌិតទទួលបន្ទុក៖ ${doctor}`,
      `កាលបរិច្ឆេទ៖ ${new Date().toLocaleDateString('km-KH')} ${new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}`,
      ``,
      `--- S (រោគសញ្ញា / Subjective) ---`,
      `• រោគសញ្ញាចម្បង៖ ${s.chiefComplaint}`,
      s.duration ? `• រយៈពេលកើតមាន៖ ${s.duration}` : '',
      ``,
      `--- O (ការពិនិត្យជាក់ស្ដែង / Objective) ---`,
      `• សម្ពាធឈាម (BP)៖ ${vitals.bloodPressure || 'មិនទាន់វាស់'}`,
      `• ចង្វាក់បេះដូង (HR)៖ ${vitals.heartRate ? `${vitals.heartRate} bpm` : 'ធម្មតា'}`,
      `• កម្ដៅ (Temp)៖ ${vitals.temperature ? `${vitals.temperature} °C` : 'ធម្មតា'}`,
      vitals.spO2 ? `• កម្រិតអុកស៊ីសែន (SpO2)៖ ${vitals.spO2}%` : '',
      vitals.weightKg ? `• ទម្ងន់ (Weight)៖ ${vitals.weightKg} kg` : '',
      exam.length > 0 ? `• លទ្ធផលពិនិត្យកាយសម្បទា៖ ${exam.join('; ')}` : '',
      ``,
      `--- A (រោគវិនិច្ឆ័យ / Assessment) ---`,
      `• រោគវិនិច្ឆ័យចម្បង៖ ${a.primaryDiagnosis}`,
      `• កូដរោគវិនិច្ឆ័យអន្តរជាតិ៖ ICD-11: ${a.icd11Code || 'N/A'} | ICD-10: ${a.icd10Code || 'N/A'}`,
      `• កម្រិតធ្ងន់ធ្ងរ៖ ${a.severity}`,
      ``,
      `--- P (ផែនការព្យាបាល & វេជ្ជបញ្ជា / Plan) ---`,
    ];

    if (p.prescriptions.length > 0) {
      lines.push(`• បញ្ជីឱសថដែលបានចេញវេជ្ជបញ្ជា៖`);
      p.prescriptions.forEach((rx: PrescriptionItemDraft, idx: number) => {
        lines.push(`  ${idx + 1}. ${rx.instructions} (ចំនួន៖ ${rx.quantity})`);
      });
    }

    if (p.treatmentAdvice.length > 0) {
      lines.push(`• ការណែនាំបន្ថែម៖ ${p.treatmentAdvice.join('; ')}`);
    }

    if (p.followUpDays) {
      lines.push(`• ណាត់ជួបពិនិត្យឡើងវិញ៖ ក្រោយ ${p.followUpDays} ថ្ងៃ`);
    }

    return lines.filter((l) => l !== '').join('\n');
  }

  /**
   * Format English medical summary
   */
  private formatSoapEnglish(
    doctor: string,
    s: any,
    vitals: ClinicalVitals,
    exam: string[],
    a: any,
    p: any
  ): string {
    const lines: string[] = [
      `[CLINICAL SOAP NOTE - Medical Transcription]`,
      `Attending Physician: ${doctor}`,
      `Timestamp: ${new Date().toISOString()}`,
      ``,
      `[S] SUBJECTIVE:`,
      `- Chief Complaint: ${s.chiefComplaint}`,
      s.duration ? `- Duration: ${s.duration}` : '',
      ``,
      `[O] OBJECTIVE:`,
      `- Vitals: BP ${vitals.bloodPressure || 'N/A'}, HR ${vitals.heartRate ? `${vitals.heartRate} bpm` : 'N/A'}, Temp ${vitals.temperature ? `${vitals.temperature} C` : 'N/A'}, SpO2 ${vitals.spO2 ? `${vitals.spO2}%` : 'N/A'}`,
      exam.length > 0 ? `- Physical Exam: ${exam.join('; ')}` : '',
      ``,
      `[A] ASSESSMENT:`,
      `- Primary Diagnosis: ${a.primaryDiagnosis}`,
      `- Codes: ICD-11: ${a.icd11Code || 'N/A'} | ICD-10: ${a.icd10Code || 'N/A'}`,
      `- Severity: ${a.severity}`,
      ``,
      `[P] PLAN:`,
    ];

    if (p.prescriptions.length > 0) {
      lines.push(`- Medications:`);
      p.prescriptions.forEach((rx: PrescriptionItemDraft, idx: number) => {
        lines.push(`  ${idx + 1}. ${rx.medicineName} - ${rx.route}, ${rx.frequency}, ${rx.timing} x ${rx.durationDays} days (Qty: ${rx.quantity})`);
      });
    }

    if (p.treatmentAdvice.length > 0) {
      lines.push(`- Patient Advice: ${p.treatmentAdvice.join('; ')}`);
    }

    return lines.filter((l) => l !== '').join('\n');
  }
}

Injectable()(VoiceMedicalNlpService);
