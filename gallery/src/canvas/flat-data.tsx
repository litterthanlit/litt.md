/**
 * Flat's data, in colour (Nick, 2026-11-18, after the three directions: "I meant the data visualization and just
 * overall, guages, heatmap, etc, should be colorful, my bad. and just the feel. I like this but I think it's not the
 * right move"). The surfaces stay as Nick approved them (the grey ground, white paper with no edge, pills, the ink
 * card, a status as a dot and a word); what turns colourful is the data.
 *
 * - `FlatDataToday`: every data part Flat has, live, as it ships (Flat's five muted --flat-data-* hues).
 * - `FlatDataPalette`: the same live parts under one candidate palette (flat-data-palettes.ts). The frame sets the
 *   palette's first five hues as Flat's own --flat-data-* properties, so every part reads them through its public
 *   `hue` prop, unchanged. What no prop can reach is drawn here from tokens and marked "drawn": the sequential ramp
 *   on the Heatmap's and the Cohort grid's dots (flat-data.css swaps their four mixes for the ramp's four steps), a
 *   gauge whose ticks walk the ramp, a diverging bar, and slots six to eight.
 * - `FlatDataScreen`: one airy screen, a person's own site and letter (no site name), in the palette recommended.
 *
 * Nothing in src/components, src/worlds or tokens.css changes. Every part is static at rest: the charts and the dot
 * plot are drawn with `entrance={false}` and fun mode is off, so nothing moves on load. Made-up data, no requests.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { BarList } from "@/components/bar-list";
import { Breakdown } from "@/components/breakdown";
import { Card } from "@/components/card";
import { BarChart, LineChart, Meter, StackedBarChart } from "@/components/chart";
import { CohortGrid } from "@/components/cohort-grid";
import { DotPlot } from "@/components/dot-plot";
import { Funnel } from "@/components/funnel";
import { Gauge } from "@/components/gauge";
import { Heatmap } from "@/components/heatmap";
import { Legend } from "@/components/legend";
import { Progress } from "@/components/progress";
import { RangeChart } from "@/components/range-chart";
import { Sparkline } from "@/components/sparkline";
import { Spread } from "@/components/spread";
import { Stat, StatGroup } from "@/components/stat";
import { Tag } from "@/components/tag";
import { MaterialProvider, OverlayRoot } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { DATA_PALETTES, SLOTS, type DataPalette, type DataPaletteId } from "./flat-data-palettes";
import "./flat-data.css";

/* ---------------------------------------------------------------- the frame */

/** A palette as custom properties: its first five hues as Flat's own data tokens, then every slot, the ramp and the
    diverging pair under --fd-* for what this file draws itself. */
function paletteVars(p: DataPalette, dark: boolean): CSSProperties {
  const pick = (pair: { light: string; dark: string }) => (dark ? pair.dark : pair.light);
  const out: Record<string, string> = {};
  SLOTS.forEach((slot, i) => {
    out[`--flat-data-${slot}`] = pick(p.hues[i].mark);
    out[`--flat-data-${slot}-text`] = pick(p.hues[i].text);
  });
  p.hues.forEach((h, i) => (out[`--fd-hue-${i + 1}`] = pick(h.mark)));
  p.seq.forEach((s, i) => (out[`--fd-seq-${i + 1}`] = pick(s)));
  out["--fd-down"] = pick(p.down);
  out["--fd-up"] = pick(p.up);
  return out as CSSProperties;
}

/** One Flat frame in its own theme, holding its own overlays (a chart's or a heatmap's tooltip). */
function DataFrame({ palette, dark, children }: { palette?: DataPaletteId; dark: boolean; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setEl}
      {...lookAttributes({ accent: "world", material: "flat" }, dark)}
      data-flat-data={palette ?? "today"}
      style={palette ? paletteVars(DATA_PALETTES[palette], dark) : undefined}
      className="relative grid content-start gap-6 rounded-surface bg-canvas p-8 text-fg contain-layout"
    >
      <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
      <MaterialProvider material="flat">
        <OverlayRoot container={el}>{children}</OverlayRoot>
      </MaterialProvider>
    </div>
  );
}

