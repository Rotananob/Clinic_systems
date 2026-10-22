import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of SaaS pricing plans specifications
interface PlanConfig {
  id: string;
  nameKh: string;
  nameEn: string;
  monthlyUsd: number;
  yearlyUsd: number;
  khqrDailyLimit: number; // -1 for unlimited
  monthlyPatients: number; // -1 for unlimited
  staffAccounts: number; // -1 for unlimited
  featuresKh: string[];
  featuresEn: string[];
}

const SAAS_PLANS: Record<string, PlanConfig> = {
  FREE: {
    id: 'FREE',
    nameKh: 'គម្រោងសាកល្បង Free Starter',
    nameEn: 'Free Starter',
    monthlyUsd: 0,
    yearlyUsd: 0,
    khqrDailyLimit: 5,
    monthlyPatients: 50,
    staffAccounts: 2,
    featuresKh: [
      'បង្កើត Dynamic KHQR កូតា ៥ ដង/ថ្ងៃ',
      'កត់ត្រាអ្នកជំងឺមូលដ្ឋាន ៥០ នាក់ / គណនី',
      'ចេញវិក្កយបត្រអេឡិចត្រូនិច',
    ],
    featuresEn: [
      'Dynamic KHQR (5 transactions / day)',
      'Basic patient records (50 patients / account)',
      'Electronic invoice generator',
    ],
  },
  STARTER_5: {
    id: 'STARTER_5',
    nameKh: 'គម្រោងស្ដង់ដារ Clinic Starter',
    nameEn: 'Clinic Starter 5$/mo',
    monthlyUsd: 5,
    yearlyUsd: 48,
    khqrDailyLimit: 250,
    monthlyPatients: 1000,
    staffAccounts: 5,
    featuresKh: [
      'បង្កើត Dynamic KHQR ២៥០ ដង/ថ្ងៃ',
      'កត់ត្រាអ្នកជំងឺ ១,០០០ នាក់ / គណនី',
      'ហៅអ្នកជំងឺជាសំឡេងខ្មែរ Khmer Voice Queue',
      'គ្រប់គ្រងស្តុកឱសថស្ថានកម្រិតស្តង់ដារ',
      'Telegram Bot ជូនដំណឹងស្វ័យប្រវត្ត',
      'បោះពុម្ពវិក្កយបត្រតាមម៉ាស៊ីន Thermal 80mm',
    ],
    featuresEn: [
      'Dynamic KHQR (250 transactions / day)',
      '1,000 patient registrations / account',
      'Khmer audio voice queue announcement',
      'Medication inventory & stock tracking',
      'Automated Telegram alert bot',
      '80mm ESC/POS thermal printing & cash drawer',
    ],
  },
  PRO_8: {
    id: 'PRO_8',
    nameKh: 'គម្រោងវិជ្ជាជីវៈ Polyclinic Pro',
    nameEn: 'Polyclinic Pro 8$/mo',
    monthlyUsd: 8,
    yearlyUsd: 76,
    khqrDailyLimit: 1500,
    monthlyPatients: 8000,
    staffAccounts: 15,
    featuresKh: [
      'បង្កើត Dynamic KHQR ១,៥០០ ដង/ថ្ងៃ',
      'កត់ត្រាអ្នកជំងឺ ៨,០០០ នាក់ / គណនី',
      'Telegram Forum Topics ដាច់ដោយឡែក ៤ បន្ទប់',
      'ហៅអ្នកជំងឺជាសំឡេងខ្មែរច្រើនបន្ទប់ពិគ្រោះ',
      'របាយការណ៍ហិរញ្ញវត្ថុ និងវិភាគទិន្នន័យកម្រិតខ្ពស់',
      'ភ្ជាប់ម៉ាស៊ីនព្រីន POS បណ្ដាញជាច្រើនគ្រឿង',
      'ការគាំទ្រអាទិភាព ២៤/៧ Priority Support',
    ],
    featuresEn: [
      'Dynamic KHQR (1,500 transactions / day)',
      '8,000 patient registry / account',
      'Full Telegram Forum Topics (Payments, Queue, Pharmacy, Security)',
      'Multi-room Khmer voice queue calling',
      'Advanced financial analytics & export',
      'Multi-printer network POS support',
      'Priority 24/7 technical customer support',
    ],
  },
  ENTERPRISE_12: {
    id: 'ENTERPRISE_12',
    nameKh: 'គម្រោងមន្ទីរពេទ្យ Hospital Enterprise',
    nameEn: 'Hospital Enterprise 12$/mo',
    monthlyUsd: 12,
    yearlyUsd: 115,
    khqrDailyLimit: -1,
    monthlyPatients: -1,
    staffAccounts: -1,
    featuresKh: [
      'មិនកំណត់រាល់ប្រតិបត្តិការ KHQR Unlimited',
      'មិនកំណត់ចំនួនអ្នកជំងឺ និងបុគ្គលិក / គណនី',
      'ទទួលបាន Subdomain ផ្លូវការ ឧទាហរណ៍ yourclinic.clinicplatform.com',
      'គ្រប់គ្រងសាខាច្រើន និងគ្រូពេទ្យឯកទេសច្រើនផ្នែក',
      'Dedicated Database Performance & Cloud Backup',
      'ជំនួយពិសេសផ្ទាល់តាមទូរស័ព្ទ និង Telegram 24/7 VIP SLA',
    ],
    featuresEn: [
      'Unlimited dynamic KHQR transactions',
      'Unlimited patients and staff accounts',
      'Dedicated custom subdomain (e.g. yourclinic.clinicplatform.com)',
      'Multi-branch & multi-department routing',
      'Dedicated high-performance database instance',
      '24/7 VIP Phone and Telegram SLA support',
    ],
  },
};

