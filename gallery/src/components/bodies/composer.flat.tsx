/**
 * Composer, Flat's body (proposals/worlds.md, Bodies): a grey field at the surface radius with no outline.
 *
 * - The box is --field (grey under Flat) with no shade and no line. Focus is the ink ring, a drag over it the same ring,
 *   and a disabled one lies on --surface-2. A removable chip is a white bubble on it, a sent one a grey bubble.
 * - Send is the round ink key (the Button's primary under Flat) that lies grey while empty.
 * - The contract (text area, keys, files, count, live regions) is composer.tsx's.
 */
import { AnimatePresence } from "motion/react";
import { Button } from "../button";
import type { ComposerBodyProps, FileChipBodyProps } from "../composer";
import { ArrowUpIcon, FileIcon, PaperclipIcon, StopIcon, XIcon } from "../icons";

const BOX =
  "group/box relative flex flex-col overflow-hidden rounded-surface bg-field font-field font-normal text-field-ink " +
  "shadow-none transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[textarea:focus-visible]:shadow-(--focus-ring) data-[dragging]:shadow-(--focus-ring) " +
  "data-[disabled]:bg-surface-2 data-[disabled]:shadow-none " +
  "forced-colors:border forced-colors:has-[textarea:focus-visible]:outline-2 forced-colors:has-[textarea:focus-visible]:outline-solid forced-colors:has-[textarea:focus-visible]:outline-offset-2";

const AREA =
  "block w-full min-w-0 resize-none overflow-y-hidden bg-transparent px-control-pad-md py-3 font-normal text-body text-field-ink " +
  "outline-none placeholder:text-field-ink-subtle pointer-coarse:text-(length:--control-text-lg) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled";

const DROP =
  "pointer-events-none absolute inset-px bg-field font-field px-[calc(var(--control-pad-md)-1px)] py-[calc(var(--space-3)-1px)] text-body text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) opacity-0 transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-[dragging]/box:opacity-100";

/** Flat, the composer: a grey field, the toolbar inside it, Send the round ink key. */
export function ComposerFlatBody({ className, disabled, dragging, big, suggestions, drop, chips, label, areaId, area, attach, tools, count, send, hint, status, coarse }: ComposerBodyProps) {
  const grow = "pointer-coarse:h-control-md pointer-coarse:w-control-md max-sm:h-control-md max-sm:w-control-md";
  return (
    <div data-body="flat" className={["flex min-w-0 flex-col gap-2 max-sm:pb-[env(safe-area-inset-bottom)]", className].join(" ")}>
      {suggestions}

      <div data-dragging={dragging ? "" : undefined} data-disabled={disabled ? "" : undefined} className={BOX} {...drop}>
        <ul role="list" aria-label="Attached files" className={"hidden flex-wrap has-[li]:flex has-[li]:px-2 has-[li]:pt-2 " + (coarse ? "gap-3" : "gap-2")}>
          <AnimatePresence initial={false}>{chips}</AnimatePresence>
        </ul>

        <div className="relative">
          <label htmlFor={areaId} className="sr-only">
            {label}
          </label>
          <textarea id={areaId} rows={1} className={AREA} {...area} />
          <span aria-hidden="true" className={DROP}>
            Drop to attach
          </span>
        </div>

        <div className="flex items-center gap-2 p-2">
          {attach && (
            <>
              {attach.picker}
              <Button variant="ghost" size={big ? "md" : "sm"} iconOnly aria-label="Attach files" disabled={disabled} className={grow} onClick={attach.onClick}>
                <PaperclipIcon />
              </Button>
            </>
          )}
          {tools && <div className="flex min-w-0 items-center gap-2">{tools}</div>}
          <div className="min-w-0 flex-1" />
          {count && (
            <span
              id={count.id}
              className={
                "shrink-0 px-1 text-caption font-normal tabular-nums transition-colors duration-(--dur-instant) ease-litt " +
                (count.full ? "text-danger" : "text-field-ink-subtle")
              }
            >
              <span className="sr-only">Characters used: </span>
              {count.used} / {count.max}
            </span>
          )}
          <Button
            ref={send.ref}
            variant={send.streaming ? "secondary" : "primary"}
            size={big ? "md" : "sm"}
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
