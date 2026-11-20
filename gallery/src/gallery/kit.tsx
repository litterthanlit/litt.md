/**
 * Gallery kit: the building blocks every page uses. A component page is stripped to the name (plans/024, phase 0,
 * after the components repo's DESIGN.md): the name, then one stage, the page's lead demo (the one its wall tile uses).
 * Under the stage sit its Code switch and Replay, and one disclosure, Variants, which holds the lead's caption and the
 * page's other stages and Try it, out of sight until it is opened. About, the docs and the install follow, quieter.
 * The lede and the tiers stay in meta, for the player, search, the Copy prompt and docs/<page>.md, and leave the page.
 * A page's stage or tile can draw a different demo per world (`byWorld` on Stage, `tileByWorld` on Page): the same
 * component and contract props in the world's words; a world without one draws the shared demo.
 * Text spacing follows foundations.md (Type, Text spacing).
 */
import { Children, cloneElement, createContext, Fragment, isValidElement, lazy, Suspense, useContext, useId, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { DeviceProvider, StillMotion, useFun, type Tier } from "@/motion";
import { Button } from "@/components/button";
import { Framed } from "@/components/framed";
import { ChevronDownIcon, SparkleIcon } from "@/components/icons";
import type { Material } from "./look";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";

/** The sidebar's groups, in the order they appear. */
/** Blocks come last: whole screens built from the components in the groups above them. */
/** Worlds first: the materials as pages you arrive on (proposals/worlds.md). The nav and the menu draw that group as the way in, not as a group of components. */
/* Finer groups, about four to eleven parts each, after design.how's systems (Nick, 2026-11-15): a person chooses a
   group, then a part, instead of passing ninety in a row. */
export const PAGE_GROUPS = ["Worlds", "Actions", "Inputs", "Selection", "Tools", "Overlays", "Navigation", "Layout", "Feedback", "Data", "Charts", "Agents", "Commerce", "Blocks"] as const;
export type PageGroup = (typeof PAGE_GROUPS)[number];

/**
 * How a component is used, for the overview's filter: what a person does to it, or Watch for what moves on its own.
 * A page lists the ones its component answers to; a static piece (a tag, a stat) lists none and shows under All.
 */
export const VERBS = ["press", "type", "select", "drag", "hover", "open", "watch"] as const;
export type Verb = (typeof VERBS)[number];

export type PageMeta = {
  /** URL hash and nav id: letters, digits and dashes only. */
  id: string;
  title: string;
  /**
   * One short line under the title, set in the grey beside it as one sentence: what the
   * component is, in plain words. The page shows it; the summary is for the docs, the
   * agents and the About section under the demos.
   */
  lede: string;
  /**
   * The lede in a world's own words, by world: what the part is in that world's body, where the shared line names
   * another world's material (plans/audits/heat-fixes.md, Track B). The player's Home and Details read it through
   * `lineIn`; a world without one reads `lede`. The generators read only `lede`.
   */
  ledeByWorld?: Partial<Record<Material, string>>;
  /** Sidebar order. 0 is the overview. */
  order: number;
  /** The sidebar group. Overview and Playground have none, so they sit above and below the groups. */
  group?: PageGroup;
  /** What a person does with the component, for the overview's filter. Leave it out for a static piece. */
  verbs?: Verb[];
  /** One sentence: what the component is and what its motion does. */
  summary: string;
  /**
   * What fun mode changes here, as something to try: "Throw the thumb: it coasts to the end and confirms." Set it on
   * every page whose component moves differently in fun mode. With fun mode on, the gallery leads with these pages:
   * a Fun group at the top of the nav, a Fun filter first on the overview, and this line under the page's title.
   */
  fun?: string;
  tiers: Tier[];
  /**
   * The registry block this page shows: the name of a file in src/blocks, which is also this page's id. The header
   * then offers the block's install command and its source, and a Code tab whose demo imports it shows the block too.
   */
  block?: string;
  /**
   * The page runs the whole width with no sidebar, because it is its own way in: the overview, whose tiles are the
   * components and link to their pages. It links the site's own pages (the ones with no group) itself.
   */
  wall?: boolean;
  /**
   * The page is a world: the material it shows (proposals/worlds.md). Its id is the material's id, its group is Worlds,
   * and it runs the whole width (wall) with the hero block live under the name. Opening it sets the gallery's material.
   */
  world?: Material;
  /**
   * The worlds this part belongs to (proposals/worlds.md, Depth, decision 12). Leave it out for a part that makes sense
   * in every world, which is nearly all of them. A world-only part names its worlds (`["device"]`): the wall, the
   * sidebar, the phone menu and the other world pages hide it, and its world page lists it under Only here. A shared
   * part never forks per world; a world goes deeper by parts and abilities that exist in it alone.
   */
  worlds?: Material[];
  /**
   * The mechanism, one paragraph in the studies' voice (proposals/worlds.md, unit 2): what the hand does, what springs
   * on which tier, what each material changes, what reduced motion does. The page shows it under Anatomy, and
   * gen-llms.mjs ships it to agents. Set it with `study`.
   */
  mechanism?: string;
  /** How it moves in a world's own body, by world, as `ledeByWorld` is for the lede: a study's How it moves reads it through `lineIn`. */
  movesByWorld?: Partial<Record<Material, string>>;
  /**
   * The page may override the locked tokens with the motion dial. Every page
   * leaves this off except the Playground; the dial's CSS variables exist only
   * while a page with `tune` is open.
   */
  tune?: boolean;
};

/** The R1 states, in the order every States row shows them. */
export const STATES = ["default", "hover", "pressed", "focus", "disabled", "empty", "loading", "error"] as const;
export type StateName = (typeof STATES)[number];

/**
 * A study (proposals/worlds.md, unit 2): what makes a component page read like one of Nick's studies. Anatomy, the
 * part at rest with callouts naming its parts; States, every R1 state it has in one row; the mechanism (meta.mechanism)
 * in a paragraph; Replay, which runs the mechanism; Source, the registry file inline with its version; and Under each
 * material, the same object under Press, Flat and Device. All of it is page data, and the kit draws it (study.tsx), so
 * nothing in src/components changes for a study. <Page study={study}>.
 */
export type PageStudy = {
  /**
   * The part at rest, one object, as `tile` is: still, deterministic, at real size, and no accent fill unless it is the
   * page's one (R6). It is drawn for Anatomy and once per material, so it must render the same each time.
   */
  object: ReactNode;
  /**
   * The anatomy callouts, in reading order: a part's name and a CSS selector the kit resolves inside the object's box
   * (the first match). Name the parts litt names: the tray, the block, the cap, the slot, the words, the line.
   */
  parts: { name: string; selector: string }[];
  /**
   * The part in each R1 state it has, by name; the kit lays them out in STATES order and leaves out the rest. Each is
   * a still rendering through a prop the component has (disabled, loading, error, an empty value); a state the
   * component can only reach under a pointer (hover, pressed) is left out rather than faked.
   */
  states: Partial<Record<StateName, ReactNode>>;
  /**
   * Replay: until the first press the stage holds `object` at rest (nothing moves on its own, R4). Each press mounts
   * `run(n)` afresh (n from 1), and what mounts plays the mechanism from its start and ends at its end state; under
   * reduced motion it mounts at the end state. The caption says what to watch.
   */
  replay?: { label: string; caption: string; run: (n: number) => ReactNode };
};

/**
 * What a component page says about its component, under the stages. <Page docs={docs}>
 * renders it as Use when and Skip when, Usage, Props, Keyboard and Accessibility, and
 * builds the Copy prompt text from it. Write plain words, short sentences, and say why.
 * The props tables are not written here: scripts/gen-docs.mjs reads them from the
 * component source (types, defaults and the JSDoc on each prop).
 */
export type PageDocs = {
  /** Stems of files in src/components, in order: ["button"]. The first one is the Source link. */
  components: string[];
  /** Exports to document, in order. Default: every exported component and hook in those files. */
  exports?: string[];
  /** A short snippet someone can paste. Leave the import line out and it is added for the exports the snippet uses. */
  usage: string;
  /** "Use when" bullets. */
  use: string[];
  /** "Skip when" bullets. Name the alternative where there is one. */
  skip: string[];
  /** Each row is the keys (any one of them does it) and what happens. Optional. */
  keyboard?: [keys: string[], does: string][];
  /** What the component guarantees, and what the caller must still do. */
  a11y: string[];
};

/**
 * The world a page is drawn in: set by a world's site (world-site.tsx) around everything under #<world>, so a page at
 * #device/gauge, and its tile in Device's gallery view and player, read "device". Null on the gallery's own pages (the
 * overview's wall), which draw the shared demos.
 */
export const WorldContext = createContext<Material | null>(null);

/**
 * A page's line in a world: its lede, or How it moves (`mechanism`), in that world's own words where meta gives them
 * (`ledeByWorld`, `movesByWorld`), and the shared line where it does not or where there is no world.
 */
type Lines = Pick<PageMeta, "lede" | "ledeByWorld" | "mechanism" | "movesByWorld">;
export function lineIn(meta: Lines, line: "lede", world: Material | null): string;
export function lineIn(meta: Lines, line: "moves", world: Material | null): string | undefined;
export function lineIn(meta: Lines, line: "lede" | "moves", world: Material | null): string | undefined {
  if (line === "lede") return (world && meta.ledeByWorld?.[world]) || meta.lede;
  return (world && meta.movesByWorld?.[world]) || meta.mechanism;
}

/**
 * Device's plate (plans/024, phase 2): under Device a stage and a wall tile are a part's plate, not a dark screen and
 * not a flat well. The plate's gradient and its lit edge (--plate-face, --plate-edge), its grain behind what stands on it
 * (--plate-grain) and its em corner (--radius-plate, R9's exception), marked `data-part="plate"` for test:materials.
 */
export const DEVICE_PLATE =
  "litt-grain isolate after:-z-10 [--grain-opacity:var(--plate-grain)] in-[[data-material=device]]:rounded-plate [background:var(--plate-face)] shadow-(--plate-edge)";

/**
 * A stage's demo in one world (Stage's `byWorld`): the same component with the same contract props, in the world's own
 * words. `title` and `caption` replace the stage's where the demo says something else, and `code` names its function
 * in the page file for the Code view, as Stage's `code` does. Whatever is left out is the shared stage's.
 */
export type WorldDemo = { demo: ReactNode; title?: string; caption?: ReactNode; code?: string };

/** A stage's props with its world's demo laid over them, or as they are in a world without one. */
function inWorldOf(props: StageProps, world: Material | null): StageProps {
  const alt = world ? props.byWorld?.[world] : undefined;
  if (!alt) return props;
  return { ...props, children: alt.demo, title: alt.title ?? props.title, caption: alt.caption ?? props.caption, code: alt.code ?? props.code };
}

/* The docs layer loads only for pages that pass `docs`: it carries the generated docs
   data, the highlighter and the prompt builder, which no other page needs. */
const loadDocs = () => import("./docs/page-docs");
const DocsActions = lazy(() => loadDocs().then((m) => ({ default: m.DocsActions })));
const DocsSections = lazy(() => loadDocs().then((m) => ({ default: m.DocsSections })));
/* A block page's actions need no docs data, so they are a small chunk of their own. */
const BlockActions = lazy(() => import("./docs/block-actions"));
/* The study layer loads only for pages that pass `study`: the callouts, the source and the material frames. */
const StudySections = lazy(() => import("./study").then((m) => ({ default: m.StudySections })));

/**
 * Set by the sidebar's hover preview (nav-preview.tsx) and the overview's blocks. A page then draws only its first
 * stage's demo, with no title, caption or docs, so every page has a preview without a line of its own. The overview's
 * wall sets "tile": a page that has a `tile` draws that instead, and any other page its first demo. The overview's
 * mosaic (mosaic.tsx) sets "mosaic": the page draws every stage as a piece, its demo and its title, and nothing else.
 */
export const PreviewContext = createContext<boolean | "tile" | "mosaic">(false);

/**
 * The first <Stage>'s demo among a page's children, for preview mode. It looks through fragments and through any
 * wrapper (a page may wrap its stages in a <Toaster>), and keeps the wrapper around the demo, because the demo may
 * need what it provides. Null when the page has no stage.
 */
function firstDemo(children: ReactNode, world: Material | null): ReactNode | null {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    if (child.type === Stage) return inWorldOf((child as ReactElement<StageProps>).props, world).children;
    if (child.props.children === undefined) continue;
    const found = firstDemo(child.props.children, world);
    if (found === null) continue;
    return child.type === Fragment ? found : cloneElement(child, undefined, found);
  }
  return null;
}

