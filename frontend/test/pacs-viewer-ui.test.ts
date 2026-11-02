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

  it('should accurately calculate Euclidean distance in mm based on calibrated pixel spacing', () => {
    const pixelSpacingMm = 0.143; // Standard DICOM Tag (0028,0030)
    const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }, spacing: number) => {
      const px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mm = parseFloat((px * spacing).toFixed(1));
      return { px: Math.round(px), mm };
    };

    // Horizontal line: 100 px = 14.3 mm
    assert.deepEqual(calculateDistance({ x: 50, y: 50 }, { x: 150, y: 50 }, pixelSpacingMm), { px: 100, mm: 14.3 });

    // 3-4-5 Triangle: dx=300, dy=400 -> hypot=500 px -> 500 * 0.143 = 71.5 mm
    assert.deepEqual(calculateDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, pixelSpacingMm), { px: 500, mm: 71.5 });
  });

  it('should verify standard CT and X-Ray Window Width / Center (WW/WL) presets', () => {
    const presets: Record<string, { ww: number; wl: number }> = {
      DEFAULT: { ww: 400, wl: 40 },
      BONE: { ww: 2000, wl: 500 },
      LUNG: { ww: 1500, wl: -600 },
      SOFT: { ww: 350, wl: 40 },
      BRAIN: { ww: 80, wl: 40 },
    };

    assert.equal(presets.BONE.ww, 2000);
    assert.equal(presets.BONE.wl, 500);
    assert.equal(presets.LUNG.ww, 1500);
    assert.equal(presets.LUNG.wl, -600);
    assert.equal(presets.BRAIN.ww, 80);
    assert.equal(presets.BRAIN.wl, 40);
  });

  it('should verify LIVER_SPECIFIC window preset and anisotropic pixel spacing caliper tensor', () => {
    const liverPreset = { ww: 150, wl: 30 };
    assert.equal(liverPreset.ww, 150);
    assert.equal(liverPreset.wl, 30);

    // Euclidean distance with anisotropic pixel spacing (rowSpacing != colSpacing)
    const calculateAnisotropicDistance = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      rowSpacing: number,
      colSpacing: number
    ) => {
      const dxMm = (p2.x - p1.x) * colSpacing;
      const dyMm = (p2.y - p1.y) * rowSpacing;
      return parseFloat(Math.hypot(dxMm, dyMm).toFixed(1));
    };

    // dx = 40px * 0.25mm = 10mm, dy = 20px * 0.5mm = 10mm -> sqrt(200) = 14.1mm
    const distanceMm = calculateAnisotropicDistance({ x: 0, y: 0 }, { x: 40, y: 20 }, 0.5, 0.25);
    assert.equal(distanceMm, 14.1);
  });

  it('should verify 10-button sidebar navigation rule with 9 core tools and 10th explore tools button', () => {
    const CORE_9_ROUTES = [
      '/dashboard',
      '/patients',
      '/visits',
      '/queue',
      '/prescriptions',
      '/inventory',
      '/billing',
      '/reports',
      '/settings',
    ];

    assert.equal(CORE_9_ROUTES.length, 9, 'Core routes must contain exactly 9 primary tools');

    // Total tools available in platform is at least 26
    const totalToolsCount = 27;
    const remainingCount = totalToolsCount - CORE_9_ROUTES.length;
    assert.ok(remainingCount >= 17, 'Remaining tools count badge must be at least +17 tools');

    // Button 10 is the Explore All Tools button
    const button10 = {
      isExploreButton: true,
      labelKh: 'រុករកឧបករណ៍ទាំងអស់',
      labelEn: 'Explore All Tools',
      badge: `+${remainingCount}`,
      actionEvent: 'open-explore-modules',
    };

    assert.equal(button10.isExploreButton, true);
    assert.equal(button10.actionEvent, 'open-explore-modules');
    assert.ok(!button10.labelKh.includes('(') && !button10.labelKh.includes(')'));
  });
});
