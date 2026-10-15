import { useState } from "react";
import { Button } from "@/components/button";
import { ArchiveIcon, CopyIcon, InfoIcon, SettingsIcon, ShareIcon, TrashIcon } from "@/components/icons";
import { Tooltip, TooltipProvider, type TooltipSide } from "@/components/tooltip";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tooltip",
  title: "Tooltip",
  order: 8, group: "Overlays",
  summary:
    "A small solid label for icons, shortcuts and status. It opens after 200ms of hover or at once on focus, then grows from its trigger and travels in from the side it renders on. On touch it opens on a press and hold, so a tap only does what the button does.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["tooltip", "button", "icons"],
  exports: ["Tooltip", "TooltipProvider"],
  usage: `import { Button } from "@/components/button";
import { CopyIcon } from "@/components/icons";
import { Tooltip, TooltipProvider } from "@/components/tooltip";

// Once, near the root of the app, so tooltips share the quick-open window:
<TooltipProvider>
  <App />
</TooltipProvider>

// Anywhere inside it:
<Tooltip content="Copy link" shortcut="⇧⌘C">
  <Button iconOnly variant="ghost" aria-label="Copy link"><CopyIcon /></Button>
</Tooltip>

<Tooltip content="Published 4 minutes ago" side="bottom" align="start">
  <button type="button">Production is live</button>
</Tooltip>`,
  use: [
    "An icon-only button needs a name people can see, such as Copy link or Archive project. Also give the button an aria-label, because the tooltip describes it but does not name it.",
    "Anything a tooltip says must also be on the trigger as its aria-label or visible text. On a phone most people never press and hold, so the label that matters cannot live only here.",
    "A shortcut is worth showing next to an action. Pass a real one as shortcut.",
    "An info icon or a dotted term needs a short gloss that helps but is not needed to finish the task.",
    "The text is a few words, or one or two short lines.",
  ],
  skip: [
    "People need the text to finish the task. Put it on the page, because a tooltip stays hidden until someone hovers, focuses or, on touch, presses and holds.",
    "The content has a link, a button or a field. A tooltip never takes focus, so the keyboard cannot reach them. Use Dialog.",
    "You are telling someone what just happened, such as saved or failed. Use Toast.",
    "The control is disabled. A disabled control cannot take focus, and some browsers send it no hover either, so its tooltip is not reliable. Say why in text next to it.",
    "The control already shows its own label. The tooltip would only repeat it.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the trigger and opens its tooltip at once, with no hover wait. Moving focus on closes it."],
    [["Esc"], "Closes the open tooltip. Focus stays on the trigger."],
    [["Enter", "Space"], "Uses the trigger as usual, and its tooltip closes."],
    [["Press and hold"], "On touch, opens the tooltip after a short hold. A tap does only what the trigger does. The next touch anywhere closes it."],
  ],
  a11y: [
    "While it is open the tooltip has role=\"tooltip\" and the trigger's aria-describedby points at it, so a screen reader reads it as the trigger's description.",
    "A tooltip describes; it does not name. An icon-only trigger still needs its own aria-label.",
    "The trigger must be focusable, such as a button or a link, because the keyboard opens the tooltip on focus. A plain div or span gets no tooltip from the keyboard.",
    "You can move the pointer onto the tooltip without it closing, and Escape closes it, so the text can be read and dismissed.",
    "On touch, a tooltip opens on a press and hold of 500ms, not on a tap, so a tap only does what the trigger does. Lifting early, moving the finger or scrolling cancels the hold. The click a hold may leave behind is swallowed, so reading a label never runs the action. The next touch anywhere closes it. Hover and focus work as before on desktop.",
    "The shortcut chip is not shown on touch screens, where a finger has no shortcuts. The label itself still is.",
    "A press and hold is hard to find and hard to do for some people. That is why the label that matters must also be the trigger's aria-label or visible text.",
    "Under reduced motion the tooltip appears and leaves at once, without the small nudge.",
  ],
};

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
}

function Toolbar() {
  // Mount <TooltipProvider> once near the root, so the next tooltip opens at once while you sweep across.
  return (
    <div role="group" aria-label="Project actions" className="flex flex-wrap items-center justify-center gap-1">
      <Tooltip content="Copy link" shortcut="⇧⌘C">
        <Button iconOnly variant="ghost" aria-label="Copy link"><CopyIcon /></Button>
      </Tooltip>
      <Tooltip content="Share" shortcut="⇧⌘S">
        <Button iconOnly variant="ghost" aria-label="Share"><ShareIcon /></Button>
      </Tooltip>
      <Divider />
      <Tooltip content="Archive project" shortcut="E">
        <Button iconOnly variant="ghost" aria-label="Archive project"><ArchiveIcon /></Button>
      </Tooltip>
      <Tooltip content="Project settings" shortcut="⌘,">
        <Button iconOnly variant="ghost" aria-label="Project settings"><SettingsIcon /></Button>
      </Tooltip>
      <Divider />
      <Tooltip content="Delete project" shortcut="⌫">
        <Button iconOnly variant="ghost" aria-label="Delete project"><TrashIcon /></Button>
      </Tooltip>
    </div>
  );
}

