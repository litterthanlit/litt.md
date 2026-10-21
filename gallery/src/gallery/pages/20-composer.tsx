import { useEffect, useId, useRef, useState } from "react";
import { Composer, type ComposerFile } from "@/components/composer";
import { Select } from "@/components/select";
import { DeviceProvider, useDevice } from "@/motion";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "composer",
  title: "Composer",
  lede: "Where you write to an agent.",
  order: 18.92,
  group: "Agents",
  verbs: ["type"],
  summary:
    "Where the person writes to an agent: a text field that grows a line at a time, file chips, a toolbar and a round Send that turns into Stop while the agent answers. Send is the view's one accent fill. Only colors and the edge fade, on the instant tier, and a file chip enters on the responsive tier.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["composer"],
  exports: ["Composer", "FileChip"],
  usage: `import { useState } from "react";
import { Composer, type ComposerFile } from "@/components/composer";
import { Select } from "@/components/select";
import { useDevice, useVisibleScreen } from "@/motion";

const [files, setFiles] = useState<ComposerFile[]>([]);
const [streaming, setStreaming] = useState(false);

// Send turns into Stop while streaming. The field clears itself after onSend.
<Composer
  placeholder="Message Litt"
  hint="Litt can be wrong. Check what matters."
  streaming={streaming}
  onSend={(text) => {
    setStreaming(true);
    askLitt(text).finally(() => setStreaming(false));
  }}
  onStop={() => {
    cancelAnswer();
    setStreaming(false);
  }}
  // Passing onFiles shows the Attach button and takes pastes and drops. You own the list.
  files={files}
  onFiles={(picked) => setFiles((all) => [...all, ...picked.map(toChip)])}
  onRemoveFile={(file) => setFiles((all) => all.filter((f) => f.id !== file.id))}
  tools={
    <div className="w-36">
      <Select aria-label="Model" size="sm" options={MODELS} defaultValue="litt" />
    </div>
  }
/>

// An empty chat: a click puts the prompt in the field. The person still presses Send.
<Composer suggestions={["Why did the Halo build fail?", "Draft the Northwind launch note"]} onSend={askLitt} />

// A phone: its keyboard has no Shift, so Return adds a line and Send sends. Keep the composer
// above the keyboard by sizing the chat to the visible screen.
const { compact } = useDevice();
const screen = useVisibleScreen(compact);
<div className="flex flex-col" style={{ height: screen ? screen.height : "100dvh" }}>
  <Composer onSend={askLitt} />
</div>`,
  use: [
    "The place a person writes to an agent: a chat, the prompt box on an empty view, a reply box in an agent's side panel.",
    "Writing that grows and sometimes needs files. The field takes eight lines before it scrolls, and files come in by the Attach button, a paste or a drop.",
    "An agent that answers over time. Pass streaming and Send becomes Stop, and Esc stops the answer too.",
    "A chat with nothing in it yet. Pass suggestions, and a click fills the field for the person to edit and send.",
    "A limit on the text. Pass maxLength and a count shows from 80%, then turns to the danger color at the limit.",
  ],
  skip: [
    "A one-line field with a label in a form. Use TextField, or Textarea for a longer one.",
    "A search box. Use Input, or Command menu to jump to a page or an action.",
    "A comment box where no agent answers. The Stop button, the suggestions and the files are for an agent, so use Textarea and a Button.",
    "A sent message's files. Use FileChip on its own, with no onRemove.",
    "A long form field that a page submits. A composer sends on Enter, so it does not belong in a form.",
  ],
  keyboard: [
    [["Enter"], "Sends. While the answer streams it sends nothing. With enterSends off it adds a new line."],
    [["Shift+Enter"], "Starts a new line."],
    [["⌘Enter", "Ctrl+Enter"], "Sends. With enterSends off this is the only way to send from the field."],
    [["Esc"], "Stops the answer while it streams and the field has focus."],
    [["Tab"], "Moves through the suggestions, each chip's remove button, the field, Attach, your tools and Send. A disabled Send is skipped."],
    [["Enter", "Space"], "On a button, presses it. Removing a chip moves focus to the next chip, or to the field."],
  ],
  a11y: [
    "The field is a real textarea with a visually hidden label (the label prop, \"Message\" by default). The placeholder is never the name. The hint and the count are linked to it with aria-describedby.",
    "Send and Stop are one button whose name changes, so focus stays on it when they swap. After Send or Stop is pressed, focus goes back to the field. If the answer ends while Stop has focus, focus moves to the field instead of falling to the page.",
    "A disabled Send is out of the Tab order and says nothing about why, so say it in the hint: an approval is waiting, the thread is archived.",
    "Enter never sends while an input method is composing (isComposing, or the keyCode 229 that Safari reports), so confirming a candidate in Japanese or Chinese does not send half a word.",
    "The chips are a list named \"Attached files\", and each remove button is named for its file (\"Remove brief.pdf\"). A polite message says \"Attached\", \"Uploaded\" and \"Removed\". An upload's percent is read with the chip (\"uploading 64 percent\") and is not announced on every change.",
    "Attach opens the file picker, so a drop is never the only way to add a file, and a paste works from the keyboard.",
    "With maxLength the field stops at the limit. A polite message says \"Close to the limit\" once and \"Limit reached\" once, never on each key, and the count reads \"2,000 / 2,000\", so the danger color is not the only signal.",
    "Text is 16px on coarse pointers so iOS does not zoom. Send, Stop and Attach are 44px on coarse pointers and on compact screens, and each chip's remove button has a 44px target on touch.",
    "On a touch screen the soft keyboard has no Shift, so Return adds a line and Send sends; pass enterSends to choose either way. A compact screen adds the bottom safe-area inset under the composer, and the caller keeps it above the keyboard (useVisibleScreen in @/motion).",
    "The 2px focus ring wraps the whole box while the field has focus, and the buttons draw their own. Under forced colors the edge is a real border and focus is an outline.",
    "The composer does not announce the answer. Say \"answering\" and \"answered\" in the chat's own live region, and never the words as they stream.",
  ],
};

