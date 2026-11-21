/**
 * What a body gets from the object's contract (contract.tsx), and what it gives back. A body only draws: it spreads
 * what it is handed and adds no role, key or state of its own (plans/018, Constraints; litt-principles.md, Where a
 * world is free).
 */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentType, HTMLAttributes, ReactNode, Ref } from "react";
import type { MaterialInfo } from "../look";
import type { Take } from "./takes";

export type PlayObjectBodyProps = {
  world: MaterialInfo;
  /** The world's set, in order. */
  takes: Take[];
  /** The take showing, or null on Index: the world's introduction and its set, inside the screen. */
  at: number | null;
  /** Spread on the element that picks the take, the tape or its stand-in: role="slider" over Index (0) and the takes,
      named Take (never Components, the top row's link beside it that goes elsewhere), its spoken value ("Poll, 2 of
      12"), and keys (Right and Down to the next, Left and Up to the previous, wrapping through Index; the
      Home key for Index, End for the last). One tab stop. */
  selector: HTMLAttributes<HTMLElement>;
  /** Take the hand to take i, as a press or drag along the selector does. Stops Play. */
  pick: (i: number) => void;
  /** Spread on a Previous or Next key, where a body draws one. Out of the tab order: the selector's arrows do this. */
  step: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread on a key that goes to Index, where a body draws one, as an iPod's Menu does. Its visible word is Index (the
      top row's Home is the way out of the world, and no other control may share that name). Out of the tab order: the
      top row's Index and the selector's Home key do this. It carries data-play-to="index", as the top row's Index does,
      so the checks know the two controls named Index go to the same place. */
  index: ButtonHTMLAttributes<HTMLButtonElement> & { "data-play-to": "index" };
  /** Spread on a link to the world's gallery view (#<world>/components), where a body draws one. Out of the tab order:
      Home and the rail link there too. */
  everything: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
  /** A mechanism the hand works, such as a dial, moved this many parts along the set. Stops Play. */
  turn: (by: number) => void;
  /** Spread on the Play key: its name, aria-pressed and onClick. Pressed, the object steps a take every 4s; any hand stops it. */
  play: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-pressed": boolean };
  /** What the readout says: "03 / 12", the take's group and title ("Index" and no group on Index). Spread `props` on the
      readout: it marks it for the checks and hides it from screen readers, since the contract says a hand's change
      once, in a polite live region. */
  readout: { count: string; group: string | null; title: string; props: HTMLAttributes<HTMLElement> & { "data-play-readout": "" } };
  /** The screen, already framed. Place it once. */
  screen: ReactNode;
  /** Below sm: draw one strip (readout, selector and Play) above the screen, and no body. */
  compact: boolean;
};

/**
 * Index, drawn by the body: the hand-off (plans/audits/heat-fixes.md, finding 1; plans/audits/shared-fixes.md, Track 3).
 * A body that sets `Home` draws Index's list inside the screen in its own grammar; one that does not keeps the
 * contract's (`HomeView` in contract.tsx). Heat's (`HeatHome` in bodies/heat.tsx) is the worked case.
 *
 * Who owns what:
 * - The contract owns the list (the set, in order), which row is current, which is under the pointer, every key (one
 *   tab stop for the list; Up and Down move, wrapping; Home and End go to the ends; Enter or a press opens the take),
 *   what a row opens, the live part (which part, its preview context, its mark and name), the link to every component
 *   and its words, and whether the live part exists on a phone (`phonePart` on the body). It also wraps what the body
 *   draws in `data-play-take="home" data-play-home="body"`, which the checks read.
 * - The body owns only the drawing: the layout (where the list, the live part and the link sit), each row's look
 *   (current, under the pointer, focused, forced colors), the live part's size (`scale`) and the screen's padding and
 *   scroll. It adds no role, key, tab stop or state of its own, and draws nothing in the accent's fill (R6).
 *
 * The rules a body keeps, which test:playground checks on every body with its own Index:
 * - Spread `list` on one element (a nav) holding every row, and `row(i)` on each row's button, in the set's order.
 *   A row's text is the take's title (its accessible name); anything else in it (a line, a chevron, brackets) is
 *   aria-hidden. Rows touch, with no gap between them (test:gaps), and the button is `litt-target relative`.
 * - Call `part()` once per render, in one place; on a phone it returns null unless the body says `phonePart: "above"`,
 *   and then the body draws it above the list. Exactly one row is current at a time (`data-current`, set by `row`).
 * - Spread `everything` (its `children` are its words) on one link.
 *
 * A minimal Home (a body in bodies/<world>.tsx; Heat's adds brackets, a chevron and the take's line):
 *
 *   function MyHome({ world, takes, current, pointer, list, row, everything, part, compact }: PlayObjectHomeProps) {
 *     const { children: words, ...link } = everything;
 *     return (
 *       <div className={"grid h-full min-h-0 overflow-auto overscroll-contain p-6 " + (compact ? "content-start gap-4" : "grid-cols-2 gap-10")}>
 *         {compact && part({ scale: 0.75 })}
 *         <nav {...list}>
 *           <ul className="grid">
 *             {takes.map((t, i) => (
 *               <li key={t.id} className="grid">
 *                 <button {...row(i)} className={"litt-target relative h-control-sm px-3 text-left " + (i === current ? "text-fg" : i === pointer ? "text-fg-muted" : "text-fg-subtle")}>
 *                   {t.title}
 *                 </button>
 *               </li>
 *             ))}
 *           </ul>
 *         </nav>
 *         {!compact && part({ scale: 1.25, className: "self-center" })}
 *         <a {...link} className="text-small underline">{words}</a>
 *       </div>
 *     );
 *   }
 *   export const mine: PlayObjectBody = { name: "mine", shape, rail: false, Body: MyBody, Home: MyHome, phonePart: "above" };
 */
