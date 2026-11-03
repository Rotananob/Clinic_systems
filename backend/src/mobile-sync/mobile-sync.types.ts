// Mobile Sync & Device Gateway Type Definitions
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

export const _typeStripping = {};
export const MIN_SUPPORTED_APP_VERSION = '1.0.0';
export const DEFAULT_SYNC_LIMIT = 100;
export const DEFAULT_RURAL_CHUNK_SIZE = 25;
export const MAX_RURAL_CHUNK_SIZE = 50;
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 15000;

export type SyncEntityType = 'PATIENT' | 'VITAL_SIGNS' | 'FORMULARY_ITEM' | 'INVOICE';
export type MutationOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type ConflictResolutionStrategy = 'LATEST_TIMESTAMP_WINS' | 'VECTOR_CLOCK_LWW' | 'MONOTONIC_SEQUENCE';
export type MutationStatus = 'APPLIED' | 'CONFLICT_IGNORED' | 'ERROR';
export type DeviceStatus = 'ACTIVE' | 'REGISTERED' | 'SUSPENDED';
export type NetworkTier = '2G' | '3G' | '4G' | 'BROADBAND' | 'OFFLINE';
export type CausalRelation = 'BEFORE' | 'AFTER' | 'EQUAL' | 'CONCURRENT';

// Real-Time Telemetry & Alert Types
export type TelemetryEventType =
  | 'VITAL_SIGNS_UPDATE'
  | 'ECG_TELEMETRY'
  | 'LAB_PANIC_ALERT'
  | 'HEARTBEAT'
  | 'KHQR_PAYMENT_SETTLED';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'PANIC_CRITICAL';

export interface TelemetryBedVitalsData {
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  calculatedMap: number;
  spo2: number;
  respirationRate: number;
  temperature: number;
  severity: AlertSeverity;
}

export interface TelemetryEcgData {
  rhythm: string;
  arrhythmiaType: string;
  stDeviationMm: number;
  prIntervalMs: number;
  qrsDurationMs: number;
  calculatedQtcMs: number;
  leadStatus: string;
  arrhythmiaDetected: boolean;
  alarmActive: boolean;
}

export interface TelemetryLabPanicData {
  testName: string;
  measuredValue: number;
  unit: string;
  referenceLow: number;
  referenceHigh: number;
  severity: AlertSeverity;
  labTechnicianId: string;
  requiresImmediateReview: boolean;
  notificationMessageKh: string;
  notificationMessageEn: string;
}

export interface TelemetryHeartbeatData {
  status: string;
  heartbeatIntervalSeconds: number;
  serverTimeUtc: string;
  serverTimeMs: number;
  activeSubscribersCount: number;
}

export interface TelemetryKhqrSettledData {
  tranId: string;
  hash: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: 'USD' | 'KHR';
  settledAt: string;
  payerAccount?: string;
  bakongAccountId?: string;
  isSettled: boolean;
  notificationMessageKh: string;
  notificationMessageEn: string;
}

export interface TelemetryStreamEvent {
  eventId: string;
  eventType: TelemetryEventType;
  timestamp: string;
  department: string;
  ward?: string;
  bedId?: string;
  patientId?: string;
  patientName?: string;
  data:
    | TelemetryBedVitalsData
    | TelemetryEcgData
    | TelemetryLabPanicData
    | TelemetryHeartbeatData
    | TelemetryKhqrSettledData
    | Record<string, any>;
}

export interface TelemetryStreamFilterDto {
  department?: string;
  ward?: string;
  deviceId?: string;
  heartbeatIntervalMs?: number;
}

export interface TelemetryBroadcastDto {
  eventType: TelemetryEventType;
  department: string;
  ward?: string;
  bedId?: string;
  patientId?: string;
  patientName?: string;
  data: Record<string, any>;
}

export interface SseMessageEvent {
  data: string;
  id?: string;
  type?: string;
  retry?: number;
}

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
  includeInvoices?: boolean;
  entityTypes?: SyncEntityType[];
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

