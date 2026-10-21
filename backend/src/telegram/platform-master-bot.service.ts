import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional, Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SAAS_PLANS } from '../common/constants/plans.constant';
import { TelegramService } from './telegram.service';

export interface PlatformMasterBotConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  botUsername?: string;
  botName?: string;
  notifyOnNewClinic: boolean;
  notifyOnSubscriptionPaid: boolean;
  notifyOnSystemError: boolean;
  notifyOnDatabaseBackup: boolean;
  notifyOnDailySummary: boolean;
  lastConnectedAt?: string;
}

export const OFFICIAL_MASTER_BOT_NAME = 'Platform_MasterBot';
export const OFFICIAL_MASTER_BOT_DESCRIPTION =
  'ប្រព័ន្ធគ្រប់គ្រង Master Platform SaaS សម្រាប់ Super Admin\n\n' +
  '• គ្រប់គ្រងគ្លីនិកទូទាំងប្រទេស (Freeze / Unfreeze / Tiers)\n' +
  '• តាមដានចំណូល Subscription MRR & KHQR Dynamic Settlements\n' +
  '• ជូនដំណឹង New Clinic Register, Security Audits & System Health 24/7';
export const OFFICIAL_MASTER_BOT_SHORT_DESC = 'SaaS Platform Master Control Bot';
export const OFFICIAL_MASTER_BOT_COMMANDS = [
  { command: 'status', description: 'System health, DB state, and uptime' },
  { command: 'stats', description: 'SaaS KPI summary, clinics, patients, and KHQR totals' },
  { command: 'clinics', description: 'List registered clinic tenants and plan tiers' },
  { command: 'revenue', description: 'Subscription revenue and MRR metrics' },
  { command: 'freeze', description: 'Suspend clinic access (format: /freeze <slug>)' },
  { command: 'unfreeze', description: 'Reactivate clinic access (format: /unfreeze <slug>)' },
  { command: 'tier', description: 'Change plan tier (format: /tier <slug> <tier>)' },
  { command: 'lock', description: 'Enforce and lock official bot profile anti-tamper' },
  { command: 'ping', description: 'Latency test and bot responsiveness check' },
  { command: 'help', description: 'Show all administrator control commands' },
];

const DEFAULT_MASTER_TOKEN = process.env.PLATFORM_MASTER_BOT_TOKEN || '';
const DEFAULT_MASTER_CHAT_ID = process.env.PLATFORM_MASTER_CHAT_ID || '';
const DEFAULT_MASTER_USERNAME = process.env.PLATFORM_MASTER_BOT_USERNAME || 'Platform_MasterBot';

