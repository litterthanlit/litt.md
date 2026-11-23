/**
 * One component as a live tile, as the overview's wall and a world's gallery view (#<world>/components) draw it: the
 * real component at its real size on the well, its name in the corner linking to its page.
 *
 * - It mounts as it nears the screen and stays out of reach for two frames, so a demo that moves focus as it mounts
 *   cannot pull the page. It is held still (StillMotion) until the pointer, a press or focus reaches it, and wakes in
 *   place: nothing remounts and nothing replays.
 * - With `onOpen` (the overview's mosaic), an expand button beside the name opens it, seen only by the keyboard, and so
 *   does a click on the tile's empty ground (data-open-zone, never the component itself). Without it, neither.
 * - The name is a heading (h2 on the wall, h3 under a group's h2), so the headings inside a component sit under it.
 */
import { Suspense, useContext, useEffect, useRef, useState } from "react";
import { StillMotion } from "@/motion";
import { Button } from "@/components/button";
import { ExpandIcon } from "@/components/icons";
import { DEVICE_PLATE, PreviewContext, WorldContext } from "./kit";
import type { PageEntry } from "./registry";

/** Pages whose tile is two rows tall beside two short ones: their component needs the height. */
export const TALL = new Set(["plan", "app-shell", "list", "action-bar", "timeline", "message", "rule-builder"]);

/**
 * Under Flat a tile is the grey ground itself, as in the Flat studies (.flat-stage in app.css: the ground, a step darker
 * under a hovering pointer), so paper stays white paper and an object looks as it does on its page. Its name sits under
 * its object as a caption, the two centred together, so the name belongs to its object by more than position. Every
 * other world keeps its tile as it was.
 */
const FLAT_STAGE = "flat-stage in-[[data-material=flat]]:min-h-72 in-[[data-material=flat]]:grid-rows-[auto_auto] in-[[data-material=flat]]:content-center";
/** The object's room: under Flat it gives its height to the stage, so the name follows the object. */
const FLAT_ROOM = "min-h-80 md:min-h-96 in-[[data-material=flat]]:min-h-0 md:in-[[data-material=flat]]:min-h-0 in-[[data-material=flat]]:pb-2 sm:in-[[data-material=flat]]:pb-3";
/** The name: under Flat a caption centred under its object, across both columns, the expand button laid over its end. */
const FLAT_NAME = "in-[[data-material=flat]]:col-span-2 in-[[data-material=flat]]:col-start-1 in-[[data-material=flat]]:row-start-2 in-[[data-material=flat]]:justify-center in-[[data-material=flat]]:pb-5";

/** True once the element has come within a screen of the viewport, and stays true. */
export function useNear<T extends HTMLElement>(ref: React.RefObject<T | null>): boolean {
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

export function WallTile({ page, href, onOpen, onFollow, heading: Heading = "h2" }: {
  page: PageEntry;
  /** Where the tile's name goes: the page, in its world. */
  href: string;
  /** Opens the tile's mosaic from the tile and the button that opened it. Absent, the tile has no expand button. */
  onOpen?: (tile: HTMLElement, button: HTMLElement | null) => void;
  /** Called with the tile as its name is followed, before the page changes. */
  onFollow?: (tile: HTMLElement) => void;
  heading?: "h2" | "h3";
}) {
  const button = useRef<HTMLButtonElement>(null);
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
  const zone = onOpen ? "" : undefined;
  const world = useContext(WorldContext);
  const device = world === "device";
  return (
    <div
      ref={ref}
      data-tile={page.id}
      data-arrive="stage"
      /* A finger arrives with its press, so a touch, a press or focus wakes the tile only on the component, never on its
         name or open button: waking can change a component's height (a plan at its first step), which would move them
         under the tap before its click lands. */
      onPointerEnter={(e) => e.pointerType !== "touch" && wake()}
      onPointerDown={(e) => !(e.target as Element).closest("[data-tile-foot]") && wake()}
      onFocus={(e) => !e.target.closest("[data-tile-foot]") && wake()}
      onClick={onOpen && ((e) => (e.target as HTMLElement).hasAttribute("data-open-zone") && ref.current && onOpen(ref.current, button.current))}
      data-open-zone={zone}
      data-part={device ? "plate" : world === "flat" ? "paper" : undefined}
      className={"group/tile grid min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_auto] " + (device ? DEVICE_PLATE : "rounded-surface bg-well " + FLAT_STAGE)}
    >
      <div inert={!settled} data-open-zone={zone} className={"col-span-2 grid min-w-0 place-items-center p-6 sm:p-10 " + FLAT_ROOM}>
        {near && (
          <StillMotion active={!awake}>
            <div data-open-zone={zone} className="grid w-full min-w-0 place-items-center [&>*]:min-w-0">
              <PageTile page={page} />
            </div>
          </StillMotion>
        )}
      </div>
      <Heading data-tile-foot className={"flex min-w-0 px-4 pb-3 text-small font-normal " + FLAT_NAME}>
        <a
          href={href}
          onClick={onFollow && (() => ref.current && onFollow(ref.current))}
          className={
            "-mx-2 flex h-control-sm items-center rounded-control px-2 text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
            "transition-colors duration-(--dur-instant) ease-litt hover:text-fg group-hover/tile:text-fg pointer-coarse:h-control-md " +
            "focus-visible:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          }
        >
          {page.title}
        </a>
      </Heading>
      {onOpen && (
        <div data-tile-foot className="flex items-start pr-2 pb-2 in-[[data-material=flat]]:col-start-2 in-[[data-material=flat]]:row-start-2">
          <Button
            ref={button}
            iconOnly
            variant="ghost"
            size="sm"
            aria-haspopup="dialog"
            aria-label={`Open every ${page.title} demo here`}
            onClick={() => ref.current && onOpen(ref.current, button.current)}
            /* Seen only by the keyboard: a pointer opens the mosaic from the tile's ground. */
            className="text-fg-subtle opacity-0 focus-visible:opacity-100"
          >
            <ExpandIcon />
          </Button>
        </div>
      )}
    </div>
  );
}
