import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/resizable";
import { Tree, type TreeNode } from "@/components/tree";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "resizable",
  title: "Resizable",
  lede: "Panels with a line you drag between them.",
  order: 7.08,
  group: "Layout",
  worlds: ["press", "device", "plain", "rack", "heat"],
  verbs: ["drag"],
  summary:
    "Panels side by side or stacked, with a hairline between each two that a person drags to give one more room. The line follows the pointer one to one, each panel stays between its smallest and largest size, and a double click puts the two back. The arrow keys move it too, and the layout can be kept for next time.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["resizable"],
  exports: ["ResizablePanelGroup", "ResizablePanel", "ResizableHandle"],
  usage: `import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/resizable";

// Sizes are percents. autoSaveId keeps the layout someone chose in their browser.
<ResizablePanelGroup direction="horizontal" autoSaveId="deploy-split" className="h-[32rem]">
  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
    <Tree label="Files" items={files} />
  </ResizablePanel>
  <ResizableHandle label="Resize the file tree" />
  <ResizablePanel minSize={40}>
    <LogView label="Build log" lines={lines} />
  </ResizablePanel>
</ResizablePanelGroup>`,
  use: [
    "Two or three things people work with at once, where how much room each gets depends on the task: a tree beside a file, a list beside its detail, a chat beside a preview.",
    "A layout people come back to, where keeping their split saves them doing it again.",
  ],
  skip: [
    "A phone. Two panels side by side are rarely both readable: show one at a time with a Segmented control.",
    "A sidebar of navigation. That is the AppShell, which has its own width.",
    "Content that should simply wrap at a breakpoint. Use the layout's own grid.",
  ],
  keyboard: [
    [["Tab"], "Moves to each handle in turn."],
    [["ArrowLeft", "ArrowRight"], "Move the line 5% (side by side). With Shift, 20%."],
    [["ArrowUp", "ArrowDown"], "Move the line 5% (stacked). With Shift, 20%."],
    [["Home", "End"], "Give the panel before the line its smallest or largest size."],
  ],
  a11y: [
    "Each handle is a separator with its value: the size of the panel before it, between that panel's bounds, and aria-controls pointing at it.",
    "Name each handle for what it resizes (\"Resize the file tree\"), so a screen reader says what moves.",
    "The handle's hit area is 12px wide, and 44px under a finger, centered on the 1px line.",
    "It draws the focus ring when it has keyboard focus, and the line's color changes are instant.",
    "Nothing animates: the line follows the pointer or jumps by the step.",
  ],
};

const FILES: TreeNode[] = [
  { id: "app", label: "app", children: [{ id: "app/layout.tsx", label: "layout.tsx" }, { id: "app/page.tsx", label: "page.tsx" }] },
  { id: "components", label: "components", children: [{ id: "components/header.tsx", label: "header.tsx" }] },
  { id: "package.json", label: "package.json" },
];

const SOURCE: Record<string, string[]> = {
  "app/layout.tsx": ['import "@fontsource/geist-sans/400.css";', "", "export default function Layout({ children }) {", "  return <html lang=\"en\"><body>{children}</body></html>;", "}"],
  "app/page.tsx": ["export default function Home() {", "  return <main>Halo Studio</main>;", "}"],
  "components/header.tsx": ["export function Header() {", "  return <header>…</header>;", "}"],
  "package.json": ["{", '  "name": "halo-site",', '  "private": true', "}"],
};

