import { useEffect, useRef } from "react";
import { CopyButton } from "@/components/copy-button";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "copy-button",
  title: "Copy button",
  lede: "A key that copies a command, and the glass that shows it.",
  order: 1.5,
  group: "Controls",
  verbs: ["press"],
  worlds: ["device"],
  summary:
    "A key beside a line of LCD glass that shows a command in the mono. A press copies the text and the key sinks onto its skirt, the copy glyph crossfades to a check that draws in, and the line says Copied while the command's glyphs scramble away and decode back in a wave. Nothing moves until a hand presses it. It belongs to Device, where keys and glass are the material.",
  tiers: ["instant", "responsive"],
  mechanism:
    "A press sinks the key the whole 2px onto its skirt, at once. The copy glyph crossfades to a check on the responsive tier, and the check draws in after a beat. The command leaves the glass from the right as scrambled display glyphs, each character glitching 140 to 340ms, and the line says Copied for 1800ms. Then the command decodes back in from the left. The whole wave takes at most 520ms, and a hidden character keeps its width, so the line never moves. A second press mid-wave reverses it where it is. Reduced motion swaps the glyphs at once and draws nothing.",
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
  skip: [
    "A value in a row of details, such as a domain or an id. Use the copy icon button the Details row carries.",
    "A long block of code. Use the code block's own copy action.",
    "An action that is not a copy. This key says Copied; use a Button.",
  ],
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
};

const INSTALL = "npx shadcn@latest add https://littmd.vercel.app/r/copy-button.json";

/** Presses the key itself once it has mounted, so the Replay plays the copy without a hand on it. */
function ReplayCopy() {
  const { reduced } = useMotionDial();
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => root.current?.querySelector("button")?.click(), 250);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return (
    <span ref={root} className="contents">
      <CopyButton text={INSTALL} />
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
  states: {
    default: <CopyButton text="npm i @halden/brand-kit" />,
  },
  replay: {
    label: "Replay the copy",
    caption: "Watch the command scramble away from the right, the glass say Copied, and the command decode back in from the left.",
    run: () => <ReplayCopy />,
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

export default function CopyButtonPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="Copy an install line"
        tier="responsive"
        align="start"
        code="InstallDemo"
        caption="Press the key. It sinks onto its skirt, the copy glyph gives way to a check that draws in, and the glass says Copied while the command scrambles away from the right. A moment later it decodes back in from the left. Press again mid-wave and it reverses where it is. Nothing happens until you press."
      >
        <InstallDemo />
      </Stage>

      <Stage
        title="A shorter line"
        tier="responsive"
        align="start"
        code="ShortLineDemo"
        caption="The line can show less than the key copies: pass command for the glass and text for the clipboard. The glass wraps a long command rather than cutting it, and a hidden character keeps its width, so nothing shifts while the wave runs."
      >
        <ShortLineDemo />
      </Stage>

      <TryIt of="CopyButton" component={CopyButton} props={{ text: "npm i @halden/brand-kit" }} controls={["text", "command", "label"]} />
    </Page>
  );
}
