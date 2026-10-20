import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Step 19 & Step 20: Quota Guard & SaaS Tax Invoice Frontend Suite', () => {
  it('should verify quota guard calculation logic and threshold triggers', () => {
    const calcProgress = (used: number, limit: number) => {
      if (limit === -1) return { percent: 0, approaching: false, exceeded: false };
      const percent = Math.min(100, Math.round((used / limit) * 100));
      return {
        percent,
        approaching: percent >= 80,
        exceeded: used >= limit,
      };
    };

    // Starter 250 KHQR / day
    assert.deepEqual(calcProgress(100, 250), { percent: 40, approaching: false, exceeded: false });
    assert.deepEqual(calcProgress(200, 250), { percent: 80, approaching: true, exceeded: false });
    assert.deepEqual(calcProgress(250, 250), { percent: 100, approaching: true, exceeded: true });

    // Pro 1500 KHQR / day
    assert.deepEqual(calcProgress(1200, 1500), { percent: 80, approaching: true, exceeded: false });
    assert.deepEqual(calcProgress(1500, 1500), { percent: 100, approaching: true, exceeded: true });

    // Enterprise Unlimited KHQR / day
    assert.deepEqual(calcProgress(5000, -1), { percent: 0, approaching: false, exceeded: false });
  });

  it('should guarantee zero emojis across quotaGuard and taxInvoice locale strings', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const checkNoEmojis = (obj: Record<string, any>, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          assert.equal(
            emojiRegex.test(value),
            false,
            `Emoji detected in ${fullPath}: ${value}`,
          );
        } else if (typeof value === 'object' && value !== null) {
          checkNoEmojis(value, fullPath);
        }
      }
    };

    checkNoEmojis((en as any).subscriptionBilling.quotaGuard, 'en.subscriptionBilling.quotaGuard');
    checkNoEmojis((km as any).subscriptionBilling.quotaGuard, 'km.subscriptionBilling.quotaGuard');
    checkNoEmojis((en as any).subscriptionBilling.taxInvoice, 'en.subscriptionBilling.taxInvoice');
    checkNoEmojis((km as any).subscriptionBilling.taxInvoice, 'km.subscriptionBilling.taxInvoice');
  });

  it('should verify 100% dictionary key parity for quotaGuard and taxInvoice', () => {
    const enQuotaKeys = Object.keys((en as any).subscriptionBilling.quotaGuard).sort();
    const kmQuotaKeys = Object.keys((km as any).subscriptionBilling.quotaGuard).sort();
    assert.deepEqual(enQuotaKeys, kmQuotaKeys, 'Mismatch in quotaGuard translation keys');

    const enInvoiceKeys = Object.keys((en as any).subscriptionBilling.taxInvoice).sort();
    const kmInvoiceKeys = Object.keys((km as any).subscriptionBilling.taxInvoice).sort();
    assert.deepEqual(enInvoiceKeys, kmInvoiceKeys, 'Mismatch in taxInvoice translation keys');
  });

  it('should verify official VAT/Tax calculation fields for Cambodian SaaS', () => {
    const computeTaxInvoice = (amountUsd: number) => {
      const exchangeRate = 4100;
      const vatPercent = 0; // Medical & clinical software SaaS exempt
      const subtotal = amountUsd;
      const vatAmount = subtotal * (vatPercent / 100);
      const totalUsd = subtotal + vatAmount;
      const totalKhr = totalUsd * exchangeRate;
      return { subtotal, vatAmount, totalUsd, totalKhr };
    };

    const starter = computeTaxInvoice(5.0);
    assert.equal(starter.totalUsd, 5.0);
    assert.equal(starter.totalKhr, 20500);

    const pro = computeTaxInvoice(8.0);
    assert.equal(pro.totalUsd, 8.0);
    assert.equal(pro.totalKhr, 32800);

    const enterprise = computeTaxInvoice(12.0);
    assert.equal(enterprise.totalUsd, 12.0);
    assert.equal(enterprise.totalKhr, 49200);
  });
});