function SplitDemo() {
  const [file, setFile] = useState("app/layout.tsx");
  return (
    <div className="litt-raised h-80 w-full overflow-hidden rounded-surface">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={32} minSize={20} maxSize={50} className="p-2">
          <Tree label="Files" items={FILES} on="surface-1" defaultExpanded={["app"]} selected={file} onSelect={(id, node) => !node.children && setFile(id)} />
        </ResizablePanel>
        <ResizableHandle label="Resize the file tree" />
        <ResizablePanel minSize={40} className="grid content-start gap-3 p-4">
          <p className="font-mono text-caption font-normal text-fg-subtle">{file}</p>
          <pre className="font-mono text-caption font-normal whitespace-pre-wrap text-fg-muted [overflow-wrap:anywhere]">{SOURCE[file]?.join("\n")}</pre>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Pane({ title, children }: { title: string; children: string }) {
  return (
    <div className="grid h-full content-start gap-1 p-4">
      <p className="text-small font-title text-fg">{title}</p>
      <p className="text-small text-fg-subtle">{children}</p>
    </div>
  );
}

function ThreeDemo() {
  return (
    <div className="litt-raised h-80 w-full overflow-hidden rounded-surface">
      <ResizablePanelGroup direction="horizontal" autoSaveId="litt-gallery-three" className="h-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Pane title="Inboxes">Studio, Billing, Clients.</Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize the inboxes" />
        <ResizablePanel defaultSize={35} minSize={25}>
          <Pane title="Threads">Twelve threads, newest first.</Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize the threads" />
        <ResizablePanel minSize={30}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={65} minSize={30}>
              <Pane title="Message">The open thread. Drag the line under it to give the reply more room.</Pane>
            </ResizablePanel>
            <ResizableHandle label="Resize the reply" />
            <ResizablePanel minSize={20}>
              <Pane title="Reply">Write here.</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a card's folders beside a take's metadata ---------- */

const CARD_FILES: TreeNode[] = [
  {
    id: "scene-12",
    label: "Scene 12",
    children: [
      { id: "scene-12/take_04.wav", label: "take_04.wav" },
      { id: "scene-12/take_05.wav", label: "take_05.wav" },
    ],
  },
  { id: "room-tone", label: "Room tone", children: [{ id: "room-tone/room_tone_01.wav", label: "room_tone_01.wav" }] },
  { id: "sound_report.csv", label: "sound_report.csv" },
];

const METADATA: Record<string, string[]> = {
  "scene-12/take_04.wav": ["48 kHz · 24 bit · 2 channels", "Length    00M 14S 06F", "Timecode  10:42:17:06 at 25 fps", "Scene 12 · take 4 · kept", "Channel 1 Lavalier · Channel 2 Boom"],
  "scene-12/take_05.wav": ["48 kHz · 24 bit · 2 channels", "Length    00M 22S 11F", "Timecode  10:44:02:19 at 25 fps", "Scene 12 · take 5 · clipped on channel 2", "Channel 1 Lavalier · Channel 2 Boom"],
  "room-tone/room_tone_01.wav": ["48 kHz · 24 bit · 2 channels", "Length    01M 00S 00F", "Timecode  11:03:40:00 at 25 fps", "Room tone · kitchen"],
  "sound_report.csv": ["scene,take,length,notes", "12,4,00:00:14:06,kept", "12,5,00:00:22:11,clipped ch2", "RT,1,00:01:00:00,kitchen"],
};

function CardFilesDemo() {
  const [file, setFile] = useState("scene-12/take_04.wav");
  return (
    <div className="litt-raised h-80 w-full overflow-hidden rounded-surface">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={32} minSize={20} maxSize={50} className="p-2">
          <Tree label="Card A" items={CARD_FILES} on="surface-1" defaultExpanded={["scene-12"]} selected={file} onSelect={(id, node) => !node.children && setFile(id)} />
        </ResizablePanel>
        <ResizableHandle label="Resize the card's folders" />
        <ResizablePanel minSize={40} className="grid content-start gap-3 p-4">
          <p className="font-mono text-caption font-normal text-fg-subtle">{file}</p>
          <pre className="font-mono text-caption font-normal whitespace-pre-wrap text-fg-muted [overflow-wrap:anywhere]">{METADATA[file]?.join("\n")}</pre>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function LibraryPanesDemo() {
  return (
    <div className="litt-raised h-80 w-full overflow-hidden rounded-surface">
      <ResizablePanelGroup direction="horizontal" autoSaveId="litt-gallery-three-device" className="h-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Pane title="Cards">Card A, Card B, Card C.</Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize the cards" />
        <ResizablePanel defaultSize={35} minSize={25}>
          <Pane title="Takes">Twelve takes, newest first.</Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize the takes" />
        <ResizablePanel minSize={30}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={65} minSize={30}>
              <Pane title="Waveform">The open take. Drag the line under it to give the notes more room.</Pane>
            </ResizablePanel>
            <ResizableHandle label="Resize the notes" />
            <ResizablePanel minSize={20}>
              <Pane title="Notes">Write here.</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site's posts beside the one you are writing ---------- */

const SITE_FILES: TreeNode[] = [
  { id: "posts", label: "Posts", children: [{ id: "posts/open-water", label: "Open water" }, { id: "posts/dusk-tide", label: "Dusk tide" }] },
  { id: "letter", label: "Letter", children: [{ id: "letter/issue-14", label: "Issue 14" }] },
  { id: "about", label: "About" },
];

const SITE_TEXT: Record<string, string[]> = {
  "posts/open-water": ["Open water", "", "The first of the spring series. I stood on the north pier for forty minutes before the light came.", "", "4 min read · 6 pictures"],
  "posts/dusk-tide": ["Dusk tide", "", "Twenty minutes after sunset, from the same pier, facing the other way.", "", "3 min read · 2 pictures"],
  "letter/issue-14": ["Issue 14", "", "Hello again. This is the last of the spring series, and the one I nearly did not take.", "", "Goes out Friday at 9:00"],
  about: ["About", "", "I walk the same mile of coast most mornings and photograph what the tide leaves."],
};

function PostSplitDemo() {
  const [page, setPage] = useState("posts/open-water");
  return (
    <div className="litt-raised h-80 w-full overflow-hidden rounded-surface">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={32} minSize={20} maxSize={50} className="p-2">
          <Tree label="Your site" items={SITE_FILES} on="surface-1" defaultExpanded={["posts"]} selected={page} onSelect={(id, node) => !node.children && setPage(id)} />
        </ResizablePanel>
        <ResizableHandle label="Resize the list of pages" />
        <ResizablePanel minSize={40} className="grid content-start gap-3 p-4">
          <p className="text-caption font-normal text-fg-subtle">{page}</p>
          <p className="text-small whitespace-pre-wrap text-fg-muted">{SITE_TEXT[page]?.join("\n")}</p>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default function ResizablePage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A tree beside its file"
        tier="instant"
        align="start"
        code="SplitDemo"
        byWorld={{
          flat: {
            demo: <PostSplitDemo />,
            title: "Pages beside a post",
            code: "PostSplitDemo",
            caption:
              "Drag the line between the site's pages and the post you are writing. It turns stronger under the pointer and follows it one to one, and the list stays between 20% and 50%. Double click it to put it back. Tab to it and the arrow keys move it by 5%.",
          },
          device: {
            demo: <CardFilesDemo />,
            title: "A card beside its take",
            code: "CardFilesDemo",
            caption:
              "Drag the hairline between the card's folders and the take's metadata. It turns stronger under the pointer and follows it one to one, and the folders stay between 20% and 50%. Double click it to put it back. Tab to it and the arrow keys move it by 5%, Shift by 20%.",
          },
        }}
        caption="Drag the hairline between the tree and the file. It turns stronger under the pointer and follows it one to one, and the tree stays between 20% and 50%. Double click it to put it back. Tab to it and the arrow keys move it by 5%, Shift by 20%."
      >
        <SplitDemo />
      </Stage>

      <Stage
        title="Three panels, and one stacked"
        tier="instant"
        align="start"
        code="ThreeDemo"
        byWorld={{
          device: {
            demo: <LibraryPanesDemo />,
            code: "LibraryPanesDemo",
            caption:
              "A handle only moves the two panels beside it, so the cards keep their width while you resize the take list. The right panel holds a stacked group of its own. This layout is kept in your browser: change it, come back, and it is as you left it.",
          },
        }}
        caption="A handle only moves the two panels beside it, so the inboxes keep their width while you resize the thread list. The right panel holds a stacked group of its own. This layout is kept in your browser: change it, come back, and it is as you left it."
      >
        <ThreeDemo />
      </Stage>
    </Page>
  );
}