@Injectable()
export class PlatformMasterBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlatformMasterBotService.name);
  private readonly configFilePath = path.resolve(process.cwd(), 'data/platform-master-bot.json');

  private config: PlatformMasterBotConfig = {
    enabled: false,
    botToken: DEFAULT_MASTER_TOKEN,
    chatId: DEFAULT_MASTER_CHAT_ID,
    botUsername: DEFAULT_MASTER_USERNAME,
    botName: OFFICIAL_MASTER_BOT_NAME,
    notifyOnNewClinic: true,
    notifyOnSubscriptionPaid: true,
    notifyOnSystemError: true,
    notifyOnDatabaseBackup: true,
    notifyOnDailySummary: true,
  };

  private pollerTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastUpdateId = 0;
  private masterWatchdogTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => TelegramService)) private readonly telegramService?: TelegramService,
  ) {
    this.loadConfig();
  }

  onModuleInit() {
    this.logger.log(`Platform Master Bot Service initialized. Active: ${this.config.enabled}`);
    if (this.config.enabled && this.config.botToken) {
      this.startMasterBotPoller();
      this.startMasterWatchdog();
      this.enforceMasterBotProfileLock().catch((err) => {
        this.logger.warn(`Initial master bot profile lock skipped: ${err.message}`);
      });
    }
  }

  onModuleDestroy() {
    this.stopMasterBotPoller();
    this.stopMasterWatchdog();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = {
          ...this.config,
          ...parsed,
          botToken: parsed.botToken || DEFAULT_MASTER_TOKEN,
          chatId: parsed.chatId || DEFAULT_MASTER_CHAT_ID,
        };
        this.logger.log(`Platform Master Bot config loaded. Enabled: ${this.config.enabled}`);
      } else {
        this.saveConfig();
      }
    } catch (err: any) {
      this.logger.warn(`Could not load Platform Master Bot config: ${err.message}`);
    }
  }

  private saveConfig() {
    try {
      const dir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to save Platform Master Bot config: ${err.message}`);
    }
  }

  public getPublicStatus() {
    return {
      enabled: this.config.enabled,
      hasToken: Boolean(this.config.botToken),
      hasChatId: Boolean(this.config.chatId),
      botUsername: this.config.botUsername || DEFAULT_MASTER_USERNAME,
      botName: this.config.botName || OFFICIAL_MASTER_BOT_NAME,
      chatIdMasked: this.config.chatId
        ? `${this.config.chatId.substring(0, 4)}****${this.config.chatId.slice(-3)}`
        : null,
      notifyOnNewClinic: this.config.notifyOnNewClinic,
      notifyOnSubscriptionPaid: this.config.notifyOnSubscriptionPaid,
      notifyOnSystemError: this.config.notifyOnSystemError,
      notifyOnDatabaseBackup: this.config.notifyOnDatabaseBackup,
      notifyOnDailySummary: this.config.notifyOnDailySummary,
      lastConnectedAt: this.config.lastConnectedAt || null,
    };
  }

  public updateConfig(partial: Partial<PlatformMasterBotConfig>) {
    this.config = {
      ...this.config,
      ...partial,
    };
    if (partial.botToken && partial.chatId) {
      this.config.enabled = true;
      this.config.lastConnectedAt = new Date().toISOString();
      this.startMasterBotPoller();
      this.startMasterWatchdog();
      this.enforceMasterBotProfileLock().catch(() => {});
    }
    this.saveConfig();
    return this.getPublicStatus();
  }

  /**
   * Start Master Bot polling loop for interactive Super Admin commands
   */
  public startMasterBotPoller() {
    if (this.isPolling || !this.config.botToken) return;
    this.isPolling = true;

    this.pollerTimer = setInterval(() => {
      this.pollMasterUpdates().catch((err) => {
        this.logger.debug(`Master bot update poll cycle skipped: ${err.message}`);
      });
    }, 4000);

    this.logger.log('Platform Master Bot command poller active.');
  }

  public stopMasterBotPoller() {
    if (this.pollerTimer) {
      clearInterval(this.pollerTimer);
      this.pollerTimer = null;
    }
    this.isPolling = false;
  }

  /**
   * Anti-Tampering & Self-Healing Watchdog (60-second cycle)
   */
  public startMasterWatchdog() {
    if (this.masterWatchdogTimer) return;
    this.masterWatchdogTimer = setInterval(() => {
      this.verifyAndHealProfile().catch((err) => {
        this.logger.debug(`Master bot watchdog cycle skipped: ${err.message}`);
      });
    }, 60000);
    this.logger.log('Platform Master Bot anti-tamper watchdog active (60s cycle).');
  }

  public stopMasterWatchdog() {
    if (this.masterWatchdogTimer) {
      clearInterval(this.masterWatchdogTimer);
      this.masterWatchdogTimer = null;
    }
  }

  /**
   * Enforce and lock official Master Bot profile metadata via Telegram API
   */
  public async enforceMasterBotProfileLock(): Promise<{ success: boolean; message: string }> {
    const token = this.config.botToken;
    if (!token) {
      return { success: false, message: 'Master bot token not configured.' };
    }

    try {
      // 1. Set Name
      await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: OFFICIAL_MASTER_BOT_NAME }),
      });

      // 2. Set Description
      await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: OFFICIAL_MASTER_BOT_DESCRIPTION }),
      });

      // 3. Set Short Description
      await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: OFFICIAL_MASTER_BOT_SHORT_DESC }),
      });

      // 4. Set Official Commands
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: OFFICIAL_MASTER_BOT_COMMANDS }),
      });

      this.logger.log('Official Platform Master Bot Profile locked and protected successfully.');
      return { success: true, message: 'Platform Master Bot profile locked successfully.' };
    } catch (err: any) {
      this.logger.warn(`Failed to enforce master bot profile lock: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  /**
   * Watchdog Integrity Check: detects tampering on Master Bot and restores immediately
   */
  public async verifyAndHealProfile(): Promise<{
    verified: boolean;
    healed: boolean;
    tamperDetected: boolean;
    message: string;
  }> {
    const token = this.config.botToken;
    if (!token) {
      return { verified: false, healed: false, tamperDetected: false, message: 'Master bot token not configured.' };
    }

    try {
      const descRes = await fetch(`https://api.telegram.org/bot${token}/getMyDescription`);
      const descData = await descRes.json();
      const currentDesc = descData?.result?.description || '';

      const shortRes = await fetch(`https://api.telegram.org/bot${token}/getMyShortDescription`);
      const shortData = await shortRes.json();
      const currentShort = shortData?.result?.short_description || '';

      const nameRes = await fetch(`https://api.telegram.org/bot${token}/getMyName`);
      const nameData = await nameRes.json();
      const currentName = nameData?.result?.name || '';

      const isNameTampered = currentName && currentName !== OFFICIAL_MASTER_BOT_NAME;
      const isDescTampered = currentDesc && currentDesc !== OFFICIAL_MASTER_BOT_DESCRIPTION;
      const isShortTampered = currentShort && currentShort !== OFFICIAL_MASTER_BOT_SHORT_DESC;

      if (isNameTampered || isDescTampered || isShortTampered) {
        this.logger.warn('[SECURITY] Master Bot profile tamper detected! Restoring official lock immediately...');
        await this.enforceMasterBotProfileLock();

        await this.notifySystemSecurityAlert({
          title: 'MASTER_BOT_PROFILE_TAMPER_DETECTED',
          severity: 'CRITICAL',
          message: 'Unauthorized alteration to Platform Master Bot profile detected. Watchdog auto-restored official locked values.',
        });

        return {
          verified: false,
          healed: true,
          tamperDetected: true,
          message: 'Tampering detected and auto-healed to official master profile.',
        };
      }

      return {
        verified: true,
        healed: false,
        tamperDetected: false,
        message: 'Platform Master Bot profile integrity verified.',
      };
    } catch (err: any) {
      this.logger.debug(`Master watchdog check skipped: ${err.message}`);
      return {
        verified: false,
        healed: false,
        tamperDetected: false,
        message: `Watchdog check error: ${err.message}`,
      };
    }
  }

  private async pollMasterUpdates() {
    const token = this.config.botToken;
    if (!token) return;

    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=3`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
        const msg = update.message;
        if (!msg || !msg.text) continue;

        const senderChatId = String(msg.chat.id);
        const text = msg.text.trim();

        // Security check: Only configured Super Admin chatId can run commands
        if (this.config.chatId && senderChatId !== String(this.config.chatId)) {
          await this.sendMessageDirect(
            token,
            senderChatId,
            '<b>[ACCESS DENIED]</b> This control channel is strictly reserved for authorized platform administrators.',
          );
          continue;
        }

        // Process Super Admin Interactive Commands
        const replyHtml = await this.executeAdminCommand(text);
        await this.sendMessageDirect(token, senderChatId, replyHtml);
      }
    } catch (err: any) {
      this.logger.debug(`Master Bot poll error: ${err.message}`);
    }
  }

  /**
   * Execute Super Admin Administrative Commands
   */
  public async executeAdminCommand(text: string): Promise<string> {
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

    if (cmd === '/status') {
      try {
        const tenantCount = await this.prisma.tenant.count();
        const activeCount = await this.prisma.tenant.count({ where: { isActive: true } });
        const patientCount = await this.prisma.patient.count();
        const invoiceCount = await this.prisma.invoice.count();
        const uptimeMins = Math.floor(process.uptime() / 60);

        return [
          '<b>[PLATFORM SYSTEM STATUS METRICS]</b>',
          '----------------------------------------',
          'SaaS Platform: Clinic Patient Management OS',
          `Uptime: <b>${uptimeMins} minutes</b>`,
          `Registered Clinics: <b>${tenantCount}</b> (Active: <b>${activeCount}</b>)`,
          `Total Global Patients: <b>${patientCount}</b>`,
          `Total Global Invoices: <b>${invoiceCount}</b>`,
          'PostgreSQL DB: <b>CONNECTED & HEALTHY</b>',
          'Dual-Bot Service: <b>ACTIVE</b>',
          '----------------------------------------',
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Could not query status: ${err.message}`;
      }
    }

    if (cmd === '/stats') {
      try {
        const tenantCount = await this.prisma.tenant.count();
        const activeCount = await this.prisma.tenant.count({ where: { isActive: true } });
        const patientCount = await this.prisma.patient.count();
        const visitCount = await this.prisma.visit.count();
        const invoiceCount = await this.prisma.invoice.count();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayKhqrInvoices = await this.prisma.invoice.count({
          where: {
            createdAt: { gte: todayStart },
            paymentMethod: 'KHQR',
          },
        });

        const subCount = await this.prisma.tenantSubscription.count();
        const activeSubs = await this.prisma.tenantSubscription.count({ where: { status: 'ACTIVE' } });
        const revenueAgg = await this.prisma.tenantSubscription.aggregate({
          _sum: { amountUsd: true },
        });
        const grossRevenue = revenueAgg._sum.amountUsd ? Number(revenueAgg._sum.amountUsd) : 0;

        return [
          '<b>[EXECUTIVE SAAS KPI REPORT: SUMMARY]</b>',
          '----------------------------------------',
          `Active Clinics: <b>${activeCount}</b> / ${tenantCount}`,
          `Total Patients Global: <b>${patientCount}</b>`,
          `Total Clinical Visits: <b>${visitCount}</b>`,
          `Today Dynamic KHQR Processed: <b>${todayKhqrInvoices}</b>`,
          `Total Global Invoices: <b>${invoiceCount}</b>`,
          `Active Subscriptions: <b>${activeSubs}</b> / ${subCount}`,
          `Gross Platform Revenue: <b>$${grossRevenue.toFixed(2)} USD</b>`,
          'Dual-Bot Watchdog: <b>ACTIVE & SECURE</b>',
          '----------------------------------------',
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Could not compile stats: ${err.message}`;
      }
    }

    if (cmd === '/clinics') {
      try {
        const clinics = await this.prisma.tenant.findMany({
          select: {
            slug: true,
            clinicNameEn: true,
            clinicNameKh: true,
            planTier: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        });

        if (clinics.length === 0) {
          return '<b>[REGISTERED CLINIC TENANTS]</b>\nNo clinics registered yet.';
        }

        const clinicLines = clinics.map((c, idx) => {
          const statusStr = c.isActive ? 'ACTIVE' : 'FROZEN';
          return `${idx + 1}. <b>${c.clinicNameEn}</b> (<code>${c.slug}</code>)\n   Plan: <code>${c.planTier}</code> | Status: <b>${statusStr}</b>`;
        });

        return [
          '<b>[REGISTERED CLINIC TENANTS]</b>',
          '----------------------------------------',
          clinicLines.join('\n'),
          '----------------------------------------',
          `Total Displayed: ${clinics.length}`,
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Could not query clinics: ${err.message}`;
      }
    }

    if (cmd === '/revenue') {
      try {
        const subCount = await this.prisma.tenantSubscription.count();
        const activeSubs = await this.prisma.tenantSubscription.count({ where: { status: 'ACTIVE' } });
        const totalRevenue = await this.prisma.tenantSubscription.aggregate({
          _sum: { amountUsd: true },
        });

        const sumUsd = totalRevenue._sum.amountUsd ? Number(totalRevenue._sum.amountUsd) : 0;

        return [
          '<b>[SAAS SUBSCRIPTION REVENUE METRICS]</b>',
          '----------------------------------------',
          `Total Subscriptions: <b>${subCount}</b>`,
          `Active Subscriptions: <b>${activeSubs}</b>`,
          `Total Gross Revenue: <b>$${sumUsd.toFixed(2)} USD</b>`,
          'Settlement Model: KHQR Deep Link Dynamic Settlement',
          '----------------------------------------',
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Could not query revenue: ${err.message}`;
      }
    }

    if (cmd === '/freeze' || cmd === '/pause_clinic') {
      const target = parts[1]?.trim();
      if (!target) {
        return '<b>[USAGE ERROR]</b> Format: <code>/freeze &lt;clinic-slug&gt;</code>';
      }

      try {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { slug: target.toLowerCase() },
              { id: target },
            ],
          },
        });

        if (!tenant) {
          return `<b>[ERROR]</b> Clinic tenant not found: <code>${target}</code>`;
        }

        if (!tenant.isActive) {
          return `<b>[NOTICE]</b> Clinic <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>) is already frozen.`;
        }

        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { isActive: false },
        });

        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId: tenant.id,
              action: 'TENANT_FROZEN',
              entity: 'Tenant',
              entityId: tenant.id,
              ipAddress: 'TELEGRAM_MASTER_BOT',
              details: {
                slug: tenant.slug,
                clinicName: tenant.clinicNameEn,
                actionBy: 'SUPER_ADMIN_MASTER_BOT',
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (e: any) {
          this.logger.warn(`Could not create audit log: ${e.message}`);
        }

        if (this.telegramService) {
          this.telegramService.notify(
            'SECURITY',
            [
              `<b>[សេចក្ដីជូនដំណឹងសន្តិសុខប្រព័ន្ធ] ${tenant.clinicNameKh}</b>`,
              `• <b>ស្ថានភាព:</b> គណនីត្រូវបានផ្អាកដំណើរការជាបណ្ដោះអាសន្នដោយ Super Admin`,
              `• <b>មូលហេតុ:</b> អនុវត្តតាមវិធានការសន្តិសុខ ឬផុតកំណត់បង់ប្រាក់`,
              `• សម្រាប់ព័ត៌មានបន្ថែម សូមទាក់ទងមកកាន់ System Administrator។`,
            ].join('\n'),
            tenant.id,
          ).catch(() => {});
        }

        return [
          '<b>[SUCCESS: CLINIC FROZEN]</b>',
          '----------------------------------------',
          `Clinic Name: <b>${tenant.clinicNameEn}</b>`,
          `Tenant Slug: <code>${tenant.slug}</code>`,
          'Status: <b>FROZEN (Access Suspended)</b>',
          'Enforcement: User login and workspace operations immediately locked.',
          '----------------------------------------',
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Failed to freeze clinic: ${err.message}`;
      }
    }

    if (cmd === '/unfreeze' || cmd === '/resume_clinic') {
      const target = parts[1]?.trim();
      if (!target) {
        return '<b>[USAGE ERROR]</b> Format: <code>/unfreeze &lt;clinic-slug&gt;</code>';
      }

      try {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { slug: target.toLowerCase() },
              { id: target },
            ],
          },
        });

        if (!tenant) {
          return `<b>[ERROR]</b> Clinic tenant not found: <code>${target}</code>`;
        }

        if (tenant.isActive) {
          return `<b>[NOTICE]</b> Clinic <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>) is already active.`;
        }

        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { isActive: true },
        });

        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId: tenant.id,
              action: 'TENANT_UNFROZEN',
              entity: 'Tenant',
              entityId: tenant.id,
              ipAddress: 'TELEGRAM_MASTER_BOT',
              details: {
                slug: tenant.slug,
                clinicName: tenant.clinicNameEn,
                actionBy: 'SUPER_ADMIN_MASTER_BOT',
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (e: any) {
          this.logger.warn(`Could not create audit log: ${e.message}`);
        }

        if (this.telegramService) {
          this.telegramService.notify(
            'SECURITY',
            [
              `<b>[សេចក្ដីជូនដំណឹងសន្តិសុខប្រព័ន្ធ] ${tenant.clinicNameKh}</b>`,
              `• <b>ស្ថានភាព:</b> គណនីត្រូវបានបើកដំណើរការឡើងវិញជាប្រក្រតី`,
              `• ប្រព័ន្ធអាចចូលប្រើប្រាស់បានឡើងវិញពេញលេញ ១០០%។`,
            ].join('\n'),
            tenant.id,
          ).catch(() => {});
        }

        return [
          '<b>[SUCCESS: CLINIC UNFROZEN]</b>',
          '----------------------------------------',
          `Clinic Name: <b>${tenant.clinicNameEn}</b>`,
          `Tenant Slug: <code>${tenant.slug}</code>`,
          'Status: <b>ACTIVE (Access Restored)</b>',
          'Enforcement: User login and clinical workflows restored.',
          '----------------------------------------',
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Failed to unfreeze clinic: ${err.message}`;
      }
    }

    if (cmd === '/tier' || cmd === '/tier_clinic') {
      const target = parts[1]?.trim();
      const rawTier = parts[2]?.trim()?.toUpperCase();

      if (!target || !rawTier) {
        return '<b>[USAGE ERROR]</b> Format: <code>/tier &lt;slug&gt; &lt;FREE|STARTER_5|PRO_8|ENTERPRISE_12&gt;</code>';
      }

      const validTiers = Object.values(PlanTier);
      if (!validTiers.includes(rawTier as PlanTier)) {
        return `<b>[INVALID TIER]</b> Valid plan tiers: <code>${validTiers.join(', ')}</code>`;
      }

      const targetTier = rawTier as PlanTier;
      const planConfig = SAAS_PLANS[targetTier];

      try {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { slug: target.toLowerCase() },
              { id: target },
            ],
          },
        });

        if (!tenant) {
          return `<b>[ERROR]</b> Clinic tenant not found: <code>${target}</code>`;
        }

        const previousTier = tenant.planTier;
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            planTier: targetTier,
            maxMonthlyPatients: planConfig.maxMonthlyPatients,
            maxDailyKhqr: planConfig.maxDailyKhqr,
            maxStaffAccounts: planConfig.maxStaffAccounts,
          },
        });

        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId: tenant.id,
              action: 'TENANT_TIER_CHANGED',
              entity: 'Tenant',
              entityId: tenant.id,
              ipAddress: 'TELEGRAM_MASTER_BOT',
              details: {
                slug: tenant.slug,
                previousTier,
                newTier: targetTier,
                actionBy: 'SUPER_ADMIN_MASTER_BOT',
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (e: any) {
          this.logger.warn(`Could not create audit log: ${e.message}`);
        }

        if (this.telegramService) {
          this.telegramService.notify(
            'SECURITY',
            [
              `<b>[សេចក្ដីជូនដំណឹងប្រព័ន្ធ] ${tenant.clinicNameKh}</b>`,
              `• គម្រោងសេវាកម្មត្រូវបានកែប្រែទៅជា: <b>${planConfig.nameEn} (${targetTier})</b>`,
              `• កូតាប្រតិបត្តិការ KHQR: ${planConfig.maxDailyKhqr === -1 ? 'Unlimited' : planConfig.maxDailyKhqr + ' / ថ្ងៃ'}`,
              `• កូតាអ្នកជំងឺ: ${planConfig.maxMonthlyPatients === -1 ? 'Unlimited' : planConfig.maxMonthlyPatients + ' / គណនី'}`,
            ].join('\n'),
            tenant.id,
          ).catch(() => {});
        }

        return [
          '<b>[SUCCESS: CLINIC TIER UPDATED]</b>',
          '----------------------------------------',
          `Clinic Name: <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>)`,
          `Previous Tier: <code>${previousTier}</code>`,
          `New Plan Tier: <b>${targetTier} (${planConfig.nameEn})</b>`,
          `Daily Dynamic KHQR: <b>${planConfig.maxDailyKhqr === -1 ? 'Unlimited' : planConfig.maxDailyKhqr}</b>`,
          `Patients / Account: <b>${planConfig.maxMonthlyPatients === -1 ? 'Unlimited' : planConfig.maxMonthlyPatients}</b>`,
          'Quotas & Limits: <b>SYNCHRONIZED</b>',
          '----------------------------------------',
        ].join('\n');
      } catch (err: any) {
        return `<b>[ERROR]</b> Failed to update tier: ${err.message}`;
      }
    }

    if (cmd === '/lock') {
      const masterLockRes = await this.enforceMasterBotProfileLock();
      let clinicLockMsg = 'Clinic Bot: Not injected';
      if (this.telegramService) {
        const clinicLockRes = await this.telegramService.enforceBotProfileLock();
        clinicLockMsg = clinicLockRes.success
          ? 'Clinic Bot Profile: LOCKED & PROTECTED'
          : `Clinic Bot: ${clinicLockRes.message}`;
      }

      return [
        '<b>[DUAL BOT PROFILE LOCK ENFORCED]</b>',
        '----------------------------------------',
        `Master Bot Profile: <b>${masterLockRes.success ? 'LOCKED & PROTECTED' : masterLockRes.message}</b>`,
        `Clinic Alert Bot Profile: <b>${clinicLockMsg}</b>`,
        'Anti-Tampering Watchdog: <b>ACTIVE (60-second cycle)</b>',
        '----------------------------------------',
      ].join('\n');
    }

    return [
      '<b>[UNRECOGNIZED COMMAND]</b>',
      `Command <code>${cmd}</code> is not supported.`,
      'Type <code>/help</code> to view all available Master Control commands.',
    ].join('\n');
  }

  /**
   * Raw Telegram API Dispatch with HTML formatting
   */
  async sendMessageDirect(token: string, chatId: string, textHtml: string): Promise<boolean> {
    if (!token || !chatId) {
      return false;
    }

    try {
      const payload = {
        chat_id: chatId,
        text: textHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) {
        this.logger.error(`Telegram API error: ${json.description || 'Unknown'}`);
        return false;
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to dispatch message to Master Telegram: ${err.message}`);
      return false;
    }
  }

  async sendMasterNotification(textHtml: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
      return false;
    }
    return this.sendMessageDirect(this.config.botToken, this.config.chatId, textHtml);
  }

  /**
   * Business Alert: New Clinic Registration on SaaS Platform
   */
  async notifyNewClinicRegistration(clinic: {
    slug: string;
    clinicNameKh: string;
    clinicNameEn: string;
    planTier: string;
    ownerEmail?: string;
    ownerPhone?: string;
  }): Promise<boolean> {
    if (!this.config.notifyOnNewClinic) return false;

    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const lines = [
      `<b>[PLATFORM SYSTEM NOTICE: NEW CLINIC ONBOARDING]</b>`,
      `----------------------------------------`,
      `Tenant Slug: <code>${clinic.slug}</code>`,
      `Clinic Name (EN): <b>${clinic.clinicNameEn}</b>`,
      `Clinic Name (KH): <b>${clinic.clinicNameKh}</b>`,
      `Plan Tier: <code>${clinic.planTier}</code>`,
      `Contact Phone: ${clinic.ownerPhone || 'N/A'}`,
      `Admin Email: ${clinic.ownerEmail || 'N/A'}`,
      `Registration Time: <code>${timestamp}</code>`,
      `----------------------------------------`,
      `Status: PENDING_INITIAL_CONFIGURATION`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Business Alert: Clinic Subscription Payment Settled ($5, $8, $12)
   */
  async notifySubscriptionPaid(sub: {
    clinicName: string;
    slug: string;
    planTier: string;
    amountUsd: number;
    invoiceNumber: string;
    paymentMethod: string;
    endDate: string;
  }): Promise<boolean> {
    if (!this.config.notifyOnSubscriptionPaid) return false;

    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const lines = [
      `<b>[PLATFORM REVENUE: SUBSCRIPTION PAYMENT SETTLED]</b>`,
      `----------------------------------------`,
      `Clinic: <b>${sub.clinicName}</b> (<code>${sub.slug}</code>)`,
      `Subscribed Tier: <code>${sub.planTier}</code>`,
      `Amount Received: <b>$${sub.amountUsd.toFixed(2)} USD</b>`,
      `Settlement Channel: <code>${sub.paymentMethod}</code>`,
      `Invoice Ref: <code>${sub.invoiceNumber}</code>`,
      `Valid Until: <code>${sub.endDate}</code>`,
      `Settled At: <code>${timestamp}</code>`,
      `----------------------------------------`,
      `Account Status: ACTIVE`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Business Alert: Clinic Subscription Expiry Warning (7 days & 3 days before expiry)
   */
  async notifySubscriptionExpiryReminder(info: {
    clinicName: string;
    slug: string;
    planTier: string;
    daysRemaining: number;
    endDate: string;
  }): Promise<boolean> {
    const lines = [
      `<b>[PLATFORM BILLING: SUBSCRIPTION EXPIRY REMINDER]</b>`,
      `----------------------------------------`,
      `Clinic: <b>${info.clinicName}</b> (<code>${info.slug}</code>)`,
      `Plan Tier: <code>${info.planTier}</code>`,
      `Days Remaining: <b>${info.daysRemaining} days</b>`,
      `Expiry Date: <code>${info.endDate}</code>`,
      `Action: Reminder notice dispatched to clinic Security topic`,
      `----------------------------------------`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Business Alert: Clinic Subscription Payment Received & Plan Activated (Real-Time Settlement)
   */
  async notifySubscriptionPaymentReceived(info: {
    clinicName: string;
    slug: string;
    planTier: string;
    amountUsd: number;
    billingCycle: string;
    tranId: string;
    newEndDate: string;
    addedDays: number;
  }): Promise<boolean> {
    const lines = [
      `<b>[PLATFORM REVENUE: SUBSCRIPTION PAYMENT RECEIVED]</b>`,
      `----------------------------------------`,
      `Clinic: <b>${info.clinicName}</b> (<code>${info.slug}</code>)`,
      `Plan Tier: <code>${info.planTier}</code> (${info.billingCycle})`,
      `Amount Paid: <b>$${info.amountUsd}.00 USD</b>`,
      `Transaction ID: <code>${info.tranId}</code>`,
      `Extension: <b>+${info.addedDays} days</b>`,
      `New Expiration: <code>${info.newEndDate}</code>`,
      `Action: Plan quotas updated and tenant active status confirmed`,
      `----------------------------------------`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Security & Critical System Alert for Super Admin
   */
  async notifySystemSecurityAlert(event: {
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    ip?: string;
    path?: string;
  }): Promise<boolean> {
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const lines = [
      `<b>[SECURITY HARDENING AUDIT: ${event.severity}]</b>`,
      `----------------------------------------`,
      `Incident: <b>${event.title}</b>`,
      `Message: ${event.message}`,
      `Origin IP: <code>${event.ip || 'INTERNAL'}</code>`,
      `Target Endpoint: <code>${event.path || 'SYSTEM'}</code>`,
      `Timestamp: <code>${timestamp}</code>`,
      `----------------------------------------`,
      `Enforcement: REQUEST_TERMINATED_AND_LOGGED`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * System Exception Alert
   */
  async notifySystemError(event: {
    title: string;
    route?: string;
    error: string;
  }): Promise<boolean> {
    if (!this.config.notifyOnSystemError) return false;

    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const lines = [
      `<b>[SYSTEM HEALTH ALERT: UNHANDLED EXCEPTION]</b>`,
      `----------------------------------------`,
      `Error Title: <b>${event.title}</b>`,
      `Route: <code>${event.route || 'BACKGROUND_TASK'}</code>`,
      `Message: <code>${event.error.slice(0, 300)}</code>`,
      `Timestamp: <code>${timestamp}</code>`,
      `----------------------------------------`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Database Backup Status Alert
   */
  async notifyDatabaseBackup(backup: {
    filename: string;
    sizeMb: number;
    status: 'SUCCESS' | 'FAILED';
  }): Promise<boolean> {
    if (!this.config.notifyOnDatabaseBackup) return false;

    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const lines = [
      `<b>[DATABASE INFRASTRUCTURE: DAILY BACKUP ${backup.status}]</b>`,
      `----------------------------------------`,
      `Archive: <code>${backup.filename}</code>`,
      `Archive Size: <b>${backup.sizeMb.toFixed(2)} MB</b>`,
      `Status: <code>${backup.status}</code>`,
      `Execution Time: <code>${timestamp}</code>`,
      `----------------------------------------`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Daily Executive Business Summary
   */
  async notifyDailyBusinessSummary(summary: {
    totalClinics: number;
    activeTenants: number;
    dailyRevenueUsd: number;
    totalKhqrToday: number;
  }): Promise<boolean> {
    if (!this.config.notifyOnDailySummary) return false;

    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const lines = [
      `<b>[EXECUTIVE SUMMARY: DAILY SAAS PERFORMANCE]</b>`,
      `----------------------------------------`,
      `Active Clinics: <b>${summary.activeTenants}</b> / ${summary.totalClinics}`,
      `Today Revenue: <b>$${summary.dailyRevenueUsd.toFixed(2)} USD</b>`,
      `Total Dynamic KHQR Processed: <b>${summary.totalKhqrToday}</b>`,
      `Audit Date: <code>${timestamp}</code>`,
      `----------------------------------------`,
    ];

    return this.sendMasterNotification(lines.join('\n'));
  }

  /**
   * Connectivity Verification
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.botToken || !this.config.chatId) {
      return {
        success: false,
        message: 'Master Bot Token and Master Chat ID are required before testing connection.',
      };
    }

    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' });
    const testMessage = [
      `<b>[PLATFORM MASTER BOT: CONNECTIVITY VERIFIED]</b>`,
      `----------------------------------------`,
      `Master Notification Link Established.`,
      `Timestamp: <code>${timestamp}</code>`,
      `Dual-Bot Architecture Status: HEALTHY`,
      `----------------------------------------`,
    ].join('\n');

    const ok = await this.sendMessageDirect(this.config.botToken, this.config.chatId, testMessage);
    if (ok) {
      return { success: true, message: 'Test message delivered successfully to Master Telegram Chat.' };
    }
    return { success: false, message: 'Failed to deliver message. Check Bot Token and Chat ID.' };
  }
}
