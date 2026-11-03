// Mobile Sync & Device Gateway Service
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { BadRequestException, Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.ts';
import {
  _typeStripping,
  MIN_SUPPORTED_APP_VERSION,
  DEFAULT_SYNC_LIMIT,
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
} from './mobile-sync.types.ts';

export class MobileSyncService {
  private readonly logger = new Logger(MobileSyncService.name);

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

  private readonly prisma?: PrismaService;

  constructor(prisma?: PrismaService) {
    this.prisma = prisma;
    this.seedFormularyCatalog();
    this.seedInitialClinicalData();
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
      registeredAt: existingDevice ? existingDevice.registeredAt : serverTimeUtc,
      lastHandshakeAt: serverTimeUtc,
      lastSyncAt: existingDevice?.lastSyncAt,
      status: 'ACTIVE',
    };

    this.registeredDevices.set(dto.deviceId, registeredDevice);

    return {
      success: true,
      status: 'REGISTERED',
      deviceId: dto.deviceId,
      serverTimeUtc,
      serverTimeMs,
      minSupportedVersion: MIN_SUPPORTED_APP_VERSION,
      clientAppVersion: dto.appVersion,
      isUpgradeRequired: false,
      syncSessionId,
      supportedEntities: ['PATIENT', 'VITAL_SIGNS', 'FORMULARY_ITEM'],
      heartbeatIntervalSeconds: 60,
      message: 'Mobile client successfully registered and server time synchronized',
    };
  }

  /**
   * Endpoint 2: Delta Sync Returning Patients, Vital Signs, and Formulary Items
   */
  public async pullDelta(dto: PullDeltaRequestDto): Promise<PullDeltaResponseDto> {
    let sinceTimeMs = 0;
    if (typeof dto.sinceTimestamp === 'number') {
      sinceTimeMs = dto.sinceTimestamp;
    } else if (typeof dto.sinceTimestamp === 'string' && dto.sinceTimestamp.trim().length > 0) {
      const parsed = Date.parse(dto.sinceTimestamp);
      sinceTimeMs = isNaN(parsed) ? 0 : parsed;
    }

    const limit = dto.limit && dto.limit > 0 ? dto.limit : DEFAULT_SYNC_LIMIT;
    const now = new Date();
    const currentServerTimestamp = now.toISOString();

    // 1. Pull updated Patients
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

    // Attempt Prisma fetch if connected
    if (this.prisma && typeof (this.prisma as any).patient?.findMany === 'function') {
      try {
        const prismaPatients = await (this.prisma as any).patient.findMany({
          where: {
            ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
            updatedAt: { gt: new Date(sinceTimeMs) },
          },
          take: limit,
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

    // 2. Pull updated Vital Signs
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

    // 3. Pull updated Formulary Items
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

    // Apply pagination limit
    const slicedPatients = updatedPatients.slice(0, limit);
    const slicedVitals = updatedVitals.slice(0, limit);
    const slicedFormulary = updatedFormulary.slice(0, limit);

    const hasMore =
      updatedPatients.length > limit ||
      updatedVitals.length > limit ||
      updatedFormulary.length > limit;

    // Update lastSyncAt for calling device
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
    }

    return {
      sinceTimestamp: new Date(sinceTimeMs).toISOString(),
      currentServerTimestamp,
      hasMore,
      patients: slicedPatients,
      vitalSigns: slicedVitals,
      formularyItems: slicedFormulary,
      counts: {
        patients: slicedPatients.length,
        vitalSigns: slicedVitals.length,
        formularyItems: slicedFormulary.length,
        total: slicedPatients.length + slicedVitals.length + slicedFormulary.length,
      },
    };
  }

  /**
   * Endpoint 3: Batch Offline Mutation Ingest with Latest Timestamp Wins Conflict Resolution
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

    // Update device timestamp
    const dev = this.registeredDevices.get(dto.deviceId);
    if (dev) {
      dev.lastSyncAt = serverTimeUtc;
    }

    return {
      success: errorCount === 0,
      batchId,
      serverTimeUtc,
      serverTimeMs,
      totalProcessed: dto.mutations.length,
      appliedCount,
      conflictCount,
      errorCount,
      results,
    };
  }

  /**
   * Conflict Resolution Logic: Latest Timestamp Wins (LWW)
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
      // New patient entity created offline
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
      };

      this.patientsStore.set(mutation.entityId, newPatient);
      return {
        mutationId: mutation.mutationId,
        entityType: 'PATIENT',
        entityId: mutation.entityId,
        status: 'APPLIED',
      };
    }

    // Existing patient: apply Latest Timestamp Wins
    const serverTimestampMs = Date.parse(existing.updatedAt);

    if (clientTimestampMs >= serverTimestampMs) {
      // Client modification timestamp is equal or newer: Client Wins
      const updated: SyncPatientDto = {
        ...existing,
        ...mutation.payload,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
      };

      this.patientsStore.set(mutation.entityId, updated);

      return {
        mutationId: mutation.mutationId,
        entityType: 'PATIENT',
        entityId: mutation.entityId,
        status: 'APPLIED',
        conflictDetails: {
          strategy: 'LATEST_TIMESTAMP_WINS',
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'CLIENT',
          reason: 'Client mutation timestamp is equal or newer than server record',
        },
      };
    } else {
      // Server record has newer timestamp: Server Wins, Ignore stale client modification
      return {
        mutationId: mutation.mutationId,
        entityType: 'PATIENT',
        entityId: mutation.entityId,
        status: 'CONFLICT_IGNORED',
        conflictDetails: {
          strategy: 'LATEST_TIMESTAMP_WINS',
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'SERVER',
          reason: 'Server record has newer timestamp than incoming client mutation',
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
      };

      this.vitalSignsStore.set(mutation.entityId, newVitals);
      return {
        mutationId: mutation.mutationId,
        entityType: 'VITAL_SIGNS',
        entityId: mutation.entityId,
        status: 'APPLIED',
      };
    }

    const serverTimestampMs = Date.parse(existing.updatedAt);

    if (clientTimestampMs >= serverTimestampMs) {
      const updated: SyncVitalSignsDto = {
        ...existing,
        ...mutation.payload,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
      };

      this.vitalSignsStore.set(mutation.entityId, updated);

      return {
        mutationId: mutation.mutationId,
        entityType: 'VITAL_SIGNS',
        entityId: mutation.entityId,
        status: 'APPLIED',
        conflictDetails: {
          strategy: 'LATEST_TIMESTAMP_WINS',
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'CLIENT',
          reason: 'Client mutation timestamp is equal or newer than server record',
        },
      };
    } else {
      return {
        mutationId: mutation.mutationId,
        entityType: 'VITAL_SIGNS',
        entityId: mutation.entityId,
        status: 'CONFLICT_IGNORED',
        conflictDetails: {
          strategy: 'LATEST_TIMESTAMP_WINS',
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'SERVER',
          reason: 'Server record has newer timestamp than incoming client mutation',
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
      };

      this.formularyStore.set(mutation.entityId, newItem);
      return {
        mutationId: mutation.mutationId,
        entityType: 'FORMULARY_ITEM',
        entityId: mutation.entityId,
        status: 'APPLIED',
      };
    }

    const serverTimestampMs = Date.parse(existing.updatedAt);

    if (clientTimestampMs >= serverTimestampMs) {
      const updated: SyncFormularyItemDto = {
        ...existing,
        ...mutation.payload,
        updatedAt: mutation.clientTimestamp || serverTimeUtc,
        isDeleted: mutation.operation === 'DELETE',
      };

      this.formularyStore.set(mutation.entityId, updated);

      return {
        mutationId: mutation.mutationId,
        entityType: 'FORMULARY_ITEM',
        entityId: mutation.entityId,
        status: 'APPLIED',
        conflictDetails: {
          strategy: 'LATEST_TIMESTAMP_WINS',
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'CLIENT',
          reason: 'Client mutation timestamp is equal or newer than server record',
        },
      };
    } else {
      return {
        mutationId: mutation.mutationId,
        entityType: 'FORMULARY_ITEM',
        entityId: mutation.entityId,
        status: 'CONFLICT_IGNORED',
        conflictDetails: {
          strategy: 'LATEST_TIMESTAMP_WINS',
          serverTimestamp: existing.updatedAt,
          clientTimestamp: mutation.clientTimestamp || new Date(clientTimestampMs).toISOString(),
          winner: 'SERVER',
          reason: 'Server record has newer timestamp than incoming client mutation',
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
      },
    ];

    for (const v of vitals) {
      this.vitalSignsStore.set(v.id, v);
    }
  }
}
