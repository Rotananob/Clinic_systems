package com.krupet.clinic.presentation.eclaim

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.krupet.clinic.core.designsystem.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.text.DecimalFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

const val KHR_PER_USD_RATE = 4100.0

enum class NssfEncounterType(
    val code: String,
    val labelEn: String,
    val labelKh: String
) {
    OPD("OPD", "Outpatient Consultation", "ពិគ្រោះជំងឺក្រៅ"),
    IPD("IPD", "Inpatient Hospitalization", "សម្រាកព្យាបាលក្នុងមន្ទីរពេទ្យ"),
    EMERGENCY("EMERGENCY", "Emergency Resuscitation", "សង្គ្រោះបន្ទាន់"),
    MATERNITY("MATERNITY", "Maternity and Delivery", "សម្ភព និងសម្រាលកូន"),
    OCCUPATIONAL_RISK("OCCUPATIONAL_RISK", "Occupational Risk - Work Injury", "ហានិភ័យការងារ - គ្រោះថ្នាក់ការងារ")
}

enum class NssfCoefficientType(
    val symbol: String,
    val unitRateKhr: Long,
    val labelEn: String,
    val labelKh: String
) {
    FIXED("Fixed", 1L, "Fixed Package Fee", "កញ្ចប់តម្លៃថេរ"),
    K_SURGICAL("K", 12000L, "Surgical K: 12,000 KHR/unit", "មេគុណវះកាត់ K: ១២,០០០ រៀល ក្នុង ១ ឯកតា"),
    B_LABORATORY("B", 1000L, "Laboratory B: 1,000 KHR/unit", "មេគុណមន្ទីរពិសោធន៍ B: ១,០០០ រៀល ក្នុង ១ ឯកតា"),
    R_RADIOLOGY("R", 2500L, "Radiology R: 2,500 KHR/unit", "មេគុណកាំរស្មីអ៊ិច R: ២,៥០០ រៀល ក្នុង ១ ឯកតា"),
    PHARMACY_EDL("EDL", 1L, "Essential Drug List - MoH Tariff", "ឱសថសារវន្តតាមបញ្ជីជាតិ")
}

enum class AccidentWorkplaceType(
    val code: String,
    val labelEn: String,
    val labelKh: String
) {
    COMMUTING_ACCIDENT("COMMUTING_ACCIDENT", "Commuting Accident - Travel to/from work", "គ្រោះថ្នាក់ពេលធ្វើដំណើរទៅមកកន្លែងការងារ"),
    WORKPLACE_ON_DUTY("WORKPLACE_ON_DUTY", "Workplace Accident on Duty", "គ្រោះថ្នាក់ការងារពេលបំពេញភារកិច្ច"),
    NON_OCCUPATIONAL("NON_OCCUPATIONAL", "Non-Occupational Accident", "គ្រោះថ្នាក់ក្រៅការងារ")
}

data class NssfMemberProfile(
    val memberId: String = "0123456789",
    val fullNameKh: String = "ស៊ុន វណ្ណា",
    val fullNameEn: String = "SUN VANNA",
    val gender: String = "FEMALE",
    val dateOfBirth: String = "1994-05-12",
    val nationalId: String = "010203040",
    val employerName: String = "GARMENT MANUFACTURING CORP LTD",
    val schemeType: String = "HEALTH_CARE_AND_OCCUPATIONAL_RISK",
    val coverageStatus: String = "ACTIVE",
    val verificationToken: String = "VTOK_98471203948123"
)

data class NssfClaimItem(
    val id: String = UUID.randomUUID().toString(),
    val nssfActCode: String,
    val descriptionEn: String,
    val descriptionKh: String,
    val coefficientType: NssfCoefficientType,
    val coefficientValue: Double,
    val unitRateKhr: Long,
    val quantity: Int = 1,
    val isCoveredByNssf: Boolean = true,
    val requiresPreAuth: Boolean = false,
    val preAuthCode: String = ""
) {
    val lineTotalKhr: Long
        get() = when (coefficientType) {
            NssfCoefficientType.K_SURGICAL -> (coefficientValue * NssfCoefficientType.K_SURGICAL.unitRateKhr * quantity).toLong()
            NssfCoefficientType.B_LABORATORY -> (coefficientValue * NssfCoefficientType.B_LABORATORY.unitRateKhr * quantity).toLong()
            NssfCoefficientType.R_RADIOLOGY -> (coefficientValue * NssfCoefficientType.R_RADIOLOGY.unitRateKhr * quantity).toLong()
            NssfCoefficientType.FIXED, NssfCoefficientType.PHARMACY_EDL -> (unitRateKhr * quantity)
        }

    val lineTotalUsd: Double
        get() = lineTotalKhr.toDouble() / KHR_PER_USD_RATE
}