/* The toolbar with the phone behavior forced: a tap runs the action, a press and hold reads the label. */
function PhoneDemo() {
  const [last, setLast] = useState("Tap a button, or press and hold it");
  const actions = [
    { name: "Copy link", shortcut: "⇧⌘C", icon: <CopyIcon /> },
    { name: "Share", shortcut: "⇧⌘S", icon: <ShareIcon /> },
    { name: "Archive project", shortcut: "E", icon: <ArchiveIcon /> },
  ];
  return (
    <DeviceProvider mode="phone">
      <div className="grid justify-items-center gap-6">
        <div role="group" aria-label="Project actions" className="flex items-center gap-1">
          {actions.map((a) => (
            <Tooltip key={a.name} content={a.name} shortcut={a.shortcut}>
              <Button iconOnly variant="ghost" aria-label={a.name} onClick={() => setLast(`${a.name} ran`)}>
                {a.icon}
              </Button>
            </Tooltip>
          ))}
        </div>
        <p className="font-mono text-caption text-fg-subtle" role="status">{last}</p>
      </div>
    </DeviceProvider>
  );
}

const SIDES: { side: TooltipSide; label: string; content: string; cell: string }[] = [
  { side: "top", label: "Top", content: "Published 4 minutes ago", cell: "col-start-2 row-start-1" },
  { side: "left", label: "Left", content: "3 pages in draft", cell: "col-start-1 row-start-2" },
  { side: "right", label: "Right", content: "Review requested", cell: "col-start-3 row-start-2" },
  { side: "bottom", label: "Bottom", content: "Archived in March", cell: "col-start-2 row-start-3" },
];

function Sides({ pinned = false, onPinnedChange }: { pinned?: boolean; onPinnedChange?: (v: boolean) => void }) {
  // pinned is for the "Show all four" button on this page. Leave it off and each tooltip opens on hover.
  return (
    <div className="grid grid-cols-[auto_auto_auto] justify-center gap-x-6 gap-y-6 sm:gap-x-12">
      {SIDES.map((s) => (
        <div key={s.side} className={s.cell + " grid place-items-center"}>
          <Tooltip
            side={s.side}
            content={s.content}
            open={pinned ? true : undefined}
            onOpenChange={(o) => !o && onPinnedChange?.(false)}
          >
            <Button>{s.label}</Button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}

function LongText() {
  return (
    <div className="grid max-w-[48ch] gap-8">
      <div className="flex items-center gap-2 text-body text-fg-muted">
        <Tooltip
          side="top"
          align="start"
          content="Build 5f2e9c1 is live on atelier-nord.com. Published 4 minutes ago from the main branch."
        >
          <button
            type="button"
            aria-label="Production status"
            className="grid size-6 shrink-0 cursor-help place-items-center rounded-pill text-fg-subtle hover:text-fg"
          >
            <InfoIcon />
          </button>
        </Tooltip>
        <span>Production is live</span>
      </div>
      <p className="text-body text-fg-muted">
        Pages are served from the{" "}
        <Tooltip
          side="bottom"
          content="The edge cache keeps a copy of each page close to the visitor. Publishing clears it, so the first visit after a publish can be a little slower."
        >
          <button
            type="button"
            className="inline cursor-help rounded-control text-fg underline decoration-fg-subtle decoration-dotted underline-offset-4"
          >
            edge cache
          </button>
        </Tooltip>
        , so a change can take up to a minute to show.
      </p>
    </div>
  );
}

export default function TooltipPage() {
  const [pinned, setPinned] = useState(false);
  return (
    <TooltipProvider>
      <Page meta={meta} docs={docs}>
        <Stage
          title="Toolbar"
          tier="responsive"
          caption="Rest on an icon and its tooltip opens after 200ms. Once one has shown, sweep across the bar: the next opens at once, for 300ms after the last one closes. Keyboard focus opens it instantly too. Each one fades and scales in from its trigger."
          code="Toolbar"
        >
          <Toolbar />
        </Stage>

        <Stage
          title="Four sides"
          tier="responsive"
          size="lg"
          replayLabel="Show all four"
          onReplay={() => setPinned(true)}
          code="Sides"
          caption="The tooltip starts a quarter of the travel distance nearer its trigger and moves out, so top rises and right slides right. It follows the side it really opens on: when there is no room it flips, and the movement flips with it. Narrow the window to see it."
        >
          <Sides pinned={pinned} onPinnedChange={setPinned} />
        </Stage>

        <Stage
          title="Longer text"
          tier="responsive"
          caption="Text wraps at 240px and keeps the same entrance. Use it on an info icon or a dotted term, never to hide something people need. On touch, press and hold to read it."
          code="LongText"
        >
          <LongText />
        </Stage>

        <Stage
          title="On a phone"
          tier="responsive"
          caption="A tap only does what the button does, so no label is left behind. Press and hold to read it, and touch anywhere else to close it. The shortcut chips go, because a finger has no shortcuts. This stage forces the phone behavior on a desktop, where a mouse press and hold stands in for the finger."
          code="PhoneDemo"
        >
          <PhoneDemo />
        </Stage>
      </Page>
    </TooltipProvider>
  );
}
