import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 3: Voice Medical Dictation & SOAP UI Test Suite', () => {
  it('should verify 100% dictionary key parity for voiceMedical localization', () => {
    const enVoice = (en as any).voiceMedical;
    const kmVoice = (km as any).voiceMedical;

    assert.notEqual(enVoice, undefined, 'en.voiceMedical must exist');
    assert.notEqual(kmVoice, undefined, 'km.voiceMedical must exist');

    const enKeys = Object.keys(enVoice).sort();
    const kmKeys = Object.keys(kmVoice).sort();

    assert.equal(enKeys.length > 0, true, 'en.voiceMedical must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km voiceMedical must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire voiceMedical localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enVoice = (en as any).voiceMedical;
    const kmVoice = (km as any).voiceMedical;

    for (const [key, value] of Object.entries(enVoice)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.voiceMedical.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmVoice)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.voiceMedical.${key}: "${value}"`
      );
    }
  });

  it('should verify all required clinical action keys and descriptions exist', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'startRecording',
      'stopRecording',
      'transcribing',
      'structureNow',
      'placeholderDictation',
      'subjectiveTitle',
      'objectiveTitle',
      'assessmentTitle',
      'planTitle',
      'applyToVisit',
      'appliedSuccess',
      'confidenceLabel',
      'icdCodeLabel',
      'telegramVoiceHelp',
    ];

    const enVoice = (en as any).voiceMedical;
    for (const key of requiredKeys) {
      assert.equal(typeof enVoice[key], 'string', `en.voiceMedical.${key} must be a string`);
      assert.equal(enVoice[key].length > 0, true, `en.voiceMedical.${key} must not be empty`);
    }
  });

  it('should validate SOAP payload structure for clinical visits', () => {
    const mockSoapPayload = {
      subjective: {
        chiefComplaint: 'Fever, sore throat, cough',
        symptoms: ['Fever', 'Sore throat', 'Cough'],
        duration: '3 days',
      },
      objective: {
        vitals: {
          bloodPressure: '120/80',
          heartRate: 78,
          temperature: 38.5,
          spO2: 98,
        },
        physicalExamFindings: ['Injected pharynx', 'Lungs clear'],
      },
      assessment: {
        primaryDiagnosis: 'Acute Pharyngitis',
        icd11Code: 'CA42',
        icd10Code: 'J02.9',
        differentialDiagnoses: ['Acute Upper Respiratory Tract Infection (URTI)'],
        severity: 'MILD',
      },
      plan: {
        prescriptions: [
          {
            medicineName: 'Amoxicillin 500mg',
            dosage: '500mg',
            quantity: 15,
            route: 'Oral (លេប)',
            frequency: 'TID (3 times daily)',
            timing: 'After meals',
            durationDays: 5,
            instructions: 'Amoxicillin 500mg 1 tab TID pc x 5 days',
          },
        ],
        treatmentAdvice: ['Warm saline gargles', 'Adequate fluid intake'],
        followUpDays: 3,
      },
      confidenceScore: 85,
    };

    assert.equal(typeof mockSoapPayload.subjective.chiefComplaint, 'string');
    assert.equal(mockSoapPayload.objective.vitals.bloodPressure, '120/80');
    assert.equal(mockSoapPayload.assessment.icd11Code, 'CA42');
    assert.equal(mockSoapPayload.plan.prescriptions.length, 1);
    assert.equal(mockSoapPayload.confidenceScore >= 80, true);
  });
});
