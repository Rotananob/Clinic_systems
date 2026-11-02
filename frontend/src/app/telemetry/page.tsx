'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Volume2,
  VolumeX,
  ShieldAlert,
  Play,
  RotateCcw,
  Zap,
  CheckCircle,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  Thermometer,
  Wind
} from 'lucide-react';

interface TelemetryPoint {
  timeMs: number;
  ecgMv: number;
  ppgValue: number;
  respCo2MmHg: number;
}

interface BedTelemetryAlarm {
  id: string;
  bedId: string;
  severity: 'CRITICAL_RED' | 'WARNING_YELLOW' | 'ADVISORY_CYAN' | 'NORMAL_GREEN';
  arrhythmiaType?: string;
  parameterName: string;
  currentValue: number | string;
  thresholdValue: number | string;
  messageEn: string;
  messageKh: string;
  triggeredAt: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  isSilenced: boolean;
  silencedBy?: string;
  silenceExpiresAt?: string;
}

interface BedsideDevice {
  bedId: string;
  bedName: string;
  ward: 'ICU' | 'NICU' | 'CCU' | 'OR' | 'POSTOP';
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE';
  diagnosisKh: string;
  diagnosisEn: string;
  isNeonatal: boolean;
  vitals: {
    heartRate: number;
    spo2: number;
    perfusionIndex: number;
    systolicBp: number;
    diastolicBp: number;
    calculatedMap: number;
    respirationRate: number;
    etco2: number;
    temperatureCore: number;
    temperaturePeripheral: number;
    deltaTemperature: number;
    stDeviationMm: number;
    prIntervalMs: number;
    qrsDurationMs: number;
    qtIntervalMs: number;
    calculatedQtcMs: number;
    ratePressureProduct: number;
  };
  activeAlarms: BedTelemetryAlarm[];
  leadStatuses: {
    ecgLead: string;
    spo2Probe: string;
    nibpCuff: string;
    respSensor: string;
  };
  arrhythmiaState: string;
  lastTelemetryTimestamp: string;
  isAudioMuted: boolean;
  audioMutedRemainingSeconds: number;
}

