import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { ColorPanel, ColorPicker, describeColor, getContrastInk, type ColorSwatch } from "@/components/color-picker";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "color-picker",
  title: "Color picker",
  lede: "One color, picked by eye or typed as hex.",
  order: 3.9,
  group: "Controls",
  verbs: ["drag", "type", "select"],
  summary:
    "One color, kept as a hex string. A saturation and brightness area, a hue rail, the hex as text, an eyedropper where the browser has one, and optional swatches. The field opens it in a popover, a bottom sheet on a phone. The thumbs follow the pointer and the keys at once; only the popover moves, on the responsive tier.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["color-picker"],
  exports: ["ColorPicker", "ColorPanel", "parseHex", "describeColor", "getContrastInk", "hexToHsv", "hsvToHex"],
  usage: `import { ColorPicker, ColorPanel, getContrastInk } from "@/components/color-picker";

// A field in a form. A form gets the hex under name.
const [brand, setBrand] = useState<string | null>(null);
<ColorPicker
  label="Brand color"
  name="brand"
  value={brand}
  onValueChange={setBrand}
  swatches={palette} // [{ label: "Atelier blue", value: hex }, …]
/>

// The panel on its own, saved on release.
<ColorPanel label="Cover color" defaultValue={project.cover} onValueCommit={(hex) => saveCover(hex)} />

// Text on the user's color: black or white, whichever reads.
<div style={{ backgroundColor: brand, color: getContrastInk(brand) }}>Atelier Nord</div>`,
  use: [
    "A color that belongs to the person's content, not to the interface: a brand color for a Framer site, a project's cover, a label they made.",
    "People should feel their way to a color and also be able to paste one. The hex field takes three or six digits, with or without the hash.",
    "A palette they already have. Pass swatches so the brand's colors are one click away.",
    "Save when the person lets go. Use onValueCommit, not onValueChange, which fires on every move of a thumb.",
  ],
  skip: [
    "Colors of the interface itself. litt's colors live in tokens.css; a theme switch is Segmented.",
    "A few named colors, such as the five data hues. Use Segmented or Select with the names.",
    "A color with transparency. This picks opaque colors; alpha is not part of the value.",
    "Exact values in another space, such as OKLCH or CMYK for print. This speaks hex.",
  ],
  keyboard: [
    [["Enter", "Space"], "On the field: opens the panel with focus on the area."],
    [["←", "→"], "On the area: less or more saturation. On the hue: moves the hue one degree."],
    [["↑", "↓"], "On the area: more or less brightness. On the hue: moves the hue one degree."],
    [["Shift + arrow"], "Moves ten steps."],
    [["Page Up", "Page Down"], "On the area: brightness up or down by ten. On the hue: the browser's large step."],
    [["Home", "End"], "On the area: no saturation or full. On the hue: either end of the rail."],
    [["Tab"], "Moves from the area to the hue, the hex, the eyedropper and the swatches."],
    [["Enter"], "On the hex: applies what was typed. A hex that is not a color goes back to the last one."],
    [["Esc"], "Closes the panel, keeps the color and returns focus to the field."],
  ],
  a11y: [
    "The area is two visually hidden range inputs, Saturation and Brightness, as in React Aria's color area. One tab stop: Saturation is in the tab order, Brightness is skipped by Tab and still reachable by a screen reader.",
    "Every input's aria-valuetext says the color in words and as hex, such as \"Saturation 64%, Dark blue, #1f3a8a\", so the color is heard, not only seen.",
    "The hue is a native range input named Hue, read in degrees with the same words.",
    "The swatches are native radios in a fieldset, named by their label and hex, so the arrow keys move between them and the picked one is announced. The check on the picked chip is black or white, whichever reads on that chip.",
    "The field is a button with aria-haspopup=\"dialog\", named by its label and the color in words. A hint or an error is linked with aria-describedby, and an error sets aria-invalid.",
    "The hex field is aria-invalid while what was typed is not a color, and puts the last good color back when it loses focus.",
    "The eyedropper shows only where the browser has one. The hex and the swatches do the same job everywhere else.",
    "The thumbs show a 2px focus ring when an input is focus-visible. A press moves the thumb without the ring, and nothing ever changes size.",
  ],
};

/* The swatches and starting colors are the person's data, so they are written as hex. litt-allow on each line says so. */
const PALETTE: ColorSwatch[] = [
  { label: "Atelier blue", value: "#2f5bd3" }, // litt-allow: user data, a brand palette
  { label: "Nord teal", value: "#1d5c5a" }, // litt-allow: user data
  { label: "Clay", value: "#c2643f" }, // litt-allow: user data
  { label: "Ochre", value: "#d9a441" }, // litt-allow: user data
  { label: "Moss", value: "#5b7a3a" }, // litt-allow: user data
  { label: "Plum", value: "#6b3d6e" }, // litt-allow: user data
  { label: "Studio ink", value: "#1c1b19" }, // litt-allow: user data
  { label: "Paper", value: "#f4efe6" }, // litt-allow: user data
];

