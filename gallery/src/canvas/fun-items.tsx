/**
 * The fun mode lane: litt's data parts, each today (the production component) beside fun mode (src/canvas/fun). Each
 * pair shares its data and its buttons, so the same change can be watched both ways: today's snaps, fun mode's moves.
 * At rest the two are the same frame; that is fun mode's one rule (fun/motion.ts).
 */
import { useState, type ReactNode } from "react";
import { BarList } from "@/components/bar-list";
import { Button } from "@/components/button";
import { Meter } from "@/components/chart";
import { Gauge } from "@/components/gauge";
import { Heatmap } from "@/components/heatmap";
import { RetryIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";
import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Timeline, TimelinePhase, TimelineResult, TimelineStep } from "@/components/timeline";
import { FunBarList } from "./fun/bar-list";
import { BANDWIDTH_14, DEPLOY, DEPLOYS, DEPLOYS_14, SHORTCUT_KEYS, SHORTCUT_WEEKS, WEEKS } from "./fun/data";
import { FunGauge } from "./fun/gauge";
import { FunHeatmap } from "./fun/heatmap";
import { FunMeter } from "./fun/meter";
import { groupDigits } from "./fun/motion";
import { FunStat } from "./fun/stat";
import { FunTimeline, useRun } from "./fun/timeline";
import type { CanvasItem } from "./registry";

function Shell({ controls, children }: { controls: ReactNode; children: ReactNode }) {
  return (
    <div className="grid h-full content-between gap-6">
      {children}
      <div className="flex flex-wrap items-center gap-2">{controls}</div>
    </div>
  );
}
const Play = ({ onPlay }: { onPlay: () => void }) => (
  <Button size="sm" icon={<RetryIcon />} onClick={onPlay}>
    Play arrival
  </Button>
);
const useCounter = () => {
  const [n, setN] = useState(0);
  return [n, () => setN((v) => v + 1)] as const;
};

/* ------------------------------------------------------------------ heatmap */