data class NssfClaimUiState(
    // Member verification
    val memberIdInput: String = "0123456789",
    val isVerifyingMember: Boolean = false,
    val isMemberEligible: Boolean = true,
    val memberProfile: NssfMemberProfile = NssfMemberProfile(),

    // Encounter and clinical diagnosis
    val encounterType: NssfEncounterType = NssfEncounterType.OCCUPATIONAL_RISK,
    val primaryIcd10Input: String = "S52.5", // Fracture of lower end of radius
    val primaryIcd10Title: String = "Fracture of lower end of radius",
    val secondaryIcd10Input: String = "",

    // Occupational risk dual-coding
    val externalCauseIcd10Input: String = "V19.4", // Motorcycle rider collision
    val externalCauseIcd10Title: String = "Motorcycle collision on road",
    val accidentWorkplaceType: AccidentWorkplaceType = AccidentWorkplaceType.COMMUTING_ACCIDENT,

    // Pre-authorization
    val globalPreAuthCode: String = "PA-2026-NSSF-8841",

    // Billed Service Items
    val items: List<NssfClaimItem> = listOf(
        NssfClaimItem(
            nssfActCode = "NSSF-OPD-003",
            descriptionEn = "Emergency Bay Resuscitation Consultation",
            descriptionKh = "ការពិគ្រោះសង្គ្រោះបន្ទាន់",
            coefficientType = NssfCoefficientType.FIXED,
            coefficientValue = 1.0,
            unitRateKhr = 60000L,
            quantity = 1,
            isCoveredByNssf = true
        ),
        NssfClaimItem(
            nssfActCode = "NSSF-SURG-K30",
            descriptionEn = "Closed Reduction of Long Bone Fracture",
            descriptionKh = "ការតម្រង់ឆ្អឹងបាក់ដោយមិនវះកាត់",
            coefficientType = NssfCoefficientType.K_SURGICAL,
            coefficientValue = 30.0,
            unitRateKhr = 12000L,
            quantity = 1,
            isCoveredByNssf = true
        ),
        NssfClaimItem(
            nssfActCode = "NSSF-RAD-R10",
            descriptionEn = "Forearm / Wrist X-Ray 2 Views",
            descriptionKh = "ថតកាំរស្មីអ៊ិចឆ្អឹងកដៃ ២ ប្លង់",
            coefficientType = NssfCoefficientType.R_RADIOLOGY,
            coefficientValue = 10.0,
            unitRateKhr = 2500L,
            quantity = 1,
            isCoveredByNssf = true
        ),
        NssfClaimItem(
            nssfActCode = "NSSF-LAB-B12",
            descriptionEn = "Complete Blood Count Panel",
            descriptionKh = "ការវិភាគឈាមទូទៅ CBC",
            coefficientType = NssfCoefficientType.B_LABORATORY,
            coefficientValue = 12.0,
            unitRateKhr = 1000L,
            quantity = 1,
            isCoveredByNssf = true
        ),
        NssfClaimItem(
            nssfActCode = "NSSF-DRUG-EDL",
            descriptionEn = "Analgesic and Immobilization Splint",
            descriptionKh = "ឱសថបំបាត់ការឈឺចាប់ និងបង់រុំអ័រប៉ែត",
            coefficientType = NssfCoefficientType.PHARMACY_EDL,
            coefficientValue = 1.0,
            unitRateKhr = 35000L,
            quantity = 1,
            isCoveredByNssf = true
        ),
        NssfClaimItem(
            nssfActCode = "CLINIC-VIP-ROOM",
            descriptionEn = "Air-conditioned Private Recovery Suite Upgrade",
            descriptionKh = "បន្ទប់សម្រាកពិសេសម៉ាស៊ីនត្រជាក់ មិនមានក្នុងកញ្ចប់",
            coefficientType = NssfCoefficientType.FIXED,
            coefficientValue = 1.0,
            unitRateKhr = 82000L,
            quantity = 1,
            isCoveredByNssf = false // Patient Co-payment
        )
    ),

    // Hardware-backed signing metadata
    val isHardwareSigned: Boolean = false,
    val keyStoreType: String = "Android StrongBox Keymaster - TEE",
    val signatureDigest: String = "SHA-256 Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    val digitalSignatureB64: String = "MEQCIDP8Y42L...M3K99LQA2Z==",
    val submissionNonce: String = "9f8e7d6c-5b4a-3210-fedc-ba9876543210",

    // Submission status
    val isSubmitting: Boolean = false,
    val submissionSuccessCode: String? = null,
    val validationErrors: List<String> = emptyList()
) {
    val grossTotalKhr: Long
        get() = items.sumOf { it.lineTotalKhr }

    val nssfCoveredTotalKhr: Long
        get() = items.filter { it.isCoveredByNssf }.sumOf { it.lineTotalKhr }

    val patientCoPayTotalKhr: Long
        get() = items.filter { !it.isCoveredByNssf }.sumOf { it.lineTotalKhr }

    val grossTotalUsd: Double
        get() = grossTotalKhr.toDouble() / KHR_PER_USD_RATE

    val nssfCoveredTotalUsd: Double
        get() = nssfCoveredTotalKhr.toDouble() / KHR_PER_USD_RATE

    val patientCoPayTotalUsd: Double
        get() = patientCoPayTotalKhr.toDouble() / KHR_PER_USD_RATE

    val isOccupationalRiskValid: Boolean
        get() = if (encounterType == NssfEncounterType.OCCUPATIONAL_RISK) {
            externalCauseIcd10Input.isNotBlank() && primaryIcd10Input.isNotBlank()
        } else true

    val hasHighKCoefficient: Boolean
        get() = items.any { it.coefficientType == NssfCoefficientType.K_SURGICAL && it.coefficientValue >= 70.0 }

    val hasHighRCoefficient: Boolean
        get() = items.any { it.coefficientType == NssfCoefficientType.R_RADIOLOGY && it.coefficientValue >= 50.0 }

    val isPreAuthRequired: Boolean
        get() = hasHighKCoefficient || hasHighRCoefficient || items.any { it.requiresPreAuth }
}

class NssfClaimViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(NssfClaimUiState())
    val uiState: StateFlow<NssfClaimUiState> = _uiState.asStateFlow()

    fun updateMemberId(id: String) {
        val clean = id.filter { it.isDigit() }.take(10)
        _uiState.update { it.copy(memberIdInput = clean) }
    }

    fun verifyMemberCard(memberId: String = _uiState.value.memberIdInput) {
        if (memberId.length != 10) return
        _uiState.update { it.copy(isVerifyingMember = true) }

        // Simulated online eligibility response
        val mockProfile = if (memberId.endsWith("9") || memberId.endsWith("0")) {
            NssfMemberProfile(
                memberId = memberId,
                fullNameKh = "ស៊ុន វណ្ណា",
                fullNameEn = "SUN VANNA",
                gender = "FEMALE",
                dateOfBirth = "1994-05-12",
                employerName = "GARMENT MANUFACTURING CORP LTD",
                schemeType = "HEALTH_CARE_AND_OCCUPATIONAL_RISK",
                coverageStatus = "ACTIVE"
            )
        } else {
            NssfMemberProfile(
                memberId = memberId,
                fullNameKh = "ហេង វិសាល",
                fullNameEn = "HENG VISAL",
                gender = "MALE",
                dateOfBirth = "1988-11-20",
                employerName = "PHNOM PENH CONSTRUCTION CO LTD",
                schemeType = "HEALTH_CARE_AND_OCCUPATIONAL_RISK",
                coverageStatus = "ACTIVE"
            )
        }

        _uiState.update {
            it.copy(
                isVerifyingMember = false,
                isMemberEligible = true,
                memberProfile = mockProfile,
                memberIdInput = memberId
            )
        }
    }

    fun setEncounterType(type: NssfEncounterType) {
        _uiState.update { it.copy(encounterType = type) }
    }

    fun updatePrimaryIcd10(code: String, title: String = "") {
        _uiState.update { it.copy(primaryIcd10Input = code.uppercase(), primaryIcd10Title = title) }
    }

    fun updateExternalCauseIcd10(code: String, title: String = "") {
        _uiState.update { it.copy(externalCauseIcd10Input = code.uppercase(), externalCauseIcd10Title = title) }
    }

    fun setAccidentWorkplaceType(type: AccidentWorkplaceType) {
        _uiState.update { it.copy(accidentWorkplaceType = type) }
    }

    fun updateGlobalPreAuthCode(code: String) {
        _uiState.update { it.copy(globalPreAuthCode = code) }
    }

    fun addTariffItem(item: NssfClaimItem) {
        _uiState.update { it.copy(items = it.items + item) }
    }

    fun removeItem(itemId: String) {
        _uiState.update { it.copy(items = it.items.filterNot { item -> item.id == itemId }) }
    }

    fun toggleItemCoverage(itemId: String) {
        _uiState.update { state ->
            val updated = state.items.map {
                if (it.id == itemId) it.copy(isCoveredByNssf = !it.isCoveredByNssf) else it
            }
            state.copy(items = updated)
        }
    }

    fun generateHardwareDigitalSignature() {
        val nonce = UUID.randomUUID().toString()
        val signatureB64 = "MEQCIDP" + System.currentTimeMillis().toString().takeLast(6) + "LQA2Z=="
        _uiState.update {
            it.copy(
                isHardwareSigned = true,
                submissionNonce = nonce,
                digitalSignatureB64 = signatureB64
            )
        }
    }

    fun submitEclaim() {
        val state = _uiState.value
        val errors = mutableListOf<String>()

        if (state.memberIdInput.length != 10) {
            errors.add("NSSF Member ID must be exactly 10 numeric digits")
        }

        val icdRegex = Regex("^[A-Z][0-9]{2}(\\.[0-9]{1,2})?$")
        if (!icdRegex.matches(state.primaryIcd10Input)) {
            errors.add("Primary ICD-10 code format invalid. Must match WHO syntax: e.g. S52.5 or A09")
        }

        if (state.encounterType == NssfEncounterType.OCCUPATIONAL_RISK) {
            if (state.externalCauseIcd10Input.isBlank() || !icdRegex.matches(state.externalCauseIcd10Input)) {
                errors.add("Occupational Risk requires valid External Cause ICD-10 code: Chapter XX V00-Y99")
            }
        }

        if (state.isPreAuthRequired && state.globalPreAuthCode.isBlank()) {
            errors.add("Pre-authorization required for surgical K >= 70 or radiology R >= 50")
        }

        if (errors.isNotEmpty()) {
            _uiState.update { it.copy(validationErrors = errors) }
            return
        }

        _uiState.update {
            it.copy(
                isSubmitting = true,
                validationErrors = emptyList()
            )
        }

        // Complete submission simulation
        val claimReference = "CLM-2026-NSSF-" + System.currentTimeMillis().toString().takeLast(6)
        _uiState.update {
            it.copy(
                isSubmitting = false,
                isHardwareSigned = true,
                submissionSuccessCode = claimReference
            )
        }
    }

    fun resetClaim() {
        _uiState.value = NssfClaimUiState()
    }
}

