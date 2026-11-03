# Cambodia MoH DDF Statutory Controlled Substances and Narcotic Register Specification
Document Identifier: MOH-DDF-NARCOTIC-SPEC-2026-V1
Authority: Cambodia Ministry of Health Department of Drugs and Food - នាយកដ្ឋានឱសថ ចំណីអាហារ បរិក្ខារពេទ្យ និងគ្រឿងសំអាង នៃក្រសួងសុខាភិបាល
Classification: Pure Enterprise Standard Medical Specification

---

## 1. Regulatory Framework and Legal Compliance

### 1.1 Statutory Mandates
The dispensing, storage, administration, and wastage disposal of controlled narcotic and psychotropic medicines in Cambodia are governed by strict statutory instruments:
1. Law on the Control of Drugs of the Kingdom of Cambodia - ច្បាប់ស្តីពីការត្រួតពិនិត្យគ្រឿងញៀន
2. Ministry of Health Prakas on the Management of Narcotic Drugs, Psychotropic Substances and Precursors in Health Facilities - ប្រកាសស្តីពីការគ្រប់គ្រងឱសថញៀន ឱសថផ្លូវចិត្ត និងសារធាតុដើម ក្នុងគ្រឹះស្ថានសុខាភិបាល
3. Department of Drugs and Food - DDF Statutory Controlled Drug Register Directives - សៀវភៅបញ្ជីតាមដានសារធាតុញៀន និងឱសថគ្រោះថ្នាក់
4. United Nations Single Convention on Narcotic Drugs of 1961 and Convention on Psychotropic Substances of 1971

### 1.2 Controlled Substances Schedules

Controlled pharmaceutical preparations are stratified into strict regulatory schedules requiring statutory tracking:

| Substance Generic Name | Brand / Trade Name | Chemical Classification | MoH DDF Schedule | Standard Unit Formulation | Primary Clinical Indication |
|---|---|---|---|---|---|
| Morphine Hydrochloride / Sulfate | Morphine Aguettant | Opioid Agonist | Schedule II Narcotic | 10mg/1ml Ampoule, 10mg Tablet | Severe acute post-operative pain, terminal oncology analgesia |
| Pethidine Hydrochloride | Dolantine, Meperidine | Synthetic Opioid | Schedule II Narcotic | 50mg/1ml, 100mg/2ml Ampoule | Obstetric analgesia, intraoperative visceral pain |
| Fentanyl Citrate | Sublimaze, Durogesic | Potent Synthetic Opioid | Schedule II Narcotic | 50mcg/1ml, 100mcg/2ml Ampoule, Transdermal Patch | Balanced general anesthesia, critical care sedation |
| Ketamine Hydrochloride | Ketalar | NMDA Receptor Antagonist | Schedule III Psychotropic | 500mg/10ml (50mg/ml) Vial | Procedural sedation, emergency trauma dissociation, induction |
| Diazepam | Valium | Benzodiazepine | Schedule III Psychotropic | 10mg/2ml Ampoule, 5mg Tablet | Status epilepticus, severe alcohol withdrawal, acute spasm |
| Midazolam Hydrochloride | Dormicum, Versed | Short-Acting Benzodiazepine | Schedule III Psychotropic | 5mg/5ml, 5mg/1ml Ampoule | Procedural sedation, ICU mechanical ventilation synchronization |
| Tramadol Hydrochloride | Ultram, Topalgic | Atypical Opioid / SNRI | Schedule III Controlled | 100mg/2ml Ampoule, 50mg Capsule | Moderate to severe acute trauma and surgical pain |

