import crypto from 'crypto';

export type InsurerCode = 'FORTE' | 'PRUDENTIAL' | 'AIA' | 'MANULIFE' | 'INFINITY' | 'NSSF';
export type ClaimStatus = 'DRAFT' | 'VALIDATED' | 'SUBMITTED' | 'PRE_APPROVED' | 'SETTLED' | 'REJECTED';

export interface ClaimItem {
  id: string;
  serviceCode: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalPriceUsd: number;
  coveredAmountUsd: number;
  coPayUsd: number;
  deductibleUsd: number;
}

export interface DiagnosisEntry {
  code: string;
  name: string;
  isPrimary: boolean;
}

export interface ElectronicClaim {
  id: string;
  claimNumber: string;
  insurer: InsurerCode;
  policyNumber: string;
  memberId: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  providerId: string;
  providerName: string;
  providerLicense: string;
  preAuthCode?: string;
  diagnosisCodes: DiagnosisEntry[];
  admissionDate?: string;
  dischargeDate?: string;
  claimType: 'OUTPATIENT' | 'INPATIENT' | 'DENTAL';
  items: ClaimItem[];
  totalBilledUsd: number;
  totalClaimedUsd: number;
  patientShareUsd: number;
  status: ClaimStatus;
  createdAt: string;
  submittedAt?: string;
  adjudicatedAt?: string;
  adjudicationNotes?: string;
  batchHash?: string;
  transactionReference?: string;
  xmlPayload?: string;
  fhirJsonPayload?: any;
}

export interface ReportableDisease {
  code: string;
  khmerName: string;
  englishName: string;
  category: 'IMMEDIATE' | 'WEEKLY' | 'MONTHLY';
}

export interface SurveillanceCaseRecord {
  id: string;
  diseaseCode: string;
  diseaseName: string;
  caseType: 'SUSPECTED' | 'PROBABLE' | 'CONFIRMED';
  laboratoryConfirmation: 'PCR' | 'RDT' | 'SEROLOGY' | 'CULTURE' | 'CLINICAL_ONLY';
  patientAge: number;
  patientGender: 'M' | 'F';
  provinceCode: string;
  districtCode: string;
  healthFacilityCode: string;
  encounterDate: string;
  reportingPeriod: string;
  outcome: 'RECOVERED' | 'HOSPITALIZED' | 'TRANSFERRED' | 'DECEASED';
}

export class EclaimService {
  claims: Map<string, ElectronicClaim>;
  surveillanceCases: Map<string, SurveillanceCaseRecord>;

  static REPORTABLE_DISEASES: ReportableDisease[] = [
    { code: 'A90', khmerName: 'គ្រុនឈាម (Dengue Fever)', englishName: 'Dengue Fever', category: 'WEEKLY' },
    { code: 'B54', khmerName: 'គ្រុនចាញ់ (Malaria)', englishName: 'Malaria Unspecified', category: 'WEEKLY' },
    { code: 'A01.0', khmerName: 'គ្រុនពោះវៀន (Typhoid Fever)', englishName: 'Typhoid Fever', category: 'WEEKLY' },
    { code: 'A00.9', khmerName: 'អាសន្នរោគ (Cholera)', englishName: 'Cholera', category: 'IMMEDIATE' },
    { code: 'A82.9', khmerName: 'ជំងឺឆ្កែឆ្កួត (Rabies)', englishName: 'Rabies', category: 'IMMEDIATE' },
    { code: 'A15.0', khmerName: 'របេងសួត (Tuberculosis Pulmonary)', englishName: 'Tuberculosis', category: 'MONTHLY' },
    { code: 'J06.9', khmerName: 'ការបង្ករោគផ្លូវដង្ហើមស្រួចស្រាវ (Severe ARI)', englishName: 'Acute Respiratory Infection', category: 'WEEKLY' },
    { code: 'B16.9', khmerName: 'រលាកថ្លើមប្រភេទបេ (Acute Hepatitis B)', englishName: 'Acute Hepatitis B', category: 'MONTHLY' }
  ];

