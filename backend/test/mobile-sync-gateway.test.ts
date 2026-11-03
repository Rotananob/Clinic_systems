// Mobile Sync & Device Gateway Unit & Integration Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MobileSyncService } from '../src/mobile-sync/mobile-sync.service.ts';
import type {
  HandshakeRequestDto,
  PullDeltaRequestDto,
  PushMutationsRequestDto,
  OfflineMutationDto,
} from '../src/mobile-sync/mobile-sync.types.ts';

describe('Phase 8: Mobile Sync & Device Gateway Concurrency and Parity Test Suite', () => {
  let service: MobileSyncService;

  beforeEach(() => {
    service = new MobileSyncService();
  });

  describe('1. SemVer Verification & Handshake Device Registration', () => {
    it('should correctly evaluate SemVer precedence between versions', () => {
      assert.equal(service.compareSemVer('1.0.0', '1.0.0'), 0);
      assert.equal(service.compareSemVer('1.0.1', '1.0.0'), 1);
      assert.equal(service.compareSemVer('1.2.0', '1.0.0'), 1);
      assert.equal(service.compareSemVer('2.0.0', '1.0.0'), 1);
      assert.equal(service.compareSemVer('0.9.9', '1.0.0'), -1);
      assert.equal(service.compareSemVer('0.8.5', '1.0.0'), -1);
      assert.equal(service.compareSemVer('1.0.0-rc1', '1.0.0'), 0);
    });

    it('should reject handshake when client app version is below 1.0.0', async () => {
      const dto: HandshakeRequestDto = {
        deviceId: 'DEV-TAB-SAMSUNG-001',
        deviceName: 'Samsung Galaxy Tab Active 3',
        deviceModel: 'SM-T575',
        osVersion: 'Android 13',
        appVersion: '0.9.5',
      };

      await assert.rejects(
        async () => {
          await service.handshake(dto);
        },
        {
          name: 'BadRequestException',
          message:
            'App version 0.9.5 is deprecated and unsupported. Minimum supported version is 1.0.0. Please upgrade your application.',
        }
      );
    });

    it('should accept handshake for minimum supported version 1.0.0', async () => {
      const dto: HandshakeRequestDto = {
        deviceId: 'DEV-TAB-002',
        deviceName: 'Hospital Bedside Terminal',
        appVersion: '1.0.0',
      };

      const res = await service.handshake(dto);

      assert.equal(res.success, true);
      assert.equal(res.status, 'REGISTERED');
      assert.equal(res.minSupportedVersion, '1.0.0');
      assert.equal(res.clientAppVersion, '1.0.0');
      assert.equal(res.isUpgradeRequired, false);
      assert.ok(res.syncSessionId.startsWith('SESS-DEV-TAB-002-'));
      assert.ok(typeof res.serverTimeMs === 'number');
      assert.ok(res.serverTimeUtc.length > 0);
      assert.ok(res.serverMonotonicSequence >= 1000);
      assert.ok(res.serverVectorClock.SERVER >= 1);
      assert.deepEqual(res.supportedEntities, ['PATIENT', 'VITAL_SIGNS', 'FORMULARY_ITEM']);
    });

    it('should configure low-bandwidth optimization flags for rural 3G connections', async () => {
      const dto: HandshakeRequestDto = {
        deviceId: 'DEV-RURAL-MIDWIFE-01',
        deviceName: 'Ratanakiri Outpost Tablet',
        appVersion: '1.1.2',
        networkTier: '3G',
        clientVectorClock: { 'DEV-RURAL-MIDWIFE-01': 5 },
      };

      const res = await service.handshake(dto);

      assert.equal(res.success, true);
      assert.equal(res.lowBandwidthOptimized, true);
      assert.equal(res.recommendedChunkSize, 25);
      assert.equal(res.heartbeatIntervalSeconds, 120);
      assert.equal(res.serverVectorClock['DEV-RURAL-MIDWIFE-01'], 5);

      const device = service.getDevice('DEV-RURAL-MIDWIFE-01');
      assert.ok(device);
      assert.equal(device.networkTier, '3G');
    });

    it('should synchronize server time and calculate clock offset for mobile client', async () => {
      const clientEpoch = Date.now() - 5000;
      const dto: HandshakeRequestDto = {
        deviceId: 'DEV-PHONE-CLINICIAN-01',
        deviceName: 'Pixel 7 Pro',
        appVersion: '1.2.4',
        clientTimeUtc: new Date(clientEpoch).toISOString(),
      };

      const res = await service.handshake(dto);

      assert.equal(res.success, true);
      const measuredDriftMs = Math.abs(res.serverTimeMs - clientEpoch);
      assert.ok(measuredDriftMs >= 4000);

      const device = service.getDevice('DEV-PHONE-CLINICIAN-01');
      assert.ok(device);
      assert.equal(device.appVersion, '1.2.4');
      assert.equal(device.status, 'ACTIVE');
    });

    it('should reject handshake when deviceId or appVersion is omitted', async () => {
      await assert.rejects(
        async () => {
          await service.handshake({ deviceId: '', appVersion: '1.0.0' });
        },
        { name: 'BadRequestException' }
      );

      await assert.rejects(
        async () => {
          await service.handshake({ deviceId: 'DEV-VALID', appVersion: '' });
        },
        { name: 'BadRequestException' }
      );
    });
  });

  describe('2. Pull Delta Sync with Low-Bandwidth 3G/4G Chunking & Resumable Cursors', () => {
    it('should return initial baseline dataset when sinceTimestamp is 0', async () => {
      const dto: PullDeltaRequestDto = {
        sinceTimestamp: 0,
        deviceId: 'DEV-TAB-002',
      };

      const delta = await service.pullDelta(dto);

      assert.ok(delta.patients.length >= 3);
      assert.ok(delta.vitalSigns.length >= 3);
      assert.ok(delta.formularyItems.length >= 8);
      assert.equal(delta.counts.patients, delta.patients.length);
      assert.equal(delta.counts.vitalSigns, delta.vitalSigns.length);
      assert.equal(delta.counts.formularyItems, delta.formularyItems.length);
      assert.equal(
        delta.counts.total,
        delta.patients.length + delta.vitalSigns.length + delta.formularyItems.length
      );
      assert.ok(delta.serverMonotonicSequence >= 1000);
      assert.ok(delta.serverVectorClock.SERVER >= 1);

      const paracetamol = delta.formularyItems.find((f) => f.code === 'PARACETAMOL-500MG');
      assert.ok(paracetamol);
      assert.equal(paracetamol.dosageForm, 'Tablet');
      assert.equal(paracetamol.unitPriceKhr, 200);

      const dev = service.getDevice('DEV-TAB-002');
      assert.ok(dev?.lastSyncAt);
    });

    it('should paginate delta responses in small sequential chunks for rural 3G connectivity', async () => {
      // Total items in baseline = 3 patients + 3 vitals + 8 formulary = 14 items
      // Request chunkSize: 4
      const chunk1 = await service.pullDelta({
        sinceTimestamp: 0,
        chunkSize: 4,
        lowBandwidthMode: true,
      });

      assert.equal(chunk1.isBandwidthOptimized, true);
      assert.equal(chunk1.counts.total, 4);
      assert.equal(chunk1.hasMore, true);
      assert.ok(chunk1.nextCursor);
      assert.equal(chunk1.chunkIndex, 0);
      assert.equal(chunk1.remainingRecordsCount, 10);
      assert.ok(chunk1.payloadSizeBytes > 0);

      // Fetch Chunk 2 with nextCursor
      const chunk2 = await service.pullDelta({
        sinceTimestamp: 0,
        chunkSize: 4,
        cursor: chunk1.nextCursor,
        lowBandwidthMode: true,
      });

      assert.equal(chunk2.counts.total, 4);
      assert.equal(chunk2.hasMore, true);
      assert.ok(chunk2.nextCursor);
      assert.equal(chunk2.chunkIndex, 1);
      assert.equal(chunk2.remainingRecordsCount, 6);

      // Verify no duplicate items across chunk1 and chunk2
      const chunk1PatientIds = chunk1.patients.map((p) => p.id);
      const chunk2PatientIds = chunk2.patients.map((p) => p.id);
      for (const id of chunk2PatientIds) {
        assert.ok(!chunk1PatientIds.includes(id));
      }

      // Fetch Chunk 3 with nextCursor
      const chunk3 = await service.pullDelta({
        sinceTimestamp: 0,
        chunkSize: 4,
        cursor: chunk2.nextCursor,
        lowBandwidthMode: true,
      });

      assert.equal(chunk3.counts.total, 4);
      assert.equal(chunk3.hasMore, true);
      assert.equal(chunk3.chunkIndex, 2);
      assert.equal(chunk3.remainingRecordsCount, 2);

      // Fetch Final Chunk 4
      const chunk4 = await service.pullDelta({
        sinceTimestamp: 0,
        chunkSize: 4,
        cursor: chunk3.nextCursor,
        lowBandwidthMode: true,
      });

      assert.equal(chunk4.counts.total, 2);
      assert.equal(chunk4.hasMore, false);
      assert.equal(chunk4.nextCursor, undefined);
      assert.equal(chunk4.remainingRecordsCount, 0);
    });

    it('should return empty collections when sinceTimestamp is in the future', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const dto: PullDeltaRequestDto = {
        sinceTimestamp: futureDate,
      };

      const delta = await service.pullDelta(dto);

      assert.equal(delta.patients.length, 0);
      assert.equal(delta.vitalSigns.length, 0);
      assert.equal(delta.formularyItems.length, 0);
      assert.equal(delta.counts.total, 0);
      assert.equal(delta.hasMore, false);
    });

    it('should respect pagination limit parameter during delta fetch', async () => {
      const dto: PullDeltaRequestDto = {
        sinceTimestamp: 0,
        limit: 2,
      };

      const delta = await service.pullDelta(dto);

      assert.equal(delta.patients.length, 2);
      assert.equal(delta.vitalSigns.length, 0); // sequential budget: limit 2 filled by 2 patients
      assert.equal(delta.hasMore, true);
    });

    it('should only return records updated after the specified ISO timestamp', async () => {
      const threshold = '2026-11-02T00:00:00.000Z';
      const dto: PullDeltaRequestDto = {
        sinceTimestamp: threshold,
      };

      const delta = await service.pullDelta(dto);

      for (const p of delta.patients) {
        assert.ok(Date.parse(p.updatedAt) > Date.parse(threshold));
      }
      for (const v of delta.vitalSigns) {
        assert.ok(Date.parse(v.updatedAt) > Date.parse(threshold));
      }
    });
  });

  describe('3. Batch Offline Mutation Ingestion & Vector Clock Conflict Resolution', () => {
    it('should ingest new offline patient record and assign monotonic sequence', async () => {
      const newPatientMutation: OfflineMutationDto = {
        mutationId: 'MUT-PAT-OFFLINE-001',
        deviceId: 'DEV-MOBILE-01',
        entityType: 'PATIENT',
        entityId: 'PAT-OFFLINE-9999',
        operation: 'CREATE',
        payload: {
          patientCode: 'P-9999',
          nameEn: 'Vichhai Keo',
          nameKh: 'កែវ វិច្ឆ័យ',
          gender: 'MALE',
          phone: '011223344',
          bloodType: 'AB+',
          allergies: 'Aspirin',
        },
        clientTimestamp: '2026-11-03T10:00:00.000Z',
        clientTimestampMs: Date.parse('2026-11-03T10:00:00.000Z'),
        vectorClock: { 'DEV-MOBILE-01': 1 },
      };

      const batchDto: PushMutationsRequestDto = {
        deviceId: 'DEV-MOBILE-01',
        mutations: [newPatientMutation],
      };

      const response = await service.pushMutations(batchDto);

      assert.equal(response.success, true);
      assert.equal(response.totalProcessed, 1);
      assert.equal(response.appliedCount, 1);
      assert.equal(response.conflictCount, 0);
      assert.equal(response.results[0].status, 'APPLIED');
      assert.ok(response.serverMonotonicSequence >= 1001);

      const saved = service.getPatient('PAT-OFFLINE-9999');
      assert.ok(saved);
      assert.equal(saved.nameEn, 'Vichhai Keo');
      assert.equal(saved.nameKh, 'កែវ វិច្ឆ័យ');
      assert.equal(saved.allergies, 'Aspirin');
      assert.ok(saved.monotonicVersion >= 1001);
      assert.equal(saved.vectorClock?.['DEV-MOBILE-01'], 1);
    });

    it('should resolve conflict with Client Wins when vector clock causally succeeds server (AFTER)', async () => {
      const existing = service.getPatient('PAT-MOH-2026-0001');
      assert.ok(existing);

      // Client knows server state (SERVER: 1) and advanced its own counter to 3
      const mutation: OfflineMutationDto = {
        mutationId: 'MUT-CAUSAL-SUCCESSOR-01',
        deviceId: 'DEV-MOBILE-01',
        entityType: 'PATIENT',
        entityId: 'PAT-MOH-2026-0001',
        operation: 'UPDATE',
        payload: {
          phone: '099000111',
          allergies: 'Penicillin, Cephalosporins',
        },
        clientTimestamp: new Date().toISOString(),
        clientTimestampMs: Date.now(),
        vectorClock: { SERVER: 1, 'DEV-MOBILE-01': 3 },
      };

      const response = await service.pushMutations({
        deviceId: 'DEV-MOBILE-01',
        mutations: [mutation],
      });

      assert.equal(response.success, true);
      assert.equal(response.appliedCount, 1);
      assert.equal(response.results[0].status, 'APPLIED');
      assert.equal(response.results[0].conflictDetails?.winner, 'CLIENT');
      assert.equal(response.results[0].conflictDetails?.causalRelation, 'AFTER');
      assert.equal(response.results[0].conflictDetails?.strategy, 'VECTOR_CLOCK_LWW');

      const updated = service.getPatient('PAT-MOH-2026-0001');
      assert.equal(updated?.phone, '099000111');
      assert.equal(updated?.allergies, 'Penicillin, Cephalosporins');
    });

    it('should resolve conflict with Server Wins when vector clock is causally superseded (BEFORE)', async () => {
      const existing = service.getPatient('PAT-MOH-2026-0002');
      assert.ok(existing);

      // Client has stale vector clock: SERVER is 0, while server is already 1
      const staleMutation: OfflineMutationDto = {
        mutationId: 'MUT-STALE-VECTOR-01',
        deviceId: 'DEV-STALE-01',
        entityType: 'PATIENT',
        entityId: 'PAT-MOH-2026-0002',
        operation: 'UPDATE',
        payload: {
          phone: '000000000',
          allergies: 'Stale Allergy Data',
        },
        clientTimestamp: '2026-10-01T00:00:00.000Z',
        clientTimestampMs: Date.parse('2026-10-01T00:00:00.000Z'),
        vectorClock: { SERVER: 0 },
      };

      const response = await service.pushMutations({
        deviceId: 'DEV-STALE-01',
        mutations: [staleMutation],
      });

      assert.equal(response.success, true);
      assert.equal(response.appliedCount, 0);
      assert.equal(response.conflictCount, 1);
      assert.equal(response.results[0].status, 'CONFLICT_IGNORED');
      assert.equal(response.results[0].conflictDetails?.winner, 'SERVER');
      assert.equal(response.results[0].conflictDetails?.causalRelation, 'BEFORE');

      const patient = service.getPatient('PAT-MOH-2026-0002');
      assert.equal(patient?.phone, '098765432');
      assert.equal(patient?.allergies, 'None');
    });

    it('should resolve concurrent divergence using monotonic sequence priority tie-breaker', async () => {
      const existing = service.getPatient('PAT-MOH-2026-0003');
      assert.ok(existing);
      const serverVersion = existing.monotonicVersion || 1011;

      // Concurrent divergence: Client clock { 'DEV-CHW-01': 4 } vs Server { SERVER: 1 }
      // Client has higher monotonic timestamp (1050 > serverVersion)
      const concurrentClientWins: OfflineMutationDto = {
        mutationId: 'MUT-CONCURRENT-01',
        deviceId: 'DEV-CHW-01',
        entityType: 'PATIENT',
        entityId: 'PAT-MOH-2026-0003',
        operation: 'UPDATE',
        payload: {
          phone: '077112233',
        },
        clientTimestamp: new Date().toISOString(),
        clientTimestampMs: Date.now(),
        vectorClock: { 'DEV-CHW-01': 4 },
        monotonicTimestamp: 1050,
      };

      const response = await service.pushMutations({
        deviceId: 'DEV-CHW-01',
        mutations: [concurrentClientWins],
      });

      assert.equal(response.success, true);
      assert.equal(response.appliedCount, 1);
      assert.equal(response.results[0].status, 'APPLIED');
      assert.equal(response.results[0].conflictDetails?.winner, 'CLIENT');
      assert.equal(response.results[0].conflictDetails?.causalRelation, 'CONCURRENT');
      assert.equal(response.results[0].conflictDetails?.strategy, 'MONOTONIC_SEQUENCE');

      const updated = service.getPatient('PAT-MOH-2026-0003');
      assert.equal(updated?.phone, '077112233');
    });

    it('should process batch with mixed entity types: patient, vitals, and formulary updates', async () => {
      const mutations: OfflineMutationDto[] = [
        {
          mutationId: 'BATCH-MUT-1',
          deviceId: 'DEV-NURSE-TABLET-03',
          entityType: 'VITAL_SIGNS',
          entityId: 'VIT-NEW-0099',
          operation: 'CREATE',
          payload: {
            patientId: 'PAT-MOH-2026-0001',
            bloodPressure: '125/82',
            heartRate: 76,
            temperature: 36.9,
            spO2: 98,
            respiratoryRate: 16,
            weightKg: 66.0,
            heightCm: 168.0,
          },
          clientTimestamp: new Date().toISOString(),
          clientTimestampMs: Date.now(),
          vectorClock: { 'DEV-NURSE-TABLET-03': 1 },
          monotonicTimestamp: 1060,
        },
        {
          mutationId: 'BATCH-MUT-2',
          deviceId: 'DEV-NURSE-TABLET-03',
          entityType: 'FORMULARY_ITEM',
          entityId: 'FORM-MED-001',
          operation: 'UPDATE',
          payload: {
            stockQuantity: 1450,
          },
          clientTimestamp: new Date(Date.now() + 1000).toISOString(),
          clientTimestampMs: Date.now() + 1000,
          vectorClock: { SERVER: 1, 'DEV-NURSE-TABLET-03': 2 },
          monotonicTimestamp: 1061,
        },
      ];

      const res = await service.pushMutations({
        deviceId: 'DEV-NURSE-TABLET-03',
        mutations,
      });

      assert.equal(res.success, true);
      assert.equal(res.totalProcessed, 2);
      assert.equal(res.appliedCount, 2);
      assert.equal(res.conflictCount, 0);
      assert.equal(res.errorCount, 0);

      const vitals = service.getVitalSigns('VIT-NEW-0099');
      assert.ok(vitals);
      assert.equal(vitals.bloodPressure, '125/82');

      const med = service.getFormularyItem('FORM-MED-001');
      assert.ok(med);
      assert.equal(med.stockQuantity, 1450);
    });
  });

  describe('4. Gateway Health & Controller REST API Endpoint Contract Parity', () => {
    it('should return healthy status, monotonic sequence, and vector clock metrics', async () => {
      const health = await service.getGatewayHealth();

      assert.equal(health.status, 'HEALTHY');
      assert.equal(health.service, 'MobileSyncGateway');
      assert.equal(health.minSupportedAppVersion, '1.0.0');
      assert.ok(health.serverMonotonicSequence >= 1000);
      assert.ok(health.serverVectorClock.SERVER >= 1);
      assert.ok(health.cachedPatientsCount >= 3);
      assert.ok(health.cachedVitalSignsCount >= 3);
      assert.ok(health.cachedFormularyItemsCount >= 8);
    });

    it('should list all registered devices and retrieve by device ID', async () => {
      await service.handshake({
        deviceId: 'DEV-DIAG-001',
        deviceName: 'Emergency Ward Pad',
        appVersion: '1.1.0',
      });

      const devices = await service.getAllRegisteredDevices();
      assert.ok(devices.length >= 1);
      const found = devices.find((d) => d.deviceId === 'DEV-DIAG-001');
      assert.ok(found);
      assert.equal(found.deviceName, 'Emergency Ward Pad');

      const single = await service.getDevice('DEV-DIAG-001');
      assert.ok(single);
      assert.equal(single.deviceId, 'DEV-DIAG-001');
    });

    it('should verify gateway delta sync returns expected response structure', async () => {
      const handshakeRes = await service.handshake({
        deviceId: 'DEV-CTRL-TEST',
        deviceName: 'Test Controller Terminal',
        appVersion: '1.0.0',
      });
      assert.equal(handshakeRes.success, true);

      const deltaRes = await service.pullDelta({
        sinceTimestamp: 0,
        chunkSize: 10,
      });
      assert.ok(deltaRes.counts.total > 0);
      assert.ok(deltaRes.serverVectorClock.SERVER >= 1);
      assert.ok(deltaRes.serverMonotonicSequence >= 1000);

      const healthRes = await service.getGatewayHealth();
      assert.equal(healthRes.status, 'HEALTHY');
    });
  });
});
