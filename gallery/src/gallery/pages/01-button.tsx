import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ArrowUpRightIcon, CopyIcon, MoreIcon, PlusIcon, SettingsIcon, TrashIcon } from "@/components/icons";
import { motion } from "motion/react";
import { Avatar, AvatarGroup, type AvatarHue } from "@/components/avatar";
import { useMotionDial, useTransition } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "button",
  title: "Button",
  lede: "The action, answered without moving its box.",
  order: 1.01, group: "Actions",
  verbs: ["press"],
  summary: "Roomy and slightly rounded, with the label at the title weight. Under Press, secondary is a block raised once by its cast, with no outline, and danger is the same block with red words. Hover changes the fill on the instant tier, and a press sinks the block half a pixel, so the button answers without ever changing its size.",
  fun: "Press and let go: the button goes deeper and springs back with a little life.",
  tiers: ["instant"],
  mechanism:
    "Hover swaps the fill on the instant tier, 100ms. A press sinks the block half a pixel and tightens its cast at once, with no fade, so the hand feels it land. The box never changes size: loading keeps the label mounted at opacity 0 and the spinner turns inside the same width. Reduced motion sets the sink to 0 and the fill still answers. Each world has its own body, so the hand feels each differently. In Press the hand meets a block standing on the surface: its cast tightens and the label drops half a pixel. In Flat there is no block to push: the pill goes a step darker under the hand and does not move, like pressing paper, and a ghost is words alone. In Device the hand meets a key: the face sinks the whole 2px onto its skirt, which is the travel of a real key, and a ghost button sinks into a well.",
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
    [["Tab"], "Moves focus to the button. A disabled button is skipped; a loading one keeps its place."],
    [["Enter", "Space"], "Activates the button."],
  ],
  a11y: [
    "It is a real <button>, so the role, Enter and Space need no extra code. The type defaults to button, so inside a form it does not submit unless you pass type=\"submit\".",
    "An icon-only button has no visible text, so always pass an aria-label. The icons themselves are hidden from screen readers.",
    "Loading sets aria-busy and aria-disabled and ignores presses, so it cannot be pressed twice, and a submit does not send the form again. It is not disabled, so it keeps focus and its place in the tab order while it waits.",
    "A disabled button leaves the tab order, so say why somewhere else, such as a status line next to it.",
    "Keyboard focus draws a 2px outline at a 2px offset. Mouse and touch presses do not show it.",
    "A press sinks the button half a pixel and tightens its cast, by mouse or finger, and the OS tap flash is off so a touch press does not show two things. Touch has no hover, so a pressed button also takes its hover fill. Under reduced motion the button does not sink, and the fill still shows the press.",
    "Small is 32px tall and medium is 44px. Use medium or large for primary actions on touch screens.",
    "A disabled button is muted and exempt from contrast rules. If the reason is not obvious, say it in text next to the button.",
    "Danger says it in words, not only in red: the label names the loss (Delete project, not OK). The red words reach 4.5:1 on the block, and the confirm's words reach it on the red fill, in light and dark.",
  ],
};

function ReplayLoading() {
  const { reduced } = useMotionDial();
  const [loading, setLoading] = useState(!reduced);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, [reduced]);
  return <Button loading={loading}>View work</Button>;
}

export const study: PageStudy = {
  object: <Button>View work</Button>,
  parts: [
    { name: "The block", selector: "button" },
    { name: "The row", selector: "button > span" },
    { name: "The label", selector: "button .litt-trim" },
  ],
  states: {
    default: <Button>View work</Button>,
    disabled: <Button disabled>View work</Button>,
    loading: <Button loading>View work</Button>,
  },
  replay: {
    label: "Replay loading",
    caption: "Watch the width: the label fades out under the spinner, and the block does not move.",
    run: () => <ReplayLoading />,
  },
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

/* ---------- Device's own (plans/024, phase 3): the same keys on a field recorder's export sheet ---------- */

function ExportTakeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Export take</Button>
      <Button variant="secondary">Add marker</Button>
      <Button variant="ghost">Cancel</Button>
      <Button disabled>Arm track</Button>
    </div>
  );
}

function DeleteTakeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" icon={<TrashIcon />}>Delete take</Button>
      <Button variant="danger" size="sm">Erase card</Button>
      <Button variant="danger" disabled>Delete take</Button>
    </div>
  );
}

