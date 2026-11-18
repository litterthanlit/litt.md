/**
 * Flat as Hypher (an open comparison, plans/024, Flat; Nick, 2026-11-18: "I like the design in https://www.hypher.app/
 * which world would it fit?", then "put it on canvas, let 2b finish"). One small screen three ways, each light over
 * dark: Flat as it ships after phase 2a, the new Flat with every phase 1 call on (flat-calls.tsx's frame and CSS), and
 * the same screen worked in Hypher's direction. Hypher is a direction, not a source: none of its words, marks or
 * pictures are here. The content is Flat's reader voice and the picture is the gallery's own long exposure (a plate).
 *
 * The Hypher take is the new Flat with six choices switched on by data-flat-hypher (flat-hypher.css), each one a rule
 * Nick can take or leave on its own; `Flat · as Hypher, the differences` shows them one at a time. Shipping components
 * through their public props only; nothing in src/components, src/worlds or tokens.css changes for this. Made-up data,
 * no requests.
 */
import { type ReactNode } from "react";
import { Button } from "@/components/button";
import { Card, CardBody, CardCover, CardDescription, CardTitle } from "@/components/card";
import { TextField } from "@/components/input";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag } from "@/components/tag";
import { MaterialProvider } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { OPEN_WATER } from "@/gallery/plates";
import { ALL, DarkContext, InkCard, PlateCover, READERS, WEEK } from "./flat-calls";
import "./flat-hypher.css";

/* ---------------------------------------------------------------- the choices */

/** Hypher's rules that differ from the new Flat, each one separate (flat-hypher.css). */
export type HypherChoice = "paper" | "buttons" | "type" | "picture" | "status" | "panel";
const EVERY: HypherChoice[] = ["paper", "buttons", "type", "picture", "status", "panel"];

export type HypherTake = "today" | "new" | "hypher";

const TAKES: Record<HypherTake, { label: string; call?: string; on: HypherChoice[] }> = {
  today: { label: "Flat as it ships on main, after phase 2a", on: [] },
  new: { label: "Flat with every phase 1 call on: the ink card, the reader's words", call: ALL, on: [] },
  hypher: { label: "The new Flat with Hypher's six choices on (the differences item takes them one at a time)", call: ALL, on: EVERY },
};

/* ---------------------------------------------------------------- the frame */

/** One Flat frame, as flat-calls.tsx's: Flat's theme and accent and its body, whatever the gallery's look. */
function Frame({ dark, call, on, label = true, children }: { dark: boolean; call?: string; on: HypherChoice[]; label?: boolean; children: ReactNode }) {
  return (
    <MaterialProvider material="flat">
      <DarkContext.Provider value={dark}>
        <div
          {...lookAttributes({ accent: "world", material: "flat" }, dark)}
          data-flat-call={call}
          data-flat-hypher={on.length ? on.join(" ") : undefined}
          className="grid content-start gap-4 rounded-surface bg-canvas p-6 text-fg"
        >
          {label && <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>}
          {children}
        </div>
      </DarkContext.Provider>
    </MaterialProvider>
  );
}

/* ---------------------------------------------------------------- the content, one set for every take */

const COPY = {
  eyebrow: "The letter",
  head: ["Twelve pictures from the coast.", "Issue 14 goes out Friday."],
  lede: "A small site and a weekly letter. Read the spring series here, or get each issue in your inbox at 9:00.",
  primary: READERS.go,
  secondary: READERS.back,
  field: READERS.field,
  preview: "Preview issue 14",
} as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p data-hy-eyebrow="" className="text-small text-fg-subtle">
      {children}
    </p>
  );
}

function Headline() {
  return (
    <h2 data-hy-headline="" className="text-h1 font-title text-fg">
      <span className="block">{COPY.head[0]}</span>
      <span data-hy-second="" className="block">
        {COPY.head[1]}
      </span>
    </h2>
  );
}

function Actions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">{COPY.primary}</Button>
      <Button data-hy-secondary="">{COPY.secondary}</Button>
    </div>
  );
}

