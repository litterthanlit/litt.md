/**
 * Token input, the Flat body (proposals/worlds.md, Bodies): ink on paper. Nothing stands and nothing is framed.
 *
 * - The field is a grey pill (--cut, which is --surface-3, at the control radius, never past half the one-line height,
 *   so a field that wraps keeps the corners it had on one line) with no outline and no shade, as the Input's.
 *   Focus is the ink ring, the one line it draws. An error draws no ring: its words are in --danger and the fill
 *   tints toward --danger on the color tier, as the Input's; aria-invalid and the words say it, never the tint alone.
 * - A token is a darker grey pill on it, the --cut with 9% of --fg mixed in, its words in ink at the label weight and
 *   a bare cross after them. Nothing is raised, lit or ruled. The cross is a real button named "Remove @stripe.com": a
 *   grey wash fills it on hover, it stays 24px, and it is a 44px target on coarse pointers through an invisible ::before.
 * - The "+N" stands for tokens and is not one, so it is bare words in --fg-muted, no pill.
 * - The label is words above in ink at the title weight and the hint plain grey words below (--fg-subtle), both set
 *   in from the edge by the pill's padding. No plate, no rule: space is the only divider.
 * - Disabled lies flat on --surface-2, the tokens plain --surface-3 pills with their words in --fg-subtle, and the
 *   crosses off.
 * - Motion: a token fades in with a 0.98 scale on the responsive tier and its neighbors slide; the ring and the tint
 *   fade on the instant tier. Nothing else moves.
 * - Forced colors drops fills and shadows, so the pill and the tokens get real borders and focus an outline.
 * - The contract (the real input, the roving remove buttons, the live region) is token-input.tsx's.
 */
import type { TokenInputBodyProps, TokenSkin } from "../token-input";

const FIELD =
  "relative flex w-full min-w-0 cursor-text bg-field font-field font-normal text-field-ink shadow-none " +
  "transition-[box-shadow,background-color] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-(--focus-ring) " +
  "data-[invalid]:bg-[color-mix(in_oklab,var(--danger)_12%,var(--cut))] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-none " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

/* The corners: the control radius, never past half the one-line height. */
const RADIUS = {
  sm: "rounded-[min(var(--radius-control),calc(var(--control-sm)/2))] pointer-coarse:rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  md: "rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  lg: "rounded-[min(var(--radius-control),calc(var(--control-lg)/2))]",
};

/* Padding on the 4px grid: a 24px row of pills plus this air lands on 32, 44 (centered in the minimum) and 56. The
   sides are wider than the other bodies', so the pills clear the round ends. */
const FIELD_SIZE = {
  sm: "min-h-control-sm px-2 py-1 pointer-coarse:min-h-control-md",
  md: "min-h-control-md px-3 py-2",
  lg: "min-h-control-lg px-4 py-4",
};

const TEXT_SIZE = {
  sm: "text-small",
  md: "text-body",
  lg: "text-(length:--control-text-lg)",
};

const REMOVE =
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-pill text-fg-muted " +
  "transition-[color,background-color] duration-(--dur-instant) ease-litt " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] hover:text-fg active:bg-[color-mix(in_oklab,var(--fg)_14%,transparent)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-fg-disabled disabled:hover:bg-transparent disabled:hover:text-fg-disabled " +
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
    <span
      className={
        "inline-flex h-6 max-w-full min-w-0 shrink-0 items-center whitespace-nowrap rounded-pill pr-0 pl-3 text-caption " +
        (disabled ? "bg-surface-3 text-fg-subtle" : "bg-[color-mix(in_oklab,var(--cut),var(--fg)_9%)] text-fg") +
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

/** Flat, a grey pill field with its tokens as darker grey pills, each with a cross. */
export function TokenInputFlatBody({ size, invalid, disabled, className, label, labelId, inputId, note, noteId, field, list, input, hidden, said }: TokenInputBodyProps) {
  return (
    <div data-body="flat" className={"grid content-start gap-1.5 " + className}>
      <label id={labelId} htmlFor={inputId} className={"px-control-pad-md text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
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
        <p id={noteId} className={"px-control-pad-md text-small " + (invalid ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
