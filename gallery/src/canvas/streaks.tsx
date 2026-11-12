/**
 * Long exposures: candidate pictures for Flat, moving, on the language canvas (proposals/long-exposures.md). The
 * picture is Nick's own, from Gradient Keys in the components repo (github.com/litterthanlit/components,
 * src/registry/components/gradient-keys.tsx): a camera swung through foliage with the shutter open, in a traditional
 * Japanese palette. Streaks fan from a root outside the frame, the fan keeps turning while the streaks flow along it,
 * and the sum runs through five stops in linear light under a little grain. One number, strength, gives it more
 * presence; at strength 0, in the first cut, it is Gradient Keys' picture exactly.
 *
 * Nick, on the first wall of it: "I only like long exposure, especially the ones of the bottom, if we could variate
 * from them would be sick." So it varies three ways, all the same long exposure:
 * - palettes (streaks-palettes.ts): the bold pigments and journeys first, the soft five from Gradient Keys last;
 * - pairs: one palette at the fan's root and another at its tips, the palette sweep held along the streaks;
 * - cuts (streaks-cuts.ts): the fan framed differently, its root moved and Gradient Keys' numbers scaled.
 * This is an experiment, not a component: what Nick picks becomes Flat's pictures in a later change, and these files
 * go with the canvas.
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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Slider } from "@/components/slider";
import { useMotionDial } from "@/motion";
import { CUTS, cutById, type Cut } from "./streaks-cuts";
import { EXPOSURES, PAIRS, PALETTES, pairName, paletteById, type Exposure, type PaletteGroup, type Stops } from "./streaks-palettes";
import { attach, type FieldHandle } from "./streaks-renderer";

/* --- StreakField ----------------------------------------------------------- */

/** Fifteen floats, the five stops as 0–1 RGB. */
const toStops = (palette: Stops) => palette.flatMap((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

type StreakFieldProps = {
  /** Names the field for the checks (`data-streaks`). */
  id: string;
  /** A new palette sweeps in over 600ms, without restarting the field. For a pair, the palette at the fan's root. */
  palette: Stops;
  /** Names the palette for the checks (`data-palette`). */
  paletteId: string;
  /** For a pair, the palette at the fan's tips; the root's palette gives way to it along the streaks. */
  tips?: Stops;
  /** Names the tips' palette for the checks (`data-palette-to`). */
  tipsId?: string;
  /** How the fan is framed. A new cut dissolves in over 600ms. */
  cut?: Cut;
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
export function StreakField({ id, palette, paletteId, tips, tipsId, cut = CUTS[0]!, seed = 0, strength = 0, paused = false, hand = false }: StreakFieldProps) {
  const { reduced } = useMotionDial();
  const hostRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FieldHandle | null>(null);
  // The stops as strings, so a new array with the same colours is no change.
  const stops = palette.join(",");
  const tipStops = (tips ?? palette).join(",");
  const settings = { stops: toStops(palette), tips: toStops(tips ?? palette), cut, seed, strength, paused, reduced };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Attached once: a new palette, pair, cut or pause updates the field in place, so it never restarts.
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
  }, [stops, tipStops, cut, seed, strength, paused, reduced]);

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

  // Without WebGL: the root's darks running into the tips' lights.
  const still = tips ? [...palette.slice(0, 3), ...tips.slice(2)] : palette;
  return (
    <span
      ref={hostRef}
      aria-hidden="true"
      data-streaks={id}
      data-field="fan"
      data-cut={cut.id}
      data-palette={paletteId}
      data-palette-to={tipsId}
      className="block size-full"
      style={{ background: `linear-gradient(60deg, ${still.join(", ")})` }}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </span>
  );
}

/* --- The canvas pieces ----------------------------------------------------- */

type PrintProps = {
  id: string;
  exposure: Exposure;
  /** For a pair, the palette at the fan's tips. */
  tips?: Exposure;
  cut?: Cut;
  /** Width over height. */
  ratio: number;
  strength: number;
  paused: boolean;
  hand?: boolean;
  /** The seed, when it should not be the palette's own. */
  seed?: number;
};

/** What a frame shows, for screen readers: the cut, and the palette or the pair. */
const describe = (cut: Cut, exposure: Exposure, tips?: Exposure) =>
  tips ? `A long exposure, ${cut.name} cut, in ${exposure.name} into ${tips.name}` : `A long exposure, ${cut.name} cut, in ${exposure.name}: ${exposure.note}`;

/** A field in a frame, named for screen readers by its cut and its palette or pair. */
function Print({ id, exposure, tips, cut = CUTS[0]!, ratio, strength, paused, hand = false, seed = exposure.seed }: PrintProps) {
  return (
    <div role="img" aria-label={describe(cut, exposure, tips)} className="relative isolate w-full overflow-hidden rounded-surface" style={{ aspectRatio: String(ratio) }}>
      <StreakField
        id={id}
        palette={exposure.palette}
        paletteId={exposure.id}
        tips={tips?.palette}
        tipsId={tips?.id}
        cut={cut}
        seed={seed}
        strength={strength}
        paused={paused}
        hand={hand}
      />
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

function Caption({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <figcaption className="grid gap-0.5">
      <span className="text-small font-title text-fg">{title}</span>
      <span className="text-caption font-normal text-fg-subtle">{children}</span>
    </figcaption>
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
            <Caption title={exposure.name}>{exposure.note}</Caption>
          </figure>
        ))}
      </div>
      <div>
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="exposures" />
      </div>
    </div>
  );
}