### 1.3 Physical Security and Double-Locked Safe Compliance
Health facilities must maintain a physical storage infrastructure that fulfills MoH DDF double-lock requirements:
1. Outer Barrier: A heavy steel narcotic safe permanently anchored with grade-8 bolts into the concrete floor or reinforced structural wall of the medication room.
2. Inner Barrier: An independently locked inner steel compartment (box-in-a-box) housing high-potency Schedule II narcotics (Morphine, Pethidine, Fentanyl).
3. Dual-Custody Key Protocol:
   - Outer safe lock key or electronic credential is held exclusively by the Ward Charge Nurse on duty.
   - Inner safe lock key or secondary electronic credential is held by the Attending Medical Officer or Hospital Chief Pharmacist.
   - Opening the Schedule II compartment requires simultaneous presence and dual credential validation. Neither clinician alone possesses the cryptographic or mechanical capability to access the stock.
4. Continuous Access Auditing: Electronic biometric access logs, mechanical key custody logs, and round-the-clock CCTV surveillance directed at the safe entrance with 90-day video retention.

---

## 2. Clinical Double-Signoff Witness Verification Protocol

### 2.1 The Clinical Dual-Verification Rule
Every event altering the inventory of a controlled substance (Receipt, Shift Handover, Patient Administration, Wastage Disposal, Return, or Discrepancy Correction) mandates simultaneous dual-clinician electronic authentication. Single-person execution is strictly blocked by the system architecture.

