/**
 * Card picker (components.md, "Card picker"): one choice shown as cards, such as a plan, an onboarding question, or a
 * theme or a layout. A fieldset of native radios, so the role, the arrow keys, required and the form value come from
 * the browser.
 *
 * - Material: one sunken tray (R3: --tray, --tray-shade) holds every card, and the pick is the raised block (--block,
 *   --block-lift) gliding inside it: the Segmented control's track and block, grown tall. The tray floor is what makes
 *   unpicked cards read as a choice and not as static cards. Flat cards with a raised pick fail in light mode, where
 *   --block is the same white as --surface-1, so only a shadow would tell the pick apart. Never an accent fill (R6).
 * - Every card in a picker has the same size: equal columns, or equal rows when stacked. So the block never changes
 *   shape while it glides, and the details (a price) line up across a row.
 * - sm: tiles, a picture over a word in one row of 2 to 5, the label --fg-subtle and the picked one --fg. The tray
 *   sits at the control radius and the tiles 2px inside it. It draws no description or detail.
 * - lg (the default): cards with a title (--fg), a line (--fg-subtle) and a detail such as a price. The tray sits at
 *   the surface radius with a 4px inset, so the cards take the control radius and stay concentric. The cards sit in
 *   one row while each gets 12rem of the picker's own width (a container query, so it works in a sheet or a sidebar),
 *   and stack as rows otherwise. ARRANGE is keyed by the count, so no card is ever left alone on a row.
 * - Names: each radio is named by its title and described by the description, then the detail, so a screen reader
 *   hears "Pro, radio button, Unlimited projects. $12 a month". Pictures are hidden. A disabled card keeps its
 *   description in --fg-subtle, since it says why.
 * - Nothing starts picked without value or defaultValue: a question must not answer itself. value={null} keeps a
 *   controlled picker empty.
 * - Motion: the block glides on the responsive tier (fun mode's glide spring in fun mode), and appears at once on the
 *   first pick. Reduced motion turns the glide off. Colors change on the instant tier. The focus ring is drawn from
 *   the radio's :focus-visible, inset, so a mouse never shows it.
 */
import { useId, useState, type ReactNode } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useFun, useTransition } from "@/motion";

export type CardPickerSize = "sm" | "lg";

/** One choice: a card. */
export type CardPickerOption<T extends string> = {
  /** What onValueChange gets and what a form sends. */
  value: T;
  /** The choice's name: a card's title, or the word under a tile's picture. It is the radio's accessible name. A word or two at sm. */
  label: string;
  /** A line under a card's title: what the choice gives you. Read after the name. Not drawn at sm. */
  description?: ReactNode;
  /** A short detail at a card's end, such as a price ("$12 a month"). Read after the description. Not drawn at sm. */
  detail?: ReactNode;
  /** What the choice looks like, drawn in currentColor where it can be, so the picked card's picture steps up to --fg. Hidden from screen readers. */
  picture?: ReactNode;
  /** Makes this one option unavailable, and the arrow keys skip it. Say why in its description. */
  disabled?: boolean;
};

export type CardPickerProps<T extends string> = {
  /** The question or the setting's name, shown above the cards and read with each one. Required. */
  legend: ReactNode;
  /** Hides the legend from sight (a screen reader still reads it), when the page already asks the question. */
  hideLegend?: boolean;
  /** The radios' shared name, which is what makes the arrow keys move between them and what a form sends. Made up for you when left out. */
  name?: string;
  /** The picked option's value, when you control it. Pair it with onValueChange. null keeps it controlled with nothing picked. */
  value?: T | null;
  /** The option picked at first when you do not control it. Without one, nothing is picked until the person picks. */
  defaultValue?: T;
  /** Called with the picked option's value each time the pick changes, by click, tap or arrow key. */
  onValueChange?: (value: T) => void;
  /** The choices, in order: two to five at sm, two to six at lg. More belong in a Select. */
  options: CardPickerOption<T>[];
  /** sm: tiles, a picture over a word in one row, for a setting. lg: cards with a title, a line and a detail, in a row when each gets 12rem and stacked when not. */
  size?: CardPickerSize;
  /** Asks the browser to refuse a form sent with nothing picked. */
  required?: boolean;
  /** A hint under the cards. An error replaces it. */
  help?: ReactNode;
  /** Shown in danger color under the cards and linked to the group. Also marks every radio invalid. Say how to fix it. */
  error?: ReactNode;
  /** Disables every option, through the fieldset. */
  disabled?: boolean;
  /** Extra classes for the fieldset, such as a width. */
  className?: string;
};

/** What a finger holding an unpicked card shows, as Segmented's segments. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

/** Where lg's cards go from stacked rows to columns, by count: each column gets 12rem, and no row holds one card alone. */
const ARRANGE: Record<2 | 3 | 4 | 5 | 6, { tray: string; card: string; detail: string }> = {
  2: { tray: "@min-[24rem]:grid-cols-2", card: "@min-[24rem]:flex-col", detail: "@min-[24rem]:mt-auto" },
  3: { tray: "@min-[36rem]:grid-cols-3", card: "@min-[36rem]:flex-col", detail: "@min-[36rem]:mt-auto" },
  4: { tray: "@min-[24rem]:grid-cols-2 @min-[48rem]:grid-cols-4", card: "@min-[24rem]:flex-col", detail: "@min-[24rem]:mt-auto" },
  5: { tray: "@min-[36rem]:grid-cols-3", card: "@min-[36rem]:flex-col", detail: "@min-[36rem]:mt-auto" },
  6: { tray: "@min-[24rem]:grid-cols-2 @min-[36rem]:grid-cols-3", card: "@min-[24rem]:flex-col", detail: "@min-[24rem]:mt-auto" },
};

