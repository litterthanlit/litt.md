/**
 * Composer, the Rack body (proposals/rack.md): a panel field, a light value box set in a panel with its keys on a row
 * under it, as a device section on a rack.
 *
 * - The box is a flat panel (--surface-2) at the surface radius in a 1px --line hairline, 8px of padding. Nothing casts
 *   and nothing is cut: the text sits in a light box (--cut through --field) in the 1px control line (--line-control),
 *   square at the control radius, no shade. The file chips sit at the top of that box, the text under them.
 * - Focus turns the box's line to --focus and adds the focus ring while the text area is focus-visible. Files dragged
 *   over it turn the line --focus and show "Drop to attach" in place of the text. Both change on the instant tier and
 *   nothing moves. Disabled lies flat: the panel on --surface-2 with a --line hairline and --fg-disabled text.
 * - Under the box, on the panel, a row of sm keys (the Button's own look): Attach, the caller's tools, the count in
 *   tabular figures, and Send, the one primary action, the accent fill (R6). While streaming the same key is Stop.
 * - A chip is a small flat key: --block in the 1px outline of --block-lift, 24px high, square at the control radius,
 *   an icon, the name, the size or the percent in tabular figures, and a square remove key. A sent file's chip, with
 *   no remove key, lies flat: --surface-2 with a --line hairline.
 * - Motion: a chip cuts in and out in place on the instant tier, as the part's tiers give Rack; nothing grows or
 *   slides. Send and Stop swap at once.
 * - Forced colors drops shadows, so the panel, the box and the chips get real borders and focus an outline.
 * - The contract (text area, keys, files, count, live regions) is composer.tsx's.
 */
import { AnimatePresence } from "motion/react";
import { Button } from "../button";
import type { ComposerBodyProps, FileChipBodyProps } from "../composer";
import { ArrowUpIcon, FileIcon, PaperclipIcon, StopIcon, XIcon } from "../icons";

const PANEL =
  "group/box relative flex flex-col gap-2 rounded-surface bg-surface-2 p-2 font-field font-normal text-field-ink " +
  "shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border";

const WELL =
  "relative flex flex-col overflow-hidden rounded-control bg-field " +
  "shadow-[inset_0_0_0_1px_var(--field-line)] transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[textarea:focus-visible]:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
  "group-data-[dragging]/box:shadow-[inset_0_0_0_1px_var(--focus)] " +
  "group-data-[disabled]/box:bg-transparent group-data-[disabled]/box:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-[textarea:focus-visible]:outline-2 forced-colors:has-[textarea:focus-visible]:outline-solid forced-colors:has-[textarea:focus-visible]:outline-offset-2";

const AREA =
  "block w-full min-w-0 resize-none overflow-y-hidden bg-transparent px-control-pad-md py-3 font-normal text-body text-field-ink " +
  "outline-none placeholder:text-field-ink-subtle pointer-coarse:text-(length:--control-text-lg) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled";

/* Shown over the text while files are dragged over the box: the same place and size as the placeholder. */
const DROP =
  "pointer-events-none absolute inset-0 bg-field font-field px-control-pad-md py-3 text-body text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) opacity-0 transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-[dragging]/box:opacity-100";

/** Rack, the composer: a light box in a panel, a row of keys under it, Send the one lit key. */
export function ComposerRackBody({ className, disabled, dragging, big, suggestions, drop, chips, label, areaId, area, attach, tools, count, send, hint, status, coarse }: ComposerBodyProps) {
  const grow = "pointer-coarse:h-control-md max-sm:h-control-md";
  return (
    <div data-body="rack" className={["flex min-w-0 flex-col gap-2 max-sm:pb-[env(safe-area-inset-bottom)]", className].join(" ")}>
      {suggestions}

      <div data-dragging={dragging ? "" : undefined} data-disabled={disabled ? "" : undefined} className={PANEL} {...drop}>
        <div className={WELL}>
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
        </div>

        {/* Too narrow for the whole row, Send wraps to its own row at the right rather than running into the tools. */}
        <div className="flex flex-wrap items-center gap-2">
          {attach && (
            <>
              {attach.picker}
              <Button variant="secondary" size={big ? "md" : "sm"} icon={<PaperclipIcon />} aria-label="Attach files" disabled={disabled} className={grow} onClick={attach.onClick} />
            </>
          )}
          {tools && <div className="flex min-w-0 items-center gap-2">{tools}</div>}
          <div className="min-w-0 flex-1" />
          {count && (
            <span
              id={count.id}
              className={
                "shrink-0 px-1 text-caption font-normal tabular-nums transition-colors duration-(--dur-instant) ease-litt " +
                (count.full ? "text-danger" : "text-fg-muted")
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
            icon={send.streaming ? <StopIcon /> : <ArrowUpIcon />}
            aria-label={send.streaming ? "Stop" : "Send"}
            disabled={send.disabled}
            className={grow + " ml-auto"}
            onFocus={send.onFocus}
            onBlur={send.onBlur}
            onClick={send.onClick}
          />
        </div>
      </div>

      {hint && (
        <p id={hint.id} className="text-caption font-normal text-fg-subtle">
          {hint.content}
        </p>
      )}

      {status}
    </div>
  );
}

const REMOVE =
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-none text-fg-subtle " +
  "transition-[color,background-color] duration-(--dur-instant) ease-litt hover:bg-(--block-hover) hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

/** Rack, the chip: a small flat key while it can be removed, a flat label when it cannot. */
export function FileChipRackBody({ name, sizeText, uploading, percent, onRemove, coarse, className }: FileChipBodyProps) {
  return (
    <span
      data-body="rack"
      className={[
        "inline-flex h-6 max-w-full min-w-0 items-center gap-2 rounded-control pl-2 font-normal text-fg",
        onRemove ? "bg-block pr-0 shadow-(--block-lift) forced-colors:border" : "bg-surface-2 pr-2 shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border",
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
