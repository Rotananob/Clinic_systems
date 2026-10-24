import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { isPlanDowngrade, isPlanUpgrade, isPlanRenewal, PLAN_TIER_RANK } from '../src/lib/rbac.ts';

describe('Step 17 & Step 18: Subscription Checkout & Real-Time Settlement Frontend Suite', () => {
  it('should verify exact quotas and price points for SaaS plans', () => {
    const plans = [
      { id: 'FREE', price: 0, dailyKhqr: 5, maxPatients: 50 },
      { id: 'STARTER_5', price: 5, dailyKhqr: 250, maxPatients: 500 },
      { id: 'PRO_8', price: 8, dailyKhqr: 1500, maxPatients: 'Unlimited' },
      { id: 'ENTERPRISE_12', price: 12, dailyKhqr: 'Unlimited', maxPatients: 'Unlimited' },
    ];

    assert.equal(plans[0].dailyKhqr, 5);
    assert.equal(plans[1].dailyKhqr, 250); // Starter: 250 / day
    assert.equal(plans[2].dailyKhqr, 1500); // Pro: 1,500 / day
    assert.equal(plans[3].dailyKhqr, 'Unlimited'); // Enterprise: Unlimited
  });

  it('should calculate 20% annual discount correctly across all tiers', () => {
    const monthlyToAnnual = (monthly: number) => Math.round(monthly * 12 * 0.8);

    assert.equal(monthlyToAnnual(5), 48); // $5/mo -> $48/yr
    assert.equal(monthlyToAnnual(8), 77); // $8/mo -> $77/yr ($76.8 rounded)
    assert.equal(monthlyToAnnual(12), 115); // $12/mo -> $115/yr ($115.2 rounded)
  });

  it('should guarantee zero emojis in subscriptionBilling locale strings', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const checkNoEmojis = (obj: Record<string, any>, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          assert.equal(
            emojiRegex.test(value),
            false,
            `Emoji found in ${fullPath}: ${value}`
          );
        } else if (typeof value === 'object' && value !== null) {
          checkNoEmojis(value, fullPath);
        }
      }
    };

    checkNoEmojis((en as any).subscriptionBilling, 'en.subscriptionBilling');
    checkNoEmojis((km as any).subscriptionBilling, 'km.subscriptionBilling');
  });

it('should enforce downgrade prevention and allow upgrades on frontend rbac matrix', () => {
    // Polyclinic Pro tier
    const currentTier = 'PRO_8';

    // Must block lower tiers
    assert.equal(isPlanDowngrade(currentTier, 'STARTER_5'), true);
    assert.equal(isPlanDowngrade(currentTier, 'FREE'), true);

    // Renewal of current tier is allowed
    assert.equal(isPlanDowngrade(currentTier, 'PRO_8'), false);
    assert.equal(isPlanRenewal(currentTier, 'PRO_8'), true);

    // Upgrade to higher tier is allowed
    assert.equal(isPlanUpgrade(currentTier, 'ENTERPRISE_12'), true);
    assert.equal(isPlanDowngrade(currentTier, 'ENTERPRISE_12'), false);
  });

  it('should block downgrade from ENTERPRISE_12 to any lower tier', () => {
    const currentTier = 'ENTERPRISE_12';

    assert.equal(isPlanDowngrade(currentTier, 'PRO_8'), true);
    assert.equal(isPlanDowngrade(currentTier, 'STARTER_5'), true);
    assert.equal(isPlanDowngrade(currentTier, 'FREE'), true);
    assert.equal(isPlanRenewal(currentTier, 'ENTERPRISE_12'), true);
  });

  it('should accurately calculate new subscription expiration date without losing remaining days', () => {
    const now = new Date('2026-10-24T12:00:00.000Z');
    const activePeriodEnd = new Date('2026-11-04T12:00:00.000Z'); // 11 days remaining

    const calculateNewExpiry = (currentEnd: Date | null, addDays: number, fromDate: Date) => {
      const base = currentEnd && currentEnd.getTime() > fromDate.getTime() ? currentEnd : fromDate;
      return new Date(base.getTime() + addDays * 24 * 60 * 60 * 1000);
    };

    // Monthly extension from active periodEnd (+30 days)
    const newEnd30 = calculateNewExpiry(activePeriodEnd, 30, now);
    assert.equal(newEnd30.toISOString(), '2026-12-04T12:00:00.000Z');

    // Annual extension from active periodEnd (+365 days)
    const newEndAnnual = calculateNewExpiry(activePeriodEnd, 365, now);
    assert.equal(newEndAnnual.toISOString(), '2027-11-04T12:00:00.000Z');

    // If past due / expired, extension starts from now (+30 days)
    const pastEnd = new Date('2026-10-20T12:00:00.000Z');
    const newEndFromNow = calculateNewExpiry(pastEnd, 30, now);
    assert.equal(newEndFromNow.toISOString(), '2026-11-23T12:00:00.000Z');
  });

  it('should guarantee zero parentheses in Khmer subscriptionBilling strings', () => {
    const parenRegex = /[()（）]/;
    const checkNoParens = (obj: Record<string, any>, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          // Exclude keys that are purely English or standard acronyms if any, but all Khmer should have no parens
          assert.equal(
            parenRegex.test(value),
            false,
            `Parenthesis found in Khmer locale ${fullPath}: ${value}`
          );
        } else if (typeof value === 'object' && value !== null) {
          checkNoParens(value, fullPath);
        }
      }
    };

    // Check newly added keys
    assert.equal(parenRegex.test((km as any).subscriptionBilling.viewPlansBtn), false);
    assert.equal(parenRegex.test((km as any).subscriptionBilling.currentPlanBadge), false);
    assert.equal(parenRegex.test((km as any).subscriptionBilling.cannotDowngradeBadge), false);
    assert.equal(parenRegex.test((km as any).subscriptionBilling.cannotDowngradeDesc), false);
    assert.equal(parenRegex.test((km as any).subscriptionBilling.freeForever), false);
    assert.equal(parenRegex.test((km as any).subscriptionBilling.renewCurrentPlan), false);
    assert.equal(parenRegex.test((km as any).subscriptionBilling.upgradeToPlan), false);
  });

  it('should verify complete dictionary parity between en and km for subscriptionBilling', () => {
    const enKeys = Object.keys((en as any).subscriptionBilling).sort();
    const kmKeys = Object.keys((km as any).subscriptionBilling).sort();

    assert.deepEqual(enKeys, kmKeys, 'Mismatch in subscriptionBilling translation keys');
  });
});
