/**
 * Tag: a small label that names something (Framer, Site), files it under a category (Finance),
 * or reports its status (Live, Review).
 *
 * - Press (a small block): 24px tall at the control radius, a --block with --block-lift (its lit top edge and a short
 *   cast, no drawn line), and the sans at the caption size and the label weight (R8, v0.12), in sentence case, the word
 *   on its face. A plain tag is fg-muted.
 * - A status tag colors its text with the status color, never the fill, and there is no dot.
 *   The label says the status in words, so color never carries it alone.
 * - The status set is the tokens' own: success, warning and danger, plus neutral (fg-subtle).
 *   There is no accent status: the accent is chosen per project, and it does not promise
 *   4.5:1 for caption text.
 * - A hue tag (R7, v0.11) files the thing under a category, so its color carries data: the
 *   hue's tint as the fill, its -text tone for the label (4.5:1 on the tint, checked by
 *   check.mjs), and a hairline of the hue under the top highlight. One hue means one category
 *   in a view. A hue is never a status: a tag that says how something stands takes `status`.
 * - Raised (R3): a value you can lift out of a field (Combobox's picks) is
 *   the press material's block, --block with --block-lift, in --fg like the text typed beside it.
 *   It sits inside the field's control radius, so its corners are that radius less 2px. Forced
 *   colors drops the lift, so it keeps a 1px border. A hue tag files a category and never rises.
 * - Flat, bodies/tag.flat.tsx (proposals/flat-pill.md): the word in a grey pill (--surface-3), nothing raised and no
 *   hairline. A hue tag keeps its tint as a pill, and a raised tag is a --surface-1 pill, so it stands out of the grey
 *   field it sits in.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props and the plain span with
 *   its label. It resolves them once into TagBodyProps and renders the body the material picks (byWorld). PressBody, below,
 *   is the default; bodies/tag.flat.tsx and bodies/tag.device.tsx are the other two, each drawing its own span with data-body.
 * - Device, bodies/tag.device.tsx: the word engraved in capitals on a small plate; a status tag adds a lamp in its status
 *   color, and the word still says the status.
 * - Static: no motion and no states. A tag is a label, not a control, so it never takes
 *   focus. If you need something to press, use Button or a chip.
 */
import type { HTMLAttributes, ReactNode } from "react";
import { byWorld, useMaterial } from "@/motion";
import { TagDeviceBody } from "./bodies/tag.device";
import { TagFlatBody } from "./bodies/tag.flat";

export type TagStatus = "success" | "warning" | "danger" | "neutral";

/** The five data hues, in their fixed order (R7). */
export type TagHue = "blue" | "amber" | "teal" | "violet" | "rose";

const STATUS: Record<TagStatus, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-fg-subtle",
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-blue)_24%,transparent),var(--highlight)]",
  amber: "bg-data-amber-tint text-data-amber-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-amber)_24%,transparent),var(--highlight)]",
  teal: "bg-data-teal-tint text-data-teal-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-teal)_24%,transparent),var(--highlight)]",
  violet: "bg-data-violet-tint text-data-violet-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-violet)_24%,transparent),var(--highlight)]",
  rose: "bg-data-rose-tint text-data-rose-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-rose)_24%,transparent),var(--highlight)]",
};

const PLAIN = "rounded-control bg-block shadow-(--block-lift) ";
/* In a field, 4px in: the field's radius less the inset, never under 2px (foundations.md, Concentric). */
const RAISED = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-block shadow-(--block-lift) forced-colors:border ";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  /** Leave it out for a plain label. Set it for a status: the text takes that color, and the fill never does. */
  status?: TagStatus;
  /** Files the thing under a category with one of the five data hues: a tinted fill and the hue's text tone. Use one hue per category in a view, and never for a status. */
  hue?: TagHue;
  /** Draws a plain tag as a raised block, for a tag you can lift out of a field: Combobox uses it for its picks. Ignored with a hue. */
  raised?: boolean;
  /** The label. Keep it to a word or two, because a tag never wraps. */
  children: ReactNode;
  /** Extra classes for the tag. */
  className?: string;
};

/**
 * What the contract hands a body: the tag resolved once. A body draws the span and keeps the label inside it as given
 * (`label`), says a status in words (the lamp is decoration, aria-hidden), stays 24px tall, takes no focus, and
 * carries data-body on the span.
 */
export type TagBodyProps = {
  status?: TagStatus;
  hue?: TagHue;
  raised: boolean;
  /** The label, truncated when it is plain text. */
  label: ReactNode;
  /** The span's other props. */
  rest: HTMLAttributes<HTMLSpanElement>;
  className: string;
};

const BASE = "inline-flex h-6 max-w-full shrink-0 items-center whitespace-nowrap px-2 text-caption ";

/** Press, the block: today's chip (the flat step), or the raised block for a value in a field. */
function PressBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const ink = status ? STATUS[status] : raised ? "text-fg" : "text-fg-muted";
  return (
    <span
      data-body="press"
      className={BASE + (hue ? "rounded-control " + HUE[hue] : (raised ? RAISED : PLAIN) + ink) + " " + className}
      {...rest}
    >
      {label}
    </span>
  );
}

/** A 24px label at the control radius, in the sans at the label weight. Add `status` to color its text, `hue` to file it under a category, or `raised` for a value in a field. */
export function Tag({ status, hue, raised = false, children, className = "", ...rest }: TagProps) {
  const Body = byWorld(useMaterial(), { press: PressBody, flat: TagFlatBody, device: TagDeviceBody });
  const label = typeof children === "string" || typeof children === "number" ? <span className="min-w-0 truncate">{children}</span> : children;
  return <Body status={status} hue={hue} raised={raised} label={label} rest={rest} className={className} />;
}
