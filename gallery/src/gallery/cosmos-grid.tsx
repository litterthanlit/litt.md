/**
 * A Cosmos-style masonry showcase of the best live components across every world (Press, Flat, Device, Plain, Rack,
 * Heat). Each item wears its own world's material, face, color and body, stands at its natural height so columns
 * stagger organically, and stays still until reached for (StillMotion). No explanatory chrome: the components speak for
 * themselves, with a quiet component title and world link tucked beneath each piece.
 */
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { MaterialProvider, StillMotion } from "@/motion";
import { useDark } from "./customize-state";
import { DEVICE_PLATE, PreviewContext, WorldContext } from "./kit";
import { lookAttributes, materialOf, type Material } from "./look";
import { pages, type PageEntry } from "./registry";

type ShowcaseItem = {
  /** Component page id (src/gallery/pages/*.tsx meta.id). */
  id: string;
  /** The gallery/world this piece showcases. */
  world: Material;
};

/**
 * Three signature pieces from each of the six worlds, interleaved so the opening six cards introduce every gallery once
 * (Device, Rack, Heat, then Press, Flat, Plain), no column stacks two of the same world back to back, intermediate rows
 * stagger organically in Cosmos rhythm, and the three desktop columns finish balanced at the foot. None carries an
 * accent fill or an ink card, keeping R6 ("one accent fill per view", owned by the hero's Get started) intact.
 */
const SHOWCASE: readonly ShowcaseItem[] = [
  // Row 1: Device, Rack, Heat
  { id: "tape-progress", world: "device" },
  { id: "clip-launcher", world: "rack" },
  { id: "pursuit-meter", world: "heat" },
  // Row 2: Press, Flat, Plain (all 6 galleries visible in the first 6 cards)
  { id: "deploy-status", world: "press" },
  { id: "poll", world: "flat" },
  { id: "segmented", world: "plain" },
  // Row 3: Flat, Heat, Device
  { id: "kudos", world: "flat" },
  { id: "tune-menu", world: "heat" },
  { id: "agent-indicator", world: "device" },
  // Row 4: Rack, Device, Press
  { id: "device-rack", world: "rack" },
  { id: "seven-segment", world: "device" },
  { id: "release-rail", world: "press" },
  // Row 5: Plain, Flat, Rack
  { id: "tabs", world: "plain" },
  { id: "streak", world: "flat" },
  { id: "step-sequencer", world: "rack" },
  // Row 6: Heat, Press, Plain
  { id: "lap-timer", world: "heat" },
  { id: "env-switch", world: "press" },
  { id: "checkbox", world: "plain" },
];

const SURFACE: Record<Material, string> = {
  press: "rounded-surface bg-well outline-1 -outline-offset-1 outline-line px-5 py-7 sm:px-6 sm:py-8",
  flat: "flat-sheet rounded-surface px-5 py-7 sm:px-6 sm:py-8",
  device: DEVICE_PLATE + " px-5 py-7 sm:px-6 sm:py-8",
  plain: "rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line-control px-5 py-7 sm:px-6 sm:py-8",
  rack: "rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line px-4 py-6 sm:px-5 sm:py-7",
  heat: "rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line px-5 py-7 sm:px-6 sm:py-8",
};

const MD = "(min-width: 640px)";
const LG = "(min-width: 1024px)";

function readColumns(): number {
  if (typeof window === "undefined") return 3;
  if (window.matchMedia(LG).matches) return 3;
  if (window.matchMedia(MD).matches) return 2;
  return 1;
}

/** Explicit column count (1 / 2 / 3) so interactive height changes stay in their own column and never jump sideways. */
function useColumns(): number {
  return useSyncExternalStore(
    (notify) => {
      const md = window.matchMedia(MD);
      const lg = window.matchMedia(LG);
      md.addEventListener("change", notify);
      lg.addEventListener("change", notify);
      return () => {
        md.removeEventListener("change", notify);
        lg.removeEventListener("change", notify);
      };
    },
    readColumns,
    () => 3,
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
      className="group/cosmos m-0 grid min-w-0 gap-2"
    >
      {/* Each piece sets its own world's tokens, face and React body so all six galleries stand side by side live. */}
      <div
        {...lookAttributes({ accent: "world", material: item.world }, dark)}
        data-cosmos-world={item.world}
        className="min-w-0 font-sans text-fg"
      >
        <MaterialProvider material={item.world}>
          <WorldContext.Provider value={item.world}>
            <div
              inert={!settled}
              data-part={item.world === "device" ? "plate" : item.world === "flat" ? "paper" : undefined}
              className={"grid min-w-0 place-items-center overflow-x-clip " + SURFACE[item.world]}
            >
              <StillMotion active={!awake}>
                <div className="grid w-full min-w-0 place-items-center [&>*]:min-w-0">
                  <PreviewContext.Provider value="tile">
                    <Suspense fallback={<div aria-hidden="true" className="h-32 w-full" />}>
                      <page.Component />
                    </Suspense>
                  </PreviewContext.Provider>
                </div>
              </StillMotion>
            </div>
          </WorldContext.Provider>
        </MaterialProvider>
      </div>
      <figcaption className="flex min-w-0 items-center justify-between gap-4 px-1">
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

/** Cosmos-style staggered masonry showcase of the best live components from all six galleries. */
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
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="grid min-w-0 content-start gap-7">
            {col.map(({ item, page }) => (
              <CosmosCard key={`${item.world}-${item.id}`} item={item} page={page} dark={dark} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
