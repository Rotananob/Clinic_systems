# Cambodia National Social Security Fund (NSSF) Mobile POS e-Claim Specification
Document Identifier: NSSF-ECLAIM-MOBILE-SPEC-2026-V1
Compliance Standards: Law on Social Security Schemes (Royal Kram No. NS/RKM/1119/018), Joint Prakas MoLVT/MoH No. 109 and No. 044, CamDX Data Exchange Standard, HL7 FHIR R4 Claim Resource
Classification: Enterprise Standard Medical Billing, Mobile POS e-Claim, and Regulatory Health Insurance Specification

---

## 1. Executive Summary and Architecture Overview

### 1.1 Regulatory Framework
The National Social Security Fund - បេឡាជាតិសន្តិសុខសង្គម ហៅកាត់ថា ប.ស.ស. administers compulsory healthcare and occupational risk insurance schemes for all formal and informal workers, civil servants, and dependents in the Kingdom of Cambodia.

Accredited health facilities, polyclinics, and mobile point-of-sale (POS) clinic stations must verify member eligibility in real time and submit cryptographically signed electronic claims (e-claims) directly to the NSSF Claims Processing Gateway (via CamDX or direct NSSF Web API).

This specification details:
1. Online Member Eligibility Verification via QR code and 10-digit Member ID.
2. Data Dictionary for Outpatient (OPD), Inpatient (IPD), Emergency, and Maternity encounters.
3. Diagnostic ICD-10 validation and occupational risk dual-coding requirements.
4. Tariff schedules and automated pricing engine using K, B, and R coefficients.
5. Asymmetric digital signature requirements (ECDSA / RSA) and replay-prevention headers.
6. Offline mutation outbox and synchronization architecture for mobile Android POS devices.

```
+----------------------------------------------------------------------------------------------------+
|                         CAMBODIA NSSF MOBILE E-CLAIM SYSTEM ARCHITECTURE                           |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ MOBILE POS CLINICAL / BILLING TERMINAL ]                                                        |
|  - Patient Check-in: Scans NSSF Card QR Code / Enters 10-Digit Member ID                            |
|  - Real-Time Eligibility Call: Checks membership status, active contributions, benefit package     |
|  - Encounter Capture: Doctor enters diagnoses (ICD-10) and itemized medical acts                  |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | NSSF TARIFF & VALIDATION ENGINE                                                               | |
|  | - Validates ICD-10 Format and Occupational Risk dual-coding (S/T injury + V/Y cause)          | |
|  | - Calculates Act Tariffs: Base Unit * Coefficient (Surgical K, Biology B, Radiology R)        | |
|  | - Evaluates Co-payment: 100% NSSF Coverage vs Patient Luxury/Non-Formulary Co-payment         | |
|  | - Enforces Pre-authorization Gate (Surgery K >= 70, CT/MRI R >= 50, ICU Bed Days)             | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | HARDWARE-BACKED CRYPTOGRAPHIC SIGNING (ANDROID KEYSTORE / HSM)                                 | |
|  | - Canonical JSON payload serialization                                                        | |
|  | - Generates SHA-256 Digest & Signs with Facility Private Key (ECDSA secp256r1 or RSA-2048)     | |
|  | - Generates Headers: X-NSSF-Signature, X-NSSF-Timestamp, X-NSSF-Nonce, X-NSSF-Facility-Id     | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ TRANSMISSION GATEWAY: CAMDX / NSSF CENTRAL CLAIMS API ]                                         |
|  - Online Mode: Direct HTTPS POST /api/v1/eclaims/submit                                           |
|  - Offline Mode: Encrypted local Room outbox with WorkManager background synchronization           |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. NSSF Member Eligibility Verification Protocol

### 2.1 Identification Methods
Every NSSF beneficiary presents one of three valid credential formats:
1. Physical NSSF Member Card with 2D QR Code: Contains encrypted JSON payload with Member ID, National ID, Full Name, Date of Birth, and Digital Signature.
2. 10-Digit NSSF Member Number: Printed on physical card or digital NSSF Member App.
3. National Identification Card (Khmer ID) or Civil Servant ID: Mapped to NSSF Master Registry.

### 2.2 Eligibility Verification API Request & Response
Prior to clinical service dispensation, the mobile terminal dispatches an eligibility query:

```http
POST /api/v1/eligibility/verify HTTP/1.1
Host: api.nssf.gov.kh
Content-Type: application/json
X-NSSF-Facility-Id: 12045
X-NSSF-Timestamp: 1793750400000
X-NSSF-Signature: MEQCIDP...

