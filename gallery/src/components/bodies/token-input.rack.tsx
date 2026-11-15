/**
 * Token input, the Rack body (proposals/rack.md): a light value box that holds small flat keys, as an instrument
 * lists the items it is set to.
 *
 * - The field is the Input's box: a light box (--cut through --field) in a 1px control line (--line-control), square at
 *   the control radius, no shade, never past half the one-line height. Focus turns the line to --focus and adds the
 *   focus ring while the text is focus-visible; an error turns the line to --danger. Disabled lies flat on --surface-2
 *   with the plain --line hairline. The edge changes on the instant tier.
 * - A token is a small flat key: --block in the 1px outline of --block-lift, 24px high, square at the control radius,
 *   its words in the ink at the caption size, and a square remove key at its end that takes a hover fill and nothing
 *   else. The cross is a real button named "Remove ...", 24px, and a 44px target on coarse pointers. A disabled token
 *   lies flat: --surface-2 with a --line hairline and --fg-subtle words.
 * - The "+N" stands for tokens and is not one, so it is bare words in --fg-muted, no outline.
 * - The label sits above in the title weight, the hint under it in --fg-subtle, an error in --danger.
 * - Motion: a token cuts in and out in place (the part's switches under Rack) and nothing slides; the edge fades on the
 *   instant tier.
 * - Forced colors drops shadows, so the field and the tokens get real borders and focus an outline.
 * - The contract (the real input, the roving remove buttons, the live region) is token-input.tsx's.
 */
import type { TokenInputBodyProps, TokenSkin } from "../token-input";

const FIELD =
  "relative flex w-full min-w-0 cursor-text bg-field font-field font-normal text-field-ink " +
  "shadow-[inset_0_0_0_1px_var(--field-line)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
  "data-[invalid]:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "data-[invalid]:has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--danger),var(--focus-ring)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

/* The control radius, never past half the one-line height. */
const RADIUS = {
  sm: "rounded-[min(var(--radius-control),calc(var(--control-sm)/2))] pointer-coarse:rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  md: "rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  lg: "rounded-[min(var(--radius-control),calc(var(--control-lg)/2))]",
};

/* Padding on the 4px grid: a 24px row of keys plus this air lands on 32, 44 (centered in the minimum) and 56. */
const FIELD_SIZE = {
  sm: "min-h-control-sm px-1 py-1 pointer-coarse:min-h-control-md",
  md: "min-h-control-md px-2 py-2",
  lg: "min-h-control-lg px-4 py-4",
};

const TEXT_SIZE = {
  sm: "text-small",
  md: "text-body",
  lg: "text-(length:--control-text-lg)",
};

const REMOVE =
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-none text-fg-muted " +
  "transition-[color,background-color] duration-(--dur-instant) ease-litt " +
  "hover:bg-(--block-hover) hover:text-fg active:bg-surface-3 " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-fg-disabled disabled:hover:bg-transparent disabled:hover:text-fg-disabled " +
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
    </svg>
  );
}

const SKIN: TokenSkin = {
  Chip: ({ disabled, children }) => (
    <span
      className={
        "inline-flex h-6 max-w-full min-w-0 shrink-0 items-center whitespace-nowrap rounded-control pl-2 text-caption " +
        (disabled ? "bg-surface-2 text-fg-subtle shadow-[inset_0_0_0_1px_var(--line)]" : "bg-block text-fg shadow-(--block-lift)") +
        " forced-colors:border"
      }
    >
      {children}
    </span>
  ),
  text: () => "min-w-0 truncate",
  remove: REMOVE,
  Cross,
  more: "inline-flex h-6 shrink-0 cursor-default items-center px-2 text-caption text-fg-muted",
};

/** Rack, a light value box holding small flat keys, each with a remove key. */
export function TokenInputRackBody({ size, invalid, disabled, className, label, labelId, inputId, note, noteId, field, list, input, hidden, said }: TokenInputBodyProps) {
  return (
    <div data-body="rack" className={"grid content-start gap-1.5 " + className}>
      <label id={labelId} htmlFor={inputId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>

      <div
        ref={field.ref}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={[FIELD, RADIUS[size], FIELD_SIZE[size], TEXT_SIZE[size], "pointer-coarse:text-(length:--control-text-lg)"].join(" ")}
        onMouseDown={field.onMouseDown}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
      >
        <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {list(SKIN)}
          {input}
        </div>
        {hidden}
      </div>

      {note && (
        <p id={noteId} className={"text-small " + (invalid ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
