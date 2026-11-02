# MoH Controlled Substances Double-Signoff Architecture and HL7 FHIR Interoperability Specification
Document Identifier: MOH-DDF-NARCOTIC-FHIR-ARCH-2026-V1
Classification: Pure Enterprise Standard Medical Systems Architecture

---

## Section 1: HL7 FHIR R4 Interoperability for MoH DDF Controlled Substances

### 1.1 Architectural Overview
The Ministry of Health Department of Drugs and Food - នាយកដ្ឋានឱសថ ចំណីអាហារ បរិក្ខារពេទ្យ និងគ្រឿងសំអាង ហៅកាត់ថា DDF requires full auditability for controlled substances.
Under the HL7 FHIR Release 4 standard, controlled drug workflows map to two primary core resources:
1. `MedicationDispense`: Captures the custody release from the ward double-locked safe or central hospital pharmacy.
2. `MedicationAdministration`: Captures the clinical bedside injection, infusion, or ingestion by the patient, including witnessed fractional dosing and physical wastage destruction.

Both resources are bound to a FHIR Document Bundle representing the MoH DDF Statutory Audit Register entry.

---

### 1.2 FHIR R4 MedicationDispense Profile Mapping

The `MedicationDispense` resource represents the double-authenticated event of unlocking the ward safe, retrieving an intact serialized glass ampoule or vial, and transferring it to the administering nurse.

#### Mapping Table: Internal Data to FHIR R4 MedicationDispense
| Internal Ledger Field | FHIR R4 Element Path | FHIR Data Type | Mapping Definition and Clinical Semantics |
|---|---|---|---|
| `transactionId` | `MedicationDispense.identifier` | `Identifier[]` | Unique system transaction UUID with system URI `http://moh.gov.kh/fhir/narcotics/dispense` |
| `unitSerialBarcode` | `MedicationDispense.extension[vial-serial]` | `Extension` (String) | GS1 DataMatrix unit serial number of the individual glass ampoule |
| `status` | `MedicationDispense.status` | `code` | Fixed to `completed` upon dual-credential verification |
| `substanceCode` | `MedicationDispense.medicationCodeableConcept` | `CodeableConcept` | WHO ATC Code (e.g., `N02AA01` for Morphine) and MoH DDF Code `MOH-NAR-001` |
| `patientId` | `MedicationDispense.subject` | `Reference(Patient)` | Target patient receiving the controlled medicine |
| `visitId` | `MedicationDispense.context` | `Reference(Encounter)` | Outpatient visit or inpatient admission encounter reference |
| `primaryStaffId` | `MedicationDispense.performer[primary].actor` | `Reference(Practitioner)` | Licensed Registered Nurse initiating the dispensation |
| `witnessStaffId` | `MedicationDispense.performer[witness].actor` | `Reference(Practitioner)` | Co-signing licensed clinician witnessing safe access |
| `prescriptionId` | `MedicationDispense.authorizingPrescription` | `Reference(MedicationRequest)` | Doctor electronic prescription authorizing controlled substance |
| `dosageForm` | `MedicationDispense.dosageInstruction` | `Dosage[]` | Route, site, and dosage instructions |
| `safeIdentifier` | `MedicationDispense.location` | `Reference(Location)` | Physical double-locked safe ID (e.g., `Location/SAFE-WARD-ICU-01`) |
| `ledgerEntryHash` | `MedicationDispense.extension[merkle-hash]` | `Extension` (String) | Cryptographic SHA-256 seal linking to previous ledger transaction |

