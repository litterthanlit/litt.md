/**
 * Gallery kit: the building blocks every page uses. Pages are airy (Nick's
 * call): one idea per stage, generous stages. A page shows before it explains:
 * the title and a one-line lede, then the first demo; each stage's caption folds
 * behind "How it works", and the full summary waits under the demos.
 * Text spacing follows foundations.md (Type, Text spacing): stages sit 48px apart,
 * the page title 16px above its summary, and a stage's title 4px above its caption.
 */
import { Children, cloneElement, createContext, Fragment, isValidElement, lazy, Suspense, useContext, useId, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { DeviceProvider, StillMotion, useFun, type Tier } from "@/motion";
import { Button } from "@/components/button";
import { Framed } from "@/components/framed";
import { ChevronDownIcon, SparkleIcon } from "@/components/icons";
import type { Material } from "./look";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Tag } from "@/components/tag";

/** The sidebar's groups, in the order they appear. */
/** Blocks come last: whole screens built from the components in the groups above them. */
/** Worlds first: the three materials as pages you arrive on (proposals/worlds.md). The nav and the menu draw that group as the way in, not as a group of components. */
export const PAGE_GROUPS = ["Worlds", "Controls", "Overlays", "Layout", "Data", "Agents", "Commerce", "Blocks"] as const;
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

const TIER_LABEL: Record<Tier, string> = { instant: "Instant", responsive: "Responsive", expressive: "Expressive" };

export function TierChip({ tier }: { tier: Tier }) {
  return (
    <Tag>{TIER_LABEL[tier]}</Tag>
  );
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
function firstDemo(children: ReactNode): ReactNode | null {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    if (child.type === Stage) return (child as ReactElement<StageProps>).props.children;
    if (child.props.children === undefined) continue;
    const found = firstDemo(child.props.children);
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
  children: ReactNode;
}) {
  const preview = useContext(PreviewContext);
  if (preview === "mosaic") return <>{onlyStages(children)}</>;
  if (preview === "tile" && tile !== undefined) return <>{tile}</>;
  if (preview) return <>{firstDemo(children)}</>;
  return (
    <PageIdContext.Provider value={meta.id}>
      <article aria-labelledby={`page-${meta.id}`} className="grid gap-12 pb-24">
        <header data-arrive="head" className="grid gap-6">
          <PageTitle id={`page-${meta.id}`} title={meta.title} lede={meta.lede} />
          <FunHint text={meta.fun} />
          {/* The tiers and the docs actions share one row, so the first demo comes up sooner. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {/* A page with no tiers (nothing moves) leaves no empty group, so the actions start at the edge. */}
            {meta.tiers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {meta.tiers.map((t) => (
                  <TierChip key={t} tier={t} />
                ))}
              </div>
            )}
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
        </header>
        {children}
        {study && (
          <Suspense fallback={<div aria-hidden="true" className="min-h-[40svh]" />}>
            <StudySections meta={meta} docs={docs} study={study} />
          </Suspense>
        )}
        <section aria-labelledby={`about-${meta.id}`} className="grid content-start gap-4">
          <h2 id={`about-${meta.id}`} className="-mb-3 text-h3 text-fg">About</h2>
          <p className="max-w-(--measure) text-reading text-fg-muted">{meta.summary}</p>
        </section>
        {docs && (
          <Suspense fallback={<div aria-hidden="true" className="min-h-[60svh]" />}>
            <DocsSections docs={docs} />
          </Suspense>
        )}
      </article>
    </PageIdContext.Provider>
  );
}

/**
 * A page's title and lede as one sentence in two inks, at the title size: the name in
 * --fg at the title weight, then the lede in the grey at the text weight (R8). The h1
 * stays the name alone, so the page's landmark is still called "Button".
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
  children: ReactNode;
};

/* Try it reads the generated docs data, so it loads with the docs layer, not with every page. */
const LazyTryIt = lazy(() => import("./docs/try-it").then((m) => ({ default: m.TryIt })));

/**
 * The component beside controls for its props, and the JSX for what you set (docs/try-it.tsx). Put it after a
 * page's stages. The controls come from the prop types in the generated docs, so name the export (`of`), pass the
 * component, and pass the props it always needs (`props`), such as its children or a label.
 */
export function TryIt(props: import("./docs/try-it").TryItProps) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-80" />}>
      <LazyTryIt {...props} />
    </Suspense>
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

