/**
 * Synthesizes a clean, pleasant melodic payment success chime using Web Audio API.
 * Eliminates external MP3 dependencies, latency, or broken assets.
 */
export function playPaymentSuccessChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic Chord (C6 - 1046.5Hz, E6 - 1318.5Hz, G6 - 1567.9Hz)
    const notes = [
      { freq: 1046.5, start: now, duration: 0.18 },
      { freq: 1318.5, start: now + 0.10, duration: 0.22 },
      { freq: 1567.9, start: now + 0.22, duration: 0.45 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    });
  } catch (err) {
    // Non-critical audio failure; suppress safely
    console.debug('Audio chime playback omitted:', err);
  }
}