#### Complete JSON Payload: FHIR R4 MedicationDispense
```json
{
  "resourceType": "MedicationDispense",
  "id": "disp-morphine-20261026-0042",
  "meta": {
    "profile": [
      "http://moh.gov.kh/fhir/StructureDefinition/moh-ddf-narcotic-dispense"
    ]
  },
  "extension": [
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/narcotic-schedule",
      "valueCode": "SCHEDULE_II_NARCOTIC"
    },
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/vial-serial-number",
      "valueString": "SN-MPH10-202610-8819201"
    },
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/manufacturer-lot",
      "valueString": "LOT-AGU-9921B"
    },
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/merkle-seal-hash",
      "valueString": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    }
  ],
  "identifier": [
    {
      "system": "http://moh.gov.kh/fhir/narcotics/dispense",
      "value": "TX-DISP-2026-1026-0042"
    }
  ],
  "status": "completed",
  "category": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/medicationdispense-category",
        "code": "inpatient",
        "display": "Inpatient"
      }
    ]
  },
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.whocc.no/atc",
        "code": "N02AA01",
        "display": "Morphine"
      },
      {
        "system": "http://moh.gov.kh/ddf/codes",
        "code": "MOH-NAR-001",
        "display": "Morphine Sulfate 10mg/1ml Ampoule"
      }
    ],
    "text": "ម៉ូហ្វីន ស៊ុលហ្វាត : Morphine Sulfate 10mg/1ml Ampoule"
  },
  "subject": {
    "reference": "Patient/PT-1001",
    "display": "Keo Samnang"
  },
  "context": {
    "reference": "Encounter/ENC-IPD-2026-881"
  },
  "performer": [
    {
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/medicationdispense-performer-function",
            "code": "dispenser",
            "display": "Dispenser"
          }
        ]
      },
      "actor": {
        "reference": "Practitioner/STF-RN-042",
        "identifier": {
          "system": "http://moh.gov.kh/licenses/nurse",
          "value": "NURSE-LIC-KH-2020-4491"
        },
        "display": "Meas Channa (Registered Nurse)"
      }
    },
    {
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
            "code": "WIT",
            "display": "Witness"
          }
        ]
      },
      "actor": {
        "reference": "Practitioner/STF-DOC-101",
        "identifier": {
          "system": "http://moh.gov.kh/licenses/doctor",
          "value": "DOC-LIC-KH-2012-1108"
        },
        "display": "Dr. Chan Vanna (Attending Physician)"
      }
    }
  ],
  "authorizingPrescription": [
    {
      "reference": "MedicationRequest/RX-2026-88912"
    }
  ],
  "type": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActPharmacySupplyType",
        "code": "UD",
        "display": "Unit Dose"
      }
    ]
  },
  "quantity": {
    "value": 1,
    "unit": "Ampoule",
    "system": "http://unitsofmeasure.org",
    "code": "{Ampoule}"
  },
  "daysSupply": {
    "value": 1,
    "unit": "Day",
    "system": "http://unitsofmeasure.org",
    "code": "d"
  },
  "whenHandedOver": "2026-10-26T14:35:00Z"
}
```

---

### 1.3 FHIR R4 MedicationAdministration Profile with Wastage Disposal

The `MedicationAdministration` resource captures the actual administration of the prescribed portion (e.g., 4mg) and links to the witnessed physical destruction of the residual portion (e.g., 6mg).