/** A quiet status line beside a field, so each stage shows what it did. */
function Status({ children }: { children: string }) {
  return (
    <p role="status" className="min-h-5 text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

/* ---------------------------------------------------------- a brand color */

function BrandColorDemo() {
  const [brand, setBrand] = useState<string | null>("#2f5bd3"); // litt-allow: user data
  const [sent, setSent] = useState("");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(`Sent brand=${new FormData(e.currentTarget).get("brand")}`);
  };
  return (
    <form onSubmit={submit} className="grid w-full max-w-sm gap-6">
      <ColorPicker
        label="Brand color"
        name="brand"
        value={brand}
        onValueChange={(hex) => {
          setBrand(hex);
          setSent("");
        }}
        swatches={PALETTE}
        hint="Fills the header and the buttons of the Atelier Nord site."
      />
      {brand && (
        <div className="overflow-hidden rounded-surface shadow-[inset_0_0_0_1px_var(--line)]" aria-label="Preview of the site header" role="img">
          <div className="flex h-12 items-center justify-between px-4 text-small" style={{ backgroundColor: brand, color: getContrastInk(brand) }}>
            <span className="font-title">Atelier Nord</span>
            <span>Work · Studio · Contact</span>
          </div>
          <p className="p-4 text-small text-fg-muted">Furniture and objects from Oslo, made to order.</p>
        </div>
      )}
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Save theme
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------- the panel on its own */

function CoverColorDemo() {
  const [cover, setCover] = useState("#1d5c5a"); // litt-allow: user data
  const [saved, setSaved] = useState("");
  return (
    <div className="flex w-full max-w-xl flex-wrap items-start gap-8">
      <ColorPanel
        label="Cover color"
        className="w-64"
        value={cover}
        onValueChange={setCover}
        onValueCommit={(hex) => setSaved(`Saved to Halden Gallery: ${describeColor(hex).toLowerCase()}, ${hex}`)}
        swatches={PALETTE.slice(0, 6)}
      />
      <div className="grid min-w-48 flex-1 content-start gap-3">
        <div
          role="img"
          aria-label={`Project cover in ${describeColor(cover).toLowerCase()}`}
          className="grid aspect-4/3 place-items-end rounded-surface p-4"
          style={{ backgroundColor: cover, color: getContrastInk(cover) }}
        >
          <span className="text-h4">Gallery identity</span>
        </div>
        <p className="text-small text-fg-muted">Halden Gallery · wordmark, grid and color</p>
        <Status>{saved}</Status>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- states */

const CLIENT = "#c2643f"; // litt-allow: user data

function StatesDemo() {
  const [accent, setAccent] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-sm gap-6">
      <ColorPicker
        label="Label color"
        size="sm"
        value={accent}
        onValueChange={setAccent}
        error={accent ? undefined : "Choose a color for the Framer label."}
      />
      <ColorPicker label="Client color" defaultValue={CLIENT} disabled hint="Set by Marlow Labs. Ask them to change it." />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

/** The picker and what it paints: the site's header in the chosen color, with ink picked to read on it. It starts on
    Nord teal, so the wall's one cobalt stays the Button tile's. */
function BrandTile() {
  const [brand, setBrand] = useState<string | null>(PALETTE[1]!.value);
  return (
    <div className="grid w-full max-w-sm gap-6">
      <ColorPicker label="Brand color" name="brand" value={brand} onValueChange={setBrand} swatches={PALETTE} />
      {brand && (
        <div className="overflow-hidden rounded-surface shadow-[inset_0_0_0_1px_var(--line)]" aria-label="Preview of the site header" role="img">
          <div className="flex h-12 items-center justify-between px-4 text-small" style={{ backgroundColor: brand, color: getContrastInk(brand) }}>
            <span className="font-title">Atelier Nord</span>
            <span>Work · Studio · Contact</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ColorPickerPage() {
  return (
    <Page meta={meta} docs={docs} tile={<BrandTile />}>
      <Stage
        title="A brand color for a Framer site"
        tier="responsive"
        size="lg"
        align="start"
        code="BrandColorDemo"
        caption="The field is the Select's raised trigger with a chip of the color and its hex, held pressed while the panel is open. Click it and the panel grows out of it in a popover, on the responsive tier. Drag the area or the hue and the header under the field changes at once, with no easing. A swatch picks in one click. The text on the header is black or white, whichever reads."
      >
        <BrandColorDemo />
      </Stage>

      <Stage
        title="A project cover"
        tier="responsive"
        align="start"
        code="CoverColorDemo"
        caption="The panel on its own, beside what it colors. The area and the hue are cut into the panel, and their thumbs are caps seen from above, a ring that stands over any color. Tab once to reach the area, then the arrows move the thumb and Shift makes them ten steps. Type a hex and press Enter, or paste one with three digits. The line under the cover is written on release, from onValueCommit. Nothing here moves on its own."
      >
        <CoverColorDemo />
      </Stage>

      <Stage
        title="Empty, error and locked"
        tier="responsive"
        align="start"
        code="StatesDemo"
        caption="With no color the field says so in the quiet ink, and the error under it says what to do until a color is picked. The locked field keeps its chip and hex readable, with a hint that says why it is locked."
      >
        <StatesDemo />
      </Stage>
    </Page>
  );
}