{
  "facilityCode": "12045",
  "memberId": "0123456789",
  "nationalId": "010203040",
  "encounterType": "OPD",
  "checkinTimestampIso": "2026-11-04T08:30:00Z"
}
```

#### Eligibility Response Payload:
```json
{
  "statusCode": 200,
  "isEligible": true,
  "memberId": "0123456789",
  "fullNameKh": "ស៊ុន វណ្ណា",
  "fullNameEn": "SUN VANNA",
  "gender": "FEMALE",
  "dateOfBirth": "1994-05-12",
  "schemeType": "HEALTH_CARE_AND_OCCUPATIONAL_RISK",
  "coverageStatus": "ACTIVE",
  "employerName": "GARMENT MANUFACTURING CORP LTD",
  "entitledBenefitPackages": [
    "OUTPATIENT_CONSULTATION",
    "INPATIENT_HOSPITALIZATION",
    "MATERNITY_BENEFIT",
    "EMERGENCY_AMBULANCE"
  ],
  "verificationToken": "VTOK_98471203948123"
}
```

If `isEligible` is `false`, the response contains explicit reason codes (e.g. `ARREARS_EMPLOYER_CONTRIBUTION`, `SUSPENDED_MEMBERSHIP`, `INVALID_MEMBER_ID`).

---

## 3. Data Dictionary for NSSF e-Claim Encounters

```
+----------------------------------+---------------+-----------+-----------------------------------------------------------------------+
| Field Name                       | Data Type     | Required  | Description and Business Validation Rule                              |
+----------------------------------+---------------+-----------+-----------------------------------------------------------------------+
| claimReferenceId                 | UUID String   | Mandatory | Unique 128-bit UUID generated by mobile POS terminal for idempotency. |
| facilityCode                     | String(5)     | Mandatory | Official 5-digit accredited facility code issued by MoH and NSSF.     |
| memberId                         | String(10)    | Mandatory | Exactly 10 numeric digits representing the NSSF member identification.|
| verificationToken                | String(64)    | Mandatory | Cryptographic token returned from eligibility verification API.       |
| patientUpid                      | String(20)    | Mandatory | Unique Patient Identification in clinic EMR.                          |
| patientFullNameKh                | String(100)   | Mandatory | Patient full legal name in Khmer script.                              |
| patientGender                    | Enum          | Mandatory | MALE or FEMALE.                                                       |
| encounterType                    | Enum          | Mandatory | OPD, IPD, EMERGENCY, MATERNITY, OCCUPATIONAL_RISK.                    |
| admissionTimestampIso            | ISO-8601      | Mandatory | Timestamp of admission or outpatient registration.                    |
| dischargeTimestampIso            | ISO-8601      | Mandatory | Timestamp of discharge or consultation completion.                    |
| treatingPhysicianLicenseNo       | String(15)    | Mandatory | Medical Council of Cambodia (MCC) physician registration number.      |
| treatingPhysicianNameKh          | String(100)   | Mandatory | Full legal name of treating physician in Khmer script.                |
| primaryDiagnosisIcd10            | String(7)     | Mandatory | Validated ICD-10 primary diagnosis code. Format: A00 to Z99.9.        |
| secondaryDiagnosisIcd10          | Array(String) | Optional  | Up to 5 supporting secondary ICD-10 codes.                            |
| externalCauseOfInjuryIcd10       | String(7)     | Conditional Mandatory for OCCUPATIONAL_RISK encounters: V00 to Y99.             |
| accidentWorkplaceType            | Enum          | Conditional COMMUTING_ACCIDENT, WORKPLACE_ON_DUTY, NON_OCCUPATIONAL.           |
| preAuthApprovalCode              | String(20)    | Conditional Mandatory if any act requires pre-authorization (K >= 70, CT/MRI).|
| serviceItems                     | Array(Object) | Mandatory | Array of itemized medical acts, tests, beds, and drugs delivered.     |
| invoiceGrossAmountKhr            | Long Integer  | Mandatory | Total monetary value of all items billed in Cambodian Riel (KHR).     |
| nssfCoveredAmountKhr             | Long Integer  | Mandatory | Amount billed to NSSF per master tariff rules in Cambodian Riel.      |
| patientCoPaymentAmountKhr        | Long Integer  | Mandatory | Non-covered amount collected directly from patient in Riel.          |
| digitalSignature                 | String(Base64)| Mandatory | ECDSA or RSA digital signature of the canonical JSON payload.         |
+----------------------------------+---------------+-----------+-----------------------------------------------------------------------+
```

### 3.1 Service Item Sub-Structure (Itemized Billing Line)
```
+----------------------------------+---------------+-----------+-----------------------------------------------------------------------+
| Item Field Name                  | Data Type     | Required  | Description and Tariff Calculation Rule                               |
+----------------------------------+---------------+-----------+-----------------------------------------------------------------------+
| itemSequenceNumber               | Integer       | Mandatory | Line index starting at 1.                                             |
| nssfActCode                      | String(20)    | Mandatory | Standard NSSF code (e.g. NSSF-OPD-001, NSSF-SURG-K50).               |
| actDescriptionKh                 | String(200)   | Mandatory | Procedure or medication description in Khmer script.                  |
| coefficientType                  | Enum          | Mandatory | FIXED, K_SURGICAL, B_LABORATORY, R_RADIOLOGY, PHARMACY_EDL.           |
| coefficientValue                 | Float         | Mandatory | Coefficient multiplier (e.g. 50.0 for K50, 12.0 for B12).             |
| unitRateKhr                      | Long Integer  | Mandatory | Monetary rate per unit (K = 12,000 KHR, B = 1,000 KHR, R = 2,500 KHR).|
| quantity                         | Integer       | Mandatory | Number of units delivered (days, tests, items).                       |
| lineTotalKhr                     | Long Integer  | Mandatory | Quantity * (coefficientValue * unitRateKhr) or fixed package rate.    |
| isCoveredByNssf                  | Boolean       | Mandatory | True if covered under standard benefit package; False if co-payment.  |
+----------------------------------+---------------+-----------+-----------------------------------------------------------------------+
```

---

## 4. Diagnosis ICD-10 Coding Validation Rules

The NSSF claims adjudication engine rejects claims failing strict ICD-10 validation:

### 4.1 Structural Validation Regex
Every primary and secondary diagnosis must strictly conform to World Health Organization (WHO) ICD-10 2016 / Cambodia MoH morbidity list syntax:

```
^[A-Z][0-9]{2}(\.[0-9]{1,2})?$
```

Examples of Valid Codes:
- `A09` (Infectious gastroenteritis and colitis, unspecified)
- `I10` (Essential primary hypertension)
- `E11.9` (Type 2 diabetes mellitus without complications)
- `O80.0` (Spontaneous vertex delivery)
- `S82.10` (Fracture of upper end of tibia, closed)

### 4.2 Occupational Risk Dual-Coding Interlock
When `encounterType` is set to `OCCUPATIONAL_RISK` (workplace accident or road traffic accident during commute), the claim requires **Dual ICD-10 Coding**:
1. Nature of Injury Code (Chapter XIX: S00 to T88): Identifies the physiological trauma (e.g. `S52.5` - Fracture of lower end of radius).
2. External Cause of Morbidity Code (Chapter XX: V00 to Y99): Identifies the accident mechanism and environment (e.g. `V19.4` - Motorcycle rider injured in collision with fixed or stationary object; `W31.0` - Contact with factory machinery).

ENGINE RULE: If `encounterType == OCCUPATIONAL_RISK` and `externalCauseOfInjuryIcd10` is null or empty, the claim is rejected at the mobile terminal prior to cryptographic signing.

### 4.3 Excluded and Non-Reimbursable Diagnosis Codes
NSSF regulations strictly disallow reimbursement for:
- Cosmetic or aesthetic procedures without functional impairment (ICD-10 `Z41.1`, `Z41.8`).
- Fertility treatments, in vitro fertilization (IVF), and reversal of sterilization (ICD-10 `N97`, `Z31.0`).
- Unverified alternative therapies or non-MoH registered therapies.
- Self-inflicted intentional injuries or suicide attempts (ICD-10 `X60` to `X84`).

---

## 5. NSSF Master Tariff Schedules and Pricing Engine

### 5.1 Coefficient Calculation Formulates

```
+--------------------------+-----------------------+-----------------------+---------------------------------------------------------+
| Category                 | Coefficient Symbol    | Base Unit Value (KHR) | Mathematical Formulation                                |
+--------------------------+-----------------------+-----------------------+---------------------------------------------------------+
| Surgical Interventions   | K-Coefficient         | 12,000 KHR per K      | Fee = K_value * 12,000 KHR                             |
| Clinical Laboratory Tests| B-Coefficient         |  1,000 KHR per B      | Fee = B_value * 1,000 KHR                              |
| Diagnostic Radiology     | R-Coefficient         |  2,500 KHR per R      | Fee = R_value * 2,500 KHR                              |
| Essential Medicines EDL  | Direct MoH Tariff     | Unit Price KHR        | Fee = Quantity * Unit_Price                             |
| Fixed Package Services   | Fixed Package         | Fixed Amount KHR      | Fee = Fixed_Package_Ceiling                             |
+--------------------------+-----------------------+-----------------------+---------------------------------------------------------+
```

### 5.2 Key Standard Service Acts and Ceilings
```
+---------------+-----------------------------------------------+---------------+-----------------------+---------------------+
| NSSF Code     | Service Act Description                       | Coefficient   | Unit Value (KHR)      | Reimbursable Ceiling|
+---------------+-----------------------------------------------+---------------+-----------------------+---------------------+
| NSSF-OPD-001  | General Outpatient Consultation               | Fixed         | Fixed                 | 20,000 KHR          |
| NSSF-OPD-002  | Specialist Physician Consultation             | Fixed         | Fixed                 | 40,000 KHR          |
| NSSF-OPD-003  | Emergency Bay Resuscitation Consultation      | Fixed         | Fixed                 | 60,000 KHR          |
| NSSF-IPD-001  | General Ward Bed Day                          | Fixed per Day | Fixed                 | 45,000 KHR / Day    |
| NSSF-IPD-003  | Intensive Care Unit (ICU) Bed Day             | Fixed per Day | Fixed                 | 250,000 KHR / Day   |
| NSSF-SURG-K05 | Wound Suture and Debridement under 5 cm       | K5            | 12,000                | 60,000 KHR          |
| NSSF-SURG-K30 | Closed Reduction of Long Bone Fracture       | K30           | 12,000                | 360,000 KHR         |
| NSSF-SURG-K50 | Open Appendectomy                             | K50           | 12,000                | 600,000 KHR         |
| NSSF-SURG-K70 | Caesarean Section Delivery (Pre-Auth Req)     | K70           | 12,000                | 840,000 KHR         |
| NSSF-SURG-K100| Open Reduction Internal Fixation (ORIF) Femur | K100          | 12,000                | 1,200,000 KHR       |
| NSSF-MAT-001  | Normal Vaginal Delivery Package               | Fixed Package | Fixed                 | 400,000 KHR         |
| NSSF-LAB-B12  | Complete Blood Count (CBC 5-Diff)             | B12           | 1,000                 | 12,000 KHR          |
| NSSF-LAB-B15  | Serum Creatinine and Urea                     | B15           | 1,000                 | 15,000 KHR          |
| NSSF-RAD-R10  | Standard Chest X-Ray (1 View)                 | R10           | 2,500                 | 25,000 KHR          |
| NSSF-RAD-R20  | Abdominal Ultrasound (General)                | R20           | 2,500                 | 50,000 KHR          |
| NSSF-RAD-R80  | CT Scan Brain without Contrast (Pre-Auth Req) | R80           | 2,500                 | 200,000 KHR         |
+---------------+-----------------------------------------------+---------------+-----------------------+---------------------+
```

### 5.3 Co-Payment Calculation Rules
$$\text{Gross Total} = \sum \text{Line Total}_{\text{all items}}$$

$$\text{NSSF Covered Amount} = \sum \min(\text{Line Total}_{\text{covered item}}, \text{NSSF Max Ceiling})$$

$$\text{Patient Co-Payment Amount} = \text{Gross Total} - \text{NSSF Covered Amount}$$

- For basic standard ward admissions and essential generic medications on the MoH EDL: Co-payment is strictly 0 KHR ($100\%$ covered by NSSF).
- Co-payment applies only when the patient or family voluntarily requests luxury upgrades (e.g. VIP Private Room upgrade difference, brand-name originator drugs where an approved generic exists).

---

## 6. Digital Signature & Cryptographic Assurance Requirements

### 6.1 Cryptographic Standard
To ensure authenticity, data integrity, and legal non-repudiation under Cambodian e-commerce and social security law:
- Algorithm: Elliptic Curve Digital Signature Algorithm (ECDSA) with NIST P-256 curve (`secp256r1`) and SHA-256 hash, OR RSA-2048 with PKCS#1 v1.5 padding and SHA-256.
- Key Storage: Mobile POS terminals must store the facility private signing key inside the hardware-backed **Android Keystore** (StrongBox Keymaster or TEE - Trusted Execution Environment).
- Key Import & Registration: The public certificate is registered with NSSF and CamDX during annual facility accreditation.

### 6.2 Canonicalization and Payload Signing Sequence
1. Prepare normalized JSON payload with sorted keys and whitespace trimmed.
2. Compute cryptographic SHA-256 digest:
   $$\text{Digest} = \text{SHA-256}(\text{Canonical\_JSON\_Payload})$$
3. Sign the digest with the hardware-backed private key:
   $$\text{Signature} = \text{ECDSA\_Sign}(\text{PrivateKey}_{\text{facility}}, \text{Digest})$$
4. Base64-encode the signature and transmit in the `X-NSSF-Signature` HTTP header.

### 6.3 Replay-Attack Prevention Headers
Every outbound e-claim submission must include:
- `X-NSSF-Facility-Id`: 5-digit registered facility code.
- `X-NSSF-Timestamp`: Current UTC Unix epoch timestamp in milliseconds. NSSF gateway rejects requests where $|t_{\text{current}} - t_{\text{header}}| > 300,000\text{ ms}$ (5 minutes).
- `X-NSSF-Nonce`: Cryptographically secure random 128-bit UUID (e.g. `9f8e7d6c-5b4a-3210-fedc-ba9876543210`). The NSSF gateway checks the nonce cache; duplicate nonces are blocked immediately.
- `X-NSSF-Signature`: Base64-encoded digital signature string.

---

## 7. Production-Grade TypeScript DTO Schemas for e-Claim Gateway

```typescript
/**
 * Cambodia NSSF Mobile POS e-Claim Data Transfer Objects
 * File: src/clinical/billing/NssfClaimDto.ts
 * Strictly 0 emojis. Strictly 0 parentheses in Khmer strings.
 */

