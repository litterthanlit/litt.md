/**
 * File drop, the Flat body (proposals/worlds.md, Bodies; material.md, 7): ink on paper.
 *
 * - The area is a grey sheet (--cut is --surface-3) with no line and no shade. While files are over it, it deepens a
 *   step toward the ink; under forced colors it keeps a Highlight outline. The icon is a --surface-1 circle on it, and
 *   Choose files is a --surface-1 pill, since a hand touches it.
 * - A file row is its name and size over a Progress rail, with no rule between rows.
 */
import { Button } from "@/components/button";
import { ArrowUpIcon, FileIcon, RetryIcon, XIcon } from "@/components/icons";
import { Progress } from "@/components/progress";
import { formatSize, type FileDropBodyProps, type FileRowBodyProps } from "../file-drop";

/** Flat, a grey sheet: the icon on it, the words and the hint, and Choose files as a pill. */
export function FileDropFlatBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="flat"
      className={
        "flex flex-wrap items-center gap-4 rounded-surface p-4 transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border sm:flex-nowrap sm:p-6 " +
        (disabled
          ? "cursor-not-allowed bg-surface-2 shadow-none"
          : dragging
            ? "bg-[color-mix(in_oklab,var(--surface-3),var(--fg)_6%)] shadow-none forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
            : "cursor-pointer bg-cut shadow-none")
      }
    >
      <span
        aria-hidden="true"
        className={"grid size-8 shrink-0 place-items-center rounded-pill shadow-none " + (disabled ? "bg-surface-2 text-fg-disabled" : "bg-surface-1 text-fg")}
      >
        <ArrowUpIcon />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className={"text-body font-title " + (disabled ? "text-fg-subtle" : "text-fg")}>{words}</p>
        {hint && (
          <p id={hintId} className="text-small text-fg-subtle">
            {hint}
          </p>
        )}
      </div>
      <Button size="sm" variant="secondary" className="enabled:bg-surface-1" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
        {chooseLabel}
      </Button>
      {picker}
    </div>
  );
}

/** Flat, a file row: no rule between rows. */
export function FileRowFlatBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  return (
    <li data-body="flat" className="flex items-start gap-3 border-t-0 py-3">
      <FileIcon className="mt-0.5 shrink-0 text-fg-muted" />
      <div className="grid min-w-0 flex-1 gap-2">
        <p className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 truncate text-caption font-normal text-fg">{name}</span>
          {size !== undefined && <span className="shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{formatSize(size)}</span>}
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
