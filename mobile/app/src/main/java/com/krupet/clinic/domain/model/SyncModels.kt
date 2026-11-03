package com.krupet.clinic.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class HandshakeRequest(
    val deviceId: String,
    val appVersion: String,
    val buildNumber: Int? = null,
    val platform: String = "ANDROID",
    val deviceModel: String? = null,
    val osVersion: String? = null,
    val networkTier: String? = null, // 2G, 3G, 4G, BROADBAND, OFFLINE
    val lowBandwidthMode: Boolean? = null,
    val tenantId: String? = null,
    val clientTimestamp: String? = null
)

@Serializable
data class HandshakeResponse(
    val success: Boolean,
    val serverTime: String,
    val serverTimestampMs: Long,
    val minSupportedVersion: String,
    val currentVersion: String,
    val isUpdateRequired: Boolean,
    val recommendedPollIntervalSec: Int,
    val networkTier: String,
    val lowBandwidthMode: Boolean,
    val serverMonotonicSequence: Long,
    val serverVectorClock: Map<String, Long>,
    val message: String
)

@Serializable
data class PullDeltaRequest(
    val deviceId: String,
    val sinceTimestamp: String? = null,
    val cursor: String? = null,
    val limit: Int? = null,
    val tenantId: String? = null,
    val chunkSize: Int? = null,
    val lowBandwidthMode: Boolean? = null,
    val networkTier: String? = null
)

@Serializable
data class SyncPatient(
    val id: String,
    val tenantId: String? = null,
    val patientCode: String,
    val nameEn: String,
    val nameKh: String? = null,
    val gender: String,
    val dob: String? = null,
    val phone: String,
    val nationalId: String? = null,
    val address: String? = null,
    val bloodType: String? = null,
    val allergies: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val updatedAt: String,
    val isDeleted: Boolean? = false,
    val monotonicVersion: Long? = null,
    val vectorClock: Map<String, Long>? = null
)

@Serializable
data class SyncVitalSigns(
    val id: String,
    val tenantId: String? = null,
    val patientId: String,
    val visitId: String? = null,
    val temperature: Double? = null,
    val heartRate: Int? = null,
    val systolicBp: Int? = null,
    val diastolicBp: Int? = null,
    val respiratoryRate: Int? = null,
    val oxygenSaturation: Int? = null,
    val weightKg: Double? = null,
    val heightCm: Double? = null,
    val bmi: Double? = null,
    val recordedBy: String? = null,
    val recordedAt: String,
    val updatedAt: String,
    val isDeleted: Boolean? = false,
    val monotonicVersion: Long? = null,
    val vectorClock: Map<String, Long>? = null
)

@Serializable
data class SyncFormularyItem(
    val id: String,
    val code: String,
    val genericName: String,
    val brandName: String? = null,
    val dosageForm: String,
    val strength: String,
    val route: String? = null,
    val therapeuticClass: String? = null,
    val cambodiaMohCategory: String? = null, // ESSENTIAL_A, ESSENTIAL_B, COMPLEMENTARY, SPECIALIZED
    val isEssential: Boolean? = true,
    val packageSize: String? = null,
    val unitPriceUsd: Double? = null,
    val stockOnHand: Int? = null,
    val updatedAt: String,
    val isDeleted: Boolean? = false,
    val monotonicVersion: Long? = null,
    val vectorClock: Map<String, Long>? = null
)

@Serializable
data class PullDeltaResponse(
    val serverTimestamp: String,
    val serverTimestampMs: Long,
    val cursor: String? = null,
    val nextCursor: String? = null,
    val hasMore: Boolean,
    val totalEntities: Int,
    val patients: List<SyncPatient>,
    val vitalSigns: List<SyncVitalSigns>,
    val formularyItems: List<SyncFormularyItem>,
    val serverMonotonicSequence: Long,
    val serverVectorClock: Map<String, Long>
)