export interface SyncInvoiceDto {
  id: string;
  tenantId?: string;
  invoiceNumber: string;
  patientId: string;
  patientNameEn?: string;
  patientNameKh?: string;
  totalAmount: number;
  payableAmount: number;
  currency: 'USD' | 'KHR';
  status: 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod: 'KHQR' | 'CASH' | 'CARD';
  tranId?: string;
  cashierId?: string;
  paidAt?: string;
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
  invoices?: SyncInvoiceDto[];
  counts: {
    patients: number;
    vitalSigns: number;
    formularyItems: number;
    invoices?: number;
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

export interface MobilePushNotificationDto {
  notificationId: string;
  targetDeviceId?: string;
  title: string;
  titleKh: string;
  body: string;
  bodyKh: string;
  category: 'BILLING' | 'CLINICAL_ALERT' | 'SYSTEM';
  priority: 'HIGH' | 'NORMAL';
  data: Record<string, any>;
  dispatchedAt: string;
  status: 'QUEUED' | 'DELIVERED';
}

export interface KhqrSettlementWebhookDto {
  tranId: string;
  hash: string;
  amount: number;
  currency: 'USD' | 'KHR';
  invoiceId: string;
  invoiceNumber?: string;
  status: 'SUCCESS' | 'SETTLED' | 'FAILED';
  settledAt?: string;
  bakongAccountId?: string;
  payerAccount?: string;
  tenantId?: string;
  deviceId?: string;
  cashierId?: string;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface KhqrSettlementResponseDto {
  success: boolean;
  idempotent: boolean;
  tranId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: 'PAID' | 'UNPAID' | 'FAILED';
  payableAmount: number;
  currency: 'USD' | 'KHR';
  settledAt: string;
  serverMonotonicSequence: number;
  serverVectorClock: Record<string, number>;
  pushNotification?: MobilePushNotificationDto;
  broadcastEvent?: TelemetryStreamEvent;
}

// NSSF Cambodia & CamDX Mobile Integration Types
export type NssfEntitlementPackage = 'HEALTH_CARE' | 'OCCUPATIONAL_RISK' | 'MATERNITY';
export type NssfMemberStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
export type NssfEncounterType = 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY';
export type NssfOccupationalCause =
  | 'COMMUTING_ACCIDENT'
  | 'WORKPLACE_ACCIDENT'
  | 'OCCUPATIONAL_DISEASE'
  | 'NONE';
export type NssfClaimLineStatus = 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
export type NssfOverallClaimStatus = 'APPROVED' | 'PARTIAL' | 'REJECTED';

export interface NssfBenefitEntitlementDto {
  package: NssfEntitlementPackage;
  nameKh: string;
  nameEn: string;
  isCovered: boolean;
  coPayPercent: number;
  maxCeilingKhr?: number;
}

export interface NssfEligibilityRequestDto {
  memberId: string;
  nationalId?: string;
  facilityCode?: string;
  deviceId?: string;
  requestTimestamp?: string;
}

export interface NssfEligibilityResponseDto {
  isEligible: boolean;
  memberId: string;
  memberBarcode: string;
  memberNameEn: string;
  memberNameKh: string;
  enterpriseName: string;
  nationalId: string;
  status: NssfMemberStatus;
  activeContributionMonths: number;
  entitlements: NssfBenefitEntitlementDto[];
  camdxVerificationToken: string;
  tokenExpiresAt: string;
  rejectionReason?: string;
}

export interface NssfClaimItemDto {
  actCode: string;
  quantity: number;
  requestedPriceKhr?: number;
  preAuthCode?: string;
  notes?: string;
}

export interface NssfClaimSubmissionDto {
  claimId?: string;
  memberId: string;
  nationalId: string;
  patientId: string;
  benefitPackage: NssfEntitlementPackage;
  encounterType: NssfEncounterType;
  admissionDate?: string;
  dischargeDate?: string;
  primaryIcd10: string;
  secondaryIcd10?: string[];
  occupationalCause?: NssfOccupationalCause;
  items: NssfClaimItemDto[];
  camdxVerificationToken: string;
  deviceId: string;
  hardwareKeyAttestation?: string;
  deviceSignature?: string;
  clientTimestamp: string;
}

export interface NssfAdjudicatedItemResultDto {
  actCode: string;
  descriptionEn: string;
  descriptionKh: string;
  quantity: number;
  coefficientType: string;
  coefficientValue: number;
  baseUnitValueKhr: number;
  calculatedTariffKhr: number;
  cappedCeilingKhr: number;
  nssfCoveredKhr: number;
  patientCoPayKhr: number;
  nssfCoveredUsd: number;
  patientCoPayUsd: number;
  status: NssfClaimLineStatus;
  rejectionReason?: string;
}

export interface NssfClaimSubmissionResponseDto {
  success: boolean;
  claimId: string;
  camdxReceiptReference: string;
  memberId: string;
  overallStatus: NssfOverallClaimStatus;
  totalBilledKhr: number;
  totalNssfCoveredKhr: number;
  totalPatientCoPayKhr: number;
  totalBilledUsd: number;
  totalNssfCoveredUsd: number;
  totalPatientCoPayUsd: number;
  exchangeRateKhrUsd: number;
  lines: NssfAdjudicatedItemResultDto[];
  adjudicatedAt: string;
  camdxVerificationHash: string;
  receiptMessageKh: string;
  receiptMessageEn: string;
  rejectionReason?: string;
}

// Inpatient Ward Bed Management, eMAR & SBAR Handover Types
export type BedClassificationType =
  | 'BED_ICU'
  | 'BED_HDU'
  | 'BED_GEN'
  | 'BED_ISO_NEG'
  | 'BED_PED'
  | 'BED_MAT';

export type BedOperationalStatus =
  | 'CLEAN_VACANT'
  | 'OCCUPIED'
  | 'DISCHARGED_DIRTY'
  | 'CLEANING_IN_PROGRESS'
  | 'MAINTENANCE_BLOCKED'
  | 'RESERVED_TRANSFER';

export interface InpatientBedDto {
  bedId: string;
  wardId: string;
  roomNumber: string;
  bedNumber: string;
  classification: BedClassificationType;
  classificationKh: string;
  status: BedOperationalStatus;
  statusKh: string;
  currentEncounterId?: string;
  currentPatientId?: string;
  currentPatientNameEn?: string;
  currentPatientNameKh?: string;
  hasMechanicalVentilator: boolean;
  hasNegativePressureGauge: boolean;
  nurseRatioTarget: string;
  lastCleanedAt?: string;
  updatedAt: string;
  monotonicVersion: number;
  vectorClock: Record<string, number>;
}

export interface BedStatusUpdateDto {
  status: BedOperationalStatus;
  notes?: string;
  staffId: string;
}

export interface BedTransferRequestDto {
  targetBedId: string;
  patientId: string;
  encounterId: string;
  nurseStaffId: string;
  transferReason: string;
  clientVectorClock?: Record<string, number>;
}

export interface BedTransferResponseDto {
  success: boolean;
  sourceBed: InpatientBedDto;
  targetBed: InpatientBedDto;
  transferTimestamp: string;
  serverMonotonicSequence: number;
  serverVectorClock: Record<string, number>;
}

export type MedicationAdministrationRoute =
  | 'INTRAVENOUS'
  | 'ORAL'
  | 'SUBCUTANEOUS'
  | 'INTRAMUSCULAR'
  | 'RECTAL'
  | 'INHALATION'
  | 'TOPICAL';

export type BcmaVerificationStatus =
  | 'VERIFIED_READY'
  | 'WRONG_PATIENT_ERROR'
  | 'WRONG_MEDICATION_ERROR'
  | 'WRONG_DOSE_ERROR'
  | 'WRONG_TIME_EARLY_WARNING'
  | 'WRONG_TIME_LATE_WARNING'
  | 'HIGH_ALERT_WITNESS_REQUIRED'
  | 'PRN_INTERVAL_LOCKED_ERROR'
  | 'DAILY_CEILING_EXCEEDED_ERROR';

export interface ScheduledDoseItemDto {
  orderId: string;
  encounterId: string;
  patientId: string;
  patientMrn: string;
  medicationId: string;
  drugName: string;
  gtinBarcode: string;
  prescribedDoseValue: number;
  doseUnit: string;
  route: MedicationAdministrationRoute;
  scheduledEpochMs: number;
  isHighAlert: boolean;
  isPrn: boolean;
  prnMinIntervalMinutes?: number;
  maxDailyCeilingDose?: number;
}

export interface BiometricWitnessCredentialsDto {
  witnessNurseId: string;
  witnessBiometricToken: string;
  witnessTimestampMs: number;
}

export interface AdministrationScanInputDto {
  orderId: string;
  scannedPatientBarcode: string;
  scannedMedicationBarcode: string;
  administeredDose: number;
  primaryNurseId: string;
  currentEpochMs: number;
  overrideReason?: string;
  witnessCredentials?: BiometricWitnessCredentialsDto;
}

export interface BcmaVerificationResultDto {
  status: BcmaVerificationStatus;
  isExecutable: boolean;
  messageKhmer: string;
  messageEnglish: string;
  lockRemainingMinutes: number;
  current24hCumulativeDose?: number;
  maxDailyCeilingDose?: number;
}

export interface RecordAdministrationDto {
  orderId: string;
  encounterId: string;
  patientId: string;
  scannedPatientBarcode: string;
  scannedMedicationBarcode: string;
  administeredDose: number;
  doseUnit: string;
  route: MedicationAdministrationRoute;
  primaryNurseId: string;
  administrationEpochMs: number;
  witnessCredentials?: BiometricWitnessCredentialsDto;
  overrideReason?: string;
  notes?: string;
}

export interface AdministrationRecordDto {
  administrationId: string;
  orderId: string;
  encounterId: string;
  patientId: string;
  drugName: string;
  administeredDose: number;
  doseUnit: string;
  route: MedicationAdministrationRoute;
  primaryNurseId: string;
  witnessNurseId?: string;
  administeredAt: string;
  administrationEpochMs: number;
  isHighAlertWitnessed: boolean;
  overrideReason?: string;
  notes?: string;
  status: string;
}

export interface InvasiveLineTrackerDto {
  lineType: string;
  insertionSite: string;
  insertionEpochMs: number;
  dressingChangeEpochMs: number;
  isIntactWithoutErythema: boolean;
}

export interface PanicLabItemDto {
  testName: string;
  resultValue: string;
  referenceRange: string;
  reportedEpochMs: number;
  isAcknowledgedByNurse: boolean;
}

export interface SbarHandoverReportDto {
  handoverId: string;
  encounterId: string;
  patientId: string;
  bedNumber: string;
  wardId: string;
  situationText: string;
  backgroundText: string;
  assessmentText: string;
  recommendationText: string;
  activeNews2Score: number;
  codeStatus: 'FULL_CODE' | 'DNR';
  allergiesList: string[];
  invasiveLines: InvasiveLineTrackerDto[];
  panicLabs: PanicLabItemDto[];
  outgoingNurseId: string;
  incomingNurseId: string;
  handoverTimestampMs: number;
  vectorClockStationId: string;
  vectorClockSequence: number;
  handoverHash: string;
  digitalSignatures?: {
    outgoingNurseSignature: string;
    incomingNurseSignature: string;
  };
}

// Runtime symbol exports for Node.js 24 type stripping
export const SyncEntityType = {};
export const MutationOperation = {};
export const ConflictResolutionStrategy = {};
export const MutationStatus = {};
export const DeviceStatus = {};
export const NetworkTier = {};
export const CausalRelation = {};
export const TelemetryEventType = {};
export const AlertSeverity = {};
export const TelemetryBedVitalsData = {};
export const TelemetryEcgData = {};
export const TelemetryLabPanicData = {};
export const TelemetryHeartbeatData = {};
export const TelemetryKhqrSettledData = {};
export const TelemetryStreamEvent = {};
export const TelemetryStreamFilterDto = {};
export const TelemetryBroadcastDto = {};
export const SseMessageEvent = {};
export const RegisteredDevice = {};
export const HandshakeRequestDto = {};
export const HandshakeResponseDto = {};
export const PullDeltaRequestDto = {};
export const SyncPatientDto = {};
export const SyncVitalSignsDto = {};
export const SyncFormularyItemDto = {};
export const SyncInvoiceDto = {};
export const PullDeltaResponseDto = {};
export const OfflineMutationDto = {};
export const ConflictDetailsDto = {};
export const MutationResultDto = {};
export const PushMutationsRequestDto = {};
export const PushMutationsResponseDto = {};
export const MobilePushNotificationDto = {};
export const KhqrSettlementWebhookDto = {};
export const KhqrSettlementResponseDto = {};
export const NssfEntitlementPackage = {};
export const NssfMemberStatus = {};
export const NssfEncounterType = {};
export const NssfOccupationalCause = {};
export const NssfClaimLineStatus = {};
export const NssfOverallClaimStatus = {};
export const NssfBenefitEntitlementDto = {};
export const NssfEligibilityRequestDto = {};
export const NssfEligibilityResponseDto = {};
export const NssfClaimItemDto = {};
export const NssfClaimSubmissionDto = {};
export const NssfAdjudicatedItemResultDto = {};
export const NssfClaimSubmissionResponseDto = {};
export const BedClassificationType = {};
export const BedOperationalStatus = {};
export const InpatientBedDto = {};
export const BedStatusUpdateDto = {};
export const BedTransferRequestDto = {};
export const BedTransferResponseDto = {};
export const MedicationAdministrationRoute = {};
export const BcmaVerificationStatus = {};
export const ScheduledDoseItemDto = {};
export const BiometricWitnessCredentialsDto = {};
export const AdministrationScanInputDto = {};
export const BcmaVerificationResultDto = {};
export const RecordAdministrationDto = {};
export const AdministrationRecordDto = {};
export const InvasiveLineTrackerDto = {};
export const PanicLabItemDto = {};
export const SbarHandoverReportDto = {};
