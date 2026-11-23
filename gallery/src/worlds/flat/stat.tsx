/**
 * Stat, the Flat body (taste v1.22, "Flat is the studies"; proposals/flat-studies/studies/number-ticker.js): a white
 * paper card on the grey ground holding one figure that stands up.
 *
 * - The card is paper (.litt-paper: --surface-1 at the surface radius, no edge and nothing cast), so a field or a pill
 *   set into it reads as the grey bubble.
 * - The label is small and grey. The figure is the ink at the title weight with tabular figures, its unit after it in
 *   grey: --type-figure-size (28px) in a row of tiles, and the large figure (text-figure-lg, 44px) when it is the whole
 *   card, a Stat on its own (v1.22, Q-A). One figure per object.
 * - The delta is words at the small size with nothing before it (no dot, no arrow). Bad news is the danger colour, a
 *   word that must warn; good news is the ink and neither the quiet grey, since Flat is monochrome. A hidden word says
 *   whether it is news, so colour is never the only signal.
 * - The figure rolls, after the components repo's number ticker: when the value changes, each digit turns on its own
 *   spring to its new figure, the rightmost first, forward through nine to nought when the count goes up (as a counter
 *   carries) and back when it goes down. It is an arrival, so the expressive spring. It moves only when the value
 *   changes: the first paint is still, and reduced motion sets the new figure at once. A screen reader reads the value
 *   itself; the turning digits are hidden from it.
 */
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import type { StatBodyProps } from "@/components/stat";
import { useStagger, useTransition } from "@/motion";

/** Flat: one figure on a paper card, that rolls to a new value. */
export function StatFlatBody({ label, value, figure, unit, delta, toneWord, trend, alone, className }: StatBodyProps) {
  /* Bad news warns in the danger colour; good news is the ink, neither the quiet grey. */
  const deltaTone = toneWord.includes("bad") ? "text-danger" : toneWord.includes("good") ? "text-fg" : "text-fg-subtle";
  const rolls = (typeof value === "number" || typeof value === "string") && figure === value;
  return (
    <div
      data-body="flat"
      data-part="paper"
      className={"litt-paper flex h-full min-w-0 flex-col gap-1 rounded-surface bg-surface-1 p-5 forced-colors:border " + className}
    >
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        <span data-figure="" className={(alone ? "text-figure-lg" : "text-figure") + " tabular-nums text-fg"}>
          {rolls ? <Rolling value={String(value)} /> : figure}
          {unit && <span className="text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-small " + deltaTone}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}

/** The value as rolling digits, keyed from the right so a digit keeps its place when the count gains one. */
function Rolling({ value }: { value: string }) {
  const last = useRef(value);
  const before = last.current;
  /* Up or down: read as numbers where both are, so 99 to 100 rolls forward. */
  const a = Number(before.replace(/[^\d.-]/g, ""));
  const b = Number(value.replace(/[^\d.-]/g, ""));
  const direction = Number.isFinite(a) && Number.isFinite(b) && b < a ? -1 : 1;
  useEffect(() => {
    last.current = value;
  }, [value]);
  const chars = [...value];
  const digits = chars.filter((c) => /\d/.test(c)).length;
  let seen = 0;
  const nodes: ReactNode[] = chars.map((c, i) => {
    if (!/\d/.test(c)) return <span key={"s" + i}>{c}</span>;
    const fromRight = digits - seen++;
    return <Digit key={"d" + fromRight} figure={Number(c)} order={fromRight - 1} direction={direction} />;
  });
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {nodes}
      </span>
    </>
  );
}

/* Two turns of the ten figures, so a digit can carry either way and fold back onto the first turn. */
const FIGURES = Array.from({ length: 20 }, (_, i) => i % 10);

/** One digit: a strip of figures in a window one figure tall, turned to its figure on the expressive spring. */
function Digit({ figure, order, direction }: { figure: number; order: number; direction: number }) {
  const arrive = useTransition("expressive");
  const stagger = useStagger();
  const at = useMotionValue(figure);
  const y = useTransform(at, (p) => `${(-p * 5).toFixed(3)}%`);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const from = Math.round(at.get()) % 10;
    if (from === figure && Math.abs(at.get() - Math.round(at.get())) < 0.01) return;
    if (arrive.type !== "spring") {
      at.jump(figure);
      return;
    }
    const start = direction < 0 && figure > from ? from + 10 : from;
    const to = direction > 0 && figure < from ? figure + 10 : figure;
    at.jump(start);
    const run = animate(at, to, { ...arrive, delay: order * stagger });
    void run.then(() => at.jump(figure));
    return () => run.stop();
  }, [figure]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="relative inline-block overflow-hidden">
      <span className="invisible">0</span>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col text-center" style={{ y }}>
        {FIGURES.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}
