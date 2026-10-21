import { useState } from "react";
import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "code-block",
  title: "Code block",
  lede: "Code, quiet and copyable.",
  order: 18.96,
  group: "Agents",
  summary:
    "Code in an answer, in a tool's output, or a diff. Mono on a quiet surface with the file name and a Copy button in a header, highlighting in the foreground's tones only, and a diff whose sign carries the status color. Long lines scroll inside the block. Nothing moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["code-block"],
  exports: ["CodeBlock"],
  usage: `import { CodeBlock } from "@/components/code-block";

// A file in an answer. The language picks the highlighting, and the file name replaces it in the header.
<CodeBlock lang="ts" filename="next.config.ts" code={source} />

// A diff: the first character of every line is its sign (+, - or a space).
<CodeBlock lang="diff" filename="app/layout.tsx" label="Fix for the missing font" code={patch} />

// A terminal session, numbered and capped in height.
<CodeBlock lang="shell" lineNumbers maxHeight="16rem" label="Build output" code={log} />`,
  use: [
    "Code the agent wrote or ran: a file in an answer, the output of a command, or a patch it made.",
    "A change to show as a diff, so the person sees what moved and not the whole file. The sign carries the color, and the words are there for a screen reader.",
    "Long output. Set maxHeight so a build log never pushes the answer off the screen, and the block scrolls inside itself.",
    "Something to copy. The Copy button puts exactly the text you passed on the clipboard, a diff with its signs included.",
    "More than one block on a page. Give each a label or a file name, so a keyboard user hears which one has focus.",
  ],
  skip: [
    "A word of code inside a sentence. Use the inline code style of Message text.",
    "The input and output of one tool call. Use ToolCall, which shows them under its own row.",
    "A key or a shortcut. Use Kbd.",
    "Code the reader edits. This is a read-only block, so use a code editor.",
    "A language other than tsx, ts, jsx or js that needs colors. It shows as plain mono, because litt does not ship a rainbow theme.",
  ],
  keyboard: [
    [["Tab"], "Moves to the Copy button, then to the code. The code takes focus so it can be scrolled."],
    [["←", "→", "↑", "↓"], "Scrolls the focused code sideways or down."],
    [["Page Up", "Page Down", "Home", "End"], "Scrolls the focused code by a page, or to its start or end."],
    [["Enter", "Space"], "Presses the focused Copy button."],
  ],
  a11y: [
    "The code sits in a focusable group named by label. It defaults to the file name, or \"Code\". Because the block is focusable, a keyboard user can scroll long lines and tall blocks. Give two blocks on one page two different names.",
    "The Copy button is named \"Copy code\". After a press the icon becomes a check at once, and a polite live region says \"Copied\", or says how to copy by hand if the browser refused. No toast.",
    "In a diff the sign column is hidden from screen readers, and each added or removed line starts with hidden words, \"Added:\" or \"Removed:\". Context lines say nothing. Color is never the only signal: the sign and the words say it too.",
    "Line numbers and diff signs are hidden from screen readers and cannot be selected, so a hand selection gives the code only. Copy gives the text as you passed it.",
    "Comments and removed lines use fg-subtle, and the other tones are fg and fg-muted, all on surface-2. The page's axe run checks them in both themes.",
    "Highlighting never leans on color to carry meaning. Keywords, strings and comments step through tones of the foreground and a hint of the accent text, which the words around them already explain.",
    "On a touch screen the header and the Copy button grow to 44px. The button sits in the header, so it never covers a line.",
    "Nothing moves. Under reduced motion there is nothing to turn off.",
  ],
};

/* The Framer code component on the Halo site: a build badge with property controls. */
const BADGE = `import { addPropertyControls, ControlType } from "framer";

type Props = {
  project: string;
  status: "live" | "building" | "failed";
};

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function BuildBadge({ project, status }: Props) {
  const label = status === "live" ? "Live" : status === "building" ? "Building" : "Failed";
  return (
    <div style={{ display: "inline-flex", gap: 8, padding: "4px 8px", fontFamily: "Geist Mono" }}>
      <span>{project}</span>
      <span>{label}</span>
    </div>
  );
}

addPropertyControls(BuildBadge, {
  project: { type: ControlType.String, defaultValue: "Halo" },
  status: { type: ControlType.Enum, options: ["live", "building", "failed"], defaultValue: "live" },
});`;

/* The build that failed on the missing font file. */
const BUILD_LOG = [
  "$ npm run build",
  "",
  "> halo-site@0.4.2 build",
  "> next build",
  "",
  "   Creating an optimized production build ...",
  "Failed to compile.",
  "",
  "./app/layout.tsx",
  "Module not found: Can't resolve './fonts/Geist.woff2'",
  "",
  "Import trace for requested module:",
  "./app/layout.tsx",
  "",
  "> Build failed because of webpack errors",
].join("\n");

