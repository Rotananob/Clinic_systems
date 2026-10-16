'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Square,
  Mic,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileAudio,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  AudioEventType,
  CustomAudioItem,
  getCustomAudioStore,
  setCustomAudio,
  clearCustomAudio,
  playPaymentSuccessChime,
  playHospitalChime,
  playCashRegisterChime,
  playCancelChime,
  playAudioDataUri,
  speakQueueCall,
} from '../../lib/chime';
import { useTranslation } from '../../context/I18nContext';

interface SoundItemConfig {
  event: AudioEventType;
  titleEn: string;
  titleKh: string;
  descriptionEn: string;
  descriptionKh: string;
  playFn: () => Promise<void>;
  sampleSpeech?: () => void;
}

export function SoundSettingsPanel() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [audioStore, setAudioStore] = useState<Record<string, CustomAudioItem>>({});
  const [playingEvent, setPlayingEvent] = useState<string | null>(null);
  const [recordingEvent, setRecordingEvent] = useState<AudioEventType | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedUploadEvent, setSelectedUploadEvent] = useState<AudioEventType | null>(null);

  useEffect(() => {
    setAudioStore(getCustomAudioStore());
  }, []);

  const refreshStore = () => {
    setAudioStore(getCustomAudioStore());
  };

  const soundConfigs: SoundItemConfig[] = [
    {
      event: 'payment_success',
      titleEn: 'Payment Success Sound',
      titleKh: 'សំឡេងទូទាត់ជោគជ័យ (KHQR & សាច់ប្រាក់)',
      descriptionEn: 'Audible chime or real voice when a customer scans KHQR or pays cash.',
      descriptionKh: 'សំឡេងរោទ៍ ឬសំឡេងនិយាយពេលអតិថិជនស្កេន KHQR ឬទូទាត់ប្រាក់រួចរាល់។',
      playFn: playPaymentSuccessChime,
    },
    {
      event: 'queue_call',
      titleEn: 'Patient Queue Call Sound',
      titleKh: 'សំឡេងហៅលេខអ្នកជំងឺ (Queue Token)',
      descriptionEn: 'Broadcast chime played in waiting lobby when reception or doctor calls patient.',
      descriptionKh: 'សំឡេងប្រកាសនៅក្នុងបន្ទប់រង់ចាំពេលគិលានុបដ្ឋាយិកា ឬវេជ្ជបណ្ឌិតហៅអ្នកជំងឺ។',
      playFn: playHospitalChime,
      sampleSpeech: () => speakQueueCall('A-101', isKm ? 'បន្ទប់ពិគ្រោះលេខ 1' : 'Consultation Room 1', isKm),
    },
    {
      event: 'cash_settlement',
      titleEn: 'Cash Drawer / Register Settlement',
      titleKh: 'សំឡេងគិតលុយ និងថតប្រាក់',
      descriptionEn: 'Sound confirmation when cash drawer pulse is kicked or settled.',
      descriptionKh: 'សំឡេងបញ្ជាក់ពេលបើកថតប្រាក់ ឬទទួលប្រាក់សុទ្ធនៅបញ្ជរ។',
      playFn: playCashRegisterChime,
    },
    {
      event: 'cancel',
      titleEn: 'Cancellation & Alert Tone',
      titleKh: 'សំឡេងលុបចោល ឬការជូនដំណឹង',
      descriptionEn: 'Soft prompt when transaction or queue check is cancelled.',
      descriptionKh: 'សំឡេងប្រាប់ពេលផ្អាក ឬលុបចោលប្រតិបត្តិការទូទាត់។',
      playFn: playCancelChime,
    },
  ];

  // Test play sound
  const handlePlaySound = async (cfg: SoundItemConfig) => {
    if (playingEvent) return;
    setPlayingEvent(cfg.event);
    setErrorNotice(null);
    try {
      await cfg.playFn();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e?.message || 'Failed to play audio');
    } finally {
      setTimeout(() => setPlayingEvent(null), 1200);
    }
  };

  // Upload custom audio file
  const handleUploadClick = (event: AudioEventType) => {
    setSelectedUploadEvent(event);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUploadEvent) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      setErrorNotice(isKm ? 'សូមជ្រើសរើសឯកសារសំឡេង (MP3, WAV, M4A, OGG)' : 'Please select an audio file (MP3, WAV, M4A, OGG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorNotice(isKm ? 'ទំហំឯកសារមិនត្រូវលើសពី 5MB ឡើយ' : 'Audio file must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setCustomAudio(selectedUploadEvent, {
        dataUri,
        name: file.name,
        type: 'upload',
        createdAt: Date.now(),
      });
      refreshStore();
      setStatusNotice(
        isKm
          ? `បានបញ្ចូលឯកសារសំឡេង "${file.name}" ដោយជោគជ័យ!`
          : `Custom audio "${file.name}" applied successfully!`,
      );
      setTimeout(() => setStatusNotice(null), 4000);
      // Immediately preview uploaded audio
      playAudioDataUri(dataUri);
    };
    reader.readAsDataURL(file);
  };

  // Microphone Voice Recording
  const startRecording = async (event: AudioEventType) => {
    if (recordingEvent) return;
    setErrorNotice(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUri = reader.result as string;
          setCustomAudio(event, {
            dataUri,
            name: `Voice_Recording_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}`,
            type: 'recording',
            createdAt: Date.now(),
            duration: recordSeconds,
          });
          refreshStore();
          setStatusNotice(
            isKm
              ? 'បានថត និងរក្សាទុកសំឡេងផ្ទាល់ខ្លួនដោយជោគជ័យ!'
              : 'Voice recording saved as active sound!',
          );
          setTimeout(() => setStatusNotice(null), 4000);
          playAudioDataUri(dataUri);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setRecordingEvent(event);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 15) {
            // Maximum 15s per alert sound
            stopRecording();
            return 15;
          }
          return sec + 1;
        });
      }, 1000);
    } catch {
      setErrorNotice(
        isKm
          ? 'មិនអាចបើកមីក្រូហ្វូនបានទេ។ សូមអនុញ្ញាតសិទ្ធិប្រើប្រាស់ Microphone លើកម្មវិធីរុករក។'
          : 'Microphone permission denied. Please allow microphone access to record voice.',
      );
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingEvent(null);
  };

  // Reset to default
  const handleResetToDefault = (event: AudioEventType) => {
    clearCustomAudio(event);
    refreshStore();
    setStatusNotice(isKm ? 'បានកំណត់ទៅសំឡេងលំនាំដើមវិញ' : 'Restored to default clinical bell tone.');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Audio Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-teal-800" />
            <span>{isKm ? 'ប្រព័ន្ធគ្រប់គ្រងសំឡេង និងសំឡេងប្រកាស' : 'Clinical Sound & Real Voice System'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isKm
              ? 'លោកអ្នកអាចប្រើប្រាស់សំឡេងលំនាំដើម បញ្ចូលឯកសារសំឡេងផ្ទាល់ខ្លួន (MP3/WAV) ឬថតសំឡេងនិយាយផ្ទាល់ដើម្បីប្រកាសក្នុងគ្លីនិក។'
              : 'Customize notification alerts with default chimes, uploaded audio files, or your own live microphone recordings.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundConfigs.forEach((c) => clearCustomAudio(c.event));
            refreshStore();
            setStatusNotice(isKm ? 'បានកំណត់សំឡេងទាំងអស់ទៅលំនាំដើម' : 'Reset all sounds to default');
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isKm ? 'កំណត់ដើមទាំងអស់' : 'Reset All'}</span>
        </button>
      </div>

      {/* Alerts */}
      {statusNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Recording in progress banner */}
      {recordingEvent && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                {isKm ? 'កំពុងថតសំឡេងរបស់អ្នក...' : 'Recording your voice...'}
              </span>
              <span className="text-[11px] text-amber-700 font-mono">
                {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
                {String(recordSeconds % 60).padStart(2, '0')} / 00:15
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{isKm ? 'បញ្ចប់ការថត' : 'Stop & Save'}</span>
          </button>
        </div>
      )}

      {/* Sounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {soundConfigs.map((cfg) => {
          const custom = audioStore[cfg.event];
          const isPlaying = playingEvent === cfg.event;
          const isThisRecording = recordingEvent === cfg.event;

          return (
            <div
              key={cfg.event}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {isKm ? cfg.titleKh : cfg.titleEn}
                  </h3>
                  {custom ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 flex items-center gap-1 shrink-0 font-mono">
                      <Radio className="w-3 h-3 text-teal-700" />
                      <span>{custom.type === 'recording' ? (isKm ? 'សំឡេងថតផ្ទាល់' : 'Voice Rec') : (isKm ? 'ឯកសារសំឡេង' : 'Audio File')}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0 font-mono">
                      {isKm ? 'សំឡេងកណ្ដឹងលំនាំដើម' : 'Default Chime'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {isKm ? cfg.descriptionKh : cfg.descriptionEn}
                </p>

                {custom && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 mb-3">
                    <div className="flex items-center gap-2 truncate">
                      <FileAudio className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="truncate font-medium text-[11px]">{custom.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetToDefault(cfg.event)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors ml-2"
                      title={isKm ? 'លុបចេញ' : 'Remove custom sound'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePlaySound(cfg)}
                  disabled={isPlaying || isThisRecording}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isKm ? 'ចាក់ស្តាប់' : 'Test Sound'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUploadClick(cfg.event)}
                  disabled={isThisRecording}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isKm ? 'បញ្ចូលឯកសារ MP3 / WAV ពីទូរស័ព្ទ ឬកុំព្យូទ័រ' : 'Upload MP3 / WAV file'}
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isKm ? 'បញ្ចូល MP3' : 'Upload'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => startRecording(cfg.event)}
                  disabled={Boolean(recordingEvent)}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isKm ? 'ថតសំឡេងនិយាយផ្ទាល់របស់អ្នកតាមរយៈមីក្រូហ្វូន' : 'Record voice with microphone'}
                >
                  <Mic className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isKm ? 'ថតសំឡេង' : 'Record'}</span>
                </button>

                {cfg.sampleSpeech && (
                  <button
                    type="button"
                    onClick={cfg.sampleSpeech}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                    title={isKm ? 'ចាក់សាកល្បងសំឡេងប្រកាសតាម Web Speech API' : 'Sample Speech Announcement'}
                  >
                    <span>{isKm ? 'សំឡេងប្រកាស' : 'Spoken Voice'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
