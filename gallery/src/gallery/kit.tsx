/**
 * Gallery kit: the building blocks every page uses. Pages are airy (Nick's
 * call): one idea per stage, generous stages, captions that say what moves.
 * Text spacing follows foundations.md (Type, Text spacing): stages sit 48px apart,
 * the page title 16px above its summary, and a stage's title 4px above its caption.
 */
import { createContext, lazy, Suspense, useContext, useState, type ReactNode } from "react";
import type { Tier } from "@/motion";
import { Button } from "@/components/button";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Tag } from "@/components/tag";

/** The sidebar's groups, in the order they appear. */
export const PAGE_GROUPS = ["Controls", "Overlays", "Layout", "Data", "Agents"] as const;
export type PageGroup = (typeof PAGE_GROUPS)[number];

export type PageMeta = {
  /** URL hash and nav id: letters, digits and dashes only. */
  id: string;
  title: string;
  /** Sidebar order. 0 is the overview. */
  order: number;
  /** The sidebar group. Overview and Playground have none, so they sit above and below the groups. */
  group?: PageGroup;
  /** One sentence: what the component is and what its motion does. */
  summary: string;
  tiers: Tier[];
  /**
   * The page may override the locked tokens with the motion dial. Every page
   * leaves this off except the Playground; the dial's CSS variables exist only
   * while a page with `tune` is open.
   */
  tune?: boolean;
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

/** Which page a Stage sits in, so its Code tab can find the page file. */
const PageIdContext = createContext<string | null>(null);

export function Page({ meta, docs, children }: { meta: PageMeta; docs?: PageDocs; children: ReactNode }) {
  return (
    <PageIdContext.Provider value={meta.id}>
      <article aria-labelledby={`page-${meta.id}`} className="grid gap-12 pb-24">
        <header className="grid gap-4">
          <h1 id={`page-${meta.id}`} className="text-h1 text-fg text-balance">
            {meta.title}
          </h1>
          <p className="max-w-[56ch] text-reading text-fg-muted">{meta.summary}</p>
          <div className="flex flex-wrap gap-2">
            {meta.tiers.map((t) => (
              <TierChip key={t} tier={t} />
            ))}
          </div>
          {docs && (
            <div className="pt-4">
              {/* Holds the row's height while the docs chunk loads, so nothing below jumps. */}
              <Suspense fallback={<div aria-hidden="true" className="h-control-sm" />}>
                <DocsActions meta={meta} docs={docs} />
              </Suspense>
            </div>
          )}
        </header>
        {children}
        {docs && (
          <Suspense fallback={<div aria-hidden="true" className="min-h-[60svh]" />}>
            <DocsSections docs={docs} />
          </Suspense>
        )}
      </article>
    </PageIdContext.Provider>
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

const loadStageCode = () => import("./docs/stage-code");
const StageCode = lazy(loadStageCode);

type View = "preview" | "code";

export function Stage({ title, caption, tier, onReplay, replayLabel = "Replay", size = "md", align = "center", code, children }: StageProps) {
  const pageId = useContext(PageIdContext);
  const [view, setView] = useState<View>("preview");
  const place = align === "center" ? "place-items-center" : align === "start" ? "place-items-start" : "place-items-end";
  const height = size === "lg" ? "min-h-112" : "min-h-80";

  const heading = (
    <div className="grid max-w-[60ch] gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-body font-title text-fg">{title}</h2>
        {tier && <TierChip tier={tier} />}
      </div>
      <p className="text-small text-fg-subtle">{caption}</p>
    </div>
  );

  if (code === undefined) {
    return (
      <section className="grid gap-6" aria-label={title}>
        <div className={"litt-raised relative grid overflow-visible rounded-surface p-8 sm:p-12 " + place + " " + height}>{children}</div>
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
    <section className="grid gap-6" aria-label={title}>
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
        <div className={"litt-raised relative order-1 grid overflow-visible rounded-surface " + height}>
          <TabsPanels className="grid min-w-0">
            {/* The preview remounts when you come back to it, so a replay always starts clean. */}
            <TabsPanel value="preview" tabIndex={-1} className={"grid p-8 sm:p-12 " + place}>
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
