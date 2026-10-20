import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DentalService } from '../src/dental/dental.service.ts';

describe('Phase 15: Dental Odontogram Interactive Charting & Tooth Treatment Planner', () => {
  let dentalService: DentalService;

  beforeEach(() => {
    dentalService = new DentalService();
  });

  it('should verify standard FDI two-digit numbering scheme for all 32 adult teeth', () => {
    const teethNumbers = DentalService.ADULT_TEETH_NUMBERS;
    assert.equal(teethNumbers.length, 32);

    // Verify all 4 quadrants
    const q1 = teethNumbers.filter(n => n >= 11 && n <= 18);
    const q2 = teethNumbers.filter(n => n >= 21 && n <= 28);
    const q3 = teethNumbers.filter(n => n >= 31 && n <= 38);
    const q4 = teethNumbers.filter(n => n >= 41 && n <= 48);

    assert.equal(q1.length, 8);
    assert.equal(q2.length, 8);
    assert.equal(q3.length, 8);
    assert.equal(q4.length, 8);
  });

  it('should load initial clinical dental chart for patient PT-1001 with correct tooth states', () => {
    const chart = dentalService.getDentalChart('PT-1001');

    assert.equal(chart.patientId, 'PT-1001');
    assert.equal(chart.patientName, 'Keo Samnang');
    assert.equal(chart.numberingSystem, 'FDI_TWO_DIGIT');

    // Specific tooth state checks
    assert.equal(chart.teeth[16].status, 'CARIES');
    assert.equal(chart.teeth[16].surfaces.occlusal, true);

    assert.equal(chart.teeth[26].status, 'FILLED');
    assert.equal(chart.teeth[26].surfaces.mesial, true);
    assert.equal(chart.teeth[26].surfaces.occlusal, true);
    assert.equal(chart.teeth[26].surfaces.distal, true);

    assert.equal(chart.teeth[36].status, 'MISSING');
    assert.equal(chart.teeth[11].status, 'CROWN');
    assert.equal(chart.teeth[47].status, 'CARIES');
  });

  it('should accurately calculate WHO DMFT (Decayed, Missing, Filled Teeth) Index', () => {
    const chart = dentalService.getDentalChart('PT-1001');
    const dmft = chart.dmftIndex;

    // Decayed: Tooth 16, Tooth 47 = 2
    assert.equal(dmft.decayed, 2);
    // Missing: Tooth 36 = 1
    assert.equal(dmft.missing, 1);
    // Filled: Tooth 26 (Filled), Tooth 11 (Crown) = 2
    assert.equal(dmft.filled, 2);
    // Total DMFT = 2 + 1 + 2 = 5
    assert.equal(dmft.totalDmft, 5);
    // Risk category: 5 falls into HIGH risk (5 to 8)
    assert.equal(dmft.riskCategory, 'HIGH');
  });

  it('should update tooth condition and automatically recalculate DMFT Index', () => {
    // Treat caries on Tooth 16 by placing composite restoration
    const updatedChart = dentalService.updateToothCondition('PT-1001', 16, {
      status: 'FILLED',
      notes: 'Composite resin filling placed, caries eradicated'
    });

    assert.equal(updatedChart.teeth[16].status, 'FILLED');
    // Now Decayed = 1 (Tooth 47), Missing = 1 (Tooth 36), Filled = 3 (Tooth 26, 11, 16)
    assert.equal(updatedChart.dmftIndex.decayed, 1);
    assert.equal(updatedChart.dmftIndex.missing, 1);
    assert.equal(updatedChart.dmftIndex.filled, 3);
    assert.equal(updatedChart.dmftIndex.totalDmft, 5);
  });

  it('should reject invalid tooth numbers outside standard dental anatomy', () => {
    assert.throws(
      () => dentalService.updateToothCondition('PT-1001', 99, { status: 'CARIES' }),
      /Invalid tooth number 99/
    );
  });

  it('should manage periodontal pocket depths and bleeding on probing (BOP)', () => {
    const updated = dentalService.updateToothCondition('PT-1001', 16, {
      mobilityScore: 1,
      pocketDepthsMm: [4, 3, 5, 3, 2, 4],
      bleedingOnProbing: [true, false, true, false, false, true]
    });

    assert.equal(updated.teeth[16].mobilityScore, 1);
    assert.deepEqual(updated.teeth[16].pocketDepthsMm, [4, 3, 5, 3, 2, 4]);
    assert.deepEqual(updated.teeth[16].bleedingOnProbing, [true, false, true, false, false, true]);
  });

  it('should retrieve standard dental procedure catalog with USD and KHR conversion at 4100 rate', () => {
    const procs = dentalService.getProceduresList();
    assert.equal(procs.length >= 10, true);

    const implant = procs.find(p => p.code === 'D-IMPL-01');
    assert.notEqual(implant, undefined);
    assert.equal(implant?.defaultFeeUsd, 650.0);
    assert.equal(implant?.defaultFeeKhr, 650.0 * 4100);
    assert.equal(implant?.requiresToothNumber, true);
  });

  it('should create dental treatment plan and transition item statuses to COMPLETED', () => {
    const newPlan = dentalService.createTreatmentPlan('PT-1002', {
      dentistId: 'DOC-101',
      dentistName: 'Dr. Seng Chanthou',
      title: 'Pediatric Dental Restoration',
      items: [
        {
          toothNumber: 55,
          procedureCode: 'D-REST-01',
          surface: 'Occlusal',
          notes: 'Primary molar restorative filling'
        },
        {
          procedureCode: 'D-PREV-01',
          notes: 'Full mouth cleaning'
        }
      ]
    });

    assert.equal(newPlan.patientId, 'PT-1002');
    assert.equal(newPlan.items.length, 2);
    assert.equal(newPlan.status, 'PROPOSED');
    assert.equal(newPlan.totalFeeUsd, 45.0); // 20 + 25
    assert.equal(newPlan.totalFeeKhr, 45.0 * 4100);

    // Complete first item
    const step1 = dentalService.updateTreatmentItemStatus(newPlan.planId, newPlan.items[0].itemId, 'DONE');
    assert.equal(step1.status, 'IN_PROGRESS');
    assert.equal(step1.items[0].status, 'DONE');
    assert.notEqual(step1.items[0].completedAt, undefined);

    // Complete second item
    const step2 = dentalService.updateTreatmentItemStatus(newPlan.planId, newPlan.items[1].itemId, 'DONE');
    assert.equal(step2.status, 'COMPLETED');
    assert.equal(step2.items[1].status, 'DONE');
  });

  it('should guarantee zero emojis across dental charts, procedures, and treatment plans', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const procs = dentalService.getProceduresList();
    for (const p of procs) {
      assert.equal(emojiRegex.test(p.name), false, `Emoji found in procedure name: ${p.name}`);
    }

    const chart = dentalService.getDentalChart('PT-1001');
    const chartJson = JSON.stringify(chart);
    assert.equal(emojiRegex.test(chartJson), false, 'Emoji found in dental chart data');

    const plans = dentalService.getTreatmentPlans('PT-1001');
    const plansJson = JSON.stringify(plans);
    assert.equal(emojiRegex.test(plansJson), false, 'Emoji found in treatment plans data');
  });
});
