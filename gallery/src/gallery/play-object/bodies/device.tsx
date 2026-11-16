/**
 * Device's object, the recorder: the components repo's player brought home (litterthanlit/components,
 * src/components/device/), landscape as the player is, drawn only from Device's own tokens and litt's scales (plans/018).
 *
 * - A machined frame (--surface-3, a shade darker than the body in light and lighter in dark) holds the body: the
 *   aluminium plate (--canvas). The screen sits across the top in a black bezel (--field, the LCD glass).
 * - Under it, the tape: the set laid end to end, one tick each (its height seeded from its id, so a take always prints
 *   the same), the current one strong with the playhead on it. Press or drag along it to scrub.
 * - The deck: the readout, an LCD in a well (--tray), with the component's name and its count in the mono; and the
 *   dial, a cap in a collar that turns in 15° detents under the hand, a take a detent, with Previous and Next on its
 *   sides, Index on top (Home, as an iPod's Menu), Every component below (the world's gallery view) and Play at its
 *   centre, a key that latches down while it plays. Keys, a pick and Play turn it too, so it always stands at the take
 *   showing.
 * - Things are mechanisms: the take, the playhead and the readout switch where they stand; only the dial travels, on the
 *   responsive spring (useSettle), and lands at once under reduced motion.
 * - The DOM puts the tape (the slider) and Play before the screen, so the keyboard meets the controls first; order puts
 *   the screen on top.
 * - Left out, as the plan says: sound, the player's Find and Options screens, and playing on load.
 */
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { motion, useMotionValue } from "motion/react";
import { snap, useHand, useSettle } from "@/motion/hand";
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

/* ---------- the tape: the slider over the takes ---------- */

function Tape({ takes, at, selector, pick, className }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick"> & { className: string }) {
  const n = takes.length;
  const scrub = useScrub(n, pick);
  return (
    <div
      {...selector}
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

function Readout({ readout, playing, className }: Pick<PlayObjectBodyProps, "readout"> & { playing: boolean; className: string }) {
  const [now, of] = readout.count.split(" / ");
  return (
    <div {...readout.props} className={"flex min-w-0 items-center justify-between gap-6 " + className}>
      <span className="grid min-w-0 gap-1">
        <span className="truncate text-caption litt-legend text-fg-subtle">{readout.group ?? "Index"}</span>
        <span className="truncate text-h1 text-fg">{readout.title}</span>
      </span>
      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
        {/* A light that fires while Play runs; at rest, a dim ring. */}
        <span className={"size-1.5 self-center rounded-pill " + (playing ? "bg-signal" : "shadow-[inset_0_0_0_1px_var(--line-strong)]")} />
        <span className="text-display text-fg">{now}</span> <span className="text-small text-fg-subtle">/ {of}</span>
      </span>
    </div>
  );
}

/* ---------- Play: a key that latches down while it plays ---------- */

function PlayKey({ play, className, onDial = false }: { play: PlayObjectBodyProps["play"]; className: string; onDial?: boolean }) {
  const on = play["aria-pressed"];
  return (
    <button
      {...play}
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

/* ---------- the dial ---------- */

const DETENT = 15; // degrees of turn per component, as the player's dial clicks

const side =
  "absolute top-1/4 grid h-1/2 w-1/4 cursor-pointer place-items-center text-dial-ink opacity-80 hover:opacity-100 " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
/* The top and bottom of the cap: Index and Every component. */
const edge =
  "absolute left-1/4 grid h-1/4 w-1/2 cursor-pointer place-items-center text-dial-ink opacity-80 hover:opacity-100 " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Dial({ at, n, step, index, everything, turn, play }: { at: number | null; n: number } & Pick<PlayObjectBodyProps, "step" | "index" | "everything" | "turn" | "play">) {
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

  return (
    <div data-part="recorder-dial" className="relative size-36 shrink-0 rounded-pill bg-tray p-2 shadow-(--tray-shade)">
      <div
        ref={cap}
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
        <button {...step(-1)} data-side="prev" className={side + " left-0 rounded-l-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-2.5 fill-current">
            <path d="M4 8 11 3v10z" />
          </svg>
        </button>
        <button {...step(1)} data-side="next" className={side + " right-0 rounded-r-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-2.5 fill-current">
            <path d="M12 8 5 13V3z" />
          </svg>
        </button>
        {/* Index, printed as the player's menu legend: three short rules. */}
        <button {...index} data-side="up" className={edge + " top-0 rounded-t-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
            <path d="M3 4h10v1.5H3zM3 7.25h10v1.5H3zM3 10.5h10V12H3z" />
          </svg>
        </button>
        {/* Every component, printed as a grid of four: the world's gallery view. */}
        <a {...everything} data-side="down" className={edge + " bottom-0 rounded-b-pill"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
            <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" />
          </svg>
        </a>
        {/* The centre: Play, in a well cut through the cap. */}
        <span className="absolute inset-[30%] rounded-pill p-1 shadow-(--dial-recess)" data-play-key="">
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
        <div className="grid shrink-0 gap-2 border-b border-line bg-canvas px-gutter py-3 shadow-(--highlight)">
          <div className="flex items-center gap-3">
            <Readout readout={readout} playing={playing} className="min-w-0 flex-1" />
            <PlayKey play={play} className="size-11 shrink-0" />
          </div>
          <Tape takes={takes} at={at} selector={selector} pick={pick} className="h-11" />
        </div>
        {screen}
      </div>
    );
  }
  /* The frame (machined, a shade off the body, lit along its top) holds the body: the aluminium plate with its grain.
     The screen is set into the plate; under it the tape, then the deck: the readout and the dial. */
  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col rounded-[var(--object-radius)] bg-surface-3 p-1 shadow-[var(--highlight),var(--object-cast)]">
      <div className="litt-grain relative isolate flex min-w-0 flex-col rounded-[calc(var(--object-radius)-4px)] bg-canvas p-3 shadow-(--highlight) [--grain-opacity:var(--object-grain)]">
        <Tape takes={takes} at={at} selector={selector} pick={pick} className="order-2 mx-3 mt-4 h-10" />
        <div className="order-3 flex items-center gap-10 px-6 pt-4 pb-5">
          <Readout readout={readout} playing={playing} className="min-w-0 flex-1" />
          <Dial at={at} n={takes.length} step={step} index={index} everything={everything} turn={turn} play={play} />
        </div>
        <div className="order-1 flex">{screen}</div>
      </div>
    </div>
  );
}

export const device: PlayObjectBody = {
  name: "device",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[calc(var(--object-radius)-16px)] shadow-(--tray-shade)"),
  Body: DeviceBody,
};
