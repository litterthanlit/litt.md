import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ArrowUpRightIcon, CopyIcon, MoreIcon, PlusIcon, SettingsIcon, TrashIcon } from "@/components/icons";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "button",
  title: "Button",
  order: 1, group: "Controls",
  summary: "Roomy, slightly rounded and weight 550. Hover changes the fill and press scales to 0.98, both on the instant tier, so the button answers without ever moving its box.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["button", "icons"],
  exports: ["Button", "Spinner"],
  usage: `import { Button } from "@/components/button";
import { PlusIcon, SettingsIcon } from "@/components/icons";

<Button variant="primary" onClick={save}>Save changes</Button>
<Button icon={<PlusIcon />}>New project</Button>
<Button><PlusIcon /> New project</Button> {/* the same: an icon child sits beside the label */}
<Button iconOnly variant="ghost" aria-label="Settings"><SettingsIcon /></Button>
<Button loading={saving}>Export</Button>`,
  use: [
    "A person does something: save, create, send, start a project.",
    "The main action in a view. Make it primary, because the accent fill appears once per view.",
    "Other important actions (secondary), and quiet ones like Cancel or a toolbar action (ghost).",
    "A page form's submit and its paired Cancel. Make both size lg. In a dialog, keep them md, like the fields.",
    "A compact, familiar action such as copy, settings or more. Use iconOnly and give it an aria-label.",
  ],
  skip: [
    "The click goes to another page. Use a link (<a>), because Button always renders a <button>.",
    "A second main action in the same view. Keep one primary and make the rest secondary.",
    "Switching between views or filters. Use Tabs.",
    "Several related actions behind one control. Use Menu.",
    "A setting that is on or off. Use Switch, or Checkbox when the choice can be wrong, such as accepting terms.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the button. A disabled or loading button is skipped."],
    [["Enter", "Space"], "Activates the button."],
  ],
  a11y: [
    "It is a real <button>, so the role, Enter and Space need no extra code. The type defaults to button, so inside a form it does not submit unless you pass type=\"submit\".",
    "An icon-only button has no visible text, so always pass an aria-label. The icons themselves are hidden from screen readers.",
    "Loading sets aria-busy and disables the button, so it cannot be pressed twice. A disabled button leaves the tab order, so say what happened somewhere else, such as a toast or a status line.",
    "Keyboard focus draws a 2px outline at a 2px offset. Mouse and touch presses do not show it.",
    "Press scales the button on the instant tier, by mouse or finger, and the OS tap flash is off so a touch press does not show two things. Touch has no hover, so a pressed button also takes its hover fill. Under reduced motion the press scale is 1, and the fill still shows the press.",
    "Small is 32px tall and medium is 44px. Use medium or large for primary actions on touch screens.",
    "A disabled button is muted and exempt from contrast rules. If the reason is not obvious, say it in text next to the button.",
  ],
};

function VariantsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Start a project</Button>
      <Button variant="secondary">View work</Button>
      <Button variant="ghost">Cancel</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}

function SizesDemo() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg" variant="primary">Large</Button>
    </div>
  );
}

function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" loading={loading} onClick={() => setLoading(true)}>Save changes</Button>
      <Button loading={loading} onClick={() => setLoading(true)}>Export</Button>
    </div>
  );
}

function IconsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<PlusIcon />}>New project</Button>
      <Button><CopyIcon /> Copy link</Button>
      <Button variant="ghost" iconRight={<ArrowUpRightIcon />}>Open in Framer</Button>
      <Button iconOnly aria-label="Copy link"><CopyIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="Settings"><SettingsIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="More actions"><MoreIcon /></Button>
      <Button iconOnly variant="ghost" size="sm" aria-label="Delete"><TrashIcon /></Button>
    </div>
  );
}

export default function ButtonPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Variants"
        tier="instant"
        caption="Primary is the one accent fill in a view: Nick's Frame 103, a deeper blue into cobalt inside a deep blue edge, with no glow. Hover brightens the fill; press scales to 0.98. To feel other durations, open the Playground."
        code="VariantsDemo"
      >
        <VariantsDemo />
      </Stage>

      <Stage title="Sizes" tier="instant" caption="32, 44 and 56 tall, shared with inputs. Labels are trimmed to the cap height, so the side padding equals the air around the label." code="SizesDemo">
        <SizesDemo />
      </Stage>

      <Stage title="Loading" tier="instant" caption="The label stays mounted at opacity 0 while the spinner shows, so the button keeps its exact width. Press either button." code="LoadingDemo">
        <LoadingDemo />
      </Stage>

      <Stage title="Icons" tier="instant" caption="16px icons at 1.5px stroke, 8px from the label. Pass one as the icon prop, or as a child before the label, as shadcn writes it: both sit the same. Icon-only buttons are round and labelled for screen readers. An arrow appears only when a button leaves the site." code="IconsDemo">
        <IconsDemo />
      </Stage>
    </Page>
  );
}