```
+---------------------------------------------------------------------------------------------------+
|                        CLINICAL DOUBLE-SIGNOFF DUAL AUTHENTICATION WORKFLOW                       |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ PRIMARY CLINICIAN: Registered Nurse (RN) ]       [ WITNESS CLINICIAN: RN / Doctor / Pharmacist ]|
|                                                                                                   |
|       1. Authenticates Identity                             2. Inspects Ampoule & Physical Dose   |
|          - Staff ID Card / NFC Badge Scan                      - Confirms Patient Name & MRN      |
|          - Biometric / High-Entropy PIN                        - Verifies Doctor Order & Dose     |
|                                                                - Reads Manufacturer Lot & Serial  |
|                                                                                                   |
|       3. Selects Ampoule from Safe Ledger                   4. Authenticates Witness Identity     |
|          - Confirms Vial Serial Number                         - Secondary Staff ID Card Scan     |
|          - Inputs Intended Dose (e.g., 4mg)                    - Biometric / Witness Security PIN |
|          - Declares Wastage (e.g., 6mg)                        - Verifies License Number Validity |
|                                                                                                   |
|                                           |                                                       |
|                                           v                                                       |
|                     +-------------------------------------------+                                 |
|                     | CRYPTOGRAPHIC DUAL-SIGNATURE ENGINE       |                                 |
|                     | - Computes SHA-256 Non-Repudiation Hash   |                                 |
|                     | - Writes Immutable Ledger Entry to DB     |                                 |
|                     | - Decrements Safe Stock Count             |                                 |
|                     +-------------------------------------------+                                 |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

### 2.2 Eligible Witness Matrix
The software enforces statutory role-based matrix constraints regarding who is qualified to act as a witness:

| Primary Initiating Actor | Eligible Witness Roles | Ineligible Witness Roles |
|---|---|---|
| Staff Registered Nurse (RN) | Senior RN, Ward Charge Nurse, Attending Physician, Anesthesiologist, Clinical Pharmacist | Nursing Aide, Student Nurse, Ward Clerk, Phlebotomist, Medical Orderly |
| Ward Charge Nurse | Peer Charge Nurse, Attending Physician, Hospital Pharmacist | General Medical Students, Administrative Staff |
| Medical Officer / Surgeon | Operating Room Scrub Nurse, Anesthesiologist, Ward Pharmacist | Unlicensed Intern, Medical Representative |
| Hospital Pharmacist | Ward Charge Nurse, Senior Pharmacist, Medical Director | Pharmacy Cashier, Stock Logistics Handler |

### 2.3 Cryptographic Dual Non-Repudiation Signature
Each double-signoff event generates a tamper-evident SHA-256 cryptographic proof string:

$$\text{ProofHash} = \text{SHA256}\Big(\text{TenantID} \parallel \text{Timestamp} \parallel \text{SubstanceCode} \parallel \text{VialSerial} \parallel \text{DoseAdmin} \parallel \text{DoseWaste} \parallel \text{PrimaryActorUID} \parallel \text{WitnessActorUID} \parallel \text{PrevLedgerHash}\Big)$$

This creates an unbroken cryptographic Merkle-chain across the perpetual inventory ledger. Any retrospective alteration of records triggers immediate cryptographic validation failure across the audit trail.

---

## 3. Ampoule Serialization and Residual Wastage Volume Logging

### 3.1 Unit-Dose Serial Tracking
Controlled substances are tracked at the individual glass ampoule or rubber-stoppered vial level, not solely by batch quantity.
1. Batch / Lot Number - លេខឡូត៍ផលិតកម្ម: Assigned by pharmaceutical manufacturer.
2. Unit Serial Number - លេខស៊េរីអំពូល: Unique GS1 DataMatrix or 2D Barcode printed on each individual ampoule or affixed by the central hospital pharmacy upon accessioning into the main vault.
3. Expiration Tracking - កាលបរិច្ឆេទផុតកំណត់: System automatically locks dispensing of any ampoule within 30 days of statutory expiration, requiring prompt return to central pharmacy.

### 3.2 Clinical Splitting and Wastage Destruction Protocol
In clinical practice, prescribed doses frequently represent a fraction of the manufactured ampoule content:
- Clinical Example: Patient in acute post-operative recovery has an order for Morphine Sulfate 4mg IV push. The available safe stock contains only Morphine Sulfate 10mg/1ml glass ampoules.
- Administered Quantity: 4mg (0.4ml).
- Residual Wastage Quantity: 6mg (0.6ml).
- Statutory Mandate: The unused 6mg must be physically destroyed immediately in the active presence of the witness clinician before leaving the medication preparation area. Saving residual narcotic for another patient or later time is strictly illegal under Cambodia drug laws.

### 3.3 MoH Approved Wastage Destruction Methods
The witness clinician must physically observe the destruction and verify the disposal method:
1. `SLUICE_SINK_FLUSH_RUNNING_WATER`: Liquid residual squirted directly into the clinical utility room sluice or medication sink drain under a continuous stream of tap water for at least 30 seconds to prevent environmental concentration or retrospective salvage.
2. `CHEMICAL_DENATURATION_ABSORBENT`: Expelled into a specialized waste container containing chemical denaturing gel or activated carbon matrix that renders the opioid irreversibly unrecoverable.
3. `SHARPS_BIOHAZARD_INCINERATION`: Residual liquid expelled into an absorbent pad inside a puncture-proof biohazard sharps container destined for high-temperature hospital medical incineration.

---

## 4. Perpetual Shift Handover and Discrepancy Management

### 4.1 Nursing Shift Handover Protocol
At every nursing shift turnover (Morning Shift 07:00 to 14:00, Afternoon Shift 14:00 to 21:00, Night Shift 21:00 to 07:00), the outgoing charge nurse and incoming charge nurse must conduct a mandatory physical joint count:
1. Safe Unlocking: Both charge nurses enter credentials to access the safe.
2. Physical Verification: Every ampoule of Schedule II and Schedule III controlled medicine is hand-counted together and checked against the electronic ledger balance.
3. Serial Match: Unit serials are scanned or spot-checked for seal integrity.
4. Electronic Signoff: Both nurses sign the electronic Shift Handover Register.
5. Shift Lockout: If the count is completed without discrepancy, the safe lock shifts to the incoming charge nurse. If a count discrepancy is detected, the safe enters an immediate lockdown state.

### 4.2 Discrepancy Escalation State Machine
When a physical count does not match the electronic perpetual ledger:
1. `COUNT_MISMATCH_DETECTED`: System flags an active discrepancy alert.
2. `LOCKDOWN_ACTIVE`: Dispensing from the safe is blocked until emergency override by the Hospital Chief Pharmacist or Medical Director.
3. `RECONCILIATION_ATTEMPT`: Outgoing and incoming charge nurses review all administrations, patient charts, and wastage records of the preceding 8 hours.
4. `FORMAL_INCIDENT_REPORT`: If unresolved within 2 hours, the Chief Pharmacist must file an official Notification of Controlled Substance Discrepancy with the Ministry of Health DDF.

---

## 5. MoH Monthly Statutory Reconciliation Audit Register

### 5.1 Statutory Invariant Mathematical Balancing Equation
On the final calendar day of each month at 23:59:59, the hospital pharmacy system computes the statutory reconciliation balance for every controlled SKU in every department.

For every controlled substance $k$:

$$\text{TheoreticalClosingBalance}_k = \text{OpeningBalance}_k + \text{TotalReceived}_k - \text{TotalAdministered}_k - \text{TotalWasted}_k - \text{TotalReturned}_k$$

$$\text{DiscrepancyDelta}_k = \text{PhysicalCount}_k - \text{TheoreticalClosingBalance}_k$$

Statutory Condition:
$$\text{DiscrepancyDelta}_k \equiv 0$$

If $\text{DiscrepancyDelta}_k \neq 0$, the facility is in statutory violation unless accompanied by an authorized MoH DDF Spill / Breakage Incident Police or Pharmacovigilance Report.

### 5.2 MoH DDF Monthly XML Export Specification

```xml
<?xml version="1.0" encoding="UTF-8"?>
<MoHControlledDrugReconciliation 
    xmlns="http://moh.gov.kh/ddf/narcotics/v1" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    statutoryStandard="MOH_DDF_PRAKAS_NARCOTIC_REG_2026">
  
  <FacilityHeader>
    <HealthFacilityCode>HF-MOH-8819</HealthFacilityCode>
    <FacilityNameKh>មន្ទីរសម្រាកព្យាបាល ព្រះមុនីវង្ស</FacilityNameKh>
    <FacilityNameEn>Preah Monivong Family Clinic</FacilityNameEn>
    <MoHLicenseNumber>MOH-CLINIC-7721</MoHLicenseNumber>
    <DepartmentWard>CENTRAL_PHARMACY_AND_SURGICAL_WARD</DepartmentWard>
    <ReportingPeriodYear>2026</ReportingPeriodYear>
    <ReportingPeriodMonth>10</ReportingPeriodMonth>
    <SubmissionTimestamp>2026-10-31T23:59:59Z</SubmissionTimestamp>
    <ResponsibleChiefPharmacist>
      <FullNameKh>ឱសថការី សុខ ពិសិដ្ឋ</FullNameKh>
      <FullNameEn>Pharm. Sok Piseth</FullNameEn>
      <PharmacistLicenseNumber>PHARM-LIC-KH-2018-0492</PharmacistLicenseNumber>
    </ResponsibleChiefPharmacist>
    <ResponsibleMedicalDirector>
      <FullNameKh>វេជ្ជបណ្ឌិត ចាន់ វណ្ណា</FullNameKh>
      <FullNameEn>Dr. Chan Vanna</FullNameEn>
      <DoctorLicenseNumber>DOC-LIC-KH-2012-1108</DoctorLicenseNumber>
    </ResponsibleMedicalDirector>
  </FacilityHeader>

  <DrugReconciliationSummary totalSubstanceSKUs="7">
    <!-- Item 1: Morphine Sulfate 10mg/1ml Ampoules -->
    <ReconciliationItem itemIndex="1">
      <SubstanceCode>MOH-NAR-001</SubstanceCode>
      <GenericName>Morphine Sulfate</GenericName>
      <KhmerDrugName>ម៉ូហ្វីន ស៊ុលហ្វាត : Morphine Sulfate</KhmerDrugName>
      <Schedule>SCHEDULE_II_NARCOTIC</Schedule>
      <DosageForm>10mg/1ml Injectable Ampoule</DosageForm>
      
      <Balances unit="AMPOULE">
        <OpeningBalance>25</OpeningBalance>
        <QuantityReceivedSupplier>50</QuantityReceivedSupplier>
        <QuantityAdministeredPatients>42</QuantityAdministeredPatients>
        <QuantityWastedDestroyed>0</QuantityWastedDestroyed>
        <QuantityReturnedExpired>0</QuantityReturnedExpired>
        <TheoreticalClosingBalance>33</TheoreticalClosingBalance>
        <PhysicalClosingCount>33</PhysicalClosingCount>
        <DiscrepancyQuantity>0</DiscrepancyQuantity>
      </Balances>

      <WastageVolumeAudit>
        <TotalAmpoulesOpenedForFractionalDosing>12</TotalAmpoulesOpenedForFractionalDosing>
        <TotalMilligramsPrescribedAdministered>58.0</TotalMilligramsPrescribedAdministered>
        <TotalMilligramsWitnessedDestroyed>62.0</TotalMilligramsWitnessedDestroyed>
        <PrimaryDestructionMethod>SLUICE_SINK_FLUSH_RUNNING_WATER</PrimaryDestructionMethod>
      </WastageVolumeAudit>

      <SupplierInvoicesCount>1</SupplierInvoicesCount>
      <PrescriptionCount>38</PrescriptionCount>
      <ComplianceStatus>PERFECTLY_RECONCILED</ComplianceStatus>
    </ReconciliationItem>

    <!-- Item 2: Fentanyl Citrate 100mcg/2ml Ampoules -->
    <ReconciliationItem itemIndex="2">
      <SubstanceCode>MOH-NAR-003</SubstanceCode>
      <GenericName>Fentanyl Citrate</GenericName>
      <KhmerDrugName>ហ្វង់តានីល ស៊ីត្រាត : Fentanyl Citrate</KhmerDrugName>
      <Schedule>SCHEDULE_II_NARCOTIC</Schedule>
      <DosageForm>100mcg/2ml Injectable Ampoule</DosageForm>
      
      <Balances unit="AMPOULE">
        <OpeningBalance>15</OpeningBalance>
        <QuantityReceivedSupplier>30</QuantityReceivedSupplier>
        <QuantityAdministeredPatients>28</QuantityAdministeredPatients>
        <QuantityWastedDestroyed>0</QuantityWastedDestroyed>
        <QuantityReturnedExpired>0</QuantityReturnedExpired>
        <TheoreticalClosingBalance>17</TheoreticalClosingBalance>
        <PhysicalClosingCount>17</PhysicalClosingCount>
        <DiscrepancyQuantity>0</DiscrepancyQuantity>
      </Balances>

      <WastageVolumeAudit>
        <TotalAmpoulesOpenedForFractionalDosing>8</TotalAmpoulesOpenedForFractionalDosing>
        <TotalMilligramsPrescribedAdministered>0.55</TotalMilligramsPrescribedAdministered>
        <TotalMilligramsWitnessedDestroyed>0.25</TotalMilligramsWitnessedDestroyed>
        <PrimaryDestructionMethod>CHEMICAL_DENATURATION_ABSORBENT</PrimaryDestructionMethod>
      </WastageVolumeAudit>

      <SupplierInvoicesCount>1</SupplierInvoicesCount>
      <PrescriptionCount>28</PrescriptionCount>
      <ComplianceStatus>PERFECTLY_RECONCILED</ComplianceStatus>
    </ReconciliationItem>
  </DrugReconciliationSummary>

  <CertificationStatement>
    <DeclarationKh>យើងខ្ញុំសូមបញ្ជាក់ទទួលខុសត្រូវចំពោះមុខច្បាប់ថា ទិន្នន័យក្នុងសៀវភៅបញ្ជីតាមដានសារធាតុញៀន និងឱសថគ្រោះថ្នាក់ប្រចាំខែនេះ ពិតជាត្រឹមត្រូវស្របតាមស្តុកជាក់ស្តែងនិងវេជ្ជបញ្ជាពិតប្រាកដ</DeclarationKh>
    <DeclarationEn>We hereby solemnly certify under penalty of law that the controlled narcotic register data is accurate, concordant with physical inventory, and substantiated by licensed clinical prescriptions</DeclarationEn>
    <CryptographicRegisterHash>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</CryptographicRegisterHash>
  </CertificationStatement>