@Serializable
data class OfflineMutation(
    val mutationId: String,
    val deviceId: String,
    val entityType: String, // PATIENT, VITAL_SIGNS, FORMULARY_ITEM
    val entityId: String,
    val operation: String, // CREATE, UPDATE, DELETE
    val payload: JsonObject,
    val clientTimestamp: String,
    val clientTimestampMs: Long? = null,
    val monotonicTimestamp: Long? = null,
    val lamportTime: Long? = null,
    val vectorClock: Map<String, Long>? = null,
    val tenantId: String? = null
)

@Serializable
data class PushMutationsRequest(
    val deviceId: String,
    val batchId: String? = null,
    val clientVectorClock: Map<String, Long>? = null,
    val mutations: List<OfflineMutation>
)

@Serializable
data class MutationConflictDetails(
    val strategy: String,
    val serverTimestamp: String,
    val clientTimestamp: String,
    val winner: String,
    val causalRelation: String,
    val serverVectorClock: Map<String, Long>? = null,
    val clientVectorClock: Map<String, Long>? = null,
    val serverMonotonicVersion: Long? = null,
    val clientMonotonicVersion: Long? = null,
    val reason: String
)

@Serializable
data class MutationResult(
    val mutationId: String,
    val entityType: String,
    val entityId: String,
    val status: String, // APPLIED, CONFLICT_IGNORED, ERROR
    val conflictDetails: MutationConflictDetails? = null,
    val errorMessage: String? = null
)

@Serializable
data class PushMutationsResponse(
    val success: Boolean,
    val batchId: String,
    val serverTimeUtc: String,
    val serverTimeMs: Long,
    val serverVectorClock: Map<String, Long>,
    val serverMonotonicSequence: Long,
    val totalProcessed: Int,
    val appliedCount: Int,
    val conflictCount: Int,
    val errorCount: Int,
    val results: List<MutationResult>
)

@Serializable
data class TelemetryBroadcastRequest(
    val eventType: String, // VITAL_SIGNS_UPDATE, ECG_TELEMETRY, LAB_PANIC_ALERT, HEARTBEAT
    val department: String,
    val ward: String? = null,
    val bedId: String? = null,
    val patientId: String? = null,
    val patientName: String? = null,
    val data: JsonObject
)

@Serializable
data class TelemetryStreamEventResponse(
    val eventId: String,
    val eventType: String,
    val timestamp: String,
    val department: String,
    val ward: String? = null,
    val bedId: String? = null,
    val patientId: String? = null,
    val patientName: String? = null,
    val data: JsonObject
)

@Serializable
data class SyncInvoice(
    val id: String,
    val tenantId: String? = null,
    val invoiceNumber: String,
    val patientId: String,
    val patientNameEn: String? = null,
    val patientNameKh: String? = null,
    val totalAmount: Double,
    val payableAmount: Double,
    val currency: String, // USD or KHR
    val status: String, // UNPAID, PENDING, PAID, REFUNDED
    val paymentMethod: String = "KHQR",
    val tranId: String? = null,
    val cashierId: String? = null,
    val paidAt: String? = null,
    val updatedAt: String,
    val isDeleted: Boolean? = false,
    val vectorClock: Map<String, Long>? = null,
    val monotonicVersion: Long? = null
)

@Serializable
data class KhqrSettlementWebhookRequest(
    val tranId: String,
    val hash: String,
    val amount: Double,
    val currency: String, // USD or KHR
    val invoiceId: String,
    val invoiceNumber: String? = null,
    val status: String = "SUCCESS",
    val settledAt: String? = null,
    val bakongAccountId: String? = null,
    val payerAccount: String? = null,
    val tenantId: String? = null,
    val deviceId: String? = null,
    val cashierId: String? = null,
    val signature: String? = null
)

@Serializable
data class MobilePushNotification(
    val notificationId: String,
    val targetDeviceId: String? = null,
    val title: String,
    val titleKh: String,
    val body: String,
    val bodyKh: String,
    val category: String, // BILLING, CLINICAL_ALERT, SYSTEM
    val priority: String = "HIGH",
    val data: JsonObject,
    val dispatchedAt: String,
    val status: String = "QUEUED" // QUEUED, DELIVERED
)

