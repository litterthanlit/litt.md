/**
 * Option picker: one option of a product, such as its size or its frame, as a choice of its values (components.md,
 * "Option picker"). A fieldset of native radios, so the role, the arrow keys and the form value come from the browser.
 *
 * - Legend: visible. The option's name at the small size and the title weight in --fg, then the picked value's name in
 *   --fg-subtle ("Frame · Natural oak"), so a swatch's name is always written somewhere. The picked part is hidden from
 *   screen readers, which hear it on the checked radio instead.
 * - Text values take the Segmented control's look and motion: one sunken tray (--tray, --tray-shade), equal
 *   segments, the picked one the raised block (R3: --block, --block-lift), gliding to the pick on the responsive tier (fun mode's glide
 *   spring in fun mode). The track fills its column, so the options of one product line up. Keep labels short; a long
 *   list of values is a Select.
 * - Flat (proposals/flat-pill.md): the text track is the Segmented control's Flat look (no frame, the pick a grey
 *   bubble). Swatch chips keep their fg-12% hairline: it is the product's color needing an edge, not chrome.
 * - Swatch values (every value has a color or an image): 24px chips (32 on a touch screen) at the control radius with
 *   an fg-12% hairline, 8px apart, as the Color picker's swatches. The color is the product's, not litt's: content,
 *   like a photograph, never a data hue and never chrome. It fills only the chip. The picked chip carries a 16px
 *   check in black or white, whichever reads better on that color by APCA, as the Color picker's ink.
 * - Sold out: a value with `available: false` stays pickable, so picking it tells the person why they cannot buy it.
 *   Its label steps to --fg-disabled (a chip to 40% opacity under its hairline), it says "sold out" in hidden text,
 *   and while it is picked the legend says "Sold out" after its name. No slash and no strike: the words carry it.
 * - Focus by modality: the radio's :focus-visible draws the 2px ring, inset on a segment, at a 2px offset on a chip.
 * - Bodies (proposals/worlds.md): this file keeps the contract (the fieldset, the legend, the radios' names and the
 *   pick) and resolves it once into OptionPickerBodyProps. It renders the body the material picks (byWorld): Press, below,
 *   is the sunken track and its gliding block; Flat (bodies/option-picker.flat.tsx) is the grey pills with the pick in
 *   ink; Device (bodies/option-picker.device.tsx) is a row of latching keys, each with a lamp, and a sold-out value
 *   that lies flat. The radios, the arrow keys and every accessible name are the same in all three.
 * - Motion: only the text track's surface moves. Colors change on the instant tier; the check appears at once.
 */