#### Complete JSON Payload: FHIR R4 MedicationAdministration
```json
{
  "resourceType": "MedicationAdministration",
  "id": "admin-morphine-20261026-0042",
  "meta": {
    "profile": [
      "http://moh.gov.kh/fhir/StructureDefinition/moh-ddf-narcotic-administration"
    ]
  },
  "extension": [
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/vial-serial-number",
      "valueString": "SN-MPH10-202610-8819201"
    },
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/residual-wastage-detail",
      "extension": [
        {
          "url": "wastedMilligrams",
          "valueQuantity": {
            "value": 6.0,
            "unit": "mg",
            "system": "http://unitsofmeasure.org",
            "code": "mg"
          }
        },
        {
          "url": "destructionMethod",
          "valueCode": "SLUICE_SINK_FLUSH_RUNNING_WATER"
        },
        {
          "url": "destructionTimestamp",
          "valueDateTime": "2026-10-26T14:38:00Z"
        },
        {
          "url": "destructionWitness",
          "valueReference": {
            "reference": "Practitioner/STF-DOC-101",
            "display": "Dr. Chan Vanna (Attending Physician)"
          }
        },
        {
          "url": "clinicalReason",
          "valueString": "Prescribed dose 4mg from 10mg ampoule; 6mg residual destroyed immediately"
        }
      ]
    },
    {
      "url": "http://moh.gov.kh/fhir/StructureDefinition/merkle-seal-hash",
      "valueString": "3e9b14c33d8a7c29e1f5a022b72f10928a38c221a719c8321019fba82910ba11"
    }
  ],
  "identifier": [
    {
      "system": "http://moh.gov.kh/fhir/narcotics/administration",
      "value": "TX-ADM-2026-1026-0042"
    }
  ],
  "status": "completed",
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.whocc.no/atc",
        "code": "N02AA01",
        "display": "Morphine"
      },
      {
        "system": "http://moh.gov.kh/ddf/codes",
        "code": "MOH-NAR-001",
        "display": "Morphine Sulfate"
      }
    ],
    "text": "ម៉ូហ្វីន ស៊ុលហ្វាត : Morphine Sulfate"
  },
  "subject": {
    "reference": "Patient/PT-1001",
    "display": "Keo Samnang"
  },
  "context": {
    "reference": "Encounter/ENC-IPD-2026-881"
  },
  "effectiveDateTime": "2026-10-26T14:36:30Z",
  "performer": [
    {
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/med-admin-perform-function",
            "code": "performer",
            "display": "Performer"
          }
        ]
      },
      "actor": {
        "reference": "Practitioner/STF-RN-042",
        "display": "Meas Channa (Registered Nurse)"
      }
    },
    {
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
            "code": "WIT",
            "display": "Witness"
          }
        ]
      },
      "actor": {
        "reference": "Practitioner/STF-DOC-101",
        "display": "Dr. Chan Vanna (Attending Physician)"
      }
    }
  ],
  "request": {
    "reference": "MedicationRequest/RX-2026-88912"
  },
  "dosage": {
    "text": "4mg IV Push slowly over 4 minutes for acute post-operative pain",
    "route": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "47625008",
          "display": "Intravenous route"
        }
      ]
    },
    "dose": {
      "value": 4.0,
      "unit": "mg",
      "system": "http://unitsofmeasure.org",
      "code": "mg"
    }
  }
}
```

---

## Section 2: NestJS Service Interfaces and Controller Architecture

### 2.1 Component Architecture Overview

```
+----------------------------------------------------------------------------------------------------+
|                                    NESTJS BACKEND ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ HTTP REST API CONTROLLER ]  -->  /api/v1/narcotics                                              |
|                                     - POST /safes/:safeId/unlock-session                           |
|                                     - GET  /safes/:safeId/ledger                                   |
|                                     - GET  /safes/:safeId/ledger/verify-integrity                  |
|                                     - POST /safes/:safeId/transactions/dispense-administer         |
|                                     - POST /safes/:safeId/transactions/waste-disposal              |
|                                     - POST /safes/:safeId/shift-handover                           |
|                                     - GET  /reconciliation/monthly-export                          |
|                                                                                                    |
|                                             |                                                      |
|                                             v                                                      |
|  [ CORE SERVICES ]                                                                                 |
|  +-------------------------------+  +-------------------------------+  +------------------------+  |
|  | ControlledSubstanceService    |  | DualAuthWitnessEngine         |  | MerkleLedgerSealEngine|  |
|  | - Safe Inventory Lifecycle    |  | - Role Matrix Verification    |  | - SHA-256 Block Seal   |  |
|  | - Dispense & Administer       |  | - High-Entropy PIN / Bio Pass |  | - Non-Repudiation Tree |  |
|  | - Wastage Destruction         |  | - Ephemeral Unlock Session    |  | - Proof Verification   |  |
|  +-------------------------------+  +-------------------------------+  +------------------------+  |
|                                             |                                                      |
|                                             v                                                      |
|  [ PERSISTENCE LAYER ]                                                                             |
|  - PrismaService -> PostgreSQL Multi-Tenant Relational Database                                    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.2 TypeScript Data Transfer Objects (DTOs)

```typescript
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ControlledWastageMethod {
  SLUICE_SINK_FLUSH_RUNNING_WATER = 'SLUICE_SINK_FLUSH_RUNNING_WATER',
  CHEMICAL_DENATURATION_ABSORBENT = 'CHEMICAL_DENATURATION_ABSORBENT',
  SHARPS_BIOHAZARD_INCINERATION = 'SHARPS_BIOHAZARD_INCINERATION'
}