</MoHControlledDrugReconciliation>
```

---

## 6. Complete Prisma Database Persistence Schema

The following schema models are to be added into `backend/prisma/schema.prisma` to establish permanent relational database persistence for the statutory narcotic registry:

```prisma
// =========================================================================
// MOH DDF STATUTORY CONTROLLED SUBSTANCES & NARCOTIC REGISTER MODELS
// =========================================================================

enum ControlledSubstanceSchedule {
  SCHEDULE_II_NARCOTIC
  SCHEDULE_III_PSYCHOTROPIC
  SCHEDULE_IV_CONTROLLED
}

enum ControlledTransactionType {
  SUPPLIER_RECEIPT
  PATIENT_ADMINISTRATION
  RESIDUAL_WASTAGE_DESTRUCTION
  SHIFT_HANDOVER_VERIFICATION
  RETURN_TO_CENTRAL_PHARMACY
  EXPIRED_SEQUESTERED
  DISCREPANCY_ADJUSTMENT
}

enum WastageDestructionMethod {
  SLUICE_SINK_FLUSH_RUNNING_WATER
  CHEMICAL_DENATURATION_ABSORBENT
  SHARPS_BIOHAZARD_INCINERATION
}

enum DiscrepancyStatus {
  RESOLVED_DOCUMENTED
  UNDER_INVESTIGATION
  REPORTED_TO_MOH_DDF
}

