# Cambodia Ministry of Health (MoH) HMIS Clinical Reporting Engine Specification
Document Identifier: MOH-HMIS-REPORTING-SPEC-2026-V1
Compliance Standards: Cambodia MoH National HMIS Guidelines, DHIS2 Data Standards, ICD-10 MoH Morbidity List, NSSF Cambodia Clinical Reporting
Classification: Enterprise Standard Regulatory Clinical Reporting and Health Intelligence Engine

---

## 1. Executive Summary and Architecture Overview

### 1.1 Regulatory Rationale
All licensed medical facilities, private clinics, polyclinics, and referral hospitals in the Kingdom of Cambodia are mandated by the Ministry of Health (MoH) Department of Planning and Health Information (DPHI) to collect, aggregate, and submit monthly Health Management Information System (HMIS) clinical reports to their respective Operational District (OD) and Provincial Health Department (PHD).

This reporting engine automates data extraction from patient encounters, electronic medical records (EMR), laboratory results, pharmacy dispensations, and bed management matrices. The engine computes regulatory indicators and transforms aggregated data into both the official MoH Monthly Clinical Report format (Form HO2 / Private Clinic Activity Report) and standards-compliant DHIS2 DataValueSets JSON payloads.

```
+----------------------------------------------------------------------------------------------------+
|                         CAMBODIA MOH HMIS CLINICAL REPORTING ENGINE                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ PRIMARY CLINICAL DATA SOURCES ]                                                                 |
|  - Outpatient Encounters (General Medicine, Pediatrics, Dental, OB/GYN)                            |
|  - Inpatient Bed Ward Tracker (Admissions, Discharges, Inpatient Days, Deaths)                     |
|  - Laboratory Information System (Malaria RDT/Microscopy, Dengue NS1/IgM, Widal, HbA1c, Lipids)    |
|  - Emergency Triage Records (ESI Levels 1-5, NEWS2 Acuity Scores, Referrals to PRH/National)      |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | HMIS AGGREGATION & INDICATOR CALCULATION ENGINE                                               | |
|  | - OPD Volume: General, Dental, Pediatric stratified by Age (<1m, 1-11m, 1-4y, >=5y) & Sex      | |
|  | - IPD Metrics: Bed Occupancy Rate (BOR %), Average Length of Stay (ALOS), In-Hospital Deaths   | |
|  | - Communicable Disease Surveillance: Dengue (DF/DHF/DSS), Malaria (Pf/Pv), Typhoid, SARI/Pneum | |
|  | - Non-Communicable Diseases (NCD): Hypertension (Stage 1/2/Crisis), Type 2 Diabetes, Glycemia| |
|  | - Triage Distribution: ESI 1-5 percentages, NEWS2 High/Medium escalation, CPA-3 transfer rate  | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | REGULATORY SCHEMA EXPORT & SERIALIZATION                                                      | |
|  | - TypeScript & Kotlin Production DTOs                                                         | |
|  | - DHIS2 Standard DataValueSets JSON Payload (DataElement UIDs, CategoryOptionCombos)          | |
|  | - Cambodia MoH Monthly Report Document Generation (Khmer & English Formats)                   | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Core HMIS Indicator Definitions and Mathematical Formulations

### 2.1 Outpatient Department (OPD) Consultation Indicators

#### 1. Demographic & Clinical Department Breakdown:
- General Medicine Consultations: Total non-specialized adult consultations.
- Pediatric Consultations: Age $< 15$ years, with mandatory age sub-stratification:
  * Neonatal: Age $< 28$ days ($< 1$ month).
  * Infant: Age 29 days to 11 months.
  * Young Child: Age 1 year to 4 years (12 to 59 months).
  * Older Child: Age 5 years to 14 years.
- Dental Consultations:
  * Preventive examinations and scaling.
  * Tooth extractions (deciduous and permanent).
  * Restorative fillings (composite, glass ionomer).
  * Endodontic root canal treatments.
  * Periodontal treatments and minor oral surgery.
- Disaggregations: Every consultation indicator requires sub-tallies for:
  * Sex: Male ($M$), Female ($F$).
  * Insurance Payer: National Social Security Fund (NSSF), Health Equity Fund (HEF), Private Out-of-Pocket.
  * Patient Origin: Within Catchment Area vs Outside Catchment Area.

### 2.2 Inpatient Department (IPD) Hospitalization Indicators

#### 1. Fundamental Bed Census Variables:
- Available Beds ($B_{\text{avail}}$): Total registered, operational inpatient beds maintained during the reporting month.
- Admissions ($A_{\text{total}}$): Total patients formally admitted to an inpatient bed during the month.
- Discharges ($D_{\text{total}}$): Total live patients discharged from inpatient wards during the month.
- In-Hospital Deaths ($M_{\text{total}}$): Total patient mortalities occurring in inpatient wards (subdivided into deaths occurring $< 48$ hours of admission and $\ge 48$ hours of admission).
- Total Inpatient Days ($\sum \text{IPD\_Days}$): Sum of actual days spent in an inpatient bed by all hospitalized patients across the reporting period.
- Reporting Days in Period ($N_{\text{days}}$): Number of calendar days in the reporting month (28, 29, 30, or 31).

#### 2. Bed Occupancy Rate (BOR %):
Measures the operational efficiency and bed utilization of the medical facility:

$$\text{BOR (\%)} = \left(\frac{\sum \text{IPD\_Days}}{B_{\text{avail}} \times N_{\text{days}}}\right) \times 100$$

Standard MoH Benchmark: $75\% \text{ to } 85\%$. Values $< 60\%$ indicate under-utilization; values $> 90\%$ indicate bed congestion and clinical overcrowding.

#### 3. Average Length of Stay (ALOS in Days):
Measures the average duration of hospitalization per inpatient episode:

$$\text{ALOS (Days)} = \frac{\sum \text{IPD\_Days}}{D_{\text{total}} + M_{\text{total}}}$$

Standard MoH Benchmark: $3.5 \text{ to } 6.0 \text{ days}$ for acute referral hospitals.

#### 4. Bed Turnover Rate (BTR):
Measures the number of patients treated per available bed over the month:

$$\text{BTR} = \frac{D_{\text{total}} + M_{\text{total}}}{B_{\text{avail}}}$$

#### 5. Bed Turnover Interval (BTI in Days):
Measures the average number of days an available bed remains vacant between admissions:

$$\text{BTI (Days)} = \frac{(B_{\text{avail}} \times N_{\text{days}}) - \sum \text{IPD\_Days}}{D_{\text{total}} + M_{\text{total}}}$$

#### 6. Hospital Gross Mortality Rate (%):
$$\text{Gross Mortality (\%)} = \left(\frac{M_{\text{total}}}{D_{\text{total}} + M_{\text{total}}}\right) \times 100$$

---

### 2.3 Communicable Disease Surveillance Indicators

The MoH Department of Communicable Disease Control (CDC) mandates immediate and monthly case reporting across core infectious disease categories:

```
+------------------------------------+------------+-------------------------------------------------------------+
| Disease Surveillance Category      | ICD-10     | MoH Diagnostic Case Definition Criteria                     |
+------------------------------------+------------+-------------------------------------------------------------+
| 1. Dengue Fever (DF)               | A90        | Acute fever 2-7 days + positive NS1 antigen / IgM antibody  |
|                                    |            | or clinical signs: rash, retro-orbital pain, leukopenia.    |
|                                    |            |                                                             |
| 2. Dengue Hemorrhagic Fever (DHF)  | A91        | Dengue criteria + thrombocytopenia (<100,000/mcL) + plasma  |
|                                    |            | leakage (elevated hematocrit >=20%, ascites, pleurisy).     |
|                                    |            |                                                             |
| 3. Dengue Shock Syndrome (DSS)     | A91.0      | DHF criteria + narrow pulse pressure (<=20 mmHg) or acute   |
|                                    |            | hypotension and peripheral circulatory failure.             |
|                                    |            |                                                             |
| 4. Malaria Plasmodium falciparum   | B50        | Confirmed Pf via Blood Film Microscopy or RDT positive Pf.  |
|                                    |            |                                                             |
| 5. Malaria Plasmodium vivax        | B51        | Confirmed Pv via Blood Film Microscopy or RDT positive Pv.  |
|                                    |            |                                                             |
| 6. Severe Malaria                  | B54.0      | Any malaria parasitemia + cerebral symptoms, severe anemia  |
|                                    |            | (Hb < 5 g/dL), acute kidney injury, or jaundice.            |
|                                    |            |                                                             |
| 7. Typhoid Fever                   | A01.0      | Step-ladder fever + positive blood/stool culture for S.     |
|                                    |            | Typhi or high titer Widal TO/TH (>= 1:160) with leukopenia. |
|                                    |            |                                                             |
| 8. Severe Acute Respiratory        | J09 - J18  | Acute onset fever >= 38 C + cough within 10 days requiring  |
|    Infection (SARI) / Pneumonia    |            | hospitalization with tachypnea and lung crackles/wheezes.   |
|                                    |            |                                                             |
| 9. Acute Watery Diarrhea           | A09        | >= 3 loose watery stools within 24 hours. Evaluated for     |
|                                    |            | severe dehydration and cholera surveillance.                |
|                                    |            |                                                             |
| 10. Tuberculosis Presumptive / Conf| A15 - A16  | Chronic cough >= 2 weeks, night sweats. Confirmed by sputum |
|                                    |            | GeneXpert MTB/RIF or acid-fast bacilli (AFB) smear.         |
+------------------------------------+------------+-------------------------------------------------------------+
```

---

### 2.4 Non-Communicable Diseases (NCD) Indicators

In accordance with the Cambodia National Multi-Sectoral Action Plan for the Prevention and Control of NCDs:

#### 1. Essential Hypertension (ICD-10 I10):
- Total Registered Hypertensive Cohort: Total active patients diagnosed with hypertension.
- New Cases Diagnosed in Reporting Month: Newly confirmed systolic $\text{BP} \ge 140\text{ mmHg}$ and/or diastolic $\text{BP} \ge 90\text{ mmHg}$ on two separate visits.
- Clinical Classification:
  * Stage 1 Hypertension: SBP $140 - 159\text{ mmHg}$ or DBP $90 - 99\text{ mmHg}$.
  * Stage 2 Hypertension: SBP $\ge 160\text{ mmHg}$ or DBP $\ge 100\text{ mmHg}$.
  * Hypertensive Urgency / Crisis: SBP $\ge 180\text{ mmHg}$ or DBP $\ge 120\text{ mmHg}$.
- Blood Pressure Control Rate (%):
  $$\text{BP Control Rate (\%)} = \left(\frac{\text{Hypertensive Patients with SBP } < 140 \text{ and DBP } < 90}{\text{Total Hypertensive Patients Assessed in Month}}\right) \times 100$$
  MoH National Target: $\ge 50\%$.

#### 2. Type 2 Diabetes Mellitus (ICD-10 E11):
- Total Registered Diabetic Cohort: Total active patients managed for T2DM.
- New Cases Diagnosed in Reporting Month: Fasting plasma glucose $\ge 126\text{ mg/dL}$ ($7.0\text{ mmol/L}$) or random plasma glucose $\ge 200\text{ mg/dL}$ ($11.1\text{ mmol/L}$) with symptoms, or $\text{HbA1c} \ge 6.5\%$.
- Glycemic Control Rate (%):
  $$\text{Glycemic Control Rate (\%)} = \left(\frac{\text{T2DM Patients with HbA1c } < 7.0\% \text{ or FPG } < 130\text{ mg/dL}}{\text{Total T2DM Patients Assessed in Month}}\right) \times 100$$
- Diabetic Complication Screening:
  * Foot examination with monofilament sensory testing.
  * Dilated eye exam or fundus photography for diabetic retinopathy.
  * Urine microalbumin / creatinine ratio for diabetic nephropathy.

---

### 2.5 Emergency Triage and Clinical Escalation Indicators

Aggregates patient severity from the emergency triage department:
- ESI Distribution (% of all emergency encounters):
  * ESI Level 1 (Resuscitation) Count & Percentage.
  * ESI Level 2 (Emergent) Count & Percentage.
  * ESI Level 3 (Urgent) Count & Percentage.
  * ESI Level 4 (Less Urgent) Count & Percentage.
  * ESI Level 5 (Non-Urgent) Count & Percentage.
- NEWS2 Deterioration Escalation:
  * Total ward assessments triggering Low-Medium Risk (single parameter score $= 3$).
  * Total assessments triggering Medium Risk (score $5-6$).
  * Total assessments triggering High Risk (score $\ge 7$) with Medical Emergency Team (MET) callout.
- Emergency Referral Disposition:
  * Patients discharged home after emergency stabilization.
  * Patients admitted directly to IPD wards or ICU.
  * Emergency transfers out to Provincial Referral Hospital (PRH / CPA3) or National Specialized Hospital (Calmette, Khmer-Soviet Friendship Hospital, Kantha Bopha).

---

## 3. Production-Grade TypeScript DTO Schemas for MoH HMIS Engine

```typescript
/**
 * Cambodia Ministry of Health (MoH) HMIS Reporting Engine
 * File: src/clinical/reporting/MohHmisReportingDto.ts
 * Strictly 0 emojis. Strictly 0 parentheses in Khmer strings.
 */

