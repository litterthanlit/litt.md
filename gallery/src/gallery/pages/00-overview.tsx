/**
 * The overview: the components themselves, live, not their descriptions.
 *
 * A bento of real components on the locked tokens, each tile linking to its
 * page. A few play on their own (a plan that works through its steps, a switch
 * and a segmented control that change, tabs that glide) so the motion shows
 * before you touch anything. A loop only runs while its tile is on screen, stops
 * for good once you reach into the tile, and never runs under reduced motion:
 * the tile then shows one finished state.
 *
 * Under it, every component as a live card, filtered by what you do with it (Press, Type, Drag…, each page's
 * meta.verbs). With fun mode on, a Fun filter comes first and is picked, so the grid opens on the components fun
 * mode changes (each page's meta.fun); turning fun mode off goes back to All. A card is the page's first demo in miniature, held still (StillMotion), so fifty cards never play
 * fifty entrances and the bento above keeps the page's one expressive moment.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFun, useMotionDial } from "@/motion";
import { Avatar, AvatarGroup } from "@/components/avatar";
import { BarList } from "@/components/bar-list";
import { Button } from "@/components/button";
import { Gauge } from "@/components/gauge";
import { Heatmap } from "@/components/heatmap";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";
import { Plan, type PlanStep } from "@/components/plan";
import { Segmented } from "@/components/segmented";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { Switch } from "@/components/switch";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Tag } from "@/components/tag";
import { ToolCall } from "@/components/tool-call";
import { pages, type PageEntry } from "../registry";
import { Miniature } from "../miniature";
import { PageTitle, VERBS, type PageMeta, type Verb } from "../kit";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  lede: "Real ones, on locked tokens.",
  order: 0,
  summary: "Every tile is the real component on the locked tokens. Open one to see all of it.",
  tiers: ["instant", "responsive", "expressive"],
};

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Twenty-${n.toLowerCase()}`), "Thirty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Thirty-${n.toLowerCase()}`), "Forty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Forty-${n.toLowerCase()}`), "Fifty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Fifty-${n.toLowerCase()}`), "Sixty"];

/* ---------- the loop ---------- */

/**
 * A step counter for a tile that plays on its own. It counts only while the
 * tile is on screen and the tab is visible, stops for good when someone reaches
 * into the tile (a press or focus inside it), and never counts under reduced
 * motion, where it holds `still`.
 */
function useLoop<T extends HTMLElement>(length: number, ms: number, still: number): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const { reduced } = useMotionDial();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const stop = () => setTouched(true);
    el.addEventListener("pointerdown", stop);
    el.addEventListener("focusin", stop);
    return () => {
      io.disconnect();
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("focusin", stop);
    };
  }, []);

  const playing = visible && !touched && !reduced;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!document.hidden) setStep((s) => (s + 1) % length);
    }, ms);
    return () => clearInterval(id);
  }, [playing, length, ms]);

  return [ref, reduced && !touched ? still : step];
}

/* ---------- the tile ---------- */

function Tile({ id, title, className = "", children }: { id: string; title: string; className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`tile-${id}`} className={"litt-raised flex min-w-0 flex-col rounded-surface " + className}>
      <div className="grid flex-1 place-items-center p-6 sm:p-8">{children}</div>
      <a
        href={`#${id}`}
        className="group flex items-center justify-between gap-4 border-t border-line px-6 py-3 transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)]"
      >
        <h2 id={`tile-${id}`} className="text-small font-title text-fg">{title}</h2>
        <ChevronRightIcon className="text-fg-subtle transition-colors duration-(--dur-instant) ease-litt group-hover:text-fg" />
      </a>
    </section>
  );
}

/* ---------- every component, live ---------- */

const VERB_LABEL: Record<Verb, string> = { press: "Press", type: "Type", select: "Select", drag: "Drag", hover: "Hover", open: "Open", watch: "Watch" };
const CARD_H = 200;

