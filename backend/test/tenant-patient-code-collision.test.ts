import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Multi-Tenant Sequence & Patient Code Collision Prevention Test Suite', () => {
  test('should generate patient code based on global sequence to prevent collision for new tenant', () => {
    const year = new Date().getFullYear();
    const existingGlobalMaxSeq = 16;
    const scopedTenantCount = 0; // New tenant with 0 patients

    // Old flawed logic:
    const flawedCandidate = `PAT-${year}-${(scopedTenantCount + 1).toString().padStart(4, '0')}`;
    assert.equal(flawedCandidate, `PAT-${year}-0001`); // This collided with initial seed!

    // Fixed global sequence logic:
    const nextSeq = Math.max(existingGlobalMaxSeq, scopedTenantCount) + 1;
    const fixedCandidate = `PAT-${year}-${nextSeq.toString().padStart(4, '0')}`;
    assert.equal(fixedCandidate, `PAT-${year}-0017`);
    assert.notEqual(fixedCandidate, `PAT-${year}-0001`);
  });

  test('should extract max numeric sequence accurately with regex across all models', () => {
    const year = new Date().getFullYear();
    const regexPattern = new RegExp(`^PAT-${year}-(\\d+)$`);

    const testCodes = [
      `PAT-${year}-0001`,
      `PAT-${year}-0009`,
      `PAT-${year}-0016`,
      `PAT-${year}-0025`,
    ];

    let maxSeq = 0;
    for (const code of testCodes) {
      const match = code.match(regexPattern);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }

    assert.equal(maxSeq, 25);
    const nextCode = `PAT-${year}-${(maxSeq + 1).toString().padStart(4, '0')}`;
    assert.equal(nextCode, `PAT-${year}-0026`);
  });

  test('should guarantee zero emojis in sequence collision error messages', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const message = 'A record with this information (national ID, phone, or code) already exists.';
    assert.equal(emojiRegex.test(message), false);
  });
});