/**
 * Only the <Stage>s among a page's children, for the mosaic. It looks through fragments and wrappers as firstDemo
 * does, and keeps each wrapper (a Toaster) around the stages it holds.
 */
function onlyStages(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    if (child.type === Stage) {
      out.push(child);
      continue;
    }
    if (child.props.children === undefined) continue;
    const inner = onlyStages(child.props.children);
    if (!inner.length) continue;
    out.push(child.type === Fragment ? inner : cloneElement(child, undefined, ...inner));
  }
  return out;
}

/** Which page a Stage sits in, so its Code tab can find the page file. */
const PageIdContext = createContext<string | null>(null);

/**
 * The page's one disclosure, Variants: whether it is open, the id each slot's region takes, and how many slots and
 * stages the page has. The lead stage (slot 0) draws the button; every later Stage and Try it is hidden until it opens.
 */
type VariantsState = { open: boolean; toggle: () => void; idOf: (slot: number) => string; slots: number; stages: number };
const VariantsContext = createContext<VariantsState | null>(null);

/** Internal: where a Stage or Try it sits on its page, set by Page (withSlots). 0 is the lead. */
type Slotted = { slot?: number };

/**
 * The page's children with each Stage and Try it numbered in reading order (the first Stage is 0, the lead), through
 * fragments and wrappers (a Toaster) as firstDemo looks. The tree keeps its shape, so a wrapper still mounts once.
 */
