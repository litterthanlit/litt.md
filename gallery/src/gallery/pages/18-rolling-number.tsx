import { useState } from "react";
import { Button } from "@/components/button";
import { RollingNumber } from "@/components/rolling-number";
import { Stat, StatGroup } from "@/components/stat";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "rolling-number",
  title: "Rolling number",
  lede: "A figure whose changed digits roll to the new value.",
  order: 17.25,
  group: "Data",
  verbs: ["watch"],
  summary:
    "A number that updates in place, such as a Stat's value. Only the digits that change move: each leaves half of the travel token and fades as the new one comes in from the other side, on the responsive tier. Up from below when the value rises, down from above when it falls. The first render and reduced motion just show the number.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["rolling-number"],
  exports: ["RollingNumber"],
  usage: `import { RollingNumber } from "@/components/rolling-number";
import { Stat } from "@/components/stat";

// A Stat stays still; pass a RollingNumber as its value to roll it.
<Stat label="Deploys this week" value={<RollingNumber value={deploys} />} />

// Any Intl.NumberFormat format.
<RollingNumber value={12480.5} format={{ style: "currency", currency: "EUR" }} />
<RollingNumber value={0.64} format={{ style: "percent" }} />`,
  use: [
    "A figure that changes while someone watches it, because of something they did: a deploy count after Deploy, credits after a build, a total after an edit.",
    "A Stat whose value updates live. The roll says that it changed and which way, without a toast.",
    "A counter in a toolbar or a footer, such as selected rows.",
  ],
  skip: [
    "A figure that loads once. Show it; a roll on first render would be motion that confirms nothing, so it does not roll.",
    "A number that changes many times a second, such as a timer. It would never stop moving; use plain tabular figures.",
    "Several figures that change together in one view. Roll the one the person caused, and let the rest just change.",
  ],
  a11y: [
    "Screen readers get the whole formatted figure as text. The rolling cells are hidden from them, so nobody hears single digits.",
    "A change is not announced. If it matters, say it in a polite live region, such as a status line beside the button that caused it.",
    "Under reduced motion the hooks return 0 and the digits simply change.",
  ],
};

/* ---------------------------------------------------------- deploys and credits */

function DeploysDemo() {
  const [deploys, setDeploys] = useState(38);
  const [credits, setCredits] = useState(20830);
  const [said, setSaid] = useState("");
  const deploy = () => {
    setDeploys((d) => d + 1);
    setCredits((c) => c - 120);
    setSaid("Deployed atelier-nord.com. 120 credits used.");
  };
  return (
    <div className="grid w-full max-w-xl gap-4">
      <StatGroup>
        <Stat label="Deploys this week" value={<RollingNumber value={deploys} />} delta="Up 12% on last week" tone="good" />
        <Stat label="Credits left" value={<RollingNumber value={credits} />} delta="About 120 a deploy" />
      </StatGroup>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={deploy}>
          Deploy
        </Button>
        <p role="status" className="text-small text-fg-subtle">
          {said}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- money */

function RevenueDemo() {
  const [cents, setCents] = useState(1248050);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Stat label="Revenue, October" value={<RollingNumber value={cents / 100} format={{ style: "currency", currency: "EUR" }} />} />
      <div className="flex flex-wrap gap-3">
        <Button size="sm" onClick={() => setCents((c) => c + 89900)}>
          Add the Halden invoice
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCents((c) => Math.max(0, c - 12500))}>
          Refund €125
        </Button>
      </div>
    </div>
  );
}

export default function RollingNumberPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Deploys and credits"
        tier="responsive"
        align="start"
        code="DeploysDemo"
        caption="Press Deploy. The deploy count rises and its last digit rolls up from below; the credits fall and their changed digits roll down from above. Only the digits that change move, by half of the travel token, on the responsive tier. The Stat tiles themselves stay still."
      >
        <DeploysDemo />
      </Stage>

      <Stage
        title="Money"
        tier="responsive"
        align="start"
        code="RevenueDemo"
        caption="Any Intl format rolls: here euros with cents. Characters line up from the right, so when a figure grows a column, the new digit and its comma just appear and the rest roll."
      >
        <RevenueDemo />
      </Stage>

      <TryIt of="RollingNumber" component={RollingNumber} props={{ value: 12480, className: "text-h1 text-fg" }} controls={[{ name: "value", type: "number", min: 0, max: 9999999, step: 1 }, "locale"]} />
    </Page>
  );
}
