/**
 * File drop, the Rack body (proposals/rack.md): a well to drop a file into, and the files as thin rows on one panel.
 *
 * - The area is a well: --tray at the surface radius inside a 1px dashed edge of --line-control, the arrow on a small key
 *   (--block in the 1px outline of --block-lift), then the words and Choose files at the end. Nothing is raised and
 *   nothing casts.
 * - While files are over it the edge turns solid and lights in the ink (--fg, drawn twice as thick without taking any
 *   room: the border and a 1px inner line of the same ink), and the words change to say what a drop will do, so it is never
 *   said by the outline alone. Forced colors keeps a Highlight outline. The hint sits on the well, so it takes the full ink.
 * - Disabled lies flat: a --surface-2 panel in a solid --line hairline, the words in --fg-subtle, no drop and no tab stop.
 * - The list is one panel (--surface-1 inside a 1px --line-strong edge) and a file is a thin row on a --line hairline: the file
 *   icon, its name, its size in tabular figures, Retry and Remove as small ghost keys at the end, and under them the Progress
 *   rail while it uploads and, if it failed, why in --danger. The last row has no hairline under it.
 * - The contract (the drop, the checking, the picker, the alert) is file-drop.tsx's. Nothing animates but colour.
 */
import { Button } from "@/components/button";
import { ArrowUpIcon, FileIcon, RetryIcon, XIcon } from "@/components/icons";
import { Progress } from "@/components/progress";
import { formatSize, type FileDropBodyProps, type FileRowBodyProps } from "../file-drop";

/** Rack, a well with a dashed edge, lit in the ink while a file is over it. */
export function FileDropRackBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="rack"
      className={
        "flex flex-wrap items-center gap-4 rounded-surface border p-4 transition-[background-color,border-color,box-shadow] duration-(--dur-instant) ease-litt sm:flex-nowrap sm:p-5 " +
        (disabled
          ? "cursor-not-allowed border-solid border-line bg-surface-2"
          : dragging
            ? "cursor-pointer border-solid border-fg bg-tray shadow-[inset_0_0_0_1px_var(--fg)] forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
            : "cursor-pointer border-dashed border-line-control bg-tray")
      }
    >
      <span
        aria-hidden="true"
        className={
          "grid size-8 shrink-0 place-items-center rounded-control forced-colors:border " +
          (disabled ? "bg-surface-3 text-fg-disabled" : "bg-block text-fg shadow-(--block-lift)")
        }
      >
        <ArrowUpIcon />
      </span>
      <div className="grid min-w-0 flex-1 basis-40 gap-1">
        <p className={"text-body font-title " + (disabled ? "text-fg-subtle" : "text-fg")}>{words}</p>
        {hint && (
          <p id={hintId} className={"text-small " + (disabled ? "text-fg-subtle" : "text-fg")}>
            {hint}
          </p>
        )}
      </div>
      <Button size="sm" variant="secondary" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
        {chooseLabel}
      </Button>
      {picker}
    </div>
  );
}

/** Rack, a file as a thin row on a hairline: icon, name, size, small keys, and the rail and the reason under them. */
export function FileRowRackBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  return (
    <li data-body="rack" className="flex items-center gap-3 border-b border-line py-2 pr-2 pl-3">
      <FileIcon className="shrink-0 text-fg-muted" />
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