function withSlots(children: ReactNode, next: { slot: number; stages: number }): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (child.type === Stage) {
      next.stages++;
      return cloneElement(child as ReactElement<Slotted>, { slot: next.slot++ });
    }
    /* A Try it before the first Stage stays in the open: the lead's disclosure could never reach it. */
    if (child.type === TryIt && next.stages > 0) return cloneElement(child as ReactElement<Slotted>, { slot: next.slot++ });
    if (child.props.children === undefined) return child;
    const inner = withSlots(child.props.children, next);
    return child.type === Fragment ? <>{inner}</> : cloneElement(child, undefined, inner);
  });
}

/** With fun mode on (and only then, so never under reduced motion), what to try on this page. */
function FunHint({ text }: { text?: string }) {
  const fun = useFun();
  if (!fun || !text) return null;
  return (
    <p data-fun-cue="" className="-mt-3 flex max-w-(--measure) items-start gap-2 text-small text-fg-muted">
      <SparkleIcon className="mt-0.5 shrink-0 text-fg-subtle" />
      <span>
        <span className="font-title text-fg">Fun mode.</span> {text}
      </span>
    </p>
  );
}

export function Page({
  meta,
  docs,
  study,
  tile,
  tileByWorld,
  children,
}: {
  meta: PageMeta;
  docs?: PageDocs;
  /** The study treatment (PageStudy): Anatomy, States, the mechanism, Replay, Source and Under each material, after the stages. */
  study?: PageStudy;
  /**
   * The component as one object, for its tile on the overview's wall: what to draw when the first demo is more than
   * a tile should hold (a form around the field, a set of states, a page's worth). Real size, live, one thing to
   * touch, and no accent fill: the Button tile carries the wall's one. Leave it out and the tile is the first demo.
   */
  tile?: ReactNode;
  /**
   * The tile in a world's own words, by world: the same component and contract props as `tile`. A world without one
   * draws `tile`, or with no `tile` the first stage's demo in that world, so a lead stage's `byWorld` reaches the tile.
   */
  tileByWorld?: Partial<Record<Material, ReactNode>>;
  children: ReactNode;
}) {
  const preview = useContext(PreviewContext);
  const world = useContext(WorldContext);
  const [open, setOpen] = useState(false);
  const base = useId();
  if (preview === "mosaic") return <>{onlyStages(children)}</>;
  if (preview === "tile") {
    const own = world ? tileByWorld?.[world] : undefined;
    if (own !== undefined) return <>{own}</>;
    if (tile !== undefined) return <>{tile}</>;
  }
  if (preview) return <>{firstDemo(children, world)}</>;
  const count = { slot: 0, stages: 0 };
  const slotted = withSlots(children, count);
  const variants: VariantsState = { open, toggle: () => setOpen((o) => !o), idOf: (slot) => `${base}-slot-${slot}`, slots: count.slot, stages: count.stages };
  return (
    <PageIdContext.Provider value={meta.id}>
      <VariantsContext.Provider value={variants}>
        <article aria-labelledby={`page-${meta.id}`} className="grid gap-12 pb-24">
          {/* Stripped to the name. The lede and the tiers stay in meta: the player, the Copy prompt and docs/<page>.md read them. */}
          <header data-arrive="head" className="grid gap-6">
            <h1 id={`page-${meta.id}`} tabIndex={-1} className="text-h1 text-balance text-fg outline-none">
              {meta.title}
            </h1>
            <FunHint text={meta.fun} />
          </header>
          {slotted}
          {study && (
            <Suspense fallback={<div aria-hidden="true" className="min-h-[40svh]" />}>
              <StudySections meta={meta} docs={docs} study={study} />
            </Suspense>
          )}
          <section aria-labelledby={`about-${meta.id}`} className="grid content-start gap-4 border-t border-line pt-12">
            <h2 id={`about-${meta.id}`} className={QUIET_HEADING}>
              About
            </h2>
            <p className="max-w-(--measure) text-small text-fg-muted">{meta.summary}</p>
            {(docs || meta.block) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                {docs && (
                  /* Holds the row's height while the docs chunk loads, so nothing below jumps. */
                  <Suspense fallback={<div aria-hidden="true" className="h-control-sm" />}>
                    <DocsActions meta={meta} docs={docs} />
                  </Suspense>
                )}
                {meta.block && (
                  <Suspense fallback={<div aria-hidden="true" className="h-control-sm" />}>
                    <BlockActions block={meta.block} />
                  </Suspense>
                )}
              </div>
            )}
          </section>
          {docs && (
            <Suspense fallback={<div aria-hidden="true" className="min-h-[60svh]" />}>
              <DocsSections docs={docs} />
            </Suspense>
          )}
        </article>
      </VariantsContext.Provider>
    </PageIdContext.Provider>
  );
}