/** White paper on the grey ground: no edge, no shadow (plans/024, Flat). */
function Paper({ title, note, className = "", children }: { title: string; note?: string; className?: string; children: ReactNode }) {
  return (
    <section className={"grid content-start gap-4 rounded-surface bg-surface-1 p-6 " + className}>
      <header className="grid gap-1">
        <h3 className="text-small font-title text-fg">{title}</h3>
        {note && <p className="text-caption text-fg-subtle">{note}</p>}
      </header>
      {children}
    </section>
  );
}

/** Says a piece is drawn in this experiment, not by the part: what it shows needs a contract change. */
function Drawn() {
  return <span className="text-caption text-fg-subtle"> · drawn here, a contract change</span>;
}

/* ---------------------------------------------------------------- made-up data: a person's site and letter */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const READS = [140, 162, 155, 188, 240, 171, 148];
const LAST_WEEK = [150, 141, 170, 160, 205, 188, 131];
const WEEK = [820, 904, 870, 990, 1040, 1118, 1204];
const OPENS = [52, 55, 54, 58, 57, 61, 63];
const REPLIES = [4, 6, 5, 9, 7, 8, 12];
const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
const FROM = {
  letter: [320, 360, 340, 410, 430, 470, 455, 520],
  search: [180, 170, 210, 200, 240, 230, 260, 250],
  friends: [90, 120, 110, 140, 130, 170, 190, 210],
};
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
/** Reads by hour for each day: quiet nights, a morning and an evening swell, more on Friday when the letter goes out. */
const HEAT = DAYS.map((day, d) => ({
  label: day,
  values: HOURS.map((_, h) => {
    if (h < 6) return h === 0 && d === 4 ? 2 : 0;
    const morning = Math.exp(-((h - 8) ** 2) / 4) * 14;
    const evening = Math.exp(-((h - 20) ** 2) / 6) * 18;
    const letter = d === 4 ? Math.exp(-((h - 9) ** 2) / 3) * 22 : 0;
    const wobble = ((d * 7 + h * 13) % 5) - 2;
    return Math.max(0, Math.round(morning + evening + letter + 3 + wobble + (d >= 5 ? 3 : 0)));
  }),
}));
const COHORTS = [
  { label: "7 Sep", size: 212, values: [100, 64, 55, 51, 48, 46] },
  { label: "14 Sep", size: 188, values: [100, 61, 52, 47, 45] },
  { label: "21 Sep", size: 240, values: [100, 66, 58, 53] },
  { label: "28 Sep", size: 205, values: [100, 59, 50] },
  { label: "5 Oct", size: 231, values: [100, 63] },
  { label: "12 Oct", size: 196, values: [100] },
];
const READ_MINUTES = [1.2, 1.8, 2.1, 2.4, 2.6, 2.9, 3.1, 3.3, 3.4, 3.6, 3.8, 4.0, 4.1, 4.3, 4.6, 4.8, 5.2, 5.5, 5.9, 6.4, 7.1, 7.8, 8.6, 9.9, 12.4];
const VISITS = Array.from({ length: 60 }, (_, i) => ({ label: `Day ${i + 1}`, value: Math.round(380 + 140 * Math.sin(i / 5) + (i > 40 ? 260 : 0) + ((i * 37) % 60)) }));
/** Readers by where they are: eight, so slots six to eight show. */
const PLACES = [
  { label: "Portugal", value: 31 },
  { label: "Nigeria", value: 18 },
  { label: "Finland", value: 14 },
  { label: "Brazil", value: 11 },
  { label: "Japan", value: 9 },
  { label: "Canada", value: 7 },
  { label: "India", value: 6 },
  { label: "Kenya", value: 4 },
];

