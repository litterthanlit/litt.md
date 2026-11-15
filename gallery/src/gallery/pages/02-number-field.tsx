import { useState } from "react";
import { NumberField } from "@/components/number-field";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "number-field",
  title: "Number field",
  lede: "A number you set, with − and + in the field.",
  order: 2.25,
  group: "Controls",
  verbs: ["type", "press"],
  summary:
    "A labelled number in the Input's cut, with − and + as raised blocks inside the field's end. It steps by the arrow keys, by a press, or by holding a stepper down; what is typed is read in the page's locale when the field is left, kept between its bounds, put on the step and shown formatted. A pressed stepper sinks half a pixel and the line fades on the instant tier, as an Input's does.",
  fun: "Drag the label sideways to scrub the value, past either end too; press + or \u2212 and the number kicks.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["number-field"],
  exports: ["NumberField"],
  usage: `import { NumberField } from "@/components/number-field";

const [seats, setSeats] = useState<number | null>(8);

// Bounds, a step and a unit. The steppers are disabled at the bounds.
<NumberField label="Seats" unit="seats" min={1} max={50} value={seats} onValueChange={setSeats} help="€12 a seat a month." />

// Formatted with Intl.NumberFormat: a price in euros, a share as a percent (the value is 0.15 for 15%).
<NumberField label="Price" format={{ style: "currency", currency: "EUR" }} step={0.5} min={0} defaultValue={24} />
<NumberField label="Discount" format={{ style: "percent" }} step={0.05} min={0} max={1} defaultValue={0.15} />`,
  use: [
    "A count or an amount someone adjusts by small steps: seats, a quantity, a limit, a retry count.",
    "A number with bounds that matter, where the field should keep it inside them.",
    "A price or a share, shown formatted while it is not being typed.",
  ],
  skip: [
    "A value picked by feel along a range, such as volume or a blur radius. That is a Slider.",
    "Digits that are not an amount: a phone number, a card number, a code. Those are a TextField or a CodeInput.",
    "A choice between a few fixed numbers, such as 1, 5 or 10 GB. That is a Segmented control or a Select.",
  ],
  keyboard: [
    [["ArrowUp", "ArrowDown"], "Step up or down by one step."],
    [["Shift"], "With an arrow, step ten times."],
    [["PageUp", "PageDown"], "Step ten times."],
    [["Home", "End"], "Go to the lowest or the highest value, when there is one."],
    [["Enter"], "Read what was typed, as leaving the field does."],
  ],
  a11y: [
    "The input is a spinbutton named by the label, with aria-valuenow, aria-valuemin and aria-valuemax, and the formatted value with its unit as aria-valuetext (\"8 seats\").",
    "The steppers are named for what they do (\"Increase seats\") and point at the field. They are not Tab stops, because the arrow keys do the same, and pressing one leaves focus where it was.",
    "A hint or an error under the field is linked with aria-describedby, and an error sets aria-invalid.",
    "Text that is not a number goes back to the last value instead of being lost into an empty field.",
    "On a touch screen the text is 16px, so the page never zooms, and an sm field grows to 44px.",
  ],
};

const PRICE = 12;
const EUR = new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function SeatsDemo() {
  const [seats, setSeats] = useState<number | null>(8);
  return (
    <NumberField
      label="Seats"
      unit="seats"
      min={1}
      max={50}
      value={seats}
      onValueChange={setSeats}
      required
      help={seats === null ? "Between 1 and 50." : `${EUR.format(PRICE)} a seat, ${EUR.format(seats * PRICE)} a month.`}
      className="w-full max-w-xs"
    />
  );
}

function FormatsDemo() {
  const [limit, setLimit] = useState<number | null>(120);
  return (
    <div className="grid w-full max-w-2xl gap-8 sm:grid-cols-2">
      <NumberField label="Price" format={{ style: "currency", currency: "EUR" }} step={0.5} min={0} defaultValue={24} />
      <NumberField label="Discount" format={{ style: "percent" }} step={0.05} min={0} max={1} defaultValue={0.15} />
      <NumberField
        label="Storage limit"
        unit="GB"
        step={10}
        min={10}
        max={100}
        value={limit}
        onValueChange={setLimit}
        error={limit !== null && limit > 100 ? "Your plan goes up to 100 GB." : undefined}
      />
      <NumberField label="Retries" min={0} max={5} defaultValue={3} disabled help="Set by your plan." />
    </div>
  );
}

function SizesDemo() {
  return (
    <div className="grid w-full max-w-xs gap-6">
      <NumberField label="Small" size="sm" defaultValue={4} min={0} />
      <NumberField label="Medium" defaultValue={4} min={0} />
      <NumberField label="Large" size="lg" defaultValue={4} min={0} />
    </div>
  );
}

export default function NumberFieldPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Seats on a plan"
        tier="instant"
        align="start"
        code="SeatsDemo"
        caption="Press + or −, hold one down to run, or use the arrow keys in the field. Each stepper is a block standing up out of the field, and it sinks while you press it. At 1 and at 50 the stepper that would go past is disabled and lies flat. Type a number and leave the field: it is kept between the bounds, put on a whole seat and shown with its unit. The total under it follows."
      >
        <SeatsDemo />
      </Stage>

      <Stage
        title="Formats and states"
        tier="instant"
        align="start"
        code="FormatsDemo"
        caption="A price in euros steps by 0.50 and shows the currency while you are not typing in it. A percent holds 0.15 and shows 15%; type 20 and it reads 20%. The storage limit starts past its bound, so it says so in the danger color; one step down brings it back. A disabled field lies flat with its steppers and keeps its value and its hint."
      >
        <FormatsDemo />
      </Stage>

      <Stage
        title="Sizes"
        align="start"
        code="SizesDemo"
        caption="The Input's three heights: 32, 44 and 56. The steppers are square blocks 4px inside the field, so they are 24, 36 and 48. On a touch screen the small field grows to 44, and its steppers to 36."
      >
        <SizesDemo />
      </Stage>

      <TryIt
        of="NumberField"
        component={NumberField}
        props={{ label: "Seats", unit: "seats", defaultValue: 8, min: 1, max: 50, className: "w-full max-w-xs" }}
        controls={["label", "unit", "size", "required", "disabled"]}
      />
    </Page>
  );
}
