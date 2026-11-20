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
  /** Spread on the element that picks the take, the tape or its stand-in: role="slider" over Home (0) and the takes,
      its name, value and keys (Right and Down to the next, Left and Up to the previous, wrapping through Index; the
      Home key for Index, End for the last). One tab stop. */
  selector: HTMLAttributes<HTMLElement>;
  /** Take the hand to take i, as a press or drag along the selector does. Stops Play. */
  pick: (i: number) => void;
  /** Spread on a Previous or Next key, where a body draws one. Out of the tab order: the selector's arrows do this. */
  step: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread on a key that goes to Index, where a body draws one, as an iPod's Menu does. Its visible word is Index (the
      top row's Home is the way out of the world, and no other control may share that name). Out of the tab order: the
      top row's Index and the selector's Home key do this. */
  index: ButtonHTMLAttributes<HTMLButtonElement>;
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
 * What a body that draws Index's list itself gets (plans/audits/heat-fixes.md, finding 1). The contract still owns the
 * list, its order, its keys and what it opens; the body draws the rows in its own grammar and places the live part.
 */
export type PlayObjectHomeProps = {
  world: MaterialInfo;
  /** The world's set, in order: a row each. */
  takes: Take[];
  /** The row under the keys or the pointer: its part is the one live beside the list. */
  current: number;
  /** Spread on the list's element (a nav): its name, and the mark the checks read. */
  list: HTMLAttributes<HTMLElement> & { "data-play-index": "" };
  /** Spread on row i's button: one tab stop for the list (the current row), Up and Down to move (wrapping), Home and
      End to the ends, Enter or a press to open the take, and the pointer or focus making it current. Its name is the
      take's title, so the row holds the title as its text and draws everything else aria-hidden. */
  row: (i: number) => ButtonHTMLAttributes<HTMLButtonElement> & { ref: Ref<HTMLButtonElement>; "data-current"?: "" };
  /** Spread on the link to the world's gallery view, with its words. */
  everything: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; "data-play-everything": ""; children: string };
  /** The current row's part, live, drawn as its wall tile (PreviewContext "tile"). Place it once; the contract marks it
      data-play-live. */
  part: ReactNode;
  /** Below sm: the screen is a phone's, and a body may leave the live part out, since a row opens its take at a touch. */
  compact: boolean;
};

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
  /** Index's list in the body's own grammar, drawn inside the screen in place of the contract's. A body without one
      keeps the contract's (every world but Heat). */
  Home?: ComponentType<PlayObjectHomeProps>;
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