export interface MohFacilityMetadata {
  facilityId: string;
  facilityCode: string; // Official MoH 5-digit code
  facilityNameEn: string;
  facilityNameKh: string;
  facilityLevel: 'HEALTH_CENTER' | 'RH_CPA1' | 'RH_CPA2' | 'RH_CPA3' | 'PRIVATE_CLINIC' | 'POLYCLINIC';
  operationalDistrictCode: string;
  operationalDistrictName: string;
  provinceCode: string;
  provinceName: string;
  reportingYear: number;
  reportingMonth: number; // 1 to 12
  submissionTimestampIso: string;
  preparedByUserId: string;
  approvedByDirectorUserId: string;
}

export interface AgeGenderDisaggregation {
  maleUnder1Month: number;
  femaleUnder1Month: number;
  male1To11Months: number;
  female1To11Months: number;
  male1To4Years: number;
  female1To4Years: number;
  male5To14Years: number;
  female5To14Years: number;
  male15To49Years: number;
  female15To49Years: number;
  male50YearsAndAbove: number;
  female50YearsAndAbove: number;
  totalMale: number;
  totalFemale: number;
  grandTotal: number;
}

export interface MohOpdReportDto {
  generalMedicineConsultations: AgeGenderDisaggregation;
  pediatricConsultations: AgeGenderDisaggregation;
  dentalConsultations: {
    totalConsultations: number;
    extractionsDeciduous: number;
    extractionsPermanent: number;
    restorationsFillings: number;
    endodonticRootCanals: number;
    periodontalScaling: number;
    oralMaxillofacialProcedures: number;
  };
  obGynConsultations: {
    antenatalCareVisit1: number;
    antenatalCareVisit4Plus: number;
    postnatalCareVisits: number;
    gynecologicalExams: number;
  };
  insurancePayerBreakdown: {
    nssfInsuredCount: number;
    healthEquityFundCount: number;
    privateOutOfPocketCount: number;
  };
}

