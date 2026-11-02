import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { IpdService } from '../src/ipd/ipd.service.ts';

describe('IPD Bed Occupancy Tracking, Daily Ward Rates & Multi-Tenant Isolation Suite', () => {
  let ipdService: IpdService;

  beforeEach(() => {
    ipdService = new IpdService();
  });

  it('should track clinic-wide bed occupancy and compute accurate percentage', () => {
    const metrics = ipdService.getBedMetrics();

    assert.ok(metrics.totalBeds >= 7, 'Total clinic beds must be at least 7');
    assert.equal(typeof metrics.occupiedBeds, 'number');
    assert.equal(typeof metrics.availableBeds, 'number');
    assert.equal(typeof metrics.cleaningRequired, 'number');
    assert.equal(typeof metrics.occupancyRatePercent, 'number');

    // Expected mathematical relationship: Occupancy Rate = (Occupied / Total) * 100
    const expectedRate = Math.round((metrics.occupiedBeds / metrics.totalBeds) * 100);
    assert.equal(metrics.occupancyRatePercent, expectedRate);
  });

  it('should generate ward-by-ward bed occupancy breakdown across all four clinical wards', () => {
    const breakdown = ipdService.getWardOccupancyBreakdown();

    // Verify all four designated wards
    assert.ok(breakdown.WARD_GENERAL_MED, 'General Medical Ward must be present');
    assert.ok(breakdown.WARD_SURGICAL, 'Surgical Ward must be present');
    assert.ok(breakdown.WARD_MATERNITY, 'Maternity Ward must be present');
    assert.ok(breakdown.WARD_OBSERVATION, 'Observation Ward must be present');

    assert.equal(breakdown.WARD_GENERAL_MED.wardNameEn, 'General Medical Ward');
    assert.equal(breakdown.WARD_GENERAL_MED.wardNameKh, 'អគារជំងឺទូទៅ - General Ward');
    assert.ok(breakdown.WARD_GENERAL_MED.totalBeds >= 3);

    // Sum of ward beds should match total beds
    const totalWardsBeds =
      breakdown.WARD_GENERAL_MED.totalBeds +
      breakdown.WARD_SURGICAL.totalBeds +
      breakdown.WARD_MATERNITY.totalBeds +
      breakdown.WARD_OBSERVATION.totalBeds;

    const overallMetrics = ipdService.getBedMetrics();
    assert.equal(totalWardsBeds, overallMetrics.totalBeds);
  });

  it('should calculate daily stay room charges with minimum 1-day rule for same-day stays', () => {
    // Admit patient on General Medical Ward ($25.00/day) with $50 deposit
    const admission = ipdService.admitPatient({
      patientId: 'PT-CALC-001',
      patientName: 'VONG Sovan',
      bedId: 'bed-102',
      attendingDoctor: 'Dr. CHAN Vanna',
      admittingDiagnosis: 'Acute Bronchitis for Observation',
      depositAmountUsd: 50.0,
      emergencyContact: {
        name: 'VONG Pich',
        phone: '012999888',
        relation: 'Brother',
      },
      tenantId: 'tenant-rotana-01',
    });

    // Same day calculation (less than 24 hours): minimum 1 day rule applied
    const sameDayStay = ipdService.calculateStayCharges(admission.id, admission.admissionDate);

    assert.equal(sameDayStay.daysStayed, 1);
    assert.equal(sameDayStay.dailyRateUsd, 25.0);
    assert.equal(sameDayStay.dailyRateKhr, 25.0 * 4100);
    assert.equal(sameDayStay.totalRoomChargesUsd, 25.0);
    assert.equal(sameDayStay.totalRoomChargesKhr, 25.0 * 4100);
    assert.equal(sameDayStay.depositAmountUsd, 50.0);
    // Net balance due is 0 because deposit ($50) covers 1 day ($25)
    assert.equal(sameDayStay.netBalanceDueUsd, 0.0);
  });

  it('should calculate multi-day stay room charges and apply initial deposit deduction', () => {
    // Admit on Surgical Post-Op Ward ($45.00/day) with $100 deposit
    const admission = ipdService.admitPatient({
      patientId: 'PT-CALC-002',
      patientName: 'KEM Channa',
      bedId: 'bed-201',
      attendingDoctor: 'Dr. RITH Sreynoch',
      admittingDiagnosis: 'Post-Cholecystectomy Inpatient Recovery',
      depositAmountUsd: 100.0,
      emergencyContact: {
        name: 'KEM Vibol',
        phone: '012555666',
        relation: 'Spouse',
      },
      tenantId: 'tenant-rotana-01',
    });

    // Simulate 4 days stay (e.g. 4 days later)
    const fourDaysLater = new Date(new Date(admission.admissionDate).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
    const fourDayStay = ipdService.calculateStayCharges(admission.id, fourDaysLater);

    assert.equal(fourDayStay.daysStayed, 4);
    assert.equal(fourDayStay.dailyRateUsd, 45.0);
    // Total charges = 4 * 45 = $180.00 USD
    assert.equal(fourDayStay.totalRoomChargesUsd, 180.0);
    assert.equal(fourDayStay.totalRoomChargesKhr, 180.0 * 4100);
    assert.equal(fourDayStay.depositAmountUsd, 100.0);
    // Net balance due = 180 - 100 = $80.00 USD
    assert.equal(fourDayStay.netBalanceDueUsd, 80.0);
    assert.equal(fourDayStay.netBalanceDueKhr, 80.0 * 4100);
  });

  it('should enforce multi-tenant isolation when admitting patients to ward beds', () => {
    const tenantAlpha = 'tenant-alpha-uuid';
    const tenantBeta = 'tenant-beta-uuid';

    // Tenant Alpha admits patient into bed-102
    const alphaAdmission = ipdService.admitPatient({
      patientId: 'PT-ALPHA-01',
      patientName: 'Alpha Patient',
      bedId: 'bed-102',
      attendingDoctor: 'Dr. Alpha',
      admittingDiagnosis: 'Observation Alpha',
      emergencyContact: { name: 'Alpha Contact', phone: '012111111', relation: 'Family' },
      tenantId: tenantAlpha,
    });

    assert.equal(alphaAdmission.tenantId, tenantAlpha);
    const bed = ipdService.getBeds(undefined, undefined, tenantAlpha).find(b => b.id === 'bed-102');
    assert.ok(bed);
    assert.equal(bed.tenantId, tenantAlpha);
    assert.equal(bed.status, 'OCCUPIED');

    // Tenant Beta attempts to admit into bed-102 (which belongs to Tenant Alpha)
    assert.throws(
      () => {
        ipdService.admitPatient({
          patientId: 'PT-BETA-01',
          patientName: 'Beta Patient',
          bedId: 'bed-102',
          attendingDoctor: 'Dr. Beta',
          admittingDiagnosis: 'Observation Beta',
          emergencyContact: { name: 'Beta Contact', phone: '012222222', relation: 'Family' },
          tenantId: tenantBeta,
        });
      },
      /Cross-tenant bed admission violation/
    );
  });

  it('should prevent cross-tenant bed transfer attempts', () => {
    const tenantAlpha = 'tenant-alpha-uuid';
    const tenantBeta = 'tenant-beta-uuid';

    // Tenant Alpha has admission on bed-102
    const alphaAdm = ipdService.admitPatient({
      patientId: 'PT-ALPHA-02',
      patientName: 'Alpha Patient Two',
      bedId: 'bed-102',
      attendingDoctor: 'Dr. Alpha',
      admittingDiagnosis: 'Alpha Case',
      emergencyContact: { name: 'Contact', phone: '012333444', relation: 'Spouse' },
      tenantId: tenantAlpha,
    });

    // Assign bed-201 to Tenant Beta
    const betaAdm = ipdService.admitPatient({
      patientId: 'PT-BETA-02',
      patientName: 'Beta Patient Two',
      bedId: 'bed-201',
      attendingDoctor: 'Dr. Beta',
      admittingDiagnosis: 'Beta Case',
      emergencyContact: { name: 'Contact', phone: '012555666', relation: 'Spouse' },
      tenantId: tenantBeta,
    });

    // Free bed-201 and set to AVAILABLE for Tenant Beta
    ipdService.dischargePatient(betaAdm.id);
    ipdService.markBedCleaned('bed-201');
    const bed201 = ipdService.getBeds().find(b => b.id === 'bed-201');
    assert.ok(bed201);
    assert.equal(bed201.tenantId, tenantBeta);
    assert.equal(bed201.status, 'AVAILABLE');

    // Tenant Alpha attempts to transfer their patient into Tenant Beta's bed-201
    assert.throws(
      () => {
        ipdService.transferBed(alphaAdm.id, 'bed-201', 'Illegal cross-tenant transfer attempt');
      },
      /Cross-tenant bed transfer violation/
    );
  });

  it('should filter beds by tenantId when retrieving clinic bed inventory', () => {
    const tenantAlpha = 'tenant-alpha-filter';
    const tenantBeta = 'tenant-beta-filter';

    // Admit bed for Alpha
    ipdService.admitPatient({
      patientId: 'PT-A1',
      patientName: 'Alpha One',
      bedId: 'bed-102',
      attendingDoctor: 'Dr. Alpha',
      admittingDiagnosis: 'Care',
      emergencyContact: { name: 'Contact', phone: '012000000', relation: 'Family' },
      tenantId: tenantAlpha,
    });

    // Admit bed for Beta
    ipdService.admitPatient({
      patientId: 'PT-B1',
      patientName: 'Beta One',
      bedId: 'bed-201',
      attendingDoctor: 'Dr. Beta',
      admittingDiagnosis: 'Care',
      emergencyContact: { name: 'Contact', phone: '012000000', relation: 'Family' },
      tenantId: tenantBeta,
    });

    // Tenant Alpha listing should NOT see Tenant Beta bed
    const alphaBeds = ipdService.getBeds(undefined, undefined, tenantAlpha);
    const betaBedInAlpha = alphaBeds.find(b => b.id === 'bed-201');
    assert.equal(betaBedInAlpha, undefined, 'Tenant Alpha must not view Tenant Beta allocated bed');

    // Tenant Beta listing should NOT see Tenant Alpha bed
    const betaBeds = ipdService.getBeds(undefined, undefined, tenantBeta);
    const alphaBedInBeta = betaBeds.find(b => b.id === 'bed-102');
    assert.equal(alphaBedInBeta, undefined, 'Tenant Beta must not view Tenant Alpha allocated bed');
  });

  it('should guarantee zero emojis and zero parentheses in Khmer strings across IPD records', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    const khmerWithParensRegex = /[\u1780-\u17FF]+[()（）]+|[()（）]+[\u1780-\u17FF]+/;

    const beds = ipdService.getBeds();
    for (const bed of beds) {
      assert.equal(emojiRegex.test(bed.bedNumber), false, `Emoji found in bed ${bed.id}`);
      assert.equal(emojiRegex.test(bed.wardNameEn), false);
      assert.equal(emojiRegex.test(bed.wardNameKh), false);

      assert.equal(
        khmerWithParensRegex.test(bed.wardNameKh),
        false,
        `Parenthesis found in Khmer ward name: ${bed.wardNameKh}`
      );
    }

    const breakdown = ipdService.getWardOccupancyBreakdown();
    for (const wardData of Object.values(breakdown)) {
      assert.equal(emojiRegex.test(wardData.wardNameKh), false);
      assert.equal(khmerWithParensRegex.test(wardData.wardNameKh), false);
    }
  });
});