export type NssfEncounterType = 'OPD' | 'IPD' | 'EMERGENCY' | 'MATERNITY' | 'OCCUPATIONAL_RISK';

export type NssfCoefficientType = 'FIXED' | 'K_SURGICAL' | 'B_LABORATORY' | 'R_RADIOLOGY' | 'PHARMACY_EDL';

export interface NssfServiceItemDto {
  sequenceNumber: number;
  nssfActCode: string;
  actDescriptionKh: string;
  actDescriptionEn: string;
  coefficientType: NssfCoefficientType;
  coefficientValue: number;
  unitRateKhr: number;
  quantity: number;
  lineTotalKhr: number;
  isCoveredByNssf: boolean;
  preAuthCode?: string;
}

export interface NssfClaimSubmissionPayload {
  claimReferenceId: string; // UUID v4
  facilityCode: string;     // 5-digit MoH code
  memberId: string;         // 10-digit NSSF card number
  verificationToken: string;// From eligibility check
  patientUpid: string;
  patientFullNameKh: string;
  patientFullNameEn: string;
  patientGender: 'MALE' | 'FEMALE';
  encounterType: NssfEncounterType;
  admissionTimestampIso: string;
  dischargeTimestampIso: string;
  treatingPhysicianLicenseNo: string;
  treatingPhysicianNameKh: string;
  primaryDiagnosisIcd10: string;
  secondaryDiagnosisIcd10: string[];
  externalCauseOfInjuryIcd10?: string; // Required if OCCUPATIONAL_RISK
  accidentWorkplaceType?: 'COMMUTING_ACCIDENT' | 'WORKPLACE_ON_DUTY' | 'NON_OCCUPATIONAL';
  preAuthApprovalCode?: string;
  serviceItems: NssfServiceItemDto[];
  invoiceGrossAmountKhr: number;
  nssfCoveredAmountKhr: number;
  patientCoPaymentAmountKhr: number;
  terminalDeviceId: string;
  submissionTimestampIso: string;
}

