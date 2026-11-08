/**
 * Tape progress: Progress said as two tape reels in a window (proposals/device-studies.md, Tape reels). A Device part:
 * the window is LCD glass (--field, --field-ink, --field-shade), so it is only at home under data-material="device"
 * (components.md, "Tape progress"). It takes Progress's props and says the value the way Progress does.
 *
 * - Anatomy: the label and the reading above, as Progress has them, then a smoked window (200 by 110 in its own units,
 *   at most 440px wide): the supply reel on the left emptying, the take-up on the right filling, the tape between them
 *   over two guides and across a head, and a record light that is lit while the work runs (the accent, the one small
 *   light in the view).
 * - The reels are discs. A reel's pack is a disc whose radius follows the value by area: the supply is
 *   sqrt(hub^2 + (1 - p) * span) and the take-up sqrt(hub^2 + p * span), both 15 to 38, so the tape on one is the tape
 *   gone from the other. Each reel sets two local properties, --tape-r (the pack radius) and --tape-a (the hub's angle),
 *   and the tape is one path whose ends are tangent to the packs.
 * - The pace is constant, so a reel's angular velocity is span / (K * r) times the change in value: it goes with 1/r, the
 *   emptying reel speeding up and the filling one slowing down, about eight turns end to end.
 * - Motion: the value is eased by a critically damped spring (stiffness 140, damping 24), so a change glides and a
 *   steady stream of small ones reads as one pace. The loop writes the two properties and the tape's path from the
 *   spring each frame, never React state, and stops when the spring has settled. Nothing moves on its own (R4), and the
 *   first render sits at the value. Reduced motion jumps to each new value.
 * - Ending: done fills the take-up and the reading says Done; failed stops the reels where they are, the record light goes
 *   out and the reading says Failed in --danger. With no value yet the reels sit at the start and the reading says Waiting.
 * - Accessibility: the window is a progressbar named by the label with aria-valuenow while the value is known and the
 *   reading as aria-valuetext, as Progress is. Ending done or failed is said once in a polite status.
 */
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useMotionDial } from "@/motion";

export type TapeProgressStatus = "active" | "done" | "failed";

export type TapeProgressProps = {
  /** What is in progress: "Exporting the reel", "Importing 1,204 pages". */
  label: ReactNode;
  /** How far along it is, from 0 to max. Leave it out while that is not known yet: the reels sit at the start. */
  value?: number;
  /** The value that means finished. */
  max?: number;
  /** The reading at the end of the label row, and what a screen reader hears: "412 of 1,204". Default: the percent. */
  valueText?: string;
  /** active while it runs; done fills the take-up and says Done; failed stops where it is and says Failed. */
  status?: TapeProgressStatus;
  /** A line under the window: the time left, or what failed and what to do about it. */
  message?: ReactNode;
  /** Hides the label row but keeps it as the name, for a row that already shows the name. */
  hideLabel?: boolean;
  className?: string;
};

/* The window's geometry, in its own units (the studies' numbers). */
const FULL = 38; // the full pack
const HUB = 15;
const SPAN = FULL * FULL - HUB * HUB; // 1219
const K = (2 * (FULL - HUB)) / (2 * Math.PI * 8); // about eight turns end to end
const SUPPLY = { x: 52, y: 46 };
const TAKE_UP = { x: 148, y: 46 };
const GUIDE_L = { x: 13, y: 96 };
const GUIDE_R = { x: 187, y: 96 };
const TAPE_Y = 91;

/* The spring that eases the value: critically damped, integrated in fixed steps. */
const STIFFNESS = 140;
const DAMPING = 24;
const STEP = 1 / 240;

const packRadius = (p: number, supply: boolean) => Math.sqrt(HUB * HUB + (supply ? 1 - p : p) * SPAN);

