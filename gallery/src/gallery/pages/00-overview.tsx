/**
 * The overview: a hero you can play, a wall of the components themselves, live, then the steps to build with them.
 *
 * After bencho.dev and transitions.dev (2026-10-23, "I like their simplicity"), taken in litt's own terms: a filter by
 * what you do (Press, Type, Drag…, each page's meta.verbs) and every component as a tile you can use right here. No
 * sidebar (meta.wall): the tiles are the way in.
 *
 * Above the wall, after three more references and Nick's "make it intuitive, captivating, fun and easy to use"
 * (2026-10-26, proposals/gallery-wow.md): what litt is in one large line, Get started and search. The deck that tuned
 * the wall left with Customize (plans/019): the wall shows the gallery's own look.
 * After the blocks, three steps for building with Claude, which Get started takes focus to.
 *
 * - A tile has no box (Nick, 2026-11-05: "remove the boxes and that icon around the components, leave just the title
 *   in the corner, let the design do the talking"), only its ground: the well (--well, a step off the pure white page,
 *   with no line; "current background needs to be inside the product card"), the component on it at its real size,
 *   and its name in the grey in the corner, which links to its page and turns --fg while the pointer is on the tile. The space around
 *   the component is the tile's ground: a click there opens its mosaic. The open button is still there for the
 *   keyboard and screen readers, and shows only while it has keyboard focus. A tile is a plain div with
 *   its name as an h2, not a named section: 72 region landmarks would bury the page's own for a screen reader, while
 *   the headings still take you from tile to tile, and the headings inside a component (a card's title, an accordion's
 *   questions) sit one level under its name.
 * - One Toaster holds the wall, so the tiles and blocks that bring their own (Toast, Cart, the settings screen) hand
 *   their toasts to it, and the page has one Notifications region rather than one per tile.
 * - The component is the real one at its real size, as one object: the page's `tile` (Page in kit.tsx), drawn through
 *   PreviewContext's "tile" mode, or the page's first demo when it has none. Each page owns its tile, wall-tile.tsx
 *   draws it (each world's gallery view draws the same), and this file only lays the wall out.
 * - Still until reached for. A tile mounts as it nears the screen, held still (StillMotion), so arriving, scrolling
 *   and filtering never play fifty entrances at once. The pointer coming onto it, a press or focus wakes it in place
 *   (StillMotion active={false}): nothing remounts and nothing replays, and from then on it moves as it does on its
 *   own page, fun mode included. The wall moves where your hand is and nowhere else.
 * - A tile opens into its mosaic (mosaic.tsx, after s-p.studio, 2026-11-04): every demo on its page, live, dealt out
 *   from the tile and gathered back into it, while the page steps back into soft focus. The expand button beside the
 *   name opens it, and so does a click on the tile's empty ground; the name still goes to the page.
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
import { useEffect, useId, useRef, useState } from "react";
import { useFun } from "@/motion";
import { Toaster } from "@/components/toast";
import { inWorld, pages, type PageEntry } from "../registry";
import { Miniature } from "../miniature";
import { Button } from "@/components/button";
import { Start, toStart } from "../steps";
import { WorldHero } from "../world";
import { materialOf } from "../look";
import { useCustomize } from "../customize-state";
import { MosaicHost, openMosaic, pressTile } from "../mosaic";
import { arriveFrom } from "../arrival";
import { SearchButton } from "../search";
import { VERBS, type PageMeta, type Verb } from "../kit";
import { TALL, useNear, WallTile } from "../wall-tile";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  lede: "The real components on locked tokens, at their real size. Try any of them.",
  order: 0,
  summary: "Every tile is the real component on the locked tokens, and works where it is. Open one to see all of it.",
  tiers: ["instant", "responsive", "expressive"],
  wall: true,
};

/** The current world's block, live at real size, under the hero: the world's name links to its page. */
function HomeHero() {
  const { look } = useCustomize();
  const world = materialOf(look.material);
  return (
    <section aria-labelledby="home-hero-title" data-home-hero className="grid gap-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="home-hero-title" className="text-h2 text-fg">
          <a
            href={`#${world.id}`}
            className="rounded-control transition-colors duration-(--dur-instant) ease-litt hover:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {world.name}
          </a>
        </h2>
        <p className="text-small text-fg-subtle">{world.tagline}</p>
      </div>
      <WorldHero material={look.material} />
    </section>
  );
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Twenty-${n.toLowerCase()}`), "Thirty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Thirty-${n.toLowerCase()}`), "Forty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Forty-${n.toLowerCase()}`), "Fifty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Fifty-${n.toLowerCase()}`), "Sixty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Sixty-${n.toLowerCase()}`), "Seventy",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Seventy-${n.toLowerCase()}`), "Eighty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Eighty-${n.toLowerCase()}`), "Ninety"];

