import { useState } from "react";
import { Button } from "@/components/button";
import { CardPicker } from "@/components/card-picker";
import { CodeIcon, GridIcon, ListIcon, UserIcon, UsersIcon, BuildingIcon } from "@/components/icons";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "card-picker",
  title: "Card picker",
  lede: "One choice shown as cards.",
  order: 4.1,
  group: "Controls",
  verbs: ["select"],
  summary:
    "One choice shown as cards: tiles of a picture over a word, or cards with a title, a line and a price. The picked card is the raised block in a sunken tray, and it glides to your pick on the responsive tier.",
  fun: "Pick another card: the raised block springs to it and settles a hair past its mark.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["card-picker"],
  exports: ["CardPicker"],
  usage: `import { CardPicker } from "@/components/card-picker";

const [plan, setPlan] = useState("pro");

// Cards: a title, a line and a detail. In a row when each gets 12rem, stacked when not.
<CardPicker
  legend="Plan"
  name="plan"
  value={plan}
  onValueChange={setPlan}
  options={[
    { value: "free", label: "Free", description: "One project, community support.", detail: "$0" },
    { value: "pro", label: "Pro", description: "Unlimited projects and previews.", detail: "$12 a month" },
    { value: "team", label: "Team", description: "Roles, audit log and SSO.", detail: "$40 a month" },
  ]}
/>

// Tiles: a picture over a word, in one tray, for a setting.
<CardPicker size="sm" legend="Layout" defaultValue="list" options={layouts} />`,
  use: [
    "One choice from two to six where seeing each answer helps: a plan with its price, an onboarding question, a theme or a layout.",
    "A plan or a question in a form. The cards are native radios, so name, required and the form value work as usual.",
    "A setting with two to five pictures, such as a layout or a theme. Use size sm, the tiles in the gallery's Customize panel.",
  ],
  skip: [
    "Two to five short words, such as Viewer or Editor. Use the Segmented control.",
    "More than six options, or a long list. Use a RadioGroup or a Select.",
    "Several choices at once. Use a CheckboxGroup.",
    "A product's size or frame. Use the Option picker, which names the pick in its legend and says when it is sold out.",
    "Cards that hold links or buttons. A card here is one label around one radio; use Cards beside a RadioGroup.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into the picker, onto the picked card, or the first card when none is picked. Press it again to leave."],
    [["←", "→", "↑", "↓"], "Moves to the previous or next card and picks it. At either end it wraps around. Disabled cards are skipped."],
  ],
  a11y: [
    "It is a fieldset with a legend and native radio inputs, so a screen reader says the question and reads each card as, for example, Pro, radio button 2 of 3, checked.",
    "A card's radio is named by its title alone, and its line and detail are read after it as its description: Pro, then Unlimited projects and previews, $12 a month.",
    "Pictures are hidden from screen readers. The title must stand alone.",
    "The picked card is a raised surface, not color alone, and in forced colors it takes a border.",
    "A stacked card is at least 64px tall, and a tile is about 70px, past the 44px touch floor.",
    "A disabled card is muted and skipped by the arrow keys. Its line stays readable, since it says why.",
    "An error is linked to the group and marks every radio invalid. Under reduced motion the raised block jumps to the pick without gliding.",
  ],
};

type Plan = "free" | "pro" | "team";

const PLANS: { value: Plan; label: string; description: string; detail: string }[] = [
  { value: "free", label: "Free", description: "One project and community support.", detail: "$0" },
  { value: "pro", label: "Pro", description: "Unlimited projects and previews.", detail: "$12 a month" },
  { value: "team", label: "Team", description: "Roles, an audit log and SSO.", detail: "$40 a month" },
];

function PlanDemo() {
  const [plan, setPlan] = useState<Plan>("pro");
  const picked = PLANS.find((p) => p.value === plan);
  return (
    <div className="grid w-full max-w-3xl gap-3">
      <CardPicker legend="Plan" name="plan" value={plan} onValueChange={setPlan} options={PLANS} />
      <p role="status" className="text-small text-fg-subtle">
        {picked?.label}, {picked?.detail}. Change plans any time.
      </p>
    </div>
  );
}

type Use = "personal" | "team" | "company" | "code";