export function Stage({ title, caption, tier, onReplay, replayLabel = "Replay", size = "md", align = "center", code, children }: StageProps) {
  const preview = useContext(PreviewContext);
  const pageId = useContext(PageIdContext);
  const [view, setView] = useState<View>("preview");
  const [notes, setNotes] = useState(false);
  const notesId = useId();
  const place = align === "center" ? "place-items-center" : align === "start" ? "place-items-start" : "place-items-end";
  const height = size === "lg" ? "min-h-112" : "min-h-80";
  if (preview === "mosaic") return <MosaicPiece title={title} size={size} place={place} onReplay={onReplay} replayLabel={replayLabel}>{children}</MosaicPiece>;

  /* The caption folds behind "How it works", so the demo speaks first. The chevron turns half a
     turn on the responsive tier, as in the Accordion; the text itself appears at once. */
  const heading = (
    <div className="grid max-w-[60ch] gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-body font-title text-fg">{title}</h2>
        {tier && <TierChip tier={tier} />}
        <button
          type="button"
          aria-expanded={notes}
          aria-controls={notesId}
          onClick={() => setNotes((n) => !n)}
          className="group/notes litt-target relative -mx-2 flex h-control-sm items-center gap-1 rounded-control px-2 text-small text-fg-subtle in-[[data-material=flat]]:mx-0 in-[[data-material=flat]]:bg-block in-[[data-material=flat]]:px-3 in-[[data-material=flat]]:text-fg-muted select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          How it works
          <ChevronDownIcon className="transition-[rotate] duration-(--dur-responsive) ease-responsive group-aria-expanded/notes:rotate-180" />
        </button>
      </div>
      <p id={notesId} hidden={!notes} className="text-small text-fg-subtle">
        {caption}
      </p>
    </div>
  );

  if (code === undefined) {
    return (
      <section data-arrive="stage" className="grid gap-6" aria-label={title}>
        <div className={"litt-raised relative grid overflow-visible rounded-surface p-4 min-[24rem]:p-8 sm:p-12 in-[[data-material=flat]]:bg-well in-[[data-material=flat]]:shadow-none " + place + " " + height}>{children}</div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          {heading}
          {onReplay && (
            <Button size="sm" variant="secondary" onClick={onReplay}>
              {replayLabel}
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section data-arrive="stage" className="grid gap-6" aria-label={title}>
      {/* The tabs root wraps both the box and the caption row, so the switch can sit in the
          caption row while its panels sit in the box. `contents` keeps it out of the layout.
          The caption row comes first in the DOM and last on screen (order), so the tab list
          is followed by its panel: after you pick Code with the arrow keys, Tab lands in the
          code, and a screen reader hears the title, the switch, then the demo. */}
      <Tabs value={view} onValueChange={(v) => setView(v as View)} variant="segmented" size="sm" className="contents">
        <div className="order-2 flex flex-wrap items-start justify-between gap-4">
          {heading}
          <div className="flex items-center gap-3">
            <TabsList aria-label={`${title} view`}>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              {/* Start fetching the code view as soon as someone reaches for it. */}
              <TabsTrigger value="code" onPointerEnter={() => void loadStageCode()} onFocus={() => void loadStageCode()}>
                Code
              </TabsTrigger>
            </TabsList>
            {onReplay && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setView("preview"); // a replay of something you cannot see would do nothing
                  onReplay();
                }}
              >
                {replayLabel}
              </Button>
            )}
          </div>
        </div>
        <div className={"litt-raised relative order-1 grid overflow-visible rounded-surface in-[[data-material=flat]]:bg-well in-[[data-material=flat]]:shadow-none " + height}>
          <TabsPanels className="grid min-w-0">
            {/* The preview remounts when you come back to it, so a replay always starts clean. */}
            <TabsPanel value="preview" tabIndex={-1} className={"grid p-4 min-[24rem]:p-8 sm:p-12 " + place}>
              {children}
            </TabsPanel>
            <TabsPanel value="code" tabIndex={-1} className="min-w-0">
              <Suspense fallback={<div aria-hidden="true" className="min-h-40" />}>
                {pageId ? (
                  <StageCode pageId={pageId} name={code} title={title} />
                ) : (
                  <p role="alert" className="p-2 text-small text-danger">
                    A Stage with a code prop must sit inside a Page.
                  </p>
                )}
              </Suspense>
            </TabsPanel>
          </TabsPanels>
        </div>
      </Tabs>
    </section>
  );
}
