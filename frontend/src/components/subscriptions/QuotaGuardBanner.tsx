'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Zap,
  Users,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

interface QuotaGuardBannerProps {
  onUpgradeClick?: () => void;
  className?: string;
  compact?: boolean;
}

export const QuotaGuardBanner: React.FC<QuotaGuardBannerProps> = ({
  onUpgradeClick,
  className = '',
  compact = false,
}) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [loading, setLoading] = useState<boolean>(true);
  const [quota, setQuota] = useState<any>(null);

  const loadQuota = async () => {
    try {
      const res = await api.subscriptions.getQuotaStatus();
      if (res && res.planTier) {
        setQuota(res);
      }
    } catch {
      // Fallback silently if unauthenticated or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuota();
  }, []);

  if (loading || !quota) {
    return null;
  }

  const { dailyKhqr, monthlyPatients, staffAccounts, planNameKh, planNameEn, planTier } = quota;

  const isAnyLimitExceeded =
    dailyKhqr?.isExceeded || monthlyPatients?.isExceeded || staffAccounts?.isExceeded;
  const isAnyApproaching =
    dailyKhqr?.isApproachingLimit ||
    monthlyPatients?.isApproachingLimit ||
    staffAccounts?.isApproachingLimit;

  // Render warning or urgent alert if >= 80% or 100% exceeded
  const showWarningBanner = isAnyLimitExceeded || isAnyApproaching;

  const renderProgressBar = (labelKh: string, labelEn: string, metric: any, icon: React.ReactNode) => {
    const isUnlimited = metric.limit === -1;
    const percent = isUnlimited ? 0 : Math.min(100, metric.percent || 0);

    const barColor = metric.isExceeded
      ? 'bg-red-600'
      : metric.isApproachingLimit
      ? 'bg-amber-500'
      : 'bg-teal-700';

    return (
      <div className="space-y-1.5 flex-1 min-w-[200px]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            {icon}
            <span>{isKm ? labelKh : labelEn}</span>
          </div>
          <div className="font-mono text-stone-900 font-bold">
            {isUnlimited ? (
              <span className="text-teal-700 font-semibold">Unlimited</span>
            ) : (
              <span>
                {metric.used} / {metric.limit}{' '}
                <span className="text-[10px] text-stone-400 font-normal">({percent}%)</span>
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${isUnlimited ? 100 : percent}%` }}
          />
        </div>

        {metric.isExceeded && (
          <div className="text-[10px] font-bold text-red-600">
            {isKm ? 'បានប្រើអស់កូតាហើយ' : 'Quota limit reached'}
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-xl border border-stone-200 bg-white ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-900">
              {isKm ? planNameKh : planNameEn}
            </span>
            {isAnyLimitExceeded && (
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                {isKm ? 'កូតាពេញ' : 'Limit Reached'}
              </span>
            )}
          </div>

          {onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="text-xs font-bold text-teal-800 hover:text-teal-900 inline-flex items-center gap-1"
            >
              <span>{isKm ? 'Upgrade គម្រោង' : 'Upgrade Plan'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Fair Usage Alert if Approaching or Exceeded */}
      {showWarningBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-colors ${
            isAnyLimitExceeded
              ? 'bg-red-50 border-red-200 text-red-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            <AlertTriangle
              className={`w-5 h-5 ${isAnyLimitExceeded ? 'text-red-600' : 'text-amber-600'}`}
            />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold">
              {isAnyLimitExceeded
                ? isKm
                  ? 'ការព្រមាន៖ កូតាប្រតិបត្តិការត្រូវបានប្រើប្រាស់ពេញកម្រិត'
                  : 'Notice: Operational Quota Limit Reached'
                : isKm
                ? 'ការជូនដំណឹង៖ កូតាប្រតិបត្តិការជិតដល់កម្រិតកំណត់ (>= 80%)'
                : 'Notice: Operational Quota Approaching Limit (>= 80%)'}
            </div>
            <p className="opacity-90 leading-relaxed text-[11px]">
              {isKm
                ? 'ដើម្បីបន្តបង្កើត Dynamic KHQR និងចុះឈ្មោះអ្នកជំងឺដោយគ្មានការរំខាន សូម Upgrade ទៅកាន់គម្រោងខ្ពស់ជាងនេះ។'
                : 'To continue generating Dynamic KHQR payments and registering patients smoothly, upgrade to a higher operating tier.'}
            </p>
          </div>
          {onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="ml-auto shrink-0 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              {isKm ? 'Upgrade ឥឡូវនេះ' : 'Upgrade Now'}
            </button>
          )}
        </div>
      )}

      {/* Quota Usage Gauge Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              {isKm ? 'កម្រិតប្រើប្រាស់កូតាប្រតិបត្តិការ' : 'Operational Quota & Usage Guard'}
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono">
            Tier: {planTier}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {renderProgressBar(
            'Dynamic KHQR ប្រចាំថ្ងៃ',
            'Daily Dynamic KHQR',
            dailyKhqr,
            <CreditCard className="w-3.5 h-3.5 text-stone-500" />,
          )}

          {renderProgressBar(
            'អ្នកជំងឺប្រចាំខែ',
            'Monthly Patients',
            monthlyPatients,
            <Users className="w-3.5 h-3.5 text-stone-500" />,
          )}

          {renderProgressBar(
            'គណនីបុគ្គលិក',
            'Staff Accounts',
            staffAccounts,
            <Zap className="w-3.5 h-3.5 text-stone-500" />,
          )}
        </div>
      </div>
    </div>
  );
};