/* ---------------------------------------------------------------- drawn pieces (what no prop reaches yet) */

const TICKS = 40;

/** A Gauge whose lit ticks walk the palette's sequential ramp by position, so the colour says how far round the value
    is. The Gauge's own geometry (a semicircle of 2px ticks, the figure in the opening); static, never animates. */
function RampGauge({ label, value, figure, caption, size = 220 }: { label: string; value: number; figure: string; caption: string; size?: number }) {
  const half = size / 2;
  const outer = half - 2;
  const length = Math.max(8, Math.round(size / 16));
  const inner = outer - length;
  const lit = Math.max(1, Math.round((value / 100) * TICKS));
  const at = (i: number, from: number, to: number) => {
    const a = Math.PI * (1 - i / (TICKS - 1));
    const r = (n: number) => Math.round(n * 100) / 100;
    return `M${r(half + from * Math.cos(a))} ${r(half - from * Math.sin(a))}L${r(half + to * Math.cos(a))} ${r(half - to * Math.sin(a))}`;
  };
  /* Tick i's colour: its place along the arc, read off the four steps of the ramp. */
  const tone = (i: number) => {
    const t = (i / (TICKS - 1)) * 3;
    const k = Math.min(2, Math.floor(t));
    const u = Math.round((t - k) * 100);
    return `color-mix(in oklab, var(--fd-seq-${k + 2}) ${u}%, var(--fd-seq-${k + 1}))`;
  };
  const pad = `${Math.round(((length + 14) / size) * 100)}%`;
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={figure} className="relative w-full" style={{ maxWidth: size }}>
      <svg viewBox={`0 0 ${size} ${Math.ceil(half) + 1}`} aria-hidden="true" className="block h-auto w-full">
        <g fill="none" strokeWidth={2} strokeLinecap="butt">
          {Array.from({ length: TICKS }, (_, i) => (
            <path key={i} d={at(i, inner, outer + (i === lit - 1 ? 4 : 0))} style={{ stroke: i < lit ? tone(i) : "color-mix(in oklab, var(--fg) 12%, transparent)" }} />
          ))}
        </g>
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 text-center" style={{ paddingInline: pad }}>
        <span className="text-caption text-fg-subtle">{label}</span>
        <span className="text-h2 tabular-nums text-fg">{figure}</span>
        <span className="text-caption text-fg-subtle">{caption}</span>
      </div>
    </div>
  );
}