export enum NursingShiftIdentifier {
  MORNING_TO_AFTERNOON = 'MORNING_TO_AFTERNOON',
  AFTERNOON_TO_NIGHT = 'AFTERNOON_TO_NIGHT',
  NIGHT_TO_MORNING = 'NIGHT_TO_MORNING'
}

export class ClinicianCredentialDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  securityPin: string;

  @IsString()
  @IsOptional()
  biometricChallengeToken?: string;
}

export class SafeUnlockSessionRequestDto {
  @ValidateNested()
  @Type(() => ClinicianCredentialDto)
  primaryClinician: ClinicianCredentialDto;

  @ValidateNested()
  @Type(() => ClinicianCredentialDto)
  witnessClinician: ClinicianCredentialDto;

  @IsString()
  @IsNotEmpty()
  reasonForAccess: string;
}

export class DispenseAndAdministerRequestDto {
  @IsString()
  @IsNotEmpty()
  unlockSessionToken: string;

  @IsString()
  @IsNotEmpty()
  unitSerialBarcode: string;

  @IsString()
  @IsNotEmpty()
  substanceCode: string;

  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  visitId: string;

  @IsString()
  @IsNotEmpty()
  prescriptionId: string;

  @IsNumber()
  @IsPositive()
  prescribedDoseMg: number;

  @IsNumber()
  @IsPositive()
  administeredDoseMg: number;

  @IsNumber()
  wastedDoseMg: number;

  @IsEnum(ControlledWastageMethod)
  @IsOptional()
  wastageDestructionMethod?: ControlledWastageMethod;

  @IsString()
  @IsOptional()
  wastageClinicalReason?: string;
}

export class WasteDisposalOnlyRequestDto {
  @IsString()
  @IsNotEmpty()
  unlockSessionToken: string;

  @IsString()
  @IsNotEmpty()
  unitSerialBarcode: string;

  @IsNumber()
  @IsPositive()
  wastedMilligrams: number;

  @IsEnum(ControlledWastageMethod)
  destructionMethod: ControlledWastageMethod;

  @IsString()
  @IsNotEmpty()
  clinicalReasonNote: string;
}

export class ShiftHandoverCountItemDto {
  @IsString()
  @IsNotEmpty()
  substanceCode: string;

  @IsNumber()
  physicalCount: number;
}

export class ShiftHandoverRequestDto {
  @IsEnum(NursingShiftIdentifier)
  shiftIdentifier: NursingShiftIdentifier;

  @ValidateNested()
  @Type(() => ClinicianCredentialDto)
  outgoingChargeNurse: ClinicianCredentialDto;

  @ValidateNested()
  @Type(() => ClinicianCredentialDto)
  incomingChargeNurse: ClinicianCredentialDto;

  @ValidateNested({ each: true })
  @Type(() => ShiftHandoverCountItemDto)
  @ArrayMinSize(1)
  physicalCounts: ShiftHandoverCountItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
```

---

### 2.3 Service Contract Interfaces

```typescript
export interface SafeUnlockSessionResult {
  sessionToken: string;
  safeId: string;
  departmentName: string;
  primaryStaffName: string;
  witnessStaffName: string;
  witnessRole: string;
  grantedAt: string;
  expiresAt: string;
}

export interface LedgerQueryResponse {
  safeId: string;
  departmentName: string;
  totalTransactions: number;
  currentRunningBalances: Record<string, number>;
  merkleRootHash: string;
  items: Array<{
    transactionId: string;
    timestamp: string;
    transactionType: string;
    substanceCode: string;
    genericName: string;
    vialSerialBarcode: string;
    dosePrescribedMg?: number;
    doseAdministeredMg?: number;
    doseWastedMg?: number;
    patientName?: string;
    primaryStaffName: string;
    witnessStaffName: string;
    ledgerEntryHash: string;
  }>;
}

export interface LedgerIntegrityVerificationResult {
  safeId: string;
  verifiedTransactionCount: number;
  chainValid: boolean;
  computedMerkleRoot: string;
  genesisHash: string;
  latestSealHash: string;
  tamperDetectedAtIndex: number | null;
  message: string;
}

export interface ControlledSubstanceServiceContract {
  createSafeUnlockSession(
    tenantId: string,
    safeId: string,
    dto: SafeUnlockSessionRequestDto
  ): Promise<SafeUnlockSessionResult>;

