import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DentalService } from '../src/dental/dental.service.ts';

describe('Dental Periodontal 6-Point Scoring, Mobility, Furcation & Deciduous FDI Suite', () => {
  let dentalService: DentalService;

  beforeEach(() => {
    dentalService = new DentalService();
  });

  it('should verify all 20 FDI deciduous primary teeth across quadrants 5, 6, 7, and 8', () => {
    const deciduousTeeth = DentalService.DECIDUOUS_TEETH_NUMBERS;
    assert.equal(deciduousTeeth.length, 20);

    // Verify 4 deciduous quadrants: 5 (Upper Right), 6 (Upper Left), 7 (Lower Left), 8 (Lower Right)
    const q5 = deciduousTeeth.filter(n => n >= 51 && n <= 55);
    const q6 = deciduousTeeth.filter(n => n >= 61 && n <= 65);
    const q7 = deciduousTeeth.filter(n => n >= 71 && n <= 75);
    const q8 = deciduousTeeth.filter(n => n >= 81 && n <= 85);

    assert.equal(q5.length, 5, 'Quadrant 5 must contain 5 deciduous teeth');
    assert.equal(q6.length, 5, 'Quadrant 6 must contain 5 deciduous teeth');
    assert.equal(q7.length, 5, 'Quadrant 7 must contain 5 deciduous teeth');
    assert.equal(q8.length, 5, 'Quadrant 8 must contain 5 deciduous teeth');

    // Total dentition including adult 32 and deciduous 20
    assert.equal(DentalService.ALL_FDI_TEETH_NUMBERS.length, 52);
    assert.equal(DentalService.isDeciduousTooth(55), true);
    assert.equal(DentalService.isDeciduousTooth(16), false);
    assert.equal(DentalService.isValidFdiTooth(85), true);
    assert.equal(DentalService.isValidFdiTooth(99), false);
  });

  it('should record conditions on pediatric deciduous teeth without throwing invalid tooth errors', () => {
    const patientId = 'PT-PED-001';

    // Tooth 55: Upper right second deciduous molar with occlusal caries
    const updatedChart = dentalService.updateToothCondition(patientId, 55, {
      status: 'CARIES',
      surfaces: { mesial: false, distal: false, occlusal: true, buccal: false, lingual: false },
      notes: 'Early childhood caries on primary molar',
    });

    assert.ok(updatedChart.teeth[55], 'Tooth 55 must be recorded in chart');
    assert.equal(updatedChart.teeth[55].status, 'CARIES');
    assert.equal(updatedChart.teeth[55].surfaces.occlusal, true);

    // Tooth 71: Lower left central deciduous incisor healthy
    const step2 = dentalService.updateToothCondition(patientId, 71, {
      status: 'HEALTHY',
      notes: 'Normal physiological primary central incisor',
    });

    assert.ok(step2.teeth[71]);
    assert.equal(step2.teeth[71].status, 'HEALTHY');
  });

  it('should accurately capture 6-point periodontal pocket depths: DB, B, MB, DL, L, and ML', () => {
    const patientId = 'PT-PERIO-101';

    // Record 6-point probing depths on Tooth 16 (Maxillary Right First Molar)
    const updated = dentalService.updateToothCondition(patientId, 16, {
      sixPointDepth: {
        distobuccal: 5,  // DB
        buccal: 3,        // B
        mesiobuccal: 6,   // MB - Deep pocket
        distolingual: 4, // DL
        lingual: 3,       // L
        mesiolingual: 7,  // ML - Severe pocket
      },
      notes: 'Generalized moderate to severe chronic periodontitis at mesial and distal aspects',
    });

    const tooth16 = updated.teeth[16];
    assert.ok(tooth16.sixPointDepth);
    assert.equal(tooth16.sixPointDepth.distobuccal, 5);
    assert.equal(tooth16.sixPointDepth.buccal, 3);
    assert.equal(tooth16.sixPointDepth.mesiobuccal, 6);
    assert.equal(tooth16.sixPointDepth.distolingual, 4);
    assert.equal(tooth16.sixPointDepth.lingual, 3);
    assert.equal(tooth16.sixPointDepth.mesiolingual, 7);

    // Verify pocketDepthsMm array synchronization
    assert.deepEqual(tooth16.pocketDepthsMm, [6, 3, 5, 7, 3, 4]);
  });

  it('should evaluate Bleeding on Probing (BOP) across 6 probing sites and compute BOP percentage', () => {
    const patientId = 'PT-PERIO-102';

    // Set 6-point BOP on Tooth 16: Bleeding at DB, MB, and ML
    dentalService.updateToothCondition(patientId, 16, {
      sixPointBop: {
        distobuccal: true,  // DB
        buccal: false,       // B
        mesiobuccal: true,   // MB
        distolingual: false,// DL
        lingual: false,      // L
        mesiolingual: true,  // ML
      },
    });

    // Set 6-point BOP on Tooth 26: Bleeding at B and L
    dentalService.updateToothCondition(patientId, 26, {
      sixPointBop: {
        distobuccal: false,
        buccal: true,
        mesiobuccal: false,
        distolingual: false,
        lingual: true,
        mesiolingual: false,
      },
    });

    const bopStats = dentalService.calculateBopPercentage(patientId);

    // 32 adult teeth * 6 sites = 192 sites probed
    assert.equal(bopStats.totalSites, 192);
    // 3 bleeding sites on Tooth 16 + 2 on Tooth 26 = 5 bleeding sites
    assert.equal(bopStats.bleedingSites, 5);
    // BOP% = (5 / 192) * 100 = 2.6%
    assert.equal(bopStats.bopPercentage, 2.6);
    assert.equal(bopStats.inflammationLevel, 'HEALTHY_OR_STABLE');
  });

  it('should categorize active localized gingivitis and generalized periodontitis by BOP threshold', () => {
    const patientId = 'PT-PERIO-103';

    // Simulate severe generalized inflammation: 10 teeth with 4 bleeding sites each = 40 sites
    const teethToBleed = [11, 12, 13, 14, 21, 22, 23, 24, 31, 32];
    for (const tn of teethToBleed) {
      dentalService.updateToothCondition(patientId, tn, {
        sixPointBop: {
          distobuccal: true,
          buccal: true,
          mesiobuccal: true,
          distolingual: true,
          lingual: false,
          mesiolingual: false,
        },
      });
    }

    const bopStats = dentalService.calculateBopPercentage(patientId);
    // 40 bleeding sites / 192 total = 20.8% (Localized / moderate gingival inflammation)
    assert.equal(bopStats.bleedingSites, 40);
    assert.equal(bopStats.bopPercentage, 20.8);
    assert.equal(bopStats.inflammationLevel, 'LOCALIZED_GINGIVITIS');

    // Bleed 5 additional teeth (6 sites each = 30 more sites, total 70 sites / 192 = 36.5% > 30%)
    const moreTeeth = [41, 42, 43, 44, 45];
    for (const tn of moreTeeth) {
      dentalService.updateToothCondition(patientId, tn, {
        sixPointBop: {
          distobuccal: true,
          buccal: true,
          mesiobuccal: true,
          distolingual: true,
          lingual: true,
          mesiolingual: true,
        },
      });
    }

    const severeBopStats = dentalService.calculateBopPercentage(patientId);
    assert.ok(severeBopStats.bopPercentage > 30.0);
    assert.equal(severeBopStats.inflammationLevel, 'GENERALIZED_PERIODONTITIS');
  });

  it('should validate tooth mobility scoring from Grade 0 to Grade 3', () => {
    const patientId = 'PT-MOBILITY-01';

    // Grade 0: Normal physiological mobility
    const t0 = dentalService.updateToothCondition(patientId, 11, {
      mobilityGrade: 0,
      notes: 'Normal physiological mobility less than 0.2 mm',
    });
    assert.equal(t0.teeth[11].mobilityScore, 0);
    assert.equal(t0.teeth[11].mobilityGrade, 0);

    // Grade 1: Slightly increased mobility <= 1 mm horizontally
    const t1 = dentalService.updateToothCondition(patientId, 21, {
      mobilityGrade: 1,
      notes: 'Noticeable horizontal mobility up to 1 mm',
    });
    assert.equal(t1.teeth[21].mobilityScore, 1);
    assert.equal(t1.teeth[21].mobilityGrade, 1);

    // Grade 2: Moderate mobility > 1 mm horizontally
    const t2 = dentalService.updateToothCondition(patientId, 31, {
      mobilityGrade: 2,
      notes: 'Moderate horizontal mobility exceeding 1 mm without vertical depression',
    });
    assert.equal(t2.teeth[31].mobilityScore, 2);
    assert.equal(t2.teeth[31].mobilityGrade, 2);

    // Grade 3: Severe mobility > 2 mm horizontally and vertical intrusion into socket
    const t3 = dentalService.updateToothCondition(patientId, 41, {
      mobilityGrade: 3,
      notes: 'Severe horizontal mobility with axial vertical intrusion into socket',
    });
    assert.equal(t3.teeth[41].mobilityScore, 3);
    assert.equal(t3.teeth[41].mobilityGrade, 3);
  });

  it('should record Hamp and Glickman furcation involvement Class I through Class IV on molars', () => {
    const patientId = 'PT-FURCATION-01';

    // Class I: Incipient horizontal probe penetration <= 3 mm
    const f1 = dentalService.updateToothCondition(patientId, 46, {
      furcationClass: 'CLASS_I',
      notes: 'Buccal furcation entrance palpable up to 2 mm',
    });
    assert.equal(f1.teeth[46].furcationClass, 'CLASS_I');

    // Class II: Cul-de-sac penetration > 3 mm but not communicating to lingual
    const f2 = dentalService.updateToothCondition(patientId, 36, {
      furcationClass: 'CLASS_II',
      notes: 'Probe enters furcation 4 mm with definite roof resistance',
    });
    assert.equal(f2.teeth[36].furcationClass, 'CLASS_II');

    // Class III: Through-and-through furcation tunnel covered by marginal gingiva
    const f3 = dentalService.updateToothCondition(patientId, 16, {
      furcationClass: 'CLASS_III',
      notes: 'Through-and-through furcation defect covered by soft tissue',
    });
    assert.equal(f3.teeth[16].furcationClass, 'CLASS_III');

    // Class IV: Through-and-through tunnel clinically visible with gingival recession
    const f4 = dentalService.updateToothCondition(patientId, 26, {
      furcationClass: 'CLASS_IV',
      notes: 'Open tunnel furcation defect clearly visible on clinical inspection',
    });
    assert.equal(f4.teeth[26].furcationClass, 'CLASS_IV');
  });

  it('should guarantee zero emojis and zero parentheses in Khmer text throughout periodontal records', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    const khmerWithParensRegex = /[\u1780-\u17FF]+[()（）]+|[()（）]+[\u1780-\u17FF]+/;

    const chart = dentalService.getDentalChart('PT-PERIO-101');
    const jsonStr = JSON.stringify(chart);

    assert.equal(emojiRegex.test(jsonStr), false, 'No emojis allowed in periodontal chart JSON');
    assert.equal(khmerWithParensRegex.test(jsonStr), false, 'No parentheses allowed in Khmer strings');

    const procs = dentalService.getProceduresList();
    for (const proc of procs) {
      assert.equal(emojiRegex.test(proc.name), false);
      assert.equal(khmerWithParensRegex.test(proc.name), false);
    }
  });
});
