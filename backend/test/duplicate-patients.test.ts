import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export function sanitizePhoneNumber(phone: string): string {
  // Strip spaces, dashes, parentheses
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

export function isPhoneDuplicate(candidate: string, existingList: string[]): boolean {
  const cleanCandidate = sanitizePhoneNumber(candidate);
  return existingList.some((existing) => sanitizePhoneNumber(existing) === cleanCandidate);
}

describe('Patient Duplicate Verification Test Suite', () => {
  it('should detect duplicate phone numbers regardless of spacing or dashes', () => {
    const existingPhones = ['012-345-678', '098 765 432', '085112233'];

    assert.equal(isPhoneDuplicate('012 345 678', existingPhones), true);
    assert.equal(isPhoneDuplicate('012345678', existingPhones), true);
    assert.equal(isPhoneDuplicate('012-345-678', existingPhones), true);
    assert.equal(isPhoneDuplicate('098765432', existingPhones), true);
    assert.equal(isPhoneDuplicate('085-11-22-33', existingPhones), true);

    // Non-duplicate phone
    assert.equal(isPhoneDuplicate('077998877', existingPhones), false);
  });
});