model ControlledSubstanceMaster {
  id                    String                      @id @default(uuid())
  tenantId              String
  substanceCode         String                      @unique // e.g. MOH-NAR-001
  genericName           String                      // Morphine Sulfate
  khmerName             String                      // ម៉ូហ្វីន ស៊ុលហ្វាត
  brandName             String?
  schedule              ControlledSubstanceSchedule
  dosageForm            String                      // 10mg/1ml Ampoule
  strengthPerUnitMg     Float                       // 10.0
  unitOfMeasure         String                      // AMPOULE, VIAL, TABLET, PATCH
  totalCurrentStock     Int                         @default(0)
  reorderAlertThreshold Int                         @default(10)
  requiresInnerSafeLock Boolean                     @default(true)
  createdAt             DateTime                    @default(now())
  updatedAt             DateTime                    @updatedAt

  tenant                Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  units                 ControlledUnitInventory[]
  transactions          ControlledDrugTransaction[]
  reconciliations       MohReconciliationItem[]

  @@index([tenantId, schedule])
}

model ControlledSubstanceSafe {
  id                    String                      @id @default(uuid())
  tenantId              String
  safeIdentifier        String                      // SAFE-WARD-ICU-01
  departmentName        String                      // Intensive Care Unit
  locationDescription   String                      // Locked Clean Utility Room 204
  isDoubleLockCompliant Boolean                     @default(true)
  electronicLockId      String?
  lastCountAuditDate    DateTime?
  currentChargeNurseId  String?
  createdAt             DateTime                    @default(now())
  updatedAt             DateTime                    @updatedAt

  tenant                Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  inventoryUnits        ControlledUnitInventory[]
  handovers             ControlledShiftHandover[]
  discrepancies         ControlledDiscrepancy[]

  @@index([tenantId, safeIdentifier])
}