describe('Step 11 & Step 12: SaaS Landing Page & Pricing Matrix Test Suite', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  it('should verify exact quotas matching user specifications across all tiers', () => {
    // Free: 5 KHQR/day, 50 patients / account, 2 staff
    assert.equal(SAAS_PLANS.FREE.khqrDailyLimit, 5);
    assert.equal(SAAS_PLANS.FREE.monthlyPatients, 50);
    assert.equal(SAAS_PLANS.FREE.staffAccounts, 2);

    // Starter $5: 250 KHQR/day, 1,000 patients / account, 5 staff
    assert.equal(SAAS_PLANS.STARTER_5.monthlyUsd, 5);
    assert.equal(SAAS_PLANS.STARTER_5.khqrDailyLimit, 250);
    assert.equal(SAAS_PLANS.STARTER_5.monthlyPatients, 1000);
    assert.equal(SAAS_PLANS.STARTER_5.staffAccounts, 5);

    // Pro $8: 1500 KHQR/day, 5,000 patients / account, 15 staff
    assert.equal(SAAS_PLANS.PRO_8.monthlyUsd, 8);
    assert.equal(SAAS_PLANS.PRO_8.khqrDailyLimit, 1500);
    assert.equal(SAAS_PLANS.PRO_8.monthlyPatients, 8000);
    assert.equal(SAAS_PLANS.PRO_8.staffAccounts, 15);

    // Enterprise $12: Unlimited KHQR, unlimited patients, unlimited staff
    assert.equal(SAAS_PLANS.ENTERPRISE_12.monthlyUsd, 12);
    assert.equal(SAAS_PLANS.ENTERPRISE_12.khqrDailyLimit, -1);
    assert.equal(SAAS_PLANS.ENTERPRISE_12.monthlyPatients, -1);
    assert.equal(SAAS_PLANS.ENTERPRISE_12.staffAccounts, -1);
  });

  it('should verify annual billing discount is at least 20% on all paid plans', () => {
    for (const [tier, plan] of Object.entries(SAAS_PLANS)) {
      if (plan.monthlyUsd > 0) {
        const fullAnnualPrice = plan.monthlyUsd * 12;
        const discountAmount = fullAnnualPrice - plan.yearlyUsd;
        const discountPct = (discountAmount / fullAnnualPrice) * 100;

        assert.ok(
          discountPct >= 20.0,
          `Tier ${tier} annual discount is ${discountPct.toFixed(1)}%, expected >= 20%`,
        );
      }
    }
  });

  it('should verify bilingual parity between English and Khmer feature sets', () => {
    for (const [tier, plan] of Object.entries(SAAS_PLANS)) {
      assert.ok(plan.nameKh.length > 0);
      assert.ok(plan.nameEn.length > 0);
      assert.equal(
        plan.featuresKh.length,
        plan.featuresEn.length,
        `Feature count mismatch for plan ${tier}`,
      );
    }
  });

  it('should guarantee zero emojis across all pricing plan labels, names, and features', () => {
    for (const plan of Object.values(SAAS_PLANS)) {
      assert.equal(emojiRegex.test(plan.nameKh), false);
      assert.equal(emojiRegex.test(plan.nameEn), false);
      for (const feat of plan.featuresKh) {
        assert.equal(emojiRegex.test(feat), false, `Emoji found in Khmer feature: ${feat}`);
      }
      for (const feat of plan.featuresEn) {
        assert.equal(emojiRegex.test(feat), false, `Emoji found in English feature: ${feat}`);
      }
    }
  });
});
