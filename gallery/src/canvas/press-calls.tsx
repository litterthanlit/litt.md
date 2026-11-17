/**
 * Press, phase 1: the nine calls (plans/024, Press), live. Each call puts the shipping part as Press draws it today
 * beside the proposal (or, for calls 4 and 5, the alternative beside today, kept), each in a light frame over a dark
 * one, so Nick can press and compare them. Every frame sets its own world as press.tsx does: Press's theme and accent
 * (lookAttributes), a MaterialProvider, and Press's own radius and press depth (PRESS_OWN), since the gallery's <html>
 * is Flat. A proposal is the same component with a candidate switched on by data-press-call (press-calls.css), or, where
 * the call is about content (voice, a cover, names), the same parts with other words. Made-up data, no requests.
 */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Card, CardBody, CardCover, CardDescription, CardTitle } from "@/components/card";
import { LineChart } from "@/components/chart";
import { TextField } from "@/components/input";
import { ProjectCover } from "@/components/list-cover";
import { Progress } from "@/components/progress";
import { Segmented } from "@/components/segmented";
import { Slider } from "@/components/slider";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type SortDirection } from "@/components/table";
import { Tag } from "@/components/tag";
import { MaterialProvider } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { PRESS_OWN } from "./press";
import "./press-calls.css";

export type PressCallId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/* ---------------------------------------------------------------- the frame */

/** One Press frame in light or dark, with the candidates its side switches on. */
function PressFrame({ dark, call, children }: { dark: boolean; call?: string; children: ReactNode }) {
  return (
    <MaterialProvider material="press">
      <div
        {...lookAttributes({ accent: "world", material: "press" }, dark)}
        data-press-call={call}
        style={PRESS_OWN}
        className="grid content-start gap-4 rounded-surface bg-canvas p-6 text-fg"
      >
        <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
        {children}
      </div>
    </MaterialProvider>
  );
}

type Side = { label: string; call?: string; render: () => ReactNode };

function Column({ side, pick }: { side: Side; pick: boolean }) {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <span className={"text-small font-title " + (pick ? "text-fg" : "text-fg-subtle")}>{side.label}</span>
      <PressFrame dark={false} call={side.call}>
        {side.render()}
      </PressFrame>
      <PressFrame dark call={side.call}>
        {side.render()}
      </PressFrame>
    </div>
  );
}

/* ---------------------------------------------------------------- the parts each call shows */

type Deploy = { site: string; status: "Ready" | "Failed"; seconds: number };
const DEPLOYS: Deploy[] = [
  { site: "litt.design v3", status: "Ready", seconds: 38 },
  { site: "Halden Gallery", status: "Failed", seconds: 12 },
  { site: "Founder landing", status: "Ready", seconds: 52 },
];

