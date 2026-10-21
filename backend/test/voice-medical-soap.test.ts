import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VoiceMedicalNlpService,
  CLINICAL_DIAGNOSTIC_DB,
  COMMON_MEDICATIONS,
} from '../src/visits/voice-medical-nlp.service.ts';

describe('Phase 3: Telegram Voice Medical Notes & SOAP Structuring Engine', () => {
  const nlpService = new VoiceMedicalNlpService();

  it('should accurately extract vital signs from Khmer and English clinical text', () => {
    const rawEnglish = 'Patient arrived in clinic. BP 125/82, HR 76, Temp 38.6 C, RR 18, SpO2 99%, Weight 68.5 kg, Height 172 cm.';
    const vitalsEn = nlpService.extractVitals(rawEnglish);

    assert.equal(vitalsEn.bloodPressure, '125/82');
    assert.equal(vitalsEn.heartRate, 76);
    assert.equal(vitalsEn.temperature, 38.6);
    assert.equal(vitalsEn.respiratoryRate, 18);
    assert.equal(vitalsEn.spO2, 99);
    assert.equal(vitalsEn.weightKg, 68.5);
    assert.equal(vitalsEn.heightCm, 172);

    const rawKhmer = 'អ្នកជំងឺមានសម្ពាធឈាម 130 លើ 85, ជីពចរ 84, កម្ដៅ 39, អុកស៊ីសែន 98%, ទម្ងន់ 60 គីឡូ, កម្ពស់ 165';
    const vitalsKh = nlpService.extractVitals(rawKhmer);

    assert.equal(vitalsKh.bloodPressure, '130/85');
    assert.equal(vitalsKh.heartRate, 84);
    assert.equal(vitalsKh.temperature, 39);
    assert.equal(vitalsKh.spO2, 98);
    assert.equal(vitalsKh.weightKg, 60);
    assert.equal(vitalsKh.heightCm, 165);
  });

  it('should detect chief symptoms and symptom duration in Khmer dictation', () => {
    const dictation = 'អ្នកជំងឺ Chan Veasna មានអាការៈ គ្រុនក្តៅ ក្អក និងឈឺបំពង់ក រយៈពេល 3 ថ្ងៃ។';
    const soap = nlpService.parseClinicalDictation(dictation, 'Dr. Vannak');

    assert.equal(soap.subjective.symptoms.length >= 3, true);
    assert.equal(soap.subjective.symptoms.some((s) => s.includes('Fever')), true);
    assert.equal(soap.subjective.symptoms.some((s) => s.includes('Cough')), true);
    assert.equal(soap.subjective.symptoms.some((s) => s.includes('Sore throat')), true);
    assert.equal(soap.subjective.duration?.includes('3 ថ្ងៃ') || soap.subjective.duration?.includes('3'), true);
  });

  it('should accurately categorize physical examination findings', () => {
    const dictation = 'ការពិនិត្យឃើញថា បំពង់កក្រហមខ្លាំង, សួតឮធម្មតាទាំងសងខាង, ពោះទន់ គ្មានការឈឺចុកចាប់។ ស្មារតីល្អ។';
    const soap = nlpService.parseClinicalDictation(dictation);

    assert.equal(soap.objective.physicalExamFindings.length >= 3, true);
    assert.equal(soap.objective.physicalExamFindings.some((f) => f.includes('Injected pharynx')), true);
    assert.equal(soap.objective.physicalExamFindings.some((f) => f.includes('Lungs clear')), true);
    assert.equal(soap.objective.physicalExamFindings.some((f) => f.includes('Abdomen soft')), true);
  });

  it('should suggest correct ICD-11 and ICD-10 diagnostic codes based on clinical keywords', () => {
    const pharyngitisCase = nlpService.parseClinicalDictation('អ្នកជំងឺឈឺបំពង់ក tonsil pharyngitis ក្តៅខ្លួន');
    assert.equal(pharyngitisCase.assessment.icd11Code, 'CA42');
    assert.equal(pharyngitisCase.assessment.icd10Code, 'J02.9');

    const gastritisCase = nlpService.parseClinicalDictation('Patient complains of epigastric pain, heartburn, and severe gastritis symptoms');
    assert.equal(gastritisCase.assessment.icd11Code, 'DA42');
    assert.equal(gastritisCase.assessment.icd10Code, 'K29.7');

    const dengueCase = nlpService.parseClinicalDictation('អ្នកជំងឺសង្ស័យ គ្រុនឈាម dengue fever petechiae high fever');
    assert.equal(dengueCase.assessment.icd11Code, '1D20');
    assert.equal(dengueCase.assessment.icd10Code, 'A90');
    assert.equal(dengueCase.assessment.severity, 'SEVERE');
  });

  it('should extract structured medications from dictation or provide clinical standard suggestions', () => {
    const rxDictation = 'ចេញថ្នាំ Amoxicillin 500mg និង Paracetamol 500mg ក្រោយបាយ ៣ ថ្ងៃ។';
    const soap = nlpService.parseClinicalDictation(rxDictation);

    assert.equal(soap.plan.prescriptions.length >= 2, true);
    const amox = soap.plan.prescriptions.find((p) => p.medicineName.includes('Amoxicillin'));
    assert.notEqual(amox, undefined);
    assert.equal(amox?.dosage, '500mg');
    assert.equal(amox?.durationDays, 5);
    assert.equal(amox?.quantity, 15);

    const para = soap.plan.prescriptions.find((p) => p.medicineName.includes('Paracetamol'));
    assert.notEqual(para, undefined);
    assert.equal(para?.dosage, '500mg');
  });

  it('should structure complete bilingual SOAP note correctly', () => {
    const fullDictation = 'អ្នកជំងឺ Chan Veasna, គ្រុនក្តៅ ៣ ថ្ងៃ, ក្អក, ឈឺបំពង់ក, BP 120/80, Temp 38.5, Amoxicillin 500mg, Paracetamol 500mg';
    const soap = nlpService.parseClinicalDictation(fullDictation, 'Dr. Houn Vannak');

    assert.equal(soap.rawTranscription, fullDictation);
    assert.equal(typeof soap.formattedSoapKhmer, 'string');
    assert.equal(typeof soap.formattedSoapEnglish, 'string');
    assert.equal(soap.formattedSoapKhmer.includes('--- S (រោគសញ្ញា / Subjective) ---'), true);
    assert.equal(soap.formattedSoapKhmer.includes('--- O (ការពិនិត្យជាក់ស្ដែង / Objective) ---'), true);
    assert.equal(soap.formattedSoapKhmer.includes('--- A (រោគវិនិច្ឆ័យ / Assessment) ---'), true);
    assert.equal(soap.formattedSoapKhmer.includes('--- P (ផែនការព្យាបាល & វេជ្ជបញ្ជា / Plan) ---'), true);
    assert.equal(soap.confidenceScore >= 70, true);
  });

  it('should guarantee zero emojis across diagnostic database and standard medications', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    for (const entry of CLINICAL_DIAGNOSTIC_DB) {
      assert.equal(emojiRegex.test(entry.primaryDiagnosisKhmer), false, `Emoji found in diagnostic entry: ${entry.primaryDiagnosisKhmer}`);
      assert.equal(emojiRegex.test(entry.primaryDiagnosisEnglish), false, `Emoji found in diagnostic entry: ${entry.primaryDiagnosisEnglish}`);
      entry.recommendedAdviceKhmer.forEach((adv) => {
        assert.equal(emojiRegex.test(adv), false, `Emoji found in advice: ${adv}`);
      });
    }

    for (const med of COMMON_MEDICATIONS) {
      assert.equal(emojiRegex.test(med.brandName), false, `Emoji found in medication: ${med.brandName}`);
      assert.equal(emojiRegex.test(med.genericName), false, `Emoji found in generic: ${med.genericName}`);
      assert.equal(emojiRegex.test(med.defaultFrequency), false, `Emoji found in frequency: ${med.defaultFrequency}`);
    }
  });

  it('should guarantee zero emojis in generated SOAP output text', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const testDictations = [
      'BP 120/80 Temp 38.5 គ្រុនក្តៅ ឈឺបំពង់ក Amoxicillin 500mg',
      'Hypertension checkup BP 160/100 Amlodipine 5mg Metformin 500mg',
      'Diarrhea vomiting 2 days ORS ORAL salts dehydration',
    ];

    for (const dictation of testDictations) {
      const soap = nlpService.parseClinicalDictation(dictation, 'Dr. Vannak');
      assert.equal(emojiRegex.test(soap.formattedSoapKhmer), false, `Emoji found in generated Khmer SOAP: ${soap.formattedSoapKhmer}`);
      assert.equal(emojiRegex.test(soap.formattedSoapEnglish), false, `Emoji found in generated English SOAP: ${soap.formattedSoapEnglish}`);
    }
  });
  it('should enforce strict 2-request per minute rate limiting and block spam with 429', () => {
    const rateService = new VoiceMedicalNlpService();
    const testKey = 'doctor_quota_test_' + Date.now();

    // Call 1: Allowed
    assert.doesNotThrow(() => {
      rateService.enforceRateLimit(testKey, 2, 60000);
    });

    // Call 2: Allowed
    assert.doesNotThrow(() => {
      rateService.enforceRateLimit(testKey, 2, 60000);
    });

    // Call 3: Throws 429 Too Many Requests
    assert.throws(
      () => {
        rateService.enforceRateLimit(testKey, 2, 60000);
      },
      (err: any) => {
        assert.equal(err.status, 429);
        assert.equal(typeof err.response?.message, 'string');
        assert.equal(err.response?.message.includes('Spam'), true);
        assert.equal(err.response?.retryAfterSeconds > 0, true);
        return true;
      }
    );
  });

  it('should guarantee zero emojis in rate limit error responses', () => {
    const rateService = new VoiceMedicalNlpService();
    const testKey = 'emoji_rate_test_' + Date.now();
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    rateService.enforceRateLimit(testKey, 1, 60000);
    try {
      rateService.enforceRateLimit(testKey, 1, 60000);
      assert.fail('Should have thrown 429');
    } catch (err: any) {
      assert.equal(emojiRegex.test(err.response?.message), false, 'Found emoji in rate limit error message');
    }
  });
});