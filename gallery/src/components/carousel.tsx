/**
 * Carousel: a row of slides that scrolls sideways, such as a project's screens or a strip of cards (components.md,
 * "Carousel"). Carousel, CarouselContent, CarouselItem and CarouselControls, as shadcn names them, and useCarousel for
 * controls of your own.
 *
 * - Scrolling is the browser's: a scroll-snapped track, so a swipe, a trackpad, Shift and the wheel all move it with
 *   their own momentum, and each slide comes to rest at the start edge. With a mouse the track can also be dragged; it
 *   lets go onto the nearest slide in the way it was going. The scrollbar is hidden, because the controls and the
 *   peeking next slide say there is more.
 * - It never moves on its own: no autoplay, no loop, no timer (foundations.md, Motion: looping autoplay and marquee are
 *   never allowed). The person always moves it, so there is nothing to pause.
 * - Slides per view: one, two or three, with the next slide peeking 48px at the end edge (96px for one slide in a wide
 *   box), or auto for slides that set their own width. The box decides by a container query, not the screen: in a
 *   narrow box every carousel is one slide and a peek.
 * - Controls (CarouselControls): the range in words at the start, "3 of 12" or "4 to 6 of 12", in the mono at the
 *   caption size in --fg-subtle, as Pagination's; and round secondary Previous and Next buttons at the end, 44px on a
 *   touch screen. Next moves a page (the first slide not wholly in view comes to the start), Previous a page back. At
 *   an end the button is disabled and hands its focus to the other one.
 * - Keys: the track is a tab stop. ← and → move one slide, Home and End go to the first and the last.
 * - Motion: a button, a key or a drag's release scrolls smoothly, the browser's own scroll; under reduced motion it
 *   jumps. Nothing else moves, and nothing fades at the edges (material is static, P5).
 * - Accessibility: a region named by `label`, with aria-roledescription="carousel"; each slide a group with
 *   aria-roledescription="slide" named "3 of 12". Slides out of view stay readable, because scrolling reaches them.
 *   After a button or a key the new range is said once in a polite status; a swipe says nothing.
 */
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useMotionDial } from "@/motion";
import { Button } from "@/components/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export type CarouselPerView = "one" | "two" | "three" | "auto";

/* The slide widths, by the box's width. Each leaves the peek (3rem, 6rem for one slide in a wide box) plus the gaps. */
const BASIS: Record<CarouselPerView, string> = {
  one: "basis-[calc(100%-3rem)] @min-[48rem]:basis-[calc(100%-6rem)]",
  two: "basis-[calc(100%-3rem)] @min-[36rem]:basis-[calc((100%-4rem)/2)]",
  three: "basis-[calc(100%-3rem)] @min-[28rem]:basis-[calc((100%-4rem)/2)] @min-[48rem]:basis-[calc((100%-5rem)/3)]",
  auto: "",
};

/** What is in view: the first and last slides wholly in view, how many there are, and which ways it can still go. */
export type CarouselView = { first: number; last: number; total: number; canPrevious: boolean; canNext: boolean };

type Ctx = {
  label: string;
  perView: CarouselPerView;
  trackId: string;
  track: RefObject<HTMLDivElement | null>;
  view: CarouselView;
  /** Scrolls slide `index` to the start edge. `announce` says the new range once it rests; `instant` skips the smooth scroll. */
  goTo: (index: number, announce?: boolean, instant?: boolean) => void;
  /** A page forward: the first slide not wholly in view comes to the start. */
  next: () => void;
  /** A page back. */
  previous: () => void;
  /** Called by the track on every scroll and resize. */
  measure: () => void;
};

const CarouselContext = createContext<Ctx | null>(null);
const ItemContext = createContext<{ index: number; total: number }>({ index: 0, total: 0 });

