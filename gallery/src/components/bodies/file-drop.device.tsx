/**
 * File drop, the Device body (proposals/worlds.md, Bodies; material.md, 8): a slot in the body, with a key to choose.
 *
 * - The area is an engraved legend (litt-legend: capitals, tracked, --engrave) over a slot: LCD glass (--field,
 *   --field-shade, the mono) set in a bezel well (--tray, --tray-shade) with the hint on it, and a Choose key (the
 *   Button's, --block on its 2px skirt) beside it. Nothing is framed round them: the body is the page.
 * - Dragging: the legend changes to say what a drop will do, the bezel takes the focus ring, the glass brightens to
 *   its ink and a lamp at its end lights (--field-ink with a little glow, never the accent, R6). The lamp never says
 *   it alone: the words do. They switch in three steps on the instant tier, never a fade.
 * - Disabled lies flat: a surface-2 bezel with a hairline, dimmed glass, the legend in --fg-subtle because it still
 *   says something, and no drop and no tab stop.
 * - A file row is a line of LCD glass: the file icon, its name in the mono and, at its end, its size; while it uploads
 *   the size gives way to a row of segments that light in steps and the percent. Retry and Remove are real keys on the
 *   body beside it (a ghost button would not read on dark glass). A failure keeps its lit segments where they
 *   stopped, in --danger, and says why on a second line of glass under it, beside a lamp in --danger.
 * - The segments are decoration: the row's role="progressbar" is named "Uploading <file>", carries the percent as its
 *   value text, and its end is said once in a polite status, as Progress does.
 * - Forced colors drops shadows and fills, so the bezel and the glass get real borders and a lit lamp or segment is
 *   a system highlight.
 * - The contract (the drop, the checking, the picker, the alert) is file-drop.tsx's.
 */
import { useId, type CSSProperties } from "react";
import { Button } from "@/components/button";
import { FileIcon, RetryIcon, XIcon } from "@/components/icons";
import { formatSize, type FileDropBodyProps, type FileRowBodyProps } from "../file-drop";

/* A change switches in place in three even steps on the instant tier, as a display's segments light. */
const STEPS = "steps(3, end)";
const stepped: CSSProperties = {
  transitionProperty: "background-color, box-shadow, color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}`,
};

/** Device, the slot: an engraved legend over LCD glass in a bezel, and a Choose key. */
export function FileDropDeviceBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="device"
      className={"grid gap-2 " + (disabled ? "cursor-not-allowed" : "cursor-pointer")}
    >
      <p className={"litt-legend text-caption font-title " + (disabled ? "text-fg-subtle" : "text-fg")} style={stepped}>
        {words}
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <div
          className={
            "flex min-h-control-md min-w-48 flex-1 basis-48 rounded-control p-0.5 forced-colors:border " +
            (disabled
              ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]"
              : dragging
                ? "bg-tray shadow-[var(--tray-shade),var(--focus-ring)] forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
                : "bg-tray shadow-(--tray-shade)")
          }
          style={stepped}
        >
          <div
            className={
              "relative flex min-w-0 flex-1 items-center rounded-[calc(var(--radius-control)-2px)] py-1 pr-6 pl-3 font-field text-caption forced-colors:border " +
              (disabled ? "bg-transparent text-fg-subtle" : "bg-field shadow-(--field-shade) " + (dragging ? "text-field-ink" : "text-field-ink-subtle"))
            }
            style={stepped}
          >
            {hint && (
              <p id={hintId} className="min-w-0">
                {hint}
              </p>
            )}
            <span
              aria-hidden="true"
              className={
                "absolute top-1/2 right-2 size-1.5 -translate-y-1/2 rounded-pill forced-colors:border " +
                (dragging && !disabled ? "bg-field-ink shadow-[0_0_6px_var(--field-ink)] forced-colors:bg-[Highlight]" : "bg-field-line forced-colors:bg-transparent")
              }
              style={stepped}
            />
          </div>
        </div>
        <Button size="md" variant="secondary" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
          {chooseLabel}
        </Button>
      </div>
      {picker}
    </div>
  );
}

/* Twenty segments; the share lights that many of them. */
const SEGMENTS = 20;

/** Device, a file row: a line of LCD glass, its upload as segments lighting in steps, and Retry and Remove as keys. */
export function FileRowDeviceBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  const labelId = useId();
  const messageId = useId();
  const showing = uploading || !!error;
  const share = Math.max(0, Math.min(1, (progress ?? 0) / 100));
  const lit = Math.round(share * SEGMENTS);
  const reading = error ? "Failed" : `${Math.round(share * 100)}%`;
  return (
    <li data-body="device" className="grid gap-1.5">
      <div className="flex items-start gap-2">
        <div className="flex min-h-8 min-w-0 flex-1 items-center gap-3 rounded-control bg-field px-4 font-field text-caption text-field-ink shadow-(--field-shade) forced-colors:border pointer-coarse:min-h-11">
          <FileIcon className="shrink-0 text-field-ink-subtle" />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {showing && (
            <>
              <span id={labelId} className="sr-only">{`Uploading ${name}`}</span>
              <div
                role="progressbar"
                aria-labelledby={labelId}
                aria-describedby={error ? messageId : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(share * 100)}
                aria-valuetext={reading}
                className="grid h-2 w-16 shrink-0 grid-flow-col auto-cols-fr gap-px sm:w-24"
              >
                {Array.from({ length: SEGMENTS }, (_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={
                      "h-full forced-colors:border " +
                      (i < lit ? (error ? "bg-danger forced-colors:bg-[Highlight]" : "bg-field-ink forced-colors:bg-[Highlight]") : "bg-field-line forced-colors:bg-transparent")
                    }
                    style={stepped}
                  />
                ))}
              </div>
            </>
          )}
          <span className="shrink-0 text-right tabular-nums text-field-ink-subtle">{showing ? reading : size !== undefined ? formatSize(size) : ""}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {error && onRetry && (
            <Button size="sm" variant="secondary" iconOnly aria-label={`Retry ${name}`} onClick={onRetry}>
              <RetryIcon />
            </Button>
          )}
          {onRemove && (
            <Button size="sm" variant="secondary" iconOnly aria-label={uploading ? `Cancel ${name}` : `Remove ${name}`} onClick={onRemove}>
              <XIcon />
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p id={messageId} className="flex items-center gap-3 rounded-control bg-field py-1.5 pr-4 pl-4 font-field text-caption text-field-ink shadow-(--field-shade) forced-colors:border">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-pill bg-danger forced-colors:border" />
          <span>{error}</span>
        </p>
      )}
      <span role="status" className="sr-only">
        {error ? `Uploading ${name}: failed.` : ""}
      </span>
    </li>
  );
}
