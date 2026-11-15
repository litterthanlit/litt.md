/**
 * Device's object, the recorder: the components repo's player brought home (litterthanlit/components,
 * src/components/device/), drawn only from Device's own tokens and litt's scales (plans/018).
 *
 * - A machined frame (--surface-3, a shade darker than the body in light and lighter in dark) holds the body: the
 *   aluminium plate (--canvas). The screen sits in a black bezel (--field, the LCD glass) cut into the plate.
 * - Under the screen, the tape: one take to a cell, each printing its own waveform (seeded from its id, the player's
 *   envelope), the current one in the ink with the playhead standing at its start. The playhead is the ink, not the
 *   player's red: Device has no red that means "this is playing", and its accent is no fill for a body (R6).
 * - The deck: the readout, an LCD in a well (--tray), saying the take's name and its count in the mono; and the dial,
 *   a cap in a collar that turns in 15° detents under the hand, one take a detent, with Previous and Next printed on
 *   its sides. Keys and a picked take turn it too, so it always stands at the take showing.
 * - Things are mechanisms: the take, the playhead and the readout switch where they stand; only the dial travels,
 *   and only after a hand (useSettle, the responsive spring; at once under reduced motion).
 * - The DOM puts the tape (the takes' tablist) before the screen (its tabpanel), so one Tab reaches the takes and the
 *   next the screen; order puts the screen on top.
 * - Left out, as the plan says: sound, the player's Home, Find and Options screens, the PLAY key and playing on load.
 *   The dial's centre is a dimple until phase 3 decides Play.
 */
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { motion, useMotionValue } from "motion/react";
import { snap, useHand, useSettle } from "@/motion/hand";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, OBJECT_HEIGHT } from "../body";

/* ---------- the tape's waveforms: the player's signature for a take, so a take always prints the same ---------- */

/** A small seedable PRNG (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const BARS = 9;

/** Two to four bursts over a low floor, faded at the cut, as speech looks on a recorder: one height per bar, 0 to 1. */
function levels(id: string): number[] {
  const rand = random(hash(id));
  const bursts = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({ at: 0.08 + rand() * 0.84, width: 0.08 + rand() * 0.14, gain: 0.6 + rand() * 0.4 }));
  const floor = 0.12 + rand() * 0.08;
  const jitter = random(hash(`${id}:bars`));
  return Array.from({ length: BARS }, (_, j) => {
    const t = (j + 0.5) / BARS;
    let e = floor;
    for (const b of bursts) e = Math.max(e, b.gain * Math.exp(-(((t - b.at) / b.width) ** 2)));
    const edge = Math.min(1, t * 6, (1 - t) * 6);
    return Math.round(Math.max(0.1, e * edge * (0.35 + 0.65 * jitter() ** 1.4)) * 100) / 100;
  });
}