function SaveSceneDemo() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" loading={loading} onClick={() => setLoading(true)}>Save scene</Button>
      <Button loading={loading} onClick={() => setLoading(true)}>Export</Button>
    </div>
  );
}

function TakeIconsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<PlusIcon />}>New take</Button>
      <Button><CopyIcon /> Copy file name</Button>
      <Button variant="ghost" iconRight={<ArrowUpRightIcon />}>Open the manual</Button>
      <Button iconOnly aria-label="Copy file name"><CopyIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="Settings"><SettingsIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="More actions"><MoreIcon /></Button>
      <Button iconOnly variant="ghost" size="sm" aria-label="Delete take"><TrashIcon /></Button>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site and its letter ---------- */

/* The letter's readers, each in their own Candy hue (R7: who a reader is). */
const READERS: { name: string; hue: AvatarHue }[] = [
  { name: "Maya Lindqvist", hue: "sky" },
  { name: "Theo Okafor", hue: "violet" },
  { name: "Ines Duarte", hue: "amber" },
  { name: "Ravi Menon", hue: "teal" },
];

/** A letter's sign-up row, live: Subscribe welcomes you into the readers, your avatar arriving at the front on Flat's
    expressive spring (its 0.28 bounce, the view's one moment, on a hand only; at once under reduced motion). */
function SubscribeDemo() {
  const [joined, setJoined] = useState(false);
  const spring = useTransition("expressive");
  const count = joined ? 1205 : 1204;
  return (
    <div className="grid justify-items-start gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" aria-pressed={joined} onClick={() => setJoined((j) => !j)}>
          {joined ? "Subscribed" : "Subscribe"}
        </Button>
        <Button variant="secondary">Read the letter</Button>
        <Button variant="ghost">Not now</Button>
        <Button disabled>Send issue 14</Button>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup label={`Readers, ${count.toLocaleString("en-US")} people`} size="sm" max={5}>
          {joined && (
            <motion.span key="you" className="inline-flex" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
              <Avatar name="You" hue="bubblegum" look="fluid" size="sm" />
            </motion.span>
          )}
          {READERS.map((r) => (
            <Avatar key={r.name} name={r.name} hue={r.hue} look="fluid" size="sm" />
          ))}
        </AvatarGroup>
        <p className="text-small text-fg-muted" aria-live="polite">
          {joined ? "You're reader 1,205. Issue 14 comes Friday." : "1,204 readers get the letter."}
        </p>
      </div>
    </div>
  );
}

function DeletePostDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" icon={<TrashIcon />}>Delete post</Button>
      <Button variant="danger" size="sm">Remove reader</Button>
      <Button variant="danger" disabled>Delete post</Button>
    </div>
  );
}

function SaveDraftDemo() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" loading={loading} onClick={() => setLoading(true)}>Save draft</Button>
      <Button loading={loading} onClick={() => setLoading(true)}>Send a test</Button>
    </div>
  );
}

function PostIconsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<PlusIcon />}>New post</Button>
      <Button><CopyIcon /> Copy link</Button>
      <Button variant="ghost" iconRight={<ArrowUpRightIcon />}>View the site</Button>
      <Button iconOnly aria-label="Copy link"><CopyIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="Settings"><SettingsIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="More actions"><MoreIcon /></Button>
      <Button iconOnly variant="ghost" size="sm" aria-label="Delete post"><TrashIcon /></Button>
    </div>
  );
}

/* ---------- Heat's own (proposals/heat.md): street-racing menu keys ---------- */

function RaceActionDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Start race</Button>
      <Button variant="secondary">Tune car</Button>
      <Button variant="ghost">Back</Button>
      <Button disabled>Event locked</Button>
    </div>
  );
}

function SellCarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" icon={<TrashIcon />}>Sell vehicle</Button>
      <Button variant="danger" size="sm">Clear record</Button>
      <Button variant="danger" disabled>Sell vehicle</Button>
    </div>
  );
}

function SaveTuneDemo() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" loading={loading} onClick={() => setLoading(true)}>Save tune</Button>
      <Button loading={loading} onClick={() => setLoading(true)}>Export replay</Button>
    </div>
  );
}

function GarageIconsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<PlusIcon />}>New preset</Button>
      <Button><CopyIcon /> Copy tune code</Button>
      <Button variant="ghost" iconRight={<ArrowUpRightIcon />}>Open standings</Button>
      <Button iconOnly aria-label="Copy tune code"><CopyIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="Tuning settings"><SettingsIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="More actions"><MoreIcon /></Button>
      <Button iconOnly variant="ghost" size="sm" aria-label="Sell vehicle"><TrashIcon /></Button>
    </div>
  );
}

/* ---------- Rack's own (proposals/rack.md): DAW transport, freeze, and stem export keys ---------- */

function StudioActionDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Export mix</Button>
      <Button variant="secondary">Freeze track</Button>
      <Button variant="ghost">Bypass</Button>
      <Button disabled>Flatten</Button>
    </div>
  );
}

function DeleteTrackDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" icon={<TrashIcon />}>Delete track</Button>
      <Button variant="danger" size="sm">Clear automation</Button>
      <Button variant="danger" disabled>Delete track</Button>
    </div>
  );
}

function RenderMixDemo() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" loading={loading} onClick={() => setLoading(true)}>Bounce master</Button>
      <Button loading={loading} onClick={() => setLoading(true)}>Freeze stems</Button>
    </div>
  );
}

function TrackIconsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<PlusIcon />}>Add track</Button>
      <Button><CopyIcon /> Duplicate clip</Button>
      <Button variant="ghost" iconRight={<ArrowUpRightIcon />}>Open in browser</Button>
      <Button iconOnly aria-label="Duplicate clip"><CopyIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="Device settings"><SettingsIcon /></Button>
      <Button iconOnly variant="ghost" aria-label="Track options"><MoreIcon /></Button>
      <Button iconOnly variant="ghost" size="sm" aria-label="Delete track"><TrashIcon /></Button>
    </div>
  );
}

/* ---------- Press's own (plans/024, Press): deploy dashboard actions ---------- */

function DeployActionDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Deploy to production</Button>
      <Button variant="secondary">View logs</Button>
      <Button variant="ghost">Cancel</Button>
      <Button disabled>Promote</Button>
    </div>
  );
}

function RollbackDangerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger">Rollback release</Button>
      <Button variant="danger" disabled>
        Delete project
      </Button>
    </div>
  );
}

