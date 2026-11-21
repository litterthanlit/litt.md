import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Toaster, useToast } from "@/components/toast";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "toast",
  title: "Toast",
  lede: "News from the corner that leaves sideways.",
  ledeByWorld: { heat: "News on a square slab in the corner, which leaves sideways." },
  order: 5.09, group: "Overlays",
  verbs: ["press", "watch"],
  summary:
    "Toasts arrive from just below the corner and settle, and they leave sideways by the same small distance. Older ones stack behind the newest and open into a list when you hover or tab into them. On a phone they drop away on a timeout, and a swipe sends them off sideways.",
  summaryByWorld: {
    heat: "Each toast is a square slab in a 1px line. Toasts arrive from just below the corner and settle, and they leave sideways by the same small distance. Older ones stack behind the newest and open into a list when you hover or tab into them. On a phone they drop away on a timeout, and a swipe sends them off sideways.",
  },
  fun: "Fire a toast, then throw it away with the mouse; let one go short and it springs home.",
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
    "Several results in a row. They stack with the newest in front, and open into a list on hover or focus. On touch, tap the stack to open it.",
    "A message from outside a component, such as an API client. Call toast() without the hook.",
  ],
  skip: [
    "The person must choose before going on. Use Dialog.",
    "The message is about one field. Show it under the field, as TextField does with error, because a toast leaves and the field stays wrong.",
    "The message must stay on the page, like an empty state or a running status. Put it in the page, because a toast leaves after about five seconds.",
    "A hint for a button or an icon. Use Tooltip.",
    "A long message. The toast grows to fit a title of two lines and a description of four, so a narrow screen or larger text keeps what to do, but past that it cuts. Say more in the page and link to it.",
  ],
  keyboard: [
    [["F8"], "Moves focus to the newest toast, so the keyboard can reach its buttons."],
    [["Tab", "Shift+Tab"], "Moves between the buttons in the toasts. Focus from the keyboard opens the stack into a list and pauses the timers."],
    [["Esc"], "Dismisses the toast that has focus. Focus moves to the next toast, or back to where it was."],
    [["Enter", "Space"], "Presses the focused action or dismiss button."],
  ],
  a11y: [
    "The Toaster keeps two hidden live regions inside the region labelled Notifications (F8), empty until a toast appears, and then writes its title and description into one: role=\"status\" and polite for neutral and success, role=\"alert\" and assertive for errors, so they interrupt. A region that arrives with its words already in it is often missed by VoiceOver and by NVDA with Firefox. The same toast twice is read twice.",
    "A toast does not take focus when it appears, so a keyboard user reaches it with F8. Never make a toast action the only way to do something, because the toast goes away.",
    "The timer pauses while the pointer is over the stack, while focus is inside it, and while the tab is hidden. Errors never time out. So there is always time to read it.",
    "Toasts beyond the third are inert, so Tab skips them and screen readers do not read them. They return as space frees up.",
    "The close button is labelled Dismiss notification. Your action's label is its name, so make it a verb: View, Undo.",
    "A Dialog hides and disables everything outside it, toasts included. A toast fired while a dialog is open cannot be clicked or heard until the dialog closes, so fire it from the close step.",
    "On touch there is no hover, so tapping the stack pins it open, and tapping elsewhere closes it again.",
    "On touch the front toast can be swiped sideways. It follows the finger, leaves if it went far enough or fast enough, and goes back if not. A swipe is never the only way: the Dismiss button does the same, and it grows to a full touch target on touch. A finger resting on a toast holds its timer.",
    "On phones the stack spans the page gutters, a step above the bottom edge or the safe area, and a toast that times out drops down instead of going sideways. From the small breakpoint up it sits at the bottom right.",
    "Under reduced motion toasts appear and leave at once, with no travel. A swipe still follows the finger, and letting go is instant.",
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

function BurstDemo({
  note = "Hover or tap the stack, or press F8 and Tab through it.",
}: {
  /** The hint under the buttons. */
  note?: ReactNode;
}) {
  const { toast, dismissAll } = useToast(); // needs a <Toaster> above it
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const fire = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = BURST.map((b, i) => window.setTimeout(() => toast(b), i * 180));
  };

  return (
    <Launcher note={note}>
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

function LongDemo() {
  const { toast } = useToast(); // needs a <Toaster> above it
  return (
    <Launcher>
      <Button
        onClick={() =>
          toast({
            title: "Couldn't publish litt.design",
            description: "The domain is still verifying DNS. Try again in about 10 minutes, or check the records in Settings.",
            tone: "error",
          })
        }
      >
        Publish litt.design
      </Button>
    </Launcher>
  );
}

/** The same burst, forced to the phone path so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <Toaster>
        <BurstDemo note="Drag a toast sideways to send it away, or tap the stack to pin it open." />
      </Toaster>
    </DeviceProvider>
  );
}

/* ---------- Device's own (plans/024, phase 3): what a recorder's app says when a take is saved or a card fills ---------- */

function SceneSavedDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button onClick={() => toast({ title: "Scene saved", description: "Scene A is on card A.", tone: "success" })}>
        Save scene
      </Button>
    </Launcher>
  );
}

