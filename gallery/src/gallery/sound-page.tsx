/**
 * #device/sound (plans/021, phase 1): Device's four voices, to hear and to tune by ear. A page of the gallery's own in
 * Device's world, drawn by world-site.tsx, never a component page: it has no wall tile and is in no world's gallery view.
 *
 * - The four voices, each on a labelled key: Key (down on press, up on release), Switch, Notch and Digit. A voice
 *   sounds only in answer to the hand on its key (sound.ts: a trusted pointerdown or keydown in the last 300ms), and
 *   not at all while the top row's Mute is on.
 * - Tune by ear: each voice's pitch, length and level, from tokens.css, on a slider each; letting go of a slider plays
 *   the voice with the new value. Nothing here is saved: the lines under it are what to paste into tokens.css (Device's
 *   block), where a voice changes and nowhere else (plan 021, STOP). The sliders stop at check 17's bounds.
 * - Nothing sounds on arrival, and nothing here moves on its own.
 */
import { useCallback, useEffect, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Slider } from "@/components/slider";
import { readVoice, SOUND_LIMITS, useSound, VOICES, type VoiceName, type VoiceValues } from "@/motion/sound";
import { CodeBlock } from "./docs/code-block";
import { PageTitle, QUIET_HEADING, Stage } from "./kit";

type Values = Record<VoiceName, VoiceValues>;

/** Each tunable voice: its name, what it is, and its pitch slider's range in Hz. */
const TUNE: { id: VoiceName; name: string; what: string; pitch: [min: number, max: number, step: number] }[] = [
  { id: "key-down", name: "Key, down", what: "A low thock with a little body, and the contact.", pitch: [80, 400, 5] },
  { id: "key-up", name: "Key, up", what: "The key coming back: lighter, higher, quieter.", pitch: [150, 800, 10] },
  { id: "switch", name: "Switch", what: "Two tiny clicks 16ms apart, the second lower.", pitch: [300, 1600, 10] },
  { id: "notch", name: "Notch", what: "A slider's detent: a few milliseconds of noise and a falling blip.", pitch: [1200, 6000, 50] },
  { id: "digit", name: "Digit", what: "The contact, then a short triangle beep behind the glass. A code rises 0.018 a digit.", pitch: [400, 2000, 10] },
];

const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

function readAll(): Values | null {
  const out: Partial<Values> = {};
  for (const v of VOICES) {
    const values = readVoice(v);
    if (!values) return null;
    out[v] = values;
  }
  return out as Values;
}

/** The voice's lines for tokens.css, each marked where it differs from the file. */
function cssOf(values: Values, tokens: Values): string {
  const unit = { pitch: "Hz", length: "ms", level: "" } as const;
  return VOICES.flatMap((v) =>
    (["pitch", "length", "level"] as const).map((part) => {
      const line = `--sound-${v}-${part}: ${values[v][part]}${unit[part]};`;
      return values[v][part] === tokens[v][part] ? line : `${line} /* tokens.css: ${tokens[v][part]}${unit[part]} */`;
    }),
  ).join("\n");
}

/**
 * A key that plays a voice: on the hand going down (a press, or Enter or Space), and for the key's own voice its up on
 * the hand coming up.
 */
function VoiceKey({ down, up, label, name, values, size = "lg" }: { down: VoiceName; up?: VoiceName; label: ReactNode; name?: string; values?: Values; size?: "sm" | "lg" }) {
  const { play } = useSound();
  const sound = useCallback((v: VoiceName) => play(v, values ? { values: values[v] } : undefined), [play, values]);
  return (
    <Button
      size={size}
      aria-label={name}
      onPointerDown={(e: PointerEvent) => e.button === 0 && sound(down)}
      onPointerUp={(e: PointerEvent) => up && e.button === 0 && sound(up)}
      onKeyDown={(e: KeyboardEvent) => !e.repeat && (e.key === "Enter" || e.key === " ") && sound(down)}
      onKeyUp={(e: KeyboardEvent) => up && (e.key === "Enter" || e.key === " ") && sound(up)}
    >
      {label}
    </Button>
  );
}

