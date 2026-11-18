/**
 * Press, round 2 (plans/024, Press): after the nine calls Nick turned the direction round, from taking Press's
 * materials away to building on them ("the materials we have are brilliant, let's build on them"). Kept: the status
 * tags as raised blocks with coloured words. Changed: the table's rows stop being a raised slat each, and the stat's
 * chart is made of Press's own materials instead of a blue line in a grey tray. Each item is today beside round 2, light
 * over dark, in press-calls.tsx's frames; a candidate is switched on by data-press-call (press-round2.css) or, for the
 * stat, drawn into Stat's public `trend` slot. Made-up data, no requests; nothing in src/components changes.
 */
import type { ReactNode } from "react";
import { Stat } from "@/components/stat";
import { Tag } from "@/components/tag";
import { Column, DeployChart, DeployStat, DeployTable, Statuses, WEEK, type Side } from "./press-calls";
import "./press-round2.css";

const DAYS = ["11", "12", "13", "14", "15", "16", "17"];
const SUMMARY = "Deploys per day, last 7 days: from 24 to 38, low 24, high 38";
const HI = Math.max(...WEEK);

/** The days under a chart, one per value, the latest in the ink. */
function DayRow() {
  return (
    <div aria-hidden="true" className="flex justify-between px-1 text-caption tabular-nums text-fg-subtle">
      {DAYS.map((d, i) => (
        <span key={d} className={"w-5 text-center " + (i === DAYS.length - 1 ? "text-fg" : "")}>
          {d}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- chart A: blocks in a tray */

/** Seven raised blocks standing in a tray, as a segmented control's choice stands in its own: a day is a block as tall as its count, from zero. */
function BlocksInTray() {
  return (
    <div role="img" aria-label={SUMMARY} className="grid gap-2">
      <div className="flex h-20 items-end gap-1 rounded-control bg-tray p-1 shadow-(--tray-shade)">
        {WEEK.map((v, i) => (
          <div
            key={DAYS[i]}
            data-r2-block={i === WEEK.length - 1 ? "today" : ""}
            className="flex-1 rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-block shadow-(--block-lift) forced-colors:border"
            style={{ height: `${Math.round((v / HI) * 100)}%` }}
          />
        ))}
      </div>
      <DayRow />
    </div>
  );
}

/* ---------------------------------------------------------------- chart B: a trace on a glass readout */

const GW = 400;
const GH = 56;
const PAD = 8;

/** A pane of glass floating over the plate, the week drawn on it in one ink line with a dot on today. */
function GlassReadout() {
  const lo = Math.min(...WEEK);
  const x = (i: number) => PAD + (i * (GW - 2 * PAD)) / (WEEK.length - 1);
  const y = (v: number) => PAD + (1 - (v - lo) / (HI - lo)) * (GH - 2 * PAD);
  const d = WEEK.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <div role="img" aria-label={SUMMARY} className="grid gap-2">
      <div className="litt-glass rounded-control px-2 py-1">
        <svg viewBox={`0 0 ${GW} ${GH}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={0} x2={GW} y1={GH * t} y2={GH * t} strokeWidth={1} className="stroke-line" />
          ))}
          <path d={d} fill="none" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" className="stroke-fg" />
          <circle cx={x(WEEK.length - 1)} cy={y(WEEK[WEEK.length - 1]!)} r={3} className="fill-fg" />
        </svg>
      </div>
      <DayRow />
    </div>
  );
}

/* ---------------------------------------------------------------- chart C: slots cut into the plate */

/** Seven slots cut into the stat's plate, each pulled out to its day's count as the slider's fill is, and today's cap riding on its fill. */
function SlotsInPlate() {
  return (
    <div role="img" aria-label={SUMMARY} className="grid gap-2">
      <div className="flex h-20 justify-between px-1">
        {WEEK.map((v, i) => {
          const today = i === WEEK.length - 1;
          const fill = `${Math.round((v / HI) * 100)}%`;
          return (
            <div key={DAYS[i]} className="relative flex w-5 justify-center">
              <div className="relative h-full w-3 overflow-hidden rounded-[calc(var(--radius-control)-2px)] bg-slot shadow-(--slot-shade)">
                <div className="absolute inset-x-0 bottom-0 bg-slot-fill shadow-(--slot-fill-shade)" style={{ height: fill }} />
              </div>
              {today && (
                <span
                  data-r2-cap=""
                  className="absolute left-1/2 grid h-2 w-5 -translate-x-1/2 translate-y-1/2 place-items-center rounded-[calc(var(--radius-control)-2px)] bg-cap shadow-(--cap-lift)"
                  style={{ bottom: fill }}
                >
                  <span className="h-px w-3 bg-cap-grip" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <DayRow />
    </div>
  );
}

/* ---------------------------------------------------------------- the stat, with a chart */

function StatWith({ trend }: { trend: ReactNode }) {
  return <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" trend={trend} />;
}

/** Under a candidate that does not carry to the two-series chart, the reason in one line. */
function NoChart({ children }: { children: ReactNode }) {
  return <p className="max-w-[48ch] text-small text-fg-muted">{children}</p>;
}

/* ---------------------------------------------------------------- the items */

export type PressRound2Id = "table" | "tags" | "chart-blocks" | "chart-glass" | "chart-slots";

type Item = { line: string; left: Side; right: Side };

const today = (render: () => ReactNode, label = "Today"): Side => ({ label, render });

const todayStat = today(() => (
  <>
    <DeployStat hue />
    <DeployChart />
  </>
));

/** Today's six statuses, and the set with Building as a blue word on a block like the others: the only change. */
function TagsMatched() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag status="success">Ready</Tag>
      <Tag status="success">Live</Tag>
      <Tag status="warning">In review</Tag>
      <Tag data-r2-building="">Building</Tag>
      <Tag status="neutral">Draft</Tag>
      <Tag status="danger">Failed</Tag>
    </div>
  );
}

const ITEMS: Record<PressRound2Id, Item> = {
  table: {
    line: "The rows stop being a raised slat each and sit together on the table's one tray, a hairline between them; the header rail and the raised status tags stay as they are.",
    left: today(() => <DeployTable />),
    right: { label: "Round 2: rows on one tray", call: "r2-one-tray", render: () => <DeployTable /> },
  },
  tags: {
    line: "Kept as they are: each status a raised block with a coloured word. Building, the one tinted fill, becomes a blue word on a block like the rest; that is the only change.",
    left: today(() => <Statuses building="tint" />, "Today, kept"),
    right: { label: "Building matched (the only change)", render: () => <TagsMatched /> },
  },
  "chart-blocks": {
    line: "The blue line becomes seven raised blocks standing in the tray, one per day and as tall as its count, as a segmented control's choice stands in its tray; the figure stays on its raised face.",
    left: todayStat,
    right: {
      label: "Round 2: blocks in a tray",
      render: () => (
        <>
          <StatWith trend={<BlocksInTray />} />
          <NoChart>Does not carry to the two-series line chart: a block stands for one value, and two lines have no blocks to stand. A bar chart could take it.</NoChart>
        </>
      ),
    },
  },
  "chart-glass": {
    line: "The tray goes; the week is one ink line on a pane of glass floating over the plate. The line chart's well becomes the same glass, its series and rail unchanged.",
    left: todayStat,
    right: {
      label: "Round 2: a trace on a glass readout",
      call: "r2-glass",
      render: () => (
        <>
          <StatWith trend={<GlassReadout />} />
          <DeployChart />
        </>
      ),
    },
  },
  "chart-slots": {
    line: "The tray goes; seven slots are cut into the stat's plate, each pulled out to its day's count as the slider's fill is, with today's cap riding on its fill.",
    left: todayStat,
    right: {
      label: "Round 2: slots cut into the plate",
      render: () => (
        <>
          <StatWith trend={<SlotsInPlate />} />
          <NoChart>Does not carry to the two-series line chart: a slot shows one value pulled out, and a line has nothing to pull. A bar chart could take it.</NoChart>
        </>
      ),
    },
  },
};

export function PressRound2Preview({ item }: { item: PressRound2Id }) {
  const it = ITEMS[item];
  return (
    <div data-press-round2={item} className="grid gap-6">
      <p className="max-w-[80ch] text-small text-fg-muted">{it.line}</p>
      <div className="grid grid-cols-2 items-start gap-6">
        <Column side={it.left} pick={false} />
        <Column side={it.right} pick />
      </div>
    </div>
  );
}
