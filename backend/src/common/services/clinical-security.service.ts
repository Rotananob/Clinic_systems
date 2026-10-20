import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ClinicalSecurityService {
  private readonly logger = new Logger(ClinicalSecurityService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const rawSecret =
      process.env.CLINICAL_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'clinicos_default_secure_vault_master_key_2026_hipaa_grade';

    // Derive a fixed 32-byte (256-bit) cryptographic key using SHA-256
    this.key = crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Step 23: Encrypts sensitive clinical Protected Health Information (PHI)
   * using AES-256-GCM with a random initialization vector (IV) and authentication tag.
   * Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
   */
  encryptField(plaintext: string | null | undefined): string | null {
    if (!plaintext || typeof plaintext !== 'string') {
      return plaintext ?? null;
    }

    try {
      // 12-byte IV standard for AES-GCM
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (err: any) {
      this.logger.error(`Clinical field encryption failure: ${err.message || err}`);
      return plaintext;
    }
  }

  /**
   * Step 23: Decrypts AES-256-GCM encrypted clinical text.
   * If the string does not match the encrypted header format, returns as-is
   * to guarantee seamless backward compatibility with legacy unencrypted data.
   */
  decryptField(ciphertext: string | null | undefined): string | null {
    if (!ciphertext || typeof ciphertext !== 'string') {
      return ciphertext ?? null;
    }

    // Check if format matches enc:v1:<iv>:<tag>:<cipher>
    if (!ciphertext.startsWith('enc:v1:')) {
      return ciphertext;
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 5) {
        return ciphertext;
      }

      const iv = Buffer.from(parts[2], 'hex');
      const tag = Buffer.from(parts[3], 'hex');
      const encryptedHex = parts[4];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      this.logger.error(`Clinical field decryption authentication failed (tampered data): ${err.message || err}`);
      return '[ENCRYPTED_CLINICAL_RECORD_PROTECTED]';
    }
  }

  /**
   * Step 23: Masks sensitive patient identifiers for compliance in logs and non-clinical exports.
   * e.g. "0123456789" -> "0123****89"
   */
  maskNationalId(idNumber: string | null | undefined): string {
    if (!idNumber) return 'N/A';
    const cleaned = idNumber.trim();
    if (cleaned.length <= 4) return '****';
    const prefix = cleaned.slice(0, 3);
    const suffix = cleaned.slice(-2);
    return `${prefix}****${suffix}`;
  }

  /**
   * Step 23: Generates tenant-scoped Cloudinary storage directory path
   * ensuring clinical files belonging to Tenant A are never mixed with Tenant B.
   */
  resolveTenantStorageFolder(
    tenantSlugOrId: string | null | undefined,
    category = 'attachments',
  ): string {
    const safeTenant = (tenantSlugOrId || 'master_default')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const safeCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `clinicos_tenants/${safeTenant}/${safeCategory}`;
  }

  /**
   * Step 23: Computes tamper-evident SHA-256 seal for medical records
   */
  computeMedicalRecordSeal(params: {
    recordId: string;
    patientId: string;
    tenantId: string;
    diagnosis: string;
    createdAt: Date | string;
  }): string {
    const payload = `${params.tenantId}:${params.patientId}:${params.recordId}:${params.diagnosis}:${params.createdAt}`;
    return crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();
  }
}