/** The page header. Stacked in Flat; with Hypher's type, editorial: the headline and actions left, the lede right. */
function Header({ on }: { on: HypherChoice[] }) {
  if (on.includes("type"))
    return (
      <header className="grid grid-cols-[minmax(0,1fr)_minmax(0,14rem)] items-end gap-8">
        <div className="grid gap-4">
          <Eyebrow>{COPY.eyebrow}</Eyebrow>
          <Headline />
          <Actions />
        </div>
        <p className="text-body text-fg-muted">{COPY.lede}</p>
      </header>
    );
  return (
    <header className="grid gap-3">
      <Eyebrow>{COPY.eyebrow}</Eyebrow>
      <Headline />
      <p className="max-w-[44ch] text-body text-fg-muted">{COPY.lede}</p>
      <Actions />
    </header>
  );
}

/** The series card. Flat: the picture as the card's inset cover. Hypher: the card floats on the picture. */
function Series({ on }: { on: HypherChoice[] }) {
  if (on.includes("picture"))
    return (
      <div data-hy-picture="" className="relative grid min-h-64 place-items-center overflow-hidden rounded-surface p-8">
        <PlateCover plate={OPEN_WATER} />
        <Card className="relative w-full max-w-60">
          <CardBody>
            <CardTitle>{READERS.card.title}</CardTitle>
            <CardDescription>{READERS.card.text}</CardDescription>
          </CardBody>
        </Card>
      </div>
    );
  return (
    <Card cover="inset">
      <CardCover>
        <PlateCover plate={OPEN_WATER} />
      </CardCover>
      <CardBody>
        <CardTitle>{READERS.card.title}</CardTitle>
        <CardDescription>{READERS.card.text}</CardDescription>
      </CardBody>
    </Card>
  );
}

function ReadersStat({ hue }: { hue?: "blue" }) {
  return (
    <Stat
      label={READERS.stat.label}
      value={READERS.stat.value}
      delta={READERS.stat.delta}
      tone={hue ? "neutral" : "good"}
      trend={<Sparkline label={READERS.stat.label + ", last 7 days"} values={WEEK} hue={hue} />}
    />
  );
}

/** Hypher's dark panel: the ink card held dark in both themes (Flat's dark ground), with a hairline (flat-hypher.css, F). */
function DarkPanel({ children }: { children: ReactNode }) {
  return (
    <MaterialProvider material="flat">
      <div {...lookAttributes({ accent: "world", material: "flat" }, true)} data-hy-panel="" className="grid content-start gap-3 rounded-surface bg-canvas p-5 text-fg">
        {children}
      </div>
    </MaterialProvider>
  );
}

/** The week's figure: on the ground today, in the ink card in the new Flat, in the dark panel as Hypher. */
function Week({ take, on }: { take: HypherTake; on: HypherChoice[] }) {
  if (take === "today") return <ReadersStat />;
  if (on.includes("panel"))
    return (
      <DarkPanel>
        <ReadersStat hue="blue" />
      </DarkPanel>
    );
  return (
    <InkCard>
      <ReadersStat hue="blue" />
    </InkCard>
  );
}

function Issue() {
  return (
    <Card>
      <CardBody>
        <CardTitle>{READERS.card2.title}</CardTitle>
        <CardDescription>{READERS.card2.text}</CardDescription>
      </CardBody>
    </Card>
  );
}

