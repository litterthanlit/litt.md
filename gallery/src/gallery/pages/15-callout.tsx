import { useState } from "react";
import { Button } from "@/components/button";
import { Callout } from "@/components/callout";
import { LightbulbIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "callout",
  title: "Callout",
  lede: "A note in the page flow.",
  order: 7.05,
  group: "Layout",
  verbs: ["press"],
  summary:
    "An inline note in the page flow: a tip, a heads-up or a result to act on. A surface with an icon, a title, a line of detail and an optional action. Only the icon takes the status color, and a hidden word says the same thing. It measures its own width, and nothing about it moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["callout"],
  exports: ["Callout"],
  usage: `import { Callout } from "@/components/callout";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";

// A tip. The action is a Kbd or an sm Button. Pass your own 16px icon to replace the default.
<Callout title="Try H to snooze a build" description="31 snoozed by mouse this month." action={<Kbd>H</Kbd>} />

// A heads-up with something to do. The close button calls your handler, and you remove the callout.
<Callout
  tone="warning"
  title="Your Framer plan renews on 4 November"
  description="12 sites and 3 seats, 540 USD a year."
  action={<Button size="sm">Manage plan</Button>}
  onDismiss={() => setOpen(false)}
/>

// A result that appears after an action is announced as it arrives (an alert for danger).
<Callout live tone="danger" title="The deploy to atelier-nord.com failed" description="The build ran out of memory." />`,
  use: [
    "A tip, a heads-up or a result belongs in the page, next to the thing it is about, and the reader can carry on without it.",
    "There is one thing to do about it, a button or a key, and the words say why.",
    "Something appears after an action and stays, such as a failed deploy or a renewal that is close. Set live, so a screen reader hears it arrive.",
    "The place is narrow or unknown: a sidebar, a form column, a phone. The callout measures itself, so the action drops below the text when it has to.",
  ],
  skip: [
    "It should stop the person or ask for a decision. Use Dialog.",
    "It confirms something small and goes away by itself. Use Toast.",
    "A whole view is empty or has failed. Use Empty or ErrorState.",
    "You want the whole box colored. Litt colors the icon and nothing else: never a rail, a tinted fill or a colored border, because a note that shouts is an alarm.",
    "There are several in a row. Keep one callout per place and fold the rest into the page's text.",
  ],
  keyboard: [
    [["Tab"], "Moves to the action, then to the close button. The callout itself takes no focus."],
    [["Enter", "Space"], "Presses the focused action or the close button."],
  ],
  a11y: [
    "A callout is a note landmark by default. With live it is a status, or an alert for danger, so a screen reader announces it when it appears.",
    "Color is never the only signal. A tone adds a hidden \"Warning: \", \"Error: \" or \"Success: \" before the title, and the icon is hidden from assistive tech.",
    "The status colors reach 3:1 as an icon on its surface in light and dark, and the words are in fg and fg-subtle, which reach 4.5:1.",
    "The close button is named \"Dismiss\", is 32px and grows to 44px on a coarse pointer. The callout does not hide itself, so remove it in the handler, and if focus was on the button, move it somewhere sensible.",
    "A Button action grows to 44px on a coarse pointer. A Kbd action is hidden there, like every key hint.",
    "Write the title so it makes sense alone, and the description as one line of detail. Do not put a second action in the description.",
    "Nothing moves. Dismissing just unmounts it.",
  ],
};

function TipDemo() {
  return (
    <div className="w-full max-w-xl">
      <Callout
        icon={<LightbulbIcon />}
        title="Try H to snooze a thread"
        description="31 snoozed by mouse this month. The key takes one press."
        action={<Kbd>H</Kbd>}
      />
    </div>
  );
}

function TonesDemo() {
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Callout title="Preview links expire after 7 days" description="Share the production link when a client needs it for longer." />
      <Callout tone="success" title="atelier-nord.com is live" description="The build took 38 s and all 12 pages are published." />
      <Callout tone="warning" title="The certificate for gallery-identity.com expires in 5 days" description="Renew it in the domain settings before the site shows a warning." />
      <Callout tone="danger" title="The deploy to founder-landing failed" description="The build ran out of memory. Make the images smaller, then retry." />
    </div>
  );
}

function RenewalDemo() {
  const [open, setOpen] = useState(true);
  if (!open) return <p className="text-small text-fg-subtle">Dismissed. The callout is gone from the page.</p>;
  return (
    <div className="w-full max-w-xl">
      <Callout
        tone="warning"
        title="Your Framer plan renews on 4 November"
        description="12 sites and 3 seats, 540 USD a year. Switch to monthly billing before then if the studio is slowing down."
        action={<Button size="sm">Manage plan</Button>}
        onDismiss={() => setOpen(false)}
      />
    </div>
  );
}

function RoundTwoNote() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Show the note again
      </Button>
    );
  }
  return (
    <Callout
      tone="success"
      title="Round two is ready for Marlow Labs"
      description="The landing page has 4 new sections."
      action={<Button size="sm">Send for review</Button>}
      onDismiss={() => setOpen(false)}
    />
  );
}

