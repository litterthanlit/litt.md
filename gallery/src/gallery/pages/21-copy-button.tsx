import { useEffect, useRef } from "react";
import { CopyButton } from "@/components/copy-button";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "copy-button",
  title: "Copy button",
  lede: "A key that copies a command, and the glass that shows it.",
  ledeByWorld: {
    flat: "A link or command on a clean line, copied with one press.",
  },
  order: 1.02,
  group: "Actions",
  verbs: ["press"],
  worlds: ["device", "flat"],
  summary:
    "A key beside a line of LCD glass that shows a command in the mono. A press copies the text and the key sinks onto its skirt, the copy glyph crossfades to a check that draws in, and the line says Copied while the command's glyphs scramble away and decode back in a wave. Nothing moves until a hand presses it. It belongs to Device, where keys and glass are the material.",
  summaryByWorld: {
    flat: "A line of text on white paper with a copy pill beside it. Pressing copies the text, softens the line for a beat, and flips the pill into a mint confirmation with a check that draws in before returning to Copy.",
  },
  tiers: ["instant", "responsive", "expressive"],
  mechanism:
    "A press sinks the key the whole 2px onto its skirt, at once. The copy glyph crossfades to a check on the responsive tier, and the check draws in after a beat. The command leaves the glass from the right as scrambled display glyphs, each character glitching 140 to 340ms, and the line says Copied for 1800ms. Then the command decodes back in from the left. The whole wave takes at most 520ms, and a hidden character keeps its width, so the line never moves. A second press mid-wave reverses it where it is. Reduced motion swaps the glyphs at once and draws nothing.",
  movesByWorld: {
    flat: "When it first enters view, the card settles gently once on the expressive spring, then stays still. Pressing answers on pointerdown on the instant tier, dips and settles the line, and flips the pill into a tinted confirmation with a check that draws in on the expressive spring for 1800ms before returning to Copy. Reduced motion skips the arrival, the dip, and the check draw and swaps the label at once.",
  },
};

export const docs: PageDocs = {
  components: ["copy-button"],
  exports: ["CopyButton"],
  usage: `import { CopyButton } from "@/components/copy-button";

// The line shows what is copied.
<CopyButton text="npx shadcn@latest add https://littmd.vercel.app/r/button.json" />

// Show a shorter line than the text the key copies.
<CopyButton text={"curl -H 'Authorization: Bearer ' https://api.halden.studio/v1/projects"} command="curl api.halden.studio/v1/projects" />`,
  use: [
    "A command or snippet someone will paste into a terminal: an install line, a curl call, a deploy command.",
    "Under Device, where keys and LCD glass are the material. The part reads the key and field tokens, so it needs data-material=\"device\" on <html> to look like itself.",
  ],
  useByWorld: {
    flat: [
      "A share link, issue address, or install line a reader will copy and paste.",
      "A single copyable value on a page where one primary pill belongs beside the text.",
    ],
  },
  skip: [
    "A value in a row of details, such as a domain or an id. Use the copy icon button the Details row carries.",
    "A long block of code. Use the code block's own copy action.",
    "An action that is not a copy. This key says Copied; use a Button.",
  ],
  skipByWorld: {
    flat: [
      "A value in a row of details, such as a domain or an id. Use the copy icon button the Details row carries.",
      "A long block of code. Use the code block's own copy action.",
      "An action that does not copy text. Use a Button.",
    ],
  },
  keyboard: [
    [["Tab"], "Moves focus to the key."],
    [["Enter", "Space"], "Copies the text, as a press does."],
  ],
  a11y: [
    "The key is a real button named \"Copy command\" (set label for another name). The command beside it is real text for a screen reader, and the scrambling glyphs are hidden from it.",
    "\"Copied\" is said once in a polite status, and only on a real copy. Nothing is announced on mount.",
    "The glass says Copied in words as well as the check drawing, so the state never rests on an icon or a color.",
    "If the clipboard refuses, the command on the line is selected so it can be copied by hand, and the status says so.",
    "Under reduced motion the glyphs swap at once and the check appears without drawing.",
  ],
  a11yByWorld: {
    flat: [
      "The pill is a real button named \"Copy command\" (set label for another name). The text beside it stays selectable so a reader can copy it by hand too.",
      "\"Copied\" is said once in a polite live region, and only after a copy succeeds. Nothing is announced on mount.",
      "The pill says Copied in words alongside the check mark, so the state never rests on an icon or a color.",
      "If the clipboard refuses, the text on the line is selected and the live region asks the reader to select the text to copy.",
      "Under reduced motion the arrival is skipped and the pill swaps directly to Copied without drawing the check.",
    ],
  },
};

const INSTALL = "npx shadcn@latest add https://littmd.vercel.app/r/copy-button.json";

/** Presses the key itself once it has mounted, so the Replay plays the copy without a hand on it. */
function ReplayCopy({ text = INSTALL, label }: { text?: string; label?: string }) {
  const { reduced } = useMotionDial();
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => root.current?.querySelector("button")?.click(), 250);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return (
    <span ref={root} className="contents">
      <CopyButton text={text} label={label} />
    </span>
  );
}

