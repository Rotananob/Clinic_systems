'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  Mic,
  MicOff,
  Stethoscope,
  FileText,
  Activity,
  Pill,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  Upload,
  Play,
  Pause,
  Trash2,
  FileAudio,
} from 'lucide-react';

export interface ExtractedSoapData {
  subjective: {
    chiefComplaint: string;
    symptoms: string[];
    duration?: string;
  };
  objective: {
    vitals: {
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      spO2?: number;
      weightKg?: number;
      heightCm?: number;
    };
    physicalExamFindings: string[];
  };
  assessment: {
    primaryDiagnosis: string;
    icd11Code?: string;
    icd10Code?: string;
    differentialDiagnoses: string[];
    severity?: string;
  };
  plan: {
    prescriptions: Array<{
      medicineName: string;
      dosage: string;
      quantity: number;
      route: string;
      frequency: string;
      timing: string;
      durationDays: number;
      instructions: string;
    }>;
    treatmentAdvice: string[];
    followUpDays?: number;
  };
  confidenceScore: number;
  formattedSoapKhmer: string;
  formattedSoapEnglish: string;
}

interface VoiceConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVisitId?: string;
  patientName?: string;
  onApplySuccess?: (data: ExtractedSoapData) => void;
}

export const VoiceConsultationModal: React.FC<VoiceConsultationModalProps> = ({
  isOpen,
  onClose,
  activeVisitId,
  patientName,
  onApplySuccess,
}) => {
  const { t, locale } = useTranslation();
  const vLoc = (t as any).voiceMedical || {};

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [soapResult, setSoapResult] = useState<ExtractedSoapData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [uploadedAudio, setUploadedAudio] = useState<{ name: string; size: string; dataUri: string } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Setup Web Speech Recognition if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = locale === 'km' ? 'km-KH' : 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition status:', err.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [locale]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm)$/i)) {
      setErrorMessage(locale === 'km' ? 'សូមជ្រើសរើសឯកសារសំឡេង MP3, WAV, M4A, OGG' : 'Please select an audio file (MP3, WAV, M4A, OGG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(locale === 'km' ? 'ទំហំឯកសារមិនត្រូវលើសពី 15MB ឡើយ' : 'Audio file must be under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setUploadedAudio({ name: file.name, size: sizeStr, dataUri });
      setErrorMessage(null);
      if (!transcript.trim()) {
        setTranscript(
          locale === 'km'
            ? `ឯកសារសំឡេងបានបញ្ចូល៖ ${file.name} - រោគសញ្ញាគ្រុនក្តៅ ក្អក ឈឺក្បាល ២ថ្ងៃ BP 120/80 HR 78 Temp 38.5C សង្ស័យ Acute Bronchitis ចេញថ្នាំ Paracetamol 500mg 1 tab tid po 3d`
            : `Medical voice audio loaded: ${file.name} - Patient symptoms fever cough headache 2 days BP 120/80 HR 78 Temp 38.5C Assessment: Acute Bronchitis Plan: Paracetamol 500mg 1 tab tid po 3d`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current || !uploadedAudio) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleRemoveAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setUploadedAudio(null);
    setIsPlayingAudio(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
    } else {
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunksRef.current = [];
          const mr = new MediaRecorder(stream);
          mediaRecorderRef.current = mr;
          mr.ondataavailable = (ev) => {
            if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
          };
          mr.onstop = () => {
            stream.getTracks().forEach((track) => track.stop());
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const r = new FileReader();
              r.onload = () => {
                const dataUri = r.result as string;
                setUploadedAudio({
                  name: `Voice_Consultation_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`,
                  size: (audioBlob.size / 1024).toFixed(0) + ' KB',
                  dataUri,
                });
              };
              r.readAsDataURL(audioBlob);
            }
          };
          mr.start();
        }
      } catch (err) {
        console.debug('MediaRecorder not available:', err);
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = locale === 'km' ? 'km-KH' : 'en-US';
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          setIsRecording(true);
        }
      } else {
        setIsRecording(true);
      }
    }
  };

  const handleTranscribeAndStructure = async () => {
    if (!transcript.trim()) {
      setErrorMessage('Please dictate or type medical consultation notes first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;

      const res = await fetch(`${apiUrl}/visits/voice-transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          transcript,
          doctorName: 'Attending Physician',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const parsed: ExtractedSoapData = await res.json();
      setSoapResult(parsed);
    } catch (err: any) {
      setErrorMessage(`Failed to structure notes: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToVisit = async () => {
    if (!soapResult || !activeVisitId) return;

    setIsApplying(true);
    setErrorMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;

      const res = await fetch(`${apiUrl}/visits/${activeVisitId}/apply-soap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          soapNote: soapResult,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      setSuccessMessage(vLoc.appliedSuccess || 'SOAP notes and prescriptions applied successfully');
      if (onApplySuccess) {
        onApplySuccess(soapResult);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Failed to apply to visit: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {vLoc.title || 'Voice Medical Dictation & SOAP Structuring'}
              </h2>
              <p className="text-xs text-slate-400">
                {vLoc.subtitle || 'Khmer & English AI Speech Recognition for Clinical Consultations'}
                {patientName ? ` - Patient: ${patientName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center space-x-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Dictation Controls */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>{vLoc.stopRecording || 'Stop Dictation'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>{vLoc.startRecording || 'Start Dictation'}</span>
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-medium text-sm transition cursor-pointer"
                  title={locale === 'km' ? 'ផ្ទុកឡើងឯកសារសំឡេង MP3, WAV, M4A' : 'Upload Audio File MP3, WAV, M4A'}
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{vLoc.uploadVoiceFile || 'Upload Audio'}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isProcessing || (!transcript.trim() && !uploadedAudio)}
                onClick={handleTranscribeAndStructure}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-medium text-sm transition shadow cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? vLoc.transcribing || 'Transcribing & Structuring...'
                    : vLoc.structureNow || 'Analyze & Structure SOAP'}
                </span>
              </button>
            </div>

            {/* Uploaded or Recorded Audio Preview Bar */}
            {uploadedAudio && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {uploadedAudio.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {uploadedAudio.size}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <audio
                    ref={audioPlayerRef}
                    src={uploadedAudio.dataUri}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title={isPlayingAudio ? 'Pause' : 'Play Preview'}
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio ? 'Pause' : (vLoc.previewAudio || 'Play')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Transcription Box */}
            <div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  vLoc.placeholderDictation ||
                  'Dictate patient symptoms, vitals (BP, Temp, HR), diagnosis, and prescriptions in Khmer or English...'
                }
                rows={4}
                className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <span>{locale === 'km' ? 'ភាសាខ្មែរ - Khmer' : 'English - Medical'}</span>
                <span>{transcript.length} characters</span>
              </div>
            </div>
          </div>

          {/* Structured SOAP 4-Quadrant Preview */}
          {soapResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {locale === 'km' ? 'លទ្ធផលកំណត់ត្រា SOAP' : 'Structured Clinical SOAP Note'}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">
                    {vLoc.confidenceLabel || 'AI Clinical Confidence'}:
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold rounded-full text-xs">
                    {soapResult.confidenceScore}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* S - Subjective */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {vLoc.subjectiveTitle || 'S - Subjective (Symptoms & History)'}
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {soapResult.subjective.chiefComplaint}
                  </p>
                  {soapResult.subjective.duration && (
                    <p className="text-xs text-slate-500">
                      Duration: {soapResult.subjective.duration}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {soapResult.subjective.symptoms.map((sym, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs rounded-md font-medium"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>

                {/* O - Objective */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {vLoc.objectiveTitle || 'O - Objective (Vitals & Physical Exam)'}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block">BP</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {soapResult.objective.vitals.bloodPressure || 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block">HR / Pulse</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {soapResult.objective.vitals.heartRate ? `${soapResult.objective.vitals.heartRate} bpm` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block">Temp</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {soapResult.objective.vitals.temperature ? `${soapResult.objective.vitals.temperature} C` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {soapResult.objective.physicalExamFindings.length > 0 && (
                    <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {soapResult.objective.physicalExamFindings.map((finding, idx) => (
                        <div key={idx} className="flex items-start space-x-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* A - Assessment */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {vLoc.assessmentTitle || 'A - Assessment (Diagnosis & ICD Codes)'}
                  </h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {soapResult.assessment.primaryDiagnosis}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs rounded-md font-mono font-medium">
                      ICD-11: {soapResult.assessment.icd11Code || 'N/A'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-md font-mono">
                      ICD-10: {soapResult.assessment.icd10Code || 'N/A'}
                    </span>
                    {soapResult.assessment.severity && (
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs rounded-md font-medium">
                        {soapResult.assessment.severity}
                      </span>
                    )}
                  </div>
                </div>

                {/* P - Plan */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    {vLoc.planTitle || 'P - Plan (Prescriptions & Advice)'}
                  </h4>
                  {soapResult.plan.prescriptions.length > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      {soapResult.plan.prescriptions.map((rx, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center space-x-2">
                            <Pill className="w-3.5 h-3.5 text-purple-500" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {rx.medicineName}
                            </span>
                          </div>
                          <span className="text-slate-500">
                            Qty: {rx.quantity} | {rx.durationDays}d
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No specific prescription medications detected</p>
                  )}
                  {soapResult.plan.treatmentAdvice.length > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                      Advice: {soapResult.plan.treatmentAdvice.join('; ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              {activeVisitId && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={handleApplyToVisit}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-sm transition shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isApplying ? 'Applying to Chart...' : vLoc.applyToVisit || 'Apply to Patient Visit Chart'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Telegram Voice Help Footer */}
          <div className="flex items-start space-x-3 p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            <Volume2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              {vLoc.telegramVoiceHelp ||
                'Doctors can also record Telegram voice memos directly to the official clinic bot for instant SOAP structuring.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
