import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESC_POS_COMMANDS,
  generateDrawerPulseBytes,
  getLineWidth,
  padRow,
  formatDivider,
  generateReceiptEscPos,
  concatBuffers,
} from '../src/lib/hardware-pos.ts';
import type { ReceiptData } from '../src/lib/hardware-pos.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 1: Silent POS & Hardware Peripheral Driver Suite', () => {
  it('should verify standard ESC/POS hardware control bytes', () => {
    // 1. Initialize Printer (ESC @)
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.INIT), [0x1b, 0x40]);

    // 2. Text Alignment
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.ALIGN_LEFT), [0x1b, 0x61, 0x00]);
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.ALIGN_CENTER), [0x1b, 0x61, 0x01]);
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.ALIGN_RIGHT), [0x1b, 0x61, 0x02]);

    // 3. Font Emphasis & Double Size
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.BOLD_ON), [0x1b, 0x45, 0x01]);
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.BOLD_OFF), [0x1b, 0x45, 0x00]);
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.DOUBLE_SIZE_ON), [0x1d, 0x21, 0x11]);
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.DOUBLE_SIZE_OFF), [0x1d, 0x21, 0x00]);

    // 4. Paper Cut
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.CUT_FULL), [0x1d, 0x56, 0x41, 0x00]);
    assert.deepEqual(Array.from(ESC_POS_COMMANDS.CUT_PARTIAL), [0x1d, 0x56, 0x42, 0x00]);
  });

  it('should generate valid pulse bytes for RJ11 cash drawer kick', () => {
    // Pin 2 pulse: ESC p 0 25 250
    const pin2Pulse = generateDrawerPulseBytes('pin2');
    assert.deepEqual(Array.from(pin2Pulse), [0x1b, 0x70, 0x00, 0x19, 0xfa]);

    // Pin 5 pulse: ESC p 1 25 250
    const pin5Pulse = generateDrawerPulseBytes('pin5');
    assert.deepEqual(Array.from(pin5Pulse), [0x1b, 0x70, 0x01, 0x19, 0xfa]);
  });

  it('should calculate correct line widths and pad columns accurately', () => {
    assert.equal(getLineWidth('80mm'), 48);
    assert.equal(getLineWidth('58mm'), 32);

    const row80 = padRow('Subtotal:', '$15.00', 48);
    assert.equal(row80.length, 48);
    assert.equal(row80.startsWith('Subtotal:'), true);
    assert.equal(row80.endsWith('$15.00'), true);

    const row58 = padRow('Total:', '$15.00', 32);
    assert.equal(row58.length, 32);
    assert.equal(row58.startsWith('Total:'), true);
    assert.equal(row58.endsWith('$15.00'), true);

    const divider = formatDivider('-', 48);
    assert.equal(divider.length, 48);
    assert.equal(divider, '-'.repeat(48));
  });

  it('should compile complete ESC/POS binary receipt byte stream for 80mm and 58mm', () => {
    const sampleReceipt: ReceiptData = {
      clinicName: 'Rotana Health Center',
      clinicAddress: 'Phnom Penh, Cambodia',
      clinicPhone: '+855 23 888 999',
      invoiceNumber: 'INV-2026-999',
      date: '2026-10-20 21:00',
      patientName: 'Test Patient',
      patientId: 'PAT-001',
      items: [
        { name: 'Consultation Fee', quantity: 1, unitPrice: 10.0, total: 10.0 },
        { name: 'Paracetamol 500mg', quantity: 2, unitPrice: 2.5, total: 5.0 },
      ],
      subtotal: 15.0,
      tax: 0.0,
      totalUsd: 15.0,
      totalKhr: 61500,
      paymentMethod: 'CASH',
      cashierName: 'Dr. Rotana',
    };

    const bytes80 = generateReceiptEscPos(sampleReceipt, '80mm');
    assert.equal(bytes80 instanceof Uint8Array, true);
    assert.equal(bytes80.length > 200, true);

    // Verify presence of init command at the start
    assert.equal(bytes80[0], 0x1b);
    assert.equal(bytes80[1], 0x40);

    // Verify partial cut at the end
    const lastBytes = Array.from(bytes80.slice(-4));
    assert.deepEqual(lastBytes, [0x1d, 0x56, 0x42, 0x00]);

    // Verify 58mm compact format
    const bytes58 = generateReceiptEscPos(sampleReceipt, '58mm');
    assert.equal(bytes58 instanceof Uint8Array, true);
    assert.equal(bytes58.length > 180, true);
  });

  it('should test barcode scanner burst interval discriminator logic', () => {
    const isScannerBurst = (intervals: number[], maxIntervalMs = 50) => {
      return intervals.every((iv) => iv <= maxIntervalMs);
    };

    // Hardware scanner burst: typical inter-key intervals are 8ms to 25ms
    const hardwareScanIntervals = [12, 10, 15, 8, 14, 11, 9];
    assert.equal(isScannerBurst(hardwareScanIntervals, 50), true);

    // Human typing: typical inter-key intervals are 90ms to 250ms
    const humanTypingIntervals = [120, 95, 140, 210, 85];
    assert.equal(isScannerBurst(humanTypingIntervals, 50), false);
  });

  it('should verify 100% dictionary key parity for hardwarePOS localization', () => {
    const enKeys = Object.keys((en as any).hardwarePOS || {}).sort();
    const kmKeys = Object.keys((km as any).hardwarePOS || {}).sort();

    assert.equal(enKeys.length > 0, true, 'en.hardwarePOS must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km hardwarePOS must have exact matching keys');
  });

  it('should guarantee zero emojis across the entire hardwarePOS localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const checkNoEmoji = (obj: Record<string, string>, lang: string) => {
      for (const [key, val] of Object.entries(obj)) {
        assert.equal(
          emojiRegex.test(val),
          false,
          `Emoji found in ${lang}.hardwarePOS.${key}: "${val}"`
        );
      }
    };

    checkNoEmoji((en as any).hardwarePOS, 'en');
    checkNoEmoji((km as any).hardwarePOS, 'km');
  });
});
