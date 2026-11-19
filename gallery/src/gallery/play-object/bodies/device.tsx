/**
 * Device's object, the recorder: the components repo's player brought home (litterthanlit/components,
 * src/components/device/), landscape as the player is, drawn only from Device's materials (taste/litt-principles.md,
 * Device's materials; plans/018 and plans/024, Device, phase 4). Every part carries its data-part kind.
 *
 * - The frame (`frame`: --frame, lit by --frame-edge, cast by --object-cast) holds the body, the aluminium plate
 *   (`plate`: --canvas with its grain and --plate-edge).
 * - The screen sits across the top in a black, polished bezel (`bezel`: --bezel, --bezel-edge), with glass over it
 *   (`glass`: --glass-sheen, the light catching it). The screen holds the take alone: no rail. The set is on Home, behind
 *   Index and on the dial (body.rail is false).
 * - Under it, the tape (`tape`): the set laid end to end, one tick each (its height seeded from its id, so a take always
 *   prints the same), the current one strong with the red playhead on it. Press or drag along it to scrub.
 * - The deck: the readout, an LCD (`lcd`: --lcd, --lcd-edge, --field-ink) in a well (`well`: --tray, --tray-shade) that
 *   reads as a CD player's display: the chip (`chip`: a red lamp and PLAY while the set plays, the stop's square and STOP
 *   when not), the take's name, and the take as a track number, 05 / 12. And the dial: a cap (`cap`) in a collar
 *   (`collar`) that turns in 15° detents under the hand, a take a detent, with Previous and Next on its sides, Index on
 *   top (Home, as an iPod's Menu), Every component below (the world's gallery view) and Play at its centre, a key (`key`)
 *   in a well cut through the cap, that latches down while it plays. Keys, a pick and Play turn it too, so it always
 *   stands at the take showing. Radii nest: the well at --radius-well, the glass 4px in, the chip at --radius-chip.
 * - Orange is nowhere at rest; red is the playhead and the chip's lamp while Play runs.
 * - Things are mechanisms: the take, the playhead and the readout switch where they stand; only the dial travels, on the
 *   responsive spring (useSettle), and lands at once under reduced motion.
 * - The DOM puts the tape (the slider) and Play before the screen, so the keyboard meets the controls first; order puts
 *   the screen on top.
 * - Taken out, as repeats (the components repo's subtraction): the rail inside the screen (Home and the dial hold the
 *   set), the readout's group caption (Details says it) and the ring beside the count (the chip says it).
 * - Voice (plan 021): the dial ticks per detent (`notch`), the tape ticks on scrub and arrow keys (`notch`), and the
 *   keys (Play, Mute and the dial's four edges) click down and up (`key-down` / `key-up`). A hardware Mute key sits on
 *   the deck beside the dial, sharing `litt-gallery:sound` with the `M` shortcut and other Device pages. Play's timer
 *   never sounds.
 * - Left out, as the plan says: the player's Find and Options screens, and playing on load (Decision 6 is Nick's).
 */
import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useMotionValue } from "motion/react";
import { snap, useHand, useSettle } from "@/motion/hand";
import { useSound } from "@/motion/sound";
import { useMuted } from "../../mute";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";
import { useScrub } from "../scrub";

/** A take's level on the tape, 0.25 to 1, from its id: the same every visit. */
function level(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Math.round((0.25 + ((h >>> 0) % 1000) / 1333) * 100) / 100;
}

/* The press of a key, as Device's keys switch: three even steps on the instant tier. */
const STEP: CSSProperties = {
  transitionProperty: "transform, box-shadow, background-color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: "steps(3, end)",
};

/** Mechanical key sound handlers for a recorder button or link. */
function keyVoice(sound: ReturnType<typeof useSound>["play"]) {
  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button === 0) sound("key-down");
    },
    onPointerUp: (e: PointerEvent) => {
      if (e.button === 0) sound("key-up");
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (!e.repeat && (e.key === "Enter" || e.key === " ")) sound("key-down");
    },
    onKeyUp: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") sound("key-up");
    },
  };
}

/* ---------- the tape: the slider over the takes ---------- */

