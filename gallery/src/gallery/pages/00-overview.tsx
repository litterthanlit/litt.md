/**
 * The overview: a wall of the components themselves, live, and nothing else.
 *
 * After bencho.dev and transitions.dev (2026-10-23, "I like their simplicity"), taken in litt's own terms: the page
 * is its title, the site's own pages, a filter by what you do (Press, Type, Drag…, each page's meta.verbs) and every
 * component as a tile you can use right here. No sidebar (meta.wall): the tiles are the way in.
 *
 * - A tile is one step down from a stage: --surface-2 with the hairline at the surface radius, so the raised surfaces
 *   in it read as objects, as a selected segment does on its track. It is a surface token, not a tint, because a
 *   component's own quiet track (fg 5%, as in Slide to confirm) then lands on a ground whose contrast is checked:
 *   a 5% tile under a 5% track took the grey under 4.5:1. The tile carries no chrome: the component, then its name
 *   in the grey, which links to its page and turns --fg while the pointer is on the tile. A tile is a plain div with
 *   its name as an h3, not a named section: 72 region landmarks would bury the page's own for a screen reader, while
 *   the headings still take you from tile to tile.
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
import { pages, type PageEntry } from "../registry";
import { Miniature } from "../miniature";
import { PageTitle, PreviewContext, VERBS, type PageMeta, type Verb } from "../kit";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  lede: "Real ones, on locked tokens. Try any of them.",
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
      <h3 className="flex px-4 pb-3 text-small font-normal">
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
      </h3>
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
    <section aria-labelledby="all-title" className="grid gap-6">
      <h2 id="all-title" className="sr-only">
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
const TALL = new Set(["plan", "app-shell", "list", "action-bar", "timeline", "message"]);

/** The tiles that open the wall, in this order; every other component follows in the sidebar's order. */
const LEAD = ["plan", "gauge", "slider", "button", "heatmap", "slide-confirm", "switch", "tabs", "pad", "segmented", "stat", "number-field"];

export default function Overview() {
  /* The components and patterns; Overview, Changelog, AI tools and the Playground have no group, and blocks are screens. */
  const list = pages.filter((p) => p.group && p.group !== "Blocks");
  const wall = [...LEAD.map((id) => list.find((p) => p.id === id)).filter((p): p is PageEntry => !!p), ...list.filter((p) => !LEAD.includes(p.id))];
  const blocks = pages.filter((p) => p.group === "Blocks");
  const site = pages.filter((p) => !p.group && !p.wall);
  const count = WORDS[list.length] ?? String(list.length);
  return (
    <article aria-labelledby="page-overview" className="grid gap-12 pb-24">
      <header className="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-4">
        <PageTitle id="page-overview" title={`${count} components.`} lede={meta.lede} />
        <nav aria-label="Pages" className="-mx-3 flex flex-wrap gap-1">
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
      </header>
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
      <Wall list={wall} />
      {blocks.length > 0 && <Blocks list={blocks} />}
    </article>
  );
}
