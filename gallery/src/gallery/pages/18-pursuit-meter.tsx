import { useState } from "react";
import { PursuitMeter } from "@/components/pursuit-meter";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "pursuit-meter",
  title: "Pursuit meter",
  lede: "Condition ×1 to ×5 and bounty on a striped Heat slab.",
  order: 9.07,
  group: "Data",
  verbs: ["watch", "press"],
  worlds: ["heat"],
  summary:
    "Heat's namesake control: a square black slab banded with diagonal hazard stripes and framed by four outer ink corner brackets. It pairs the pursuit condition multiplier (×1 to ×5), a plain-word status tag (Cooldown, Active, Evade, Busted), a tabular bounty readout, and a 16-dash amber meter that turns danger red on Condition ×5 or Busted. It belongs to Heat.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["pursuit-meter", "button", "kbd", "tag"],
  exports: ["PursuitMeter"],
  usage: `import { PursuitMeter } from "@/components/pursuit-meter";

<PursuitMeter
  label="Rockport PD"
  defaultLevel={3}
  bounty={142500}
/>`,
  use: [
    "Live pursuit, heat, threat, or escalation tiers in a street-racing HUD or sports/event scoreboard under Heat.",
    "Pairing a stepped condition level (×1–×5) with a live bounty or score figure and plain-word status.",
  ],
  skip: [
    "Another world's page. PursuitMeter belongs to Heat's street-racing menu grammar and needs data-material=\"heat\" on <html>.",
    "A continuous upload or background job. Use Progress.",
    "A single static quota. Use Gauge.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to Cooldown and Raise heat buttons."],
    [["Enter", "Space"], "Steps the pursuit condition down or up by one level."],
    [["-"], "Cools down one condition while focus is inside the part, like Cooldown; stops at ×1."],
    [["+", "="], "Raises the condition one level while focus is inside the part, like Raise heat; stops at ×5."],
  ],
  a11y: [
    "The 16-dash bar exposes role=\"meter\" with aria-valuemin, aria-valuemax, aria-valuenow and a full aria-valuetext naming the condition and status.",
    "Status is always stated in words in the header Tag (Cooldown, Active, Evade, Busted), never by the amber or red dash fill alone.",
    "Stepping the level, by a button or a key, announces the new condition once in a polite status region.",
    "Each button names its key in aria-keyshortcuts. When a step disables the focused button, focus moves to the other one.",
  ],
};

function ActivePursuitDemo() {
  return <PursuitMeter label="Rockport PD" defaultLevel={3} bounty={142500} className="max-w-md" />;
}

function StatesDemo() {
  const [level, setLevel] = useState(5);
  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <PursuitMeter label="Cooldown zone" level={1} status="cooldown" bounty={48200} units={0} interactive={false} />
      <PursuitMeter label="Blacklist dispatch" level={level} onLevelChange={setLevel} status={level === 5 ? "busted" : "evade"} bounty={385000} units={level * 3} />
    </div>
  );
}

export default function PursuitMeterPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<PursuitMeter label="Rockport PD" defaultLevel={3} bounty={142500} className="max-w-sm" />}
    >
      <Stage
        title="Pursuit condition"
        tier="instant"
        code="ActivePursuitDemo"
        caption="Condition ×3 in progress: sixteen crisp dashes light in amber across the dark channel. Press Raise heat or Cooldown, or + and - with focus inside, to step from Local patrol up to Blacklist dispatch."
      >
        <ActivePursuitDemo />
      </Stage>
      <Stage
        title="Cooldown and busted states"
        tier="instant"
        code="StatesDemo"
        caption="Every state reads in words as well as dashes: Cooldown drops to green and zero units; Condition ×5 or Busted switches the bar to danger red."
      >
        <StatesDemo />
      </Stage>
      <TryIt
        of="PursuitMeter"
        component={PursuitMeter}
        props={{ label: "Rockport PD", defaultLevel: 3, bounty: 142500, className: "max-w-md" }}
        controls={[
          { name: "level", type: "number" },
          { name: "bounty", type: "number" },
          { name: "interactive", type: "boolean" },
        ]}
      />
    </Page>
  );
}
