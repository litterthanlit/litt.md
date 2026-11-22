/**
 * Device's voice (plans/021; litt-principles.md, Device: "Sound answers a key"). A key's click, a switch's clack, a
 * slider's notch and a code digit's beep, after the components repo's src/lib/sound.ts: synthesized with Web Audio,
 * nothing loaded, quiet and dry, and only in answer to a hand.
 *
 *   const { play } = useSound();
 *   <button onPointerDown={() => play("key-down")} onPointerUp={() => play("key-up")}>
 *
 * - The values live in tokens.css, under Device (each voice's pitch, length and level tokens), so a voice is tuned
 *   there and nowhere else, and check.mjs (check 17) bounds them: a level at most -12 dBFS, a length at most 120ms.
 *   Pitch is the voice's body in Hz, length runs to the end of its longest envelope, and level is its peak in dBFS.
 *   This file keeps only each voice's shape: its layers as the reference draws them at the reference's pitch and
 *   length, which the tokens scale (every frequency by pitch, every time by length) and the level sets loud.
 * - A hand, or nothing: `play(name)` does nothing unless a trusted pointerdown or keydown happened in the last 300ms
 *   (HAND_MS). So nothing sounds on load, on arrival, from a timer or from Play on a player (R4 holds for the ear).
 * - One AudioContext, made by the first play (which is inside a gesture, so the browser lets it run) and resumed there.
 *   Silent before the first press: a browser keeps audio locked until a gesture, so the first press unlocks and plays.
 * - Only Device: `useSound()` reads the world (useMaterial) and the mute (SoundProvider), and its play is a no-op
 *   anywhere but Device or while muted. Device starts with sound on (Nick, 2026-11-16: "start with sound for device");
 *   the gallery keeps a viewer's mute in its own top row, and a host app passes `<SoundProvider muted>`.
 * - The bus is dry and linear: no room and no compressor, so a voice peaks at its level token (a compressor in the
 *   path pulled a -18 dBFS key 9 dB down in Chromium, and the token would no longer say what you hear). Levels stop at
 *   -12 dBFS and at most four voices sound at once, so even four peaks landing together stay under full scale. On a
 *   touch screen the bus sits 2.5 dB lower, as the reference's does. A voice repeated faster than its gap is dropped,
 *   not queued. Nothing sounds while the tab is hidden.
 * - `renderVoice()` draws the same voice into an OfflineAudioContext, for tests and for listening without the page.
 */
import { createContext, createElement, useCallback, useContext, type ReactNode } from "react";
import { useMaterial } from "./deal";

/** Device's voices: a key going down and coming back up, a switch, a slider's notch and a code digit. */
export type VoiceName = "key-down" | "key-up" | "switch" | "notch" | "digit";
export const VOICES: readonly VoiceName[] = ["key-down", "key-up", "switch", "notch", "digit"];

/** A voice's tokens: its body's pitch in Hz, its length in ms and its peak level in dBFS. */
export type VoiceValues = { pitch: number; length: number; level: number };

/** The bounds check.mjs (check 17) holds the tokens to; a value past them is clamped here too. Change both together. */
export const SOUND_LIMITS = { level: -12, length: 120 } as const;

/** How recent a hand must be for a voice to sound, in ms. */
export const HAND_MS = 300;

export type PlayOptions = {
  /** Multiplies the voice's pitch, e.g. 1.05 to vary a repeated notch or rise with a digit. Default 1. */
  pitch?: number;
  /** Multiplies the voice's level (0 to 1). Default 1. */
  gain?: number;
  /** Values to play instead of the tokens', for tuning by ear (#device/sound). */
  values?: Partial<VoiceValues>;
  /** Element to read Device's voice tokens from when Device is nested inside another world; defaults to <html>. */
  root?: Element | null;
};

/* ------------------------------------------------------------------------ */
/* Synthesis. Works on any BaseAudioContext, so a voice renders offline too. */
/* ------------------------------------------------------------------------ */

const SILENT = 0.0001;
/** Touch screens: about -2.5 dB (the reference's). */
const TOUCH_TRIM = 0.75;

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** One second of white noise per context, from a fixed seed, so a render is the same every time. */
function noiseBuffer(ctx: BaseAudioContext) {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x2f6b4a1d;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = (seed / 0x100000000) * 2 - 1;
    }
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

type NoiseLayer = { at?: number; filter: BiquadFilterType; freq: number; q?: number; peak: number; attack?: number; decay: number };
type ToneLayer = { at?: number; type?: OscillatorType; freq: number; freqTo?: number; glide?: number; peak: number; attack?: number; decay: number; lowpass?: number };

