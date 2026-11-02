import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { VectorClockEngine } from './vector-clock.engine.ts';

export type SyncEntityType = 'PATIENT' | 'ENCOUNTER' | 'PRESCRIPTION' | 'STOCK_DELTA';
export type SyncMutationType = 'INSERT' | 'UPDATE' | 'DELETE_TOMBSTONE';
export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'PARTITIONED';

export interface SyncNode {
  nodeId: string;
  facilityCode: string; // MoH HF Code: HF-MOH-1205-0042
  facilityNameKh: string;
  facilityNameEn: string;
  role: 'CLOUD_HQ' | 'PROVINCIAL_EDGE' | 'DISTRICT_EDGE' | 'MOBILE_EDGE';
  status: NodeStatus;
  lastSeenUtc: string;
  vectorClock: Record<string, number>;
}

export interface OutboxMutation {
  id: string;
  sequenceNumber: number;
  sourceNodeId: string;
  entityType: SyncEntityType;
  entityId: string;
  mutationType: SyncMutationType;
  payload: Record<string, any>;
  vectorClock: Record<string, number>;
  lamportTime: number; // WallClockUtcMs * 1000 + nodeRank
  createdAt: string;
  syncStatus: 'PENDING' | 'IN_FLIGHT' | 'ACKNOWLEDGED' | 'FAILED';
}

export interface PushDeltaBatchDto {
  protocolVersion: string;
  sourceNodeId: string;
  targetNodeId: string;
  batchSequenceId: string;
  timestampUtc: string;
  compressedPayloadBase64: string;
  merkleBatchRootHash: string;
}

export interface PushDeltaBatchResponse {
  accepted: boolean;
  acknowledgedSequenceId: string;
  appliedCount: number;
  conflictsResolvedCount: number;
  updatedVectorClock: Record<string, number>;
  serverTimestampUtc: string;
}

export interface PullDeltaRequestDto {
  sourceNodeId: string;
  targetNodeId: string;
  currentKnownClock: Record<string, number>;
  batchLimit?: number;
}

export const NODE_RANK_HIERARCHY: Record<string, number> = {
  'CLOUD-HQ': 100,
  'EDGE-PP-0042': 80,
  'EDGE-SR-0018': 60,
  'EDGE-BTB-0007': 40,
  'MOBILE-EDGE-01': 20,
};

export class EdgeFleetSyncService {
  private localNodeId: string = 'CLOUD-HQ';
  private localVectorClock: Record<string, number> = { 'CLOUD-HQ': 0 };
  private sharedSecretKey: string = 'MOH-EDGE-SECURE-KEY-2026';

  // State Repositories
  private nodes: Map<string, SyncNode> = new Map();
  private outboxJournal: OutboxMutation[] = [];
  private receivedBatchSequences: Set<string> = new Set();

  // Local Operational Entity Stores
  private patientsStore: Map<string, Record<string, any>> = new Map();
  private encountersStore: Map<string, Record<string, any>[]> = new Map(); // Multiple revision branches
  private stockBalances: Map<string, { [branchId: string]: { positive: number; negative: number } }> = new Map();

  constructor() {
    this.initializeDefaultClusterNodes();
  }

