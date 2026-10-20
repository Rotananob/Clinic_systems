import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ComplianceService } from '../src/compliance/compliance.service.ts';
import type { MedicalCertificateSignInput } from '../src/compliance/compliance.service.ts';

describe('Phase 7: MoH & Cryptographic Compliance Suite (Ed25519 & DHIS2)', () => {
  let complianceService: ComplianceService;
  const mockPrisma: any = {};

  beforeEach(() => {
    complianceService = new ComplianceService(mockPrisma);
  });

  it('should generate or retrieve deterministic Ed25519 key pairs per doctor license', () => {
    const keyPair1 = complianceService.getOrCreateDoctorKeyPair('MOH-DOC-9842');
    assert.ok(keyPair1.publicKey.includes('BEGIN PUBLIC KEY'));
    assert.ok(keyPair1.privateKey.includes('BEGIN PRIVATE KEY'));

    // Verify key caching for same license
    const keyPair2 = complianceService.getOrCreateDoctorKeyPair('MOH-DOC-9842');
    assert.equal(keyPair1.publicKey, keyPair2.publicKey);
  });

  it('should cryptographically sign medical certificates with Ed25519 private key', () => {
    const input: MedicalCertificateSignInput = {
      certNumber: 'MC-2026-0099',
      certType: 'SICK_LEAVE',
      patientName: 'Sokha Ly (លី សុខា)',
      patientCode: 'P-2026-0088',
      age: '34',
      gender: 'Female',
      doctorName: 'Dr. Keo Samnang',
      doctorLicense: 'MOH-DOC-9842',
      diagnosis: 'Acute Gastrointestinal Enteritis (A09.9)',
      icdCode: 'A09.9',
      daysOff: '2',
      startDate: '2026-10-21',
      endDate: '2026-10-23',
      issuedAt: '2026-10-20',
      clinicName: 'Rotana Medical Center',
    };

    const record = complianceService.signCertificate(input);

    assert.ok(record.signatureBase64);
    assert.ok(record.signatureHex);
    assert.ok(record.publicKeyBase64);
    assert.ok(record.verificationUrl.includes('MC-2026-0099'));
    assert.equal(record.certNumber, 'MC-2026-0099');
  });

  it('should successfully verify authentic certificate against doctor public key', () => {
    const input: MedicalCertificateSignInput = {
      certNumber: 'MC-2026-0100',
      certType: 'SICK_LEAVE',
      patientName: 'Vanna Meas (មាស វណ្ណា)',
      patientCode: 'P-2026-0089',
      doctorName: 'Dr. Keo Samnang',
      doctorLicense: 'MOH-DOC-9842',
      diagnosis: 'Viral Pharyngitis (J02.9)',
      daysOff: '3',
      startDate: '2026-10-21',
      endDate: '2026-10-24',
      issuedAt: '2026-10-20',
    };

    complianceService.signCertificate(input);

    const verification = complianceService.verifyCertificate('MC-2026-0100');

    assert.equal(verification.isValid, true);
    assert.equal(verification.status, 'CRYPTOGRAPHICALLY_VERIFIED');
    assert.equal(verification.algorithm, 'Ed25519');
    assert.equal(verification.certificateDetails?.patientName, 'Vanna Meas (មាស វណ្ណា)');
    assert.ok(verification.verificationMessage.includes('authentic'));
  });

  it('should detect altered or tampered certificate data and reject verification', () => {
    const input: MedicalCertificateSignInput = {
      certNumber: 'MC-2026-0101',
      certType: 'SICK_LEAVE',
      patientName: 'Phalla Chea',
      patientCode: 'P-2026-0090',
      doctorName: 'Dr. Keo Samnang',
      doctorLicense: 'MOH-DOC-9842',
      diagnosis: 'Tension Headache',
      daysOff: '2',
      startDate: '2026-10-21',
      endDate: '2026-10-23',
      issuedAt: '2026-10-20',
    };

    complianceService.signCertificate(input);

    // Tamper simulation: patient changed daysOff from 2 to 14 days!
    const tamperedPayload = [
      input.certNumber,
      input.certType,
      input.patientCode,
      input.doctorLicense,
      input.diagnosis,
      '14', // Tampered days off!
      input.startDate,
      input.endDate,
      input.issuedAt,
    ].join('|');

    const verification = complianceService.verifyCertificate(
      'MC-2026-0101',
      undefined,
      tamperedPayload,
    );

    assert.equal(verification.isValid, false);
    assert.equal(verification.status, 'TAMPERED_OR_INVALID');
    assert.ok(verification.verificationMessage.includes('mismatch') || verification.verificationMessage.includes('altered'));
  });

  it('should reject verification for non-existent certificate numbers', () => {
    const verification = complianceService.verifyCertificate('MC-NON-EXISTENT-999');
    assert.equal(verification.isValid, false);
    assert.equal(verification.status, 'TAMPERED_OR_INVALID');
  });

  it('should export MoH communicable disease surveillance report in DHIS2 and CSV formats', () => {
    const exportResult = complianceService.exportDhis2Surveillance('202610');

    assert.equal(exportResult.reportPeriod, '202610');
    assert.equal(exportResult.orgUnit, 'KHM-MOH-ROTANA-HQ');
    assert.ok(exportResult.totalReportedCases >= 5);

    // Verify presence of core communicable diseases
    assert.ok(exportResult.diseaseBreakdown['Dengue Fever'] >= 1);
    assert.ok(exportResult.diseaseBreakdown['Malaria Falciparum'] >= 1);
    assert.ok(exportResult.diseaseBreakdown['Pulmonary Tuberculosis'] >= 1);

    // Verify DHIS2 payload values
    assert.ok(Array.isArray(exportResult.dhis2Payload.dataValues));
    assert.ok(exportResult.dhis2Payload.dataValues.length >= 4);

    // Verify CSV output contains standard headers
    assert.ok(exportResult.csvContent.includes('CaseID,DiseaseName,ICD11Code,ICD10Code'));
    assert.ok(exportResult.csvContent.includes('Dengue Fever'));
    assert.ok(exportResult.csvContent.includes('1D20.0'));
  });

  it('should list tracked communicable diseases with ICD-11 codes and reporting protocols', () => {
    const diseases = complianceService.getTrackedCommunicableDiseases();
    assert.ok(diseases.length >= 5);

    const dengue = diseases.find((d) => d.diseaseName === 'Dengue Fever');
    assert.ok(dengue);
    assert.equal(dengue.icd11Code, '1D20.0');
    assert.equal(dengue.reportingUrgency, 'URGENT_24_HOURS');

    const tb = diseases.find((d) => d.diseaseName === 'Tuberculosis');
    assert.ok(tb);
    assert.equal(tb.icd11Code, '1B10');
  });

  it('should guarantee zero emojis across all compliance service outputs', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

    const sample = complianceService.verifyCertificate('MC-2026-0042');
    assert.equal(emojiRegex.test(sample.verificationMessage), false);

    const dhis2 = complianceService.exportDhis2Surveillance('202610');
    assert.equal(emojiRegex.test(dhis2.csvContent), false);
  });
});
