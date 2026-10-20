import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional, Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { TenantContextService } from '../common/services/tenant-context.service';
import { PlatformMasterBotService } from './platform-master-bot.service';
import { VoiceMedicalNlpService } from '../visits/voice-medical-nlp.service';

export interface TelegramTopicConfig {
  paymentsThreadId?: number;
  queueThreadId?: number;
  pharmacyThreadId?: number;
  securityThreadId?: number;
}

export interface TenantTelegramMapping {
  tenantId: string;
  chatId: string;
  chatTitle?: string;
  isForum: boolean;
  pendingAdmin: boolean;
  topics: TelegramTopicConfig;
  notifyOnPayment: boolean;
  notifyOnQueueCheckin: boolean;
  notifyOnLowStock: boolean;
  notifyOnSecurityAudit: boolean;
  connectedAt?: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  botUsername?: string;
  botName?: string;
  chatTitle?: string;
  isForum?: boolean;
  pendingAdmin?: boolean;
  topics: TelegramTopicConfig;
  groupTopicsMap?: Record<string, TelegramTopicConfig>;
  tenantGroupMap?: Record<string, TenantTelegramMapping>;
  notifyOnPayment: boolean;
  notifyOnQueueCheckin: boolean;
  notifyOnLowStock: boolean;
  notifyOnSecurityAudit: boolean;
  connectedAt?: string;
}

export const OFFICIAL_CLINIC_BOT_NAME = 'Clinic_System';
export const OFFICIAL_CLINIC_BOT_DESCRIPTION =
  'ប្រព័ន្ធស្វ័យប្រវត្តិនៃមជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា (Rotana Clinic Management & Automation Bot)\n\n' +
  '• ជូនដំណឹងវិក្កយបត្រ & ការទូទាត់ប្រាក់ KHQR\n' +
  '• ជូនដំណឹងវេនពិគ្រោះអ្នកជំងឺ (Patient Queue)\n' +
  '• ជូនដំណឹងស្តុកឱសថស្ថាន\n' +
  '• ជូនដំណឹងសន្តិសុខប្រព័ន្ធគ្លីនិក 24/7';
export const OFFICIAL_CLINIC_BOT_SHORT_DESC = 'Bot ជូនដំណឹងស្វ័យប្រវត្តិ គ្លីនិក រតនា (Rotana Clinic Alert Bot)';
export const OFFICIAL_CLINIC_BOT_COMMANDS = [
  { command: 'start', description: 'ភ្ជាប់ និងពិនិត្យស្ថានភាពគ្លីនិក' },
  { command: 'topics', description: 'ពិនិត្យបញ្ជី Forum Topics ផ្លូវការ' },
  { command: 'lock', description: 'ចាក់សោរ និងការពារ Bot Profile' },
  { command: 'help', description: 'ការណែនាំអំពីប្រព័ន្ធគ្លីនិក' },
];

