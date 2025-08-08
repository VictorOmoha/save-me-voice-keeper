// Utility for short audio cues (end-of-speech tone)
// Persists simple settings in localStorage

export type AudioCueSettings = {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
  frequency?: number; // Hz, default 880
  durationMs?: number; // default 120ms
};

const LS_ENABLED = 'voice_audio_cue_enabled';
const LS_VOLUME = 'voice_audio_cue_volume';
const DEFAULTS: Required<Omit<AudioCueSettings, 'frequency' | 'durationMs'>> & { frequency: number; durationMs: number } = {
  enabled: true,
  volume: 0.6,
  frequency: 880,
  durationMs: 120,
};

export const getAudioCueSettings = (): AudioCueSettings => {
  try {
    const enabled = localStorage.getItem(LS_ENABLED);
    const volume = localStorage.getItem(LS_VOLUME);
    return {
      enabled: enabled === null ? DEFAULTS.enabled : enabled === 'true',
      volume: volume === null ? DEFAULTS.volume : Math.min(1, Math.max(0, parseFloat(volume))),
      frequency: DEFAULTS.frequency,
      durationMs: DEFAULTS.durationMs,
    };
  } catch {
    return { ...DEFAULTS };
  }
};

export const setAudioCueSettings = (updates: Partial<AudioCueSettings>) => {
  const current = getAudioCueSettings();
  const next = { ...current, ...updates };
  try {
    localStorage.setItem(LS_ENABLED, String(next.enabled));
    localStorage.setItem(LS_VOLUME, String(next.volume));
  } catch {}
  return next;
};

// Play a short beep using Web Audio API
export const playEndOfSpeechCue = async (): Promise<void> => {
  const { volume, frequency = DEFAULTS.frequency, durationMs = DEFAULTS.durationMs } = getAudioCueSettings();
  if (typeof window === 'undefined') return;
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = 0;

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  const dur = Math.max(0.06, durationMs / 1000); // avoid too short clicks
  // Simple attack-decay envelope to avoid clicks
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.linearRampToValueAtTime(0.0001, now + dur);

  osc.start(now);
  osc.stop(now + dur + 0.01);

  await new Promise<void>((resolve) => {
    osc.onended = () => {
      try { ctx.close(); } catch {}
      resolve();
    };
  });
};

export const playEndOfSpeechCueIfEnabled = async (): Promise<void> => {
  const { enabled } = getAudioCueSettings();
  if (!enabled) return;
  try {
    await playEndOfSpeechCue();
  } catch (e) {
    // Non-fatal
    console.warn('Audio cue failed:', e);
  }
};
