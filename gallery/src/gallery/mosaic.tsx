/**
 * The overview's mosaic: a tile opens into every demo on its page, dealt out from where the tile sat, and gathers back
 * into it when you close it. After Dennis Dang's s-p.studio (2026-11-04, Nick: "this is what I want littmd to feel
 * like"), and the Deal prototype Nick picked over Unfold.
 *
 * - The pieces are the page's own stages, live (PreviewContext "mosaic" in kit.tsx). Each piece is a figure that holds
 *   its place in the grid and a face inside it that moves, and each is held still until reached for, as a tile is.
 * - The choreography is deal() and gather() (@/motion/deal), the building block page arrivals use too.
 * - Open is the view's one expressive moment. The faces start as a small deck on the tile and spread to their places
 *   on the expressive spring, nearest first, --stagger apart, arriving out of soft focus (a 4px blur on the
 *   responsive spring, R4). Behind them the page steps back on the responsive spring: it fades, shrinks a little and
 *   goes soft, so the mosaic stands alone on the canvas.
 * - Close (the close button, Esc, a click on empty space, or a drag down) gathers the faces back onto the tile,
 *   farthest first, on the expressive exit (an ease-out, never a bounce), from wherever they are, mid-deal or
 *   mid-drag, while the page comes back into focus. Focus returns to the tile's open button.
 * - A hand moves it (useDismissDrag): the mosaic follows a drag down 1:1 and the page sharpens behind it as it goes.
 *   Past --dismiss-distance, or faster than --dismiss-velocity, it closes; short of that it springs back. A mouse may
 *   drag from the title bar or any empty space, a finger from the title bar, since a finger on the mosaic scrolls
 *   it. Never from a piece: its own gestures own it.
 * - Reduced motion: it appears and goes at once. Radix Dialog is the accessibility layer, as in Dialog.
 */
import { Suspense, useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent, type PointerEvent } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { animate, motion } from "motion/react";
import { useExit } from "@/motion";
import { deal, gather, useDealMotion } from "@/motion/deal";
import { useDismissDrag } from "@/motion/drag";
import { Button } from "@/components/button";
import { ArrowRightIcon, XIcon } from "@/components/icons";
import { arriveFrom, boxesOf } from "./arrival";
import { PreviewContext } from "./kit";
import type { PageEntry } from "./registry";

/** The faces of the pieces, in the grid's order (the page's stage order). */
const facesIn = (grid: HTMLElement) => [...grid.querySelectorAll<HTMLElement>("[data-piece-face]")];

type MosaicProps = {
  page: PageEntry;
  /** The tile it opens from and gathers back into. */
  tile: HTMLElement;
  /** Where focus goes once it has closed: the tile's open button. */
  returnTo: HTMLElement | null;
  /** Called when the close has finished, to unmount it. */
  onClosed: () => void;
};

/* Which mosaic is open lives outside React's tree of tiles, so opening and closing one re-renders only the mosaic,
   never the wall of live tiles behind it. */
type Opened = Omit<MosaicProps, "onClosed">;
let opened: Opened | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));

/**
 * Presses `tile` in at once (--press-scale, a compositor animation), so a tap answers on the next frame even when
 * what it opens takes a while to mount. Whatever takes over from the tile lets go of it with releaseTile().
 */
export function pressTile(tile: HTMLElement) {
  /* The press token on the instant tier, as a button presses; under reduced motion the scale is 1 and nothing moves. */
  const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const scale = parseFloat(token("--press-scale")) || 1;
  if (scale === 1) return;
  tile.animate([{ transform: "none" }, { transform: `scale(${scale})` }], {
    duration: parseFloat(token("--dur-instant")) || 0,
    easing: token("--ease-out"),
    fill: "forwards",
    id: "litt-press",
  });
}
export const releaseTile = (tile: HTMLElement) => tile.getAnimations().forEach((a) => a.id === "litt-press" && a.cancel());

/**
 * Opens a tile's mosaic. One at a time: a second open while one is showing is ignored. The tile presses in first and
 * the mosaic mounts a frame later, so the press is on screen before its demos start mounting.
 */
export function openMosaic(next: Opened) {
  if (opened) return;
  opened = next;
  pressTile(next.tile);
  requestAnimationFrame(() => requestAnimationFrame(emit));
}

