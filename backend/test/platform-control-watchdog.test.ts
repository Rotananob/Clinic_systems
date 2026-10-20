import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Plan tiers & quotas mirroring SAAS_PLANS
const SAAS_PLANS = {
  FREE: { maxMonthlyPatients: 50, maxDailyKhqr: 5, maxStaffAccounts: 2 },
  STARTER_5: { maxMonthlyPatients: 500, maxDailyKhqr: 250, maxStaffAccounts: 5 },
  PRO_8: { maxMonthlyPatients: -1, maxDailyKhqr: 1500, maxStaffAccounts: 15 },
  ENTERPRISE_12: { maxMonthlyPatients: -1, maxDailyKhqr: -1, maxStaffAccounts: -1 },
};

// Mock Tenant database store
interface MockTenant {
  id: string;
  slug: string;
  clinicNameKh: string;
  clinicNameEn: string;
  planTier: keyof typeof SAAS_PLANS;
  isActive: boolean;
  maxMonthlyPatients: number;
  maxDailyKhqr: number;
  maxStaffAccounts: number;
}

interface MockAuditLog {
  action: string;
  tenantId: string;
  details: any;
  createdAt: Date;
}

class MockPrismaAdminStore {
  tenants: MockTenant[] = [
    {
      id: 'tenant-rotana-001',
      slug: 'rotana',
      clinicNameKh: 'គ្លីនិក រតនា',
      clinicNameEn: 'Rotana Medical Center',
      planTier: 'ENTERPRISE_12',
      isActive: true,
      maxMonthlyPatients: -1,
      maxDailyKhqr: -1,
      maxStaffAccounts: -1,
    },
    {
      id: 'tenant-vanna-002',
      slug: 'vanna',
      clinicNameKh: 'គ្លីនិក ហួន វណ្ណៈ',
      clinicNameEn: 'Houn Vannak Clinic',
      planTier: 'STARTER_5',
      isActive: true,
      maxMonthlyPatients: 500,
      maxDailyKhqr: 250,
      maxStaffAccounts: 5,
    },
  ];

  auditLogs: MockAuditLog[] = [];
  patientsCount = 18;
  visitsCount = 24;
  invoicesCount = 35;
  todayKhqrCount = 12;
  subscriptionsCount = 2;
  activeSubscriptionsCount = 2;
  totalGrossRevenueUsd = 17.0;

  findTenantBySlugOrId(target: string): MockTenant | undefined {
    const q = target.toLowerCase();
    return this.tenants.find((t) => t.slug.toLowerCase() === q || t.id === target);
  }

  updateTenant(id: string, data: Partial<MockTenant>): MockTenant {
    const tenant = this.tenants.find((t) => t.id === id);
    if (!tenant) throw new Error('Tenant not found');
    Object.assign(tenant, data);
    return tenant;
  }

  createAuditLog(action: string, tenantId: string, details: any): MockAuditLog {
    const entry: MockAuditLog = {
      action,
      tenantId,
      details,
      createdAt: new Date(),
    };
    this.auditLogs.push(entry);
    return entry;
  }
}

class MasterBotCommandProcessor {
  private db: MockPrismaAdminStore;

  constructor(db: MockPrismaAdminStore) {
    this.db = db;
  }

  async executeCommand(text: string): Promise<string> {
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === '/start' || cmd === '/help') {
      return [
        '<b>[SAAS PLATFORM MASTER CONTROL COMMANDS]</b>',
        '----------------------------------------',
        '<code>/status</code> - Real-time system health, uptime, and database state',
        '<code>/stats</code> - Global SaaS performance, active clinics & KHQR totals',
        '<code>/clinics</code> - Registered clinic tenants, status, and plan tiers',
        '<code>/revenue</code> - Financial metrics, subscriptions & MRR',
        '<code>/freeze &lt;slug&gt;</code> - Suspend clinic access immediately',
        '<code>/unfreeze &lt;slug&gt;</code> - Reactivate clinic access immediately',
        '<code>/tier &lt;slug&gt; &lt;tier&gt;</code> - Change plan tier (FREE, STARTER_5, PRO_8, ENTERPRISE_12)',
        '<code>/lock</code> - Enforce & verify dual bot anti-tampering lock',
        '<code>/ping</code> - Connectivity latency test',
        '----------------------------------------',
        'Operator: SUPER_ADMIN (Platform Master Control)',
      ].join('\n');
    }