/** Width of an element, kept current. 0 until measured. */
function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** True once the element has come within a screen of the viewport, and stays true. */
function useNear<T extends HTMLElement>(ref: React.RefObject<T | null>): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}

/**
 * One component as a card: its first demo, live but still and out of reach (a picture of it), over its name. The
 * whole card is the link. The demo mounts only when the card nears the screen, so the page never loads 50 at once.
 */
function Card({ page }: { page: PageEntry }) {
  const [frame, width] = useWidth<HTMLDivElement>();
  const near = useNear(frame);
  return (
    <a
      href={`#${page.id}`}
      className={
        "group litt-raised flex min-w-0 flex-col overflow-hidden rounded-surface [-webkit-tap-highlight-color:transparent] " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      }
    >
      <div ref={frame} aria-hidden="true" inert className="pointer-events-none relative overflow-hidden" style={{ height: CARD_H }}>
        {near && width > 0 && <Miniature page={page} width={width} height={CARD_H} still />}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 transition-colors duration-(--dur-instant) ease-litt group-hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] pointer-coarse:group-active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]">
        <span className="truncate text-small font-title text-fg">{page.title}</span>
        <span className="shrink-0 text-caption font-normal text-fg-subtle">{page.group}</span>
      </div>
    </a>
  );
}

/** A chip in the filter: a native radio, the selected one in the raised segment's look (P12). */
function Chip({ name, value, label, count, checked, onPick, cue = false }: { name: string; value: string; label: string; count: number; checked: boolean; onPick: () => void; cue?: boolean }) {
  return (
    <label
      data-fun-cue={cue ? "" : undefined}
      className={
        "relative flex h-control-sm cursor-pointer items-center gap-2 rounded-control px-3 text-small font-title select-none [-webkit-tap-highlight-color:transparent] " +
        "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md " +
        (checked
          ? "bg-surface-1 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] forced-colors:border-2"
          : "text-fg-muted hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]")
      }
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onPick} className="peer sr-only" />
      <span className="litt-trim">{label}</span>
      <span className="font-mono text-caption font-normal text-fg-subtle tabular-nums">{count}</span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-control peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus" />
    </label>
  );
}