/** A section's title under the stage, as quiet as the components repo's Source label: small, muted, the title weight. */
export const QUIET_HEADING = "-mb-3 text-small font-title text-fg-muted text-balance";

/**
 * A page's title and lede as one sentence in two inks, at the title size: the name in
 * --fg at the title weight, then the lede in the grey at the text weight (R8). The h1
 * stays the name alone, so the page's landmark is still called "Button". The gallery's
 * own pages (Systems, AI, Changelog) use it; a component page is stripped to the name.
 */
export function PageTitle({ id, title, lede, className = "" }: { id: string; title: string; lede: string; className?: string }) {
  return (
    <div className={"flex max-w-(--measure) flex-wrap items-baseline gap-x-2 text-h1 text-balance " + className}>
      <h1 id={id} tabIndex={-1} className="text-fg outline-none">{title}</h1>
      <p className="text-fg-subtle">{lede}</p>
    </div>
  );
}

/** A block's links point at an app's routes. In the gallery they go nowhere, and must not move its own hash. */
const stayPut = (e: MouseEvent) => {
  if (e.target instanceof Element && e.target.closest("a[href]")) e.preventDefault();
};

/**
 * A window onto an app, for a block: the canvas with a hairline, scrolling inside itself, at a fixed height so a
 * stage stays one size. `phone` makes it phone wide and tells the components inside they are on a phone. `bare`
 * drops the padding, for a block that brings its own (a full page, an app shell). The block inside is Framed, so the
 * page keeps its one main and h1.
 */