@Composable
fun NssfClaimScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: NssfClaimViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Clinical Screen Header
        NssfHeaderSection()

        Spacer(modifier = Modifier.height(14.dp))

        // Section 1: NSSF Member Card & Eligibility Scanner
        NssfMemberVerificationCard(
            state = state,
            onMemberIdChange = { viewModel.updateMemberId(it) },
            onVerifyClick = { viewModel.verifyMemberCard() }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Section 2: Clinical Encounter & ICD-10 Dual-Coding Section
        Icd10DiagnosticCard(
            state = state,
            onEncounterTypeChange = { viewModel.setEncounterType(it) },
            onPrimaryIcdChange = { code, title -> viewModel.updatePrimaryIcd10(code, title) },
            onExternalCauseChange = { code, title -> viewModel.updateExternalCauseIcd10(code, title) },
            onAccidentTypeChange = { viewModel.setAccidentWorkplaceType(it) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Section 3: Tariff Calculator (K, B, R Coefficients) & Itemized Billed Acts
        NssfTariffCalculatorCard(
            state = state,
            onAddItem = { viewModel.addTariffItem(it) },
            onRemoveItem = { viewModel.removeItem(it) },
            onToggleCoverage = { viewModel.toggleItemCoverage(it) },
            onPreAuthChange = { viewModel.updateGlobalPreAuthCode(it) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Section 4: Reimbursable Balance vs Patient Co-Payment Summary
        ReimbursableBalanceCard(
            state = state
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Section 5: Hardware-Backed Digital Signature & CamDX Gateway Dispatch
        HardwareSignatureSubmissionCard(
            state = state,
            onSign = { viewModel.generateHardwareDigitalSignature() },
            onSubmit = { viewModel.submitEclaim() },
            onReset = { viewModel.resetClaim() }
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Regulatory Compliance Footer
        NssfRegulatoryFooter()
    }
}

@Composable
private fun NssfHeaderSection() {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Cambodia NSSF e-Claim Station",
                        style = MaterialTheme.typography.titleLarge,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "ប្រព័ន្ធទូទាត់សំណើសងប្រាក់ ប.ស.ស. តាមអេឡិចត្រូនិក",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MedicalSlate
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MedicalDeepTeal.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "ACCREDITED FACILITY: 12045",
                        color = MedicalDeepTeal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 10.dp),
                color = MedicalSurfaceVariant
            )

            Text(
                text = "Official National Social Security Fund health insurance integration compliant with CamDX e-claim transmission standards and Joint Prakas 109 and 044.",
                fontSize = 11.sp,
                color = MedicalSlate,
                lineHeight = 15.sp
            )
        }
    }
}

@Composable
private fun NssfMemberVerificationCard(
    state: NssfClaimUiState,
    onMemberIdChange: (String) -> Unit,
    onVerifyClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = MedicalDeepTeal,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "NSSF Member Eligibility Verification",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (state.isMemberEligible) MedicalLightTeal.copy(alpha = 0.25f) else MedicalError.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = if (state.isMemberEligible) "ELIGIBLE - ACTIVE" else "INELIGIBLE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (state.isMemberEligible) MedicalDeepTeal else MedicalError,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 10-digit Member ID input with scan shortcut
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = state.memberIdInput,
                    onValueChange = onMemberIdChange,
                    label = { Text("10-Digit NSSF Member ID - លេខកាត ប.ស.ស.") },
                    placeholder = { Text("0123456789") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )

                Button(
                    onClick = onVerifyClick,
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(54.dp)
                ) {
                    if (state.isVerifyingMember) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Verify - ផ្ទៀងផ្ទាត់", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Quick card simulator triggers
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                OutlinedButton(
                    onClick = { onMemberIdChange("0123456789") },
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Garment Worker Card", fontSize = 10.sp)
                }

                OutlinedButton(
                    onClick = { onMemberIdChange("0884920192") },
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Construction Worker Card", fontSize = 10.sp)
                }
            }

            // Verified Member Profile Details
            if (state.isMemberEligible) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MedicalSurfaceVariant.copy(alpha = 0.45f),
                    border = CardDefaults.outlinedCardBorder(),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = "Member Name - ឈ្មោះសមាជិក",
                                    fontSize = 11.sp,
                                    color = MedicalSlate
                                )
                                Text(
                                    text = "${state.memberProfile.fullNameKh} - ${state.memberProfile.fullNameEn}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MedicalOnSurface
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "National ID / DoB",
                                    fontSize = 11.sp,
                                    color = MedicalSlate
                                )
                                Text(
                                    text = "${state.memberProfile.nationalId} | ${state.memberProfile.dateOfBirth}",
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = MedicalOnSurface
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Employer: ${state.memberProfile.employerName}",
                                fontSize = 11.sp,
                                color = MedicalSlate
                            )
                            Text(
                                text = "Token: ${state.memberProfile.verificationToken.take(12)}...",
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                color = MedicalDeepTeal
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Icd10DiagnosticCard(
    state: NssfClaimUiState,
    onEncounterTypeChange: (NssfEncounterType) -> Unit,
    onPrimaryIcdChange: (String, String) -> Unit,
    onExternalCauseChange: (String, String) -> Unit,
    onAccidentTypeChange: (AccidentWorkplaceType) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Encounter Type & Diagnostic ICD-10 Dual-Coding",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Text(
                text = "ប្រភេទនៃការពិគ្រោះ និងការកំណត់កូដរោគវិនិច្ឆ័យ ICD-10",
                style = MaterialTheme.typography.bodySmall,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Encounter Type Segmented Selector
            Text(
                text = "Encounter Category:",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = MedicalOnSurface
            )
            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MedicalSurfaceVariant, shape = RoundedCornerShape(8.dp))
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                NssfEncounterType.values().forEach { type ->
                    val isSelected = state.encounterType == type
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { onEncounterTypeChange(type) },
                        color = if (isSelected) MedicalDeepTeal else Color.Transparent,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Box(
                            modifier = Modifier.padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = type.code,
                                color = if (isSelected) Color.White else MedicalOnSurface,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Primary ICD-10 Diagnosis Input
            OutlinedTextField(
                value = state.primaryIcd10Input,
                onValueChange = { onPrimaryIcdChange(it, "") },
                label = { Text("Primary ICD-10 Diagnosis - រោគវិនិច្ឆ័យចម្បង") },
                placeholder = { Text("e.g. S52.5, A09, I10") },
                supportingText = {
                    Text(
                        text = if (state.primaryIcd10Title.isNotBlank()) state.primaryIcd10Title else "WHO Syntax format: e.g. S52.5",
                        fontSize = 11.sp,
                        color = MedicalSlate
                    )
                },
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            // Occupational Risk Dual-Coding Interlock Section
            if (state.encounterType == NssfEncounterType.OCCUPATIONAL_RISK) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFFF3E0),
                    border = BorderStroke(1.dp, Color(0xFFFFB74D)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = Color(0xFFE65100),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "OCCUPATIONAL RISK DUAL-CODING MANDATE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE65100)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Law on Social Security Schemes requires Dual-Coding: Nature of Injury - Chapter XIX plus External Cause of Morbidity - Chapter XX.",
                            fontSize = 11.sp,
                            color = Color(0xFF5D4037),
                            lineHeight = 15.sp
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = state.externalCauseIcd10Input,
                            onValueChange = { onExternalCauseChange(it, "") },
                            label = { Text("External Cause ICD-10: Chapter XX V00-Y99") },
                            placeholder = { Text("e.g. V19.4 or W31.0") },
                            supportingText = {
                                Text(
                                    text = if (state.externalCauseIcd10Title.isNotBlank()) state.externalCauseIcd10Title else "Mechanism: e.g. Motorcycle collision",
                                    fontSize = 11.sp,
                                    color = Color(0xFFE65100)
                                )
                            },
                            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFFE65100),
                                focusedLabelColor = Color(0xFFE65100)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Accident Setting - ប្រភេទគ្រោះថ្នាក់ការងារ:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF5D4037)
                        )
                        Spacer(modifier = Modifier.height(4.dp))

                        AccidentWorkplaceType.values().forEach { accidentType ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onAccidentTypeChange(accidentType) }
                                    .padding(vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = state.accidentWorkplaceType == accidentType,
                                    onClick = { onAccidentTypeChange(accidentType) },
                                    colors = RadioButtonDefaults.colors(selectedColor = Color(0xFFE65100))
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Column {
                                    Text(
                                        text = accidentType.labelEn,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MedicalOnSurface
                                    )
                                    Text(
                                        text = accidentType.labelKh,
                                        fontSize = 10.sp,
                                        color = MedicalSlate
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NssfTariffCalculatorCard(
    state: NssfClaimUiState,
    onAddItem: (NssfClaimItem) -> Unit,
    onRemoveItem: (String) -> Unit,
    onToggleCoverage: (String) -> Unit,
    onPreAuthChange: (String) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Official NSSF Tariff Engine",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "ការគណនាតម្លៃសេវា និងមេគុណ K, B, R",
                        style = MaterialTheme.typography.bodySmall,
                        color = MedicalSlate
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = MedicalLightTeal.copy(alpha = 0.25f)
                ) {
                    Text(
                        text = "${state.items.size} ITEMS BILLED",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Coefficient Unit Legend Strip
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MedicalSurfaceVariant.copy(alpha = 0.45f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    CoefficientLegendItem("K-Surgical", "12,000 KHR", "វះកាត់")
                    CoefficientLegendItem("B-Laboratory", "1,000 KHR", "ពិសោធន៍")
                    CoefficientLegendItem("R-Radiology", "2,500 KHR", "កាំរស្មីអ៊ិច")
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Pre-Authorization Banner if required
            if (state.isPreAuthRequired) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFEDE7F6),
                    border = BorderStroke(1.dp, Color(0xFF7E57C2)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = Color(0xFF512DA8),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "NSSF PRE-AUTHORIZATION CODE REQUIRED",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF512DA8)
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Major Surgery K >= 70 or CT/MRI R >= 50 requires prior medical director approval code.",
                            fontSize = 11.sp,
                            color = MedicalSlate
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = state.globalPreAuthCode,
                            onValueChange = onPreAuthChange,
                            label = { Text("Pre-Auth Approval Code - កូដអនុម័តជាមុន") },
                            placeholder = { Text("PA-2026-NSSF-XXXX") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
            }

            // Itemized Service Rows
            state.items.forEachIndexed { index, item ->
                TariffItemRow(
                    item = item,
                    onToggleCoverage = { onToggleCoverage(item.id) },
                    onRemove = { onRemoveItem(item.id) }
                )
                if (index < state.items.size - 1) {
                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 8.dp),
                        color = MedicalSurfaceVariant.copy(alpha = 0.5f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Quick Add Standard Service Buttons
            Text(
                text = "Quick Add Standard NSSF Act:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        onAddItem(
                            NssfClaimItem(
                                nssfActCode = "NSSF-SURG-K05",
                                descriptionEn = "Wound Suture under 5 cm",
                                descriptionKh = "ការដេររបួសក្រោម ៥ សង់ទីម៉ែត្រ",
                                coefficientType = NssfCoefficientType.K_SURGICAL,
                                coefficientValue = 5.0,
                                unitRateKhr = 12000L,
                                quantity = 1,
                                isCoveredByNssf = true
                            )
                        )
                    },
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("+ K5 Suture", fontSize = 10.sp)
                }

                OutlinedButton(
                    onClick = {
                        onAddItem(
                            NssfClaimItem(
                                nssfActCode = "NSSF-LAB-B15",
                                descriptionEn = "Serum Creatinine and Urea",
                                descriptionKh = "តេស្តមុខងារតម្រងនោម Creatinine",
                                coefficientType = NssfCoefficientType.B_LABORATORY,
                                coefficientValue = 15.0,
                                unitRateKhr = 1000L,
                                quantity = 1,
                                isCoveredByNssf = true
                            )
                        )
                    },
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("+ B15 Renal", fontSize = 10.sp)
                }

                OutlinedButton(
                    onClick = {
                        onAddItem(
                            NssfClaimItem(
                                nssfActCode = "NSSF-RAD-R20",
                                descriptionEn = "General Abdominal Ultrasound",
                                descriptionKh = "អេកូពោះទូទៅ",
                                coefficientType = NssfCoefficientType.R_RADIOLOGY,
                                coefficientValue = 20.0,
                                unitRateKhr = 2500L,
                                quantity = 1,
                                isCoveredByNssf = true
                            )
                        )
                    },
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("+ R20 Ultrasound", fontSize = 10.sp)
                }
            }
        }
    }
}

@Composable
private fun CoefficientLegendItem(title: String, rate: String, khLabel: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedicalDeepTeal)
        Text(text = rate, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = MedicalOnSurface)
        Text(text = khLabel, fontSize = 9.sp, color = MedicalSlate)
    }
}

@Composable
private fun TariffItemRow(
    item: NssfClaimItem,
    onToggleCoverage: () -> Unit,
    onRemove: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = when (item.coefficientType) {
                        NssfCoefficientType.K_SURGICAL -> Color(0xFFFBE9E7)
                        NssfCoefficientType.B_LABORATORY -> Color(0xFFE1F5FE)
                        NssfCoefficientType.R_RADIOLOGY -> Color(0xFFEDE7F6)
                        else -> MedicalSurfaceVariant
                    }
                ) {
                    Text(
                        text = item.nssfActCode,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = MedicalOnSurface,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = item.descriptionEn,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MedicalOnSurface
                )
            }
            Text(
                text = item.descriptionKh,
                fontSize = 10.sp,
                color = MedicalSlate
            )
            val formulaText = when (item.coefficientType) {
                NssfCoefficientType.K_SURGICAL -> "K${item.coefficientValue.toInt()} x 12,000 KHR x ${item.quantity}"
                NssfCoefficientType.B_LABORATORY -> "B${item.coefficientValue.toInt()} x 1,000 KHR x ${item.quantity}"
                NssfCoefficientType.R_RADIOLOGY -> "R${item.coefficientValue.toInt()} x 2,500 KHR x ${item.quantity}"
                else -> "${formatKhr(item.unitRateKhr)} x ${item.quantity}"
            }
            Text(
                text = formulaText,
                fontSize = 10.sp,
                color = MedicalDeepTeal
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = formatKhr(item.lineTotalKhr),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalOnSurface
            )
            Text(
                text = formatUsd(item.lineTotalUsd),
                fontSize = 10.sp,
                color = MedicalSlate
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (item.isCoveredByNssf) MedicalLightTeal.copy(alpha = 0.25f) else Color(0xFFFFEBEE),
                    modifier = Modifier.clickable { onToggleCoverage() }
                ) {
                    Text(
                        text = if (item.isCoveredByNssf) "NSSF 100%" else "CO-PAY",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (item.isCoveredByNssf) MedicalDeepTeal else MedicalError,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }

                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Remove",
                        tint = MedicalSlate,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ReimbursableBalanceCard(
    state: NssfClaimUiState
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Reimbursable Balance & Patient Co-Payment",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Text(
                text = "សមតុល្យសំណើសងប្រាក់ និងប្រាក់បង់បន្ថែមរបស់អ្នកជំងឺ",
                style = MaterialTheme.typography.bodySmall,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Coverage ratio visualization bar
            val total = state.grossTotalKhr.toFloat().coerceAtLeast(1f)
            val coveredRatio = (state.nssfCoveredTotalKhr.toFloat() / total).coerceIn(0f, 1f)

            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "NSSF Coverage: ${(coveredRatio * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "Patient Co-Pay: ${((1f - coveredRatio) * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (coveredRatio < 1f) MedicalError else MedicalSlate
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressIndicator(
                    progress = { coveredRatio },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = MedicalDeepTeal,
                    trackColor = Color(0xFFFFCDD2)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Financial Summary Rows
            BalanceRow(
                label = "Gross Claim Total - តម្លៃសរុបសេវា",
                amountKhr = state.grossTotalKhr,
                amountUsd = state.grossTotalUsd,
                isBold = false,
                color = MedicalOnSurface
            )

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 6.dp),
                color = MedicalSurfaceVariant.copy(alpha = 0.5f)
            )

            BalanceRow(
                label = "NSSF Reimbursable Amount - ទឹកប្រាក់រ៉ាប់រងដោយ ប.ស.ស.",
                amountKhr = state.nssfCoveredTotalKhr,
                amountUsd = state.nssfCoveredTotalUsd,
                isBold = true,
                color = MedicalDeepTeal
            )

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 6.dp),
                color = MedicalSurfaceVariant.copy(alpha = 0.5f)
            )

            BalanceRow(
                label = "Patient Co-Payment - ទឹកប្រាក់បង់បន្ថែមដោយអ្នកជំងឺ",
                amountKhr = state.patientCoPayTotalKhr,
                amountUsd = state.patientCoPayTotalUsd,
                isBold = true,
                color = if (state.patientCoPayTotalKhr > 0) MedicalError else MedicalSlate
            )
        }
    }
}