model ControlledUnitInventory {
  id                    String                      @id @default(uuid())
  substanceId           String
  safeId                String
  unitSerialBarcode     String                      @unique // Unique ampoule DataMatrix string
  manufacturerLotNumber String
  expirationDate        DateTime
  isSealedIntact        Boolean                     @default(true)
  status                String                      @default("IN_SAFE_STOCK") // IN_SAFE_STOCK, ADMINISTERED, WASTED, RETURNED
  acquiredAt            DateTime                    @default(now())
  invoiceReference      String?

  substance             ControlledSubstanceMaster   @relation(fields: [substanceId], references: [id], onDelete: Cascade)
  safe                  ControlledSubstanceSafe     @relation(fields: [safeId], references: [id], onDelete: Cascade)
  transactions          ControlledDrugTransaction[]
  wastageLog            ControlledWastageLog?

  @@index([substanceId, safeId])
  @@index([unitSerialBarcode])
}

model ControlledDrugTransaction {
  id                    String                      @id @default(uuid())
  tenantId              String
  unitInventoryId       String
  substanceId           String
  transactionType       ControlledTransactionType
  timestamp             DateTime                    @default(now())
  
  // Clinical Context
  patientId             String?
  patientName           String?
  visitId               String?
  prescriptionId        String?
  
  // Dosing Quantities
  dosePrescribedMg      Float?
  doseAdministeredMg    Float?
  doseWastedMg          Float?
  
  // Primary Administering Nurse
  primaryStaffId        String
  primaryStaffName      String
  primaryStaffLicense   String
  primarySignatureHash  String
  
  // Witnessing Licensed Clinician
  witnessStaffId        String
  witnessStaffName      String
  witnessStaffLicense   String
  witnessSignatureHash  String
  witnessRole           String                      // SENIOR_RN, DOCTOR, PHARMACIST

  // Cryptographic Audit Seal
  ledgerEntryHash       String                      @unique
  previousLedgerHash    String

  tenant                Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  substance             ControlledSubstanceMaster   @relation(fields: [substanceId], references: [id], onDelete: Cascade)
  unitInventory         ControlledUnitInventory     @relation(fields: [unitInventoryId], references: [id], onDelete: Cascade)
  wastageDetail         ControlledWastageLog?

  @@index([tenantId, timestamp])
  @@index([substanceId])
  @@index([patientId])
}

