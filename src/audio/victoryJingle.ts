/**
 * Short original victory jingle (synthesized).
 * Caribbean-inspired rhythm — not a copyrighted bachata/salsa recording.
 */

type Tone = {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
};

let sharedCtx: AudioContext | null = null;
let activeNodes: AudioNode[] = [];

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AC();
  }
  return sharedCtx;
}

function playTone(ctx: AudioContext, tone: Tone, master: GainNode) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = tone.type ?? 'triangle';
  osc.frequency.value = tone.freq;
  const peak = tone.gain ?? 0.18;
  const t0 = ctx.currentTime + tone.start;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + tone.dur + 0.02);
  activeNodes.push(osc, env);
}

/** Soft percussion click (guiro/woodblock vibe). */
function playClick(ctx: AudioContext, start: number, master: GainNode, bright = false) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = bright ? 880 : 220;
  const t0 = ctx.currentTime + start;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(bright ? 0.08 : 0.12, t0 + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.1);
  activeNodes.push(osc, env);
}

export function stopVictoryJingle() {
  for (const node of activeNodes) {
    try {
      node.disconnect();
    } catch {
      /* ignore */
    }
  }
  activeNodes = [];
}

/**
 * ~2.2s upbeat original fanfare with syncopated pulse.
 * Style cue: festive Caribbean celebration — original notes only.
 */
export async function playVictoryJingle(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;

  stopVictoryJingle();

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  activeNodes.push(master);

  // Syncopated rhythmic bed (clave-ish feel, original)
  const pulse = [0, 0.28, 0.42, 0.7, 0.98, 1.12, 1.4, 1.68];
  for (const t of pulse) playClick(ctx, t, master, t % 0.7 < 0.05);

  // Melodic fanfare (C major-ish festive rise) — original composition
  const melody: Tone[] = [
    { freq: 392.0, start: 0.0, dur: 0.22, type: 'triangle', gain: 0.2 }, // G4
    { freq: 493.88, start: 0.2, dur: 0.22, type: 'triangle', gain: 0.2 }, // B4
    { freq: 587.33, start: 0.4, dur: 0.28, type: 'triangle', gain: 0.22 }, // D5
    { freq: 659.25, start: 0.7, dur: 0.35, type: 'sawtooth', gain: 0.12 }, // E5
    { freq: 783.99, start: 1.05, dur: 0.45, type: 'triangle', gain: 0.24 }, // G5
    { freq: 987.77, start: 1.45, dur: 0.55, type: 'triangle', gain: 0.2 }, // B5
    { freq: 1174.7, start: 1.7, dur: 0.5, type: 'sine', gain: 0.14 }, // D6 sparkle
  ];

  for (const tone of melody) playTone(ctx, tone, master);

  // Light harmony under the last hit
  playTone(
    ctx,
    {
      freq: 523.25,
      start: 1.45,
      dur: 0.7,
      type: 'sine',
      gain: 0.08,
    },
    master,
  );
}
