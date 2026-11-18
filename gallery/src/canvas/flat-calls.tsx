/**
 * Flat, phase 1: Nick's calls (plans/024, Flat), live, and the new Flat with every recommendation on. Each call puts the
 * shipping parts as Flat draws them today beside the proposal (or, for calls 5 and 7, the alternative beside the
 * proposal), each in a light frame over a dark one, so Nick can press and compare them. Every frame sets its own world
 * as press.tsx does: Flat's theme and accent (lookAttributes) and a MaterialProvider, whatever the gallery's look. A
 * proposal is the same component with a candidate switched on by data-flat-call (flat-calls.css), or, where the call is
 * about content (a cover, the ink card, the voice), the same parts composed or worded otherwise. Every proposal stands on
 * call 1's grey ground, since the others build on it. Made-up data, no requests (the covers are the gallery's own plates).
 */
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Card, CardBody, CardCover, CardDescription, CardTitle } from "@/components/card";
import { TextField } from "@/components/input";
import { ProjectCover } from "@/components/list-cover";
import { Segmented } from "@/components/segmented";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag } from "@/components/tag";
import { MaterialProvider } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { SILK, type Plate } from "@/gallery/plates";
import { HUES, accentProps } from "./flat-look-data";
import "./flat-calls.css";

export type FlatCallId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/* ---------------------------------------------------------------- the frame */

/** Whether the frame around a part is dark, so the ink card can take the opposite theme. */
export const DarkContext = createContext(false);

/** One Flat frame in light or dark, with the candidates its side switches on. */
export function FlatFrame({ dark, call, style, children }: { dark: boolean; call?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <MaterialProvider material="flat">
      <DarkContext.Provider value={dark}>
        <div
          {...lookAttributes({ accent: "world", material: "flat" }, dark)}
          data-flat-call={call}
          style={style}
          className="grid content-start gap-4 rounded-surface bg-canvas p-6 text-fg"
        >
          <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
          {children}
        </div>
      </DarkContext.Provider>
    </MaterialProvider>
  );
}

/** The ink card: the ink as a rounded square, so it takes the opposite theme (black on a light ground, white on a dark
    one), Flat's frame inside it. Its one colour is a data hue, on its data only. No ring, no cast. */
export function InkCard({ children }: { children: ReactNode }) {
  const dark = useContext(DarkContext);
  return (
    <MaterialProvider material="flat">
      <div {...lookAttributes({ accent: "world", material: "flat" }, !dark)} data-flat-ink-card="" className="grid gap-3 rounded-surface bg-canvas p-5 text-fg">
        {children}
      </div>
    </MaterialProvider>
  );
}

type Side = { label: string; call?: string; style?: (dark: boolean) => CSSProperties; render: () => ReactNode };

function Column({ side, pick }: { side: Side; pick: boolean }) {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <span className={"text-small font-title " + (pick ? "text-fg" : "text-fg-subtle")}>{side.label}</span>
      <FlatFrame dark={false} call={side.call} style={side.style?.(false)}>
        {side.render()}
      </FlatFrame>
      <FlatFrame dark call={side.call} style={side.style?.(true)}>
        {side.render()}
      </FlatFrame>
    </div>
  );
}

/* ---------------------------------------------------------------- the parts the calls show */

/** Flat's voice today: a studio's client sites (every world shares it). */
const STUDIO = {
  card: { title: "Halden Gallery", text: "Wordmark, grid and color for the new wing." },
  card2: { title: "Marlow Labs", text: "A launch page for a dev tool, built in Framer." },
  stat: { label: "Deploys this week", value: 38, delta: "Up 12% on last week" },
  rows: [
    { name: "litt.design v3", status: "Ready", tone: "success", figure: "38 s" },
    { name: "Halden Gallery", status: "Failed", tone: "danger", figure: "12 s" },
    { name: "Founder landing", status: "In review", tone: "warning", figure: "52 s" },
  ],
  columns: ["Site", "Status", "Build"],
  field: { label: "Project name", value: "Halo site" },
  go: "Start a project",
  back: "View work",
} as const;

