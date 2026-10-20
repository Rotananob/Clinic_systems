'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Pill,
  Calendar,
  DollarSign,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const TelegramSettingsPanel: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [pairingActive, setPairingActive] = useState(false);
  const [pairingStep, setPairingStep] = useState<'IDLE' | 'WAITING_ADD' | 'PAIRED'>('IDLE');
  const [pairingDeepLink, setPairingDeepLink] = useState<string | null>(null);
  const [testingCategory, setTestingCategory] = useState<string | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [lockingProfile, setLockingProfile] = useState(false);

  const [botStatus, setBotStatus] = useState<any>(null);
  const [manualChatId, setManualChatId] = useState('');
  const [showManualSection, setShowManualSection] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartPairing = async () => {
    try {
      setPairingActive(true);
      setPairingStep('WAITING_ADD');

      const session = await api.telegram.startPairing();
      // Open Telegram app / web safely in a new tab without destroying the current web app
      if (session.deepLink) {
        setPairingDeepLink(session.deepLink);
        try {
          window.open(session.deepLink, '_blank', 'noopener,noreferrer');
        } catch {
          // Keep user in clinic app so polling continues uninterrupted
        }
      }

      toast.info(
        isKm
          ? 'កំពុងភ្ជាប់... សូមជ្រើសរើស Telegram Group ឬចុចប៊ូតុង "បើកកម្មវិធី Telegram"'
          : 'Connecting... Please select your Telegram group or click "Open Telegram App".',
        isKm ? 'បើក Telegram' : 'Opening Telegram',
      );

      const checkNow = async () => {
        try {
          const res = await api.telegram.getPairingStatus();
          if (res.paired) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPairingActive(false);
            setPairingStep('PAIRED');
            await fetchStatus();

            if (res.pendingAdmin) {
              toast.info(
                isKm
                  ? `Bot បានចូលក្នុង ${res.chatTitle || 'ក្រុម'} រួចរាល់! សូមផ្តល់សិទ្ធិ Admin ដល់ Bot ដើម្បីបង្កើត Topics ស្វ័យប្រវត្ត`
                  : `Bot joined ${res.chatTitle || 'group'}! Please grant Admin role to auto-create forum topics.`,
                isKm ? 'បានចូលក្រុម' : 'Bot Joined Group',
              );
            } else {
              toast.success(
                isKm
                  ? `បានតភ្ជាប់ជាមួយ ${res.chatTitle || 'ក្រុម'} និងបង្កើត Forum Topics ស្វ័យប្រវត្តរួចរាល់!`
                  : `Connected to ${res.chatTitle || 'group'} and initialized forum topics!`,
                isKm ? 'តភ្ជាប់ជោគជ័យ' : 'Connected Successfully',
              );
            }
          }
        } catch {
          // Ignore polling errors
        }
      };

      // Start polling for group addition every 2 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(checkNow, 2000);
      // Run immediately as well
      checkNow();
    } catch (err: any) {
      setPairingActive(false);
      setPairingStep('IDLE');
      toast.error(err.message, isKm ? 'ការតភ្ជាប់បរាជ័យ' : 'Pairing Failed');
    }
  };

  const handleCancelPairing = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPairingActive(false);
    setPairingStep('IDLE');
  };

  const handleCheckAdminAndCreateTopics = async () => {
    try {
      setCheckingAdmin(true);
      const res = await api.telegram.checkAdminTopics();
      if (res.success) {
        toast.success(
          isKm ? 'សិទ្ធិ Admin ត្រូវបានផ្ទៀងផ្ទាត់ និងបង្កើត Topics រួចរាល់!' : res.message,
          isKm ? 'ជោគជ័យ' : 'Success',
        );
        await fetchStatus();
      } else {
        toast.info(
          isKm
            ? 'Bot មិនទាន់មានសិទ្ធិ Admin ពេញលេញនៅឡើយទេ។ សូមបើកសិទ្ធិ Manage Topics ក្នុង Telegram Group។'
            : res.message,
          isKm ? 'មិនទាន់មានសិទ្ធិ Admin' : 'Admin Role Required',
        );
      }
    } catch (err: any) {
      toast.error(err.message, 'Error');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualChatId.trim()) {
      toast.error(
        isKm ? 'សូមបញ្ចូល Group Chat ID' : 'Please provide Group Chat ID',
        isKm ? 'ខ្វះទិន្នន័យ' : 'Missing Information',
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.telegram.connect({
        chatId: manualChatId.trim(),
        autoCreateTopics: true,
      });

      if (res.success) {
        toast.success(
          isKm
            ? `Bot @${res.botUsername} បានតភ្ជាប់ជាមួយ ${res.chatTitle} រួចរាល់!`
            : `Bot @${res.botUsername} connected to ${res.chatTitle}!`,
          isKm ? 'ភ្ជាប់ជោគជ័យ' : 'Connected Successfully',
        );
        setManualChatId('');
        await fetchStatus();
      }
    } catch (err: any) {
      toast.error(err.message, isKm ? 'ការតភ្ជាប់បរាជ័យ' : 'Connection Failed');
    } finally {
      setLoading(false);
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

  const handleLockProfile = async () => {
    try {
      setLockingProfile(true);
      const res = await api.telegram.lockProfile();
      if (res.success) {
        toast.success(
          isKm
            ? 'បានចាក់សោរ និងការពារ Bot Profile រួចរាល់ដោយសុវត្ថិភាព!'
            : 'Telegram Bot profile locked and protected successfully!',
          isKm ? 'ចាក់សោរជោគជ័យ' : 'Profile Locked',
        );
      } else {
        toast.info(res.message || 'Operation completed', 'Telegram Bot');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to lock profile', 'Error');
    } finally {
      setLockingProfile(false);
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

  const isConnected = botStatus?.enabled && botStatus?.chatId;
  const isPendingAdmin = botStatus?.pendingAdmin;

  return (
    <div className="space-y-6">
      {/* Top Banner Status Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isConnected
          ? isPendingAdmin
            ? 'bg-amber-50/80 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200'
          : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isConnected
                ? isPendingAdmin
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-emerald-100/80 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {isKm ? 'ការតភ្ជាប់ Telegram Bot & Forum Topics' : 'Telegram Bot & Forum Topics Bridge'}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  isConnected
                    ? isPendingAdmin
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isConnected
                      ? isPendingAdmin
                        ? 'bg-amber-600'
                        : 'bg-emerald-600 animate-pulse'
                      : 'bg-slate-400'
                  }`} />
                  {isConnected
                    ? isPendingAdmin
                      ? (isKm ? 'រង់ចាំសិទ្ធិ ADMIN' : 'NEEDS ADMIN ROLE')
                      : (isKm ? 'បានតភ្ជាប់ (LIVE)' : 'CONNECTED')
                    : (isKm ? 'មិនទាន់ភ្ជាប់' : 'DISCONNECTED')}
                </span>
                <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  @{botStatus?.botUsername || 'Clinic_systemBot'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isConnected
                  ? (isKm
                      ? `Bot @${botStatus.botUsername} កំពុងភ្ជាប់ជាមួយក្រុម: ${botStatus.chatTitle || botStatus.chatId}`
                      : `Bot @${botStatus.botUsername} active in group: ${botStatus.chatTitle || botStatus.chatId}`)
                  : (isKm
                      ? 'ចុច Connect 1-Click ដើម្បីបើក Telegram និង Add Bot ចូលក្នុងក្រុម។ Bot នឹងចាប់ Chat ID និងបង្កើត Topics ស្វ័យប្រវត្ត'
                      : 'Click Connect 1-Click to open Telegram and add bot to your group. Bot auto-detects Chat ID and initializes Topics.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              disabled={lockingProfile}
              onClick={handleLockProfile}
              className="px-3.5 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
              title={isKm ? 'ចាក់សោរព័ត៌មាន Bot និងការពារ Hacker កែសម្រួល' : 'Lock Bot Description & Brand Info'}
            >
              {lockingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />}
              <span>{isKm ? 'ចាក់សោរ & ការពារ Bot Profile' : 'Lock & Protect Profile'}</span>
            </button>
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isKm ? 'ផ្ដាច់ការតភ្ជាប់' : 'Disconnect'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning banner if bot is added but not admin yet */}
        {isConnected && isPendingAdmin && (
          <div className="mt-4 p-3.5 bg-amber-100/70 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isKm
                  ? 'Bot មិនទាន់មានសិទ្ធិ Administrator ឬ Manage Topics នៅក្នុងក្រុមនៅឡើយទេ។ សូមបើកសិទ្ធិឲ្យ Bot ក្នុង Telegram Group ដើម្បីបង្កើត Topics ស្វ័យប្រវត្ត។'
                  : 'Bot is missing Administrator or Manage Topics rights in the Telegram group. Please grant admin permissions to auto-create topics.'}
              </span>
            </div>
            <button
              type="button"
              disabled={checkingAdmin}
              onClick={handleCheckAdminAndCreateTopics}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0 flex items-center gap-1.5 transition-colors"
            >
              {checkingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              <span>{isKm ? 'ពិនិត្យសិទ្ធិ Admin & បង្កើត Topics' : 'Verify Admin & Create Topics'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1-Click Connect Button & Listening Radar (Visible when disconnected) */}
      {!isConnected && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>{isKm ? 'តភ្ជាប់ Telegram Bot ផ្លូវការ (1-Click Auto Setup)' : '1-Click Official Telegram Bot Setup'}</span>
            </div>
            <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Bot: @Clinic_systemBot
            </span>
          </div>

          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>{isKm ? 'របៀបដំណើរការងាយស្រួលបំផុត (1-Click Workflow):' : 'Seamless 1-Click Workflow:'}</span>
            </h4>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                {isKm
                  ? 'ចុចប៊ូតុង "ភ្ជាប់ទៅកាន់ Telegram (1-Click Connect)" ខាងក្រោម'
                  : 'Click the "Connect to Telegram (1-Click Connect)" button below'}
              </li>
              <li>
                {isKm
                  ? 'កម្មវិធី Telegram នឹងបើកឡើង ហើយបង្ហាញផ្ទាំងឲ្យអ្នកជ្រើសរើសក្រុម (Supergroup/Group)'
                  : 'Telegram app will open and prompt you to select the target supergroup'}
              </li>
              <li>
                {isKm
                  ? 'ជ្រើសរើសក្រុម រួច Add Bot ចូលជា Administrator'
                  : 'Select group and add Bot with Administrator permissions'}
              </li>
              <li>
                {isKm
                  ? 'ប្រព័ន្ធគ្លីនិកនឹងចាប់យក Chat ID ដោយស្វ័យប្រវត្ត និងបង្កើត Forum Topics ទាំង ៤ ដោយស្វ័យប្រវត្ត!'
                  : 'Clinic OS automatically detects Chat ID, verifies Admin role, and auto-creates all 4 Forum Topics!'}
              </li>
            </ol>
          </div>

          {!pairingActive ? (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleStartPairing}
                className="w-full sm:w-auto px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isKm ? 'ភ្ជាប់ទៅកាន់ Telegram (1-Click Connect)' : 'Connect to Telegram (1-Click Connect)'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={() => setShowManualSection(!showManualSection)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
              >
                <span>{isKm ? 'កំណត់ Chat ID ដោយផ្ទាល់ (Manual Setup)' : 'Manual Chat ID Setup'}</span>
                {showManualSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-teal-700 animate-spin shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    {isKm ? 'កំពុងរង់ចាំការ Add Bot ចូលក្នុងក្រុម Telegram...' : 'Waiting for Bot to be added to Telegram group...'}
                  </h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isKm
                      ? 'សូមបើក Telegram រួចជ្រើសរើសក្រុម និង Add Bot ជា Admin។ ប្រព័ន្ធកំពុងរង់ចាំចាប់យក Chat ID...'
                      : 'Please select your group in Telegram and add bot as Admin. System is listening for connection...'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {pairingDeepLink ? (
                  <a
                    href={pairingDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isKm ? 'បើកកម្មវិធី Telegram' : 'Open Telegram App'}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartPairing}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isKm ? 'បើក Telegram ឡើងវិញ' : 'Re-open Telegram'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.telegram.getPairingStatus();
                      if (res.paired) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setPairingActive(false);
                        setPairingStep('PAIRED');
                        await fetchStatus();
                        toast.success(
                          isKm
                            ? `បានតភ្ជាប់ជាមួយ ${res.chatTitle || 'ក្រុម'} និងបង្កើត Topics រួចរាល់!`
                            : `Connected to ${res.chatTitle || 'group'} and initialized forum topics!`,
                          isKm ? 'តភ្ជាប់ជោគជ័យ' : 'Connected Successfully',
                        );
                      } else {
                        toast.info(
                          isKm
                            ? 'មិនទាន់រកឃើញការ Add Bot ចូលក្រុមនៅឡើយទេ។ សូម Add Bot ចូលក្នុង Telegram Group ឬវាយពាក្យ /start ក្នុងក្រុម រួចចុចពិនិត្យម្ដងទៀត។'
                            : 'Bot not detected yet. Please add bot to your group or type /start in the group, then check again.',
                          isKm ? 'កំពុងរង់ចាំ' : 'Waiting',
                        );
                      }
                    } catch (err: any) {
                      toast.error(err.message, 'Check Failed');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                  <span>{isKm ? 'ពិនិត្យការតភ្ជាប់ឥឡូវនេះ' : 'Check Status Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelPairing}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>{isKm ? 'បោះបង់' : 'Cancel'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Manual Chat ID Fallback Form */}
          {showManualSection && (
            <form onSubmit={handleManualConnect} className="pt-4 border-t border-slate-100 space-y-3">
              <div className="text-xs font-bold text-slate-800">
                {isKm ? 'បញ្ចូល Group Chat ID ដោយផ្ទាល់' : 'Direct Group Chat ID Input'}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="-1002345678901"
                  value={manualChatId}
                  onChange={(e) => setManualChatId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <span>{isKm ? 'ភ្ជាប់ភ្លាមៗ' : 'Connect Directly'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {isKm
                  ? 'ប្រសិនបើអ្នកដឹង Chat ID ក្រុមរួចហើយ អាចបញ្ចូលត្រង់នេះដើម្បីភ្ជាប់ដោយផ្ទាល់។'
                  : 'If you already know the supergroup ID, enter it here to connect immediately.'}
              </p>
            </form>
          )}
        </div>
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
