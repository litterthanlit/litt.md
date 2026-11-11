/**
 * Long exposures: candidate pictures for Flat, moving, compared on the canvas beside the bokashi skies
 * (proposals/bokashi.md). The field is Nick's own, from Gradient Keys in the components repo
 * (github.com/litterthanlit/components, src/registry/components/gradient-keys.tsx): a camera swung through foliage
 * with the shutter open, in a traditional Japanese palette. It is noise, not a picture. Streaks fan from a point below
 * and left of the frame, the fan keeps turning while the streaks flow along it, and the sum runs through five stops
 * in linear light under a little grain. The shaders (streaks-shaders.ts) are that file's, cut into shared parts and
 * otherwise unchanged, so the picture here is the picture there. This is an experiment, not a component: what Nick picks becomes Flat's pictures in a
 * later change, and this file goes with the canvas.
 *
 * What differs from Gradient Keys, and why:
 * - It only streams by default. R2 says a gradient never follows the cursor, and the exception Nick chose for
 *   pictures covers moving on its own, not answering a hand. `hand` turns on what Gradient Keys does under a hand
 *   (the light, the quickening, the ring a press sends), so both can be felt on the canvas before Nick decides.
 * - It follows the gallery's motion dial: under reduced motion it draws one still frame. It is also still while it
 *   is off screen and while paused (WCAG 2.2.2). A picture moving on its own is not yet in the profile.
 * - It owns no WebGL context. One shared renderer (streaks-renderer.ts) draws every field on the page, so a wall of
 *   pictures costs one context, and each field sizes itself from its box on screen, as the canvas zooms.
 * - The palettes are hex because a shader takes numbers. They are candidates under comparison, so each carries
 *   litt-allow, and the picked ones move into tokens.css.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { useMotionDial } from "@/motion";
import { attach, type FieldHandle } from "./streaks-renderer";
import type { FieldKind } from "./streaks-shaders";

/* --- Palettes -------------------------------------------------------------- */

/** Five sRGB hex stops, dark to light. Artwork, not tokens: the same in both themes. */
export type Palette = readonly [string, string, string, string, string];

export type Exposure = {
  id: string;
  name: string;
  note: string;
  palette: Palette;
  /** Picks the exposure: the same seed always opens on the same frame. */
  seed: number;
};

/* The first three are Gradient Keys' own, with their seeds. Sumi and Fuji are new here, in the same five steps. */
export const EXPOSURES: Exposure[] = [
  { id: "wakatake", name: "Wakatake", note: "Young bamboo", seed: 3, palette: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "ai", name: "Ai", note: "Indigo, fading to asagi", seed: 1, palette: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "sakura", name: "Sakura", note: "Cherry, fading to shell white", seed: 5, palette: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "sumi", name: "Sumi", note: "Ink, from full to paper. New here", seed: 7, palette: ["#2b2c30", "#55575d", "#8f9197", "#c8cacd", "#f0f0ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "fuji", name: "Fuji", note: "Wisteria. New here", seed: 9, palette: ["#463c69", "#6a5d94", "#9b8fc0", "#cbc3e0", "#f0ecf6"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
];

/* --- StreakField ----------------------------------------------------------- */

/** Fifteen floats, the five stops as 0–1 RGB. */
const toStops = (palette: Palette) => palette.flatMap((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

type StreakFieldProps = {
  /** Names the field for the checks (`data-streaks`). */
  id: string;
  /** Which picture: one of the kinds in streaks-shaders.ts. A new one fades in over 600ms. */
  field?: FieldKind;
  /** A new palette sweeps in over 600ms, without restarting the field. */
  palette: Palette;
  /** Names the palette for the checks (`data-palette`). */
  paletteId: string;
  seed?: number;
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
export function StreakField({ id, field = "fan", palette, paletteId, seed = 0, paused = false, hand = false }: StreakFieldProps) {
  const { reduced } = useMotionDial();
  const hostRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FieldHandle | null>(null);
  // The stops as one string, so a new array with the same colours is no change.
  const stops = palette.join(",");
  const settings = { kind: field, stops: toStops(palette), seed, paused, reduced };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Attached once: a new palette, kind or pause updates the field in place, so it never restarts.
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
  }, [field, stops, seed, paused, reduced]);

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
      data-field={field}
      data-palette={paletteId}
      className="block size-full"
      style={{ background: `linear-gradient(60deg, ${palette.join(", ")})` }}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </span>
  );
}

/* --- The canvas pieces ----------------------------------------------------- */

/** A field in a frame with a name. `ratio` is its width over its height. */
function Print({ id, exposure, ratio, paused, hand }: { id: string; exposure: Exposure; ratio: number; paused: boolean; hand: boolean }) {
  return (
    <div
      role="img"
      aria-label={`${exposure.name}: ${exposure.note}`}
      className="relative isolate w-full overflow-hidden rounded-surface"
      style={{ aspectRatio: String(ratio) }}
    >
      <StreakField id={id} palette={exposure.palette} paletteId={exposure.id} seed={exposure.seed} paused={paused} hand={hand} />
    </div>
  );
}

/** The five palettes in a row, as prints (4 to 5), with one button that pauses them all. */
export function StreakPrints() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-5 gap-5">
        {EXPOSURES.map((exposure) => (
          <figure key={exposure.id} className="m-0 grid content-start gap-3">
            <Print id={exposure.id} exposure={exposure} ratio={0.8} paused={paused} hand={false} />
            <figcaption className="grid gap-0.5">
              <span className="text-small font-title text-fg">{exposure.name}</span>
              <span className="text-caption font-normal text-fg-subtle">{exposure.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div>
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the exposures" : "Pause the exposures"}
        </Button>
      </div>
    </div>
  );
}

/** Flat's hero picture, 2.4 to 1: the grey plate it is today, and a long exposure in its place, in any palette. */
export function StreakHero() {
  const [paused, setPaused] = useState(false);
  const [hand, setHand] = useState(false);
  const [picked, setPicked] = useState("sakura");
  const exposure = EXPOSURES.find((e) => e.id === picked) ?? EXPOSURES[0]!;
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
          {/* One field for every palette: a new one sweeps in, the field does not restart. Its seed stays Ai's. */}
          <Print id="hero" exposure={{ ...exposure, seed: 1 }} ratio={2.4} paused={paused} hand={hand} />
          <figcaption className="text-small text-fg-subtle">As a long exposure: {exposure.name}</figcaption>
        </figure>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {EXPOSURES.map((e) => (
          <Button key={e.id} size="sm" variant={e.id === picked ? "secondary" : "ghost"} aria-pressed={e.id === picked} onClick={() => setPicked(e.id)}>
            {e.name}
          </Button>
        ))}
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the exposure" : "Pause the exposure"}
        </Button>
        <Button size="sm" variant="ghost" aria-pressed={hand} onClick={() => setHand((h) => !h)}>
          {hand ? "Stop following the hand" : "Follow the hand"}
        </Button>
      </div>
    </div>
  );
}