function Tape({ takes, at, selector, pick, className }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick"> & { className: string }) {
  const { play: sound } = useSound();
  const n = takes.length;
  const pickWithSound = (i: number) => {
    if (i !== at) sound("notch", { pitch: 0.9 + (i / Math.max(1, n - 1)) * 0.2 });
    pick(i);
  };
  const scrub = useScrub(n, pickWithSound);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End") {
      const p = at === null ? 0.5 : at / Math.max(1, n - 1);
      sound("notch", { pitch: 0.9 + p * 0.2 });
    }
    selector.onKeyDown?.(e);
  };
  return (
    <div
      {...selector}
      onKeyDown={onKeyDown}
      data-part="tape"
      onPointerDown={scrub}
      className={
        "relative cursor-ew-resize touch-pan-y rounded-control select-none " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        className
      }
    >
      {/* The baseline, printed on the body the full width. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-line" />
      <svg aria-hidden="true" viewBox={`0 0 ${n} 20`} preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 inset-y-3 h-[calc(100%-1.5rem)] w-full overflow-visible">
        {takes.map((t, i) => {
          const h = 2 + level(t.id) * 4;
          return (
            <line
              key={t.id}
              x1={i + 0.5}
              x2={i + 0.5}
              y1={10 - h}
              y2={10 + h}
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={i === at ? "text-fg" : "text-fg opacity-40"}
            />
          );
        })}
      </svg>
      {/* The playhead, in the signal red, on the take showing: it switches where it stands. On Home there is none. */}
      {at !== null && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-signal forced-colors:bg-[Highlight]" style={{ left: `${((at + 0.5) / n) * 100}%` }}>
          <span className="absolute -left-0.5 top-0 size-1.5 rounded-pill bg-signal forced-colors:bg-[Highlight]" />
        </span>
      )}
    </div>
  );
}

/* ---------- the readout: an LCD in a well ---------- */

