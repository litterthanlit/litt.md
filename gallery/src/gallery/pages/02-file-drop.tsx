import { useEffect, useRef, useState } from "react";
import { FileDrop, FileList, FileRow } from "@/components/file-drop";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "file-drop",
  title: "File drop",
  lede: "Drop files in, or choose them, and watch them go up.",
  order: 2.05,
  group: "Inputs",
  worlds: ["press", "device", "plain", "rack", "heat"],
  verbs: ["drag", "press"],
  summary:
    "An area to drop files on or choose them from. It holds the words and a Choose files button. While files are over it the area changes and the words say what a drop will do. It turns away files of the wrong type or size and says which and why, and the list below shows each file uploading, with Retry for one that failed.",
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
    "The button that opens the picker is a real button whose name begins with the words it shows, described by the hint, so the types and the limit are heard before the picker opens. Dragging is never the only way.",
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

/* ---------- Device's own (plans/024, phase 3): sending takes from a computer to the recorder's card ---------- */

const TAKES_START: Upload[] = [
  { id: "take_03", name: "take_03.wav", size: 182_452_224 },
  { id: "take_04", name: "take_04.wav", size: 241_172_480, progress: 64, error: "The cable came out at 64%." },
];

/** The same pretend upload, starting from two takes: each climbs at its own pace, and one in four stops partway. */
function useTakeUploads() {
  const [uploads, setUploads] = useState<Upload[]>(TAKES_START);
  const timer = useRef(0);
  useEffect(() => {
    timer.current = window.setInterval(() => {
      setUploads((all) =>
        !all.some((u) => u.progress !== undefined && !u.error) ? all : all.map((u) => {
          if (u.progress === undefined || u.error || u.progress >= 100) return u;
          const step = 6 + (u.name.length % 5) * 3;
          const next = Math.min(100, u.progress + step);
          if (u.id.endsWith("-3") && next >= 40) return { ...u, progress: 40, error: "The cable came out at 40%." };
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

function CopyTakesDemo() {
  const { uploads, add, retry, remove } = useTakeUploads();
  return (
    <div className="grid w-full max-w-lg gap-6">
      <FileDrop label="Takes for card A" accept={[".wav", ".flac"]} maxSize={2 * 1024 * 1024 * 1024} hint="WAV or FLAC, up to 2 GB a take" onFiles={add} />
      {uploads.length > 0 && (
        <FileList label="Takes for card A">
          {uploads.map((u) => (
            <FileRow key={u.id} name={u.name} size={u.size} progress={u.progress} error={u.error} onRetry={() => retry(u.id)} onRemove={() => remove(u.id)} />
          ))}
        </FileList>
      )}
    </div>
  );
}

function SlatePhotoDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6">
      <FileDrop label="Slate photo" multiple={false} accept={["image/*"]} hint="One photo of the slate, shown beside the take" onFiles={() => {}} />
      <FileDrop label="Takes for card B" disabled hint="Card B is locked. Slide the switch on its side to write to it." onFiles={() => {}} />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): pictures for a post ---------- */

const PICTURES_START: Upload[] = [
  { id: "open-water", name: "open-water.jpg", size: 4_404_019 },
  { id: "dusk-tide", name: "dusk-tide.jpg", size: 5_872_025, progress: 64, error: "The connection dropped at 64%." },
];

/** The same pretend upload, starting from two pictures: each climbs at its own pace, and one in four stops partway. */
function usePictureUploads() {
  const [uploads, setUploads] = useState<Upload[]>(PICTURES_START);
  const timer = useRef(0);
  useEffect(() => {
    timer.current = window.setInterval(() => {
      setUploads((all) =>
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

function PostPicturesDemo() {
  const { uploads, add, retry, remove } = usePictureUploads();
  return (
    <div className="grid w-full max-w-lg gap-3">
      <FileDrop label="Pictures for this post" accept={["image/*"]} maxSize={20 * 1024 * 1024} hint="JPG, PNG or WebP, up to 20 MB a picture" onFiles={add} />
      {uploads.length > 0 && (
        <FileList label="Pictures for this post">
          {uploads.map((u) => (
            <FileRow key={u.id} name={u.name} size={u.size} progress={u.progress} error={u.error} onRetry={() => retry(u.id)} onRemove={() => remove(u.id)} />
          ))}
        </FileList>
      )}
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
        byWorld={{
          flat: {
            demo: <PostPicturesDemo />,
            title: "Add pictures to a post",
            code: "PostPicturesDemo",
            caption:
              "Drag pictures from your desktop over the area: it is ringed in ink, and the words say what a drop will do. Drop them, or press Choose files. A file that is not a picture, or is over 20 MB, is turned away with a sentence under the area. Each picture that gets in uploads on its own rail; the fourth one stops partway and offers Retry. Remove cancels an upload or takes a picture away.",
          },
          device: {
            demo: <CopyTakesDemo />,
            title: "Copy takes to the card",
            code: "CopyTakesDemo",
            caption:
              "The recorder, mounted on a computer over USB-C, takes WAVs onto its card. Drag takes over the area and its lamp lights, and the words say what a drop will do. Drop them, or press Choose files. A file of another type or over 2 GB is turned away with a sentence under the area. Each take copies on its own rail; the fourth one stops partway and offers Retry. Remove cancels a copy or takes a file away.",
          },
        }}
      >
        <UploadDemo />
      </Stage>

      <Stage
        title="One file, and disabled"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="multiple={false} takes one file and says so on its button. Disabled lies flat (surface-2, muted words), with no drop and no tab stop; its hint says when it opens again."
        byWorld={{
          device: {
            demo: <SlatePhotoDemo />,
            code: "SlatePhotoDemo",
            caption: "multiple={false} takes one file and says so on its button. Disabled lies flat, with no drop and no tab stop; its hint says how to open it.",
          },
        }}
      >
        <StatesDemo />
      </Stage>

      <TryIt of="FileDrop" component={FileDrop} props={{ label: "Project files", hint: "PDF or images, up to 10 MB", onFiles: () => {}, className: "w-full max-w-lg" }} controls={["hint", "multiple", "disabled"]} />
    </Page>
  );
}