@Serializable
data class KhqrSettlementResponse(
    val success: Boolean,
    val idempotent: Boolean,
    val tranId: String,
    val invoiceId: String,
    val invoiceNumber: String,
    val invoiceStatus: String,
    val payableAmount: Double,
    val currency: String,
    val settledAt: String,
    val serverMonotonicSequence: Long,
    val serverVectorClock: Map<String, Long>,
    val pushNotification: MobilePushNotification? = null
)

@Serializable
data class NssfEligibilityRequest(
    val memberId: String,
    val nationalId: String? = null,
    val facilityCode: String? = null,
    val deviceId: String? = null,
    val requestTimestamp: String? = null
)

@Serializable
data class NssfBenefitEntitlement(
    @SerialName("package")
    val benefitPackage: String, // HEALTH_CARE, OCCUPATIONAL_RISK, MATERNITY
    val nameKh: String,
    val nameEn: String,
    val isCovered: Boolean,
    val coPayPercent: Int = 0,
    val maxCeilingKhr: Long? = null
)

@Serializable
data class NssfEligibilityResponse(
    val isEligible: Boolean,
    val memberId: String,
    val memberBarcode: String,
    val memberNameEn: String,
    val memberNameKh: String,
    val enterpriseName: String,
    val nationalId: String,
    val status: String, // ACTIVE, SUSPENDED, EXPIRED
    val activeContributionMonths: Int,
    val entitlements: List<NssfBenefitEntitlement>,
    val camdxVerificationToken: String,
    val tokenExpiresAt: String,
    val rejectionReason: String? = null
)

@Serializable
data class NssfClaimItem(
    val actCode: String,
    val quantity: Int = 1,
    val requestedPriceKhr: Long? = null,
    val preAuthCode: String? = null,
    val notes: String? = null
)

@Serializable
data class NssfClaimSubmissionRequest(
    val claimId: String? = null,
    val memberId: String,
    val nationalId: String,
    val patientId: String,
    val benefitPackage: String, // HEALTH_CARE, OCCUPATIONAL_RISK, MATERNITY
    val encounterType: String = "OUTPATIENT", // OUTPATIENT, INPATIENT, EMERGENCY
    val admissionDate: String? = null,
    val dischargeDate: String? = null,
    val primaryIcd10: String,
    val secondaryIcd10: List<String>? = null,
    val occupationalCause: String? = null, // COMMUTING_ACCIDENT, WORKPLACE_ACCIDENT, OCCUPATIONAL_DISEASE, NONE
    val items: List<NssfClaimItem>,
    val camdxVerificationToken: String,
    val deviceId: String,
    val hardwareKeyAttestation: String? = null,
    val deviceSignature: String? = null,
    val clientTimestamp: String
)

@Serializable
data class NssfAdjudicatedItemResult(
    val actCode: String,
    val descriptionEn: String,
    val descriptionKh: String,
    val quantity: Int,
    val coefficientType: String,
    val coefficientValue: Int,
    val baseUnitValueKhr: Long,
    val calculatedTariffKhr: Long,
    val cappedCeilingKhr: Long,
    val nssfCoveredKhr: Long,
    val patientCoPayKhr: Long,
    val nssfCoveredUsd: Double,
    val patientCoPayUsd: Double,
    val status: String, // APPROVED, PARTIALLY_APPROVED, REJECTED
    val rejectionReason: String? = null
)

@Serializable
data class NssfClaimSubmissionResponse(
    val success: Boolean,
    val claimId: String,
    val camdxReceiptReference: String,
    val memberId: String,
    val overallStatus: String, // APPROVED, PARTIAL, REJECTED
    val totalBilledKhr: Long,
    val totalNssfCoveredKhr: Long,
    val totalPatientCoPayKhr: Long,
    val totalBilledUsd: Double,
    val totalNssfCoveredUsd: Double,
    val totalPatientCoPayUsd: Double,
    val exchangeRateKhrUsd: Int = 4100,
    val lines: List<NssfAdjudicatedItemResult>,
    val adjudicatedAt: String,
    val camdxVerificationHash: String,
    val receiptMessageKh: String,
    val receiptMessageEn: String,
    val rejectionReason: String? = null
)
