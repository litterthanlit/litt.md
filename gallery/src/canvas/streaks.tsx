/**
 * Long exposures: candidate pictures for Flat, moving, on the language canvas (proposals/bokashi.md). The picture is
 * Nick's own, from Gradient Keys in the components repo (github.com/litterthanlit/components,
 * src/registry/components/gradient-keys.tsx): a camera swung through foliage with the shutter open, in a traditional
 * Japanese palette. Streaks fan from a point below and left of the frame, the fan keeps turning while the streaks
 * flow along it, and the sum runs through five stops in linear light under a little grain. Twelve palettes share its
 * ramp (streaks-palettes.ts), and one number, strength, gives it more presence. At strength 0 it is Gradient Keys'
 * picture exactly. This is an experiment, not a component: what Nick picks becomes Flat's pictures in a later
 * change, and these files go with the canvas.
 *
 * What differs from Gradient Keys, and why:
 * - It only streams by default. R2 says a gradient never follows the cursor, and the exception Nick chose for
 *   pictures covers moving on its own, not answering a hand. `hand` turns on what Gradient Keys does under a hand
 *   (the light, the quickening, the ring a press sends), so both can be felt on the canvas before Nick decides.
 * - It follows the gallery's motion dial: under reduced motion it draws one still frame. It is also still while it
 *   is off screen and while paused (WCAG 2.2.2). A picture moving on its own is not yet in the profile.
 * - It owns no WebGL context. One shared renderer (streaks-renderer.ts) draws every field on the page, so a wall of
 *   pictures costs one context, and each field sizes itself from its box on screen, as the canvas zooms.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Slider } from "@/components/slider";
import { useMotionDial } from "@/motion";
import { EXPOSURES, PALETTES, paletteById, type Exposure, type Stops } from "./streaks-palettes";
import { attach, type FieldHandle } from "./streaks-renderer";

/* --- StreakField ----------------------------------------------------------- */

/** Fifteen floats, the five stops as 0–1 RGB. */
const toStops = (palette: Stops) => palette.flatMap((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

type StreakFieldProps = {
  /** Names the field for the checks (`data-streaks`). */
  id: string;
  /** A new palette sweeps in over 600ms, without restarting the field. */
  palette: Stops;
  /** Names the palette for the checks (`data-palette`). */
  paletteId: string;
  seed?: number;
  /** 0 draws the fan exactly as Gradient Keys does; 1 gives it more presence. */
  strength?: number;
  /** Hold the motion where it stands. */
  paused?: boolean;
  /** Answer a hand as Gradient Keys does: light under the pointer, a quicker stream, a ring from a press. */
  hand?: boolean;
};

/**
 * A long exposure that fills its box: a 2D canvas the shared renderer (streaks-renderer.ts) draws into. It streams
 * only while it is on screen, not paused, and motion is allowed; otherwise it holds a still frame. Without WebGL it is
 * a still gradient of its palette.
 */
export function StreakField({ id, palette, paletteId, seed = 0, strength = 0, paused = false, hand = false }: StreakFieldProps) {
  const { reduced } = useMotionDial();
  const hostRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FieldHandle | null>(null);
  // The stops as one string, so a new array with the same colours is no change.
  const stops = palette.join(",");
  const settings = { stops: toStops(palette), seed, strength, paused, reduced };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Attached once: a new palette or a pause updates the field in place, so it never restarts.
  useEffect(() => {
    const handle = attach(hostRef.current!, canvasRef.current!, settingsRef.current);
    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.detach();
    };
  }, []);

  useEffect(() => {
    handleRef.current?.update({ ...settingsRef.current });
    // The stops by value: settings is a new object every render.
  }, [stops, seed, strength, paused, reduced]);

  useEffect(() => {
    const host = hostRef.current;
    if (!hand || !host) return;
    const at = (e: PointerEvent): [number, number] => {
      const box = host.getBoundingClientRect();
      return [e.clientX - box.left, e.clientY - box.top];
    };
    const onMove = (e: PointerEvent) => handleRef.current?.hand(at(e));
    const onLeave = () => handleRef.current?.hand(null);
    const onDown = (e: PointerEvent) => handleRef.current?.press(at(e));
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      handleRef.current?.hand(null);
    };
  }, [hand]);

  return (
    <span
      ref={hostRef}
      aria-hidden="true"
      data-streaks={id}
      data-field="fan"
      data-palette={paletteId}
      className="block size-full"
      style={{ background: `linear-gradient(60deg, ${palette.join(", ")})` }}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </span>
  );
}