  private initializeDefaultClusterNodes(): void {
    const defaultNodes: SyncNode[] = [
      {
        nodeId: 'CLOUD-HQ',
        facilityCode: 'HF-MOH-1200-0001',
        facilityNameKh: 'ទីស្នាក់ការកណ្តាលពពកភ្នំពេញ',
        facilityNameEn: 'Phnom Penh Central Cloud Headquarters',
        role: 'CLOUD_HQ',
        status: 'ONLINE',
        lastSeenUtc: new Date().toISOString(),
        vectorClock: { 'CLOUD-HQ': 0 },
      },
      {
        nodeId: 'EDGE-PP-0042',
        facilityCode: 'HF-MOH-1205-0042',
        facilityNameKh: 'មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រទួលគោកភ្នំពេញ',
        facilityNameEn: 'Toul Kork Medical Center Edge Phnom Penh',
        role: 'PROVINCIAL_EDGE',
        status: 'ONLINE',
        lastSeenUtc: new Date().toISOString(),
        vectorClock: { 'EDGE-PP-0042': 0 },
      },
      {
        nodeId: 'EDGE-SR-0018',
        facilityCode: 'HF-MOH-1701-0018',
        facilityNameKh: 'មន្ទីរពេទ្យបង្អែកខេត្តសៀមរាប',
        facilityNameEn: 'Siem Reap Provincial Referral Hospital Edge',
        role: 'PROVINCIAL_EDGE',
        status: 'ONLINE',
        lastSeenUtc: new Date().toISOString(),
        vectorClock: { 'EDGE-SR-0018': 0 },
      },
      {
        nodeId: 'EDGE-BTB-0007',
        facilityCode: 'HF-MOH-0201-0007',
        facilityNameKh: 'គ្លីនិកពហុព្យាបាលបាត់ដំបង',
        facilityNameEn: 'Battambang Polyclinic Edge Node',
        role: 'DISTRICT_EDGE',
        status: 'ONLINE',
        lastSeenUtc: new Date().toISOString(),
        vectorClock: { 'EDGE-BTB-0007': 0 },
      },
    ];

    for (const n of defaultNodes) {
      this.nodes.set(n.nodeId, n);
    }

    // Initialize default pharmaceutical inventory across nodes for PN-Counter CRDT
    const initialStocks = [
      {
        code: 'NAR-FENT-001',
        allocations: { 'CLOUD-HQ': 250, 'EDGE-PP-0042': 120, 'EDGE-SR-0018': 80, 'EDGE-BTB-0007': 45 },
      },
      {
        code: 'NAR-MORPH-002',
        allocations: { 'CLOUD-HQ': 500, 'EDGE-PP-0042': 200, 'EDGE-SR-0018': 150, 'EDGE-BTB-0007': 60 },
      },
      {
        code: 'MED-PROP-003',
        allocations: { 'CLOUD-HQ': 600, 'EDGE-PP-0042': 300, 'EDGE-SR-0018': 200, 'EDGE-BTB-0007': 100 },
      },
      {
        code: 'NAR-DIAZ-004',
        allocations: { 'CLOUD-HQ': 400, 'EDGE-PP-0042': 180, 'EDGE-SR-0018': 110, 'EDGE-BTB-0007': 70 },
      },
    ];

    for (const item of initialStocks) {
      const drugMap: { [branchId: string]: { positive: number; negative: number } } = {};
      for (const [branchId, qty] of Object.entries(item.allocations)) {
        drugMap[branchId] = { positive: qty, negative: 0 };
      }
      this.stockBalances.set(item.code, drugMap);
    }
  }

  public setLocalNodeId(nodeId: string): void {
    this.localNodeId = nodeId;
    if (!this.localVectorClock[nodeId]) {
      this.localVectorClock[nodeId] = 0;
    }
  }

  public getLocalNodeId(): string {
    return this.localNodeId;
  }

  public getLocalVectorClock(): Record<string, number> {
    return VectorClockEngine.clone(this.localVectorClock);
  }

  public registerNode(node: SyncNode): void {
    this.nodes.set(node.nodeId, node);
  }

  public getNode(nodeId: string): SyncNode | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodes(): SyncNode[] {
    return Array.from(this.nodes.values());
  }

  public setSharedSecretKey(key: string): void {
    this.sharedSecretKey = key;
  }

  /**
   * Cryptographic HMAC-SHA256 Transport Authentication Seal
   */
  public createTransportHmac(dto: PushDeltaBatchDto, secretKey?: string): string {
    const key = secretKey || this.sharedSecretKey;
    const raw = `${dto.sourceNodeId}|${dto.targetNodeId}|${dto.batchSequenceId}|${dto.compressedPayloadBase64}`;
    return crypto.createHmac('sha256', key).update(raw).digest('hex');
  }

