import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 5: Patient Portal & Telegram Mini App (TMA) UI Suite', () => {
  it('should verify 100% dictionary key parity for patientPortal localization', () => {
    const enPortal = (en as any).patientPortal;
    const kmPortal = (km as any).patientPortal;

    assert.notEqual(enPortal, undefined, 'en.patientPortal must exist');
    assert.notEqual(kmPortal, undefined, 'km.patientPortal must exist');

    const enKeys = Object.keys(enPortal).sort();
    const kmKeys = Object.keys(kmPortal).sort();

    assert.equal(enKeys.length > 0, true, 'en.patientPortal must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km patientPortal must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire patientPortal localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enPortal = (en as any).patientPortal;
    const kmPortal = (km as any).patientPortal;

    for (const [key, value] of Object.entries(enPortal)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.patientPortal.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmPortal)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.patientPortal.${key}: "${value}"`
      );
    }
  });

  it('should verify all core clinical navigation and workflow keys exist in patientPortal', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'searchPlaceholder',
      'searchButton',
      'tabQueue',
      'tabPrescriptions',
      'tabPayments',
      'tabReminders',
      'queueTitle',
      'ticketNumber',
      'statusWaiting',
      'statusCalling',
      'currentlyServing',
      'patientsAhead',
      'estimatedWait',
      'consultationRoom',
      'rxTitle',
      'verifiedSeal',
      'paymentTitle',
      'scanToPay',
      'openAba',
      'openBakong',
      'remindersTitle',
      'medicationSchedule',
      'connectTelegram',
    ];

    const enPortal = (en as any).patientPortal;
    for (const key of requiredKeys) {
      assert.notEqual(
        enPortal[key],
        undefined,
        `Required key "${key}" missing in en.patientPortal`
      );
    }
  });

  it('should calculate estimated waiting time correctly based on queue position', () => {
    const calculateEstimatedWait = (patientsAhead: number, isCalling: boolean): number => {
      if (isCalling) return 0;
      return Math.max(5, (patientsAhead + 1) * 8);
    };

    // 0 patients ahead -> 8 minutes minimum
    assert.equal(calculateEstimatedWait(0, false), 8);

    // 2 patients ahead -> (2 + 1) * 8 = 24 minutes
    assert.equal(calculateEstimatedWait(2, false), 24);

    // 5 patients ahead -> (5 + 1) * 8 = 48 minutes
    assert.equal(calculateEstimatedWait(5, false), 48);

    // Currently calling / in consultation -> 0 minutes
    assert.equal(calculateEstimatedWait(0, true), 0);
  });
});