export interface MohIpdReportDto {
  availableOperationalBeds: number;
  calendarDaysInMonth: number;
  totalAdmissions: number;
  totalDischargesCuredOrImproved: number;
  totalDischargesReferralOut: number;
  totalDischargesAgainstMedicalAdvice: number;
  inHospitalDeathsUnder48Hours: number;
  inHospitalDeathsOver48Hours: number;
  totalInHospitalDeaths: number;
  totalInpatientDaysAccumulated: number;
  bedOccupancyRatePercent: number; // BOR %
  averageLengthOfStayDays: number; // ALOS Days
  bedTurnoverRate: number;         // BTR
  bedTurnoverIntervalDays: number; // BTI Days
  grossMortalityRatePercent: number;
}

export interface DiseaseSurveillanceItem {
  icd10Code: string;
  diseaseNameEn: string;
  diseaseNameKh: string;
  casesUnder5Years: number;
  cases5YearsAndAbove: number;
  totalCases: number;
  inHospitalDeaths: number;
  laboratoryConfirmedCases: number;
}

export interface MohSurveillanceReportDto {
  dengueFever: DiseaseSurveillanceItem;
  dengueHemorrhagicFever: DiseaseSurveillanceItem;
  dengueShockSyndrome: DiseaseSurveillanceItem;
  malariaPlasmodiumFalciparum: DiseaseSurveillanceItem;
  malariaPlasmodiumVivax: DiseaseSurveillanceItem;
  malariaSevere: DiseaseSurveillanceItem;
  typhoidFever: DiseaseSurveillanceItem;
  severeAcuteRespiratoryInfection: DiseaseSurveillanceItem;
  acuteWateryDiarrhea: DiseaseSurveillanceItem;
  tuberculosisConfirmed: DiseaseSurveillanceItem;
}

