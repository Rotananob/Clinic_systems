/**
 * Clinical Audio Engine for Rotana Clinic Management Platform
 * High-fidelity, zero-dependency procedural audio synthesized with Web Audio API.
 * Guaranteed to be audible across laptop and mobile speakers (iPhone & Android).
 */

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
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Global one-time interaction listener to unblock audio on first tap/click
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };

  window.addEventListener('click', handleInteraction, { once: true, passive: true });
  window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
  window.addEventListener('keydown', handleInteraction, { once: true, passive: true });
}

/**
 * Helper to play a composite bell tone with rich fundamental and harmonic overtone.
 */
function playBellNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain = 0.45
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
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + (duration * 0.6));

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.05);
}

/**
 * 1. Payment Success Chime:
 * Bright, joyful 4-note ascending arpeggio (G5 -> C6 -> E6 -> G6)
 * Loud, crisp, and unmistakable on all devices.
 */
export function playPaymentSuccessChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // G5 (784 Hz), C6 (1046.5 Hz), E6 (1318.5 Hz), G6 (1568 Hz)
    const melody = [
      { freq: 783.99, delay: 0.00, duration: 0.22, gain: 0.40 },
      { freq: 1046.50, delay: 0.11, duration: 0.24, gain: 0.45 },
      { freq: 1318.51, delay: 0.22, duration: 0.28, gain: 0.50 },
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
 * 2. Hospital / Clinic Queue Announcement Chime:
 * Classic 3-note broadcast chime (E5 -> G5 -> C6)
 * Authoritative, soothing, and clear for patient queue token calls.
 */
export function playHospitalChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const chimeNotes = [
      { freq: 659.25, delay: 0.00, duration: 0.38, gain: 0.48 }, // E5
      { freq: 783.99, delay: 0.32, duration: 0.42, gain: 0.52 }, // G5
      { freq: 1046.50, delay: 0.65, duration: 0.85, gain: 0.58 }, // C6 (long ring)
    ];

    chimeNotes.forEach(({ freq, delay, duration, gain }) => {
      playBellNote(ctx, freq, now + delay, duration, gain);
    });
  } catch (err) {
    console.debug('Hospital chime error:', err);
  }
}

/**
 * 3. Cash Register / Cash Settlement Chime:
 * Metallic double chime simulating a register bell.
 */
export function playCashRegisterChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    playBellNote(ctx, 1760.00, now, 0.25, 0.50); // A6
    playBellNote(ctx, 2349.32, now + 0.08, 0.45, 0.55); // D7
  } catch (err) {
    console.debug('Cash register chime error:', err);
  }
}

/**
 * 4. Cancel / Checkout Abort Chime:
 * Soft dual tone confirming that payment checking has halted.
 */
export function playCancelChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    playBellNote(ctx, 392.00, now, 0.16, 0.35); // G4
    playBellNote(ctx, 329.63, now + 0.12, 0.28, 0.35); // E4
  } catch (err) {
    console.debug('Cancel chime error:', err);
  }
}