function NarrowDemo() {
  return (
    <div className="grid w-full max-w-xl gap-8">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A callout 36rem wide</p>
        <RoundTwoNote />
      </div>
      <div className="grid w-full max-w-80 gap-2">
        <p className="text-caption font-normal text-fg-subtle">A callout 20rem wide</p>
        <RoundTwoNote />
      </div>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): what the recorder has to tell you ---------- */

function RecordKeyTipDemo() {
  return (
    <div className="w-full max-w-xl">
      <Callout
        icon={<LightbulbIcon />}
        title="Press R to start a take"
        description="31 takes started from the screen this week. The key takes one press."
        action={<Kbd>R</Kbd>}
      />
    </div>
  );
}

function RecorderTonesDemo() {
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Callout title="Links to a take expire after 7 days" description="Share the library link when the edit needs it for longer." />
      <Callout tone="success" title="take_04.wav is backed up" description="Copied to the library in 38 s, with its safety track." />
      <Callout tone="warning" title="Card A has 12M left" description="At 48 kHz · 24 bit. Put Card B in before the next scene." />
      <Callout tone="danger" title="Channel 2 clipped at +0.4 dB" description="In take_05.wav at 00M 09S 14F. Its safety track, 12 dB lower, is clean." />
    </div>
  );
}

function FormatCardDemo() {
  const [open, setOpen] = useState(true);
  if (!open) return <p className="text-small text-fg-subtle">Dismissed. The callout is gone from the page.</p>;
  return (
    <div className="w-full max-w-xl">
      <Callout
        tone="warning"
        title="Card B was last formatted 30 days ago"
        description="Its 214 takes are in the library. Format it in the recorder before the next shoot day, so it starts clean."
        action={<Button size="sm">Format card</Button>}
        onDismiss={() => setOpen(false)}
      />
    </div>
  );
}

function MixReadyNote() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Show the note again
      </Button>
    );
  }
  return (
    <Callout
      tone="success"
      title="Mix · take_04 is ready"
      description="Bounced at −14 LUFS, with 4 stems."
      action={<Button size="sm">Send to the edit</Button>}
      onDismiss={() => setOpen(false)}
    />
  );
}

function MixNarrowDemo() {
  return (
    <div className="grid w-full max-w-xl gap-8">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A callout 36rem wide</p>
        <MixReadyNote />
      </div>
      <div className="grid w-full max-w-80 gap-2">
        <p className="text-caption font-normal text-fg-subtle">A callout 20rem wide</p>
        <MixReadyNote />
      </div>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a tip in a small site's editor ---------- */

function PictureKeyTipDemo() {
  return (
    <div className="w-full max-w-xl">
      <Callout
        icon={<LightbulbIcon />}
        title="Try P to add a picture"
        description="You added 18 pictures by mouse this week. The key takes one press."
        action={<Kbd>P</Kbd>}
      />
    </div>
  );
}

export default function CalloutPage() {
  const [renewalKey, showRenewal] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A tip with a key"
        align="start"
        code="TipDemo"
        byWorld={{ flat: { demo: <PictureKeyTipDemo />, code: "PictureKeyTipDemo" }, device: { demo: <RecordKeyTipDemo />, code: "RecordKeyTipDemo" } }}
        caption="A tip sits in the page flow on a raised surface, with no shadow and no rail. The lightbulb replaces the default icon and stays in the neutral tone. The key at the end is a Kbd, so it is a hint and not a button, and it hides on a phone. Nothing moves."
      >
        <TipDemo />
      </Stage>

      <Stage
        title="The four tones"
        align="start"
        code="TonesDemo"
        byWorld={{ device: { demo: <RecorderTonesDemo />, code: "RecorderTonesDemo" } }}
        caption="Only the icon takes the status color: fg-subtle for neutral, then success, warning and danger. The box, the title and the description stay neutral, so a row of them stays calm. A screen reader hears a hidden word before the title, so the color never says it alone."
      >
        <TonesDemo />
      </Stage>

      <Stage
        title="An action and a close button"
        align="start"
        code="RenewalDemo"
        byWorld={{
          device: {
            demo: (
              <div key={renewalKey} className="w-full">
                <FormatCardDemo />
              </div>
            ),
            code: "FormatCardDemo",
          },
        }}
        onReplay={showRenewal}
        replayLabel="Show again"
        caption="The action is an sm Button at the end, lined up with the title's first line, and the close button sits at the top end. Closing calls your handler and the callout unmounts at once, with no exit. The button grows to 44px on a phone."
      >
        <div key={renewalKey} className="w-full">
          <RenewalDemo />
        </div>
      </Stage>

      <Stage
        title="A narrow callout"
        align="start"
        code="NarrowDemo"
        byWorld={{ device: { demo: <MixNarrowDemo />, code: "MixNarrowDemo" } }}
        caption="The callout measures itself, not the window. Under 28rem the action drops below the text and lines up with it, and the close button stays at the top end. In a sidebar or on a phone nothing is squeezed."
      >
        <NarrowDemo />
      </Stage>

      <TryIt of="Callout" component={Callout} props={{ title: "The deploy to atelier-nord.com is queued.", description: "It starts when the build for Marlow Labs finishes." }} controls={["title", "description", "tone"]} />
    </Page>
  );
}