function Posts() {
  return (
    <Table label="Posts">
      <TableHeader>
        <TableRow>
          <TableHead>{READERS.columns[0]}</TableHead>
          <TableHead>{READERS.columns[1]}</TableHead>
          <TableHead numeric>{READERS.columns[2]}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {READERS.rows.map((r) => (
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

function FieldRow() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <TextField label={COPY.field.label} defaultValue={COPY.field.value} />
      <Button variant="ghost">{COPY.preview}</Button>
    </div>
  );
}

/** One small screen: the header, the series card beside the week, the next issue, the posts and a field row. */
function Screen({ take }: { take: HypherTake }) {
  const { on } = TAKES[take];
  return (
    <div className="grid gap-6">
      <Header on={on} />
      <div className="grid grid-cols-2 items-start gap-4">
        <Series on={on} />
        <div className="grid gap-4">
          <Week take={take} on={on} />
          <Issue />
        </div>
      </div>
      <Posts />
      <FieldRow />
    </div>
  );
}

/** One take, light over dark. */
export function HypherTakePreview({ take }: { take: HypherTake }) {
  const { label, call, on } = TAKES[take];
  return (
    <div data-flat-hypher-take={take} className="grid gap-6">
      <p className="max-w-[80ch] text-small text-fg-muted">{label}</p>
      <Frame dark={false} call={call} on={on}>
        <Screen take={take} />
      </Frame>
      <Frame dark call={call} on={on}>
        <Screen take={take} />
      </Frame>
    </div>
  );
}

/* ---------------------------------------------------------------- the differences, one at a time */

const DIFFERENCES: { choice: HypherChoice; title: string; line: string; dark?: boolean; stack?: boolean; render: (on: HypherChoice[]) => ReactNode }[] = [
  {
    choice: "paper",
    title: "A · Paper has an edge and a soft wide shadow",
    line: "The ground goes nearly white (--flat-well); paper takes a hairline and a faint, wide, zero-offset shadow, and a table's rows take hairlines. Flat today: grey ground, paper with no edge.",
    render: () => (
      <div className="grid gap-4">
        <Issue />
        <Posts />
      </div>
    ),
  },
  {
    choice: "buttons",
    title: "B · Controls are rounded rectangles, the secondary outlined",
    line: "Controls take litt's 6px step and surfaces 10px (concentric), not the pill; the secondary is paper with a hairline. Flat today: the pill, a white secondary.",
    render: () => (
      <div className="grid gap-4">
        <Actions />
        <FieldRow />
      </div>
    ),
  },
  {
    choice: "type",
    title: "C · A mono eyebrow, a two-tone headline, an editorial header",
    line: "The eyebrow and table heads in Geist Mono caps, spaced; the headline at the figure size (40px) with its second line in the quiet ink; headline left, lede right.",
    stack: true,
    render: (on) => <Header on={on} />,
  },
  {
    choice: "picture",
    title: "D · The picture behind paper",
    line: "The long exposure fills a panel and a white card floats on it. Flat today: the picture is the card's inset cover.",
    render: (on) => (
      <div className="grid max-w-96">
        <Series on={on} />
      </div>
    ),
  },
  {
    choice: "status",
    title: "E · A status is a dot and a word, no pill",
    line: "The circle and the word sit on the paper with no grey pill around them. Flat today: the same circle and word, in a pill.",
    render: () => (
      <div className="flex flex-wrap items-center gap-4">
        {READERS.rows.map((r) => (
          <Tag key={r.name} status={r.tone}>
            {r.status}
          </Tag>
        ))}
      </div>
    ),
  },
  {
    choice: "panel",
    title: "F · The dark panel stays dark in dark",
    line: "The ink card is a dark panel with a hairline in both themes. Flat's ink card takes the opposite theme, so it is white in dark. Shown dark.",
    dark: true,
    render: (on) => (
      <div className="grid max-w-80">
        <Week take="hypher" on={on} />
      </div>
    ),
  },
];

/** Each choice alone: the new Flat on the left, the same with that one choice on the right. */
export function HypherDifferences() {
  return (
    <div data-flat-hypher-differences="" className="grid gap-10">
      <p className="max-w-[80ch] text-small text-fg-muted">
        Six separate choices, each on the new Flat alone, so you can take some and leave others. Everything else on each
        pair is the same. Light, but F, which is about dark.
      </p>
      {DIFFERENCES.map((d) => (
        <section key={d.choice} data-hypher-choice={d.choice} aria-label={d.title} className="grid gap-3">
          <div className="grid max-w-[80ch] gap-1">
            <h3 className="text-small font-title text-fg">{d.title}</h3>
            <p className="text-small text-fg-muted">{d.line}</p>
          </div>
          <div className={d.stack ? "grid gap-6" : "grid grid-cols-2 items-start gap-6"}>
            <div className="grid content-start gap-2">
              <span className="text-small text-fg-subtle">The new Flat</span>
              <Frame dark={!!d.dark} call={ALL} on={[]} label={false}>
                {d.render([])}
              </Frame>
            </div>
            <div className="grid content-start gap-2">
              <span className="text-small font-title text-fg">With {d.title.slice(0, 1)}</span>
              <Frame dark={!!d.dark} call={ALL} on={[d.choice]} label={false}>
                {d.render([d.choice])}
              </Frame>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