function ExportedDemo() {
  const { toast } = useToast();
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Launcher note={opened}>
      <Button
        onClick={() => {
          setOpened(null);
          toast({
            title: "Export finished",
            description: "take_04.wav is on card B.",
            tone: "success",
            action: { label: "Show", onClick: () => setOpened("Opened card B at take_04.wav.") },
          });
        }}
      >
        Export take_04
      </Button>
    </Launcher>
  );
}

const TAKE_BURST = [
  { title: "Take saved", description: "take_04.wav, 13 MB.", tone: "success" as const },
  { title: "Safety track saved", description: "take_04_safety.wav, 12 dB lower.", tone: "success" as const },
  { title: "Backup queued", description: "Second in line for the phone." },
];

function TakeBurstDemo({ note = "Hover or tap the stack, or press F8 and Tab through it." }: { note?: ReactNode }) {
  const { toast, dismissAll } = useToast();
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const fire = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = TAKE_BURST.map((b, i) => window.setTimeout(() => toast(b), i * 180));
  };

  return (
    <Launcher note={note}>
      <Button onClick={fire}>Stop the take</Button>
      <Button variant="ghost" onClick={dismissAll}>
        Clear all
      </Button>
    </Launcher>
  );
}

function CardFullDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button
        onClick={() =>
          toast({
            title: "Card A is full: take_05 stopped at 00M 31S",
            description: "Swap the card, or delete a take, then record again.",
            tone: "error",
          })
        }
      >
        Record to a full card
      </Button>
    </Launcher>
  );
}

function OutOfRangeDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button
        onClick={() =>
          toast({
            title: "Couldn't export take_04 to the phone",
            description: "The phone went out of range of the recorder. Bring it within 10 m, or export over USB-C from Settings.",
            tone: "error",
          })
        }
      >
        Export to the phone
      </Button>
    </Launcher>
  );
}

function PhoneTakeBurstDemo() {
  return (
    <DeviceProvider mode="phone">
      <Toaster>
        <TakeBurstDemo note="Drag a toast sideways to send it away, or tap the stack to pin it open." />
      </Toaster>
    </DeviceProvider>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a draft, a letter, a post ---------- */

function DraftSavedDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button onClick={() => toast({ title: "Draft saved", description: "Issue 14 goes out Friday at 9:00.", tone: "success" })}>
        Save draft
      </Button>
    </Launcher>
  );
}

function PublishedDemo() {
  const { toast } = useToast();
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Launcher note={opened}>
      <Button
        onClick={() => {
          setOpened(null);
          toast({
            title: "Post published",
            description: "Open water is on your site.",
            tone: "success",
            action: { label: "View", onClick: () => setOpened("Opened Open water on the site.") },
          });
        }}
      >
        Publish post
      </Button>
    </Launcher>
  );
}

const SENT_BURST = [
  { title: "Issue 14 sent", description: "To 412 subscribers.", tone: "success" as const },
  { title: "Posted to the site", description: "The issue is under Letter.", tone: "success" as const },
  { title: "First reply in", description: "Mara Lindqvist wrote back." },
];

function SentBurstDemo() {
  const { toast, dismissAll } = useToast();
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const fire = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = SENT_BURST.map((b, i) => window.setTimeout(() => toast(b), i * 180));
  };

  return (
    <Launcher note="Hover or tap the stack, or press F8 and Tab through it.">
      <Button onClick={fire}>Send issue 14</Button>
      <Button variant="ghost" onClick={dismissAll}>
        Clear all
      </Button>
    </Launcher>
  );
}

function PictureTooLargeDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button
        onClick={() =>
          toast({
            title: "That picture is too large: 42 MB",
            description: "Pictures can be up to 20 MB. Export a smaller one and add it again.",
            tone: "error",
          })
        }
      >
        Add a picture
      </Button>
    </Launcher>
  );
}

/* ---------- Heat's own (proposals/heat.md): tune saves, lap records, pursuit dispatches ---------- */

function TuneSavedDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button onClick={() => toast({ title: "Tune saved", description: "Street setup written to Skyline GT-R.", tone: "success" })}>
        Save tune
      </Button>
    </Launcher>
  );
}

function LapRecordToastDemo() {
  const { toast } = useToast();
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Launcher note={opened}>
      <Button
        onClick={() => {
          setOpened(null);
          toast({
            title: "New lap record",
            description: "Camden Beach · 1:11.402 (−0.248 s).",
            tone: "success",
            action: { label: "Splits", onClick: () => setOpened("Opened sector splits for lap 3.") },
          });
        }}
      >
        Log fast lap
      </Button>
    </Launcher>
  );
}

const PURSUIT_BURST = [
  { title: "Roadblock cleared", description: "+12,500 bounty added.", tone: "success" as const },
  { title: "Speed trap clocked", description: "318 km/h past Rosewood Bridge.", tone: "success" as const },
  { title: "Condition ×4 active", description: "Federal units joining pursuit." },
];

