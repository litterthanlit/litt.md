import { useEffect, useRef, useState } from "react";
import { FileDrop, FileList, FileRow } from "@/components/file-drop";
import { MaterialProvider } from "@/motion";
import { useCustomize, useDark } from "../customize-state";
import { lookAttributes, MATERIALS } from "../look";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "file-drop",
  title: "File drop",
  lede: "Drop files in, or choose them, and watch them go up.",
  order: 2.35,
  group: "Controls",
  verbs: ["drag", "press"],
  summary:
    "An area to drop files on or choose them from. Press is a deep tray in a plate with an arrow block, the words and a Choose files button; Flat is a grey sheet with one sentence, \"Drop files or choose\"; Device is a slot with an engraved legend and a Choose key. While files are over it the area changes and the words say what a drop will do. It turns away files of the wrong type or size and says which and why, and the list below shows each file uploading, with Retry for one that failed.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["file-drop"],
  exports: ["FileDrop", "FileList", "FileRow"],
  usage: `import { FileDrop, FileList, FileRow } from "@/components/file-drop";

<FileDrop
  label="Project files"
  accept={[".pdf", "image/*"]}
  maxSize={10 * 1024 * 1024}
  hint="PDF or images, up to 10 MB"
  onFiles={(files) => upload(files)}
/>
<FileList label="Project files">
  {uploads.map((u) => (
    <FileRow key={u.id} name={u.name} size={u.size} progress={u.progress} error={u.error} onRetry={() => retry(u)} onRemove={() => remove(u)} />
  ))}
</FileList>`,
  use: [
    "Adding files to something: a brief to a project, images to a page, a CSV to import.",
    "A place where people already have the files open in another window, so dragging them in is quicker than finding them again.",
  ],
  skip: [
    "Attaching a file to a message to an agent. The Composer has its own attach button and file chips.",
    "Changing one picture, such as an avatar. A button that opens the picker is enough.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to Choose files. The area itself is not a tab stop."],
    [["Enter", "Space"], "Opens the file picker."],
  ],
  a11y: [
    "Choose files is a real button, described by the hint, so the types and the limit are heard before the picker opens. Dragging is never the only way.",
    "The area is a group named by the label. A click anywhere on it opens the picker too, for the pointer's convenience.",
    "Files turned away are said in an alert, one sentence each, naming the file and the reason.",
    "Each row's Progress is named \"Uploading <file>\", ends in words, and a failure's reason is read with it. Retry and Remove are named for their file.",
  ],
};

type Upload = { id: string; name: string; size: number; progress?: number; error?: string };

/** Two files already there: one in, one that failed. */
const START: Upload[] = [
  { id: "brief", name: "halo-brief.pdf", size: 2_516_582 },
  { id: "fonts", name: "brand-fonts.zip", size: 6_291_456, progress: 64, error: "The connection dropped at 64%." },
];

/** A pretend upload: each file climbs at its own pace, and one in four stops partway. */
function useUploads() {
  const [uploads, setUploads] = useState<Upload[]>(START);
  const timer = useRef(0);
  useEffect(() => {
    timer.current = window.setInterval(() => {
      setUploads((all) =>
        /* Nothing uploading: the same list, so nothing renders. */
        !all.some((u) => u.progress !== undefined && !u.error) ? all : all.map((u) => {
          if (u.progress === undefined || u.error || u.progress >= 100) return u;
          const step = 6 + (u.name.length % 5) * 3;
          const next = Math.min(100, u.progress + step);
          if (u.id.endsWith("-3") && next >= 40) return { ...u, progress: 40, error: "The connection dropped at 40%." };
          return { ...u, progress: next >= 100 ? undefined : next };
        }),
      );
    }, 300);
    return () => window.clearInterval(timer.current);
  }, []);
  return {
    uploads,
    add: (files: File[]) =>
      setUploads((all) => [...all, ...files.map((f, i) => ({ id: `${f.name}-${all.length + i}`, name: f.name, size: f.size, progress: 0 }))]),
    retry: (id: string) => setUploads((all) => all.map((u) => (u.id === id ? { ...u, id: `${u.id}-again`, progress: 0, error: undefined } : u))),
    remove: (id: string) => setUploads((all) => all.filter((u) => u.id !== id)),
  };
}