const MODELS = [
  { value: "fast", label: "Litt Fast" },
  { value: "litt", label: "Litt" },
  { value: "deep", label: "Litt Deep" },
];

/** The model picker in the toolbar. A finger gets a 44px trigger. */
function ModelSelect() {
  const { coarse } = useDevice();
  return (
    <div className="w-36">
      <Select aria-label="Model" size={coarse ? "md" : "sm"} options={MODELS} defaultValue="litt" />
    </div>
  );
}

let uploads = 0;

function StudioDemo() {
  const [files, setFiles] = useState<ComposerFile[]>([
    { id: "brief", name: "northwind-brief.pdf", size: 2516582 },
    { id: "moodboard", name: "atlas-moodboard.png", progress: 64 },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [note, setNote] = useState("Type a message, then press Enter or Send.");
  const answer = useRef<number | undefined>(undefined);
  const live = useRef(new Set<string>()); // only files added in this demo keep uploading

  const busy = files.some((f) => live.current.has(f.id) && (f.progress ?? 100) < 100);
  useEffect(() => {
    if (!busy) return;
    const tick = window.setInterval(() => {
      setFiles((all) =>
        all.map((f) => (live.current.has(f.id) && (f.progress ?? 100) < 100 ? { ...f, progress: Math.min(100, (f.progress ?? 0) + 8) } : f)),
      );
    }, 250);
    return () => window.clearInterval(tick);
  }, [busy]);
  useEffect(() => () => window.clearTimeout(answer.current), []);

  return (
    <div className="grid w-full max-w-2xl gap-4">
      <p role="status" className="truncate text-small text-fg-subtle">
        {note}
      </p>
      <Composer
        placeholder="Message Litt"
        hint="Litt can be wrong. Check what matters."
        streaming={streaming}
        onSend={(text) => {
          setStreaming(true);
          setNote(`Litt is answering: “${text}”`);
          answer.current = window.setTimeout(() => {
            setStreaming(false);
            setNote("Litt answered. Send another message.");
          }, 4000);
        }}
        onStop={() => {
          window.clearTimeout(answer.current);
          setStreaming(false);
          setNote("Stopped. Litt keeps what it had written.");
        }}
        files={files}
        onFiles={(picked) => {
          const added = picked.map((file): ComposerFile => {
            const id = `upload-${++uploads}`;
            live.current.add(id);
            return { id, name: file.name, size: file.size, progress: 0 };
          });
          setFiles((all) => [...all, ...added]);
        }}
        onRemoveFile={(file) => setFiles((all) => all.filter((f) => f.id !== file.id))}
        tools={<ModelSelect />}
      />
    </div>
  );
}

const PROMPTS = [
  "Why did the Halo build fail?",
  "Draft the Northwind launch note",
  "Summarize this week's deploys",
  "Check Atlas for broken links",
];

function EmptyChatDemo() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-2xl gap-6">
      {sent ? (
        <p role="status" className="text-small text-fg-subtle">
          Sent: “{sent}”. A chat with a turn no longer shows the suggestions.
        </p>
      ) : (
        <p className="text-body text-fg-muted">Ask Litt about a build, a deploy or a client site.</p>
      )}
      <Composer
        placeholder="Message Litt"
        hint="Litt can be wrong. Check what matters."
        suggestions={sent ? undefined : PROMPTS}
        onSend={setSent}
        tools={<ModelSelect />}
      />
    </div>
  );
}