function Readout({ readout, playing, compact = false, className }: Pick<PlayObjectBodyProps, "readout"> & { playing: boolean; compact?: boolean; className: string }) {
  const [now, of] = readout.count.split(" / ");
  return (
    <div {...readout.props} data-part="well" className={"flex min-w-0 rounded-well bg-tray p-1 shadow-(--tray-shade) forced-colors:border " + className}>
      <div
        data-part="lcd"
        className={
          "flex min-w-0 flex-1 items-center justify-between gap-6 rounded-[calc(var(--radius-well)-4px)] bg-field [background-image:var(--lcd)] text-field-ink shadow-(--lcd-edge) forced-colors:border " +
          (compact ? "px-3 py-2" : "px-5 py-3")
        }
      >
        <span className="grid min-w-0 justify-items-start gap-1.5">
          {/* The chip: the state, its glyph before its word. A red lamp while the set plays; the stop's square when not. */}
          <span data-part="chip" className="inline-flex items-center gap-1.5 rounded-chip bg-chip px-1.5 py-0.5 text-caption font-label text-chip-ink uppercase">
            {playing ? <span data-part="light" className="size-1.5 rounded-pill bg-signal forced-colors:bg-[CanvasText]" /> : <span className="size-1.5 bg-current" />}
            {playing ? "Play" : "Stop"}
          </span>{" "}
          <span className={"max-w-full truncate " + (compact ? "text-body" : "text-h3")}>{readout.title}</span>
        </span>{" "}
        <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
          <span className={compact ? "text-h3" : "text-display"}>{now}</span> <span className="text-small text-lcd-dim">/ {of}</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- Play: a key that latches down while it plays ---------- */

function PlayKey({ play, className, onDial = false }: { play: PlayObjectBodyProps["play"]; className: string; onDial?: boolean }) {
  const { play: sound } = useSound();
  const on = play["aria-pressed"];
  return (
    <button
      {...play}
      {...keyVoice(sound)}
      data-part="key"
      style={STEP}
      className={
        "grid cursor-pointer place-items-center rounded-pill " +
        (onDial
          ? "bg-dial text-dial-ink shadow-(--dial-lift) active:shadow-(--dial-press) aria-pressed:shadow-(--dial-press) "
          : "bg-block text-fg shadow-(--key-lift) active:shadow-(--block-press) aria-pressed:shadow-(--tray-shade) aria-pressed:bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] ") +
        "active:[transform:translateY(var(--press-depth))] aria-pressed:[transform:translateY(var(--press-depth))] " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border forced-colors:aria-pressed:border-[Highlight] " +
        className
      }
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
        {on ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
      </svg>
    </button>
  );
}

/* ---------- Mute: a latching hardware key on the deck ---------- */

function RecorderMute({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const [muted, setMuted] = useMuted();
  const { play: sound } = useSound();
  const button = (
    <button
      type="button"
      aria-label="Mute"
      aria-pressed={muted}
      aria-keyshortcuts="M"
      title={muted ? "Unmute (M)" : "Mute (M)"}
      onClick={() => setMuted(!muted)}
      {...keyVoice(sound)}
      data-part="key"
      style={STEP}
      className={
        "grid cursor-pointer place-items-center bg-block text-fg shadow-(--key-lift) " +
        "hover:bg-block-hover active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
        "aria-pressed:bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] aria-pressed:shadow-(--tray-shade) aria-pressed:[transform:translateY(var(--press-depth))] " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border forced-colors:aria-pressed:border-[Highlight] " +
        (compact ? "size-11 shrink-0 rounded-pill" : "size-10 rounded-[calc(var(--radius-control)-2px)]")
      }
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M2.5 6v4h2.5l3.5 3V3L5 6z" />
        {muted ? <path d="M11 6l3.5 4M14.5 6L11 10" /> : <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.75a6 6 0 0 1 0 8.5" />}
      </svg>
    </button>
  );
  if (compact) return button;
  return (
    <div className={"grid justify-items-center gap-1.5 " + className}>
      <span data-part="well" className="inline-flex rounded-control bg-tray px-0.5 pt-0.5 pb-1 shadow-(--tray-shade) forced-colors:border">
        {button}
      </span>
      <span aria-hidden="true" data-part="lettering" className="select-none font-field text-caption text-fg-subtle">
        Mute
      </span>
    </div>
  );
}

/* ---------- the dial ---------- */

const DETENT = 15; // degrees of turn per component, as the player's dial clicks

const side =
  "absolute top-1/4 grid h-1/2 w-1/4 cursor-pointer place-items-center text-dial-ink opacity-80 hover:opacity-100 " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
/* The top and bottom of the cap: Index and Every component. */
const edge =
  "absolute left-1/4 grid h-1/4 w-1/2 cursor-pointer place-items-center text-dial-ink opacity-80 hover:opacity-100 " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Dial({
  at,
  n,
  step,
  index,
  everything,
  turn,
  play,
  className = "",
}: { at: number | null; n: number; className?: string } & Pick<PlayObjectBodyProps, "step" | "index" | "everything" | "turn" | "play">) {
  const { play: sound } = useSound();
  const angle = useMotionValue(0);
  const hand = useHand();
  const settle = useSettle([angle]);
  const cap = useRef<HTMLDivElement>(null);
  /* Where the dial rests, in detents, unbounded: it turns the short way round to the take showing. */
  const rest = useRef(0);
  const was = useRef<number | null>(at);
  const held = useRef(false);
  const latest = useRef(turn);
  latest.current = turn;
  const latestSound = useRef(sound);
  latestSound.current = sound;

  useEffect(() => {
    /* Home stands the dial where it is: it turns from the last part shown to the next one. */
    if (at === null) return;
    const from = was.current;
    was.current = at;
    if (from === null) return;
    let d = at - from;
    if (!d) return;
    if (Math.abs(d) > n / 2) d -= Math.sign(d) * n;
    rest.current += d;
    if (!held.current) settle.to([rest.current * DETENT]);
  }, [at, n, settle]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("[data-play-key]")) return;
    const box = cap.current!.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const deg = (x: number, y: number) => (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
    /* The hand turns along the ring's tangent where it pressed: up and down on the sides, across at the top and bottom. */
    const axis = Math.abs(e.clientX - cx) > Math.abs(e.clientY - cy) ? "y" : "x";
    let last = deg(e.clientX, e.clientY);
    let from = 0;
    let turned = 0;
    let stepped = 0;
    hand.begin(e, {
      axis,
      onClaim: (p) => {
        settle.hold();
        held.current = true;
        from = angle.get();
        last = deg(p.x, p.y);
      },
      onMove: (p) => {
        const a = deg(p.x, p.y);
        let d = a - last;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        last = a;
        turned += d;
        angle.set(from + turned);
        const detents = Math.trunc(turned / DETENT);
        if (detents !== stepped) {
          latestSound.current("notch");
          latest.current(detents - stepped);
          stepped = detents;
        }
      },
      onRelease: () => {
        held.current = false;
        settle.to([snap(rest.current * DETENT, { step: DETENT, origin: 0, min: -1e9, max: 1e9 })]);
      },
    });
  };

  const edgeSound = keyVoice(sound);

  return (
    <div data-part="collar" data-recorder-dial="" className={"relative size-36 shrink-0 rounded-pill bg-tray p-2 shadow-(--tray-shade) " + className}>
      <div
        ref={cap}
        data-part="cap"
        onPointerDown={onPointerDown}
        style={STEP}
        className={
          "relative size-full touch-none rounded-pill bg-dial shadow-(--dial-lift) select-none " +
          "has-[[data-side]:active]:shadow-(--dial-press) has-[[data-side=prev]:active]:[transform:perspective(600px)_rotateY(-6deg)] has-[[data-side=next]:active]:[transform:perspective(600px)_rotateY(6deg)] " +
          "has-[[data-side=up]:active]:[transform:perspective(600px)_rotateX(6deg)] has-[[data-side=down]:active]:[transform:perspective(600px)_rotateX(-6deg)] " +
          "forced-colors:border"
        }
      >
        {/* The knurled ring and its mark (a wedge of ink at the top of the ring) turn with the hand; the legends on the
            sides stay put. */}
        <motion.div aria-hidden="true" style={{ rotate: angle }} className="pointer-events-none absolute inset-0 rounded-pill">
          <span className="absolute inset-0 rounded-pill [background:conic-gradient(var(--dial-ink)_0deg_2deg,transparent_2deg_358deg,var(--dial-ink)_358deg),repeating-conic-gradient(color-mix(in_oklab,var(--dial-ink)_22%,transparent)_0deg_1deg,transparent_1deg_15deg)] [mask:radial-gradient(circle,transparent_66%,black_68%,black_92%,transparent_94%)]" />
        </motion.div>
        <button {...step(-1)} {...edgeSound} data-side="prev" className={side + " left-0 rounded-l-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-2.5 fill-current">
            <path d="M4 8 11 3v10z" />
          </svg>
        </button>
        <button {...step(1)} {...edgeSound} data-side="next" className={side + " right-0 rounded-r-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-2.5 fill-current">
            <path d="M12 8 5 13V3z" />
          </svg>
        </button>
        {/* Index, printed as the player's menu legend: three short rules. */}
        <button {...index} {...edgeSound} data-side="up" className={edge + " top-0 rounded-t-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
            <path d="M3 4h10v1.5H3zM3 7.25h10v1.5H3zM3 10.5h10V12H3z" />
          </svg>
        </button>
        {/* Every component, printed as a grid of four: the world's gallery view. */}
        <a {...everything} {...edgeSound} data-side="down" className={edge + " bottom-0 rounded-b-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
            <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" />
          </svg>
        </a>
        {/* The centre: Play, in a well cut through the cap. */}
        <span data-part="well" className="absolute inset-[30%] rounded-pill p-1 shadow-(--dial-recess)" data-play-key="">
          <PlayKey play={play} onDial className="size-full" />
        </span>
      </div>
    </div>
  );
}

/* ---------- the body ---------- */

function DeviceBody({ takes, at, selector, pick, step, index, everything, turn, play, readout, screen, compact }: PlayObjectBodyProps) {
  const playing = play["aria-pressed"];
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div data-part="plate" className="grid shrink-0 gap-2 border-b border-line bg-canvas px-gutter py-3 shadow-(--plate-edge)">
          <div className="flex items-center gap-2">
            <Readout readout={readout} playing={playing} compact className="min-w-0 flex-1" />
            <PlayKey play={play} className="size-11 shrink-0" />
            <RecorderMute compact />
          </div>
          <Tape takes={takes} at={at} selector={selector} pick={pick} className="h-11" />
        </div>
        {screen}
      </div>
    );
  }
  /* The frame holds the body: the aluminium plate with its grain. The screen is set into the plate behind its bezel and
     glass; under it the tape, then the deck: the readout, Mute key and dial. DOM order puts Tape, Dial (Play) and the
     bezel (screen) first, then Mute, so Tab reaches slider -> play -> screen in that order while grid placement lays
     out screen on row 1, tape on row 2, and readout / Mute / dial across row 3. */
  return (
    <div data-part="frame" className="mx-auto flex w-full max-w-6xl min-w-0 flex-col rounded-[var(--object-radius)] p-1 [background:var(--frame)] shadow-[var(--frame-edge),var(--object-cast)] forced-colors:border">
      <div data-part="plate" className="litt-grain relative isolate grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-6 rounded-[calc(var(--object-radius)-4px)] bg-canvas p-3 shadow-(--plate-edge) [--grain-opacity:var(--object-grain)]">
        <Tape takes={takes} at={at} selector={selector} pick={pick} className="col-span-full row-start-2 mx-3 mt-3 h-10" />
        <Readout readout={readout} playing={playing} className="col-start-1 row-start-3 mt-3 mb-4 ml-6 w-full max-w-xl" />
        <Dial at={at} n={takes.length} step={step} index={index} everything={everything} turn={turn} play={play} className="col-start-3 row-start-3 mt-3 mr-6 mb-4" />
        <div data-part="bezel" className="relative col-span-full row-start-1 flex rounded-[calc(var(--object-radius)-16px)] bg-bezel p-2 shadow-(--bezel-edge) forced-colors:border">
          {screen}
          {/* The glass over the screen: a sheen where the light catches it. It takes no hand. */}
          <span aria-hidden="true" data-part="glass" className="pointer-events-none absolute inset-2 rounded-[calc(var(--object-radius)-24px)] [background:var(--glass-sheen)]" />
        </div>
        <RecorderMute className="col-start-2 row-start-3 mt-3 mb-4 justify-self-end" />
      </div>
    </div>
  );
}

export const device: PlayObjectBody = {
  name: "device",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[calc(var(--object-radius)-24px)]"),
  rail: false,
  Body: DeviceBody,
};
