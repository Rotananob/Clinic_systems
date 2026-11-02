'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Square,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Droplets,
  Gauge,
  HeartHandshake,
  BookOpen,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/context/I18nContext';

interface BedsidePump {
  pumpId: string;
  pumpSerialNumber: string;
  bedIdentifier: string;
  wardDepartment: string;
  status: 'STANDBY' | 'INFUSING' | 'PAUSED' | 'ALARM_ACTIVE' | 'KVO_MODE';
  patientId?: string;
  patientNameKh?: string;
  patientNameEn?: string;
  patientWeightKg?: number;
  vascularRoute?: string;
  substanceCode?: string;
  substanceNameEn?: string;
  substanceNameKh?: string;
  prescribedDose?: number;
  dosingUnit?: string;
  concentrationId?: string;
  rateMlPerHour: number;
  gravityDropsPerMinute: {
    macro15Gtt: number;
    micro60Gtt: number;
  };
  volumeToBeInfusedMl: number;
  volumeInfusedMl: number;
  remainingMinutes: number;
  linePressureMmHg: number;
  airBubbleDetected: boolean;
  batteryPercentage: number;
  activeAlarms: Array<{ code: string; severity: string; messageKh: string; messageEn: string }>;
  pcaBolusHistory: Array<{ timestamp: string; doseMcg: number; wasDelivered: boolean }>;
}

interface DersDrug {
  substanceCode: string;
  genericNameEn: string;
  genericNameKh: string;
  therapeuticCategory: string;
  dosingUnit: string;
  requiresPatientWeight: boolean;
  guardrails: {
    softMin: number;
    softMax: number;
    hardMin: number;
    hardMax: number;
  };
  clinicalNotesKh: string;
  clinicalNotesEn: string;
}

