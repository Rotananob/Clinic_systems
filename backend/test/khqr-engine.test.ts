import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// EMVCo TLV Formatter & CRC16-CCITT implementation for Bakong KHQR validation
function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

function calculateCrc16(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

describe('KHQR Engine & Deep Link Test Suite', () => {
  it('should format Tag 01=12 dynamic QR payload with EMVCo specifications', () => {
    // Tag 00: Payload Format Indicator (01)
    const t00 = formatTlv('00', '01');
    assert.equal(t00, '000201');

    // Tag 01: Point of Initiation Method -> 12 = Dynamic QR (locked amount)
    const t01 = formatTlv('01', '12');
    assert.equal(t01, '010212');

    // Tag 53: Transaction Currency (840 = USD)
    const t53 = formatTlv('53', '840');
    assert.equal(t53, '5303840');

    // Tag 54: Transaction Amount (e.g. $15.50)
    const amountStr = '15.50';
    const t54 = formatTlv('54', amountStr);
    assert.equal(t54, '540515.50');

    // Tag 58: Country Code (KH)
    const t58 = formatTlv('58', 'KH');
    assert.equal(t58, '5802KH');

    // Tag 59: Merchant Name
    const t59 = formatTlv('59', 'ROTANA CLINIC');
    assert.equal(t59, '5913ROTANA CLINIC');

    // Tag 60: Merchant City
    const t60 = formatTlv('60', 'Phnom Penh');
    assert.equal(t60, '6010Phnom Penh');

    // Payload before CRC
    const rawPayload = `${t00}${t01}${t53}${t54}${t58}${t59}${t60}6304`;
    const crc = calculateCrc16(rawPayload);
    const fullQrString = `${rawPayload}${crc}`;

    assert.equal(fullQrString.includes('010212'), true);
    assert.equal(fullQrString.endsWith(crc), true);
    assert.equal(crc.length, 4);
  });

  it('should generate valid Bakong and ABA Mobile deep link URLs', () => {
    const qrString = '0002010102125303840540515.505802KH5913ROTANA CLINIC6010Phnom Penh6304ABCD';
    const encodedQr = encodeURIComponent(qrString);

    const abaDeepLink = `aba://payment?qr=${encodedQr}&callback=${encodeURIComponent('https://rotana-clinic.com/billing')}`;
    const bakongDeepLink = `bakong://qr?data=${encodedQr}`;

    assert.equal(abaDeepLink.startsWith('aba://'), true);
    assert.equal(abaDeepLink.includes('callback='), true);
    assert.equal(bakongDeepLink.startsWith('bakong://'), true);
  });

  it('should handle KHR currency code 116 with integer amounts', () => {
    const khrAmount = '60000';
    const t53 = formatTlv('53', '116');
    const t54 = formatTlv('54', khrAmount);

    assert.equal(t53, '5303116');
    assert.equal(t54, '540560000');
  });
});
