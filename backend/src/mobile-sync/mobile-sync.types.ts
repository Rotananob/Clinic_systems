// Mobile Sync & Device Gateway Type Definitions
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

export const _typeStripping = {};
export const MIN_SUPPORTED_APP_VERSION = '1.0.0';
export const DEFAULT_SYNC_LIMIT = 100;
export const DEFAULT_RURAL_CHUNK_SIZE = 25;
export const MAX_RURAL_CHUNK_SIZE = 50;

export type SyncEntityType = 'PATIENT' | 'VITAL_SIGNS' | 'FORMULARY_ITEM';
export type MutationOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type ConflictResolutionStrategy = 'LATEST_TIMESTAMP_WINS' | 'VECTOR_CLOCK_LWW' | 'MONOTONIC_SEQUENCE';
export type MutationStatus = 'APPLIED' | 'CONFLICT_IGNORED' | 'ERROR';
export type DeviceStatus = 'ACTIVE' | 'REGISTERED' | 'SUSPENDED';
export type NetworkTier = '2G' | '3G' | '4G' | 'BROADBAND' | 'OFFLINE';
export type CausalRelation = 'BEFORE' | 'AFTER' | 'EQUAL' | 'CONCURRENT';

export interface RegisteredDevice {
  deviceId: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion: string;
  tenantId?: string;
  userId?: string;
  networkTier?: NetworkTier;
  registeredAt: string;
  lastHandshakeAt: string;
  lastSyncAt?: string;
  vectorClock?: Record<string, number>;
  status: DeviceStatus;
}

export interface HandshakeRequestDto {
  deviceId: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion: string;
  tenantId?: string;
  userId?: string;
  networkTier?: NetworkTier;
  clientTimeUtc?: string;
  clientVectorClock?: Record<string, number>;
}

export interface HandshakeResponseDto {
  success: boolean;
  status: string;
  deviceId: string;
  serverTimeUtc: string;
  serverTimeMs: number;
  serverVectorClock: Record<string, number>;
  serverMonotonicSequence: number;
  minSupportedVersion: string;
  clientAppVersion: string;
  isUpgradeRequired: boolean;
  syncSessionId: string;
  supportedEntities: SyncEntityType[];
  heartbeatIntervalSeconds: number;
  recommendedChunkSize: number;
  lowBandwidthOptimized: boolean;
  message: string;
}

export interface PullDeltaRequestDto {
  sinceTimestamp: string | number;
  tenantId?: string;
  deviceId?: string;
  limit?: number;
  chunkSize?: number;
  cursor?: string;
  lowBandwidthMode?: boolean;
  networkTier?: NetworkTier;
  clientVectorClock?: Record<string, number>;
}

export interface SyncPatientDto {
  id: string;
  tenantId?: string;
  patientCode: string;
  nameEn: string;
  nameKh?: string;
  gender: string;
  dob?: string;
  phone: string;
  nationalId?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  updatedAt: string;
  isDeleted?: boolean;
  vectorClock?: Record<string, number>;
  monotonicVersion?: number;
}

export interface SyncVitalSignsDto {
  id: string;
  tenantId?: string;
  patientId: string;
  visitId?: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  spO2?: number;
  weightKg?: number;
  heightCm?: number;
  recordedAt: string;
  recordedByStaffId?: string;
  updatedAt: string;
  isDeleted?: boolean;
  vectorClock?: Record<string, number>;
  monotonicVersion?: number;
}

export interface SyncFormularyItemDto {
  id: string;
  tenantId?: string;
  code: string;
  nameEn: string;
  nameKh?: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  category: string;
  unitPriceUsd: number;
  unitPriceKhr: number;
  isInStock: boolean;
  stockQuantity: number;
  updatedAt: string;
  isDeleted?: boolean;
  vectorClock?: Record<string, number>;
  monotonicVersion?: number;
}

export interface PullDeltaResponseDto {
  sinceTimestamp: string;
  currentServerTimestamp: string;
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
  chunkIndex: number;
  remainingRecordsCount: number;
  isBandwidthOptimized: boolean;
  payloadSizeBytes?: number;
  serverVectorClock: Record<string, number>;
  serverMonotonicSequence: number;
  patients: SyncPatientDto[];
  vitalSigns: SyncVitalSignsDto[];
  formularyItems: SyncFormularyItemDto[];
  counts: {
    patients: number;
    vitalSigns: number;
    formularyItems: number;
    total: number;
  };
}

export interface OfflineMutationDto {
  mutationId: string;
  deviceId: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: MutationOperation;
  payload: Record<string, any>;
  clientTimestamp: string;
  clientTimestampMs?: number;
  vectorClock?: Record<string, number>;
  monotonicTimestamp?: number;
  lamportTime?: number;
  tenantId?: string;
  userId?: string;
}

export interface ConflictDetailsDto {
  strategy: ConflictResolutionStrategy;
  serverTimestamp: string;
  clientTimestamp: string;
  winner: 'CLIENT' | 'SERVER';
  causalRelation?: CausalRelation;
  serverVectorClock?: Record<string, number>;
  clientVectorClock?: Record<string, number>;
  serverMonotonicVersion?: number;
  clientMonotonicVersion?: number;
  reason: string;
}

export interface MutationResultDto {
  mutationId: string;
  entityType: SyncEntityType;
  entityId: string;
  status: MutationStatus;
  conflictDetails?: ConflictDetailsDto;
  errorMessage?: string;
}

export interface PushMutationsRequestDto {
  deviceId: string;
  batchId?: string;
  clientVectorClock?: Record<string, number>;
  mutations: OfflineMutationDto[];
}

export interface PushMutationsResponseDto {
  success: boolean;
  batchId: string;
  serverTimeUtc: string;
  serverTimeMs: number;
  serverVectorClock: Record<string, number>;
  serverMonotonicSequence: number;
  totalProcessed: number;
  appliedCount: number;
  conflictCount: number;
  errorCount: number;
  results: MutationResultDto[];
}

// Runtime symbol exports for Node.js 24 type stripping
export const SyncEntityType = {};
export const MutationOperation = {};
export const ConflictResolutionStrategy = {};
export const MutationStatus = {};
export const DeviceStatus = {};
export const NetworkTier = {};
export const CausalRelation = {};
export const RegisteredDevice = {};
export const HandshakeRequestDto = {};
export const HandshakeResponseDto = {};
export const PullDeltaRequestDto = {};
export const SyncPatientDto = {};
export const SyncVitalSignsDto = {};
export const SyncFormularyItemDto = {};
export const PullDeltaResponseDto = {};
export const OfflineMutationDto = {};
export const ConflictDetailsDto = {};
export const MutationResultDto = {};
export const PushMutationsRequestDto = {};
export const PushMutationsResponseDto = {};