/** The carousel around it: what is in view, and the moves the controls use. For controls of your own. */
export function useCarousel() {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel needs a Carousel around it.");
  const { view, goTo, next, previous, label, trackId } = ctx;
  return { view, goTo, next, previous, label, trackId };
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Where every slide sits, in inline terms: px from the track's start edge (inside its padding), so the same sums work
 * left to right and right to left. `pos` is how far the track has scrolled from its start and `max` how far it can.
 */
function geometry(track: HTMLElement) {
  const cs = getComputedStyle(track);
  const rtl = cs.direction === "rtl";
  const box = track.getBoundingClientRect();
  const padStart = parseFloat(rtl ? cs.paddingRight : cs.paddingLeft) || 0;
  const padEnd = parseFloat(rtl ? cs.paddingLeft : cs.paddingRight) || 0;
  const start = rtl ? box.right - padStart : box.left + padStart;
  const width = box.width - padStart - padEnd;
  const slides = Array.from(track.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute("data-carousel-item"));
  const spans = slides.map((el) => {
    const r = el.getBoundingClientRect();
    return rtl ? { from: start - r.right, to: start - r.left } : { from: r.left - start, to: r.right - start };
  });
  return { rtl, width, spans, pos: Math.abs(track.scrollLeft), max: track.scrollWidth - track.clientWidth };
}

function viewOf(track: HTMLElement): CarouselView {
  const { width, spans, pos, max } = geometry(track);
  const total = spans.length;
  const whole = spans.map((s, i) => (s.from >= -1 && s.to <= width + 1 ? i : -1)).filter((i) => i >= 0);
  let first = whole[0];
  let last = whole[whole.length - 1];
  if (first === undefined || last === undefined) {
    /* A slide wider than the track: the one nearest the start is the one in view. */
    let near = 0;
    spans.forEach((s, i) => {
      if (Math.abs(s.from) < Math.abs(spans[near]!.from)) near = i;
    });
    first = last = total ? near : 0;
  }
  return { first, last, total, canPrevious: pos > 1, canNext: pos < max - 1 };
}

const same = (a: CarouselView, b: CarouselView) =>
  a.first === b.first && a.last === b.last && a.total === b.total && a.canPrevious === b.canPrevious && a.canNext === b.canNext;

/** "3 of 12", or "4 to 6 of 12" when several are in view. */
const rangeText = (v: CarouselView) => (v.first === v.last ? `${v.first + 1} of ${v.total}` : `${v.first + 1} to ${v.last + 1} of ${v.total}`);

/* -------------------------------------------------------------------------- */
/* Carousel                                                                   */
/* -------------------------------------------------------------------------- */

export type CarouselProps = {
  /** What the slides are, for screen readers: "Halo site, screens". */
  label: string;
  /** How many slides fit the box: one, two or three with the next one peeking, or auto when each CarouselItem sets its own width. A narrow box always shows one and a peek. */
  perView?: CarouselPerView;
  /** The first slide in view. Pass it with onIndexChange to scroll the carousel from outside, as a Lightbox does when it closes on another image. */
  index?: number;
  /** Called with the first slide in view whenever it changes, by any means. */
  onIndexChange?: (index: number) => void;
  /** A CarouselContent with the slides, and CarouselControls where you want them (usually after it). */
  children: ReactNode;
  /** Extra classes for the carousel, such as a width. */
  className?: string;
};

/** The root: the region, what is in view and the moves. Put a CarouselContent and CarouselControls inside it. */
export function Carousel({ label, perView = "one", index, onIndexChange, children, className = "" }: CarouselProps) {
  const track = useRef<HTMLDivElement | null>(null);
  const trackId = useId();
  const { reduced } = useMotionDial();
  const [view, setView] = useState<CarouselView>({ first: 0, last: 0, total: 0, canPrevious: false, canNext: false });
  const viewRef = useRef(view);
  const [status, setStatus] = useState("");
  const announce = useRef(false);
  const settle = useRef(0);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const next = viewOf(el);
    if (!same(next, viewRef.current)) {
      viewRef.current = next;
      setView(next);
    }
    /* Said once the scroll has come to rest, and only after a button or a key. */
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      if (!announce.current) return;
      announce.current = false;
      const v = viewRef.current;
      setStatus(`${v.first === v.last ? "Slide" : "Slides"} ${rangeText(v)}`);
    }, 150);
  }, []);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const goTo = useCallback(
    (to: number, say = true, instant = false) => {
      const el = track.current;
      if (!el) return;
      const { rtl, spans } = geometry(el);
      const target = spans[Math.max(0, Math.min(spans.length - 1, to))];
      if (!target) return;
      announce.current = say;
      el.scrollBy({ left: rtl ? -target.from : target.from, behavior: reduced || instant ? "auto" : "smooth" });
      /* Nothing to scroll (already there): still say where it is. */
      requestAnimationFrame(measure);
    },
    [reduced, measure],
  );

  const next = useCallback(() => {
    const v = viewRef.current;
    goTo(Math.min(v.total - 1, v.last + 1));
  }, [goTo]);

  const previous = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const { width, spans } = geometry(el);
    const v = viewRef.current;
    const end = spans[v.first - 1];
    if (!end) return goTo(0);
    /* Back far enough that the slide before the first one in view becomes the last one in view. */
    let to = v.first - 1;
    while (to > 0 && end.to - spans[to - 1]!.from <= width + 1) to--;
    goTo(to);
  }, [goTo]);

  /* The last first slide told to onIndexChange. An index that comes back equal to it is that report's echo, even
     when the track has scrolled on since, so it never pulls a smooth scroll back. */
  const reported = useRef<number | null>(null);

  /* Controlled: a new index from outside scrolls there (at once on the first render, so the page opens on it). */
  const mounted = useRef(false);
  useLayoutEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (index === undefined) return;
    if (first) {
      if (index > 0) goTo(index, false, true);
      return;
    }
    if (index !== reported.current && index !== viewRef.current.first) goTo(index, false);
    // goTo is left out on purpose: only a new index scrolls.
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view.total === 0 || reported.current === view.first) return;
    reported.current = view.first;
    onIndexChange?.(view.first);
  }, [view.first, view.total, onIndexChange]);

  return (
    <CarouselContext value={{ label, perView, trackId, track, view, goTo, next, previous, measure }}>
      <section aria-roledescription="carousel" aria-label={label} className={"@container grid min-w-0 gap-4 " + className}>
        {children}
        <p role="status" className="sr-only">
          {status}
        </p>
      </section>
    </CarouselContext>
  );
}