/** Where the open mosaic renders: put one beside the wall, inside its Toaster. */
export function MosaicHost() {
  const current = useSyncExternalStore(
    subscribe,
    () => opened,
    () => null,
  );
  if (!current) return null;
  return (
    <Mosaic
      key={current.page.id}
      {...current}
      onClosed={() => {
        opened = null;
        emit();
      }}
    />
  );
}

/** Open while mounted; it calls onClosed when its close has played. */
export function Mosaic(props: MosaicProps) {
  return (
    <RadixDialog.Root open modal>
      <RadixDialog.Portal>
        <Layer {...props} />
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* Inside the portal, so its layout effects run once the pieces are in the document. */
function Layer({ page, tile, returnTo, onClosed }: MosaicProps) {
  const m = useDealMotion();
  /* The drag's offset is a MotionValue (useDismissDrag), so its way back is a Motion tween on the exit token. */
  const exitTween = useExit("expressive");

  const grid = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const phase = useRef<"opening" | "open" | "closing">("opening");
  const order = useRef<HTMLElement[]>([]);
  /* No state changes while it moves: a render here re-renders every live demo in it. The count is written straight
     into the title, and the drag stays on (a close already in progress ignores it). */
  const count = useRef<HTMLSpanElement>(null);

  /* Behind the mosaic, the canvas fades in over the page: one screen-sized layer, so it costs nothing per frame. */
  const scrim = useRef<HTMLDivElement>(null);

  const drag = useDismissDrag({ direction: "down", onDismiss: () => close() });

  /* While the mosaic is open, a drag decides how much of the page shows through: all of it at a screen's height. */
  useLayoutEffect(
    () =>
      drag.offset.on("change", (y) => {
        if (phase.current !== "open" || !scrim.current) return;
        scrim.current.style.opacity = String(1 - Math.min(Math.max(y / innerHeight, 0) * 1.8, 1));
      }),
    [drag.offset],
  );

  /* Deal the pieces out of the tile, while the page goes behind the canvas. */
  useLayoutEffect(() => {
    releaseTile(tile);
    const faces = facesIn(grid.current!);
    count.current!.textContent = faces.length === 1 ? "1 demo" : `${faces.length} demos`;
    /* A demo wider than its column takes both (it is laid out for a page's full column), before anything is measured. */
    for (const face of faces) if (face.scrollWidth > face.clientWidth + 1) face.parentElement!.dataset.wide = "";
    /* The figure is the place: the face in it is what moves. */
    const dealt = deal(faces, { deck: tile.getBoundingClientRect() }, m, { places: faces.map((f) => f.parentElement!.getBoundingClientRect()) });
    order.current = dealt.order;
    const shade = scrim.current!;
    shade.style.opacity = "1";
    if (m.reduced) {
      phase.current = "open";
      return;
    }
    /* Each ends where its inline style already is, so nothing has to be written when it settles. */
    const runs = [
      shade.animate([{ opacity: 0 }, { opacity: 1 }], { ...m.settle, fill: "backwards" }),
      head.current!.animate(
        [
          { opacity: 0, transform: `translateY(${m.travel / 2}px)` },
          { opacity: 1, transform: "none" },
        ],
        {
          ...m.settle,
          delay: m.stagger * 2,
          fill: "backwards",
        },
      ),
    ];
    void Promise.all([dealt.finished, ...runs.map((r) => r.finished)]).then(() => {
      if (phase.current === "opening") phase.current = "open";
    });
    // Once, on open: the deal reads where the tile is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    onClosed();
    /* After Radix has handed focus back to whatever it saved, put it on the tile's own open button. */
    requestAnimationFrame(() => returnTo?.isConnected && returnTo.focus({ preventScroll: true }));
  }

  /* Gather the pieces back into the tile, from wherever each is drawn now, while the page comes back. */
  function close() {
    if (phase.current === "closing") return;
    phase.current = "closing";
    if (m.reduced) return finish();
    const pulled = drag.offset.get();
    const shade = scrim.current!;
    const bar = head.current!;
    /* The drag's own spring-back may take the offset over, so its way back to 0 is not waited on. */
    animate(drag.offset, 0, exitTween);
    const runs: Promise<unknown>[] = [
      shade.animate([{ opacity: getComputedStyle(shade).opacity }, { opacity: 0 }], { ...m.settle, delay: m.exit.duration / 4, fill: "forwards" }).finished,
      bar.animate([{ opacity: getComputedStyle(bar).opacity }, { opacity: 0 }], { duration: m.exit.duration / 2, easing: m.exit.easing, fill: "forwards" })
        .finished,
    ];
    /* The drag moves the whole mosaic and goes back to 0 as the pieces leave, so aim from the unmoved places. */
    const places = order.current.map((face) => {
      const r = face.parentElement!.getBoundingClientRect();
      return { left: r.left, top: r.top - pulled, width: r.width, height: r.height };
    });
    runs.push(gather(order.current, tile.getBoundingClientRect(), m, { places, shift: { x: 0, y: pulled } }));
    void Promise.all(runs)
      .catch(() => undefined)
      .then(finish);
  }

  /* A drag never starts on a piece, and a finger only drags from the title bar (anywhere else it scrolls). */
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target.closest("[data-piece-face]")) return;
    if (e.pointerType === "touch" && !target.closest("[data-mosaic-handle]")) return;
    drag.onPointerDown(e);
  };
  /* A click on empty space, between the pieces or around them, puts the mosaic away. */
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.hasAttribute("data-mosaic-empty") || target.hasAttribute("data-piece")) close();
  };

  return (
    <RadixDialog.Content
      aria-describedby={undefined}
      data-dismiss-panel={drag.panel["data-dismiss-panel"]}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        title.current?.focus({ preventScroll: true });
      }}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        close();
      }}
      onPointerDownOutside={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className="fixed inset-0 z-50 grid content-[safe_center] overflow-y-auto overscroll-contain px-gutter pt-[max(var(--space-12),env(safe-area-inset-top,0px))] pb-[max(var(--space-16),env(safe-area-inset-bottom,0px))] outline-none"
    >
      <div ref={scrim} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-canvas opacity-0" />
      <motion.div data-mosaic-empty style={{ y: drag.offset }} className="mx-auto grid w-full max-w-wide min-w-0 gap-4">
        <div ref={head} data-mosaic-handle className="grid cursor-grab gap-2 select-none [touch-action:pan-x_pinch-zoom] active:cursor-grabbing">
          <div aria-hidden="true" className="h-1 w-8 justify-self-center rounded-pill bg-line-strong" />
          <div className="flex min-h-control-md flex-wrap items-center gap-x-4 gap-y-2">
            <RadixDialog.Title ref={title} tabIndex={-1} className="text-h1 font-title text-fg outline-none">
              {page.title} <span ref={count} className="font-normal text-fg-subtle tabular-nums" />
            </RadixDialog.Title>
            <p className="ml-auto hidden text-caption text-fg-subtle pointer-fine:block">Drag down, press Esc or click outside to close</p>
            <div className="ml-auto flex items-center gap-2 pointer-fine:ml-0">
              <a
                href={`#${page.id}`}
                /* The page opens out of the mosaic: each of its stages grows out of its piece here (arrival.tsx). */
                onClick={() => grid.current && arriveFrom(page.id, { each: boxesOf(facesIn(grid.current)) })}
                className={
                  "flex h-control-sm items-center gap-2 rounded-control px-3 text-small font-title text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
                  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:h-control-md " +
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                }
              >
                Open page
                <ArrowRightIcon />
              </a>
              <Button iconOnly variant="ghost" size="sm" aria-label={`Close ${page.title}`} onClick={close}>
                <XIcon />
              </Button>
            </div>
          </div>
        </div>
        {/* A wrapper a page puts around its stages (a provider) takes no part in the grid. */}
        <div ref={grid} data-mosaic-empty className="grid min-w-0 grid-flow-row-dense gap-2 md:grid-cols-2 [&_:not([data-piece]):has(>[data-piece])]:contents">
          <PreviewContext.Provider value="mosaic">
            <Suspense fallback={null}>
              <page.Component />
            </Suspense>
          </PreviewContext.Provider>
        </div>
      </motion.div>
    </RadixDialog.Content>
  );
}
