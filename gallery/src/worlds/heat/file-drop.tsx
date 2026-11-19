/**
 * File drop, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a sharp square drop bay framed by corner
 * brackets and topped with diagonal hazard stripes, and a standings-like slab for uploaded files.
 *
 * - Area: `rounded-none border border-line-strong bg-canvas` with a 6px diagonal hazard-stripe top band and four 10px
 *   corner brackets (`text-fg` at rest, snapping to `text-accent-text` on hover or drag).
 * - While files are dragged over, the bay fills with `--accent-tint`, its border steps to `--accent-text`, and the
 *   words change to confirm the drop (never by color alone).
 * - Disabled lies flat on `--surface-2` with `--line`, muted words, and no corner brackets.
 * - FileRowHeatBody: flat dark row separated by 1px `--line` rules, square file badge, tabular mono size, Heat's
 *   16-dash amber Progress while uploading, and square Retry/Remove buttons.
 * - The contract (drop count, validation, picker, alert) stays in file-drop.tsx.
 */
import { Button } from "@/components/button";
import { ArrowUpIcon, FileIcon, RetryIcon, XIcon } from "@/components/icons";
import { Progress } from "@/components/progress";
import { formatSize, type FileDropBodyProps, type FileRowBodyProps } from "@/components/file-drop";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const BRACKETS =
  "pointer-events-none absolute -inset-px bg-no-repeat transition-colors duration-(--dur-instant) ease-litt " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:10px_2px,2px_10px,10px_2px,2px_10px,10px_2px,2px_10px,10px_2px,2px_10px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Heat: a striped square drop bay with corner brackets that snap amber under hover or drag. */
export function FileDropHeatBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="heat"
      className={
        "group relative flex flex-col rounded-none border transition-[background-color,border-color] duration-(--dur-instant) ease-litt forced-colors:border " +
        (disabled
          ? "cursor-not-allowed border-line bg-surface-2"
          : dragging
            ? "cursor-pointer border-accent-text bg-accent-tint forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
            : "cursor-pointer border-line-strong bg-canvas hover:border-fg")
      }
    >
      {!disabled && (
        <span
          aria-hidden="true"
          className={BRACKETS + (dragging ? " text-accent-text" : " text-fg group-hover:text-accent-text")}
        />
      )}
      <div aria-hidden="true" className={"h-2 border-b border-line bg-surface-1 " + STRIPES} />
      <div className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
        <span
          aria-hidden="true"
          className={
            "grid size-8 shrink-0 place-items-center rounded-none border forced-colors:border " +
            (disabled
              ? "border-line bg-surface-3 text-fg-disabled"
              : dragging
                ? "border-accent-text bg-canvas text-accent-text"
                : "border-line-strong bg-block text-accent-text")
          }
        >
          <ArrowUpIcon />
        </span>
        <div className="grid min-w-0 flex-1 basis-40 gap-1">
          <p className={"text-body font-title " + (disabled ? "text-fg-subtle" : dragging ? "text-accent-text" : "text-fg")}>{words}</p>
          {hint && (
            <p id={hintId} className={"text-small " + (disabled ? "text-fg-subtle" : "text-fg-muted")}>
              {hint}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
          {chooseLabel}
        </Button>
        {picker}
      </div>
    </div>
  );
}

/** Heat: a crisp flat file row on a standings-style slab. */
export function FileRowHeatBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  return (
    <li
      data-body="heat"
      className="flex items-center gap-3 border-b border-line px-3 py-2.5 transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-1 last:border-b-0"
    >
      <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center border border-line bg-block text-fg-muted">
        <FileIcon />
      </span>
      <div className="grid min-w-0 flex-1 gap-2">
        <p className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 truncate text-caption font-title text-fg">{name}</span>
          {size !== undefined && <span className="shrink-0 font-mono text-caption tabular-nums font-normal text-fg-subtle">{formatSize(size)}</span>}
        </p>
        {(uploading || error) && <Progress label={`Uploading ${name}`} hideLabel value={progress ?? 0} status={error ? "failed" : "active"} message={error} />}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {error && onRetry && (
          <Button size="sm" variant="ghost" iconOnly aria-label={`Retry ${name}`} onClick={onRetry}>
            <RetryIcon />
          </Button>
        )}
        {onRemove && (
          <Button size="sm" variant="ghost" iconOnly aria-label={uploading ? `Cancel ${name}` : `Remove ${name}`} onClick={onRemove}>
            <XIcon />
          </Button>
        )}
      </div>
    </li>
  );
}
