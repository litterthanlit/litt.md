/**
 * An airy, Cosmos-style masonry showcase of the best live components across all six galleries (Press, Flat, Device,
 * Plain, Rack, Heat). Each component floats directly on the open page ground with no outer card frame or border, wearing
 * its own world's material, face, color and body, separated by generous whitespace and staggered column offsets so every
 * piece breathes and speaks for itself.
 */
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { MaterialProvider, StillMotion } from "@/motion";
import { useDark } from "./customize-state";
import { PreviewContext, WorldContext } from "./kit";
import { lookAttributes, materialOf, type Material } from "./look";
import { pages, type PageEntry } from "./registry";

type Align = "start" | "center" | "end";

type ShowcaseItem = {
  /** Component page id (src/gallery/pages/*.tsx meta.id). */
  id: string;
  /** The gallery/world this piece showcases. */
  world: Material;
  /** Max width cap so compact objects stay naturally scaled inside their wide column. */
  width: string;
  /** Gentle horizontal drift inside the desktop column for an organic Cosmos-board rhythm. */
  align: Align;
};

/**
 * Twelve signature pieces — two from each of the six galleries — distributed across two wide, staggered columns on
 * desktop (single column on phone). No two adjacent pieces share a world, every component sits unclipped at its real
 * size, and none carries an accent fill or an ink card (keeping R6 intact beside the hero's Get started).
 */
const SHOWCASE: readonly ShowcaseItem[] = [
  // Pair 1: Device (left) & Flat (right, staggered down)
  { id: "tape-progress", world: "device", width: "w-full max-w-sm", align: "start" },
  { id: "poll", world: "flat", width: "w-full max-w-sm", align: "center" },
  // Pair 2: Rack (left) & Press (right)
  { id: "clip-launcher", world: "rack", width: "w-full max-w-lg", align: "center" },
  { id: "deploy-status", world: "press", width: "w-full max-w-md", align: "end" },
  // Pair 3: Heat (left) & Plain (right)
  { id: "pursuit-meter", world: "heat", width: "w-full max-w-sm", align: "start" },
  { id: "segmented", world: "plain", width: "w-full max-w-[16rem]", align: "center" },
  // Pair 4: Flat (left) & Device (right)
  { id: "kudos", world: "flat", width: "w-fit max-w-full", align: "end" },
  { id: "agent-indicator", world: "device", width: "w-full max-w-sm", align: "start" },
  // Pair 5: Press (left) & Rack (right)
  { id: "env-switch", world: "press", width: "w-full max-w-md", align: "start" },
  { id: "device-rack", world: "rack", width: "w-full max-w-md", align: "end" },
  // Pair 6: Plain (left) & Heat (right)
  { id: "checkbox", world: "plain", width: "w-full max-w-xs", align: "center" },
  { id: "lap-timer", world: "heat", width: "w-full max-w-sm", align: "start" },
];

const ALIGN_CLASS: Record<Align, string> = {
  start: "md:justify-self-start",
  center: "md:justify-self-center",
  end: "md:justify-self-end",
};

const MD = "(min-width: 768px)";

function readColumns(): number {
  if (typeof window === "undefined") return 2;
  return window.matchMedia(MD).matches ? 2 : 1;
}

/** Explicit column count (1 / 2) so interactive height changes stay in their own column and never jump sideways. */
function useColumns(): number {
  return useSyncExternalStore(
    (notify) => {
      const md = window.matchMedia(MD);
      md.addEventListener("change", notify);
      return () => md.removeEventListener("change", notify);
    },
    readColumns,
    () => 2,
  );
}

function CosmosCard({ item, page, dark }: { item: ShowcaseItem; page: PageEntry; dark: boolean }) {
  const [settled, setSettled] = useState(false);
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    let next = 0;
    const first = requestAnimationFrame(() => (next = requestAnimationFrame(() => setSettled(true))));
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(next);
    };
  }, []);

  const world = materialOf(item.world);
  const wake = () => setAwake(true);

  return (
    <figure
      data-cosmos-item={`${item.world}/${item.id}`}
      data-arrive="stage"
      onPointerEnter={(e) => e.pointerType !== "touch" && wake()}
      onPointerDown={(e) => !(e.target as Element).closest("figcaption") && wake()}
      onFocus={(e) => !e.target.closest("figcaption") && wake()}
      className={"group/cosmos m-0 grid min-w-0 gap-4 " + item.width + " " + ALIGN_CLASS[item.align]}
    >
      {/* Floating directly on the open canvas — no outer box, wearing only this world's tokens, face and body. */}
      <div
        {...lookAttributes({ accent: "world", material: item.world }, dark)}
        data-cosmos-world={item.world}
        inert={!settled}
        className="min-w-0 font-sans text-fg"
      >
        <MaterialProvider material={item.world}>
          <WorldContext.Provider value={item.world}>
            <StillMotion active={!awake}>
              <div className="grid w-full min-w-0 [&>*]:min-w-0">
                <PreviewContext.Provider value="tile">
                  <Suspense fallback={<div aria-hidden="true" className="h-32 w-full" />}>
                    <page.Component />
                  </Suspense>
                </PreviewContext.Provider>
              </div>
            </StillMotion>
          </WorldContext.Provider>
        </MaterialProvider>
      </div>
      <figcaption className="flex min-w-0 items-center justify-between gap-4">
        <h3 className="min-w-0 text-small font-normal">
          <a
            href={`#${item.world}/${item.id}`}
            className={
              "litt-target relative inline-flex h-7 items-center rounded-control text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
              "transition-colors duration-(--dur-instant) ease-litt hover:text-fg group-hover/cosmos:text-fg pointer-coarse:h-control-md " +
              "focus-visible:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            }
          >
            {page.title}
          </a>
        </h3>
        <a
          href={`#${item.world}`}
          aria-label={`Open ${world.name} gallery`}
          className={
            "litt-target relative inline-flex h-7 shrink-0 items-center rounded-control text-caption font-normal text-fg-subtle select-none [-webkit-tap-highlight-color:transparent] " +
            "transition-colors duration-(--dur-instant) ease-litt hover:text-fg pointer-coarse:h-control-md " +
            "focus-visible:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          }
        >
          {world.name}
        </a>
      </figcaption>
    </figure>
  );
}

/** Airy Cosmos-style staggered masonry showcase of floating live components from all six galleries. */
export function CosmosGrid() {
  const dark = useDark();
  const colCount = useColumns();
  const entries = SHOWCASE.flatMap((item) => {
    const page = pages.find((p) => p.id === item.id);
    return page ? [{ item, page }] : [];
  });

  const columns: { item: ShowcaseItem; page: PageEntry }[][] = Array.from({ length: colCount }, () => []);
  entries.forEach((entry, index) => {
    columns[index % colCount]!.push(entry);
  });

  return (
    <section aria-labelledby="cosmos-showcase-title" data-cosmos-grid className="grid min-w-0">
      <h2 id="cosmos-showcase-title" className="sr-only">
        Best of each gallery
      </h2>
      <div className="grid min-w-0 grid-cols-1 items-start gap-x-12 gap-y-20 md:grid-cols-2 md:gap-x-16 lg:gap-x-24">
        {columns.map((col, colIndex) => (
          <div
            key={colIndex}
            className={"grid min-w-0 content-start gap-y-20 md:gap-y-28 lg:gap-y-32 " + (colIndex === 1 ? "md:pt-24 lg:pt-32" : "")}
          >
            {col.map(({ item, page }) => (
              <CosmosCard key={`${item.world}-${item.id}`} item={item} page={page} dark={dark} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