function Wave({ id }: { id: string }) {
  const bars = levels(id);
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${BARS} 20`} preserveAspectRatio="none" className="absolute inset-x-2 inset-y-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] overflow-visible">
      {bars.map((h, j) => (
        <line key={j} x1={j + 0.5} x2={j + 0.5} y1={10 - h * 9} y2={10 + h * 9} stroke="currentColor" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/* ---------- the tape: the takes' tablist ---------- */

function Tape({ takes, at, selector, tab, className }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "tab"> & { className: string }) {
  return (
    <div {...selector} className={"relative flex " + className}>
      {/* The baseline, printed on the body the full width. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-line" />
      {takes.map((t, i) => (
        <button
          key={t.id}
          {...tab(i)}
          className={
            "litt-target relative min-w-0 flex-1 cursor-pointer rounded-control hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
            (i === at ? "text-fg" : "text-fg opacity-40 hover:opacity-70")
          }
        >
          <Wave id={t.id} />
          {i === at && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-fg forced-colors:bg-[Highlight]">
              <span className="absolute -left-0.5 top-0 size-1.5 rounded-pill bg-fg forced-colors:bg-[Highlight]" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- the readout: an LCD in a well ---------- */

function Readout({ readout, className }: Pick<PlayObjectBodyProps, "readout"> & { className: string }) {
  const [now, of] = readout.count.split(" / ");
  return (
    <div {...readout.props} className={"rounded-control bg-tray p-0.5 shadow-(--tray-shade) " + className}>
      <div className="flex h-full min-w-0 items-center justify-between gap-3 rounded-[calc(var(--radius-control)-2px)] bg-field px-3 font-field text-field-ink shadow-(--field-shade)">
        <span className="min-w-0 truncate text-small">{readout.title}</span>
        <span className="shrink-0 tabular-nums">
          <span className="text-body">{now}</span> <span className="text-caption text-field-ink-subtle">/ {of}</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- the dial ---------- */

const DETENT = 15; // degrees of turn per take, as the player's dial clicks

/* The cap's press, as Device's keys switch: three even steps on the instant tier. */
const STEP: CSSProperties = {
  transitionProperty: "transform, box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: "steps(3, end)",
};

const side =
  "absolute top-1/4 grid h-1/2 w-1/3 cursor-pointer place-items-center text-fg-muted hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Dial({ at, n, step, turn }: { at: number; n: number; step: PlayObjectBodyProps["step"]; turn: PlayObjectBodyProps["turn"] }) {
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
    <div data-part="recorder-dial" className="relative size-24 shrink-0 rounded-pill bg-tray p-1.5 shadow-(--tray-shade) pointer-coarse:size-28">
      <div
        ref={cap}
        onPointerDown={onPointerDown}
        style={STEP}
        className={
          "relative size-full touch-none rounded-pill bg-cap shadow-(--cap-lift) select-none " +
          "has-[button:active]:shadow-(--cap-press) has-[[data-side=prev]:active]:[transform:perspective(600px)_rotateY(-6deg)] has-[[data-side=next]:active]:[transform:perspective(600px)_rotateY(6deg)] " +
          "forced-colors:border"
        }
      >
        {/* The knurled ring and its mark turn with the hand; the legends on the sides stay put. */}
        <motion.div aria-hidden="true" style={{ rotate: angle }} className="pointer-events-none absolute inset-0 rounded-pill">
          <span className="absolute inset-0 rounded-pill [background:repeating-conic-gradient(var(--cap-grip)_0deg_1.5deg,transparent_1.5deg_15deg)] [mask:radial-gradient(circle,transparent_62%,black_64%,black_92%,transparent_94%)]" />
          <span className="absolute left-1/2 top-1 h-2 w-0.5 -translate-x-1/2 rounded-pill bg-fg-muted" />
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
        {/* The centre: a dimple cut through the cap. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-[34%] rounded-pill bg-tray shadow-(--tray-shade)" />
      </div>
    </div>
  );
}

/* ---------- the body ---------- */

function DeviceBody({ takes, at, selector, tab, step, turn, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 gap-2 border-b border-line bg-canvas px-gutter py-2 shadow-(--highlight)">
          <Tape takes={takes} at={at} selector={selector} tab={tab} className="order-2 h-11" />
          <Readout readout={readout} className="order-1 h-10" />
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className={"mx-auto flex w-full max-w-md flex-col rounded-surface bg-surface-3 p-1 shadow-(--plate-lift) " + OBJECT_HEIGHT}>
      <div className="flex min-h-0 flex-1 flex-col rounded-[calc(var(--radius-surface)-4px)] bg-canvas p-2 shadow-(--highlight)">
        <Tape takes={takes} at={at} selector={selector} tab={tab} className="order-2 mx-2 mt-2 h-10 shrink-0 pointer-coarse:h-11" />
        <div className="order-3 flex shrink-0 items-center gap-4 px-2 pb-2 pt-3">
          <Readout readout={readout} className="h-14 min-w-0 flex-1" />
          <Dial at={at} n={takes.length} step={step} turn={turn} />
        </div>
        <div className="order-1 flex min-h-0 flex-1 flex-col rounded-[calc(var(--radius-surface)-12px)] bg-field p-1 shadow-(--field-shade)">{screen}</div>
      </div>
    </div>
  );
}

export const device: PlayObjectBody = {
  name: "device",
  shape: (compact) => (compact ? COMPACT_SCREEN : "min-h-0 w-full flex-1 rounded-[calc(var(--radius-surface)-16px)]"),
  Body: DeviceBody,
};
