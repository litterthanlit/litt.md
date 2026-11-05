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
import { Suspense, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { animate, motion, useMotionValue, type AnimationPlaybackControls, type Transition } from "motion/react";
import { useExit, useTravel } from "@/motion";
import { deal, gather, SOFT_FOCUS, useDealMotion } from "@/motion/deal";
import { useDismissDrag } from "@/motion/drag";
import { Button } from "@/components/button";
import { ArrowRightIcon, XIcon } from "@/components/icons";
import { arriveFrom, boxesOf } from "./arrival";
import { PreviewContext } from "./kit";
import type { PageEntry } from "./registry";

/** How far the page steps back behind the mosaic: a little smaller, and soft at R4's ceiling. */
const BACK_SCALE = 0.985;

/** The faces of the pieces, in the grid's order (the page's stage order). */
const facesIn = (grid: HTMLElement) => [...grid.querySelectorAll<HTMLElement>("[data-piece-face]")];

const settled = (runs: AnimationPlaybackControls[]) => Promise.all(runs.map((r) => r.finished)).catch(() => undefined);

type MosaicProps = {
  page: PageEntry;
  /** The tile it opens from and gathers back into. */
  tile: HTMLElement;
  /** Where focus goes once it has closed: the tile's open button. */
  returnTo: HTMLElement | null;
  /** Called when the close has finished, to unmount it. */
  onClosed: () => void;
};

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
  const exitQuick = useExit("responsive");
  const travel = useTravel();

  const grid = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const phase = useRef<"opening" | "open" | "closing">("opening");
  const order = useRef<HTMLElement[]>([]);
  const [count, setCount] = useState(0);
  const [closing, setClosing] = useState(false);

  /* The page behind: three values painted onto #root, so a drag, the open and the close can all move them. */
  const backOpacity = useMotionValue(1);
  const backScale = useMotionValue(1);
  const backBlur = useMotionValue(0);

  const drag = useDismissDrag({ direction: "down", onDismiss: () => close(), enabled: !closing });

  useLayoutEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    /* Shrink toward the middle of what is on screen, not the middle of the whole page. */
    root.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;
    const paint = () => {
      const s = backScale.get();
      const b = backBlur.get();
      root.style.opacity = String(backOpacity.get());
      root.style.transform = s === 1 ? "" : `scale(${s})`;
      root.style.filter = b > 0.05 ? `blur(${b}px)` : "";
    };
    /* While the mosaic is open, a drag decides how far the page has come back: all the way at a screen's height. */
    const follow = (y: number) => {
      if (phase.current !== "open") return;
      const back = Math.min(Math.max(y / innerHeight, 0) * 1.8, 1);
      backOpacity.set(back);
      backScale.set(BACK_SCALE + (1 - BACK_SCALE) * back);
      backBlur.set(SOFT_FOCUS * (1 - back));
    };
    const off = [backOpacity.on("change", paint), backScale.on("change", paint), backBlur.on("change", paint), drag.offset.on("change", follow)];
    return () => {
      off.forEach((f) => f());
      root.style.opacity = root.style.transform = root.style.filter = root.style.transformOrigin = "";
    };
  }, [backOpacity, backScale, backBlur, drag.offset]);

  /* Deal the pieces out of the tile, while the page steps back. */
  useLayoutEffect(() => {
    const faces = facesIn(grid.current!);
    setCount(faces.length);
    /* A demo wider than its column takes both (it is laid out for a page's full column), before anything is measured. */
    for (const face of faces) if (face.scrollWidth > face.clientWidth + 1) face.parentElement!.dataset.wide = "";
    /* The figure is the place: the face in it is what moves. */
    const dealt = deal(faces, { deck: tile.getBoundingClientRect() }, m, { places: faces.map((f) => f.parentElement!.getBoundingClientRect()) });
    order.current = dealt.order;
    if (m.reduced) {
      backOpacity.set(0);
      phase.current = "open";
      return;
    }
    const bar = head.current!;
    bar.style.opacity = "0";
    const runs = [
      animate(backOpacity, 0, m.focus),
      animate(backScale, BACK_SCALE, m.focus),
      animate(backBlur, SOFT_FOCUS, m.focus),
      animate(bar, { opacity: [0, 1], y: [travel / 2, 0] }, { ...m.focus, delay: m.stagger * 2 }),
    ];
    void Promise.all([dealt.finished, settled(runs)]).then(() => {
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

  /* Gather the pieces back into the tile, from wherever each is drawn now, while the page comes back into focus. */
  function close() {
    if (phase.current === "closing") return;
    phase.current = "closing";
    setClosing(true);
    if (m.reduced) return finish();
    const pulled = drag.offset.get();
    const back = { ...m.focus, delay: ((m.exit as { duration?: number }).duration ?? 0) / 4 } as Transition;
    const runs = [
      animate(drag.offset, 0, m.exit),
      animate(backOpacity, 1, back),
      animate(backScale, 1, back),
      animate(backBlur, 0, back),
      animate(head.current!, { opacity: 0 }, exitQuick),
    ];
    /* The drag moves the whole mosaic and goes back to 0 as the pieces leave, so aim from the unmoved places. */
    const places = order.current.map((face) => {
      const r = face.parentElement!.getBoundingClientRect();
      return { left: r.left, top: r.top - pulled, width: r.width, height: r.height };
    });
    void Promise.all([gather(order.current, tile.getBoundingClientRect(), m, { places }), settled(runs)]).then(finish);
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
      <motion.div data-mosaic-empty style={{ y: drag.offset }} className="mx-auto grid w-full max-w-wide min-w-0 gap-4">
        <div ref={head} data-mosaic-handle className="grid cursor-grab gap-2 select-none [touch-action:pan-x_pinch-zoom] active:cursor-grabbing">
          <div aria-hidden="true" className="h-1 w-8 justify-self-center rounded-pill bg-line-strong" />
          <div className="flex min-h-control-md flex-wrap items-center gap-x-4 gap-y-2">
            <RadixDialog.Title ref={title} tabIndex={-1} className="text-h1 font-title text-fg outline-none">
              {page.title} <span className="font-normal text-fg-subtle tabular-nums">{count === 1 ? "1 demo" : `${count} demos`}</span>
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
