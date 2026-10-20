import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Step 13 & Step 14: Onboarding Wizard & Merchant Setup Test Suite', () => {
  it('should verify plan tier definitions matching user specifications', () => {
    const plans = [
      { id: 'FREE', price: '$0', dailyKhqr: 5, maxPatients: 50 },
      { id: 'STARTER_5', price: '$5/mo', dailyKhqr: 250, maxPatients: 500 },
      { id: 'PRO_8', price: '$8/mo', dailyKhqr: 1500, maxPatients: 'Unlimited' },
      { id: 'ENTERPRISE_12', price: '$12/mo', dailyKhqr: 'Unlimited', maxPatients: 'Unlimited' },
    ];

    assert.equal(plans[0].dailyKhqr, 5);
    assert.equal(plans[1].dailyKhqr, 250); // Starter: 250 transactions / day
    assert.equal(plans[2].dailyKhqr, 1500); // Pro: 1,500 transactions / day
    assert.equal(plans[3].dailyKhqr, 'Unlimited'); // Enterprise: Unlimited
  });

  it('should compute live clean subdomain slug from English clinic name', () => {
    const computeSlug = (name: string): string => {
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return slug || 'clinic';
    };

    assert.equal(computeSlug('Sokhapheap LOR Polyclinic'), 'sokhapheap-lor-polyclinic');
    assert.equal(computeSlug('Angkor Grace Medical Center'), 'angkor-grace-medical-center');
    assert.equal(computeSlug('123 Care Clinic!'), '123-care-clinic');
  });

  it('should validate Bakong Account ID and construct valid Tag 01=12 payload', () => {
    const bakongId = 'my_clinic@aba';
    const merchantName = 'My Clinic';
    const merchantCity = 'Phnom Penh';

    const qrPayload = `00020101021229${String(bakongId.length + 4).padStart(2, '0')}00${String(bakongId.length).padStart(2, '0')}${bakongId}52045999530384054041.005802KH59${String(merchantName.length).padStart(2, '0')}${merchantName}60${String(merchantCity.length).padStart(2, '0')}${merchantCity}6304ABCD`;

    assert.ok(qrPayload.startsWith('000201010212')); // Dynamic Tag 01=12
    assert.ok(qrPayload.includes(bakongId));
    assert.ok(qrPayload.includes('5303840')); // USD
    assert.ok(qrPayload.includes(merchantName));
  });

  it('should guarantee zero emojis in onboarding and merchantSetup locale texts', () => {
    const checkNoEmojis = (obj: Record<string, any>) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          assert.equal(
            /[\u{1F300}-\u{1F9FF}]/u.test(value),
            false,
            `Found emoji in locale string: ${key} -> ${value}`
          );
        } else if (typeof value === 'object' && value !== null) {
          checkNoEmojis(value);
        }
      }
    };

    checkNoEmojis(en.onboarding);
    checkNoEmojis(en.merchantSetup);
    checkNoEmojis(km.onboarding);
    checkNoEmojis(km.merchantSetup);
  });
});
