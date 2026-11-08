import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { SevenSegment } from "@/components/seven-segment";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "seven-segment",
  title: "Seven-segment",
  lede: "A figure on seven-segment digits behind glass.",
  order: 17.26,
  group: "Data",
  verbs: ["watch"],
  worlds: ["device"],
  summary:
    "A count or a reading drawn the way a meter draws it: one figure per character, each seven slanted segments behind LCD glass, the unlit ones the ink at a tenth and the lit ones the ink. A change lights the new segments at once and lets the old ones fade like phosphor on the instant tier. It takes digits, a minus, a dot and a space. It belongs to Device.",
  tiers: ["instant"],
  mechanism:
    "A new value lights its segments at once. The ones that go out do not switch off: their brightness is multiplied by exp(-dt / 0.11) each frame, like phosphor, and a segment under 0.02 is written as out. One small loop per readout writes the segments' opacity attributes, never React state, and stops when every segment has settled. Unlit segments rest at the ink's 10%, so the whole figure is always legible. Nothing moves on its own: the readout only changes when its value does. Reduced motion switches the segments at once.",
};

export const docs: PageDocs = {
  components: ["seven-segment"],
  exports: ["SevenSegment"],
  usage: `import { SevenSegment } from "@/components/seven-segment";

<SevenSegment value={38} digits={4} label="Deploys today" />

// A minus, a dot and a space are figures too. The dot shares the figure before it.
<SevenSegment value="-12.5" label="Studio temperature" />`,
  use: [
    "A count or a reading that changes while someone watches, under Device: deploys today, credits left, a temperature, a timer set by hand.",
    "A fixed width that the value fills from the right, as a meter does: pass digits so the glass does not change size when the count gains a figure.",
  ],
  skip: [
    "Another material's page. Use Rolling number, which rolls the changed digits; this needs data-material=\"device\" on <html> to look like itself.",
    "Words or letters. Seven segments draw digits, a minus, a dot and a space only.",
    "A figure that must be selected or copied. The segments are a picture; show the text beside it.",
  ],
  a11y: [
    "The figures are hidden from assistive tech. The value is said in hidden text in words, with a minus as \"minus\" (\"minus 12.5\"), after the label if there is one.",
    "A change is not announced. If it matters, say it in a polite live region beside the control that caused it.",
    "A value too long for its digits shows a bar on every figure and never a wrong number; the hidden text still has the whole value.",
    "Under reduced motion the segments switch at once.",
  ],
};

function CounterDemo() {
  const [deploys, setDeploys] = useState(38);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <SevenSegment value={deploys} digits={4} label="Deploys today" />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => setDeploys((d) => Math.min(9999, d + 1))}>
          Deploy
        </Button>
        <Button size="sm" onClick={() => setDeploys((d) => Math.min(9999, d + 100))}>
          Deploy a hundred
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDeploys(0)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function ThermostatDemo() {
  const [tenths, setTenths] = useState(215);
  const text = (tenths / 10).toFixed(1);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <SevenSegment value={text} digits={5} label="Studio temperature" />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => setTenths((t) => t - 30)}>
          Colder
        </Button>
        <Button size="sm" onClick={() => setTenths((t) => t + 30)}>
          Warmer
        </Button>
      </div>
      <p className="text-small text-fg-subtle">Goes below zero: the minus is the middle bar of the first figure.</p>
    </div>
  );
}

/** From 88 to 12, so the Replay shows the segments that go out fade while the new ones light at once. */
function ReplaySegments() {
  const { reduced } = useMotionDial();
  const [value, setValue] = useState(reduced ? "12.5" : "88.8");
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setValue("12.5"), 300);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return <SevenSegment value={value} label="Studio temperature" />;
}

export const study: PageStudy = {
  object: <SevenSegment value="88.8" label="Studio temperature" />,
  parts: [
    { name: "The glass", selector: "span" },
    { name: "A figure", selector: "svg" },
    { name: "A lit segment", selector: "svg polygon" },
    { name: "The point", selector: "svg circle" },
  ],
  states: {
    default: <SevenSegment value="12.5" label="Studio temperature" />,
    empty: <SevenSegment value="" digits={4} label="Deploys today" />,
  },
  replay: {
    label: "Replay the change",
    caption: "Watch the new segments light at once while the ones that went out fade away behind them.",
    run: () => <ReplaySegments />,
  },
};

export default function SevenSegmentPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="A count"
        tier="instant"
        align="start"
        code="CounterDemo"
        caption="Press Deploy. The new segments light at once and the ones that went out fade behind them, so a figure that changes leaves a short trace. The count is right-aligned in four figures and the glass never changes size. Nothing moves until the value does."
      >
        <CounterDemo />
      </Stage>

      <Stage
        title="A reading"
        tier="instant"
        align="start"
        code="ThermostatDemo"
        caption="A minus is the middle bar, and a dot lights the point at the foot of the figure before it. Step the temperature down through zero and watch the minus arrive with the figure that changes."
      >
        <ThermostatDemo />
      </Stage>

      <TryIt of="SevenSegment" component={SevenSegment} props={{ value: "12.5", label: "Studio temperature" }} controls={[{ name: "value", type: "text" }, { name: "digits", type: "number", min: 1, max: 8, step: 1 }, "label"]} />
    </Page>
  );
}