function OnboardingDemo() {
  const [use, setUse] = useState<Use | null>(null);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState("");
  return (
    <form
      noValidate
      className="grid w-full max-w-xl gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!use) return setError("Pick one to continue.");
        setSent(`Sent use=${use}.`);
      }}
    >
      <CardPicker
        legend="What will you use Halo for?"
        name="use"
        required
        value={use}
        onValueChange={(v) => {
          setUse(v);
          setError(undefined);
        }}
        help="You can change this later in Settings."
        error={error}
        options={[
          { value: "personal", label: "Personal", description: "Notes and side projects.", picture: <UserIcon /> },
          { value: "team", label: "My team", description: "Shared projects and reviews.", picture: <UsersIcon /> },
          { value: "company", label: "My company", description: "Every team, with SSO.", picture: <BuildingIcon /> },
          { value: "code", label: "Code", description: "Repositories and builds.", picture: <CodeIcon /> },
        ]}
      />
      <div className="flex items-center gap-3">
        <Button type="submit">Continue</Button>
        <p role="status" className="text-small text-fg-subtle">
          {sent}
        </p>
      </div>
    </form>
  );
}

/** Three columns of cards, drawn in currentColor. */
function BoardPicture() {
  return (
    <span className="grid h-5 grid-cols-3 gap-0.5">
      {[3, 2, 1].map((n, i) => (
        <span key={i} className="grid content-start gap-0.5">
          {Array.from({ length: n }, (_, k) => (
            <span key={k} className="h-1.5 w-2 bg-current" />
          ))}
        </span>
      ))}
    </span>
  );
}

/** Three rows of a dense or a roomy list, drawn in currentColor. */
function DensityPicture({ gap }: { gap: "gap-0.5" | "gap-1.5" }) {
  return (
    <span className={"grid w-6 " + gap}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-0.5 rounded-pill bg-current" />
      ))}
    </span>
  );
}

function SettingsDemo() {
  return (
    <div className="grid w-full max-w-xs gap-6">
      <CardPicker
        size="sm"
        legend="Layout"
        defaultValue="list"
        help="Board needs a Status field in the table."
        options={[
          { value: "list", label: "List", picture: <ListIcon /> },
          { value: "grid", label: "Grid", picture: <GridIcon /> },
          { value: "board", label: "Board", picture: <BoardPicture />, disabled: true },
        ]}
      />
      <CardPicker
        size="sm"
        legend="Density"
        disabled
        defaultValue="roomy"
        help="Your workspace sets the density."
        options={[
          { value: "compact", label: "Compact", picture: <DensityPicture gap="gap-0.5" /> },
          { value: "roomy", label: "Roomy", picture: <DensityPicture gap="gap-1.5" /> },
        ]}
      />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function LayoutTile() {
  return (
    <div className="w-full max-w-xs">
      <CardPicker
        size="sm"
        legend="Layout"
        defaultValue="grid"
        options={[
          { value: "list", label: "List", picture: <ListIcon /> },
          { value: "grid", label: "Grid", picture: <GridIcon /> },
          { value: "board", label: "Board", picture: <BoardPicture /> },
        ]}
      />
    </div>
  );
}

export default function CardPickerPage() {
  return (
    <Page meta={meta} docs={docs} tile={<LayoutTile />}>
      <Stage
        title="A plan"
        tier="responsive"
        size="lg"
        code="PlanDemo"
        caption="Three plans in one sunken tray, each a card with a title, a line and a price. The picked card is the raised block, and it glides to your pick through transform on the responsive tier, never the accent. Every card has the same size, so the block keeps its shape as it moves and the prices line up. The cards sit in a row while each gets 12rem of the picker's own width, and stack as rows below that, as on a phone."
      >
        <PlanDemo />
      </Stage>

      <Stage
        title="An onboarding question"
        tier="responsive"
        size="lg"
        code="OnboardingDemo"
        caption="Nothing is picked until the person answers, because a question must not answer itself. Continue with nothing picked sets the error, which replaces the hint, outlines the tray in the danger color and marks every radio invalid; a pick clears it. Four cards sit two by two once each gets 12rem, and four across from 48rem."
      >
        <OnboardingDemo />
      </Stage>

      <Stage
        title="A setting"
        tier="responsive"
        code="SettingsDemo"
        caption="Size sm draws tiles, a picture over a word, as in the gallery's Customize panel. Pictures draw in currentColor, so the picked one steps up to the stronger ink with its word. Board is disabled and skipped by the arrow keys, and the hint says why. A disabled picker passes it to every tile through the fieldset."
      >
        <SettingsDemo />
      </Stage>
    </Page>
  );
}
