import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en';
import { km } from '../src/locales/km';

function getNestedKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getNestedKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('Frontend Internationalization (i18n) Parity Test Suite', () => {
  it('should have 100% dictionary key parity between English and Khmer', () => {
    const enKeys = getNestedKeys(en).sort();
    const kmKeys = getNestedKeys(km).sort();

    const missingInKm = enKeys.filter((k) => !kmKeys.includes(k));
    const missingInEn = kmKeys.filter((k) => !enKeys.includes(k));

    assert.deepEqual(missingInKm, [], `Keys present in English but missing in Khmer: ${missingInKm.join(', ')}`);
    assert.deepEqual(missingInEn, [], `Keys present in Khmer but missing in English: ${missingInEn.join(', ')}`);
    assert.equal(enKeys.length, kmKeys.length);
  });
});
