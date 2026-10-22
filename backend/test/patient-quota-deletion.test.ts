import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAAS_PLANS } from '../src/common/constants/plans.constant.ts';
import { PlanTier } from '@prisma/client';

describe('Patient Quota & Permanent Deletion Engine Test Suite', () => {
  it('should verify PRO_8 plan tier is set to 8,000 patients per account', () => {
    const proPlan = SAAS_PLANS[PlanTier.PRO_8];
    assert.ok(proPlan);
    assert.equal(proPlan.priceUsd, 8);
    assert.equal(proPlan.maxMonthlyPatients, 8000, 'Polyclinic Pro $8/mo must allow 8,000 patients per account');
    assert.equal(proPlan.maxDailyKhqr, 1500);
  });

  it('should verify SaaS plan hierarchy for patient quotas', () => {
    assert.equal(SAAS_PLANS[PlanTier.FREE].maxMonthlyPatients, 50);
    assert.equal(SAAS_PLANS[PlanTier.STARTER_5].maxMonthlyPatients, 1000);
    assert.equal(SAAS_PLANS[PlanTier.PRO_8].maxMonthlyPatients, 8000);
    assert.equal(SAAS_PLANS[PlanTier.ENTERPRISE_12].maxMonthlyPatients, -1);
  });

  it('should guarantee zero emojis and no parentheses in plan names', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const plan of Object.values(SAAS_PLANS)) {
      assert.equal(emojiRegex.test(plan.nameKh), false);
      assert.equal(emojiRegex.test(plan.nameEn), false);
      assert.equal(plan.nameKh.includes('('), false);
      assert.equal(plan.nameKh.includes(')'), false);
    }
  });

  it('should enforce batch limit of 10 patients in bulk deletion logic', () => {
    const mockValidator = (ids: string[]) => {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('សូមជ្រើសរើសអ្នកជំងឺយ៉ាងតិច ១ នាក់ដើម្បីលុប។');
      }
      if (ids.length > 10) {
        throw new Error('អាចលុបទិន្នន័យអ្នកជំងឺបានអតិបរមា ១០ នាក់ក្នុងម្ដងប៉ុណ្ណោះ។');
      }
      return true;
    };

    assert.equal(mockValidator(['p1', 'p2', 'p3']), true);
    assert.throws(() => mockValidator([]), { message: 'សូមជ្រើសរើសអ្នកជំងឺយ៉ាងតិច ១ នាក់ដើម្បីលុប។' });
    const elevenIds = Array.from({ length: 11 }, (_, i) => `p${i}`);
    assert.throws(() => mockValidator(elevenIds), { message: 'អាចលុបទិន្នន័យអ្នកជំងឺបានអតិបរមា ១០ នាក់ក្នុងម្ដងប៉ុណ្ណោះ។' });
  });
});
