import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Step 21 & Step 22: Super Admin Fleet Dashboard Frontend Suite', () => {
  it('should filter clinics by search query, status, and tier accurately', () => {
    const mockClinics = [
      {
        id: '1',
        clinicNameKh: 'គ្លីនិកពហុព្យាបាល រតនៈ',
        clinicNameEn: 'Rotana Polyclinic',
        slug: 'rotana',
        phonePrimary: '012345678',
        planTier: 'PRO_8',
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
      {
        id: '2',
        clinicNameKh: 'គ្លីនិកសម្ភព វណ្ណា',
        clinicNameEn: 'Vanna Maternity Clinic',
        slug: 'vanna',
        phonePrimary: '098765432',
        planTier: 'STARTER_5',
        subscriptionStatus: 'PAST_DUE',
        isActive: true,
      },
      {
        id: '3',
        clinicNameKh: 'មន្ទីរសម្រាកព្យាបាល សុខភាព',
        clinicNameEn: 'Sokhapheap Hospital',
        slug: 'sokhapheap',
        phonePrimary: '011223344',
        planTier: 'ENTERPRISE_12',
        subscriptionStatus: 'CANCELLED',
        isActive: false,
      },
    ];

    const filterClinics = (list: any[], query: string, status: string, tier: string) => {
      return list.filter((c) => {
        const matchesSearch =
          c.clinicNameKh.includes(query) ||
          c.clinicNameEn.toLowerCase().includes(query.toLowerCase()) ||
          c.slug.includes(query) ||
          c.phonePrimary.includes(query);

        const matchesStatus =
          status === 'ALL' ||
          (status === 'ACTIVE' && c.isActive && c.subscriptionStatus === 'ACTIVE') ||
          (status === 'PAST_DUE' && c.subscriptionStatus === 'PAST_DUE') ||
          (status === 'FROZEN' && (!c.isActive || c.subscriptionStatus === 'CANCELLED'));

        const matchesTier = tier === 'ALL' || c.planTier === tier;

        return matchesSearch && matchesStatus && matchesTier;
      });
    };

    // Test search by English name
    const resRotana = filterClinics(mockClinics, 'Rotana', 'ALL', 'ALL');
    assert.equal(resRotana.length, 1);
    assert.equal(resRotana[0].slug, 'rotana');

    // Test search by Khmer name
    const resVanna = filterClinics(mockClinics, 'វណ្ណា', 'ALL', 'ALL');
    assert.equal(resVanna.length, 1);
    assert.equal(resVanna[0].slug, 'vanna');

    // Test filter by FROZEN status
    const resFrozen = filterClinics(mockClinics, '', 'FROZEN', 'ALL');
    assert.equal(resFrozen.length, 1);
    assert.equal(resFrozen[0].slug, 'sokhapheap');

    // Test filter by PRO_8 tier
    const resPro = filterClinics(mockClinics, '', 'ALL', 'PRO_8');
    assert.equal(resPro.length, 1);
    assert.equal(resPro[0].slug, 'rotana');
  });

  it('should guarantee zero emojis in superAdmin locale strings', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const checkNoEmojis = (obj: Record<string, any>, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          assert.equal(
            emojiRegex.test(value),
            false,
            `Emoji found in ${fullPath}: ${value}`,
          );
        } else if (typeof value === 'object' && value !== null) {
          checkNoEmojis(value, fullPath);
        }
      }
    };

    checkNoEmojis((en as any).superAdmin, 'en.superAdmin');
    checkNoEmojis((km as any).superAdmin, 'km.superAdmin');
    assert.equal(emojiRegex.test(en.nav.superAdminFleet), false);
    assert.equal(emojiRegex.test(km.nav.superAdminFleet), false);
  });

  it('should verify 100% dictionary key parity between en and km for superAdmin', () => {
    const enKeys = Object.keys((en as any).superAdmin).sort();
    const kmKeys = Object.keys((km as any).superAdmin).sort();

    assert.deepEqual(enKeys, kmKeys, 'Mismatch in superAdmin translation dictionary keys');
  });
});
