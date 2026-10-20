import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 11: Smart Clinic Queueing & Digital Signage UI Suite', () => {
  it('should verify 100% dictionary key parity for signage localization', () => {
    assert.ok((en as any).signage, 'en.signage must exist');
    assert.ok((km as any).signage, 'km.signage must exist');

    const enKeys = Object.keys((en as any).signage).sort();
    const kmKeys = Object.keys((km as any).signage).sort();

    assert.deepEqual(enKeys, kmKeys, 'signage dictionary keys must have 100% parity between en and km');
  });

  it('should guarantee zero emojis across the entire signage localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries((en as any).signage)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `en.signage.${key} contains emoji: "${val}"`);
      }
    }

    for (const [key, val] of Object.entries((km as any).signage)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `km.signage.${key} contains emoji: "${val}"`);
      }
    }
  });

  it('should verify all required signage station and priority keys exist', () => {
    const requiredKeys = [
      'title',
      'callingNow',
      'waitingQueue',
      'ticketNumber',
      'assignedStation',
      'priorityEmergency',
      'priorityElderly',
      'priorityNormal',
      'issueTicketButton',
      'stationRoom1',
      'stationLab',
      'stationPharmacy',
      'stationCashier',
      'zeroEmojiStandards',
    ];

    for (const req of requiredKeys) {
      assert.ok(req in (en as any).signage, `Missing required key ${req} in en.signage`);
      assert.ok(req in (km as any).signage, `Missing required key ${req} in km.signage`);
    }
  });

  it('should verify nav.signage key exists with zero emoji', () => {
    assert.ok(en.nav.signage, 'en.nav.signage must exist');
    assert.ok(km.nav.signage, 'km.nav.signage must exist');

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    assert.ok(!emojiRegex.test(en.nav.signage));
    assert.ok(!emojiRegex.test(km.nav.signage));
  });

  it('should correctly format bilingual speech phrase without emoji', () => {
    const generateSpeech = (ticket: string, roomKh: string, roomEn: string) => ({
      kh: `សូមអញ្ជើញ អ្នកជំងឺលេខ ${ticket} ចូលទៅកាន់ ${roomKh}`,
      en: `Calling ticket ${ticket} to ${roomEn}`,
    });

    const prompt = generateSpeech('A-101', 'បន្ទប់ពិគ្រោះលេខ ១', 'Consultation Room 1');
    assert.equal(prompt.kh, 'សូមអញ្ជើញ អ្នកជំងឺលេខ A-101 ចូលទៅកាន់ បន្ទប់ពិគ្រោះលេខ ១');
    assert.equal(prompt.en, 'Calling ticket A-101 to Consultation Room 1');
  });
});
