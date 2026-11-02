import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DERS_DRUG_LIBRARY,
  DersDrugProfile,
} from '../src/infusion/ders-guardrails.library.ts';
import {
  InfusionPumpEngine,
} from '../src/infusion/infusion-pump.engine.ts';
import {
  BedsideInfusionService,
} from '../src/infusion/infusion.service.ts';

describe('Phase 8: Smart Infusion Pump DERS & Bedside IoT Telemetry Engine Suite', () => {
  let infusionService: BedsideInfusionService;

  beforeEach(() => {
    infusionService = new BedsideInfusionService();
  });

  describe('1. DERS Custom Care Area (CCA) Guardrails & Hard/Soft Limits', () => {
    it('should accept dose within standard therapeutic limits without alerts', () => {
      // Norepinephrine at standard 0.15 mcg/kg/min (Soft range: 0.01 - 0.5 mcg/kg/min)
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-NOREP-01',
        prescribedDose: 0.15,
        patientWeightKg: 70,
      });

      assert.equal(res.guardrailStatus, 'SAFE');
      assert.equal(res.requiresPhysicianOverride, false);
      assert.equal(res.isFatalRejection, false);
      assert.ok(res.calculatedRateMlPerHour > 0);
    });

    it('should trigger soft limit alert and require documented justification when soft limit breached', () => {
      // Norepinephrine at 0.8 mcg/kg/min (above softMax 0.5, but below hardMax 2.0)
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-NOREP-01',
        prescribedDose: 0.8,
        patientWeightKg: 70,
      });

      assert.equal(res.guardrailStatus, 'SOFT_LIMIT_BREACH');
      assert.equal(res.requiresPhysicianOverride, true);
      assert.equal(res.isFatalRejection, false);
    });

    it('should strictly reject dose exceeding hard maximum limit with fatal exception', () => {
      // Norepinephrine at 2.5 mcg/kg/min (exceeds lethal hardMax 2.0 mcg/kg/min)
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-NOREP-01',
        prescribedDose: 2.5,
        patientWeightKg: 70,
      });

      assert.equal(res.guardrailStatus, 'HARD_LIMIT_BREACH');
      assert.equal(res.requiresPhysicianOverride, false);
      assert.equal(res.isFatalRejection, true);
    });

    it('should strictly reject dose below hard minimum limit with fatal exception', () => {
      // Regular insulin at 0.05 units/hr (below hardMin 0.1 units/hr)
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-INSUL-04',
        prescribedDose: 0.05,
      });

      assert.equal(res.guardrailStatus, 'HARD_LIMIT_BREACH');
      assert.equal(res.isFatalRejection, true);
    });
  });

  describe('2. High-Alert IV Titration Math & Dynamic Body-Weight Scaling', () => {
    it('should accurately calculate Norepinephrine titration rates across 50kg, 70kg, and 100kg patient weights', () => {
      // Formula: (Dose_mcg_kg_min * Weight_kg * 60) / Conc_mcg_ml
      // Norepinephrine standard concentration: 4mg in 250ml = 16 mcg/ml
      // Dose = 0.1 mcg/kg/min:
      // 50kg: (0.1 * 50 * 60) / 16 = 300 / 16 = 18.75 mL/hr
      // 70kg: (0.1 * 70 * 60) / 16 = 420 / 16 = 26.25 mL/hr
      // 100kg: (0.1 * 100 * 60) / 16 = 600 / 16 = 37.50 mL/hr

      const res50 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-NOREP-01',
        prescribedDose: 0.1,
        patientWeightKg: 50,
      });
      assert.equal(res50.calculatedRateMlPerHour, 18.75);

      const res70 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-NOREP-01',
        prescribedDose: 0.1,
        patientWeightKg: 70,
      });
      assert.equal(res70.calculatedRateMlPerHour, 26.25);

      const res100 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-NOREP-01',
        prescribedDose: 0.1,
        patientWeightKg: 100,
      });
      assert.equal(res100.calculatedRateMlPerHour, 37.5);
    });

    it('should accurately calculate Dopamine renal/inotropic infusion rates', () => {
      // Dopamine std conc: 400mg in 250ml = 1600 mcg/ml
      // Dose = 5.0 mcg/kg/min:
      // 50kg: (5 * 50 * 60) / 1600 = 15000 / 1600 = 9.38 mL/hr
      // 70kg: (5 * 70 * 60) / 1600 = 21000 / 1600 = 13.13 mL/hr
      // 100kg: (5 * 100 * 60) / 1600 = 30000 / 1600 = 18.75 mL/hr

      const res50 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-DOPAM-02',
        prescribedDose: 5.0,
        patientWeightKg: 50,
      });
      assert.equal(res50.calculatedRateMlPerHour, 9.38);

      const res70 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-DOPAM-02',
        prescribedDose: 5.0,
        patientWeightKg: 70,
      });
      assert.equal(res70.calculatedRateMlPerHour, 13.13);

      const res100 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-DOPAM-02',
        prescribedDose: 5.0,
        patientWeightKg: 100,
      });
      assert.equal(res100.calculatedRateMlPerHour, 18.75);
    });

    it('should accurately calculate Propofol procedural sedation rates from 1% neat emulsion', () => {
      // Propofol 1% emulsion = 10 mg/ml = 10,000 mcg/ml
      // Dose = 30 mcg/kg/min:
      // 50kg: (30 * 50 * 60) / 10000 = 90000 / 10000 = 9.0 mL/hr
      // 70kg: (30 * 70 * 60) / 10000 = 126000 / 10000 = 12.6 mL/hr
      // 100kg: (30 * 100 * 60) / 10000 = 180000 / 10000 = 18.0 mL/hr

      const res50 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-PROP-05',
        prescribedDose: 30.0,
        patientWeightKg: 50,
      });
      assert.equal(res50.calculatedRateMlPerHour, 9.0);

      const res70 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-PROP-05',
        prescribedDose: 30.0,
        patientWeightKg: 70,
      });
      assert.equal(res70.calculatedRateMlPerHour, 12.6);

      const res100 = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-PROP-05',
        prescribedDose: 30.0,
        patientWeightKg: 100,
      });
      assert.equal(res100.calculatedRateMlPerHour, 18.0);
    });

    it('should throw clear error if weight is missing for weight-based medication', () => {
      assert.throws(
        () => {
          InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
            substanceCode: 'DRUG-NOREP-01',
            prescribedDose: 0.1,
          });
        },
        /Patient weight in kg is strictly required/,
      );
    });
  });

  describe('3. Manual Gravity Drip Infusion Rate Physics', () => {
    it('should accurately compute drop rates for micro-drip (60 gtt/mL) and macro-drip tubing sets', () => {
      // 120 mL/hr:
      // 60 gtt/ml (micro): (120 * 60) / 60 = 120 gtt/min (1:1 equivalence)
      // 20 gtt/ml: (120 * 20) / 60 = 40 gtt/min
      // 15 gtt/ml: (120 * 15) / 60 = 30 gtt/min
      // 10 gtt/ml: (120 * 10) / 60 = 20 gtt/min

      const gtt60 = InfusionPumpEngine.calculateGravityDripsPerMinute(120, 60);
      assert.equal(gtt60, 120);

      const gtt20 = InfusionPumpEngine.calculateGravityDripsPerMinute(120, 20);
      assert.equal(gtt20, 40);

      const gtt15 = InfusionPumpEngine.calculateGravityDripsPerMinute(120, 15);
      assert.equal(gtt15, 30);

      const gtt10 = InfusionPumpEngine.calculateGravityDripsPerMinute(120, 10);
      assert.equal(gtt10, 20);
    });
  });

  describe('4. Vascular Route Safety: Peripheral Line vs Central Venous Catheter', () => {
    it('should reject Potassium Chloride (KCl) infusion rate > 10 mEq/hr via Peripheral IV line', () => {
      // KCl 15 mEq/hr via Peripheral IV: Exceeds peripheral hardMax 10 mEq/hr
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-KCL-06',
        prescribedDose: 15.0,
        route: 'PERIPHERAL_IV',
      });

      assert.equal(res.guardrailStatus, 'HARD_LIMIT_BREACH');
      assert.equal(res.isFatalRejection, true);
      assert.ok(res.guardrailMessageEn.includes('peripheral'));
    });

    it('should permit KCl infusion up to 20 mEq/hr via Central Line with cardiac monitoring', () => {
      // KCl 15 mEq/hr via Central Line: Below central hardMax 20 mEq/hr (but above softMax 10)
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-KCL-06',
        prescribedDose: 15.0,
        route: 'CENTRAL_LINE',
      });

      assert.equal(res.guardrailStatus, 'SOFT_LIMIT_BREACH');
      assert.equal(res.requiresPhysicianOverride, true);
      assert.equal(res.isFatalRejection, false);
    });

    it('should enforce absolute hard stop if KCl rate exceeds 20 mEq/hr even via Central line', () => {
      const res = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
        substanceCode: 'DRUG-KCL-06',
        prescribedDose: 25.0,
        route: 'CENTRAL_LINE',
      });

      assert.equal(res.guardrailStatus, 'HARD_LIMIT_BREACH');
      assert.equal(res.isFatalRejection, true);
    });
  });

  describe('5. PCA Lockout Intervals & Bedside IoT Telemetry Alarms', () => {
    it('should record valid PCA demand bolus and advance lockout timer', () => {
      const fentanyl = InfusionPumpEngine.findDrugProfile('DRUG-FENT-07')!;
      const res = InfusionPumpEngine.validatePcaBolus({
        profile: fentanyl,
        requestedBolusMcg: 20,
        minutesSinceLastBolus: 15, // Lockout is 10 min, so 15 is safe
        currentFourHourTotalMcg: 60,
      });

      assert.equal(res.isAllowed, true);
      assert.equal(res.bolusDoseMcg, 20);
      assert.equal(res.lockoutMinutesRemaining, 10);
      assert.equal(res.fourHourCumulativeMcg, 80);
    });

    it('should reject premature PCA demand during active lockout interval', () => {
      const fentanyl = InfusionPumpEngine.findDrugProfile('DRUG-FENT-07')!;
      const res = InfusionPumpEngine.validatePcaBolus({
        profile: fentanyl,
        requestedBolusMcg: 20,
        minutesSinceLastBolus: 3, // Lockout is min 6-10 min, so 3 is premature
        currentFourHourTotalMcg: 60,
      });

      assert.equal(res.isAllowed, false);
      assert.ok(res.lockoutMinutesRemaining > 0);
      assert.ok(res.rejectionReasonEn?.includes('lockout'));
    });

    it('should enforce cumulative 4-hour PCA dose ceiling and suppress excessive boluses', () => {
      const fentanyl = InfusionPumpEngine.findDrugProfile('DRUG-FENT-07')!;
      const res = InfusionPumpEngine.validatePcaBolus({
        profile: fentanyl,
        requestedBolusMcg: 20,
        minutesSinceLastBolus: 15,
        currentFourHourTotalMcg: 290, // Limit is 300 mcg, 290 + 20 = 310 > 300
      });

      assert.equal(res.isAllowed, false);
      assert.ok(res.rejectionReasonEn?.includes('4-hour'));
    });

    it('should trip emergency alarm and block flow upon air bubble or line occlusion detection', () => {
      const telemetryAir = InfusionPumpEngine.processSensorTelemetry({
        linePressureMmHg: 120,
        airBubbleDetected: true,
        clampClosed: false,
        batteryPercentage: 90,
        volumeInfusedMl: 50,
        volumeToBeInfusedMl: 250,
        currentRateMlPerHour: 20,
      });

      assert.equal(telemetryAir.status, 'ALARM_AIR_IN_LINE');
      assert.equal(telemetryAir.isFlowBlocked, true);
      assert.ok(telemetryAir.alarms.some((a) => a.code === 'ALARM_AIR_IN_LINE'));

      const telemetryOcclusion = InfusionPumpEngine.processSensorTelemetry({
        linePressureMmHg: 520, // > 450 mmHg threshold
        airBubbleDetected: false,
        clampClosed: false,
        batteryPercentage: 90,
        volumeInfusedMl: 50,
        volumeToBeInfusedMl: 250,
        currentRateMlPerHour: 20,
      });

      assert.equal(telemetryOcclusion.status, 'ALARM_OCCLUSION');
      assert.equal(telemetryOcclusion.isFlowBlocked, true);
      assert.ok(telemetryOcclusion.alarms.some((a) => a.code === 'ALARM_OCCLUSION_DOWNSTREAM'));
    });
  });

  describe('6. Bedside Infusion Service Lifecycle & State Machine', () => {
    it('should retrieve all default active bedside pumps', () => {
      const pumps = infusionService.getAllPumps();
      assert.ok(pumps.length >= 4);
      const icu1 = pumps.find((p) => p.pumpId === 'PUMP-ICU-01');
      assert.ok(icu1);
      assert.equal(icu1.status, 'INFUSING');
      assert.equal(icu1.substanceCode, 'DRUG-NOREP-01');
    });

    it('should titrate dose safely and update rate in real-time', () => {
      const res = infusionService.titrateDose({
        pumpId: 'PUMP-ICU-01',
        newDose: 0.2, // Titrate from 0.15 to 0.20 mcg/kg/min
        nurseStaffId: 'STAFF-RN-01',
      });

      assert.equal(res.success, true);
      assert.equal(res.pump.prescribedDose, 0.2);
      assert.ok(res.pump.rateMlPerHour > 36.56);
      assert.ok(res.pump.lastTitratedAt);
    });

    it('should reject titration exceeding hard maximum limit', () => {
      assert.throws(
        () => {
          infusionService.titrateDose({
            pumpId: 'PUMP-ICU-01',
            newDose: 3.0, // Exceeds Norepinephrine hardMax 2.0
            nurseStaffId: 'STAFF-RN-01',
          });
        },
        /DERS Hard Limit Violation/,
      );
    });

    it('should update telemetry and handle KVO transition when volume is complete', () => {
      const analysis = infusionService.updateTelemetry('PUMP-ICU-01', {
        linePressureMmHg: 110,
        airBubbleDetected: false,
        batteryPercentage: 95,
        volumeInfusedIncrementMl: 110, // Completes the remaining 107.5 mL
      });

      const pump = infusionService.getPumpById('PUMP-ICU-01');
      assert.equal(pump.status, 'KVO_MODE');
      assert.equal(pump.rateMlPerHour, 1.0); // KVO 1.0 mL/hr
      assert.ok(analysis.alarms.some((a) => a.code === 'INFUSION_COMPLETE_KVO'));
    });
  });

  describe('7. Strict Zero Emojis and Zero Khmer Parentheses Compliance', () => {
    it('should guarantee strictly zero emojis across all drug libraries, alerts, and telemetry logs', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

      for (const drug of DERS_DRUG_LIBRARY) {
        assert.equal(emojiRegex.test(drug.genericNameKh), false);
        assert.equal(emojiRegex.test(drug.genericNameEn), false);
        assert.equal(emojiRegex.test(drug.clinicalNotesKh), false);
        assert.equal(emojiRegex.test(drug.clinicalNotesEn), false);
      }

      const pumps = infusionService.getAllPumps();
      for (const p of pumps) {
        if (p.substanceNameKh) assert.equal(emojiRegex.test(p.substanceNameKh), false);
        if (p.patientNameKh) assert.equal(emojiRegex.test(p.patientNameKh), false);
      }
    });

    it('should guarantee strictly zero parentheses in any Khmer language string across the infusion service', () => {
      for (const drug of DERS_DRUG_LIBRARY) {
        assert.equal(
          drug.genericNameKh.includes('(') || drug.genericNameKh.includes(')'),
          false,
          `Khmer name "${drug.genericNameKh}" contains forbidden parentheses`,
        );
        assert.equal(
          drug.clinicalNotesKh.includes('(') || drug.clinicalNotesKh.includes(')'),
          false,
          `Khmer clinical notes "${drug.clinicalNotesKh}" contains forbidden parentheses`,
        );
      }
    });
  });
});
