/**
 * Clinical Audio Engine for Rotana Clinic Management Platform
 * 1. High-fidelity Web Audio API procedural synthesis (guaranteed fallback on all devices)
 * 2. Real custom sound support (record your own voice or upload MP3/WAV/M4A)
 * 3. Mobile PWA Web Audio unblocker for iOS Safari & Android Chrome
 * 4. Spoken Patient Queue Announcements via Web Speech API
 */

export type AudioEventType = 'payment_success' | 'queue_call' | 'cash_settlement' | 'cancel';

export interface CustomAudioItem {
  dataUri: string;
  name: string;
  type: 'upload' | 'recording';
  createdAt: number;
  duration?: number;
}

export const CUSTOM_AUDIO_STORAGE_KEY = 'rotana_custom_audio_v1';

let sharedAudioCtx: AudioContext | null = null;

/**
 * Returns a warmed, resumed AudioContext singleton.
 * Handles mobile browser autoplay restrictions cleanly.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    return sharedAudioCtx;
  } catch (err) {
    console.debug('Failed to get AudioContext:', err);
    return null;
  }
}

/**
 * Ensures AudioContext is unblocked via user gesture (click/touch).
 * Plays an imperceptible 1-sample buffer to warm the physical DAC on iOS & Android.
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore warmup errors
  }
}

// Global interaction listeners to unblock audio on first user touch/click on mobile
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudioContext();
  };

  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('touchend', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
}

// ---------------------------------------------------------------------------
// Custom Audio Storage & Management (Upload real sounds or voice recordings)
// ---------------------------------------------------------------------------

export function getCustomAudioStore(): Record<string, CustomAudioItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_AUDIO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getCustomAudio(event: AudioEventType): CustomAudioItem | null {
  const store = getCustomAudioStore();
  return store[event] || null;
}

export function setCustomAudio(event: AudioEventType, item: CustomAudioItem): void {
  if (typeof window === 'undefined') return;
  const store = getCustomAudioStore();
  store[event] = item;
  try {
    localStorage.setItem(CUSTOM_AUDIO_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save custom audio to localStorage:', err);
  }
}

export function clearCustomAudio(event: AudioEventType): void {
  if (typeof window === 'undefined') return;
  const store = getCustomAudioStore();
  delete store[event];
  try {
    localStorage.setItem(CUSTOM_AUDIO_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to clear custom audio:', err);
  }
}

/**
 * Plays a base64 Data URI audio with zero-fail fallback:
 * Primary: HTML5 Audio
 * Secondary: Web Audio decodeAudioData (for background/PWA resilience)
 */
export async function playAudioDataUri(dataUri: string): Promise<boolean> {
  if (typeof window === 'undefined' || !dataUri) return false;

  unlockAudioContext();

  // Method 1: HTML5 Audio element
  try {
    const audio = new Audio(dataUri);
    audio.volume = 1.0;
    await audio.play();
    return true;
  } catch {
    // Fallback to Web Audio API decoding
    const ctx = getAudioContext();
    if (!ctx) return false;

    try {
      const res = await fetch(dataUri);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      return true;
    } catch (err2) {
      console.warn('Web Audio decode failed:', err2);
      return false;
    }
  }
}

/**
 * Helper to play a composite bell tone with rich fundamental and harmonic overtone.
 */
function playBellNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain = 0.45,
) {
  // Fundamental tone (Sine)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  gain1.gain.setValueAtTime(0, startTime);
  gain1.gain.linearRampToValueAtTime(peakGain * 0.75, startTime + 0.008);
  gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.05);

  // Harmonic overtone (Triangle - adds presence on mobile speakers)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(peakGain * 0.25, startTime + 0.006);
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.05);
}

/**
 * 1. Payment Success Sound:
 * Plays custom real voice/audio if configured, or default 4-note ascending bell arpeggio.
 */
export async function playPaymentSuccessChime(): Promise<void> {
  const custom = getCustomAudio('payment_success');
  if (custom && custom.dataUri) {
    const ok = await playAudioDataUri(custom.dataUri);
    if (ok) return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // G5 (784 Hz), C6 (1046.5 Hz), E6 (1318.5 Hz), G6 (1568 Hz)
    const melody = [
      { freq: 783.99, delay: 0.0, duration: 0.22, gain: 0.4 },
      { freq: 1046.5, delay: 0.11, duration: 0.24, gain: 0.45 },
      { freq: 1318.51, delay: 0.22, duration: 0.28, gain: 0.5 },
      { freq: 1567.98, delay: 0.35, duration: 0.65, gain: 0.55 },
    ];

    melody.forEach(({ freq, delay, duration, gain }) => {
      playBellNote(ctx, freq, now + delay, duration, gain);
    });
  } catch (err) {
    console.debug('Payment chime error:', err);
  }
}

/**
 * 2. Hospital / Queue Announcement Sound:
 * Plays custom real voice/audio if configured, or default 3-note hospital broadcast chime.
 */
export async function playHospitalChime(): Promise<void> {
  const custom = getCustomAudio('queue_call');
  if (custom && custom.dataUri) {
    const ok = await playAudioDataUri(custom.dataUri);
    if (ok) return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const chimeNotes = [
      { freq: 659.25, delay: 0.0, duration: 0.38, gain: 0.48 }, // E5
      { freq: 783.99, delay: 0.32, duration: 0.42, gain: 0.52 }, // G5
      { freq: 1046.5, delay: 0.65, duration: 0.85, gain: 0.58 }, // C6
    ];

    chimeNotes.forEach(({ freq, delay, duration, gain }) => {
      playBellNote(ctx, freq, now + delay, duration, gain);
    });
  } catch (err) {
    console.debug('Hospital chime error:', err);
  }
}

/**
 * 3. Cash Settlement Sound:
 * Plays custom real audio if configured, or default register bell.
 */
export async function playCashRegisterChime(): Promise<void> {
  const custom = getCustomAudio('cash_settlement');
  if (custom && custom.dataUri) {
    const ok = await playAudioDataUri(custom.dataUri);
    if (ok) return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    playBellNote(ctx, 1760.0, now, 0.25, 0.5); // A6
    playBellNote(ctx, 2349.32, now + 0.08, 0.45, 0.55); // D7
  } catch (err) {
    console.debug('Cash register chime error:', err);
  }
}

/**
 * 4. Cancel / Alert Sound:
 * Plays custom real audio if configured, or default dual soft tone.
 */
export async function playCancelChime(): Promise<void> {
  const custom = getCustomAudio('cancel');
  if (custom && custom.dataUri) {
    const ok = await playAudioDataUri(custom.dataUri);
    if (ok) return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    playBellNote(ctx, 392.0, now, 0.16, 0.35); // G4
    playBellNote(ctx, 329.63, now + 0.12, 0.28, 0.35); // E4
  } catch (err) {
    console.debug('Cancel chime error:', err);
  }
}

/**
 * Spoken Patient Queue Call Announcement via Web Speech API:
 * Speaks aloud in Khmer or English for patient tokens.
 */
export function speakQueueCall(
  token: string,
  room: string,
  isKhmer = true,
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    const spokenText = isKhmer
      ? `សូមអញ្ជើញ អ្នកជំងឺលេខ ${token} ចូលទៅកាន់ ${room}`
      : `Patient ${token}, please proceed to ${room}`;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.lang = isKhmer ? 'km-KH' : 'en-US';

    // Look for preferred Khmer or English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) =>
      isKhmer ? v.lang.startsWith('km') : v.lang.startsWith('en'),
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.debug('Speech synthesis error:', err);
  }
}