function Tuner({ voice, values, onChange }: { voice: (typeof TUNE)[number]; values: Values; onChange: (part: keyof VoiceValues, n: number) => void }) {
  const { play } = useSound();
  const v = values[voice.id];
  /* The committed value, not the render's: the slider commits before the change has drawn. */
  const hear = (part: keyof VoiceValues) => (n: number) => play(voice.id, { values: { ...v, [part]: n } });
  const [min, max, step] = voice.pitch;
  return (
    <section aria-labelledby={`tune-${voice.id}`} className="grid content-start gap-4 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="grid gap-1">
          <h3 id={`tune-${voice.id}`} className="text-h4 text-fg">
            {voice.name}
          </h3>
          <p className="max-w-(--measure) text-small text-fg-muted">{voice.what}</p>
        </div>
        <VoiceKey down={voice.id} label="Hear" name={`Hear ${voice.name.toLowerCase()}`} values={values} size="sm" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Slider label="Pitch" min={min} max={max} step={step} value={v.pitch} home={null} formatValue={(n) => `${n} Hz`} onValueChange={(n) => onChange("pitch", n)} onValueCommit={hear("pitch")} />
        <Slider label="Length" min={2} max={SOUND_LIMITS.length} step={1} value={v.length} home={null} formatValue={(n) => `${n} ms`} onValueChange={(n) => onChange("length", n)} onValueCommit={hear("length")} />
        <Slider label="Level" min={-48} max={SOUND_LIMITS.level} step={1} value={v.level} home={null} formatValue={(n) => `${minus(n)} dBFS`} onValueChange={(n) => onChange("level", n)} onValueCommit={hear("level")} />
      </div>
    </section>
  );
}

export function SoundPage() {
  const { muted } = useSound();
  const [tokens, setTokens] = useState<Values | null>(null);
  const [values, setValues] = useState<Values | null>(null);
  useEffect(() => {
    const read = readAll();
    setTokens(read);
    setValues(read);
  }, []);
  const change = (voice: VoiceName) => (part: keyof VoiceValues, n: number) => setValues((all) => (all ? { ...all, [voice]: { ...all[voice], [part]: n } } : all));
  const changed = !!values && !!tokens && JSON.stringify(values) !== JSON.stringify(tokens);

  return (
    <article aria-labelledby="page-sound" className="grid gap-12 pb-24">
      <PageTitle id="page-sound" title="Sound" lede="Device answers a key, in four voices." />

      <Stage title="The four voices" caption="Key, Switch, Notch and Digit, each on its own key.">
        <div className="grid justify-items-center gap-6">
          <div role="group" aria-label="Voices" className="flex flex-wrap justify-center gap-4">
            <VoiceKey down="key-down" up="key-up" label="Key" />
            <VoiceKey down="switch" label="Switch" />
            <VoiceKey down="notch" label="Notch" />
            <VoiceKey down="digit" label="Digit" />
          </div>
          <p className="max-w-(--measure) text-center text-small text-fg-muted">
            {muted ? "Muted. Turn Mute off in the top row, or press M, to hear them." : "Press a key to hear its voice. Key sounds going down and coming up."}
          </p>
        </div>
      </Stage>

      <section aria-labelledby="sound-about" className="grid content-start gap-4">
        <h2 id="sound-about" className={QUIET_HEADING}>
          About
        </h2>
        <p className="max-w-(--measure) text-small text-fg-muted">
          Synthesized with Web Audio, nothing loaded: a few milliseconds of filtered noise for the mechanism and a short tone for the body, after the
          components repo. Only Device sounds, and only in answer to a hand: nothing plays on arrival or on its own, and a browser keeps the first press
          silent until it has unlocked audio. Sound starts on; Mute in the top row, or M, turns it off for this browser.
        </p>
      </section>

      <section aria-labelledby="sound-tune" className="grid content-start gap-6">
        <div className="grid gap-4">
          <h2 id="sound-tune" className={QUIET_HEADING}>
            Tune by ear
          </h2>
          <p className="max-w-(--measure) text-small text-fg-muted">
            Each voice is a pitch, a length to the end of its longest envelope, and a level, its peak in dBFS, read from tokens.css. Let go of a slider to
            hear the voice. Nothing here is saved: paste the lines below into Device's block in tokens.css.
          </p>
        </div>
        {values &&
          TUNE.map((voice) => <Tuner key={voice.id} voice={voice} values={values} onChange={change(voice.id)} />)}
      </section>

      {values && tokens && (
        <section aria-labelledby="sound-tokens" className="grid content-start gap-4">
          <h2 id="sound-tokens" className={QUIET_HEADING}>
            Tokens
          </h2>
          <CodeBlock code={cssOf(values, tokens)} lang="shell" label="Device's voice in tokens.css" />
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm" variant="ghost" disabled={!changed} onClick={() => setValues(tokens)}>
              Back to tokens.css
            </Button>
            <p className="text-small text-fg-subtle">{changed ? "Changed here, not in tokens.css." : "As tokens.css has them."}</p>
          </div>
        </section>
      )}
    </article>
  );
}