export default function ButtonPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="Variants"
        tier="instant"
        caption="Primary is the one accent fill in a view and carries the glow. Secondary is a block raised once by its cast, with no outline. Ghost and a disabled button lie flat: nothing to push. Hover swaps the fill over the instant duration; a press sinks the block at once: the cast tightens and the label drops half a pixel. To feel other durations, open the Playground."
        code="VariantsDemo"
        byWorld={{
          press: {
            demo: <DeployActionDemo />,
            code: "DeployActionDemo",
            caption:
              "Deploy-dashboard actions under Press. Deploy to production is the one Blue 4 fill in the view. View logs is a warm stone block raised once by its cast with no outline. Cancel and Promote (disabled) lie flat until ready.",
          },
          flat: {
            demo: <SubscribeDemo />,
            code: "SubscribeDemo",
            caption:
              "A letter's sign-up row. Subscribe is the primary, the ink: the one fill in a view. Read the letter is a white pill on the grey ground, with no edge and nothing cast. Not now is words alone, and Send issue 14, disabled, fades back. Under the hand a pill goes a step darker on the instant tier and does not move, like pressing paper. Press Subscribe: it says Subscribed, and you join the readers at the front of the row, your avatar arriving on Flat's expressive spring with its little bounce, each reader in their own Candy hue. Press it again to leave. Under reduced motion you arrive at once.",
          },
          device: {
            demo: <ExportTakeDemo />,
            code: "ExportTakeDemo",
            caption:
              "The keys of a recorder's export sheet. Export take is the primary, the ink key: on Device orange is a hand on it, never a key's fill. Add marker is a key in the body's grey, Cancel lies flat on the plate until a press sinks it into a well, and Arm track, disabled, lies flat with no skirt. A press sinks the whole face 2px onto its skirt at once.",
          },
          rack: {
            demo: <StudioActionDemo />,
            code: "StudioActionDemo",
            caption:
              "Ableton-style tool keys: Export mix takes Live's warm yellow inside a crisp 1px key outline; Freeze track is a flat outlined block; Bypass is quiet ghost text; Flatten is disabled until a track is frozen.",
          },
          heat: {
            demo: <RaceActionDemo />,
            code: "RaceActionDemo",
            caption:
              "Street-racing menu keys. Start race is the one amber fill in the view, framed in ink corner brackets under the hand. Tune car is a flat dark cell whose four 8px amber corner brackets snap on under hover and focus. Back sits flat until targeted, and Event locked lies flat on surface-2 with no brackets.",
          },
        }}
      >
        <VariantsDemo />
      </Stage>

      <Stage
        title="Danger"
        tier="instant"
        caption="A destructive action is the secondary block with its words in the danger color, so the red word is the only loud thing. It is not filled red and has no glow. Disabled, it lies flat and loses the red. The one red fill is the confirm of the dialog that asks: the same variant, in the dialog's footer. Open the Dialog page to see it light up."
        code="DangerDemo"
        byWorld={{
          press: {
            demo: <RollbackDangerDemo />,
            code: "RollbackDangerDemo",
            caption:
              "A destructive deploy action is a raised stone block with red words — Rollback release, Delete project — never filled red outside a confirm dialog footer.",
          },
          flat: {
            demo: <DeletePostDemo />,
            code: "DeletePostDemo",
            caption:
              "A destructive action is the white pill with its words in red, so the word that names the loss is the only loud thing: Delete post, Remove reader. It is never filled red. Disabled, it fades back and loses the red. The one red fill is the confirm of the dialog that asks.",
          },
          device: {
            demo: <DeleteTakeDemo />,
            code: "DeleteTakeDemo",
            caption:
              "A destructive action is the grey key with its words in red, so the word that names the loss is the only loud thing: Delete take, Erase card. It is never filled red. Disabled, it lies flat and loses the red. The one red key is the confirm of the dialog that asks.",
          },
          rack: {
            demo: <DeleteTrackDemo />,
            code: "DeleteTrackDemo",
            caption:
              "A flat outlined Rack key with danger words: Delete track, Clear automation. Never filled red until confirmed inside a dialog.",
          },
          heat: {
            demo: <SellCarDemo />,
            code: "SellCarDemo",
            caption:
              "A destructive racing-menu key keeps the flat dark cell with brake-red words and danger corner brackets on hover: Sell vehicle, Clear record. Disabled, it lies flat and drops the red.",
          },
        }}
      >
        <DangerDemo />
      </Stage>

      <Stage title="Sizes" tier="instant" caption="32, 44 and 56 tall, shared with inputs. Labels are trimmed to the cap height, so the side padding equals the air around the label." code="SizesDemo">
        <SizesDemo />
      </Stage>

      <Stage title="Loading" tier="instant" caption="The label stays mounted at opacity 0 while the spinner shows, so the button keeps its exact width. Press either button." code="LoadingDemo" byWorld={{ flat: { demo: <SaveDraftDemo />, code: "SaveDraftDemo" }, device: { demo: <SaveSceneDemo />, code: "SaveSceneDemo" }, rack: { demo: <RenderMixDemo />, code: "RenderMixDemo" }, heat: { demo: <SaveTuneDemo />, code: "SaveTuneDemo" } }}>
        <LoadingDemo />
      </Stage>

      <Stage title="Icons" tier="instant" caption="16px solid icons, 8px from the label. Pass one as the icon prop, or as a child before the label, as shadcn writes it: both sit the same. Icon-only buttons are round and labelled for screen readers. An arrow appears only when a button leaves the site." code="IconsDemo" byWorld={{ flat: { demo: <PostIconsDemo />, code: "PostIconsDemo" }, device: { demo: <TakeIconsDemo />, code: "TakeIconsDemo" }, rack: { demo: <TrackIconsDemo />, code: "TrackIconsDemo" }, heat: { demo: <GarageIconsDemo />, code: "GarageIconsDemo" } }}>
        <IconsDemo />
      </Stage>

      <TryIt of="Button" component={Button} props={{ children: "Deploy site" }} controls={["variant", "size", "loading", "block", { name: "disabled", type: "boolean" }]} />
    </Page>
  );
}