const HEAT_LABEL = "Deploys per day, last 20 weeks";
function HeatmapToday() {
  return <Heatmap label={HEAT_LABEL} rows={DEPLOYS.map((r) => ({ label: r.label, values: r.values, total: String(r.total) }))} columns={WEEKS} hue="teal" unit={["deploy", "deploys"]} cell={12} />;
}
function HeatmapFun() {
  const [play, replay] = useCounter();
  return (
    <Shell controls={<Play onPlay={replay} />}>
      <FunHeatmap label={HEAT_LABEL} rows={DEPLOYS} columns={WEEKS} hue="teal" unit={["deploy", "deploys"]} play={play} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ gauge */

const CREDITS = 10_000;
function useCredits() {
  const [left, setLeft] = useState(6120);
  const controls = (
    <>
      <Button size="sm" onClick={() => setLeft((v) => Math.max(0, v - 1500))}>
        Spend 1,500
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setLeft((v) => Math.min(CREDITS, v + 2500))}>
        Top up 2,500
      </Button>
    </>
  );
  return [left, controls] as const;
}
function GaugeToday() {
  const [left, controls] = useCredits();
  return (
    <Shell controls={controls}>
      <Gauge label="Credits left" value={left} max={CREDITS} valueText={`${groupDigits(left)} of 10,000 credits left`} figure={groupDigits(left)} caption="Renews on 1 Nov" hue="blue" />
    </Shell>
  );
}
function GaugeFun() {
  const [left, controls] = useCredits();
  const [play, replay] = useCounter();
  return (
    <Shell
      controls={
        <>
          <Play onPlay={replay} />
          {controls}
        </>
      }
    >
      <FunGauge label="Credits left" value={left} max={CREDITS} valueText={`${groupDigits(left)} of 10,000 credits left`} figure={groupDigits} caption="Renews on 1 Nov" hue="blue" play={play} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ timeline */

function useDeployControls() {
  const [play, run] = useCounter();
  const [fail, setFail] = useState(false);
  const controls = (
    <>
      <Button size="sm" icon={<RetryIcon />} onClick={run}>
        Run deploy
      </Button>
      <Button size="sm" variant={fail ? "secondary" : "ghost"} aria-pressed={fail} onClick={() => setFail((v) => !v)}>
        Fail the build
      </Button>
    </>
  );
  return { play, fail, controls };
}
const fmt = (s: number) => `${Math.floor(s)}s`;
const clock = (s: number) => `00:${String(Math.floor(s)).padStart(2, "0")}`;

/** Today's Timeline, playing the same run from the same clock: each state simply replaces the last. */
function TimelineToday() {
  const { play, fail, controls } = useDeployControls();
  const { flat, total, failAt, t, statusOf, ended, failedRun } = useRun(DEPLOY, play, fail);
  return (
    <Shell controls={controls}>
      <Timeline label="Steps of the deploy">
        {DEPLOY.map((phase, pi) => {
          const steps = flat.map((s, i) => ({ ...s, i })).filter((s) => s.phase === pi);
          const done = steps.every((s) => statusOf(s.i) === "done");
          return (
            <TimelinePhase key={phase.label} label={phase.label} hue={phase.hue} duration={done ? steps.reduce((sum, s) => sum + s.seconds, 0) : undefined}>
              {steps.map((s) => {
                const status = statusOf(s.i);
                const ran = status === "done" || status === "running" || status === "failed";
                const took = status === "running" ? Math.floor(t - s.start) : status === "failed" ? Math.floor(failAt - s.start) : s.seconds;
                return <TimelineStep key={s.label} at={ran ? clock(s.start) : undefined} label={s.label} status={status} seconds={ran ? took : undefined} />;
              })}
            </TimelinePhase>
          );
        })}
        {ended && <TimelineResult tone={failedRun ? "danger" : "success"} label={failedRun ? "Build failed" : "Live on atelier-nord.com"} total={failedRun ? fmt(failAt) : total} />}
      </Timeline>
    </Shell>
  );
}
function TimelineFun() {
  const { play, fail, controls } = useDeployControls();
  return (
    <Shell controls={controls}>
      <FunTimeline label="Steps of the deploy" phases={DEPLOY} result="Live on atelier-nord.com" failed="Build failed" play={play} fail={fail} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ meters */

function useMinutes() {
  const [minutes, setMinutes] = useState(1380);
  const controls = (
    <>
      <Button size="sm" onClick={() => setMinutes((v) => Math.min(3000, v + 600))}>
        Use 600 minutes
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setMinutes(1380)}>
        Reset
      </Button>
    </>
  );
  return [minutes, controls] as const;
}
function MetersToday() {
  const [minutes, controls] = useMinutes();
  return (
    <Shell controls={controls}>
      <div className="grid gap-6">
        <Meter label="Build minutes" value={minutes} max={3000} valueText={`${groupDigits(minutes)} of 3,000`} target={2400} targetText="budget 2,400" />
        <Meter label="Bandwidth" value={412} max={500} valueText="412 of 500 GB" target={400} targetText="budget 400 GB" />
        <Meter label="Seats" value={4} max={5} valueText="4 of 5" steps={5} />
      </div>
    </Shell>
  );
}
function MetersFun() {
  const [minutes, controls] = useMinutes();
  const [play, replay] = useCounter();
  return (
    <Shell
      controls={
        <>
          <Play onPlay={replay} />
          {controls}
        </>
      }
    >
      <div className="grid gap-6">
        <FunMeter label="Build minutes" value={minutes} max={3000} reading={(n) => `${groupDigits(n)} of 3,000`} target={2400} targetText="budget 2,400" play={play} />
        <FunMeter label="Bandwidth" value={412} max={500} reading={(n) => `${n} of 500 GB`} target={400} targetText="budget 400 GB" play={play} delay={0.08} />
        <FunMeter label="Seats" value={4} max={5} reading={(n) => `${n} of 5`} steps={5} play={play} delay={0.16} />
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ bar list */

const lead = (label: string) => (
  <>
    {SHORTCUT_KEYS[label]!.map((k) => (
      <Kbd key={k}>{k}</Kbd>
    ))}
  </>
);
function useWeek() {
  const [week, setWeek] = useState(0);
  const items = SHORTCUT_WEEKS[week]!.map((i) => ({ ...i, lead: lead(i.label) }));
  const next = (
    <Button size="sm" onClick={() => setWeek((w) => (w + 1) % SHORTCUT_WEEKS.length)}>
      Next week
    </Button>
  );
  return [items, next] as const;
}
function BarsToday() {
  const [items, next] = useWeek();
  return (
    <Shell controls={next}>
      <BarList label="Most-used shortcuts this week" unit={["time", "times"]} hue="violet" items={[...items].sort((a, b) => b.value - a.value)} />
    </Shell>
  );
}
function BarsFun() {
  const [items, next] = useWeek();
  const [play, replay] = useCounter();
  return (
    <Shell
      controls={
        <>
          <Play onPlay={replay} />
          {next}
        </>
      }
    >
      <FunBarList label="Most-used shortcuts this week" unit={["time", "times"]} hue="violet" items={items} play={play} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ stats */

function StatsToday() {
  return (
    <StatGroup>
      <Stat label="Deploys" value={214} delta="Up 12% on September" tone="good" trend={<Sparkline label="Deploys per day, last 14 days" values={DEPLOYS_14} />} />
      <Stat label="Bandwidth" value={412} unit=" GB" trend={<Sparkline label="Bandwidth per day, last 14 days" values={BANDWIDTH_14} />} />
    </StatGroup>
  );
}
function StatsFun() {
  const [play, replay] = useCounter();
  return (
    <Shell controls={<Play onPlay={replay} />}>
      <StatGroup>
        <FunStat label="Deploys" value={214} delta="Up 12% on September" tone="good" trendLabel="Deploys per day, last 14 days" values={DEPLOYS_14} play={play} />
        <FunStat label="Bandwidth" value={412} unit=" GB" trendLabel="Bandwidth per day, last 14 days" values={BANDWIDTH_14} play={play} />
      </StatGroup>
    </Shell>
  );
}

/* ------------------------------------------------------------------ the lane */

/* Under the other two lanes: pairs side by side, two pairs to a row. Canvas px. */
const TOP = 1320;
const X = [0, 600, 1240, 1840];
const ROW = [TOP, TOP + 360, TOP + 900];
const W = 560;

export const FUN_ITEMS: CanvasItem[] = [
  { id: "heatmap-today", name: "Heatmap · today", x: X[0]!, y: ROW[0]!, width: W, height: 300, render: () => <HeatmapToday /> },
  { id: "heatmap-fun", name: "Heatmap · fun mode", x: X[1]!, y: ROW[0]!, width: W, height: 300, render: () => <HeatmapFun /> },
  { id: "gauge-today", name: "Gauge · today", x: X[2]!, y: ROW[0]!, width: W, height: 300, render: () => <GaugeToday /> },
  { id: "gauge-fun", name: "Gauge · fun mode", x: X[3]!, y: ROW[0]!, width: W, height: 300, render: () => <GaugeFun /> },

  { id: "timeline-today", name: "Timeline · today", x: X[0]!, y: ROW[1]!, width: W, height: 480, render: () => <TimelineToday /> },
  { id: "timeline-fun", name: "Timeline · fun mode", x: X[1]!, y: ROW[1]!, width: W, height: 480, render: () => <TimelineFun /> },
  { id: "meters-today", name: "Usage meters · today", x: X[2]!, y: ROW[1]!, width: W, height: 300, render: () => <MetersToday /> },
  { id: "meters-fun", name: "Usage meters · fun mode", x: X[3]!, y: ROW[1]!, width: W, height: 300, render: () => <MetersFun /> },

  { id: "bars-today", name: "Bar list · today", x: X[0]!, y: ROW[2]!, width: W, height: 320, render: () => <BarsToday /> },
  { id: "bars-fun", name: "Bar list · fun mode", x: X[1]!, y: ROW[2]!, width: W, height: 320, render: () => <BarsFun /> },
  { id: "stats-today", name: "Stats · today", x: X[2]!, y: ROW[2]!, width: W, height: 320, render: () => <StatsToday /> },
  { id: "stats-fun", name: "Stats · fun mode", x: X[3]!, y: ROW[2]!, width: W, height: 320, render: () => <StatsFun /> },
];