/* -------------------------------------------------------------------------- */
/* CarouselContent                                                            */
/* -------------------------------------------------------------------------- */

/* A mouse drag never starts on these: they own the pointer. */
const NO_DRAG = "input, textarea, select, [contenteditable]:not([contenteditable=false]), [role=slider], [data-no-drag]";
const SLOP = 6; // px of travel before a press is a drag, not a click

export type CarouselContentProps = {
  /** The slides: one CarouselItem each. */
  children: ReactNode;
  /** Extra classes for the track. */
  className?: string;
};

/** The track: the slides in a row that scrolls sideways and snaps each slide to the start edge. A tab stop for the arrow keys. */
export function CarouselContent({ children, className = "" }: CarouselContentProps) {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error("CarouselContent must sit inside a Carousel.");
  const { track, trackId, measure, goTo, view } = ctx;
  const items = Children.toArray(children).filter(isValidElement);
  const [dragging, setDragging] = useState(false);
  const frame = useRef(0);

  /* Measure after every render (slides added or removed), on resize, and on every scroll frame. */
  useLayoutEffect(() => measure());
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => measure());
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [track, measure]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const to =
      e.key === forward ? view.first + 1 : e.key === back ? view.first - 1 : e.key === "Home" ? 0 : e.key === "End" ? view.total - 1 : null;
    if (to === null) return;
    e.preventDefault();
    goTo(Math.max(0, Math.min(view.total - 1, to)));
  };

  /* A mouse drags the track; touch and trackpads already scroll it natively. Snapping is off while the mouse holds
     it, then the release scrolls to the nearest slide in the way it was going and snapping comes back. */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    if ((e.target as Element).closest(NO_DRAG)) return;
    const x0 = e.clientX;
    const left0 = el.scrollLeft;
    let moved = false;
    let dx = 0;

    const move = (ev: PointerEvent) => {
      dx = ev.clientX - x0;
      if (!moved) {
        if (Math.abs(dx) < SLOP) return;
        moved = true;
        el.style.scrollSnapType = "none";
        setDragging(true);
        window.getSelection()?.removeAllRanges();
      }
      el.scrollLeft = left0 - dx;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!moved) return;
      setDragging(false);
      /* The click that ends a drag is not a press on whatever is under the pointer. */
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, true), 0);

      const { rtl, spans } = geometry(el);
      let near = 0;
      spans.forEach((s, i) => {
        if (Math.abs(s.from) < Math.abs(spans[near]!.from)) near = i;
      });
      const forward = rtl ? dx > 0 : dx < 0;
      const at = spans[near]?.from ?? 0;
      const to = forward && at < -8 ? near + 1 : !forward && at > 8 ? near - 1 : near;
      goTo(Math.max(0, Math.min(spans.length - 1, to)), false);
      const restore = () => {
        el.style.scrollSnapType = "";
      };
      if ("onscrollend" in el) el.addEventListener("scrollend", restore, { once: true });
      setTimeout(restore, 700); // a browser without scrollend, or a scroll that never started
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div
      ref={track}
      id={trackId}
      role="group"
      aria-label="Slides"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onDragStart={(e) => e.preventDefault()}
      className={[
        /* 4px of room on every side, so a slide's focus ring is never cut by the scroll box. */
        "-m-1 flex min-w-0 snap-x snap-mandatory scroll-p-1 gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain p-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "rounded-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
        dragging ? "cursor-grabbing select-none" : "",
        className,
      ].join(" ")}
    >
      {items.map((child, i) => (
        <ItemContext key={child.key ?? i} value={{ index: i, total: items.length }}>
          {child}
        </ItemContext>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CarouselItem                                                               */
/* -------------------------------------------------------------------------- */

export type CarouselItemProps = {
  /** A name for the slide, added to its number for screen readers: "Home page" reads "3 of 12: Home page". */
  label?: string;
  /** The slide's content: a Media, a Card, anything. */
  children: ReactNode;
  /** Extra classes for the slide. With perView="auto", set its width here (w-64). */
  className?: string;
};

/** One slide. Its width comes from the carousel's perView, or from className when perView is auto. */
export function CarouselItem({ label, children, className = "" }: CarouselItemProps) {
  const ctx = useContext(CarouselContext);
  const { index, total } = useContext(ItemContext);
  const name = `${index + 1} of ${total}${label ? `: ${label}` : ""}`;
  return (
    <div
      data-carousel-item=""
      role="group"
      aria-roledescription="slide"
      aria-label={name}
      className={"min-w-0 shrink-0 snap-start " + BASIS[ctx?.perView ?? "one"] + " " + className}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CarouselControls                                                           */
/* -------------------------------------------------------------------------- */

const ROUND = "pointer-coarse:h-control-md pointer-coarse:w-control-md";

export type CarouselControlsProps = {
  /** Extra classes for the row. */
  className?: string;
};

/** The range in words and the Previous and Next buttons, in one row. Put it after the CarouselContent. */
export function CarouselControls({ className = "" }: CarouselControlsProps) {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error("CarouselControls must sit inside a Carousel.");
  const { view, next, previous, trackId } = ctx;
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const several = view.first !== view.last;

  /* A pressed button that has just been disabled hands its focus to the other one. The browser may already have
     dropped focus to the body when the button turned disabled, so the last press counts too. */
  const pressed = useRef<"previous" | "next" | null>(null);
  useEffect(() => {
    const lost = (which: "previous" | "next", el: HTMLButtonElement | null) =>
      document.activeElement === el || (pressed.current === which && (document.activeElement === document.body || document.activeElement === null));
    if (!view.canNext && lost("next", nextRef.current)) prevRef.current?.focus();
    if (!view.canPrevious && lost("previous", prevRef.current)) nextRef.current?.focus();
  }, [view.canNext, view.canPrevious]);

  return (
    <div className={"flex items-center justify-between gap-4 " + className}>
      <p aria-hidden="true" className="font-mono text-caption font-normal tabular-nums text-fg-subtle">
        {view.total > 0 ? rangeText(view) : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          ref={prevRef}
          iconOnly
          size="sm"
          aria-label={several ? "Previous slides" : "Previous slide"}
          aria-controls={trackId}
          disabled={!view.canPrevious}
          onClick={() => {
            pressed.current = "previous";
            previous();
          }}
          onBlur={() => {
            pressed.current = null;
          }}
          className={ROUND}
        >
          <ChevronLeftIcon className="rtl:-scale-x-100" />
        </Button>
        <Button
          ref={nextRef}
          iconOnly
          size="sm"
          aria-label={several ? "Next slides" : "Next slide"}
          aria-controls={trackId}
          disabled={!view.canNext}
          onClick={() => {
            pressed.current = "next";
            next();
          }}
          onBlur={() => {
            pressed.current = null;
          }}
          className={ROUND}
        >
          <ChevronRightIcon className="rtl:-scale-x-100" />
        </Button>
      </div>
    </div>
  );
}
