'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Bell,
  Shield,
  Pill,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Hash,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const TelegramSettingsPanel: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testingCategory, setTestingCategory] = useState<string | null>(null);

  const [botStatus, setBotStatus] = useState<any>(null);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [autoCreateTopics, setAutoCreateTopics] = useState(true);
  const [showToken, setShowToken] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.telegram.getStatus();
      setBotStatus(data);
    } catch (err: any) {
      console.debug('Could not load Telegram status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !chatId.trim()) {
      toast.error(
        isKm ? 'សូមបញ្ចូល Bot Token និង Chat ID' : 'Please provide both Bot Token and Chat ID',
        isKm ? 'ខ្វះទិន្នន័យ' : 'Missing Information',
      );
      return;
    }

    try {
      setConnecting(true);
      const res = await api.telegram.connect({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        autoCreateTopics,
      });

      if (res.success) {
        toast.success(
          isKm
            ? `Bot @${res.botUsername} បានតភ្ជាប់ និងបង្កើត Topics ស្វ័យប្រវត្តរួចរាល់!`
            : `Bot @${res.botUsername} connected and topics initialized!`,
          isKm ? 'ភ្ជាប់ជោគជ័យ' : 'Connected Successfully',
        );
        setBotToken('');
        await fetchStatus();
      }
    } catch (err: any) {
      toast.error(
        err.message,
        isKm ? 'ការតភ្ជាប់បរាជ័យ' : 'Connection Failed',
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(isKm ? 'តើអ្នកប្រាកដជាចង់ផ្ដាច់ Telegram Bot នេះមែនទេ?' : 'Are you sure you want to disconnect this Telegram Bot?')) {
      return;
    }
    try {
      await api.telegram.disconnect();
      toast.info(
        isKm ? 'បានផ្ដាច់ការតភ្ជាប់ Telegram Bot រួចរាល់' : 'Telegram Bot disconnected successfully',
        isKm ? 'បានផ្ដាច់' : 'Disconnected',
      );
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message, 'Error');
    }
  };

  const handleTestNotification = async (category: 'PAYMENTS' | 'QUEUE' | 'PHARMACY' | 'SECURITY') => {
    try {
      setTestingCategory(category);
      const res = await api.telegram.sendTest(category);
      if (res.success) {
        toast.success(
          isKm
            ? `សារតេស្តត្រូវបានបញ្ជូនទៅកាន់ Telegram Topic (${category}) រួចរាល់!`
            : `Test message dispatched to Telegram Topic (${category})!`,
          isKm ? 'ផ្ញើសារជោគជ័យ' : 'Message Sent',
        );
      } else {
        toast.error(res.message, 'Dispatch Failed');
      }
    } catch (err: any) {
      toast.error(err.message, 'Error');
    } finally {
      setTestingCategory(null);
    }
  };

  const handleTogglePreference = async (key: string, value: boolean) => {
    try {
      const updated = await api.telegram.updateSettings({ [key]: value });
      setBotStatus(updated);
      toast.success(
        isKm ? 'បានកែសម្រួលការកំណត់ជោគជ័យ' : 'Notification setting updated',
        isKm ? 'បានរក្សាទុក' : 'Saved',
      );
    } catch (err: any) {
      toast.error(err.message, 'Error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-teal-700" />
        <span className="text-xs">{isKm ? 'កំពុងពិនិត្យស្ថានភាព Telegram...' : 'Loading Telegram status...'}</span>
      </div>
    );
  }

  const isConnected = botStatus?.enabled;

  return (
    <div className="space-y-6">
      {/* Top Banner Status Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isConnected
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isConnected
                ? 'bg-emerald-100/80 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {isKm ? 'ការតភ្ជាប់ Telegram Bot & Forum Topics' : 'Telegram Bot & Forum Topics Bridge'}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                  {isConnected ? (isKm ? 'បានតភ្ជាប់ (LIVE)' : 'CONNECTED') : (isKm ? 'មិនទាន់ភ្ជាប់' : 'DISCONNECTED')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isConnected
                  ? (isKm
                      ? `Bot @${botStatus.botUsername} (${botStatus.botName}) កំពុងបញ្ជូនដំណឹងទៅ ${botStatus.chatTitle}`
                      : `Bot @${botStatus.botUsername} active in ${botStatus.chatTitle}`)
                  : (isKm
                      ? 'ភ្ជាប់ Telegram Bot ដោយ 1-Click ដើម្បីបង្កើត Topics ស្វ័យប្រវត្ត និងទទួលដំណឹង KHQR ភ្លាមៗ'
                      : 'Connect Telegram Bot with 1-Click to auto-create Topics and receive live KHQR settlement alerts')}
              </p>
            </div>
          </div>

          {isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isKm ? 'ផ្ដាច់ការតភ្ជាប់' : 'Disconnect'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1-Click Connect Form (Visible when disconnected) */}
      {!isConnected && (
        <form onSubmit={handleConnect} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>{isKm ? 'ភ្ជាប់ Telegram Bot ថ្មី (1-Click Setup)' : '1-Click Telegram Bot Connection'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Telegram Bot API</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKm ? 'Bot Token (ទទួលបានពី @BotFather)' : 'Bot Token (from @BotFather)'}
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  required
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isKm ? 'បើក Telegram រួចផ្ញើ /newbot ទៅ @BotFather ដើម្បីយក Token' : 'Open Telegram and send /newbot to @BotFather to get token'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKm ? 'Group Chat ID (Supergroup ID)' : 'Supergroup Chat ID'}
              </label>
              <input
                type="text"
                placeholder="-1002345678901"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isKm ? 'បញ្ចូល Bot ទៅក្នុង Group ជា Admin រួចចម្លង ID ក្រុម (ផ្តើមដោយ -100)' : 'Add Bot to group as Admin, then paste Group ID (starts with -100)'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center gap-3">
            <input
              type="checkbox"
              id="autoTopics"
              checked={autoCreateTopics}
              onChange={(e) => setAutoCreateTopics(e.target.checked)}
              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
            />
            <label htmlFor="autoTopics" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-semibold">{isKm ? 'បង្កើត Forum Topics ស្វ័យប្រវត្ត (Auto-Create Topics):' : 'Auto-Create Forum Topics:'}</span>{' '}
              {isKm
                ? 'ប្រព័ន្ធនឹងបង្កើត Topics ដោយស្វ័យប្រវត្តសម្រាប់ KHQR, ការណាត់ជួប, ឱសថស្ថាន, និងសន្តិសុខ'
                : 'Bot will automatically create dedicated threads for Payments, Appointments, Pharmacy, and Security'}
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={connecting}
              className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isKm ? 'កំពុងតភ្ជាប់ & បង្កើត Topics...' : 'Connecting & Initializing Topics...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isKm ? 'ភ្ជាប់ និងបង្កើត Topics ស្វ័យប្រវត្ត (1-Click Connect)' : '1-Click Connect & Initialize Topics'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Forum Topics Grid (Visible when connected) */}
      {isConnected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-800" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                {isKm ? 'បញ្ជី FORUM TOPICS ក្នុងក្រុម TELEGRAM' : 'ACTIVE TELEGRAM FORUM TOPICS'}
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {botStatus.isForum ? (isKm ? 'Forum Supergroup ដំណើរការ' : 'Forum Mode Active') : (isKm ? 'របៀបបន្ទប់រួម (General)' : 'General Room Mode')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topic 1: Payments */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isKm ? 'ការទូទាត់ប្រាក់ & KHQR' : 'KHQR & Payments'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Thread ID: {botStatus.topics?.paymentsThreadId || 'General'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={testingCategory === 'PAYMENTS'}
                onClick={() => handleTestNotification('PAYMENTS')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                {testingCategory === 'PAYMENTS' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{isKm ? 'តេស្ត' : 'Test'}</span>
              </button>
            </div>

            {/* Topic 2: Queue & Appointments */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isKm ? 'ការណាត់ជួប & ជួររង់ចាំ' : 'Appointments & Queue'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Thread ID: {botStatus.topics?.queueThreadId || 'General'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={testingCategory === 'QUEUE'}
                onClick={() => handleTestNotification('QUEUE')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                {testingCategory === 'QUEUE' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{isKm ? 'តេស្ត' : 'Test'}</span>
              </button>
            </div>

            {/* Topic 3: Pharmacy */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isKm ? 'ឱសថស្ថាន & ស្តុកថ្នាំ' : 'Pharmacy & Stock'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Thread ID: {botStatus.topics?.pharmacyThreadId || 'General'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={testingCategory === 'PHARMACY'}
                onClick={() => handleTestNotification('PHARMACY')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                {testingCategory === 'PHARMACY' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{isKm ? 'តេស្ត' : 'Test'}</span>
              </button>
            </div>

            {/* Topic 4: Security & System */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isKm ? 'សន្តិសុខប្រព័ន្ធ & Audit' : 'Security & Audit'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Thread ID: {botStatus.topics?.securityThreadId || 'General'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={testingCategory === 'SECURITY'}
                onClick={() => handleTestNotification('SECURITY')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                {testingCategory === 'SECURITY' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{isKm ? 'តេស្ត' : 'Test'}</span>
              </button>
            </div>
          </div>

          {/* Notification Alert Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Bell className="w-4 h-4 text-teal-700" />
              <span>{isKm ? 'ជម្រើសនៃការជូនដំណឹងស្វ័យប្រវត្ត (Notification Toggles)' : 'Automated Notification Rules'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="text-xs font-medium text-slate-700">
                  {isKm ? 'ជូនដំណឹងពេលភ្ញៀវទូទាត់ KHQR ជោគជ័យ' : 'Notify on KHQR Payment Settled'}
                </span>
                <input
                  type="checkbox"
                  checked={botStatus.notifyOnPayment}
                  onChange={(e) => handleTogglePreference('notifyOnPayment', e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="text-xs font-medium text-slate-700">
                  {isKm ? 'ជូនដំណឹងពេលអ្នកជំងឺ Check-in ចូលជួរ' : 'Notify on Patient Queue Check-in'}
                </span>
                <input
                  type="checkbox"
                  checked={botStatus.notifyOnQueueCheckin}
                  onChange={(e) => handleTogglePreference('notifyOnQueueCheckin', e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="text-xs font-medium text-slate-700">
                  {isKm ? 'ដាស់តឿនពេលថ្នាំជិតអស់ស្តុក (< 20)' : 'Alert on Low Medicine Stock (< 20)'}
                </span>
                <input
                  type="checkbox"
                  checked={botStatus.notifyOnLowStock}
                  onChange={(e) => handleTogglePreference('notifyOnLowStock', e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="text-xs font-medium text-slate-700">
                  {isKm ? 'ជូនដំណឹងពេលមានការ Backup ឬកែសិទ្ធិ' : 'Alert on Backup & Security Changes'}
                </span>
                <input
                  type="checkbox"
                  checked={botStatus.notifyOnSecurityAudit}
                  onChange={(e) => handleTogglePreference('notifyOnSecurityAudit', e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