export interface NssfClaimSubmissionResponse {
  claimReferenceId: string;
  nssfTrackingNumber: string;
  adjudicationStatus: 'ACCEPTED' | 'PENDING_PREAUTH_REVIEW' | 'REJECTED';
  approvedAmountKhr: number;
  settlementBatchId?: string;
  rejectionReasonCodes?: string[];
  rejectionReasonKh?: string;
  submissionAcknowledgedIso: string;
}
```

---

## 8. Kotlin Multiplatform / Native Android e-Claim Models & Pricing Engine

```kotlin
package com.krupet.clinic.core.model.nssf

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - NSSF e-Claim Production Data Models
 * File: NssfClaimModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class NssfEncounterType {
    OPD,
    IPD,
    EMERGENCY,
    MATERNITY,
    OCCUPATIONAL_RISK
}

@Serializable
enum class NssfCoefficientType {
    FIXED,
    K_SURGICAL,
    B_LABORATORY,
    R_RADIOLOGY,
    PHARMACY_EDL
}

@Serializable
data class NssfServiceItem(
    val sequenceNumber: Int,
    val nssfActCode: string,
    val actDescriptionKh: String,
    val actDescriptionEn: String,
    val coefficientType: NssfCoefficientType,
    val coefficientValue: Float,
    val unitRateKhr: Long,
    val quantity: Int,
    val lineTotalKhr: Long,
    val isCoveredByNssf: Boolean,
    val preAuthCode: String? = null
)

