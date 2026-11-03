# Clinical Specialty Modules Technical Audit and Hospital-Grade Upgrade Roadmap
Clinic Patient Management PaaS System

## 1. Executive Summary & Architectural Audit

This technical report provides an exhaustive, clinical-grade inspection of the four specialty modules in the Clinic Patient Management PaaS system:
1. Dental Odontogram and Treatment Planner
2. Zero-Footprint WebGL PACS and Medical Imaging Workstation
3. Laboratory Information System (LIS) and ASTM/HL7 Interfacing
4. Electronic Claims (eClaim) Clearinghouse and Ministry of Health (MoH) DHIS2 National Surveillance

### Summary of System Architectural Findings
- Backend State: Currently, all four modules operate exclusively on transient in-memory storage (JavaScript Map objects and arrays). Data is lost whenever the NestJS backend restarts.
- Database Schema: In `backend/prisma/schema.prisma`, models exist for Patients, Visits, Medical Records, Prescriptions, and Invoices, but dedicated relational tables for Dental Charts, DICOM Studies, Laboratory Orders/Specimens, and Insurance Claims/Surveillance are completely absent.
- Frontend Rendering: The user interfaces feature rich layout wireframes, but several core medical features are simulated rather than clinically functional:
  - Dental: FDI adult numbering and DMFT score calculation are implemented, but 6-point periodontal charting is missing a dedicated interactive grid, and deciduous dentition is absent.
  - PACS: DICOM rendering is simulated using static JPEG thumbnails in an HTML img tag with CSS contrast/brightness filters. Hardware-accelerated WebGL 16-bit pixel rendering, real DICOM P10 parsing, vector caliper measurements with millimeter pixel-spacing calibration, and multi-slice volumetric scrolling are not yet implemented.
  - LIS: Barcodes are presented as plain text numbers rather than rendered Code128/DataMatrix vector barcodes for thermal specimen tube labels. Analyzer interfacing relies on manual text pasting instead of a real TCP/MLLP socket daemon.
  - eClaim and DHIS2: XML and FHIR generation logic is well-structured, but claims lack persistent audit trails, digital cryptographic signing, automated MoH DHIS2 API sync jobs, and Cambodia NSSF official tariff mappings.

---

## 2. In-Depth Technical Audit by Module

### 2.1 Dental Odontogram and Periodontal Suite
- Inspected Files:
  - `backend/src/dental/dental.service.ts`
  - `backend/src/dental/dental.controller.ts`
  - `backend/src/dental/dental.module.ts`
  - `frontend/src/app/dental/page.tsx`

#### Current Implementation Analysis
- FDI Adult Dentition: Supported for adult teeth 11-18, 21-28, 31-38, 41-48 (32 permanent teeth).
- 5-Surface Anatomical Lesion Mapping: Supports occlusal, mesial, distal, buccal, and lingual surface conditions.
- WHO DMFT Computation: Computes Decayed (CARIES), Missing (MISSING), and Filled (FILLED, CROWN) scores and assigns a clinical risk category (Low, Moderate, High, Very High).
- Dental Treatment Planning: Basic treatment planning with multi-currency pricing (USD and KHR at 4,100 KHR/USD).

#### Gaps and Deficiencies
1. Lack of Deciduous (Pediatric) Dentition: Primary teeth (FDI 51-55, 61-65, 71-75, 81-85) are completely unsupported. Pediatric patients cannot be charted.
2. WHO DMFS Index Missing: Only whole teeth (DMFT) are scored. Decayed, Missing, and Filled Surfaces (DMFS, evaluating up to 128-148 surfaces) is absent.
3. Periodontal Charting Interface Missing: The backend model contains pocketDepthsMm (6 sites) and bleedingOnProbing (6 sites), but the frontend lacks a dedicated 6-point perio-charting grid for probing depths (1-12 mm), gingival margin recession/hyperplasia, clinical attachment level (CAL), furcation involvement (Grades I-IV), and suppuration.
4. Transient Storage: All dental charts and treatment plans are stored in an in-memory Map.

---

### 2.2 Zero-Footprint WebGL PACS Workstation
- Inspected Files:
  - `backend/src/pacs/pacs.service.ts`
  - `backend/src/pacs/pacs.controller.ts`
  - `backend/src/pacs/pacs.module.ts`
  - `frontend/src/app/pacs/page.tsx`

