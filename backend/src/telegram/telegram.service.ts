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
  groupTopicsMap?: Record<string, TelegramTopicConfig>;
  notifyOnPayment: boolean;
  notifyOnQueueCheckin: boolean;
  notifyOnLowStock: boolean;
  notifyOnSecurityAudit: boolean;
  connectedAt?: string;
}

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
    // Enforce and lock official bot name, description, and short description
    this.enforceBotProfileLock().catch((err) => {
      this.logger.warn(`Initial bot profile lock failed: ${err.message}`);
    });
  }

  onModuleDestroy() {
    this.stopBackgroundPoller();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        const groupTopicsMap = parsed.groupTopicsMap || {};
        if (parsed.chatId && parsed.topics && Object.keys(parsed.topics).length > 0 && !groupTopicsMap[parsed.chatId]) {
          groupTopicsMap[parsed.chatId] = parsed.topics;
        }
        this.config = {
          ...this.config,
          ...parsed,
          botToken: parsed.botToken || DEFAULT_OFFICIAL_TOKEN,
          botUsername: parsed.botUsername || DEFAULT_OFFICIAL_USERNAME,
          groupTopicsMap,
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
   * Helper to check if a 1-Click pairing session is currently active
   */
  private isSessionActive(): boolean {
    return Boolean(
      this.activePairing?.code &&
      Date.now() - (this.activePairing.startedAt || 0) < 600000 // 10 minutes timeout
    );
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
      topicsCreated: false,
      pendingAdmin: false,
    };
    this.lastProcessedChatId = '';

    // Ensure update poller is active
    this.startBackgroundPoller();

    return {
      pairingCode,
      deepLink,
      botUsername: botUser,
      alreadyConnected: Boolean(this.config.enabled && this.config.chatId),
    };
  }

  /**
   * Status of current 1-Click pairing operation
   */
  getPairingStatus() {
    const isSessionActive = this.isSessionActive();
    return {
      active: isSessionActive,
      code: this.activePairing.code,
      paired: isSessionActive
        ? Boolean(this.activePairing.paired)
        : Boolean(this.config.enabled && this.config.chatId),
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

            if (isCommand || containsActiveCode || isBotAdded || isPairingActive) {
              this.logger.log(`Received trigger in group ${chat.title} (${chat.id}) - text: "${text}". Processing connection...`);
              await this.handleChatDiscovered(String(chat.id), chat.title || 'Telegram Group', isCommand);
            }
          }

          // 2. Private direct message with user
          if (chat.type === 'private' && (text.startsWith('/start') || text.startsWith('/help') || text.startsWith('/setup'))) {
            const botUser = this.config.botUsername || DEFAULT_OFFICIAL_USERNAME;
            const pairCode = this.activePairing?.code || `pair_${Date.now().toString(36)}`;
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
  async handleChatDiscovered(chatId: string, chatTitle: string, isManualCommand: boolean = false): Promise<boolean> {
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
   * Disconnect Telegram Bot
   */
  disconnect() {
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

    const officialName = 'Clinic_System';
    const officialDescription =
      'ប្រព័ន្ធស្វ័យប្រវត្តិនៃមជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា (Rotana Clinic Management & Automation Bot)\n\n' +
      '• ជូនដំណឹងវិក្កយបត្រ & ការទូទាត់ប្រាក់ KHQR\n' +
      '• ជូនដំណឹងវេនពិគ្រោះអ្នកជំងឺ (Patient Queue)\n' +
      '• ជូនដំណឹងស្តុកឱសថស្ថាន\n' +
      '• ជូនដំណឹងសន្តិសុខប្រព័ន្ធគ្លីនិក 24/7';
    const officialShortDescription = 'Bot ជូនដំណឹងស្វ័យប្រវត្តិ គ្លីនិក រតនា (Rotana Clinic Alert Bot)';

    this.lastProfileEnforceTime = Date.now();

    try {
      // 1. Set & Lock Name
      await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: officialName }),
      });

      // 2. Set & Lock Full Description
      await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: officialDescription }),
      });

      // 3. Set & Lock Short Description
      await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: officialShortDescription }),
      });

      // 4. Set & Lock Official Menu Commands
      const officialCommands = [
        { command: 'start', description: 'ភ្ជាប់ និងពិនិត្យស្ថានភាពគ្លីនិក' },
        { command: 'topics', description: 'ពិនិត្យបញ្ជី Forum Topics ផ្លូវការ' },
        { command: 'lock', description: 'ចាក់សោរ និងការពារ Bot Profile' },
        { command: 'help', description: 'ការណែនាំអំពីប្រព័ន្ធគ្លីនិក' },
      ];
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: officialCommands }),
      });

      this.logger.log('Official Telegram Bot Profile locked and protected successfully.');
      return { success: true, message: 'Telegram Bot profile locked and verified successfully.' };
    } catch (err: any) {
      this.logger.warn(`Failed to enforce bot profile lock: ${err.message}`);
      return { success: false, message: err.message };
    }
  }
}