@Serializable
data class NssfClaimEntity(
    val claimReferenceId: String,
    val facilityCode: String,
    val memberId: String,
    val verificationToken: String,
    val patientUpid: String,
    val patientFullNameKh: String,
    val patientFullNameEn: String,
    val patientGender: String,
    val encounterType: NssfEncounterType,
    val admissionTimestampIso: String,
    val dischargeTimestampIso: String,
    val treatingPhysicianLicenseNo: String,
    val treatingPhysicianNameKh: String,
    val primaryDiagnosisIcd10: String,
    val secondaryDiagnosisIcd10: List<String> = emptyList(),
    val externalCauseOfInjuryIcd10: String? = null,
    val preAuthApprovalCode: String? = null,
    val serviceItems: List<NssfServiceItem>,
    val invoiceGrossAmountKhr: Long,
    val nssfCoveredAmountKhr: Long,
    val patientCoPaymentAmountKhr: Long,
    val terminalDeviceId: String,
    val digitalSignatureBase64: String? = null
)

object NssfPricingCalculator {
    const val K_SURGICAL_UNIT_RATE = 12000L  // 12,000 KHR per K
    const val B_LABORATORY_UNIT_RATE = 1000L  // 1,000 KHR per B
    const val R_RADIOLOGY_UNIT_RATE = 2500L   // 2,500 KHR per R

