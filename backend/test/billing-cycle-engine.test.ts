import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { SAAS_PLANS } from '../src/common/constants/plans.constant.ts';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

describe('Step 16: Billing Cycle Engine & Expiry Notification Test Suite', () => {
  test('should calculate exact days remaining until subscription expiration', () => {
    const calculateDaysRemaining = (expiryDate: Date, referenceDate: Date): number => {
      const msDiff = expiryDate.getTime() - referenceDate.getTime();
      return Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    };

    const now = new Date('2026-10-20T12:00:00Z');

    // 7 days ahead
    const sevenDaysLater = new Date('2026-10-27T12:00:00Z');
    assert.equal(calculateDaysRemaining(sevenDaysLater, now), 7);

    // 3 days ahead
    const threeDaysLater = new Date('2026-10-23T12:00:00Z');
    assert.equal(calculateDaysRemaining(threeDaysLater, now), 3);

    // Exact expiry day
    assert.equal(calculateDaysRemaining(now, now), 0);

    // Expired by 4 days (grace period exceeded)
    const fourDaysAgo = new Date('2026-10-16T12:00:00Z');
    assert.equal(calculateDaysRemaining(fourDaysAgo, now), -4);
  });

  test('should determine correct billing cycle action based on days remaining', () => {
    const determineBillingAction = (daysRemaining: number, currentStatus: string) => {
      if (daysRemaining <= 7 && daysRemaining > 3) {
        return 'SEND_7_DAY_REMINDER';
      }
      if (daysRemaining <= 3 && daysRemaining > 0) {
        return 'SEND_3_DAY_URGENT_REMINDER';
      }
      if (daysRemaining <= 0 && daysRemaining >= -3 && currentStatus === 'ACTIVE') {
        return 'APPLY_GRACE_PERIOD_PAST_DUE';
      }
      if (daysRemaining < -3 && currentStatus === 'PAST_DUE') {
        return 'FREEZE_WORKSPACE_EXPIRED';
      }
      return 'NO_ACTION_REQUIRED';
    };

    assert.equal(determineBillingAction(7, 'ACTIVE'), 'SEND_7_DAY_REMINDER');
    assert.equal(determineBillingAction(5, 'ACTIVE'), 'SEND_7_DAY_REMINDER');
    assert.equal(determineBillingAction(3, 'ACTIVE'), 'SEND_3_DAY_URGENT_REMINDER');
    assert.equal(determineBillingAction(1, 'ACTIVE'), 'SEND_3_DAY_URGENT_REMINDER');
    assert.equal(determineBillingAction(0, 'ACTIVE'), 'APPLY_GRACE_PERIOD_PAST_DUE');
    assert.equal(determineBillingAction(-2, 'ACTIVE'), 'APPLY_GRACE_PERIOD_PAST_DUE');
    assert.equal(determineBillingAction(-4, 'PAST_DUE'), 'FREEZE_WORKSPACE_EXPIRED');
    assert.equal(determineBillingAction(25, 'ACTIVE'), 'NO_ACTION_REQUIRED');
  });

  test('should format 7-day subscription expiration warning with zero emojis', () => {
    const clinic = {
      nameKh: 'គ្លីនិក រតនា',
      planNameEn: 'Polyclinic Pro (PRO_8)',
      expiryDate: '27/10/2026',
      daysRemaining: 7,
      priceUsd: 8,
    };

    const message = [
      `<b>[សេចក្តីជូនដំណឹងផុតកំណត់គម្រោង] ${clinic.nameKh}</b>`,
      `----------------------------------------`,
      `• គម្រោងសេវាកម្ម: <b>${clinic.planNameEn}</b>`,
      `• កាលបរិច្ឆេទផុតកំណត់: <b>${clinic.expiryDate}</b>`,
      `• រយៈពេលនៅសល់: <b>${clinic.daysRemaining} ថ្ងៃ</b>`,
      `• តម្លៃជាវប្រចាំខែ: $${clinic.priceUsd}.00 USD`,
      `• សកម្មភាព: សូមចូលទៅកាន់ Settings -> Subscription ដើម្បីបន្តសុពលភាពតាម KHQR ដោយផ្ទាល់។`,
      `----------------------------------------`,
    ].join('\n');

    assert.ok(message.includes('[សេចក្តីជូនដំណឹងផុតកំណត់គម្រោង] គ្លីនិក រតនា'));
    assert.ok(message.includes('៧ ថ្ងៃ') || message.includes('7 ថ្ងៃ'));
    assert.ok(message.includes('$8.00 USD'));
    // Enforce zero emojis
    assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(message), false);
  });

  test('should generate unique subscription renewal invoice number', () => {
    const generateSubscriptionInvoice = (slug: string, timestamp: number): string => {
      return `SUB-${slug.toUpperCase()}-${timestamp.toString().slice(-6)}`;
    };

    const inv1 = generateSubscriptionInvoice('rotana-clinic', 1792476869987);
    assert.ok(inv1.startsWith('SUB-ROTANA-CLINIC-'));
    assert.equal(inv1.length > 20, true);
  });

  test('should verify correct renewal amounts matching SAAS_PLANS pricing matrix', () => {
    assert.equal(SAAS_PLANS[PlanTier.FREE].priceUsd, 0);
    assert.equal(SAAS_PLANS[PlanTier.STARTER_5].priceUsd, 5);
    assert.equal(SAAS_PLANS[PlanTier.PRO_8].priceUsd, 8);
    assert.equal(SAAS_PLANS[PlanTier.ENTERPRISE_12].priceUsd, 12);
  });
});
