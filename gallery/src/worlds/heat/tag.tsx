/**
 * Tag, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a sharp square telemetry badge.
 *
 * - Square corners (`rounded-none`), zero cast, crisp 1px edges.
 * - Status tags sit in a flat dark cell (`bg-block border border-line`) with a 4px square status indicator bar before
 *   the word (color never carries state alone).
 * - Hue tags use the hue's tint, text tone and 40% mark edge; plain and raised tags sit flat in `--surface-2` / `--block`.
 * - Forced colors keeps borders on every chip.
 */
import type { TagBodyProps, TagHue, TagStatus } from "@/components/tag";

const STATUS: Record<TagStatus, { text: string; bar: string }> = {
  success: { text: "text-success", bar: "bg-success" },
  warning: { text: "text-warning", bar: "bg-warning" },
  danger: { text: "text-danger", bar: "bg-danger" },
  neutral: { text: "text-fg-subtle", bar: "bg-fg-subtle" },
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-blue)_40%,transparent)]",
  amber: "bg-data-amber-tint text-data-amber-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-amber)_40%,transparent)]",
  teal: "bg-data-teal-tint text-data-teal-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-teal)_40%,transparent)]",
  violet: "bg-data-violet-tint text-data-violet-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-violet)_40%,transparent)]",
  rose: "bg-data-rose-tint text-data-rose-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-rose)_40%,transparent)]",
  sky: "bg-data-sky-tint text-data-sky-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-sky)_40%,transparent)]",
  bubblegum: "bg-data-bubblegum-tint text-data-bubblegum-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-bubblegum)_40%,transparent)]",
  sun: "bg-data-sun-tint text-data-sun-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-sun)_40%,transparent)]",
};

const PLAIN = "border border-line bg-surface-2 text-fg-muted";
const RAISED = "border border-line-strong bg-block text-fg";

/** Heat: a sharp square telemetry chip. */
export function TagHeatBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const statusLook = status ? STATUS[status] : null;
  const look = hue ? HUE[hue] : statusLook ? "border border-line bg-block " + statusLook.text : raised ? RAISED : PLAIN;
  return (
    <span
      data-body="heat"
      className={"inline-flex h-6 max-w-full shrink-0 items-center gap-1.5 rounded-none whitespace-nowrap px-2 text-caption font-title forced-colors:border " + look + " " + className}
      {...rest}
    >
      {statusLook && <span aria-hidden="true" className={"size-1.5 shrink-0 forced-colors:bg-[CanvasText] " + statusLook.bar} />}
      <span>{label}</span>
    </span>
  );
}