#### Current Implementation Analysis
- Study metadata management with StudyInstanceUID, Modality, Body Part, and Window/Level presets.
- Formulas for Cardiothoracic Ratio (CTR) and Cobb Angle severity evaluation.
- Structured radiologist reporting interface with status workflows (UNREAD, IN_REVIEW, REPORTED, CRITICAL).

#### Gaps and Deficiencies
1. Simulated Image Rendering: The viewer uses an HTML img tag loading Unsplash JPEG stock photos. It does not parse or render real DICOM P10 files.
2. Pseudo Window Leveling: Window leveling (WL/WW) is simulated using CSS filter: contrast() brightness() on 8-bit JPEG images. It does not manipulate 16-bit raw pixel buffers, rescale slopes, rescale intercepts, or Hounsfield Units (HU).
3. No Canvas-Level Caliper Tool: Clinicians cannot draw measurement vectors on the image. They must manually measure outside and type numbers into input boxes.
4. Caliper Calibration Absent: Pixel Spacing tag (0028,0030) is not parsed, preventing physical millimeter measurement.
5. Simulated Multi-Slice Cine: Frame counter increments via setInterval, but the image never changes because multi-frame pixel data is not loaded.
6. Transient Storage: DICOM study metadata is stored in an in-memory Map.

---

### 2.3 Laboratory Information System (LIS)
- Inspected Files:
  - `backend/src/lis/lis.service.ts`
  - `backend/src/lis/lis.controller.ts`
  - `backend/src/lis/lis.module.ts`
  - `frontend/src/app/lab/page.tsx`

#### Current Implementation Analysis
- Specimen accessioning with 6 standard tube types (EDTA lavender, serum clot activator SST, sodium citrate light blue, heparin green, fluoride grey, sterile urine).
- Parsers for ASTM E1394 result frames (R| records) and HL7 v2 ORU^R01 observation segments (OBX| records).
- Panic alert threshold checking and longitudinal delta checking against previous patient results.

#### Gaps and Deficiencies
1. No Real Barcode Generation: The barcode is displayed as a monospace text string. No vector Code128, GS1-128, or DataMatrix barcode is generated for thermal tube label printing.
2. Simulated Analyzer Communication: Communication requires a user to copy and paste raw packets into a text box. No automated TCP/IP or MLLP socket listener exists to receive real-time transmissions from analyzers.
3. No Active Alert Broadcast: Panic alerts are flagged on the screen, but do not trigger automated Webhooks, Telegram bot alerts, SMS, or WebSocket notifications to attending clinicians.
4. Transient Historical Baseline: Baseline values for delta checking are stored in an in-memory Map, resetting on restart.

---

### 2.4 eClaim and MoH DHIS2 National Surveillance
- Inspected Files:
  - `backend/src/eclaim/eclaim.service.ts`
  - `backend/src/eclaim/eclaim.controller.ts`
  - `backend/src/eclaim/eclaim.module.ts`
  - `frontend/src/app/eclaim/page.tsx`

#### Current Implementation Analysis
- Generation of ANSI ASC X12 837P compatible XML claims.
- Generation of HL7 FHIR R4 Claim JSON payloads.
- Communicable disease surveillance tracking for 8 reportable conditions with DHIS2 DXF 2.0 XML and dataValueSets JSON export.
- SHA-256 cryptographic batch hash calculation and transaction reference assignment.