/* ---------- the tile ---------- */

/** The overview's tile (wall-tile.tsx): it opens its mosaic, and its page opens out of it. */
function Tile({ page }: { page: PageEntry }) {
  return (
    <WallTile
      page={page}
      href={`#${page.id}`}
      onOpen={(tile, button) => openMosaic({ page, tile, returnTo: button })}
      onFollow={(tile) => {
        /* The page opens out of this tile, as its mosaic does (arrival.tsx). */
        arriveFrom(page.id, { deck: tile.getBoundingClientRect() });
        /* The page takes a moment to mount, so the tile answers the tap first. */
        pressTile(tile);
      }}
    />
  );
}

/* ---------- the wall ---------- */

const VERB_LABEL: Record<Verb, string> = { press: "Press", type: "Type", select: "Select", drag: "Drag", hover: "Hover", open: "Open", watch: "Watch" };

/** A chip in the filter: a native radio, the selected one in the raised segment's look (R3). */
function Chip({ name, value, label, checked, onPick, cue = false }: { name: string; value: string; label: string; checked: boolean; onPick: () => void; cue?: boolean }) {
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
          {fun && funList.length > 0 && <Chip cue name={name} value="fun" label="Fun" checked={verb === "fun"} onPick={() => setVerb("fun")} />}
          <Chip name={name} value="all" label="All" checked={verb === "all"} onPick={() => setVerb("all")} />
          {verbs.map((v) => (
            <Chip key={v} name={name} value={v} label={VERB_LABEL[v]} checked={verb === v} onPick={() => setVerb(v)} />
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
            <Tile page={p} />
          </li>
        ))}
      </ul>
      <MosaicHost />
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
  return (
    <section aria-labelledby="blocks-title" className="grid gap-6">
      {/* Focusable from code only, for the skip link before the wall. */}
      <h2 id="blocks-title" tabIndex={-1} className="text-h2 text-fg outline-none">
        Blocks
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

/**
 * The tiles that open the wall, in this order; every other component follows in the sidebar's order. The deck above
 * already holds the Switch, the Slider and the Segmented control, so the wall opens on what it cannot show: data and
 * the hand-held pieces. The Button tile carries the wall's one accent fill, so it sits at least a screen below the
 * hero's Get started (wall.mjs checks it).
 */
const LEAD = ["gauge", "heatmap", "plan", "slide-confirm", "pad", "time-scrubber", "stat", "tabs", "button", "number-field", "color-picker", "switch", "slider", "segmented"];

/* ---------- the hero ---------- */

/**
 * What litt is, then Get started, search and the site's own pages. The statement
 * is the gallery's one line above 18px, as its mobile menu's 28px links are: built as an exception for the gallery's
 * hero and asked of Nick (proposals/gallery-wow.md, 2), not a change to R8. Everything under it keeps the scale.
 */
function Hero({ count, site }: { count: string; site: PageEntry[] }) {
  return (
    <header data-arrive="head" className="grid items-center gap-y-12">
      <div className="grid content-center gap-8">
        <div className="grid gap-4">
          <h1
            id="page-overview"
            tabIndex={-1}
            className="max-w-[16ch] outline-none text-[36px] leading-[40px] tracking-[-0.02em] text-balance text-fg sm:text-[56px] sm:leading-[60px]" // litt-allow: the gallery's hero, an exception to the 18px cap asked of Nick (proposals/gallery-wow.md, 2)
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
    </header>
  );
}

export default function Overview() {
  const { look } = useCustomize();
  /* The components and patterns; Overview, Changelog, AI tools and the Playground have no group, and blocks are screens. */
  const list = pages.filter((p) => p.group && p.group !== "Blocks" && p.group !== "Worlds" && !p.world && inWorld(p, look.material));
  const wall = [...LEAD.map((id) => list.find((p) => p.id === id)).filter((p): p is PageEntry => !!p), ...list.filter((p) => !LEAD.includes(p.id))];
  const blocks = pages.filter((p) => p.group === "Blocks" && !p.world && inWorld(p, look.material));
  const site = pages.filter((p) => !p.group && p.id !== meta.id && !p.world);
  const count = WORDS[list.length] ?? String(list.length);
  return (
    <article aria-labelledby="page-overview" className="grid gap-12 pb-24">
      <Hero count={count} site={site} />
      <HomeHero />
      <h2 className="mt-12 text-h2 text-fg">
        Every one, live.
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