export const study: PageStudy = {
  object: <CopyButton text="npm i @halden/brand-kit" />,
  parts: [
    { name: "The key", selector: "button" },
    { name: "The glyph", selector: "button svg" },
    { name: "The glass", selector: "button + span" },
    { name: "The prompt", selector: "button + span > span" },
    { name: "The command", selector: "button + span [aria-hidden] > span" },
  ],
  partsByWorld: {
    flat: [
      { name: "The paper", selector: "[data-part=paper]" },
      { name: "The line", selector: "[data-part=paper] > [data-part=lettering]" },
      { name: "The copy pill", selector: "button[data-part=ink], button[data-part=bubble]" },
    ],
  },
  states: {
    default: <CopyButton text="npm i @halden/brand-kit" />,
  },
  replay: {
    label: "Replay the copy",
    caption: "Watch the command scramble away from the right, the glass say Copied, and the command decode back in from the left.",
    run: () => <ReplayCopy />,
  },
  byWorld: {
    flat: {
      object: <CopyButton text="https://litt.design/issue-15" label="Copy issue link" />,
      states: {
        default: <CopyButton text="https://litt.design/issue-15" label="Copy issue link" />,
      },
      replay: {
        label: "Replay the copy",
        caption: "Watch the line dip and settle while the pill flips to Copied and the check draws in, then returns to Copy.",
        run: () => <ReplayCopy text="https://litt.design/issue-15" label="Copy issue link" />,
      },
    },
  },
};

function InstallDemo() {
  return <CopyButton text={INSTALL} />;
}

function ShortLineDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6">
      <CopyButton
        text={"curl -H 'Authorization: Bearer $HALDEN_KEY' https://api.halden.studio/v1/projects"}
        command="curl api.halden.studio/v1/projects"
        label="Copy the projects call"
      />
      <CopyButton text="vercel deploy --prod --yes" label="Copy the deploy command" />
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): the commands that move a take off the card ---------- */

function TakeCommandsDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6">
      <CopyButton
        text="ffmpeg -i take_04.wav -ar 48000 -c:a pcm_s24le take_04_48k.wav"
        command="ffmpeg -i take_04.wav … take_04_48k.wav"
        label="Copy the convert command"
      />
      <CopyButton text="rec export --card A --format wav" label="Copy the export command" />
    </div>
  );
}

/* ---------- Flat's own (plans/027): an issue share link and a compact install command ---------- */

function IssueLinkFlatDemo() {
  return <CopyButton text="https://litt.design/issue-15" label="Copy issue link" className="mx-auto" />;
}

function ShortLineFlatDemo() {
  return (
    <CopyButton
      text="npx shadcn@latest add https://littmd.vercel.app/r/poll.json"
      command="npx shadcn@latest add …/poll.json"
      label="Copy poll install command"
      className="mx-auto"
    />
  );
}

function CopyTileFlat() {
  return (
    <CopyButton
      text="https://litt.design/issue-15"
      label="Copy issue link"
      className="[&_[data-part=ink]]:bg-block [&_[data-part=ink]]:text-fg [&_[data-part=ink]]:hover:bg-(--block-hover)"
    />
  );
}

export default function CopyButtonPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<CopyTileFlat />}
      tileByWorld={{ device: <InstallDemo />, flat: <CopyTileFlat /> }}
    >
      <Stage
        title="Copy an install line"
        tier="responsive"
        align="start"
        code="InstallDemo"
        byWorld={{
          flat: {
            demo: <IssueLinkFlatDemo />,
            title: "Copy an issue link",
            code: "IssueLinkFlatDemo",
            caption:
              "Press Copy. The pill dips on pointerdown, the line softens for a beat, and the pill flips into a tinted Copied confirmation with a check that draws in before returning to Copy.",
          },
        }}
        caption="Press the key. It sinks onto its skirt, the copy glyph gives way to a check that draws in, and the glass says Copied while the command scrambles away from the right. A moment later it decodes back in from the left. Press again mid-wave and it reverses where it is. Nothing happens until you press."
      >
        <InstallDemo />
      </Stage>

      <Stage
        title="A shorter line"
        tier="responsive"
        align="start"
        code="ShortLineDemo"
        byWorld={{
          device: { demo: <TakeCommandsDemo />, code: "TakeCommandsDemo" },
          flat: {
            demo: <ShortLineFlatDemo />,
            code: "ShortLineFlatDemo",
            caption:
              "Pass command to display a shorter line while text holds the full string for the clipboard. Long values truncate cleanly with an ellipsis so the card fits narrow screens.",
          },
        }}
        caption="The line can show less than the key copies: pass command for the glass and text for the clipboard. The glass wraps a long command rather than cutting it, and a hidden character keeps its width, so nothing shifts while the wave runs."
      >
        <ShortLineDemo />
      </Stage>

      <TryIt of="CopyButton" component={CopyButton} props={{ text: "npm i @halden/brand-kit" }} controls={["text", "command", "label"]} />
    </Page>
  );
}
