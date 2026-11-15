/**
 * Device's object, the recorder: the components repo's player brought home (litterthanlit/components,
 * src/components/device/), landscape as the player is, drawn only from Device's own tokens and litt's scales (plans/018).
 *
 * - A machined frame (--surface-3, a shade darker than the body in light and lighter in dark) holds the body: the
 *   aluminium plate (--canvas). The screen sits across the top in a black bezel (--field, the LCD glass).
 * - Under it, the tape: every component laid end to end, one bar each (its height seeded from its id, so a take always
 *   prints the same), the current one in the ink with the playhead on it. Press or drag along it to scrub. The playhead
 *   is the ink, not the player's red: Device has no red that means "this is playing", and its accent fills no body (R6).
 * - The deck: the readout, an LCD in a well (--tray), with the component's name and its count in the mono; and the
 *   dial, a cap in a collar that turns in 15° detents under the hand, a component a detent, with Previous and Next on
 *   its sides and Play at its centre, a key that latches down while it plays. Keys, a pick and Play turn it too, so it
 *   always stands at the take showing.
 * - Things are mechanisms: the take, the playhead and the readout switch where they stand; only the dial travels, on the
 *   responsive spring (useSettle), and lands at once under reduced motion.
 * - The DOM puts the tape (the slider) and Play before the screen, so the keyboard meets the controls first; order puts
 *   the screen on top.
 * - Left out, as the plan says: sound, the player's Home, Find and Options screens (Menu does Find), and playing on load.
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
      <svg aria-hidden="true" viewBox={`0 0 ${n} 20`} preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 inset-y-2 h-[calc(100%-1rem)] w-full overflow-visible">
        {takes.map((t, i) => {
          const h = level(t.id) * 9;
          return (
            <line
              key={t.id}
              x1={i + 0.5}
              x2={i + 0.5}
              y1={10 - h}
              y2={10 + h}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={i === at ? "text-fg" : "text-fg opacity-35"}
            />
          );
        })}
      </svg>
      {/* The playhead, on the take showing: it switches where it stands. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg forced-colors:bg-[Highlight]" style={{ left: `${((at + 0.5) / n) * 100}%` }}>
        <span className="absolute -left-0.5 top-0 size-1.5 rounded-pill bg-fg forced-colors:bg-[Highlight]" />
      </span>
    </div>
  );
}

/* ---------- the readout: an LCD in a well ---------- */

function Readout({ readout, className }: Pick<PlayObjectBodyProps, "readout"> & { className: string }) {
  const [now, of] = readout.count.split(" / ");
  return (
    <div {...readout.props} className={"rounded-control bg-tray p-0.5 shadow-(--tray-shade) " + className}>
      <div className="flex h-full min-w-0 items-center justify-between gap-4 rounded-[calc(var(--radius-control)-2px)] bg-field px-4 font-field text-field-ink shadow-(--field-shade)">
        <span className="min-w-0 truncate text-body">{readout.title}</span>
        <span className="shrink-0 tabular-nums">
          <span className="text-h3">{now}</span> <span className="text-caption text-field-ink-subtle">/ {of}</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- Play: a key that latches down while it plays ---------- */

function PlayKey({ play, className }: { play: PlayObjectBodyProps["play"]; className: string }) {
  const on = play["aria-pressed"];
  return (
    <button
      {...play}
      style={STEP}
      className={
        "grid cursor-pointer place-items-center rounded-pill bg-block text-fg shadow-(--key-lift) " +
        "active:[transform:translateY(var(--press-depth))] active:shadow-(--block-press) " +
        "aria-pressed:[transform:translateY(var(--press-depth))] aria-pressed:bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] aria-pressed:shadow-(--tray-shade) " +
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
  "absolute top-1/4 grid h-1/2 w-1/4 cursor-pointer place-items-center text-fg-muted hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Dial({ at, n, step, turn, play }: { at: number; n: number } & Pick<PlayObjectBodyProps, "step" | "turn" | "play">) {
  const angle = useMotionValue(0);
  const hand = useHand();
  const settle = useSettle([angle]);
  const cap = useRef<HTMLDivElement>(null);
  /* Where the dial rests, in detents, unbounded: it turns the short way round to the take showing. */
  const rest = useRef(0);
  const was = useRef(at);
  const held = useRef(false);
  const latest = useRef(turn);
  latest.current = turn;

  useEffect(() => {
    let d = at - was.current;
    was.current = at;
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
    <div data-part="recorder-dial" className="relative size-32 shrink-0 rounded-pill bg-tray p-2 shadow-(--tray-shade)">
      <div
        ref={cap}
        onPointerDown={onPointerDown}
        style={STEP}
        className={
          "relative size-full touch-none rounded-pill bg-cap shadow-(--cap-lift) select-none " +
          "has-[[data-side]:active]:shadow-(--cap-press) has-[[data-side=prev]:active]:[transform:perspective(600px)_rotateY(-6deg)] has-[[data-side=next]:active]:[transform:perspective(600px)_rotateY(6deg)] " +
          "forced-colors:border"
        }
      >
        {/* The knurled ring and its mark (a wedge of ink at the top of the ring) turn with the hand; the legends on the
            sides stay put. */}
        <motion.div aria-hidden="true" style={{ rotate: angle }} className="pointer-events-none absolute inset-0 rounded-pill">
          <span className="absolute inset-0 rounded-pill [background:conic-gradient(var(--fg-muted)_0deg_2deg,transparent_2deg_358deg,var(--fg-muted)_358deg),repeating-conic-gradient(var(--cap-grip)_0deg_1.5deg,transparent_1.5deg_15deg)] [mask:radial-gradient(circle,transparent_66%,black_68%,black_92%,transparent_94%)]" />
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
        {/* The centre: Play, in a well cut through the cap. */}
        <span className="absolute inset-[30%] rounded-pill bg-tray p-1 shadow-(--tray-shade)" data-play-key="">
          <PlayKey play={play} className="size-full" />
        </span>
      </div>
    </div>
  );
}

/* ---------- the body ---------- */

function DeviceBody({ takes, at, selector, pick, step, turn, play, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 gap-2 border-b border-line bg-canvas px-gutter py-2 shadow-(--highlight)">
          <div className="flex items-center gap-2">
            <Readout readout={readout} className="h-11 min-w-0 flex-1" />
            <PlayKey play={play} className="size-11 shrink-0" />
          </div>
          <Tape takes={takes} at={at} selector={selector} pick={pick} className="h-11" />
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col rounded-surface bg-surface-3 p-1 shadow-(--plate-lift)">
      <div className="flex min-w-0 flex-col rounded-[calc(var(--radius-surface)-4px)] bg-canvas p-2 shadow-(--highlight)">
        <Tape takes={takes} at={at} selector={selector} pick={pick} className="order-2 mx-4 mt-3 h-12" />
        <div className="order-3 flex items-center gap-8 px-4 pt-4 pb-4">
          <Readout readout={readout} className="h-16 min-w-0 flex-1" />
          <Dial at={at} n={takes.length} step={step} turn={turn} play={play} />
        </div>
        <div className="order-1 flex rounded-[calc(var(--radius-surface)-12px)] bg-field p-1 shadow-(--field-shade)">{screen}</div>
      </div>
    </div>
  );
}

export const device: PlayObjectBody = {
  name: "device",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[calc(var(--radius-surface)-16px)]"),
  Body: DeviceBody,
};
