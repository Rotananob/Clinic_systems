'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SunMedium,
  Ruler,
  HeartPulse,
  Compass,
  Play,
  Pause,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  Download,
  Filter,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

interface PacsMeasurement {
  id: string;
  type: 'CALIPER' | 'CTR' | 'COBB_ANGLE' | 'ROI';
  value: number;
  unit: string;
  label: string;
  calculatedAt: string;
}

interface DicomStudy {
  id: string;
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
  patientGender: 'M' | 'F' | 'OTHER';
  patientAge: number;
  modality: 'DX' | 'CR' | 'US' | 'CT' | 'MR' | 'ES';
  bodyPart: string;
  studyDate: string;
  studyTime: string;
  referringPhysician: string;
  radiologist: string;
  studyDescription: string;
  numberOfInstances: number;
  windowCenter: number;
  windowWidth: number;
  losslessEncryptedUri: string;
  thumbnailUri: string;
  findings: string;
  impression: string;
  status: 'UNREAD' | 'IN_REVIEW' | 'REPORTED' | 'CRITICAL';
  cardiothoracicRatio?: number;
  cobbAngle?: number;
  measurements: PacsMeasurement[];
}

export default function PacsWorkstationPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const p = t.pacs;

  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<DicomStudy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Viewer interactive states
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('DEFAULT');
  const [isPlayingCine, setIsPlayingCine] = useState<boolean>(false);
  const [cineFps, setCineFps] = useState<number>(15);
  const [activeFrame, setActiveFrame] = useState<number>(1);

  // Reporting states
  const [findingsInput, setFindingsInput] = useState<string>('');
  const [impressionInput, setImpressionInput] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'REPORTED' | 'CRITICAL'>('REPORTED');
  const [radiologistName, setRadiologistName] = useState<string>('Dr. TEP Somally');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [savingReport, setSavingReport] = useState<boolean>(false);

  // CTR Calculator modal states
  const [showCtrModal, setShowCtrModal] = useState<boolean>(false);
  const [cardiacWidthInput, setCardiacWidthInput] = useState<number>(165);
  const [thoracicWidthInput, setThoracicWidthInput] = useState<number>(295);
  const [calculatedCtr, setCalculatedCtr] = useState<number | null>(null);
  const [ctrInterpretation, setCtrInterpretation] = useState<string>('');

  // Cobb Angle modal states
  const [showCobbModal, setShowCobbModal] = useState<boolean>(false);
  const [upperEndplateInput, setUpperEndplateInput] = useState<number>(32);
  const [lowerEndplateInput, setLowerEndplateInput] = useState<number>(16);
  const [calculatedCobb, setCalculatedCobb] = useState<number | null>(null);
  const [cobbSeverity, setCobbSeverity] = useState<string>('');

  // Load studies
  useEffect(() => {
    fetchStudies();
  }, [selectedModality, selectedStatus]);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const res = await api.pacs.getAllStudies({
        modality: selectedModality,
        status: selectedStatus,
        search: searchQuery,
      });
      if (res && Array.isArray(res)) {
        setStudies(res);
        if (res.length > 0 && !selectedStudy) {
          handleSelectStudy(res[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load DICOM studies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudy = (study: DicomStudy) => {
    setSelectedStudy(study);
    setFindingsInput(study.findings || '');
    setImpressionInput(study.impression || '');
    setReportStatus(study.status === 'CRITICAL' ? 'CRITICAL' : 'REPORTED');
    setRadiologistName(study.radiologist && study.radiologist !== 'Pending Review' ? study.radiologist : 'Dr. TEP Somally');
    setZoomLevel(1);
    setIsInverted(false);
    setActivePreset('DEFAULT');
    setActiveFrame(1);
    setIsPlayingCine(false);
    setSaveSuccessMsg(null);
  };

  // Cine loop simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingCine && selectedStudy && selectedStudy.numberOfInstances > 1) {
      interval = setInterval(() => {
        setActiveFrame((prev) => (prev >= selectedStudy.numberOfInstances ? 1 : prev + 1));
      }, 1000 / cineFps);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingCine, selectedStudy, cineFps]);

  // Window/level presets
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    // Visual contrast styling
  };

  // CTR Calculation
  const handleCalculateCtr = () => {
    if (cardiacWidthInput > 0 && thoracicWidthInput > 0 && cardiacWidthInput < thoracicWidthInput) {
      const ratio = Math.round((cardiacWidthInput / thoracicWidthInput) * 100) / 100;
      setCalculatedCtr(ratio);
      if (ratio > 0.55) {
        setCtrInterpretation(p.ctrCardiomegaly);
      } else if (ratio > 0.5) {
        setCtrInterpretation(p.ctrBorderline);
      } else {
        setCtrInterpretation(p.ctrNormal);
      }
    }
  };

  const handleApplyCtrToReport = () => {
    if (calculatedCtr !== null) {
      const note = `Cardiothoracic Ratio (CTR) measured at ${calculatedCtr} (Cardiac transverse diameter: ${cardiacWidthInput} mm, Internal thoracic diameter: ${thoracicWidthInput} mm). Interpretation: ${ctrInterpretation}.`;
      setFindingsInput((prev) => (prev ? `${prev}\n\n${note}` : note));
      setShowCtrModal(false);
    }
  };

  // Cobb Angle Calculation
  const handleCalculateCobb = () => {
    const angle = Math.round(Math.abs(upperEndplateInput - lowerEndplateInput) * 10) / 10;
    setCalculatedCobb(angle);
    if (angle >= 40) {
      setCobbSeverity(p.cobbSevere);
    } else if (angle >= 25) {
      setCobbSeverity(p.cobbModerate);
    } else if (angle >= 10) {
      setCobbSeverity(p.cobbMild);
    } else {
      setCobbSeverity(p.cobbNormal);
    }
  };

  const handleApplyCobbToReport = () => {
    if (calculatedCobb !== null) {
      const note = `Spinal Cobb angle measured at ${calculatedCobb} degrees (Upper endplate: ${upperEndplateInput} deg, Lower endplate: ${lowerEndplateInput} deg). Classification: ${cobbSeverity}.`;
      setFindingsInput((prev) => (prev ? `${prev}\n\n${note}` : note));
      setShowCobbModal(false);
    }
  };

  // Save report
  const handleSaveReport = async () => {
    if (!selectedStudy) return;
    try {
      setSavingReport(true);
      const res = await api.pacs.saveReport(selectedStudy.studyInstanceUid, {
        findings: findingsInput,
        impression: impressionInput,
        status: reportStatus,
        radiologist: radiologistName,
        cardiothoracicRatio: calculatedCtr || selectedStudy.cardiothoracicRatio,
      });

      if (res) {
        setSelectedStudy(res);
        setStudies((prev) => prev.map((s) => (s.studyInstanceUid === res.studyInstanceUid ? res : s)));
        setSaveSuccessMsg(p.reportSavedSuccess);
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to save radiologist report:', err);
    } finally {
      setSavingReport(false);
    }
  };

  // Modality helper
  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'DX':
      case 'CR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'US':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MR':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ES':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">{p.statusUnread}</span>;
      case 'IN_REVIEW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">{p.statusInReview}</span>;
      case 'REPORTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">{p.statusReported}</span>;
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 animate-pulse">{p.statusCritical}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Top Header */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 sticky top-0 z-30 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {p.title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">
                  DICOM 3.0 / WADO-RS
                </span>
              </h1>
              <p className="text-xs text-slate-400">{p.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{p.connectedAet}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{p.storageVault}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout: 3 Columns */}
      <div className="p-6">
        {/* Modality & Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'DX', 'CR', 'US', 'CT', 'ES'].map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModality(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedModality === mod
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mod === 'ALL' ? p.allModalities : mod}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ...' : 'Search patient, UID, body part...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStudies()}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">{p.status}: All</option>
              <option value="UNREAD">{p.statusUnread}</option>
              <option value="REPORTED">{p.statusReported}</option>
              <option value="CRITICAL">{p.statusCritical}</option>
            </select>
          </div>
        </div>

        {/* 3-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Studies Archive (3 cols) */}
          <div className="lg:col-span-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col h-[780px]">
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                {p.studyList}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                {studies.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50 p-2 space-y-1">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">{t.common.loading}</div>
              ) : studies.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">{isKh ? 'គ្មានរូបភាពត្រូវនឹងការស្វែងរក' : 'No imaging studies found.'}</div>
              ) : (
                studies.map((s) => (
                  <div
                    key={s.studyInstanceUid}
                    onClick={() => handleSelectStudy(s)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedStudy?.studyInstanceUid === s.studyInstanceUid
                        ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                        : 'hover:bg-slate-750 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getModalityColor(s.modality)}`}>
                        {s.modality}
                      </span>
                      {getStatusBadge(s.status)}
                    </div>

                    <h3 className="text-xs font-bold text-white truncate">{s.patientName}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                      <span>{s.patientId} • {s.patientAge}y • {s.patientGender}</span>
                      <span className="font-mono text-[10px]">{s.bodyPart}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-medium">{s.studyDescription}</p>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-2 pt-1 border-t border-slate-700/40">
                      <span>{s.studyDate} {s.studyTime}</span>
                      <span>{s.numberOfInstances} {s.numberOfInstances === 1 ? 'frame' : 'frames'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Column: Zero-Footprint Medical Viewer (5 cols) */}
          <div className="lg:col-span-5 bg-black rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col h-[780px]">
            {/* Viewer Top Controls */}
            <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 3))}
                  title={p.toolZoomIn}
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                  title={p.toolZoomOut}
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setIsInverted(false);
                    setActivePreset('DEFAULT');
                  }}
                  title={p.toolReset}
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsInverted((inv) => !inv)}
                  title={p.toolInvert}
                  className={`p-1.5 rounded-lg ${isInverted ? 'bg-amber-600 text-white' : 'bg-slate-700/80 text-slate-200'}`}
                >
                  <SunMedium className="w-4 h-4" />
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1">
                {['DEFAULT', 'BONE', 'LUNG', 'SOFT'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      activePreset === preset
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Measurements */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowCtrModal(true);
                    handleCalculateCtr();
                  }}
                  title={p.toolCtr}
                  className="px-2 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/40 flex items-center gap-1"
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>CTR</span>
                </button>
                <button
                  onClick={() => {
                    setShowCobbModal(true);
                    handleCalculateCobb();
                  }}
                  title={p.toolCobbAngle}
                  className="px-2 py-1 rounded-lg bg-purple-600/30 border border-purple-500/50 text-purple-300 text-xs font-semibold hover:bg-purple-600/40 flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Cobb</span>
                </button>
              </div>
            </div>

            {/* Canvas / Medical Rendering Stage */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden select-none">
              {selectedStudy ? (
                <div
                  className="relative transition-transform duration-100 flex items-center justify-center max-h-full max-w-full"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    filter: isInverted
                      ? 'invert(1) contrast(1.4)'
                      : activePreset === 'BONE'
                      ? 'contrast(1.8) brightness(1.2)'
                      : activePreset === 'LUNG'
                      ? 'contrast(1.6) brightness(0.9)'
                      : activePreset === 'SOFT'
                      ? 'contrast(1.2) brightness(1.1)'
                      : 'contrast(1.3)',
                  }}
                >
                  <img
                    src={selectedStudy.thumbnailUri}
                    alt={selectedStudy.studyDescription}
                    className="max-h-[640px] object-contain rounded shadow-2xl"
                  />

                  {/* On-screen diagnostic overlays */}
                  <div className="absolute top-3 left-3 text-[11px] font-mono text-cyan-400 bg-black/60 px-2 py-1 rounded backdrop-blur border border-cyan-500/30">
                    <div>{selectedStudy.patientName}</div>
                    <div className="text-[10px] text-slate-400">{selectedStudy.patientId}</div>
                    <div className="text-[10px] text-slate-400">{selectedStudy.studyDate} {selectedStudy.studyTime}</div>
                  </div>

                  <div className="absolute top-3 right-3 text-[11px] font-mono text-cyan-400 bg-black/60 px-2 py-1 rounded backdrop-blur border border-cyan-500/30 text-right">
                    <div>{selectedStudy.modality} • {selectedStudy.bodyPart}</div>
                    <div className="text-[10px] text-slate-400">W: {selectedStudy.windowWidth} C: {selectedStudy.windowCenter}</div>
                    <div className="text-[10px] text-slate-400">Zoom: {Math.round(zoomLevel * 100)}%</div>
                  </div>

                  {/* Calculated CTR Overlay Banner if measured */}
                  {(selectedStudy.cardiothoracicRatio || calculatedCtr) && (
                    <div className="absolute bottom-4 left-4 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-lg text-emerald-300 font-mono text-xs backdrop-blur flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-emerald-400" />
                      <span>CTR: {selectedStudy.cardiothoracicRatio || calculatedCtr}</span>
                      <span className="text-[10px] text-emerald-200">
                        {(selectedStudy.cardiothoracicRatio || calculatedCtr || 0) > 0.55 ? '(Cardiomegaly)' : '(Normal)'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p>{p.selectStudyPrompt}</p>
                </div>
              )}
            </div>

            {/* Cine Controller Bottom Bar (for Ultrasound / multi-slice) */}
            {selectedStudy && selectedStudy.numberOfInstances > 1 && (
              <div className="bg-slate-800/90 border-t border-slate-700 px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlayingCine((play) => !play)}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {isPlayingCine ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-300 font-mono">
                    Frame {activeFrame} / {selectedStudy.numberOfInstances}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{p.cineFps}:</span>
                  {[10, 15, 30].map((fps) => (
                    <button
                      key={fps}
                      onClick={() => setCineFps(fps)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        cineFps === fps ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {fps}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Radiologist Formal Reporting Suite (4 cols) */}
          <div className="lg:col-span-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col h-[780px]">
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                {p.radiologyReportTitle}
              </h2>
              {selectedStudy && getStatusBadge(selectedStudy.status)}
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {selectedStudy ? (
                <>
                  {/* Patient Quick Snapshot */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{selectedStudy.patientName}</span>
                      <span className="font-mono text-blue-400">{selectedStudy.patientId}</span>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>{p.referringDoctor}:</span>
                      <span className="text-slate-200">{selectedStudy.referringPhysician}</span>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>{p.bodyPart}:</span>
                      <span className="text-slate-200">{selectedStudy.bodyPart} ({selectedStudy.modality})</span>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>{p.clinicalFindings}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ICD-11 / RadLex</span>
                    </label>
                    <textarea
                      rows={5}
                      value={findingsInput}
                      onChange={(e) => setFindingsInput(e.target.value)}
                      placeholder={p.findingsPlaceholder}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Impression */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {p.diagnosticImpression}
                    </label>
                    <textarea
                      rows={3}
                      value={impressionInput}
                      onChange={(e) => setImpressionInput(e.target.value)}
                      placeholder={p.impressionPlaceholder}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans font-medium"
                    />
                  </div>

                  {/* Reading Radiologist & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">{p.radiologist}</label>
                      <input
                        type="text"
                        value={radiologistName}
                        onChange={(e) => setRadiologistName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">{p.status}</label>
                      <select
                        value={reportStatus}
                        onChange={(e) => setReportStatus(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="REPORTED">{p.statusReported}</option>
                        <option value="CRITICAL">{p.statusCritical}</option>
                      </select>
                    </div>
                  </div>

                  {/* Save feedback banner */}
                  {saveSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  {/* Sign & Save Action */}
                  <div className="pt-2">
                    <button
                      onClick={handleSaveReport}
                      disabled={savingReport || !findingsInput.trim() || !impressionInput.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{savingReport ? t.common.loading : p.saveAndSignReport}</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>{p.zeroEmojiCompliance}</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  <p>{p.selectStudyPrompt}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTR Calculator Modal */}
      {showCtrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                {p.ctrModalTitle}
              </h3>
              <button
                onClick={() => setShowCtrModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{p.cardiacWidth}</label>
                <input
                  type="number"
                  value={cardiacWidthInput}
                  onChange={(e) => setCardiacWidthInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{p.thoracicWidth}</label>
                <input
                  type="number"
                  value={thoracicWidthInput}
                  onChange={(e) => setThoracicWidthInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <button
                onClick={handleCalculateCtr}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
              >
                {isKh ? 'គណនាផលធៀប' : 'Calculate Ratio'}
              </button>

              {calculatedCtr !== null && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span>{p.calculatedCtr}:</span>
                    <span className="text-emerald-400 font-mono">{calculatedCtr}</span>
                  </div>
                  <div className="text-slate-300 font-medium">{ctrInterpretation}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setShowCtrModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleApplyCtrToReport}
                  disabled={calculatedCtr === null}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold"
                >
                  {isKh ? 'បញ្ចូលក្នុងរបាយការណ៍' : 'Append to Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cobb Angle Calculator Modal */}
      {showCobbModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400" />
                {p.cobbAngleModalTitle}
              </h3>
              <button
                onClick={() => setShowCobbModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{p.upperEndplateAngle}</label>
                <input
                  type="number"
                  value={upperEndplateInput}
                  onChange={(e) => setUpperEndplateInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{p.lowerEndplateAngle}</label>
                <input
                  type="number"
                  value={lowerEndplateInput}
                  onChange={(e) => setLowerEndplateInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <button
                onClick={handleCalculateCobb}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
              >
                {isKh ? 'គណនាមុំកោង' : 'Calculate Angle'}
              </button>

              {calculatedCobb !== null && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span>{p.calculatedCobbAngle}:</span>
                    <span className="text-purple-400 font-mono">{calculatedCobb} deg</span>
                  </div>
                  <div className="text-slate-300 font-medium">{cobbSeverity}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setShowCobbModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleApplyCobbToReport}
                  disabled={calculatedCobb === null}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold"
                >
                  {isKh ? 'បញ្ចូលក្នុងរបាយការណ៍' : 'Append to Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