/** The proposed voice: a person who keeps a small site and a letter, and the people who read it. */
export const READERS = {
  card: { title: "Spring series", text: "Twelve pictures from the coast · 4 min read" },
  card2: { title: "Issue 14", text: "Goes out Friday at 9:00" },
  stat: { label: "Readers this week", value: "1,204", delta: "Up 86 on last week" },
  rows: [
    { name: "Open water", status: "Published", tone: "success", figure: "1,204" },
    { name: "Notes on grey", status: "Scheduled", tone: "warning", figure: "—" },
    { name: "Issue 15", status: "Draft", tone: "neutral", figure: "—" },
  ],
  columns: ["Post", "Status", "Readers"],
  field: { label: "Your email", value: "ines@halo.studio" },
  go: "Subscribe",
  back: "Read the letter",
} as const;

type Voice = typeof STUDIO | typeof READERS;
export const WEEK = [820, 904, 870, 990, 1040, 1118, 1204];

export function PlateCover({ plate }: { plate: Plate }) {
  return <img src={plate.src} srcSet={plate.srcSet} sizes="320px" alt="" className="absolute inset-0 size-full object-cover" />;
}

function SiteCard({ voice, cover }: { voice: Voice; cover: "wireframe" | "plate" }) {
  return (
    <Card cover="inset" className="max-w-72">
      <CardCover>{cover === "wireframe" ? <ProjectCover name="landing" /> : <PlateCover plate={SILK} />}</CardCover>
      <CardBody>
        <CardTitle>{voice.card.title}</CardTitle>
        <CardDescription>{voice.card.text}</CardDescription>
      </CardBody>
    </Card>
  );
}

function PlainCard({ voice }: { voice: Voice }) {
  return (
    <Card className="max-w-72">
      <CardBody>
        <CardTitle>{voice.card2.title}</CardTitle>
        <CardDescription>{voice.card2.text}</CardDescription>
      </CardBody>
    </Card>
  );
}

