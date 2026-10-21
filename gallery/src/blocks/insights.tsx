/**
 * Insights: a studio's inbox and build insights, in the data colors. A block: a whole screen built from the litt parts,
 * to copy and make your own. Swap the sample data at the top for yours; the panels and their words stay.
 *
 * Seven raised panels, one idea each: a dot plot of reply times, a bar list of shortcuts, a mail rule, a voice pad, a
 * deploy timeline, a credits gauge and a heatmap of the credits by day. Each hue means one thing in its panel (P11), the
 * deploy stays in the quiet foreground, and Create rule is the one accent fill. Two columns when the box is wide, one
 * on a phone.
 */
import { useId, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { BarList } from "@/components/bar-list";
import { Button } from "@/components/button";
import { Meter } from "@/components/chart";
import { Callout } from "@/components/callout";
import { DotPlot } from "@/components/dot-plot";
import { Gauge } from "@/components/gauge";
import { Heatmap } from "@/components/heatmap";
import { TextField } from "@/components/input";
import { Kbd } from "@/components/kbd";
import { Pad, type PadValue } from "@/components/pad";
import { Segmented } from "@/components/segmented";
import { Tag } from "@/components/tag";
import { Timeline, TimelineBar, TimelinePhase, TimelineResult, TimelineStep } from "@/components/timeline";
import { TokenInput } from "@/components/token-input";

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

/** Reply times in minutes, spread like real ones: most within the hour, a long tail into days. */
function replyMinutes(seed: number, count: number, median: number, spread: number) {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const z = Math.sqrt(-2 * Math.log(Math.max(next(), 1e-9))) * Math.cos(2 * Math.PI * next());
    return Math.round(Math.min(1700, Math.max(3, median * Math.exp(spread * z))) * 10) / 10;
  });
}

const VIP = replyMinutes(21, 140, 34, 0.9);
const TEAM = [...replyMinutes(22, 270, 92, 1.1), 1980];
const REPLIES = { all: [...VIP, ...TEAM], vip: VIP, team: TEAM };
type Who = keyof typeof REPLIES;

function duration(minutes: number) {
  const t = Math.round(minutes);
  if (t < 60) return `${t} m`;
  if (t < 1440) return t % 60 ? `${Math.floor(t / 60)} h ${t % 60} m` : `${t / 60} h`;
  return `${Math.round(t / 1440)} d`;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(mid)]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** Daily credit use for three months, with the days still to come left out. */
function usage(seed: number, days: number, upTo = days) {
  const next = seeded(seed);
  return Array.from({ length: days }, (_, i) => (i < upTo ? Math.round(300 + next() * 1100 * (i % 7 < 5 ? 1 : 0.35)) : null));
}
const MONTHS = [
  { label: "August", values: usage(31, 31) },
  { label: "September", values: usage(32, 30) },
  { label: "October", values: usage(33, 31, 17) },
].map((m) => ({ ...m, total: m.values.reduce<number>((sum, v) => sum + (v ?? 0), 0).toLocaleString("en-GB") }));

const DEPLOY = [
  {
    label: "Build",
    steps: [
      { label: "Clone repository", seconds: 2, status: "done" as const },
      { label: "Restore build cache", seconds: 4, status: "done" as const },
      { label: "Run build commands", seconds: 21, status: "done" as const },
    ],
  },
  {
    label: "Deploy",
    steps: [
      { label: "Upload build output", seconds: 9, status: "done" as const },
      { label: "Assign atelier-nord.com", seconds: 2, status: "done" as const },
    ],
  },
];

/* ----------------------------------------------------------------- the panels */

/** A raised panel with a title and a tag: one idea per panel. `wide` spans both columns of the grid. */
function Panel({ title, tag, wide = false, children }: { title: string; tag: ReactNode; wide?: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={"litt-raised grid min-w-0 content-start gap-6 rounded-surface p-6 max-sm:p-4" + (wide ? " @min-[56rem]:col-span-2" : "")}
    >
      <header className="flex items-center gap-3">
        <h3 id={id} className="text-body text-fg">
          {title}
        </h3>
        {tag}
      </header>
      {children}
    </section>
  );
}

