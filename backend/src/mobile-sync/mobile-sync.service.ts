// Mobile Sync & Device Gateway Service
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { BadRequestException, Logger } from '@nestjs/common';
import {
  _typeStripping,
  MIN_SUPPORTED_APP_VERSION,
  DEFAULT_SYNC_LIMIT,
  DEFAULT_RURAL_CHUNK_SIZE,
  MAX_RURAL_CHUNK_SIZE,
} from './mobile-sync.types.ts';
import type {
  HandshakeRequestDto,
  HandshakeResponseDto,
  PullDeltaRequestDto,
  PullDeltaResponseDto,
  PushMutationsRequestDto,
  PushMutationsResponseDto,
  SyncPatientDto,
  SyncVitalSignsDto,
  SyncFormularyItemDto,
  OfflineMutationDto,
  MutationResultDto,
  RegisteredDevice,
  CausalRelation,
} from './mobile-sync.types.ts';

/**
 * Vector Clock Causality Engine for Distributed Clinical State Sync
 */
class GatewayVectorClockEngine {
  static increment(clock: Record<string, number>, nodeId: string): Record<string, number> {
    const updated = { ...(clock || {}) };
    updated[nodeId] = (updated[nodeId] || 0) + 1;
    return updated;
  }

  static merge(clockA: Record<string, number>, clockB: Record<string, number>): Record<string, number> {
    const merged: Record<string, number> = { ...(clockA || {}) };
    for (const [nodeId, count] of Object.entries(clockB || {})) {
      merged[nodeId] = Math.max(merged[nodeId] || 0, count);
    }
    return merged;
  }

  static compare(clockA: Record<string, number>, clockB: Record<string, number>): CausalRelation {
    let aHasGreater = false;
    let bHasGreater = false;
    const allKeys = new Set([...Object.keys(clockA || {}), ...Object.keys(clockB || {})]);

    for (const key of allKeys) {
      const valA = clockA?.[key] || 0;
      const valB = clockB?.[key] || 0;
      if (valA > valB) aHasGreater = true;
      if (valB > valA) bHasGreater = true;
    }

    if (aHasGreater && !bHasGreater) return 'AFTER';
    if (!aHasGreater && bHasGreater) return 'BEFORE';
    if (!aHasGreater && !bHasGreater) return 'EQUAL';
    return 'CONCURRENT';
  }
}

export class MobileSyncService {
  private readonly logger = new Logger(MobileSyncService.name);
  private readonly prisma?: any;

  // Vector clock and monotonic Lamport logical sequence
  private serverVectorClock: Record<string, number> = { SERVER: 1 };
  private serverMonotonicSequence: number = 1000;

  // In-memory repositories for high-throughput gateway caching and offline reconciliation
  private readonly registeredDevices: Map<string, RegisteredDevice> = new Map();
  private readonly patientsStore: Map<string, SyncPatientDto> = new Map();
  private readonly vitalSignsStore: Map<string, SyncVitalSignsDto> = new Map();
  private readonly formularyStore: Map<string, SyncFormularyItemDto> = new Map();
  private readonly mutationAuditLog: Array<{
    mutationId: string;
    deviceId: string;
    entityType: string;
    entityId: string;
    status: string;
    timestamp: string;
  }> = [];

  constructor(prisma?: any) {
    this.prisma = prisma;
    this.seedFormularyCatalog();
    this.seedInitialClinicalData();
  }

  /**
   * Generates next monotonic sequence counter for strict causal ordering
   */
  public getNextMonotonicSequence(): number {
    this.serverMonotonicSequence += 1;
    this.serverVectorClock = GatewayVectorClockEngine.increment(this.serverVectorClock, 'SERVER');
    return this.serverMonotonicSequence;
  }

  /**
   * Current server vector clock
   */
  public getServerVectorClock(): Record<string, number> {
    return { ...this.serverVectorClock };
  }

  /**
   * Evaluates SemVer compatibility between client app and minimum supported version.
   * Returns:
   *  1 if v1 > v2
   * -1 if v1 < v2
   *  0 if v1 == v2
   */
  public compareSemVer(v1: string, v2: string): number {
    const clean1 = (v1 || '').trim().replace(/^v/, '');
    const clean2 = (v2 || '').trim().replace(/^v/, '');
    const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
    const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length, 3);

    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Endpoint 1: Device Registration, App Version Verification, and Time Synchronization
   */
  public async handshake(dto: HandshakeRequestDto): Promise<HandshakeResponseDto> {
    if (!dto.deviceId || typeof dto.deviceId !== 'string') {
      throw new BadRequestException('deviceId is required for gateway registration');
    }
    if (!dto.appVersion || typeof dto.appVersion !== 'string') {
      throw new BadRequestException('appVersion is required for gateway registration');
    }

    // Minimum supported app version verification
    const versionComparison = this.compareSemVer(dto.appVersion, MIN_SUPPORTED_APP_VERSION);
    if (versionComparison < 0) {
      throw new BadRequestException(
        `App version ${dto.appVersion} is deprecated and unsupported. Minimum supported version is ${MIN_SUPPORTED_APP_VERSION}. Please upgrade your application.`
      );
    }

    const now = new Date();
    const serverTimeUtc = now.toISOString();
    const serverTimeMs = now.getTime();
    const syncSessionId = `SESS-${dto.deviceId}-${serverTimeMs}`;

    // Low bandwidth check for rural 2G/3G health centers
    const isLowBandwidth =
      dto.networkTier === '2G' || dto.networkTier === '3G' || dto.networkTier === 'OFFLINE';
    const recommendedChunkSize = isLowBandwidth ? DEFAULT_RURAL_CHUNK_SIZE : DEFAULT_SYNC_LIMIT;

    // Merge client vector clock if provided
    if (dto.clientVectorClock) {
      this.serverVectorClock = GatewayVectorClockEngine.merge(
        this.serverVectorClock,
        dto.clientVectorClock
      );
    }

    // Device registration / update
    const existingDevice = this.registeredDevices.get(dto.deviceId);
    const registeredDevice: RegisteredDevice = {
      deviceId: dto.deviceId,
      deviceName: dto.deviceName || existingDevice?.deviceName || 'Mobile Clinical Terminal',
      deviceModel: dto.deviceModel || existingDevice?.deviceModel || 'Unknown Device',
      osVersion: dto.osVersion || existingDevice?.osVersion || 'Unknown OS',
      appVersion: dto.appVersion,
      tenantId: dto.tenantId || existingDevice?.tenantId,
      userId: dto.userId || existingDevice?.userId,
      networkTier: dto.networkTier || existingDevice?.networkTier || '4G',
      registeredAt: existingDevice ? existingDevice.registeredAt : serverTimeUtc,
      lastHandshakeAt: serverTimeUtc,
      lastSyncAt: existingDevice?.lastSyncAt,
      vectorClock: dto.clientVectorClock || existingDevice?.vectorClock || { [dto.deviceId]: 0 },
      status: 'ACTIVE',
    };

    this.registeredDevices.set(dto.deviceId, registeredDevice);

    return {
      success: true,
      status: 'REGISTERED',
      deviceId: dto.deviceId,
      serverTimeUtc,
      serverTimeMs,
      serverVectorClock: { ...this.serverVectorClock },
      serverMonotonicSequence: this.serverMonotonicSequence,
      minSupportedVersion: MIN_SUPPORTED_APP_VERSION,
      clientAppVersion: dto.appVersion,
      isUpgradeRequired: false,
      syncSessionId,
      supportedEntities: ['PATIENT', 'VITAL_SIGNS', 'FORMULARY_ITEM'],
      heartbeatIntervalSeconds: isLowBandwidth ? 120 : 60,
      recommendedChunkSize,
      lowBandwidthOptimized: isLowBandwidth,
      message: 'Mobile client successfully registered and server time synchronized',
    };
  }

