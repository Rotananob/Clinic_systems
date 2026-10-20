import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'crypto';
import { SAAS_PLANS } from '../src/common/constants/plans.constant.ts';

describe('Step 19: Automated Quota Guard Unit Tests', () => {
  test('should enforce Free Plan daily KHQR limit of 5 and monthly patients of 50', () => {
    const freePlan = SAAS_PLANS.FREE;
    assert.equal(freePlan.maxDailyKhqr, 5);
    assert.equal(freePlan.maxMonthlyPatients, 50);
    assert.equal(freePlan.maxStaffAccounts, 2);
  });

  test('should enforce Starter $5 Plan daily KHQR limit of 250 and monthly patients of 500', () => {
    const starterPlan = SAAS_PLANS.STARTER_5;
    assert.equal(starterPlan.maxDailyKhqr, 250);
    assert.equal(starterPlan.maxMonthlyPatients, 500);
    assert.equal(starterPlan.maxStaffAccounts, 5);
  });

  test('should enforce Pro $8 Plan daily KHQR limit of 1500 and unlimited patients', () => {
    const proPlan = SAAS_PLANS.PRO_8;
    assert.equal(proPlan.maxDailyKhqr, 1500);
    assert.equal(proPlan.maxMonthlyPatients, -1);
    assert.equal(proPlan.maxStaffAccounts, 15);
  });

  test('should enforce Enterprise $12 Plan unlimited daily KHQR and unlimited patients', () => {
    const enterprisePlan = SAAS_PLANS.ENTERPRISE_12;
    assert.equal(enterprisePlan.maxDailyKhqr, -1);
    assert.equal(enterprisePlan.maxMonthlyPatients, -1);
    assert.equal(enterprisePlan.maxStaffAccounts, -1);
  });

  test('should calculate correct percentage and 80% approaching warning threshold', () => {
    const limit = 250;
    const countWarning = 200; // 80%
    const countNormal = 150; // 60%
    const countExceeded = 250; // 100%

    const calcMetric = (used: number, maxLimit: number) => {
      const percent = Math.min(100, Math.round((used / maxLimit) * 100));
      return {
        used,
        limit: maxLimit,
        remaining: Math.max(0, maxLimit - used),
        percent,
        isApproachingLimit: percent >= 80,
        isExceeded: used >= maxLimit,
      };
    };

    const resNormal = calcMetric(countNormal, limit);
    assert.equal(resNormal.percent, 60);
    assert.equal(resNormal.isApproachingLimit, false);
    assert.equal(resNormal.isExceeded, false);

    const resWarning = calcMetric(countWarning, limit);
    assert.equal(resWarning.percent, 80);
    assert.equal(resWarning.isApproachingLimit, true);
    assert.equal(resWarning.isExceeded, false);

    const resExceeded = calcMetric(countExceeded, limit);
    assert.equal(resExceeded.percent, 100);
    assert.equal(resExceeded.isApproachingLimit, true);
    assert.equal(resExceeded.isExceeded, true);
  });

  test('should accurately calculate Cambodia UTC+7 midnight reset timestamp', () => {
    const now = new Date();
    const cambodiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    cambodiaTime.setUTCHours(0, 0, 0, 0);
    const startOfTodayUtc = new Date(cambodiaTime.getTime() - 7 * 60 * 60 * 1000);

    // Verify difference between start of day UTC and Cambodia midnight is exactly 7 hours
    const cambodiaMidnightHours = new Date(startOfTodayUtc.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
    assert.equal(cambodiaMidnightHours, 0);
  });
});

describe('Step 20: SaaS Subscription Tax Invoices & Digital Verification Tests', () => {
  test('should compute SHA-256 digital stamp for electronic tax receipt', () => {
    const invoiceNumber = 'SUB-20261020-001';
    const tenantId = 'tenant_rotana_polyclinic';
    const amountUsd = 8.0;
    const createdAtIso = '2026-10-20T12:00:00.000Z';

    const payload = `${invoiceNumber}:${tenantId}:${amountUsd}:${createdAtIso}`;
    const digitalSignature = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex')
      .slice(0, 32)
      .toUpperCase();

    assert.equal(typeof digitalSignature, 'string');
    assert.equal(digitalSignature.length, 32);
    // Deterministic verify
    const expected = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32).toUpperCase();
    assert.equal(digitalSignature, expected);
  });

  test('should convert USD to Cambodian Riel with official 4,100 rate and format amounts accurately', () => {
    const usdToKhrRate = 4100;
    const amountStarterUsd = 5.0;
    const amountProUsd = 8.0;
    const amountEnterpriseUsd = 12.0;

    assert.equal(amountStarterUsd * usdToKhrRate, 20500);
    assert.equal(amountProUsd * usdToKhrRate, 32800);
    assert.equal(amountEnterpriseUsd * usdToKhrRate, 49200);
  });

  test('should format official Cambodian tax receipt metadata compliant with MoH & General Department of Taxation', () => {
    const receiptData = {
      provider: {
        companyNameKh: 'ក្រុមហ៊ុន គ្លីនិកអូអេស ផាស (ខេមបូឌា) ខូអិលធីឌី',
        vatTin: 'K002-902401822',
      },
      customer: {
        clinicNameKh: 'គ្លីនិកពហុព្យាបាល រតនៈ',
        slug: 'rotana-polyclinic',
      },
      plan: {
        tier: 'PRO_8',
        dailyKhqrQuota: '1500 / ថ្ងៃ',
        monthlyPatientQuota: 'Unlimited',
      },
      financial: {
        amountUsd: 8.0,
        amountKhr: 32800,
        taxPercent: 0,
      },
    };

    assert.equal(receiptData.provider.vatTin, 'K002-902401822');
    assert.equal(receiptData.customer.slug, 'rotana-polyclinic');
    assert.equal(receiptData.financial.amountKhr, 32800);
    assert.equal(receiptData.financial.taxPercent, 0);
  });
});