export function AppFrame({ label, phone = false, bare = false, className = "", children }: { label: string; phone?: boolean; bare?: boolean; className?: string; children: ReactNode }) {
  const frame = (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      onClickCapture={stayPut}
      className={
        "relative h-176 w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        (bare ? "" : phone ? "p-4 " : "p-8 ") +
        className
      }
    >
      <Framed>{children}</Framed>
    </div>
  );
  if (!phone) return frame;
  return (
    <div className="mx-auto w-full max-w-sm">
      <DeviceProvider mode="phone">{frame}</DeviceProvider>
    </div>
  );
}

/** Remount children to replay an entrance. */
export function useReplay(): [number, () => void] {
  const [key, setKey] = useState(0);
  return [key, () => setKey((k) => k + 1)];
}

type StageProps = {
  title: string;
  /** What moves, how, and why. Plain words. */
  caption: ReactNode;
  /** The tier the demo moves on. Not drawn since plans/024 phase 0; the page's Motion docs (meta.tiers) say it. */
  tier?: Tier;
  onReplay?: () => void;
  replayLabel?: string;
  /** Stage height. Airy by default. */
  size?: "md" | "lg";
  /** Where the demo sits inside the stage. */
  align?: "center" | "start" | "end";
  /**
   * The name of the demo function in this page file, for example "LoadingDemo". It adds
   * a Preview and Code switch, and Code shows that function's source: the imports it
   * uses, the page's own helpers and constants it names, then the function. The function
   * must be declared at the top level of the page file.
   */
  code?: string;
  /**
   * The demo in a world's own words, by world (WorldDemo): the same component with the same contract props. A world
   * without one draws `children`, the shared demo. On the lead stage it reaches the tile too, unless the page has a
   * `tile` (then give the page `tileByWorld`).
   */
  byWorld?: Partial<Record<Material, WorldDemo>>;
  children: ReactNode;
} & Slotted;