/**
 * One sounding voice: its layers on their own gain node, scheduled from `t0`. `f` scales every frequency (the pitch
 * token over the shape's pitch) and `k` every time (the length token over the shape's length). Every node is
 * disconnected when the last source ends.
 */
class Voice {
  private nodes: AudioNode[] = [];
  private last: AudioScheduledSourceNode | null = null;
  end = 0;
  readonly output: GainNode;

  constructor(
    private ctx: BaseAudioContext,
    destination: AudioNode,
    private t0: number,
    private f: number,
    private k: number,
    gain: number,
    private offset: () => number,
  ) {
    this.output = ctx.createGain();
    this.output.gain.value = gain;
    this.output.connect(destination);
    this.nodes.push(this.output);
  }

  private envelope(start: number, peak: number, attack: number, decay: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(SILENT, start + attack + decay);
    g.gain.setValueAtTime(0, start + attack + decay);
    this.nodes.push(g);
    return g;
  }

  private schedule(source: AudioScheduledSourceNode, start: number, stop: number, offset?: number) {
    if (offset !== undefined && source instanceof AudioBufferSourceNode) source.start(start, offset);
    else source.start(start);
    source.stop(stop);
    this.nodes.push(source);
    if (stop - this.t0 >= this.end) {
      this.end = stop - this.t0;
      this.last = source;
    }
  }

  noise({ at = 0, filter, freq, q = 1, peak, attack = 0.0004, decay }: NoiseLayer) {
    const [a, d] = [attack * this.k, decay * this.k];
    const start = this.t0 + at * this.k;
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer(this.ctx);
    const filt = this.ctx.createBiquadFilter();
    filt.type = filter;
    filt.Q.value = q;
    filt.frequency.value = freq * this.f;
    this.nodes.push(filt);
    src.connect(filt).connect(this.envelope(start, peak, a, d)).connect(this.output);
    this.schedule(src, start, start + a + d + 0.005, this.offset());
  }

  tone({ at = 0, type = "sine", freq, freqTo, glide, peak, attack = 0.0008, decay, lowpass }: ToneLayer) {
    const [a, d] = [attack * this.k, decay * this.k];
    const start = this.t0 + at * this.k;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * this.f, start);
    if (freqTo) osc.frequency.exponentialRampToValueAtTime(freqTo * this.f, start + (glide ?? attack + decay) * this.k);
    let node: AudioNode = osc;
    if (lowpass) {
      const filt = this.ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.Q.value = 0.5;
      filt.frequency.value = lowpass * this.f;
      this.nodes.push(filt);
      node = osc.connect(filt);
    }
    node.connect(this.envelope(start, peak, a, d)).connect(this.output);
    this.schedule(osc, start, start + a + d + 0.005);
  }

  /** A short, bright contact click: the mechanism. */
  click(at: number, freq: number, peak: number, decay = 0.004) {
    this.noise({ at, filter: "bandpass", freq, q: 1.2, peak, attack: 0.0003, decay });
  }

  done() {
    const nodes = this.nodes;
    const cleanup = () => {
      for (const n of nodes) {
        try {
          n.disconnect();
        } catch {
          /* already gone */
        }
      }
    };
    if (this.last) this.last.onended = cleanup;
    else cleanup();
    return this;
  }
}

/**
 * Each voice's shape: its layers as the reference (components, src/lib/sound.ts) draws them, at the pitch and length
 * the tokens are measured against, and `unit`, its peak in dBFS at gain 1 (measured with renderVoice's `raw`,
 * from the seeded noise), which turns the level token into a gain. A change to a shape changes
 * its unit: render it raw and write the new peak here.
 */