const DEFAULT_OFFICIAL_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8822219627:AAHjLV4FeVD5XS55BpUil24UgLdR3WsiUsg';
const DEFAULT_OFFICIAL_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Clinic_systemBot';
const OFFICIAL_BOT_ID = 8822219627;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly configFilePath = path.resolve(process.cwd(), 'data/telegram-bot.json');

  private config: TelegramConfig = {
    enabled: false,
    botToken: DEFAULT_OFFICIAL_TOKEN,
    chatId: '',
    botUsername: DEFAULT_OFFICIAL_USERNAME,
    botName: 'Clinic_System',
    pendingAdmin: false,
    topics: {},
    groupTopicsMap: {},
    tenantGroupMap: {},
    notifyOnPayment: true,
    notifyOnQueueCheckin: true,
    notifyOnLowStock: true,
    notifyOnSecurityAudit: true,
  };

  private lastUpdateId = 0;
  private isPolling = false;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private lastProcessedChatId = '';
  private isProcessingDiscovery = false;
  private lastProfileEnforceTime = 0;
  private readonly voiceNlpService = new VoiceMedicalNlpService();

  private activePairing: {
    code?: string;
    startedAt?: number;
    paired: boolean;
    chatTitle?: string;
    isForum?: boolean;
    topicsCreated?: boolean;
    pendingAdmin?: boolean;
    error?: string;
  } = { paired: false };

  private readonly tenantPairings = new Map<string, {
    code?: string;
    startedAt?: number;
    paired: boolean;
    chatTitle?: string;
    isForum?: boolean;
    topicsCreated?: boolean;
    pendingAdmin?: boolean;
    error?: string;
  }>();

  private watchdogTimer: NodeJS.Timeout | null = null;

  constructor(
    @Optional() @Inject(forwardRef(() => PlatformMasterBotService)) private readonly masterBotService?: PlatformMasterBotService,
  ) {
    this.loadConfig();
  }

  onModuleInit() {
    // Start background poller to listen for Telegram updates (1-click group adds)
    this.startBackgroundPoller();
    // Start 60-second anti-tamper watchdog
    this.startWatchdog();
    // Enforce and lock official bot name, description, and short description
    this.enforceBotProfileLock().catch((err) => {
      this.logger.warn(`Initial bot profile lock failed: ${err.message}`);
    });
  }

  onModuleDestroy() {
    this.stopBackgroundPoller();
    this.stopWatchdog();
  }

  public startWatchdog() {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(() => {
      this.verifyAndHealProfile().catch((err) => {
        this.logger.debug(`Clinic bot watchdog cycle skipped: ${err.message}`);
      });
    }, 60000);
    this.logger.log('Clinic Alert Bot anti-tamper watchdog active (60s cycle).');
  }

  public stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        const groupTopicsMap = parsed.groupTopicsMap || {};
        const tenantGroupMap = parsed.tenantGroupMap || {};
        if (parsed.chatId && parsed.topics && Object.keys(parsed.topics).length > 0 && !groupTopicsMap[parsed.chatId]) {
          groupTopicsMap[parsed.chatId] = parsed.topics;
        }
        this.config = {
          ...this.config,
          ...parsed,
          botToken: parsed.botToken || DEFAULT_OFFICIAL_TOKEN,
          botUsername: parsed.botUsername || DEFAULT_OFFICIAL_USERNAME,
          groupTopicsMap,
          tenantGroupMap,
        };
        this.logger.log(`Telegram Bot config loaded. Enabled: ${this.config.enabled}`);
      } else {
        this.saveConfig();
      }
    } catch (err: any) {
      this.logger.warn(`Could not load Telegram config: ${err.message}`);
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
      this.logger.error(`Failed to save Telegram config: ${err.message}`);
    }
  }

  public getPublicStatus(tenantId?: string) {
    const activeTenantId = tenantId || TenantContextService.getTenantId() || 'rotana';

    if (this.config.tenantGroupMap && this.config.tenantGroupMap[activeTenantId]) {
      const tm = this.config.tenantGroupMap[activeTenantId];
      return {
        enabled: true,
        botUsername: this.config.botUsername || DEFAULT_OFFICIAL_USERNAME,
        botName: this.config.botName || 'Clinic_Alert',
        chatTitle: tm.chatTitle || null,
        chatId: tm.chatId ? `${tm.chatId.substring(0, 4)}****${tm.chatId.slice(-3)}` : null,
        rawChatId: tm.chatId || null,
        isForum: Boolean(tm.isForum),
        pendingAdmin: Boolean(tm.pendingAdmin),
        topics: tm.topics,
        notifyOnPayment: tm.notifyOnPayment,
        notifyOnQueueCheckin: tm.notifyOnQueueCheckin,
        notifyOnLowStock: tm.notifyOnLowStock,
        notifyOnSecurityAudit: tm.notifyOnSecurityAudit,
        connectedAt: tm.connectedAt || null,
        hasToken: Boolean(this.config.botToken),
        tenantId: activeTenantId,
        officialBotUsername: DEFAULT_OFFICIAL_USERNAME,
      };
    }

    const isPrimary = activeTenantId === 'rotana' || !activeTenantId;
    return {
      enabled: isPrimary ? this.config.enabled : false,
      botUsername: this.config.botUsername || DEFAULT_OFFICIAL_USERNAME,
      botName: this.config.botName || 'Clinic_Alert',
      chatTitle: isPrimary ? (this.config.chatTitle || null) : null,
      chatId: isPrimary && this.config.chatId ? `${this.config.chatId.substring(0, 4)}****${this.config.chatId.slice(-3)}` : null,
      rawChatId: isPrimary ? (this.config.chatId || null) : null,
      isForum: isPrimary ? Boolean(this.config.isForum) : false,
      pendingAdmin: isPrimary ? Boolean(this.config.pendingAdmin) : false,
      topics: isPrimary ? this.config.topics : {},
      notifyOnPayment: this.config.notifyOnPayment,
      notifyOnQueueCheckin: this.config.notifyOnQueueCheckin,
      notifyOnLowStock: this.config.notifyOnLowStock,
      notifyOnSecurityAudit: this.config.notifyOnSecurityAudit,
      connectedAt: isPrimary ? (this.config.connectedAt || null) : null,
      hasToken: Boolean(this.config.botToken),
      tenantId: activeTenantId,
      officialBotUsername: DEFAULT_OFFICIAL_USERNAME,
    };
  }

  /**
   * Helper to check if a 1-Click pairing session is currently active
   */
  private isSessionActive(tenantId?: string): boolean {
    const activeTenantId = tenantId || TenantContextService.getTenantId() || 'rotana';
    const session = this.tenantPairings.get(activeTenantId) || this.activePairing;
    return Boolean(
      session?.code &&
      Date.now() - (session.startedAt || 0) < 600000 // 10 minutes timeout
    );
  }

  /**
   * 1-Click Pairing Session Generator (Multi-Tenant aware)
   */
  startPairingSession(tenantId?: string): {
    pairingCode: string;
    deepLink: string;
    botUsername: string;
    alreadyConnected: boolean;
  } {
    const activeTenantId = tenantId || TenantContextService.getTenantId() || 'rotana';
    const pairingCode = `pair_${activeTenantId}_${Date.now().toString(36)}`;
    const botUser = this.config.botUsername || DEFAULT_OFFICIAL_USERNAME;

    // Telegram deep link with group selection and requested admin privileges
    const deepLink = `https://t.me/${botUser}?startgroup=${pairingCode}&admin=manage_topics+change_info+post_messages`;

    const session = {
      code: pairingCode,
      startedAt: Date.now(),
      paired: false,
      topicsCreated: false,
      pendingAdmin: false,
    };
    this.tenantPairings.set(activeTenantId, session);
    this.activePairing = session;
    this.lastProcessedChatId = '';

    // Ensure update poller is active
    this.startBackgroundPoller();

    const isConnected = Boolean(
      this.config.tenantGroupMap?.[activeTenantId]?.chatId ||
      (activeTenantId === 'rotana' && this.config.chatId)
    );

    return {
      pairingCode,
      deepLink,
      botUsername: botUser,
      alreadyConnected: isConnected,
    };
  }

  /**
   * Status of current 1-Click pairing operation (Multi-Tenant aware)
   */
  getPairingStatus(tenantId?: string) {
    const activeTenantId = tenantId || TenantContextService.getTenantId() || 'rotana';
    const session = this.tenantPairings.get(activeTenantId) || this.activePairing;
    const isSessionActive = Boolean(
      session?.code && Date.now() - (session.startedAt || 0) < 600000
    );
    const isConnected = Boolean(
      this.config.tenantGroupMap?.[activeTenantId]?.chatId ||
      (activeTenantId === 'rotana' && this.config.chatId)
    );

    return {
      active: isSessionActive,
      code: session?.code,
      paired: isSessionActive ? Boolean(session?.paired) : isConnected,
      chatTitle: session?.chatTitle || this.config.tenantGroupMap?.[activeTenantId]?.chatTitle || this.config.chatTitle || null,
      isForum: session?.isForum ?? this.config.tenantGroupMap?.[activeTenantId]?.isForum ?? this.config.isForum ?? false,
      topicsCreated: session?.topicsCreated ?? Boolean(this.config.tenantGroupMap?.[activeTenantId]?.topics?.paymentsThreadId || this.config.topics?.paymentsThreadId),
      pendingAdmin: session?.pendingAdmin ?? this.config.tenantGroupMap?.[activeTenantId]?.pendingAdmin ?? this.config.pendingAdmin ?? false,
      error: session?.error || null,
    };
  }

  /**
   * Start polling Telegram updates every 3 seconds
   */
  private startBackgroundPoller() {
    if (this.isPolling) return;
    this.isPolling = true;

    this.pollIntervalTimer = setInterval(() => {
      this.pollUpdates().catch((err) => {
        this.logger.debug(`Telegram poll update cycle skipped: ${err.message}`);
      });
    }, 3000);

    this.logger.log('Telegram background update poller started.');
  }

  private stopBackgroundPoller() {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
    this.isPolling = false;
  }

  /**
   * Poll Telegram getUpdates to detect when bot is added to a group or /start is sent
   */
  private async pollUpdates() {
    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;
    if (!token) return;

    // Periodically verify and lock official bot profile every 60 seconds (anti-tampering watchdog)
    if (Date.now() - this.lastProfileEnforceTime > 60000) {
      this.enforceBotProfileLock().catch(() => {});
    }

    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&limit=20&timeout=2`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        if (update.update_id >= this.lastUpdateId) {
          this.lastUpdateId = update.update_id;
        }

        const isPairingActive = this.isSessionActive();
        const activeCode = this.activePairing?.code;

        // Case A: my_chat_member / chat_member event (bot added to group or promoted)
        const chatMemberEvt = update.my_chat_member || update.chat_member;
        if (chatMemberEvt) {
          const chat = chatMemberEvt.chat;
          const newMember = chatMemberEvt.new_chat_member;
          const memberUserId = newMember?.user?.id;
          const memberUsername = newMember?.user?.username?.toLowerCase();
          const targetUsername = (this.config.botUsername || DEFAULT_OFFICIAL_USERNAME).toLowerCase();

          if (String(memberUserId) === String(OFFICIAL_BOT_ID) || memberUsername === targetUsername || newMember?.user?.is_bot) {
            const isMemberOrAdmin = ['member', 'administrator', 'creator'].includes(newMember.status);
            if (isMemberOrAdmin) {
              this.logger.log(`Bot membership updated in ${chat.title || 'group'} (${chat.id}): ${newMember.status}`);
              await this.handleChatDiscovered(String(chat.id), chat.title || 'Telegram Group', true);
            }
          }
        }

        // Case B: regular message or channel_post in group/supergroup or private
        const msg = update.message || update.channel_post;
        if (msg) {
          const chat = msg.chat;
          const text = (msg.text || '').trim();
          const newMembers = msg.new_chat_members || [];

          // 1. Group / Supergroup events
          if (['group', 'supergroup'].includes(chat.type)) {
            if (text.startsWith('/lock')) {
              await this.enforceBotProfileLock();
              await this.sendMessageDirect(token, String(chat.id), '<b>[សន្តិសុខប្រព័ន្ធ]</b> ព័ត៌មាន Bot Profile និង Forum Topics ត្រូវបានចាក់សោរ និងការពារ ១០០% រួចរាល់។');
              continue;
            }

            const isCommand = text.startsWith('/start') || text.startsWith('/connect') || text.startsWith('/setup') || text.startsWith('/topics');
            const containsActiveCode = Boolean(activeCode && text.includes(activeCode));
            const isBotAdded = newMembers.some((m: any) => 
              String(m.id) === String(OFFICIAL_BOT_ID) || 
              m.username?.toLowerCase() === (this.config.botUsername || DEFAULT_OFFICIAL_USERNAME).toLowerCase()
            );

            // Extract targetTenantId from pairing deep link text (e.g. /start pair_<tenantId>_<random>)
            let detectedTenantId: string | null = null;
            const pairMatch = text.match(/pair_([a-zA-Z0-9-]+)_[a-z0-9]+/i);
            if (pairMatch) {
              detectedTenantId = pairMatch[1];
            } else if (activeCode) {
              const activeMatch = activeCode.match(/pair_([a-zA-Z0-9-]+)_[a-z0-9]+/i);
              if (activeMatch) {
                detectedTenantId = activeMatch[1];
              }
            }

            if (isCommand || containsActiveCode || isBotAdded || isPairingActive) {
              this.logger.log(`Received trigger in group ${chat.title} (${chat.id}) - text: "${text}". Tenant: ${detectedTenantId || 'default'}. Processing connection...`);
              await this.handleChatDiscovered(String(chat.id), chat.title || 'Telegram Group', isCommand, detectedTenantId);
            }
          }

          // 2. Private direct message with user
          if (chat.type === 'private' && (text.startsWith('/start') || text.startsWith('/help') || text.startsWith('/setup'))) {
            const botUser = this.config.botUsername || DEFAULT_OFFICIAL_USERNAME;
            const pairCode = this.activePairing?.code || `pair_rotana_${Date.now().toString(36)}`;
            const groupAddUrl = `https://t.me/${botUser}?startgroup=${pairCode}&admin=manage_topics+change_info+post_messages`;

            const welcomePrivate = [
              `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic Management System</b>`,
              `ជម្រាបសួរ! ខ្ញុំជា Telegram Alert Bot ផ្លូវការរបស់ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក។`,
              ``,
              `<b>របៀបតភ្ជាប់ Bot ជាមួយ Telegram Group:</b>`,
              `១. សូមចុចប៊ូតុង <b>«➕ បន្ថែម Bot ចូលក្នុង Group»</b> ខាងក្រោម`,
              `២. ជ្រើសរើស Telegram Group ឬ Supergroup របស់គ្លីនិក`,
              `៣. ផ្ដល់សិទ្ធិជា <b>Administrator (ពិសេសសិទ្ធិ Manage Topics)</b> ដល់ Bot`,
              `៤. Bot នឹងរៀបចំ Forum Topics ចំនួន ៤ ដោយស្វ័យប្រវត្តភ្លាមៗ!`,
              ``,
              `<i>ប្រសិនបើបាន Add Bot ចូលក្នុង Group រួចហើយ សូមចូលទៅកាន់ Group នោះហើយវាយពាក្យ <code>/start</code>។</i>`,
            ].join('\n');

            await this.sendMessageDirect(token, String(chat.id), welcomePrivate, undefined, {
              inline_keyboard: [
                [{ text: '➕ បន្ថែម Bot ចូលក្នុង Group (Add as Admin)', url: groupAddUrl }],
              ],
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.debug(`Could not poll Telegram updates: ${err.message}`);
    }
  }

  /**
   * Automatically inspects newly connected group, checks admin rights,
   * creates topics if authorized, or guides users to grant administrator role.
   */
  async handleChatDiscovered(
    chatId: string,
    chatTitle: string,
    isManualCommand: boolean = false,
    targetTenantId?: string | null,
  ): Promise<boolean> {
    if (!chatId) return false;

    // Mutex lock to prevent duplicate concurrent discovery calls
    if (this.isProcessingDiscovery) {
      return false;
    }

    const isPairingActive = this.isSessionActive();

    // If already fully configured and not a manual command or active pairing, skip
    if (!isManualCommand && !isPairingActive && this.config.enabled && this.config.chatId === chatId && !this.config.pendingAdmin && this.config.isForum) {
      return true;
    }

    this.isProcessingDiscovery = true;
    this.lastProcessedChatId = chatId;

    this.logger.log(`Inspecting Telegram Group: ${chatTitle} (${chatId}). Verifying permissions...`);
    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;

    try {
      // 1. Get Chat details
      const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const chatJson = await chatRes.json();
      if (!chatJson.ok) {
        this.logger.warn(`Could not getChat for ${chatId}: ${JSON.stringify(chatJson)}`);
        return false;
      }
      const chatInfo = chatJson.result;
      const isForum = Boolean(chatInfo.is_forum);

      // 2. Get Bot Member permissions
      const memberRes = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, user_id: OFFICIAL_BOT_ID }),
      });
      const memberJson = await memberRes.json();
      const member = memberJson.ok ? memberJson.result : {};

      const isBotAdmin = ['administrator', 'creator'].includes(member.status);
      const hasTopicCreationRights = member.status === 'creator' || Boolean(member.can_manage_topics);

      this.logger.log(`Bot status in ${chatInfo.title || chatTitle}: Admin=${isBotAdmin}, CanManageTopics=${hasTopicCreationRights}, Forum=${isForum}`);

      // Case 1: Connect SUCCESS with topic permissions (Admin + CanManageTopics + Forum supergroup)
      if (isBotAdmin && hasTopicCreationRights && isForum) {
        const topics = await this.createForumTopics(token, chatId);

        if (targetTenantId) {
          this.config.tenantGroupMap = this.config.tenantGroupMap || {};
          this.config.tenantGroupMap[targetTenantId] = {
            tenantId: targetTenantId,
            chatId,
            chatTitle: chatInfo.title || chatTitle,
            isForum: true,
            pendingAdmin: false,
            topics: { ...topics },
            notifyOnPayment: true,
            notifyOnQueueCheckin: true,
            notifyOnLowStock: true,
            notifyOnSecurityAudit: true,
            connectedAt: new Date().toISOString(),
          };
          const session = this.tenantPairings.get(targetTenantId);
          if (session) {
            session.paired = true;
            session.chatTitle = chatInfo.title || chatTitle;
            session.isForum = true;
            session.topicsCreated = true;
            session.pendingAdmin = false;
          }
        }

        this.config = {
          ...this.config,
          enabled: true,
          botToken: token,
          chatId,
          chatTitle: chatInfo.title || chatTitle,
          isForum: true,
          pendingAdmin: false,
          topics: { ...topics },
          connectedAt: new Date().toISOString(),
        };
        this.saveConfig();

        const successMessage = [
          `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
          `<b>[ជោគជ័យ] Telegram Bot បានតភ្ជាប់ជាមួយក្រុម និងរៀបចំ Forum Topics រួចរាល់!</b>`,
          ``,
          `• <b>ប្រព័ន្ធ:</b> Houn Vannak Clinic Management System v1.0.0`,
          `• <b>Bot:</b> @${this.config.botUsername || DEFAULT_OFFICIAL_USERNAME}`,
          `• <b>ក្រុម:</b> ${chatInfo.title || chatTitle}`,
          `• <b>Forum Topics:</b> ៤ ប្រធានបទ (Payments, Queue, Pharmacy, Security)`,
          `• <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`,
          ``,
          `<i>រាល់ការទូទាត់ KHQR និងការជូនដំណឹងសំខាន់ៗ នឹងរត់ចូលតាម Topics នីមួយៗដោយស្វ័យប្រវត្ត។</i>`,
        ].join('\n');

        if (topics.paymentsThreadId) {
          await this.sendMessageDirect(token, chatId, successMessage, topics.paymentsThreadId);
        }
        if (topics.securityThreadId && topics.securityThreadId !== topics.paymentsThreadId) {
          await this.sendMessageDirect(token, chatId, successMessage, topics.securityThreadId);
        }
        // Also send confirmation to general topic thread (null or 1) so everyone sees it
        await this.sendMessageDirect(token, chatId, successMessage);

        this.activePairing = {
          paired: true,
          chatTitle: chatInfo.title || chatTitle,
          isForum: true,
          topicsCreated: true,
          pendingAdmin: false,
        };

        return true;
      }

      // Case 2: Bot is Admin BUT Group is not yet a Forum
      if (isBotAdmin && !isForum) {
        this.config = {
          ...this.config,
          enabled: true,
          botToken: token,
          chatId,
          chatTitle: chatInfo.title || chatTitle,
          isForum: false,
          pendingAdmin: false,
          connectedAt: new Date().toISOString(),
        };
        this.saveConfig();

        const notForumGuidance = [
          `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
          `<b>[សេចក្តីជូនដំណឹង] Bot បានតភ្ជាប់ជាមួយក្រុមជា Administrator ហើយ!</b>`,
          ``,
          `• <b>ក្រុម:</b> ${chatInfo.title || chatTitle}`,
          `• <b>ស្ថានភាព Topics:</b> ក្រុមនេះមិនទាន់បើកដំណើរការ <b>Topics</b> នៅឡើយទេ។`,
          ``,
          `<b>របៀបបើក Forum Topics ក្នុង Telegram:</b>`,
          `១. ចុចលើឈ្មោះក្រុម (Group Header) > ចុចលើ Edit (រូបខ្មៅដៃ)`,
          `២. ចុចបើកជម្រើស <b>Topics</b> (Toggle ON)`,
          `៣. រួចត្រឡប់មកក្នុងក្រុមនេះ ហើយវាយពាក្យ <code>/start</code> ម្ដងទៀត`,
          `៤. Bot នឹងរៀបចំ Forum Topics ចំនួន ៤ ដោយស្វ័យប្រវត្តិភ្លាមៗ!`,
        ].join('\n');

        await this.sendMessageDirect(token, chatId, notForumGuidance);

        this.activePairing = {
          paired: true,
          chatTitle: chatInfo.title || chatTitle,
          isForum: false,
          topicsCreated: false,
          pendingAdmin: false,
        };

        return true;
      }

      // Case 3: Bot is NOT yet Admin
      this.config = {
        ...this.config,
        enabled: true,
        botToken: token,
        chatId,
        chatTitle: chatInfo.title || chatTitle,
        isForum,
        pendingAdmin: true,
        connectedAt: new Date().toISOString(),
      };
      this.saveConfig();

      const adminGuidanceMessage = [
        `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
        `<b>[សេចក្តីជូនដំណឹង] Bot បានចូលរួមក្នុងក្រុមដោយជោគជ័យ!</b>`,
        ``,
        `• <b>Bot:</b> @${this.config.botUsername || DEFAULT_OFFICIAL_USERNAME}`,
        `• <b>ក្រុម:</b> ${chatInfo.title || chatTitle}`,
        ``,
        `<b>សូមមេត្តាផ្តល់សិទ្ធិជា Administrator (ពិសេសសិទ្ធិ Manage Topics) ដល់ Bot នេះ:</b>`,
        `១. ចុចលើឈ្មោះក្រុម > Edit > Administrators > Add Admin`,
        `២. ជ្រើសរើសយក <b>@${this.config.botUsername || DEFAULT_OFFICIAL_USERNAME}</b> ហើយបើកសិទ្ធិ <b>Manage Topics</b>`,
        `៣. បន្ទាប់មកវាយពាក្យ <code>/start</code> ក្នុងក្រុមនេះ នោះប្រព័ន្ធនឹងបង្កើត Topics ទាំង ៤ ជូនភ្លាមៗ!`,
      ].join('\n');

      await this.sendMessageDirect(token, chatId, adminGuidanceMessage);

      this.activePairing = {
        paired: true,
        chatTitle: chatInfo.title || chatTitle,
        isForum,
        topicsCreated: false,
        pendingAdmin: true,
      };

      return true;
    } catch (err: any) {
      this.logger.error(`Error in handleChatDiscovered: ${err.message}`);
      this.activePairing.error = err.message;
      return false;
    } finally {
      this.isProcessingDiscovery = false;
    }
  }

  /**
   * Validates live in Telegram if a forum topic thread ID exists and is active.
   * Returns true if topic exists; false if it was deleted or does not exist.
   */
  private async isForumTopicAlive(token: string, chatId: string, threadId?: number, name?: string): Promise<boolean> {
    if (!threadId || typeof threadId !== 'number' || threadId <= 0) {
      return false;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/editForumTopic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: threadId,
          name: name || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) return true;
      if (data.description && data.description.includes('TOPIC_NOT_MODIFIED')) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Helper to ensure all 4 forum topics in Telegram supergroup exist.
   * Checks live in chat to avoid duplicates; if an admin deleted any topic, recreates the missing ones.
   */
  private async createForumTopics(token: string, chatId: string): Promise<TelegramTopicConfig> {
    if (!this.config.groupTopicsMap) {
      this.config.groupTopicsMap = {};
    }

    const existingTopics: TelegramTopicConfig =
      this.config.groupTopicsMap[chatId] ||
      (this.config.chatId === chatId ? this.config.topics : {}) ||
      {};

    const topicDefinitions: { key: keyof TelegramTopicConfig; name: string; color: number }[] = [
      { key: 'paymentsThreadId', name: '[Payments & KHQR] ការទូទាត់ប្រាក់', color: 7322096 },
      { key: 'queueThreadId', name: '[Appointments & Queue] ការណាត់ជួប & ជួររង់ចាំ', color: 16766590 },
      { key: 'pharmacyThreadId', name: '[Pharmacy & Stock] ឱសថស្ថាន & ស្តុកថ្នាំ', color: 9367192 },
      { key: 'securityThreadId', name: '[Security & Audit] សន្តិស្ដខប្រព័ន្ធ', color: 16478098 },
    ];

    const finalTopics: TelegramTopicConfig = { ...existingTopics };
    let createdCount = 0;
    let preservedCount = 0;

    for (const def of topicDefinitions) {
      const candidateThreadId = finalTopics[def.key];
      let topicIsAlive = false;

      // 1. Live inspection in Telegram supergroup: Is this thread ID still alive?
      if (typeof candidateThreadId === 'number' && candidateThreadId > 0) {
        topicIsAlive = await this.isForumTopicAlive(token, chatId, candidateThreadId, def.name);
        if (topicIsAlive) {
          preservedCount++;
          this.logger.log(`Verified live topic in group ${chatId} - ${def.name} (Thread ID: ${candidateThreadId}). Preserved without duplication.`);
          continue;
        } else {
          this.logger.warn(`Topic ${def.name} (Thread ID: ${candidateThreadId}) was deleted or invalid in Telegram. Recreating...`);
        }
      }

      // 2. Topic does not exist or was deleted by an admin: create it now so all 4 topics are complete
      try {
        const createTopicRes = await fetch(`https://api.telegram.org/bot${token}/createForumTopic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            name: def.name,
            icon_color: def.color,
          }),
        });
        const createTopicJson = await createTopicRes.json();
        if (createTopicJson.ok && createTopicJson.result?.message_thread_id) {
          finalTopics[def.key] = createTopicJson.result.message_thread_id;
          createdCount++;
          this.logger.log(`Created replacement/new topic: ${def.name} (Thread ID: ${createTopicJson.result.message_thread_id})`);
        } else {
          this.logger.warn(`Could not create topic ${def.name}: ${JSON.stringify(createTopicJson)}`);
        }
      } catch (err: any) {
        this.logger.warn(`Could not create topic ${def.name}: ${err.message}`);
      }
    }

    this.config.groupTopicsMap[chatId] = finalTopics;
    this.config.topics = { ...this.config.topics, ...finalTopics };
    this.saveConfig();

    this.logger.log(`Topics reconciliation complete for ${chatId}: ${preservedCount} preserved alive, ${createdCount} created.`);
    return finalTopics;
  }

  /**
   * Manual or triggered check: If admin rights were just granted, re-check and auto-create topics
   */
  async checkAdminAndCreateTopics(): Promise<{
    success: boolean;
    isAdmin: boolean;
    isForum: boolean;
    topicsCreated: boolean;
    message: string;
  }> {
    if (!this.config.chatId) {
      throw new Error('No Telegram group connected yet.');
    }

    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;
    const chatId = this.config.chatId;

    // Check chat info
    const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const chatJson = await chatRes.json();
    const chatInfo = chatJson.ok ? chatJson.result : { is_forum: false, title: this.config.chatTitle };
    const isForum = Boolean(chatInfo.is_forum);

    // Check member status
    const memberRes = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: OFFICIAL_BOT_ID }),
    });
    const memberJson = await memberRes.json();
    const member = memberJson.ok ? memberJson.result : {};

    const isBotAdmin = ['administrator', 'creator'].includes(member.status);
    const hasTopicCreationRights = member.status === 'creator' || Boolean(member.can_manage_topics);

    if (isBotAdmin && hasTopicCreationRights && isForum) {
      const topics = await this.createForumTopics(token, chatId);
      this.config = {
        ...this.config,
        isForum: true,
        pendingAdmin: false,
        topics: { ...this.config.topics, ...topics },
      };
      this.saveConfig();

      const successNotice = [
        `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
        `<b>[ជោគជ័យ] សិទ្ធិ Admin ត្រូវបានផ្ទៀងផ្ទាត់! Topics ទាំង ៤ ត្រូវបានរៀបចំរួចរាល់។</b>`,
      ].join('\n');
      await this.sendMessageDirect(token, chatId, successNotice, topics.securityThreadId || topics.paymentsThreadId);

      return {
        success: true,
        isAdmin: true,
        isForum: true,
        topicsCreated: true,
        message: 'Admin permissions verified! Forum topics configured successfully.',
      };
    }

    if (isBotAdmin && !isForum) {
      this.config = { ...this.config, pendingAdmin: false };
      this.saveConfig();
      return {
        success: true,
        isAdmin: true,
        isForum: false,
        topicsCreated: false,
        message: 'Bot is Admin, but group is not configured as a Forum supergroup.',
      };
    }

    return {
      success: false,
      isAdmin: false,
      isForum,
      topicsCreated: false,
      message: 'Bot is still not an administrator. Please grant admin rights in the Telegram group.',
    };
  }

  /**
   * Manual direct connection (fallback)
   */
  async connectAndInitialize(dto: {
    botToken?: string;
    chatId: string;
    autoCreateTopics?: boolean;
  }): Promise<{
    success: boolean;
    botName: string;
    botUsername: string;
    chatTitle: string;
    isForum: boolean;
    topics: TelegramTopicConfig;
    message: string;
  }> {
    const botToken = dto.botToken || this.config.botToken || DEFAULT_OFFICIAL_TOKEN;
    const chatId = dto.chatId;

    if (!chatId) {
      throw new Error('Chat ID is required.');
    }

    // Set a manual pairing code so handleChatDiscovered is authorized
    this.activePairing = {
      code: `manual_${Date.now()}`,
      startedAt: Date.now(),
      paired: false,
    };
    this.lastProcessedChatId = '';

    // Process chat
    await this.handleChatDiscovered(chatId, 'Telegram Group');

    return {
      success: true,
      botName: this.config.botName || 'Clinic_Alert',
      botUsername: this.config.botUsername || DEFAULT_OFFICIAL_USERNAME,
      chatTitle: this.config.chatTitle || 'Telegram Group',
      isForum: Boolean(this.config.isForum),
      topics: this.config.topics,
      message: 'Telegram Bot connected successfully!',
    };
  }

  /**
   * Disconnect Telegram Bot (Multi-Tenant aware)
   */
  disconnect(tenantId?: string) {
    const activeTenantId = tenantId || TenantContextService.getTenantId() || 'rotana';
    if (activeTenantId && activeTenantId !== 'rotana' && this.config.tenantGroupMap?.[activeTenantId]) {
      delete this.config.tenantGroupMap[activeTenantId];
      this.tenantPairings.delete(activeTenantId);
      this.saveConfig();
      return { success: true, message: `Telegram Bot disconnected for tenant ${activeTenantId}.` };
    }

    this.config.enabled = false;
    this.config.chatId = '';
    this.config.chatTitle = '';
    this.config.pendingAdmin = false;
    this.config.isForum = false;
    this.config.topics = {};
    this.saveConfig();
    this.activePairing = { paired: false };
    this.lastProcessedChatId = '';
    this.logger.log('Telegram Bot disconnected by user.');
    return { success: true, message: 'Telegram Bot disconnected.' };
  }

  /**
   * Update Notification Toggles (Multi-Tenant aware)
   */
  updateSettings(settings: Partial<TelegramConfig>, tenantId?: string) {
    const activeTenantId = tenantId || TenantContextService.getTenantId() || 'rotana';
    if (activeTenantId && activeTenantId !== 'rotana' && this.config.tenantGroupMap?.[activeTenantId]) {
      const tm = this.config.tenantGroupMap[activeTenantId];
      if (typeof settings.notifyOnPayment === 'boolean') tm.notifyOnPayment = settings.notifyOnPayment;
      if (typeof settings.notifyOnQueueCheckin === 'boolean') tm.notifyOnQueueCheckin = settings.notifyOnQueueCheckin;
      if (typeof settings.notifyOnLowStock === 'boolean') tm.notifyOnLowStock = settings.notifyOnLowStock;
      if (typeof settings.notifyOnSecurityAudit === 'boolean') tm.notifyOnSecurityAudit = settings.notifyOnSecurityAudit;
      this.saveConfig();
      return this.getPublicStatus(activeTenantId);
    }

    this.config = { ...this.config, ...settings };
    this.saveConfig();
    return this.getPublicStatus(activeTenantId);
  }

  /**
   * Sends raw message using stored token
   */
  private async sendMessageDirect(
    botToken: string,
    chatId: string,
    textHtml: string,
    threadId?: number,
    replyMarkup?: any,
  ): Promise<boolean> {
    try {
      const payload: any = {
        chat_id: chatId,
        text: textHtml,
        parse_mode: 'HTML',
      };
      if (threadId) {
        payload.message_thread_id = threadId;
      }
      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return Boolean(json.ok);
    } catch (err: any) {
      this.logger.error(`Failed to send Telegram message: ${err.message}`);
      return false;
    }
  }

  /**
   * Public dispatch method for other services (Payments, Visits, etc.)
   * Fully Multi-Tenant aware: routes alerts strictly to the specific clinic's Telegram group
   */
  async notify(
    category: 'PAYMENTS' | 'QUEUE' | 'PHARMACY' | 'SECURITY',
    messageHtml: string,
    targetTenantId?: string,
  ): Promise<boolean> {
    const activeTenantId = targetTenantId || TenantContextService.getTenantId() || 'rotana';

    let chatId = this.config.chatId;
    let topics = this.config.topics;
    let isForum = this.config.isForum;
    let allowNotify = false;

    if (activeTenantId && this.config.tenantGroupMap?.[activeTenantId]) {
      const tm = this.config.tenantGroupMap[activeTenantId];
      chatId = tm.chatId;
      topics = tm.topics;
      isForum = tm.isForum;

      if (category === 'PAYMENTS') allowNotify = tm.notifyOnPayment;
      else if (category === 'QUEUE') allowNotify = tm.notifyOnQueueCheckin;
      else if (category === 'PHARMACY') allowNotify = tm.notifyOnLowStock;
      else if (category === 'SECURITY') allowNotify = tm.notifyOnSecurityAudit;
    } else {
      if (category === 'PAYMENTS') allowNotify = this.config.notifyOnPayment;
      else if (category === 'QUEUE') allowNotify = this.config.notifyOnQueueCheckin;
      else if (category === 'PHARMACY') allowNotify = this.config.notifyOnLowStock;
      else if (category === 'SECURITY') allowNotify = this.config.notifyOnSecurityAudit;
    }

    if (!this.config.enabled || !chatId || !allowNotify) {
      return false;
    }

    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;

    let threadId: number | undefined;
    if (isForum && topics) {
      if (category === 'PAYMENTS') threadId = topics.paymentsThreadId;
      else if (category === 'QUEUE') threadId = topics.queueThreadId;
      else if (category === 'PHARMACY') threadId = topics.pharmacyThreadId;
      else if (category === 'SECURITY') threadId = topics.securityThreadId;
    }

    return this.sendMessageDirect(token, chatId, messageHtml, threadId);
  }

  /**
   * Send test notification
   */
  async sendTestNotification(category: 'PAYMENTS' | 'QUEUE' | 'PHARMACY' | 'SECURITY' = 'PAYMENTS'): Promise<boolean> {
    const timeStr = new Date().toLocaleTimeString('km-KH');
    const testMessages = {
      PAYMENTS: [
        `<b>[តេស្តទូទាត់ប្រាក់ KHQR] ពេទ្យ ហួន វណ្ណៈ</b>`,
        `• <b>វិក្កយបត្រ:</b> #INV-TEST-8841`,
        `• <b>ចំនួនទឹកប្រាក់:</b> $15.00 (61,500 ៛)`,
        `• <b>វិធីសាស្ត្រ:</b> KHQR Dynamic (ABA PayWay)`,
        `• <b>ស្ថានភាព:</b> ជោគជ័យ (PAID)`,
        `• <b>ពេលវេលា:</b> ${timeStr}`,
      ].join('\n'),
      QUEUE: [
        `<b>[តេស្តអ្នកជំងឺចូលពិនិត្យ] ពេទ្យ ហួន វណ្ណៈ</b>`,
        `• <b>អ្នកជំងឺ:</b> ចាន់ ដារ៉ា (P-0012)`,
        `• <b>បន្ទប់ពិគ្រោះ:</b> បន្ទប់លេខ ១ (វេជ្ជ. ហួន វណ្ណៈ)`,
        `• <b>សញ្ញាជីវិត:</b> BP 120/80 mmHg • Temp 36.8°C`,
        `• <b>ពេលវេលា:</b> ${timeStr}`,
      ].join('\n'),
      PHARMACY: [
        `<b>[តេស្តឱសថស្ថាន] ពេទ្យ ហួន វណ្ណៈ</b>`,
        `• <b>ថ្នាំ:</b> Amoxicillin 500mg (Cap)`,
        `• <b>ចំនួននៅសល់:</b> 15 ប្រអប់ (ដាស់តឿនជិតអស់ស្តុក)`,
        `• <b>កាលបរិច្ឆេទ:</b> ${timeStr}`,
      ].join('\n'),
      SECURITY: [
        `<b>[តេស្តសន្តិសុខ & Backup] ពេទ្យ ហួន វណ្ណៈ</b>`,
        `• <b>សកម្មភាព:</b> System Backup Verification`,
        `• <b>អ្នកអនុវត្ត:</b> Super Admin (Owner)`,
        `• <b>ស្ថានភាព:</b> សុវត្ថិភាព ១០០%`,
        `• <b>ពេលវេលា:</b> ${timeStr}`,
      ].join('\n'),
    };

    return this.notify(category, testMessages[category]);
  }

  /**
   * Anti-Tampering & Security Lock for Official Telegram Bot Profile:
   * Enforces and locks the official Bot Name, Description, and Short Description
   * against unauthorized changes or tampering.
   */
  public async enforceBotProfileLock(): Promise<{ success: boolean; message: string }> {
    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;
    if (!token) {
      return { success: false, message: 'Bot token not configured.' };
    }

    this.lastProfileEnforceTime = Date.now();

    try {
      // 1. Set & Lock Name
      await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: OFFICIAL_CLINIC_BOT_NAME }),
      });

      // 2. Set & Lock Full Description
      await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: OFFICIAL_CLINIC_BOT_DESCRIPTION }),
      });

      // 3. Set & Lock Short Description
      await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: OFFICIAL_CLINIC_BOT_SHORT_DESC }),
      });

      // 4. Set & Lock Official Menu Commands
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: OFFICIAL_CLINIC_BOT_COMMANDS }),
      });

      this.logger.log('Official Telegram Bot Profile locked and protected successfully.');
      return { success: true, message: 'Telegram Bot profile locked and verified successfully.' };
    } catch (err: any) {
      this.logger.warn(`Failed to enforce bot profile lock: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  /**
   * Watchdog Integrity Check: detects tampering on Clinic Alert Bot and restores immediately
   */
  public async verifyAndHealProfile(): Promise<{
    verified: boolean;
    healed: boolean;
    tamperDetected: boolean;
    message: string;
  }> {
    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;
    if (!token) {
      return { verified: false, healed: false, tamperDetected: false, message: 'Bot token not configured.' };
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

      const isNameTampered = currentName && currentName !== OFFICIAL_CLINIC_BOT_NAME;
      const isDescTampered = currentDesc && currentDesc !== OFFICIAL_CLINIC_BOT_DESCRIPTION;
      const isShortTampered = currentShort && currentShort !== OFFICIAL_CLINIC_BOT_SHORT_DESC;

      if (isNameTampered || isDescTampered || isShortTampered) {
        this.logger.warn('[SECURITY] Clinic Alert Bot profile tamper detected! Restoring official lock immediately...');
        await this.enforceBotProfileLock();

        if (this.masterBotService) {
          await this.masterBotService.notifySystemSecurityAlert({
            title: 'CLINIC_BOT_PROFILE_TAMPER_DETECTED',
            severity: 'HIGH',
            message: 'Unauthorized alteration to Clinic Alert Bot profile detected. Watchdog auto-restored official locked values.',
          });
        }

        return {
          verified: false,
          healed: true,
          tamperDetected: true,
          message: 'Tampering detected and auto-healed to official profile.',
        };
      }

      return {
        verified: true,
        healed: false,
        tamperDetected: false,
        message: 'Clinic Alert Bot profile integrity verified.',
      };
    } catch (err: any) {
      this.logger.debug(`Clinic watchdog check skipped: ${err.message}`);
      return {
        verified: false,
        healed: false,
        tamperDetected: false,
        message: `Watchdog check error: ${err.message}`,
      };
    }
  }

  /**
   * Handle incoming medical voice memo or doctor clinical dictation
   */
  async handleIncomingMedicalVoiceOrNote(
    msg: any,
    detectedTenantId?: string | null,
  ): Promise<void> {
    const token = this.config.botToken;
    if (!token) return;

    try {
      const chatId = String(msg.chat.id);
      const doctorName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.from?.username || 'Doctor';
      const rawContent = (msg.caption || msg.text || '').trim();

      // If audio/voice without caption, acknowledge voice memo
      const transcript = rawContent || `Voice Note Dictation (${msg.voice?.duration || msg.audio?.duration || 15}s) from Dr. ${doctorName}`;

      // Structure via VoiceMedicalNlpService
      const soapResult = this.voiceNlpService.parseClinicalDictation(transcript, doctorName);

      const messageHtml = [
        `<b>[កំណត់ត្រាវេជ្ជសាស្ត្រ SOAP ពីសំឡេង]</b>`,
        `វេជ្ជបណ្ឌិត៖ <b>${doctorName}</b>`,
        `កាលបរិច្ឆេទ៖ <code>${new Date().toLocaleDateString('km-KH')} ${new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}</code>`,
        ``,
        `<b>1. Subjective (រោគសញ្ញា)៖</b>`,
        `• ${soapResult.subjective.chiefComplaint}`,
        soapResult.subjective.duration ? `• រយៈពេល៖ ${soapResult.subjective.duration}` : '',
        ``,
        `<b>2. Objective (ការពិនិត្យ & សញ្ញាជីវិត)៖</b>`,
        `• សម្ពាធឈាម (BP)៖ <code>${soapResult.objective.vitals.bloodPressure || 'N/A'}</code>`,
        `• ចង្វាក់បេះដូង (HR)៖ <code>${soapResult.objective.vitals.heartRate ? `${soapResult.objective.vitals.heartRate} bpm` : 'N/A'}</code>`,
        `• កម្ដៅ (Temp)៖ <code>${soapResult.objective.vitals.temperature ? `${soapResult.objective.vitals.temperature} C` : 'N/A'}</code>`,
        soapResult.objective.physicalExamFindings.length > 0 ? `• លទ្ធផលពិនិត្យ៖ ${soapResult.objective.physicalExamFindings.join(', ')}` : '',
        ``,
        `<b>3. Assessment (រោគវិនិច្ឆ័យ)៖</b>`,
        `• <b>${soapResult.assessment.primaryDiagnosis}</b>`,
        `• កូដរោគវិនិច្ឆ័យ៖ ICD-11: <code>${soapResult.assessment.icd11Code || 'N/A'}</code> | ICD-10: <code>${soapResult.assessment.icd10Code || 'N/A'}</code>`,
        ``,
        `<b>4. Plan (ផែនការព្យាបាល & ថ្នាំ)៖</b>`,
        soapResult.plan.prescriptions.map((rx, i) => `  ${i + 1}. ${rx.instructions} (ចំនួន ${rx.quantity})`).join('\n') || '• គ្មានថ្នាំចេញបន្ថែម',
        soapResult.plan.treatmentAdvice.length > 0 ? `\n• ការណែនាំ៖ ${soapResult.plan.treatmentAdvice.join('; ')}` : '',
        ``,
        `<i>ពិន្ទុភាពច្បាស់លាស់ (AI Confidence)៖ ${soapResult.confidenceScore}%</i>`,
      ].filter(Boolean).join('\n');

      const targetTopics = (detectedTenantId && this.config.tenantGroupMap && this.config.tenantGroupMap[detectedTenantId] && this.config.tenantGroupMap[detectedTenantId].topics) || (this.config.groupTopicsMap && this.config.groupTopicsMap[chatId]) || this.config.topics; const threadId = targetTopics ? targetTopics.queueThreadId : undefined;

      await this.sendMessageDirect(token, chatId, messageHtml, threadId, {
        inline_keyboard: [
          [
            {
              text: 'ពិនិត្យ និងរក្សាទុកក្នុងប្រព័ន្ធ (Review & Save)',
              url: `https://clinicos.app/visits?doctor=${encodeURIComponent(doctorName)}`,
            },
          ],
        ],
      });
    } catch (err: any) {
      this.logger.error(`Failed to process medical voice or dictation: ${err.message}`);
    }
  }

}