export default function TelemetryPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const [beds, setBeds] = useState<BedsideDevice[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>('BED-ICU-01');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Waveform buffer for selected bed
  const [waveforms, setWaveforms] = useState<TelemetryPoint[]>([]);

  // Silence Modal state
  const [isSilenceModalOpen, setIsSilenceModalOpen] = useState<boolean>(false);
  const [silenceTargetBedId, setSilenceTargetBedId] = useState<string>('');
  const [silenceStaffId, setSilenceStaffId] = useState<string>(user?.fullNameEn || user?.email || 'DR-ICU-LEAD');
  const [silenceDuration, setSilenceDuration] = useState<number>(120);

  // Fetch beds
  const fetchBeds = async () => {
    try {
      const data = await api.telemetry.getAllBeds();
      setBeds(data);
      if (data.length > 0 && !selectedBedId) {
        setSelectedBedId(data[0].bedId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load telemetry beds');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch waveforms for selected bed
  const fetchWaveforms = async (bedId: string) => {
    try {
      const res = await api.telemetry.getWaveforms(bedId, 60, 60);
      if (res && res.points) {
        setWaveforms(res.points);
      }
    } catch {
      // Ignore background waveform fetch error in fallback mode
    }
  };

  useEffect(() => {
    fetchBeds();
    const interval = setInterval(fetchBeds, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBedId) {
      fetchWaveforms(selectedBedId);
      const waveInterval = setInterval(() => fetchWaveforms(selectedBedId), 1500);
      return () => clearInterval(waveInterval);
    }
  }, [selectedBedId]);

  const selectedBed = useMemo(() => {
    return beds.find((b) => b.bedId === selectedBedId) || beds[0];
  }, [beds, selectedBedId]);

  const filteredBeds = useMemo(() => {
    if (selectedWard === 'ALL') return beds;
    return beds.filter((b) => b.ward === selectedWard);
  }, [beds, selectedWard]);

  // Handle Silence Action
  const handleOpenSilenceModal = (bedId: string) => {
    setSilenceTargetBedId(bedId);
    setSilenceDuration(120);
    setIsSilenceModalOpen(true);
  };

  const handleCommitSilence = async () => {
    if (!silenceTargetBedId || !silenceStaffId) return;
    try {
      await api.telemetry.silenceAlarm(silenceTargetBedId, {
        clinicianId: silenceStaffId,
        durationSeconds: silenceDuration
      });
      setSuccessMsg(`Audio alarm muted for ${silenceDuration}s per IEC 60601-1-8`);
      setIsSilenceModalOpen(false);
      fetchBeds();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to silence alarm');
    }
  };

  // Handle Acknowledge Alarm
  const handleAcknowledgeAlarm = async (bedId: string, alarmId: string) => {
    try {
      await api.telemetry.acknowledgeAlarm(bedId, alarmId, {
        clinicianId: user?.fullNameEn || user?.email || 'CLINICIAN-01'
      });
      setSuccessMsg('Alarm acknowledged by clinician');
      fetchBeds();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to acknowledge alarm');
    }
  };

  // Handle Simulate Arrhythmia Drill
  const handleSimulateArrhythmia = async (arrhythmiaType: string) => {
    if (!selectedBedId) return;
    try {
      await api.telemetry.simulateArrhythmia(selectedBedId, {
        arrhythmiaType,
        clinicianId: user?.fullNameEn || user?.email || 'TECH-LEAD-SIM'
      });
      setSuccessMsg(`Simulated rhythm: ${arrhythmiaType}`);
      fetchBeds();
      fetchWaveforms(selectedBedId);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation error');
    }
  };

  // Render SVG Path for Waveform points
  const renderEcgSvgPath = (points: TelemetryPoint[], width: number, height: number) => {
    if (!points || points.length === 0) return '';
    const stepX = width / (points.length - 1 || 1);
    const midY = height / 2;
    // Map mV (-1.0 to +2.0) to SVG height
    const scaleY = height / 3.0;

    return points
      .map((pt, idx) => {
        const x = (idx * stepX).toFixed(1);
        const y = (midY - pt.ecgMv * scaleY).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const renderPpgSvgPath = (points: TelemetryPoint[], width: number, height: number) => {
    if (!points || points.length === 0) return '';
    const stepX = width / (points.length - 1 || 1);
    // PPG is 0.0 to 1.0
    return points
      .map((pt, idx) => {
        const x = (idx * stepX).toFixed(1);
        const y = (height - 8 - pt.ppgValue * (height - 16)).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const renderCapnogramSvgPath = (points: TelemetryPoint[], width: number, height: number) => {
    if (!points || points.length === 0) return '';
    const stepX = width / (points.length - 1 || 1);
    // EtCO2 is 0 to 60 mmHg
    const maxCo2 = 60;
    return points
      .map((pt, idx) => {
        const x = (idx * stepX).toFixed(1);
        const norm = Math.min(1.0, Math.max(0, pt.respCo2MmHg / maxCo2));
        const y = (height - 8 - norm * (height - 16)).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
              <HeartPulse className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.telemetry.title}
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  IEEE 11073 & IEC 60601-2-27
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{t.telemetry.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Ward Filter & Live Polling Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {['ALL', 'ICU', 'CCU', 'NICU'].map((ward) => (
              <button
                key={ward}
                onClick={() => setSelectedWard(ward)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  selectedWard === ward
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ward === 'ALL' ? 'All Wards' : ward}
              </button>
            ))}
          </div>
          <button
            onClick={fetchBeds}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white"
            title="Refresh Telemetry Fleet"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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

      {/* Main Grid: Bed Fleet Wall (Left) & Active Monitor Waveform Display (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bed Fleet Cards */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>{t.telemetry.wardOverview}</span>
            <span className="text-xs font-normal text-slate-400">
              {filteredBeds.length} Active Telemetry Units
            </span>
          </h2>

          <div className="space-y-3">
            {filteredBeds.map((bed) => {
              const isSelected = bed.bedId === selectedBedId;
              const hasRedAlarm = bed.activeAlarms.some((a) => a.severity === 'CRITICAL_RED');
              const hasYellowAlarm = bed.activeAlarms.some((a) => a.severity === 'WARNING_YELLOW');

              return (
                <div
                  key={bed.bedId}
                  onClick={() => setSelectedBedId(bed.bedId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900/90 border-emerald-500/80 ring-1 ring-emerald-500/50'
                      : hasRedAlarm
                      ? 'bg-rose-950/30 border-rose-600/70 hover:border-rose-500'
                      : hasYellowAlarm
                      ? 'bg-amber-950/30 border-amber-600/70 hover:border-amber-500'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">{bed.bedId}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {bed.ward}
                        </span>
                        {bed.isNeonatal && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
                            NICU
                          </span>
                        )}
                        {bed.isAudioMuted && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
                            <VolumeX className="w-3 h-3" />
                            {bed.audioMutedRemainingSeconds}s
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 font-semibold mt-1">
                        {bed.patientName} - {bed.patientAge}y, {bed.patientGender}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                        {locale === 'km' ? bed.diagnosisKh : bed.diagnosisEn}
                      </p>
                    </div>

                    {/* Rhythm / Alarm Status Badge */}
                    <div className="text-right">
                      {hasRedAlarm ? (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-rose-600 text-white animate-pulse flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          ALARM
                        </span>
                      ) : hasYellowAlarm ? (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-amber-600 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          WARNING
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          NORMAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core 4 Metrics Strip */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">HR (bpm)</span>
                      <span className="text-base font-bold text-emerald-400">{bed.vitals.heartRate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SpO2 (%)</span>
                      <span className="text-base font-bold text-cyan-400">{bed.vitals.spo2}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">BP (MAP)</span>
                      <span className="text-xs font-bold text-amber-300">
                        {bed.vitals.systolicBp}/{bed.vitals.diastolicBp}
                      </span>
                      <span className="text-[10px] text-slate-400 block">({bed.vitals.calculatedMap})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">RESP (rpm)</span>
                      <span className="text-base font-bold text-yellow-300">{bed.vitals.respirationRate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Monitor Screen & Waveform Streams */}
        <div className="lg:col-span-7 space-y-4">
          {selectedBed ? (
            <div className="bg-black border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl">
              {/* Monitor Top Status Bar */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                      {selectedBed.bedName}
                      <span className="text-xs font-mono text-slate-400">
                        PATIENT ID: {selectedBed.patientId}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {locale === 'km' ? selectedBed.diagnosisKh : selectedBed.diagnosisEn}
                    </p>
                  </div>
                </div>

                {/* Alarm Silence / Control Action */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSilenceModal(selectedBed.bedId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      selectedBed.isAudioMuted
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {selectedBed.isAudioMuted ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        {selectedBed.audioMutedRemainingSeconds}s Muted
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        {t.telemetry.silenceAudioButton}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Waveform Canvas Displays */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
                {/* 1. ECG Lead II Trace */}
                <div>
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-1">
                    <span className="flex items-center gap-1 font-bold">
                      <Activity className="w-3.5 h-3.5" />
                      {t.telemetry.ecgLeadII} - 1.0 mV/cm
                    </span>
                    <span className="text-slate-400 font-sans">
                      HR: <strong className="text-emerald-400 font-mono text-sm">{selectedBed.vitals.heartRate}</strong> bpm
                      &nbsp;|&nbsp; ST: <strong className="text-slate-200">{selectedBed.vitals.stDeviationMm.toFixed(1)} mm</strong>
                      &nbsp;|&nbsp; QTc: <strong className="text-slate-200">{selectedBed.vitals.calculatedQtcMs} ms</strong>
                    </span>
                  </div>
                  <div className="h-24 w-full bg-slate-950 border border-emerald-950/60 rounded relative overflow-hidden flex items-center">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 96">
                      <path
                        d={renderEcgSvgPath(waveforms, 600, 96)}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* 2. SpO2 Plethysmogram Trace */}
                <div>
                  <div className="flex items-center justify-between text-xs text-cyan-400 font-mono mb-1">
                    <span className="font-bold">{t.telemetry.plethysmogram}</span>
                    <span className="text-slate-400 font-sans">
                      SpO2: <strong className="text-cyan-400 font-mono text-sm">{selectedBed.vitals.spo2}%</strong>
                      &nbsp;|&nbsp; PI: <strong className="text-slate-200">{selectedBed.vitals.perfusionIndex}%</strong>
                    </span>
                  </div>
                  <div className="h-16 w-full bg-slate-950 border border-cyan-950/60 rounded relative overflow-hidden flex items-center">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 64">
                      <path
                        d={renderPpgSvgPath(waveforms, 600, 64)}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* 3. Respiration & Capnography Trace */}
                <div>
                  <div className="flex items-center justify-between text-xs text-yellow-400 font-mono mb-1">
                    <span className="font-bold">{t.telemetry.capnogram}</span>
                    <span className="text-slate-400 font-sans">
                      RESP: <strong className="text-yellow-400 font-mono text-sm">{selectedBed.vitals.respirationRate}</strong> rpm
                      &nbsp;|&nbsp; EtCO2: <strong className="text-slate-200">{selectedBed.vitals.etco2} mmHg</strong>
                    </span>
                  </div>
                  <div className="h-16 w-full bg-slate-950 border border-yellow-950/60 rounded relative overflow-hidden flex items-center">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 64">
                      <path
                        d={renderCapnogramSvgPath(waveforms, 600, 64)}
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hemodynamic & Physiological Metrics Box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Heart Rate Box */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.telemetry.heartRate}</span>
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                    {selectedBed.vitals.heartRate}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    RPP: {selectedBed.vitals.ratePressureProduct}
                  </div>
                </div>

                {/* SpO2 Saturation */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.telemetry.spo2}</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                    {selectedBed.vitals.spo2}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    PI: {selectedBed.vitals.perfusionIndex}%
                  </div>
                </div>

                {/* Blood Pressure & MAP */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.telemetry.bloodPressure}</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-amber-300 mt-1">
                    {selectedBed.vitals.systolicBp} / {selectedBed.vitals.diastolicBp}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    MAP: <strong className="text-white font-mono">{selectedBed.vitals.calculatedMap}</strong> mmHg
                  </div>
                </div>

                {/* Dual Temperature */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Temperature</span>
                    <Thermometer className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-rose-300 mt-1">
                    {selectedBed.vitals.temperatureCore} C
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Delta T: {selectedBed.vitals.deltaTemperature} C
                  </div>
                </div>
              </div>

              {/* Active Alarms List */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.telemetry.activeAlarms} ({selectedBed.activeAlarms.length})
                </h4>

                {selectedBed.activeAlarms.length === 0 ? (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{t.telemetry.noAlarms}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBed.activeAlarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          alarm.severity === 'CRITICAL_RED'
                            ? 'bg-rose-950/70 border-rose-600 text-rose-200'
                            : 'bg-amber-950/70 border-amber-600 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="font-bold">
                              {locale === 'km' ? alarm.messageKh : alarm.messageEn}
                            </p>
                            <span className="text-[10px] opacity-75">
                              Current: {alarm.currentValue} | Triggered: {alarm.triggeredAt}
                            </span>
                          </div>
                        </div>

                        {!alarm.isAcknowledged && (
                          <button
                            onClick={() => handleAcknowledgeAlarm(selectedBed.bedId, alarm.id)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-medium text-[11px] transition"
                          >
                            {t.telemetry.acknowledgeAlarm}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrhythmia Drill & Simulation Panel */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {t.telemetry.drillArrhythmiaTitle}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleSimulateArrhythmia('ASYSTOLE')}
                    className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 rounded text-rose-200 text-xs font-medium text-left transition"
                  >
                    Asystole (CPR)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('VENTRICULAR_TACHYCARDIA')}
                    className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 rounded text-rose-200 text-xs font-medium text-left transition"
                  >
                    V-Tach (Shock)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('EXTREME_BRADYCARDIA')}
                    className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded text-amber-200 text-xs font-medium text-left transition"
                  >
                    Bradycardia (&lt;40)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('EXTREME_TACHYCARDIA')}
                    className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded text-amber-200 text-xs font-medium text-left transition"
                  >
                    Tachycardia (&gt;160)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('ST_ELEVATION_ISCHEMIA')}
                    className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 rounded text-rose-200 text-xs font-medium text-left transition"
                  >
                    STEMI (+3.2 mm)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('APNEA')}
                    className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 rounded text-rose-200 text-xs font-medium text-left transition"
                  >
                    Apnea (Arrest)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('DESATURATION')}
                    className="px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded text-cyan-200 text-xs font-medium text-left transition"
                  >
                    Desaturation (&lt;85%)
                  </button>
                  <button
                    onClick={() => handleSimulateArrhythmia('NORMAL_SINUS')}
                    className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded text-emerald-200 text-xs font-medium text-left transition flex items-center justify-between"
                  >
                    <span>Normal Sinus</span>
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No Bed Selected</div>
          )}
        </div>
      </div>

      {/* IEC 60601-1-8 Silence Modal */}
      {isSilenceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-950/80 border border-amber-600/50 rounded-xl text-amber-400">
                <VolumeX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t.telemetry.silenceModalTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.telemetry.silenceModalDesc}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.telemetry.clinicianIdInput}
                </label>
                <input
                  type="text"
                  value={silenceStaffId}
                  onChange={(e) => setSilenceStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. DR-ICU-01"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.telemetry.silenceDurationSeconds}
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={silenceDuration}
                  onChange={(e) => setSilenceDuration(Math.min(120, Math.max(10, parseInt(e.target.value) || 10)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsSilenceModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                {t.telemetry.cancel}
              </button>
              <button
                onClick={handleCommitSilence}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-semibold text-white shadow-lg shadow-amber-900/30 transition"
              >
                {t.telemetry.confirmSilence}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