  queryPerpetualLedger(
    tenantId: string,
    safeId: string,
    options: {
      substanceCode?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<LedgerQueryResponse>;

  verifyLedgerIntegrity(
    tenantId: string,
    safeId: string
  ): Promise<LedgerIntegrityVerificationResult>;

  recordDispenseAndAdminister(
    tenantId: string,
    safeId: string,
    dto: DispenseAndAdministerRequestDto
  ): Promise<{
    transactionId: string;
    ledgerEntryHash: string;
    administeredMg: number;
    wastedMg: number;
    remainingStockCount: number;
    fhirMedicationDispense: any;
    fhirMedicationAdministration: any;
  }>;

  recordWasteDisposal(
    tenantId: string,
    safeId: string,
    dto: WasteDisposalOnlyRequestDto
  ): Promise<{
    transactionId: string;
    unitSerialBarcode: string;
    wastedMilligrams: number;
    destructionConfirmed: boolean;
    ledgerEntryHash: string;
  }>;

  executeShiftHandover(
    tenantId: string,
    safeId: string,
    dto: ShiftHandoverRequestDto
  ): Promise<{
    handoverId: string;
    shiftIdentifier: string;
    physicalCountsConcordant: boolean;
    lockdownActivated: boolean;
    discrepancyCount: number;
    timestamp: string;
  }>;
}
```

---

### 2.4 NestJS Controller Endpoint Implementation

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  SafeUnlockSessionRequestDto,
  DispenseAndAdministerRequestDto,
  WasteDisposalOnlyRequestDto,
  ShiftHandoverRequestDto
} from './dto/narcotic-requests.dto';
import { ControlledSubstanceService } from './controlled-substance.service';

@ApiTags('Ministry of Health Controlled Substances & Narcotic Register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('narcotics')
export class ControlledSubstanceController {
  constructor(
    private readonly narcoticService: ControlledSubstanceService
  ) {}

  @ApiOperation({
    summary: 'Request dual-lock unlock session token requiring dual clinician credentials'
  })
  @Post('safes/:safeId/unlock-session')
  @HttpCode(HttpStatus.OK)
  async createUnlockSession(
    @Req() req: any,
    @Param('safeId') safeId: string,
    @Body() dto: SafeUnlockSessionRequestDto
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.narcoticService.createSafeUnlockSession(tenantId, safeId, dto);
  }

  @ApiOperation({
    summary: 'Query perpetual inventory ledger with running balances and Merkle hash verification'
  })
  @Get('safes/:safeId/ledger')
  @ApiQuery({ name: 'substanceCode', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPerpetualLedger(
    @Req() req: any,
    @Param('safeId') safeId: string,
    @Query('substanceCode') substanceCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.narcoticService.queryPerpetualLedger(tenantId, safeId, {
      substanceCode,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    });
  }

  @ApiOperation({
    summary: 'Verify cryptographic integrity and Merkle hash chain of perpetual narcotic ledger'
  })
  @Get('safes/:safeId/ledger/verify-integrity')
  async verifyLedgerIntegrity(
    @Req() req: any,
    @Param('safeId') safeId: string
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.narcoticService.verifyLedgerIntegrity(tenantId, safeId);
  }

  @ApiOperation({
    summary: 'Record dual-witnessed patient administration and residual wastage destruction'
  })
  @Post('safes/:safeId/transactions/dispense-administer')
  @HttpCode(HttpStatus.CREATED)
  async recordDispenseAndAdminister(
    @Req() req: any,
    @Param('safeId') safeId: string,
    @Body() dto: DispenseAndAdministerRequestDto
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.narcoticService.recordDispenseAndAdminister(tenantId, safeId, dto);
  }

  @ApiOperation({
    summary: 'Record unadministered residue wastage disposal with witnessed physical destruction'
  })
  @Post('safes/:safeId/transactions/waste-disposal')
  @HttpCode(HttpStatus.CREATED)
  async recordWasteDisposal(
    @Req() req: any,
    @Param('safeId') safeId: string,
    @Body() dto: WasteDisposalOnlyRequestDto
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.narcoticService.recordWasteDisposal(tenantId, safeId, dto);
  }

  @ApiOperation({
    summary: 'Execute mandatory nursing shift turnover physical count and custody handover'
  })
  @Post('safes/:safeId/shift-handover')
  @HttpCode(HttpStatus.OK)
  async executeShiftHandover(
    @Req() req: any,
    @Param('safeId') safeId: string,
    @Body() dto: ShiftHandoverRequestDto
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.narcoticService.executeShiftHandover(tenantId, safeId, dto);
  }
}
```

---

## Section 3: Cryptographic Merkle-Tree and Dual-Signoff Lock Engine

### 3.1 Ephemeral Safe Unlock Session Security
To prevent lingering safe access:
1. When `createUnlockSession` executes, the backend verifies both the primary nurse and witness credentials.
2. The witness role must belong to `['SENIOR_RN', 'CHARGE_NURSE', 'DOCTOR', 'PHARMACIST']`.
3. If both pass, the engine signs a cryptographically random token:
   `unlockSessionToken = HMAC_SHA256(safeId + primaryStaffId + witnessStaffId + timestamp, SECRET_KEY)`
4. The token is stored in memory or Redis with a strict Time-To-Live (TTL) of 180 seconds (3 minutes).
5. Any subsequent transaction (`dispense-administer` or `waste-disposal`) must supply this token. Once consumed, the token is invalidated immediately to enforce single-transaction dual verification.

### 3.2 Cryptographic Merkle Hash Chain Mathematics
Every transaction $T_i$ generates an immutable block hash $H_i$:

$$H_i = \text{SHA256}\Big( T_i.\text{tenantId} \parallel T_i.\text{safeId} \parallel T_i.\text{substanceCode} \parallel T_i.\text{serial} \parallel T_i.\text{adminMg} \parallel T_i.\text{wasteMg} \parallel T_i.\text{primaryStaffId} \parallel T_i.\text{witnessStaffId} \parallel H_{i-1} \Big)$$

Where $H_0$ is the safe genesis seal hash:
$$H_0 = \text{SHA256}(\text{"MOH_DDF_GENESIS_SAFE_"} \parallel \text{safeId})$$

When verifying ledger integrity via `GET /safes/:safeId/ledger/verify-integrity`:
- The service retrieves all $N$ transactions in strict chronological sequence.
- It iterates from $i=1$ to $N$, re-evaluating $H_i$.
- If any recorded hash does not equal the computed hash, the verification fails immediately at index $i$, alerting the hospital compliance officer to unauthorized database modification.

---

## Section 4: Operational Implementation Summary

1. Interoperability: Both `MedicationDispense` and `MedicationAdministration` FHIR R4 resources map completely to Cambodia MoH DDF controlled drug statutory reporting.
2. Dual-Witness Verification: Enforced mechanically by requiring dual credentials, generating single-use ephemeral unlock tokens, and recording dual practitioner references in FHIR and PostgreSQL.
3. Unit-Level Tracing: Individual ampoules are tracked from acquisition through partial administration and physical destruction.
4. Shift Handover Auditing: Mandatory physical count verification with automatic safe lockdown on discrepancy detection.
