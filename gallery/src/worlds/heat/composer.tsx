/**
 * Composer, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a square black command slab banded at the
 * top with diagonal hazard stripes and framed by four corner brackets that snap to amber under focus or file drag.
 *
 * - Outer slab: `rounded-none border border-line-strong bg-canvas`, topped by a 6px hazard-stripe band; four 8px corner
 *   brackets rest in `--fg` and snap to `--accent-text` while the field is focused or dragging files.
 * - Field: dark `--field` interior with a crisp `›` command chevron beside the growing textarea, and an instant
 *   `"Drop to attach"` overlay when files are dragged over.
 * - Toolbar: flat `--surface-1` foot holding square Heat keys (Attach, caller tools, tabular character count, and Send /
 *   Stop). Disabled lies flat on `--surface-2` with `--line` and `--fg-disabled`.
 * - FileChipHeatBody: sharp square dark cell (`bg-block border border-line`) with a 2px amber left edge on removable
 *   files, tabular upload progress in `--accent-text`, and a square remove key.
 * - The contract (text area, keys, files, count, live regions) stays in composer.tsx.
 */
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/button";
import type { ComposerBodyProps, FileChipBodyProps } from "@/components/composer";
import { ArrowUpIcon, FileIcon, PaperclipIcon, StopIcon, XIcon } from "@/components/icons";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const BRACKETS =
  "pointer-events-none absolute -inset-px bg-no-repeat text-fg " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "group-has-[textarea:focus-visible]/box:text-accent-text group-data-[dragging]/box:text-accent-text " +
  "group-data-[disabled]/box:opacity-0 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const SLAB =
  "group/box relative flex flex-col rounded-none border border-line-strong bg-canvas font-field font-normal text-field-ink " +
  "transition-[border-color] duration-(--dur-instant) ease-litt " +
  "has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-focus " +
  "data-[dragging]:border-accent-text " +
  "data-[disabled]:border-line data-[disabled]:bg-surface-2 " +
  "forced-colors:border";

const WELL =
  "relative flex flex-col border-b border-line bg-field " +
  "group-data-[dragging]/box:bg-accent-tint group-data-[disabled]/box:bg-transparent";

const AREA =
  "block w-full min-w-0 resize-none overflow-y-hidden bg-transparent py-3 pr-control-pad-md pl-1 font-normal text-body text-field-ink " +
  "outline-none placeholder:text-field-ink-subtle pointer-coarse:text-(length:--control-text-lg) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled";

const DROP =
  "pointer-events-none absolute inset-0 flex items-center bg-accent-tint px-control-pad-md text-body font-title text-accent-text " +
  "pointer-coarse:text-(length:--control-text-lg) opacity-0 transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-[dragging]/box:opacity-100";

/** Heat, the composer: a striped black command slab framed by corner brackets with a flat key toolbar. */
export function ComposerHeatBody({ className, disabled, dragging, big, suggestions, drop, chips, label, areaId, area, attach, tools, count, send, hint, status, coarse }: ComposerBodyProps) {
  const grow = "pointer-coarse:h-control-md max-sm:h-control-md";
  return (
    <div data-body="heat" className={["flex min-w-0 flex-col gap-2 max-sm:pb-[env(safe-area-inset-bottom)]", className].join(" ")}>
      {suggestions}

      <div data-dragging={dragging ? "" : undefined} data-disabled={disabled ? "" : undefined} className={SLAB} {...drop}>
        <span aria-hidden="true" className={BRACKETS} />
        <div aria-hidden="true" className={"h-2 border-b border-line bg-surface-1 " + STRIPES} />

        <div className={WELL}>
          <ul role="list" aria-label="Attached files" className={"hidden flex-wrap has-[li]:flex has-[li]:px-2 has-[li]:pt-2 " + (coarse ? "gap-3" : "gap-1.5")}>
            <AnimatePresence initial={false}>{chips}</AnimatePresence>
          </ul>

          <div className="relative flex items-start">
            <span aria-hidden="true" className={"shrink-0 py-3 pl-3 text-body font-title select-none " + (disabled ? "text-fg-disabled" : "text-accent-text")}>
              ›
            </span>
            <label htmlFor={areaId} className="sr-only">
              {label}
            </label>
            <textarea id={areaId} rows={1} className={AREA} {...area} />
            <span aria-hidden="true" className={DROP}>
              Drop to attach
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-surface-1 p-2 group-data-[disabled]/box:bg-transparent">
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
                "shrink-0 px-1 font-mono text-caption font-normal tabular-nums transition-colors duration-(--dur-instant) ease-litt " +
                (count.full ? "text-danger" : "text-accent-text")
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
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-none text-fg-muted " +
  "transition-[color,background-color] duration-(--dur-instant) ease-litt hover:bg-accent-tint hover:text-accent-text " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

/** Heat, the chip: a sharp square telemetry cell with a 2px amber left rail while removable. */
export function FileChipHeatBody({ name, sizeText, uploading, percent, onRemove, coarse, className }: FileChipBodyProps) {
  return (
    <span
      data-body="heat"
      className={[
        "inline-flex h-6 max-w-full min-w-0 items-center gap-2 rounded-none border pl-2 font-normal text-fg forced-colors:border",
        onRemove ? "border-line-strong border-l-2 border-l-accent-text bg-block pr-0" : "border-line bg-surface-2 pr-2",
        className,
      ].join(" ")}
    >
      <FileIcon className="shrink-0 text-fg-muted" />
      <span className="min-w-0 truncate text-caption font-title text-fg">{name}</span>
      {uploading ? (
        <>
          <span className="sr-only">, uploading {percent} percent</span>
          <span aria-hidden="true" className="min-w-[4ch] shrink-0 text-right font-mono text-caption font-normal tabular-nums text-accent-text">
            {percent}%
          </span>
        </>
      ) : (
        sizeText !== null && (
          <>
            <span className="sr-only">, </span>
            <span className="shrink-0 font-mono text-caption tabular-nums font-normal text-fg-subtle">{sizeText}</span>
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