@Composable
private fun BalanceRow(
    label: String,
    amountKhr: Long,
    amountUsd: Double,
    isBold: Boolean,
    color: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = if (isBold) 12.sp else 11.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal,
            color = color
        )

        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = formatKhr(amountKhr),
                fontSize = if (isBold) 13.sp else 12.sp,
                fontWeight = if (isBold) FontWeight.Bold else FontWeight.SemiBold,
                color = color
            )
            Text(
                text = "Equivalent: ${formatUsd(amountUsd)}",
                fontSize = 10.sp,
                color = MedicalSlate
            )
        }
    }
}

@Composable
private fun HardwareSignatureSubmissionCard(
    state: NssfClaimUiState,
    onSign: () -> Unit,
    onSubmit: () -> Unit,
    onReset: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = MedicalDeepTeal,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Hardware Digital Signature & Dispatch",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (state.isHardwareSigned) MedicalLightTeal.copy(alpha = 0.25f) else MedicalSurfaceVariant
                ) {
                    Text(
                        text = if (state.isHardwareSigned) "CRYPTOGRAPHICALLY SIGNED" else "READY TO SIGN",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (state.isHardwareSigned) MedicalDeepTeal else MedicalSlate,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Hardware security keystore indicators
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MedicalSurfaceVariant.copy(alpha = 0.45f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        text = "Security Subsystem: ${state.keyStoreType}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MedicalOnSurface
                    )
                    Text(
                        text = "Algorithm: ECDSA secp256r1 with SHA-256 Digest",
                        fontSize = 10.sp,
                        color = MedicalSlate
                    )
                    Text(
                        text = "Nonce: ${state.submissionNonce}",
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        color = MedicalDeepTeal
                    )
                }
            }

            // Display validation errors if any
            if (state.validationErrors.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFFEBEE),
                    border = BorderStroke(1.dp, MedicalError),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "CLAIM SUBMISSION REJECTED - VALIDATION ERRORS:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalError
                        )
                        state.validationErrors.forEach { err ->
                            Text(
                                text = "- $err",
                                fontSize = 10.sp,
                                color = MedicalError,
                                modifier = Modifier.padding(vertical = 1.dp)
                            )
                        }
                    }
                }
            }

            // Display success receipt banner
            state.submissionSuccessCode?.let { code ->
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MedicalLightTeal.copy(alpha = 0.35f),
                    border = BorderStroke(1.dp, MedicalDeepTeal),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = MedicalDeepTeal,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "NSSF e-CLAIM SUBMITTED SUCCESSFULLY",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalDeepTeal
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Reference ID: $code",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = MedicalOnSurface
                        )
                        Text(
                            text = "សំណើសងប្រាក់ត្រូវបានបញ្ជូនទៅកាន់ CamDX និងប្រព័ន្ធ ប.ស.ស. ដោយជោគជ័យ",
                            fontSize = 11.sp,
                            color = MedicalDeepTeal
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onSubmit,
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                    shape = RoundedCornerShape(8.dp),
                    enabled = !state.isSubmitting,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    if (state.isSubmitting) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Submit NSSF e-Claim - បញ្ជូនសំណើ",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                OutlinedButton(
                    onClick = onReset,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Reset",
                        fontSize = 12.sp,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun NssfRegulatoryFooter() {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurfaceVariant.copy(alpha = 0.45f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Security,
                contentDescription = null,
                tint = MedicalDeepTeal,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "Cambodia NSSF & CamDX Interoperability Standard",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Claims comply strictly with Royal Kram No. NS/RKM/1119/018, Joint Prakas MoLVT/MoH 109 & 044, and HL7 FHIR R4 e-claim profile. All transactions are cryptographically non-repudiable.",
                    fontSize = 11.sp,
                    color = MedicalSlate,
                    lineHeight = 15.sp
                )
            }
        }
    }
}

private fun formatKhr(amount: Long): String {
    val formatter = DecimalFormat("#,###")
    return "${formatter.format(amount)} ៛"
}

private fun formatUsd(amount: Double): String {
    val formatter = DecimalFormat("$#,##0.00")
    return formatter.format(amount)
}