import { useEffect, useId, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { byWorld, useFun, useMaterial, useTransition } from "@/motion";
import { CheckIcon } from "@/components/icons";
import { OptionPickerDeviceBody } from "./bodies/option-picker.device";
import { OptionPickerFlatBody } from "./bodies/option-picker.flat";

/** One value of an option, as a product lists it. */
export type OptionValue = {
  /** The value itself, as the store names it: "A2", "Natural oak". It is what onValueChange gets and a form sends. */
  value: string;
  /** What the picker shows, when it differs from the value. */
  label?: string;
  /** A color (any CSS color, such as Shopify's hex) or an image for a swatch chip. Values with swatches show as chips. */
  swatch?: { color?: string; image?: string };
  /** False when no variant with this value is in stock among the other picks. It stays pickable and says so. */
  available?: boolean;
};

/** A product's option: its name and its values, in order. */
export type ProductOption = {
  /** The option's name: "Size", "Frame". */
  name: string;
  values: OptionValue[];
};

export type OptionPickerProps = {
  /** The option's name, shown in the legend: "Size". */
  name: string;
  /** The values, in the store's order. */
  values: OptionValue[];
  /** The picked value, when you control it. Pair it with onValueChange. */
  value?: string;
  /** The value that starts picked when you do not control it. Without one, the first value starts picked. */
  defaultValue?: string;
  /** Called with the value each time the pick changes, by click, tap or arrow key. */
  onValueChange?: (value: string) => void;
  /** The radios' shared name, which a form sends the value under. Made up for you when left out. */
  inputName?: string;
  /** Extra classes for the fieldset. */
  className?: string;
};

/**
 * What the contract hands a body: the option resolved once. A body draws the values (the radios and what shows them);
 * the fieldset and the legend stay with the contract. A body keeps one native radio per value (checked, named
 * `group`, onChange `onPick`), names a sold-out value ", sold out" in hidden text, keeps a 44px target, and carries
 * data-body on its root.
 */
export type OptionPickerBodyProps = {
  /** The radios' shared name. */
  group: string;
  values: OptionValue[];
  /** The picked value. */
  value: string | undefined;
  /** Every value has a color or an image, so each shows as a chip. */
  swatches: boolean;
  /** Picks a value: the radio's change. */
  onPick: (value: string) => void;
  /** What a value shows: its label, else the value. */
  labelOf: (value: OptionValue) => string;
  /** The ink of the check on a chip, black or white, once the color can be read. */
  inkOf: (value: OptionValue) => "black" | "white" | undefined;
  /** The text track's gliding transition: the responsive tier, or fun mode's glide. */
  glide: ReturnType<typeof useTransition>;
  /** The id the text track's shared surface is scoped to. */
  groupId: string;
};

/* ----------------------------------------------------------------- the ink on a swatch */

/** Reads a color into its red, green and blue, 0 to 255: hex and the rgb function at once, any other CSS color through a canvas. */
function rgbOf(color: string): [number, number, number] | null {
  const c = color.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const h = hex[1]!.length === 3 ? hex[1]!.replace(/./g, (x) => x + x) : hex[1]!;
    const n = Number.parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  if (typeof document === "undefined") return null;
  /* A named color or a color function: the canvas reads it back as hex. */
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = c;
  return /^#/.test(ctx.fillStyle) ? rgbOf(ctx.fillStyle) : null;
}

/** APCA's screen luminance (0.0.98G) of 0-255 channels: sRGB to the 2.4 power, without the WCAG 2 linear toe. */
const screenY = ([r, g, b]: [number, number, number]) => 0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;

/** APCA lightness contrast (Lc) of text on a background, as a magnitude. */
function apca(text: number, bg: number) {
  const soft = (y: number) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
  const t = soft(text);
  const b = soft(bg);
  const s = b > t ? (b ** 0.56 - t ** 0.57) * 1.14 : (t ** 0.62 - b ** 0.65) * 1.14;
  return s < 0.1 ? 0 : (s - 0.027) * 100;
}

/**
 * Black or white, whichever reads better on the color, chosen by APCA as the Color picker's getContrastInk is: on a mid
 * tone such as a rust, white reads twice as well as black, where the WCAG 2 ratio would call them even and pick black.
 */
function inkOn(color: string | undefined): "black" | "white" | undefined {
  const rgb = color ? rgbOf(color) : null;
  if (!rgb) return undefined;
  const bg = screenY(rgb);
  return apca(1, bg) >= apca(0, bg) ? "white" : "black";
}

/* ----------------------------------------------------------------- the bodies */

/** What a finger holding an unpicked segment shows: the fg 6% fill that rows and tabs share, and the hover text color. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

/** Press: a sunken track with a raised block gliding to the pick for words, chips with a check for colors and images. */
function PressBody({ group, values, value, swatches, onPick, labelOf, inkOf, glide, groupId }: OptionPickerBodyProps) {
  return swatches ? (
    <div data-body="press" className="flex flex-wrap gap-2 pointer-coarse:gap-3">
      {values.map((v) => {
        const on = v.value === value;
        const out = v.available === false;
        const ink = inkOf(v);
        return (
          <label key={v.value} className="litt-target relative block cursor-pointer [-webkit-tap-highlight-color:transparent]">
            <input
              type="radio"
              name={group}
              value={v.value}
              checked={on}
              onChange={() => onPick(v.value)}
              className="peer sr-only"
            />
            <span className="sr-only">
              {labelOf(v)}
              {out && ", sold out"}
            </span>
            <span
              aria-hidden="true"
              className={
                "relative grid size-6 place-items-center overflow-hidden rounded-control bg-cover bg-center pointer-coarse:size-8 " +
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
              }
              style={{
                backgroundColor: v.swatch?.color,
                backgroundImage: v.swatch?.image ? `url("${v.swatch.image}")` : undefined,
                color: ink ?? "var(--fg)",
              }}
            >
              {/* Sold out fades the color, never the hairline, so the chip keeps its edge on any surface. */}
              {out && <span className="absolute inset-0 bg-canvas opacity-60" />}
              <span className="pointer-events-none absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_12%,transparent)]" />
              {on && <CheckIcon className="relative" />}
            </span>
          </label>
        );
      })}
    </div>
  ) : (
    <LayoutGroup id={groupId}>
      <div data-body="press" className="relative grid h-control-md w-full grid-flow-col auto-cols-fr rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
        {values.map((v) => {
          const on = v.value === value;
          const out = v.available === false;
          return (
            <label
              key={v.value}
              className={
                "litt-target relative grid h-full min-w-0 cursor-pointer select-none place-items-center rounded-[calc(var(--radius-control)-2px)] px-2 text-small font-title " +
                "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                (out ? "text-fg-disabled" : on ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS)
              }
            >
              <input
                type="radio"
                name={group}
                value={v.value}
                checked={on}
                onChange={() => onPick(v.value)}
                className="peer sr-only"
              />
              {on && (
                <motion.span
                  layoutId="option-surface"
                  transition={glide}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift) forced-colors:border-2"
                />
              )}
              <span className="litt-trim relative z-1 truncate">
                {labelOf(v)}
                {out && <span className="sr-only">, sold out</span>}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-1 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ----------------------------------------------------------------- the picker */

/** One option of a product as a choice of its values: a segmented track for words, chips for colors and images. */
export function OptionPicker({
  name,
  values,
  value: valueProp,
  defaultValue,
  onValueChange,
  inputName,
  className = "",
}: OptionPickerProps) {
  const auto = useId();
  const group = inputName ?? auto;
  const responsive = useTransition("responsive");
  const fun = useFun();
  const glide = fun ? fun.glide : responsive;
  const Body = byWorld(useMaterial(), { press: PressBody, flat: OptionPickerFlatBody, device: OptionPickerDeviceBody });
  const [inner, setInner] = useState<string | undefined>(defaultValue ?? values[0]?.value);
  const value = valueProp ?? inner;
  const picked = values.find((v) => v.value === value);
  const swatches = values.length > 0 && values.every((v) => v.swatch?.color || v.swatch?.image);
  /* A named color is read through a canvas, which the server does not have, so chips draw their check's ink after hydration. */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const pick = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  const labelOf = (v: OptionValue) => v.label ?? v.value;
  const inkOf = (v: OptionValue) => (hydrated || /^(#|rgb)/i.test(v.swatch?.color ?? "") ? inkOn(v.swatch?.color) : undefined);

  return (
    <fieldset className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className="mb-2 p-0 text-small">
        <span className="font-title text-fg">{name}</span>
        {picked && (
          <span aria-hidden="true" className="text-fg-subtle">
            {" · "}
            {labelOf(picked)}
            {picked.available === false && " · Sold out"}
          </span>
        )}
      </legend>

      <Body
        group={group}
        values={values}
        value={value}
        swatches={swatches}
        onPick={pick}
        labelOf={labelOf}
        inkOf={inkOf}
        glide={glide}
        groupId={auto}
      />
    </fieldset>
  );
}
