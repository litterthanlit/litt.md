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
  /** Spread on the element that holds the takes: role="tablist", its name, its arrow keys, Home and End. */
  selector: HTMLAttributes<HTMLElement>;
  /** Spread on take i's control: role="tab", its name, aria-selected, the roving tabIndex, id, aria-controls, onClick. */
  tab: (i: number) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread on a Previous or Next key, where a body draws one. Out of the tab order: the arrows do this. */
  step: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** A mechanism the hand works, such as a dial, moved this many takes: the same as pressing a step key that often. */
  turn: (by: number) => void;
  /** Phase 3. Spread on the Play key: aria-pressed and onClick. */
  play?: ButtonHTMLAttributes<HTMLButtonElement>;
  /** What the readout says: "02 / 06" and the take's title. Spread `props` on the readout: it marks it for the
      checks and hides it from screen readers, since the contract says a change once, in a polite live region. */
  readout: { count: string; title: string; props: HTMLAttributes<HTMLElement> & { "data-play-readout": "" } };
  /** The screen, already framed. Place it once. */
  screen: ReactNode;
  /** Below sm: draw one strip (readout and selector) and no body. */
  compact: boolean;
};

export type PlayObjectBody = {
  /** What the object's root says in data-play-object: the world's id, or "bare". */
  name: string;
  /** The screen's size and corners on this body. Compact, it fills what the strip leaves. */
  shape: (compact: boolean) => string;
  Body: ComponentType<PlayObjectBodyProps>;
};

/** The box every object stands in: the phone's old height, and below sm the whole page under the header. */
export const OBJECT_HEIGHT = "h-[min(52rem,max(40rem,calc(100dvh-var(--header-h)-2rem)))]";
export const COMPACT_BOX = "-mx-gutter flex h-[calc(100dvh-var(--header-h))] flex-col";
/** Below sm the screen fills what the strip leaves, edge to edge, as the phone did. */
export const COMPACT_SCREEN = "min-h-0 w-full flex-1 rounded-none";
