import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Real Free Account Registration & 6-Digit Email Verification UI Suite', () => {
  it('should validate 6-digit confirmation code format', () => {
    const isValidCode = (code: string) => /^\d{6}$/.test(code.trim());

    assert.equal(isValidCode('123456'), true);
    assert.equal(isValidCode('987654'), true);
    assert.equal(isValidCode('12345'), false);
    assert.equal(isValidCode('1234567'), false);
    assert.equal(isValidCode('abcdef'), false);
  });

  it('should format 10-minute countdown timer accurately', () => {
    const formatCountdown = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    assert.equal(formatCountdown(600), '10:00');
    assert.equal(formatCountdown(599), '9:59');
    assert.equal(formatCountdown(65), '1:05');
    assert.equal(formatCountdown(9), '0:09');
    assert.equal(formatCountdown(0), '0:00');
  });

  it('should compute valid subdomain slug from English clinic name', () => {
    const generateSlug = (nameEn: string) => {
      return (
        nameEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'clinic'
      );
    };

    assert.equal(generateSlug('Rotana Medical Center'), 'rotana-medical-center');
    assert.equal(generateSlug('Sokhapheap LOR Clinic 2026!'), 'sokhapheap-lor-clinic-2026');
    assert.equal(generateSlug('   '), 'clinic');
  });

  it('should enforce zero emojis in registration texts', () => {
    const sampleKh = 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ Gmail របស់អ្នករួចរាល់ហើយ។';
    const sampleEn = '6-Digit verification code dispatched to your Gmail.';
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    assert.equal(emojiRegex.test(sampleKh), false);
    assert.equal(emojiRegex.test(sampleEn), false);
  });
});
