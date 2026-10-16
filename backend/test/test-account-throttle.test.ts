import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of TestAccountThrottleService logic for fast native strip-types unit testing
class TestAccountThrottleEngine {
  private readonly dailyCounts = new Map<string, number>();

  private getTodayKey(email: string, action: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `${email.toLowerCase()}:${action}:${today}`;
  }

  isTestAccount(user?: { email?: string } | null): boolean {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();
    return (
      email === 'test.admin@hounvannak.com' ||
      email === 'test.superadmin@hounvannak.com' ||
      email === 'demo.superadmin@hounvannak.com' ||
      email === 'demo@clinic.com'
    );
  }

  getUsage(user: { email?: string } | null | undefined, action: string, maxPerDay: number) {
    if (!this.isTestAccount(user)) {
      return { isTestAccount: false, used: 0, limit: Infinity, remaining: Infinity };
    }
    const key = this.getTodayKey(user!.email!, action);
    const used = this.dailyCounts.get(key) || 0;
    return {
      isTestAccount: true,
      used,
      limit: maxPerDay,
      remaining: Math.max(0, maxPerDay - used),
    };
  }

  checkAndIncrement(
    user: { email?: string } | null | undefined,
    action: string,
    maxPerDay: number,
    actionNameKh: string,
    actionNameEn: string,
  ): void {
    if (!this.isTestAccount(user)) {
      return;
    }

    const email = user!.email!.toLowerCase();
    const key = this.getTodayKey(email, action);
    const current = this.dailyCounts.get(key) || 0;

    if (current >= maxPerDay) {
      throw new Error(
        `គណនីសាកល្បងត្រូវបានអនុញ្ញាតឱ្យ${actionNameKh}ត្រឹមតែ ${maxPerDay} ដងក្នុងមួយថ្ងៃប៉ុណ្ណោះ ដើម្បីការពារការ Spam ប្រព័ន្ធ។ សូមសាកល្បងម្តងទៀតនៅថ្ងៃស្អែក ឬប្រើប្រាស់គណនីមេ (Account Zin)។ (${actionNameEn} daily quota of ${maxPerDay} reached for evaluation account to prevent spam.)`,
      );
    }

    this.dailyCounts.set(key, current + 1);
  }
}

describe('Test Account Isolation & Daily Anti-Spam Quota Test Suite', () => {
  it('should clearly distinguish test evaluation accounts from real owner accounts', () => {
    const service = new TestAccountThrottleEngine();

    assert.equal(service.isTestAccount({ email: 'test.admin@hounvannak.com' }), true);
    assert.equal(service.isTestAccount({ email: 'TEST.ADMIN@hounvannak.com' }), true);
    assert.equal(service.isTestAccount({ email: 'demo.superadmin@hounvannak.com' }), true);

    // Real clinic owner ('owner@clinic.com' / Rotana Nob) and regular staff
    assert.equal(service.isTestAccount({ email: 'owner@clinic.com' }), false);
    assert.equal(service.isTestAccount({ email: 'doctor@clinic.com' }), false);
    assert.equal(service.isTestAccount({ email: 'cashier@clinic.com' }), false);
    assert.equal(service.isTestAccount(null), false);
  });

  it('should grant real owner unlimited KHQR generations without throttling', () => {
    const service = new TestAccountThrottleEngine();
    const realOwner = { email: 'owner@clinic.com' };

    for (let i = 0; i < 25; i++) {
      assert.doesNotThrow(() => {
        service.checkAndIncrement(realOwner, 'KHQR_GENERATE', 5, 'បង្កើតកូដទូទាត់ KHQR', 'KHQR generation');
      });
    }

    const usage = service.getUsage(realOwner, 'KHQR_GENERATE', 5);
    assert.equal(usage.isTestAccount, false);
    assert.equal(usage.remaining, Infinity);
  });

  it('should strictly limit test accounts to 5 KHQR generations per day and throw polite message', () => {
    const service = new TestAccountThrottleEngine();
    const testAdmin = { email: 'test.admin@hounvannak.com' };

    // First 5 generations succeed
    for (let i = 0; i < 5; i++) {
      assert.doesNotThrow(() => {
        service.checkAndIncrement(testAdmin, 'KHQR_GENERATE', 5, 'បង្កើតកូដទូទាត់ KHQR', 'KHQR generation');
      });
    }

    // 6th must throw error with Khmer explanation and NO raw 401/403 status codes
    assert.throws(
      () => {
        service.checkAndIncrement(testAdmin, 'KHQR_GENERATE', 5, 'បង្កើតកូដទូទាត់ KHQR', 'KHQR generation');
      },
      (err: any) => {
        assert.equal(err.message.includes('គណនីសាកល្បងត្រូវបានអនុញ្ញាតឱ្យបង្កើតកូដទូទាត់ KHQRត្រឹមតែ 5 ដង'), true);
        assert.equal(err.message.includes('403'), false);
        assert.equal(err.message.includes('401'), false);
        return true;
      },
    );

    const usage = service.getUsage(testAdmin, 'KHQR_GENERATE', 5);
    assert.equal(usage.isTestAccount, true);
    assert.equal(usage.used, 5);
    assert.equal(usage.remaining, 0);
  });
});
