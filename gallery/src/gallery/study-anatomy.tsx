/**
 * Anatomy (proposals/worlds.md, unit 2): the object at rest in a stage box, with a hairline callout for each part.
 *
 * - Parts: each `selector` is resolved with querySelector inside the object's wrapper after mount, and again when the
 *   wrapper, the stage or a part changes size (fonts, theme, material). A selector that matches nothing warns in dev
 *   and leaves its callout out.
 * - Desktop: labels sit at the stage's sides, alternating left and right so lines never cross, and a 1px line in the
 *   strong hairline runs from each label to its part's edge. Labels that would touch step down.
 * - Phone: the lines give way to a numbered badge on each part's edge, on the side its label would be, and the labels become a numbered list under the stage.
 * - Everything is drawn in one svg over the stage, which sits out of the layout, so it can never widen the page.
 *   Nothing animates. The parts are also a real list for screen readers.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { PageStudy } from "./kit";

/** The stage box of `Stage`, so the object sits where a stage's demo does. */
export const STAGE_BOX =
  "litt-raised relative grid overflow-visible rounded-surface p-4 min-[24rem]:p-8 sm:p-12 in-[[data-material=flat]]:bg-well in-[[data-material=flat]]:shadow-none";

/** The wrapper every drawing of the object shares, in Anatomy and under each material, so it renders the same. */
export const OBJECT_WRAP = "relative grid min-w-0 place-items-center";
/** The same, filling its stage, so an object that takes its width (a slider, a slide to confirm) gets room; Anatomy and the material frames share it, so their objects match. */
export const FILL_WRAP = "relative grid w-full min-w-0 justify-items-center";

type Part = PageStudy["parts"][number];
type Callout = {
  /** The number shown, counting only the parts that resolved. */
  n: number;
  /** The part's index in `parts`. */
  index: number;
  left: boolean;
  /** Where the line meets the part. */
  x: number;
  y: number;
  /** Where the label sits, and where the line leaves it. */
  ly: number;
  lx: number;
  from: number;
  rect: { x: number; y: number; w: number; h: number };
};

const LABEL_INSET = 12; // a label's distance from the stage's side
const LABEL_GAP = 4; // between a label and its line
const LABEL_STEP = 24; // the least distance between two labels on one side

function measure(stage: HTMLElement, wrap: HTMLElement, parts: Part[]): Callout[] {
  const base = stage.getBoundingClientRect();
  const labels = stage.querySelectorAll<HTMLElement>("[data-callout-label]");
  const out: Callout[] = [];
  let n = 0;
  parts.forEach((part, i) => {
    let el: Element | null = null;
    try {
      el = wrap.querySelector(part.selector);
    } catch {
      el = null;
    }
    if (!el) {
      if (import.meta.env.DEV) console.warn(`Anatomy: "${part.name}" has no match for "${part.selector}".`);
      return;
    }
    const r = el.getBoundingClientRect();
    const rect = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    const left = i % 2 === 0;
    const lw = labels[i]?.offsetWidth ?? 0;
    const cy = rect.y + rect.h / 2;
    out.push({
      n: ++n,
      index: i,
      left,
      x: left ? rect.x : rect.x + rect.w,
      y: cy,
      ly: cy,
      lx: left ? LABEL_INSET : base.width - LABEL_INSET - lw,
      from: left ? LABEL_INSET + lw + LABEL_GAP : base.width - LABEL_INSET - lw - LABEL_GAP,
      rect,
    });
  });
  for (const side of [true, false]) {
    const col = out.filter((c) => c.left === side).sort((a, b) => a.ly - b.ly);
    col.forEach((c, k) => {
      if (k > 0 && c.ly - col[k - 1]!.ly < LABEL_STEP) c.ly = col[k - 1]!.ly + LABEL_STEP;
    });
  }
  return out;
}

export function Anatomy({ object, parts, onObjectWidth }: { object: ReactNode; parts: Part[]; onObjectWidth?: (width: number) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const last = useRef("");

  useLayoutEffect(() => {
    const s = stage.current, w = wrap.current;
    if (!s || !w) return;
    const run = () => {
      onObjectWidth?.(w.firstElementChild?.getBoundingClientRect().width ?? 0);
      const next = measure(s, w, parts);
      const key = JSON.stringify(next);
      if (key !== last.current) {
        last.current = key;
        setCallouts(next);
      }
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(s);
    ro.observe(w);
    for (const el of w.querySelectorAll("*")) ro.observe(el);
    void document.fonts?.ready.then(run);
    return () => ro.disconnect();
  }, [parts, onObjectWidth]);

  const placed = new Map(callouts.map((c) => [c.index, c]));

  return (
    <div className="grid gap-4">
      <div ref={stage} className={STAGE_BOX + " min-h-72 place-items-center"}>
        <div ref={wrap} className={FILL_WRAP}>{object}</div>
        {/* The labels hold still and hidden until they are measured. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 max-sm:hidden">
          {parts.map((p, i) => {
            const c = placed.get(i);
            return (
              <span
                key={p.name}
                data-callout-label
                style={c ? { top: c.ly, left: c.lx, translate: "0 -50%" } : undefined}
                className={"absolute flex items-baseline gap-2 whitespace-nowrap text-caption text-fg-muted " + (c ? "" : "invisible")}
              >
                <span className="tabular-nums text-fg-subtle">{c?.n ?? ""}</span>
                {p.name}
              </span>
            );
          })}
        </div>
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {callouts.map((c) => (
            <g key={c.n}>
              <g className="max-sm:hidden">
                <line x1={c.from} y1={c.ly} x2={c.x} y2={c.y} className="stroke-line-strong" strokeWidth={1} />
                <circle cx={c.x} cy={c.y} r={2} className="fill-fg-subtle" />
              </g>
              <g className="sm:hidden">
                <circle cx={c.x + (c.left ? -9 : 9)} cy={c.y} r={9} className="fill-fg" />
                <text x={c.x + (c.left ? -9 : 9)} y={c.y} textAnchor="middle" dominantBaseline="central" className="fill-canvas text-caption tabular-nums">
                  {c.n}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
      {/* The parts as a list: read aloud on desktop, and the labels on a phone. */}
      <ol role="list" className="sr-only m-0 list-none p-0 max-sm:not-sr-only max-sm:grid max-sm:gap-1">
        {callouts.map((c) => (
          <li key={parts[c.index]!.name} className="flex items-baseline gap-2 text-caption text-fg-muted">
            <span aria-hidden="true" className="min-w-[2ch] tabular-nums text-fg-subtle">{c.n}</span>
            {parts[c.index]!.name}
          </li>
        ))}
      </ol>
    </div>
  );
}