function DeployTable() {
  const [sort, setSort] = useState<SortDirection>("none");
  const rows = sort === "none" ? DEPLOYS : [...DEPLOYS].sort((a, b) => (sort === "ascending" ? a.seconds - b.seconds : b.seconds - a.seconds));
  const next = () => setSort((s) => (s === "ascending" ? "descending" : "ascending"));
  return (
    <Table label="Latest deploys">
      <TableHeader>
        <TableRow>
          <TableHead>Site</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric sort={sort} onSort={next}>
            Time
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((d) => (
          <TableRow key={d.site}>
            <TableCell primary>{d.site}</TableCell>
            <TableCell>
              <Tag status={d.status === "Ready" ? "success" : "danger"}>{d.status}</Tag>
            </TableCell>
            <TableCell numeric>{d.seconds} s</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const WEEK = [24, 29, 26, 31, 30, 34, 38];

function DeployStat({ hue }: { hue: boolean }) {
  return (
    <Stat
      label="Deploys this week"
      value={38}
      delta="Up 12% on last week"
      tone={hue ? "good" : "neutral"}
      trend={<Sparkline label="Deploys per day, last 7 days" values={WEEK} hue={hue ? "blue" : undefined} />}
    />
  );
}

function Statuses({ building }: { building: "tint" | "word" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag status="success">Ready</Tag>
      <Tag status="success">Live</Tag>
      <Tag status="warning">In review</Tag>
      {building === "tint" ? <Tag hue="blue">Building</Tag> : <Tag>Building</Tag>}
      <Tag status="neutral">Draft</Tag>
      <Tag status="danger">Failed</Tag>
    </div>
  );
}

function DeployButtons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Deploy</Button>
      <Button>Logs</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  );
}

function DeployChart() {
  return (
    <LineChart
      label="Deploys per day, last 7 days"
      labels={["11 Nov", "12 Nov", "13 Nov", "14 Nov", "15 Nov", "16 Nov", "17 Nov"]}
      series={[
        { name: "Production", values: [6, 8, 7, 9, 8, 10, 12] },
        { name: "Preview", values: [18, 21, 19, 22, 22, 24, 26] },
      ]}
      hues
      height={180}
      unit={["deploy", "deploys"]}
      entrance={false}
    />
  );
}

const speed = (v: number) => `${v.toFixed(1)}x`;
const builds = (v: number) => `${v}`;

/** One project's panel. The structure is the same on both sides of call 7; only the words differ. */
function ProjectPanel({ voice }: { voice: "studio" | "deploy" }) {
  const w =
    voice === "studio"
      ? { name: "Northwind site", sub: "Framer · published 2 days ago", progress: "Exporting 24 images", meta: "Halo site · 12 pages · 2.4 MB", back: "View site", go: "Publish" }
      : { name: "harbor-web", sub: "main · 4f9c2e1 · Add pricing page", progress: "Building", meta: "1m 42s · 312 files · fra1", back: "Logs", go: "Deploy" };
  return (
    <section aria-label={w.name} className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="text-body font-title text-fg">{w.name}</h3>
          <p className="truncate text-small text-fg-subtle">{w.sub}</p>
        </div>
        {voice === "studio" ? <Tag status="success">Live</Tag> : <Tag hue="blue">Building</Tag>}
      </div>
      <Progress label={w.progress} value={68} message={w.meta} />
      {voice === "studio" ? (
        <Slider label="Animation speed" min={0.5} max={2} step={0.1} defaultValue={1} formatValue={speed} />
      ) : (
        <Slider label="Concurrent builds" min={1} max={8} step={1} defaultValue={3} formatValue={builds} />
      )}
      <div className="flex justify-end gap-3">
        <Button variant="ghost">{w.back}</Button>
        <Button variant="primary">{w.go}</Button>
      </div>
    </section>
  );
}

/** A deploy's preview: harbor-web's new pricing page at the size of a cover, drawn in the page's own tokens. It
    stands in for the screenshot a host would show, so it is decorative (the card's title names the thing). */
function DeployPreview() {
  const plans = [
    { name: "Hobby", price: "$0" },
    { name: "Pro", price: "$20" },
    { name: "Team", price: "$40" },
  ];
  return (
    <div aria-hidden="true" className="absolute inset-0 grid grid-rows-[auto_1fr_auto] bg-canvas text-fg">
      <div className="flex items-center justify-between border-b border-line px-3 py-2 text-caption">
        <span className="font-title">harbor</span>
        <span className="text-fg-subtle">Docs · Pricing · Sign in</span>
      </div>
      <div className="grid content-center gap-2 px-3">
        <span className="text-small font-title">Pricing that scales with your team</span>
        <div className="grid grid-cols-3 gap-2">
          {plans.map((p) => (
            <div key={p.name} className="grid gap-1 rounded-control p-2 shadow-[inset_0_0_0_1px_var(--line)]">
              <span className="text-caption text-fg-subtle">{p.name}</span>
              <span className="text-small font-title tabular-nums">{p.price}</span>
            </div>
          ))}
        </div>
      </div>
      <span className="bg-surface-2 px-3 py-1 font-mono text-caption text-fg-subtle">preview · main · 4f9c2e1</span>
    </div>
  );
}

function DeployCard({ cover }: { cover: "wireframe" | "preview" }) {
  return (
    <Card cover="inset" className="max-w-80">
      <CardCover>{cover === "wireframe" ? <ProjectCover name="landing" /> : <DeployPreview />}</CardCover>
      <CardBody>
        <CardTitle>harbor-web</CardTitle>
        <CardDescription>Production · 2 h ago</CardDescription>
      </CardBody>
    </Card>
  );
}

/** Today's eleven names for six jobs, as words. */
function NamesToday() {
  return (
    <div className="grid gap-1 text-small text-fg-muted">
      <span>tray · cut · slot · well</span>
      <span>block · key · cap · plate</span>
      <span>field · notch · glass</span>
    </div>
  );
}

function Material({ name, tokens, children }: { name: string; tokens: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-small font-title text-fg">{name}</span>
        <span className="font-mono text-caption text-fg-subtle">{tokens}</span>
      </div>
      {children}
    </div>
  );
}

/** The six materials, each its one name, its tokens and a live part in it. */
function SixMaterials() {
  const [view, setView] = useState<"production" | "preview">("production");
  return (
    <div className="grid gap-5">
      <Material name="Surface" tokens="--canvas, --surface-1..3, --line, --highlight">
        <div className="h-10 rounded-surface bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]" />
      </Material>
      <Material name="Tray" tokens="--tray, --tray-shade">
        <Segmented legend="Environment" value={view} onValueChange={setView} options={[{ value: "production", label: "Production" }, { value: "preview", label: "Preview" }]} />
      </Material>
      <Material name="Cut" tokens="--cut, --cut-shade, --line-control (a field is the cut)">
        <TextField label="Branch" defaultValue="main" />
      </Material>
      <Material name="Block" tokens="--block, --block-lift, --block-press (a key is a block)">
        <div className="flex gap-3">
          <Button>Logs</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </Material>
      <Material name="Plate" tokens="--plate-lift, --slot*, --cap* (slot and cap in it)">
        <Slider label="Concurrent builds" min={1} max={8} step={1} defaultValue={3} formatValue={builds} />
      </Material>
      <Material name="Glass" tokens=".litt-glass, --glass-*, --shadow-float">
        <div className="litt-glass w-fit rounded-surface px-3 py-2 text-small text-fg">Copied 4f9c2e1</div>
      </Material>
    </div>
  );
}

/* ---------------------------------------------------------------- the calls */

type Call = { why: string; recommend: string; left: Side; right: Side; pick: "left" | "right" };

const today = (render: () => ReactNode, label = "Today"): Side => ({ label, render });

const CALLS: Record<PressCallId, Call> = {
  1: {
    why: "Statuses, the stat's figure and every table row are blocks today, so they read as buttons. Depth says what a thing does: a status is a word on the surface.",
    recommend: "Recommend: yes",
    left: today(() => (
      <>
        <DeployTable />
        <DeployStat hue />
      </>
    )),
    right: {
      label: "Proposal",
      call: "unraised",
      render: () => (
        <>
          <DeployTable />
          <DeployStat hue />
        </>
      ),
    },
    pick: "right",
  },
  2: {
    why: "Green, amber and a blue tint make four colours mean status. Under Press only: success and warning go, danger stays, and the word always says it.",
    recommend: "Recommend: yes",
    left: today(() => <Statuses building="tint" />),
    right: { label: "Proposal", call: "ink-status", render: () => <Statuses building="word" /> },
    pick: "right",
  },
  3: {
    why: "Fill, cast and a blue halo are three cues on one block, and the halo is loudest in dark. A raised thing says it is raised once: Blue 4, its cast, no glow.",
    recommend: "Recommend: yes",
    left: today(() => <DeployButtons />),
    right: { label: "Proposal", call: "no-glow", render: () => <DeployButtons /> },
    pick: "right",
  },
  4: {
    why: "The audit found the cut faint at 1440, but you turned down the deeper well on 26 October and plan 022 put the shallow cut back. Keep it.",
    recommend: "Recommend: yes (keep today)",
    left: { label: "Alternative: the deeper well", call: "deep-cut", render: () => <TextField label="Project" defaultValue="harbor-web" help="Lowercase, no spaces." /> },
    right: today(() => <TextField label="Project" defaultValue="harbor-web" help="Lowercase, no spaces." />, "Proposal: today, kept"),
    pick: "right",
  },
  5: {
    why: "Device stands every part on a plate. In Press a plate round a block is the outline taken off in plan 022; the plate stays the slider's and the object's.",
    recommend: "Recommend: yes (keep today)",
    left: {
      label: "Alternative: Device's plate",
      render: () => (
        <div className="rounded-surface bg-block p-6 shadow-(--plate-lift)">
          <DeployButtons />
        </div>
      ),
    },
    right: today(
      () => (
        <div className="p-6">
          <DeployButtons />
        </div>
      ),
      "Proposal: today, kept",
    ),
    pick: "right",
  },
  6: {
    why: "Press is for dashboards, so a chart's series keep R7's hues. A stat's lone sparkline and its Up 12% are one quantity, so they are the ink, and the figure leaves its box (call 1).",
    recommend: "Recommend: yes",
    left: today(() => (
      <>
        <DeployStat hue />
        <DeployChart />
      </>
    )),
    right: {
      label: "Proposal",
      call: "unraised",
      render: () => (
        <>
          <DeployStat hue={false} />
          <DeployChart />
        </>
      ),
    },
    pick: "right",
  },
  7: {
    why: "Press is product UI, settings and dashboards. About's harbor-web scenes already speak it; the pages still say Northwind site, Halo site and Animation speed.",
    recommend: "Recommend: yes",
    left: today(() => <ProjectPanel voice="studio" />, "Today, every world"),
    right: { label: "Proposal", render: () => <ProjectPanel voice="deploy" /> },
    pick: "right",
  },
  8: {
    why: "A wireframe is a placeholder, not the work (R1). A cover is content: the deploy's preview, with the card's ring and surface unchanged.",
    recommend: "Recommend: yes",
    left: today(() => <DeployCard cover="wireframe" />),
    right: { label: "Proposal", render: () => <DeployCard cover="preview" /> },
    pick: "right",
  },
  9: {
    why: "No material recipe repeats another under a new name. Words only: the token names stay, so nothing breaks. Whether a key keeps --key-lift's darker lower edge is the one second cue left.",
    recommend: "Recommend: yes",
    left: today(() => <NamesToday />, "Today's names"),
    right: { label: "Proposal: six materials", render: () => <SixMaterials /> },
    pick: "right",
  },
};

export function PressCallPreview({ call }: { call: PressCallId }) {
  const c = CALLS[call];
  return (
    <div data-press-call-preview={call} className="grid gap-6">
      <div className="grid max-w-[80ch] gap-1">
        <p className="text-small text-fg-muted">{c.why}</p>
        <p className="text-small font-title text-fg">{c.recommend}</p>
      </div>
      <div className="grid grid-cols-2 items-start gap-6">
        <Column side={c.left} pick={c.pick === "left"} />
        <Column side={c.right} pick={c.pick === "right"} />
      </div>
    </div>
  );
}
