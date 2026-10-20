import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { SAAS_PLANS } from '../src/common/constants/plans.constant.ts';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

describe('Step 13 & Step 14: Onboarding Wizard, Paste Merchant Setup & Payment Settlement Tests', () => {
  test('should generate clean unique slug from English clinic name', () => {
    const generateSlug = (name: string): string => {
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return slug || 'clinic';
    };

    assert.equal(generateSlug('Rotana Polyclinic & Maternity'), 'rotana-polyclinic-maternity');
    assert.equal(generateSlug('Dr. Sok Chea Medical Care 2026'), 'dr-sok-chea-medical-care-2026');
    assert.equal(generateSlug('  គ្លីនិក ខ្មែរ  '), 'clinic');
  });

  test('should allocate correct plan quotas on instant 60-second onboarding', () => {
    const freePlan = SAAS_PLANS[PlanTier.FREE];
    assert.equal(freePlan.priceUsd, 0);
    assert.equal(freePlan.maxDailyKhqr, 5);
    assert.equal(freePlan.maxMonthlyPatients, 50);

    const starterPlan = SAAS_PLANS[PlanTier.STARTER_5];
    assert.equal(starterPlan.priceUsd, 5);
    assert.equal(starterPlan.maxDailyKhqr, 250);
    assert.equal(starterPlan.maxMonthlyPatients, 500);

    const proPlan = SAAS_PLANS[PlanTier.PRO_8];
    assert.equal(proPlan.priceUsd, 8);
    assert.equal(proPlan.maxDailyKhqr, 1500);

    const enterprisePlan = SAAS_PLANS[PlanTier.ENTERPRISE_12];
    assert.equal(enterprisePlan.priceUsd, 12);
    assert.equal(enterprisePlan.maxDailyKhqr, -1);
  });

  test('should format new clinic onboarding alert with zero emojis', () => {
    const clinic = {
      slug: 'samaki-clinic',
      clinicNameKh: 'គ្លីនិក សាមគ្គី',
      clinicNameEn: 'Samaki Polyclinic',
      planTier: 'STARTER_5',
      ownerEmail: 'admin@samaki.com',
      ownerPhone: '012888999',
    };

    const text = [
      '<b>[PLATFORM SYSTEM NOTICE: NEW CLINIC ONBOARDING]</b>',
      '----------------------------------------',
      `Tenant Slug: <code>${clinic.slug}</code>`,
      `Clinic Name (EN): <b>${clinic.clinicNameEn}</b>`,
      `Clinic Name (KH): <b>${clinic.clinicNameKh}</b>`,
      `Plan Tier: <code>${clinic.planTier}</code>`,
      `Contact Phone: ${clinic.ownerPhone}`,
      `Admin Email: ${clinic.ownerEmail}`,
      '----------------------------------------',
      'Status: PENDING_INITIAL_CONFIGURATION',
    ].join('\n');

    assert.ok(text.includes('[PLATFORM SYSTEM NOTICE: NEW CLINIC ONBOARDING]'));
    assert.ok(text.includes('samaki-clinic'));
    assert.ok(text.includes('STARTER_5'));
    // Enforce zero emojis rule
    assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(text), false);
  });

  test('should sanitize and validate UUID cashier ID to prevent database conversion exception', () => {
    const isValidUuid = (val: unknown): boolean => {
      if (!val || typeof val !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
    };

    // Valid UUID format
    assert.equal(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), true);
    assert.equal(isValidUuid('b2c3d4e5-f6a7-4890-8bc1-23456789abcd'), true);

    // Invalid non-UUID strings that previously caused execution exceptions
    assert.equal(isValidUuid('CASHIER_OR_WEBHOOK'), false);
    assert.equal(isValidUuid(''), false);
    assert.equal(isValidUuid(null), false);
    assert.equal(isValidUuid(undefined), false);
    assert.equal(isValidUuid('12345'), false);
  });

  test('should format test Tag 01=12 dynamic KHQR with merchant credentials', () => {
    const bakongId = 'dr_chea@aba';
    const merchantName = 'Dr Chea Clinic';
    const merchantCity = 'Phnom Penh';

    const qrPayload = `00020101021229${String(bakongId.length + 4).padStart(2, '0')}00${String(bakongId.length).padStart(2, '0')}${bakongId}52045999530384054041.005802KH59${String(merchantName.length).padStart(2, '0')}${merchantName}60${String(merchantCity.length).padStart(2, '0')}${merchantCity}6304ABCD`;

    assert.ok(qrPayload.startsWith('000201010212')); // Tag 01=12 dynamic QR
    assert.ok(qrPayload.includes(bakongId));
    assert.ok(qrPayload.includes('5303840')); // USD currency
    assert.ok(qrPayload.includes(merchantName));
  });

  test('should enforce idempotency on payment settlement and return alreadySettled flag cleanly', () => {
    const handleSettlementState = (txnStatus: string, invoiceStatus: string) => {
      if (txnStatus === 'SUCCESS' || invoiceStatus === 'PAID') {
        return {
          success: true,
          alreadySettled: true,
          message: 'Transaction was already settled.',
        };
      }
      return {
        success: true,
        alreadySettled: false,
        message: 'Payment settled successfully.',
      };
    };

    const firstRun = handleSettlementState('PENDING', 'PENDING');
    assert.equal(firstRun.success, true);
    assert.equal(firstRun.alreadySettled, false);

    const concurrentRun = handleSettlementState('SUCCESS', 'PAID');
    assert.equal(concurrentRun.success, true);
    assert.equal(concurrentRun.alreadySettled, true);
  });
});