export interface MohNcdReportDto {
  hypertension: {
    totalRegisteredCohort: number;
    newCasesDiagnosedThisMonth: number;
    stage1HypertensionCases: number;
    stage2HypertensionCases: number;
    hypertensiveCrisisEmergencyCases: number;
    patientsAssessedForBpControl: number;
    patientsWithControlledBpUnder140_90: number;
    bpControlRatePercent: number;
  };
  diabetesType2: {
    totalRegisteredCohort: number;
    newCasesDiagnosedThisMonth: number;
    patientsAssessedForGlycemicControl: number;
    patientsWithHbA1cUnder7Percent: number;
    glycemicControlRatePercent: number;
    diabeticFootUlcersScreened: number;
    diabeticRetinopathyCasesScreened: number;
  };
}

export interface MohTriageReportDto {
  totalEmergencyPresentations: number;
  esiLevel1ResuscitationCount: number;
  esiLevel2EmergentCount: number;
  esiLevel3UrgentCount: number;
  esiLevel4LessUrgentCount: number;
  esiLevel5NonUrgentCount: number;
  news2EscalationHighRiskCount: number;
  news2EscalationMediumRiskCount: number;
  transfersToNationalOrProvincialHospital: number;
}

export interface MohMonthlyHmisSubmissionPayload {
  metadata: MohFacilityMetadata;
  outpatientData: MohOpdReportDto;
  inpatientData: MohIpdReportDto;
  surveillanceData: MohSurveillanceReportDto;
  ncdData: MohNcdReportDto;
  triageData: MohTriageReportDto;
}
```

---

## 4. Kotlin Multiplatform / Native Android DTO Schemas

```kotlin
package com.krupet.clinic.core.model.hmis

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - MoH HMIS Regulatory Report Data Transfer Objects
 * File: MohHmisReportingDto.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
