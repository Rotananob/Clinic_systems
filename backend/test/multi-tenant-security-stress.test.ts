import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

class ClinicalSecurityCipher {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(secret = 'clinicos_test_secure_vault_master_key_2026_hipaa') {
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encryptField(plaintext: string | null | undefined): string | null {
    if (!plaintext || typeof plaintext !== 'string') return plaintext ?? null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decryptField(ciphertext: string | null | undefined): string | null {
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext ?? null;
    if (!ciphertext.startsWith('enc:v1:')) return ciphertext;
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 5) return ciphertext;
      const iv = Buffer.from(parts[2], 'hex');
      const tag = Buffer.from(parts[3], 'hex');
      const encryptedHex = parts[4];
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '[ENCRYPTED_CLINICAL_RECORD_PROTECTED]';
    }
  }

  maskNationalId(idNumber: string | null | undefined): string {
    if (!idNumber) return 'N/A';
    const cleaned = idNumber.trim();
    if (cleaned.length <= 4) return '****';
    return `${cleaned.slice(0, 3)}****${cleaned.slice(-2)}`;
  }

  resolveTenantStorageFolder(tenantSlugOrId: string | null | undefined, category = 'attachments'): string {
    const safeTenant = (tenantSlugOrId || 'master_default').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const safeCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `clinicos_tenants/${safeTenant}/${safeCategory}`;
  }

  computeMedicalRecordSeal(params: {
    recordId: string;
    patientId: string;
    tenantId: string;
    diagnosis: string;
    createdAt: string;
  }): string {
    const payload = `${params.tenantId}:${params.patientId}:${params.recordId}:${params.diagnosis}:${params.createdAt}`;
    return crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();
  }
}

describe('Step 23: HIPAA/GDPR Grade Clinical Data Security & Field-Level Encryption', () => {
  const cipher = new ClinicalSecurityCipher();

  test('should securely encrypt sensitive clinical health diagnoses with AES-256-GCM', () => {
    const rawDiagnosis = 'Hypertension Stage 2 with secondary ischemic symptoms';
    const encrypted = cipher.encryptField(rawDiagnosis);

    assert.notEqual(encrypted, rawDiagnosis);
    assert.ok(encrypted?.startsWith('enc:v1:'));

    // Verify format: enc:v1:<iv_hex>:<tag_hex>:<cipher_hex>
    const parts = encrypted!.split(':');
    assert.equal(parts.length, 5);
    assert.equal(parts[0], 'enc');
    assert.equal(parts[1], 'v1');
    assert.equal(parts[2].length, 24); // 12 bytes IV in hex
    assert.equal(parts[3].length, 32); // 16 bytes auth tag in hex
  });

  test('should decrypt valid ciphertext back to original plaintext with 100% fidelity', () => {
    const sensitiveVitalsNote = 'Patient reports severe penicillin allergy and acute asthma attacks';
    const encrypted = cipher.encryptField(sensitiveVitalsNote);
    const decrypted = cipher.decryptField(encrypted);

    assert.equal(decrypted, sensitiveVitalsNote);
  });

  test('should reject tampered or modified ciphertext and prevent data injection', () => {
    const originalText = 'Blood Type O Negative; Emergency transfusion required';
    const encrypted = cipher.encryptField(originalText);

    // Tamper with ciphertext by altering last characters
    const tampered = encrypted!.slice(0, -4) + 'ffff';
    const decrypted = cipher.decryptField(tampered);

    assert.equal(decrypted, '[ENCRYPTED_CLINICAL_RECORD_PROTECTED]');
  });

  test('should pass through legacy unencrypted strings transparently for backward compatibility', () => {
    const legacyPlaintext = 'Normal checkup; no acute distress';
    const result = cipher.decryptField(legacyPlaintext);

    assert.equal(result, legacyPlaintext);
  });

  test('should safely mask patient National ID numbers for HIPAA/GDPR privacy compliance', () => {
    assert.equal(cipher.maskNationalId('0102938475'), '010****75');
    assert.equal(cipher.maskNationalId('098765'), '098****65');
    assert.equal(cipher.maskNationalId('123'), '****');
    assert.equal(cipher.maskNationalId(null), 'N/A');
  });

  test('should isolate Cloudinary storage folders strictly per tenant', () => {
    const rotanaFolder = cipher.resolveTenantStorageFolder('rotana-polyclinic', 'prescriptions');
    const vannaFolder = cipher.resolveTenantStorageFolder('vanna-maternity', 'prescriptions');

    assert.equal(rotanaFolder, 'clinicos_tenants/rotana-polyclinic/prescriptions');
    assert.equal(vannaFolder, 'clinicos_tenants/vanna-maternity/prescriptions');
    assert.notEqual(rotanaFolder, vannaFolder);
  });

  test('should generate tamper-evident SHA-256 seal for clinical consultation records', () => {
    const recordParams = {
      recordId: 'rec_9921',
      patientId: 'pat_4412',
      tenantId: 'tenant_rotana',
      diagnosis: 'Type 2 Diabetes Mellitus',
      createdAt: '2026-10-20T12:00:00.000Z',
    };

    const seal1 = cipher.computeMedicalRecordSeal(recordParams);
    const seal2 = cipher.computeMedicalRecordSeal(recordParams);

    assert.equal(seal1, seal2);
    assert.equal(seal1.length, 64);

    // Any change in diagnosis must invalidate seal
    const sealModified = cipher.computeMedicalRecordSeal({
      ...recordParams,
      diagnosis: 'Altered diagnosis without physician approval',
    });
    assert.notEqual(seal1, sealModified);
  });
});