function UploadDemo() {
  const { uploads, add, retry, remove } = useUploads();
  return (
    <div className="grid w-full max-w-lg gap-6">
      <FileDrop label="Project files" accept={[".pdf", ".zip", "image/*"]} maxSize={10 * 1024 * 1024} hint="PDF, ZIP or images, up to 10 MB" onFiles={add} />
      {uploads.length > 0 && (
        <FileList label="Project files">
          {uploads.map((u) => (
            <FileRow key={u.id} name={u.name} size={u.size} progress={u.progress} error={u.error} onRetry={() => retry(u.id)} onRemove={() => remove(u.id)} />
          ))}
        </FileList>
      )}
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6">
      <FileDrop label="Cover image" multiple={false} accept={["image/*"]} hint="One image, at least 1600 pixels wide" onFiles={() => {}} />
      <FileDrop label="Invoices" disabled hint="Invoices open again on the first of the month" onFiles={() => {}} />
    </div>
  );
}

function ThreeBodiesDemo() {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <div className="grid w-full gap-6">
      {MATERIALS.map((m) => (
        <figure key={m.id} className="m-0 grid min-w-0 content-start gap-3">
          <div
            {...lookAttributes({ accent: look.accent, material: m.id }, dark)}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start items-start gap-6 rounded-surface bg-canvas p-6 text-fg outline-1 -outline-offset-1 outline-line md:grid-cols-2"
          >
            <MaterialProvider material={m.id}>
              <FileDrop label={`Project files, ${m.name}`} accept={[".pdf", ".zip"]} hint="PDF or ZIP, up to 10 MB" onFiles={() => {}} />
              <FileList label={`Uploads, ${m.name}`}>
                <FileRow name="halo-brief.pdf" size={2_516_582} onRemove={() => {}} />
                <FileRow name="launch-deck.pdf" size={4_404_019} progress={55} onRemove={() => {}} />
                <FileRow name="brand-fonts.zip" size={6_291_456} progress={64} error="The connection dropped at 64%." onRetry={() => {}} onRemove={() => {}} />
              </FileList>
            </MaterialProvider>
          </div>
          <figcaption className="text-caption text-fg-muted">{m.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function FileDropPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Add files to a project"
        tier="instant"
        align="start"
        code="UploadDemo"
        caption="Drag files from your desktop over the area: it deepens (or is ringed in ink, or lights its lamp, by the look) and the words say what a drop will do. Drop them, or press Choose files. A file of another type or over 10 MB is turned away with a sentence under the area. Each file that gets in uploads on its own rail; the fourth one stops partway and offers Retry. Remove cancels an upload or takes a file away."
      >
        <UploadDemo />
      </Stage>

      <Stage
        title="One file, and disabled"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="multiple={false} takes one file and says so on its button. Disabled lies flat (surface-2, muted words), with no drop and no tab stop; its hint says when it opens again."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Three bodies"
        tier="instant"
        caption="One contract, three bodies. Press is a plate that stands with a deep tray cut into it: an arrow on a raised block, the words and Choose files, the tray going deeper and its lower wall catching the light while a file is over it; each file is a slat, a raised block in a tray of its own, with its rail cut into it. Flat is a grey sheet with one sentence, Drop files or choose, ringed in ink while a file is over it; each file is a line of words, with Retry and Remove as words. Device is a slot: an engraved legend over LCD glass in a bezel, a Choose key beside it, and each file a line of glass whose upload lights segments in steps. Each is drawn here whatever look the page is in; the props, the keyboard and what a screen reader hears are the same in all three."
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>

      <TryIt of="FileDrop" component={FileDrop} props={{ label: "Project files", hint: "PDF or images, up to 10 MB", onFiles: () => {}, className: "w-full max-w-lg" }} controls={["hint", "multiple", "disabled"]} />
    </Page>
  );
}
