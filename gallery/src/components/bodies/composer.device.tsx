/**
 * Composer, the Device body (proposals/worlds.md, Bodies; material.md, 8): a prompt line on LCD glass over a row of keys.
 *
 * - The box is a bezel (--tray, --tray-shade) with the glass set in it, 2px of body round the glass as the Input's. The
 *   glass is --field with --field-shade in the mono (font-field), its corners the bezel's less 2px. Typed text is
 *   --field-ink. A prompt mark (">") sits in the glass's left margin, an indicator and not a control, so it is
 *   aria-hidden. The text area, its growth and its keys are composer.tsx's.
 * - Attached files are lit cells on the glass: inverse video (--field-ink behind --field words) with a lamp, the name in
 *   the mono, the size, and a remove key. A sent message's file is a dark cell on the glass with a dim lamp ring.
 * - The toolbar is the bezel's key row below the glass: Attach and the caller's tools, then Send. Attach and Stop are
 *   keys in the body's grey (secondary), and Send is the one key in the accent (R6). A key has no word on it, its name is on the button (aria-label), as an icon-only Button's. The
 *   count is a small LCD cell with a lamp, which turns --danger at the limit beside the words.
 * - Focus rings the bezel (--focus-ring), a drag over it rings it in --focus, and a disabled one lies flat on
 *   --surface-2. They switch in three steps on the instant tier and the box never moves; nothing glides.
 * - The hint is a dim LCD line under the box, as the Input's. Forced colors drops shadows and fills, so the bezel and
 *   the glass get real borders, focus an outline, and every lamp a system color.
 */
import { AnimatePresence } from "motion/react";
import type { CSSProperties } from "react";
import { Button } from "../button";
import type { ComposerBodyProps, FileChipBodyProps } from "../composer";
import { ArrowUpIcon, PaperclipIcon, StopIcon, XIcon } from "../icons";