const GROUPS: { group: PaletteGroup; title: string }[] = [
  { group: "pigment", title: "Pigments, at full strength" },
  { group: "journey", title: "Journeys, through more than one hue" },
  { group: "soft", title: "Soft, as in Gradient Keys" },
];

/** Every palette as a print, at strength 1, in the first cut: the bold groups first. */
export function StreakPalettes() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-8">
      {GROUPS.map(({ group, title }) => (
        <section key={group} aria-label={title} className="grid gap-4">
          <h3 className="text-small font-title text-fg">{title}</h3>
          <div className="grid grid-cols-5 gap-5">
            {PALETTES.filter((e) => e.group === group).map((exposure) => (
              <figure key={exposure.id} className="m-0 grid content-start gap-3">
                <Print id={`palette-${exposure.id}`} exposure={exposure} ratio={0.8} strength={1} paused={paused} />
                <Caption
                  title={
                    <>
                      {exposure.name} <span lang="ja">{exposure.kanji}</span>
                    </>
                  }
                >
                  {exposure.note}
                </Caption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <div>
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="palettes" />
      </div>
    </div>
  );
}

/** Every pair, at strength 1, in the first cut: the root's palette giving way to the tips' along the streaks. */
export function StreakPairs() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-4 gap-5">
        {PAIRS.map((pair) => {
          const root = paletteById(pair.root);
          const tips = paletteById(pair.tips);
          return (
            <figure key={pair.id} className="m-0 grid content-start gap-3">
              <Print id={`pair-${pair.id}`} exposure={root} tips={tips} ratio={0.8} strength={1} paused={paused} seed={pair.seed ?? root.seed} />
              <Caption title={pairName(pair)}>{pair.kind === "melt" ? "Neighbours that melt" : "Opposites that clash"}</Caption>
            </figure>
          );
        })}
      </div>
      <div>
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="pairs" />
      </div>
    </div>
  );
}

/** Each cut in the bold palette that suits it best. */
const SUITS: Record<string, string> = { pan: "beni", sweep: "gunjo", fall: "moegi", burst: "hanabi", close: "momiji" };

/** Every cut, at strength 1, each in a bold palette that suits it. */
export function StreakCuts() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-5 gap-5">
        {CUTS.map((cut) => {
          const exposure = paletteById(SUITS[cut.id] ?? "beni");
          return (
            <figure key={cut.id} className="m-0 grid content-start gap-3">
              <Print id={`cut-${cut.id}`} exposure={exposure} cut={cut} ratio={0.8} strength={1} paused={paused} />
              <Caption title={cut.name}>
                {cut.note}. In {exposure.name}.
              </Caption>
            </figure>
          );
        })}
      </div>
      <div>
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} what="cuts" />
      </div>
    </div>
  );
}

const strengthText = (v: number) => (v === 0 ? "As in Gradient Keys" : `${Math.round(v * 100)}%`);

function Picker<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; name: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="w-24 text-caption text-fg-subtle">{label}</span>
      {options.map((o) => (
        <Button key={o.id} size="sm" variant={o.id === value ? "secondary" : "ghost"} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.name}
        </Button>
      ))}
    </div>
  );
}

const NONE = "none";

/** Flat's hero picture, 2.4 to 1: the grey plate it is today, and a long exposure in its place, in any cut, palette or pair. */
export function StreakHero() {
  const [paused, setPaused] = useState(false);
  const [hand, setHand] = useState(false);
  const [cutId, setCutId] = useState("pan");
  const [picked, setPicked] = useState("yuyake");
  const [second, setSecond] = useState(NONE);
  const [strength, setStrength] = useState(1);
  const exposure = paletteById(picked);
  const tips = second === NONE ? undefined : paletteById(second);
  const cut = cutById(cutId);
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
          {/* One field for every cut, palette and pair: a new one comes in, the field does not restart. Its seed stays Ai's. */}
          <Print id="hero" exposure={exposure} tips={tips} cut={cut} seed={1} ratio={2.4} strength={strength} paused={paused} hand={hand} />
          <figcaption className="text-small text-fg-subtle">
            As a long exposure: {cut.name}, in {tips ? `${exposure.name} into ${tips.name}` : exposure.name}
          </figcaption>
        </figure>
      </div>
      <div className="grid gap-3">
        <Picker label="Cut" options={CUTS} value={cutId} onChange={setCutId} />
        <Picker label="Palette" options={PALETTES} value={picked} onChange={setPicked} />
        <Picker label="Into" options={[{ id: NONE, name: "None" }, ...PALETTES]} value={second} onChange={setSecond} />
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