  constructor() {
    this.claims = new Map();
    this.surveillanceCases = new Map();
    this.seedInitialData();
  }

  private seedInitialData() {
    const seedClaim1: ElectronicClaim = {
      id: 'clm-2026-001',
      claimNumber: 'CLM-FORTE-2026-8819',
      insurer: 'FORTE',
      policyNumber: 'FT-MED-994821',
      memberId: 'MEM-88129',
      patientId: 'p-1001',
      patientName: 'Chea Sokunthea',
      patientDob: '1990-05-14',
      patientGender: 'Female',
      providerId: 'PROV-CAM-0042',
      providerName: 'Preah Monivong Family Clinic',
      providerLicense: 'MOH-CLINIC-7721',
      preAuthCode: 'AUTH-FT-9912',
      claimType: 'OUTPATIENT',
      diagnosisCodes: [
        { code: 'J01.90', name: 'Acute sinusitis, unspecified', isPrimary: true },
        { code: 'R05.9', name: 'Cough, unspecified', isPrimary: false }
      ],
      items: [
        {
          id: 'item-01',
          serviceCode: 'CONS-SPEC-01',
          description: 'Specialist Medical Consultation (Internal Medicine)',
          quantity: 1,
          unitPriceUsd: 25.0,
          totalPriceUsd: 25.0,
          coveredAmountUsd: 20.0,
          coPayUsd: 5.0,
          deductibleUsd: 0.0
        },
        {
          id: 'item-02',
          serviceCode: 'PHARM-AMOX-625',
          description: 'Amoxicillin + Clavulanic Acid 625mg (14 tabs)',
          quantity: 1,
          unitPriceUsd: 14.5,
          totalPriceUsd: 14.5,
          coveredAmountUsd: 11.6,
          coPayUsd: 2.9,
          deductibleUsd: 0.0
        }
      ],
      totalBilledUsd: 39.5,
      totalClaimedUsd: 31.6,
      patientShareUsd: 7.9,
      status: 'PRE_APPROVED',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      adjudicatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      adjudicationNotes: 'Pre-approved under standard outpatient benefits limit. 80% coverage applied.',
      transactionReference: 'TXN-FORTE-88192-OK',
      batchHash: '8f7a9e2c4182b79104ad58129e01fbc349a182049e71b29a1738c821a89b021f'
    };

    seedClaim1.xmlPayload = this.generateClaimXml(seedClaim1);
    seedClaim1.fhirJsonPayload = this.generateFhirClaimJson(seedClaim1);

    const seedClaim2: ElectronicClaim = {
      id: 'clm-2026-002',
      claimNumber: 'CLM-NSSF-2026-1049',
      insurer: 'NSSF',
      policyNumber: 'NSSF-KH-8849102',
      memberId: 'NSSF-MEM-9921',
      patientId: 'p-1002',
      patientName: 'Khem Sovann',
      patientDob: '1984-11-20',
      patientGender: 'Male',
      providerId: 'PROV-CAM-0042',
      providerName: 'Preah Monivong Family Clinic',
      providerLicense: 'MOH-CLINIC-7721',
      preAuthCode: 'NSSF-PREAUTH-048',
      claimType: 'INPATIENT',
      admissionDate: '2026-10-18T08:00:00Z',
      dischargeDate: '2026-10-20T14:00:00Z',
      diagnosisCodes: [
        { code: 'A90', name: 'Dengue fever [classical dengue]', isPrimary: true },
        { code: 'R50.9', name: 'Fever, unspecified', isPrimary: false }
      ],
      items: [
        {
          id: 'item-nssf-01',
          serviceCode: 'IPD-BED-GEN-01',
          description: 'General Ward Inpatient Bed (2 Nights)',
          quantity: 2,
          unitPriceUsd: 35.0,
          totalPriceUsd: 70.0,
          coveredAmountUsd: 70.0,
          coPayUsd: 0.0,
          deductibleUsd: 0.0
        },
        {
          id: 'item-nssf-02',
          serviceCode: 'LAB-CBC-PLATELET',
          description: 'CBC + Platelet Count Monitoring x 3',
          quantity: 3,
          unitPriceUsd: 12.0,
          totalPriceUsd: 36.0,
          coveredAmountUsd: 36.0,
          coPayUsd: 0.0,
          deductibleUsd: 0.0
        }
      ],
      totalBilledUsd: 106.0,
      totalClaimedUsd: 106.0,
      patientShareUsd: 0.0,
      status: 'SUBMITTED',
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      transactionReference: 'TXN-NSSF-KH-2026-991'
    };

    seedClaim2.xmlPayload = this.generateClaimXml(seedClaim2);
    seedClaim2.fhirJsonPayload = this.generateFhirClaimJson(seedClaim2);

    this.claims.set(seedClaim1.id, seedClaim1);
    this.claims.set(seedClaim2.id, seedClaim2);

    // Seed Surveillance Cases for MoH Reporting
    const seedCase1: SurveillanceCaseRecord = {
      id: 'case-surv-001',
      diseaseCode: 'A90',
      diseaseName: 'Dengue Fever',
      caseType: 'CONFIRMED',
      laboratoryConfirmation: 'RDT',
      patientAge: 42,
      patientGender: 'M',
      provinceCode: 'KH-12', // Phnom Penh
      districtCode: 'KH-1205', // Mean Chey
      healthFacilityCode: 'HF-MOH-8819',
      encounterDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      reportingPeriod: '2026-W42',
      outcome: 'RECOVERED'
    };

    const seedCase2: SurveillanceCaseRecord = {
      id: 'case-surv-002',
      diseaseCode: 'J06.9',
      diseaseName: 'Severe Acute Respiratory Infection',
      caseType: 'SUSPECTED',
      laboratoryConfirmation: 'CLINICAL_ONLY',
      patientAge: 4,
      patientGender: 'F',
      provinceCode: 'KH-12',
      districtCode: 'KH-1202', // Chamkar Mon
      healthFacilityCode: 'HF-MOH-8819',
      encounterDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reportingPeriod: '2026-W42',
      outcome: 'HOSPITALIZED'
    };

    this.surveillanceCases.set(seedCase1.id, seedCase1);
    this.surveillanceCases.set(seedCase2.id, seedCase2);
  }

