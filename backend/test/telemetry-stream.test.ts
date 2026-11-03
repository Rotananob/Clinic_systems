// Real-Time Telemetry and Vital Alert Broadcast Engine Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { firstValueFrom, take, toArray } from 'rxjs';
import { MobileSyncService } from '../src/mobile-sync/mobile-sync.service.ts';
import type {
  TelemetryStreamEvent,
  TelemetryBedVitalsData,
  TelemetryEcgData,
  TelemetryLabPanicData,
} from '../src/mobile-sync/mobile-sync.types.ts';

describe('Phase 9: Real-Time Telemetry Stream & Alert Broadcast Test Suite', () => {
  let service: MobileSyncService;

  beforeEach(() => {
    service = new MobileSyncService();
  });

  describe('1. Stream Connection & Initial Ward Snapshot Delivery', () => {
    it('should deliver initial snapshot of active beds and alerts for subscribed department', async () => {
      // Subscribe to ICU department stream
      const stream$ = service.getTelemetryStream({
        department: 'ICU',
        deviceId: 'TAB-ICU-NURSE-01',
        heartbeatIntervalMs: 60000, // Long heartbeat to test snapshot only
      });

      // Take first 3 initial snapshot events
      const events = await firstValueFrom(stream$.pipe(take(3), toArray()));

      assert.equal(events.length, 3);

      const parsedEvents: TelemetryStreamEvent[] = events.map((e) => JSON.parse(e.data));

      // Verify all delivered initial events belong to ICU
      for (const evt of parsedEvents) {
        assert.equal(evt.department, 'ICU');
        assert.ok(evt.eventId.startsWith('INIT-'));
      }

      // Check bed 1 vitals snapshot
      const bed1 = parsedEvents.find((e) => e.bedId === 'ICU-BED-01');
      assert.ok(bed1);
      assert.equal(bed1.eventType, 'VITAL_SIGNS_UPDATE');
      const vitals = bed1.data as TelemetryBedVitalsData;
      assert.equal(vitals.heartRate, 74);
      assert.equal(vitals.systolicBp, 122);
      assert.equal(vitals.diastolicBp, 78);
      assert.equal(vitals.spo2, 98);

      // Check bed 2 lab panic alert snapshot
      const panicAlert = parsedEvents.find((e) => e.eventType === 'LAB_PANIC_ALERT');
      assert.ok(panicAlert);
      const panicData = panicAlert.data as TelemetryLabPanicData;
      assert.equal(panicData.testName, 'Serum Potassium K+');
      assert.equal(panicData.measuredValue, 6.8);
      assert.equal(panicData.severity, 'PANIC_CRITICAL');
      assert.ok(panicData.requiresImmediateReview);
    });

    it('should deliver empty snapshot when department has no active beds', async () => {
      const stream$ = service.getTelemetryStream({
        department: 'NICU',
        deviceId: 'TAB-NICU-01',
        heartbeatIntervalMs: 50,
      });

      // Since NICU has no seed beds, first event will be the heartbeat
      const firstEvent = await firstValueFrom(stream$.pipe(take(1)));
      assert.equal(firstEvent.type, 'HEARTBEAT');
      const parsed = JSON.parse(firstEvent.data);
      assert.equal(parsed.eventType, 'HEARTBEAT');
      assert.equal(parsed.data.status, 'PING');
    });
  });

  describe('2. Real-Time Channel Filtering by Department and Ward', () => {
    it('should only deliver events matching the subscribed department', async () => {
      const receivedByIcu: TelemetryStreamEvent[] = [];
      const receivedByEr: TelemetryStreamEvent[] = [];

      // Subscriber 1: ICU only
      const icuSub = service
        .getTelemetryStream({ department: 'ICU', heartbeatIntervalMs: 60000 })
        .subscribe((msg) => {
          const parsed: TelemetryStreamEvent = JSON.parse(msg.data);
          if (parsed.eventType !== 'HEARTBEAT') {
            receivedByIcu.push(parsed);
          }
        });

      // Subscriber 2: ER only
      const erSub = service
        .getTelemetryStream({ department: 'ER', heartbeatIntervalMs: 60000 })
        .subscribe((msg) => {
          const parsed: TelemetryStreamEvent = JSON.parse(msg.data);
          if (parsed.eventType !== 'HEARTBEAT') {
            receivedByEr.push(parsed);
          }
        });

      // Clear initial snapshots for clean test comparison
      receivedByIcu.length = 0;
      receivedByEr.length = 0;

      // Broadcast an ICU Bed 01 vital signs update
      service.broadcastBedVitals({
        bedId: 'ICU-BED-01',
        patientId: 'PAT-MOH-2026-0001',
        patientName: 'Sokha Chea',
        department: 'ICU',
        vitals: {
          heartRate: 82,
          systolicBp: 125,
          diastolicBp: 80,
          calculatedMap: 95.0,
          spo2: 99,
          respirationRate: 15,
          temperature: 36.9,
          severity: 'NORMAL',
        },
      });

      // Broadcast an ER Bed 01 ECG telemetry event
      service.broadcastEcgTelemetry({
        bedId: 'ER-BED-01',
        patientId: 'PAT-MOH-2026-0003',
        patientName: 'Rithy Chan',
        department: 'ER',
        ecg: {
          rhythm: 'VENTRICULAR_TACHYCARDIA',
          arrhythmiaType: 'VENTRICULAR_TACHYCARDIA',
          stDeviationMm: 2.8,
          prIntervalMs: 135,
          qrsDurationMs: 150,
          calculatedQtcMs: 490,
          leadStatus: 'CONNECTED',
          arrhythmiaDetected: true,
          alarmActive: true,
        },
      });

      // Verify channel isolation: ICU subscriber received ONLY the ICU vital event
      assert.equal(receivedByIcu.length, 1);
      assert.equal(receivedByIcu[0].bedId, 'ICU-BED-01');
      assert.equal(receivedByIcu[0].department, 'ICU');
      assert.equal(receivedByIcu[0].eventType, 'VITAL_SIGNS_UPDATE');

      // Verify channel isolation: ER subscriber received ONLY the ER ECG event
      assert.equal(receivedByEr.length, 1);
      assert.equal(receivedByEr[0].bedId, 'ER-BED-01');
      assert.equal(receivedByEr[0].department, 'ER');
      assert.equal(receivedByEr[0].eventType, 'ECG_TELEMETRY');

      icuSub.unsubscribe();
      erSub.unsubscribe();
    });

    it('should deliver all department events to unfiltered clinical supervisor stream', async () => {
      const allEvents: TelemetryStreamEvent[] = [];

      const superSub = service
        .getTelemetryStream({ department: 'ALL', heartbeatIntervalMs: 60000 })
        .subscribe((msg) => {
          const parsed: TelemetryStreamEvent = JSON.parse(msg.data);
          if (parsed.eventType !== 'HEARTBEAT') {
            allEvents.push(parsed);
          }
        });

      allEvents.length = 0;

      // Broadcast events across different departments
      service.broadcastBedVitals({
        bedId: 'ICU-BED-03',
        patientId: 'PAT-01',
        patientName: 'ICU Patient',
        department: 'ICU',
        vitals: {
          heartRate: 70,
          systolicBp: 120,
          diastolicBp: 80,
          calculatedMap: 93.3,
          spo2: 98,
          respirationRate: 16,
          temperature: 37.0,
          severity: 'NORMAL',
        },
      });

      service.broadcastBedVitals({
        bedId: 'WARD-A-BED-09',
        patientId: 'PAT-02',
        patientName: 'Ward Patient',
        department: 'WARD_A',
        vitals: {
          heartRate: 65,
          systolicBp: 115,
          diastolicBp: 75,
          calculatedMap: 88.3,
          spo2: 99,
          respirationRate: 14,
          temperature: 36.5,
          severity: 'NORMAL',
        },
      });

      assert.equal(allEvents.length, 2);
      assert.ok(allEvents.some((e) => e.department === 'ICU'));
      assert.ok(allEvents.some((e) => e.department === 'WARD_A'));

      superSub.unsubscribe();
    });
  });

  describe('3. Event Serialization & Clinical Alert Payload Formatting', () => {
    it('should correctly format and serialize critical Lab Panic Value alerts', async () => {
      const stream$ = service.getTelemetryStream({
        department: 'ER',
        heartbeatIntervalMs: 60000,
      });

      const events: SseMessageEvent[] = [];
      const sub = stream$.subscribe((msg) => events.push(msg));
      events.length = 0;

      // Broadcast Troponin panic alert
      const broadcasted = service.broadcastLabPanicAlert({
        patientId: 'PAT-MOH-2026-0003',
        patientName: 'Rithy Chan',
        department: 'ER',
        bedId: 'ER-BED-01',
        alert: {
          testName: 'High Sensitivity Troponin I',
          measuredValue: 2.45,
          unit: 'ng/mL',
          referenceLow: 0.0,
          referenceHigh: 0.04,
          severity: 'PANIC_CRITICAL',
          labTechnicianId: 'STAFF-LIS-01',
          requiresImmediateReview: true,
          notificationMessageKh: 'ការព្រមានកម្រិតអាសន្នពីមន្ទីរពិសោធន៍: សារធាតុត្រូប៉ូនីនខ្ពស់ខ្លាំង',
          notificationMessageEn: 'Critical Panic Lab Alert: High Sensitivity Troponin I severely elevated',
        },
      });

      assert.equal(events.length, 1);
      const msg = events[0];
      assert.equal(msg.type, 'LAB_PANIC_ALERT');
      assert.equal(msg.id, broadcasted.eventId);

      const parsed: TelemetryStreamEvent = JSON.parse(msg.data);
      assert.equal(parsed.eventType, 'LAB_PANIC_ALERT');
      assert.equal(parsed.patientName, 'Rithy Chan');
      const data = parsed.data as TelemetryLabPanicData;
      assert.equal(data.testName, 'High Sensitivity Troponin I');
      assert.equal(data.measuredValue, 2.45);
      assert.equal(data.unit, 'ng/mL');
      assert.equal(data.severity, 'PANIC_CRITICAL');
      assert.equal(data.notificationMessageKh, 'ការព្រមានកម្រិតអាសន្នពីមន្ទីរពិសោធន៍: សារធាតុត្រូប៉ូនីនខ្ពស់ខ្លាំង');

      sub.unsubscribe();
    });

    it('should format ECG telemetry events with arrhythmia classification and ST segment deviation', () => {
      const ecgEvent = service.broadcastEcgTelemetry({
        bedId: 'ICU-BED-01',
        patientId: 'PAT-MOH-2026-0001',
        patientName: 'Sokha Chea',
        department: 'ICU',
        ecg: {
          rhythm: 'ST_ELEVATION_ISCHEMIA',
          arrhythmiaType: 'ST_ELEVATION_ISCHEMIA',
          stDeviationMm: 2.1,
          prIntervalMs: 165,
          qrsDurationMs: 98,
          calculatedQtcMs: 445,
          leadStatus: 'CONNECTED',
          arrhythmiaDetected: true,
          alarmActive: true,
        },
      });

      assert.equal(ecgEvent.eventType, 'ECG_TELEMETRY');
      const data = ecgEvent.data as TelemetryEcgData;
      assert.equal(data.stDeviationMm, 2.1);
      assert.equal(data.arrhythmiaDetected, true);
      assert.equal(data.alarmActive, true);
      assert.equal(data.leadStatus, 'CONNECTED');
    });
  });

  describe('4. Rural 15s Heartbeat Keep-Alive Engine', () => {
    it('should emit periodic heartbeat keep-alive events to preserve rural TCP socket connectivity', async () => {
      // Use short 30ms interval for automated unit testing
      const stream$ = service.getTelemetryStream({
        department: 'NICU',
        heartbeatIntervalMs: 30,
      });

      // Capture 3 consecutive heartbeat events
      const events = await firstValueFrom(stream$.pipe(take(3), toArray()));

      assert.equal(events.length, 3);

      for (const msg of events) {
        assert.equal(msg.type, 'HEARTBEAT');
        const parsed: TelemetryStreamEvent = JSON.parse(msg.data);
        assert.equal(parsed.eventType, 'HEARTBEAT');
        assert.equal(parsed.department, 'ALL');
        assert.equal(parsed.data.status, 'PING');
        assert.ok(typeof parsed.data.serverTimeMs === 'number');
        assert.ok(parsed.data.serverTimeUtc.length > 0);
      }
    });

    it('should track active mobile client connections and decrement on disconnect', () => {
      const initialCount = service.getActiveSubscribersCount();

      const sub1 = service
        .getTelemetryStream({ department: 'ICU', deviceId: 'DEV-SUB-1' })
        .subscribe();
      assert.equal(service.getActiveSubscribersCount(), initialCount + 1);

      const sub2 = service
        .getTelemetryStream({ department: 'ER', deviceId: 'DEV-SUB-2' })
        .subscribe();
      assert.equal(service.getActiveSubscribersCount(), initialCount + 2);

      sub1.unsubscribe();
      assert.equal(service.getActiveSubscribersCount(), initialCount + 1);

      sub2.unsubscribe();
      assert.equal(service.getActiveSubscribersCount(), initialCount);
    });
  });

  describe('5. Strict Healthcare Platform Compliance', () => {
    it('should strictly guarantee zero emojis and zero parentheses in Khmer strings across all telemetry events', () => {
      const icuEvents = service.getBedTelemetrySnapshot('ICU');
      const panicAlerts = service.getActivePanicAlerts();

      const emojiRegex =
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

      const khmerWithParensRegex = /[\u1780-\u17FF][^()]*[()]/;

      for (const evt of [...icuEvents, ...panicAlerts]) {
        const jsonStr = JSON.stringify(evt);
        assert.ok(!emojiRegex.test(jsonStr), `Emoji detected in event ${evt.eventId}`);

        if (evt.eventType === 'LAB_PANIC_ALERT') {
          const panic = evt.data as TelemetryLabPanicData;
          assert.ok(
            !khmerWithParensRegex.test(panic.notificationMessageKh),
            `Parentheses detected in Khmer notification: ${panic.notificationMessageKh}`
          );
          assert.ok(
            !panic.notificationMessageKh.includes('(') && !panic.notificationMessageKh.includes(')'),
            `Parentheses detected in Khmer text: ${panic.notificationMessageKh}`
          );
        }
      }
    });
  });
});
