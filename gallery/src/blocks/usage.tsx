/**
 * Usage: a plan's usage, drawn only in rails. A block: a whole screen built from the litt parts, to copy and make your
 * own. Swap the sample data at the top for yours; the layout, the hues and the words around them stay.
 *
 * Trends sit in thin lines at the foot of the figures, storage and bandwidth split by kind of file, the plan's limits
 * carry their budgets, and build times spread by site. Each hue names one kind of file across the whole screen (R7),
 * everything else stays in the foreground, and nothing moves. The grid measures itself, so it stacks in a narrow box.
 */
import { useId, type ReactNode } from "react";
import { Breakdown, type BreakdownItem } from "@/components/breakdown";
import { Meter } from "@/components/chart";
import { Sparkline } from "@/components/sparkline";
import { Spread } from "@/components/spread";
import { Stat, StatGroup } from "@/components/stat";
import { Tag } from "@/components/tag";

/* ----------------------------------------------------------------- data */

/** A seeded generator (mulberry32), so the block draws the same data on every load and on the server. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fourteen days that wander around a level, with quieter weekends. */
function days(seed: number, level: number, swing: number) {
  const next = seeded(seed);
  return Array.from({ length: 14 }, (_, i) => Math.round(level * (i % 7 >= 5 ? 0.55 : 1) + (next() - 0.5) * swing));
}

/** Build times in seconds for one site: most near its median, a few slow ones. */
function builds(seed: number, median: number, spread: number, count = 40) {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const z = Math.sqrt(-2 * Math.log(Math.max(next(), 1e-9))) * Math.cos(2 * Math.PI * next());
    return Math.round(Math.max(8, median * Math.exp(spread * z)));
  });
}

/* Each kind of file keeps one hue everywhere on the page (R7). */
const STORAGE: BreakdownItem[] = [
  { label: "Video", value: 58, hue: "violet" },
  { label: "Images", value: 24, hue: "teal" },
  { label: "Documents", value: 6, hue: "blue" },
  { label: "Fonts", value: 3, hue: "amber" },
];
const BANDWIDTH: BreakdownItem[] = [
  { label: "Images", value: 212, hue: "teal" },
  { label: "Video", value: 151, hue: "violet" },
  { label: "Fonts", value: 31, hue: "amber" },
  { label: "Documents", value: 18, hue: "blue" },
];

const SITES = [
  { label: "Halo site", values: builds(41, 39, 0.28) },
  { label: "Northwind", values: builds(42, 29, 0.22) },
  { label: "Marlow Labs", values: builds(43, 58, 0.3) },
  { label: "Atlas portfolio", values: builds(44, 37, 0.2) },
  { label: "Grotta Type", values: builds(45, 23, 0.18) },
];

/* ----------------------------------------------------------------- the page */

/** A section of the page: a small heading, a quiet note, and its rails. No box: the air does the separating. */
function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid min-w-0 content-start gap-6">
      <div className="grid gap-1">
        <h4 id={id} className="text-body text-fg">
          {title}
        </h4>
        <p className="text-small text-fg-subtle">{note}</p>
      </div>
      {children}
    </section>
  );
}

export function Usage() {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-1 gap-16">
        <header className="flex flex-wrap items-center gap-3">
          <h3 className="text-h3 text-fg">Halden Studio</h3>
          <Tag>Pro plan</Tag>
          <Tag>October</Tag>
        </header>

        <StatGroup>
          <Stat label="Deploys" value={214} delta="Up 12% on September" tone="good" trend={<Sparkline label="Deploys per day, last 14 days" values={days(1, 19, 8)} />} />
          <Stat
            label="Median build"
            value={39}
            unit="s"
            delta="Down 4 s on September"
            tone="good"
            trend={<Sparkline label="Median build time, last 14 days" values={days(2, 41, 8)} baseline={45} formatValue={(v) => `${v} s`} />}
          />
          <Stat label="Bandwidth" value={412} unit=" GB" trend={<Sparkline label="Bandwidth per day, last 14 days" values={days(3, 32, 10)} formatValue={(v) => `${v} GB`} />} />
          <Stat label="Sites live" value={14} delta="Up 2 on September" tone="good" />
        </StatGroup>

        <div className="grid grid-cols-1 gap-16 @min-[52rem]:grid-cols-2">
          <Section title="Files" note="Storage by kind of file, against the plan's 100 GB.">
            <Breakdown label="Storage" items={STORAGE} total={100} totalText="91 of 100 GB" formatValue={(v) => `${v} GB`} />
          </Section>

          <div className="grid min-w-0 content-start gap-16">
            <Section title="Traffic" note="Bandwidth by the same kinds, in the same hues.">
              <Breakdown label="Bandwidth" items={BANDWIDTH} totalText="412 GB" formatValue={(v) => `${v} GB`} layout="legend" />
            </Section>
            <Section title="Limits" note="The plan's budgets. The tick is the budget, and only the bar past it is news.">
              <div className="grid gap-6">
                <Meter label="Build minutes" value={1380} max={3000} valueText="1,380 of 3,000" target={2400} targetText="budget 2,400" />
                <Meter label="Bandwidth" value={412} max={500} valueText="412 of 500 GB" target={400} targetText="budget 400 GB" />
                <Meter label="Seats" value={4} max={5} valueText="4 of 5" steps={5} />
                <Meter label="Custom domains" value={7} max={10} valueText="7 of 10" steps={10} />
              </div>
            </Section>
          </div>
        </div>

        <Section title="Build times by site" note="The last 40 builds of each site. Rose is build time.">
          <Spread label="Build times by site, last 40 builds" items={SITES} hue="rose" domain={[0, 120]} ticks={[0, 40, 80, 120].map((v) => ({ value: v, label: `${v} s` }))} formatValue={(v) => `${Math.round(v)} s`} goal={60} goalLabel="60 s goal" />
        </Section>
      </div>
    </div>
  );
}
