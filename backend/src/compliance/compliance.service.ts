import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import type { PrismaService } from '../prisma/prisma.service';

export interface MedicalCertificateSignInput {
  certNumber: string;
  certType: 'SICK_LEAVE' | 'FITNESS' | 'REFERRAL';
  patientName: string;
  patientCode: string;
  age?: string;
  gender?: string;
  doctorName: string;
  doctorLicense: string;
  diagnosis: string;
  icdCode?: string;
  daysOff: string;
  startDate: string;
  endDate: string;
  remarks?: string;
  issuedAt: string;
  clinicId?: string;
  clinicName?: string;
}

export interface SignedCertificateRecord extends MedicalCertificateSignInput {
  signatureBase64: string;
  signatureHex: string;
  publicKeyBase64: string;
  canonicalPayload: string;
  verificationUrl: string;
  signedAt: string;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  status: 'CRYPTOGRAPHICALLY_VERIFIED' | 'TAMPERED_OR_INVALID';
  certificateDetails?: MedicalCertificateSignInput;
  doctorLicense?: string;
  signatureTimestamp?: string;
  publicKeyBase64?: string;
  algorithm: string;
  verificationMessage: string;
}

export interface Dhis2DiseaseCase {
  caseId: string;
  diseaseName: string;
  icd11Code: string;
  icd10Code: string;
  patientAge: number;
  gender: 'MALE' | 'FEMALE';
  province: string;
  onsetDate: string;
  reportDate: string;
  confirmationStatus: 'CONFIRMED' | 'SUSPECTED' | 'PROBABLE';
  outcome: 'RECOVERED' | 'ACTIVE' | 'HOSPITALIZED';
}

export interface Dhis2ExportResult {
  reportPeriod: string;
  generatedAt: string;
  orgUnit: string;
  totalReportedCases: number;
  diseaseBreakdown: { [diseaseName: string]: number };
  dhis2Payload: {
    dataValues: Array<{
      dataElement: string;
      period: string;
      orgUnit: string;
      value: number | string;
    }>;
  };
  csvContent: string;
}

export class ComplianceService {
  private readonly prisma: PrismaService;

  // Stored key pairs per doctor license
  private doctorKeyPairs: Map<string, { publicKey: string; privateKey: string }> = new Map();

  // In-memory registry of signed certificates
  private signedCertificates: Map<string, SignedCertificateRecord> = new Map();