  /**
   * Endpoint 2: Low-Bandwidth Optimized Delta Sync with Cursors and Batch Chunking
   */
  public async pullDelta(dto: PullDeltaRequestDto): Promise<PullDeltaResponseDto> {
    let sinceTimeMs = 0;
    if (typeof dto.sinceTimestamp === 'number') {
      sinceTimeMs = dto.sinceTimestamp;
    } else if (typeof dto.sinceTimestamp === 'string' && dto.sinceTimestamp.trim().length > 0) {
      const parsed = Date.parse(dto.sinceTimestamp);
      sinceTimeMs = isNaN(parsed) ? 0 : parsed;
    }

    // Rural 3G/4G connectivity chunk budget calculation
    const isLowBandwidth =
      dto.lowBandwidthMode === true ||
      dto.networkTier === '2G' ||
      dto.networkTier === '3G' ||
      dto.networkTier === 'OFFLINE';

    let chunkSize = DEFAULT_SYNC_LIMIT;
    if (dto.chunkSize && dto.chunkSize > 0) {
      chunkSize = Math.min(dto.chunkSize, MAX_RURAL_CHUNK_SIZE);
    } else if (isLowBandwidth) {
      chunkSize = DEFAULT_RURAL_CHUNK_SIZE;
    } else if (dto.limit && dto.limit > 0) {
      chunkSize = dto.limit;
    }

    const now = new Date();
    const currentServerTimestamp = now.toISOString();

    // 1. Gather all updated Patients
    const updatedPatients: SyncPatientDto[] = [];
    for (const patient of this.patientsStore.values()) {
      if (dto.tenantId && patient.tenantId && patient.tenantId !== dto.tenantId) {
        continue;
      }
      const recordTimeMs = Date.parse(patient.updatedAt);
      if (recordTimeMs > sinceTimeMs) {
        updatedPatients.push(patient);
      }
    }

    // Prisma fallback if connected
    if (this.prisma && typeof (this.prisma as any).patient?.findMany === 'function') {
      try {
        const prismaPatients = await (this.prisma as any).patient.findMany({
          where: {
            ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
            updatedAt: { gt: new Date(sinceTimeMs) },
          },
          take: chunkSize * 2,
          orderBy: { updatedAt: 'asc' },
        });

        for (const p of prismaPatients) {
          const syncP: SyncPatientDto = {
            id: p.id,
            tenantId: p.tenantId || undefined,
            patientCode: p.patientCode,
            nameEn: p.nameEn,
            nameKh: p.nameKh || undefined,
            gender: p.gender,
            dob: p.dob ? p.dob.toISOString() : undefined,
            phone: p.phone,
            nationalId: p.nationalId || undefined,
            address: p.address || undefined,
            bloodType: p.bloodType || undefined,
            allergies: p.allergies || undefined,
            emergencyContactName: p.emergencyContactName || undefined,
            emergencyContactPhone: p.emergencyContactPhone || undefined,
            updatedAt: p.updatedAt.toISOString(),
            monotonicVersion: this.serverMonotonicSequence,
            vectorClock: { SERVER: 1 },
          };
          this.patientsStore.set(syncP.id, syncP);
          if (!updatedPatients.some((item) => item.id === syncP.id)) {
            updatedPatients.push(syncP);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Prisma delta patient query fallback: ${err.message}`);
      }
    }

    // 2. Gather all updated Vital Signs
    const updatedVitals: SyncVitalSignsDto[] = [];
    for (const vitals of this.vitalSignsStore.values()) {
      if (dto.tenantId && vitals.tenantId && vitals.tenantId !== dto.tenantId) {
        continue;
      }
      const recordTimeMs = Date.parse(vitals.updatedAt);
      if (recordTimeMs > sinceTimeMs) {
        updatedVitals.push(vitals);
      }
    }

    // 3. Gather all updated Formulary Items
    const updatedFormulary: SyncFormularyItemDto[] = [];
    for (const item of this.formularyStore.values()) {
      if (dto.tenantId && item.tenantId && item.tenantId !== dto.tenantId) {
        continue;
      }
      const recordTimeMs = Date.parse(item.updatedAt);
      if (recordTimeMs > sinceTimeMs) {
        updatedFormulary.push(item);
      }
    }

    // Parse cursor for low-bandwidth resumable pagination
    // Format: CURSOR-<pIndex>-<vIndex>-<fIndex>-<chunkIndex>
    let pOffset = 0;
    let vOffset = 0;
    let fOffset = 0;
    let chunkIndex = 0;

    if (dto.cursor && typeof dto.cursor === 'string' && dto.cursor.startsWith('CURSOR-')) {
      const parts = dto.cursor.replace('CURSOR-', '').split('-');
      pOffset = parseInt(parts[0], 10) || 0;
      vOffset = parseInt(parts[1], 10) || 0;
      fOffset = parseInt(parts[2], 10) || 0;
      chunkIndex = parseInt(parts[3], 10) || 0;
    }

    // Slice using sequential chunk budget across entities
    const slicedPatients: SyncPatientDto[] = [];
    const slicedVitals: SyncVitalSignsDto[] = [];
    const slicedFormulary: SyncFormularyItemDto[] = [];

    let budget = chunkSize;

    // 1. Take Patients
    if (pOffset < updatedPatients.length && budget > 0) {
      const takeP = Math.min(budget, updatedPatients.length - pOffset);
      slicedPatients.push(...updatedPatients.slice(pOffset, pOffset + takeP));
      pOffset += takeP;
      budget -= takeP;
    }

    // 2. Take Vitals
    if (vOffset < updatedVitals.length && budget > 0) {
      const takeV = Math.min(budget, updatedVitals.length - vOffset);
      slicedVitals.push(...updatedVitals.slice(vOffset, vOffset + takeV));
      vOffset += takeV;
      budget -= takeV;
    }

    // 3. Take Formulary
    if (fOffset < updatedFormulary.length && budget > 0) {
      const takeF = Math.min(budget, updatedFormulary.length - fOffset);
      slicedFormulary.push(...updatedFormulary.slice(fOffset, fOffset + takeF));
      fOffset += takeF;
      budget -= takeF;
    }

    const remainingP = Math.max(0, updatedPatients.length - pOffset);
    const remainingV = Math.max(0, updatedVitals.length - vOffset);
    const remainingF = Math.max(0, updatedFormulary.length - fOffset);
    const remainingRecordsCount = remainingP + remainingV + remainingF;

    const hasMore = remainingRecordsCount > 0;
    const nextCursor = hasMore
      ? `CURSOR-${pOffset}-${vOffset}-${fOffset}-${chunkIndex + 1}`
      : undefined;

    // Optional lightweight payload compression/stripping for low-bandwidth mode
    const finalPatients = isLowBandwidth
      ? slicedPatients.map((p) => ({
          id: p.id,
          patientCode: p.patientCode,
          nameEn: p.nameEn,
          nameKh: p.nameKh,
          gender: p.gender,
          phone: p.phone,
          bloodType: p.bloodType,
          allergies: p.allergies,
          updatedAt: p.updatedAt,
          vectorClock: p.vectorClock,
          monotonicVersion: p.monotonicVersion,
        }))
      : slicedPatients;

    const finalVitals = isLowBandwidth
      ? slicedVitals.map((v) => ({
          id: v.id,
          patientId: v.patientId,
          bloodPressure: v.bloodPressure,
          heartRate: v.heartRate,
          temperature: v.temperature,
          respiratoryRate: v.respiratoryRate,
          spO2: v.spO2,
          weightKg: v.weightKg,
          recordedAt: v.recordedAt,
          updatedAt: v.updatedAt,
          vectorClock: v.vectorClock,
          monotonicVersion: v.monotonicVersion,
        }))
      : slicedVitals;

    const finalFormulary = isLowBandwidth
      ? slicedFormulary.map((f) => ({
          id: f.id,
          code: f.code,
          nameEn: f.nameEn,
          nameKh: f.nameKh,
          genericName: f.genericName,
          dosageForm: f.dosageForm,
          strength: f.strength,
          category: f.category,
          unitPriceKhr: f.unitPriceKhr,
          unitPriceUsd: f.unitPriceUsd,
          isInStock: f.isInStock,
          stockQuantity: f.stockQuantity,
          updatedAt: f.updatedAt,
          vectorClock: f.vectorClock,
          monotonicVersion: f.monotonicVersion,
        }))
      : slicedFormulary;

    // Approximate JSON payload size in bytes for bandwidth monitoring
    const approximateBytes = JSON.stringify({
      finalPatients,
      finalVitals,
      finalFormulary,
    }).length;

    // Auto-register device or update lastSyncAt
    if (dto.deviceId) {
      let dev = this.registeredDevices.get(dto.deviceId);
      if (!dev) {
        dev = {
          deviceId: dto.deviceId,
          deviceName: 'Mobile Clinical Device',
          appVersion: MIN_SUPPORTED_APP_VERSION,
          registeredAt: currentServerTimestamp,
          lastHandshakeAt: currentServerTimestamp,
          status: 'ACTIVE',
        };
        this.registeredDevices.set(dto.deviceId, dev);
      }
      dev.lastSyncAt = currentServerTimestamp;
      if (dto.clientVectorClock) {
        dev.vectorClock = GatewayVectorClockEngine.merge(
          dev.vectorClock || {},
          dto.clientVectorClock
        );
      }
    }

    return {
      sinceTimestamp: new Date(sinceTimeMs).toISOString(),
      currentServerTimestamp,
      hasMore,
      cursor: dto.cursor,
      nextCursor,
      chunkIndex,
      remainingRecordsCount,
      isBandwidthOptimized: isLowBandwidth,
      payloadSizeBytes: approximateBytes,
      serverVectorClock: { ...this.serverVectorClock },
      serverMonotonicSequence: this.serverMonotonicSequence,
      patients: finalPatients,
      vitalSigns: finalVitals,
      formularyItems: finalFormulary,
      counts: {
        patients: finalPatients.length,
        vitalSigns: finalVitals.length,
        formularyItems: finalFormulary.length,
        total: finalPatients.length + finalVitals.length + finalFormulary.length,
      },
    };
  }

  /**
   * Endpoint 3: Offline Mutation Ingest with Vector Clock and Monotonic Timestamp Conflict Resolution
   */
  public async pushMutations(dto: PushMutationsRequestDto): Promise<PushMutationsResponseDto> {
    if (!dto.deviceId || typeof dto.deviceId !== 'string') {
      throw new BadRequestException('deviceId is required for mutation batch ingestion');
    }
    if (!dto.mutations || !Array.isArray(dto.mutations)) {
      throw new BadRequestException('mutations array is required');
    }

    const now = new Date();
    const serverTimeUtc = now.toISOString();
    const serverTimeMs = now.getTime();
    const batchId = dto.batchId || `BATCH-${dto.deviceId}-${serverTimeMs}`;

    // Merge batch-level vector clock if provided
    if (dto.clientVectorClock) {
      this.serverVectorClock = GatewayVectorClockEngine.merge(
        this.serverVectorClock,
        dto.clientVectorClock
      );
    }

    const results: MutationResultDto[] = [];
    let appliedCount = 0;
    let conflictCount = 0;
    let errorCount = 0;

    for (const mutation of dto.mutations) {
      try {
        const result = await this.processSingleMutation(mutation, serverTimeUtc);
        results.push(result);

        if (result.status === 'APPLIED') {
          appliedCount++;
        } else if (result.status === 'CONFLICT_IGNORED') {
          conflictCount++;
        } else {
          errorCount++;
        }

        this.mutationAuditLog.push({
          mutationId: mutation.mutationId,
          deviceId: dto.deviceId,
          entityType: mutation.entityType,
          entityId: mutation.entityId,
          status: result.status,
          timestamp: serverTimeUtc,
        });
      } catch (err: any) {
        errorCount++;
        results.push({
          mutationId: mutation.mutationId,
          entityType: mutation.entityType,
          entityId: mutation.entityId,
          status: 'ERROR',
          errorMessage: err.message || 'Unknown processing error',
        });
      }
    }

    // Update device timestamp and vector clock
    const dev = this.registeredDevices.get(dto.deviceId);
    if (dev) {
      dev.lastSyncAt = serverTimeUtc;
      if (dto.clientVectorClock) {
        dev.vectorClock = GatewayVectorClockEngine.merge(
          dev.vectorClock || {},
          dto.clientVectorClock
        );
      }
    }

    return {
      success: errorCount === 0,
      batchId,
      serverTimeUtc,
      serverTimeMs,
      serverVectorClock: { ...this.serverVectorClock },
      serverMonotonicSequence: this.serverMonotonicSequence,
      totalProcessed: dto.mutations.length,
      appliedCount,
      conflictCount,
      errorCount,
      results,
    };
  }

  /**
   * Conflict Resolution Logic: Vector Clock Causality with Monotonic Timestamp Tie-Breaker
   */
  private async processSingleMutation(
    mutation: OfflineMutationDto,
    serverTimeUtc: string
  ): Promise<MutationResultDto> {
    const clientTimestampMs =
      mutation.clientTimestampMs ||
      (mutation.clientTimestamp ? Date.parse(mutation.clientTimestamp) : 0);

    if (mutation.entityType === 'PATIENT') {
      return this.resolvePatientMutation(mutation, clientTimestampMs, serverTimeUtc);
    } else if (mutation.entityType === 'VITAL_SIGNS') {
      return this.resolveVitalSignsMutation(mutation, clientTimestampMs, serverTimeUtc);
    } else if (mutation.entityType === 'FORMULARY_ITEM') {
      return this.resolveFormularyMutation(mutation, clientTimestampMs, serverTimeUtc);
    } else {
      throw new BadRequestException(`Unsupported entityType: ${mutation.entityType}`);
    }
  }

  private resolvePatientMutation(
    mutation: OfflineMutationDto,
    clientTimestampMs: number,
    serverTimeUtc: string
  ): MutationResultDto {
    const existing = this.patientsStore.get(mutation.entityId);

    if (!existing) {
      // New patient created offline
      const monotonicVersion = this.getNextMonotonicSequence();
      const entityClock = GatewayVectorClockEngine.merge(
        { SERVER: 1 },
        mutation.vectorClock || { [mutation.deviceId]: 1 }
      );
      this.serverVectorClock = GatewayVectorClockEngine.merge(this.serverVectorClock, entityClock);

      const newPatient: SyncPatientDto = {
        id: mutation.entityId,
        tenantId: mutation.tenantId || mutation.payload.tenantId,
        patientCode: mutation.payload.patientCode || `P-${Date.now().toString().slice(-4)}`,
        nameEn: mutation.payload.nameEn || 'Unknown Patient',
        nameKh: mutation.payload.nameKh,
        gender: mutation.payload.gender || 'OTHER',
        dob: mutation.payload.dob,
        phone: mutation.payload.phone || '',
        nationalId: mutation.payload.nationalId,
        address: mutation.payload.address,
        bloodType: mutation.payload.bloodType,
        allergies: mutation.payload.allergies,
        emergencyContactName: mutation.payload.emergencyContactName,
        emergencyContactPhone: mutation.payload.emergencyContactPhone,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
        vectorClock: entityClock,
        monotonicVersion,
      };

      this.patientsStore.set(mutation.entityId, newPatient);
      return {
        mutationId: mutation.mutationId,
        entityType: 'PATIENT',
        entityId: mutation.entityId,
        status: 'APPLIED',
      };
    }

    // Existing patient: evaluate causality
    const existingClock = existing.vectorClock || { SERVER: existing.monotonicVersion || 1 };
    const clientClock = mutation.vectorClock;
    let winner: 'CLIENT' | 'SERVER' = 'SERVER';
    let causalRelation: CausalRelation = 'CONCURRENT';
    let strategy: 'VECTOR_CLOCK_LWW' | 'MONOTONIC_SEQUENCE' | 'LATEST_TIMESTAMP_WINS' =
      'LATEST_TIMESTAMP_WINS';
    let reason = '';

    if (clientClock) {
      causalRelation = GatewayVectorClockEngine.compare(clientClock, existingClock);
      strategy = 'VECTOR_CLOCK_LWW';

      if (causalRelation === 'AFTER') {
        winner = 'CLIENT';
        reason = 'Client mutation causally succeeds server state via vector clock';
      } else if (causalRelation === 'BEFORE' || causalRelation === 'EQUAL') {
        winner = 'SERVER';
        reason = 'Client mutation is causally superseded or duplicate via vector clock';
      } else {
        // Concurrent divergence: Monotonic / Lamport timestamp tie-breaker
        const clientMonotonic = mutation.monotonicTimestamp || mutation.lamportTime || 0;
        const serverMonotonic = existing.monotonicVersion || 0;

        if (clientMonotonic > serverMonotonic) {
          winner = 'CLIENT';
          strategy = 'MONOTONIC_SEQUENCE';
          reason = 'Concurrent divergence resolved by client monotonic sequence priority';
        } else if (clientMonotonic < serverMonotonic && clientMonotonic > 0) {
          winner = 'SERVER';
          strategy = 'MONOTONIC_SEQUENCE';
          reason = 'Concurrent divergence resolved by server monotonic sequence priority';
        } else {
          // Fallback to wall-clock LWW
          const serverTimestampMs = Date.parse(existing.updatedAt);
          if (clientTimestampMs >= serverTimestampMs) {
            winner = 'CLIENT';
            reason = 'Concurrent divergence resolved by client latest wall-clock timestamp';
          } else {
            winner = 'SERVER';
            reason = 'Concurrent divergence resolved by server latest wall-clock timestamp';
          }
        }
      }
    } else {
      // Legacy client without vector clock: evaluate monotonic timestamp or wall-clock LWW
      const clientMonotonic = mutation.monotonicTimestamp || mutation.lamportTime;
      const serverMonotonic = existing.monotonicVersion;

      if (clientMonotonic !== undefined && serverMonotonic !== undefined && clientMonotonic !== serverMonotonic) {
        strategy = 'MONOTONIC_SEQUENCE';
        if (clientMonotonic > serverMonotonic) {
          winner = 'CLIENT';
          reason = 'Client monotonic counter exceeds server sequence';
        } else {
          winner = 'SERVER';
          reason = 'Server monotonic sequence exceeds client counter';
        }
      } else {
        strategy = 'LATEST_TIMESTAMP_WINS';
        const serverTimestampMs = Date.parse(existing.updatedAt);
        if (clientTimestampMs >= serverTimestampMs) {
          winner = 'CLIENT';
          reason = 'Client mutation timestamp is equal or newer than server record';
        } else {
          winner = 'SERVER';
          reason = 'Server record has newer timestamp than incoming client mutation';
        }
      }
    }

    if (winner === 'CLIENT') {
      const nextMonotonic = this.getNextMonotonicSequence();
      const updatedClock = GatewayVectorClockEngine.increment(
        GatewayVectorClockEngine.merge(existingClock, clientClock || {}),
        'SERVER'
      );
      this.serverVectorClock = GatewayVectorClockEngine.merge(this.serverVectorClock, updatedClock);

      const updated: SyncPatientDto = {
        ...existing,
        ...mutation.payload,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
        vectorClock: updatedClock,
        monotonicVersion: nextMonotonic,
      };

      this.patientsStore.set(mutation.entityId, updated);

      return {
        mutationId: mutation.mutationId,
        entityType: 'PATIENT',
        entityId: mutation.entityId,
        status: 'APPLIED',
        conflictDetails: {
          strategy,
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'CLIENT',
          causalRelation,
          serverVectorClock: existingClock,
          clientVectorClock: clientClock,
          serverMonotonicVersion: existing.monotonicVersion,
          clientMonotonicVersion: mutation.monotonicTimestamp,
          reason,
        },
      };
    } else {
      return {
        mutationId: mutation.mutationId,
        entityType: 'PATIENT',
        entityId: mutation.entityId,
        status: 'CONFLICT_IGNORED',
        conflictDetails: {
          strategy,
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'SERVER',
          causalRelation,
          serverVectorClock: existingClock,
          clientVectorClock: clientClock,
          serverMonotonicVersion: existing.monotonicVersion,
          clientMonotonicVersion: mutation.monotonicTimestamp,
          reason,
        },
      };
    }
  }

  private resolveVitalSignsMutation(
    mutation: OfflineMutationDto,
    clientTimestampMs: number,
    serverTimeUtc: string
  ): MutationResultDto {
    const existing = this.vitalSignsStore.get(mutation.entityId);

    if (!existing) {
      const monotonicVersion = this.getNextMonotonicSequence();
      const entityClock = GatewayVectorClockEngine.merge(
        { SERVER: 1 },
        mutation.vectorClock || { [mutation.deviceId]: 1 }
      );
      this.serverVectorClock = GatewayVectorClockEngine.merge(this.serverVectorClock, entityClock);

      const newVitals: SyncVitalSignsDto = {
        id: mutation.entityId,
        tenantId: mutation.tenantId || mutation.payload.tenantId,
        patientId: mutation.payload.patientId,
        visitId: mutation.payload.visitId,
        bloodPressure: mutation.payload.bloodPressure,
        heartRate: mutation.payload.heartRate,
        temperature: mutation.payload.temperature,
        respiratoryRate: mutation.payload.respiratoryRate,
        spO2: mutation.payload.spO2,
        weightKg: mutation.payload.weightKg,
        heightCm: mutation.payload.heightCm,
        recordedAt: mutation.payload.recordedAt || mutation.clientTimestamp || serverTimeUtc,
        recordedByStaffId: mutation.payload.recordedByStaffId,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
        vectorClock: entityClock,
        monotonicVersion,
      };

      this.vitalSignsStore.set(mutation.entityId, newVitals);
      return {
        mutationId: mutation.mutationId,
        entityType: 'VITAL_SIGNS',
        entityId: mutation.entityId,
        status: 'APPLIED',
      };
    }

    const existingClock = existing.vectorClock || { SERVER: existing.monotonicVersion || 1 };
    const clientClock = mutation.vectorClock;
    let winner: 'CLIENT' | 'SERVER' = 'SERVER';
    let causalRelation: CausalRelation = 'CONCURRENT';
    let strategy: 'VECTOR_CLOCK_LWW' | 'MONOTONIC_SEQUENCE' | 'LATEST_TIMESTAMP_WINS' =
      'LATEST_TIMESTAMP_WINS';
    let reason = '';

    if (clientClock) {
      causalRelation = GatewayVectorClockEngine.compare(clientClock, existingClock);
      strategy = 'VECTOR_CLOCK_LWW';

      if (causalRelation === 'AFTER') {
        winner = 'CLIENT';
        reason = 'Client mutation causally succeeds server vital signs state';
      } else if (causalRelation === 'BEFORE' || causalRelation === 'EQUAL') {
        winner = 'SERVER';
        reason = 'Client mutation is causally superseded by server vital signs state';
      } else {
        const clientMonotonic = mutation.monotonicTimestamp || mutation.lamportTime || 0;
        const serverMonotonic = existing.monotonicVersion || 0;

        if (clientMonotonic > serverMonotonic) {
          winner = 'CLIENT';
          strategy = 'MONOTONIC_SEQUENCE';
          reason = 'Concurrent divergence resolved by client monotonic counter';
        } else {
          const serverTimestampMs = Date.parse(existing.updatedAt);
          if (clientTimestampMs >= serverTimestampMs) {
            winner = 'CLIENT';
            reason = 'Concurrent divergence resolved by client latest timestamp';
          } else {
            winner = 'SERVER';
            reason = 'Concurrent divergence resolved by server latest timestamp';
          }
        }
      }
    } else {
      strategy = 'LATEST_TIMESTAMP_WINS';
      const serverTimestampMs = Date.parse(existing.updatedAt);
      if (clientTimestampMs >= serverTimestampMs) {
        winner = 'CLIENT';
        reason = 'Client mutation timestamp is equal or newer than server record';
      } else {
        winner = 'SERVER';
        reason = 'Server record has newer timestamp than incoming client mutation';
      }
    }

    if (winner === 'CLIENT') {
      const nextMonotonic = this.getNextMonotonicSequence();
      const updatedClock = GatewayVectorClockEngine.increment(
        GatewayVectorClockEngine.merge(existingClock, clientClock || {}),
        'SERVER'
      );
      this.serverVectorClock = GatewayVectorClockEngine.merge(this.serverVectorClock, updatedClock);

      const updated: SyncVitalSignsDto = {
        ...existing,
        ...mutation.payload,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
        vectorClock: updatedClock,
        monotonicVersion: nextMonotonic,
      };

      this.vitalSignsStore.set(mutation.entityId, updated);

      return {
        mutationId: mutation.mutationId,
        entityType: 'VITAL_SIGNS',
        entityId: mutation.entityId,
        status: 'APPLIED',
        conflictDetails: {
          strategy,
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'CLIENT',
          causalRelation,
          serverVectorClock: existingClock,
          clientVectorClock: clientClock,
          serverMonotonicVersion: existing.monotonicVersion,
          clientMonotonicVersion: mutation.monotonicTimestamp,
          reason,
        },
      };
    } else {
      return {
        mutationId: mutation.mutationId,
        entityType: 'VITAL_SIGNS',
        entityId: mutation.entityId,
        status: 'CONFLICT_IGNORED',
        conflictDetails: {
          strategy,
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'SERVER',
          causalRelation,
          serverVectorClock: existingClock,
          clientVectorClock: clientClock,
          serverMonotonicVersion: existing.monotonicVersion,
          clientMonotonicVersion: mutation.monotonicTimestamp,
          reason,
        },
      };
    }
  }

  private resolveFormularyMutation(
    mutation: OfflineMutationDto,
    clientTimestampMs: number,
    serverTimeUtc: string
  ): MutationResultDto {
    const existing = this.formularyStore.get(mutation.entityId);

    if (!existing) {
      const monotonicVersion = this.getNextMonotonicSequence();
      const entityClock = GatewayVectorClockEngine.merge(
        { SERVER: 1 },
        mutation.vectorClock || { [mutation.deviceId]: 1 }
      );
      this.serverVectorClock = GatewayVectorClockEngine.merge(this.serverVectorClock, entityClock);

      const newItem: SyncFormularyItemDto = {
        id: mutation.entityId,
        tenantId: mutation.tenantId || mutation.payload.tenantId,
        code: mutation.payload.code || `MED-${Date.now().toString().slice(-4)}`,
        nameEn: mutation.payload.nameEn || 'Unknown Medicine',
        nameKh: mutation.payload.nameKh,
        genericName: mutation.payload.genericName || 'Generic Formulation',
        dosageForm: mutation.payload.dosageForm || 'Tablet',
        strength: mutation.payload.strength || '100mg',
        category: mutation.payload.category || 'GENERAL',
        unitPriceUsd: mutation.payload.unitPriceUsd || 1.0,
        unitPriceKhr: mutation.payload.unitPriceKhr || 4100,
        isInStock: mutation.payload.isInStock !== undefined ? mutation.payload.isInStock : true,
        stockQuantity: mutation.payload.stockQuantity || 100,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
        vectorClock: entityClock,
        monotonicVersion,
      };

      this.formularyStore.set(mutation.entityId, newItem);
      return {
        mutationId: mutation.mutationId,
        entityType: 'FORMULARY_ITEM',
        entityId: mutation.entityId,
        status: 'APPLIED',
      };
    }

    const existingClock = existing.vectorClock || { SERVER: existing.monotonicVersion || 1 };
    const clientClock = mutation.vectorClock;
    let winner: 'CLIENT' | 'SERVER' = 'SERVER';
    let causalRelation: CausalRelation = 'CONCURRENT';
    let strategy: 'VECTOR_CLOCK_LWW' | 'MONOTONIC_SEQUENCE' | 'LATEST_TIMESTAMP_WINS' =
      'LATEST_TIMESTAMP_WINS';
    let reason = '';

    if (clientClock) {
      causalRelation = GatewayVectorClockEngine.compare(clientClock, existingClock);
      strategy = 'VECTOR_CLOCK_LWW';

      if (causalRelation === 'AFTER') {
        winner = 'CLIENT';
        reason = 'Client mutation causally succeeds server formulary state';
      } else if (causalRelation === 'BEFORE' || causalRelation === 'EQUAL') {
        winner = 'SERVER';
        reason = 'Client mutation is causally superseded by server formulary state';
      } else {
        const clientMonotonic = mutation.monotonicTimestamp || mutation.lamportTime || 0;
        const serverMonotonic = existing.monotonicVersion || 0;

        if (clientMonotonic > serverMonotonic) {
          winner = 'CLIENT';
          strategy = 'MONOTONIC_SEQUENCE';
          reason = 'Concurrent divergence resolved by client monotonic sequence';
        } else {
          const serverTimestampMs = Date.parse(existing.updatedAt);
          if (clientTimestampMs >= serverTimestampMs) {
            winner = 'CLIENT';
            reason = 'Concurrent divergence resolved by client latest timestamp';
          } else {
            winner = 'SERVER';
            reason = 'Concurrent divergence resolved by server latest timestamp';
          }
        }
      }
    } else {
      strategy = 'LATEST_TIMESTAMP_WINS';
      const serverTimestampMs = Date.parse(existing.updatedAt);
      if (clientTimestampMs >= serverTimestampMs) {
        winner = 'CLIENT';
        reason = 'Client mutation timestamp is equal or newer than server record';
      } else {
        winner = 'SERVER';
        reason = 'Server record has newer timestamp than incoming client mutation';
      }
    }

    if (winner === 'CLIENT') {
      const nextMonotonic = this.getNextMonotonicSequence();
      const updatedClock = GatewayVectorClockEngine.increment(
        GatewayVectorClockEngine.merge(existingClock, clientClock || {}),
        'SERVER'
      );
      this.serverVectorClock = GatewayVectorClockEngine.merge(this.serverVectorClock, updatedClock);

      const updated: SyncFormularyItemDto = {
        ...existing,
        ...mutation.payload,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
        vectorClock: updatedClock,
        monotonicVersion: nextMonotonic,
      };

      this.formularyStore.set(mutation.entityId, updated);

      return {
        mutationId: mutation.mutationId,
        entityType: 'FORMULARY_ITEM',
        entityId: mutation.entityId,
        status: 'APPLIED',
        conflictDetails: {
          strategy,
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'CLIENT',
          causalRelation,
          serverVectorClock: existingClock,
          clientVectorClock: clientClock,
          serverMonotonicVersion: existing.monotonicVersion,
          clientMonotonicVersion: mutation.monotonicTimestamp,
          reason,
        },
      };
    } else {
      return {
        mutationId: mutation.mutationId,
        entityType: 'FORMULARY_ITEM',
        entityId: mutation.entityId,
        status: 'CONFLICT_IGNORED',
        conflictDetails: {
          strategy,
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'SERVER',
          causalRelation,
          serverVectorClock: existingClock,
          clientVectorClock: clientClock,
          serverMonotonicVersion: existing.monotonicVersion,
          clientMonotonicVersion: mutation.monotonicTimestamp,
          reason,
        },
      };
    }
  }

  /**
   * Gateway Health & Diagnostics
   */
  public getGatewayHealth() {
    return {
      status: 'HEALTHY',
      service: 'MobileSyncGateway',
      minSupportedAppVersion: MIN_SUPPORTED_APP_VERSION,
      serverMonotonicSequence: this.serverMonotonicSequence,
      serverVectorClock: { ...this.serverVectorClock },
      activeDevicesCount: this.registeredDevices.size,
      cachedPatientsCount: this.patientsStore.size,
      cachedVitalSignsCount: this.vitalSignsStore.size,
      cachedFormularyItemsCount: this.formularyStore.size,
      totalMutationsIngested: this.mutationAuditLog.length,
      serverTimeUtc: new Date().toISOString(),
    };
  }

  public getAllRegisteredDevices(): RegisteredDevice[] {
    return Array.from(this.registeredDevices.values());
  }

  public getDevice(deviceId: string): RegisteredDevice | undefined {
    return this.registeredDevices.get(deviceId);
  }

  public getPatient(patientId: string): SyncPatientDto | undefined {
    return this.patientsStore.get(patientId);
  }

  public getVitalSigns(vitalsId: string): SyncVitalSignsDto | undefined {
    return this.vitalSignsStore.get(vitalsId);
  }

  public getFormularyItem(itemId: string): SyncFormularyItemDto | undefined {
    return this.formularyStore.get(itemId);
  }

  /**
   * Seed Essential Formulary Catalog with Cambodia MoH standard medications
   */
  private seedFormularyCatalog(): void {
    const items: SyncFormularyItemDto[] = [
      {
        id: 'FORM-MED-001',
        code: 'PARACETAMOL-500MG',
        nameEn: 'Paracetamol 500mg Tablet',
        nameKh: 'ប៉ារ៉ាសេតាមុល ៥០០ មីលីក្រាម',
        genericName: 'Paracetamol',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'ANALGESIC',
        unitPriceUsd: 0.05,
        unitPriceKhr: 200,
        isInStock: true,
        stockQuantity: 1500,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1001,
      },
      {
        id: 'FORM-MED-002',
        code: 'AMOXICILLIN-500MG',
        nameEn: 'Amoxicillin 500mg Capsule',
        nameKh: 'អាម៉ុកស៊ីស៊ីលីន ៥០០ មីលីក្រាម',
        genericName: 'Amoxicillin Trihydrate',
        dosageForm: 'Capsule',
        strength: '500mg',
        category: 'ANTIBIOTIC',
        unitPriceUsd: 0.15,
        unitPriceKhr: 600,
        isInStock: true,
        stockQuantity: 800,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1002,
      },
      {
        id: 'FORM-MED-003',
        code: 'OMEPRAZOLE-20MG',
        nameEn: 'Omeprazole 20mg Capsule',
        nameKh: 'អូមេប្រាសូល ២០ មីលីក្រាម',
        genericName: 'Omeprazole',
        dosageForm: 'Capsule',
        strength: '20mg',
        category: 'GASTROINTESTINAL',
        unitPriceUsd: 0.2,
        unitPriceKhr: 800,
        isInStock: true,
        stockQuantity: 650,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1003,
      },
      {
        id: 'FORM-MED-004',
        code: 'ORS-SACHET',
        nameEn: 'Oral Rehydration Salts Sachet',
        nameKh: 'អំបិលរ៉ែជាតិទឹក ORS កញ្ចប់',
        genericName: 'Oral Rehydration Salts',
        dosageForm: 'Powder Sachet',
        strength: '20.5g',
        category: 'ELECTROLYTE',
        unitPriceUsd: 0.25,
        unitPriceKhr: 1000,
        isInStock: true,
        stockQuantity: 1200,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1004,
      },
      {
        id: 'FORM-MED-005',
        code: 'CIPROFLOXACIN-500MG',
        nameEn: 'Ciprofloxacin 500mg Tablet',
        nameKh: 'ស៊ីប្រូហ្វ្លុកសាស៊ីន ៥០០ មីលីក្រាម',
        genericName: 'Ciprofloxacin Hydrochloride',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'ANTIBIOTIC',
        unitPriceUsd: 0.3,
        unitPriceKhr: 1200,
        isInStock: true,
        stockQuantity: 400,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1005,
      },
      {
        id: 'FORM-MED-006',
        code: 'METFORMIN-500MG',
        nameEn: 'Metformin 500mg Tablet',
        nameKh: 'មេតហ្វ័រមីន ៥០០ មីលីក្រាម',
        genericName: 'Metformin Hydrochloride',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'ANTIDIABETIC',
        unitPriceUsd: 0.1,
        unitPriceKhr: 400,
        isInStock: true,
        stockQuantity: 950,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1006,
      },
      {
        id: 'FORM-MED-007',
        code: 'AMLODIPINE-5MG',
        nameEn: 'Amlodipine 5mg Tablet',
        nameKh: 'អាមឡូឌីពីន ៥ មីលីក្រាម',
        genericName: 'Amlodipine Besylate',
        dosageForm: 'Tablet',
        strength: '5mg',
        category: 'CARDIOVASCULAR',
        unitPriceUsd: 0.12,
        unitPriceKhr: 500,
        isInStock: true,
        stockQuantity: 700,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1007,
      },
      {
        id: 'FORM-MED-008',
        code: 'CEFTRIAXONE-1G',
        nameEn: 'Ceftriaxone 1g Injection Vial',
        nameKh: 'សេហ្វទ្រីអាសូន ចាក់ ១ ក្រាម',
        genericName: 'Ceftriaxone Sodium',
        dosageForm: 'Injection',
        strength: '1g',
        category: 'ANTIBIOTIC',
        unitPriceUsd: 2.5,
        unitPriceKhr: 10000,
        isInStock: true,
        stockQuantity: 300,
        updatedAt: '2026-11-01T00:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1008,
      },
    ];

    for (const it of items) {
      this.formularyStore.set(it.id, it);
    }
  }

  /**
   * Seed Baseline Clinical Patients and Vital Signs
   */
  private seedInitialClinicalData(): void {
    const patients: SyncPatientDto[] = [
      {
        id: 'PAT-MOH-2026-0001',
        patientCode: 'P-0001',
        nameEn: 'Sokha Chea',
        nameKh: 'ជា សុខា',
        gender: 'MALE',
        dob: '1988-04-12T00:00:00.000Z',
        phone: '012345678',
        nationalId: '010188992',
        address: 'Khan Toul Kork, Phnom Penh',
        bloodType: 'O+',
        allergies: 'Penicillin',
        emergencyContactName: 'Bopha Chea',
        emergencyContactPhone: '012345679',
        updatedAt: '2026-11-01T08:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1009,
      },
      {
        id: 'PAT-MOH-2026-0002',
        patientCode: 'P-0002',
        nameEn: 'Bopha Vann',
        nameKh: 'វ៉ាន់ បុប្ផា',
        gender: 'FEMALE',
        dob: '1995-09-23T00:00:00.000Z',
        phone: '098765432',
        nationalId: '010295881',
        address: 'Sangkat Boeung Keng Kang, Phnom Penh',
        bloodType: 'A+',
        allergies: 'None',
        emergencyContactName: 'Vanna Vann',
        emergencyContactPhone: '098765430',
        updatedAt: '2026-11-02T09:30:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1010,
      },
      {
        id: 'PAT-MOH-2026-0003',
        patientCode: 'P-0003',
        nameEn: 'Rithy Chan',
        nameKh: 'ចាន់ រិទ្ធី',
        gender: 'MALE',
        dob: '1976-11-05T00:00:00.000Z',
        phone: '077889900',
        nationalId: '010376112',
        address: 'Krong Siem Reap',
        bloodType: 'B+',
        allergies: 'Sulfa Drugs',
        emergencyContactName: 'Kanya Chan',
        emergencyContactPhone: '077889901',
        updatedAt: '2026-11-03T02:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1011,
      },
    ];

    for (const p of patients) {
      this.patientsStore.set(p.id, p);
    }

    const vitals: SyncVitalSignsDto[] = [
      {
        id: 'VIT-2026-0001',
        patientId: 'PAT-MOH-2026-0001',
        visitId: 'VIS-2026-0001',
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 36.8,
        respiratoryRate: 16,
        spO2: 98,
        weightKg: 65.5,
        heightCm: 168.0,
        recordedAt: '2026-11-01T08:30:00.000Z',
        recordedByStaffId: 'STAFF-DR-01',
        updatedAt: '2026-11-01T08:30:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1012,
      },
      {
        id: 'VIT-2026-0002',
        patientId: 'PAT-MOH-2026-0002',
        visitId: 'VIS-2026-0002',
        bloodPressure: '115/75',
        heartRate: 68,
        temperature: 36.6,
        respiratoryRate: 15,
        spO2: 99,
        weightKg: 52.0,
        heightCm: 160.0,
        recordedAt: '2026-11-02T10:00:00.000Z',
        recordedByStaffId: 'STAFF-RN-02',
        updatedAt: '2026-11-02T10:00:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1013,
      },
      {
        id: 'VIT-2026-0003',
        patientId: 'PAT-MOH-2026-0003',
        visitId: 'VIS-2026-0003',
        bloodPressure: '138/88',
        heartRate: 84,
        temperature: 37.1,
        respiratoryRate: 18,
        spO2: 96,
        weightKg: 78.0,
        heightCm: 172.0,
        recordedAt: '2026-11-03T02:15:00.000Z',
        recordedByStaffId: 'STAFF-DR-02',
        updatedAt: '2026-11-03T02:15:00.000Z',
        vectorClock: { SERVER: 1 },
        monotonicVersion: 1014,
      },
    ];

    for (const v of vitals) {
      this.vitalSignsStore.set(v.id, v);
    }
  }
}
