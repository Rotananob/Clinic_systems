'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  Lock,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { isPlanDowngrade, isPlanUpgrade, isPlanRenewal, PLAN_TIER_RANK } from '../../lib/rbac';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal';
import { SubscriptionTaxInvoiceModal } from './SubscriptionTaxInvoiceModal';
import { QuotaGuardBanner } from './QuotaGuardBanner';

export const SubscriptionSettingsPanel: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [loading, setLoading] = useState<boolean>(true);
  const [subData, setSubData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewPlansModalOpen, setIsViewPlansModalOpen] = useState<boolean>(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<
    'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12'
  >('PRO_8');
  const [selectedInvoiceIdForReceipt, setSelectedInvoiceIdForReceipt] = useState<string | null>(
    null,
  );
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const [currentRes, historyRes] = await Promise.all([
        api.subscriptions.getCurrent().catch(() => null),
        api.subscriptions.getHistory().catch(() => null),
      ]);

      if (currentRes && currentRes.success) {
        setSubData(currentRes);
      }
      if (historyRes && historyRes.success) {
        setHistory(historyRes.invoices || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const openUpgradeModal = (planTier?: 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12') => {
    const currentTier = subData?.planTier || 'FREE';
    if (planTier) {
      if (isPlanDowngrade(currentTier, planTier)) {
        return; // Prevent downgrade selection
      }
      setSelectedPlanForModal(planTier);
    } else {
      if (currentTier === 'ENTERPRISE_12') {
        setSelectedPlanForModal('ENTERPRISE_12');
      } else if (currentTier === 'PRO_8') {
        setSelectedPlanForModal('ENTERPRISE_12');
      } else if (currentTier === 'STARTER_5') {
        setSelectedPlanForModal('PRO_8');
      } else {
        setSelectedPlanForModal('PRO_8');
      }
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-6 h-6 text-teal-800 animate-spin mx-auto" />
        <p className="text-xs text-stone-500 mt-2 font-medium">
          {isKm ? 'កំពុងទាញយកទិន្នន័យគម្រោងជាវ...' : 'Loading subscription details...'}
        </p>
      </div>
    );
  }

  const planTier = subData?.planTier || 'FREE';
  const isFree = subData?.isFree || planTier === 'FREE';
  const isPastDue = !isFree && subData?.subscriptionStatus === 'PAST_DUE';
  const isExpired = !isFree && subData?.subscriptionStatus === 'EXPIRED';
  const daysRemaining = subData?.daysRemaining;

  return (
    <div className="space-y-6">
      {/* Expiry / Past Due Alert Banner: ONLY for paid plans nearing expiry or past due */}
      {!isFree && (isPastDue || isExpired || (daysRemaining !== null && daysRemaining <= 7)) && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isExpired
              ? 'bg-red-50/80 border-red-200 text-red-900'
              : isPastDue
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-teal-50/80 border-teal-200 text-teal-900'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isExpired ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : isPastDue ? (
              <Clock className="w-5 h-5 text-amber-600" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold">
              {isExpired
                ? isKm
                  ? 'គម្រោងបានផុតកំណត់សុពលភាព'
                  : 'Subscription Has Expired'
                : isPastDue
                ? isKm
                  ? 'គម្រោងស្ថិតក្នុង Grace Period - ហួសកំណត់បង់ប្រាក់'
                  : 'Subscription in Grace Period (Past Due)'
                : isKm
                ? `គម្រោងសេវាកម្មនៅសល់ ${daysRemaining} ថ្ងៃទៀតនឹងផុតកំណត់`
                : `Subscription expires in ${daysRemaining} days`}
            </div>
            <p className="leading-relaxed opacity-90">
              {isKm
                ? 'សូមបន្តសុពលភាពគម្រោងជាវតាមរយៈ Dynamic KHQR ដើម្បីបញ្ចៀសការរអាក់រអួលដល់ដំណើរការពិនិត្យព្យាបាល និងការទូទាត់ប្រាក់។'
                : 'Please renew your plan via Dynamic KHQR to ensure uninterrupted clinical operations and payment settlement.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openUpgradeModal(planTier as any)}
            className="ml-auto shrink-0 px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            {isKm ? 'បន្តសុពលភាព' : 'Renew Plan'}
          </button>
        </div>
      )}

      {/* Main Subscription Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  SaaS Operating Tier
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-teal-800" />
                  <span>{isKm ? 'គម្រោងបច្ចុប្បន្ន' : 'Current Plan'}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 font-sans">
                {subData?.planNameEn || planTier}
              </h2>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'គម្រោងប្រតិបត្តិការបច្ចុប្បន្នរបស់គ្លីនិក'
                  : 'Current clinical operating subscription plan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View All Plans Button */}
            <button
              type="button"
              onClick={() => setIsViewPlansModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-teal-800" />
              <span>{isKm ? 'មើលគម្រោងទាំងអស់' : 'View All Plans'}</span>
            </button>

            {/* Upgrade / Renew Button */}
            <button
              type="button"
              onClick={() => openUpgradeModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>
                {planTier === 'ENTERPRISE_12'
                  ? isKm ? 'បន្តគម្រោង KHQR' : 'Renew Plan'
                  : isKm ? 'Upgrade / បន្តគម្រោង KHQR' : 'Upgrade / Renew Plan'}
              </span>
            </button>
          </div>
        </div>

        {/* Quotas & Expiry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isKm ? 'ស្ថានភាពគម្រោង' : 'Plan Status'}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-stone-900 text-sm">
                {isFree ? 'ACTIVE (Free Forever)' : (subData?.subscriptionStatus || 'ACTIVE')}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isFree ? (isKm ? 'សុពលភាព' : 'Validity') : (isKm ? 'រយៈពេលនៅសល់' : 'Days Remaining')}
            </div>
            <div className="font-bold text-teal-800 text-sm">
              {isFree
                ? isKm ? 'ឥតគិតថ្លៃរហូត' : 'Free Forever'
                : `${daysRemaining ?? 0} ${isKm ? 'ថ្ងៃ' : 'days'}`}
            </div>
            {!isFree && subData?.expiryFormattedKh && (
              <div className="text-[10px] text-stone-500">
                {isKm ? `ផុតកំណត់: ${subData.expiryFormattedKh}` : `Expires: ${subData.expiryFormattedEn}`}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isKm ? 'កូតា KHQR ប្រចាំថ្ងៃ' : 'Daily KHQR Quota'}
            </div>
            <div className="font-bold text-stone-900 text-sm font-mono">
              {subData?.maxDailyKhqr === -1
                ? 'Unlimited'
                : `${subData?.maxDailyKhqr || (isFree ? 5 : 250)} / ថ្ងៃ`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isKm ? 'កូតាអ្នកជំងឺក្នុងមួយគណនី' : 'Patient Limit / Account'}
            </div>
            <div className="font-bold text-stone-900 text-sm font-mono">
              {subData?.maxMonthlyPatients === -1
                ? 'Unlimited'
                : `${subData?.maxMonthlyPatients || (isFree ? 50 : 1000)} នាក់ / គណនី`}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Operational Quota Guard */}
      <QuotaGuardBanner onUpgradeClick={() => openUpgradeModal()} />

      {/* Available Plans Upgrade Options */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-sans">
              {isKm ? 'ជម្រើសគម្រោង & Upgrade' : 'Available Subscription Upgrades'}
            </h3>
            <p className="text-xs text-stone-500">
              {isKm
                ? 'ជ្រើសរើសគម្រោងដែលស័ក្តិសមជាមួយទំហំប្រតិបត្តិការគ្លីនិករបស់លោកអ្នក មិនអនុញ្ញាតឱ្យទម្លាក់គម្រោងទាបជាងឡើយ'
                : 'Scale your clinic operating capacity with instantaneous KHQR activation. Downgrading to lower tiers is not permitted.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsViewPlansModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-teal-800" />
            <span>{isKm ? 'ប្រៀបធៀបគម្រោងទាំងអស់' : 'Compare All Plans'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Starter $5 */}
          {(() => {
            const cardTier = 'STARTER_5';
            const isDowngrade = isPlanDowngrade(planTier, cardTier);
            const isCurrent = planTier === cardTier;
            const isUpgrade = isPlanUpgrade(planTier, cardTier);

            return (
              <div
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-50/50 border-teal-600 ring-1 ring-teal-600'
                    : isDowngrade
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {isCurrent ? (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold shadow-2xs">
                    {isKm ? 'គម្រោងបច្ចុប្បន្ន' : 'CURRENT PLAN'}
                  </div>
                ) : isDowngrade ? (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold border border-stone-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'LOCKED'}</span>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">Clinic Starter</span>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-teal-800">$5/mo</span>
                      <span className="block text-[10px] text-emerald-700 font-bold">
                        {isKm ? '$48/ឆ្នាំ ចុះ ២០%' : '$48/yr (20% off)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2 space-y-1">
                    <div>• 250 Dynamic KHQR / ថ្ងៃ</div>
                    <div>• 1,000 អ្នកជំងឺ / គណនី</div>
                    <div>• ម៉ាស៊ីនព្រីន 80mm & សំឡេងខ្មែរ</div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDowngrade}
                  onClick={() => openUpgradeModal('STARTER_5')}
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                    isDowngrade
                      ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                      : isCurrent
                      ? 'bg-teal-800 hover:bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {isDowngrade
                    ? isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'Cannot Downgrade'
                    : isCurrent
                    ? isKm ? 'បន្តគម្រោងនេះ' : 'Renew Plan'
                    : isKm ? 'Upgrade ទៅ $5' : 'Upgrade to $5'}
                </button>
              </div>
            );
          })()}

          {/* Card 2: Pro $8 */}
          {(() => {
            const cardTier = 'PRO_8';
            const isDowngrade = isPlanDowngrade(planTier, cardTier);
            const isCurrent = planTier === cardTier;
            const isUpgrade = isPlanUpgrade(planTier, cardTier);

            return (
              <div
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-50/50 border-teal-600 ring-1 ring-teal-600'
                    : isDowngrade
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {isCurrent ? (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold shadow-2xs">
                    {isKm ? 'គម្រោងបច្ចុប្បន្ន' : 'CURRENT PLAN'}
                  </div>
                ) : isDowngrade ? (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold border border-stone-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'LOCKED'}</span>
                  </div>
                ) : (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold">
                    POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">Polyclinic Pro</span>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-teal-800">$8/mo</span>
                      <span className="block text-[10px] text-emerald-700 font-bold">
                        {isKm ? '$76/ឆ្នាំ ចុះ ២០%' : '$76/yr (20% off)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2 space-y-1">
                    <div>• 1,500 Dynamic KHQR / ថ្ងៃ</div>
                    <div>• ៨,០០០ អ្នកជំងឺ / គណនី</div>
                    <div>• 4 Forum Topics Supergroup</div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDowngrade}
                  onClick={() => openUpgradeModal('PRO_8')}
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                    isDowngrade
                      ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                      : 'bg-teal-800 hover:bg-teal-700 text-white shadow-xs'
                  }`}
                >
                  {isDowngrade
                    ? isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'Cannot Downgrade'
                    : isCurrent
                    ? isKm ? 'បន្តគម្រោងនេះ' : 'Renew Plan'
                    : isKm ? 'Upgrade ទៅ $8' : 'Upgrade to $8'}
                </button>
              </div>
            );
          })()}

          {/* Card 3: Enterprise $12 */}
          {(() => {
            const cardTier = 'ENTERPRISE_12';
            const isCurrent = planTier === cardTier;

            return (
              <div
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-50/50 border-teal-600 ring-1 ring-teal-600'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold shadow-2xs">
                    {isKm ? 'គម្រោងបច្ចុប្បន្ន' : 'CURRENT PLAN'}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">Hospital Enterprise</span>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-teal-800">$12/mo</span>
                      <span className="block text-[10px] text-emerald-700 font-bold">
                        {isKm ? '$115/ឆ្នាំ ចុះ ២០%' : '$115/yr (20% off)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2 space-y-1">
                    <div>• Unlimited KHQR / ថ្ងៃ</div>
                    <div>• Custom Subdomain ផ្ទាល់ខ្លួន</div>
                    <div>• ជំនួយបច្ចេកទេស VIP 24/7</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openUpgradeModal('ENTERPRISE_12')}
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'bg-teal-800 hover:bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {isCurrent
                    ? isKm ? 'បន្តគម្រោងនេះ' : 'Renew Plan'
                    : isKm ? 'Upgrade ទៅ $12' : 'Upgrade to $12'}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 font-sans">
            {isKm ? 'ប្រវត្តិវិក្កយបត្រជាវសេវាកម្ម' : 'Subscription Billing History'}
          </h3>
          <p className="text-xs text-stone-500">
            {isKm
              ? 'បញ្ជីវិក្កយបត្រ និងការបង់ប្រាក់ជាវប្រចាំខែទាំងអស់'
              : 'All historical SaaS subscription renewal invoices and payments'}
          </p>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-[#FAF7F2] rounded-xl border border-stone-200">
            {isKm
              ? 'មិនទាន់មានប្រវត្តិវិក្កយបត្រជាវសេវាកម្មនៅឡើយទេ'
              : 'No billing invoices recorded yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {history.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">
                      {inv.invoiceNumber || 'SUB-DEFAULT'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-800">{inv.planTier}</td>
                    <td className="py-3 px-3 font-bold text-teal-800">${Number(inv.amountUsd).toFixed(2)}</td>
                    <td className="py-3 px-3 text-stone-600">{inv.paymentMethod || 'KHQR'}</td>
                    <td className="py-3 px-3 text-stone-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceIdForReceipt(inv.id);
                          setIsReceiptModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors shadow-2xs"
                        title={isKm ? 'មើលវិក្កយបត្រពន្ធផ្លូវការ' : 'View official tax receipt'}
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-800" />
                        <span>{isKm ? 'វិក្កយបត្រ' : 'Receipt'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View All Plans Modal */}
      {isViewPlansModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-[#FAF7F2] border border-stone-300 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5 text-teal-100" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-sans">
                    {isKm ? 'ប្រៀបធៀបគម្រោងសេវាកម្មទាំងអស់' : 'Compare All Clinic Operating Plans'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {isKm
                      ? 'ព័ត៌មានលម្អិតអំពីកូតា តម្លៃ និងមុខងារនៃគម្រោងនីមួយៗ គម្រោងទាបជាងមិនអាចទម្លាក់បានឡើយ'
                      : 'Detailed overview of limits, pricing, and modules. Downgrades are strictly prevented.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsViewPlansModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 4 Plan Columns */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. FREE FOREVER */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    planTier === 'FREE'
                      ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/30'
                      : 'bg-white border-stone-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">Free Forever</span>
                      {planTier === 'FREE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-800 text-white">
                          CURRENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-stone-200 text-stone-600 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>LOCKED</span>
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-stone-900">$0</div>
                    <div className="text-[11px] text-stone-500 space-y-1.5 pt-2 border-t border-stone-100">
                      <div>• 5 KHQR / ថ្ងៃ</div>
                      <div>• 50 អ្នកជំងឺ / គណនី</div>
                      <div>• 2 គណនីបុគ្គលិក</div>
                      <div>• វិក្កយបត្រអេឡិចត្រូនិច</div>
                      <div>• សាកល្បងឥតគិតថ្លៃរហូត</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={true}
                    className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                  >
                    {planTier === 'FREE'
                      ? isKm ? 'គម្រោងបច្ចុប្បន្ន' : 'Current Plan'
                      : isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'Cannot Downgrade'}
                  </button>
                </div>

                {/* 2. STARTER_5 */}
                {(() => {
                  const cardTier = 'STARTER_5';
                  const isDowngrade = isPlanDowngrade(planTier, cardTier);
                  const isCurrent = planTier === cardTier;
                  return (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/30'
                          : isDowngrade
                          ? 'bg-white border-stone-200 opacity-60'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900">Clinic Starter</span>
                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-800 text-white">
                              CURRENT
                            </span>
                          ) : isDowngrade ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-stone-200 text-stone-600 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>LOCKED</span>
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <div className="text-2xl font-black text-teal-900">$5<span className="text-xs font-normal text-stone-500">/mo</span></div>
                          <div className="text-[10px] text-emerald-700 font-bold">$48/yr (-20%)</div>
                        </div>
                        <div className="text-[11px] text-stone-500 space-y-1.5 pt-2 border-t border-stone-100">
                          <div>• 250 KHQR / ថ្ងៃ</div>
                          <div>• 1,000 អ្នកជំងឺ / គណនី</div>
                          <div>• 5 គណនីបុគ្គលិក</div>
                          <div>• ហៅអ្នកជំងឺសំឡេងខ្មែរ</div>
                          <div>• ម៉ាស៊ីនព្រីន 80mm</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDowngrade}
                        onClick={() => {
                          setIsViewPlansModalOpen(false);
                          openUpgradeModal('STARTER_5');
                        }}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                          isDowngrade
                            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        {isDowngrade
                          ? isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'Cannot Downgrade'
                          : isCurrent
                          ? isKm ? 'បន្តគម្រោងនេះ' : 'Renew Plan'
                          : isKm ? 'Upgrade ទៅ $5' : 'Upgrade to $5'}
                      </button>
                    </div>
                  );
                })()}

                {/* 3. PRO_8 */}
                {(() => {
                  const cardTier = 'PRO_8';
                  const isDowngrade = isPlanDowngrade(planTier, cardTier);
                  const isCurrent = planTier === cardTier;
                  return (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/30'
                          : isDowngrade
                          ? 'bg-white border-stone-200 opacity-60'
                          : 'bg-white border-teal-700/60 shadow-xs ring-1 ring-teal-700/10'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900">Polyclinic Pro</span>
                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-800 text-white">
                              CURRENT
                            </span>
                          ) : isDowngrade ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-stone-200 text-stone-600 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>LOCKED</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-800 text-white">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-2xl font-black text-teal-900">$8<span className="text-xs font-normal text-stone-500">/mo</span></div>
                          <div className="text-[10px] text-emerald-700 font-bold">$76/yr (-20%)</div>
                        </div>
                        <div className="text-[11px] text-stone-500 space-y-1.5 pt-2 border-t border-stone-100">
                          <div>• 1,500 KHQR / ថ្ងៃ</div>
                          <div>• 8,000 អ្នកជំងឺ / គណនី</div>
                          <div>• 15 គណនីបុគ្គលិក</div>
                          <div>• 4 Forum Topics Supergroup</div>
                          <div>• PACS & ស្តុកឱសថស្ថានកម្រិតខ្ពស់</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDowngrade}
                        onClick={() => {
                          setIsViewPlansModalOpen(false);
                          openUpgradeModal('PRO_8');
                        }}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                          isDowngrade
                            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                            : 'bg-teal-800 hover:bg-teal-700 text-white shadow-xs'
                        }`}
                      >
                        {isDowngrade
                          ? isKm ? 'មិនអាចទម្លាក់គម្រោង' : 'Cannot Downgrade'
                          : isCurrent
                          ? isKm ? 'បន្តគម្រោងនេះ' : 'Renew Plan'
                          : isKm ? 'Upgrade ទៅ $8' : 'Upgrade to $8'}
                      </button>
                    </div>
                  );
                })()}

                {/* 4. ENTERPRISE_12 */}
                {(() => {
                  const cardTier = 'ENTERPRISE_12';
                  const isCurrent = planTier === cardTier;
                  return (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/30'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900">Hospital Enterprise</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-800 text-white">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-2xl font-black text-teal-900">$12<span className="text-xs font-normal text-stone-500">/mo</span></div>
                          <div className="text-[10px] text-emerald-700 font-bold">$115/yr (-20%)</div>
                        </div>
                        <div className="text-[11px] text-stone-500 space-y-1.5 pt-2 border-t border-stone-100">
                          <div>• Unlimited KHQR / ថ្ងៃ</div>
                          <div>• Unlimited អ្នកជំងឺ / គណនី</div>
                          <div>• Unlimited គណនីបុគ្គលិក</div>
                          <div>• Custom Subdomain ផ្ទាល់ខ្លួន</div>
                          <div>• ជំនួយបច្ចេកទេស VIP 24/7</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsViewPlansModalOpen(false);
                          openUpgradeModal('ENTERPRISE_12');
                        }}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-teal-800 hover:bg-teal-700 text-white shadow-xs'
                            : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        {isCurrent
                          ? isKm ? 'បន្តគម្រោងនេះ' : 'Renew Plan'
                          : isKm ? 'Upgrade ទៅ $12' : 'Upgrade to $12'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                {isKm ? 'ការទូទាត់ប្រាក់ធ្វើឡើងតាមរយៈ Dynamic KHQR ផ្ទាល់' : 'Payments are processed strictly via dynamic KHQR'}
              </span>
              <button
                type="button"
                onClick={() => setIsViewPlansModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
              >
                {isKm ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Checkout Modal */}
      <SubscriptionCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlanTier={selectedPlanForModal}
        currentTenantPlanTier={planTier}
        onActivated={() => {
          fetchSubscriptionDetails();
        }}
      />

      {/* SaaS Subscription Tax Receipt Modal */}
      <SubscriptionTaxInvoiceModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedInvoiceIdForReceipt(null);
        }}
        subscriptionId={selectedInvoiceIdForReceipt}
      />
    </div>
  );
};