data class MohFacilityMetadata(
    val facilityId: String,
    val facilityCode: String,
    val facilityNameEn: String,
    val facilityNameKh: String,
    val facilityLevel: String,
    val operationalDistrictCode: String,
    val operationalDistrictName: String,
    val provinceCode: String,
    val provinceName: String,
    val reportingYear: Int,
    val reportingMonth: Int,
    val submissionTimestampIso: String,
    val preparedByUserId: String,
    val approvedByDirectorUserId: String
)

@Serializable
data class AgeGenderDisaggregation(
    val maleUnder1Month: Int = 0,
    val femaleUnder1Month: Int = 0,
    val male1To11Months: Int = 0,
    val female1To11Months: Int = 0,
    val male1To4Years: Int = 0,
    val female1To4Years: Int = 0,
    val male5To14Years: Int = 0,
    val female5To14Years: Int = 0,
    val male15To49Years: Int = 0,
    val female15To49Years: Int = 0,
    val male50YearsAndAbove: Int = 0,
    val female50YearsAndAbove: Int = 0,
    val totalMale: Int = 0,
    val totalFemale: Int = 0,
    val grandTotal: Int = 0
)

@Serializable
data class MohDentalData(
    val totalConsultations: Int,
    val extractionsDeciduous: Int,
    val extractionsPermanent: Int,
    val restorationsFillings: Int,
    val endodonticRootCanals: Int,
    val periodontalScaling: Int,
    val oralMaxillofacialProcedures: Int
)

@Serializable
data class MohOpdReport(
    val generalMedicine: AgeGenderDisaggregation,
    val pediatrics: AgeGenderDisaggregation,
    val dental: MohDentalData,
    val nssfInsuredCount: Int,
    val healthEquityFundCount: Int,
    val privateOutOfPocketCount: Int
)

