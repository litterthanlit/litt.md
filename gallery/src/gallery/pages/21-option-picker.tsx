import { useState } from "react";
import { OptionPicker } from "@/components/option-picker";
import { defaultPicks, findVariant, optionsFor } from "@/components/product-card";
import { Price } from "@/components/price";
import { MaterialProvider } from "@/motion";
import { useCustomize, useDark } from "../customize-state";
import { lookAttributes, BODY_WORLDS } from "../look";
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
    "One option of a product as native radios with a visible legend that names the pick. Words are blocks in a tray in Press and grey pills in Flat; colors and images are small blocks or plain circles. The pick is raised and lit, or an ink pill, or a ringed circle. A value that is sold out stays pickable, steps back and says so in words.",
  tiers: ["instant"],
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

function ThreeBodiesDemo() {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      {BODY_WORLDS.map((m) => (
        <figure key={m.id} className="m-0 grid min-w-0 content-start gap-3">
          <div
            {...lookAttributes({ accent: look.accent, material: m.id }, dark)}
            className="grid min-h-56 min-w-0 content-center gap-6 rounded-surface bg-canvas p-8 text-fg outline-1 -outline-offset-1 outline-line"
          >
            <MaterialProvider material={m.id}>
              <OptionPicker
                name="Paper"
                values={[{ value: "Matte" }, { value: "Satin" }, { value: "Gloss", available: false }]}
                defaultValue="Satin"
              />
              <OptionPicker
                name="Color"
                values={[
                  { value: "Ink", swatch: { color: "#22262e" } }, // litt-allow: user data, a product's color
                  { value: "Sand", swatch: { color: "#d8c7a8" } }, // litt-allow: user data
                  { value: "Rust", swatch: { color: "#a4512f" }, available: false }, // litt-allow: user data
                ]}
                defaultValue="Sand"
              />
            </MaterialProvider>
          </div>
          <figcaption className="text-caption text-fg-muted">{m.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function OptionPickerPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A print's size and frame"
        tier="instant"
        align="start"
        code="PrintOptionsDemo"
        caption="Pick A1: Walnut and White fade, because they are sold out at that size. Pick one of them anyway and the legend says Sold out, in words. A pick changes on the instant tier; nothing glides. The price follows the variant."
      >
        <PrintOptionsDemo />
      </Stage>

      <Stage
        title="Words and swatches"
        tier="instant"
        align="start"
        code="KindsDemo"
        caption="Values with no swatch are words, in blocks or pills by world. Values with a color are chips; in Press the check is black or white, whichever reads on that color, and in Flat the chosen circle is ringed in ink. A sold-out value steps back and stays pickable."
      >
        <KindsDemo />
      </Stage>

      <Stage
        title="Three bodies"
        tier="instant"
        caption="One picker, one contract, three bodies. Press is one tray with a block per value: the chosen block is raised and lit, the others sit seated, a sold-out one lies flat as a cut in the floor, and a color is a small block of its own. Flat has no tray: words in grey pills, the chosen in an ink pill, a sold-out one outlined, struck through and said in words, and colors as plain circles with the chosen one ringed in ink. Device is a bank of latching keys with engraved legends: the picked one stays down with its lamp lit, and a sold-out one lies flat with no skirt and says so in words. Each is drawn here whatever look the page is in; the radios, the arrow keys and what a screen reader hears are the same in all three."
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>
    </Page>
  );
}
