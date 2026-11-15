/**
 * What a body gets from the object's contract (contract.tsx), and what it gives back. A body only draws: it spreads
 * what it is handed and adds no role, key or state of its own (plans/018, Constraints; litt-principles.md, Where a
 * world is free).
 */
import type { ButtonHTMLAttributes, ComponentType, HTMLAttributes, ReactNode } from "react";
import type { MaterialInfo } from "../look";
import type { Take } from "./takes";

export type PlayObjectBodyProps = {
  world: MaterialInfo;
  takes: Take[];
  at: number;
  /** Spread on the element that picks the take, the tape or its stand-in: role="slider" over the takes, its name,
      value and keys (arrows, Page Up and Down, Home, End). One tab stop. */
  selector: HTMLAttributes<HTMLElement>;
  /** Take the hand to take i, as a press or drag along the selector does. Stops Play. */
  pick: (i: number) => void;
  /** Spread on a Previous or Next key, where a body draws one. Out of the tab order: the selector's arrows do this. */
  step: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** A mechanism the hand works, such as a dial, moved this many takes. Stops Play. */
  turn: (by: number) => void;
  /** Spread on the Play key: its name, aria-pressed and onClick. Pressed, the object steps a take every 4s; any hand stops it. */
  play: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-pressed": boolean };
  /** What the readout says: "02 / 95" and the take's title. Spread `props` on the readout: it marks it for the checks
      and hides it from screen readers, since the contract says a hand's change once, in a polite live region. */
  readout: { count: string; title: string; props: HTMLAttributes<HTMLElement> & { "data-play-readout": "" } };
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

/** How tall a landscape screen stands: the window less the deck, as the player is, and never so short that a command menu or a dropdown a take opens runs off it. */
export const SCREEN_HEIGHT = "h-[clamp(38rem,calc(100dvh-var(--header-h)-16rem),48rem)]";
/** Below sm the object is the page under the header: the strip, then the screen. */
export const COMPACT_BOX = "-mx-gutter flex h-[calc(100dvh-var(--header-h))] flex-col";
/** Below sm the screen fills what the strip leaves, edge to edge. */
export const COMPACT_SCREEN = "min-h-0 w-full flex-1 rounded-none";