function PursuitBurstDemo({ note = "Hover or tap the stack, or press F8 and Tab through it." }: { note?: ReactNode }) {
  const { toast, dismissAll } = useToast();
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const fire = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = PURSUIT_BURST.map((b, i) => window.setTimeout(() => toast(b), i * 180));
  };

  return (
    <Launcher note={note}>
      <Button onClick={fire}>Fire dispatch</Button>
      <Button variant="ghost" onClick={dismissAll}>
        Clear all
      </Button>
    </Launcher>
  );
}

function EngineFaultDemo() {
  const { toast } = useToast();
  return (
    <Launcher>
      <Button
        onClick={() =>
          toast({
            title: "Missed shift at 8,500 RPM",
            description: "Ease off the throttle before shifting into 5th.",
            tone: "error",
          })
        }
      >
        Overrev engine
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
          caption="The toast rises from the travel token's distance below its place while it fades in and settles from 0.98, on the expressive tier. It dismisses itself after about five seconds."
          byWorld={{
            flat: { demo: <DraftSavedDemo />, title: "Draft saved", code: "DraftSavedDemo" },
            device: {
              demo: <SceneSavedDemo />,
              title: "Scene saved",
              code: "SceneSavedDemo",
              caption:
                "A recorder's app says a scene is saved. The toast rises from the travel token's distance below its place while it fades in and settles from 0.98, on the expressive tier. It dismisses itself after about five seconds.",
            },
            heat: {
              demo: <TuneSavedDemo />,
              title: "Tune saved",
              code: "TuneSavedDemo",
              caption:
                "A garage confirmation cutting in from the corner: square black slab, clear words, and a quick sideways exit.",
            },
          }}
        >
          <SavedDemo />
        </Stage>

        <Stage
          title="With an action"
          tier="expressive"
          code="DeployDemo"
          caption="The action is a small ghost button next to the round close button. Using it dismisses the toast. Hover pauses the clock, and so does keyboard focus or a hidden tab."
          byWorld={{
            flat: { demo: <PublishedDemo />, code: "PublishedDemo" },
            device: { demo: <ExportedDemo />, code: "ExportedDemo" },
            heat: { demo: <LapRecordToastDemo />, code: "LapRecordToastDemo" },
          }}
        >
          <DeployDemo />
        </Stage>

        <Stage
          title="Burst"
          tier="expressive"
          code="BurstDemo"
          caption="Three toasts in a row. The newest sits in front, the others fall back 8px and 16px, smaller and fainter. Hover or tab in and they open into a list with gaps. That is transform only, on the responsive tier. More than three wait out of sight."
          byWorld={{
            flat: {
              demo: <SentBurstDemo />,
              code: "SentBurstDemo",
              caption:
                "Sending an issue says three things at once: it went out, it is on the site, and the first reader wrote back. The newest sits in front, the others fall back 8px and 16px, smaller and fainter. Hover or tab in and they open into a list with gaps. That is transform only, on the responsive tier. More than three wait out of sight.",
            },
            device: {
              demo: <TakeBurstDemo />,
              code: "TakeBurstDemo",
              caption:
                "Stopping a take says three things at once: the take, its safety track and the backup. The newest sits in front, the others fall back 8px and 16px, smaller and fainter. Hover or tab in and they open into a list with gaps. That is transform only, on the responsive tier. More than three wait out of sight.",
            },
            heat: {
              demo: <PursuitBurstDemo />,
              code: "PursuitBurstDemo",
              caption:
                "Three pursuit dispatches stacked in order: roadblock bounty, speed trap, and condition escalation.",
            },
          }}
        >
          <BurstDemo />
        </Stage>

        <Stage
          title="Error"
          tier="expressive"
          code="ErrorDemo"
          caption="Errors stay until you dismiss them, and they are announced assertively. Escape dismisses the toast that has focus. The exit slides right by the travel distance and fades, with no bounce. On a phone it drops down instead."
          byWorld={{
            flat: { demo: <PictureTooLargeDemo />, code: "PictureTooLargeDemo" },
            device: { demo: <CardFullDemo />, code: "CardFullDemo" },
            heat: { demo: <EngineFaultDemo />, code: "EngineFaultDemo" },
          }}
        >
          <ErrorDemo />
        </Stage>

        <Stage
          title="A longer message"
          tier="expressive"
          code="LongDemo"
          caption="The toast grows to fit its words: the title wraps to two lines and the description to four, so on a narrow screen or with larger text the part that says what to do stays. Toasts behind it peek at its height; open the stack and each takes its own. A height snaps, it never animates."
          byWorld={{ device: { demo: <OutOfRangeDemo />, code: "OutOfRangeDemo" } }}
        >
          <LongDemo />
        </Stage>
      </Toaster>

      <Stage
        title="On a phone"
        tier="expressive"
        code="PhoneDemo"
        caption="On a phone the toasts span the page and sit above the bottom edge. While a bottom sheet is open they dock at the top edge instead, so they never cover its buttons. A toast that times out drops by the travel token instead of sliding sideways. A swipe moves it with your finger, and it leaves the way you pulled if you went far enough or fast enough. A short swipe springs back. This preview forces the phone layout, so a mouse drag works too."
        byWorld={{ device: { demo: <PhoneTakeBurstDemo />, code: "PhoneTakeBurstDemo" } }}
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
