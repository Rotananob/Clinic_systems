package com.krupet.clinic.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val user: UserProfile
)

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    val fullNameEn: String,
    val fullNameKh: String? = null,
    val role: String,
    val department: String? = null
)

@Serializable
data class PatientRecord(
    val id: String,
    val patientCode: String,
    val fullName: String,
    val gender: String,
    val age: Int? = null,
    val phone: String? = null,
    val triageLevel: String? = null
)

@Serializable
data class ResuscitationRequest(
    val weightKg: Double,
    val condition: String, // SEPSIS, PARKLAND, BROSELOW, MTP
    val tbsaPercentage: Double? = null,
    val hoursSinceBurn: Double? = null,
    val heartRate: Int? = null,
    val systolicBp: Int? = null,
    val lactate: Double? = null
)

@Serializable
data class ResuscitationResponse(
    val condition: String,
    val fluidMlTotal: Double,
    val infusionRateMlH: Double,
    val instructions: String,
    val clinicalGuideline: String
)

@Serializable
data class KhqrPaymentRequest(
    val invoiceId: String,
    val amount: Double,
    val currency: String, // USD or KHR
    val billNumber: String
)

@Serializable
data class KhqrPaymentResponse(
    val qrString: String,
    val md5Hash: String,
    val deepLinkUrl: String
)
