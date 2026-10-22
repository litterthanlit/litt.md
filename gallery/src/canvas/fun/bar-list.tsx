/**
 * Bar list · fun mode. Every settled frame is the BarList (bar-list.tsx) to the pixel: one grid of subgrid rows split by
 * hairlines, the lead, the label, the 4px rail on fg 12% and the mono value, in its wide and narrow layouts.
 *
 * - Arrival: the bars grow in rank order, a beat apart, and each value counts with its bar.
 * - Change: bars spring from their old length to the new, the values count between, and rows that trade places slide
 *   past each other, the climber passing over the one it overtakes.
 * - The slide is measured from layout offsets, not the screen, so it stays exact inside a zoomed canvas.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { groupDigits, useFun } from "./motion";
import type { FunHue } from "./meter";

const HUE: Record<FunHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
const WIDE = "grid-cols-[0.5rem_[lead]_auto_[label]_fit-content(14rem)_[bar]_minmax(6rem,1fr)_[value]_auto_[delta]_auto_[end]_0.5rem]";
const NARROW = "@max-[28rem]:grid-cols-[0.5rem_[lead]_auto_[label]_minmax(0,1fr)_[value]_auto_[delta]_auto_[end]_0.5rem]";
const ROW = "col-span-full grid min-h-control-md grid-cols-subgrid items-center rounded-control py-2 text-left";

export type FunBarItem = { label: string; value: number; lead?: ReactNode };

export type FunBarListProps = {
  label: string;
  items: FunBarItem[];
  hue?: FunHue;
  unit: [one: string, other: string];
  play: number;
};

export function FunBarList({ label, items, hue, unit, play }: FunBarListProps) {
  const fun = useFun();
  const ranked = [...items].sort((a, b) => b.value - a.value);
  const top = Math.max(0, ...ranked.map((i) => i.value));
  const fill = hue ? HUE[hue] : "bg-fg";

  /* FLIP from layout offsets: where each row was before this render, and where it is now. */
  const rows = useRef(new Map<string, HTMLLIElement>());
  const before = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const moved: Promise<unknown>[] = [];
    rows.current.forEach((el, key) => {
      const was = before.current.get(key);
      const now = el.offsetTop;
      if (was !== undefined && was !== now && !fun.reduced) {
        /* The climber passes over the row it overtakes. */
        el.style.zIndex = was > now ? "2" : "1";
        moved.push(animate(el, { y: [was - now, 0] }, fun.swap).then(() => void (el.style.zIndex = "")));
      }
      before.current.set(key, now);
    });
  });

  return (
    <div className="@container w-full">
      <ol role="list" aria-label={label} className={"m-0 grid list-none p-0 " + WIDE + " " + NARROW}>
        {ranked.map((item, i) => (
          <li
            key={item.label}
            ref={(el) => {
              if (el) rows.current.set(item.label, el);
              else rows.current.delete(item.label);
            }}
            className="relative col-span-full grid grid-cols-subgrid border-t border-line bg-surface-1 first:border-t-0"
          >
            <div className={ROW}>
              <Cells item={item} share={top > 0 ? (item.value / top) * 100 : 0} fill={fill} unit={unit} play={play} delay={i * 0.07} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Cells({ item, share, fill, unit, play, delay }: { item: FunBarItem; share: number; fill: string; unit: [string, string]; play: number; delay: number }) {
  const fun = useFun();
  const reach = useMotionValue(share);
  const x = useTransform(reach, (r) => `${r - 100}%`);
  /* Moving: a transform. Settled: sized by width, the BarList's own markup, so the rest frame matches it to the pixel. */
  const [moving, setMoving] = useState(false);
  useMotionValueEvent(reach, "animationStart", () => setMoving(true));
  useMotionValueEvent(reach, "animationComplete", () => setMoving(false));
  useMotionValueEvent(reach, "animationCancel", () => setMoving(false));
  const [shown, setShown] = useState(item.value);
  const span = useRef({ from: item.value, to: item.value, fromReach: share, toReach: share });
  const came = useRef(1);
  useMotionValueEvent(reach, "change", (r) => {
    const { from, to, fromReach, toReach } = span.current;
    const p = toReach === fromReach ? 1 : (r - fromReach) / (toReach - fromReach);
    came.current = Math.max(came.current, Math.max(0, Math.min(1, p)));
    setShown(Math.round(from + (to - from) * came.current));
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) return;
    span.current = { from: 0, to: item.value, fromReach: 0, toReach: share };
    came.current = 0;
    reach.set(0);
    setShown(0);
    const run = animate(reach, share, { ...fun.grow, delay: fun.reduced ? 0 : delay });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new `play` replays the arrival
  }, [play]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    span.current = { from: shown, to: item.value, fromReach: reach.get(), toReach: share };
    came.current = 0;
    const run = animate(reach, share, fun.grow);
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the data only
  }, [item.value, share]);

  return (
    <>
      {item.lead != null && (
        <span aria-hidden="true" className="col-start-[lead] row-start-1 pr-3">
          <span className="flex max-w-12 items-center gap-1">{item.lead}</span>
        </span>
      )}
      <span className="col-start-[label] row-start-1 block min-w-0 truncate text-small text-fg">
        {item.label}
        <span className="sr-only">, </span>
      </span>
      <span
        aria-hidden="true"
        className="col-start-[bar] row-start-1 px-4 @max-[28rem]:col-start-[label] @max-[28rem]:col-end-[end] @max-[28rem]:row-start-2 @max-[28rem]:px-0 @max-[28rem]:pt-1"
      >
        <span className="block h-1 overflow-hidden rounded-control bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]">
          {moving ? (
            <motion.span className={"block h-full w-full rounded-control " + fill} style={{ x }} />
          ) : (
            <span className={"block h-full rounded-control " + fill} style={{ width: `${share}%` }} />
          )}
        </span>
      </span>
      <span className="col-start-[value] row-start-1 text-right @max-[28rem]:pl-3 font-mono text-small tabular-nums text-fg">
        <span aria-hidden="true">{groupDigits(shown)}</span>
        <span className="sr-only">{`${groupDigits(item.value)} ${item.value === 1 ? unit[0] : unit[1]}`}</span>
      </span>
    </>
  );
}
