/**
 * What a body gets from the object's contract (contract.tsx), and what it gives back. A body only draws: it spreads
 * what it is handed and adds no role, key or state of its own (plans/018, Constraints; litt-principles.md, Where a
 * world is free).
 */
import type { ButtonHTMLAttributes, ComponentType, HTMLAttributes, ReactNode } from "react";
import type { MaterialInfo } from "../look";
import type { Shelf, Take } from "./takes";

export type PlayObjectBodyProps = {
  world: MaterialInfo;
  takes: Take[];
  /** The takes' groups, in order: a body may draw the selector in segments, one per shelf. */
  shelves: Shelf[];
  /** The take showing, or null on Home: the world's introduction and its index, inside the screen. */
  at: number | null;
  /** Spread on the element that picks the take, the tape or its stand-in: role="slider" over Home (0) and the takes,
      its name, value and keys (Left and Right within a group, Up and Down and Page Up and Down between groups, Home
      for Home, End). One tab stop. */
  selector: HTMLAttributes<HTMLElement>;
  /** Take the hand to take i, as a press or drag along the selector does. Stops Play. */
  pick: (i: number) => void;
  /** Spread on a Previous or Next key, where a body draws one: the next part in the group. Out of the tab order: the
      selector's arrows do this. */
  step: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread on a key for the next or previous group, where a body draws one. Out of the tab order. */
  stepGroup: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** A mechanism the hand works, such as a dial, moved this many parts within the group. Stops Play. */
  turn: (by: number) => void;
  /** Spread on the Play key: its name, aria-pressed and onClick. Pressed, the object steps a take every 4s; any hand stops it. */
  play: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-pressed": boolean };
  /** What the readout says: "02 / 95", the take's group and title ("Home" and no group on Home). Spread `props` on the
      readout: it marks it for the checks and hides it from screen readers, since the contract says a hand's change
      once, in a polite live region. */
  readout: { count: string; group: string | null; title: string; props: HTMLAttributes<HTMLElement> & { "data-play-readout": "" } };
  /** The screen, already framed. Place it once. */
  screen: ReactNode;
  /** Below sm: draw one strip (readout, selector and Play) above the screen, and no body. */
  compact: boolean;
};

export type PlayObjectBody = {
  /** What the object's root says in data-play-object: the world's id, or "bare". */
  name: string;
  /** The screen's size, corners and edge on this body. Compact, it fills what the strip leaves. */
  shape: (compact: boolean) => string;
  Body: ComponentType<PlayObjectBodyProps>;
};

/** How tall a landscape screen stands: the window less the top row, the tape and the deck, so the whole object fits the
    window as the components player does, and never under 30rem, where a take's command menu still fits. */
export const SCREEN_HEIGHT = "h-[clamp(30rem,calc(100dvh-22rem),46rem)]";
/** Below sm the object is the page under the header: the strip, then the screen. */
export const COMPACT_BOX = "-mx-gutter flex h-[calc(100dvh-var(--header-h))] flex-col";
/** Below sm the screen fills what the strip leaves, edge to edge. */
export const COMPACT_SCREEN = "min-h-0 w-full flex-1 rounded-none";
