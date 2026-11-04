// Mobile Sync & Device Gateway Service
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import crypto from 'crypto';
import { BadRequestException, Logger } from '@nestjs/common';
import { Subject, Observable, interval, merge, from } from 'rxjs';
import { filter, map, finalize } from 'rxjs/operators';
import {
  _typeStripping,
  MIN_SUPPORTED_APP_VERSION,
  DEFAULT_SYNC_LIMIT,
  DEFAULT_RURAL_CHUNK_SIZE,
  MAX_RURAL_CHUNK_SIZE,
  DEFAULT_HEARTBEAT_INTERVAL_MS,
} from './mobile-sync.types';
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
  SyncInvoiceDto,
  OfflineMutationDto,
  MutationResultDto,
  RegisteredDevice,
  CausalRelation,
  TelemetryStreamEvent,
  TelemetryStreamFilterDto,
  TelemetryBroadcastDto,
  SseMessageEvent,
  TelemetryBedVitalsData,
  TelemetryEcgData,
  TelemetryLabPanicData,
  TelemetryKhqrSettledData,
  MobilePushNotificationDto,
  KhqrSettlementWebhookDto,
  KhqrSettlementResponseDto,
  NssfEligibilityRequestDto,
  NssfEligibilityResponseDto,
  NssfClaimSubmissionDto,
  NssfClaimSubmissionResponseDto,
  NssfAdjudicatedItemResultDto,
} from './mobile-sync.types';

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
  private readonly invoicesStore: Map<string, SyncInvoiceDto> = new Map();
  private readonly settledTransactions: Map<
    string,
    {
      tranId: string;
      hash: string;
      invoiceId: string;
      amount: number;
      currency: 'USD' | 'KHR';
      settledAt: string;
      status: string;
      response: KhqrSettlementResponseDto;
    }
  > = new Map();
  private readonly mobilePushNotificationQueue: MobilePushNotificationDto[] = [];
  private readonly mutationAuditLog: Array<{
    mutationId: string;
    deviceId: string;
    entityType: string;
    entityId: string;
    status: string;
    timestamp: string;
  }> = [];

  // NSSF Cambodia & CamDX Integration Stores
  private readonly camdxSecretKey: string = 'CAMDX-HMAC-SECRET-KRUPET-2026-NSSF-SECURE';
  private readonly devicePublicKeys: Map<string, string> = new Map();
  private readonly nssfMembersStore: Map<string, any> = new Map();
  private readonly nssfClaimsStore: Map<string, any> = new Map();
  private readonly nssfTariffItems: Map<string, any> = new Map();

  // Real-Time Telemetry & Alert Broadcasting Engine
  private readonly telemetrySubject = new Subject<TelemetryStreamEvent>();
  private readonly bedTelemetryCache: Map<string, TelemetryStreamEvent> = new Map();
  private readonly activePanicAlerts: Map<string, TelemetryStreamEvent> = new Map();
  private readonly activeSubscribers: Map<
    string,
    { deviceId?: string; department?: string; ward?: string; connectedAt: string }
  > = new Map();

  constructor(prisma?: any) {
    this.prisma = prisma;
    this.seedFormularyCatalog();
    this.seedInitialClinicalData();
    this.seedTelemetryBedsAndAlerts();
    this.seedInitialInvoices();
    this.seedNssfMasterData();
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
    if (this.prisma && typeof this.prisma.patient?.findMany === 'function') {
      try {
        const prismaPatients = await this.prisma.patient.findMany({
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

    // 4. Gather all updated Invoices (when requested)
    const includeInvoices = dto.includeInvoices === true;
    const updatedInvoices: SyncInvoiceDto[] = [];
    if (includeInvoices) {
      for (const inv of this.invoicesStore.values()) {
        if (dto.tenantId && inv.tenantId && inv.tenantId !== dto.tenantId) {
          continue;
        }
        const recordTimeMs = Date.parse(inv.updatedAt);
        if (recordTimeMs > sinceTimeMs) {
          updatedInvoices.push(inv);
        }
      }
    }

    // Parse cursor for low-bandwidth resumable pagination
    // Format: CURSOR-<pIndex>-<vIndex>-<fIndex>-<chunkIndex> OR CURSOR-<pIndex>-<vIndex>-<fIndex>-<iIndex>-<chunkIndex>
    let pOffset = 0;
    let vOffset = 0;
    let fOffset = 0;
    let iOffset = 0;
    let chunkIndex = 0;

    if (dto.cursor && typeof dto.cursor === 'string' && dto.cursor.startsWith('CURSOR-')) {
      const parts = dto.cursor.replace('CURSOR-', '').split('-');
      if (parts.length >= 5) {
        pOffset = parseInt(parts[0], 10) || 0;
        vOffset = parseInt(parts[1], 10) || 0;
        fOffset = parseInt(parts[2], 10) || 0;
        iOffset = parseInt(parts[3], 10) || 0;
        chunkIndex = parseInt(parts[4], 10) || 0;
      } else {
        pOffset = parseInt(parts[0], 10) || 0;
        vOffset = parseInt(parts[1], 10) || 0;
        fOffset = parseInt(parts[2], 10) || 0;
        chunkIndex = parseInt(parts[3], 10) || 0;
      }
    }

    // Slice using sequential chunk budget across entities
    const slicedPatients: SyncPatientDto[] = [];
    const slicedVitals: SyncVitalSignsDto[] = [];
    const slicedFormulary: SyncFormularyItemDto[] = [];
    const slicedInvoices: SyncInvoiceDto[] = [];

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

    // 4. Take Invoices
    if (includeInvoices && iOffset < updatedInvoices.length && budget > 0) {
      const takeI = Math.min(budget, updatedInvoices.length - iOffset);
      slicedInvoices.push(...updatedInvoices.slice(iOffset, iOffset + takeI));
      iOffset += takeI;
      budget -= takeI;
    }

    const remainingP = Math.max(0, updatedPatients.length - pOffset);
    const remainingV = Math.max(0, updatedVitals.length - vOffset);
    const remainingF = Math.max(0, updatedFormulary.length - fOffset);
    const remainingI = includeInvoices ? Math.max(0, updatedInvoices.length - iOffset) : 0;
    const remainingRecordsCount = remainingP + remainingV + remainingF + remainingI;

    const hasMore = remainingRecordsCount > 0;
    const nextCursor = hasMore
      ? includeInvoices
        ? `CURSOR-${pOffset}-${vOffset}-${fOffset}-${iOffset}-${chunkIndex + 1}`
        : `CURSOR-${pOffset}-${vOffset}-${fOffset}-${chunkIndex + 1}`
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
      ...(includeInvoices ? { invoices: slicedInvoices } : {}),
      counts: {
        patients: finalPatients.length,
        vitalSigns: finalVitals.length,
        formularyItems: finalFormulary.length,
        ...(includeInvoices ? { invoices: slicedInvoices.length } : {}),
        total:
          finalPatients.length +
          finalVitals.length +
          finalFormulary.length +
          (includeInvoices ? slicedInvoices.length : 0),
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

  // -------------------------------------------------------------
  // REAL-TIME TELEMETRY & VITAL ALERT STREAMING BROADCASTER
  // -------------------------------------------------------------

  /**
   * Broadcasts real-time telemetry event to all connected mobile clients
   */
  public broadcastTelemetryEvent(dto: TelemetryBroadcastDto | TelemetryStreamEvent): TelemetryStreamEvent {
    const event: TelemetryStreamEvent = {
      eventId:
        (dto as any).eventId ||
        `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventType: dto.eventType,
      timestamp: (dto as any).timestamp || new Date().toISOString(),
      department: (dto.department || 'ALL').toUpperCase(),
      ward: dto.ward,
      bedId: dto.bedId,
      patientId: dto.patientId,
      patientName: dto.patientName,
      data: dto.data || {},
    };

    // Cache latest status per bed and active panic alerts
    if (event.bedId) {
      this.bedTelemetryCache.set(event.bedId, event);
    }
    if (event.eventType === 'LAB_PANIC_ALERT') {
      this.activePanicAlerts.set(event.eventId, event);
    }

    this.telemetrySubject.next(event);
    return event;
  }

  /**
   * Helper to broadcast patient bed vital signs update
   */
  public broadcastBedVitals(params: {
    bedId: string;
    patientId: string;
    patientName: string;
    department: string;
    ward?: string;
    vitals: TelemetryBedVitalsData;
  }): TelemetryStreamEvent {
    return this.broadcastTelemetryEvent({
      eventType: 'VITAL_SIGNS_UPDATE',
      department: params.department,
      ward: params.ward || params.department,
      bedId: params.bedId,
      patientId: params.patientId,
      patientName: params.patientName,
      data: params.vitals,
    });
  }

  /**
   * Helper to broadcast ECG telemetry events
   */
  public broadcastEcgTelemetry(params: {
    bedId: string;
    patientId: string;
    patientName: string;
    department: string;
    ward?: string;
    ecg: TelemetryEcgData;
  }): TelemetryStreamEvent {
    return this.broadcastTelemetryEvent({
      eventType: 'ECG_TELEMETRY',
      department: params.department,
      ward: params.ward || params.department,
      bedId: params.bedId,
      patientId: params.patientId,
      patientName: params.patientName,
      data: params.ecg,
    });
  }

  /**
   * Helper to broadcast critical lab panic value alert
   */
  public broadcastLabPanicAlert(params: {
    patientId: string;
    patientName: string;
    department: string;
    ward?: string;
    bedId?: string;
    alert: TelemetryLabPanicData;
  }): TelemetryStreamEvent {
    return this.broadcastTelemetryEvent({
      eventType: 'LAB_PANIC_ALERT',
      department: params.department,
      ward: params.ward || params.department,
      bedId: params.bedId,
      patientId: params.patientId,
      patientName: params.patientName,
      data: params.alert,
    });
  }

  /**
   * Creates Server-Sent Events (SSE) observable stream for mobile clients
   * Supports department/ward channel filtering and 15s rural heartbeat keep-alives
   */
  public getTelemetryStream(filterDto?: TelemetryStreamFilterDto): Observable<SseMessageEvent> {
    const targetDept = filterDto?.department ? filterDto.department.toUpperCase() : 'ALL';
    const targetWard = filterDto?.ward;
    const intervalMs = filterDto?.heartbeatIntervalMs || DEFAULT_HEARTBEAT_INTERVAL_MS;

    const clientId = `SUB-${filterDto?.deviceId || 'MOBILE'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.activeSubscribers.set(clientId, {
      deviceId: filterDto?.deviceId,
      department: targetDept,
      ward: targetWard,
      connectedAt: new Date().toISOString(),
    });

    // 1. Initial snapshot of current ward bed vitals and active panic alerts
    const initialEvents: TelemetryStreamEvent[] = [];
    for (const cached of this.bedTelemetryCache.values()) {
      if (this.matchesFilter(cached, targetDept, targetWard)) {
        initialEvents.push(cached);
      }
    }
    for (const alert of this.activePanicAlerts.values()) {
      if (this.matchesFilter(alert, targetDept, targetWard)) {
        initialEvents.push(alert);
      }
    }

    const snapshot$ = from(initialEvents);

    // 2. Filtered real-time broadcast stream
    const live$ = this.telemetrySubject.asObservable().pipe(
      filter((evt) => this.matchesFilter(evt, targetDept, targetWard))
    );

    // 3. Periodic client heartbeat keep-alive (every 15s default on rural links)
    const heartbeat$ = interval(intervalMs).pipe(
      map(() => {
        const now = new Date();
        const hbEvent: TelemetryStreamEvent = {
          eventId: `HB-${now.getTime()}`,
          eventType: 'HEARTBEAT',
          timestamp: now.toISOString(),
          department: 'ALL',
          data: {
            status: 'PING',
            heartbeatIntervalSeconds: Math.round(intervalMs / 1000),
            serverTimeUtc: now.toISOString(),
            serverTimeMs: now.getTime(),
            activeSubscribersCount: this.activeSubscribers.size,
          },
        };
        return hbEvent;
      })
    );

    // Merge initial snapshot, live broadcast, and heartbeat stream
    return merge(snapshot$, live$, heartbeat$).pipe(
      map((evt) => ({
        id: evt.eventId,
        type: evt.eventType,
        data: JSON.stringify(evt),
      })),
      finalize(() => {
        this.activeSubscribers.delete(clientId);
      })
    );
  }

  private matchesFilter(event: TelemetryStreamEvent, targetDept: string, targetWard?: string): boolean {
    if (event.eventType === 'HEARTBEAT') return true;
    if (event.department === 'ALL') return true;

    if (targetDept !== 'ALL') {
      if (event.department.toUpperCase() !== targetDept) {
        return false;
      }
    }

    if (targetWard && event.ward) {
      if (event.ward.toUpperCase() !== targetWard.toUpperCase()) {
        return false;
      }
    }

    return true;
  }

  public getActiveSubscribersCount(): number {
    return this.activeSubscribers.size;
  }

  public getBedTelemetrySnapshot(department?: string): TelemetryStreamEvent[] {
    const list: TelemetryStreamEvent[] = [];
    const dept = department ? department.toUpperCase() : 'ALL';
    for (const item of this.bedTelemetryCache.values()) {
      if (dept === 'ALL' || item.department === dept) {
        list.push(item);
      }
    }
    return list;
  }

  public getActivePanicAlerts(department?: string): TelemetryStreamEvent[] {
    const list: TelemetryStreamEvent[] = [];
    const dept = department ? department.toUpperCase() : 'ALL';
    for (const item of this.activePanicAlerts.values()) {
      if (dept === 'ALL' || item.department === dept) {
        list.push(item);
      }
    }
    return list;
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
      cachedInvoicesCount: this.invoicesStore.size,
      pendingPushNotificationsCount: this.mobilePushNotificationQueue.length,
      activeTelemetrySubscribersCount: this.activeSubscribers.size,
      cachedBedsCount: this.bedTelemetryCache.size,
      activePanicAlertsCount: this.activePanicAlerts.size,
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

  public getInvoice(invoiceId: string): SyncInvoiceDto | undefined {
    return this.invoicesStore.get(invoiceId);
  }

  public getInvoices(tenantId?: string): SyncInvoiceDto[] {
    const list: SyncInvoiceDto[] = [];
    for (const inv of this.invoicesStore.values()) {
      if (!tenantId || inv.tenantId === tenantId) {
        list.push(inv);
      }
    }
    return list;
  }

  public getPendingPushNotifications(deviceId?: string): MobilePushNotificationDto[] {
    if (!deviceId) {
      return [...this.mobilePushNotificationQueue];
    }
    return this.mobilePushNotificationQueue.filter(
      (n) => !n.targetDeviceId || n.targetDeviceId === deviceId
    );
  }

  public acknowledgePushNotification(notificationId: string): boolean {
    const notif = this.mobilePushNotificationQueue.find((n) => n.notificationId === notificationId);
    if (notif) {
      notif.status = 'DELIVERED';
      return true;
    }
    return false;
  }

  public clearPushNotifications(): void {
    this.mobilePushNotificationQueue.length = 0;
  }

  public getSettledTransactions(): Array<any> {
    return Array.from(this.settledTransactions.values());
  }

  /**
   * Bakong KHQR Settled Transaction Webhook & Mobile Push Notification Engine
   */
  public async settleKhqrTransaction(
    dto: KhqrSettlementWebhookDto
  ): Promise<KhqrSettlementResponseDto> {
    if (!dto.tranId || typeof dto.tranId !== 'string') {
      throw new BadRequestException('tranId is required for KHQR settlement');
    }
    if (!dto.invoiceId && !dto.invoiceNumber) {
      throw new BadRequestException('invoiceId or invoiceNumber is required for KHQR settlement');
    }
    if (dto.amount === undefined || dto.amount === null || isNaN(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Valid positive amount is required for KHQR settlement');
    }
    if (!dto.currency || (dto.currency !== 'USD' && dto.currency !== 'KHR')) {
      throw new BadRequestException('Currency must be USD or KHR');
    }

    const hashKey = dto.hash || dto.tranId;

    // 1. Idempotency Check: Return existing record if already settled
    const existingSettlement =
      this.settledTransactions.get(dto.tranId) || this.settledTransactions.get(hashKey);

    if (existingSettlement) {
      return {
        ...existingSettlement.response,
        idempotent: true,
      };
    }

    // 2. Locate or create invoice
    let invoice = dto.invoiceId ? this.invoicesStore.get(dto.invoiceId) : undefined;
    if (!invoice && dto.invoiceNumber) {
      for (const inv of this.invoicesStore.values()) {
        if (inv.invoiceNumber === dto.invoiceNumber) {
          invoice = inv;
          break;
        }
      }
    }

    const now = new Date();
    const serverTimeUtc = now.toISOString();
    const settledTimestamp = dto.settledAt || serverTimeUtc;
    const nextMonotonic = this.getNextMonotonicSequence();

    if (!invoice) {
      // Auto-create invoice if not found in memory (e.g. external POS or walk-in patient)
      const invId = dto.invoiceId || `INV-${dto.tranId}`;
      const invNum = dto.invoiceNumber || `INV-${dto.tranId.slice(-6)}`;
      invoice = {
        id: invId,
        tenantId: dto.tenantId || 'TENANT-ROTANA-01',
        invoiceNumber: invNum,
        patientId: (dto.metadata && dto.metadata.patientId) || 'PAT-WALKIN',
        patientNameEn: (dto.metadata && dto.metadata.patientNameEn) || 'Walk-in Patient',
        patientNameKh: (dto.metadata && dto.metadata.patientNameKh) || 'អ្នកជំងឺទូទៅ',
        totalAmount: dto.amount,
        payableAmount: dto.amount,
        currency: dto.currency,
        status: 'PAID',
        paymentMethod: 'KHQR',
        tranId: dto.tranId,
        cashierId: dto.cashierId,
        paidAt: settledTimestamp,
        updatedAt: serverTimeUtc,
        monotonicVersion: nextMonotonic,
        vectorClock: { SERVER: 1 },
      };
      this.invoicesStore.set(invoice.id, invoice);
    } else {
      // Update existing invoice to PAID
      invoice.status = 'PAID';
      invoice.paidAt = settledTimestamp;
      invoice.tranId = dto.tranId;
      invoice.cashierId = dto.cashierId || invoice.cashierId;
      invoice.updatedAt = serverTimeUtc;
      invoice.monotonicVersion = nextMonotonic;
      invoice.vectorClock = GatewayVectorClockEngine.increment(
        invoice.vectorClock || { SERVER: 1 },
        'SERVER'
      );
      this.invoicesStore.set(invoice.id, invoice);
    }

    // 3. Construct Real-Time SSE Broadcast Event
    // Strictly ZERO emojis, and strictly NO parentheses in Khmer text
    const alertMessageKh = `ការទូទាត់ប្រាក់បានជោគជ័យ: វិក្កយបត្រ ${invoice.invoiceNumber} ទឹកប្រាក់ ${dto.amount} ${dto.currency}`;
    const alertMessageEn = `KHQR Payment Settled: Invoice ${invoice.invoiceNumber} Amount ${dto.amount} ${dto.currency}`;

    const broadcastEvent: TelemetryStreamEvent = {
      eventId: `KHQR-SETTLED-${dto.tranId}`,
      eventType: 'KHQR_PAYMENT_SETTLED',
      timestamp: serverTimeUtc,
      department: 'BILLING',
      ward: 'BILLING_CASHIER',
      patientId: invoice.patientId,
      patientName: invoice.patientNameEn,
      data: {
        tranId: dto.tranId,
        hash: dto.hash || '',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: dto.amount,
        currency: dto.currency,
        settledAt: settledTimestamp,
        payerAccount: dto.payerAccount || '',
        bakongAccountId: dto.bakongAccountId || '',
        isSettled: true,
        notificationMessageKh: alertMessageKh,
        notificationMessageEn: alertMessageEn,
      },
    };

    // Emit event on SSE telemetry stream for mobile cashier tablets
    this.telemetrySubject.next(broadcastEvent);

    // 4. Construct Mobile Push Notification for Mobile POS and Cashiers
    // Strictly ZERO emojis, and strictly NO parentheses in Khmer text
    const pushNotification: MobilePushNotificationDto = {
      notificationId: `PUSH-KHQR-${dto.tranId}`,
      targetDeviceId: dto.deviceId,
      title: 'KHQR Payment Received',
      titleKh: 'ទទួលបានការទូទាត់ប្រាក់ KHQR',
      body: `Invoice ${invoice.invoiceNumber} settled: ${dto.amount} ${dto.currency}`,
      bodyKh: `វិក្កយបត្រ ${invoice.invoiceNumber} បានទូទាត់រួចរាល់: ចំនួន ${dto.amount} ${dto.currency}`,
      category: 'BILLING',
      priority: 'HIGH',
      data: {
        tranId: dto.tranId,
        hash: dto.hash || '',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: dto.amount,
        currency: dto.currency,
        payerAccount: dto.payerAccount || '',
        type: 'KHQR_PAYMENT_SETTLED',
      },
      dispatchedAt: serverTimeUtc,
      status: 'QUEUED',
    };
    this.mobilePushNotificationQueue.push(pushNotification);

    // 5. Prisma Persistence Fallback (Standalone Try/Catch)
    if (this.prisma) {
      try {
        if (typeof this.prisma.paymentTransaction?.updateMany === 'function') {
          await this.prisma.paymentTransaction.updateMany({
            where: { tranId: dto.tranId },
            data: {
              status: 'SUCCESS',
              verifiedAt: new Date(settledTimestamp),
            },
          });
        }
        if (typeof this.prisma.invoice?.update === 'function') {
          await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'PAID',
              paidAt: new Date(settledTimestamp),
            },
          });
        }
      } catch (err: any) {
        this.logger.warn(`Prisma billing reconciliation fallback: ${err.message}`);
      }
    }

    const response: KhqrSettlementResponseDto = {
      success: true,
      idempotent: false,
      tranId: dto.tranId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceStatus: 'PAID',
      payableAmount: invoice.payableAmount,
      currency: invoice.currency,
      settledAt: settledTimestamp,
      serverMonotonicSequence: nextMonotonic,
      serverVectorClock: { ...this.serverVectorClock },
      pushNotification,
      broadcastEvent,
    };

    // Store for idempotency
    const record = {
      tranId: dto.tranId,
      hash: dto.hash || dto.tranId,
      invoiceId: invoice.id,
      amount: dto.amount,
      currency: dto.currency,
      settledAt: settledTimestamp,
      status: 'PAID',
      response,
    };
    this.settledTransactions.set(dto.tranId, record);
    if (dto.hash) {
      this.settledTransactions.set(dto.hash, record);
    }

    return response;
  }

  /**
   * Seed Initial Bedside Telemetry Monitors and Active Lab Panic Alerts
   */
  private seedTelemetryBedsAndAlerts(): void {
    const nowIso = new Date().toISOString();

    // 1. ICU Bed 01: Adult Post-CABG
    this.broadcastTelemetryEvent({
      eventId: 'INIT-ICU-BED-01',
      eventType: 'VITAL_SIGNS_UPDATE',
      timestamp: nowIso,
      department: 'ICU',
      ward: 'ICU',
      bedId: 'ICU-BED-01',
      patientId: 'PAT-MOH-2026-0001',
      patientName: 'Sokha Chea',
      data: {
        heartRate: 74,
        systolicBp: 122,
        diastolicBp: 78,
        calculatedMap: 92.7,
        spo2: 98,
        respirationRate: 14,
        temperature: 37.0,
        severity: 'NORMAL',
      },
    });

    // 2. ICU Bed 02: Septic Shock with Lab Panic Alert
    this.broadcastTelemetryEvent({
      eventId: 'INIT-ICU-BED-02',
      eventType: 'VITAL_SIGNS_UPDATE',
      timestamp: nowIso,
      department: 'ICU',
      ward: 'ICU',
      bedId: 'ICU-BED-02',
      patientId: 'PAT-MOH-2026-0002',
      patientName: 'Bopha Vann',
      data: {
        heartRate: 118,
        systolicBp: 85,
        diastolicBp: 52,
        calculatedMap: 63.0,
        spo2: 93,
        respirationRate: 24,
        temperature: 38.8,
        severity: 'WARNING',
      },
    });

    this.broadcastTelemetryEvent({
      eventId: 'INIT-PANIC-01',
      eventType: 'LAB_PANIC_ALERT',
      timestamp: nowIso,
      department: 'ICU',
      ward: 'ICU',
      bedId: 'ICU-BED-02',
      patientId: 'PAT-MOH-2026-0002',
      patientName: 'Bopha Vann',
      data: {
        testName: 'Serum Potassium K+',
        measuredValue: 6.8,
        unit: 'mmol/L',
        referenceLow: 3.5,
        referenceHigh: 5.0,
        severity: 'PANIC_CRITICAL',
        labTechnicianId: 'STAFF-LIS-01',
        requiresImmediateReview: true,
        notificationMessageKh: 'ការព្រមានកម្រិតអាសន្នពីមន្ទីរពិសោធន៍: ប៉ូតាស្យូមខ្ពស់ខ្លាំង',
        notificationMessageEn: 'Critical Panic Lab Alert: Serum Potassium severely elevated above critical threshold',
      },
    });

    // 3. ER Bed 01: Ventricular Tachycardia Emergency
    this.broadcastTelemetryEvent({
      eventId: 'INIT-ER-BED-01',
      eventType: 'ECG_TELEMETRY',
      timestamp: nowIso,
      department: 'ER',
      ward: 'ER',
      bedId: 'ER-BED-01',
      patientId: 'PAT-MOH-2026-0003',
      patientName: 'Rithy Chan',
      data: {
        rhythm: 'VENTRICULAR_TACHYCARDIA',
        arrhythmiaType: 'VENTRICULAR_TACHYCARDIA',
        stDeviationMm: 2.4,
        prIntervalMs: 140,
        qrsDurationMs: 145,
        calculatedQtcMs: 480,
        leadStatus: 'CONNECTED',
        arrhythmiaDetected: true,
        alarmActive: true,
      },
    });

    this.broadcastTelemetryEvent({
      eventId: 'INIT-PANIC-02',
      eventType: 'LAB_PANIC_ALERT',
      timestamp: nowIso,
      department: 'ER',
      ward: 'ER',
      bedId: 'ER-BED-01',
      patientId: 'PAT-MOH-2026-0003',
      patientName: 'Rithy Chan',
      data: {
        testName: 'High Sensitivity Troponin I',
        measuredValue: 1.85,
        unit: 'ng/mL',
        referenceLow: 0.0,
        referenceHigh: 0.04,
        severity: 'PANIC_CRITICAL',
        labTechnicianId: 'STAFF-LIS-02',
        requiresImmediateReview: true,
        notificationMessageKh: 'ការព្រមានកម្រិតអាសន្នពីមន្ទីរពិសោធន៍: សារធាតុត្រូប៉ូនីនខ្ពស់ខ្លាំង',
        notificationMessageEn: 'Critical Panic Lab Alert: High Sensitivity Troponin I severely elevated indicating acute myocardial infarction',
      },
    });

    // 4. WARD_A Bed 05: General Ward
    this.broadcastTelemetryEvent({
      eventId: 'INIT-WARD-A-BED-05',
      eventType: 'VITAL_SIGNS_UPDATE',
      timestamp: nowIso,
      department: 'WARD_A',
      ward: 'WARD_A',
      bedId: 'WARD-A-BED-05',
      patientId: 'PAT-OFFLINE-9999',
      patientName: 'Vichhai Keo',
      data: {
        heartRate: 68,
        systolicBp: 118,
        diastolicBp: 74,
        calculatedMap: 88.7,
        spo2: 99,
        respirationRate: 16,
        temperature: 36.6,
        severity: 'NORMAL',
      },
    });
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

  /**
   * Seed Initial Clinic Invoices for Billing Reconciliation & Mobile Sync
   */
  private seedInitialInvoices(): void {
    const nowIso = new Date().toISOString();
    const inv1: SyncInvoiceDto = {
      id: 'INV-UUID-001',
      tenantId: 'TENANT-ROTANA-01',
      invoiceNumber: 'INV-2026-001',
      patientId: 'PAT-OFFLINE-0001',
      patientNameEn: 'Sophea Sok',
      patientNameKh: 'សុភា សុខ',
      totalAmount: 15.5,
      payableAmount: 15.5,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: 'KHQR',
      updatedAt: nowIso,
      monotonicVersion: 1001,
      vectorClock: { SERVER: 1 },
    };

    const inv2: SyncInvoiceDto = {
      id: 'INV-UUID-002',
      tenantId: 'TENANT-ROTANA-01',
      invoiceNumber: 'INV-2026-002',
      patientId: 'PAT-OFFLINE-0002',
      patientNameEn: 'Channary Lim',
      patientNameKh: 'ចាន់ណារី លីម',
      totalAmount: 60000,
      payableAmount: 60000,
      currency: 'KHR',
      status: 'UNPAID',
      paymentMethod: 'KHQR',
      updatedAt: nowIso,
      monotonicVersion: 1002,
      vectorClock: { SERVER: 1 },
    };

    const inv3: SyncInvoiceDto = {
      id: 'INV-UUID-003',
      tenantId: 'TENANT-ROTANA-01',
      invoiceNumber: 'INV-2026-003',
      patientId: 'PAT-OFFLINE-0003',
      patientNameEn: 'Dara Heng',
      patientNameKh: 'ដារ៉ា ហេង',
      totalAmount: 45.0,
      payableAmount: 45.0,
      currency: 'USD',
      status: 'PAID',
      paymentMethod: 'KHQR',
      tranId: 'TRX-BAKONG-PREV-01',
      paidAt: nowIso,
      updatedAt: nowIso,
      monotonicVersion: 1003,
      vectorClock: { SERVER: 2 },
    };

    this.invoicesStore.set(inv1.id, inv1);
    this.invoicesStore.set(inv2.id, inv2);
    this.invoicesStore.set(inv3.id, inv3);
  }

  /**
   * Register Mobile Device ECDSA secp256r1 Public Key for Hardware Attestation
   */
  public registerDevicePublicKey(deviceId: string, publicKeyPem: string): void {
    this.devicePublicKeys.set(deviceId, publicKeyPem);
  }

  public getDevicePublicKey(deviceId: string): string | undefined {
    return this.devicePublicKeys.get(deviceId);
  }

  public generateDeviceEcKeyPair(): { publicKey: string; privateKey: string } {
    return crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
  }

  public buildClaimCanonicalString(dto: {
    memberId: string;
    nationalId: string;
    benefitPackage: string;
    primaryIcd10: string;
    items: Array<{ actCode: string; quantity: number }>;
    clientTimestamp: string;
  }): string {
    const itemStr = dto.items.map((i) => `${i.actCode}:${i.quantity}`).join(',');
    return `${dto.memberId}|${dto.nationalId}|${dto.benefitPackage}|${dto.primaryIcd10}|${itemStr}|${dto.clientTimestamp}`;
  }

  public verifyDeviceSignature(
    canonicalString: string,
    signatureBase64: string,
    publicKeyPem: string
  ): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(canonicalString);
      verify.end();
      return verify.verify(publicKeyPem, signatureBase64, 'base64');
    } catch {
      return false;
    }
  }

  public generateCamdxToken(member: {
    memberId: string;
    nationalId: string;
    status: string;
    entitlements: string[];
  }): { token: string; expiresAt: string } {
    const now = Date.now();
    const expiresAt = new Date(now + 24 * 3600 * 1000).toISOString();
    const payload = {
      iss: 'CAMDX-NSSF-GATEWAY',
      sub: member.memberId,
      nid: member.nationalId,
      stat: member.status,
      ent: member.entitlements,
      iat: new Date(now).toISOString(),
      exp: expiresAt,
      exchangeId: `CAMDX-EX-${now}-${member.memberId.slice(-4)}`,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const hmac = crypto
      .createHmac('sha256', this.camdxSecretKey)
      .update(payloadB64)
      .digest('base64url');
    const token = `CAMDX-NSSF-V1.${payloadB64}.${hmac}`;
    return { token, expiresAt };
  }

  public verifyCamdxToken(token: string): { valid: boolean; payload?: any; reason?: string } {
    if (!token || !token.startsWith('CAMDX-NSSF-V1.')) {
      return { valid: false, reason: 'INVALID_TOKEN_FORMAT' };
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'MALFORMED_TOKEN' };
    }
    const payloadB64 = parts[1];
    const signature = parts[2];
    const expectedHmac = crypto
      .createHmac('sha256', this.camdxSecretKey)
      .update(payloadB64)
      .digest('base64url');
    if (signature !== expectedHmac) {
      return { valid: false, reason: 'TOKEN_SIGNATURE_TAMPERED' };
    }
    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (Date.now() > Date.parse(payload.exp)) {
        return { valid: false, reason: 'TOKEN_EXPIRED' };
      }
      return { valid: true, payload };
    } catch {
      return { valid: false, reason: 'INVALID_PAYLOAD_JSON' };
    }
  }

  /**
   * Endpoint 12: Cambodia NSSF Member Eligibility Verification via CamDX
   */
  public async verifyNssfEligibility(
    dto: NssfEligibilityRequestDto
  ): Promise<NssfEligibilityResponseDto> {
    if (!dto.memberId || typeof dto.memberId !== 'string') {
      throw new BadRequestException('memberId is required for NSSF eligibility verification');
    }

    const rawId = dto.memberId.trim();
    const normalizedDigits = rawId.replace(/^NSSF-/, '').replace(/\D/g, '');

    if (normalizedDigits.length !== 10) {
      throw new BadRequestException('memberId must be an exact 10-digit NSSF membership number');
    }

    let member = this.nssfMembersStore.get(normalizedDigits) || this.nssfMembersStore.get(rawId);

    if (!member) {
      if (normalizedDigits.startsWith('9')) {
        return {
          isEligible: false,
          memberId: normalizedDigits,
          memberBarcode: `NSSF-${normalizedDigits}`,
          memberNameEn: 'Unknown Member',
          memberNameKh: 'មិនស្គាល់សមាជិក',
          enterpriseName: 'NOT_FOUND',
          nationalId: dto.nationalId || '000000000',
          status: 'EXPIRED',
          activeContributionMonths: 0,
          entitlements: [],
          camdxVerificationToken: '',
          tokenExpiresAt: new Date().toISOString(),
          rejectionReason: 'MEMBER_NOT_FOUND_IN_NSSF_REGISTRY',
        };
      }

      member = {
        memberId: normalizedDigits,
        memberBarcode: `NSSF-${normalizedDigits}`,
        memberNameEn: 'Enterprise Member',
        memberNameKh: 'សមាជិកសហគ្រាស',
        enterpriseName: 'PHNOM PENH SPECIAL ECONOMIC ZONE',
        nationalId: dto.nationalId || '019283746',
        status: 'ACTIVE',
        activeContributionMonths: 18,
        entitlements: [
          {
            package: 'HEALTH_CARE',
            nameKh: 'ថែទាំសុខភាព',
            nameEn: 'Health Care',
            isCovered: true,
            coPayPercent: 0,
          },
          {
            package: 'OCCUPATIONAL_RISK',
            nameKh: 'ហានិភ័យការងារ',
            nameEn: 'Occupational Risk',
            isCovered: true,
            coPayPercent: 0,
          },
        ],
      };
      this.nssfMembersStore.set(normalizedDigits, member);
    }

    if (member.status !== 'ACTIVE' || member.activeContributionMonths < 6) {
      return {
        isEligible: false,
        memberId: member.memberId,
        memberBarcode: member.memberBarcode,
        memberNameEn: member.memberNameEn,
        memberNameKh: member.memberNameKh,
        enterpriseName: member.enterpriseName,
        nationalId: member.nationalId,
        status: member.status,
        activeContributionMonths: member.activeContributionMonths,
        entitlements: [],
        camdxVerificationToken: '',
        tokenExpiresAt: new Date().toISOString(),
        rejectionReason: 'CONTRIBUTION_LAPSED_INSUFFICIENT_MONTHS',
      };
    }

    const { token, expiresAt } = this.generateCamdxToken({
      memberId: member.memberId,
      nationalId: member.nationalId,
      status: member.status,
      entitlements: member.entitlements.map((e: any) => e.package),
    });

    return {
      isEligible: true,
      memberId: member.memberId,
      memberBarcode: member.memberBarcode,
      memberNameEn: member.memberNameEn,
      memberNameKh: member.memberNameKh,
      enterpriseName: member.enterpriseName,
      nationalId: member.nationalId,
      status: 'ACTIVE',
      activeContributionMonths: member.activeContributionMonths,
      entitlements: member.entitlements,
      camdxVerificationToken: token,
      tokenExpiresAt: expiresAt,
    };
  }

  /**
   * Endpoint 13: Cryptographically Signed NSSF e-Claim Submission via CamDX
   */
  public async submitNssfClaim(
    dto: NssfClaimSubmissionDto,
    headerSignature?: string
  ): Promise<NssfClaimSubmissionResponseDto> {
    if (!dto.memberId) {
      throw new BadRequestException('memberId is required');
    }
    const rawId = dto.memberId.trim();
    const normalizedDigits = rawId.replace(/^NSSF-/, '').replace(/\D/g, '');
    if (normalizedDigits.length !== 10) {
      throw new BadRequestException('memberId must be an exact 10-digit NSSF membership number');
    }

    // 1. Validate CamDX Verification Token
    if (!dto.camdxVerificationToken) {
      throw new BadRequestException('INVALID_CAMDX_VERIFICATION_TOKEN: CamDX cryptographic token is required');
    }
    const tokenVerification = this.verifyCamdxToken(dto.camdxVerificationToken);
    if (!tokenVerification.valid) {
      throw new BadRequestException(`INVALID_CAMDX_VERIFICATION_TOKEN: ${tokenVerification.reason}`);
    }

    // 2. Validate ICD-10 diagnostic syntax
    const icdRegex = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;
    if (!dto.primaryIcd10 || !icdRegex.test(dto.primaryIcd10.trim())) {
      throw new BadRequestException(
        `INVALID_ICD10_SYNTAX: Primary diagnostic code "${dto.primaryIcd10}" does not match ICD-10 standard format`
      );
    }
    if (dto.secondaryIcd10 && Array.isArray(dto.secondaryIcd10)) {
      for (const code of dto.secondaryIcd10) {
        if (!icdRegex.test(code.trim())) {
          throw new BadRequestException(
            `INVALID_ICD10_SYNTAX: Secondary diagnostic code "${code}" does not match ICD-10 standard format`
          );
        }
      }
    }

    // 3. Occupational Risk Dual-Coding Enforcement
    const isOccupationalRisk =
      dto.benefitPackage === 'OCCUPATIONAL_RISK' ||
      (dto.occupationalCause && dto.occupationalCause !== 'NONE');

    if (isOccupationalRisk) {
      // Primary must be Chapter XIX Injury/Trauma (S00-T88)
      const injuryRegex = /^[ST][0-9]{2}(\.[0-9]{1,2})?$/;
      if (!injuryRegex.test(dto.primaryIcd10.trim())) {
        throw new BadRequestException(
          'OCCUPATIONAL_RISK_DUAL_CODING_REQUIRED: Primary diagnosis for occupational risk must be Chapter XIX injury trauma S00-T88'
        );
      }

      // Secondary MUST contain at least one external cause code (Chapter XX: V01-Y98)
      const externalCauseRegex = /^[VWXY][0-9]{2}(\.[0-9]{1,2})?$/;
      const hasExternalCause =
        dto.secondaryIcd10 &&
        Array.isArray(dto.secondaryIcd10) &&
        dto.secondaryIcd10.some((c) => externalCauseRegex.test(c.trim()));

      if (!hasExternalCause) {
        throw new BadRequestException(
          'OCCUPATIONAL_RISK_DUAL_CODING_REQUIRED: External cause code V01-Y98 is mandatory for occupational risk claims'
        );
      }
    }

    // 4. StrongBox / TEE ECDSA secp256r1 Hardware Signature Verification
    const signature = dto.deviceSignature || headerSignature;
    if (signature) {
      const canonicalString = this.buildClaimCanonicalString(dto);
      const publicKeyPem = this.devicePublicKeys.get(dto.deviceId);
      if (publicKeyPem) {
        const isValid = this.verifyDeviceSignature(canonicalString, signature, publicKeyPem);
        if (!isValid) {
          throw new BadRequestException(
            'INVALID_HARDWARE_SIGNATURE: StrongBox ECDSA secp256r1 signature verification failed'
          );
        }
      } else {
        try {
          const buf = Buffer.from(signature, 'base64');
          if (buf.length < 32) {
            throw new Error('Signature length too short');
          }
        } catch {
          throw new BadRequestException(
            'INVALID_HARDWARE_SIGNATURE: Malformed ECDSA signature encoding'
          );
        }
      }
    }

    // 5. Tariff calculation & line items
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Claim must contain at least one medical act item');
    }

    let totalBilledKhr = 0;
    let totalNssfCoveredKhr = 0;
    let totalPatientCoPayKhr = 0;
    const lines: NssfAdjudicatedItemResultDto[] = [];
    let hasRejection = false;
    let hasApproval = false;

    for (const item of dto.items) {
      const tariff = this.nssfTariffItems.get(item.actCode);
      if (!tariff) {
        lines.push({
          actCode: item.actCode,
          descriptionEn: 'Unknown Act Code',
          descriptionKh: 'លេខកូដសកម្មភាពមិនស្គាល់',
          quantity: item.quantity,
          coefficientType: 'UNKNOWN',
          coefficientValue: 0,
          baseUnitValueKhr: 0,
          calculatedTariffKhr: 0,
          cappedCeilingKhr: 0,
          nssfCoveredKhr: 0,
          patientCoPayKhr: item.requestedPriceKhr || 0,
          nssfCoveredUsd: 0,
          patientCoPayUsd: Math.round(((item.requestedPriceKhr || 0) / 4100) * 100) / 100,
          status: 'REJECTED',
          rejectionReason: 'ACT_CODE_NOT_IN_NSSF_TARIFF_MASTER',
        });
        totalBilledKhr += item.requestedPriceKhr || 0;
        totalPatientCoPayKhr += item.requestedPriceKhr || 0;
        hasRejection = true;
        continue;
      }

      const calculatedTariff = tariff.coefficientValue * tariff.baseUnitValueKhr * item.quantity;
      const billedPrice =
        item.requestedPriceKhr !== undefined ? item.requestedPriceKhr : calculatedTariff;
      totalBilledKhr += billedPrice;

      // Pre-authorization check
      if (tariff.requiresPreAuthorization && !item.preAuthCode) {
        lines.push({
          actCode: tariff.actCode,
          descriptionEn: tariff.descriptionEn,
          descriptionKh: tariff.descriptionKh,
          quantity: item.quantity,
          coefficientType: tariff.coefficientType,
          coefficientValue: tariff.coefficientValue,
          baseUnitValueKhr: tariff.baseUnitValueKhr,
          calculatedTariffKhr: calculatedTariff,
          cappedCeilingKhr: tariff.maximumCeilingKhr * item.quantity,
          nssfCoveredKhr: 0,
          patientCoPayKhr: billedPrice,
          nssfCoveredUsd: 0,
          patientCoPayUsd: Math.round((billedPrice / 4100) * 100) / 100,
          status: 'REJECTED',
          rejectionReason: 'PREAUTH_REQUIRED_MISSING_APPROVAL',
        });
        totalPatientCoPayKhr += billedPrice;
        hasRejection = true;
        continue;
      }

      // Ceiling capping calculation
      const ceilingTotal = tariff.maximumCeilingKhr * item.quantity;
      const coveredKhr = Math.min(billedPrice, ceilingTotal);
      const coPayKhr = Math.max(0, billedPrice - ceilingTotal);

      let lineStatus: 'APPROVED' | 'PARTIALLY_APPROVED' = 'APPROVED';
      if (coPayKhr > 0) {
        lineStatus = 'PARTIALLY_APPROVED';
      }

      const coveredUsd = Math.round((coveredKhr / 4100) * 100) / 100;
      const coPayUsd = Math.round((coPayKhr / 4100) * 100) / 100;

      totalNssfCoveredKhr += coveredKhr;
      totalPatientCoPayKhr += coPayKhr;
      hasApproval = true;

      lines.push({
        actCode: tariff.actCode,
        descriptionEn: tariff.descriptionEn,
        descriptionKh: tariff.descriptionKh,
        quantity: item.quantity,
        coefficientType: tariff.coefficientType,
        coefficientValue: tariff.coefficientValue,
        baseUnitValueKhr: tariff.baseUnitValueKhr,
        calculatedTariffKhr: calculatedTariff,
        cappedCeilingKhr: ceilingTotal,
        nssfCoveredKhr: coveredKhr,
        patientCoPayKhr: coPayKhr,
        nssfCoveredUsd: coveredUsd,
        patientCoPayUsd: coPayUsd,
        status: lineStatus,
      });
    }

    let overallStatus: 'APPROVED' | 'PARTIAL' | 'REJECTED' = 'APPROVED';
    if (hasRejection && hasApproval) {
      overallStatus = 'PARTIAL';
    } else if (hasRejection && !hasApproval) {
      overallStatus = 'REJECTED';
    } else if (totalPatientCoPayKhr > 0) {
      overallStatus = 'PARTIAL';
    }

    const now = new Date();
    const adjudicatedAt = now.toISOString();
    const claimId = dto.claimId || `CLM-NSSF-${now.getTime()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const camdxReceiptReference = `CAMDX-NSSF-REC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const totalBilledUsd = Math.round((totalBilledKhr / 4100) * 100) / 100;
    const totalNssfCoveredUsd = Math.round((totalNssfCoveredKhr / 4100) * 100) / 100;
    const totalPatientCoPayUsd = Math.round((totalPatientCoPayKhr / 4100) * 100) / 100;

    const receiptData = `${claimId}|${camdxReceiptReference}|${totalNssfCoveredKhr}|${adjudicatedAt}`;
    const camdxVerificationHash = crypto.createHash('sha256').update(receiptData).digest('hex');

    // Bilingual receipt message strictly without parentheses
    const receiptMessageKh = `បង្កាន់ដៃទាមទារសំណង ប.ស.ស. តាមប្រព័ន្ធ CamDX: ${overallStatus === 'APPROVED' ? 'ជោគជ័យ' : overallStatus === 'PARTIAL' ? 'ជោគជ័យមួយផ្នែក' : 'បដិសេធ'}`;
    const receiptMessageEn = `CamDX NSSF Claim Receipt Reference: ${overallStatus}`;

    const response: NssfClaimSubmissionResponseDto = {
      success: overallStatus !== 'REJECTED',
      claimId,
      camdxReceiptReference,
      memberId: normalizedDigits,
      overallStatus,
      totalBilledKhr,
      totalNssfCoveredKhr,
      totalPatientCoPayKhr,
      totalBilledUsd,
      totalNssfCoveredUsd,
      totalPatientCoPayUsd,
      exchangeRateKhrUsd: 4100,
      lines,
      adjudicatedAt,
      camdxVerificationHash,
      receiptMessageKh,
      receiptMessageEn,
    };

    this.nssfClaimsStore.set(claimId, response);
    this.nssfClaimsStore.set(camdxReceiptReference, response);

    return response;
  }

  public getNssfTariffs(): any[] {
    return Array.from(this.nssfTariffItems.values());
  }

  public getNssfClaim(claimId: string): NssfClaimSubmissionResponseDto | undefined {
    return this.nssfClaimsStore.get(claimId);
  }

  /**
   * Seed NSSF Tariffs and Cambodia Member Registry
   */
  private seedNssfMasterData(): void {
    const tariffs = [
      {
        actCode: 'NSSF-OPD-001',
        category: 'CONSULTATION',
        descriptionEn: 'General Medical Consultation',
        descriptionKh: 'ការពិគ្រោះជំងឺទូទៅ',
        coefficientType: 'FIXED_PACKAGE',
        coefficientValue: 20000,
        baseUnitValueKhr: 1,
        maximumCeilingKhr: 20000,
        requiresPreAuthorization: false,
        defaultIcd10Indication: 'Z00.0',
      },
      {
        actCode: 'NSSF-OPD-002',
        category: 'CONSULTATION',
        descriptionEn: 'Specialist Medical Consultation',
        descriptionKh: 'ការពិគ្រោះជំងឺឯកទេស',
        coefficientType: 'FIXED_PACKAGE',
        coefficientValue: 40000,
        baseUnitValueKhr: 1,
        maximumCeilingKhr: 40000,
        requiresPreAuthorization: false,
        defaultIcd10Indication: 'Z01.8',
      },
      {
        actCode: 'NSSF-SURG-K05',
        category: 'MINOR_SURGERY',
        descriptionEn: 'Minor Wound Debridement and Suture',
        descriptionKh: 'ការលាងសម្អាតនិងដេរស្នាមរបួសតូច',
        coefficientType: 'K_SURGICAL',
        coefficientValue: 5,
        baseUnitValueKhr: 12000,
        maximumCeilingKhr: 60000,
        requiresPreAuthorization: false,
        defaultIcd10Indication: 'T14.1',
      },
      {
        actCode: 'NSSF-SURG-K50',
        category: 'INTERMEDIATE_SURGERY',
        descriptionEn: 'Appendectomy or Hernia Repair',
        descriptionKh: 'ការវះកាត់ដំបៅពោះវៀនខ្នែង ឬក្លន',
        coefficientType: 'K_SURGICAL',
        coefficientValue: 50,
        baseUnitValueKhr: 12000,
        maximumCeilingKhr: 600000,
        requiresPreAuthorization: false,
        defaultIcd10Indication: 'K35.8',
      },
      {
        actCode: 'NSSF-SURG-K75',
        category: 'MAJOR_SURGERY',
        descriptionEn: 'Open Reduction and Internal Fixation of Fracture',
        descriptionKh: 'ការវះកាត់តឆ្អឹងបាក់ដោយប្រើដែក',
        coefficientType: 'K_SURGICAL',
        coefficientValue: 75,
        baseUnitValueKhr: 12000,
        maximumCeilingKhr: 900000,
        requiresPreAuthorization: true,
        defaultIcd10Indication: 'S52.5',
      },
      {
        actCode: 'NSSF-SURG-K100',
        category: 'COMPLEX_SURGERY',
        descriptionEn: 'Major Craniotomy or Emergency Laparotomy',
        descriptionKh: 'ការវះកាត់ខួរក្បាល ឬពោះកម្រិតធំ',
        coefficientType: 'K_SURGICAL',
        coefficientValue: 100,
        baseUnitValueKhr: 12000,
        maximumCeilingKhr: 1200000,
        requiresPreAuthorization: true,
        defaultIcd10Indication: 'S06.0',
      },
      {
        actCode: 'NSSF-LAB-B05',
        category: 'LABORATORY',
        descriptionEn: 'Complete Blood Count',
        descriptionKh: 'ការវិភាគឈាមទូទៅ',
        coefficientType: 'B_LABORATORY',
        coefficientValue: 5,
        baseUnitValueKhr: 1000,
        maximumCeilingKhr: 5000,
        requiresPreAuthorization: false,
      },
      {
        actCode: 'NSSF-LAB-B12',
        category: 'LABORATORY',
        descriptionEn: 'Liver Function Panel AST and ALT',
        descriptionKh: 'ការធ្វើតេស្តមុខងារថ្លើម',
        coefficientType: 'B_LABORATORY',
        coefficientValue: 12,
        baseUnitValueKhr: 1000,
        maximumCeilingKhr: 12000,
        requiresPreAuthorization: false,
      },
      {
        actCode: 'NSSF-LAB-B50',
        category: 'LABORATORY',
        descriptionEn: 'Blood Culture and Antibiotic Sensitivity',
        descriptionKh: 'ការបណ្តុះមេរោគក្នុងឈាម',
        coefficientType: 'B_LABORATORY',
        coefficientValue: 50,
        baseUnitValueKhr: 1000,
        maximumCeilingKhr: 50000,
        requiresPreAuthorization: false,
      },
      {
        actCode: 'NSSF-IMG-R12',
        category: 'IMAGING',
        descriptionEn: 'Digital Plain X-Ray Chest or Extremities',
        descriptionKh: 'ការថតកាំរស្មីអ៊ិចទ្រូង ឬអវយវៈ',
        coefficientType: 'R_IMAGING',
        coefficientValue: 12,
        baseUnitValueKhr: 2500,
        maximumCeilingKhr: 30000,
        requiresPreAuthorization: false,
      },
      {
        actCode: 'NSSF-IMG-R30',
        category: 'IMAGING',
        descriptionEn: 'Abdominal and Pelvic Ultrasonography',
        descriptionKh: 'ការពិនិត្យអេកូសាស្ត្រពោះ',
        coefficientType: 'R_IMAGING',
        coefficientValue: 30,
        baseUnitValueKhr: 2500,
        maximumCeilingKhr: 75000,
        requiresPreAuthorization: false,
      },
      {
        actCode: 'NSSF-IMG-R80',
        category: 'IMAGING',
        descriptionEn: 'Multi-Slice Computed Tomography Scan',
        descriptionKh: 'ការថតស៊ីធីស្កេនច្រើនកាត់',
        coefficientType: 'R_IMAGING',
        coefficientValue: 80,
        baseUnitValueKhr: 2500,
        maximumCeilingKhr: 200000,
        requiresPreAuthorization: true,
      },
      {
        actCode: 'NSSF-MAT-001',
        category: 'MATERNITY',
        descriptionEn: 'Normal Vaginal Delivery Clinical Package',
        descriptionKh: 'កញ្ចប់សម្រាលកូនធម្មជាតិ',
        coefficientType: 'FIXED_PACKAGE',
        coefficientValue: 400000,
        baseUnitValueKhr: 1,
        maximumCeilingKhr: 400000,
        requiresPreAuthorization: false,
        defaultIcd10Indication: 'O80.0',
      },
      {
        actCode: 'NSSF-MAT-002',
        category: 'MATERNITY',
        descriptionEn: 'Caesarean Section Delivery Clinical Package',
        descriptionKh: 'កញ្ចប់សម្រាលកូនដោយវះកាត់',
        coefficientType: 'FIXED_PACKAGE',
        coefficientValue: 800000,
        baseUnitValueKhr: 1,
        maximumCeilingKhr: 800000,
        requiresPreAuthorization: true,
        defaultIcd10Indication: 'O82.0',
      },
    ];

    for (const t of tariffs) {
      this.nssfTariffItems.set(t.actCode, t);
    }

    const members = [
      {
        memberId: '1029384756',
        memberBarcode: 'NSSF-1029384756',
        memberNameEn: 'Sophea Sok',
        memberNameKh: 'សុភា សុខ',
        enterpriseName: 'CANADIA GARMENT FACTORY',
        nationalId: '010294812',
        status: 'ACTIVE' as const,
        activeContributionMonths: 24,
        entitlements: [
          {
            package: 'HEALTH_CARE' as const,
            nameKh: 'ថែទាំសុខភាព',
            nameEn: 'Health Care',
            isCovered: true,
            coPayPercent: 0,
          },
          {
            package: 'OCCUPATIONAL_RISK' as const,
            nameKh: 'ហានិភ័យការងារ',
            nameEn: 'Occupational Risk',
            isCovered: true,
            coPayPercent: 0,
          },
          {
            package: 'MATERNITY' as const,
            nameKh: 'មាតុភាព',
            nameEn: 'Maternity',
            isCovered: true,
            coPayPercent: 0,
          },
        ],
      },
      {
        memberId: '2039485761',
        memberBarcode: 'NSSF-2039485761',
        memberNameEn: 'Rithy Chan',
        memberNameKh: 'រិទ្ធី ចាន់',
        enterpriseName: 'CHIP MONG INSERVICE',
        nationalId: '020491823',
        status: 'ACTIVE' as const,
        activeContributionMonths: 14,
        entitlements: [
          {
            package: 'HEALTH_CARE' as const,
            nameKh: 'ថែទាំសុខភាព',
            nameEn: 'Health Care',
            isCovered: true,
            coPayPercent: 0,
          },
          {
            package: 'OCCUPATIONAL_RISK' as const,
            nameKh: 'ហានិភ័យការងារ',
            nameEn: 'Occupational Risk',
            isCovered: true,
            coPayPercent: 0,
          },
          {
            package: 'MATERNITY' as const,
            nameKh: 'មាតុភាព',
            nameEn: 'Maternity',
            isCovered: false,
            coPayPercent: 0,
          },
        ],
      },
      {
        memberId: '3049586772',
        memberBarcode: 'NSSF-3049586772',
        memberNameEn: 'Bopha Vann',
        memberNameKh: 'បុប្ផា វ៉ាន់',
        enterpriseName: 'KONG HONG TEXTILE',
        nationalId: '030192834',
        status: 'SUSPENDED' as const,
        activeContributionMonths: 3,
        entitlements: [],
      },
    ];

    for (const m of members) {
      this.nssfMembersStore.set(m.memberId, m);
      this.nssfMembersStore.set(m.memberBarcode, m);
    }
  }
}
