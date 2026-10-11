import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Toaster, useToast } from "@/components/toast";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "toast",
  title: "Toast",
  order: 7,
  summary:
    "Toasts arrive from just below the corner and settle, and they leave sideways by the same small distance. Older ones stack behind the newest and open into a list when you hover or tab into them.",
  tiers: ["instant", "responsive", "expressive"],
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
  const { toast } = useToast();
  return (
    <Launcher>
      <Button onClick={() => toast({ title: "Saved", description: "Home hero is up to date.", tone: "success" })}>
        Save changes
      </Button>
    </Launcher>
  );
}

function DeployDemo() {
  const { toast } = useToast();
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
  const { toast, dismissAll } = useToast();
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
  const { toast } = useToast();
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
    <Page meta={meta}>
      <Toaster>
        <Stage
          title="Saved"
          tier="expressive"
          caption="The toast rises from the dial's travel distance below its place while it fades in and settles from 0.98, on the expressive tier. It dismisses itself after about four seconds."
        >
          <SavedDemo />
        </Stage>

        <Stage
          title="With an action"
          tier="expressive"
          caption="The action is a small ghost button next to the round close button. Using it dismisses the toast. Hover pauses the clock, and so does keyboard focus or a hidden tab."
        >
          <DeployDemo />
        </Stage>

        <Stage
          title="Burst"
          tier="expressive"
          caption="Three toasts in a row. The newest sits in front, the others fall back 8px and 16px, smaller and fainter. Hover or tab in and they open into a list with gaps. That is transform only, on the responsive tier. More than three wait out of sight."
        >
          <BurstDemo />
        </Stage>

        <Stage
          title="Error"
          tier="expressive"
          caption="Errors stay until you dismiss them, and they are announced assertively. Escape dismisses the toast that has focus. The exit slides right by the travel distance and fades, with no bounce."
        >
          <ErrorDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}