#### Gaps and Deficiencies
1. No Persistent Database Storage: Claims and surveillance records are stored in transient Map objects.
2. No Automated MoH DHIS2 API Dispatch: Exports are purely manual downloads. No background queue worker exists to sync data directly to the MoH DHIS2 endpoint (/api/dataValueSets) with retry mechanics.
3. Cambodia NSSF Tariffs Not Standardized: Claims do not conform to official Cambodia National Social Security Fund (NSSF) act codes, pre-authorization workflows, or official medical service tariff schedules.
4. No Public Key Cryptography: Payloads use SHA-256 hashing but lack RSA private key signing (PKCS#1 v1.5 or ECDSA) for verifiable authenticity.

---

## 3. Unified Multi-Tenant Prisma Database Schema Specification

To achieve 100% hospital-grade persistence, the following relational models must be integrated into `backend/prisma/schema.prisma`:

```prisma
// ==========================================
// 1. DENTAL ODONTOGRAM & PERIODONTAL MODELS
// ==========================================

enum ToothStatus {
  HEALTHY
  CARIES
  FILLED
  CROWN
  IMPLANT
  ROOT_CANAL
  MISSING
  FRACTURED
  IMPACTED
}

enum DentitionType {
  ADULT_PERMANENT
  DECIDUOUS_PRIMARY
  MIXED
}

model DentalChart {
  id                String            @id @default(uuid())
  tenantId          String
  patientId         String
  dentistId         String
  dentistName       String
  examinationDate   DateTime          @default(now())
  dentitionType     DentitionType     @default(ADULT_PERMANENT)
  numberingSystem   String            @default("FDI_TWO_DIGIT")
  plaqueScorePct    Float             @default(0.0)
  bleedingScorePct  Float             @default(0.0)
  dmftDecayed       Int               @default(0)
  dmftMissing       Int               @default(0)
  dmftFilled        Int               @default(0)
  dmftTotal         Int               @default(0)
  dmftRiskCategory  String            @default("LOW")
  generalNotes      String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  tenant            Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient           Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)
  teeth             DentalToothRecord[]
  treatmentPlans    DentalTreatmentPlan[]

  @@index([tenantId, patientId])
}

model DentalToothRecord {
  id                String       @id @default(uuid())
  chartId           String
  toothNumber       Int
  status            ToothStatus  @default(HEALTHY)
  surfaceMesial     Boolean      @default(false)
  surfaceDistal     Boolean      @default(false)
  surfaceOcclusal   Boolean      @default(false)
  surfaceBuccal     Boolean      @default(false)
  surfaceLingual    Boolean      @default(false)
  mobilityScore     Int          @default(0)
  notes             String?
  
  // 6-Point Periodontal Measurements (in millimeters: 1-12mm)
  pdMesioBuccal     Int          @default(2)
  pdMidBuccal       Int          @default(2)
  pdDistoBuccal     Int          @default(2)
  pdMesioLingual    Int          @default(2)
  pdMidLingual      Int          @default(2)
  pdDistoLingual    Int          @default(2)
  
  // Bleeding on Probing (BOP) across 6 sites
  bopMesioBuccal    Boolean      @default(false)
  bopMidBuccal      Boolean      @default(false)
  bopDistoBuccal    Boolean      @default(false)
  bopMesioLingual   Boolean      @default(false)
  bopMidLingual     Boolean      @default(false)
  bopDistoLingual   Boolean      @default(false)

  // Gingival Margin recession or hyperplasia (-5mm to +5mm)
  gmMesioBuccal     Int          @default(0)
  gmMidBuccal       Int          @default(0)
  gmDistoBuccal     Int          @default(0)
  gmMesioLingual    Int          @default(0)
  gmMidLingual      Int          @default(0)
  gmDistoLingual    Int          @default(0)

  furcationGrade    Int          @default(0)
  suppuration       Boolean      @default(false)

  chart             DentalChart  @relation(fields: [chartId], references: [id], onDelete: Cascade)

  @@unique([chartId, toothNumber])
  @@index([chartId])
}

model DentalTreatmentPlan {
  id            String                    @id @default(uuid())
  tenantId      String
  patientId     String
  chartId       String?
  dentistId     String
  dentistName   String
  title         String
  status        String                    @default("PROPOSED")
  totalFeeUsd   Decimal                   @db.Decimal(10, 2)
  totalFeeKhr   Decimal                   @db.Decimal(12, 2)
  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt

  chart         DentalChart?              @relation(fields: [chartId], references: [id])
  items         DentalTreatmentItem[]

  @@index([tenantId, patientId])
}

model DentalTreatmentItem {
  id            String              @id @default(uuid())
  planId        String
  toothNumber   Int?
  surface       String?
  procedureCode String
  procedureName String
  category      String
  feeUsd        Decimal             @db.Decimal(10, 2)
  feeKhr        Decimal             @db.Decimal(12, 2)
  status        String              @default("PLANNED")
  notes         String?
  completedAt   DateTime?

  plan          DentalTreatmentPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
}


// ==========================================
// 2. DICOM PACS & MEDICAL IMAGING MODELS
// ==========================================

enum PacsModality {
  DX
  CR
  US
  CT
  MR
  ES
  XA
  MG
}

enum PacsStudyStatus {
  UNREAD
  IN_REVIEW
  REPORTED
  CRITICAL
}

model DicomStudyRecord {
  id                   String           @id @default(uuid())
  tenantId             String
  studyInstanceUid     String           @unique
  patientId            String
  patientName          String
  patientGender        String
  patientAge           Int
  modality             PacsModality
  bodyPart             String
  studyDate            String
  studyTime            String
  studyDescription     String
  referringPhysician   String
  radiologist          String           @default("Pending Review")
  numberOfInstances    Int              @default(1)
  windowCenter         Float            @default(2048)
  windowWidth          Float            @default(4096)
  losslessEncryptedUri String
  thumbnailUri         String
  findings             String?
  impression           String?
  status               PacsStudyStatus  @default(UNREAD)
  cardiothoracicRatio  Float?
  cobbAngle            Float?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  tenant               Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient              Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)
  measurements         DicomMeasurementRecord[]
  instances            DicomInstanceRecord[]

  @@index([tenantId, patientId])
  @@index([tenantId, modality])
}

model DicomInstanceRecord {
  id                String           @id @default(uuid())
  studyId           String
  sopInstanceUid    String           @unique
  seriesInstanceUid String
  instanceNumber    Int              @default(1)
  rows              Int
  columns           Int
  pixelSpacingX     Float            @default(1.0)
  pixelSpacingY     Float            @default(1.0)
  rescaleSlope      Float            @default(1.0)
  rescaleIntercept  Float            @default(0.0)
  storageUri        String
  fileSizeBytes     BigInt
  createdAt         DateTime         @default(now())

  study             DicomStudyRecord @relation(fields: [studyId], references: [id], onDelete: Cascade)

  @@index([studyId])
}

model DicomMeasurementRecord {
  id           String           @id @default(uuid())
  studyId      String
  type         String           // CALIPER, CTR, COBB_ANGLE, ROI
  value        Float
  unit         String
  label        String
  rawPoints    Json?            // Coordinates array [{x, y}]
  calculatedAt DateTime         @default(now())

  study        DicomStudyRecord @relation(fields: [studyId], references: [id], onDelete: Cascade)

  @@index([studyId])
}


// ==========================================
// 3. LABORATORY INFORMATION SYSTEM (LIS) MODELS
// ==========================================

enum SpecimenTubeType {
  EDTA_LAVENDER
  SERUM_RED_GOLD
  SODIUM_CITRATE_BLUE
  HEPARIN_GREEN
  FLUORIDE_GREY
  URINE_STERILE
}

enum LabOrderStatus {
  ORDERED
  COLLECTED
  IN_ANALYZER
  PENDING_VERIFICATION
  VERIFIED
  CANCELLED
}

enum AnalyteFlag {
  NORMAL
  LOW
  HIGH
  PANIC_CRITICAL
  DELTA_ALERT
}

model LabOrderRecord {
  id                   String           @id @default(uuid())
  tenantId             String
  orderNumber          String           @unique
  patientId            String
  patientName          String
  panelCode            String
  panelNameEn          String
  panelNameKh          String
  accessionNumber      String           @unique
  barcode              String           @unique
  tubeType             SpecimenTubeType
  tubeNameKh           String
  tubeNameEn           String
  phlebotomist         String
  collectedAt          DateTime         @default(now())
  analyzerModel        String?
  analyzerProtocol     String           @default("MANUAL_ENTRY")
  status               LabOrderStatus   @default(COLLECTED)
  hasPanicValue        Boolean          @default(false)
  hasDeltaAlert        Boolean          @default(false)
  orderingDoctor       String
  verifyingPathologist String?
  verifiedAt           DateTime?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  tenant               Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient              Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)
  results              LabResultRecord[]
  alerts               LabPanicAlertRecord[]

  @@index([tenantId, patientId])
  @@index([tenantId, status])
}

model LabResultRecord {
  id            String         @id @default(uuid())
  orderId       String
  code          String
  nameEn        String
  nameKh        String
  value         Float
  unit          String
  minNormal     Float
  maxNormal     Float
  flag          AnalyteFlag    @default(NORMAL)
  deltaPercent  Float?
  previousValue Float?
  panicAlert    Boolean        @default(false)
  createdAt     DateTime       @default(now())

  order         LabOrderRecord @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([code])
}

model LabPanicAlertRecord {
  id              String         @id @default(uuid())
  orderId         String
  analyteCode     String
  measuredValue   Float
  unit            String
  thresholdValue  Float
  severity        String         @default("CRITICAL")
  notifiedDoctor  String
  channel         String         // SMS, TELEGRAM, WEBSOCKET
  dispatchedAt    DateTime       @default(now())
  acknowledgedAt  DateTime?

  order           LabOrderRecord @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}


// ==========================================
// 4. ECLAIM & MOH DHIS2 SURVEILLANCE MODELS
// ==========================================

enum InsurerCode {
  FORTE
  PRUDENTIAL
  AIA
  MANULIFE
  INFINITY
  NSSF
}

enum ClaimStatus {
  DRAFT
  VALIDATED
  SUBMITTED
  PRE_APPROVED
  SETTLED
  REJECTED
}

model InsuranceClaimRecord {
  id                   String           @id @default(uuid())
  tenantId             String
  claimNumber          String           @unique
  insurer              InsurerCode
  policyNumber         String
  memberId             String
  patientId            String
  patientName          String
  patientDob           DateTime
  patientGender        String
  providerId           String
  providerName         String
  providerLicense      String
  preAuthCode          String?
  claimType            String           @default("OUTPATIENT")
  totalBilledUsd       Decimal          @db.Decimal(10, 2)
  totalClaimedUsd      Decimal          @db.Decimal(10, 2)
  patientShareUsd      Decimal          @db.Decimal(10, 2)
  status               ClaimStatus      @default(DRAFT)
  batchHash            String?
  transactionReference String?
  xmlPayload           String?          @db.Text
  fhirJsonPayload      Json?
  submittedAt          DateTime?
  adjudicatedAt        DateTime?
  adjudicationNotes    String?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  tenant               Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient              Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)
  items                ClaimLineItemRecord[]
  diagnoses            ClaimDiagnosisRecord[]

  @@index([tenantId, patientId])
  @@index([tenantId, insurer])
}

model ClaimLineItemRecord {
  id               String               @id @default(uuid())
  claimId          String
  serviceCode      String
  description      String
  quantity         Int                  @default(1)
  unitPriceUsd     Decimal              @db.Decimal(10, 2)
  totalPriceUsd    Decimal              @db.Decimal(10, 2)
  coveredAmountUsd Decimal              @db.Decimal(10, 2)
  coPayUsd         Decimal              @db.Decimal(10, 2)
  deductibleUsd    Decimal              @db.Decimal(10, 2)

  claim            InsuranceClaimRecord @relation(fields: [claimId], references: [id], onDelete: Cascade)

  @@index([claimId])
}

model ClaimDiagnosisRecord {
  id          String               @id @default(uuid())
  claimId     String
  code        String               // ICD-10 Code
  name        String
  isPrimary   Boolean              @default(false)

  claim       InsuranceClaimRecord @relation(fields: [claimId], references: [id], onDelete: Cascade)

  @@index([claimId])
}

model SurveillanceCaseRecord {
  id                     String   @id @default(uuid())
  tenantId               String
  diseaseCode            String   // ICD-10 (e.g., A90 Dengue)
  diseaseName            String
  caseType               String   // SUSPECTED, PROBABLE, CONFIRMED
  laboratoryConfirmation String   // PCR, RDT, SEROLOGY, CULTURE, CLINICAL_ONLY
  patientAge             Int
  patientGender          String
  provinceCode           String   @default("KH-12")
  districtCode           String
  healthFacilityCode     String
  encounterDate          DateTime
  reportingPeriod        String   // e.g. 2026-W42
  outcome                String   @default("RECOVERED")
  syncedToDhis2          Boolean  @default(false)
  dhis2SyncTimestamp     DateTime?
  createdAt              DateTime @default(now())

  tenant                 Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, reportingPeriod])
  @@index([tenantId, diseaseCode])
}
```

---

## 4. Technical Specifications for Hospital-Grade Implementation

### 4.1 Dental Odontogram and Periodontal Engine
- Reference Benchmarks: Open Dental (ADHA / WHO standard), GNU Health Dental Module.
- FDI Charting Enhancements:
  - Add primary teeth switch (Quadrant 5: 55-51, Quadrant 6: 61-65, Quadrant 7: 75-71, Quadrant 8: 81-85).
  - Mixed dentition mode displaying both retained deciduous teeth and erupted permanent teeth.
  - Implement full WHO DMFS index counting surface-level restorations and lesions across 128-148 surfaces.
- Interactive Periodontal Chart Component:
  - 6-point probing depth grid per tooth (MB, B, DB, ML, L, DL).
  - Rapid keyboard navigation: numeric keypad input (1-9, and 10-12 via shift key), auto-advancing to next site.
  - Color thresholds: 1-3 mm green (healthy sulcus), 4-5 mm amber (moderate pocket), 6 mm or higher red (deep periodontitis pocket).
  - Gingival margin recession/hyperplasia and automatic computation of Clinical Attachment Level: CAL = PD + GM.
  - Bleeding on probing (BOP) spacebar toggle with red droplet indicator.
  - Mobility Grade (0 to 3) and Furcation Involvement (Grade I, II, III, IV).

### 4.2 Zero-Footprint WebGL PACS Workstation
- Reference Benchmarks: CornerstoneJS (OHIF Viewer 3.x), Orthanc DICOM Web Server, WebGL 2.0 Fragment Shaders.
- WebGL DICOM Render Pipeline:
  - Parse DICOM Part 10 binary files using client-side WebAssembly parser or dicom-parser.
  - Upload 16-bit signed/unsigned grayscale pixel buffer directly to a WebGL 2.0 texture format (gl.R16UI or gl.R16I).
  - Execute GPU Fragment Shader:
    - Step 1: Compute Hounsfield Units: HU = float(pixelVal) * u_rescaleSlope + u_rescaleIntercept
    - Step 2: Apply Window Center and Window Width transfer function:
      lower = u_windowCenter - 0.5 - (u_windowWidth - 1.0) / 2.0;
      upper = u_windowCenter - 0.5 + (u_windowWidth - 1.0) / 2.0;
      gray = clamp((HU - lower) / (upper - lower), 0.0, 1.0);
    - Step 3: Inversion and LUT color mapping (Hot Iron, Bone, Rainbow).
- Hardware-Accelerated Interactive Tools:
  - Window/Level drag: Left-click and drag across viewport (horizontal delta modifies Window Width, vertical delta modifies Window Center) rendering smoothly at 60 FPS.
  - Vector Caliper Tool: Click-and-drag vector line on canvas. Read DICOM Tag (0028,0030) Pixel Spacing (row spacing, column spacing in millimeters). Calculate true physical distance:
    Distance_mm = sqrt((dx * colSpacing)^2 + (dy * rowSpacing)^2)
  - True Cardiothoracic Ratio (CTR) Tool: Clinician draws cardiac transverse diameter and thoracic transverse diameter directly on PA chest radiograph. System automatically computes CTR = Cardiac / Thoracic and displays an on-screen warning if CTR exceeds 0.50.
  - Spinal Cobb Angle Tool: Two-line intersection tool on vertebral endplates computing true scoliosis angle in degrees.
  - Volumetric Multi-Slice Scrolling: Wheel-scroll event listener loading adjacent slices with promise pre-caching.

### 4.3 Hospital Laboratory LIS and Analyzer Interfacing
- Reference Benchmarks: OpenELIS Global, Senaite LIMS, CLSI AUTO02-A barcode standards, ASTM E1381/E1394, HL7 v2.5 MLLP.
- Barcode Specimen Engine:
  - Implement client-side and server-side Code128 (ISO/IEC 15417) and DataMatrix (ISO/IEC 16022) SVG rendering.
  - Thermal label layout (50 x 25 mm): Patient Full Name, Patient MRN, Accession Number, Collection Date/Time, Phlebotomist Name, Specimen Tube Color Banner, and high-contrast Code128 barcode.
- Real-Time Analyzer Socket Daemon:
  - Node.js TCP socket service listening on internal clinic network port (e.g., 5100).
  - ASTM E1381 framing state machine:
    1. Analyzer sends ENQ (0x05)
    2. Server replies ACK (0x06)
    3. Analyzer transmits data frame: STX + FrameNumber + Data + ETX/ETB + Checksum + CR + LF
    4. Server verifies modulo-256 checksum and replies ACK (0x06)
    5. Analyzer finishes with EOT (0x04)
  - HL7 v2 MLLP framing wrapper: 0x0B (VT) + HL7 Message + 0x1C (FS) + 0x0D (CR).
- Instant Panic Alert Notification Engine:
  - When an analyte is ingested that exceeds panic thresholds (e.g., Potassium below 2.8 or above 6.5 mmol/L; Glucose below 45 or above 400 mg/dL; Platelets below 25 x 10^9/L):
    1. Mark order with PANIC_CRITICAL flag.
    2. Create an entry in LabPanicAlertRecord.
    3. Trigger immediate WebSocket event to clinic dashboard.
    4. Dispatch SMS or Telegram bot alert directly to the ordering physician.
- Longitudinal Delta Check Engine:
  - Query database for the patient's previous verified analyte results.
  - Evaluate percentage delta = ((current - previous) / previous) * 100.
  - Flag DELTA_ALERT if shift exceeds physiological variation limit (e.g., > 25% for Hemoglobin, > 50% for Creatinine).

### 4.4 eClaim Clearinghouse and MoH DHIS2 National Surveillance
- Reference Benchmarks: DHIS2 Web API v2.38+, HL7 FHIR R4 Financial Module, Cambodia MoH Communicable Disease Control (CDC) guidelines, Cambodia National Social Security Fund (NSSF) health insurance claim specifications.
- Ministry of Health DHIS2 Automated Reporting:
  - Automated weekly cron job running every Monday at 06:00.
  - Aggregates all confirmed and suspected surveillance cases for the previous epidemiological week (e.g., 2026-W42).
  - Formats DHIS2 JSON dataValueSets payload containing DataElement IDs, Period, OrgUnit ID, and counts.
  - Dispatches POST request to MoH DHIS2 endpoint:
    `POST https://dhis2.moh.gov.kh/api/dataValueSets`
  - Records response status, importCount (imported, updated, ignored), and logs audit record.
- Cambodia NSSF Claim Formatter and Tariffs:
  - Implement official NSSF Cambodia tariff schedules and medical act codes.
  - Generate NSSF XML claim compliant with National Social Security Fund standards.
  - Cryptographic digital signature: SHA-256 with RSA-2048 private key signing, embedding clinic MoH health facility license certificate.
- Full HL7 FHIR R4 Bundle Support:
  - Bundle resource containing Claim, Patient, Coverage, Practitioner, Organization, Condition, and Encounter resources.

---

## 5. Prioritized, Phased Hospital-Grade Upgrade Roadmap

### Phase 1: Database Persistence and Multi-Tenant Isolation
- Target: 100% data persistence across all 4 specialty modules.
- Implementation Steps:
  1. Add Dental, PACS, LIS, and eClaim models to `backend/prisma/schema.prisma`.
  2. Execute `npx prisma db push` and `npx prisma generate`.
  3. Refactor `dental.service.ts`, `pacs.service.ts`, `lis.service.ts`, and `eclaim.service.ts` to replace in-memory Map storage with PrismaService database queries.
  4. Ensure strict tenantId isolation across all CRUD queries.

### Phase 2: Diagnostic Instrumentation and Interactive Engines
- Target: Clinical-grade interactive UI tools and hardware-calibrated precision.
- Implementation Steps:
  1. Dental: Build interactive 6-point Periodontal Charting grid with rapid keyboard entry and deciduous dentition switcher.
  2. PACS: Implement client-side WebGL 2.0 shader canvas with 16-bit DICOM pixel upload, real-time WL/WW GPU calculation, vector caliper tool with Pixel Spacing millimeter calibration, and multi-slice wheel scrolling.
  3. LIS: Integrate Code128 vector barcode renderer and printable 50x25mm specimen tube label generator.
  4. eClaim: Implement NSSF official tariff master table and RSA cryptographic claim payload signing.

### Phase 3: External Interfacing, Sockets, and Telemetry
- Target: Real-time analyzer integration and national health reporting.
- Implementation Steps:
  1. LIS: Deploy Node.js TCP/MLLP socket listener daemon for ASTM E1381/E1394 and HL7 v2 automated analyzer connectivity.
  2. LIS: Implement WebSocket and Telegram bot broadcast for instant panic alert delivery to on-call physicians.
  3. eClaim: Implement automated weekly cron job dispatching DHIS2 dataValueSets to MoH Cambodia endpoint with retry mechanics.

### Phase 4: Quality Control, Auditing, and Clinical Compliance
- Target: Hospital accreditation and international interoperability standards.
- Implementation Steps:
  1. LIS: Implement Levey-Jennings QC charts with Westgard multirule evaluation (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x).
  2. PACS: Connect to cloud object storage (S3 / MinIO) with WADO-RS DICOM retrieval service.
  3. Dental: Add WHO DMFS index and exportable periodontal status PDF report.
  4. Global: Multi-language compliance (English and Khmer) ensuring zero parentheses in Khmer text and zero emojis across the entire platform.