  public verifyTransportHmac(dto: PushDeltaBatchDto, signature: string, secretKey?: string): boolean {
    if (!signature) return false;
    const expected = this.createTransportHmac(dto, secretKey);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return signature === expected;
    }
  }

  /**
   * Compute Merkle Batch Root Hash
   */
  public computeMerkleRoot(mutations: any[]): string {
    if (mutations.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_MERKLE_BATCH').digest('hex');
    }

    const hashes = mutations.map((m) =>
      crypto
        .createHash('sha256')
        .update(JSON.stringify(m))
        .digest('hex'),
    );

    let currentLevel = hashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const combined = currentLevel[i] + currentLevel[i + 1];
          nextLevel.push(crypto.createHash('sha256').update(combined).digest('hex'));
        } else {
          nextLevel.push(currentLevel[i]);
        }
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Queue local mutation into Outbox Journal and advance local vector clock
   */
  public queueOutboxMutation(params: {
    entityType: SyncEntityType;
    entityId: string;
    mutationType: SyncMutationType;
    payload: Record<string, any>;
  }): OutboxMutation {
    // 1. Advance local vector clock
    this.localVectorClock = VectorClockEngine.increment(this.localVectorClock, this.localNodeId);

    // 2. Compute Lamport Timestamp: (WallClockUtcMs * 1000) + NodeRank
    const rank = NODE_RANK_HIERARCHY[this.localNodeId] || 10;
    const lamportTime = Date.now() * 1000 + rank;

    const sequenceNumber = this.outboxJournal.length + 1;
    const mutation: OutboxMutation = {
      id: `MUT-${this.localNodeId}-${Date.now()}-${sequenceNumber}`,
      sequenceNumber,
      sourceNodeId: this.localNodeId,
      entityType: params.entityType,
      entityId: params.entityId,
      mutationType: params.mutationType,
      payload: { ...params.payload },
      vectorClock: VectorClockEngine.clone(this.localVectorClock),
      lamportTime,
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    this.outboxJournal.push(mutation);

    // Also apply locally to operational store
    this.applyMutationLocally(mutation);

    return mutation;
  }

  private applyMutationLocally(mutation: OutboxMutation): void {
    if (mutation.entityType === 'PATIENT') {
      const existing = this.patientsStore.get(mutation.entityId) || {};
      this.patientsStore.set(mutation.entityId, { ...existing, ...mutation.payload });
    } else if (mutation.entityType === 'ENCOUNTER') {
      const branches = this.encountersStore.get(mutation.entityId) || [];
      branches.push({ ...mutation.payload, vectorClock: mutation.vectorClock, branchSource: mutation.sourceNodeId });
      this.encountersStore.set(mutation.entityId, branches);
    } else if (mutation.entityType === 'STOCK_DELTA') {
      this.applyStockDelta(mutation.entityId, mutation.payload);
    }
  }

  /**
   * Build compressed delta batch envelope for wire transmission
   */
  public buildDeltaBatchEnvelope(targetNodeId: string): PushDeltaBatchDto {
    const pendingMutations = this.outboxJournal.filter((m) => m.syncStatus === 'PENDING');
    const rawPayload = JSON.stringify({ mutations: pendingMutations });
    const compressedBuffer = zlib.brotliCompressSync(Buffer.from(rawPayload, 'utf-8'));
    const compressedPayloadBase64 = compressedBuffer.toString('base64');
    const merkleBatchRootHash = this.computeMerkleRoot(pendingMutations);
    const batchSequenceId = `BATCH-${this.localNodeId}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const dto: PushDeltaBatchDto = {
      protocolVersion: '1.0.0',
      sourceNodeId: this.localNodeId,
      targetNodeId,
      batchSequenceId,
      timestampUtc: new Date().toISOString(),
      compressedPayloadBase64,
      merkleBatchRootHash,
    };

    return dto;
  }

  /**
   * Process incoming delta batch from remote branch edge node
   */
  public async processIncomingDeltaBatch(dto: PushDeltaBatchDto): Promise<PushDeltaBatchResponse> {
    // 1. Decompress payload
    let decompressedJson: string;
    try {
      const compressedBuffer = Buffer.from(dto.compressedPayloadBase64, 'base64');
      decompressedJson = zlib.brotliDecompressSync(compressedBuffer).toString('utf-8');
    } catch {
      // Fallback gzip or raw json
      try {
        const compressedBuffer = Buffer.from(dto.compressedPayloadBase64, 'base64');
        decompressedJson = zlib.gunzipSync(compressedBuffer).toString('utf-8');
      } catch {
        decompressedJson = Buffer.from(dto.compressedPayloadBase64, 'base64').toString('utf-8');
      }
    }

    const payload = JSON.parse(decompressedJson);
    const incomingMutations: OutboxMutation[] = payload.mutations || [];

    // Verify Merkle Root
    const computedRoot = this.computeMerkleRoot(incomingMutations);
    if (computedRoot !== dto.merkleBatchRootHash) {
      throw new Error(`Merkle root hash mismatch on batch ${dto.batchSequenceId}: Integrity violation`);
    }

    // Duplicate check
    if (this.receivedBatchSequences.has(dto.batchSequenceId)) {
      return {
        accepted: true,
        acknowledgedSequenceId: dto.batchSequenceId,
        appliedCount: 0,
        conflictsResolvedCount: 0,
        updatedVectorClock: VectorClockEngine.clone(this.localVectorClock),
        serverTimestampUtc: new Date().toISOString(),
      };
    }
    this.receivedBatchSequences.add(dto.batchSequenceId);

    let appliedCount = 0;
    let conflictsResolvedCount = 0;

    for (const mutation of incomingMutations) {
      const comparison = VectorClockEngine.compare(mutation.vectorClock, this.localVectorClock);

      if (comparison === 'BEFORE' || comparison === 'EQUAL') {
        // Causally superseded or already integrated
        continue;
      }

      if (comparison === 'CONCURRENT') {
        // Concurrent divergence: Trigger domain-specific CRDT conflict resolution
        conflictsResolvedCount++;
        this.resolveDomainConflict(mutation);
      } else {
        // 'AFTER': Causal successor, apply cleanly
        this.applyDirectMutation(mutation);
      }

      appliedCount++;
      // Advance local vector clock by merging incoming clock
      this.localVectorClock = VectorClockEngine.merge(this.localVectorClock, mutation.vectorClock);
    }

    // Advance local component on batch acceptance
    this.localVectorClock = VectorClockEngine.increment(this.localVectorClock, this.localNodeId);

    // Update remote node heartbeat
    const sourceNode = this.nodes.get(dto.sourceNodeId);
    if (sourceNode) {
      sourceNode.lastSeenUtc = new Date().toISOString();
      sourceNode.status = 'ONLINE';
      sourceNode.vectorClock = VectorClockEngine.merge(sourceNode.vectorClock, this.localVectorClock);
    }

    return {
      accepted: true,
      acknowledgedSequenceId: dto.batchSequenceId,
      appliedCount,
      conflictsResolvedCount,
      updatedVectorClock: VectorClockEngine.clone(this.localVectorClock),
      serverTimestampUtc: new Date().toISOString(),
    };
  }

  /**
   * Domain-Specific CRDT Conflict Resolution
   */
  private resolveDomainConflict(mutation: OutboxMutation): void {
    if (mutation.entityType === 'PATIENT') {
      // 1. Patient Demographics: Multi-Value LWW-Register per attribute
      const existing = this.patientsStore.get(mutation.entityId) || {};
      const merged = { ...existing };

      for (const [key, value] of Object.entries(mutation.payload)) {
        const existingTimestamp = existing[`_ts_${key}`] || 0;
        const incomingTimestamp = mutation.lamportTime;

        if (incomingTimestamp >= existingTimestamp) {
          merged[key] = value;
          merged[`_ts_${key}`] = incomingTimestamp;
        }
      }
      this.patientsStore.set(mutation.entityId, merged);
    } else if (mutation.entityType === 'ENCOUNTER') {
      // 2. Clinical Encounters: Add-Wins Set (OR-Set) - creates separate branch
      const branches = this.encountersStore.get(mutation.entityId) || [];
      branches.push({
        ...mutation.payload,
        vectorClock: mutation.vectorClock,
        branchSource: mutation.sourceNodeId,
        isConcurrentRevisionBranch: true,
        requiresMedicalReview: true,
        reconciledTimestamp: new Date().toISOString(),
      });
      this.encountersStore.set(mutation.entityId, branches);
    } else if (mutation.entityType === 'STOCK_DELTA') {
      // 3. Pharmacy Stock Delta: Commutative PN-Counter CRDT
      this.applyStockDelta(mutation.entityId, mutation.payload);
    }
  }

  private applyDirectMutation(mutation: OutboxMutation): void {
    if (mutation.entityType === 'PATIENT') {
      const existing = this.patientsStore.get(mutation.entityId) || {};
      const updated = { ...existing, ...mutation.payload };
      for (const key of Object.keys(mutation.payload)) {
        updated[`_ts_${key}`] = mutation.lamportTime;
      }
      this.patientsStore.set(mutation.entityId, updated);
    } else if (mutation.entityType === 'ENCOUNTER') {
      const branches = this.encountersStore.get(mutation.entityId) || [];
      branches.push({
        ...mutation.payload,
        vectorClock: mutation.vectorClock,
        branchSource: mutation.sourceNodeId,
      });
      this.encountersStore.set(mutation.entityId, branches);
    } else if (mutation.entityType === 'STOCK_DELTA') {
      this.applyStockDelta(mutation.entityId, mutation.payload);
    }
  }

  /**
   * Positive-Negative Counter (PN-Counter) Commutative Inventory Math
   */
  private applyStockDelta(substanceCode: string, payload: { branchId: string; delta: number }): void {
    const branchId = payload.branchId || this.localNodeId;
    let drugStock = this.stockBalances.get(substanceCode);
    if (!drugStock) {
      drugStock = {};
      this.stockBalances.set(substanceCode, drugStock);
    }

    if (!drugStock[branchId]) {
      drugStock[branchId] = { positive: 0, negative: 0 };
    }

    if (payload.delta >= 0) {
      drugStock[branchId].positive += payload.delta;
    } else {
      drugStock[branchId].negative += Math.abs(payload.delta);
    }
  }

  /**
   * Inter-branch stock transfer ledger reconciliation without double-counting or negative inventory
   */
  public transferStockBetweenBranches(params: {
    substanceCode: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    witnessStaffId: string;
  }): { success: boolean; newBalanceFrom: number; newBalanceTo: number; transferTransactionId: string } {
    if (params.fromBranchId === params.toBranchId) {
      throw new Error('Statutory violation: Source and target branches cannot be identical');
    }

    if (params.quantity <= 0) {
      throw new Error('Transfer quantity must be strictly greater than zero');
    }

    const currentFromBalance = this.getAggregateStockBalance(params.substanceCode, params.fromBranchId);
    if (currentFromBalance < params.quantity) {
      throw new Error(
        `Insufficient inventory at branch ${params.fromBranchId}: Requested ${params.quantity}, Available ${currentFromBalance}`,
      );
    }

    // Queue deduction on origin branch
    this.queueOutboxMutation({
      entityType: 'STOCK_DELTA',
      entityId: params.substanceCode,
      mutationType: 'UPDATE',
      payload: { branchId: params.fromBranchId, delta: -params.quantity, witness: params.witnessStaffId },
    });

    // Queue addition on destination branch
    this.queueOutboxMutation({
      entityType: 'STOCK_DELTA',
      entityId: params.substanceCode,
      mutationType: 'UPDATE',
      payload: { branchId: params.toBranchId, delta: params.quantity, witness: params.witnessStaffId },
    });

    const newFrom = this.getAggregateStockBalance(params.substanceCode, params.fromBranchId);
    const newTo = this.getAggregateStockBalance(params.substanceCode, params.toBranchId);

    return {
      success: true,
      newBalanceFrom: newFrom,
      newBalanceTo: newTo,
      transferTransactionId: `TX-TRANSFER-${Date.now()}`,
    };
  }

  public getAggregateStockBalance(substanceCode: string, branchId?: string): number {
    const drugStock = this.stockBalances.get(substanceCode);
    if (!drugStock) return 0;

    if (branchId) {
      const b = drugStock[branchId];
      if (!b) return 0;
      return Math.max(0, b.positive - b.negative);
    }

    let total = 0;
    for (const b of Object.values(drugStock)) {
      total += Math.max(0, b.positive - b.negative);
    }
    return total;
  }

  public getPatientRecord(patientId: string): Record<string, any> | undefined {
    return this.patientsStore.get(patientId);
  }

  public getEncounterBranches(encounterId: string): Record<string, any>[] {
    return this.encountersStore.get(encounterId) || [];
  }

  public getOutboxJournal(): OutboxMutation[] {
    return this.outboxJournal;
  }

  public getClusterHealthStatus(): {
    status: string;
    localNodeId: string;
    vectorClock: Record<string, number>;
    outboxPendingCount: number;
    inboxProcessedCount: number;
    registeredNodesCount: number;
    activeNodesCount: number;
  } {
    const nodes = this.getAllNodes();
    const activeNodes = nodes.filter((n) => n.status === 'ONLINE').length;

    return {
      status: 'ONLINE',
      localNodeId: this.localNodeId,
      vectorClock: VectorClockEngine.clone(this.localVectorClock),
      outboxPendingCount: this.outboxJournal.filter((m) => m.syncStatus === 'PENDING').length,
      inboxProcessedCount: this.receivedBatchSequences.size,
      registeredNodesCount: nodes.length,
      activeNodesCount: activeNodes,
    };
  }

  public getAllStockBalances(): Array<{
    substanceCode: string;
    substanceName: string;
    totalBalance: number;
    branchBreakdown: Record<string, number>;
  }> {
    const catalog: Record<string, string> = {
      'NAR-FENT-001': 'Fentanyl Citrate 50mcg/ml',
      'NAR-MORPH-002': 'Morphine Sulfate 10mg/ml',
      'MED-PROP-003': 'Propofol 1% Emulsion 20ml',
      'NAR-DIAZ-004': 'Diazepam 5mg/ml',
    };

    const results = [];
    for (const [code, name] of Object.entries(catalog)) {
      const drugStock = this.stockBalances.get(code) || {};
      const branchBreakdown: Record<string, number> = {};
      let total = 0;
      for (const [branchId, counter] of Object.entries(drugStock)) {
        const bal = Math.max(0, counter.positive - counter.negative);
        branchBreakdown[branchId] = bal;
        total += bal;
      }
      results.push({
        substanceCode: code,
        substanceName: name,
        totalBalance: total,
        branchBreakdown,
      });
    }
    return results;
  }

  public triggerClusterSyncSweep(): {
    syncTimestamp: string;
    nodesSwept: number;
    synchronizedVectorClock: Record<string, number>;
    status: string;
  } {
    for (const node of this.nodes.values()) {
      node.lastSeenUtc = new Date().toISOString();
      node.status = 'ONLINE';
      this.localVectorClock = VectorClockEngine.increment(this.localVectorClock, node.nodeId);
      node.vectorClock = VectorClockEngine.clone(this.localVectorClock);
    }
    return {
      syncTimestamp: new Date().toISOString(),
      nodesSwept: this.nodes.size,
      synchronizedVectorClock: VectorClockEngine.clone(this.localVectorClock),
      status: 'SYNCHRONIZED',
    };
  }
}
