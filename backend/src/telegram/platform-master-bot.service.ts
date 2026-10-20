import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

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
    botName: 'SaaS_Master_Platform_Bot',
    notifyOnNewClinic: true,
    notifyOnSubscriptionPaid: true,
    notifyOnSystemError: true,
    notifyOnDatabaseBackup: true,
    notifyOnDailySummary: true,
  };

  private pollerTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastUpdateId = 0;

  constructor(private readonly prisma: PrismaService) {
    this.loadConfig();
  }

  onModuleInit() {
    this.logger.log(`Platform Master Bot Service initialized. Active: ${this.config.enabled}`);
    if (this.config.enabled && this.config.botToken) {
      this.startMasterBotPoller();
    }
  }

  onModuleDestroy() {
    this.stopMasterBotPoller();
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
      botName: this.config.botName || 'SaaS_Master_Platform_Bot',
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
        await this.handleMasterCommand(token, senderChatId, text);
      }
    } catch (err: any) {
      this.logger.debug(`Master Bot poll error: ${err.message}`);
    }
  }

  private async handleMasterCommand(token: string, chatId: string, text: string) {
    const cmd = text.split(' ')[0].toLowerCase();

    if (cmd === '/start' || cmd === '/help') {
      const menu = [
        `<b>[SAAS PLATFORM MASTER CONTROL COMMANDS]</b>`,
        `----------------------------------------`,
        `<code>/status</code> - Real-time system health, uptime, and database state`,
        `<code>/clinics</code> - Registered clinic tenants and plan tiers`,
        `<code>/revenue</code> - Financial metrics and subscription revenue`,
        `<code>/ping</code> - Connectivity latency test`,
        `----------------------------------------`,
        `Operator: SUPER_ADMIN`,
      ].join('\n');
      await this.sendMessageDirect(token, chatId, menu);
    } else if (cmd === '/ping') {
      await this.sendMessageDirect(token, chatId, '<b>[PONG]</b> Platform Master Bot is online and responsive.');
    } else if (cmd === '/status') {
      try {
        const tenantCount = await this.prisma.tenant.count();
        const activeCount = await this.prisma.tenant.count({ where: { isActive: true } });
        const patientCount = await this.prisma.patient.count();
        const invoiceCount = await this.prisma.invoice.count();
        const uptimeMins = Math.floor(process.uptime() / 60);

        const reply = [
          `<b>[PLATFORM SYSTEM STATUS METRICS]</b>`,
          `----------------------------------------`,
          `SaaS Platform: Clinic Patient Management OS`,
          `Uptime: <b>${uptimeMins} minutes</b>`,
          `Registered Clinics: <b>${tenantCount}</b> (Active: <b>${activeCount}</b>)`,
          `Total Global Patients: <b>${patientCount}</b>`,
          `Total Global Invoices: <b>${invoiceCount}</b>`,
          `PostgreSQL DB: <b>CONNECTED & HEALTHY</b>`,
          `Dual-Bot Service: <b>ACTIVE</b>`,
          `----------------------------------------`,
        ].join('\n');
        await this.sendMessageDirect(token, chatId, reply);
      } catch (err: any) {
        await this.sendMessageDirect(token, chatId, `<b>[ERROR]</b> Could not query status: ${err.message}`);
      }
    } else if (cmd === '/clinics') {
      try {
        const clinics = await this.prisma.tenant.findMany({
          select: { slug: true, clinicNameEn: true, planTier: true, isActive: true },
          take: 10,
        });

        const clinicLines = clinics.map(
          (c, idx) => `${idx + 1}. <b>${c.clinicNameEn}</b> (<code>${c.slug}</code>) - [${c.planTier}]`,
        );

        const reply = [
          `<b>[REGISTERED CLINIC TENANTS]</b>`,
          `----------------------------------------`,
          clinicLines.length > 0 ? clinicLines.join('\n') : 'No clinics registered yet.',
          `----------------------------------------`,
          `Total Displayed: ${clinics.length}`,
        ].join('\n');
        await this.sendMessageDirect(token, chatId, reply);
      } catch (err: any) {
        await this.sendMessageDirect(token, chatId, `<b>[ERROR]</b> Could not query clinics: ${err.message}`);
      }
    } else if (cmd === '/revenue') {
      try {
        const subCount = await this.prisma.tenantSubscription.count();
        const activeSubs = await this.prisma.tenantSubscription.count({ where: { status: 'ACTIVE' } });
        const totalRevenue = await this.prisma.tenantSubscription.aggregate({
          _sum: { amountUsd: true },
        });

        const sumUsd = totalRevenue._sum.amountUsd ? Number(totalRevenue._sum.amountUsd) : 0;

        const reply = [
          `<b>[SAAS SUBSCRIPTION REVENUE METRICS]</b>`,
          `----------------------------------------`,
          `Total Subscriptions: <b>${subCount}</b>`,
          `Active Subscriptions: <b>${activeSubs}</b>`,
          `Total Gross Revenue: <b>$${sumUsd.toFixed(2)} USD</b>`,
          `Settlement Model: KHQR Deep Link Dynamic Settlement`,
          `----------------------------------------`,
        ].join('\n');
        await this.sendMessageDirect(token, chatId, reply);
      } catch (err: any) {
        await this.sendMessageDirect(token, chatId, `<b>[ERROR]</b> Could not query revenue: ${err.message}`);
      }
    }
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
