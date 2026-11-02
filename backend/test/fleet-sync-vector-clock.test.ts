import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { VectorClockEngine } from '../src/sync/vector-clock.engine.ts';
import { EdgeFleetSyncService } from '../src/sync/fleet-sync.service.ts';
import type { PushDeltaBatchDto } from '../src/sync/fleet-sync.service.ts';

describe('Phase 7: Multi-Branch Edge Fleet Sync & Vector Clocks Concurrency Test Suite', () => {
  let syncService: EdgeFleetSyncService;

  beforeEach(() => {
    syncService = new EdgeFleetSyncService();
  });

  describe('1. Vector Clock Engine Causality & Ordering Math', () => {
    it('should increment clock components monotonically for local nodes', () => {
      let clock: Record<string, number> = { 'EDGE-PP-0042': 0, 'CLOUD-HQ': 5 };

      clock = VectorClockEngine.increment(clock, 'EDGE-PP-0042');
      assert.equal(clock['EDGE-PP-0042'], 1);
      assert.equal(clock['CLOUD-HQ'], 5);

      clock = VectorClockEngine.increment(clock, 'EDGE-PP-0042');
      assert.equal(clock['EDGE-PP-0042'], 2);

      clock = VectorClockEngine.increment(clock, 'EDGE-SR-0018');
      assert.equal(clock['EDGE-SR-0018'], 1);
    });

    it('should merge two vector clocks taking the maximum value across all known nodes', () => {
      const clockA = { 'CLOUD-HQ': 10, 'EDGE-PP-0042': 4, 'EDGE-SR-0018': 2 };
      const clockB = { 'CLOUD-HQ': 8, 'EDGE-PP-0042': 6, 'EDGE-BTB-0007': 5 };

      const merged = VectorClockEngine.merge(clockA, clockB);

      assert.equal(merged['CLOUD-HQ'], 10);
      assert.equal(merged['EDGE-PP-0042'], 6);
      assert.equal(merged['EDGE-SR-0018'], 2);
      assert.equal(merged['EDGE-BTB-0007'], 5);
    });

    it('should accurately evaluate causal relationship: BEFORE, AFTER, EQUAL, and CONCURRENT', () => {
      // Case 1: Identical clocks -> EQUAL
      const clock1 = { 'CLOUD-HQ': 5, 'EDGE-PP-0042': 3 };
      const clock2 = { 'CLOUD-HQ': 5, 'EDGE-PP-0042': 3 };
      assert.equal(VectorClockEngine.compare(clock1, clock2), 'EQUAL');

      // Case 2: Causal Predecessor -> BEFORE
      const clockBefore = { 'CLOUD-HQ': 5, 'EDGE-PP-0042': 2 };
      assert.equal(VectorClockEngine.compare(clockBefore, clock1), 'BEFORE');

      // Case 3: Causal Successor -> AFTER
      const clockAfter = { 'CLOUD-HQ': 6, 'EDGE-PP-0042': 4 };
      assert.equal(VectorClockEngine.compare(clockAfter, clock1), 'AFTER');

      // Case 4: Concurrent Divergence -> CONCURRENT (Branch PP has 4, Branch SR has 6 while PP is behind on SR)
      const clockBranchA = { 'CLOUD-HQ': 5, 'EDGE-PP-0042': 4, 'EDGE-SR-0018': 1 };
      const clockBranchB = { 'CLOUD-HQ': 5, 'EDGE-PP-0042': 2, 'EDGE-SR-0018': 3 };
      assert.equal(VectorClockEngine.compare(clockBranchA, clockBranchB), 'CONCURRENT');
      assert.equal(VectorClockEngine.compare(clockBranchB, clockBranchA), 'CONCURRENT');
    });
  });

  describe('2. Wire Protocol, Compression & HMAC-SHA256 Transport Security', () => {
    it('should generate valid HMAC-SHA256 signature and reject forged or tampered sync packets', () => {
      const dto: PushDeltaBatchDto = {
        protocolVersion: '1.0.0',
        sourceNodeId: 'EDGE-PP-0042',
        targetNodeId: 'CLOUD-HQ',
        batchSequenceId: 'BATCH-PP-2026-001',
        timestampUtc: new Date().toISOString(),
        compressedPayloadBase64: Buffer.from('test-payload').toString('base64'),
        merkleBatchRootHash: 'hash-abc',
      };

      const validSig = syncService.createTransportHmac(dto);
      assert.ok(validSig.length === 64, 'HMAC-SHA256 must be a 64-char hex string');

      // Verification of authentic payload
      assert.equal(syncService.verifyTransportHmac(dto, validSig), true);

      // Tampered payload must be rejected
      const tamperedDto = { ...dto, compressedPayloadBase64: Buffer.from('corrupted').toString('base64') };
      assert.equal(syncService.verifyTransportHmac(tamperedDto, validSig), false);

      // Forged signature must be rejected
      assert.equal(syncService.verifyTransportHmac(dto, 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'), false);
    });

    it('should round-trip compress with Brotli and verify Merkle batch root hash', async () => {
      syncService.setLocalNodeId('EDGE-PP-0042');

      // Queue 3 clinical mutations
      syncService.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: 'PT-KHM-99120',
        mutationType: 'INSERT',
        payload: { fullNameKh: 'ជា សុខា', phone: '012889911', nationalId: 'KHM-199201992' },
      });

      syncService.queueOutboxMutation({
        entityType: 'ENCOUNTER',
        entityId: 'ENC-2026-001',
        mutationType: 'INSERT',
        payload: { chiefComplaint: 'Acute fever with headache', diagnosisIcd11: '1D00' },
      });

      syncService.queueOutboxMutation({
        entityType: 'STOCK_DELTA',
        entityId: 'MOH-NAR-001',
        mutationType: 'UPDATE',
        payload: { branchId: 'EDGE-PP-0042', delta: 50 },
      });

      const batchDto = syncService.buildDeltaBatchEnvelope('CLOUD-HQ');
      assert.equal(batchDto.sourceNodeId, 'EDGE-PP-0042');
      assert.ok(batchDto.compressedPayloadBase64.length > 0);
      assert.ok(batchDto.merkleBatchRootHash.length === 64);

      // Cloud HQ ingests the batch
      const cloudService = new EdgeFleetSyncService();
      cloudService.setLocalNodeId('CLOUD-HQ');

      const response = await cloudService.processIncomingDeltaBatch(batchDto);
      assert.equal(response.accepted, true);
      assert.equal(response.appliedCount, 3);
      assert.equal(response.acknowledgedSequenceId, batchDto.batchSequenceId);

      // Verify that cloud received the patient record
      const syncedPatient = cloudService.getPatientRecord('PT-KHM-99120');
      assert.ok(syncedPatient);
      assert.equal(syncedPatient.fullNameKh, 'ជា សុខា');
    });
  });

  describe('3. Domain-Specific CRDT Conflict Resolution', () => {
    it('should resolve patient demographic conflicts via Multi-Value LWW per attribute', async () => {
      const patientId = 'PT-KHM-MULTI-01';

      // Initial state at Central Cloud
      syncService.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: patientId,
        mutationType: 'INSERT',
        payload: {
          fullNameKh: 'ទូច ចាន់ណា',
          phoneNumber: '012334455',
          addressCity: 'Phnom Penh',
        },
      });

      // Branch A (Siem Reap) concurrently updates phone number
      const branchAService = new EdgeFleetSyncService();
      branchAService.setLocalNodeId('EDGE-SR-0018');
      branchAService.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: patientId,
        mutationType: 'UPDATE',
        payload: { phoneNumber: '098112233' },
      });

      // Branch B (Battambang) concurrently updates address
      const branchBService = new EdgeFleetSyncService();
      branchBService.setLocalNodeId('EDGE-BTB-0007');
      branchBService.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: patientId,
        mutationType: 'UPDATE',
        payload: { addressCity: 'Battambang Central' },
      });

      // Central Cloud receives Branch A then Branch B
      const batchA = branchAService.buildDeltaBatchEnvelope('CLOUD-HQ');
      const batchB = branchBService.buildDeltaBatchEnvelope('CLOUD-HQ');

      await syncService.processIncomingDeltaBatch(batchA);
      await syncService.processIncomingDeltaBatch(batchB);

      // Merged patient must preserve BOTH non-conflicting attribute updates!
      const finalPatient = syncService.getPatientRecord(patientId);
      assert.ok(finalPatient);
      assert.equal(finalPatient.fullNameKh, 'ទូច ចាន់ណា', 'Name preserved');
      assert.equal(finalPatient.phoneNumber, '098112233', 'Phone updated from Branch A');
      assert.equal(finalPatient.addressCity, 'Battambang Central', 'Address updated from Branch B');
    });

    it('should preserve concurrent clinical encounters using Add-Wins OR-Set revision branching without silent overwrites', async () => {
      const encounterId = 'ENC-CHRONIC-CARE-901';

      // Branch A doctor records clinical notes
      const branchA = new EdgeFleetSyncService();
      branchA.setLocalNodeId('EDGE-PP-0042');
      branchA.queueOutboxMutation({
        entityType: 'ENCOUNTER',
        entityId: encounterId,
        mutationType: 'INSERT',
        payload: {
          doctorName: 'Dr. Heng Bunna',
          clinicalNote: 'Hypertension Stage 2 noted; Amlodipine 5mg prescribed',
        },
      });

      // Branch B doctor concurrently records follow-up observations
      const branchB = new EdgeFleetSyncService();
      branchB.setLocalNodeId('EDGE-SR-0018');
      branchB.queueOutboxMutation({
        entityType: 'ENCOUNTER',
        entityId: encounterId,
        mutationType: 'INSERT',
        payload: {
          doctorName: 'Dr. Tep Somally',
          clinicalNote: 'Patient reports mild ankle edema; ordered renal panel',
        },
      });

      // Cloud merges both concurrent records
      const cloud = new EdgeFleetSyncService();
      cloud.setLocalNodeId('CLOUD-HQ');

      await cloud.processIncomingDeltaBatch(branchA.buildDeltaBatchEnvelope('CLOUD-HQ'));
      await cloud.processIncomingDeltaBatch(branchB.buildDeltaBatchEnvelope('CLOUD-HQ'));

      const branches = cloud.getEncounterBranches(encounterId);
      assert.equal(branches.length, 2, 'Must maintain both clinical revision branches without clobbering');

      const doctors = branches.map((b) => b.doctorName);
      assert.ok(doctors.includes('Dr. Heng Bunna'));
      assert.ok(doctors.includes('Dr. Tep Somally'));

      // The second concurrent branch must be flagged for medical review
      const concurrentBranch = branches.find((b) => b.isConcurrentRevisionBranch);
      assert.ok(concurrentBranch, 'Concurrent divergence must be flagged as revision branch');
      assert.equal(concurrentBranch.requiresMedicalReview, true);
    });

    it('should maintain PN-Counter commutative stock balance during asynchronous concurrent multi-branch dispensations', () => {
      const substanceCode = 'MOH-NAR-001'; // Morphine Sulfate 10mg

      // Initial Central stock: 100 units at Phnom Penh branch
      syncService.queueOutboxMutation({
        entityType: 'STOCK_DELTA',
        entityId: substanceCode,
        mutationType: 'UPDATE',
        payload: { branchId: 'EDGE-PP-0042', delta: 100 },
      });

      assert.equal(syncService.getAggregateStockBalance(substanceCode, 'EDGE-PP-0042'), 100);

      // Transfer 30 units from Phnom Penh to Siem Reap
      const transferResult = syncService.transferStockBetweenBranches({
        substanceCode,
        fromBranchId: 'EDGE-PP-0042',
        toBranchId: 'EDGE-SR-0018',
        quantity: 30,
        witnessStaffId: 'STF-PHARM-991',
      });

      assert.equal(transferResult.success, true);
      assert.equal(syncService.getAggregateStockBalance(substanceCode, 'EDGE-PP-0042'), 70);
      assert.equal(syncService.getAggregateStockBalance(substanceCode, 'EDGE-SR-0018'), 30);
      assert.equal(syncService.getAggregateStockBalance(substanceCode), 100, 'Total network inventory conserved');

      // Attempting to transfer more than available stock throws
      assert.throws(
        () => {
          syncService.transferStockBetweenBranches({
            substanceCode,
            fromBranchId: 'EDGE-SR-0018',
            toBranchId: 'EDGE-BTB-0007',
            quantity: 50, // Available is only 30!
            witnessStaffId: 'STF-PHARM-991',
          });
        },
        /Insufficient inventory/,
      );

      // Attempting transfer with zero or negative quantity throws
      assert.throws(
        () => {
          syncService.transferStockBetweenBranches({
            substanceCode,
            fromBranchId: 'EDGE-SR-0018',
            toBranchId: 'EDGE-BTB-0007',
            quantity: 0,
            witnessStaffId: 'STF-PHARM-991',
          });
        },
        /strictly greater than zero/i,
      );

      // Attempting transfer between identical source and target branch throws
      assert.throws(
        () => {
          syncService.transferStockBetweenBranches({
            substanceCode,
            fromBranchId: 'EDGE-SR-0018',
            toBranchId: 'EDGE-SR-0018',
            quantity: 10,
            witnessStaffId: 'STF-PHARM-991',
          });
        },
        /cannot be identical/i,
      );
    });
  });

  describe('4. Network Partition Simulation & Split-Brain Reconciliation', () => {
    it('should simulate network partition between two branch edge nodes and reconcile split-brain concurrent mutations', async () => {
      const patientId = 'PT-KHM-SPLITBRAIN-001';

      // 1. Initial Synchronized State at Cloud HQ
      syncService.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: patientId,
        mutationType: 'INSERT',
        payload: {
          fullNameKh: 'កែវ សាមណាង',
          emergencyContactPhone: '012999888',
          bloodType: 'O',
          allergies: 'Penicillin',
        },
      });

      // 2. Network Partition Event: Both branches go offline / PARTITIONED
      const branchA = new EdgeFleetSyncService();
      branchA.setLocalNodeId('EDGE-PP-0042');
      const nodeA = branchA.getNode('EDGE-PP-0042');
      if (nodeA) nodeA.status = 'PARTITIONED';

      const branchB = new EdgeFleetSyncService();
      branchB.setLocalNodeId('EDGE-SR-0018');
      const nodeB = branchB.getNode('EDGE-SR-0018');
      if (nodeB) nodeB.status = 'PARTITIONED';

      // 3. Isolated Mutations occur while partitioned (Split-Brain)
      // Branch A updates emergency contact phone and notes
      branchA.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: patientId,
        mutationType: 'UPDATE',
        payload: {
          emergencyContactPhone: '012111222',
          clinicNotes: 'Patient visited Toul Kork branch for acute asthma',
        },
      });

      // Branch B concurrently updates emergency contact phone and chronic condition
      branchB.queueOutboxMutation({
        entityType: 'PATIENT',
        entityId: patientId,
        mutationType: 'UPDATE',
        payload: {
          emergencyContactPhone: '012333444',
          chronicCondition: 'Mild Asthma',
        },
      });

      // 4. Network Restored: Cloud HQ ingests Branch A first, then Branch B
      const batchA = branchA.buildDeltaBatchEnvelope('CLOUD-HQ');
      const batchB = branchB.buildDeltaBatchEnvelope('CLOUD-HQ');

      const responseA = await syncService.processIncomingDeltaBatch(batchA);
      assert.equal(responseA.accepted, true);
      assert.ok(responseA.appliedCount >= 1);

      // Ingesting Branch B detects split-brain divergence against local clock
      const responseB = await syncService.processIncomingDeltaBatch(batchB);
      assert.equal(responseB.accepted, true);
      assert.ok(responseB.conflictsResolvedCount >= 1, 'Split-brain conflict detected and resolved via CRDT');

      // 5. Verification of Merged State
      const mergedPatient = syncService.getPatientRecord(patientId);
      assert.ok(mergedPatient);
      assert.equal(mergedPatient.fullNameKh, 'កែវ សាមណាង', 'Original identity preserved');
      assert.equal(mergedPatient.allergies, 'Penicillin', 'Allergies preserved');
      assert.equal(mergedPatient.clinicNotes, 'Patient visited Toul Kork branch for acute asthma', 'Field from Branch A preserved');
      assert.equal(mergedPatient.chronicCondition, 'Mild Asthma', 'Field from Branch B preserved');
      assert.ok(mergedPatient.emergencyContactPhone === '012111222' || mergedPatient.emergencyContactPhone === '012333444');

      // 6. Verification that Cloud HQ vector clock merged both branches
      const cloudClock = syncService.getLocalVectorClock();
      assert.ok(cloudClock['EDGE-PP-0042'] >= 1, 'Clock includes Branch A');
      assert.ok(cloudClock['EDGE-SR-0018'] >= 1, 'Clock includes Branch B');

      // 7. Verification that node status recovers to ONLINE upon successful sync
      const remoteNodeB = syncService.getNode('EDGE-SR-0018');
      assert.equal(remoteNodeB?.status, 'ONLINE');
    });
  });

  describe('5. Cluster Health, MoH Facility Codes & Strict Compliance', () => {
    it('should report cluster health status with vector clocks and active node counts', () => {
      const health = syncService.getClusterHealthStatus();
      assert.equal(health.status, 'ONLINE');
      assert.equal(health.localNodeId, 'CLOUD-HQ');
      assert.ok(health.registeredNodesCount >= 4);
      assert.ok(health.activeNodesCount >= 4);
      assert.equal(typeof health.vectorClock, 'object');
    });

    it('should retrieve multi-branch stock balances and trigger cluster sync sweep', () => {
      const balances = syncService.getAllStockBalances();
      assert.ok(balances.length >= 4, 'Should return at least 4 default items');
      const fent = balances.find((b) => b.substanceCode === 'NAR-FENT-001');
      assert.ok(fent);
      assert.ok(fent.totalBalance > 0);
      assert.equal(typeof fent.branchBreakdown['CLOUD-HQ'], 'number');

      const sweep = syncService.triggerClusterSyncSweep();
      assert.equal(sweep.status, 'SYNCHRONIZED');
      assert.ok(sweep.nodesSwept >= 4);
      assert.ok(Object.keys(sweep.synchronizedVectorClock).length >= 4);
    });

    it('should comply with MoH Health Facility HF-MOH hierarchy codes', () => {
      const nodes = syncService.getAllNodes();
      for (const node of nodes) {
        assert.ok(node.facilityCode.startsWith('HF-MOH-'), `Facility code ${node.facilityCode} must follow MoH standard`);
      }
    });

    it('should guarantee zero emojis and zero parentheses in Khmer text across all fleet nodes and records', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
      const nodes = syncService.getAllNodes();

      for (const node of nodes) {
        assert.equal(emojiRegex.test(node.facilityNameKh), false);
        assert.equal(emojiRegex.test(node.facilityNameEn), false);
        assert.equal(
          node.facilityNameKh.includes('(') || node.facilityNameKh.includes(')'),
          false,
          `Khmer name "${node.facilityNameKh}" must not contain parentheses`,
        );
      }
    });
  });
});