/* The detent: rings and colors switch in three steps on the instant tier. */
const STEPS = "steps(3, end)";
const steps: CSSProperties = {
  transitionProperty: "box-shadow, color, background-color, opacity",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, ${STEPS}, ${STEPS}, ${STEPS}`,
};

/* The bezel carries the box's state; the text area inside is what takes focus. */
const BEZEL =
  "group/box relative flex flex-col overflow-hidden rounded-surface bg-tray p-0.5 shadow-(--tray-shade) " +
  "has-[textarea:focus-visible]:shadow-[var(--tray-shade),var(--focus-ring)] " +
  "data-[dragging]:shadow-[var(--tray-shade),0_0_0_2px_var(--focus)] " +
  "data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-[textarea:focus-visible]:outline-2 forced-colors:has-[textarea:focus-visible]:outline-solid forced-colors:has-[textarea:focus-visible]:outline-offset-2";

const GLASS =
  "relative flex flex-col rounded-[calc(var(--radius-surface)-2px)] bg-field font-field font-normal text-field-ink shadow-(--field-shade) " +
  "group-data-[disabled]/box:bg-transparent group-data-[disabled]/box:shadow-none forced-colors:border";

const AREA =
  "block w-full min-w-0 resize-none overflow-y-hidden bg-transparent pr-control-pad-md pl-1 py-3 font-field font-normal text-body text-field-ink " +
  "outline-none placeholder:text-field-ink-subtle pointer-coarse:text-(length:--control-text-lg) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled";

const DROP =
  "pointer-events-none absolute inset-0 bg-field font-field pr-control-pad-md pl-1 py-3 text-body text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) opacity-0 group-data-[dragging]/box:opacity-100";

/** Device, the composer: a prompt line on LCD glass in a bezel, a row of keys under it. */
export function ComposerDeviceBody({ className, disabled, dragging, big, suggestions, drop, chips, label, areaId, area, attach, tools, count, send, hint, status, coarse }: ComposerBodyProps) {
  const grow = "pointer-coarse:h-control-md max-sm:h-control-md";
  const size = big ? "md" : "sm";
  return (
    <div data-body="device" className={["flex min-w-0 flex-col gap-2 max-sm:pb-[env(safe-area-inset-bottom)]", className].join(" ")}>
      {suggestions}

      <div data-dragging={dragging ? "" : undefined} data-disabled={disabled ? "" : undefined} className={BEZEL} style={steps} {...drop}>
        <div className={GLASS}>
          <ul role="list" aria-label="Attached files" className={"hidden flex-wrap has-[li]:flex has-[li]:px-1.5 has-[li]:pt-1.5 " + (coarse ? "gap-3" : "gap-2")}>
            <AnimatePresence initial={false}>{chips}</AnimatePresence>
          </ul>

          <div className="flex items-start">
            <span aria-hidden="true" className="shrink-0 select-none py-3 pl-control-pad-md text-body text-field-ink-subtle pointer-coarse:text-(length:--control-text-lg)">
              &gt;
            </span>
            <div className="relative min-w-0 flex-1">
              <label htmlFor={areaId} className="sr-only">
                {label}
              </label>
              <textarea id={areaId} rows={1} className={AREA} {...area} />
              <span aria-hidden="true" className={DROP} style={steps}>
                Drop to attach
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5">
          {attach && (
            <>
              {attach.picker}
              <Button variant="secondary" size={size} icon={<PaperclipIcon />} aria-label="Attach files" disabled={disabled} className={grow} onClick={attach.onClick} />
            </>
          )}
          {tools && <div className="flex min-w-0 items-center gap-2">{tools}</div>}
          <div className="min-w-0 flex-1" />
          {count && (
            <span
              id={count.id}
              style={steps}
              className="flex shrink-0 items-center gap-1.5 rounded-control bg-field px-2 py-1 font-field text-caption font-normal tabular-nums text-field-ink shadow-(--field-shade) forced-colors:border"
            >
              <span
                aria-hidden="true"
                className={
                  "size-1.5 shrink-0 rounded-pill " +
                  (count.full ? "bg-danger shadow-[0_0_6px_var(--danger)] forced-colors:bg-[Highlight]" : "shadow-[inset_0_0_0_1px_var(--field-ink-subtle)] forced-colors:border")
                }
              />
              <span className="sr-only">Characters used: </span>
              {count.used} / {count.max}
            </span>
          )}
          <Button
            ref={send.ref}
            variant={send.streaming ? "secondary" : "primary"}
            size={size}
            icon={send.streaming ? <StopIcon /> : <ArrowUpIcon />}
            aria-label={send.streaming ? "Stop" : "Send"}
            disabled={send.disabled}
            className={grow}
            onFocus={send.onFocus}
            onBlur={send.onBlur}
            onClick={send.onClick}
          />
        </div>
      </div>

      {hint && (
        <p id={hint.id} className="flex max-w-full font-field text-caption">
          <span className="w-fit max-w-full rounded-surface bg-field px-2.5 py-1 text-field-ink-subtle shadow-(--field-shade) forced-colors:border">{hint.content}</span>
        </p>
      )}

      {status}
    </div>
  );
}

const REMOVE =
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-control text-field " +
  "hover:bg-field hover:text-field-ink " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-field " +
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5 forced-colors:border";

/** Device, the chip: a lit cell (inverse video, a lit lamp) while it can be removed, a dark cell with a dim lamp when it cannot. */
export function FileChipDeviceBody({ name, sizeText, uploading, percent, onRemove, coarse, className }: FileChipBodyProps) {
  return (
    <span
      data-body="device"
      style={steps}
      className={[
        "inline-flex h-8 max-w-full min-w-0 items-center gap-2 rounded-[calc(var(--radius-surface)-8px)] pl-2.5 font-field font-normal forced-colors:border",
        onRemove ? "bg-field-ink pr-1 text-field" : "bg-field pr-2.5 text-field-ink shadow-(--field-shade)",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={
          "size-1.5 shrink-0 rounded-pill " +
          (onRemove ? "bg-field shadow-[0_0_6px_var(--field)] forced-colors:bg-[Highlight]" : "shadow-[inset_0_0_0_1px_var(--field-ink-subtle)] forced-colors:border")
        }
      />
      <span className="min-w-0 truncate text-caption">{name}</span>
      {uploading ? (
        <>
          <span className="sr-only">, uploading {percent} percent</span>
          <span aria-hidden="true" className="min-w-[4ch] shrink-0 text-right text-caption tabular-nums">
            {percent}%
          </span>
        </>
      ) : (
        sizeText !== null && (
          <>
            <span className="sr-only">, </span>
            <span className="shrink-0 text-caption tabular-nums">{sizeText}</span>
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