    if (cmd === '/ping') {
      return '<b>[PONG]</b> Platform Master Bot is online and responsive.';
    }

    if (cmd === '/stats') {
      const activeCount = this.db.tenants.filter((t) => t.isActive).length;
      return [
        '<b>[EXECUTIVE SAAS KPI REPORT: SUMMARY]</b>',
        '----------------------------------------',
        `Active Clinics: <b>${activeCount}</b> / ${this.db.tenants.length}`,
        `Total Patients Global: <b>${this.db.patientsCount}</b>`,
        `Total Clinical Visits: <b>${this.db.visitsCount}</b>`,
        `Today Dynamic KHQR Processed: <b>${this.db.todayKhqrCount}</b>`,
        `Total Global Invoices: <b>${this.db.invoicesCount}</b>`,
        `Active Subscriptions: <b>${this.db.activeSubscriptionsCount}</b> / ${this.db.subscriptionsCount}`,
        `Gross Platform Revenue: <b>$${this.db.totalGrossRevenueUsd.toFixed(2)} USD</b>`,
        'Dual-Bot Watchdog: <b>ACTIVE & SECURE</b>',
        '----------------------------------------',
      ].join('\n');
    }

    if (cmd === '/clinics') {
      const lines = this.db.tenants.map(
        (c, idx) =>
          `${idx + 1}. <b>${c.clinicNameEn}</b> (<code>${c.slug}</code>)\n   Plan: <code>${c.planTier}</code> | Status: <b>${c.isActive ? 'ACTIVE' : 'FROZEN'}</b>`,
      );
      return [
        '<b>[REGISTERED CLINIC TENANTS]</b>',
        '----------------------------------------',
        lines.join('\n'),
        '----------------------------------------',
        `Total Displayed: ${this.db.tenants.length}`,
      ].join('\n');
    }

    if (cmd === '/freeze' || cmd === '/pause_clinic') {
      const target = parts[1]?.trim();
      if (!target) return '<b>[USAGE ERROR]</b> Format: <code>/freeze &lt;clinic-slug&gt;</code>';

      const tenant = this.db.findTenantBySlugOrId(target);
      if (!tenant) return `<b>[ERROR]</b> Clinic tenant not found: <code>${target}</code>`;
      if (!tenant.isActive) {
        return `<b>[NOTICE]</b> Clinic <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>) is already frozen.`;
      }

      this.db.updateTenant(tenant.id, { isActive: false });
      this.db.createAuditLog('TENANT_FROZEN', tenant.id, { slug: tenant.slug });

      return [
        '<b>[SUCCESS: CLINIC FROZEN]</b>',
        '----------------------------------------',
        `Clinic Name: <b>${tenant.clinicNameEn}</b>`,
        `Tenant Slug: <code>${tenant.slug}</code>`,
        'Status: <b>FROZEN (Access Suspended)</b>',
        'Enforcement: User login and workspace operations immediately locked.',
        '----------------------------------------',
      ].join('\n');
    }

    if (cmd === '/unfreeze' || cmd === '/resume_clinic') {
      const target = parts[1]?.trim();
      if (!target) return '<b>[USAGE ERROR]</b> Format: <code>/unfreeze &lt;clinic-slug&gt;</code>';

      const tenant = this.db.findTenantBySlugOrId(target);
      if (!tenant) return `<b>[ERROR]</b> Clinic tenant not found: <code>${target}</code>`;
      if (tenant.isActive) {
        return `<b>[NOTICE]</b> Clinic <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>) is already active.`;
      }

      this.db.updateTenant(tenant.id, { isActive: true });
      this.db.createAuditLog('TENANT_UNFROZEN', tenant.id, { slug: tenant.slug });

      return [
        '<b>[SUCCESS: CLINIC UNFROZEN]</b>',
        '----------------------------------------',
        `Clinic Name: <b>${tenant.clinicNameEn}</b>`,
        `Tenant Slug: <code>${tenant.slug}</code>`,
        'Status: <b>ACTIVE (Access Restored)</b>',
        'Enforcement: User login and clinical workflows restored.',
        '----------------------------------------',
      ].join('\n');
    }