/* Try it reads the generated docs data, so it loads with the docs layer, not with every page. */
const LazyTryIt = lazy(() => import("./docs/try-it").then((m) => ({ default: m.TryIt })));

/**
 * The component beside controls for its props, and the JSX for what you set (docs/try-it.tsx). Put it after a
 * page's stages. The controls come from the prop types in the generated docs, so name the export (`of`), pass the
 * component, and pass the props it always needs (`props`), such as its children or a label.
 */
export function TryIt({ slot, ...props }: import("./docs/try-it").TryItProps & Slotted) {
  const variants = useContext(VariantsContext);
  const body = (
    <Suspense fallback={<div aria-hidden="true" className="min-h-80" />}>
      <LazyTryIt {...props} />
    </Suspense>
  );
  /* On its page it sits in Variants, with the stages after the lead. */
  if (!variants || slot === undefined) return body;
  return (
    <div id={variants.idOf(slot)} hidden={!variants.open} className="grid">
      {variants.open && body}
    </div>
  );
}

const loadStageCode = () => import("./docs/stage-code");
const StageCode = lazy(loadStageCode);

type View = "preview" | "code";

/**
 * A stage as one piece of the overview's mosaic (mosaic.tsx): its demo on the well, as a tile's, with no line, and
 * its title under it.
 * The figure holds the piece's place in the grid and never moves; the face inside it is what the mosaic deals out
 * and gathers back. A large stage takes both columns, and so does one whose demo is wider than a column (data-wide,
 * set by the mosaic as it opens). Like a tile, it is held still until the pointer, a press or focus reaches it.
 */
