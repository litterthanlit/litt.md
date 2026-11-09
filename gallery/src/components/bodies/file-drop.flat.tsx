/**
 * File drop, the Flat body (proposals/worlds.md, Bodies; material.md, 7): ink on paper.
 *
 * - The area is a grey sheet (--cut is --surface-3) with one sentence on it, "Drop files or choose", the last word a
 *   pill (the one shape for what a hand touches) that opens the picker. No arrow, no block, no line, no shade. Under
 *   it the hint in grey words. On a touch screen the sentence is the pill alone, "Add files".
 * - While files are over it the sheet is ringed in ink (a 2px outline drawn inside the sheet, the only line Flat
 *   makes) and the sentence says what a drop will do: "Drop to add these files". The pill steps aside (clipped away,
 *   not removed) so the sheet has one sentence, not two. Forced colors keeps the outline in Highlight.
 * - Choose is a real button named by the contract ("Choose files", with the hint as its description): the visible
 *   word is inside the name, so a voice user who says "choose" reaches it.
 * - A file is a line of words: its name in ink and its size in grey, Retry and Remove as words in pills at the
 *   end, and under them the Progress rail while it uploads (an ink fill on grey, nothing else) and, if it failed,
 *   why in --danger. No icon, no rule between rows; space parts them.
 * - Disabled lies flat: a --surface-2 sheet, the sentence in --fg-subtle, no drop and no tab stop.
 */
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { useDevice } from "@/motion";
import { formatSize, type FileDropBodyProps, type FileRowBodyProps } from "../file-drop";

/** Flat, a grey sheet with one sentence: "Drop files or choose", ringed in ink while a file is over it. */
export function FileDropFlatBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  const { coarse } = useDevice();
  /* While files are over it the pill is clipped away (sr-only), not removed, so it is still the button that was there. */
  const pill = (
    <span className={dragging ? "sr-only" : "contents"}>
      <Button size="sm" variant="secondary" className="enabled:bg-surface-1" disabled={disabled} aria-label={chooseLabel} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
        {coarse ? "Add files" : "choose"}
      </Button>
    </span>
  );
  return (
    <div
      {...area}
      data-body="flat"
      className={
        "grid justify-items-center gap-2 rounded-surface p-6 text-center forced-colors:border sm:p-8 " +
        (disabled ? "cursor-not-allowed bg-surface-2" : "cursor-pointer bg-cut") +
        (dragging ? " outline-2 -outline-offset-2 outline-solid outline-fg forced-colors:outline-[Highlight]" : "")
      }
    >
      <p className={"flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-body font-title " + (disabled ? "text-fg-subtle" : "text-fg")}>
        {dragging ? (
          words
        ) : coarse ? null : (
          "Drop files or"
        )}
        {pill}
      </p>
      {hint && (
        <p id={hintId} className="text-small text-fg-subtle">
          {hint}
        </p>
      )}
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