    if (cmd === '/tier' || cmd === '/tier_clinic') {
      const target = parts[1]?.trim();
      const rawTier = parts[2]?.trim()?.toUpperCase() as keyof typeof SAAS_PLANS;
      if (!target || !rawTier) {
        return '<b>[USAGE ERROR]</b> Format: <code>/tier &lt;slug&gt; &lt;FREE|STARTER_5|PRO_8|ENTERPRISE_12&gt;</code>';
      }

      if (!SAAS_PLANS[rawTier]) {
        return `<b>[INVALID TIER]</b> Valid plan tiers: <code>${Object.keys(SAAS_PLANS).join(', ')}</code>`;
      }

      const tenant = this.db.findTenantBySlugOrId(target);
      if (!tenant) return `<b>[ERROR]</b> Clinic tenant not found: <code>${target}</code>`;

      const previousTier = tenant.planTier;
      const planCfg = SAAS_PLANS[rawTier];
      this.db.updateTenant(tenant.id, {
        planTier: rawTier,
        maxMonthlyPatients: planCfg.maxMonthlyPatients,
        maxDailyKhqr: planCfg.maxDailyKhqr,
        maxStaffAccounts: planCfg.maxStaffAccounts,
      });

      this.db.createAuditLog('TENANT_TIER_CHANGED', tenant.id, { previousTier, newTier: rawTier });

      return [
        '<b>[SUCCESS: CLINIC TIER UPDATED]</b>',
        '----------------------------------------',
        `Clinic Name: <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>)`,
        `Previous Tier: <code>${previousTier}</code>`,
        `New Plan Tier: <b>${rawTier}</b>`,
        `Daily Dynamic KHQR: <b>${planCfg.maxDailyKhqr === -1 ? 'Unlimited' : planCfg.maxDailyKhqr}</b>`,
        `Monthly Patients: <b>${planCfg.maxMonthlyPatients === -1 ? 'Unlimited' : planCfg.maxMonthlyPatients}</b>`,
        'Quotas & Limits: <b>SYNCHRONIZED</b>',
        '----------------------------------------',
      ].join('\n');
    }

    return '<b>[UNRECOGNIZED COMMAND]</b> Type /help for command list.';
  }

  // Simulates login access evaluation
  verifyTenantLoginAllowed(tenantId: string): boolean {
    const tenant = this.db.tenants.find((t) => t.id === tenantId);
    if (!tenant) return false;
    return tenant.isActive;
  }
}

// Watchdog Anti-Tamper Engine
class DualBotWatchdogSimulator {
  readonly officialClinicProfile = {
    name: 'Clinic_System',
    description:
      'ប្រព័ន្ធស្វ័យប្រវត្តិនៃមជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា (Rotana Clinic Management & Automation Bot)\n\n' +
      '• ជូនដំណឹងវិក្កយបត្រ & ការទូទាត់ប្រាក់ KHQR\n' +
      '• ជូនដំណឹងវេនពិគ្រោះអ្នកជំងឺ (Patient Queue)\n' +
      '• ជូនដំណឹងស្តុកឱសថស្ថាន\n' +
      '• ជូនដំណឹងសន្តិសុខប្រព័ន្ធគ្លីនិក 24/7',
    shortDescription: 'Bot ជូនដំណឹងស្វ័យប្រវត្តិ គ្លីនិក រតនា (Rotana Clinic Alert Bot)',
  };

  readonly officialMasterProfile = {
    name: 'Platform_MasterBot',
    description:
      'ប្រព័ន្ធគ្រប់គ្រង Master Platform SaaS សម្រាប់ Super Admin\n\n' +
      '• គ្រប់គ្រងគ្លីនិកទូទាំងប្រទេស (Freeze / Unfreeze / Tiers)\n' +
      '• តាមដានចំណូល Subscription MRR & KHQR Dynamic Settlements\n' +
      '• ជូនដំណឹង New Clinic Register, Security Audits & System Health 24/7',
    shortDescription: 'SaaS Platform Master Control Bot',
  };

  currentClinicProfile = { ...this.officialClinicProfile };
  currentMasterProfile = { ...this.officialMasterProfile };
  tamperAlertsDispatched: Array<{ bot: string; incident: string }> = [];

  tamperClinicProfile(maliciousDescription: string) {
    this.currentClinicProfile.description = maliciousDescription;
  }

  tamperMasterProfile(maliciousName: string) {
    this.currentMasterProfile.name = maliciousName;
  }