/** Reads against last week, day by day: up in one pole, down in the other, from a neutral zero line. */
function DivergingBars() {
  const change = READS.map((r, i) => r - LAST_WEEK[i]);
  const most = Math.max(...change.map(Math.abs));
  return (
    <figure className="grid gap-3">
      <div role="img" aria-label={`Reads against last week: ${DAYS.map((d, i) => `${d} ${change[i] > 0 ? "up" : "down"} ${Math.abs(change[i])}`).join(", ")}`} className="grid grid-cols-7 gap-2">
        {change.map((c, i) => (
          <div key={DAYS[i]} className="grid grid-rows-[48px_1px_48px] justify-items-center gap-0">
            <div className="flex w-full items-end justify-center">{c > 0 && <span className="w-4 rounded-t-control" style={{ height: `${(c / most) * 48}px`, background: "var(--fd-up)" }} />}</div>
            <span className="w-full bg-line-strong" />
            <div className="flex w-full items-start justify-center">{c < 0 && <span className="w-4 rounded-b-control" style={{ height: `${(-c / most) * 48}px`, background: "var(--fd-down)" }} />}</div>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 gap-2 text-center text-caption text-fg-subtle tabular-nums">
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-4 text-caption text-fg-subtle">
        <Key color="var(--fd-up)">More than last week</Key>
        <Key color="var(--fd-down)">Fewer</Key>
      </figcaption>
    </figure>
  );
}

function Key({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="h-1 w-3 rounded-control" style={{ background: color }} />
      {children}
    </span>
  );
}

/** Eight parts of a whole, one per slot: the Breakdown's rail with slots six to eight, which the part folds into Other. */
function EightRail() {
  const total = PLACES.reduce((s, p) => s + p.value, 0);
  return (
    <div className="grid gap-3">
      <div role="img" aria-label={`Readers by country: ${PLACES.map((p) => `${p.label} ${p.value}%`).join(", ")}`} className="flex h-2 gap-0.5">
        {PLACES.map((p, i) => (
          <span key={p.label} className="h-full rounded-control" style={{ flexGrow: p.value / total, background: `var(--fd-hue-${i + 1})` }} />
        ))}
      </div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
        {PLACES.map((p, i) => (
          <li key={p.label} className="inline-flex items-center gap-2">
            <span className="h-1 w-3 rounded-control" style={{ background: `var(--fd-hue-${i + 1})` }} />
            <span className="text-fg">{p.label}</span>
            <span className="tabular-nums text-fg-subtle">{p.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The palette itself: eight hues in their order, the ramp, the diverging pair round Flat's neutral. */
function Swatches({ palette }: { palette: DataPaletteId }) {
  const p = DATA_PALETTES[palette];
  return (
    <div className="grid gap-4 rounded-surface bg-surface-1 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-small font-title text-fg">{p.name}</h3>
        <p className="text-caption text-fg-subtle">{p.line}</p>
      </div>
      <ol className="grid grid-cols-8 gap-2">
        {p.hues.map((h, i) => (
          <li key={h.name} className="grid gap-1">
            <span className="h-8 rounded-control" style={{ background: `var(--fd-hue-${i + 1})` }} />
            <span className="text-caption text-fg">
              {i + 1} {h.name}
            </span>
            <span className="text-caption text-fg-subtle">{i < 5 ? `as ${SLOTS[i]}` : "no slot yet"}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-6 text-caption text-fg-subtle">
        <span className="inline-flex items-center gap-2">
          Ramp
          {[1, 2, 3, 4].map((s) => (
            <span key={s} className="size-4 rounded-pill" style={{ background: `var(--fd-seq-${s})` }} />
          ))}
        </span>
        <span className="inline-flex items-center gap-2">
          Diverging
          <span className="size-4 rounded-pill" style={{ background: "var(--fd-down)" }} />
          <span className="size-4 rounded-pill bg-line-strong" />
          <span className="size-4 rounded-pill" style={{ background: "var(--fd-up)" }} />
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- every data part */

/** Every data part Flat has, live, through its public props. `palette` adds the drawn pieces and the ramp on the dots. */
function DataParts({ palette }: { palette?: DataPaletteId }) {
  const ramp = palette ? { "data-fd-ramp": "" } : {};
  return (
    <div className="grid grid-cols-2 gap-4">
      {palette && (
        <div className="col-span-2">
          <Swatches palette={palette} />
        </div>
      )}
      <Paper title="Stat and Sparkline" className="col-span-2">
        <StatGroup>
          <Stat label="Readers" value="1,204" delta="Up 86 on last week" tone="good" trend={<Sparkline label="Readers, last 7 days" values={WEEK} hue="blue" />} />
          <Stat label="Opened the letter" value="63" unit="%" delta="Up 2 points" tone="good" trend={<Sparkline label="Open rate, last 7 letters" values={OPENS} hue="amber" />} />
          <Stat label="Replies" value="12" delta="Up 4 on last week" trend={<Sparkline label="Replies, last 7 days" values={REPLIES} hue="teal" />} />
          <Stat label="Unsubscribed" value="3" delta="Down 2" tone="good" trend={<Sparkline label="Unsubscribes, last 7 days" values={[5, 4, 6, 3, 4, 2, 3]} hue="violet" />} />
        </StatGroup>
      </Paper>
      <Paper title="Gauge">
        <div className="grid grid-cols-2 items-end justify-items-center gap-4">
          <Gauge label="Letter opened" value={63} valueText="63 percent" figure="63%" caption="of 1,204 readers" hue="blue" size={220} />
          {palette ? (
            <div className="grid justify-items-center gap-1">
              <RampGauge label="Storage" value={78} figure="78%" caption="of 10 GB" />
              <Drawn />
            </div>
          ) : (
            <Gauge label="Storage" value={78} valueText="78 percent" figure="78%" caption="of 10 GB" size={220} />
          )}
        </div>
      </Paper>
      <Paper title="Meter">
        <div className="grid gap-6">
          <Meter label="Letters sent this month" value={3} max={4} valueText="3 of 4" hue="blue" />
          <Meter label="Storage" value={7.8} max={10} valueText="7.8 of 10 GB" hue="amber" target={9} targetText="Plan limit warning at 9 GB" />
          <Meter label="Draft words" value={640} max={1200} valueText="640 of 1,200" hue="teal" />
        </div>
      </Paper>
      <Paper title="Heatmap" note={palette ? "The ramp's four steps on the dots, drawn over the part's four mixes." : "One hue's four mixes over the paper."} className="col-span-2">
        <div {...ramp}>
          <Heatmap label="Reads by hour, this week" rows={HEAT} columns={HOURS} columnTicks={[0, 6, 12, 18].map((i) => ({ index: i, label: HOURS[i] }))} hue="blue" unit={["read", "reads"]} cell={14} />
        </div>
      </Paper>
      <Paper title="Bar chart">
        <BarChart label="Reads a day, this week" labels={DAYS} series={[{ name: "Reads", values: READS, hue: "blue" }]} unit="reads" xTitle="Day" height={200} entrance={false} />
      </Paper>
      <Paper title="Stacked bar chart">
        <StackedBarChart
          label="Reads a week by where they came from"
          labels={WEEKS}
          series={[
            { name: "The letter", values: FROM.letter, hue: "blue" },
            { name: "Search", values: FROM.search, hue: "amber" },
            { name: "Friends", values: FROM.friends, hue: "teal" },
          ]}
          unit="reads"
          xTitle="Week"
          height={200}
          entrance={false}
        />
      </Paper>
      <Paper title="Line chart and Legend" className="col-span-2">
        <Legend label="Sources" items={[{ name: "The letter", hue: "blue" }, { name: "Search", hue: "amber" }, { name: "Friends", hue: "teal" }]} lines />
        <LineChart
          label="Reads a week by where they came from"
          labels={WEEKS}
          series={[
            { name: "The letter", values: FROM.letter, hue: "blue" },
            { name: "Search", values: FROM.search, hue: "amber" },
            { name: "Friends", values: FROM.friends, hue: "teal" },
          ]}
          unit="reads"
          xTitle="Week"
          height={200}
          legend={false}
          entrance={false}
        />
      </Paper>
      <Paper title="Breakdown">
        <Breakdown
          label="Where readers read"
          unit={["reader", "readers"]}
          items={[
            { label: "Phone", value: 612 },
            { label: "Laptop", value: 344 },
            { label: "Mail app", value: 151 },
            { label: "Tablet", value: 66 },
            { label: "Watch", value: 31 },
          ]}
          layout="legend"
        />
        {palette && (
          <div className="grid gap-2">
            <span className="text-caption text-fg-subtle">
              All eight slots
              <Drawn />
            </span>
            <EightRail />
          </div>
        )}
      </Paper>
      <Paper title="Bar list">
        <BarList
          label="Most read"
          unit={["read", "reads"]}
          hue="blue"
          items={[
            { label: "Open water", value: 412 },
            { label: "Notes on grey", value: 288 },
            { label: "Issue 14", value: 164 },
            { label: "A small kitchen", value: 97 },
          ]}
        />
      </Paper>
      <Paper title="Funnel">
        <Funnel
          label="From a visit to a reader"
          hue="teal"
          unit={["person", "people"]}
          steps={[
            { label: "Visited", value: 4820 },
            { label: "Read a post", value: 2310 },
            { label: "Signed up", value: 412 },
            { label: "Opened a letter", value: 260 },
          ]}
        />
      </Paper>
      <Paper title="Cohort grid" note={palette ? "The ramp's steps on the dots, as the Heatmap." : undefined}>
        <div {...ramp}>
          <CohortGrid label="Readers still opening, by signup week" hue="blue" cohorts={COHORTS} />
        </div>
      </Paper>
      <Paper title="Spread">
        <Spread
          label="Minutes read, by post"
          hue="violet"
          formatValue={(v) => `${v.toFixed(1)} m`}
          items={[
            { label: "Open water", min: 0.8, p25: 2.4, median: 3.6, p75: 5.1, max: 9.2 },
            { label: "Notes on grey", min: 0.6, p25: 1.8, median: 2.7, p75: 3.9, max: 7.4 },
            { label: "Issue 14", min: 1.1, p25: 3.1, median: 4.4, p75: 6.2, max: 11.8 },
          ]}
        />
      </Paper>
      <Paper title="Dot plot">
        <DotPlot label="Minutes read, last 25 reads" values={READ_MINUTES} hue="rose" formatValue={(v) => `${v.toFixed(1)} m`} unit={["read", "reads"]} entrance={false} />
      </Paper>
      <Paper title="Range chart and Progress" note="Ink by contract: the Range chart's bars and Progress take no hue.">
        <RangeChart label="Visitors" unit="visitors" bars={VISITS} defaultValue={[40, 59]} height={120} />
        <Progress label="Importing 1,204 readers" value={812} max={1204} valueText="812 of 1,204" />
      </Paper>
      {palette && (
        <Paper title="Diverging" note="No Flat part draws up and down yet." className="col-span-2">
          <span className="text-caption text-fg-subtle">
            Reads against last week
            <Drawn />
          </span>
          <DivergingBars />
        </Paper>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the canvas items */

export function FlatDataToday() {
  return (
    <div className="grid gap-6">
      {[false, true].map((dark) => (
        <DataFrame key={String(dark)} dark={dark}>
          <DataParts />
        </DataFrame>
      ))}
    </div>
  );
}

export function FlatDataPalette({ palette }: { palette: DataPaletteId }) {
  return (
    <div className="grid gap-6">
      {[false, true].map((dark) => (
        <DataFrame key={String(dark)} palette={palette} dark={dark}>
          <DataParts palette={palette} />
        </DataFrame>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- the screen */

/** One airy screen: a person's own site and letter, with no site name. Surfaces as they are; the data in colour. */
function Screen({ palette, dark }: { palette: DataPaletteId; dark: boolean }) {
  /* The ink card flips the theme inside it (dark paper in light, light paper in dark), so its marks take the other
     theme's steps: the dark blue on the light ink card would sit under 3:1 (2.9). */
  const first = DATA_PALETTES[palette].hues[0];
  const inkVars = { "--data-blue": dark ? first.mark.light : first.mark.dark, "--data-blue-text": dark ? first.text.light : first.text.dark } as CSSProperties;
  return (
    <div className="grid gap-8 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-small text-fg-subtle">Tuesday, 18 November</p>
          <h2 className="text-h1 font-title text-fg">Good morning, Ines</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-pill bg-surface-1 px-4 py-2 text-small text-fg">
          <span aria-hidden="true" className="size-2 rounded-pill bg-success" />
          Issue 15 goes out Friday
        </span>
      </header>

      <div className="rounded-surface bg-surface-1 p-6">
        <StatGroup>
          <Stat label="Readers" value="1,204" delta="Up 86 on last week" tone="good" trend={<Sparkline label="Readers, last 7 days" values={WEEK} hue="blue" />} />
          <Stat label="Opened the letter" value="63" unit="%" delta="Up 2 points" tone="good" trend={<Sparkline label="Open rate, last 7 letters" values={OPENS} hue="amber" />} />
          <Stat label="Replies" value="12" delta="Up 4 on last week" trend={<Sparkline label="Replies, last 7 days" values={REPLIES} hue="teal" />} />
          <Stat label="Minutes read" value="3.6" unit="m" delta="About the same" trend={<Sparkline label="Median minutes read, last 7 days" values={[3.2, 3.4, 3.3, 3.7, 3.5, 3.6, 3.6]} hue="violet" />} />
        </StatGroup>
      </div>

      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6">
        <Card tone="ink" className="grid content-start justify-items-center gap-4 p-6" style={inkVars}>
          <h3 className="justify-self-start text-small font-title">The last letter</h3>
          <Gauge label="Opened" value={63} valueText="63 percent" figure="63%" caption="758 of 1,204 readers" hue="blue" size={240} />
          <div className="flex gap-2">
            <Tag status="success">Sent</Tag>
          </div>
        </Card>
        <section className="grid content-start gap-4 rounded-surface bg-surface-1 p-6">
          <h3 className="text-small font-title text-fg">Reads a day, this week</h3>
          <BarChart label="Reads a day, this week" labels={DAYS} series={[{ name: "Reads", values: READS, hue: "blue" }]} unit="reads" xTitle="Day" height={220} entrance={false} />
        </section>
      </div>

      <section className="grid gap-4 rounded-surface bg-surface-1 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-small font-title text-fg">When people read, this week</h3>
          <p className="text-caption text-fg-subtle">Friday mornings, when the letter lands</p>
        </div>
        <div data-fd-ramp="">
          <Heatmap label="Reads by hour, this week" rows={HEAT} columns={HOURS} columnTicks={[0, 6, 12, 18].map((i) => ({ index: i, label: HOURS[i] }))} hue="blue" unit={["read", "reads"]} cell={24} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="grid content-start gap-4 rounded-surface bg-surface-1 p-6">
          <h3 className="text-small font-title text-fg">Where reads came from</h3>
          <Legend label="Sources" items={[{ name: "The letter", hue: "blue" }, { name: "Search", hue: "amber" }, { name: "Friends", hue: "teal" }]} lines />
          <LineChart
            label="Reads a week by where they came from"
            labels={WEEKS}
            series={[
              { name: "The letter", values: FROM.letter, hue: "blue" },
              { name: "Search", values: FROM.search, hue: "amber" },
              { name: "Friends", values: FROM.friends, hue: "teal" },
            ]}
            unit="reads"
            xTitle="Week"
            height={200}
            legend={false}
            entrance={false}
          />
        </section>
        <section className="grid content-start gap-4 rounded-surface bg-surface-1 p-6">
          <h3 className="text-small font-title text-fg">Where readers read</h3>
          <Breakdown
            label="Readers by device"
            unit={["reader", "readers"]}
            items={[
              { label: "Phone", value: 612 },
              { label: "Laptop", value: 344 },
              { label: "Mail app", value: 151 },
              { label: "Tablet", value: 66 },
              { label: "Watch", value: 31 },
            ]}
            layout="legend"
          />
          <BarList
            label="Most read"
            unit={["read", "reads"]}
            hue="blue"
            items={[
              { label: "Open water", value: 412 },
              { label: "Notes on grey", value: 288 },
              { label: "Issue 14", value: 164 },
            ]}
          />
        </section>
      </div>
    </div>
  );
}

/** The recommended palette, in a screen, light over dark. */
export const SCREEN_PALETTE: DataPaletteId = "candy";

export function FlatDataScreen({ palette = SCREEN_PALETTE }: { palette?: DataPaletteId }) {
  return (
    <div className="grid gap-6">
      {[false, true].map((dark) => (
        <DataFrame key={String(dark)} palette={palette} dark={dark}>
          <Screen palette={palette} dark={dark} />
        </DataFrame>
      ))}
    </div>
  );
}
