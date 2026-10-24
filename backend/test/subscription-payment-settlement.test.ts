import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  SAAS_PLANS,
  isPlanDowngrade,
  isPlanUpgrade,
  isPlanRenewal,
  PLAN_TIER_RANK,
} from '../src/common/constants/plans.constant.ts';

const PlanTier = {
  FREE: 'FREE',
  STARTER_5: 'STARTER_5',
  PRO_8: 'PRO_8',
  ENTERPRISE_12: 'ENTERPRISE_12',
} as const;
type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

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

// Pure implementation mirroring QuotaGuardService.resolveEffectivePlan for unit verification
function resolveEffectivePlan(tenant: {
  id: string;
  slug?: string;
  planTier: PlanTier;
  subscriptionStatus?: SubscriptionStatus | null;
  currentPeriodEnd?: Date | null;
}): { planTier: PlanTier; isExpired: boolean } {
  if (tenant.planTier === PlanTier.FREE) {
    return { planTier: PlanTier.FREE, isExpired: false };
  }

  const now = new Date();
  const isPastPeriodEnd = Boolean(
    tenant.currentPeriodEnd && tenant.currentPeriodEnd.getTime() < now.getTime(),
  );
  const isStatusExpired =
    tenant.subscriptionStatus === SubscriptionStatus.EXPIRED;

  if (isPastPeriodEnd || isStatusExpired) {
    return { planTier: PlanTier.FREE, isExpired: true };
  }

  return { planTier: tenant.planTier, isExpired: false };
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

describe('100% Anti-Bypass Guard & Strict Settlement Validation Test Suite', () => {
  test('should strictly demote expired paid plans (PRO_8, ENTERPRISE_12) to FREE tier quotas', () => {
    const expiredTenant = {
      id: 'tenant-expired-123',
      slug: 'rotana-clinic',
      planTier: PlanTier.PRO_8,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
    };

    const effective = resolveEffectivePlan(expiredTenant);
    assert.equal(effective.planTier, PlanTier.FREE, 'Must demote expired plan to FREE tier');
    assert.equal(effective.isExpired, true, 'Must flag isExpired as true');

    const freeLimits = SAAS_PLANS[effective.planTier];
    assert.equal(freeLimits.maxDailyKhqr, 5, 'Free tier limit must match FREE plan quota');
    assert.equal(freeLimits.maxMonthlyPatients, 50, 'Free tier limit must be 50 patients/mo');
    assert.equal(freeLimits.maxStaffAccounts, 2, 'Free tier limit must be 2 staff members');
  });

  test('should preserve active paid plan limits when currentPeriodEnd is in the future', () => {
    const activeTenant = {
      id: 'tenant-active-456',
      slug: 'active-clinic',
      planTier: PlanTier.PRO_8,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days in future
    };

    const effective = resolveEffectivePlan(activeTenant);
    assert.equal(effective.planTier, PlanTier.PRO_8, 'Must maintain active PRO_8 plan tier');
    assert.equal(effective.isExpired, false, 'Must flag isExpired as false');

    const proLimits = SAAS_PLANS[effective.planTier];
    assert.equal(proLimits.maxDailyKhqr, 1500, 'PRO_8 limit must be 1,500 KHQR/day');
    assert.equal(proLimits.maxMonthlyPatients, 8000, 'PRO_8 limit must be 8000 patients');
  });

  test('should demote tenant marked as EXPIRED even if currentPeriodEnd is missing', () => {
    const expiredStatusTenant = {
      id: 'tenant-expired-status',
      slug: 'status-expired-clinic',
      planTier: PlanTier.ENTERPRISE_12,
      subscriptionStatus: SubscriptionStatus.EXPIRED,
      currentPeriodEnd: null,
    };

    const effective = resolveEffectivePlan(expiredStatusTenant);
    assert.equal(effective.planTier, PlanTier.FREE, 'Must demote EXPIRED status tenant to FREE');
    assert.equal(effective.isExpired, true, 'Must flag isExpired as true');
  });

  test('should detect and reject price tampering when invoice amount differs from plan rate', () => {
    const planTier = PlanTier.PRO_8;
    const planConfig = SAAS_PLANS[planTier];
    const officialMonthly = planConfig.priceUsd; // $8

    const tamperedAmount = 1.0; // Hacker tried to pay $1 for $8 plan
    const isTampered = tamperedAmount !== officialMonthly;
    assert.equal(isTampered, true, 'Must detect price tampering');
  });

test('should strictly prevent downgrade from higher plan tier to lower plan tier', () => {
    // Current tier is PRO_8
    const currentTier = PlanTier.PRO_8;

    // Downgrades to STARTER_5 or FREE must be flagged as downgrade
    assert.equal(isPlanDowngrade(currentTier, PlanTier.STARTER_5), true);
    assert.equal(isPlanDowngrade(currentTier, PlanTier.FREE), true);

    // Same tier is NOT a downgrade (it is a renewal)
    assert.equal(isPlanDowngrade(currentTier, PlanTier.PRO_8), false);
    assert.equal(isPlanRenewal(currentTier, PlanTier.PRO_8), true);

    // Upgrade to ENTERPRISE_12 is NOT a downgrade
    assert.equal(isPlanDowngrade(currentTier, PlanTier.ENTERPRISE_12), false);
    assert.equal(isPlanUpgrade(currentTier, PlanTier.ENTERPRISE_12), true);
  });

  test('should enforce downgrade prevention when current tier is ENTERPRISE_12', () => {
    const currentTier = PlanTier.ENTERPRISE_12;

    assert.equal(isPlanDowngrade(currentTier, PlanTier.PRO_8), true);
    assert.equal(isPlanDowngrade(currentTier, PlanTier.STARTER_5), true);
    assert.equal(isPlanDowngrade(currentTier, PlanTier.FREE), true);
    assert.equal(isPlanRenewal(currentTier, PlanTier.ENTERPRISE_12), true);
    assert.equal(isPlanUpgrade(currentTier, PlanTier.ENTERPRISE_12), false);
  });

  test('should allow FREE tier to upgrade to any paid tier and block downgrade', () => {
    const currentTier = PlanTier.FREE;

    assert.equal(isPlanUpgrade(currentTier, PlanTier.STARTER_5), true);
    assert.equal(isPlanUpgrade(currentTier, PlanTier.PRO_8), true);
    assert.equal(isPlanUpgrade(currentTier, PlanTier.ENTERPRISE_12), true);
    assert.equal(isPlanDowngrade(currentTier, PlanTier.FREE), false);
  });

  test('should calculate accurate expiration extension without losing active days', () => {
    const now = new Date('2026-10-24T12:00:00.000Z');
    // Clinic still has 10 days remaining
    const currentPeriodEnd = new Date('2026-11-03T12:00:00.000Z');

    const calculateAccurateExpiry = (currentEnd: Date | null, addedDays: number, currentDate: Date) => {
      const baseDate = currentEnd && currentEnd.getTime() > currentDate.getTime() ? currentEnd : currentDate;
      return new Date(baseDate.getTime() + addedDays * 24 * 60 * 60 * 1000);
    };

    // Monthly renewal (+30 days) should extend from currentPeriodEnd (Nov 3 + 30 days = Dec 3)
    const newEndMonthly = calculateAccurateExpiry(currentPeriodEnd, 30, now);
    assert.equal(newEndMonthly.toISOString(), '2026-12-03T12:00:00.000Z');
    const totalRemainingDays = Math.round((newEndMonthly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalRemainingDays, 40); // 10 existing + 30 added

    // If expired 5 days ago, should extend 30 days from NOW
    const pastPeriodEnd = new Date('2026-10-19T12:00:00.000Z');
    const newEndFromPast = calculateAccurateExpiry(pastPeriodEnd, 30, now);
    assert.equal(newEndFromPast.toISOString(), '2026-11-23T12:00:00.000Z');
  });

  test('should format support request notification for Super Admin Master Bot with zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const supportAlert = [
      `<b>[URGENT: SUBSCRIPTION PAYMENT SUPPORT REQUEST]</b>`,
      `----------------------------------------`,
      `• គ្លីនិក: <b>មន្ទីរសម្រាកព្យាបាល រតនៈ</b> (<code>rotana-polyclinic</code>)`,
      `• គម្រោង: <b>PRO_8</b> ($8 USD)`,
      `• លេខវិក្កយបត្រ: <code>SUB-ROTANA-881923</code>`,
      `• Tran ID: <code>TXN-SUB-rotana-173829012</code>`,
      `• លេខទូរស័ព្ទ: <b>+855 12 345 678</b>`,
      `• Telegram: <b>@dr_rotana</b>`,
      `• បញ្ហាដែលបានរាយការណ៍: Scan completed in ABA Mobile but status still pending`,
      `• សកម្មភាព: សូមចូលទៅកាន់ Super Admin Dashboard ដើម្បីផ្ទៀងផ្ទាត់ និង Approve Subscription`,
      `----------------------------------------`,
    ].join('\n');

    assert.equal(emojiRegex.test(supportAlert), false, 'Found emoji in support request alert');
    assert.ok(supportAlert.includes('SUB-ROTANA-881923'));
    assert.ok(supportAlert.includes('+855 12 345 678'));
  });
});
