/**
 * File drop, the Flat body (proposals/worlds.md, Bodies; material.md, 7): ground, then paper, then part.
 *
 * - The area is a sheet of paper on the grey ground (--surface-1, marked litt-paper and data-part="paper", 16px
 *   corners), with no edge and nothing cast, as every Flat card is. On it, centred: an ink circle holding the up arrow,
 *   the words in ink at the title weight, the hint in grey under them, and the choose pill. Inside paper the pill is
 *   the grey bubble (--block), so it reads as the one thing to press.
 * - The words are the contract's: "Drop files here", or "Add files" on a touch screen, where nothing is dragged in.
 *   The pill shows its name ("Choose files", or "Choose a file"), so the name is what is seen (WCAG 2.5.3), and the
 *   hint is its description.
 * - While files are over it the paper is ringed in ink (a 2px outline drawn inside it, the only line Flat makes) and
 *   the words say what a drop will do: "Drop to add these files". The pill steps aside (clipped away, not removed) so
 *   the paper has one sentence. Forced colors keeps the outline in Highlight.
 * - A file is a line of words on its own paper (the list, in the contract): its name in ink and its size in grey,
 *   Retry and Remove as words at the end, and under them the Progress rail while it uploads (an ink fill on grey,
 *   nothing else) and, if it failed, why in --danger. No icon, no rule between rows; space parts them.
 * - Disabled lies flat: a --surface-2 sheet, the circle and the words in --fg-subtle, no drop and no tab stop.
 */
import { Button } from "@/components/button";
import { ArrowUpIcon } from "@/components/icons";
import { Progress } from "@/components/progress";
import { formatSize, type FileDropBodyProps, type FileRowBodyProps } from "@/components/file-drop";

/** Flat, a sheet of paper on the ground: an ink circle, the words, the hint and the choose pill, ringed in ink while a file is over it. */
export function FileDropFlatBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="flat"
      data-part="paper"
      className={
        "litt-paper grid justify-items-center gap-4 rounded-surface p-6 text-center forced-colors:border sm:p-8 " +
        (disabled ? "cursor-not-allowed bg-surface-2" : "cursor-pointer bg-surface-1") +
        (dragging ? " outline-2 -outline-offset-2 outline-solid outline-fg forced-colors:outline-[Highlight]" : "")
      }
    >
      <span
        aria-hidden="true"
        className={"grid size-10 place-items-center rounded-pill forced-colors:border " + (disabled ? "bg-surface-3 text-fg-subtle" : "bg-fg text-surface-1")}
      >
        <ArrowUpIcon />
      </span>
      <div className="grid gap-1">
        <p className={"text-body font-title " + (disabled ? "text-fg-subtle" : "text-fg")}>{words}</p>
        {hint && (
          <p id={hintId} className="text-small text-fg-subtle">
            {hint}
          </p>
        )}
      </div>
      {/* While files are over it the pill is clipped away (sr-only), not removed, so it is still the button that was there. */}
      <span className={dragging ? "sr-only" : "contents"}>
        <Button size="sm" variant="secondary" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
          {chooseLabel}
        </Button>
      </span>
      {picker}
    </div>
  );
}

/** Flat, a file as a line of words: name in ink, size in grey, Retry and Remove as words, the rail and the reason under. */
export function FileRowFlatBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  return (
    <li data-body="flat" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2">
      <p className="flex min-w-0 items-baseline gap-3">
        <span className="min-w-0 truncate text-small font-normal text-fg">{name}</span>
        {size !== undefined && <span className="shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{formatSize(size)}</span>}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {error && onRetry && (
          <Button size="sm" variant="ghost" aria-label={`Retry ${name}`} onClick={onRetry}>
            Retry
          </Button>
        )}
        {onRemove && (
          <Button size="sm" variant="ghost" aria-label={uploading ? `Cancel ${name}` : `Remove ${name}`} onClick={onRemove}>
            {uploading ? "Cancel" : "Remove"}
          </Button>
        )}
      </div>
      {(uploading || error) && (
        <Progress
          className="col-span-2"
          label={`Uploading ${name}`}
          hideLabel
          value={progress ?? 0}
          status={error ? "failed" : "active"}
          message={error}
        />
      )}
    </li>
  );
}
