/**
 * Tag: a small label that names something (Framer, Site), files it under a category (Finance),
 * or reports its status (Live, Review).
 *
 * - A label, not a control (v0.13, components.md, Tag): 24px tall at the control radius, a flat
 *   surface-2 fill with no edge and no highlight, and the sans at the caption size (v0.14, from
 *   Nick's lab pick; mono stays for code, keys and numbers) and the interface weight (550). A
 *   button, a field and the selected segment are raised (a hairline and the top highlight); a tag
 *   is not, so it never reads as something to press. A plain tag is fg-muted.
 * - A status tag colors its text with the status color, never the fill, and there is no dot.
 *   The label says the status in words, so color never carries it alone.
 * - The status set is the tokens' own: success, warning and danger, plus neutral (fg-subtle).
 *   There is no accent status: the accent is chosen per project, and it does not promise
 *   4.5:1 for caption text.
 * - A hue tag (P11, v0.11) files the thing under a category, so its color carries data: the
 *   hue's tint as the fill and its -text tone for the label (4.5:1 on the tint, checked by
 *   check.mjs), flat like a plain tag. One hue means one category in a view. A hue is never a status: a tag that says how something stands takes `status`.
 * - Static: no motion and no states. A tag is a label, not a control, so it never takes
 *   focus. If you need something to press, use Button or a chip.
 */
import type { HTMLAttributes, ReactNode } from "react";

export type TagStatus = "success" | "warning" | "danger" | "neutral";

/** The five data hues, in their fixed order (P11). */
export type TagHue = "blue" | "amber" | "teal" | "violet" | "rose";

const STATUS: Record<TagStatus, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-fg-subtle",
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text",
  amber: "bg-data-amber-tint text-data-amber-text",
  teal: "bg-data-teal-tint text-data-teal-text",
  violet: "bg-data-violet-tint text-data-violet-text",
  rose: "bg-data-rose-tint text-data-rose-text",
};

const PLAIN = "bg-surface-2 ";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  /** Leave it out for a plain label. Set it for a status: the text takes that color, and the fill never does. */
  status?: TagStatus;
  /** Files the thing under a category with one of the five data hues: a tinted fill and the hue's text tone. Use one hue per category in a view, and never for a status. */
  hue?: TagHue;
  /** The label. Keep it to a word or two, because a tag never wraps. */
  children: ReactNode;
  /** Extra classes for the tag. */
  className?: string;
};

/** A flat 24px label at the control radius. Add `status` to color its text, or `hue` to file it under a category. */
export function Tag({ status, hue, children, className = "", ...rest }: TagProps) {
  return (
    <span
      className={
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-control px-2 text-caption [font-weight:var(--weight)] " +
        (hue ? HUE[hue] : PLAIN + (status ? STATUS[status] : "text-fg-muted")) +
        " " +
        className
      }
      {...rest}
    >
      {children}
    </span>
  );
}
