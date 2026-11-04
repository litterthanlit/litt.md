/**
 * The overview's mosaic: a tile opens into every demo on its page, dealt out from where the tile sat, and gathers back
 * into it when you close it. After Dennis Dang's s-p.studio (2026-11-04, Nick: "this is what I want littmd to feel
 * like"), and the Deal prototype Nick picked over Unfold.
 *
 * - The pieces are the page's own stages, live (PreviewContext "mosaic" in kit.tsx). Each piece is a figure that holds
 *   its place in the grid and a face inside it that moves, and each is held still until reached for, as a tile is.
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
import { useExit, useMotionDial, useStagger, useTransition, useTravel } from "@/motion";
import { useDismissDrag } from "@/motion/drag";
import { Button } from "@/components/button";
import { ArrowRightIcon, XIcon } from "@/components/icons";
import { PreviewContext } from "./kit";
import type { PageEntry } from "./registry";

type Box = { left: number; top: number; width: number; height: number };
const center = (r: Box) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** How far the page steps back behind the mosaic: its scale and its blur, the blur at R4's 4px ceiling. */
const BACK_SCALE = 0.985;
const BACK_BLUR = 4;

/**
 * Where a piece sits while it is still in the tile: the k-th card of a small deck at the tile's centre, scaled to
 * about half the tile. Returned as the face's offset from its place in the grid.
 */
function deck(place: Box, tile: Box, k: number, n: number) {
  const s = Math.min((tile.width * 0.56) / place.width, (tile.height * 0.56) / place.height, 1);
  const fan = (k - (n - 1) / 2) * 3;
  const from = center(place);
  const to = center(tile);
  return { x: to.x + fan - from.x, y: to.y + fan * 0.6 - from.y, scale: s };
}

/** The faces of the pieces, in the grid's order. */
const facesIn = (grid: HTMLElement) => [...grid.querySelectorAll<HTMLElement>("[data-piece-face]")];

/** Everything still running when the mosaic closes. */
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
  const { reduced } = useMotionDial();
  const expressive = useTransition("expressive");
  const responsive = useTransition("responsive");
  const instant = useTransition("instant");
  const exit = useExit("expressive");
  const exitQuick = useExit("responsive");
  const stagger = useStagger();
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

  const drag = useDismissDrag({
    direction: "down",
    onDismiss: () => close(),
    enabled: !closing,
  });

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
      backBlur.set(BACK_BLUR * (1 - back));
    };
    const off = [backOpacity.on("change", paint), backScale.on("change", paint), backBlur.on("change", paint), drag.offset.on("change", follow)];
    return () => {
      off.forEach((f) => f());
      root.style.opacity = root.style.transform = root.style.filter = root.style.transformOrigin = "";
    };
  }, [backOpacity, backScale, backBlur, drag.offset]);

  /* Deal: from a deck on the tile to the grid. */
  useLayoutEffect(() => {
    const faces = facesIn(grid.current!);
    setCount(faces.length);
    /* A demo wider than its column takes both (it is laid out for a page's full column), before anything is measured. */
    for (const face of faces) if (face.scrollWidth > face.clientWidth + 1) face.parentElement!.dataset.wide = "";
    const from = tile.getBoundingClientRect();
    const near = center(from);
    const placed = faces
      .map((face) => ({
        face,
        place: face.parentElement!.getBoundingClientRect(),
      }))
      .sort((a, b) => dist(center(a.place), near) - dist(center(b.place), near));
    order.current = placed.map((p) => p.face);
    if (reduced) {
      backOpacity.set(0);
      phase.current = "open";
      return;
    }
    const runs: AnimationPlaybackControls[] = [
      animate(backOpacity, 0, responsive),
      animate(backScale, BACK_SCALE, responsive),
      animate(backBlur, BACK_BLUR, responsive),
    ];
    placed.forEach(({ face, place }, k) => {
      const d = deck(place, from, k, placed.length);
      const delay = k * stagger;
      /* The first frame is painted before any delay runs out, so the face starts in the deck, not in its place. */
      face.style.opacity = "0";
      face.style.transform = `translateX(${d.x}px) translateY(${d.y}px) scale(${d.scale})`;
      face.style.filter = `blur(${BACK_BLUR}px)`;
      runs.push(
        animate(face, { x: [d.x, 0], y: [d.y, 0], scale: [d.scale, 1] }, { ...expressive, delay }),
        animate(face, { opacity: [0, 1] }, { ...instant, delay }),
        animate(face, { filter: [`blur(${BACK_BLUR}px)`, "blur(0px)"] }, { ...responsive, delay }),
      );
    });
    const bar = head.current!;
    bar.style.opacity = "0";
    runs.push(animate(bar, { opacity: [0, 1], y: [travel / 2, 0] }, { ...responsive, delay: stagger * 2 }));
    void settled(runs).then(() => {
      if (phase.current !== "opening") return;
      phase.current = "open";
      /* At rest a face carries no filter: even blur(0px) would make it a containing block for fixed parts inside it. */
      for (const face of faces) face.style.filter = "";
    });
    // Once, on open: the deal reads where the tile is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    onClosed();
    /* After Radix has handed focus back to whatever it saved, put it on the tile's own open button. */
    requestAnimationFrame(() => returnTo?.isConnected && returnTo.focus({ preventScroll: true }));
  }

  /* Gather: from wherever each face is drawn now back into the deck on the tile. */
  function close() {
    if (phase.current === "closing") return;
    phase.current = "closing";
    setClosing(true);
    if (reduced) return finish();
    const to = tile.getBoundingClientRect();
    const pulled = drag.offset.get();
    const half = ((exit as { duration?: number }).duration ?? 0) / 2;
    const runs: AnimationPlaybackControls[] = [
      animate(drag.offset, 0, exit),
      animate(backOpacity, 1, { ...responsive, delay: half / 2 } as Transition),
      animate(backScale, 1, { ...responsive, delay: half / 2 } as Transition),
      animate(backBlur, 0, { ...responsive, delay: half / 2 } as Transition),
      animate(head.current!, { opacity: 0 }, exitQuick),
    ];
    const faces = [...order.current].reverse();
    faces.forEach((face, j) => {
      const k = faces.length - 1 - j;
      const r = face.parentElement!.getBoundingClientRect();
      /* The drag moves the whole mosaic and comes back to 0 as the faces leave, so aim from the unmoved place. */
      const d = deck({ left: r.left, top: r.top - pulled, width: r.width, height: r.height }, to, k, faces.length);
      const delay = (j * stagger) / 2;
      runs.push(
        animate(face, { x: d.x, y: d.y, scale: d.scale }, { ...exit, delay }),
        animate(face, { filter: `blur(${BACK_BLUR}px)` }, { ...exit, delay }),
        animate(face, { opacity: 0 }, {
          ...exit,
          duration: half,
          delay: delay + half,
        } as Transition),
      );
    });
    void settled(runs).then(finish);
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