@Serializable
data class MohIpdReport(
    val availableOperationalBeds: Int,
    val calendarDaysInMonth: Int,
    val totalAdmissions: Int,
    val totalDischarges: Int,
    val totalInHospitalDeaths: Int,
    val totalInpatientDaysAccumulated: Int,
    val bedOccupancyRatePercent: Float,
    val averageLengthOfStayDays: Float,
    val bedTurnoverRate: Float,
    val grossMortalityRatePercent: Float
)

@Serializable
data class DiseaseSurveillanceItem(
    val icd10Code: String,
    val diseaseNameEn: String,
    val diseaseNameKh: String,
    val casesUnder5Years: Int,
    val cases5YearsAndAbove: Int,
    val totalCases: Int,
    val inHospitalDeaths: Int,
    val laboratoryConfirmedCases: Int
)

@Serializable
data class MohNcdReport(
    val totalHypertensionCohort: Int,
    val newHypertensionCases: Int,
    val controlledHypertensionCases: Int,
    val bpControlRatePercent: Float,
    val totalDiabetesCohort: Int,
    val newDiabetesCases: Int,
    val controlledDiabetesCases: Int,
    val glycemicControlRatePercent: Float
)

@Serializable
data class MohTriageReport(
    val totalEmergencyPresentations: Int,
    val esiLevel1Count: Int,
    val esiLevel2Count: Int,
    val esiLevel3Count: Int,
    val esiLevel4Count: Int,
    val esiLevel5Count: Int,
    val news2HighRiskCount: Int,
    val referralsToNationalOrProvincialHospital: Int
)