  verifyAndHealClinicProfile(): { verified: boolean; healed: boolean; tamperDetected: boolean } {
    const isTampered =
      this.currentClinicProfile.name !== this.officialClinicProfile.name ||
      this.currentClinicProfile.description !== this.officialClinicProfile.description ||
      this.currentClinicProfile.shortDescription !== this.officialClinicProfile.shortDescription;

    if (isTampered) {
      // Auto heal
      this.currentClinicProfile = { ...this.officialClinicProfile };
      this.tamperAlertsDispatched.push({
        bot: 'Clinic_System',
        incident: 'CLINIC_BOT_PROFILE_TAMPER_DETECTED',
      });
      return { verified: false, healed: true, tamperDetected: true };
    }

    return { verified: true, healed: false, tamperDetected: false };
  }

  verifyAndHealMasterProfile(): { verified: boolean; healed: boolean; tamperDetected: boolean } {
    const isTampered =
      this.currentMasterProfile.name !== this.officialMasterProfile.name ||
      this.currentMasterProfile.description !== this.officialMasterProfile.description ||
      this.currentMasterProfile.shortDescription !== this.officialMasterProfile.shortDescription;

    if (isTampered) {
      // Auto heal
      this.currentMasterProfile = { ...this.officialMasterProfile };
      this.tamperAlertsDispatched.push({
        bot: 'Platform_MasterBot',
        incident: 'MASTER_BOT_PROFILE_TAMPER_DETECTED',
      });
      return { verified: false, healed: true, tamperDetected: true };
    }

    return { verified: true, healed: false, tamperDetected: false };
  }
}

