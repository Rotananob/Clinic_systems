import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TelegramTopicConfig {
  paymentsThreadId?: number;
  queueThreadId?: number;
  pharmacyThreadId?: number;
  securityThreadId?: number;
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
  notifyOnPayment: boolean;
  notifyOnQueueCheckin: boolean;
  notifyOnLowStock: boolean;
  notifyOnSecurityAudit: boolean;
  connectedAt?: string;
}

const DEFAULT_OFFICIAL_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8934642394:AAG-nzLq9Zr0DnMWgwkSgAE_HZdp1ddLn8s';
const DEFAULT_OFFICIAL_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Clinic_alertbot';
const OFFICIAL_BOT_ID = 8934642394;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly configFilePath = path.resolve(process.cwd(), 'data/telegram-bot.json');

  private config: TelegramConfig = {
    enabled: false,
    botToken: DEFAULT_OFFICIAL_TOKEN,
    chatId: '',
    botUsername: DEFAULT_OFFICIAL_USERNAME,
    botName: 'Clinic_Alert',
    pendingAdmin: false,
    topics: {},
    notifyOnPayment: true,
    notifyOnQueueCheckin: true,
    notifyOnLowStock: true,
    notifyOnSecurityAudit: true,
  };

  private lastUpdateId = 0;
  private isPolling = false;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private lastProcessedChatId = '';

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

  constructor() {
    this.loadConfig();
  }

  onModuleInit() {
    // Start background poller to listen for Telegram updates (1-click group adds)
    this.startBackgroundPoller();
  }

  onModuleDestroy() {
    this.stopBackgroundPoller();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = {
          ...this.config,
          ...parsed,
          botToken: parsed.botToken || DEFAULT_OFFICIAL_TOKEN,
          botUsername: parsed.botUsername || DEFAULT_OFFICIAL_USERNAME,
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

  public getPublicStatus() {
    return {
      enabled: this.config.enabled,
      botUsername: this.config.botUsername || DEFAULT_OFFICIAL_USERNAME,
      botName: this.config.botName || 'Clinic_Alert',
      chatTitle: this.config.chatTitle || null,
      chatId: this.config.chatId ? `${this.config.chatId.substring(0, 4)}****${this.config.chatId.slice(-3)}` : null,
      rawChatId: this.config.chatId || null,
      isForum: Boolean(this.config.isForum),
      pendingAdmin: Boolean(this.config.pendingAdmin),
      topics: this.config.topics,
      notifyOnPayment: this.config.notifyOnPayment,
      notifyOnQueueCheckin: this.config.notifyOnQueueCheckin,
      notifyOnLowStock: this.config.notifyOnLowStock,
      notifyOnSecurityAudit: this.config.notifyOnSecurityAudit,
      connectedAt: this.config.connectedAt || null,
      hasToken: Boolean(this.config.botToken),
      officialBotUsername: DEFAULT_OFFICIAL_USERNAME,
    };
  }

  /**
   * 1-Click Pairing Session Generator:
   * Generates deep link that opens Telegram app and prompts user to add the bot to a group as Admin
   */
  startPairingSession(): {
    pairingCode: string;
    deepLink: string;
    botUsername: string;
    alreadyConnected: boolean;
  } {
    const pairingCode = `pair_${Date.now().toString(36)}`;
    const botUser = this.config.botUsername || DEFAULT_OFFICIAL_USERNAME;
    
    // Telegram deep link with group selection and requested admin privileges
    const deepLink = `https://t.me/${botUser}?startgroup=${pairingCode}&admin=manage_topics+change_info+post_messages`;

    this.activePairing = {
      code: pairingCode,
      startedAt: Date.now(),
      paired: false,
    };

    // Ensure update poller is active
    this.startBackgroundPoller();

    return {
      pairingCode,
      deepLink,
      botUsername: botUser,
      alreadyConnected: this.config.enabled,
    };
  }

  /**
   * Status of current 1-Click pairing operation
   */
  getPairingStatus() {
    return {
      active: Boolean(this.activePairing.code),
      code: this.activePairing.code,
      paired: this.activePairing.paired || this.config.enabled,
      chatTitle: this.activePairing.chatTitle || this.config.chatTitle || null,
      isForum: this.activePairing.isForum ?? this.config.isForum ?? false,
      topicsCreated: this.activePairing.topicsCreated ?? Boolean(this.config.topics?.paymentsThreadId),
      pendingAdmin: this.activePairing.pendingAdmin ?? this.config.pendingAdmin ?? false,
      error: this.activePairing.error || null,
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
   * Poll Telegram getUpdates to detect when bot is added to a group
   */
  private async pollUpdates() {
    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;
    if (!token) return;

    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&limit=10&timeout=2`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        if (update.update_id >= this.lastUpdateId) {
          this.lastUpdateId = update.update_id;
        }

        // Case A: my_chat_member event (bot added to group or permission changed)
        if (update.my_chat_member) {
          const chat = update.my_chat_member.chat;
          const newMember = update.my_chat_member.new_chat_member;
          if (newMember?.user?.id === OFFICIAL_BOT_ID || newMember?.user?.username === this.config.botUsername) {
            if (['member', 'administrator', 'creator'].includes(newMember.status)) {
              await this.handleChatDiscovered(String(chat.id), chat.title || 'Telegram Group');
            }
          }
        }

        // Case B: message with /start pair_ or bot added
        if (update.message) {
          const chat = update.message.chat;
          const text = update.message.text || '';
          const newMembers = update.message.new_chat_members || [];

          const isBotAdded = newMembers.some((m: any) => m.id === OFFICIAL_BOT_ID || m.username === this.config.botUsername);
          const isPairingCommand = text.includes('pair_') || text.startsWith('/start');

          if ((isBotAdded || isPairingCommand) && ['group', 'supergroup'].includes(chat.type)) {
            await this.handleChatDiscovered(String(chat.id), chat.title || 'Telegram Group');
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
  async handleChatDiscovered(chatId: string, chatTitle: string): Promise<boolean> {
    if (!chatId) return false;
    if (this.lastProcessedChatId === chatId && this.config.enabled && !this.config.pendingAdmin) {
      return true; // Already processed
    }
    this.lastProcessedChatId = chatId;

    this.logger.log(`Discovered Telegram Group: ${chatTitle} (${chatId}). Verifying permissions...`);
    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;

    try {
      // 1. Get Chat details
      const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const chatJson = await chatRes.json();
      const chatInfo = chatJson.ok ? chatJson.result : { is_forum: false, title: chatTitle };
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
      const canManageTopics = Boolean(member.can_manage_topics);

      this.logger.log(`Bot status in ${chatTitle}: Admin=${isBotAdmin}, CanManageTopics=${canManageTopics}, Forum=${isForum}`);

      // Case 1: Bot is Admin AND Forum is enabled
      if (isBotAdmin && isForum) {
        const topics = await this.createForumTopics(token, chatId);

        this.config = {
          ...this.config,
          enabled: true,
          botToken: token,
          chatId,
          chatTitle: chatInfo.title || chatTitle,
          isForum: true,
          pendingAdmin: false,
          topics: { ...this.config.topics, ...topics },
          connectedAt: new Date().toISOString(),
        };
        this.saveConfig();

        const successMessage = [
          `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
          `<b>[ជោគជ័យ] Telegram Bot បានតភ្ជាប់ជាមួយក្រុម និងបង្កើត Forum Topics ស្វ័យប្រវត្តរួចរាល់!</b>`,
          ``,
          `• <b>ប្រព័ន្ធ:</b> Houn Vannak Clinic Management System v1.0.0`,
          `• <b>Bot:</b> @${this.config.botUsername || DEFAULT_OFFICIAL_USERNAME}`,
          `• <b>ក្រុម:</b> ${chatInfo.title || chatTitle}`,
          `• <b>Forum Topics:</b> បង្កើតបាន ៤ ប្រធានបទរួចរាល់`,
          `• <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`,
          ``,
          `<i>រាល់ការទូទាត់ KHQR និងការជូនដំណឹងសំខាន់ៗ នឹងរត់ចូលទីនេះដោយស្វ័យប្រវត្ត។</i>`,
        ].join('\n');

        await this.sendMessageDirect(token, chatId, successMessage, topics.securityThreadId || topics.paymentsThreadId);

        this.activePairing = {
          paired: true,
          chatTitle: chatInfo.title || chatTitle,
          isForum: true,
          topicsCreated: true,
          pendingAdmin: false,
        };

        return true;
      }

      // Case 2: Bot is Admin BUT Group is not forum
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

        const regularWelcome = [
          `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
          `<b>[ជោគជ័យ] Telegram Bot បានតភ្ជាប់ជាមួយក្រុម!</b>`,
          ``,
          `• <b>Bot:</b> @${this.config.botUsername || DEFAULT_OFFICIAL_USERNAME}`,
          `• <b>ក្រុម:</b> ${chatInfo.title || chatTitle}`,
          `• <b>ចំណាំ:</b> ក្រុមនេះមិនទាន់បើក Forum Topics ទេ។ ប្រសិនបើចង់បែងចែក Alert តាមផ្នែក សូមបើក Forum Topics ក្នុង Group Settings។`,
        ].join('\n');

        await this.sendMessageDirect(token, chatId, regularWelcome);

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
      // Save chatId so it is registered, but send polite guidance to group
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
        `<b>សូមមេត្តាផ្តល់សិទ្ធិជា Administrator (ជាពិសេសសិទ្ធិ Manage Topics) ដល់ Bot នេះ:</b>`,
        `ដើម្បីឲ្យប្រព័ន្ធអាចបង្កើត Forum Topics ដោយស្វ័យប្រវត្ត ជៀសវាងការផ្ញើសាររញ៉េរញ៉ៃក្នុងក្រុម និងដើម្បីឲ្យការជូនដំណឹង (Alert) ទទួលបានចំគោលដៅ។`,
        ``,
        `<i>បន្ទាប់ពីបើកសិទ្ធិរួច ប្រព័ន្ធនឹងដំណើរការរៀបចំ Topics ដោយស្វ័យប្រវត្តភ្លាមៗ។</i>`,
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
    }
  }

  /**
   * Helper to create 4 forum topics in Telegram supergroup
   */
  private async createForumTopics(token: string, chatId: string): Promise<TelegramTopicConfig> {
    const topics: TelegramTopicConfig = {};
    const topicDefinitions = [
      { key: 'paymentsThreadId', name: '[Payments & KHQR] ការទូទាត់ប្រាក់', color: 7322096 },
      { key: 'queueThreadId', name: '[Appointments & Queue] ការណាត់ជួប & ជួររង់ចាំ', color: 16766590 },
      { key: 'pharmacyThreadId', name: '[Pharmacy & Stock] ឱសថស្ថាន & ស្តុកថ្នាំ', color: 9367192 },
      { key: 'securityThreadId', name: '[Security & Audit] សន្តិស្ដខប្រព័ន្ធ', color: 16478098 },
    ];

    for (const def of topicDefinitions) {
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
          (topics as any)[def.key] = createTopicJson.result.message_thread_id;
          this.logger.log(`Created topic: ${def.name} (Thread ID: ${createTopicJson.result.message_thread_id})`);
        }
      } catch (err: any) {
        this.logger.warn(`Could not create topic ${def.name}: ${err.message}`);
      }
    }

    return topics;
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
    const canManageTopics = Boolean(member.can_manage_topics);

    if (isBotAdmin && isForum) {
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
        `<b>[ជោគជ័យ] សិទ្ធិ Admin ត្រូវបានផ្ទៀងផ្ទាត់! Topics ទាំង ៤ ត្រូវបានបង្កើតរួចរាល់។</b>`,
      ].join('\n');
      await this.sendMessageDirect(token, chatId, successNotice, topics.securityThreadId || topics.paymentsThreadId);

      return {
        success: true,
        isAdmin: true,
        isForum: true,
        topicsCreated: true,
        message: 'Admin permissions verified! Forum topics created successfully.',
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
   * Disconnect Telegram Bot
   */
  disconnect() {
    this.config.enabled = false;
    this.config.chatId = '';
    this.config.chatTitle = '';
    this.config.pendingAdmin = false;
    this.saveConfig();
    this.activePairing = { paired: false };
    return { success: true, message: 'Telegram Bot disconnected.' };
  }

  /**
   * Update Notification Toggles
   */
  updateSettings(settings: Partial<TelegramConfig>) {
    this.config = { ...this.config, ...settings };
    this.saveConfig();
    return this.getPublicStatus();
  }

  /**
   * Sends raw message using stored token
   */
  private async sendMessageDirect(botToken: string, chatId: string, textHtml: string, threadId?: number): Promise<boolean> {
    try {
      const payload: any = {
        chat_id: chatId,
        text: textHtml,
        parse_mode: 'HTML',
      };
      if (threadId) {
        payload.message_thread_id = threadId;
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
   */
  async notify(category: 'PAYMENTS' | 'QUEUE' | 'PHARMACY' | 'SECURITY', messageHtml: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.chatId) {
      return false;
    }

    if (category === 'PAYMENTS' && !this.config.notifyOnPayment) return false;
    if (category === 'QUEUE' && !this.config.notifyOnQueueCheckin) return false;
    if (category === 'PHARMACY' && !this.config.notifyOnLowStock) return false;
    if (category === 'SECURITY' && !this.config.notifyOnSecurityAudit) return false;

    const token = this.config.botToken || DEFAULT_OFFICIAL_TOKEN;

    let threadId: number | undefined;
    if (this.config.isForum) {
      if (category === 'PAYMENTS') threadId = this.config.topics.paymentsThreadId;
      else if (category === 'QUEUE') threadId = this.config.topics.queueThreadId;
      else if (category === 'PHARMACY') threadId = this.config.topics.pharmacyThreadId;
      else if (category === 'SECURITY') threadId = this.config.topics.securityThreadId;
    }

    return this.sendMessageDirect(token, this.config.chatId, messageHtml, threadId);
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
}
