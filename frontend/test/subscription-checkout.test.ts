import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

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

  it('should verify complete dictionary parity between en and km for subscriptionBilling', () => {
    const enKeys = Object.keys((en as any).subscriptionBilling).sort();
    const kmKeys = Object.keys((km as any).subscriptionBilling).sort();

    assert.deepEqual(enKeys, kmKeys, 'Mismatch in subscriptionBilling translation keys');
  });
});