@Serializable
data class MohMonthlyHmisSubmissionPayload(
    val metadata: MohFacilityMetadata,
    val outpatient: MohOpdReport,
    val inpatient: MohIpdReport,
    val surveillance: List<DiseaseSurveillanceItem>,
    val ncd: MohNcdReport,
    val triage: MohTriageReport
)
```

---

## 5. DHIS2 DataValueSets JSON Payload Structure

The engine transforms internal aggregate tallies into the standardized DHIS2 Web API payload schema for seamless transmission to the Cambodia National DHIS2 server (`POST /api/dataValueSets`):

```json
{
  "dataSet": "MOH_HO2_HOSPITAL_MONTHLY_V1",
  "completeDate": "2026-11-03",
  "period": "202610",
  "orgUnit": "MOH_FAC_12045",
  "dataValues": [
    {
      "dataElement": "DE_OPD_GEN_CONSULT",
      "categoryOptionCombo": "COC_MALE_15_49",
      "value": "245"
    },
    {
      "dataElement": "DE_OPD_GEN_CONSULT",
      "categoryOptionCombo": "COC_FEMALE_15_49",
      "value": "312"
    },
    {
      "dataElement": "DE_IPD_TOTAL_ADMISSIONS",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "84"
    },
    {
      "dataElement": "DE_IPD_BED_OCCUPANCY_RATE",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "78.4"
    },
    {
      "dataElement": "DE_IPD_ALOS_DAYS",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "4.2"
    },
    {
      "dataElement": "DE_SURV_DENGUE_TOTAL",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "18"
    },
    {
      "dataElement": "DE_SURV_MALARIA_PF",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "2"
    },
    {
      "dataElement": "DE_NCD_HTN_CONTROLLED",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "142"
    },
    {
      "dataElement": "DE_NCD_DM2_CONTROLLED",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "89"
    },
    {
      "dataElement": "DE_TRIAGE_ESI_LEVEL_1",
      "categoryOptionCombo": "COC_DEFAULT",
      "value": "11"
    }
  ]
}
```

---

## 6. Bilingual Khmer and English Indicator Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English HMIS Indicator Identifier    | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| MoH HMIS Clinical Reporting          | របាយការណ៍ស្ថិតិសុខាភិបាលប្រចាំខែ ក្រសួងសុខាភិបាល               |
| Health Management Information System | ប្រព័ន្ធព័ត៌មានគ្រប់គ្រងសុខាភិបាល HMIS                         |
| General Medicine Consultations       | ចំនួនអ្នកជំងឺពិនិត្យជំងឺទូទៅ                                    |
| Pediatric Consultations Under 1 M    | ចំនួនកុមារពិនិត្យជំងឺ អាយុក្រោម ១ ខែ                           |
| Pediatric Consultations 1 to 11 M    | ចំនួនកុមារពិនិត្យជំងឺ អាយុពី ១ ដល់ ១១ ខែ                       |
| Pediatric Consultations 1 to 4 Y     | ចំនួនកុមារពិនិត្យជំងឺ អាយុពី ១ ដល់ ៤ ឆ្នាំ                     |
| Dental Restorations and Extractions  | សេវាព្យាបាលធ្មេញ ប៉ះធ្មេញ និងដកធ្មេញ                          |
| Inpatient Admissions Total           | ចំនួនអ្នកជំងឺសម្រាកពេទ្យសរុប                                  |
| Inpatient Bed Days Accumulated       | ចំនួនថ្ងៃសម្រាកព្យាបាលលើគ្រែសរុប                             |
| Bed Occupancy Rate BOR Percent       | អត្រាប្រើប្រាស់គ្រែពេទ្យគិតជាភាគរយ                           |
| Average Length of Stay ALOS Days     | រយៈពេលស្នាក់នៅមធ្យមរបស់អ្នកជំងឺគិតជាថ្ងៃ                        |
| In Hospital Mortality Rate           | អត្រាមរណភាពក្នុងមន្ទីរពេទ្យ                                  |
| Dengue Fever Surveillance            | ការតាមដានជំងឺគ្រុនឈាម                                        |
| Malaria Plasmodium Falciparum        | ជំងឺគ្រុនចាញ់ប្រភេទ ផ្លាសម៉ូដ្យូម ហ្វាល់ស៊ីប៉ារ៉ូម           |
| Malaria Plasmodium Vivax             | ជំងឺគ្រុនចាញ់ប្រភេទ ផ្លាសម៉ូដ្យូម វីវ៉ាក់                     |
| Typhoid Fever Widal Positive         | ជំងឺគ្រុនពោះវៀន តេស្តវីដាល់វិជ្ជមាន                           |
| Severe Acute Respiratory Infection   | ការឆ្លងរោគផ្លូវដង្ហើមស្រួចស្រាវធ្ងន់ធ្ងរ                        |
| Essential Hypertension Registered    | អ្នកជំងឺលើសសម្ពាធឈាមក្នុងបញ្ជីតាមដាន                           |
| Blood Pressure Control Rate          | អត្រាគ្រប់គ្រងសម្ពាធឈាមបានល្អគិតជាភាគរយ                      |
| Type 2 Diabetes Mellitus Cohort      | អ្នកជំងឺទឹកនោមផ្អែមប្រភេទ ២ ក្នុងបញ្ជីតាមដាន                  |
| Glycemic Control Rate HbA1c          | អត្រាគ្រប់គ្រងជាតិស្ករបានល្អគិតជាភាគរយ                        |
| Emergency Triage Severity ESI 1      | កម្រិតសង្គ្រោះបន្ទាន់បំផុត ESI ១                               |
| Referrals to Provincial Hospital     | ការបញ្ជូនអ្នកជំងឺបន្តទៅមន្ទីរពេទ្យបង្អែកខេត្ត ឬមន្ទីរពេទ្យជាតិ|
+--------------------------------------+--------------------------------------------------------------+
```

---

## 7. Audit Interlocks and Validation Verification

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Mathematical Consistency Check         | Hard Interlock      | Total Inpatient Days must equal sum of individual bed   |
|                                        |                     | days. Admissions must equal Discharges + Deaths + End   |
|                                        |                     | Month Remaining minus Beginning Month Inpatients.       |
|                                        |                     |                                                         |
| BOR Percentage Sanity Check            | Warning Boundary    | BOR > 100% generates an audit prompt verifying surge    |
|                                        |                     | capacity extra beds or corridor cots deployed.          |
|                                        |                     |                                                         |
| Notifiable Disease Immediate Alert     | Public Health Gate  | Immediate alert triggered to Provincial Health Dept for |
|                                        |                     | any confirmed case of Severe Dengue, Malaria, or Cholera|
|                                        |                     | within 24 hours (not waiting for month-end batch).      |
|                                        |                     |                                                         |
| MoH Facility Code Validation           | Data Quality Gate   | Verifies official 5-digit facility code against national|
|                                        |                     | DPHI master facility registry before DHIS2 export.      |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated validation confirms 0 emoji symbols.          |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated validation confirms 0 parentheses on lines    |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
