import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PacsService, PACS_WINDOW_PRESETS } from '../src/pacs/pacs.service.ts';

describe('Phase 8: DICOM PACS Medical Imaging & Measurement Engine', () => {
  const pacsService = new PacsService();
  const tenantId = 'test-clinic-tenant';

  it('should initialize with pre-seeded clinical DICOM studies across key modalities', () => {
    const studies = pacsService.getAllStudies(tenantId);
    assert.ok(studies.length >= 5, 'Should have at least 5 default studies');

    const modalities = new Set(studies.map((s) => s.modality));
    assert.ok(modalities.has('DX'), 'Should support Digital X-Ray (DX)');
    assert.ok(modalities.has('US'), 'Should support Ultrasound (US)');
    assert.ok(modalities.has('CT'), 'Should support Computed Tomography (CT)');
    assert.ok(modalities.has('CR'), 'Should support Computed Radiography (CR)');
  });

  it('should filter studies by modality and clinical review status accurately', () => {
    const usStudies = pacsService.getAllStudies(tenantId, { modality: 'US' });
    assert.ok(usStudies.length >= 2, 'Should have ultrasound studies');
    assert.ok(usStudies.every((s) => s.modality === 'US'));

    const unreadStudies = pacsService.getAllStudies(tenantId, { status: 'UNREAD' });
    assert.ok(unreadStudies.length >= 1, 'Should have at least 1 unread stat study');
    assert.ok(unreadStudies.every((s) => s.status === 'UNREAD'));
  });

  it('should search studies by patient name, ID, and anatomical body part', () => {
    const nameResults = pacsService.getAllStudies(tenantId, { search: 'sokha' });
    assert.equal(nameResults.length, 1);
    assert.equal(nameResults[0].patientName, 'KEO Sokha');

    const bodyResults = pacsService.getAllStudies(tenantId, { search: 'knee' });
    assert.equal(bodyResults.length, 1);
    assert.equal(bodyResults[0].bodyPart, 'KNEE');
  });

  it('should accurately calculate Cardiothoracic Ratio (CTR) and categorize clinical risks', () => {
    // Normal: cardiac 135mm / thoracic 300mm = 0.45
    const normalResult = pacsService.calculateCardiothoracicRatio(135, 300);
    assert.equal(normalResult.ratio, 0.45);
    assert.equal(normalResult.interpretation, 'NORMAL');

    // Borderline: cardiac 156mm / thoracic 300mm = 0.52
    const borderlineResult = pacsService.calculateCardiothoracicRatio(156, 300);
    assert.equal(borderlineResult.ratio, 0.52);
    assert.equal(borderlineResult.interpretation, 'BORDERLINE');

    // Cardiomegaly: cardiac 174mm / thoracic 300mm = 0.58
    const cardiomegalyResult = pacsService.calculateCardiothoracicRatio(174, 300);
    assert.equal(cardiomegalyResult.ratio, 0.58);
    assert.equal(cardiomegalyResult.interpretation, 'CARDIOMEGALY');
    assert.ok(cardiomegalyResult.clinicalNote.includes('Definite cardiomegaly'));
  });

  it('should reject invalid or reversed dimensions in CTR calculation', () => {
    assert.throws(
      () => pacsService.calculateCardiothoracicRatio(0, 300),
      /greater than zero/,
    );
    assert.throws(
      () => pacsService.calculateCardiothoracicRatio(320, 300),
      /cannot exceed or equal/,
    );
  });

  it('should calculate Cobb angle for spinal scoliosis assessment', () => {
    const normalSpine = pacsService.calculateCobbAngle(15, 20);
    assert.equal(normalSpine.cobbAngleDeg, 5);
    assert.equal(normalSpine.severity, 'NORMAL');

    const mildScoliosis = pacsService.calculateCobbAngle(32, 16);
    assert.equal(mildScoliosis.cobbAngleDeg, 16);
    assert.equal(mildScoliosis.severity, 'MILD_SCOLIOSIS');

    const severeScoliosis = pacsService.calculateCobbAngle(65, 20);
    assert.equal(severeScoliosis.cobbAngleDeg, 45);
    assert.equal(severeScoliosis.severity, 'SEVERE_SCOLIOSIS');
  });

  it('should save formal radiologist findings and update study state to REPORTED', () => {
    const targetUid = '1.2.840.10008.5.1.4.1.1.2.20261021.003';
    const updated = pacsService.saveRadiologistReport(targetUid, tenantId, {
      findings: 'Volumetric brain CT shows no evidence of acute territorial infarction or intracranial hemorrhage. Ventricular size is symmetric and proportional to age.',
      impression: 'Normal non-contrast head CT examination. Major vascular insult ruled out.',
      status: 'REPORTED',
      radiologist: 'Dr. TEP Somally',
      measurements: [],
    });

    assert.equal(updated.status, 'REPORTED');
    assert.equal(updated.radiologist, 'Dr. TEP Somally');
    assert.ok(updated.findings.includes('intracranial hemorrhage'));

    const reFetched = pacsService.getStudyByUid(targetUid, tenantId);
    assert.equal(reFetched.status, 'REPORTED');
  });

  it('should register a new DICOM study with compliant UIDs and default presets', () => {
    const newStudy = pacsService.uploadDicomStudy(tenantId, {
      patientId: 'PT-9999',
      patientName: 'VON Samnang',
      patientGender: 'M',
      patientAge: 49,
      modality: 'DX',
      bodyPart: 'CHEST',
      studyDescription: 'Post-treatment follow-up chest radiograph',
    });

    assert.ok(newStudy.studyInstanceUid.startsWith('1.2.840.10008.5.1.4.1.1.2.'));
    assert.equal(newStudy.windowWidth, 4096);
    assert.equal(newStudy.windowCenter, 2048);
    assert.equal(newStudy.status, 'UNREAD');
  });

  it('should retrieve radiological window/level presets aligned with imaging physics', () => {
    const lungPreset = PACS_WINDOW_PRESETS.LUNG_PARENCHYMA;
    assert.equal(lungPreset.windowWidth, 1500);
    assert.equal(lungPreset.windowCenter, -600);

    const brainPreset = PACS_WINDOW_PRESETS.BRAIN_PARENCHYMA;
    assert.equal(brainPreset.windowWidth, 80);
    assert.equal(brainPreset.windowCenter, 40);

    const ctPresets = pacsService.getWindowPresets('CT');
    assert.ok(ctPresets.length >= 4, 'CT should have multiple anatomical presets');
  });

  it('should guarantee zero emojis across the entire PACS service and study repository', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    const allStudies = pacsService.getAllStudies(tenantId);

    for (const study of allStudies) {
      assert.ok(!emojiRegex.test(study.patientName), `Patient name has emoji: ${study.patientName}`);
      assert.ok(!emojiRegex.test(study.findings), `Findings have emoji: ${study.findings}`);
      assert.ok(!emojiRegex.test(study.impression), `Impression has emoji: ${study.impression}`);
      assert.ok(!emojiRegex.test(study.studyDescription), `Description has emoji: ${study.studyDescription}`);
    }

    const presets = Object.values(PACS_WINDOW_PRESETS);
    for (const p of presets) {
      assert.ok(!emojiRegex.test(p.name), `Preset name has emoji: ${p.name}`);
      assert.ok(!emojiRegex.test(p.description), `Preset description has emoji: ${p.description}`);
    }
  });
});
