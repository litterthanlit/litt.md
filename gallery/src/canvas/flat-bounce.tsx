/**
 * Flat bounces more (plans/023, phase 1): candidates for Flat's springs, for Nick's eye. Nothing here is a token yet.
 *
 * - FlatBounceExpressive: Flat's expressive spring at five bounces (0.12, today's cap, to 0.45) and two visual times
 *   (350ms, today's, and 420ms), ten cells. Each cell runs the same three moves in Flat's look: a mosaic dealing out of
 *   its tile (the real deal() from @/motion/deal, handed the candidate spring), a dialog growing out of its opener (a
 *   stand-in that runs the Dialog's own Flat entrance: scale from GROW with its origin on the opener, opacity and
 *   scale on the expressive spring) and the real Flat switch, whose thumb is put on the candidate spring by the CSS
 *   variables it reads. Today that thumb crosses on the responsive spring; here it shows the candidate on a small move.
 * - FlatBounceResponsive: Flat's responsive spring at bounce 0 (today) and 0.08, on the real Flat switch and the Flat
 *   segmented control's body, which takes its glide as a prop.
 *
 * Every value sits in the canvas as a candidate (litt-allow) and moves into tokens.css only once Nick picks it
 * (plan 023, phase 2). Nothing moves on load: a press on a cell, its Replay, a row's or the whole grid's starts it.
 * Under reduced motion nothing moves: deal() resolves at once, the dialog skips its entrance, the frames set no
 * variables (so the switch inherits tokens.css's zeros) and the glide takes no time.
 *
 * Boxes are read in the cell's own px (offsetLeft and friends), not the screen's, so the canvas camera's zoom never
 * skews where a piece comes from.
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { Transition } from "motion/react";
import { Button } from "@/components/button";
import { Switch } from "@/components/switch";
import { SegmentedFlatBody } from "@/worlds/flat/segmented";
import { MaterialProvider, useMotionDial, useTransition } from "@/motion";
import { deal, GROW, useDealMotion, type Box, type DealMotion } from "@/motion/deal";
import { curve, overshoot, toCss, type Spring } from "@/motion/spring";

/** The bounces under comparison, today's first. */
export const BOUNCES = [0.12, 0.2, 0.28, 0.36, 0.45] as const; // litt-allow: candidate bounces (plans/023, phase 1)
/** The visual times under comparison, in seconds, today's first. */
export const TIMES = [0.35, 0.42] as const; // litt-allow: candidate visual times (plans/023, phase 1)
/** The responsive spring's bounce, today and the candidate. */
export const RESPONSIVE_BOUNCES = [0, 0.08] as const; // litt-allow: candidate responsive bounce (plans/023, phase 1)

const ms = (s: number) => `${Math.round(s * 1000)}ms`;
const pct = (n: number) => (n < 0.0001 ? "not at all" : n < 0.005 ? "under 1%" : `${Math.round(n * 100)}%`);

/** A spring in words: what each cell and row says about itself. */
function sayings(spring: Spring) {
  const css = toCss(spring);
  return { css, settle: css.duration, over: overshoot(spring) };
}

/** Runs `run` each time `tick` changes after the first render, so nothing plays on load. */
function useOnTick(tick: number, run: () => void) {
  const seen = useRef(tick);
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  useEffect(() => {
    if (seen.current === tick) return;
    seen.current = tick;
    latest.current();
  }, [tick]);
}

/** A box in its offset parent's px. */
const local = (el: HTMLElement): Box => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });

/** The CSS variables the switch's thumb reads, carrying a candidate spring, or nothing under reduced motion. */
function thumbVars(spring: Spring | null, reduced: boolean): CSSProperties | undefined {
  if (!spring || reduced) return undefined;
  const css = toCss(spring);
  return { "--dur-responsive": `${css.duration}ms`, "--ease-responsive": css.easing } as CSSProperties;
}

/** Whether a click landed on something with its own job (the tile, the opener, the switch, a button). */
const ownJob = (e: MouseEvent) => !!(e.target as Element).closest("button, a, label, input, [role=switch]");

