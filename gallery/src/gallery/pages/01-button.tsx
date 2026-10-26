import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ArrowUpRightIcon, CopyIcon, MoreIcon, PlusIcon, SettingsIcon, TrashIcon } from "@/components/icons";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "button",
  title: "Button",
  lede: "The action, answered without moving its box.",
  order: 1, group: "Controls",
  verbs: ["press"],
  summary: "Roomy and slightly rounded, with the label at the title weight. Secondary is a raised block, and danger is the same block with red words. Hover changes the fill on the instant tier, and a press tightens the cast and sinks the block half a pixel, so the button answers without ever changing its size.",
  fun: "Press and let go: the button goes deeper and springs back with a little life.",
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
<Button loading={saving}>Export</Button>

// A destructive action is a block with red words. In a dialog's footer the same variant is the confirm,
// the one red fill, and it stays flat while it is disabled (see Dialog).
<Button variant="danger" icon={<TrashIcon />}>Delete project</Button>`,
  use: [
    "A person does something: save, create, send, start a project.",
    "The main action in a view. Make it primary, because the accent fill appears once per view.",
    "Other important actions (secondary), and quiet ones like Cancel or a toolbar action (ghost).",
    "An action that destroys something, such as Delete project or Revoke key. Use danger: the block says it in red words. The confirm in the dialog that asks is the same variant, and only there does it fill red.",
    "A page form's submit and its paired Cancel. Keep both md, like the fields, in a page form and in a dialog. lg is for a hero CTA.",
    "A compact, familiar action such as copy, settings or more. Use iconOnly and give it an aria-label.",
  ],
  skip: [
    "The click goes to another page. Use a link (<a>), because Button always renders a <button>.",
    "A second main action in the same view. Keep one primary and make the rest secondary.",
    "Danger for an action that can be undone, such as Remove from list. Red words are for loss, so keep them rare.",
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
    "A press sinks the button half a pixel and tightens its cast, by mouse or finger, and the OS tap flash is off so a touch press does not show two things. Touch has no hover, so a pressed button also takes its hover fill. Under reduced motion the button does not sink, and the fill still shows the press.",
    "Small is 32px tall and medium is 44px. Use medium or large for primary actions on touch screens.",
    "A disabled button is muted and exempt from contrast rules. If the reason is not obvious, say it in text next to the button.",
    "Danger says it in words, not only in red: the label names the loss (Delete project, not OK). The red words reach 4.5:1 on the block, and the confirm's words reach it on the red fill, in light and dark.",
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

function DangerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" icon={<TrashIcon />}>Delete project</Button>
      <Button variant="danger" size="sm">Revoke key</Button>
      <Button variant="danger" disabled>Delete project</Button>
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
        caption="Primary is the one accent fill in a view and carries the glow. Secondary is a raised block that casts a little, straight down. Ghost and a disabled button lie flat: nothing to push. Hover swaps the fill over the instant duration; a press tightens the cast at once and sinks the block half a pixel. To feel other durations, open the Playground."
        code="VariantsDemo"
      >
        <VariantsDemo />
      </Stage>

      <Stage
        title="Danger"
        tier="instant"
        caption="A destructive action is the secondary block with its words in the danger color, so the red word is the only loud thing. It is not filled red and has no glow. Disabled, it lies flat and loses the red. The one red fill is the confirm of the dialog that asks: the same variant, in the dialog's footer. Open the Dialog page to see it light up."
        code="DangerDemo"
      >
        <DangerDemo />
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

      <TryIt of="Button" component={Button} props={{ children: "Deploy site" }} controls={["variant", "size", "loading", "block", { name: "disabled", type: "boolean" }]} />
    </Page>
  );
}