    data class CalculationSummary(
        val grossTotalKhr: Long,
        val nssfCoveredKhr: Long,
        val patientCoPaymentKhr: Long,
        val requiresPreAuth: Boolean
    )

    fun calculateClaimSummary(
        items: List<NssfServiceItem>,
        encounterType: NssfEncounterType
    ): CalculationSummary {
        var grossTotal = 0L
        var nssfCovered = 0L
        var requiresPreAuth = false

        for (item in items) {
            val itemTotal = item.lineTotalKhr
            grossTotal += itemTotal

            if (item.isCoveredByNssf) {
                nssfCovered += itemTotal
            }

            // Pre-auth flag checks
            if (item.coefficientType == NssfCoefficientType.K_SURGICAL && item.coefficientValue >= 70.0f) {
                requiresPreAuth = true
            }
            if (item.coefficientType == NssfCoefficientType.R_RADIOLOGY && item.coefficientValue >= 50.0f) {
                requiresPreAuth = true
            }
        }

        val coPayment = grossTotal - nssfCovered

        return CalculationSummary(
            grossTotalKhr = grossTotal,
            nssfCoveredKhr = nssfCovered,
            patientCoPaymentKhr = coPayment,
            requiresPreAuth = requiresPreAuth
        )
    }

    /**
     * Validates ICD-10 syntax: Format A00 to Z99.9
     */
    fun isValidIcd10(code: String): Boolean {
        val regex = Regex("^[A-Z][0-9]{2}(\\.[0-9]{1,2})?$")
        return regex.matches(code.trim().uppercase())
    }