/* The fix Litt made. The first character of each line is its sign. */
const FIX = [
  "@@ -1,9 +1,9 @@",
  " import type { Metadata } from \"next\";",
  "-import localFont from \"next/font/local\";",
  "+import { Geist } from \"next/font/google\";",
  " import \"./globals.css\";",
  " ",
  "-const sans = localFont({ src: \"./fonts/Geist.woff2\" });",
  "+const sans = Geist({ subsets: [\"latin\"], display: \"swap\" });",
  " ",
  " export const metadata: Metadata = { title: \"Halo\" };",
].join("\n");

/* next.config.ts of the Halo site. */
const NEXT_CONFIG = `import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "framerusercontent.com" }],
  },
  async redirects() {
    return [
      { source: "/work/halo", destination: "/projects/halo", permanent: true },
      { source: "/work/northwind", destination: "/projects/northwind", permanent: true },
      { source: "/work/atlas", destination: "/projects/atlas", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default config;`;

/* One line that is wider than any column. */
const LONG_LINE = `const csp = "default-src 'self'; img-src 'self' framerusercontent.com data:; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; connect-src 'self' https://vitals.vercel-insights.com";`;

function FilesDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-2xl gap-6">
      <CodeBlock lang="tsx" filename="BuildBadge.tsx" code={BADGE} />
      <CodeBlock lang="shell" label="Build output for halo-site" code={BUILD_LOG} />
    </div>
  );
}

function DiffDemo() {
  return (
    <div className="w-full min-w-0 max-w-2xl">
      <CodeBlock lang="diff" filename="app/layout.tsx" label="Fix for the missing font in app/layout.tsx" code={FIX} />
    </div>
  );
}

function LongDemo() {
  const [wrap, setWrap] = useState(false);
  return (
    <div className="grid w-full min-w-0 max-w-2xl gap-6">
      <CodeBlock lang="ts" filename="next.config.ts" lineNumbers maxHeight="16rem" code={NEXT_CONFIG} />
      <div className="grid min-w-0 gap-3">
        <div className="flex justify-end">
          <Button size="sm" aria-pressed={wrap} onClick={() => setWrap((w) => !w)}>
            {wrap ? "Scroll long lines" : "Wrap long lines"}
          </Button>
        </div>
        <CodeBlock lang="ts" filename="headers.ts" label="A long line from headers.ts" wrap={wrap} code={LONG_LINE} />
      </div>
    </div>
  );
}

function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="mx-auto grid w-full min-w-0 max-w-sm gap-4 rounded-surface bg-canvas p-4 shadow-[inset_0_0_0_1px_var(--line-strong)]">
        <p className="text-body text-fg-muted">Litt fixed the font import in app/layout.tsx. The build passes now.</p>
        <CodeBlock lang="diff" filename="app/layout.tsx" label="Fix for the missing font on a phone" code={FIX} />
        <CodeBlock lang="ts" filename="headers.ts" label="A long line from headers.ts on a phone" code={LONG_LINE} />
      </div>
    </DeviceProvider>
  );
}

export default function CodeBlockPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A file and a shell session"
        align="start"
        code="FilesDemo"
        caption="The Halo site's Framer component sits on a quiet surface with its file name in the header. Keywords and signs step back to fg-muted, comments to fg-subtle, and strings take a hint of the accent text, so the code stays calm and no data hue appears. The build log is a shell session, so it shows plain. Nothing moves, and Copy swaps its icon at once."
      >
        <FilesDemo />
      </Stage>

      <Stage
        title="The fix, as a diff"
        align="start"
        code="DiffDemo"
        caption="The build failed on a font file that was missing, and Litt swapped it for the Google font. The sign carries the status color, removed lines step back to fg-subtle, and both kinds sit on a faint band that runs the full width. A screen reader hears Added or Removed before each changed line. Copy gives the diff as it was written."
      >
        <DiffDemo />
      </Stage>

      <Stage
        title="Line numbers, height and long lines"
        align="start"
        size="lg"
        code="LongDemo"
        caption="Numbers sit in a gutter that cannot be selected and is not copied. The first block stops at its max height and scrolls down. A long line scrolls sideways inside its block, and the button turns that into wrapping. Tab into either block and use the arrow keys, because the scroller takes focus."
      >
        <LongDemo />
      </Stage>

      <Stage
        title="On a phone"
        align="start"
        size="lg"
        code="PhoneDemo"
        caption="In a phone-wide frame the block keeps the width of its column, and long lines scroll inside it, so the page never moves sideways. The Copy button lives in the header, so a line never runs under it. On a touch screen the header and the button grow to 44px."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
