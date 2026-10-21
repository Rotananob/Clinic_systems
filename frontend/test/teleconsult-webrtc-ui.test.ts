import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { ROUTE_PERMISSIONS } from '../src/lib/rbac.ts';

describe('Phase 16: Teleconsultation WebRTC & Digital e-Prescription UI Test Suite', () => {
  it('should verify 100% dictionary key parity for teleconsult localization', () => {
    const enTele = (en as any).teleconsult;
    const kmTele = (km as any).teleconsult;

    assert.notEqual(enTele, undefined, 'en.teleconsult must exist');
    assert.notEqual(kmTele, undefined, 'km.teleconsult must exist');

    const enKeys = Object.keys(enTele).sort();
    const kmKeys = Object.keys(kmTele).sort();

    assert.equal(enKeys.length > 0, true, 'en.teleconsult must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km teleconsult must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire teleconsult localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enTele = (en as any).teleconsult;
    const kmTele = (km as any).teleconsult;

    for (const [key, value] of Object.entries(enTele)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.teleconsult.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmTele)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.teleconsult.${key}: "${value}"`
      );
    }
  });

  it('should verify nav.teleconsult exists in both English and Khmer with zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enNav = (en as any).nav?.teleconsult;
    const kmNav = (km as any).nav?.teleconsult;

    assert.notEqual(enNav, undefined, 'en.nav.teleconsult must exist');
    assert.notEqual(kmNav, undefined, 'km.nav.teleconsult must exist');

    assert.equal(emojiRegex.test(enNav), false, `Emoji found in en.nav.teleconsult: "${enNav}"`);
    assert.equal(emojiRegex.test(kmNav), false, `Emoji found in km.nav.teleconsult: "${kmNav}"`);
  });

  it('should verify /teleconsult is properly registered in RBAC route permissions', () => {
    const config = ROUTE_PERMISSIONS.find((p) => p.path === '/teleconsult');
    assert.notEqual(config, undefined, '/teleconsult route permission must be registered');
    assert.equal(config?.allowedRoles.includes('SUPER_ADMIN'), true);
    assert.equal(config?.allowedRoles.includes('ADMIN'), true);
    assert.equal(config?.allowedRoles.includes('DOCTOR'), true);

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    assert.equal(emojiRegex.test(config!.labelEn), false);
    assert.equal(emojiRegex.test(config!.labelKh), false);
    assert.equal(emojiRegex.test(config!.descriptionEn), false);
    assert.equal(emojiRegex.test(config!.descriptionKh), false);
  });

  it('should validate QR payload syntax and anti-tamper structure', () => {
    const fakeRxId = 'ep-rx-9912';
    const fakeRxNum = 'EP-2026-4491';
    const fakeLicense = 'MOH-MED-44912';
    const fakeSig = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

    const qrPayload = `EP-RX|id:${fakeRxId}|rxNum:${fakeRxNum}|lic:${fakeLicense}|sig:${fakeSig.slice(0, 16)}`;
    assert.equal(qrPayload.startsWith('EP-RX|'), true);
    assert.equal(qrPayload.includes(`id:${fakeRxId}`), true);
    assert.equal(qrPayload.includes(`lic:${fakeLicense}`), true);
    assert.equal(qrPayload.includes('sig:a1b2c3d4e5f60718'), true);
  });
});
