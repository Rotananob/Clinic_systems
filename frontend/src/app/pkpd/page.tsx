'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Scale,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  FlaskConical,
  Zap,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Biometrics {
  bmi: number;
  isObese: boolean;
  idealBodyWeightKg: number;
  adjustedBodyWeightKg: number;
  dosingWeightKg: number;
  creatinineClearanceMlMin: number;
  renalStage: string;
}

interface PkParameters {
  eliminationRateConstantKe: number;
  halfLifeHours: number;
  volumeOfDistributionLitres: number;
  clearanceLitresPerHour: number;
  isBayesianDerived: boolean;
}

interface DosingOption {
  doseMg: number;
  infusionHours: number;
  intervalHours: number;
  dailyDoseMg: number;
  predictedPeakCmax: number;
  predictedTroughCmin: number;
  predictedAuc24: number;
  aucMicRatio?: number;
  status: 'THERAPEUTIC' | 'SUPRATHERAPEUTIC_WARNING' | 'TOXIC_LOCKOUT' | 'SUBTHERAPEUTIC';
  clinicalRecommendationKh: string;
  clinicalRecommendationEn: string;
}

interface TdmDrug {
  code: string;
  nameEn: string;
  nameKh: string;
  therapeuticCategory: string;
  defaultInfusionHours: number;
  targetMetrics: {
    targetAuc24Min?: number;
    targetAuc24Max?: number;
    targetTroughMin: number;
    targetTroughMax: number;
    toxicityTroughThreshold: number;
    toxicityAlertEn: string;
    toxicityAlertKh: string;
  };
}

export default function PkPdPrecisionDosingPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  // Selected drug code
  const [selectedDrug, setSelectedDrug] = useState<string>('VANCOMYCIN');

  // Patient inputs
  const [patientId, setPatientId] = useState<string>('P-10024');
  const [patientName, setPatientName] = useState<string>('Sokha Chea');
  const [ageYears, setAgeYears] = useState<number>(62);
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [actualWeightKg, setActualWeightKg] = useState<number>(78);
  const [heightCm, setHeightCm] = useState<number>(172);
  const [serumCreatinineMgDl, setSerumCreatinineMgDl] = useState<number>(1.4);

  // Bayesian measured level input
  const [measuredTrough, setMeasuredTrough] = useState<number>(13.8);
  const [measuredDrawHours, setMeasuredDrawHours] = useState<number>(11.5);

  // States from API
  const [drugs, setDrugs] = useState<TdmDrug[]>([]);
  const [biometrics, setBiometrics] = useState<Biometrics | null>(null);
  const [activePk, setActivePk] = useState<PkParameters | null>(null);
  const [recommendedRegimen, setRecommendedRegimen] = useState<DosingOption | null>(null);
  const [alternatives, setAlternatives] = useState<DosingOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load drugs
  useEffect(() => {
    async function loadInitial() {
      try {
        const drugList = await api.pkpd.getDrugs();
        setDrugs(drugList);
        calculateDosing('VANCOMYCIN');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load TDM drug library');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  const calculateDosing = async (drugCode: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const patient = {
        patientId,
        patientName,
        ageYears,
        gender,
        actualWeightKg,
        heightCm,
        serumCreatinineMgDl
      };

      const result = await api.pkpd.optimizeDosing({ drugCode, patient });
      setBiometrics(result.biometrics);
      setActivePk(result.baselinePk);
      setRecommendedRegimen(result.recommendedRegimen);
      setAlternatives(result.alternativeRegimens);
    } catch (err: any) {
      setErrorMsg(err.message || 'Calculation error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrugChange = (code: string) => {
    setSelectedDrug(code);
    calculateDosing(code);
  };

  const handleRunBayesianFit = async () => {
    if (!recommendedRegimen) return;
    setIsLoading(true);
    try {
      const patient = {
        patientId,
        patientName,
        ageYears,
        gender,
        actualWeightKg,
        heightCm,
        serumCreatinineMgDl
      };

      const result = await api.pkpd.runBayesianFit({
        drugCode: selectedDrug,
        patient,
        currentDoseMg: recommendedRegimen.doseMg,
        intervalHours: recommendedRegimen.intervalHours,
        measuredLevels: [
          {
            sampleId: 'SMPL-LIVE',
            drawTimestamp: new Date().toISOString(),
            hoursPostDose: measuredDrawHours,
            measuredConcentration: measuredTrough,
            assayCvPercent: 6.0
          }
        ]
      });

      setBiometrics(result.biometrics);
      setActivePk(result.bayesianPk);
      setRecommendedRegimen(result.recommendedRegimen);
      setAlternatives(result.alternativeRegimens);
      setSuccessMsg(t.pkpd.bayesianAdjustmentSuccess);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bayesian fitting error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentDrug = useMemo(() => {
    return drugs.find((d) => d.code === selectedDrug) || drugs[0];
  }, [drugs, selectedDrug]);

  // SVG Curve generation for 24h steady-state profile
  const renderSteadyStateCurve = (regimen: DosingOption, pk: PkParameters) => {
    if (!regimen || !pk) return '';
    const width = 600;
    const height = 180;
    const paddingBottom = 25;
    const paddingTop = 15;
    const usableHeight = height - paddingBottom - paddingTop;

    const maxConcY = Math.max(50, regimen.predictedPeakCmax * 1.3);
    const tau = regimen.intervalHours;
    const tInf = regimen.infusionHours;
    const ke = pk.eliminationRateConstantKe;

    const points: string[] = [];
    const totalHours = Math.max(24, tau * 2);
    const steps = 120;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalHours;
      const tMod = t % tau;
      let c = 0;

      if (tMod <= tInf) {
        c = regimen.predictedTroughCmin + (regimen.predictedPeakCmax - regimen.predictedTroughCmin) * (tMod / tInf);
      } else {
        c = regimen.predictedPeakCmax * Math.exp(-ke * (tMod - tInf));
      }

      const x = ((t / totalHours) * width).toFixed(1);
      const y = (height - paddingBottom - (c / maxConcY) * usableHeight).toFixed(1);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }

    return points.join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-950/80 border border-blue-500/40 rounded-xl text-blue-400">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {t.pkpd.title}
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Precision PK/PD Bayesian TDM
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{t.pkpd.subtitle}</p>
          </div>
        </div>

        {/* Drug Selection Pills */}
        <div className="flex items-center gap-2">
          {['VANCOMYCIN', 'GENTAMICIN', 'AMIKACIN', 'DIGOXIN'].map((code) => (
            <button
              key={code}
              onClick={() => handleDrugChange(code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedDrug === code
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/90 border border-rose-500/60 rounded-xl text-rose-200 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Controls (Biometrics & Patient) / Right Calculation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Anthropometrics Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              {t.pkpd.patientAnthropometrics}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.pkpd.ageYears}</label>
                <input
                  type="number"
                  value={ageYears}
                  onChange={(e) => setAgeYears(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.pkpd.gender}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.pkpd.actualWeight}</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.pkpd.heightCm}</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">{t.pkpd.serumCreatinine}</label>
                <input
                  type="number"
                  step="0.1"
                  value={serumCreatinineMgDl}
                  onChange={(e) => setSerumCreatinineMgDl(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => calculateDosing(selectedDrug)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t.pkpd.calculateBiometrics}
            </button>
          </div>

          {/* Derived Biometrics Card */}
          {biometrics && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Renal Clearance & Body Metrics
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block">{t.pkpd.crCl}</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {biometrics.creatinineClearanceMlMin} mL/min
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block">{t.pkpd.renalStage}</span>
                  <span className="text-xs font-bold text-amber-300">
                    {biometrics.renalStage.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block">{t.pkpd.bmi}</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {biometrics.bmi} kg/m2
                  </span>
                  {biometrics.isObese && (
                    <span className="text-[10px] text-amber-400 block font-semibold">Obese (ABW Used)</span>
                  )}
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block">{t.pkpd.dosingWeight}</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    {biometrics.dosingWeightKg} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bayesian TDM Feedback Input Box */}
          <div className="bg-slate-900/80 border border-blue-900/40 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {t.pkpd.bayesianFeedbackTitle}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {t.pkpd.sampleTimeHours}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={measuredDrawHours}
                  onChange={(e) => setMeasuredDrawHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {t.pkpd.measuredSerumLevel}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={measuredTrough}
                  onChange={(e) => setMeasuredTrough(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={handleRunBayesianFit}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              {t.pkpd.runBayesianFit}
            </button>
          </div>
        </div>

        {/* Right Column: Recommended Regimen & Kinetic Steady-State Curve */}
        <div className="lg:col-span-7 space-y-5">
          {recommendedRegimen && activePk && (
            <>
              {/* Primary Recommended Regimen Card */}
              <div
                className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
                  recommendedRegimen.status === 'THERAPEUTIC'
                    ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : recommendedRegimen.status === 'TOXIC_LOCKOUT'
                    ? 'bg-rose-950/60 border-rose-600'
                    : 'bg-amber-950/50 border-amber-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
                      {t.pkpd.recommendedRegimen}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {recommendedRegimen.doseMg} mg &nbsp;q{recommendedRegimen.intervalHours}h
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Daily Total: {recommendedRegimen.dailyDoseMg} mg &nbsp;|&nbsp; Infusion Duration: {recommendedRegimen.infusionHours}h
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      recommendedRegimen.status === 'THERAPEUTIC'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : recommendedRegimen.status === 'TOXIC_LOCKOUT'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {recommendedRegimen.status}
                  </span>
                </div>

                {/* 3 Core Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">{t.pkpd.predictedPeak}</span>
                    <span className="text-xl font-bold text-white font-mono">
                      {recommendedRegimen.predictedPeakCmax} mg/L
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">{t.pkpd.predictedTrough}</span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        recommendedRegimen.predictedTroughCmin > 20
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {recommendedRegimen.predictedTroughCmin} mg/L
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">{t.pkpd.predictedAuc24}</span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        recommendedRegimen.predictedAuc24 >= 400 && recommendedRegimen.predictedAuc24 <= 600
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {recommendedRegimen.predictedAuc24}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic">
                  {locale === 'km'
                    ? recommendedRegimen.clinicalRecommendationKh
                    : recommendedRegimen.clinicalRecommendationEn}
                </p>
              </div>

              {/* Steady-State Concentration Curve SVG Visualizer */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {t.pkpd.pkSimulationTitle}
                  </span>
                  <span className="font-mono text-slate-400">
                    t1/2: <strong className="text-emerald-400">{activePk.halfLifeHours}h</strong> &nbsp;|&nbsp;
                    Vd: <strong className="text-blue-400">{activePk.volumeOfDistributionLitres}L</strong> &nbsp;|&nbsp;
                    CL: <strong className="text-slate-200">{activePk.clearanceLitresPerHour} L/hr</strong>
                    {activePk.isBayesianDerived && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        BAYESIAN FITTED
                      </span>
                    )}
                  </span>
                </div>

                {/* SVG Curve Canvas */}
                <div className="h-48 w-full bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-center p-2">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 180">
                    {/* Grid lines */}
                    <line x1="0" y1="45" x2="600" y2="45" stroke="#334155" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#334155" strokeDasharray="3 3" />
                    <line x1="0" y1="135" x2="600" y2="135" stroke="#334155" strokeDasharray="3 3" />

                    {/* Target therapeutic zone (10 - 15 mg/L) */}
                    <rect x="0" y="100" width="600" height="35" fill="#10b981" fillOpacity="0.12" />

                    {/* Toxic Line threshold */}
                    <line x1="0" y1="70" x2="600" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />

                    {/* Main Concentration Waveform Path */}
                    <path
                      d={renderSteadyStateCurve(recommendedRegimen, activePk)}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>0h (Dose Start)</span>
                  <span>12h</span>
                  <span>24h (Steady State)</span>
                  <span>36h</span>
                  <span>48h</span>
                </div>
              </div>

              {/* Ranked Alternative Regimens Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.pkpd.alternativeRegimens} ({alternatives.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {alt.doseMg} mg &nbsp;q{alt.intervalHours}h
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            alt.status === 'THERAPEUTIC'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {alt.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Peak: {alt.predictedPeakCmax} mg/L</span>
                        <span>Trough: {alt.predictedTroughCmin} mg/L</span>
                        <span>AUC: {alt.predictedAuc24}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
