import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Toaster, useToast } from "@/components/toast";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "toast",
  title: "Toast",
  order: 13, group: "Overlays",
  summary:
    "Toasts arrive from just below the corner and settle, and they leave sideways by the same small distance. Older ones stack behind the newest and open into a list when you hover or tab into them.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["toast"],
  exports: ["Toaster", "toast", "useToast"],
  usage: `import { Toaster, toast, useToast } from "@/components/toast";

// Mount one Toaster around the part of the app that fires toasts.
<Toaster>
  <App />
</Toaster>

// Then fire from anywhere. A bare toast() works outside React too.
toast({ title: "Saved", description: "Home hero is up to date.", tone: "success" });

toast({
  title: "Deploy finished",
  description: "litt.design v3 is live.",
  tone: "success",
  action: { label: "View", onClick: openPreview },
});

// Errors stay until dismissed.
toast({ title: "Build failed: 3 type errors in hero.tsx", tone: "error" });

// Inside the Toaster, useToast adds dismiss and dismissAll.
const { dismiss } = useToast();
const id = toast({ title: "Exporting 12 pages", duration: Infinity });
dismiss(id);`,
  use: [
    "Something just happened and needs no answer: saved, copied, exported, deployed.",
    "A result that arrives later, such as a finished deploy. Add an action like View or Undo when the next step is obvious.",
    "A problem that does not block the work, like a failed build. Errors stay until dismissed and are announced at once.",
    "Several results in a row. They stack with the newest in front, and open into a list on hover or focus.",
    "A message from outside a component, such as an API client. Call toast() without the hook.",
  ],
  skip: [
    "The person must choose before going on. Use Dialog.",
    "The message is about one field. Show it under the field, as TextField does with error, because a toast leaves and the field stays wrong.",
    "The message must stay on the page, like an empty state or a running status. Put it in the page, because a toast leaves after about four seconds.",
    "A hint for a button or an icon. Use Tooltip.",
    "A long message. The toast is a fixed 72px and cuts the description to one line, so say it in the page and link to it.",
  ],
  keyboard: [
    [["F8"], "Moves focus to the newest toast, so the keyboard can reach its buttons."],
    [["Tab", "Shift+Tab"], "Moves between the buttons in the toasts. Focus from the keyboard opens the stack into a list and pauses the timers."],
    [["Esc"], "Dismisses the toast that has focus. Focus moves to the next toast, or back to where it was."],
    [["Enter", "Space"], "Presses the focused action or dismiss button."],
  ],
  a11y: [
    "Each toast is its own live region. Neutral and success toasts are role=\"status\" and polite. Errors are role=\"alert\" and assertive, so they interrupt. All of them sit in one region labelled Notifications.",
    "A toast does not take focus when it appears, so a keyboard user reaches it with F8. Never make a toast action the only way to do something, because the toast goes away.",
    "The timer pauses while the pointer is over the stack, while focus is inside it, and while the tab is hidden. Errors never time out. So there is always time to read it.",
    "Toasts beyond the third are inert, so Tab skips them and screen readers do not read them. They return as space frees up.",
    "The close button is labelled Dismiss notification. Your action's label is its name, so make it a verb: View, Undo.",
    "A Dialog hides and disables everything outside it, toasts included. A toast fired while a dialog is open cannot be clicked or heard until the dialog closes, so fire it from the close step.",
    "On touch there is no hover, so tapping the stack pins it open, and tapping elsewhere closes it again.",
    "On phones the stack spans the width at the bottom, clear of the safe area. From the small breakpoint up it sits at the bottom right.",
    "Under reduced motion toasts appear and leave at once, with no travel.",
  ],
};

function Launcher({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
      {note != null && (
        <p role="status" className="min-h-5 text-center text-small text-fg-subtle">
          {note}
        </p>
      )}
    </div>
  );
}

function SavedDemo() {
  const { toast } = useToast(); // needs a <Toaster> above it
  return (
    <Launcher>
      <Button onClick={() => toast({ title: "Saved", description: "Home hero is up to date.", tone: "success" })}>
        Save changes
      </Button>
    </Launcher>
  );
}

function DeployDemo() {
  const { toast } = useToast(); // needs a <Toaster> above it
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Launcher note={opened}>
      <Button
        onClick={() => {
          setOpened(null);
          toast({
            title: "Deploy finished",
            description: "litt.design v3 is live.",
            tone: "success",
            action: { label: "View", onClick: () => setOpened("Opened the v3 preview.") },
          });
        }}
      >
        Deploy litt.design
      </Button>
    </Launcher>
  );
}

const BURST = [
  { title: "Images optimised", description: "12 images, 1.4 MB saved.", tone: "success" as const },
  { title: "Pages exported", description: "Home, Work and Journal.", tone: "success" as const },
  { title: "Build queued", description: "You are second in line." },
];

function BurstDemo() {
  const { toast, dismissAll } = useToast(); // needs a <Toaster> above it
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const fire = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = BURST.map((b, i) => window.setTimeout(() => toast(b), i * 180));
  };

  return (
    <Launcher note="Hover the stack, or press F8 and Tab through it.">
      <Button onClick={fire}>Fire three</Button>
      <Button variant="ghost" onClick={dismissAll}>
        Clear all
      </Button>
    </Launcher>
  );
}

function ErrorDemo() {
  const { toast } = useToast(); // needs a <Toaster> above it
  return (
    <Launcher>
      <Button
        onClick={() =>
          toast({
            title: "Build failed: 3 type errors in hero.tsx",
            description: "Fix them, then publish again.",
            tone: "error",
          })
        }
      >
        Break the build
      </Button>
    </Launcher>
  );
}

export default function ToastPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Toaster>
        <Stage
          title="Saved"
          tier="expressive"
          code="SavedDemo"
          caption="The toast rises from the travel token's distance below its place while it fades in and settles from 0.98, on the expressive tier. It dismisses itself after about four seconds."
        >
          <SavedDemo />
        </Stage>

        <Stage
          title="With an action"
          tier="expressive"
          code="DeployDemo"
          caption="The action is a small ghost button next to the round close button. Using it dismisses the toast. Hover pauses the clock, and so does keyboard focus or a hidden tab."
        >
          <DeployDemo />
        </Stage>

        <Stage
          title="Burst"
          tier="expressive"
          code="BurstDemo"
          caption="Three toasts in a row. The newest sits in front, the others fall back 8px and 16px, smaller and fainter. Hover or tab in and they open into a list with gaps. That is transform only, on the responsive tier. More than three wait out of sight."
        >
          <BurstDemo />
        </Stage>

        <Stage
          title="Error"
          tier="expressive"
          code="ErrorDemo"
          caption="Errors stay until you dismiss them, and they are announced assertively. Escape dismisses the toast that has focus. The exit slides right by the travel distance and fades, with no bounce."
        >
          <ErrorDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}