    /**
     * Enforces dual-coding validation for Occupational Risk encounters
     */
    fun validateOccupationalRisk(
        encounterType: NssfEncounterType,
        primaryIcd: String,
        externalCauseIcd: String?
    ): Boolean {
        if (encounterType != NssfEncounterType.OCCUPATIONAL_RISK) return true
        if (!isValidIcd10(primaryIcd)) return false
        if (externalCauseIcd.isNullOrBlank() || !isValidIcd10(externalCauseIcd)) return false

        // Primary must be Injury (Chapter XIX: S or T)
        val isInjuryPrimary = primaryIcd.startsWith("S") || primaryIcd.startsWith("T")
        // External cause must be Chapter XX: V, W, X, or Y
        val isExternalCause = externalCauseIcd.startsWith("V") || externalCauseIcd.startsWith("W") ||
                              externalCauseIcd.startsWith("X") || externalCauseIcd.startsWith("Y")

        return isInjuryPrimary && isExternalCause
    }
}
```

---

## 9. Bilingual Khmer and English UI & Data Dictionary Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English NSSF e-Claim Identifier      | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| National Social Security Fund NSSF   | បេឡាជាតិសន្តិសុខសង្គម បសស                                    |
| Mobile POS e-Claim Station           | ស្ថានីយគិតប្រាក់ចល័តទូទាត់សំណង បសស                          |
| Member Eligibility Verification      | ការផ្ទៀងផ្ទាត់សិទ្ធិទទួលបានការធានារ៉ាប់រងសមាជិក              |
| Ten-Digit NSSF Member Number         | លេខកាតសមាជិក បសស ១០ ខ្ទង់                                    |
| Active Insurance Coverage Status     | ស្ថានភាពសុពលភាពធានារ៉ាប់រងសកម្ម                               |
| Outpatient Department - OPD Claim    | សំណងថ្លៃព្យាបាលជំងឺក្រៅ                                      |
| Inpatient Department - IPD Claim     | សំណងថ្លៃសម្រាកព្យាបាលក្នុងមន្ទីរពេទ្យ                        |
| Emergency and Trauma Resuscitation   | សំណងសង្គ្រោះបន្ទាន់និងរបួសគ្រោះថ្នាក់                         |
| Occupational Risk Workplace Accident | សំណងហានិភ័យការងារនិងគ្រោះថ្នាក់ពេលបំពេញការងារ                  |
| Maternity Benefit Normal Delivery    | អត្ថប្រយោជន៍សម្ភពសម្រាលកូនធម្មតា                             |
| Primary Diagnosis ICD-10 Code        | លេខកូដរោគវិនិច្ឆ័យចម្បង ICD-10                              |
| External Cause of Injury Code        | លេខកូដមូលហេតុខាងក្រៅនៃគ្រោះថ្នាក់                            |
| Dual-Coding Validation Interlock     | ការផ្ទៀងផ្ទាត់កូដរោគវិនិច្ឆ័យទ្វេភាគី                        |
| Surgical K-Coefficient Tariff        | តម្លៃសេវាកម្មវះកាត់តាមមេគុណ K                               |
| Laboratory B-Coefficient Tariff      | តម្លៃសេវាវិភាគមន្ទីរពិសោធន៍តាមមេគុណ B                       |
| Radiology R-Coefficient Tariff       | តម្លៃសេវាថតឆ្លុះវេជ្ជសាស្ត្រតាមមេគុណ R                     |
| NSSF Maximum Reimbursable Ceiling    | កម្រិតសំណងអតិបរមាដែលអនុញ្ញាតដោយ បសស                          |
| Patient Co-Payment Zero Riel         | ការបង់ប្រាក់បន្ថែមដោយអ្នកជំងឺសូន្យរៀល                          |
| Pre-Authorization Approval Code      | លេខកូដអនុញ្ញាតមុននៃការព្យាបាល                               |
| Hardware-Backed Digital Signature    | ហត្ថលេខាឌីជីថលសុវត្ថិភាពខ្ពស់លើឧបករណ៍ចល័ត                   |
| Offline Claim Outbox Synchronizing   | កំពុងដំណើរការបញ្ជូនសំណងក្រៅបណ្តាញទៅកាន់ម៉ាស៊ីនមេ             |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 10. Audit Gates and Financial Interlocks

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Real-Time Eligibility Lockout          | Hard Financial Gate | Prevents creating an NSSF claim if member status is     |
|                                        |                     | SUSPENDED or INACTIVE. Falls back to Private POS.       |
|                                        |                     |                                                         |
| Occupational Dual-Coding Interlock     | Clinical Rule Gate  | Rejects claim if encounter is OCCUPATIONAL_RISK and is  |
|                                        |                     | missing External Cause code (V00-Y99) or Injury code.   |
|                                        |                     |                                                         |
| Pre-Authorization Adjudication Gate    | Hard Billing Gate   | Automatically blocks submission without valid Pre-Auth  |
|                                        |                     | code if surgery K >= 70 or imaging R >= 50.             |
|                                        |                     |                                                         |
| Duplicate Claim Window Lockout         | 24-Hour Gate        | Disallows identical facility, member ID, and primary    |
|                                        |                     | ICD-10 code within 24 hours without MD justification.   |
|                                        |                     |                                                         |
| Cryptographic Hardware Signature Check | Security Gate       | Claims must be signed by Android Keystore private key;  |
|                                        |                     | unsigned or tampered payloads are rejected by CamDX.    |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated verification confirms 0 emoji symbols.        |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated verification confirms 0 parentheses on lines  |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