model ControlledWastageLog {
  id                    String                      @id @default(uuid())
  transactionId         String                      @unique
  unitInventoryId       String                      @unique
  wastedMilligrams      Float
  destructionMethod     WastageDestructionMethod
  destructionTimestamp  DateTime                    @default(now())
  clinicalReasonNote    String                      // e.g. 4mg ordered from 10mg ampoule; 6mg residue destroyed
  
  witnessConfirmed      Boolean                     @default(true)
  witnessStaffId        String
  witnessStaffName      String

  transaction           ControlledDrugTransaction   @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  unitInventory         ControlledUnitInventory     @relation(fields: [unitInventoryId], references: [id], onDelete: Cascade)
}

model ControlledShiftHandover {
  id                    String                      @id @default(uuid())
  safeId                String
  shiftIdentifier       String                      // MORNING_TO_AFTERNOON, AFTERNOON_TO_NIGHT, NIGHT_TO_MORNING
  handoverTimestamp     DateTime                    @default(now())
  
  outgoingNurseId       String
  outgoingNurseName     String
  outgoingNurseLicense  String
  
  incomingNurseId       String
  incomingNurseName     String
  incomingNurseLicense  String
  
  physicalCountMatches  Boolean                     @default(true)
  countedItemsJson      Json                        // Array of {substanceCode, expectedCount, physicalCount}
  notes                 String?

  safe                  ControlledSubstanceSafe     @relation(fields: [safeId], references: [id], onDelete: Cascade)

  @@index([safeId, handoverTimestamp])
}

model ControlledDiscrepancy {
  id                    String                      @id @default(uuid())
  safeId                String
  substanceCode         String
  expectedCount         Int
  physicalCount         Int
  discrepancyDelta      Int                         // Physical - Expected
  discoveredTimestamp   DateTime                    @default(now())
  discoveredByStaffId   String
  status                DiscrepancyStatus           @default(UNDER_INVESTIGATION)
  investigationSummary  String?
  reportedToMohAt       DateTime?
  chiefPharmacistSign   String?

  safe                  ControlledSubstanceSafe     @relation(fields: [safeId], references: [id], onDelete: Cascade)

  @@index([safeId, status])
}