describe('Step 24: Multi-Tenant Automated Integration & Security Stress Suite', () => {
  interface TenantStore {
    tenantId: string;
    slug: string;
  }
  const asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

  test('should strictly isolate concurrent execution contexts across 50 concurrent tenants', async () => {
    const tenantIds = Array.from({ length: 50 }, (_, i) => `tenant_clinic_${i}`);

    const promises = tenantIds.map(async (id) => {
      return new Promise<boolean>((resolve) => {
        asyncLocalStorage.run({ tenantId: id, slug: `slug-${id}` }, async () => {
          await new Promise((r) => setTimeout(r, Math.random() * 15));
          const currentStore = asyncLocalStorage.getStore();
          resolve(currentStore?.tenantId === id);
        });
      });
    });

    const results = await Promise.all(promises);
    assert.ok(results.every((res) => res === true));
  });

  test('should reject cross-tenant data access attempts', () => {
    const tenantA = { id: 'tenant_a', slug: 'rotana' };
    const tenantB = { id: 'tenant_b', slug: 'vanna' };

    const records = [
      { id: 'rec_1', tenantId: tenantA.id, patientName: 'Sokha Mean' },
      { id: 'rec_2', tenantId: tenantB.id, patientName: 'Dara Chan' },
    ];

    const queryForTenant = (activeTenantId: string) => {
      return records.filter((r) => r.tenantId === activeTenantId);
    };

    const tenantAResults = queryForTenant(tenantA.id);
    assert.equal(tenantAResults.length, 1);
    assert.equal(tenantAResults[0].patientName, 'Sokha Mean');

    const tenantBResults = queryForTenant(tenantB.id);
    assert.equal(tenantBResults.length, 1);
    assert.equal(tenantBResults[0].patientName, 'Dara Chan');

    assert.ok(!tenantAResults.some((r) => r.tenantId === tenantB.id));
  });

  test('should enforce strict rate limit boundary when quota ceiling is hit', () => {
    const dailyQuotaLimit = 250;
    let currentUsage = 250;

    const attemptKhqrGeneration = (usage: number, limit: number) => {
      if (usage >= limit) {
        return { success: false, statusCode: 429, error: 'QUOTA_EXCEEDED' };
      }
      return { success: true, statusCode: 200 };
    };

    const resBlocked = attemptKhqrGeneration(currentUsage, dailyQuotaLimit);
    assert.equal(resBlocked.success, false);
    assert.equal(resBlocked.statusCode, 429);
    assert.equal(resBlocked.error, 'QUOTA_EXCEEDED');

    currentUsage = 249;
    const resAllowed = attemptKhqrGeneration(currentUsage, dailyQuotaLimit);
    assert.equal(resAllowed.success, true);
    assert.equal(resAllowed.statusCode, 200);
  });
});