/** A figure with its word and a change said in words, like the Stat, inside a panel. */
function Figure({ value, word, delta }: { value: string; word: string; delta: string }) {
  return (
    <div className="grid gap-1">
      <p className="flex items-baseline gap-2">
        <span className="text-h3 tabular-nums text-fg">{value}</span>
        <span className="text-small text-fg-subtle">{word}</span>
      </p>
      <p className="text-caption text-success">
        {delta}
        <span className="sr-only">, good news</span>
      </p>
    </div>
  );
}

function ReplySpeed() {
  const [who, setWho] = useState<Who>("all");
  const values = REPLIES[who];
  const mid = useMemo(() => median(values), [values]);
  return (
    <Panel title="Reply speed" tag={<Tag>14 days</Tag>}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Figure value={duration(mid)} word="median" delta="Down 18 min on the fortnight before" />
        <Segmented
          legend="Whose replies"
          size="sm"
          value={who}
          onValueChange={setWho}
          options={[
            { value: "all", label: "All" },
            { value: "vip", label: "VIP" },
            { value: "team", label: "Team" },
          ]}
        />
      </div>
      <DotPlot
        label="Reply times, last 14 days"
        values={values}
        scale="log"
        domain={[3, 2880]}
        ticks={[
          { value: 5, label: "5m" },
          { value: 60, label: "1h" },
          { value: 240, label: "4h" },
          { value: 1440, label: "1d" },
        ]}
        formatValue={duration}
        unit={["reply", "replies"]}
        goal={240}
        goalLabel="4 h goal"
        markers={who === "vip" ? [] : [{ value: 1980, label: "Rui · 33 h" }]}
        height={144}
      />
    </Panel>
  );
}

function Shortcuts() {
  return (
    <Panel title="Shortcuts" tag={<Tag>This week</Tag>}>
      <Figure value="2 h 14 m" word="saved" delta="Up 18% on last week" />
      <BarList
        label="Most-used shortcuts this week"
        unit={["time", "times"]}
        hue="violet"
        items={[
          { label: "Archive", value: 412, lead: <Kbd>E</Kbd> },
          { label: "Next and previous", value: 388, lead: <><Kbd>J</Kbd><Kbd>K</Kbd></> },
          { label: "Reply", value: 164, lead: <Kbd>R</Kbd> },
        ]}
      />
      <Callout title="Try H to snooze" description="You snoozed 31 threads with the mouse this week." action={<Kbd>H</Kbd>} />
    </Panel>
  );
}

const CAUGHT = [
  { from: "Stripe", subject: "Invoice #4821 is ready" },
  { from: "Ramp", subject: "Your March invoice" },
  { from: "Brex", subject: "Your invoice is paid" },
];