function MosaicPiece({ title, size, place, onReplay, replayLabel, children }: { title: string; size: "md" | "lg"; place: string; onReplay?: () => void; replayLabel: string; children: ReactNode }) {
  const [awake, setAwake] = useState(false);
  const wake = () => setAwake(true);
  return (
    <figure data-piece className={"m-0 grid min-w-0 md:data-wide:col-span-2 " + (size === "lg" ? "md:col-span-2" : "")}>
      <div
        data-piece-face
        onPointerEnter={wake}
        onPointerDown={wake}
        onFocus={wake}
        className="grid min-w-0 grid-rows-[minmax(0,1fr)_auto] rounded-surface bg-well"
      >
        <div className={"grid min-h-64 min-w-0 p-4 sm:p-8 " + place}>
          <StillMotion active={!awake}>
            <div className={"grid w-full min-w-0 [&>*]:min-w-0 " + place}>{children}</div>
          </StillMotion>
        </div>
        <figcaption className="flex min-h-control-md items-center justify-between gap-3 px-4 pb-2 text-small text-fg-muted">
          <span className="min-w-0">{title}</span>
          {onReplay && (
            <Button size="sm" variant="ghost" onClick={onReplay}>
              {replayLabel}
            </Button>
          )}
        </figcaption>
      </div>
    </figure>
  );
}

/**
 * The quiet disclosure under the lead stage: one real button with aria-expanded, controlling the lead's caption and
 * every later Stage and Try it on the page. "Variants" when there are other stages, "Notes" when there is only the
 * caption. The chevron turns half a turn on the responsive tier, as the Accordion's does; what it opens appears at once.
 */
function VariantsButton({ variants }: { variants: VariantsState }) {
  const controls = Array.from({ length: variants.slots }, (_, k) => variants.idOf(k)).join(" ");
  const more = variants.stages - 1;
  return (
    <button
      type="button"
      data-variants=""
      aria-expanded={variants.open}
      aria-controls={controls}
      onClick={variants.toggle}
      className="group/notes litt-target relative -mx-2 flex h-control-sm items-center gap-1 justify-self-start rounded-control px-2 text-small text-fg-subtle select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md"
    >
      {more > 0 ? "Variants" : "Notes"}
      <ChevronDownIcon className="transition-[rotate] duration-(--dur-responsive) ease-responsive group-aria-expanded/notes:rotate-180" />
    </button>
  );
}

