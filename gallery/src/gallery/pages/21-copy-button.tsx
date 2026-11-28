import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "copy-button",
  title: "Copy button",
  lede: "A key that copies a command, and the glass that shows it.",
  ledeByWorld: { flat: "Copy, and the line says so." },
  order: 1.02,
  group: "Actions",
  verbs: ["press"],
  worlds: ["device", "flat"],
  summary:
    "A key beside a line of LCD glass that shows a command in the mono. A press copies the text and the key sinks onto its skirt, the copy glyph crossfades to a check that draws in, and the line says Copied while the command's glyphs scramble away and decode back in a wave. Nothing moves until a hand presses it. It belongs to Device, where keys and glass are the material.",
  summaryByWorld: {
    flat: "The command in a white pill on the grey ground, in the mono after a quiet $, and an ink circle at its end that copies it. A press shrinks the circle a little, the copy glyph gives way to a check that draws itself, and the line says Copied to clipboard, then gives the command back. Nothing moves until a hand presses it.",
  },
  tiers: ["instant", "responsive"],
  movesByWorld: {
    flat: "A press shrinks the ink circle to 0.96 on the instant tier. The copy glyph crossfades to a check on the responsive tier, and the check draws itself after a beat. The command leaves upward with no bounce while Copied to clipboard rises into its place on Flat's expressive spring; 1800ms later they swap back the same way, the command arriving from below. One thing moves at a time. Reduced motion swaps the line at once and draws nothing.",
  },
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
  useByWorld: {
    flat: [
      "A command or snippet someone will paste into a terminal: an install line, a curl call, a deploy command.",
      "Under Flat, on the grey ground, where the white pill reads as the one thing to copy. It needs data-material=\"flat\" on <html> to look like itself.",
    ],
  },
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
  a11yByWorld: {
    flat: [
      "The key is a real button named \"Copy command\" (set label for another name), and the command beside it is real text.",
      "\"Copied\" is said once in a polite status, and only on a real copy. Nothing is announced on mount.",
      "The line says Copied to clipboard in words as well as the check drawing, so the state never rests on an icon or a color.",
      "If the clipboard refuses, the line says so and the status tells a screen reader to copy it by hand.",
      "Under reduced motion the line swaps at once and the check appears without drawing.",
    ],
  },
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
  partsByWorld: {
    flat: [
      { name: "The pill", selector: ":scope > span" },
      { name: "The command", selector: "code" },
      { name: "The key", selector: "button" },
      { name: "The glyph", selector: "button svg" },
    ],
  },
  states: {
    default: <CopyButton text="npm i @halden/brand-kit" />,
  },
  replay: {
    label: "Replay the copy",
    caption: "Watch the check draw itself and the line say Copied while the command steps away, then come back.",
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

/* ---------- Flat's own: a small site's commands ---------- */

/** Flat's lead: the install line. It never presses itself, since a press writes to the visitor's clipboard. */
/* On Flat's wall (and in its viewer) the copy plays itself every few seconds, with nothing put on the clipboard. */
function FlatInstallDemo() {
  const [rehearse, setRehearse] = useState(0);
  const run = useSelfRun((n) => setRehearse(n + 1), { every: 3200, first: 1200 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <CopyButton text={INSTALL} command="npx shadcn add copy-button" rehearse={rehearse} />
    </div>
  );
}

function PostCommandsDemo() {
  return (
    <div className="grid w-full max-w-md gap-4">
      <CopyButton text="npx create-site@latest spring-letters" label="Copy the new site command" />
      <CopyButton text="git push origin main" label="Copy the publish command" />
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
        byWorld={{
          flat: {
            demo: <FlatInstallDemo />,
            code: "FlatInstallDemo",
            caption: "Press the circle. It gives a little, the glyph turns into a check that draws itself, and the line says Copied to clipboard while the command steps away, then gives it back. Press again before it does and it holds a little longer. Nothing happens until you press.",
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
        byWorld={{ device: { demo: <TakeCommandsDemo />, code: "TakeCommandsDemo" }, flat: { demo: <PostCommandsDemo />, code: "PostCommandsDemo" } }}
        caption="The line can show less than the key copies: pass command for the glass and text for the clipboard. The glass wraps a long command rather than cutting it, and a hidden character keeps its width, so nothing shifts while the wave runs."
      >
        <ShortLineDemo />
      </Stage>

      <TryIt of="CopyButton" component={CopyButton} props={{ text: "npm i @halden/brand-kit" }} controls={["text", "command", "label"]} />
    </Page>
  );
}
