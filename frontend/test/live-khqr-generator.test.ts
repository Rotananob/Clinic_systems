import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCrc16,
  buildLiveAbaKhqr,
  RAW_PAYWAY_SESSIONS,
} from '../src/lib/khqr.ts';

describe('Real Live Scannable KHQR & EMVCo Generator Suite', () => {
  it('should guarantee zero emojis anywhere in raw payloads, deep links, and results', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

    const resUsd = buildLiveAbaKhqr({
      merchantName: 'ROTANA CLINIC',
      amount: '1.00',
      currency: 'USD',
    });
    const resKhr = buildLiveAbaKhqr({
      merchantName: 'SOKHAPHEAP CLINIC',
      amount: '4000',
      currency: 'KHR',
    });

    assert.equal(emojiRegex.test(resUsd.qrString), false);
    assert.equal(emojiRegex.test(resUsd.abaDeeplink), false);
    assert.equal(emojiRegex.test(resUsd.bakongDeeplink), false);
    assert.equal(emojiRegex.test(resKhr.qrString), false);
  });

  it('should accurately compute CRC16 CCITT matching official ABA PayWay standard', () => {
    // Official raw ABA PayWay payload minus 4 hex chars of CRC
    const rawAbaWithoutCrc =
      '00020101021230510016abaakhppxxx@abaa01151260929135220240208ABA Bank52048220530384054040.015802KH5910NOB ROTANA6003N/A626068560010PAYWAY@ABA0115539089-327772220209042557298030110501199670013179257470977301131795166709773672100170013F1BF016411FDA6804PLIK6304';
    const computed = computeCrc16(rawAbaWithoutCrc);
    assert.equal(computed, '0497');
  });

  it('should return authentic ABA PayWay session for default NOB ROTANA 0.01 and 0.05', () => {
    const res001 = buildLiveAbaKhqr({
      merchantName: 'NOB ROTANA',
      amount: '0.01',
      currency: 'USD',
      useRawSessionIfDefault: true,
    });
    assert.equal(res001.isRawSession, true);
    assert.equal(res001.qrString, RAW_PAYWAY_SESSIONS['0.01'].qrString);
    assert.equal(res001.crc16, '0497');
    assert.match(res001.abaDeeplink, /^abamobilebank:\/\/ababank\.com\?type=payway/);
    assert.match(res001.bakongDeeplink, /^bakong:\/\/open\?qr=/);

    const res005 = buildLiveAbaKhqr({
      merchantName: 'NOB ROTANA',
      amount: '0.05',
      currency: 'USD',
      useRawSessionIfDefault: true,
    });
    assert.equal(res005.isRawSession, true);
    assert.equal(res005.qrString, RAW_PAYWAY_SESSIONS['0.05'].qrString);
    assert.equal(res005.crc16, '795E');
  });

  it('should generate compliant EMVCo KHQR with custom merchant name in Tag 59', () => {
    const customClinic = 'Rotana Specialized Clinic';
    const res = buildLiveAbaKhqr({
      merchantName: customClinic,
      amount: '5.00',
      currency: 'USD',
    });

    assert.equal(res.isRawSession, false);
    assert.equal(res.merchantName.length <= 25, true);
    assert.match(res.qrString, /5925ROTANA SPECIALIZED CLINIC/);
    assert.match(res.qrString, /30510016abaakhppxxx@abaa01151260929135220240208ABA Bank/);
    assert.match(res.qrString, /54045\.00/);
    assert.match(res.qrString, /5303840/);
    assert.match(res.qrString, /5802KH/);
    assert.match(res.qrString, /6010PHNOM PENH/);
    assert.match(res.qrString, /62170113INV-2026-0881/);

    // Verify CRC validity
    const base = res.qrString.slice(0, -4);
    const expectedCrc = computeCrc16(base);
    assert.equal(res.crc16, expectedCrc);
    assert.equal(res.qrString.endsWith(expectedCrc), true);
  });

  it('should correctly format KHR currency and integer amount for Cambodian Riel', () => {
    const res = buildLiveAbaKhqr({
      merchantName: 'Sokhapheap Clinic',
      amount: '20000',
      currency: 'KHR',
    });

    assert.equal(res.currency, 'KHR');
    assert.equal(res.amountFormatted, '20000 KHR');
    assert.match(res.qrString, /5303116/);
    assert.match(res.qrString, /540520000/);
    assert.match(res.qrString, /5917SOKHAPHEAP CLINIC/);
  });

  it('should sanitize special characters in clinic name for EMVCo compatibility', () => {
    const res = buildLiveAbaKhqr({
      merchantName: "Dr. Chan's #1 @Clinic!",
      amount: '15.00',
      currency: 'USD',
    });

    // Symbols stripped, periods/dashes/spaces preserved up to 25 chars
    assert.equal(res.merchantName.includes('#'), false);
    assert.equal(res.merchantName.includes('@'), false);
    assert.equal(res.merchantName.includes('!'), false);
    assert.equal(res.merchantName.length <= 25, true);
  });

  it('should provide full structured EMVCo tag breakdown for interactive inspection', () => {
    const res = buildLiveAbaKhqr({
      merchantName: 'Rotana Clinic',
      amount: '1.00',
      currency: 'USD',
    });

    const tags = res.tagBreakdown.map((t) => t.tag);
    assert.equal(tags.includes('00'), true);
    assert.equal(tags.includes('01'), true);
    assert.equal(tags.includes('30'), true);
    assert.equal(tags.includes('52'), true);
    assert.equal(tags.includes('53'), true);
    assert.equal(tags.includes('54'), true);
    assert.equal(tags.includes('58'), true);
    assert.equal(tags.includes('59'), true);
    assert.equal(tags.includes('60'), true);
    assert.equal(tags.includes('62'), true);
    assert.equal(tags.includes('63'), true);
  });
});
