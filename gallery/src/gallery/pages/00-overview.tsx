/**
 * The overview: a hero you can play, a wall of the components themselves, live, then the steps to build with them.
 *
 * After bencho.dev and transitions.dev (2026-10-23, "I like their simplicity"), taken in litt's own terms: a filter by
 * what you do (Press, Type, Drag…, each page's meta.verbs) and every component as a tile you can use right here. No
 * sidebar (meta.wall): the tiles are the way in.
 *
 * Above the wall, after three more references and Nick's "make it intuitive, captivating, fun and easy to use"
 * (2026-10-26, proposals/gallery-wow.md): what litt is in one large line, Get started and search, and the deck
 * (deck.tsx), litt's own controls wired to the whole gallery, so the first thing a hand reaches changes every tile.
 * After the blocks, three steps for building with Claude, which Get started takes focus to.
 *
 * - A tile is one step down from a stage: --surface-2 with the hairline at the surface radius, so the raised surfaces
 *   in it read as objects, as a selected segment does on its track. It is a surface token, not a tint, because a
 *   component's own quiet track (fg 5%, as in Slide to confirm) then lands on a ground whose contrast is checked:
 *   a 5% tile under a 5% track took the grey under 4.5:1. The tile carries no chrome: the component, then its name
 *   in the grey, which links to its page and turns --fg while the pointer is on the tile. A tile is a plain div with
 *   its name as an h2, not a named section: 72 region landmarks would bury the page's own for a screen reader, while
 *   the headings still take you from tile to tile, and the headings inside a component (a card's title, an accordion's
 *   questions) sit one level under its name.
 * - One Toaster holds the wall, so the tiles and blocks that bring their own (Toast, Cart, the settings screen) hand
 *   their toasts to it, and the page has one Notifications region rather than one per tile.
 * - The component is the real one at its real size, as one object: the page's `tile` (Page in kit.tsx), drawn through
 *   PreviewContext's "tile" mode, or the page's first demo when it has none. Each page owns its tile; this file only
 *   lays the wall out.
 * - Still until reached for. A tile mounts as it nears the screen, held still (StillMotion), so arriving, scrolling
 *   and filtering never play fifty entrances at once. The pointer coming onto it, a press or focus wakes it in place
 *   (StillMotion active={false}): nothing remounts and nothing replays, and from then on it moves as it does on its
 *   own page, fun mode included. The wall moves where your hand is and nowhere else.
 * - Nothing on the wall moves by itself (WCAG 2.2.2). A tile that shows a process (a plan working through its steps,
 *   tabs taking turns) plays it only while the pointer rests on it, pauses when the pointer leaves, and stops for good
 *   once you press or focus inside (useLoop in tile.tsx). At rest and under reduced motion it shows one finished state.
 * - The wall is a couple of hundred Tab stops, so a "Skip to blocks" link comes before it, as "Skip to content" comes
 *   before the page.
 * - With fun mode on, a Fun filter comes first and is picked, so the wall opens on the components fun mode changes
 *   (each page's meta.fun); turning fun mode off goes back to All.
 * - Blocks are screens, not parts, so they come after the wall in a section of their own: a still picture of each
 *   screen's top (Miniature), which opens its page.
 */
import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { StillMotion, useFun } from "@/motion";
import { Toaster } from "@/components/toast";
import { pages, type PageEntry } from "../registry";
import { Miniature } from "../miniature";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { CopyStatus, useCopy } from "../docs/copy";
import { Deck } from "../deck";
import { SearchButton } from "../search";
import { PreviewContext, VERBS, type PageMeta, type Verb } from "../kit";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  lede: "The real components on locked tokens, at their real size. Try any of them.",
  order: 0,
  summary: "Every tile is the real component on the locked tokens, and works where it is. Open one to see all of it.",
  tiers: ["instant", "responsive", "expressive"],
  wall: true,
};

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Twenty-${n.toLowerCase()}`), "Thirty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Thirty-${n.toLowerCase()}`), "Forty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Forty-${n.toLowerCase()}`), "Fifty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Fifty-${n.toLowerCase()}`), "Sixty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Sixty-${n.toLowerCase()}`), "Seventy",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Seventy-${n.toLowerCase()}`), "Eighty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Eighty-${n.toLowerCase()}`), "Ninety"];

