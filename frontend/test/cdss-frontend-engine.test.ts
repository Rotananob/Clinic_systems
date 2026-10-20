import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import {
  checkClientDrugInteractions,
  checkClientAllergyConflicts,
  calculateClientNews2,
  searchClientIcd11,
} from '../src/lib/cdssEngine.ts';

describe('Phase 4: Clinical Decision Support (CDSS) Frontend Test Suite', () => {
  it('should verify 100% dictionary key parity for cdss localization', () => {
    const enCdss = (en as any).cdss;
    const kmCdss = (km as any).cdss;

    assert.notEqual(enCdss, undefined, 'en.cdss must exist');
    assert.notEqual(kmCdss, undefined, 'km.cdss must exist');

    const enKeys = Object.keys(enCdss).sort();
    const kmKeys = Object.keys(kmCdss).sort();

    assert.equal(enKeys.length > 0, true, 'en.cdss must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km cdss must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire cdss localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enCdss = (en as any).cdss;
    const kmCdss = (km as any).cdss;

    for (const [key, value] of Object.entries(enCdss)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.cdss.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmCdss)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.cdss.${key}: "${value}"`
      );
    }
  });

  it('should detect critical drug-drug interactions (DDI) and trigger BLOCK actions', () => {
    // Warfarin + Ibuprofen (anticoagulant + NSAID)
    const warfarinNsaid = checkClientDrugInteractions(['Warfarin 5mg', 'Ibuprofen 400mg']);
    assert.equal(warfarinNsaid.length, 1);
    assert.equal(warfarinNsaid[0].severity, 'SEVERE');
    assert.equal(warfarinNsaid[0].action, 'BLOCK');
    assert.equal(warfarinNsaid[0].ruleId, 'DDI-001');

    // Sildenafil + Nitroglycerin (fatal hypotension)
    const sildenafilNitro = checkClientDrugInteractions(['Sildenafil 50mg', 'Nitroglycerin sublingual']);
    assert.equal(sildenafilNitro.length, 1);
    assert.equal(sildenafilNitro[0].severity, 'SEVERE');
    assert.equal(sildenafilNitro[0].action, 'BLOCK');

    // Simvastatin + Clarithromycin (severe CYP3A4 inhibition -> rhabdomyolysis)
    const statinMacrolide = checkClientDrugInteractions(['Simvastatin 20mg', 'Clarithromycin 500mg']);
    assert.equal(statinMacrolide.length, 1);
    assert.equal(statinMacrolide[0].severity, 'SEVERE');
    assert.equal(statinMacrolide[0].action, 'BLOCK');

    // Ciprofloxacin + Antacid (moderate cation chelation)
    const quinoloneAntacid = checkClientDrugInteractions(['Ciprofloxacin 500mg', 'Antacid liquid']);
    assert.equal(quinoloneAntacid.length, 1);
    assert.equal(quinoloneAntacid[0].severity, 'MODERATE');
    assert.equal(quinoloneAntacid[0].action, 'WARNING_REQUIRES_OVERRIDE');

    // Safe combination
    const safeCombo = checkClientDrugInteractions(['Paracetamol 500mg', 'Amoxicillin 500mg', 'Omeprazole 20mg']);
    assert.equal(safeCombo.length, 0);
  });

  it('should detect patient allergy conflicts including direct and cephalosporin cross-reactivity', () => {
    // Direct Penicillin allergy with Amoxicillin
    const directPenicillin = checkClientAllergyConflicts(
      ['Amoxicillin 500mg', 'Paracetamol 500mg'],
      'Penicillin allergy noted in 2024'
    );
    assert.equal(directPenicillin.length, 1);
    assert.equal(directPenicillin[0].severity, 'SEVERE');
    assert.equal(directPenicillin[0].isCrossReactivity, false);

    // Cross-reactivity: Penicillin allergy with Cephalexin
    const crossPenicillin = checkClientAllergyConflicts(
      ['Cephalexin 500mg'],
      'Severe rash with penicillin'
    );
    assert.equal(crossPenicillin.length, 1);
    assert.equal(crossPenicillin[0].severity, 'MODERATE');
    assert.equal(crossPenicillin[0].isCrossReactivity, true);

    // Sulfa allergy with Cotrimoxazole
    const sulfaAlert = checkClientAllergyConflicts(
      ['Cotrimoxazole 480mg'],
      'Sulfa drugs'
    );
    assert.equal(sulfaAlert.length, 1);
    assert.equal(sulfaAlert[0].severity, 'SEVERE');

    // Patient with no documented allergies
    const noAllergy = checkClientAllergyConflicts(['Amoxicillin 500mg'], null);
    assert.equal(noAllergy.length, 0);
  });

  it('should accurately compute NEWS2 triage scores and risk categorizations', () => {
    // Completely normal vitals
    const normal = calculateClientNews2({
      respiratoryRate: 16,
      spO2: 98,
      onSupplementalOxygen: false,
      systolicBp: 120,
      heartRate: 72,
      temperature: 36.8,
      consciousness: 'ALERT',
    });
    assert.equal(normal.totalScore, 0);
    assert.equal(normal.riskLevel, 'LOW');
    assert.equal(normal.colorCode, 'GREEN');
    assert.equal(normal.hasSevereSingleParameter, false);

    // High risk / Emergency vitals
    const emergency = calculateClientNews2({
      respiratoryRate: 28, // 3
      spO2: 89, // 3
      onSupplementalOxygen: true, // 2
      systolicBp: 85, // 3
      heartRate: 135, // 3
      temperature: 39.5, // 2
      consciousness: 'CONFUSED', // 3
    });
    assert.equal(emergency.totalScore >= 7, true);
    assert.equal(emergency.riskLevel, 'HIGH');
    assert.equal(emergency.colorCode, 'RED');

    // Single extreme parameter triggers medium alert
    const singleExtreme = calculateClientNews2({
      respiratoryRate: 7, // 3
      spO2: 98, // 0
      systolicBp: 120, // 0
      heartRate: 75, // 0
      temperature: 36.7, // 0
      consciousness: 'ALERT', // 0
    });
    assert.equal(singleExtreme.totalScore, 3);
    assert.equal(singleExtreme.hasSevereSingleParameter, true);
    assert.equal(singleExtreme.riskLevel, 'MEDIUM');
    assert.equal(singleExtreme.colorCode, 'YELLOW');
  });

  it('should search ICD-11 entities in English and Khmer with dual ICD-10 cross-references', () => {
    const resEn = searchClientIcd11('hypertension');
    assert.equal(resEn.length > 0, true);
    assert.equal(resEn.some((i) => i.icd11Code === 'BA00' && i.icd10Code === 'I10'), true);

    const resKh = searchClientIcd11('ជំងឺទឹកនោមផ្អែម');
    assert.equal(resKh.length > 0, true);
    assert.equal(resKh.some((i) => i.icd11Code === '5A11' && i.icd10Code === 'E11'), true);

    const defaultList = searchClientIcd11('');
    assert.equal(defaultList.length > 0, true);
  });
});
