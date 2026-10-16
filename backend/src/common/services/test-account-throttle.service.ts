import { Injectable, ForbiddenException } from '@nestjs/common';

export type TestThrottleAction =
  | 'KHQR_GENERATE'
  | 'QUICK_INVOICE'
  | 'INVOICE_EDIT'
  | 'STAFF_MANAGE'
  | 'SETTINGS_MANAGE';

@Injectable()
export class TestAccountThrottleService {
  // In-memory counter map: key = `${email}:${action}:${YYYY-MM-DD}`
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

  getUsage(user: { email?: string } | null | undefined, action: TestThrottleAction, maxPerDay: number) {
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
    action: TestThrottleAction,
    maxPerDay: number,
    actionNameKh: string,
    actionNameEn: string,
  ): void {
    if (!this.isTestAccount(user)) {
      // Real clinic owner ('owner@clinic.com') and regular staff have ZERO rate limits
      return;
    }

    const email = user!.email!.toLowerCase();
    const key = this.getTodayKey(email, action);
    const current = this.dailyCounts.get(key) || 0;

    if (current >= maxPerDay) {
      throw new ForbiddenException(
        `គណនីសាកល្បងត្រូវបានអនុញ្ញាតឱ្យ${actionNameKh}ត្រឹមតែ ${maxPerDay} ដងក្នុងមួយថ្ងៃប៉ុណ្ណោះ ដើម្បីការពារការ Spam ប្រព័ន្ធ។ សូមសាកល្បងម្តងទៀតនៅថ្ងៃស្អែក ឬប្រើប្រាស់គណនីមេ (Account Zin)។ (${actionNameEn} daily quota of ${maxPerDay} reached for evaluation account to prevent spam.)`,
      );
    }

    this.dailyCounts.set(key, current + 1);
  }
}