/* --- The canvas pieces ----------------------------------------------------- */

type PrintProps = {
  id: string;
  exposure: Exposure;
  /** Width over height. */
  ratio: number;
  strength: number;
  paused: boolean;
  hand?: boolean;
  /** The seed, when it should not be the palette's own. */
  seed?: number;
};

/** A field in a frame, named for screen readers by its palette. */
function Print({ id, exposure, ratio, strength, paused, hand = false, seed = exposure.seed }: PrintProps) {
  return (
    <div
      role="img"
      aria-label={`A long exposure in ${exposure.name}: ${exposure.note}`}
      className="relative isolate w-full overflow-hidden rounded-surface"
      style={{ aspectRatio: String(ratio) }}
    >
      <StreakField id={id} palette={exposure.palette} paletteId={exposure.id} seed={seed} strength={strength} paused={paused} hand={hand} />
    </div>
  );
}

function PauseButton({ paused, onToggle, what }: { paused: boolean; onToggle: () => void; what: string }) {
  return (
    <Button size="sm" variant="ghost" aria-pressed={paused} onClick={onToggle}>
      {paused ? `Play the ${what}` : `Pause the ${what}`}
    </Button>
  );
}

/** The baseline: the fan as in Gradient Keys, strength 0, in the first five palettes, with one Pause for them all. */
export function StreakPrints() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-5 gap-5">
        {EXPOSURES.map((exposure) => (
          <figure key={exposure.id} className="m-0 grid content-start gap-3">
            <Print id={exposure.id} exposure={exposure} ratio={0.8} strength={0} paused={paused} />
            <figcaption className="grid gap-0.5">
              <span className="text-small font-title text-fg">{exposure.name}</span>
              <span className="text-caption font-normal text-fg-subtle">{exposure.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div>
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="exposures" />
      </div>
    </div>
  );
}

/** Every palette as a print, at strength 1. */
export function StreakPalettes() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-6 gap-5">
        {PALETTES.map((exposure) => (
          <figure key={exposure.id} className="m-0 grid content-start gap-3">
            <Print id={`palette-${exposure.id}`} exposure={exposure} ratio={0.8} strength={1} paused={paused} />
            <figcaption className="grid gap-0.5">
              <span className="text-small font-title text-fg">
                {exposure.name} <span lang="ja">{exposure.kanji}</span>
              </span>
              <span className="text-caption font-normal text-fg-subtle">{exposure.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div>
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="palettes" />
      </div>
    </div>
  );
}

const strengthText = (v: number) => (v === 0 ? "As in Gradient Keys" : `${Math.round(v * 100)}%`);

/** Flat's hero picture, 2.4 to 1: the grey plate it is today, and a long exposure in its place, in any palette. */
export function StreakHero() {
  const [paused, setPaused] = useState(false);
  const [hand, setHand] = useState(false);
  const [picked, setPicked] = useState("sakura");
  const [strength, setStrength] = useState(1);
  const exposure = paletteById(picked);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-6">
        <figure className="m-0 grid content-start gap-3">
          <div className="grid w-full place-items-center rounded-surface bg-surface-3 text-caption text-fg-muted" style={{ aspectRatio: "2.4" }}>
            Hero, Bakehouse Nord
          </div>
          <figcaption className="text-small text-fg-subtle">Today</figcaption>
        </figure>
        <figure className="m-0 grid content-start gap-3">
          {/* One field for every palette: a new one comes in, the field does not restart. Its seed stays Ai's. */}
          <Print id="hero" exposure={exposure} seed={1} ratio={2.4} strength={strength} paused={paused} hand={hand} />
          <figcaption className="text-small text-fg-subtle">
            As a long exposure in {exposure.name}
          </figcaption>
        </figure>
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {PALETTES.map((e) => (
            <Button key={e.id} size="sm" variant={e.id === picked ? "secondary" : "ghost"} aria-pressed={e.id === picked} onClick={() => setPicked(e.id)}>
              {e.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <Slider className="w-80" label="Strength" min={0} max={1} step={0.05} value={strength} onValueChange={setStrength} formatValue={strengthText} minLabel="As in Gradient Keys" maxLabel="Stronger" />
          <div className="flex flex-wrap items-center gap-2">
            <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="exposure" />
            <Button size="sm" variant="ghost" aria-pressed={hand} onClick={() => setHand((h) => !h)}>
              {hand ? "Stop following the hand" : "Follow the hand"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