/* ---------- the tile ---------- */

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
 * One component on the wall: the real one, live, on its tile, with its name under it. It mounts as it nears
 * the screen and stays out of reach for two frames, so a demo that moves focus as it mounts cannot pull the page.
 * It is held still until the pointer, a press or focus reaches it.
 */
function Tile({ page, children }: { page: PageEntry; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNear(ref);
  const [settled, setSettled] = useState(false);
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    if (!near) return;
    let next = 0;
    const first = requestAnimationFrame(() => (next = requestAnimationFrame(() => setSettled(true))));
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(next);
    };
  }, [near]);
  const wake = () => setAwake(true);
  return (
    <div
      ref={ref}
      data-tile={page.id}
      onPointerEnter={wake}
      onPointerDown={wake}
      onFocus={wake}
      className={
        "group/tile grid min-w-0 grid-rows-[minmax(0,1fr)_auto] rounded-surface bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]"
      }
    >
      <div inert={!settled} className="grid min-h-80 min-w-0 place-items-center p-6 sm:p-10 md:min-h-96">
        {near && (
          <StillMotion active={!awake}>
            <div className="grid w-full min-w-0 place-items-center [&>*]:min-w-0">{children}</div>
          </StillMotion>
        )}
      </div>
      <h2 className="flex px-4 pb-3 text-small font-normal">
        <a
          href={`#${page.id}`}
          className={
            "-mx-2 flex h-control-sm items-center rounded-control px-2 text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
            "transition-colors duration-(--dur-instant) ease-litt hover:text-fg group-hover/tile:text-fg pointer-coarse:h-control-md " +
            "focus-visible:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          }
        >
          {page.title}
        </a>
      </h2>
    </div>
  );
}

/** A page's tile, or its first demo when it has none, as its own page draws them without the title or the docs. */
function PageTile({ page }: { page: PageEntry }) {
  return (
    <PreviewContext.Provider value="tile">
      {/* Holds the tile's room while the page's chunk loads. */}
      <Suspense fallback={null}>
        <page.Component />
      </Suspense>
    </PreviewContext.Provider>
  );
}

/* ---------- the wall ---------- */

const VERB_LABEL: Record<Verb, string> = { press: "Press", type: "Type", select: "Select", drag: "Drag", hover: "Hover", open: "Open", watch: "Watch" };

/** A chip in the filter: a native radio, the selected one in the raised segment's look (R3). */
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
      <span className="text-caption font-normal text-fg-subtle tabular-nums">{count}</span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-control peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus" />
    </label>
  );
}