const SHAPES: Record<VoiceName, { pitch: number; length: number; unit: number; draw: (v: Voice) => void }> = {
  /* The reference's press: a low thock with a little body (175 Hz falling to 105), plus the contact. */
  "key-down": {
    pitch: 175,
    length: 46,
    unit: -1.6,
    draw(v) {
      v.noise({ filter: "lowpass", freq: 1100, q: 0.9, peak: 1.1, attack: 0.0008, decay: 0.028 });
      v.tone({ freq: 175, freqTo: 105, glide: 0.03, peak: 0.6, attack: 0.001, decay: 0.045 });
      v.click(0, 2800, 0.5, 0.003);
    },
  },
  /* The reference's release: the same key coming up, lighter, higher and quieter. */
  "key-up": {
    pitch: 320,
    length: 12.8,
    unit: -11.1,
    draw(v) {
      v.click(0, 3600, 0.9, 0.005);
      v.tone({ type: "triangle", freq: 1100, freqTo: 900, peak: 0.08, decay: 0.01 });
      v.tone({ freq: 320, peak: 0.16, decay: 0.012 });
    },
  },
  /* The reference's toggle: two tiny clicks 16ms apart, the second lower. */
  switch: {
    pitch: 700,
    length: 24.8,
    unit: -10.5,
    draw(v) {
      v.click(0, 4500, 0.9, 0.0035);
      v.tone({ freq: 700, peak: 0.12, decay: 0.006 });
      v.click(0.016, 3000, 0.75, 0.004);
      v.tone({ at: 0.016, freq: 520, peak: 0.12, decay: 0.008 });
    },
  },
  /* The reference's tick, one detent: band-passed noise and a falling blip. A notch rises with the value by pitch. */
  notch: {
    pitch: 2900,
    length: 6.3,
    unit: -4.1,
    draw(v) {
      v.click(0, 5200, 1.2, 0.005);
      v.tone({ freq: 2900, freqTo: 2400, peak: 0.16, attack: 0.0003, decay: 0.006 });
    },
  },
  /* A digit behind the glass: the tick's contact, then a short triangle beep at A5, low-passed, as the reference's
     transport confirms (start). The one-time code rises with the digit by pitch (0.9 + n × 0.018, its pitchOf). */
  digit: {
    pitch: 880,
    length: 53,
    unit: -9.6,
    draw(v) {
      v.click(0, 5200, 0.8, 0.004);
      v.tone({ type: "triangle", freq: 880, peak: 0.35, attack: 0.003, decay: 0.05, lowpass: 2600 });
    },
  },
};

/** The bus: a trim (lower on a touch screen) straight to the speakers. */
function createBus(ctx: BaseAudioContext, destination: AudioNode, trim: number) {
  const input = ctx.createGain();
  input.gain.value = trim;
  input.connect(destination);
  return input;
}

const clamp = (n: number, min: number, max: number, fallback: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback);

function synthesize(ctx: BaseAudioContext, destination: AudioNode, when: number, name: VoiceName, values: VoiceValues, options: PlayOptions, offset: () => number, raw = false) {
  const shape = SHAPES[name];
  const level = Math.min(values.level, SOUND_LIMITS.level);
  const length = clamp(values.length, 1, SOUND_LIMITS.length, shape.length);
  const f = (values.pitch / shape.pitch) * clamp(options.pitch ?? 1, 0.25, 4, 1);
  const gain = raw ? 1 : Math.pow(10, (level - shape.unit) / 20) * clamp(options.gain ?? 1, 0, 1, 1);
  const voice = new Voice(ctx, destination, when, f, length / shape.length, gain, offset);
  shape.draw(voice);
  return voice.done();
}

/* ------------------------------------------------------------------------ */
/* The tokens.                                                               */
/* ------------------------------------------------------------------------ */

/** The exact custom property names for each voice, written out so the registry rewriter prefixes them for hosts. */
const VOICE_TOKENS: Record<VoiceName, readonly [pitch: string, length: string, level: string]> = {
  "key-down": ["--sound-key-down-pitch", "--sound-key-down-length", "--sound-key-down-level"],
  "key-up": ["--sound-key-up-pitch", "--sound-key-up-length", "--sound-key-up-level"],
  switch: ["--sound-switch-pitch", "--sound-switch-length", "--sound-switch-level"],
  notch: ["--sound-notch-pitch", "--sound-notch-length", "--sound-notch-level"],
  digit: ["--sound-digit-pitch", "--sound-digit-length", "--sound-digit-level"],
};

/** A voice's values from tokens.css (pitch, length and level), or null where Device has none. */
export function readVoice(name: VoiceName, root: Element | null = typeof document === "undefined" ? null : document.documentElement): VoiceValues | null {
  if (!root) return null;
  const cs = getComputedStyle(root);
  const [p, l, g] = VOICE_TOKENS[name];
  const values = {
    pitch: parseFloat(cs.getPropertyValue(p)),
    length: parseFloat(cs.getPropertyValue(l)),
    level: parseFloat(cs.getPropertyValue(g)),
  };
  return Number.isFinite(values.pitch) && Number.isFinite(values.length) && Number.isFinite(values.level) ? values : null;
}

/* ------------------------------------------------------------------------ */
/* A hand: the only thing that lets a voice through.                         */
/* ------------------------------------------------------------------------ */

let lastHand = -Infinity;
let installed = false;

/** Notes the time of every trusted pointerdown and keydown: a script's own events are not a hand. */
function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const hand = (e: Event) => {
    if (e.isTrusted) lastHand = performance.now();
  };
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener("pointerdown", hand, opts);
  window.addEventListener("keydown", hand, opts);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && ctx?.state === "running") ctx.suspend().catch(() => {});
  });
}
install();

