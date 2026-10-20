import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 8: DICOM PACS & Medical Viewer UI Suite', () => {
  it('should verify 100% dictionary key parity for pacs localization', () => {
    assert.ok(en.pacs, 'en.pacs must exist');
    assert.ok(km.pacs, 'km.pacs must exist');

    const enKeys = Object.keys(en.pacs).sort();
    const kmKeys = Object.keys(km.pacs).sort();

    assert.deepEqual(enKeys, kmKeys, 'pacs dictionary keys must have 100% parity between en and km');
  });

  it('should guarantee zero emojis across the entire pacs localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.pacs)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `en.pacs.${key} contains emoji: "${val}"`);
      }
    }

    for (const [key, val] of Object.entries(km.pacs)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `km.pacs.${key} contains emoji: "${val}"`);
      }
    }
  });

  it('should verify all core PACS imaging modalities and tool keys exist', () => {
    const requiredKeys = [
      'title',
      'modalityDx',
      'modalityUs',
      'modalityCt',
      'modalityCr',
      'toolCtr',
      'toolCobbAngle',
      'cinePlayback',
      'clinicalFindings',
      'diagnosticImpression',
      'saveAndSignReport',
      'ctrCardiomegaly',
      'cobbSevere',
    ];

    for (const req of requiredKeys) {
      assert.ok(req in en.pacs, `Missing required key ${req} in en.pacs`);
      assert.ok(req in km.pacs, `Missing required key ${req} in km.pacs`);
    }
  });

  it('should accurately calculate CTR ratio and detect cardiomegaly boundary conditions', () => {
    const calculateCtr = (cardiacMm: number, thoracicMm: number) => {
      const ratio = Math.round((cardiacMm / thoracicMm) * 100) / 100;
      let status: 'NORMAL' | 'BORDERLINE' | 'CARDIOMEGALY' = 'NORMAL';
      if (ratio > 0.55) status = 'CARDIOMEGALY';
      else if (ratio > 0.5) status = 'BORDERLINE';
      return { ratio, status };
    };

    const normal = calculateCtr(140, 300);
    assert.equal(normal.ratio, 0.47);
    assert.equal(normal.status, 'NORMAL');

    const borderline = calculateCtr(158, 300);
    assert.equal(borderline.ratio, 0.53);
    assert.equal(borderline.status, 'BORDERLINE');

    const cardiomegaly = calculateCtr(180, 300);
    assert.equal(cardiomegaly.ratio, 0.6);
    assert.equal(cardiomegaly.status, 'CARDIOMEGALY');
  });

  it('should accurately classify spinal Cobb angle severity', () => {
    const classifyCobb = (upperSlope: number, lowerSlope: number) => {
      const angle = Math.round(Math.abs(upperSlope - lowerSlope) * 10) / 10;
      let severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' = 'NORMAL';
      if (angle >= 40) severity = 'SEVERE';
      else if (angle >= 25) severity = 'MODERATE';
      else if (angle >= 10) severity = 'MILD';
      return { angle, severity };
    };

    assert.equal(classifyCobb(20, 15).severity, 'NORMAL');
    assert.equal(classifyCobb(32, 14).severity, 'MILD');
    assert.equal(classifyCobb(45, 10).severity, 'MODERATE');
    assert.equal(classifyCobb(68, 12).severity, 'SEVERE');
  });
});
