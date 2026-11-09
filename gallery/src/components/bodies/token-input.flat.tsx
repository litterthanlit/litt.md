/**
 * Token input, the Flat body (proposals/worlds.md, Bodies): ink on paper.
 *
 * - The field is a grey field with no outline (the ink ring on focus, the danger ring on an error), each token a
 *   --surface-1 bubble on it, the "+N" chip bare text.
 * - The contract (the real input, the roving remove buttons, the live region) is token-input.tsx's.
 */
import { Tag } from "@/components/tag";
import type { TokenInputBodyProps, TokenSkin } from "../token-input";

const FIELD =
  "relative flex w-full min-w-0 cursor-text bg-field font-field font-normal text-field-ink " +
  "shadow-none " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-(--focus-ring) " +
  "data-[invalid]:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "data-[invalid]:has-[input:focus-visible]:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-none " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

const RADIUS = {
  sm: "rounded-[min(var(--radius-control),calc(var(--control-sm)/2))] pointer-coarse:rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  md: "rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  lg: "rounded-[min(var(--radius-control),calc(var(--control-lg)/2))]",
};

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
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-pill text-fg-subtle " +
  "transition-[color] duration-(--dur-instant) ease-litt hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:text-fg-disabled " +
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
    </svg>
  );
}

const SKIN: TokenSkin = {
  Chip: ({ disabled, children }) => (
    <Tag raised={!disabled} className="max-w-full min-w-0 pr-0">
      {children}
    </Tag>
  ),
  text: (disabled) => "min-w-0 truncate " + (disabled ? "text-fg-subtle" : ""),
  remove: REMOVE,
  Cross,
  more: "inline-flex h-6 shrink-0 cursor-default items-center rounded-control bg-transparent px-2 text-caption text-fg-muted shadow-none",
};

/** Flat, a grey field with its tokens as bubbles on it. */
export function TokenInputFlatBody({ size, invalid, disabled, className, label, labelId, inputId, note, noteId, field, list, input, hidden, said }: TokenInputBodyProps) {
  return (
    <div data-body="flat" className={"grid gap-2 " + className}>
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