const RELEASE_NOTE =
  "Marlow Labs shipped the new pricing page today. Plans are monthly or yearly, the yearly plan saves two months, and the comparison table now sits above the fold. The checkout redesign follows next week. Questions go to the studio channel before Friday.";

function StatesDemo() {
  const uid = useId();
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <section aria-labelledby={`${uid}-limit`} className="grid gap-3">
        <h3 id={`${uid}-limit`} className="text-small text-fg">
          Near the limit
        </h3>
        <Composer
          label="Release note"
          placeholder="Write the release note"
          hint="A release note for Marlow Labs is 280 characters at most."
          maxLength={280}
          defaultValue={RELEASE_NOTE}
        />
      </section>
      <section aria-labelledby={`${uid}-approval`} className="grid gap-3">
        <h3 id={`${uid}-approval`} className="text-small text-fg">
          Waiting for an approval
        </h3>
        <Composer
          placeholder="Message Litt"
          hint="Litt is waiting for you to approve a command. Send is off until you answer."
          sendDisabled
          defaultValue="Then bump the Halo site to the new theme."
        />
      </section>
      <section aria-labelledby={`${uid}-disabled`} className="grid gap-3">
        <h3 id={`${uid}-disabled`} className="text-small text-fg">
          Disabled
        </h3>
        <Composer placeholder="Message Litt" hint="This chat is archived. Start a new one to keep writing." disabled />
      </section>
    </div>
  );
}

function PhoneChat() {
  const [files, setFiles] = useState<ComposerFile[]>([
    { id: "log", name: "marlow-labs-brand-guidelines-v3-final.pdf", size: 48231 },
  ]);
  return (
    <div
      role="group"
      aria-label="A chat on a phone"
      className="flex h-136 w-full max-w-sm flex-col overflow-hidden rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line"
    >
      <div className="grid flex-1 content-start gap-4 p-4">
        <p className="litt-raised max-w-[85%] justify-self-end rounded-surface px-4 py-3 text-body text-fg">The Halo build failed again. Can you look?</p>
        <p className="text-small text-fg-subtle">Litt's answer appears here.</p>
      </div>
      <div className="px-4 pb-4">
        <Composer
          placeholder="Message Litt"
          hint="Return adds a line. Send sends."
          files={files}
          onFiles={(picked) => setFiles((all) => [...all, ...picked.map((f) => ({ id: `phone-${++uploads}`, name: f.name, size: f.size }))])}
          onRemoveFile={(file) => setFiles((all) => all.filter((f) => f.id !== file.id))}
          tools={<ModelSelect />}
        />
      </div>
    </div>
  );
}

/** The same composer, forced to the phone path so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <PhoneChat />
    </DeviceProvider>
  );
}

export default function ComposerPage() {
  const [empty, replayEmpty] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Message Litt"
        tier="instant"
        size="lg"
        code="StudioDemo"
        caption="A message to Litt in the studio. The toolbar holds Attach and a model picker, and one file is still uploading at 64%. Send stays off while the field is empty. Send a message and it becomes Stop for a few seconds, or press Esc in the field to stop it. The two swap at once. Drop or paste a file to add a chip: it fades in with a slight scale on the responsive tier and leaves on the exit token. The field grows a line at a time and snaps, never eases."
      >
        <StudioDemo />
      </Stage>

      <Stage
        title="An empty chat"
        tier="instant"
        size="lg"
        code="EmptyChatDemo"
        onReplay={replayEmpty}
        caption="Before the first turn, one sentence says what Litt can do and four prompts sit above the box. A click puts the prompt in the field and focuses it, and never sends, so the person can edit it first. Send stays the one action. Only colors fade, on the instant tier."
      >
        <EmptyChatDemo key={empty} />
      </Stage>

      <Stage
        title="The limit, an approval and disabled"
        tier="instant"
        size="lg"
        code="StatesDemo"
        caption="With maxLength, the count shows once 80% is used and turns to the danger color at the limit; keep typing to reach it. While an approval waits, Send is off in the Button's disabled look so the approval's Allow can hold the view's one accent fill, and the hint says why. A disabled composer is surface-2 with a line edge, and its hint gives the reason."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Phone"
        tier="instant"
        size="lg"
        code="PhoneDemo"
        caption="On a phone Attach, the model picker and Send all grow to 44px, the text is 16px and the chip's remove button has a 44px target. The soft keyboard has no Shift, so Return adds a line and Send sends. The caller keeps the composer above the keyboard with useVisibleScreen. A long file name is cut with an ellipsis."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
