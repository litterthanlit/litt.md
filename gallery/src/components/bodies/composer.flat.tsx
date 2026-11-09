/**
 * Composer, Flat's body (proposals/worlds.md, Bodies): ink on paper. One grey pill that grows with the text.
 *
 * - The box is --field (grey under Flat) with no shade, no line and no plate: a pill whose corners stop at half a
 *   one-line control, so it is a capsule while it holds a line or two and a soft block when it holds a page. Nothing
 *   is cut into it and nothing stands on it.
 * - Send is the round ink key (the Button's primary under Flat) at the end of the text's last line, so it rides down
 *   as the pill grows. It lies grey while the field is empty. Stop is the grey circle with a square.
 * - The tools are grey words (ghost buttons, no fill until the hand arrives) on a line under the text, and that
 *   line is there only when there is an Attach or a tool to put on it. A removable chip is a white bubble on the
 *   pill, a sent one a grey bubble. The count is a grey word at the end of that line.
 * - Focus is the ink ring, a drag over it the same ring, and a disabled one lies on --surface-2.
 * - The contract (text area, keys, files, count, live regions) is composer.tsx's.
 */
import { AnimatePresence } from "motion/react";
import { Button } from "../button";
import type { ComposerBodyProps, FileChipBodyProps } from "../composer";
import { ArrowUpIcon, FileIcon, PaperclipIcon, StopIcon, XIcon } from "../icons";

const BOX =
  "group/box relative flex flex-col overflow-hidden rounded-[min(var(--radius-control),calc(var(--control-md)/2))] bg-field font-field font-normal text-field-ink " +
  "shadow-none transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[textarea:focus-visible]:shadow-(--focus-ring) data-[dragging]:shadow-(--focus-ring) " +
  "data-[disabled]:bg-surface-2 data-[disabled]:shadow-none " +
  "forced-colors:border forced-colors:has-[textarea:focus-visible]:outline-2 forced-colors:has-[textarea:focus-visible]:outline-solid forced-colors:has-[textarea:focus-visible]:outline-offset-2";

/* The text starts a little past the pill's curve, so the words clear the round end. */
const AREA =
  "block w-full min-w-0 resize-none overflow-y-hidden bg-transparent pl-[calc(var(--control-pad-md)+4px)] pr-1 py-1 font-normal text-body text-field-ink " +
  "outline-none placeholder:text-field-ink-subtle pointer-coarse:py-2.5 pointer-coarse:text-(length:--control-text-lg) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled";

const DROP =
  "pointer-events-none absolute inset-0 bg-field font-field pl-[calc(var(--control-pad-md)+4px)] pr-1 py-1 text-body text-field-ink-subtle " +
  "pointer-coarse:py-2.5 pointer-coarse:text-(length:--control-text-lg) opacity-0 transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-[dragging]/box:opacity-100";

/** Flat, the composer: a grey pill, the text and the ink Send in one line, grey words for the tools under it. */
export function ComposerFlatBody({ className, disabled, dragging, big, suggestions, drop, chips, label, areaId, area, attach, tools, count, send, hint, status, coarse }: ComposerBodyProps) {
  const tall = "pointer-coarse:h-control-md max-sm:h-control-md";
  const grow = tall + " pointer-coarse:w-control-md max-sm:w-control-md";
  const size = big ? "md" : "sm";
  return (
    <div data-body="flat" className={["flex min-w-0 flex-col gap-2 max-sm:pb-[env(safe-area-inset-bottom)]", className].join(" ")}>
      {suggestions}

      <div data-dragging={dragging ? "" : undefined} data-disabled={disabled ? "" : undefined} className={BOX} {...drop}>
        <ul role="list" aria-label="Attached files" className={"hidden flex-wrap has-[li]:flex has-[li]:px-2 has-[li]:pt-2 " + (coarse ? "gap-3" : "gap-2")}>
          <AnimatePresence initial={false}>{chips}</AnimatePresence>
        </ul>

        <div className="flex items-end gap-2 p-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor={areaId} className="sr-only">
              {label}
            </label>
            <textarea id={areaId} rows={1} className={AREA} {...area} />
            <span aria-hidden="true" className={DROP}>
              Drop to attach
            </span>
          </div>
          <Button
            ref={send.ref}
            variant={send.streaming ? "secondary" : "primary"}
            size={size}
            iconOnly
            aria-label={send.streaming ? "Stop" : "Send"}
            disabled={send.disabled}
            className={grow}
            onFocus={send.onFocus}
            onBlur={send.onBlur}
            onClick={send.onClick}
          >
            {send.streaming ? <StopIcon /> : <ArrowUpIcon />}
          </Button>
        </div>

        {(attach || tools || count) && (
          <div className="flex items-center gap-1 px-2 pb-2">
            {attach && (
              <>
                {attach.picker}
                <Button variant="ghost" size={size} icon={<PaperclipIcon />} aria-label="Attach files" disabled={disabled} className={tall} onClick={attach.onClick}>
                  Attach
                </Button>
              </>
            )}
            {tools && <div className="flex min-w-0 items-center gap-1">{tools}</div>}
            <div className="min-w-0 flex-1" />
            {count && (
              <span
                id={count.id}
                className={
                  "shrink-0 px-2 text-caption font-normal tabular-nums transition-colors duration-(--dur-instant) ease-litt " +
                  (count.full ? "text-danger" : "text-field-ink-subtle")
                }
              >
                <span className="sr-only">Characters used: </span>
                {count.used} / {count.max}
              </span>
            )}
          </div>
        )}
      </div>

      {hint && (
        <p id={hint.id} className="px-control-pad-md text-caption font-normal text-fg-subtle">
          {hint.content}
        </p>
      )}

      {status}
    </div>
  );
}

const REMOVE =
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-control text-fg-subtle " +
  "transition-[color] duration-(--dur-instant) ease-litt hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

/** Flat, the chip: a white bubble while it can be removed, a grey one when it cannot. */
export function FileChipFlatBody({ name, sizeText, uploading, percent, onRemove, coarse, className }: FileChipBodyProps) {
  return (
    <span
      data-body="flat"
      className={[
        "inline-flex h-8 max-w-full min-w-0 items-center gap-2 rounded-control pl-2 font-normal text-fg",
        onRemove ? "bg-surface-1 pr-1 shadow-(--block-lift) forced-colors:border" : "bg-surface-3 pr-2 shadow-none",
        className,
      ].join(" ")}
    >
      <FileIcon className="shrink-0 text-fg-muted" />
      <span className="min-w-0 truncate text-caption font-normal text-fg">{name}</span>
      {uploading ? (
        <>
          <span className="sr-only">, uploading {percent} percent</span>
          <span aria-hidden="true" className="min-w-[4ch] shrink-0 text-right text-caption font-normal tabular-nums text-fg-subtle">
            {percent}%
          </span>
        </>
      ) : (
        sizeText !== null && (
          <>
            <span className="sr-only">, </span>
            <span className="shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{sizeText}</span>
          </>
        )
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          className={REMOVE + (coarse ? " before:absolute before:-inset-2.5" : "")}
          onClick={onRemove}
        >
          <XIcon />
        </button>
      )}
    </span>
  );
}
