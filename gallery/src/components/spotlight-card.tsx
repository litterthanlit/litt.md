/**
 * SpotlightCard, a Flat part (skills/litt-md/taste/litt-principles.md, Flat; proposals/flat-studies, Spotlight card):
 * a white paper with one large figure, and a grey bubble that rides under the pointer inside it.
 *
 * - Paper on the grey ground (`litt-paper bg-surface-1 rounded-surface`, no outline and nothing cast): a title, the
 *   figure at the large figure size (`text-figure-lg`, the figure is the whole object) and a quiet line under it.
 * - The light is a shape, not a glow: a big grey circle (`bg-surface-3`, Flat's bubble) under the words, held 4px in
 *   so the paper keeps its white rim. It shows while a pointer is over the paper and swells a little while pressed.
 * - SpotlightGroup: cards inside one group read the one pointer, so the bubble crosses the gap between them as one
 *   circle. A card on its own reads its own pointer.
 * - Motion: the pointer's place goes straight to CSS variables (no React render while it moves); the bubble fades
 *   and grows on the instant tier, transform and opacity only. Nothing moves on its own (R4), a touch shows nothing,
 *   and under reduced motion the bubble appears and leaves at once.
 * - Semantics: an article named by its title; the bubble is aria-hidden decoration, so the figure is read as text.
 */
import { createContext, useCallback, useContext, useEffect, useId, useRef, type ReactNode } from "react";

type Register = (el: HTMLElement) => () => void;

/* A group hands its cards a way to join, so one pointer lights them all. */
const GroupContext = createContext<Register | null>(null);

/** Writes the pointer's place into one card, in the card's own unscaled coordinates. */
function place(el: HTMLElement, x: number, y: number) {
  const r = el.getBoundingClientRect();
  const scale = r.width / (el.offsetWidth || r.width) || 1;
  el.style.setProperty("--spot-x", `${(x - r.left) / scale}px`);
  el.style.setProperty("--spot-y", `${(y - r.top) / scale}px`);
}

/** Pointer handlers that light a set of cards: the bubble follows a mouse or pen, never a touch. */
function useSpot(cards: () => Iterable<HTMLElement>) {
  const set = (attr: string, on: boolean) => {
    for (const el of cards()) {
      if (on) el.setAttribute(attr, "");
      else el.removeAttribute(attr);
    }
  };
  return {
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      for (const el of cards()) place(el, e.clientX, e.clientY);
      set("data-lit", true);
    },
    onPointerLeave: () => {
      set("data-lit", false);
      set("data-pressed", false);
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      for (const el of cards()) place(el, e.clientX, e.clientY);
      set("data-lit", true);
      set("data-pressed", true);
    },
    onPointerUp: () => set("data-pressed", false),
    onPointerCancel: () => set("data-pressed", false),
  };
}

export type SpotlightGroupProps = {
  /** The cards, each a SpotlightCard. They share one pointer, so the bubble crosses from one to the next. */
  children: ReactNode;
  /** Extra classes for the grid, such as a column count. One column, and two from 28rem of room. */
  className?: string;
};

/** A row of spotlight cards that read one pointer, so the bubble crosses the gap between them as one circle. */
export function SpotlightGroup({ children, className = "" }: SpotlightGroupProps) {
  const cards = useRef(new Set<HTMLElement>());
  const register = useCallback<Register>((el) => {
    cards.current.add(el);
    return () => {
      cards.current.delete(el);
    };
  }, []);
  const handlers = useSpot(() => cards.current);
  return (
    <GroupContext.Provider value={register}>
      <div className="@container w-full max-w-2xl min-w-0">
        <div {...handlers} className={"grid grid-cols-1 gap-3 @md:grid-cols-2 @md:gap-4 " + className}>
          {children}
        </div>
      </div>
    </GroupContext.Provider>
  );
}

export type SpotlightCardProps = {
  /** The card's name, above the figure: what is counted ("Readers"). */
  title: string;
  /** The one large figure, already formatted with its unit ("12,480", "61%"). */
  figure: string;
  /** A quiet line under the figure that says what it means ("62 joined this week"). */
  label?: string;
  /** Anything else on the paper, under the label. Keep it quiet: the figure is the object. */
  children?: ReactNode;
  className?: string;
};

/** A white paper with one large figure and a grey bubble that rides under the pointer. A Flat part. */
export function SpotlightCard({ title, figure, label, children, className = "" }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const register = useContext(GroupContext);
  const titleId = useId();
  useEffect(() => (register && ref.current ? register(ref.current) : undefined), [register]);
  const own = useSpot(() => (ref.current ? [ref.current] : []));

  return (
    <div
      ref={ref}
      data-part="paper"
      {...(register ? {} : own)}
      className={
        "litt-paper group/spot relative isolate min-w-0 rounded-surface bg-surface-1 text-fg [--spot-x:50%] [--spot-y:-40%] forced-colors:border " +
        className
      }
    >
      {/* The well keeps the bubble 4px in, so the paper's rim stays white; its corner is the paper's less the inset. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-1 -z-10 overflow-hidden rounded-[calc(var(--radius-surface)-4px)]">
        <span
          data-part="bubble"
          className="absolute top-[calc(var(--spot-y)-4px)] left-[calc(var(--spot-x)-4px)] -mt-30 -ml-30 size-60 scale-80 rounded-pill bg-surface-3 opacity-0 transition-[opacity,transform] duration-(--dur-instant) ease-litt group-data-lit/spot:scale-100 group-data-lit/spot:opacity-100 group-data-lit/spot:group-data-pressed/spot:scale-125 sm:-mt-37.5 sm:-ml-37.5 sm:size-75 forced-colors:hidden"
        />
      </span>
      <article aria-labelledby={titleId} className="grid min-h-40 content-between gap-5 p-4 sm:min-h-52 sm:gap-7 sm:p-6">
        <span id={titleId} className="text-body font-label text-fg">
          {title}
        </span>
        <p className="m-0 grid gap-1.5">
          <span className="text-figure-lg tabular-nums text-fg">{figure}</span>
          {label && <span className="text-small text-fg-muted">{label}</span>}
        </p>
        {children}
      </article>
    </div>
  );
}