/** Where a line from (px, py) touches a disc: the tangent point on the outer side (side -1 left, 1 right of the pack). */
function tangent(c: { x: number; y: number }, r: number, px: number, py: number, side: 1 | -1): [number, number] {
  const dx = px - c.x;
  const dy = py - c.y;
  const a = Math.atan2(dy, dx);
  const b = Math.acos(Math.min(1, r / Math.hypot(dx, dy)));
  const t = side === 1 ? a + b : a - b;
  return [c.x + r * Math.cos(t), c.y + r * Math.sin(t)];
}

const tapePath = (p: number) => {
  const [sx, sy] = tangent(SUPPLY, packRadius(p, true), GUIDE_L.x, TAPE_Y, 1);
  const [tx, ty] = tangent(TAKE_UP, packRadius(p, false), GUIDE_R.x, TAPE_Y, -1);
  return `M${sx.toFixed(2)} ${sy.toFixed(2)}L${GUIDE_L.x} ${TAPE_Y}L${GUIDE_R.x} ${TAPE_Y}L${tx.toFixed(2)} ${ty.toFixed(2)}`;
};

const inkMix = (pct: number) => `color-mix(in oklab, var(--field-ink) ${pct}%, transparent)`;

/** Progress as two tape reels: the supply empties and the take-up fills, each turning at the pace its radius gives it. */
export function TapeProgress({ label, value, max = 100, valueText, status = "active", message, hideLabel = false, className = "" }: TapeProgressProps) {
  const labelId = useId();
  const messageId = useId();
  const { reduced } = useMotionDial();
  const known = value !== undefined || status === "done";
  const share = status === "done" ? 1 : max > 0 && value !== undefined ? Math.max(0, Math.min(1, value / max)) : 0;
  const reading =
    status === "done" ? "Done" : status === "failed" ? "Failed" : value === undefined ? (valueText ?? "Waiting") : (valueText ?? `${Math.round(share * 100)}%`);
  const tone = status === "failed" ? "text-danger" : "text-fg-subtle";
  const recording = status === "active" && known && share < 1;

  const supply = useRef<HTMLDivElement>(null);
  const takeUp = useRef<HTMLDivElement>(null);
  const tape = useRef<SVGPathElement>(null);
  /* The first value, for React's one write of the properties the loop owns from then on. */
  const first = useRef(share);
  const sim = useRef({ x: share, v: 0, target: share, shown: share, angS: 0, angT: 0, frame: 0, ready: false });

  /* Writes the pack radii, hub angles and the tape for the spring's value x, turning each reel by the tape it moved. */
  const paint = (x: number) => {
    const s = sim.current;
    const dp = x - s.shown;
    if (dp !== 0) {
      const mid = s.shown + dp / 2;
      const turn = (r: number) => ((SPAN / (K * r)) * dp * 180) / Math.PI;
      s.angS = (s.angS + turn(packRadius(mid, true))) % 360;
      s.angT = (s.angT + turn(packRadius(mid, false))) % 360;
      s.shown = x;
    }
    supply.current?.style.setProperty("--tape-r", packRadius(x, true).toFixed(3));
    supply.current?.style.setProperty("--tape-a", `${s.angS.toFixed(1)}deg`);
    takeUp.current?.style.setProperty("--tape-r", packRadius(x, false).toFixed(3));
    takeUp.current?.style.setProperty("--tape-a", `${s.angT.toFixed(1)}deg`);
    tape.current?.setAttribute("d", tapePath(x));
  };

  useEffect(() => {
    const s = sim.current;
    s.target = share;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
    /* The first value, and any value under reduced motion, is where the reels are, not somewhere they travel to. */
    if (reduced || !s.ready) {
      s.ready = true;
      s.x = share;
      s.v = 0;
      paint(share);
      return;
    }
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (acc >= STEP) {
        s.v += (STIFFNESS * (s.target - s.x) - DAMPING * s.v) * STEP;
        s.x += s.v * STEP;
        acc -= STEP;
      }
      const settled = Math.abs(s.target - s.x) < 5e-5 && Math.abs(s.v) < 1e-3;
      if (settled) {
        s.x = s.target;
        s.v = 0;
      }
      paint(s.x);
      s.frame = settled ? 0 : requestAnimationFrame(frame);
    };
    s.frame = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(s.frame);
    // paint only reads refs, so it never changes what this effect does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share, reduced]);

  const reel = (at: { x: number; y: number }, r0: number): CSSProperties =>
    ({ left: `${(at.x / 200) * 100}%`, top: `${(at.y / 110) * 100}%`, "--tape-r": r0.toFixed(3), "--tape-a": "0deg" }) as CSSProperties;
  const hub = { background: `repeating-conic-gradient(from var(--tape-a), ${inkMix(55)} 0deg 24deg, transparent 24deg 120deg)` };

  /* A function that returns elements, not a component: a component made here would be a new type every render and remount the reels. */
  const reelOf = (at: { x: number; y: number }, supplySide: boolean, el: RefObject<HTMLDivElement | null>) => (
    <div key={at.x} ref={el} aria-hidden="true" className="absolute aspect-square w-[40%] -translate-x-1/2 -translate-y-1/2" style={reel(at, packRadius(first.current, supplySide))}>
      <span className="absolute inset-0 rounded-pill shadow-[inset_0_0_0_1px_var(--field-line)]" />
      <span
        className="absolute top-1/2 left-1/2 aspect-square w-[calc(var(--tape-r)*2.5%)] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-[color-mix(in_oklab,var(--field-ink)_13%,transparent)]"
      />
      <span className="absolute top-1/2 left-1/2 aspect-square w-[37.5%] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-field shadow-[inset_0_0_0_1px_var(--field-line)]" />
      <span className="absolute top-1/2 left-1/2 aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-pill" style={hub} />
    </div>
  );

  return (
    <div className={"grid min-w-0 gap-2 " + className}>
      <div className={hideLabel ? "sr-only" : "flex items-baseline justify-between gap-4"}>
        <span id={labelId} className="min-w-0 truncate text-small text-fg">
          {label}
        </span>
        <span className={"shrink-0 text-caption font-normal tabular-nums " + tone}>{reading}</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-describedby={message ? messageId : undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={known ? Math.round(share * max) : undefined}
        aria-valuetext={reading}
        className="relative aspect-[200/110] w-full max-w-[27.5rem] overflow-hidden rounded-control bg-field shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)] forced-colors:border"
      >
        <svg viewBox="0 0 200 110" aria-hidden="true" className="absolute inset-0 size-full">
          <path ref={tape} d={tapePath(first.current)} fill="none" strokeWidth={1.6} className="stroke-[color-mix(in_oklab,var(--field-ink)_30%,transparent)] forced-colors:stroke-[CanvasText]" />
          {[GUIDE_L, GUIDE_R].map((g) => (
            <circle key={g.x} cx={g.x} cy={g.y} r={5} fill="none" strokeWidth={1} className="stroke-[color-mix(in_oklab,var(--field-ink)_30%,transparent)]" />
          ))}
          <rect x={91} y={TAPE_Y} width={18} height={9} className="fill-[color-mix(in_oklab,var(--field-ink)_25%,transparent)]" />
          <circle cx={114} cy={96} r={1.6} className={recording ? "fill-accent" : "fill-[color-mix(in_oklab,var(--field-ink)_18%,transparent)]"} />
        </svg>
        {reelOf(SUPPLY, true, supply)}
        {reelOf(TAKE_UP, false, takeUp)}
      </div>
      {message && (
        <p id={messageId} className={"text-small " + (status === "failed" ? "text-danger" : "text-fg-subtle")}>
          {message}
        </p>
      )}
      {/* The end is said once, so nobody has to watch the reels. Kept mounted, so the change is announced. */}
      <span role="status" className="sr-only">
        {status === "active" ? "" : `${typeof label === "string" ? `${label}: ` : ""}${status === "done" ? "done" : "failed"}.`}
      </span>
    </div>
  );
}
