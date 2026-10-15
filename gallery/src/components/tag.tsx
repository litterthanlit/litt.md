/**
 * Tag: a small label that names something (Framer, Site) or reports its status (Live, Review).
 *
 * - The look is the selected segment's (components.md, Tag): 24px tall at the control radius,
 *   a surface-1 fill with an inset line hairline and the top highlight, and Geist Mono at the
 *   caption size. A plain tag is fg-muted. Mono marks a tag as data about the thing, not the
 *   thing itself.
 * - A status tag colors its text with the status color, never the fill, and there is no dot.
 *   The label says the status in words, so color never carries it alone.
 * - The status set is the tokens' own: success, warning and danger, plus neutral (fg-subtle).
 *   There is no accent status: the accent is chosen per project, and it does not promise
 *   4.5:1 for caption text.
 * - Static: no motion and no states. A tag is a label, not a control, so it never takes
 *   focus. If you need something to press, use Button or a chip.
 */
import type { HTMLAttributes, ReactNode } from "react";

export type TagStatus = "success" | "warning" | "danger" | "neutral";

const STATUS: Record<TagStatus, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-fg-subtle",
};

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  /** Leave it out for a plain label. Set it for a status: the text takes that color, and the fill never does. */
  status?: TagStatus;
  /** The label. Keep it to a word or two, because a tag never wraps. */
  children: ReactNode;
  /** Extra classes for the tag. */
  className?: string;
};

/** A 24px mono label at the control radius. Add `status` to color its text. */
export function Tag({ status, children, className = "", ...rest }: TagProps) {
  return (
    <span
      className={
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-control bg-surface-1 px-2 font-mono text-caption " +
        "shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] " +
        (status ? STATUS[status] : "text-fg-muted") +
        " " +
        className
      }
      {...rest}
    >
      {children}
    </span>
  );
}