model MohDdfReconciliationMaster {
  id                    String                      @id @default(uuid())
  tenantId              String
  facilityMoHLicense    String                      // MOH-CLINIC-7721
  reportingYear         Int                         // 2026
  reportingMonth        Int                         // 10
  status                String                      @default("APPROVED_FINAL")
  generatedAt           DateTime                    @default(now())
  
  chiefPharmacistName   String
  chiefPharmacistLicense String
  medicalDirectorName   String
  medicalDirectorLicense String
  
  cryptographicHash     String                      // SHA-256 of entire register
  xmlPayload            String                      @db.Text
  dhis2SyncStatus       String                      @default("NOT_SYNCED")

  tenant                Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  items                 MohReconciliationItem[]

  @@unique([tenantId, reportingYear, reportingMonth])
  @@index([tenantId, reportingYear, reportingMonth])
}

model MohReconciliationItem {
  id                    String                      @id @default(uuid())
  reconciliationId      String
  substanceId           String
  substanceCode         String
  
  openingBalance        Int
  quantityReceived      Int
  quantityAdministered  Int
  quantityWasted        Int
  quantityReturned      Int
  theoreticalClosing    Int
  physicalClosingCount  Int
  discrepancyQuantity   Int                         @default(0)
  
  totalMgAdministered   Float                       @default(0.0)
  totalMgDestroyed      Float                       @default(0.0)
  complianceState       String                      @default("RECONCILED")

  reconciliation        MohDdfReconciliationMaster @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)
  substance             ControlledSubstanceMaster   @relation(fields: [substanceId], references: [id], onDelete: Cascade)

  @@index([reconciliationId])
}
```

---

## 7. TypeScript Domain Interfaces and Verification Helper Functions

```typescript
export interface ControlledSubstanceDispenseRequest {
  tenantId: string;
  safeId: string;
  substanceCode: string;
  unitSerialBarcode: string;
  patientId: string;
  patientName: string;
  visitId: string;
  prescriptionId: string;
  prescribedDoseMg: number;
  administeredDoseMg: number;
  wastedDoseMg: number;
  wastageMethod?: 'SLUICE_SINK_FLUSH_RUNNING_WATER' | 'CHEMICAL_DENATURATION_ABSORBENT' | 'SHARPS_BIOHAZARD_INCINERATION';
  primaryNurseCredentials: {
    staffId: string;
    staffName: string;
    licenseNumber: string;
    pinAuthToken: string;
  };
  witnessCredentials: {
    staffId: string;
    staffName: string;
    licenseNumber: string;
    pinAuthToken: string;
    role: 'SENIOR_RN' | 'CHARGE_NURSE' | 'DOCTOR' | 'PHARMACIST';
  };
}

export interface ControlledSubstanceDispenseResponse {
  success: boolean;
  transactionId: string;
  unitSerialBarcode: string;
  substanceCode: string;
  prescribedDoseMg: number;
  administeredDoseMg: number;
  wastedDoseMg: number;
  remainingSafeCount: number;
  ledgerProofHash: string;
  dispatchedAt: string;
}

export function validateWitnessEligibility(
  primaryStaffId: string,
  witnessRole: string,
  witnessStaffId: string
): { eligible: boolean; failureReason?: string } {
  if (primaryStaffId === witnessStaffId) {
    return {
      eligible: false,
      failureReason: 'Statutory violation: Primary administering clinician cannot self-witness'
    };
  }

  const authorizedRoles = ['SENIOR_RN', 'CHARGE_NURSE', 'DOCTOR', 'PHARMACIST'];
  if (!authorizedRoles.includes(witnessRole)) {
    return {
      eligible: false,
      failureReason: `Statutory violation: Role ${witnessRole} is not authorized by MoH DDF to witness controlled drug dispensing or wastage`
    };
  }

  return { eligible: true };
}
```

This specification establishes an immutable, legally certified, and fully traceable register compliant with all Department of Drugs and Food statutory standards in Cambodia.