/* ---------------------------------------------------------------- the pieces of a stage */

/** A Flat stage: the page's canvas inside a hairline, in Flat's motion language whatever the page around it. */
function Stage({ children, className = "", onClick, label }: { children: ReactNode; className?: string; onClick?: (e: MouseEvent) => void; label: string }) {
  return (
    <MaterialProvider material="flat">
      <div
        data-material="flat"
        aria-label={label}
        role="group"
        onClick={onClick}
        className={"rounded-surface bg-canvas p-5 shadow-[inset_0_0_0_1px_var(--line)] " + className}
      >
        {children}
      </div>
    </MaterialProvider>
  );
}

const card = "rounded-control bg-surface-1 shadow-[inset_0_0_0_1px_var(--line)]";
const zoneName = "text-caption text-fg-subtle";

/** The spring's curve, at the size of a word: where it overshoots, and how far. */
function Curve({ spring }: { spring: Spring }) {
  const w = 132;
  const h = 48;
  const top = 1.16;
  const y = (v: number) => h - 4 - (v / top) * (h - 8);
  const d = curve(spring, 64)
    .map(([t, v], i) => `${i ? "L" : "M"}${(t * w).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg aria-hidden="true" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <line x1={0} x2={w} y1={y(1)} y2={y(1)} className="stroke-line-strong" strokeWidth={1} strokeDasharray="2 3" />
      <path d={d} fill="none" className="stroke-fg" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- one expressive candidate */

const PIECES = 6;

function ExpressiveCell({ spring, tick, today }: { spring: Spring; tick: number; today: boolean }) {
  const { reduced } = useMotionDial();
  const { css, settle, over } = sayings(spring);
  const tile = useRef<HTMLButtonElement>(null);
  const pieces = useRef<(HTMLDivElement | null)[]>([]);
  const opener = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  /* Today's deal on Flat (the instant tier's fade, the stagger, reduced motion), with the candidate in place of the
     expressive spring: the only tier a Flat deal springs on. */
  const motion: DealMotion = { ...useDealMotion(), spring: { duration: reduced ? 0 : css.duration, easing: css.easing }, material: "flat" };

  const dealOut = () => {
    const els = pieces.current.filter((p): p is HTMLDivElement => !!p);
    if (!tile.current || !els.length) return;
    deal(els, { deck: local(tile.current) }, motion, { places: els.map(local) });
  };
  const grow = () => {
    const p = panel.current;
    const o = opener.current;
    if (!p || !o || reduced) return;
    const from = local(o);
    p.style.transformOrigin = `${from.left + from.width / 2 - p.offsetLeft}px ${from.top + from.height / 2 - p.offsetTop}px`;
    for (const a of p.getAnimations()) a.cancel();
    p.animate(
      [
        { transform: `scale(${GROW})`, opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: css.duration, easing: css.easing },
    );
  };
  const replay = () => {
    dealOut();
    grow();
    setOn((v) => !v);
  };
  useOnTick(tick, replay);

  const words = `Bounce ${spring.bounce} at ${ms(spring.time)}`;
  return (
    <div data-bounce-cell={`${spring.bounce} ${Math.round(spring.time * 1000)}`} className="grid gap-3">
      <Stage label={words} className="cursor-pointer" onClick={(e) => !ownJob(e) && replay()}>
        <div className="grid grid-cols-[216px_minmax(0,1fr)_96px] items-end gap-5">
          {/* The mosaic: six pieces deal out of the tile, the nearest first. */}
          <div className="grid gap-2">
            <div className="relative grid h-[136px] grid-cols-[56px_1fr] items-end gap-4">
              <button
                ref={tile}
                type="button"
                aria-label={`Deal the mosaic, ${words}`}
                onClick={dealOut}
                className={"grid size-14 cursor-pointer place-items-center " + card + " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"}
              >
                <span aria-hidden="true" className="grid gap-1">
                  <span className="block h-1.5 w-6 rounded-pill bg-fg" />
                  <span className="block h-1.5 w-4 rounded-pill bg-line-strong" />
                </span>
              </button>
              <div className="grid grid-cols-3 gap-2 self-stretch">
                {Array.from({ length: PIECES }, (_, i) => (
                  <div
                    key={i}
                    ref={(el) => {
                      pieces.current[i] = el;
                    }}
                    aria-hidden="true"
                    className={"grid content-start gap-1 p-2 " + card}
                  >
                    <span className={"block h-1.5 rounded-pill " + (i % 3 === 0 ? "w-7 bg-fg" : "w-5 bg-line-strong")} />
                    <span className="block h-1.5 w-4 rounded-pill bg-line" />
                  </div>
                ))}
              </div>
            </div>
            <span className={zoneName}>Mosaic, from its tile</span>
          </div>

          {/* The dialog: grows out of Open, from 0.9, as Flat's Dialog does. */}
          <div className="grid gap-2">
            <div className="relative h-[136px]">
              <div ref={panel} aria-hidden="true" className="absolute inset-x-0 top-0 grid gap-1.5 rounded-surface bg-surface-1 p-3 shadow-modal">
                <span className="text-caption font-title text-fg">Publish atelier.studio?</span>
                <span className="text-caption text-fg-subtle">It goes live for everyone.</span>
                <span className="mt-1 flex justify-end gap-1.5">
                  <span className="rounded-control px-2 py-1 text-caption text-fg-muted">Cancel</span>
                  <span className="rounded-control bg-fg px-2 py-1 text-caption text-canvas">Publish</span>
                </span>
              </div>
              <span ref={opener} className="absolute bottom-0 left-0">
                <Button size="sm" onClick={grow}>
                  Open
                </Button>
              </span>
            </div>
            <span className={zoneName}>Dialog, from Open</span>
          </div>

          {/* The switch's thumb, on the candidate spring. */}
          <div className="grid gap-2">
            <div className="grid h-[136px] items-end" style={thumbVars(spring, reduced)}>
              <Switch label="Live" checked={on} onCheckedChange={setOn} />
            </div>
            <span className={zoneName}>Switch thumb</span>
          </div>
        </div>
      </Stage>
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-fg-subtle">
          <span className="font-title text-fg">{words}</span>
          {today ? ", today" : ""}. Settles in {settle}ms, overshoots {pct(over)}.
        </p>
        <Button size="sm" variant="ghost" onClick={replay}>
          Replay
        </Button>
      </div>
    </div>
  );
}

/** Ten candidates of Flat's expressive spring: a row per bounce, a column per visual time. */
export function FlatBounceExpressive() {
  const [all, setAll] = useState(0);
  const [rows, setRows] = useState<number[]>(() => BOUNCES.map(() => 0));
  const replayRow = (r: number) => setRows((rs) => rs.map((n, i) => (i === r ? n + 1 : n)));
  return (
    <div className="grid gap-8">
      <div className="flex items-start justify-between gap-8">
        <div className="grid max-w-(--measure) gap-2">
          <p className="text-small text-fg-subtle">
            Flat's expressive spring, five bounces at two visual times. Every cell runs the same three moves: a mosaic deals out of its tile, a
            dialog grows out of Open, and the switch's thumb crosses. Press a cell's ground or Replay to run it, a row's Replay to run its two
            times side by side, or Replay all to run all ten at once. Press the tile, Open or the switch to run that move alone.
          </p>
          <p className="text-small text-fg-subtle">
            Today the cap is bounce 0.12 at 350ms, settling within 600ms; a pick past it changes R4 and check 9 (plan 023, phase 2). The
            switch's thumb crosses on the responsive spring today; here it shows each candidate on a small move. Nothing moves under reduced
            motion.
          </p>
        </div>
        <Button variant="primary" onClick={() => setAll((n) => n + 1)}>
          Replay all
        </Button>
      </div>

      <div className="grid grid-cols-[176px_minmax(0,1fr)_minmax(0,1fr)] gap-x-8 gap-y-10">
        <span />
        {TIMES.map((t, j) => (
          <span key={t} className="text-small font-title text-fg">
            {ms(t)} visual time{j === 0 ? ", today" : ""}
          </span>
        ))}
        {BOUNCES.map((b, r) => (
          <div key={b} data-bounce-row={b} className="contents">
            <div className="grid content-start gap-3">
              <div className="grid gap-1">
                <span className="text-h4 font-title text-fg tabular-nums">Bounce {b}</span>
                <span className="text-small text-fg-subtle">{r === 0 ? "Today, the cap" : `Overshoots ${pct(overshoot({ time: TIMES[0], bounce: b }))}`}</span>
              </div>
              <Curve spring={{ time: TIMES[0], bounce: b }} />
              <div>
                <Button size="sm" onClick={() => replayRow(r)}>
                  Replay row
                </Button>
              </div>
            </div>
            {TIMES.map((t) => (
              <ExpressiveCell key={t} spring={{ time: t, bounce: b }} tick={all + rows[r]!} today={r === 0 && t === TIMES[0]} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the responsive candidate */

const VIEWS = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];

function ResponsiveColumn({ bounce, tick }: { bounce: number; tick: number }) {
  const { dial, reduced } = useMotionDial();
  const spring: Spring = { time: dial.responsive.time, bounce };
  const today = bounce === 0;
  const { settle, over } = sayings(spring);
  const [on, setOn] = useState(false);
  const [view, setView] = useState("board");
  const groupId = useId();
  const name = useId();
  /* Under reduced motion the hook's own still transition; otherwise the candidate. */
  const still = useTransition("responsive");
  const enter: Transition = reduced ? still : { type: "spring", visualDuration: spring.time, bounce: spring.bounce };
  const replay = () => {
    setOn((v) => !v);
    setView((v) => VIEWS[(VIEWS.findIndex((o) => o.value === v) + 1) % VIEWS.length]!.value);
  };
  useOnTick(tick, replay);
  const words = `Bounce ${bounce} at ${ms(spring.time)}`;
  return (
    <div className="grid content-start gap-3">
      <div className="grid gap-1">
        <span className="text-h4 font-title text-fg tabular-nums">Bounce {bounce}</span>
        <span className="text-small text-fg-subtle">{today ? "Today" : "The candidate, in Flat only"}</span>
      </div>
      <Stage label={words} className="grid cursor-pointer gap-6" onClick={(e) => !ownJob(e) && replay()}>
        <div style={thumbVars(today ? null : spring, reduced)}>
          <Switch align="end" label="Publish on every push" checked={on} onCheckedChange={setOn} />
        </div>
        <SegmentedFlatBody
          legend={`View, ${words}`}
          showLegend={false}
          name={name}
          value={view}
          options={VIEWS}
          size="md"
          block={false}
          disabled={false}
          className=""
          select={setView}
          groupId={groupId}
          enter={enter}
        />
      </Stage>
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-fg-subtle">
          <span className="font-title text-fg">{words}</span>. Settles in {settle}ms, overshoots {pct(over)}.
        </p>
        <Button size="sm" variant="ghost" onClick={replay}>
          Replay
        </Button>
      </div>
    </div>
  );
}

/** Flat's responsive spring today and with a little bounce, on the switch and the segmented control. */
export function FlatBounceResponsive() {
  const [both, setBoth] = useState(0);
  return (
    <div className="grid gap-8">
      <div className="flex items-start justify-between gap-8">
        <p className="max-w-(--measure) text-small text-fg-subtle">
          Flat's small moves: the switch's thumb and the segmented control's bubble ride the responsive spring, bounce 0 in every world today.
          Should they bounce a little in Flat? Press a frame or Replay to flip the switch and step the bubble on, or Replay both to run the two
          side by side.
        </p>
        <Button variant="primary" onClick={() => setBoth((n) => n + 1)}>
          Replay both
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-8">
        {RESPONSIVE_BOUNCES.map((b) => (
          <ResponsiveColumn key={b} bounce={b} tick={both} />
        ))}
      </div>
    </div>
  );
}
