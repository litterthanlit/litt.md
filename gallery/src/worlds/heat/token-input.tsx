/**
 * Token input, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat square dark field holding sharp
 * square racing tags, each led by a 2px amber bar with a crisp square remove key.
 *
 * - Field: matches InputHeatBody (`rounded-none border border-line-control bg-field`), zero inset shadows; hover steps
 *   border to `--fg`, focus-visible takes the 2px `--focus` outline, invalid takes `--danger`, disabled lies flat on
 *   `--surface-2` with `--line`.
 * - Tokens: 24px sharp square dark cells (`bg-block border border-line-strong border-l-2 border-l-accent-text`) with
 *   a square remove button that lights `--accent-tint` / `--accent-text` on hover. Disabled tokens lie flat on
 *   `--surface-2` without the amber bar.
 * - `"+N"` collapse indicator: sharp square cell in `--surface-1` with tabular `--accent-text` count.
 * - The contract (real input, roving remove buttons, paste/separator parsing, live region) stays in token-input.tsx.
 */
import type { TokenInputBodyProps, TokenSkin } from "@/components/token-input";

const FIELD =
  "relative flex w-full min-w-0 cursor-text rounded-none border border-line-control bg-field font-field font-normal text-field-ink " +
  "transition-[border-color,background-color] duration-(--dur-instant) ease-litt " +
  "hover:border-fg " +
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus " +
  "data-[invalid]:border-danger " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:border-line data-[disabled]:bg-surface-2 " +
  "forced-colors:border";

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
  "hover:bg-accent-tint hover:text-accent-text active:bg-surface-3 " +
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
        "inline-flex h-6 max-w-full min-w-0 shrink-0 items-center whitespace-nowrap rounded-none border pl-2 text-caption font-title forced-colors:border " +
        (disabled
          ? "border-line bg-surface-2 text-fg-subtle"
          : "border-line-strong border-l-2 border-l-accent-text bg-block text-fg")
      }
    >
      {children}
    </span>
  ),
  text: () => "min-w-0 truncate",
  remove: REMOVE,
  Cross,
  more: "inline-flex h-6 shrink-0 cursor-default items-center rounded-none border border-line bg-surface-1 px-2 font-mono text-caption tabular-nums text-accent-text forced-colors:border",
};

/** Heat: a flat square dark field holding sharp square tokens led by a 2px amber bar. */
export function TokenInputHeatBody({ size, invalid, disabled, className, label, labelId, inputId, note, noteId, field, list, input, hidden, said }: TokenInputBodyProps) {
  return (
    <div data-body="heat" className={"grid content-start gap-2 " + className}>
      <label id={labelId} htmlFor={inputId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>

      <div
        ref={field.ref}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={[FIELD, FIELD_SIZE[size], TEXT_SIZE[size], "pointer-coarse:text-(length:--control-text-lg)"].join(" ")}
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