/** Every component as a live tile, filtered by what you do with it. */
function Wall({ list }: { list: PageEntry[] }) {
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
    <section aria-label="Every component" className="grid gap-6">
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
      {/* Two columns of rows. A row is as tall as its taller tile, so a tile that grows while you use it (an accordion
          opening) grows its row and never sends the others to a new column. A tall component spans two rows beside two
          short ones, and dense packing fills the hole it would leave. */}
      <ul className="grid gap-4 md:grid-flow-row-dense md:grid-cols-2">
        {shown.map((p) => (
          <li key={p.id} className={"grid min-w-0 " + (TALL.has(p.id) ? "md:row-span-2" : "")}>
            <Tile page={p}>
              <PageTile page={p} />
            </Tile>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- the blocks ---------- */

const SCREEN_H = 320;

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

/**
 * A block is a whole screen, so the wall shows it as one: a picture of its top, still and out of reach, on the same
 * ground as a tile. Its name is the link and stretches over the card, so the whole card opens the block without
 * wrapping the screen's own links in another. It mounts as it nears the screen.
 */
function Screen({ page }: { page: PageEntry }) {
  const [frame, width] = useWidth<HTMLDivElement>();
  const near = useNear(frame);
  return (
    <div className="group/tile relative grid min-w-0 rounded-surface bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]">
      <div ref={frame} aria-hidden="true" inert className="pointer-events-none relative overflow-hidden rounded-t-surface" style={{ height: SCREEN_H }}>
        {near && width > 0 && <Miniature page={page} width={width} height={SCREEN_H} still />}
      </div>
      <a
        href={`#${page.id}`}
        className={
          "flex h-control-sm items-center px-4 pb-3 text-small text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
          "transition-colors duration-(--dur-instant) ease-litt group-hover/tile:text-fg pointer-coarse:h-control-md " +
          "after:absolute after:inset-0 after:rounded-surface focus-visible:text-fg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
        }
      >
        {page.title}
      </a>
    </div>
  );
}

/** The blocks: whole screens made of the components, each installed with one command. */
function Blocks({ list }: { list: PageEntry[] }) {
  const count = WORDS[list.length] ?? String(list.length);
  return (
    <section aria-labelledby="blocks-title" className="grid gap-6">
      {/* Focusable from code only, for the skip link before the wall. */}
      <h2 id="blocks-title" tabIndex={-1} className="max-w-[64ch] text-h2 text-balance outline-none">
        <span className="text-fg">{count} blocks.</span> <span className="font-normal text-fg-subtle">Whole screens made of them, each one installed with one command.</span>
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <li key={p.id} className="grid min-w-0">
            <Screen page={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Pages whose tile is two rows tall beside two short ones: their component needs the height. */
const TALL = new Set(["plan", "app-shell", "list", "action-bar", "timeline", "message", "rule-builder"]);

/**
 * The tiles that open the wall, in this order; every other component follows in the sidebar's order. The deck above
 * already holds the Switch, the Slider and the Segmented control, so the wall opens on what it cannot show: data and
 * the hand-held pieces. The Button tile carries the wall's one accent fill, so it sits at least a screen below the
 * hero's Get started (wall.mjs checks it).
 */
const LEAD = ["gauge", "heatmap", "plan", "slide-confirm", "pad", "time-scrubber", "stat", "tabs", "button", "number-field", "color-picker", "switch", "slider", "segmented"];

/* ---------- the hero ---------- */

/**
 * What litt is, then Get started, search and the site's own pages, beside the deck that tunes the wall. The statement
 * is the gallery's one line above 18px, as its mobile menu's 28px links are: built as an exception for the gallery's
 * hero and asked of Nick (proposals/gallery-wow.md, 2), not a change to R8. Everything under it keeps the scale.
 */
function Hero({ count, site }: { count: string; site: PageEntry[] }) {
  return (
    <header className="grid items-center gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="grid content-center gap-8">
        <div className="grid gap-4">
          <h1
            id="page-overview"
            className="max-w-[16ch] text-[36px] leading-[40px] tracking-[-0.02em] text-balance text-fg sm:text-[56px] sm:leading-[60px]" // litt-allow: the gallery's hero, an exception to the 18px cap asked of Nick (proposals/gallery-wow.md, 2)
          >
            A design language you can hold.
          </h1>
          <p className="max-w-[44ch] text-h1 font-normal text-balance text-fg-subtle">
            {count} components on warm stone, lit from above. Free to install, and written down so your agent builds the same way.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={toStart}>
            Get started
          </Button>
          <SearchButton place="hero" />
        </div>
        <nav aria-label="Pages" className="-mx-3 -mt-4 flex flex-wrap gap-1">
            {site.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className={
                  "flex h-control-sm items-center rounded-control px-3 text-small text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
                  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:h-control-md " +
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                }
              >
                {p.title}
              </a>
            ))}
        </nav>
      </div>
      <Deck />
    </header>
  );
}

/* ---------- getting started ---------- */

const ORIGIN = "https://littmd.vercel.app";

/** The hash is the page's route, so the hero reaches the steps by focus, as "Skip to blocks" does, not by a link. */
function toStart() {
  document.getElementById("start-title")?.focus();
}

/** A line to paste: the text in the mono, scrolling sideways if it must, and a copy button beside it, never over it. */
function Paste({ text, label }: { text: string; label: string }) {
  const [state, copy] = useCopy();
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-surface bg-surface-2 py-2 pr-2 pl-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <pre tabIndex={0} role="group" aria-label={label} className="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-small text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <code>{text}</code>
      </pre>
      <Button iconOnly variant="ghost" size="sm" aria-label={`Copy: ${label}`} onClick={() => copy(text)}>
        {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <CopyStatus state={state} />
    </div>
  );
}

/** One step, as a row: what you do in a few words, then the one thing to paste. */
function Step({ n, title, text, paste, label }: { n: number; title: string; text: string; paste: string; label: string }) {
  return (
    <li className="grid min-w-0 gap-4 py-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
      <div className="grid content-start gap-1">
        <p className="text-caption text-fg-subtle tabular-nums">Step {n}</p>
        <h3 className="text-body font-title text-fg">{title}</h3>
        <p className="max-w-[48ch] text-small text-fg-muted">{text}</p>
      </div>
      <Paste text={paste} label={label} />
    </li>
  );
}

/**
 * The three things to do with litt, each with its paste: the language for Claude, a part for the app, and the score.
 * The AI tools page has the MCP setup for each tool.
 */
function Start() {
  return (
    <section aria-labelledby="start-title" className="grid gap-6">
      {/* Focusable from code only, for the hero's Get started. */}
      <h2 id="start-title" tabIndex={-1} className="max-w-[64ch] scroll-mt-24 text-h2 text-balance outline-none">
        <span className="text-fg">Build with your agent.</span>{" "}
        <span className="font-normal text-fg-subtle">The taste comes with the parts: Claude reads the rules, installs the components and checks its own work.</span>
      </h2>
      <ol className="grid divide-y divide-line border-y border-line">
        <Step
          n={1}
          title="Give Claude the language"
          text="The litt.md plugin: the rules, the specs and the workflows to build, critique and check."
          paste={"claude plugin marketplace add litterthanlit/litt.md\nclaude plugin install litt-md@litt"}
          label="Install the plugin"
        />
        <Step
          n={2}
          title="Add any part"
          text="Every component installs with shadcn, on litt's own tokens, so your theme stays untouched."
          paste={`npx shadcn@latest add ${ORIGIN}/r/button.json`}
          label="Add a component"
        />
        <Step
          n={3}
          title="Score your app"
          text="Ask Claude, and it measures your code against litt out of 100, with every fix."
          paste="how litt is this app?"
          label="Ask Claude"
        />
      </ol>
      <p className="text-small text-fg-subtle">
        Cursor, VS Code and Codex:{" "}
        <a
          href="#ai"
          className="rounded-control text-accent-text underline decoration-[color-mix(in_oklab,var(--accent-text)_40%,transparent)] underline-offset-2 transition-colors duration-(--dur-instant) ease-litt hover:decoration-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          AI tools
        </a>{" "}
        has the setup, through shadcn's MCP server.
      </p>
    </section>
  );
}

export default function Overview() {
  /* The components and patterns; Overview, Changelog, AI tools and the Playground have no group, and blocks are screens. */
  const list = pages.filter((p) => p.group && p.group !== "Blocks");
  const wall = [...LEAD.map((id) => list.find((p) => p.id === id)).filter((p): p is PageEntry => !!p), ...list.filter((p) => !LEAD.includes(p.id))];
  const blocks = pages.filter((p) => p.group === "Blocks");
  const site = pages.filter((p) => !p.group && !p.wall);
  const count = WORDS[list.length] ?? String(list.length);
  return (
    <article aria-labelledby="page-overview" className="grid gap-12 pb-24">
      <Hero count={count} site={site} />
      <h2 className="mt-12 max-w-[64ch] text-h2 text-balance">
        <span className="text-fg">Every one, live.</span> <span className="font-normal text-fg-subtle">{meta.lede}</span>
      </h2>
      {blocks.length > 0 && (
        /* As the shell's "Skip to content": out of sight until it has focus, then at the top left. */
        <button
          type="button"
          onClick={() => document.getElementById("blocks-title")?.focus()}
          className="sr-only z-50 bg-accent px-4 py-2 font-title text-accent-fg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to blocks
        </button>
      )}
      <Toaster>
        <Wall list={wall} />
        {blocks.length > 0 && <Blocks list={blocks} />}
      </Toaster>
      <div className="mt-12">
        <Start />
      </div>
    </article>
  );
}
