import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptOfflineData,
  decryptOfflineData,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '../src/lib/offlineCrypto.ts';
import { syncManager } from '../src/lib/syncManager.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 2: Offline-First Edge Resiliency & Multi-Tenant Cache Suite', () => {
  it('should encrypt and decrypt clinical patient records with tenant isolation', async () => {
    const sensitiveRecord = {
      patientId: 'PAT-8812',
      patientName: 'Chan Veasna',
      diagnosis: 'Severe Acute Bronchitis',
      medications: ['Azithromycin 500mg', 'Salbutamol Inhaler'],
    };

    // Encrypt under tenant "rotana"
    const cipherTextRotana = await encryptOfflineData(sensitiveRecord, 'rotana');
    assert.equal(typeof cipherTextRotana, 'string');
    assert.equal(cipherTextRotana.includes('Chan Veasna'), false, 'Plaintext patient name must not leak into ciphertext');
    assert.equal(cipherTextRotana.includes('Bronchitis'), false, 'Clinical diagnosis must not leak into ciphertext');

    // Decrypt with correct tenant "rotana"
    const decryptedRotana = await decryptOfflineData<typeof sensitiveRecord>(cipherTextRotana, 'rotana');
    assert.deepEqual(decryptedRotana, sensitiveRecord);

    // Decrypt with different tenant "angkor" must fail to prevent cross-tenant data access
    const decryptedCrossTenant = await decryptOfflineData<typeof sensitiveRecord>(cipherTextRotana, 'angkor');
    assert.notDeepEqual(decryptedCrossTenant, sensitiveRecord);
  });

  it('should detect tampered ciphertext and reject corruption cleanly', async () => {
    const clinicalNote = { note: 'Patient shows stable vitals, BP 120/80' };
    const validCipher = await encryptOfflineData(clinicalNote, 'rotana');

    // Tamper with ciphertext by corrupting a character
    const tamperedCipher = validCipher.slice(0, -4) + 'AAAA';
    const result = await decryptOfflineData(tamperedCipher, 'rotana');
    assert.equal(result, null, 'Tampered ciphertext must return null and reject execution');
  });

  it('should convert array buffers and base64 strings reliably', () => {
    const testBytes = new Uint8Array([0x01, 0x1b, 0x40, 0xff, 0x00, 0x7e]);
    const b64 = arrayBufferToBase64(testBytes);
    assert.equal(typeof b64, 'string');

    const recoveredBuffer = base64ToArrayBuffer(b64);
    const recoveredBytes = new Uint8Array(recoveredBuffer);
    assert.deepEqual(Array.from(recoveredBytes), Array.from(testBytes));
  });

  it('should generate sequential unique offline queue ticket codes', () => {
    const t1 = syncManager.generateOfflineQueueNumber('GEN');
    const t2 = syncManager.generateOfflineQueueNumber('GEN');
    const t3 = syncManager.generateOfflineQueueNumber('EMERG');

    assert.equal(typeof t1, 'string');
    assert.equal(t1.startsWith('GEN-'), true);
    assert.equal(t3.startsWith('EMERG-'), true);
    assert.notEqual(t1, t2, 'Sequential offline tickets must be unique');
  });

  it('should verify 100% dictionary key parity for offlineResiliency localization', () => {
    const enKeys = Object.keys((en as any).offlineResiliency || {}).sort();
    const kmKeys = Object.keys((km as any).offlineResiliency || {}).sort();

    assert.equal(enKeys.length > 0, true, 'en.offlineResiliency must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km offlineResiliency must have matching keys');
  });

  it('should guarantee zero emojis across the entire offlineResiliency localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const checkNoEmoji = (obj: Record<string, string>, lang: string) => {
      for (const [key, val] of Object.entries(obj)) {
        assert.equal(
          emojiRegex.test(val),
          false,
          `Emoji found in ${lang}.offlineResiliency.${key}: "${val}"`
        );
      }
    };

    checkNoEmoji((en as any).offlineResiliency, 'en');
    checkNoEmoji((km as any).offlineResiliency, 'km');
  });
});
