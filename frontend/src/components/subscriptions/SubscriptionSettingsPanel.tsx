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
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
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
    if (planTier) {
      setSelectedPlanForModal(planTier);
    } else {
      setSelectedPlanForModal(
        subData?.planTier === 'STARTER_5' ? 'PRO_8' : 'ENTERPRISE_12',
      );
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
  const isPastDue = subData?.subscriptionStatus === 'PAST_DUE';
  const isExpired = subData?.subscriptionStatus === 'EXPIRED';
  const daysRemaining = subData?.daysRemaining ?? 0;

  return (
    <div className="space-y-6">
      {/* Expiry / Past Due Alert Banner */}
      {(isPastDue || isExpired || daysRemaining <= 7) && (
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
                  ? 'គម្រោងស្ថិតក្នុង Grace Period (ហួសកំណត់បង់ប្រាក់)'
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
            onClick={() => openUpgradeModal()}
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                SaaS Operating Tier
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openUpgradeModal('PRO_8')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{isKm ? 'Upgrade / បន្តគម្រោង KHQR' : 'Upgrade / Renew Plan'}</span>
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
              <span
                className={`w-2 h-2 rounded-full ${
                  subData?.subscriptionStatus === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              ></span>
              <span className="font-bold text-stone-900 text-sm">
                {subData?.subscriptionStatus || 'ACTIVE'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isKm ? 'រយៈពេលនៅសល់' : 'Days Remaining'}
            </div>
            <div className="font-bold text-teal-800 text-sm">
              {daysRemaining} {isKm ? 'ថ្ងៃ' : 'days'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isKm ? 'កូតា KHQR ប្រចាំថ្ងៃ' : 'Daily KHQR Quota'}
            </div>
            <div className="font-bold text-stone-900 text-sm font-mono">
              {subData?.maxDailyKhqr === -1
                ? 'Unlimited'
                : `${subData?.maxDailyKhqr || 250} / ថ្ងៃ`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-1">
            <div className="text-[11px] text-stone-500 font-medium">
              {isKm ? 'កូតាអ្នកជំងឺក្នុងមួយគណនី' : 'Patient Limit / Account'}
            </div>
            <div className="font-bold text-stone-900 text-sm font-mono">
              {subData?.maxMonthlyPatients === -1
                ? 'Unlimited'
                : `${subData?.maxMonthlyPatients || 1000} នាក់ / គណនី`}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Operational Quota Guard */}
      <QuotaGuardBanner onUpgradeClick={() => openUpgradeModal()} />

      {/* Available Plans Upgrade Options */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 font-sans">
            {isKm ? 'ជម្រើសគម្រោង Upgrade ផ្សេងៗ' : 'Available Subscription Upgrades'}
          </h3>
          <p className="text-xs text-stone-500">
            {isKm
              ? 'ជ្រើសរើសគម្រោងដែលស័ក្តិសមជាមួយទំហំប្រតិបត្តិការគ្លីនិករបស់លោកអ្នក'
              : 'Scale your clinic operating capacity with instantaneous KHQR activation'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Starter $5 */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              planTier === 'STARTER_5'
                ? 'bg-teal-50/50 border-teal-600 ring-1 ring-teal-600'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
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
            <button
              type="button"
              onClick={() => openUpgradeModal('STARTER_5')}
              className="mt-4 w-full py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition-colors"
            >
              {planTier === 'STARTER_5'
                ? isKm
                  ? 'បន្តគម្រោងនេះ'
                  : 'Renew Plan'
                : isKm
                ? 'ជ្រើសរើស $5'
                : 'Select $5 Plan'}
            </button>
          </div>

          {/* Card 2: Pro $8 */}
          <div
            className={`p-5 rounded-2xl border transition-all relative ${
              planTier === 'PRO_8'
                ? 'bg-teal-50/50 border-teal-600 ring-1 ring-teal-600'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold">
              POPULAR
            </div>
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
            <button
              type="button"
              onClick={() => openUpgradeModal('PRO_8')}
              className="mt-4 w-full py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {planTier === 'PRO_8'
                ? isKm
                  ? 'បន្តគម្រោងនេះ'
                  : 'Renew Plan'
                : isKm
                ? 'Upgrade ទៅ $8'
                : 'Upgrade to $8'}
            </button>
          </div>

          {/* Card 3: Enterprise $12 */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              planTier === 'ENTERPRISE_12'
                ? 'bg-teal-50/50 border-teal-600 ring-1 ring-teal-600'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
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
            <button
              type="button"
              onClick={() => openUpgradeModal('ENTERPRISE_12')}
              className="mt-4 w-full py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition-colors"
            >
              {planTier === 'ENTERPRISE_12'
                ? isKm
                  ? 'បន្តគម្រោងនេះ'
                  : 'Renew Plan'
                : isKm
                ? 'Upgrade ទៅ $12'
                : 'Upgrade to $12'}
            </button>
          </div>
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

      {/* Subscription Checkout Modal */}
      <SubscriptionCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlanTier={selectedPlanForModal}
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
