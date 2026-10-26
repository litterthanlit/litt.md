import { Button } from "@/components/button";
import { CopyIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";
import { Tooltip, TooltipProvider } from "@/components/tooltip";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "kbd",
  title: "Kbd",
  lede: "The key cap for a real shortcut.",
  order: 7, group: "Controls",
  summary:
    "The key cap for a real shortcut: the smallest raised block, 20px tall, in Geist. It is a real <kbd>, it is static, and every shortcut hint in the gallery is this one component.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["kbd"],
  exports: ["Kbd"],
  usage: `import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";

// One chord, written in glyphs, is one chip.
<Kbd>⇧⌘C</Kbd>

// A named key is a word.
<Kbd>esc</Kbd>

// Keys pressed one after another each get a chip, 4px apart.
<span className="inline-flex gap-1">
  <Kbd>G</Kbd>
  <Kbd>P</Kbd>
</span>

// A hint on a control, after its label.
<Button iconRight={<Kbd>N</Kbd>}>New project</Button>`,
  use: [
    "A shortcut exists and works: next to the action it runs, in a menu row, in a tooltip, in a list of shortcuts.",
    "A sentence tells someone to press a key, such as \"press esc to close\".",
    "The shortcut is one the person can actually press, so the keys read the way their keyboard shows them.",
  ],
  skip: [
    "It is decoration. A key cap that does nothing teaches people to ignore the real ones.",
    "It is code, a file name or a version. Write it as text, not a chip: code in the mono, the rest in the sans.",
    "It is something to press with a mouse. Use Button.",
    "The action has no shortcut. Leave the hint out.",
    "Tooltip already has a shortcut prop. Pass it there and the tooltip renders the same chip for you.",
  ],
  keyboard: [[["Tab"], "Skips it. A key cap is text: it takes no focus and has no key of its own."]],
  a11y: [
    "It is a real <kbd> element, so assistive technology knows the text names a key.",
    "Glyphs such as ⌘ and ⇧ are read unevenly by screen readers. When a control already announces its shortcut, put the shortcut in aria-keyshortcuts and wrap the Kbd in a span with aria-hidden, so it is not read twice. Kbd takes only its children, so the wrapper is how you hide one.",
    "A shortcut is an extra, never the only way. The action it runs must also be reachable with a plain Tab and Enter.",
    "Hints are for people with a keyboard. On a phone they take room and teach nothing, so hide them there when space is tight.",
    "Fg-subtle on the block reaches 4.5:1 in light and dark, at the 12px caption size.",
    "In forced colors the cap keeps a real border, so it is still a key without its cast.",
    "Nothing moves, so there is nothing to reduce under reduced motion.",
  ],
};

const KEYS: [string, string][] = [
  ["⌘", "Command"],
  ["⇧", "Shift"],
  ["⌥", "Option"],
  ["⌃", "Control"],
  ["↵", "Return"],
  ["⌫", "Delete"],
  ["←", "Left arrow"],
  ["esc", "Escape"],
  ["tab", "Tab"],
  ["space", "Space bar"],
  ["K", "A letter"],
  ["/", "A symbol"],
];

function KeysDemo() {
  return (
    <dl className="grid w-full max-w-xl grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
      {KEYS.map(([key, name]) => (
        <div key={name} className="flex items-center gap-3">
          <dt className="grid w-12 shrink-0 justify-items-start">
            <Kbd>{key}</Kbd>
          </dt>
          <dd className="text-small text-fg-subtle">{name}</dd>
        </div>
      ))}
    </dl>
  );
}

const SHORTCUTS: { label: string; keys: string[] }[] = [
  { label: "Open the command menu", keys: ["⌘K"] },
  { label: "New project", keys: ["N"] },
  { label: "Copy link", keys: ["⇧⌘C"] },
  { label: "Go to projects", keys: ["G", "P"] },
  { label: "Close", keys: ["esc"] },
];

function ShortcutsDemo() {
  return (
    <dl className="w-full max-w-md rounded-surface p-1 shadow-[inset_0_0_0_1px_var(--line)]">
      {SHORTCUTS.map((s) => (
        <div key={s.label} className="flex h-12 items-center justify-between gap-4 border-b border-line px-3 last:border-b-0">
          <dt className="text-small text-fg">{s.label}</dt>
          <dd className="flex gap-1">
            {s.keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function HintsDemo() {
  // Mount <TooltipProvider> once near the root of your app. It is here so the demo stands alone.
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button icon={<PlusIcon />} iconRight={<Kbd>N</Kbd>}>
          New project
        </Button>
        <Button variant="ghost" icon={<SearchIcon />} iconRight={<Kbd>⌘K</Kbd>}>
          Search
        </Button>
        <Tooltip content="Copy link" shortcut="⇧⌘C">
          <Button iconOnly aria-label="Copy link">
            <CopyIcon />
          </Button>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default function KbdPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Keys"
        caption="A key cap is the smallest raised block: 20px tall at the control radius, casting a little straight down, with a darker lower edge, so it reads as a key and not a tag. Geist at weight 400 in fg-subtle. A glyph fills a square, and a word such as esc grows to fit. Nothing moves."
        code="KeysDemo"
      >
        <KeysDemo />
      </Stage>

      <Stage
        title="Chords and sequences"
        caption="A chord written in glyphs is one chip, such as ⇧⌘C. Keys pressed one after another each get their own chip, 4px apart. The shortcut sits opposite the action it runs, so the eye finds the action first."
        code="ShortcutsDemo"
      >
        <ShortcutsDemo />
      </Stage>

      <Stage
        title="On a control"
        caption="After a button's label the chip sits one control gap away and never changes the button's height. The round button's tooltip renders the same chip. Hover or focus it to see."
        code="HintsDemo"
      >
        <HintsDemo />
      </Stage>
    </Page>
  );
}