function Rows({ voice }: { voice: Voice }) {
  return (
    <Table label={voice.columns[0] + "s"}>
      <TableHeader>
        <TableRow>
          <TableHead>{voice.columns[0]}</TableHead>
          <TableHead>{voice.columns[1]}</TableHead>
          <TableHead numeric>{voice.columns[2]}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {voice.rows.map((r) => (
          <TableRow key={r.name}>
            <TableCell primary>{r.name}</TableCell>
            <TableCell>
              <Tag status={r.tone}>{r.status}</Tag>
            </TableCell>
            <TableCell numeric>{r.figure}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Statuses({ voice }: { voice: Voice }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {voice.rows.map((r) => (
        <Tag key={r.name} status={r.tone}>
          {r.status}
        </Tag>
      ))}
      {voice === STUDIO ? <Tag status="neutral">Draft</Tag> : <Tag status="danger">Bounced</Tag>}
    </div>
  );
}

/** The stat as Flat draws it today: ink type on the page, the delta in green, the line in the quiet ink. */
function StatToday({ voice }: { voice: Voice }) {
  return (
    <Stat
      label={voice.stat.label}
      value={voice.stat.value}
      delta={voice.stat.delta}
      tone="good"
      trend={<Sparkline label={voice.stat.label + ", last 7 days"} values={WEEK} />}
    />
  );
}

/** The stat in the ink card: one vivid colour, the first data hue, on its line and nowhere else. */
function StatInk({ voice }: { voice: Voice }) {
  return (
    <InkCard>
      <Stat
        label={voice.stat.label}
        value={voice.stat.value}
        delta={voice.stat.delta}
        trend={<Sparkline label={voice.stat.label + ", last 7 days"} values={WEEK} hue="blue" />}
      />
    </InkCard>
  );
}

function FormRow({ voice }: { voice: Voice }) {
  return (
    <div className="grid gap-3">
      <TextField label={voice.field.label} defaultValue={voice.field.value} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary">{voice.go}</Button>
        <Button>{voice.back}</Button>
      </div>
    </div>
  );
}

function Controls() {
  const [view, setView] = useState<"grid" | "list">("grid");
  return (
    <div className="grid gap-4">
      <Segmented legend="View" value={view} onValueChange={setView} options={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]} />
      <Switch label="Email me new posts" defaultChecked />
      <Switch label="Weekly digest" />
    </div>
  );
}

/* ---------------------------------------------------------------- the new Flat, all calls together */

export const ALL = "ground paper status-dot big-figure";

/** One small screen: two cards, a stat, a list, a form row and the primary action. */
function Screen({ now }: { now: boolean }) {
  const voice = now ? STUDIO : READERS;
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-4">
        <SiteCard voice={voice} cover={now ? "wireframe" : "plate"} />
        {now ? <StatToday voice={voice} /> : <StatInk voice={voice} />}
      </div>
      <PlainCard voice={voice} />
      <Rows voice={voice} />
      <FormRow voice={voice} />
    </div>
  );
}

export function FlatTogetherPreview() {
  return (
    <div data-flat-call-preview="together" className="grid gap-6">
      <div className="grid max-w-[80ch] gap-1">
        <p className="text-small text-fg-muted">
          The same small screen twice: Flat as it ships, and with every recommendation below on. A grey ground with white and ink
          on it, paper with no edge, a real cover, one ink card with one colour, statuses as a word after a circle, a figure
          that stands up, and a reader&apos;s words. The motion stays as you picked it on 16 November.
        </p>
        <p className="text-small font-title text-fg">Recommend: all nine, as below</p>
      </div>
      <div className="grid grid-cols-2 items-start gap-6">
        <Column side={{ label: "Today", render: () => <Screen now /> }} pick={false} />
        <Column side={{ label: "The new Flat", call: ALL, render: () => <Screen now={false} /> }} pick />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the calls */

type Call = { why: string; recommend: string; left: Side; right: Side; pick: "left" | "right" };

const today = (render: () => ReactNode, label = "Today"): Side => ({ label, render });
const proposal = (render: () => ReactNode, call = "", label = "Proposal, on call 1's ground"): Side => ({ label, call: ("ground " + call).trim(), render });

const CALLS: Record<FlatCallId, Call> = {
  1: {
    why: "Your direction says grey is the ground and what sits on it is white or the ink. Today the ground is white and the objects grey. The grey moves from the object to the ground; the grey bubble stays for what is chosen inside white.",
    recommend: "Recommend: the grey ground (light: surface-3 under white and ink; dark: surface-2 under black and white)",
    left: today(() => (
      <>
        <Controls />
        <FormRow voice={STUDIO} />
      </>
    )),
    right: proposal(() => (
      <>
        <Controls />
        <FormRow voice={STUDIO} />
      </>
    )),
    pick: "right",
  },
  2: {
    why: "Nothing outlined and nothing cast, in Flat's rules and in both references. Today every card has a hairline ring and the float shadow, because on a white ground a white card needs an edge. On the grey ground the fill is the edge.",
    recommend: "Recommend: no ring and no shadow on a card or a panel; only what floats keeps its shadow",
    left: today(() => (
      <div className="grid grid-cols-2 gap-4">
        <SiteCard voice={STUDIO} cover="wireframe" />
        <PlainCard voice={STUDIO} />
      </div>
    )),
    right: proposal(
      () => (
        <div className="grid grid-cols-2 gap-4">
          <SiteCard voice={STUDIO} cover="wireframe" />
          <PlainCard voice={STUDIO} />
        </div>
      ),
      "paper",
    ),
    pick: "right",
  },
  3: {
    why: "An X-crossed wireframe is a placeholder, not the work (R1), and Flat is for sites and portfolios: the cover is the loudest thing on the card. A picture, inset and concentric, as the card already draws it.",
    recommend: "Recommend: a real cover (here the gallery's own plates); the wireframe goes",
    left: today(() => <SiteCard voice={STUDIO} cover="wireframe" />),
    right: proposal(() => <SiteCard voice={STUDIO} cover="plate" />, "paper"),
    pick: "right",
  },
  4: {
    why: "Your second reference is black cards, each one live status in one vivid colour. It fits Flat as one object: the ink as a rounded square, its colour a data hue on its data only. One per view, so it stays the thing you look at first.",
    recommend: "Recommend: yes, the ink card, at most one per view (a stat, a live run, a timer); its colour the first data hue, no shadow",
    left: today(() => <StatToday voice={READERS} />),
    right: proposal(() => <StatInk voice={READERS} />),
    pick: "right",
  },
  5: {
    why: "Flat's accent is the ink (decision 14), and plan 012's six colour looks found no hue that is clear of Blue 4, danger and the data hues but the violet. With the ink card and data carrying colour, the primary stays black on white, white on black.",
    recommend: "Recommend: keep the ink as Flat's accent; colour lives in data and the ink card (the violet, shown left, is the alternative)",
    left: {
      label: "Alternative: an accent, plan 012's violet",
      call: "ground",
      style: (dark) => accentProps(dark ? HUES.violet.dark : HUES.violet.light),
      render: () => (
        <>
          <FormRow voice={READERS} />
          <Controls />
        </>
      ),
    },
    right: proposal(
      () => (
        <>
          <FormRow voice={READERS} />
          <Controls />
        </>
      ),
      "",
      "Proposal: the ink, kept, on call 1's ground",
    ),
    pick: "right",
  },
  6: {
    why: "Today a status colours its word inside a grey pill, so a row of statuses is green, amber and red words. A circle is one of Flat's three shapes, and colour belongs where it says something. The word still says the status (R5).",
    recommend: "Recommend: the word in the ink after a small circle in the status colour; the pill stays",
    left: today(() => (
      <>
        <Statuses voice={READERS} />
        <Rows voice={READERS} />
      </>
    )),
    right: proposal(
      () => (
        <>
          <Statuses voice={READERS} />
          <Rows voice={READERS} />
        </>
      ),
      "paper status-dot",
    ),
    pick: "right",
  },
  7: {
    why: "Your 6 November rule is an outline means off, and you called it easy on the eye. The first reference says off by a filled half instead (a white pill on grey). Both are fair; the outline also keeps WCAG's 3:1 edge on the grey ground.",
    recommend: "Recommend: keep the outline for off (the filled half, shown left, is the alternative)",
    left: { label: "Alternative: off as a fill, no outline", call: "ground filled-off", render: () => <Controls /> },
    right: proposal(() => <Controls />, "", "Proposal: the outline, kept, on call 1's ground"),
    pick: "right",
  },
  8: {
    why: "Fun at rest is size and shape, not decoration: in both references the one figure on a widget is several times its label. Fun in motion stays the 0.28 bounce on arrival, small moves still. No type token goes above 18px (Open 1), so 40px here is a candidate.",
    recommend: "Recommend: one figure per object may stand well above 18px (40px shown); the size is yours to set",
    left: today(() => (
      <>
        <StatToday voice={READERS} />
        <div>
          <Button variant="primary">{READERS.go}</Button>
        </div>
      </>
    )),
    right: proposal(
      () => (
        <>
          <StatInk voice={READERS} />
          <div>
            <Button variant="primary">{READERS.go}</Button>
          </div>
        </>
      ),
      "big-figure",
    ),
    pick: "right",
  },
  9: {
    why: "Flat is for sites, portfolios and reading, yet it speaks the studio's client work every world shares (Halo site, Start a project, Deploys this week). Light and airy wants the person who keeps a small site and a letter, and its readers.",
    recommend: "Recommend: the reader's voice (post, issue, reader, series), plain and friendly",
    left: today(() => (
      <>
        <SiteCard voice={STUDIO} cover="wireframe" />
        <Rows voice={STUDIO} />
        <FormRow voice={STUDIO} />
      </>
    ), "Today, every world"),
    right: proposal(
      () => (
        <>
          <SiteCard voice={READERS} cover="plate" />
          <Rows voice={READERS} />
          <FormRow voice={READERS} />
        </>
      ),
      "paper",
    ),
    pick: "right",
  },
};

export function FlatCallPreview({ call }: { call: FlatCallId }) {
  const c = CALLS[call];
  return (
    <div data-flat-call-preview={call} className="grid gap-6">
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

