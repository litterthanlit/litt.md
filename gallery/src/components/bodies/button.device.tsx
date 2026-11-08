/**
 * Button, Device's body (proposals/worlds.md, Bodies; proposals/device.md): a key.
 *
 * - Anatomy: the button is the 44px target. Behind it sits the skirt, its own element, the key's face darkened and
 *   stepped 2px down; on it stands the face, on the Device key tokens (--block, --highlight, the dark rim). The label
 *   is in the mono at the title weight and rides on the face.
 * - Press: the face and its label sink the whole --press-depth (2px) onto the skirt on the instant tier, and the lit
 *   edge gives way to the shade of a key that is down. Under reduced motion the depth is 0, so the key does not
 *   travel, and the fill still darkens to show the press. Fun mode's deeper sink is not used: a key's travel is its
 *   2px.
 * - Variants: primary is the key in the accent (Device's orange) with --accent-fg words. Secondary is a key in the
 *   body's grey (--block). Danger is that key with its words in --danger; in a dialog's footer it is the confirm, the
 *   one red key. Ghost is a flat label with no key; pressed, it sinks into a well (--tray with --tray-shade), the
 *   label a half step down.
 * - A disabled button lies flat: no skirt, a hairline, --fg-disabled words. Loading keeps the label mounted at
 *   opacity 0 and puts the spinner behind a small well of LCD glass (--field, --field-ink), so the width holds.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's.
 */
import type { ButtonBodyProps, ButtonVariant } from "../button";

const base =
  "litt-target group relative inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none font-title font-mono " +
  "cursor-pointer [-webkit-tap-highlight-color:transparent] disabled:cursor-not-allowed data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The face's edge: the lit top, a darker lower edge and the rim. Down, the lit edge gives way to the shade of a key that is pressed. */
const edgeUp =
  "[--key-edge:var(--highlight),inset_0_-1px_0_color-mix(in_oklab,black_10%,transparent),0_0_0_1px_color-mix(in_oklab,black_18%,transparent)]";
const edgeDown =
  "enabled:not-data-loading:active:[--key-edge:inset_0_1px_2px_color-mix(in_oklab,black_14%,transparent),0_0_0_1px_color-mix(in_oklab,black_18%,transparent)]";
const edgeDisabled = "disabled:[--key-edge:inset_0_0_0_1px_var(--line)]";

const keyed =
  edgeUp + " " + edgeDown + " " + edgeDisabled + " disabled:[--key:var(--surface-2)] disabled:text-fg-disabled";

const variants: Record<ButtonVariant, string> = {
  primary:
    keyed + " text-accent-fg [--key:var(--accent)] hover:[--key:var(--accent-hover)] " +
    "enabled:active:[--key:color-mix(in_oklab,var(--accent-hover),black_12%)]",
  secondary:
    keyed + " text-fg [--key:var(--block)] hover:[--key:var(--block-hover)] " +
    "enabled:active:[--key:color-mix(in_oklab,var(--block),var(--fg)_10%)]",
  danger:
    keyed + " text-danger [--key:var(--block)] hover:[--key:var(--block-hover)] " +
    "enabled:active:[--key:color-mix(in_oklab,var(--block),var(--fg)_10%)] " +
    /* A dialog's confirm: the one red key. These rules sort after the key's, so they win its ties (hover, press). */
    "in-[[data-dialog-footer]]:enabled:text-danger-fg in-[[data-dialog-footer]]:enabled:[--key:var(--danger)] " +
    "in-[[data-dialog-footer]]:enabled:hover:[--key:color-mix(in_oklab,var(--danger),var(--fg)_10%)] " +
    "in-[[data-dialog-footer]]:enabled:active:[--key:color-mix(in_oklab,var(--danger),var(--fg)_18%)]",
  ghost:
    "text-fg-muted [--key:transparent] [--key-edge:0_0_0_0_transparent] disabled:text-fg-disabled disabled:[--key:var(--surface-2)] " +
    "disabled:[--key-edge:inset_0_0_0_1px_var(--line)] " +
    "hover:text-fg hover:[--key:color-mix(in_oklab,var(--fg)_6%,transparent)] " +
    "enabled:not-data-loading:active:text-fg enabled:not-data-loading:active:[--key:var(--tray)] enabled:not-data-loading:active:[--key-edge:var(--tray-shade)]",
};

const down = "group-[:enabled:not([data-loading]):active]:translate-y-(--press-depth)";
const downHalf = "group-[:enabled:not([data-loading]):active]:translate-y-[calc(var(--press-depth)/2)]";

export function ButtonDeviceBody({ variant, iconOnly, sizeClass, shapeClass, blockClass, className, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  const ghost = variant === "ghost";
  const round = iconOnly ? "rounded-pill" : "rounded-control";
  return (
    <button
      {...root}
      data-body="device"
      className={[base, sizeClass, variants[variant], shapeClass, blockClass, className].join(" ")}
      style={style}
    >
      {!ghost && (
        <span
          aria-hidden="true"
          className={
            "pointer-events-none absolute inset-0 translate-y-[2px] bg-[color-mix(in_oklab,black_42%,var(--key))] " + round +
            " shadow-[0_0_0_1px_color-mix(in_oklab,black_22%,transparent)] " +
            "group-disabled:hidden forced-colors:hidden"
          }
        />
      )}
      <span
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-0 bg-(--key) shadow-(--key-edge) " + round + " " +
          "transition-[background-color,translate] duration-(--dur-instant) ease-litt " +
          (ghost ? "" : down + " ") +
          "forced-colors:border"
        }
      />
      <span
        className={
          "relative inline-flex items-center justify-center gap-control transition-[translate] duration-(--dur-instant) ease-litt " +
          (ghost ? downHalf : down)
        }
      >
        {children}
        {loading && (
          <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid size-6 place-items-center rounded-pill bg-field text-field-ink shadow-(--field-shade) forced-colors:border">
              {spinner}
            </span>
          </span>
        )}
      </span>
    </button>
  );
}
