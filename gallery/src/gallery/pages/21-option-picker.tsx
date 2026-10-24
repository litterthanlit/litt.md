import { useState } from "react";
import { OptionPicker } from "@/components/option-picker";
import { defaultPicks, findVariant, optionsFor } from "@/components/product-card";
import { Price } from "@/components/price";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { PRODUCTS } from "../shop";

export const meta: PageMeta = {
  id: "option-picker",
  title: "Option picker",
  lede: "One option of a product, such as its size or its frame.",
  order: 21.2,
  group: "Commerce",
  verbs: ["select"],
  summary:
    "One option of a product as native radios with a visible legend that names the pick. Words take the Segmented control's track, its raised surface gliding to the pick on the responsive tier; colors and images take chips with a check. A value that is sold out stays pickable, steps back to the disabled ink and says so in words.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["option-picker", "product-card"],
  exports: ["OptionPicker", "optionsFor", "findVariant", "defaultPicks"],
  usage: `import { OptionPicker } from "@/components/option-picker";
import { defaultPicks, findVariant, optionsFor } from "@/components/product-card";

const [picks, setPicks] = useState(() => defaultPicks(product));
const variant = findVariant(product, picks);

// optionsFor marks each value sold out or not, given the other picks.
{optionsFor(product, picks).map((option) => (
  <OptionPicker
    key={option.name}
    name={option.name}
    values={option.values}
    value={picks[option.name]}
    onValueChange={(value) => setPicks({ ...picks, [option.name]: value })}
  />
))}

// Values with a swatch show as chips. The color is the product's (Shopify's hex), not litt's.
<OptionPicker name="Frame" values={frames.map((f) => ({ value: f.name, swatch: { color: f.hex } }))} />`,
  use: [
    "A product's option with a few short values: a size, a fit, a finish. Words show as a segmented track.",
    "A color or a material, where the swatch is the fastest way to tell values apart. Give each value a swatch.",
    "Any value can be sold out among the other picks. optionsFor works that out from the variants.",
  ],
  skip: [
    "An option with many values, or long ones, such as 30 shoe sizes. Use a Select, which a long list fits.",
    "A choice that is not a product's option, such as Light or Dark. Use the Segmented control.",
    "A color someone picks freely, not from a product's list. Use the Color picker.",
  ],
  keyboard: [
    [["Tab"], "Moves into the option, onto its picked value, and on to the next option."],
    [["ArrowLeft", "ArrowRight"], "Picks the previous or next value. Up and Down do the same."],
  ],
  a11y: [
    "Each option is a fieldset of native radios named by its legend (\"Frame\"), so a screen reader says which option and how many values.",
    "A swatch's radio is named by its value (\"Natural oak\"), and the picked value's name is written in the legend, so the color is never the only label.",
    "A sold-out value says \"sold out\" in its name, and the legend says \"Sold out\" while it is picked. It stays pickable, so the reason is found, not hidden behind a disabled control.",
    "The picked part of the legend is hidden from screen readers, which hear the pick on the checked radio instead of twice.",
    "Focus is the 2px ring: inset on a segment, at a 2px offset around a chip. On a touch screen a chip grows to 32px.",
  ],
};

const PRINT = PRODUCTS[2]!; // Silk: A1 is sold out in Walnut and White.

function PrintOptionsDemo() {
  const [picks, setPicks] = useState(() => defaultPicks(PRINT));
  const variant = findVariant(PRINT, picks);
  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-1">
        <h3 className="text-body font-title text-fg">{PRINT.title}</h3>
        {variant && <Price price={variant.price} className="text-body" />}
      </div>
      {optionsFor(PRINT, picks).map((option) => (
        <OptionPicker
          key={option.name}
          name={option.name}
          values={option.values}
          value={picks[option.name]}
          onValueChange={(value) => setPicks({ ...picks, [option.name]: value })}
        />
      ))}
      <p className="text-small text-fg-subtle" aria-live="polite">
        {variant?.available ? `${variant.title} is in stock.` : `${variant?.title ?? "That pick"} is sold out.`}
      </p>
    </div>
  );
}

function KindsDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <OptionPicker name="Fit" values={[{ value: "Slim" }, { value: "Regular" }, { value: "Relaxed" }]} defaultValue="Regular" />
      <OptionPicker
        name="Paper"
        values={[{ value: "Matte" }, { value: "Satin" }, { value: "Gloss", available: false }]}
        defaultValue="Matte"
      />
      <OptionPicker
        name="Color"
        values={[
          { value: "Ink", swatch: { color: "#22262e" } }, // litt-allow: user data, a product's color
          { value: "Sand", swatch: { color: "#d8c7a8" } }, // litt-allow: user data
          { value: "Moss", swatch: { color: "#5f6b4a" } }, // litt-allow: user data
          { value: "Rust", swatch: { color: "#a4512f" }, available: false }, // litt-allow: user data
          { value: "Chalk", swatch: { color: "#f3f1ec" } }, // litt-allow: user data
        ]}
        defaultValue="Sand"
      />
    </div>
  );
}

export default function OptionPickerPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A print's size and frame"
        tier="responsive"
        align="start"
        code="PrintOptionsDemo"
        caption="Pick A1: Walnut and White fade, because they are sold out at that size. Pick one of them anyway and the legend says Sold out, in words. The size's raised surface glides to the pick on the responsive tier; the frame's check appears at once. The price follows the variant."
      >
        <PrintOptionsDemo />
      </Stage>

      <Stage
        title="Words and swatches"
        tier="responsive"
        align="start"
        code="KindsDemo"
        caption="Values with no swatch show as a segmented track that fills its column. Values with a color show as chips; the check is black or white, whichever reads on that color. A sold-out value steps back to the disabled ink, or a chip to a faded color under its hairline, and stays pickable."
      >
        <KindsDemo />
      </Stage>
    </Page>
  );
}