/** Whether a hand was on the page in the last HAND_MS. */
export const handIsRecent = () => typeof performance !== "undefined" && performance.now() - lastHand <= HAND_MS;

/* ------------------------------------------------------------------------ */
/* Playback: one shared context, made and resumed inside the first gesture.  */
/* ------------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
const lastPlayed: Partial<Record<VoiceName, number>> = {};
const voiceEnds: number[] = [];
const MAX_VOICES = 4;
/** The shortest gap between two of the same voice, in ms; a call inside it is dropped. */
const MIN_GAP: Record<VoiceName, number> = { "key-down": 20, "key-up": 20, switch: 40, notch: 14, digit: 20 };

function isTouch() {
  try {
    return matchMedia("(hover: none) and (pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/** The shared context, made on first use (inside a gesture, since play needs a recent hand) and resumed there. */
function context(): AudioContext | null {
  if (ctx) {
    if (ctx.state === "closed") return null;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    bus = createBus(ctx, ctx.destination, isTouch() ? TOUCH_TRIM : 1);
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    ctx = null;
    bus = null;
    return null;
  }
}

/**
 * Plays a voice now. A no-op on the server, without a hand in the last 300ms, while the tab is hidden, or where the
 * tokens have no value for it (outside Device). It never throws and never blocks. Components call useSound's play,
 * which also keeps to Device and the mute.
 */
export function play(name: VoiceName, options: PlayOptions = {}): void {
  try {
    if (typeof window === "undefined" || !(name in SHAPES)) return;
    if (!handIsRecent() || document.visibilityState === "hidden") return;
    const tokens = readVoice(name, options.root ?? undefined);
    const values = tokens ? { ...tokens, ...options.values } : null;
    if (!values) return;
    const now = performance.now();
    const last = lastPlayed[name];
    if (last !== undefined && now - last < MIN_GAP[name]) return;
    const ac = context();
    if (!ac || !bus) return;
    const t = ac.currentTime;
    while (voiceEnds.length && voiceEnds[0]! <= t) voiceEnds.shift();
    if (voiceEnds.length >= MAX_VOICES) return;
    lastPlayed[name] = now;
    const buffer = noiseBuffer(ac);
    const voice = synthesize(ac, bus, t, name, values, options, () => Math.random() * (buffer.duration - 0.3));
    const end = t + voice.end;
    const i = voiceEnds.findIndex((e) => e > end);
    voiceEnds.splice(i === -1 ? voiceEnds.length : i, 0, end);
  } catch {
    /* sound is never worth an error */
  }
}

/**
 * Renders a voice offline through the same bus, for tests and for listening without the page: the rendered buffer
 * and the voice's designed length in seconds, or null where OfflineAudioContext is missing. `raw` renders it at gain 1
 * with no trim, to measure a shape's unit.
 */
export async function renderVoice(name: VoiceName, values: VoiceValues, options: PlayOptions & { sampleRate?: number; seconds?: number; raw?: boolean } = {}) {
  if (typeof OfflineAudioContext === "undefined") return null;
  const rate = options.sampleRate ?? 48000;
  const offline = new OfflineAudioContext(1, Math.ceil(rate * (options.seconds ?? 0.25)), rate);
  const destination = options.raw ? offline.destination : createBus(offline, offline.destination, 1);
  const voice = synthesize(offline, destination, 0, name, values, options, () => 0, options.raw);
  const buffer = await offline.startRendering();
  return { buffer, length: voice.end };
}

/* ------------------------------------------------------------------------ */
/* React: the mute, and a play that keeps to Device.                         */
/* ------------------------------------------------------------------------ */

const SoundContext = createContext<{ muted: boolean }>({ muted: false });

/**
 * The mute for what is inside. Sound is on by default (Nick, 2026-11-16); a host app passes `muted` from its own
 * setting, and the gallery from a viewer's mute key.
 */
export function SoundProvider({ muted = false, children }: { muted?: boolean; children: ReactNode }) {
  return createElement(SoundContext.Provider, { value: { muted } }, children);
}

/**
 * `const { play, on } = useSound()`. play sounds only under Device (the nearest MaterialProvider's, else <html>'s) and
 * only while not muted; `on` says whether it would.
 */
export function useSound() {
  const material = useMaterial();
  const { muted } = useContext(SoundContext);
  const on = material === "device" && !muted;
  const sound = useCallback(
    (name: VoiceName, options?: PlayOptions) => {
      if (on) play(name, options);
    },
    [on],
  );
  return { play: sound, on, muted };
}
