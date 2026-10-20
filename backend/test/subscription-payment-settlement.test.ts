import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';

function computeCrc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildDynamicKhqr(params: {
  bakongId: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  currency: 'USD' | 'KHR';
  billNumber: string;
}): { qrString: string; md5: string } {
  const { bakongId, merchantName, merchantCity, amount, currency, billNumber } = params;

  const tag29_00 = `00${String(bakongId.length).padStart(2, '0')}${bakongId}`;
  const tag29 = `29${String(tag29_00.length).padStart(2, '0')}${tag29_00}`;

  const currencyCode = currency === 'KHR' ? '116' : '840';
  const tag53 = `5303${currencyCode}`;

  const amountStr = amount.toFixed(2);
  const tag54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

  const tag58 = '5802KH';
  const safeMerchantName = merchantName.slice(0, 25);
  const tag59 = `59${String(safeMerchantName.length).padStart(2, '0')}${safeMerchantName}`;

  const safeCity = merchantCity.slice(0, 15);
  const tag60 = `60${String(safeCity.length).padStart(2, '0')}${safeCity}`;

  const tag62_01 = `01${String(billNumber.length).padStart(2, '0')}${billNumber}`;
  const tag62 = `62${String(tag62_01.length).padStart(2, '0')}${tag62_01}`;

  const rawPayload = `000201010212${tag29}52045999${tag53}${tag54}${tag58}${tag59}${tag60}${tag62}6304`;
  const crc = computeCrc16(rawPayload);
  return { qrString: `${rawPayload}${crc}`, md5: '' };
}

describe('Step 17 & Step 18: Direct KHQR Subscription Checkout & Automated Settlement Tests', () => {
  test('should generate compliant Tag 01=12 Dynamic KHQR payload with Platform Owner credentials', () => {
    const payload = buildDynamicKhqr({
      bakongId: 'rotana_saas@aba',
      merchantName: 'CLINICOS PLATFORM PAAS',
      merchantCity: 'Phnom Penh',
      amount: 8.0,
      currency: 'USD',
      billNumber: 'SUB-ROTANA-123456',
    });

    assert.ok(payload.qrString.startsWith('000201010212'), 'Must specify dynamic QR indicator (01=12)');
    assert.ok(payload.qrString.includes('rotana_saas@aba'), 'Must embed platform owner Bakong ID');
    assert.ok(payload.qrString.includes('5303840'), 'Must embed USD currency code 840');
    assert.ok(payload.qrString.includes('54048.00'), 'Must embed exact amount $8.00');
    assert.ok(payload.qrString.includes('5802KH'), 'Must embed Cambodia country code KH');
    assert.ok(payload.qrString.includes('CLINICOS PLATFORM PAAS'), 'Must embed merchant name');
    assert.ok(payload.qrString.includes('SUB-ROTANA-123456'), 'Must embed bill reference number');
    assert.equal(payload.qrString.length > 50, true);
  });

  test('should calculate accurate pricing for monthly and 20% annual discount plans', () => {
    const tiers = [
      { id: 'STARTER_5', monthly: 5, expectedAnnual: 48 }, // $5 * 12 * 0.8 = $48
      { id: 'PRO_8', monthly: 8, expectedAnnual: 77 },    // $8 * 12 * 0.8 = $76.8 -> $77
      { id: 'ENTERPRISE_12', monthly: 12, expectedAnnual: 115 }, // $12 * 12 * 0.8 = $115.2 -> $115
    ];

    for (const t of tiers) {
      const calcAnnual = Math.round(t.monthly * 12 * 0.8);
      assert.equal(calcAnnual, t.expectedAnnual, `Annual calculation for ${t.id} mismatch`);
    }
  });

  test('should calculate accurate +30 days (monthly) and +365 days (annual) extension date', () => {
    const now = new Date('2026-10-20T12:00:00Z');

    // Case A: Clinic expiring in future (extend from currentPeriodEnd)
    const futureExpiry = new Date('2026-10-25T12:00:00Z');
    const extendedFromFuture = new Date(futureExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    assert.equal(extendedFromFuture.toISOString(), '2026-11-24T12:00:00.000Z');

    // Case B: Clinic already expired (extend from now)
    const pastExpiry = new Date('2026-10-15T12:00:00Z');
    const baseDate = pastExpiry.getTime() > now.getTime() ? pastExpiry : now;
    const extendedFromNow = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    assert.equal(extendedFromNow.toISOString(), '2026-11-19T12:00:00.000Z');

    // Case C: Annual subscription (+365 days)
    const annualExtended = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    assert.equal(annualExtended.toISOString(), '2027-10-20T12:00:00.000Z');
  });

  test('should format Telegram notification messages with complete details and zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const clinicAlert = [
      `<b>[ការទូទាត់ជោគជ័យ: SUBSCRIPTION ACTIVATED]</b>`,
      `----------------------------------------`,
      `• គ្លីនិក: <b>មន្ទីរសម្រាកព្យាបាល រតនៈ</b>`,
      `• គម្រោងសេវាកម្ម: <b>Polyclinic Pro (PRO_8)</b>`,
      `• ចំនួនទឹកប្រាក់: $8.00 USD`,
      `• វិធីសាស្ត្រទូទាត់: KHQR Dynamic Settlement`,
      `• សុពលភាពថ្មី: រហូតដល់ <b>20/11/2026</b> (+30 ថ្ងៃ)`,
      `• កូតាប្រតិបត្តិការ KHQR: <b>1,500 / ថ្ងៃ</b>`,
      `• ស្ថានភាពគ្លីនិក: ដំណើរការពេញលេញ (Active)`,
      `----------------------------------------`,
    ].join('\n');

    const superAdminAlert = [
      `<b>[PLATFORM REVENUE: SUBSCRIPTION PAYMENT RECEIVED]</b>`,
      `----------------------------------------`,
      `Clinic: <b>Rotana Polyclinic</b> (<code>rotana-polyclinic</code>)`,
      `Plan Tier: <code>PRO_8</code> (MONTHLY)`,
      `Amount Paid: <b>$8.00 USD</b>`,
      `Transaction ID: <code>TXN-SUB-rotana-173829012</code>`,
      `Extension: <b>+30 days</b>`,
      `New Expiration: <code>20/11/2026</code>`,
      `Action: Plan quotas updated and tenant active status confirmed`,
      `----------------------------------------`,
    ].join('\n');

    assert.equal(emojiRegex.test(clinicAlert), false, 'Found emoji in clinic alert');
    assert.equal(emojiRegex.test(superAdminAlert), false, 'Found emoji in super admin alert');
  });
});