export function Stage(props: StageProps) {
  const preview = useContext(PreviewContext);
  const pageId = useContext(PageIdContext);
  const world = useContext(WorldContext);
  const variants = useContext(VariantsContext);
  const [view, setView] = useState<View>("preview");
  const { title, caption, onReplay, replayLabel = "Replay", size = "md", align = "center", code, children, slot } = inWorldOf(props, world);
  const place = align === "center" ? "place-items-center" : align === "start" ? "place-items-start" : "place-items-end";
  const height = size === "lg" ? "min-h-112" : "min-h-80";
  if (preview === "mosaic") return <MosaicPiece title={title} size={size} place={place} onReplay={onReplay} replayLabel={replayLabel}>{children}</MosaicPiece>;

  /* The lead (slot 0, or a Stage outside a Page) is the page's one stage: no title on screen, its name on the region.
     A later stage is a variant, inside the disclosure, with its title and caption in the open. */
  const lead = !variants || slot === undefined || slot === 0;
  const id = variants && slot !== undefined ? variants.idOf(slot) : undefined;
  const open = variants?.open ?? false;

  const replay = onReplay && (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        setView("preview"); // a replay of something you cannot see would do nothing
        onReplay();
      }}
    >
      {replayLabel}
    </Button>
  );

  const box = (body: ReactNode, padded: boolean) => (
    <div
      data-part={world === "device" ? "plate" : undefined}
      className={
        (world === "device" ? DEVICE_PLATE : "rounded-surface bg-surface-1 shadow-[inset_0_0_0_1px_var(--raised-line,var(--line)),var(--highlight)] in-[[data-material=flat]]:bg-well in-[[data-material=flat]]:shadow-none") +
        " relative col-span-2 row-start-1 grid overflow-visible text-fg " +
        (padded ? "p-4 min-[24rem]:p-8 sm:p-12 " + place + " " : "") +
        height
      }
    >
      {body}
    </div>
  );

  const views = code !== undefined && (
    <TabsList aria-label={`${title} view`}>
      <TabsTrigger value="preview">Preview</TabsTrigger>
      {/* Start fetching the code view as soon as someone reaches for it. */}
      <TabsTrigger value="code" onPointerEnter={() => void loadStageCode()} onFocus={() => void loadStageCode()}>
        Code
      </TabsTrigger>
    </TabsList>
  );

  const panels = (
    <TabsPanels className="grid min-w-0">
      {/* The preview remounts when you come back to it, so a replay always starts clean. */}
      <TabsPanel value="preview" tabIndex={-1} className={"grid p-4 min-[24rem]:p-8 sm:p-12 " + place}>
        {children}
      </TabsPanel>
      <TabsPanel value="code" tabIndex={-1} className="min-w-0">
        <Suspense fallback={<div aria-hidden="true" className="min-h-40" />}>
          {pageId && code ? (
            <StageCode pageId={pageId} name={code} title={title} />
          ) : (
            <p role="alert" className="p-2 text-small text-danger">
              A Stage with a code prop must sit inside a Page.
            </p>
          )}
        </Suspense>
      </TabsPanel>
    </TabsPanels>
  );

  /* The stage, its switch and Replay. With a code view the tabs root wraps the switch and the panels (`contents` keeps
     it out of the grid), and the switch comes first in the DOM, last on screen: after you pick Code with the arrow keys,
     Tab lands in the code, and a screen reader hears the switch, then the demo. */
  const stage =
    code === undefined ? (
      <>
        {box(children, true)}
        {replay && <div className="col-start-2 row-start-2 flex items-center justify-end gap-2">{replay}</div>}
      </>
    ) : (
      <Tabs value={view} onValueChange={(v) => setView(v as View)} variant="segmented" size="sm" className="contents">
        <div className="col-start-2 row-start-2 flex items-center justify-end gap-2">
          {views}
          {replay}
        </div>
        {box(panels, false)}
      </Tabs>
    );

  if (lead) {
    return (
      <section data-arrive="stage" aria-label={title} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
        {stage}
        {variants && (
          <div className="col-start-1 row-start-2 flex min-w-0 items-center">
            <VariantsButton variants={variants} />
          </div>
        )}
        {variants && id && (
          <p id={id} hidden={!open} className="col-span-2 row-start-3 max-w-[65ch] text-small text-fg-subtle">
            {caption}
          </p>
        )}
      </section>
    );
  }

  return (
    <section id={id} hidden={!open} data-arrive="stage" aria-label={title} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
      {open && (
        <>
          {stage}
          <div className="col-start-1 row-start-2 grid max-w-[65ch] content-start gap-1">
            <h2 className="text-small font-title text-fg">{title}</h2>
            <p className="text-small text-fg-subtle">{caption}</p>
          </div>
        </>
      )}
    </section>
  );
}