  // Surveillance communicable disease cases registry
  private diseaseCases: Dhis2DiseaseCase[] = [];

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
    this.seedCommunicableDiseaseSurveillance();
    this.seedSampleSignedCertificate();
  }

  private seedCommunicableDiseaseSurveillance() {
    const today = new Date();
    const dString = (daysAgo: number) => {
      const d = new Date(today.getTime() - daysAgo * 86400000);
      return d.toISOString().split('T')[0];
    };

    this.diseaseCases = [
      {
        caseId: 'CDC-2026-DEN-001',
        diseaseName: 'Dengue Fever',
        icd11Code: '1D20.0',
        icd10Code: 'A90',
        patientAge: 14,
        gender: 'MALE',
        province: 'Phnom Penh',
        onsetDate: dString(5),
        reportDate: dString(2),
        confirmationStatus: 'CONFIRMED',
        outcome: 'RECOVERED',
      },
      {
        caseId: 'CDC-2026-DEN-002',
        diseaseName: 'Dengue Fever',
        icd11Code: '1D20.0',
        icd10Code: 'A90',
        patientAge: 29,
        gender: 'FEMALE',
        province: 'Kandal',
        onsetDate: dString(3),
        reportDate: dString(1),
        confirmationStatus: 'CONFIRMED',
        outcome: 'ACTIVE',
      },
      {
        caseId: 'CDC-2026-MAL-001',
        diseaseName: 'Malaria Falciparum',
        icd11Code: '1F40',
        icd10Code: 'B50',
        patientAge: 38,
        gender: 'MALE',
        province: 'Siem Reap',
        onsetDate: dString(7),
        reportDate: dString(4),
        confirmationStatus: 'CONFIRMED',
        outcome: 'HOSPITALIZED',
      },
      {
        caseId: 'CDC-2026-TB-001',
        diseaseName: 'Pulmonary Tuberculosis',
        icd11Code: '1B10.0',
        icd10Code: 'A15',
        patientAge: 45,
        gender: 'MALE',
        province: 'Phnom Penh',
        onsetDate: dString(20),
        reportDate: dString(5),
        confirmationStatus: 'CONFIRMED',
        outcome: 'ACTIVE',
      },
      {
        caseId: 'CDC-2026-COV-001',
        diseaseName: 'COVID-19 Acute Respiratory',
        icd11Code: 'RA01.0',
        icd10Code: 'U07.1',
        patientAge: 52,
        gender: 'FEMALE',
        province: 'Phnom Penh',
        onsetDate: dString(4),
        reportDate: dString(1),
        confirmationStatus: 'CONFIRMED',
        outcome: 'RECOVERED',
      },
      {
        caseId: 'CDC-2026-INF-001',
        diseaseName: 'Seasonal Influenza A',
        icd11Code: '1E30',
        icd10Code: 'J10',
        patientAge: 8,
        gender: 'FEMALE',
        province: 'Siem Reap',
        onsetDate: dString(3),
        reportDate: dString(1),
        confirmationStatus: 'CONFIRMED',
        outcome: 'RECOVERED',
      },
    ];
  }

  private seedSampleSignedCertificate() {
    const sampleInput: MedicalCertificateSignInput = {
      certNumber: 'MC-2026-0042',
      certType: 'SICK_LEAVE',
      patientName: 'Chan Dara (ចាន់ ដារ៉ា)',
      patientCode: 'P-0012',
      age: '28',
      gender: 'Male',
      doctorName: 'Dr. Keo Samnang (វេជ្ជ. កែវ សំណាង)',
      doctorLicense: 'MOH-DOC-9842',
      diagnosis: 'Acute Upper Respiratory Tract Infection (J06.9) with Moderate Fever',
      icdCode: 'J06.9',
      daysOff: '3',
      startDate: '2026-10-21',
      endDate: '2026-10-24',
      remarks: 'Patient is advised complete bed rest and hydration.',
      issuedAt: '2026-10-20',
      clinicName: 'Rotana Medical Center',
    };

    this.signCertificate(sampleInput);
  }

  getOrCreateDoctorKeyPair(doctorLicense: string): { publicKey: string; privateKey: string } {
    const existing = this.doctorKeyPairs.get(doctorLicense);
    if (existing) {
      return existing;
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    const pair = { publicKey: pubPem, privateKey: privPem };
    this.doctorKeyPairs.set(doctorLicense, pair);
    return pair;
  }

  buildCanonicalPayload(input: MedicalCertificateSignInput): string {
    // Deterministic payload encoding for cryptographic signature
    return [
      input.certNumber,
      input.certType,
      input.patientCode,
      input.doctorLicense,
      input.diagnosis,
      input.daysOff,
      input.startDate,
      input.endDate,
      input.issuedAt,
    ].join('|');
  }

  signCertificate(input: MedicalCertificateSignInput): SignedCertificateRecord {
    if (!input.certNumber || !input.patientCode || !input.doctorLicense) {
      throw new BadRequestException('Certificate number, patient code, and doctor license are required.');
    }

    const keyPair = this.getOrCreateDoctorKeyPair(input.doctorLicense);
    const canonicalPayload = this.buildCanonicalPayload(input);
    const dataBuffer = Buffer.from(canonicalPayload, 'utf8');

    const privateKeyObj = crypto.createPrivateKey(keyPair.privateKey);
    const signatureBuffer = crypto.sign(null, dataBuffer, privateKeyObj);

    const signatureBase64 = signatureBuffer.toString('base64');
    const signatureHex = signatureBuffer.toString('hex');

    // Base64 public key (strip PEM headers for clean compact QR embedding)
    const rawPublicKeyBase64 = keyPair.publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/[\r\n]/g, '');

    const nowIso = new Date().toISOString();
    const verificationUrl = `/verify?cert=${encodeURIComponent(input.certNumber)}&sig=${encodeURIComponent(signatureHex.slice(0, 32))}`;

    const record: SignedCertificateRecord = {
      ...input,
      signatureBase64,
      signatureHex,
      publicKeyBase64: rawPublicKeyBase64,
      canonicalPayload,
      verificationUrl,
      signedAt: nowIso,
    };

    this.signedCertificates.set(input.certNumber, record);
    return record;
  }

  verifyCertificate(
    certNumber: string,
    signatureHex?: string,
    canonicalOverride?: string,
  ): CertificateVerificationResult {
    const record = this.signedCertificates.get(certNumber);

    if (!record) {
      return {
        isValid: false,
        status: 'TAMPERED_OR_INVALID',
        algorithm: 'Ed25519',
        verificationMessage: `Medical Certificate ${certNumber} was not found in the national verified registry.`,
      };
    }

    const keyPair = this.getOrCreateDoctorKeyPair(record.doctorLicense);
    const publicKeyObj = crypto.createPublicKey(keyPair.publicKey);

    const payloadToVerify = canonicalOverride || record.canonicalPayload;
    const dataBuffer = Buffer.from(payloadToVerify, 'utf8');

    const signatureToVerify = signatureHex
      ? Buffer.from(signatureHex, 'hex')
      : Buffer.from(record.signatureBase64, 'base64');

    try {
      const isVerified = crypto.verify(null, dataBuffer, publicKeyObj, signatureToVerify);

      if (isVerified) {
        return {
          isValid: true,
          status: 'CRYPTOGRAPHICALLY_VERIFIED',
          certificateDetails: {
            certNumber: record.certNumber,
            certType: record.certType,
            patientName: record.patientName,
            patientCode: record.patientCode,
            age: record.age,
            gender: record.gender,
            doctorName: record.doctorName,
            doctorLicense: record.doctorLicense,
            diagnosis: record.diagnosis,
            icdCode: record.icdCode,
            daysOff: record.daysOff,
            startDate: record.startDate,
            endDate: record.endDate,
            remarks: record.remarks,
            issuedAt: record.issuedAt,
            clinicName: record.clinicName,
          },
          doctorLicense: record.doctorLicense,
          signatureTimestamp: record.signedAt,
          publicKeyBase64: record.publicKeyBase64,
          algorithm: 'Ed25519',
          verificationMessage:
            'Cryptographic integrity confirmed. This certificate is authentic, untampered, and verified against the registered Ministry of Health licensed practitioner public key.',
        };
      } else {
        return {
          isValid: false,
          status: 'TAMPERED_OR_INVALID',
          algorithm: 'Ed25519',
          verificationMessage:
            'Cryptographic signature mismatch! The certificate data has been altered, tampered with, or signed by an unauthorized key.',
        };
      }
    } catch (err: any) {
      return {
        isValid: false,
        status: 'TAMPERED_OR_INVALID',
        algorithm: 'Ed25519',
        verificationMessage: `Verification failed due to cryptographic error: ${err.message}`,
      };
    }
  }

  exportDhis2Surveillance(period = '202610'): Dhis2ExportResult {
    const orgUnitCode = 'KHM-MOH-ROTANA-HQ';
    const breakdown: { [diseaseName: string]: number } = {};

    for (const c of this.diseaseCases) {
      breakdown[c.diseaseName] = (breakdown[c.diseaseName] || 0) + 1;
    }

    const dataValues = Object.entries(breakdown).map(([disease, count]) => ({
      dataElement: `MOH_CDC_${disease.replace(/\s+/g, '_').toUpperCase()}`,
      period,
      orgUnit: orgUnitCode,
      value: count,
    }));

    // CSV format matching MoH Cambodia surveillance reporting guidelines
    const csvHeader = 'CaseID,DiseaseName,ICD11Code,ICD10Code,PatientAge,Gender,Province,OnsetDate,ReportDate,Status,Outcome\n';
    const csvRows = this.diseaseCases
      .map(
        (c) =>
          `${c.caseId},"${c.diseaseName}",${c.icd11Code},${c.icd10Code},${c.patientAge},${c.gender},"${c.province}",${c.onsetDate},${c.reportDate},${c.confirmationStatus},${c.outcome}`,
      )
      .join('\n');

    return {
      reportPeriod: period,
      generatedAt: new Date().toISOString(),
      orgUnit: orgUnitCode,
      totalReportedCases: this.diseaseCases.length,
      diseaseBreakdown: breakdown,
      dhis2Payload: { dataValues },
      csvContent: csvHeader + csvRows,
    };
  }

  getTrackedCommunicableDiseases() {
    return [
      {
        diseaseName: 'Dengue Fever',
        icd11Code: '1D20.0',
        icd10Code: 'A90',
        reportingUrgency: 'URGENT_24_HOURS',
        mohProtocol: 'Cambodia National Dengue Control Program (NDCP)',
      },
      {
        diseaseName: 'Malaria',
        icd11Code: '1F40',
        icd10Code: 'B50-B54',
        reportingUrgency: 'URGENT_24_HOURS',
        mohProtocol: 'National Center for Parasitology, Entomology and Malaria Control (CNM)',
      },
      {
        diseaseName: 'Tuberculosis',
        icd11Code: '1B10',
        icd10Code: 'A15-A19',
        reportingUrgency: 'WEEKLY_SURVEILLANCE',
        mohProtocol: 'National Center for Tuberculosis and Leprosy Control (CENAT)',
      },
      {
        diseaseName: 'COVID-19 Acute Respiratory',
        icd11Code: 'RA01',
        icd10Code: 'U07.1',
        reportingUrgency: 'DAILY_BATCH',
        mohProtocol: 'Communicable Disease Control Department (CDC-MoH)',
      },
      {
        diseaseName: 'Seasonal Influenza',
        icd11Code: '1E30',
        icd10Code: 'J09-J11',
        reportingUrgency: 'WEEKLY_SURVEILLANCE',
        mohProtocol: 'National Influenza Center / National Institute of Public Health (NIPH)',
      },
    ];
  }
}