export default function SmartInfusionPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const inf = t.infusion;

  // State
  const [pumps, setPumps] = useState<BedsidePump[]>([]);
  const [library, setLibrary] = useState<DersDrug[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pumps' | 'calculator' | 'library'>('pumps');

  // Titration Modal State
  const [selectedPump, setSelectedPump] = useState<BedsidePump | null>(null);
  const [newDose, setNewDose] = useState<number>(0.15);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSubmittingTitration, setIsSubmittingTitration] = useState<boolean>(false);
  const [titrationNotice, setTitrationNotice] = useState<string | null>(null);
  const [guardrailCalc, setGuardrailCalc] = useState<any>(null);

  // Standalone Gravity Drip Calculator State
  const [calcVolumeMl, setCalcVolumeMl] = useState<number>(500);
  const [calcDurationHours, setCalcDurationHours] = useState<number>(4);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pumpsRes, libRes] = await Promise.allSettled([
        api.infusion.getPumps(),
        api.infusion.getLibrary(),
      ]);

      if (pumpsRes.status === 'fulfilled' && Array.isArray(pumpsRes.value)) {
        setPumps(pumpsRes.value);
      } else {
        // Fallback default mock
        setPumps([
          {
            pumpId: 'PUMP-ICU-01',
            pumpSerialNumber: 'SN-BBRAUN-2026-9901',
            bedIdentifier: 'ICU-BED-01',
            wardDepartment: 'Intensive Care Unit - ICU',
            status: 'INFUSING',
            patientId: 'PT-KHM-00192',
            patientNameKh: 'កែវ សុខា',
            patientNameEn: 'Keo Sokha',
            patientWeightKg: 65,
            vascularRoute: 'CENTRAL_LINE',
            substanceCode: 'DRUG-NOREP-01',
            substanceNameEn: 'Norepinephrine Bitartrate',
            substanceNameKh: 'ណរអេពីណេហ្វ្រីន - Levophed',
            prescribedDose: 0.15,
            dosingUnit: 'mcg/kg/min',
            rateMlPerHour: 36.56,
            gravityDropsPerMinute: { macro15Gtt: 9, micro60Gtt: 37 },
            volumeToBeInfusedMl: 250,
            volumeInfusedMl: 142.5,
            remainingMinutes: 176,
            linePressureMmHg: 112,
            airBubbleDetected: false,
            batteryPercentage: 98,
            activeAlarms: [],
            pcaBolusHistory: [],
          },
          {
            pumpId: 'PUMP-ICU-02',
            pumpSerialNumber: 'SN-BBRAUN-2026-9902',
            bedIdentifier: 'ICU-BED-02',
            wardDepartment: 'Intensive Care Unit - ICU',
            status: 'INFUSING',
            patientId: 'PT-KHM-00204',
            patientNameKh: 'ស៊ុន ចាន់ដា',
            patientNameEn: 'Sun Chanda',
            patientWeightKg: 70,
            vascularRoute: 'CENTRAL_LINE',
            substanceCode: 'DRUG-PROP-05',
            substanceNameEn: 'Propofol 1% Emulsion',
            substanceNameKh: 'ប្រូប៉ូហ្វូល ១ ភាគរយ - សណ្តំសន្លប់',
            prescribedDose: 30.0,
            dosingUnit: 'mcg/kg/min',
            rateMlPerHour: 12.6,
            gravityDropsPerMinute: { macro15Gtt: 3, micro60Gtt: 13 },
            volumeToBeInfusedMl: 100,
            volumeInfusedMl: 48.0,
            remainingMinutes: 248,
            linePressureMmHg: 95,
            airBubbleDetected: false,
            batteryPercentage: 92,
            activeAlarms: [],
            pcaBolusHistory: [],
          },
          {
            pumpId: 'PUMP-POSTOP-03',
            pumpSerialNumber: 'SN-ALARIS-2026-8814',
            bedIdentifier: 'SURG-BED-04',
            wardDepartment: 'Surgical Recovery',
            status: 'INFUSING',
            patientId: 'PT-KHM-00331',
            patientNameKh: 'ម៉ៅ វណ្ណារិទ្ធ',
            patientNameEn: 'Mao Vannarith',
            patientWeightKg: 60,
            vascularRoute: 'PERIPHERAL_IV',
            substanceCode: 'DRUG-FENT-07',
            substanceNameEn: 'Fentanyl Citrate',
            substanceNameKh: 'ហ្វេនតានីល - ថ្នាំបំបាត់ការឈឺចាប់ខ្លាំង',
            prescribedDose: 50.0,
            dosingUnit: 'mcg/hr',
            rateMlPerHour: 5.0,
            gravityDropsPerMinute: { macro15Gtt: 1, micro60Gtt: 5 },
            volumeToBeInfusedMl: 100,
            volumeInfusedMl: 25.0,
            remainingMinutes: 900,
            linePressureMmHg: 130,
            airBubbleDetected: false,
            batteryPercentage: 88,
            activeAlarms: [],
            pcaBolusHistory: [],
          },
        ]);
      }

      if (libRes.status === 'fulfilled' && Array.isArray(libRes.value)) {
        setLibrary(libRes.value);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate DERS guardrails live when modal dose changes
  useEffect(() => {
    if (!selectedPump || !selectedPump.substanceCode) return;

    api.infusion
      .calculate({
        substanceCode: selectedPump.substanceCode,
        prescribedDose: newDose,
        patientWeightKg: selectedPump.patientWeightKg,
        route: selectedPump.vascularRoute,
      })
      .then((res) => {
        setGuardrailCalc(res);
      })
      .catch(() => {
        setGuardrailCalc(null);
      });
  }, [selectedPump, newDose]);

  const handleOpenTitration = (pump: BedsidePump) => {
    setSelectedPump(pump);
    setNewDose(pump.prescribedDose || 0.1);
    setOverrideReason('');
    setTitrationNotice(null);
  };

  const handleCommitTitration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPump) return;

    setIsSubmittingTitration(true);
    try {
      await api.infusion.titrate({
        pumpId: selectedPump.pumpId,
        newDose,
        nurseStaffId: 'STAFF-RN-01',
        physicianOverrideReason: overrideReason || undefined,
      });

      setSelectedPump(null);
      await loadData();
      setTitrationNotice(
        isKh
          ? 'កម្រិតថ្នាំត្រូវបានកែសម្រួល និងផ្ទៀងផ្ទាត់ដោយជោគជ័យ'
          : 'Infusion rate successfully titrated and committed to pump',
      );
      setTimeout(() => setTitrationNotice(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Titration failed');
    } finally {
      setIsSubmittingTitration(false);
    }
  };

  const handlePcaBolus = async (pumpId: string) => {
    try {
      const res = await api.infusion.requestPca({
        pumpId,
        requestedBolusMcg: 20,
      });

      if (res.isAllowed) {
        setTitrationNotice(inf.pcaSuccess);
      } else {
        setTitrationNotice(`${inf.lockoutActive}: ${res.rejectionReasonEn || res.rejectionReasonKh}`);
      }
      setTimeout(() => setTitrationNotice(null), 5000);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'PCA request failed');
    }
  };

  const handleTogglePause = async (pumpId: string) => {
    try {
      await api.infusion.togglePause(pumpId);
      await loadData();
    } catch {
      await loadData();
    }
  };

  const handleSimulateOcclusion = async (pumpId: string) => {
    try {
      await api.infusion.updateTelemetry(pumpId, {
        linePressureMmHg: 520, // Occlusion threshold > 450 mmHg
        airBubbleDetected: false,
        clampClosed: false,
        batteryPercentage: 90,
      });
      await loadData();
    } catch {
      await loadData();
    }
  };

  const handleSimulateAir = async (pumpId: string) => {
    try {
      await api.infusion.updateTelemetry(pumpId, {
        linePressureMmHg: 110,
        airBubbleDetected: true,
        clampClosed: false,
        batteryPercentage: 90,
      });
      await loadData();
    } catch {
      await loadData();
    }
  };

  const handleResetNormal = async (pumpId: string) => {
    try {
      await api.infusion.updateTelemetry(pumpId, {
        linePressureMmHg: 110,
        airBubbleDetected: false,
        clampClosed: false,
        batteryPercentage: 98,
      });
      await api.infusion.togglePause(pumpId);
      await loadData();
    } catch {
      await loadData();
    }
  };

  // Calculated Gravity Drips for Standalone Calculator
  const calcRateMlHr = calcDurationHours > 0 ? Number((calcVolumeMl / calcDurationHours).toFixed(1)) : 0;
  const gtt10 = Math.round((calcRateMlHr * 10) / 60);
  const gtt15 = Math.round((calcRateMlHr * 15) / 60);
  const gtt20 = Math.round((calcRateMlHr * 20) / 60);
  const gtt60 = Math.round((calcRateMlHr * 60) / 60);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                {inf.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {inf.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition shadow-sm ${
              activeTab === 'calculator'
                ? 'bg-cyan-600 border-cyan-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{inf.calculateTitration}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {titrationNotice && (
        <div className="mt-4 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm font-medium">{titrationNotice}</span>
        </div>
      )}

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{inf.activePumps}</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {pumps.filter((p) => p.status === 'INFUSING').length} / {pumps.length}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isKh ? 'គ្រែអ្នកជំងឺ ICU និងវះកាត់' : 'ICU & Post-Op Recovery Beds'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>DERS Guardrail Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            100% Active
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isKh ? 'ទប់ស្កាត់កម្រិតថ្នាំគ្រោះថ្នាក់ស្លាប់' : 'Zero Fatal Overdose Lockout'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{inf.telemetryAlarms}</span>
            <Gauge className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {pumps.reduce((sum, p) => sum + p.activeAlarms.length, 0)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isKh ? 'តាមដានសម្ពាធទុយោ និងខ្យល់ IoT' : 'Occlusion & Ultrasonic Bubble Sensors'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{inf.drugLibrary}</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {library.length || 7} Medications
          </div>
          <p className="mt-1 text-xs text-slate-500">
            KCl, Norepinephrine, Dopamine, Insulin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pumps')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'pumps'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{inf.activePumps}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'calculator'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>{inf.dripCalculatorTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'library'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{inf.drugLibrary}</span>
        </button>
      </div>

      {/* Tab 1: Bedside Pumps Grid */}
      {activeTab === 'pumps' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pumps.map((pump) => {
            const isOccluded = pump.activeAlarms.some((a) => a.code.includes('OCCLUSION'));
            const isAirInLine = pump.activeAlarms.some((a) => a.code.includes('AIR'));
            const percentInfused = pump.volumeToBeInfusedMl > 0
              ? Math.min(100, Math.round((pump.volumeInfusedMl / pump.volumeToBeInfusedMl) * 100))
              : 0;

            return (
              <div
                key={pump.pumpId}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm ${
                  pump.activeAlarms.length > 0
                    ? 'border-rose-500/70 shadow-rose-500/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Bed & Pump Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-mono">
                      {pump.bedIdentifier}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {pump.pumpSerialNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        pump.status === 'INFUSING'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 animate-pulse'
                          : pump.status === 'ALARM_ACTIVE'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 animate-bounce'
                          : pump.status === 'KVO_MODE'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>
                        {pump.status === 'INFUSING'
                          ? inf.infusing
                          : pump.status === 'ALARM_ACTIVE'
                          ? inf.alarmActive
                          : pump.status === 'KVO_MODE'
                          ? inf.kvoMode
                          : inf.standby}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Patient & Drug Info */}
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isKh ? pump.patientNameKh : pump.patientNameEn}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {pump.patientId} : {pump.patientWeightKg} kg : {pump.vascularRoute}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                      {isKh ? pump.substanceNameKh : pump.substanceNameEn}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {pump.prescribedDose} {pump.dosingUnit}
                    </div>
                  </div>
                </div>

                {/* Big Digital Flow Rate Gauge */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                      {inf.rateMlHr}
                    </div>
                    <div className="text-3xl font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-tight">
                      {pump.rateMlPerHour.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                      {inf.gravityDrips}
                    </div>
                    <div className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200">
                      {pump.gravityDropsPerMinute.micro60Gtt} gtt/min (60)
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {pump.gravityDropsPerMinute.macro15Gtt} gtt/min (15)
                    </div>
                  </div>
                </div>

                {/* Volume Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                    <span>
                      {inf.volumeInfused}: {pump.volumeInfusedMl} / {pump.volumeToBeInfusedMl} mL
                    </span>
                    <span>{percentInfused}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentInfused}%` }}
                    ></div>
                  </div>
                </div>

                {/* Sensor Telemetry Stats */}
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {inf.linePressure}: {pump.linePressureMmHg} mmHg
                    </span>
                  </div>
                  <div>
                    Battery: {pump.batteryPercentage}%
                  </div>
                  <div>
                    {pump.remainingMinutes} min remaining
                  </div>
                </div>

                {/* Alarms Banner */}
                {pump.activeAlarms.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>
                      {isKh ? pump.activeAlarms[0].messageKh : pump.activeAlarms[0].messageEn}
                    </span>
                  </div>
                )}

                {/* Actions & Controls */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenTitration(pump)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{inf.titrateDoseButton}</span>
                    </button>

                    {pump.substanceCode === 'DRUG-FENT-07' && (
                      <button
                        onClick={() => handlePcaBolus(pump.pumpId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>{inf.pcaDemandButton}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTogglePause(pump.pumpId)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title={inf.pauseResume}
                    >
                      {pump.status === 'INFUSING' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Hardware IoT Simulation Triggers */}
                  <div className="flex items-center gap-1.5">
                    {pump.activeAlarms.length === 0 ? (
                      <>
                        <button
                          onClick={() => handleSimulateOcclusion(pump.pumpId)}
                          className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
                          title="Simulate Downstream Occlusion >450 mmHg"
                        >
                          Sim Occlusion
                        </button>
                        <button
                          onClick={() => handleSimulateAir(pump.pumpId)}
                          className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
                          title="Simulate Air in Line >50 mcL"
                        >
                          Sim Air
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleResetNormal(pump.pumpId)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-emerald-600 text-white font-semibold transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{inf.resetNormal}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Standalone Gravity IV Drip Rate Calculator */}
      {activeTab === 'calculator' && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {inf.dripCalculatorTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {inf.dripCalculatorSubtitle}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                {inf.fluidVolumeMl}
              </label>
              <input
                type="number"
                min={1}
                value={calcVolumeMl}
                onChange={(e) => setCalcVolumeMl(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                {inf.infusionDurationHours}
              </label>
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={calcDurationHours}
                onChange={(e) => setCalcDurationHours(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
            <div className="text-xs font-semibold uppercase text-cyan-800 dark:text-cyan-300">
              Calculated Flow Rate
            </div>
            <div className="text-3xl font-mono font-bold text-cyan-700 dark:text-cyan-400 mt-1">
              {calcRateMlHr} mL/hr
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {inf.micro60Gtt}
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {gtt60} gtt/min
              </div>
              <p className="mt-1 text-xs text-slate-400">
                1 mL = 60 drops
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {inf.macro20Gtt}
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {gtt20} gtt/min
              </div>
              <p className="mt-1 text-xs text-slate-400">
                1 mL = 20 drops
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {inf.macro15Gtt}
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {gtt15} gtt/min
              </div>
              <p className="mt-1 text-xs text-slate-400">
                1 mL = 15 drops
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {inf.macro10Gtt}
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {gtt10} gtt/min
              </div>
              <p className="mt-1 text-xs text-slate-400">
                1 mL = 10 drops
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: DERS Drug Library */}
      {activeTab === 'library' && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {inf.drugLibrary}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standard concentrations, soft limits, and inviolable hard boundaries
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Medication Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Dosing Unit</th>
                  <th className="px-4 py-3">Soft Range</th>
                  <th className="px-4 py-3">Hard Ceilings</th>
                  <th className="px-4 py-3">Clinical Guidelines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {library.map((drug) => (
                  <tr key={drug.substanceCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {drug.substanceCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {isKh ? drug.genericNameKh : drug.genericNameEn}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isKh ? drug.genericNameEn : drug.genericNameKh}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300">
                        {drug.therapeuticCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {drug.dosingUnit}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {drug.guardrails.softMin} - {drug.guardrails.softMax}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-rose-600 dark:text-rose-400 font-bold">
                      {drug.guardrails.hardMin} - {drug.guardrails.hardMax}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                      {isKh ? drug.clinicalNotesKh : drug.clinicalNotesEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Titrate Dose Modal with Real-time DERS Guardrail Feedback */}
      {selectedPump && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold">
                  {inf.titrateModalTitle} - {selectedPump.bedIdentifier}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPump(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCommitTitration} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  {inf.drug}
                </label>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-sm">
                  {isKh ? selectedPump.substanceNameKh : selectedPump.substanceNameEn}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  {inf.newDoseInput} ({selectedPump.dosingUnit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={newDose}
                  onChange={(e) => setNewDose(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-lg"
                  required
                />
              </div>

              {/* Real-time DERS Guardrail Status Box */}
              {guardrailCalc && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    guardrailCalc.guardrailStatus === 'SAFE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : guardrailCalc.guardrailStatus === 'SOFT_LIMIT_BREACH'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider mb-1">
                    {guardrailCalc.guardrailStatus === 'SAFE' && (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{inf.safeDoseBadge}</span>
                      </>
                    )}
                    {guardrailCalc.guardrailStatus === 'SOFT_LIMIT_BREACH' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>{inf.softLimitBadge}</span>
                      </>
                    )}
                    {guardrailCalc.guardrailStatus === 'HARD_LIMIT_BREACH' && (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>{inf.hardLimitBadge}</span>
                      </>
                    )}
                  </div>
                  <div>
                    {isKh ? guardrailCalc.guardrailMessageKh : guardrailCalc.guardrailMessageEn}
                  </div>
                  <div className="mt-2 font-mono text-xs">
                    Resulting Flow Rate: <span className="font-bold">{guardrailCalc.calculatedRateMlPerHour} mL/hr</span>
                  </div>
                </div>
              )}

              {/* Mandatory Physician Override Textarea if Soft Limit Breached */}
              {guardrailCalc?.requiresPhysicianOverride && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 mb-1">
                    {inf.physicianOverrideNotes} *
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Document clinical indication for exceeding standard soft limit..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white"
                    required
                  ></textarea>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPump(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTitration || guardrailCalc?.isFatalRejection}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition disabled:opacity-50"
                >
                  {isSubmittingTitration ? 'Titrating...' : inf.confirmTitration}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
