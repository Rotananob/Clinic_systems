import { Injectable, Logger } from '@nestjs/common';
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
  topics: TelegramTopicConfig;
  notifyOnPayment: boolean;
  notifyOnQueueCheckin: boolean;
  notifyOnLowStock: boolean;
  notifyOnSecurityAudit: boolean;
  connectedAt?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly configFilePath = path.resolve(process.cwd(), 'data/telegram-bot.json');
  private config: TelegramConfig = {
    enabled: false,
    botToken: '',
    chatId: '',
    topics: {},
    notifyOnPayment: true,
    notifyOnQueueCheckin: true,
    notifyOnLowStock: true,
    notifyOnSecurityAudit: true,
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        this.config = { ...this.config, ...JSON.parse(raw) };
        this.logger.log(`Telegram Bot config loaded. Enabled: ${this.config.enabled}`);
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
      botUsername: this.config.botUsername || null,
      botName: this.config.botName || null,
      chatTitle: this.config.chatTitle || null,
      chatId: this.config.chatId ? `${this.config.chatId.substring(0, 4)}****${this.config.chatId.slice(-3)}` : null,
      isForum: Boolean(this.config.isForum),
      topics: this.config.topics,
      notifyOnPayment: this.config.notifyOnPayment,
      notifyOnQueueCheckin: this.config.notifyOnQueueCheckin,
      notifyOnLowStock: this.config.notifyOnLowStock,
      notifyOnSecurityAudit: this.config.notifyOnSecurityAudit,
      connectedAt: this.config.connectedAt || null,
      hasToken: Boolean(this.config.botToken),
    };
  }

  /**
   * 1-Click Connect, Validate, and Auto-Create Topics on Telegram Supergroup
   */
  async connectAndInitialize(dto: {
    botToken: string;
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
    const { botToken, chatId, autoCreateTopics = true } = dto;

    if (!botToken || !chatId) {
      throw new Error('Bot token and Chat ID are required.');
    }

    this.logger.log(`Attempting 1-Click Telegram connect with Chat ID: ${chatId}`);

    // 1. Verify Bot Token
    const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const getMeJson = await getMeRes.json();

    if (!getMeJson.ok || !getMeJson.result?.is_bot) {
      throw new Error(`Invalid Telegram Bot Token: ${getMeJson.description || 'Unknown error'}`);
    }

    const botInfo = getMeJson.result;

    // 2. Verify Chat accessibility
    const getChatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const getChatJson = await getChatRes.json();

    if (!getChatJson.ok) {
      throw new Error(`Cannot access Telegram Chat (${chatId}): ${getChatJson.description}. Ensure bot is added as Administrator.`);
    }

    const chatInfo = getChatJson.result;
    const isForum = Boolean(chatInfo.is_forum);
    const topics: TelegramTopicConfig = {};

    // 3. Auto-Create Topics if group is a forum
    if (isForum && autoCreateTopics) {
      this.logger.log(`Supergroup ${chatInfo.title} is a forum. Creating specialized topics...`);

      const topicDefinitions = [
        { key: 'paymentsThreadId', name: '[Payments & KHQR] ការទូទាត់ប្រាក់', color: 7322096 },
        { key: 'queueThreadId', name: '[Appointments & Queue] ការណាត់ជួប & ជួររង់ចាំ', color: 16766590 },
        { key: 'pharmacyThreadId', name: '[Pharmacy & Stock] ឱសថស្ថាន & ស្តុកថ្នាំ', color: 9367192 },
        { key: 'securityThreadId', name: '[Security & Audit] សន្តិសុខប្រព័ន្ធ', color: 16478098 },
      ];

      for (const def of topicDefinitions) {
        try {
          const createTopicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
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
    }

    // 4. Save to Persistent Config
    this.config = {
      ...this.config,
      enabled: true,
      botToken,
      chatId,
      botName: botInfo.first_name,
      botUsername: botInfo.username,
      chatTitle: chatInfo.title || 'Telegram Group',
      isForum,
      topics: { ...this.config.topics, ...topics },
      connectedAt: new Date().toISOString(),
    };
    this.saveConfig();

    // 5. Send Welcome Dispatch
    const welcomeText = [
      `<b>[ពេទ្យ ហួន វណ្ណៈ] Houn Vannak Clinic OS</b>`,
      `<b>[ជោគជ័យ] Telegram Bot បានតភ្ជាប់ជោគជ័យជាមួយប្រព័ន្ធគ្លីនិក!</b>`,
      ``,
      `• <b>Bot:</b> @${botInfo.username}`,
      `• <b>Chat:</b> ${chatInfo.title || chatId}`,
      `• <b>Forum Topics:</b> ${isForum ? 'Enabled (បង្កើត Topics ស្វ័យប្រវត្តរួចរាល់)' : 'Single Thread'}`,
      `• <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH')}`,
      ``,
      `<i>រាល់ការទូទាត់ KHQR និងការជូនដំណឹងសំខាន់ៗ នឹងរត់ចូលទីនេះដោយស្វ័យប្រវត្ត។</i>`,
    ].join('\n');

    await this.sendMessageDirect(botToken, chatId, welcomeText, topics.securityThreadId || topics.paymentsThreadId);

    return {
      success: true,
      botName: botInfo.first_name,
      botUsername: botInfo.username,
      chatTitle: chatInfo.title || 'Telegram Group',
      isForum,
      topics: this.config.topics,
      message: 'Telegram Bot connected successfully and topics initialized!',
    };
  }

  /**
   * Disconnect Telegram Bot
   */
  disconnect() {
    this.config.enabled = false;
    this.saveConfig();
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
    if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
      return false;
    }

    if (category === 'PAYMENTS' && !this.config.notifyOnPayment) return false;
    if (category === 'QUEUE' && !this.config.notifyOnQueueCheckin) return false;
    if (category === 'PHARMACY' && !this.config.notifyOnLowStock) return false;
    if (category === 'SECURITY' && !this.config.notifyOnSecurityAudit) return false;

    let threadId: number | undefined;
    if (this.config.isForum) {
      if (category === 'PAYMENTS') threadId = this.config.topics.paymentsThreadId;
      else if (category === 'QUEUE') threadId = this.config.topics.queueThreadId;
      else if (category === 'PHARMACY') threadId = this.config.topics.pharmacyThreadId;
      else if (category === 'SECURITY') threadId = this.config.topics.securityThreadId;
    }

    return this.sendMessageDirect(this.config.botToken, this.config.chatId, messageHtml, threadId);
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