export type PlayObjectHomeProps = {
  /** The world: its name, line and audience, for a heading the body may draw. */
  world: MaterialInfo;
  /** The world's set, in order: a row each, in this order. */
  takes: Take[];
  /** The current row: the one under the keys, or the last the pointer entered, 0 when Index opens (the take just shown
      when Index is reached from a take). Always exactly one. Its part is the live one, and its row the list's tab stop. */
  current: number;
  /** The row under the pointer now, or null (no pointer over the list, or touch after the finger lifts). Entering a row
      also makes it current, so a body draws this only for a hover that differs from the current row's look. */
  pointer: number | null;
  /** Spread on the list's element (a nav): its name ("The set in <world>"), and data-play-index, the mark the checks read. */
  list: HTMLAttributes<HTMLElement> & { "data-play-index": "" };
  /** Spread on row i's button: type, ref, the roving tab stop (tabIndex 0 on the current row, -1 on the rest), the
      keys (Up and Down move, wrapping; Home and End go to the ends), onClick (opens the take), onFocus, onPointerEnter
      and onPointerLeave (current and pointer), data-current on the current row and data-pointer on the row under the
      pointer. Put the className after the spread; never override its handlers. */
  row: (i: number) => ButtonHTMLAttributes<HTMLButtonElement> & { ref: Ref<HTMLButtonElement>; "data-current"?: ""; "data-pointer"?: "" };
  /** Spread on the link to the world's gallery view (#<world>/components). Draw its `children` (its words, "Every
      component, 97 in 12 groups") as the link's text. */
  everything: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; "data-play-everything": ""; children: string };
  /** The current row's part, live, drawn as its wall tile (PreviewContext "tile"), keyed by the take so it remounts
      as the current row moves, and marked data-play-live with a group name ("Poll, live"). `scale` is the size the
      body picks (1, real size, by default; 0.75 for a small slot such as a phone's, up to 1.5 for a wide one), drawn
      with CSS zoom so its box and hit areas scale with it; `className` goes on the outer box (placement, a min height).
      Returns null on a phone unless the body's `phonePart` is "above". Call it once per render. */
  part: (options?: { scale?: PartScale; className?: string }) => ReactNode;
  /** Below sm: the screen is a phone's. With `phonePart` "none" (the default) `part()` is null and the list stands alone,
      since a row opens its take at a touch; with "above" the body draws `part()` above the list. */
  compact: boolean;
};

/** The sizes a body may draw Index's live part at: real size (1), smaller for a narrow slot, larger for a wide one. */
export type PartScale = 0.75 | 1 | 1.25 | 1.5;

export type PlayObjectBody = {
  /** What the object's root says in data-play-object: the world's id, or "bare". */
  name: string;
  /** The screen's size, corners and edge on this body. Compact, it fills what the strip leaves. At desktop widths its
      height is the body's to say: SCREEN_HEIGHT, which fits every world's tallest take, or SHORT_SCREEN_HEIGHT where the
      body's set allows it, so a take reads larger in the screen (Heat; plans/audits/heat-fixes.md, finding 7). */
  shape: (compact: boolean) => string;
  /** Whether the contract draws its rail of the set inside the screen beside a take. A body whose screen holds the take
      alone (Device's recorder: plans/024, breach 17) says false, and the set stays on Index, behind its key and the dial. */
  rail: boolean;
  Body: ComponentType<PlayObjectBodyProps>;
  /** Index's list in the body's own grammar, drawn inside the screen in place of the contract's (see
      PlayObjectHomeProps). A body without one keeps the contract's (HomeView in contract.tsx). */
  Home?: ComponentType<PlayObjectHomeProps>;
  /** On a phone, with its own Home: "none" (the default) leaves the live part out, so the list starts at the top of the
      screen; "above" mounts it, and the body draws it above the list. */
  phonePart?: "none" | "above";
};

/** How tall a landscape screen stands: the window less the top row, the tape and the deck, so the whole object fits the
    window as the components player does, and never under 30rem, where a take's command menu still fits. */
export const SCREEN_HEIGHT = "h-[clamp(30rem,calc(100dvh-22rem),46rem)]";
/** A shorter landscape screen, fixed, so a take covers more of it and a tall window does not shrink the take back to a
    corner of a big screen. For a body whose set has no command menu. Its floor is what a take opens: a take sits in the
    middle of the screen, so Heat's Menu take (its trigger, then a 281px list below it) needs 37rem to keep its list on
    the screen; 38rem leaves it a few pixels. */
export const SHORT_SCREEN_HEIGHT = "h-[38rem]";
/** Below sm the object is the page under the header: the strip, then the screen. */
export const COMPACT_BOX = "-mx-gutter flex h-[calc(100dvh-var(--header-h))] flex-col";
/** Below sm the screen fills what the strip leaves, edge to edge. */
export const COMPACT_SCREEN = "min-h-0 w-full flex-1 rounded-none";
