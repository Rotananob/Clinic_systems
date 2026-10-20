'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ClientDdiAlert,
  ClientAllergyAlert,
  ClientNews2Result,
} from '../../lib/cdssEngine';

interface ClinicalDecisionSupportBannerProps {
  ddiAlerts: ClientDdiAlert[];
  allergyAlerts: ClientAllergyAlert[];
  triageResult?: ClientNews2Result | null;
  onOverrideAcknowledged?: (reason: string) => void;
  isOverridden?: boolean;
}

export const ClinicalDecisionSupportBanner: React.FC<ClinicalDecisionSupportBannerProps> = ({
  ddiAlerts,
  allergyAlerts,
  triageResult,
  onOverrideAcknowledged,
  isOverridden = false,
}) => {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';
  const cLoc = (t as any).cdss || {};

  const [isExpanded, setIsExpanded] = useState(true);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const hasBlockingAlert =
    ddiAlerts.some((a) => a.action === 'BLOCK') ||
    allergyAlerts.some((a) => a.severity === 'SEVERE' && !a.isCrossReactivity);

  const hasModerateAlert =
    ddiAlerts.some((a) => a.severity === 'MODERATE') ||
    allergyAlerts.some((a) => a.isCrossReactivity);

  const isCriticalTriage = triageResult?.riskLevel === 'HIGH';

  // If everything is completely safe and no triage elevation
  if (
    ddiAlerts.length === 0 &&
    allergyAlerts.length === 0 &&
    (!triageResult || triageResult.riskLevel === 'LOW')
  ) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="font-medium">
            {cLoc.allSafeVerified ||
              'Clinical Decision Support (CDSS): 100% verified safe. No adverse drug interactions or allergy conflicts detected.'}
          </span>
        </div>
        {triageResult && (
          <span className="px-2.5 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-full font-bold">
            NEWS2: {triageResult.totalScore} (Normal)
          </span>
        )}
      </div>
    );
  }

  const handleConfirmOverride = () => {
    if (!overrideReason.trim()) {
      setOverrideError(
        isKm
          ? 'សូមបញ្ជាក់មូលហេតុវេជ្ជសាស្ត្រមុនពេលអនុញ្ញាត (Override)។'
          : 'Clinical justification is required to override severe safety warnings.'
      );
      return;
    }
    if (onOverrideAcknowledged) {
      onOverrideAcknowledged(overrideReason);
    }
    setShowOverrideModal(false);
    setOverrideError(null);
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition shadow-sm ${
        hasBlockingAlert
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
          : hasModerateAlert || isCriticalTriage
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
      }`}
    >
      {/* Banner Header */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-3">
          {hasBlockingAlert ? (
            <div className="p-1.5 bg-rose-600 text-white rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 bg-amber-500 text-white rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-xs uppercase tracking-wider">
                {hasBlockingAlert
                  ? cLoc.severeDangerTitle || 'Clinical Safety Alert: Severe Risk Detected'
                  : cLoc.moderateWarningTitle || 'Clinical Decision Support: Safety Warnings'}
              </h4>
              {isOverridden && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  {cLoc.overriddenBadge || 'Overridden by Clinician'}
                </span>
              )}
            </div>
            <p className="text-xs opacity-90">
              {hasBlockingAlert
                ? cLoc.severeDangerDesc || 'Potentially fatal drug-drug interaction or documented patient allergy conflict.'
                : cLoc.moderateWarningDesc || 'Interaction cautions or elevated physiological triage score detected.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {triageResult && (
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                triageResult.colorCode === 'RED'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : triageResult.colorCode === 'YELLOW'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>NEWS2: {triageResult.totalScore}</span>
            </div>
          )}

          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-inherit/40 text-xs">
          {/* 1. Allergy Alerts */}
          {allergyAlerts.map((al, idx) => (
            <div
              key={`al-${idx}`}
              className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-inherit/60 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  {isKm ? 'ការប៉ះទង្គិចអាលែកហ្ស៊ីអ្នកជំងឺ (Allergy Conflict)' : 'Documented Allergy Conflict'}
                </span>
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded">
                  {al.severity}
                </span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {al.offendingMedication} -> {al.matchedAllergy}
              </p>
              <p className="text-slate-600 dark:text-slate-400">{al.recommendation}</p>
            </div>
          ))}

          {/* 2. Drug-Drug Interactions */}
          {ddiAlerts.map((ddi, idx) => (
            <div
              key={`ddi-${idx}`}
              className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-inherit/60 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold ${
                    ddi.severity === 'SEVERE'
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {isKm ? 'ប្រតិកម្មរវាងថ្នាំ និងថ្នាំ (Drug-Drug Interaction)' : 'Drug-Drug Interaction'}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    ddi.severity === 'SEVERE'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {ddi.severity} ({ddi.action})
                </span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {ddi.drug1} + {ddi.drug2}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-medium">{isKm ? 'ហានិភ័យ៖ ' : 'Risk: '}</span>
                {ddi.clinicalRisk}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-medium">{isKm ? 'ការណែនាំ៖ ' : 'Action: '}</span>
                {ddi.recommendation}
              </p>
              {ddi.safeAlternative && (
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {isKm ? 'ថ្នាំជំនួសដែលមានសុវត្ថិភាព៖ ' : 'Safe Alternative: '}
                  {ddi.safeAlternative}
                </p>
              )}
            </div>
          ))}

          {/* 3. Triage Assessment Recommendation */}
          {triageResult && triageResult.riskLevel !== 'LOW' && (
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-inherit/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {isKm ? 'ពិធីការសង្គ្រោះបឋម NEWS2 (Triage Protocol)' : 'NEWS2 Triage Recommendation'}
                </span>
                <span className="font-bold">{triageResult.riskLevel} RISK</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                {isKm ? triageResult.recommendationKh : triageResult.recommendationEn}
              </p>
            </div>
          )}

          {/* Action Row */}
          {hasBlockingAlert && !isOverridden && onOverrideAcknowledged && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                {cLoc.blockedNotice || 'Prescription submission locked due to safety warnings.'}
              </span>
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs transition shadow-sm"
              >
                {cLoc.overrideAction || 'Override with Justification'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Doctor Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {cLoc.overrideModalTitle || 'Doctor Clinical Override Confirmation'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {cLoc.overrideModalDesc ||
                'You are overriding a severe clinical warning. Please provide explicit clinical justification (e.g. inpatient monitoring, dose staggered, gastroprotection prescribed). This action will be permanently logged in the audit trail.'}
            </p>

            {overrideError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{overrideError}</span>
              </div>
            )}

            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder={
                cLoc.overridePlaceholder ||
                'Enter medical justification (e.g. Patient on daily INR monitoring and PPI prescribed)...'
              }
              rows={3}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-50"
              >
                {cLoc.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                {cLoc.confirmOverride || 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