  listClaims(filters?: { insurer?: string; status?: string; patientId?: string }): ElectronicClaim[] {
    let list = Array.from(this.claims.values());
    if (filters?.insurer) {
      list = list.filter((c) => c.insurer === filters.insurer);
    }
    if (filters?.status) {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.patientId) {
      list = list.filter((c) => c.patientId === filters.patientId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getClaim(id: string): ElectronicClaim | null {
    return this.claims.get(id) || null;
  }

  createClaim(data: Partial<ElectronicClaim>): ElectronicClaim {
    const id = data.id || `clm-${Date.now().toString(36)}`;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const insurer = data.insurer || 'FORTE';
    const claimNumber = data.claimNumber || `CLM-${insurer}-${year}-${randomSeq}`;

    const items: ClaimItem[] = data.items || [];
    const totalBilledUsd = items.reduce((acc, it) => acc + (it.totalPriceUsd || 0), 0);
    const totalClaimedUsd = items.reduce((acc, it) => acc + (it.coveredAmountUsd || 0), 0);
    const patientShareUsd = Math.max(0, totalBilledUsd - totalClaimedUsd);

    const newClaim: ElectronicClaim = {
      id,
      claimNumber,
      insurer,
      policyNumber: data.policyNumber || 'POLICY-DEFAULT',
      memberId: data.memberId || 'MEM-DEFAULT',
      patientId: data.patientId || 'p-default',
      patientName: data.patientName || 'Chea Sokunthea',
      patientDob: data.patientDob || '1990-01-01',
      patientGender: data.patientGender || 'Female',
      providerId: data.providerId || 'PROV-CAM-0042',
      providerName: data.providerName || 'Preah Monivong Family Clinic',
      providerLicense: data.providerLicense || 'MOH-CLINIC-7721',
      preAuthCode: data.preAuthCode,
      diagnosisCodes: data.diagnosisCodes || [{ code: 'Z00.0', name: 'General examination', isPrimary: true }],
      claimType: data.claimType || 'OUTPATIENT',
      admissionDate: data.admissionDate,
      dischargeDate: data.dischargeDate,
      items,
      totalBilledUsd,
      totalClaimedUsd,
      patientShareUsd,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    newClaim.xmlPayload = this.generateClaimXml(newClaim);
    newClaim.fhirJsonPayload = this.generateFhirClaimJson(newClaim);

    this.claims.set(id, newClaim);
    return newClaim;
  }

  generateClaimXml(claim: ElectronicClaim): string {
    const diagnosesXml = (claim.diagnosisCodes || [])
      .map(
        (d, idx) => `      <Diagnosis sequence="${idx + 1}" type="${d.isPrimary ? 'PRIMARY' : 'SECONDARY'}">
        <Code system="ICD-10">${d.code}</Code>
        <Description>${d.name}</Description>
      </Diagnosis>`
      )
      .join('\n');

    const linesXml = (claim.items || [])
      .map(
        (it, idx) => `      <ClaimLine lineNumber="${idx + 1}">
        <ServiceCode>${it.serviceCode}</ServiceCode>
        <Description>${it.description}</Description>
        <Quantity>${it.quantity}</Quantity>
        <UnitPrice currency="USD">${it.unitPriceUsd.toFixed(2)}</UnitPrice>
        <BilledAmount currency="USD">${it.totalPriceUsd.toFixed(2)}</BilledAmount>
        <CoveredAmount currency="USD">${it.coveredAmountUsd.toFixed(2)}</CoveredAmount>
        <CoPayment currency="USD">${it.coPayUsd.toFixed(2)}</CoPayment>
        <Deductible currency="USD">${it.deductibleUsd.toFixed(2)}</Deductible>
      </ClaimLine>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<HealthInsuranceClaim xmlns="http://moh.gov.kh/eclaim/v1" standard="ANSI_ASC_X12_837P_COMPATIBLE">
  <Header>
    <ClaimNumber>${claim.claimNumber}</ClaimNumber>
    <ClaimType>${claim.claimType}</ClaimType>
    <SubmissionTimestamp>${new Date().toISOString()}</SubmissionTimestamp>
    <InsurerCode>${claim.insurer}</InsurerCode>
  </Header>
  <Provider>
    <ProviderId>${claim.providerId}</ProviderId>
    <FacilityName>${claim.providerName}</FacilityName>
    <MoHLicense>${claim.providerLicense}</MoHLicense>
  </Provider>
  <Subscriber>
    <PolicyNumber>${claim.policyNumber}</PolicyNumber>
    <MemberId>${claim.memberId}</MemberId>
    <PatientName>${claim.patientName}</PatientName>
    <DateOfBirth>${claim.patientDob}</DateOfBirth>
    <Gender>${claim.patientGender}</Gender>
  </Subscriber>
  <ClinicalDetails>
    <PreAuthorizationCode>${claim.preAuthCode || 'NONE'}</PreAuthorizationCode>
    <Diagnoses>
${diagnosesXml}
    </Diagnoses>
  </ClinicalDetails>
  <ClaimLines>
${linesXml}
  </ClaimLines>
  <FinancialSummary>
    <TotalBilled currency="USD">${claim.totalBilledUsd.toFixed(2)}</TotalBilled>
    <TotalClaimed currency="USD">${claim.totalClaimedUsd.toFixed(2)}</TotalClaimed>
    <PatientShare currency="USD">${claim.patientShareUsd.toFixed(2)}</PatientShare>
  </FinancialSummary>
</HealthInsuranceClaim>`;
  }

  generateFhirClaimJson(claim: ElectronicClaim): any {
    return {
      resourceType: 'Claim',
      id: claim.id,
      identifier: [
        {
          system: `http://insurance.domain.kh/${claim.insurer.toLowerCase()}/claims`,
          value: claim.claimNumber
        }
      ],
      status: 'active',
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/claim-type',
            code: claim.claimType.toLowerCase()
          }
        ]
      },
      patient: {
        reference: `Patient/${claim.patientId}`,
        display: claim.patientName
      },
      created: claim.createdAt,
      insurer: {
        display: claim.insurer
      },
      provider: {
        identifier: {
          system: 'http://moh.gov.kh/facilities',
          value: claim.providerLicense
        },
        display: claim.providerName
      },
      diagnosis: (claim.diagnosisCodes || []).map((d, idx) => ({
        sequence: idx + 1,
        diagnosisCodeableConcept: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: d.code,
              display: d.name
            }
          ]
        }
      })),
      item: (claim.items || []).map((it, idx) => ({
        sequence: idx + 1,
        productOrService: {
          coding: [
            {
              code: it.serviceCode,
              display: it.description
            }
          ]
        },
        quantity: {
          value: it.quantity
        },
        unitPrice: {
          value: it.unitPriceUsd,
          currency: 'USD'
        },
        net: {
          value: it.totalPriceUsd,
          currency: 'USD'
        }
      })),
      total: {
        value: claim.totalBilledUsd,
        currency: 'USD'
      }
    };
  }

  validateClaimXml(xml: string): { valid: boolean; errors: string[]; schemaVersion: string } {
    const errors: string[] = [];

    if (!xml.includes('<HealthInsuranceClaim')) {
      errors.push('Missing root tag <HealthInsuranceClaim>');
    }
    if (!xml.includes('<ClaimNumber>')) {
      errors.push('Missing required tag <ClaimNumber>');
    }
    if (!xml.includes('<InsurerCode>')) {
      errors.push('Missing required tag <InsurerCode>');
    }
    if (!xml.includes('<MoHLicense>')) {
      errors.push('Missing provider Ministry of Health license tag <MoHLicense>');
    }
    if (!xml.includes('<PolicyNumber>')) {
      errors.push('Missing subscriber policy number tag <PolicyNumber>');
    }
    if (!xml.includes('<Diagnoses>') || !xml.includes('<Diagnosis')) {
      errors.push('Claim must contain at least one valid <Diagnoses> code block');
    }
    if (!xml.includes('<ClaimLines>') || !xml.includes('<ClaimLine')) {
      errors.push('Claim must contain at least one itemized claim line');
    }
    if (!xml.includes('<TotalClaimed')) {
      errors.push('Missing financial summary total claimed amount');
    }

    return {
      valid: errors.length === 0,
      errors,
      schemaVersion: 'MOH-ECLAIM-XML-V1.2'
    };
  }

  submitClaim(id: string): { success: boolean; claim: ElectronicClaim; transactionReference: string; batchHash: string } {
    const claim = this.claims.get(id);
    if (!claim) {
      throw new Error(`Claim ${id} not found`);
    }

    // Refresh XML and FHIR
    claim.xmlPayload = this.generateClaimXml(claim);
    claim.fhirJsonPayload = this.generateFhirClaimJson(claim);

    // Compute cryptographic SHA256 batch hash
    const batchHash = crypto.createHash('sha256').update(claim.xmlPayload).digest('hex');
    const txnRef = `TXN-${claim.insurer}-${Date.now().toString(36).toUpperCase()}`;

    claim.status = 'SUBMITTED';
    claim.submittedAt = new Date().toISOString();
    claim.batchHash = batchHash;
    claim.transactionReference = txnRef;

    return {
      success: true,
      claim,
      transactionReference: txnRef,
      batchHash
    };
  }

  adjudicateClaim(
    id: string,
    decision: { status: 'PRE_APPROVED' | 'SETTLED' | 'REJECTED'; notes: string }
  ): ElectronicClaim {
    const claim = this.claims.get(id);
    if (!claim) {
      throw new Error(`Claim ${id} not found`);
    }

    claim.status = decision.status;
    claim.adjudicatedAt = new Date().toISOString();
    claim.adjudicationNotes = decision.notes;

    return claim;
  }

  listReportableDiseases(): ReportableDisease[] {
    return EclaimService.REPORTABLE_DISEASES;
  }

  listSurveillanceCases(period?: string, diseaseCode?: string): SurveillanceCaseRecord[] {
    let list = Array.from(this.surveillanceCases.values());
    if (period) {
      list = list.filter((c) => c.reportingPeriod === period);
    }
    if (diseaseCode) {
      list = list.filter((c) => c.diseaseCode === diseaseCode);
    }
    return list.sort((a, b) => new Date(b.encounterDate).getTime() - new Date(a.encounterDate).getTime());
  }

  recordSurveillanceCase(data: Partial<SurveillanceCaseRecord>): SurveillanceCaseRecord {
    const id = data.id || `case-surv-${Date.now().toString(36)}`;
    const diseaseDef = EclaimService.REPORTABLE_DISEASES.find((d) => d.code === data.diseaseCode);

    const newCase: SurveillanceCaseRecord = {
      id,
      diseaseCode: data.diseaseCode || 'A90',
      diseaseName: data.diseaseName || diseaseDef?.englishName || 'Dengue Fever',
      caseType: data.caseType || 'CONFIRMED',
      laboratoryConfirmation: data.laboratoryConfirmation || 'RDT',
      patientAge: data.patientAge ?? 25,
      patientGender: data.patientGender || 'M',
      provinceCode: data.provinceCode || 'KH-12',
      districtCode: data.districtCode || 'KH-1205',
      healthFacilityCode: data.healthFacilityCode || 'HF-MOH-8819',
      encounterDate: data.encounterDate || new Date().toISOString().split('T')[0],
      reportingPeriod: data.reportingPeriod || '2026-W42',
      outcome: data.outcome || 'RECOVERED'
    };

    this.surveillanceCases.set(id, newCase);
    return newCase;
  }

  generateMohDhis2Xml(period: string): string {
    const cases = this.listSurveillanceCases(period);

    // Aggregate by disease code
    const counts: Record<string, number> = {};
    for (const c of cases) {
      counts[c.diseaseCode] = (counts[c.diseaseCode] || 0) + 1;
    }

    const dataValuesXml = Object.entries(counts)
      .map(
        ([code, count]) => `    <dataValue dataElement="DE_MOH_${code.replace('.', '_')}" period="${period}" orgUnit="OU_HF_8819" value="${count}" storedBy="clinic_system" />`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<dxf xmlns="http://dhis2.org/schema/dxf/2.0">
  <meta>
    <reportingFacility>Preah Monivong Family Clinic</reportingFacility>
    <moHLicense>MOH-CLINIC-7721</moHLicense>
    <reportingPeriod>${period}</reportingPeriod>
    <totalCases>${cases.length}</totalCases>
    <generatedAt>${new Date().toISOString()}</generatedAt>
  </meta>
  <dataValues>
${dataValuesXml}
  </dataValues>
</dxf>`;
  }

  generateMohDhis2Json(period: string): any {
    const cases = this.listSurveillanceCases(period);

    const counts: Record<string, number> = {};
    for (const c of cases) {
      counts[c.diseaseCode] = (counts[c.diseaseCode] || 0) + 1;
    }

    return {
      dataSet: 'DS_MOH_COMMUNICABLE_DISEASE_SURVEILLANCE',
      period,
      orgUnit: 'OU_HF_8819',
      completeDate: new Date().toISOString().split('T')[0],
      dataValues: Object.entries(counts).map(([code, val]) => ({
        dataElement: `DE_MOH_${code.replace('.', '_')}`,
        value: val.toString()
      }))
    };
  }
}