const SIZES: Record<CardPickerSize, { tray: string; card: string; corner: string }> = {
  sm: {
    tray: "grid grid-flow-col auto-cols-fr rounded-control p-0.5",
    card: "grid min-w-0 justify-items-center gap-2 px-1 pt-3 pb-2.5 text-caption font-title",
    corner: "rounded-[calc(var(--radius-control)-2px)]",
  },
  lg: {
    tray: "grid grid-cols-1 auto-rows-fr gap-1 rounded-surface p-1",
    card: "flex min-h-16 min-w-0 items-start gap-3 p-4 text-left",
    corner: "rounded-control",
  },
};

/** One choice shown as cards: tiles of a picture over a word (sm), or cards with a title, a line and a detail such as a price (lg). */
export function CardPicker<T extends string>({
  legend,
  hideLegend = false,
  name: nameProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  options,
  size = "lg",
  required = false,
  help,
  error,
  disabled = false,
  className = "",
}: CardPickerProps<T>) {
  const auto = useId();
  const name = nameProp ?? auto;
  const responsive = useTransition("responsive");
  const fun = useFun();
  const glide = fun ? fun.glide : responsive;
  const [inner, setInner] = useState<T | null>(defaultValue ?? null);
  const value = valueProp !== undefined ? valueProp : inner;
  const note = error ?? help;
  const look = SIZES[size];
  const arrange = ARRANGE[Math.min(Math.max(options.length, 2), 6) as 2 | 3 | 4 | 5 | 6];
  const pictures = options.some((o) => o.picture);

  const tray = (
    <div
      className={
        look.tray +
        " bg-tray forced-colors:border " +
        (error ? "shadow-[inset_0_0_0_1px_var(--danger),var(--tray-shade)]" : "shadow-(--tray-shade)") +
        (size === "lg" ? " " + arrange.tray : "")
      }
    >
      {options.map((o, i) => {
        const picked = value === o.value;
        const off = disabled || !!o.disabled;
        const id = `${auto}-${i}`;
        const described = [o.description && `${id}-description`, o.detail && `${id}-detail`].filter(Boolean).join(" ");
        return (
          <label
            key={o.value}
            className={
              "relative select-none " + look.corner + " " + look.card + (size === "lg" ? " " + arrange.card : "") + " " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
              (off
                ? "cursor-not-allowed text-fg-disabled"
                : "cursor-pointer " +
                  (picked
                    ? "text-fg"
                    : size === "sm"
                      ? "text-fg-subtle hover:text-fg " + PRESS
                      : "text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg " + PRESS))
            }
          >
            <input
              type="radio"
              className="peer sr-only"
              name={name}
              value={o.value}
              checked={picked}
              disabled={o.disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-labelledby={size === "lg" ? `${id}-label` : undefined}
              aria-describedby={size === "lg" && described ? described : undefined}
              onChange={() => {
                setInner(o.value);
                onValueChange?.(o.value);
              }}
            />
            {picked && (
              <motion.span
                layoutId="card-picker-surface"
                transition={glide}
                aria-hidden="true"
                className={"absolute inset-0 " + look.corner + " bg-block shadow-(--block-lift) forced-colors:border-2"}
              />
            )}
            {size === "sm" ? (
              <>
                <span aria-hidden="true" className="relative z-1 grid h-8 w-full place-items-center">
                  {o.picture}
                </span>
                <span className="litt-trim relative z-1 max-w-full">{o.label}</span>
              </>
            ) : (
              <>
                {pictures && (
                  <span aria-hidden="true" className="relative z-1 grid min-h-6 min-w-6 shrink-0 items-center justify-items-start">
                    {o.picture}
                  </span>
                )}
                <span className="relative z-1 grid min-w-0 flex-1 gap-1">
                  <span id={`${id}-label`} className={"text-body font-title " + (off ? "text-fg-disabled" : "text-fg")}>
                    {o.label}
                  </span>
                  {o.description && (
                    <span id={`${id}-description`} className="text-small text-fg-subtle">
                      {o.description}
                    </span>
                  )}
                </span>
                {o.detail && (
                  <span id={`${id}-detail`} className={"relative z-1 shrink-0 text-body font-title tabular-nums " + arrange.detail + (off ? " text-fg-disabled" : " text-fg")}>
                    {o.detail}
                  </span>
                )}
              </>
            )}
            {/* The pictures, the words and the ring sit above the block (z-1), so it never covers them while it glides. */}
            <span
              aria-hidden="true"
              className={
                "pointer-events-none absolute inset-0 z-1 " + look.corner + " peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              }
            />
          </label>
        );
      })}
    </div>
  );

  return (
    <fieldset disabled={disabled} aria-describedby={note ? `${auto}-note` : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={hideLegend ? "sr-only" : "mb-2 p-0 text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      <LayoutGroup id={auto}>{size === "lg" ? <div className="@container">{tray}</div> : tray}</LayoutGroup>
      {note && (
        <p id={`${auto}-note`} className={"mt-2 text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </fieldset>
  );
}