/** Every component as a live card, filtered by what you do with it. */
function EveryComponent({ list }: { list: PageEntry[] }) {
  const fun = !!useFun();
  const [verb, setVerb] = useState<Verb | "all" | "fun">(fun ? "fun" : "all");
  /* Fun mode turned on or off here: lead with its components, or go back to all of them. */
  const [wasFun, setWasFun] = useState(fun);
  if (wasFun !== fun) {
    setWasFun(fun);
    setVerb(fun ? "fun" : "all");
  }
  const name = useId();
  const funList = list.filter((p) => p.fun);
  const shown = verb === "all" ? list : verb === "fun" ? funList : list.filter((p) => p.verbs?.includes(verb));
  const verbs = VERBS.filter((v) => list.some((p) => p.verbs?.includes(v)));
  return (
    <section aria-labelledby="all-title" className="grid gap-6">
      <h2 id="all-title" className="text-h4 text-fg">
        Every component
      </h2>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Show the components you</legend>
        <div className="flex flex-wrap gap-1">
          {fun && funList.length > 0 && <Chip cue name={name} value="fun" label="Fun" count={funList.length} checked={verb === "fun"} onPick={() => setVerb("fun")} />}
          <Chip name={name} value="all" label="All" count={list.length} checked={verb === "all"} onPick={() => setVerb("all")} />
          {verbs.map((v) => (
            <Chip key={v} name={name} value={v} label={VERB_LABEL[v]} count={list.filter((p) => p.verbs?.includes(v)).length} checked={verb === v} onPick={() => setVerb(v)} />
          ))}
        </div>
      </fieldset>
      <p role="status" className="sr-only">
        {shown.length} components
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id} className="grid">
            <Card page={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- the highlights ---------- */

const PLAN: (Omit<PlanStep, "status"> & { doing: string; did: string; target: string; seconds: number })[] = [
  { id: "read", label: "Read the layout of the Northwind site", doing: "Reading", did: "Read", target: "src/app/layout.tsx", seconds: 0.2 },
  { id: "grid", label: "Move the case studies to the new grid", doing: "Editing", did: "Edited", target: "src/pages/work.tsx", seconds: 1.4 },
  { id: "build", label: "Run the build", doing: "Running", did: "Ran", target: "npm run build", seconds: 31 },
  { id: "preview", label: "Publish a preview", doing: "Publishing", did: "Published", target: "northwind-git-grid.vercel.app", seconds: 4 },
];

/** The plan works through its steps with a tool call for each, holds the finished turn, then starts again. */
function AgentTile() {
  const total = PLAN.length + 2; // each step, then two beats on the finished plan
  const [ref, step] = useLoop<HTMLDivElement>(total, 1400, PLAN.length);
  const steps: PlanStep[] = PLAN.map(({ id, label }, i) => ({ id, label, status: i < step ? "done" : i === step ? "running" : "pending" }));
  return (
    <div ref={ref} className="grid w-full max-w-md gap-6">
      <Plan label="Move the Northwind site to the new grid" steps={steps} />
      <div className="grid min-h-44 content-start gap-1 border-t border-line pt-4">
        {PLAN.slice(0, step + 1).map((s, i) =>
          i < step ? (
            <ToolCall key={s.id} status="done" action={s.did} target={s.target} duration={s.seconds} />
          ) : (
            <ToolCall key={s.id} status="running" action={s.doing} target={s.target} />
          ),
        )}
      </div>
    </div>
  );
}

const VIEWS = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];

/** A switch flips and a segmented control steps along, on the instant and responsive tiers. */
function ControlsTile() {
  const [ref, step] = useLoop<HTMLDivElement>(6, 1600, 1);
  const [own, setOwn] = useState<{ on?: boolean; view?: string }>({});
  const on = own.on ?? step % 2 === 1;
  const view = own.view ?? VIEWS[Math.floor(step / 2) % VIEWS.length]!.value;
  return (
    <div ref={ref} className="grid w-full max-w-xs gap-6">
      <Switch align="end" label="Preview deploys" checked={on} onCheckedChange={(v) => setOwn((o) => ({ ...o, on: v }))} />
      <Segmented legend="View" size="sm" block value={view} onValueChange={(v) => setOwn((o) => ({ ...o, view: v }))} options={VIEWS} />
    </div>
  );
}

const TABS = ["Overview", "Activity", "Deploys"];
const TAB_TEXT = ["12,480 visits in the last 7 days.", "Published to production 4 minutes ago.", "Build 5f2e9c1 finished in 42 seconds."];

/** The underline glides between tabs on the responsive tier. */
function TabsTile() {
  const [ref, step] = useLoop<HTMLDivElement>(TABS.length, 2200, 0);
  const [own, setOwn] = useState<string | null>(null);
  const value = own ?? TABS[step]!;
  return (
    <div ref={ref} className="w-full max-w-sm">
      <Tabs value={value} onValueChange={setOwn}>
        <TabsList aria-label="Atelier Nord">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-16 px-control-pad-md pt-4">
          {TABS.map((t, i) => (
            <TabsPanel key={t} value={t}>
              <p className="text-small text-fg-muted">{TAB_TEXT[i]}</p>
            </TabsPanel>
          ))}
        </TabsPanels>
      </Tabs>
    </div>
  );
}

const DEPLOYS = [5, 7, 4, 9, 6, 1, 0, 6, 8, 5, 9, 7, 2, 1];

/* A month of page views, deterministic so the build and the tests see the same dots. */
const VIEWS_DAYS = Array.from({ length: 31 }, (_, i) => i);
const viewsRow = (seed: number) => VIEWS_DAYS.map((d) => Math.round(400 + 600 * Math.abs(Math.sin((d + 1) * seed)) + (d % 7 > 4 ? -300 : 0)));

const PEOPLE = ["Ines Duarte", "Tomas Berg", "Ava Okafor", "Rui Matos", "Lena Voss"];

export default function Overview() {
  const list = pages.filter((p) => p.group); // the components and patterns; Overview, Changelog and the Playground have no group
  const count = WORDS[list.length] ?? String(list.length);
  return (
    <article aria-labelledby="page-overview" className="grid gap-12 pb-24">
      <PageTitle id="page-overview" title={`${count} components.`} lede={meta.lede} />

      <div className="grid gap-4 md:grid-cols-6">
        <Tile id="plan" title="Plan" className="md:col-span-4 md:row-span-2">
          <AgentTile />
        </Tile>
        <Tile id="gauge" title="Gauge" className="md:col-span-2">
          <Gauge label="Credits left" value={20830} max={30000} valueText="20,830 credits" figure="20,830" caption="2k a day on average" hue="teal" size={200} />
        </Tile>
        <Tile id="switch" title="Switch and segmented" className="md:col-span-2">
          <ControlsTile />
        </Tile>

        <Tile id="stat" title="Stat and sparkline" className="md:col-span-2">
          <div className="w-full max-w-xs">
            <Stat
              label="Deploys this week"
              value={38}
              delta="Up 12% on last week"
              tone="good"
              trend={<Sparkline label="Deploys per day, last 14 days" values={DEPLOYS} hue="blue" />}
            />
          </div>
        </Tile>
        <Tile id="tabs" title="Tabs" className="md:col-span-4">
          <TabsTile />
        </Tile>

        <Tile id="heatmap" title="Heatmap" className="md:col-span-4">
          <div className="w-full overflow-x-auto">
            <Heatmap
              label="Page views per day"
              hue="teal"
              cell={12}
              columns={VIEWS_DAYS.map((d) => `day ${d + 1}`)}
              unit={["view", "views"]}
              rows={[
                { label: "August", values: viewsRow(1.7), total: "25,998" },
                { label: "September", values: viewsRow(2.3), total: "24,310" },
                { label: "October", values: viewsRow(3.1).map((v, d) => (d > 19 ? null : v)), total: "16,402" },
              ]}
            />
          </div>
        </Tile>
        <Tile id="button" title="Button, kbd and tag" className="md:col-span-2">
          <div className="grid justify-items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" icon={<PlusIcon />}>New project</Button>
              <Button iconRight={<Kbd>⌘K</Kbd>}>Search</Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Tag status="success">Live</Tag>
              <Tag status="warning">Building</Tag>
              <Tag hue="violet">Brand</Tag>
            </div>
          </div>
        </Tile>

        <Tile id="bar-list" title="Bar list" className="md:col-span-3">
          <div className="w-full max-w-sm">
            <BarList
              label="Most-used shortcuts"
              unit={["time", "times"]}
              hue="blue"
              items={[
                { label: "Archive", value: 412, lead: <Kbd>E</Kbd> },
                { label: "Reply", value: 164, lead: <Kbd>R</Kbd> },
                { label: "Snooze", value: 31, lead: <Kbd>H</Kbd> },
              ]}
            />
          </div>
        </Tile>
        <Tile id="avatar" title="Avatar" className="md:col-span-3">
          <div className="grid justify-items-center gap-4">
            <AvatarGroup label="Project team, 26 people" total={26} ring="surface-1" size="lg">
              {PEOPLE.map((n) => (
                <Avatar key={n} name={n} />
              ))}
            </AvatarGroup>
            <div className="flex items-center gap-3">
              <Avatar name="Ines Duarte" decorative />
              <span className="grid">
                <span className="text-small font-title text-fg">Ines Duarte</span>
                <span className="text-caption font-normal text-fg-subtle">Design lead</span>
              </span>
            </div>
          </div>
        </Tile>
      </div>

      <EveryComponent list={list} />
    </article>
  );
}