function NewRule() {
  return (
    <Panel title="New rule" tag={<Tag status="neutral">Draft</Tag>}>
      <div className="grid gap-4">
        <TokenInput label="Mail from" defaultValue={["@stripe.com", "ramp.com", "brex.com"]} collapseAfter={1} placeholder="Add a sender" />
        <TextField label="That says" defaultValue="invoice" />
        <p className="flex items-center gap-3 text-small text-fg">
          Goes to <Tag hue="amber">Finance</Tag>
        </p>
      </div>
      <div className="grid gap-2">
        <p className="flex justify-between gap-4 text-small text-fg-subtle">
          Would catch <span className="font-mono text-caption font-normal tabular-nums text-fg">12 of the last 50</span>
        </p>
        <ul aria-label="Mail the rule would catch">
          {CAUGHT.map((m) => (
            <li key={m.from} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
              <Avatar name={m.from} size="sm" hue="neutral" decorative />
              <span className="w-16 shrink-0 text-small text-fg">{m.from}</span>
              <span className="w-0 min-w-0 flex-1 truncate text-small text-fg-subtle">{m.subject}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary">Test</Button>
        <Button variant="primary">Create rule</Button>
      </div>
    </Panel>
  );
}

const VOICE_DEFAULT: PadValue = { x: 30, y: 40 };
const tone = (y: number) => (y >= 70 ? "Casual" : y >= 45 ? "Warm" : y >= 25 ? "Even" : "Formal");
const words = (x: number) => 20 + 2 * x;

function YourVoice() {
  const [voice, setVoice] = useState<PadValue>({ x: 15, y: 60 });
  const greeting = voice.y >= 45 ? "Hey Maya," : "Hello Maya,";
  const signoff = voice.y >= 45 ? "Cheers, Ines" : "Best regards, Ines";
  return (
    <Panel title="Your voice" tag={<Tag>Learning</Tag>}>
      <Pad
        label="How your replies sound"
        x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }}
        y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }}
        value={voice}
        onValueChange={setVoice}
        defaultMark={VOICE_DEFAULT}
        formatValue={({ x, y }) => `${tone(y)}, about ${words(x)} words`}
        height={176}
      />
      <div className="grid gap-2 border-t border-line pt-4">
        <p className="text-small text-fg-subtle">Reply to Maya</p>
        <p className="text-body text-fg">
          {greeting} Friday works. I will send the forecast by the end of the day. {signoff}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-caption font-normal text-fg-subtle">About {words(voice.x)} words</span>
          <Button variant="secondary" size="sm" onClick={() => setVoice(VOICE_DEFAULT)}>
            Reset
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function Deploy() {
  const total = DEPLOY.flatMap((p) => p.steps).reduce((sum, s) => sum + s.seconds, 0);
  let at = 0;
  const clock = (s: number) => `00:${String(s).padStart(2, "0")}`;
  return (
    <Panel title="Publish Halo case study" tag={<Tag status="success">Live</Tag>}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-caption font-normal text-fg-subtle">Ines · main / 7be04d1</p>
        <p className="text-h3 tabular-nums text-fg">{total}s</p>
      </div>
      <TimelineBar label="Publish Halo case study" phases={DEPLOY} />
      <Timeline label="Steps of the deploy">
        {DEPLOY.map((phase) => (
          <TimelinePhase key={phase.label} label={phase.label} duration={phase.steps.reduce((sum, s) => sum + s.seconds, 0)}>
            {phase.steps.map((step) => {
              const start = at;
              at += step.seconds;
              return <TimelineStep key={step.label} at={clock(start)} label={step.label} status={step.status} seconds={step.seconds} />;
            })}
          </TimelinePhase>
        ))}
        <TimelineResult tone="success" label="Live on atelier-nord.com" total={total} />
      </Timeline>
    </Panel>
  );
}

function Credits() {
  return (
    <Panel title="Credits" tag={<Tag>October</Tag>}>
      <Gauge
        label="Credits left"
        value={20830}
        max={30000}
        valueText="20,830 credits"
        figure="20,830"
        caption="About 2k a day on average"
        hue="teal"
        className="mx-auto"
      />
      {/* What used them: one quantity per row, so the meters stay in the quiet foreground. */}
      <div className="grid gap-4 border-t border-line pt-4">
        <Meter label="Builds" value={5240} max={9170} valueText="5,240" />
        <Meter label="Preview links" value={2610} max={9170} valueText="2,610" />
        <Meter label="Image resizing" value={1320} max={9170} valueText="1,320" />
      </div>
    </Panel>
  );
}

/** Every day of the last three months, one row each, at a pitch where every row keeps its name and its total. */
function Usage() {
  return (
    <Panel title="Credits by month" tag={<Tag>Aug to Oct</Tag>} wide>
      <Heatmap
        label="Credits used per day, by month"
        rows={MONTHS}
        hue="teal"
        unit={["credit", "credits"]}
        columns={Array.from({ length: 31 }, (_, i) => `day ${i + 1}`)}
        cell={12}
      />
    </Panel>
  );
}

/** The panels in a grid that measures itself: two columns when it is wide, one on a phone. The heatmap spans both. */
export function Insights() {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-1 gap-6 @min-[56rem]:grid-cols-2">
        <ReplySpeed />
        <Shortcuts />
        <NewRule />
        <YourVoice />
        <Deploy />
        <Credits />
        <Usage />
      </div>
    </div>
  );
}
