'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Flame,
  Baby,
  Droplets,
  HeartPulse,
  Clock,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Syringe,
} from 'lucide-react';

export default function ResuscitationPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'SEPSIS' | 'PARKLAND' | 'PEDIATRIC' | 'MTP'>('SEPSIS');

  // Tab 1: Sepsis State
  const [patientWeightKg, setPatientWeightKg] = useState<number>(70);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(24);
  const [glasgowComaScale, setGlasgowComaScale] = useState<number>(13);
  const [systolicBp, setSystolicBp] = useState<number>(95);
  const [measuredMap, setMeasuredMap] = useState<number>(62);
  const [initialLactate, setInitialLactate] = useState<number>(4.2);
  const [repeatLactate, setRepeatLactate] = useState<number>(2.4);
  const [elapsedHours, setElapsedHours] = useState<number>(2);

  // Tab 2: Parkland Burn State
  const [burnWeightKg, setBurnWeightKg] = useState<number>(70);
  const [tbsaPercentage, setTbsaPercentage] = useState<number>(35);
  const [hoursSinceInjury, setHoursSinceInjury] = useState<number>(1);
  const [currentInfusionRate, setCurrentInfusionRate] = useState<number>(600);
  const [measuredUop, setMeasuredUop] = useState<number>(25);

  // Tab 3: Pediatric Broselow State
  const [pedAgeYears, setPedAgeYears] = useState<number>(4);
  const [pedWeightKg, setPedWeightKg] = useState<number>(16);

  // Tab 4: Trauma Shock & MTP State
  const [traumaHr, setTraumaHr] = useState<number>(125);
  const [traumaSbp, setTraumaSbp] = useState<number>(85);
  const [isPenetrating, setIsPenetrating] = useState<boolean>(true);
  const [isFastPositive, setIsFastPositive] = useState<boolean>(true);
  const [traumaElapsedHours, setTraumaElapsedHours] = useState<number>(1.5);

  const isKhmer = locale === 'km';
  const r = t.resuscitation;

  // Sepsis Calculations
  let qsofaScore = 0;
  if (respiratoryRate >= 22) qsofaScore += 1;
  if (glasgowComaScale < 15) qsofaScore += 1;
  if (systolicBp <= 100) qsofaScore += 1;
  const isQsofaHighRisk = qsofaScore >= 2;

  const crystalloidBolusMl = Math.round(patientWeightKg * 30);
  const crystalloidHourlyRate = Math.round(crystalloidBolusMl / 3);

  const baseLac = Math.max(0.1, initialLactate);
  const repLac = Math.max(0, repeatLactate);
  const lactateClearancePct = Math.round(((baseLac - repLac) / baseLac) * 1000) / 10;
  const isLactateAdequate = lactateClearancePct >= 20.0;

  // Parkland Calculations
  const validBurnWeight = Math.max(1, burnWeightKg);
  const validTbsa = Math.max(1, Math.min(100, tbsaPercentage));
  const totalBurnFluid24h = Math.round(4 * validBurnWeight * validTbsa);
  const first8hTotal = Math.round(totalBurnFluid24h * 0.5);
  const next16hTotal = Math.round(totalBurnFluid24h * 0.5);

  const remainingFirst8hHours = Math.max(1, 8 - hoursSinceInjury);
  const first8hRate = Math.round(first8hTotal / remainingFirst8hHours);
  const next16hRate = Math.round(next16hTotal / 16);

  let uopAction: 'MAINTAIN' | 'INCREASE' | 'DECREASE' = 'MAINTAIN';
  let adjustedInfusionRate = currentInfusionRate;
  if (measuredUop < 30) {
    uopAction = 'INCREASE';
    adjustedInfusionRate = Math.round(currentInfusionRate * 1.2);
  } else if (measuredUop > 50) {
    uopAction = 'DECREASE';
    adjustedInfusionRate = Math.round(currentInfusionRate * 0.8);
  }

  // Pediatric Broselow Calculations
  let broselowColorNameEn = 'Grey (3 - 5 kg)';
  let broselowColorNameKm = 'ពណ៌ប្រផេះ ៣ ដល់ ៥ គីឡូក្រាម';
  let broselowBg = 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';

  if (pedWeightKg >= 30) {
    broselowColorNameEn = 'Green (30 - 36 kg)';
    broselowColorNameKm = 'ពណ៌បៃតង ៣០ ដល់ ៣៦ គីឡូក្រាម';
    broselowBg = 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300';
  } else if (pedWeightKg >= 24) {
    broselowColorNameEn = 'Orange (24 - 29 kg)';
    broselowColorNameKm = 'ពណ៌ទឹកក្រូច ២៤ ដល់ ២៩ គីឡូក្រាម';
    broselowBg = 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300';
  } else if (pedWeightKg >= 19) {
    broselowColorNameEn = 'Blue (19 - 23 kg)';
    broselowColorNameKm = 'ពណ៌ខៀវ ១៩ ដល់ ២៣ គីឡូក្រាម';
    broselowBg = 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300';
  } else if (pedWeightKg >= 15) {
    broselowColorNameEn = 'White (15 - 18 kg)';
    broselowColorNameKm = 'ពណ៌ស ១៥ ដល់ ១៨ គីឡូក្រាម';
    broselowBg = 'bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-900 dark:border-gray-600 dark:text-white';
  } else if (pedWeightKg >= 12) {
    broselowColorNameEn = 'Yellow (12 - 14 kg)';
    broselowColorNameKm = 'ពណ៌លឿង ១២ ដល់ ១៤ គីឡូក្រាម';
    broselowBg = 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300';
  } else if (pedWeightKg >= 10) {
    broselowColorNameEn = 'Purple (10 - 11 kg)';
    broselowColorNameKm = 'ពណ៌ស្វាយ ១០ ដល់ ១១ គីឡូក្រាម';
    broselowBg = 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300';
  } else if (pedWeightKg >= 8) {
    broselowColorNameEn = 'Red (8 - 9 kg)';
    broselowColorNameKm = 'ពណ៌ក្រហម ៨ ដល់ ៩ គីឡូក្រាម';
    broselowBg = 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300';
  } else if (pedWeightKg >= 6) {
    broselowColorNameEn = 'Pink (6 - 7 kg)';
    broselowColorNameKm = 'ពណ៌ផ្កាឈូក ៦ ដល់ ៧ គីឡូក្រាម';
    broselowBg = 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-300';
  }

  const ettUncuffed = pedAgeYears >= 1 ? Math.round(((pedAgeYears / 4) + 4) * 10) / 10 : 3.5;
  const ettCuffed = pedAgeYears >= 1 ? Math.round(((pedAgeYears / 4) + 3.5) * 10) / 10 : 3.0;
  const ettDepth = pedAgeYears >= 1 ? Math.round(((pedAgeYears / 2) + 12) * 10) / 10 : 10.0;
  const defibFirstJ = Math.round(pedWeightKg * 2);
  const defibSubsequentJ = Math.min(200, Math.round(pedWeightKg * 4));
  const cardioJ = Math.min(100, Math.round(pedWeightKg * 1.0));
  const epiDose = Math.min(1.0, Math.round(pedWeightKg * 0.01 * 100) / 100);
  const epiVol = Math.round(pedWeightKg * 0.1 * 10) / 10;
  const amiodaroneDose = Math.min(300, Math.round(pedWeightKg * 5));
  const atropineDose = Math.min(0.5, Math.max(0.1, Math.round(pedWeightKg * 0.02 * 100) / 100));

  // Trauma & MTP Calculations
  const shockIndex = Math.round((traumaHr / Math.max(1, traumaSbp)) * 100) / 100;
  let abcScore = 0;
  if (isPenetrating) abcScore += 1;
  if (traumaSbp <= 90) abcScore += 1;
  if (traumaHr >= 120) abcScore += 1;
  if (isFastPositive) abcScore += 1;

  const isMtpActivated = abcScore >= 2 || shockIndex >= 1.0;
  const isTxaApproved = traumaElapsedHours <= 3.0;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {r.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {r.subtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
            Surviving Sepsis 2021/2026
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
            ATLS & CRASH-2 Verified
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-2">
        <button
          onClick={() => setActiveTab('SEPSIS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'SEPSIS'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          {r.tabSepsis}
        </button>

        <button
          onClick={() => setActiveTab('PARKLAND')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'PARKLAND'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          {r.tabParkland}
        </button>

        <button
          onClick={() => setActiveTab('PEDIATRIC')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'PEDIATRIC'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Baby className="w-4 h-4" />
          {r.tabPediatric}
        </button>

        <button
          onClick={() => setActiveTab('MTP')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'MTP'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Droplets className="w-4 h-4" />
          {r.tabMtp}
        </button>
      </div>

      {/* Tab 1: Sepsis Hour-1 & SOFA */}
      {activeTab === 'SEPSIS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Sepsis Screening Inputs
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {r.patientWeightKg}
              </label>
              <input
                type="number"
                min="10"
                max="250"
                value={patientWeightKg}
                onChange={(e) => setPatientWeightKg(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {r.respiratoryRate}
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {r.glasgowComaScale}
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={glasgowComaScale}
                  onChange={(e) => setGlasgowComaScale(parseInt(e.target.value, 10) || 3)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {r.systolicBp}
                </label>
                <input
                  type="number"
                  min="20"
                  max="250"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {r.meanArterialPressure}
                </label>
                <input
                  type="number"
                  min="20"
                  max="180"
                  value={measuredMap}
                  onChange={(e) => setMeasuredMap(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {r.initialLactate}
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="25"
                  step="0.1"
                  value={initialLactate}
                  onChange={(e) => setInitialLactate(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {r.repeatLactate}
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="25"
                  step="0.1"
                  value={repeatLactate}
                  onChange={(e) => setRepeatLactate(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Sepsis Decision Output */}
          <div className="lg:col-span-2 space-y-6">
            {/* qSOFA Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {r.qsofaScore}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                      {qsofaScore}
                    </span>
                    <span className="text-sm font-medium text-gray-500">/ 3 points</span>
                  </div>
                </div>

                {isQsofaHighRisk ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    {r.highRiskAlert}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    {r.lowRiskAlert}
                  </div>
                )}
              </div>

              {/* Crystalloid Fluid Bolus Card */}
              <div className="mt-6 p-4 rounded-xl bg-rose-50/50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase">
                    {r.crystalloidBolusVolume}
                  </div>
                  <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    {r.preferredFluid}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-rose-700 dark:text-rose-300">
                    {crystalloidBolusMl} <span className="text-sm font-medium">mL</span>
                  </div>
                  <div className="text-xs text-rose-600/80 dark:text-rose-400/80">
                    Rate: {crystalloidHourlyRate} mL/h over 3 hours
                  </div>
                </div>
              </div>

              {/* Vasopressor & Cultures Rationale */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">Vasopressor Target</div>
                  <div className="text-gray-500 dark:text-gray-400 mt-1">
                    {r.vasopressorTarget}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">Diagnostic Window</div>
                  <div className="text-gray-500 dark:text-gray-400 mt-1">
                    {r.bloodCulturesWindow}
                  </div>
                </div>
              </div>
            </div>

            {/* Lactate Kinetics Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {r.lactateClearancePercent}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {lactateClearancePct}%
                    </span>
                    <span className="text-xs text-gray-500">over {elapsedHours} hours</span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                    isLactateAdequate
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  {isLactateAdequate
                    ? r.adequateClearanceBadge
                    : r.impairedClearanceBadge}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Parkland Burn Resuscitation */}
      {activeTab === 'PARKLAND' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Burn Assessment Inputs
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {r.patientWeightKg}
              </label>
              <input
                type="number"
                min="10"
                max="250"
                value={burnWeightKg}
                onChange={(e) => setBurnWeightKg(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {r.tbsaPercentage}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={tbsaPercentage}
                onChange={(e) => setTbsaPercentage(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {r.hoursSinceInjury}
              </label>
              <input
                type="number"
                min="0"
                max="24"
                value={hoursSinceInjury}
                onChange={(e) => setHoursSinceInjury(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {r.measuredUop}
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={measuredUop}
                onChange={(e) => setMeasuredUop(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {r.total24HourFluid}
                  </span>
                  <div className="mt-2 text-4xl font-extrabold text-orange-600 dark:text-orange-400">
                    {totalBurnFluid24h} <span className="text-lg font-medium text-gray-500">mL Ringer Lactate</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    4 mL x {validBurnWeight} kg x {validTbsa}% TBSA
                  </div>
                </div>
              </div>

              {/* 2-Phase Baxter Schedule */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="text-xs font-semibold text-orange-900 dark:text-orange-200 uppercase">
                    {r.first8HourRate}
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-2">
                    {first8hRate} <span className="text-sm font-normal">mL/h</span>
                  </div>
                  <div className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                    Volume: {first8hTotal} mL in remaining {remainingFirst8hHours}h
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {r.next16HourRate}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {next16hRate} <span className="text-sm font-normal">mL/h</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Volume: {next16hTotal} mL over 16h
                  </div>
                </div>
              </div>

              {/* UOP Titration Feedback Card */}
              <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    Urine Output Titration Feedback
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      uopAction === 'MAINTAIN'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : uopAction === 'INCREASE'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {uopAction === 'MAINTAIN'
                      ? r.uopActionMaintain
                      : uopAction === 'INCREASE'
                      ? r.uopActionIncrease
                      : r.uopActionDecrease}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                  <span>Target Range: 30 - 50 mL/h</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Adjusted Rate: {adjustedInfusionRate} mL/h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pediatric Broselow PALS */}
      {activeTab === 'PEDIATRIC' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Baby className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Patient Parameters
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Child Age (Years)
              </label>
              <input
                type="number"
                min="0"
                max="14"
                value={pedAgeYears}
                onChange={(e) => setPedAgeYears(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Patient Weight (kg)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                step="0.5"
                value={pedWeightKg}
                onChange={(e) => setPedWeightKg(parseFloat(e.target.value) || 3)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className={`p-4 rounded-xl border text-sm font-bold text-center ${broselowBg}`}>
              {r.broselowColorZone}: {isKhmer ? broselowColorNameKm : broselowColorNameEn}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Airway Equipment Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Airway & Intubation Equipment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="text-xs font-medium text-gray-500">{r.ettUncuffedSize}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {ettUncuffed} <span className="text-xs font-normal">mm</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="text-xs font-medium text-gray-500">{r.ettCuffedSize}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {ettCuffed} <span className="text-xs font-normal">mm</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="text-xs font-medium text-gray-500">{r.ettDepth}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {ettDepth} <span className="text-xs font-normal">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resuscitation Energy & Drug Matrix */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Defibrillation & Emergency Resuscitation Drugs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20">
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Defibrillation Shock Energy
                  </div>
                  <div className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-1">
                    1st: {defibFirstJ} J | 2nd: {defibSubsequentJ} J
                  </div>
                  <div className="text-[11px] text-rose-600/80 mt-1">
                    Synchronized Cardioversion: {cardioJ} J
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    Epinephrine (1:10,000)
                  </div>
                  <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mt-1">
                    {epiDose} mg <span className="text-sm font-normal">({epiVol} mL)</span>
                  </div>
                  <div className="text-[11px] text-indigo-600/80 mt-1">
                    Repeat every 3-5 min during arrest
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="text-xs font-medium text-gray-500">Amiodarone Refractory VF/pVT</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {amiodaroneDose} mg bolus
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="text-xs font-medium text-gray-500">Atropine Bradycardia</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {atropineDose} mg
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Trauma Shock & MTP Protocol */}
      {activeTab === 'MTP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Trauma Triage Parameters
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                min="20"
                max="250"
                value={traumaHr}
                onChange={(e) => setTraumaHr(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Systolic BP (mmHg)
              </label>
              <input
                type="number"
                min="20"
                max="250"
                value={traumaSbp}
                onChange={(e) => setTraumaSbp(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hours Elapsed Since Injury
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={traumaElapsedHours}
                onChange={(e) => setTraumaElapsedHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPenetrating}
                  onChange={(e) => setIsPenetrating(e.target.checked)}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Penetrating Trauma Mechanism
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFastPositive}
                  onChange={(e) => setIsFastPositive(e.target.checked)}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Positive FAST Ultrasound
                </span>
              </label>
            </div>
          </div>

          {/* Decision Outputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {r.shockIndex}
                  </span>
                  <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
                    {shockIndex}{' '}
                    <span className="text-xs font-normal text-gray-400">
                      {shockIndex > 0.9 ? '(Critical)' : shockIndex >= 0.7 ? '(Elevated)' : '(Normal)'}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    isMtpActivated
                      ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {isMtpActivated ? r.mtpActivated : r.mtpStandby}
                </div>
              </div>

              {/* ABC Score Card */}
              <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {r.abcScore}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {abcScore} / 4 points
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600 dark:text-gray-300 max-w-xs">
                  {r.balancedRatio}
                </div>
              </div>

              {/* CRASH-2 TXA Card */}
              <div
                className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${
                  isTxaApproved
                    ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                }`}
              >
                {isTxaApproved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div
                    className={`text-xs font-bold uppercase ${
                      isTxaApproved ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {isTxaApproved ? r.txaApproved : r.txaBlocked}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {isTxaApproved
                      ? 'Administer 1 g IV bolus over 10 min immediately, followed by 1 g maintenance infusion over 8 hours.'
                      : 'Injury elapsed time exceeds 3 hours. Routine administration beyond 3 hours increases thrombotic mortality.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