describe('Step 9 & Step 10: Platform Control System & Dual-Bot Profile Lock Test Suite', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const db = new MockPrismaAdminStore();
  const processor = new MasterBotCommandProcessor(db);
  const watchdog = new DualBotWatchdogSimulator();

  test('should render /help command menu with complete commands and zero emojis', async () => {
    const res = await processor.executeCommand('/help');
    assert.ok(res.includes('[SAAS PLATFORM MASTER CONTROL COMMANDS]'));
    assert.ok(res.includes('/freeze'));
    assert.ok(res.includes('/unfreeze'));
    assert.ok(res.includes('/tier'));
    assert.ok(res.includes('/stats'));
    assert.equal(emojiRegex.test(res), false);
  });

  test('should compile and display /stats executive summary correctly', async () => {
    const res = await processor.executeCommand('/stats');
    assert.ok(res.includes('[EXECUTIVE SAAS KPI REPORT: SUMMARY]'));
    assert.ok(res.includes('Active Clinics: <b>2</b> / 2'));
    assert.ok(res.includes('$17.00 USD'));
    assert.ok(res.includes('Today Dynamic KHQR Processed: <b>12</b>'));
    assert.equal(emojiRegex.test(res), false);
  });

  test('should list all registered clinic tenants under /clinics', async () => {
    const res = await processor.executeCommand('/clinics');
    assert.ok(res.includes('[REGISTERED CLINIC TENANTS]'));
    assert.ok(res.includes('Rotana Medical Center'));
    assert.ok(res.includes('Houn Vannak Clinic'));
    assert.ok(res.includes('ENTERPRISE_12'));
    assert.ok(res.includes('STARTER_5'));
    assert.equal(emojiRegex.test(res), false);
  });

  test('should freeze clinic access via /freeze and block login immediately', async () => {
    // Initial state: vanna is active
    assert.equal(processor.verifyTenantLoginAllowed('tenant-vanna-002'), true);

    const res = await processor.executeCommand('/freeze vanna');
    assert.ok(res.includes('[SUCCESS: CLINIC FROZEN]'));
    assert.ok(res.includes('Houn Vannak Clinic'));
    assert.ok(res.includes('FROZEN (Access Suspended)'));
    assert.equal(emojiRegex.test(res), false);

    // Verify database state updated
    const vanna = db.findTenantBySlugOrId('vanna');
    assert.equal(vanna?.isActive, false);

    // Verify login is blocked
    assert.equal(processor.verifyTenantLoginAllowed('tenant-vanna-002'), false);

    // Verify audit log created
    const log = db.auditLogs.find((l) => l.action === 'TENANT_FROZEN');
    assert.ok(log);
    assert.equal(log?.tenantId, 'tenant-vanna-002');
  });

  test('should unfreeze clinic access via /unfreeze and restore login immediately', async () => {
    const res = await processor.executeCommand('/unfreeze vanna');
    assert.ok(res.includes('[SUCCESS: CLINIC UNFROZEN]'));
    assert.ok(res.includes('Houn Vannak Clinic'));
    assert.ok(res.includes('ACTIVE (Access Restored)'));
    assert.equal(emojiRegex.test(res), false);

    // Verify database state updated
    const vanna = db.findTenantBySlugOrId('vanna');
    assert.equal(vanna?.isActive, true);

    // Verify login is allowed
    assert.equal(processor.verifyTenantLoginAllowed('tenant-vanna-002'), true);

    // Verify audit log created
    const log = db.auditLogs.find((l) => l.action === 'TENANT_UNFROZEN');
    assert.ok(log);
  });

  test('should modify clinic plan tier via /tier and synchronize quotas', async () => {
    // Upgrade vanna from STARTER_5 to PRO_8 ($8/mo -> 1,500 daily KHQR, unlimited patients)
    const res = await processor.executeCommand('/tier vanna PRO_8');
    assert.ok(res.includes('[SUCCESS: CLINIC TIER UPDATED]'));
    assert.ok(res.includes('New Plan Tier: <b>PRO_8</b>'));
    assert.ok(res.includes('Daily Dynamic KHQR: <b>1500</b>'));
    assert.ok(res.includes('Monthly Patients: <b>Unlimited</b>'));
    assert.equal(emojiRegex.test(res), false);

    // Verify database state synchronized
    const vanna = db.findTenantBySlugOrId('vanna');
    assert.equal(vanna?.planTier, 'PRO_8');
    assert.equal(vanna?.maxDailyKhqr, 1500);
    assert.equal(vanna?.maxMonthlyPatients, -1);

    // Verify audit log
    const log = db.auditLogs.find((l) => l.action === 'TENANT_TIER_CHANGED');
    assert.ok(log);
    assert.equal(log?.details.newTier, 'PRO_8');
  });

  test('should reject invalid plan tiers cleanly with informative error message', async () => {
    const res = await processor.executeCommand('/tier vanna SUPER_TIER_99');
    assert.ok(res.includes('[INVALID TIER]'));
    assert.ok(res.includes('FREE, STARTER_5, PRO_8, ENTERPRISE_12'));
    assert.equal(emojiRegex.test(res), false);
  });

  test('should detect tampering on Clinic Bot description and auto-heal immediately', () => {
    // Simulate hacker altering Telegram description
    watchdog.tamperClinicProfile('Hacked by 1337 - pay ransom');
    assert.equal(watchdog.currentClinicProfile.description, 'Hacked by 1337 - pay ransom');

    // Run Watchdog cycle
    const check = watchdog.verifyAndHealClinicProfile();
    assert.equal(check.tamperDetected, true);
    assert.equal(check.healed, true);

    // Verify description is restored to official text
    assert.equal(
      watchdog.currentClinicProfile.description,
      watchdog.officialClinicProfile.description,
    );

    // Verify security alert logged
    assert.ok(
      watchdog.tamperAlertsDispatched.some((a) => a.incident === 'CLINIC_BOT_PROFILE_TAMPER_DETECTED'),
    );
  });

  test('should detect tampering on Master Bot name and auto-heal immediately', () => {
    // Simulate tampering with Master Bot
    watchdog.tamperMasterProfile('Fake_Bot_Name');
    assert.equal(watchdog.currentMasterProfile.name, 'Fake_Bot_Name');

    // Run Watchdog cycle
    const check = watchdog.verifyAndHealMasterProfile();
    assert.equal(check.tamperDetected, true);
    assert.equal(check.healed, true);

    // Verify name is restored to official
    assert.equal(watchdog.currentMasterProfile.name, 'Platform_MasterBot');

    // Verify security alert logged
    assert.ok(
      watchdog.tamperAlertsDispatched.some((a) => a.incident === 'MASTER_BOT_PROFILE_TAMPER_DETECTED'),
    );
  });

  test('should report intact status when profiles are verified without tampering', () => {
    const checkClinic = watchdog.verifyAndHealClinicProfile();
    assert.equal(checkClinic.verified, true);
    assert.equal(checkClinic.tamperDetected, false);

    const checkMaster = watchdog.verifyAndHealMasterProfile();
    assert.equal(checkMaster.verified, true);
    assert.equal(checkMaster.tamperDetected, false);
  });
});
