import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { surfaceRadius, useMaterial, useMotionDial, useTransition, useTravel } from "@/motion";
import type { Material } from "@/motion/deal";
import { springRules, LIMITS } from "@/motion/rules";
import { toCss, type Spring } from "@/motion/spring";
import { Button } from "@/components/button";
import { CurveEditor, toCubicBezier, type CubicBezier } from "@/components/curve-editor";
import { CheckCircleIcon, RetryIcon } from "@/components/icons";
import { Inspector, InspectorGroup, type InspectorCheck, type InspectorVersion } from "@/components/inspector";
import { Segmented } from "@/components/segmented";
import { Slider } from "@/components/slider";
import { SpringEditor } from "@/components/spring-editor";
import { Switch } from "@/components/switch";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "inspector",
  title: "Inspector",
  lede: "A floating panel for tuning one thing live.",
  order: 4.06,
  group: "Tools",
  verbs: ["drag", "press"],
  summary:
    "A floating glass panel for tuning one thing live, built from litt's own controls: groups that fold, versions you save and go back to, a check against your rules with a Fits or Change row each, and Copy tokens. Put a Slider, a Switch, a Pad, a Spring editor or a Curve editor in each group. The chevrons turn on the responsive tier and a group's body snaps open and fades in; nothing animates a height.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["inspector"],
  exports: ["Inspector", "InspectorGroup"],
  usage: `import { useState } from "react";
import { Inspector, InspectorGroup } from "@/components/inspector";
import { Slider } from "@/components/slider";

const DEFAULT = { radius: 8, padding: 16 };
const [card, setCard] = useState(DEFAULT);

<Inspector
  title="Card"
  value={card}
  onValueChange={setCard}
  defaultValue={DEFAULT}
  storageKey="studio:card-inspector"
  checks={(v) => [{ ok: v.radius === 8, text: \`Corners on the surface radius, 8px: \${v.radius}px\` }]}
  tokens={(v) => \`:root {\\n  --card-radius: \${v.radius}px;\\n  --card-padding: \${v.padding}px;\\n}\`}
>
  <InspectorGroup title="Shape" summary={\`\${card.radius}px\`}>
    <Slider label="Corner radius" value={card.radius} onValueChange={(radius) => setCard({ ...card, radius })} min={0} max={24} step={2} />
  </InspectorGroup>
</Inspector>`,
  use: [
    "Someone tunes one thing until it feels right: a toast's corners, padding and entrance, a card on a Framer site, a prototype's spring. Hold every value in one object, so versions can save it and put it back.",
    "The result has to leave the browser. Pass tokens and Copy tokens hands over CSS custom properties, or whatever text your build reads.",
    "The values must keep to rules. Pass checks and each rule is a row that says Fits or Change, so a person sees what to fix before they copy.",
    "People compare a few takes. Save keeps the current value as a version, and picking it puts it back. Pass storageKey to keep them across visits.",
  ],
  skip: [
    "A settings page people visit to set preferences. Use a Form with Switches and Selects in the page itself.",
    "The motion of litt's own interface. Its springs and radii are tokens in tokens.css; tune them on the Playground and lock them there.",
    "One control. Put the Slider or the Spring editor beside what it changes.",
    "A panel the person must not lose. The inspector folds to its header and floats over the page; a form that has to be finished belongs in a dialog.",
  ],
  keyboard: [
    [["Tab"], "Moves through the header's buttons, the version list and Save, each group's row and the controls inside it."],
    [["Enter", "Space"], "On a group's row, folds or opens it. On the header's chevron, folds or opens the whole panel."],
  ],
  a11y: [
    "The panel is a region named by its title. Each group's row is a button with aria-expanded and aria-controls, and its body is a group named by the row.",
    "The fold button says what it does with the title in it, \"Fold Toast\" or \"Open Toast\", and carries aria-expanded.",
    "The version list is a Select named Version. Save is disabled while the value is already a version, and a polite status says \"Saved as Version 3\" and \"Copied the tokens.\"",
    "Each rule row says Fits or Change in words, never by color alone, and the Rules row sums them up: \"All fit\" or \"2 to change\".",
    "The tokens are a focusable, labelled block in mono, so they can be read and selected by keyboard. Where the clipboard is refused, Copy tokens selects them instead and says so.",
    "Every control inside keeps its own keyboard and screen reader behavior. Give each one a label.",
  ],
};

/* ---------- a toast, tuned ---------- */

type ToastLook = { radius: number; padding: number; float: boolean; enter: Spring; exit: CubicBezier };

/** litt's own toast: the surface radius, 16px in, the float shadow, the expressive spring and the instant ease-out. */
function useLittToast(): ToastLook {
  const { locked } = useMotionDial();
  return { radius: surfaceRadius(locked.radius), padding: 16, float: true, enter: locked.dial.expressive, exit: locked.easeOut };
}

/* A take someone might try: it is the content being tuned, not litt's motion. */
const LIVELY: ToastLook = { radius: 14, padding: 20, float: true, enter: { time: 0.38, bounce: 0.24 }, exit: [0.3, 1.3, 0.6, 1] }; // litt-allow: a spring being edited is content

const px = (n: number) => `${n}px`;
const num = (n: number) => String(+n.toFixed(2));

function toastChecks(look: ToastLook, surface: number, material: Material): InspectorCheck[] {
  const [x1, y1, x2, y2] = look.exit;
  return [
    { ok: look.radius === surface, text: `Corners on the surface radius, ${surface}px: ${look.radius}px` },
    { ok: look.padding % 4 === 0, text: `Padding on the 4px grid: ${look.padding}px` },
    { ok: look.float, text: `A toast floats, with the float shadow: ${look.float ? "on" : "off"}` },
    ...springRules(look.enter, "expressive", material),
    { ok: y1 >= x1 && y2 >= x2 && [y1, y2].every((y) => y >= 0 && y <= 1), text: `The exit eases out and never passes its end: ${toCubicBezier(look.exit)}` },
  ];
}

function toastTokens(look: ToastLook): string {
  const enter = toCss(look.enter);
  return [
    `/* Toast, from the litt inspector. In Motion the entrance is a spring: visualDuration ${num(look.enter.time)}, bounce ${num(look.enter.bounce)}. */`,
    `:root {`,
    `  --toast-radius: ${px(look.radius)};`,
    `  --toast-padding: ${px(look.padding)};`,
    `  --toast-shadow: ${look.float ? "var(--shadow-float)" : "none"};`,
    `  --toast-enter: ${enter.easing};`,
    `  --toast-enter-duration: ${enter.duration}ms;`,
    `  --toast-exit: ${toCubicBezier(look.exit)};`,
    `  --toast-exit-duration: ${Math.round(look.enter.time * 1000 * LIMITS.exit)}ms;`,
    `}`,
  ].join("\n");
}

/** The toast, leaving on its exit and entering on its spring each time `run` changes. */
function TunedToast({ look, run }: { look: ToastLook; run: number }) {
  const travel = useTravel();
  const { reduced } = useMotionDial();
  const still = useTransition("instant");
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (run) setShown(false);
  }, [run]);
  const ownEnter: Transition = { type: "spring", visualDuration: look.enter.time, bounce: look.enter.bounce }; // litt-allow: the toast runs on the motion being tuned
  const ownExit: Transition = { type: "tween", duration: look.enter.time * LIMITS.exit, ease: look.exit }; // litt-allow: the toast runs on the motion being tuned
  const enter = reduced ? still : ownEnter;
  const exit = reduced ? still : ownExit;
  return (
    <div className="grid min-h-28 w-full place-items-center">
      <AnimatePresence onExitComplete={() => setShown(true)}>
        {shown && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: travel }}
            animate={{ opacity: 1, y: 0, transition: enter }}
            exit={{ opacity: 0, y: travel / 2, transition: exit }}
            className={"flex w-full max-w-xs items-center gap-3 bg-surface-1 " + (look.float ? "shadow-float" : "shadow-[inset_0_0_0_1px_var(--line)]")}
            style={{ borderRadius: look.radius, padding: look.padding }}
          >
            <CheckCircleIcon className="shrink-0 text-success" />
            <p className="text-small text-fg">Invoice sent to Atelier Nord.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToastInspectorDemo() {
  const { locked } = useMotionDial();
  const material = useMaterial();
  const litt = useLittToast();
  const surface = surfaceRadius(locked.radius);
  const presets: InspectorVersion<ToastLook>[] = [
    { label: "litt's toast", value: litt },
    { label: "Lively", value: LIVELY },
  ];
  const [look, setLook] = useState<ToastLook>(LIVELY);
  const [run, setRun] = useState(0);
  const replay = () => setRun((r) => r + 1);
  const set = (patch: Partial<ToastLook>) => setLook((l) => ({ ...l, ...patch }));

  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <div className="grid gap-4 justify-items-center pt-4">
          <TunedToast look={look} run={run} />
          <Button size="sm" variant="ghost" icon={<RetryIcon />} onClick={replay}>
            Replay
          </Button>
        </div>
        <Inspector
          title="Toast"
          value={look}
          onValueChange={(v) => {
            setLook(v);
            replay();
          }}
          defaultValue={litt}
          presets={presets}
          checks={(v) => toastChecks(v, surface, material)}
          tokens={toastTokens}
          className="justify-self-center"
        >
          <InspectorGroup title="Shape" summary={`${look.radius}px, ${look.padding}px in`}>
            <Slider label="Corner radius" value={look.radius} onValueChange={(radius) => set({ radius })} min={0} max={24} step={2} home={surface} formatValue={px} />
            <Slider label="Padding" value={look.padding} onValueChange={(padding) => set({ padding })} min={8} max={32} step={2} home={16} formatValue={px} />
          </InspectorGroup>
          <InspectorGroup title="Depth" summary={look.float ? "Floats" : "Flat"}>
            <Switch label="Float shadow" description="Lifts the toast off the page." align="end" checked={look.float} onCheckedChange={(float) => set({ float })} />
          </InspectorGroup>
          <InspectorGroup title="Entrance" summary={`${Math.round(look.enter.time * 1000)}ms, ${num(look.enter.bounce)}`}>
            <SpringEditor label="Spring" value={look.enter} onValueChange={(enter) => set({ enter })} onValueCommit={replay} tier="expressive" checks={false} defaultMark={litt.enter} height={128} preview={false} />
          </InspectorGroup>
          <InspectorGroup title="Exit" defaultOpen={false}>
            <CurveEditor label="Easing" value={look.exit} onValueChange={(exit) => set({ exit })} onValueCommit={replay} defaultMark={litt.exit} height={160} preview={false} />
          </InspectorGroup>
        </Inspector>
      </div>
    </div>
  );
}

/* ---------- a card, with versions kept ---------- */

type CardLook = { radius: number; padding: number; float: boolean };
const CARD_DEFAULT: CardLook = { radius: 8, padding: 24, float: false };
const CARD_EDGE = "shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]";

function CardVersionsDemo() {
  const [card, setCard] = useState<CardLook>({ radius: 12, padding: 20, float: true });
  const set = (patch: Partial<CardLook>) => setCard((c) => ({ ...c, ...patch }));
  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <div
          className={"mx-auto grid w-full max-w-xs gap-1 bg-surface-1 " + (card.float ? "shadow-float" : CARD_EDGE)}
          style={{ borderRadius: card.radius, padding: card.padding }}
        >
          <p className="text-body font-title text-fg">Atelier Nord</p>
          <p className="text-small text-fg-subtle">Homepage redesign, due Thursday</p>
        </div>
        <Inspector
          title="Project card"
          value={card}
          onValueChange={setCard}
          defaultValue={CARD_DEFAULT}
          storageKey="litt-gallery:inspector-card"
          checks={(v) => [
            { ok: v.radius === 8, text: `Corners on the surface radius, 8px: ${v.radius}px` },
            { ok: v.padding % 4 === 0, text: `Padding on the 4px grid: ${v.padding}px` },
            { ok: !v.float, text: `A card sits on the page with a hairline, and only overlays float: ${v.float ? "floating" : "on the page"}` },
          ]}
          tokens={(v) =>
            [
              `:root {`,
              `  --card-radius: ${px(v.radius)};`,
              `  --card-padding: ${px(v.padding)};`,
              `  --card-shadow: ${v.float ? "var(--shadow-float)" : "inset 0 0 0 1px var(--line), var(--highlight)"};`,
              `}`,
            ].join("\n")
          }
          className="justify-self-center"
        >
          <InspectorGroup title="Shape" summary={`${card.radius}px, ${card.padding}px in`} defaultOpen={false}>
            <Slider label="Corner radius" value={card.radius} onValueChange={(radius) => set({ radius })} min={0} max={24} step={2} home={8} formatValue={px} />
            <Slider label="Padding" value={card.padding} onValueChange={(padding) => set({ padding })} min={8} max={40} step={2} home={24} formatValue={px} />
          </InspectorGroup>
          <InspectorGroup title="Depth" summary={card.float ? "Floats" : "On the page"} defaultOpen={false}>
            <Switch label="Float shadow" description="Lifts the card off the page, as an overlay." align="end" checked={card.float} onCheckedChange={(float) => set({ float })} />
          </InspectorGroup>
        </Inspector>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function InspectorTile() {
  const [card, setCard] = useState<CardLook>({ radius: 12, padding: 20, float: true });
  return (
    <div className="w-full max-w-xs">
      <Inspector title="Project card" value={card} onValueChange={setCard} defaultValue={CARD_DEFAULT}>
        <InspectorGroup title="Shape" summary={`${card.radius}px`}>
          <Slider label="Corner radius" value={card.radius} onValueChange={(radius) => setCard({ ...card, radius })} min={0} max={24} step={2} home={8} formatValue={px} />
        </InspectorGroup>
        <InspectorGroup title="Depth" summary={card.float ? "Floats" : "On the page"} defaultOpen={false}>
          <Switch label="Float shadow" align="end" checked={card.float} onCheckedChange={(float) => setCard({ ...card, float })} />
        </InspectorGroup>
      </Inspector>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a recorder app's export notice, and a take's card ---------- */

/** The export notice, leaving on its exit and entering on its spring each time `run` changes. */
function TunedNotice({ look, run }: { look: ToastLook; run: number }) {
  const travel = useTravel();
  const { reduced } = useMotionDial();
  const still = useTransition("instant");
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (run) setShown(false);
  }, [run]);
  const ownEnter: Transition = { type: "spring", visualDuration: look.enter.time, bounce: look.enter.bounce }; // litt-allow: the notice runs on the motion being tuned
  const ownExit: Transition = { type: "tween", duration: look.enter.time * LIMITS.exit, ease: look.exit }; // litt-allow: the notice runs on the motion being tuned
  const enter = reduced ? still : ownEnter;
  const exit = reduced ? still : ownExit;
  return (
    <div className="grid min-h-28 w-full place-items-center">
      <AnimatePresence onExitComplete={() => setShown(true)}>
        {shown && (
          <motion.div
            key="notice"
            initial={{ opacity: 0, y: travel }}
            animate={{ opacity: 1, y: 0, transition: enter }}
            exit={{ opacity: 0, y: travel / 2, transition: exit }}
            className={"flex w-full max-w-xs items-center gap-3 bg-surface-1 " + (look.float ? "shadow-float" : "shadow-[inset_0_0_0_1px_var(--line)]")}
            style={{ borderRadius: look.radius, padding: look.padding }}
          >
            <CheckCircleIcon className="shrink-0 text-fg" />
            <p className="text-small text-fg">take_04.wav exported to card A.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoticeInspectorDemo() {
  const { locked } = useMotionDial();
  const material = useMaterial();
  const litt = useLittToast();
  const surface = surfaceRadius(locked.radius);
  const presets: InspectorVersion<ToastLook>[] = [
    { label: "litt's notice", value: litt },
    { label: "Lively", value: LIVELY },
  ];
  const [look, setLook] = useState<ToastLook>(LIVELY);
  const [run, setRun] = useState(0);
  const replay = () => setRun((r) => r + 1);
  const set = (patch: Partial<ToastLook>) => setLook((l) => ({ ...l, ...patch }));

  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <div className="grid gap-4 justify-items-center pt-4">
          <TunedNotice look={look} run={run} />
          <Button size="sm" variant="ghost" icon={<RetryIcon />} onClick={replay}>
            Replay
          </Button>
        </div>
        <Inspector
          title="Export notice"
          value={look}
          onValueChange={(v) => {
            setLook(v);
            replay();
          }}
          defaultValue={litt}
          presets={presets}
          checks={(v) => toastChecks(v, surface, material)}
          tokens={toastTokens}
          className="justify-self-center"
        >
          <InspectorGroup title="Shape" summary={`${look.radius}px, ${look.padding}px in`}>
            <Slider label="Corner radius" value={look.radius} onValueChange={(radius) => set({ radius })} min={0} max={24} step={2} home={surface} formatValue={px} />
            <Slider label="Padding" value={look.padding} onValueChange={(padding) => set({ padding })} min={8} max={32} step={2} home={16} formatValue={px} />
          </InspectorGroup>
          <InspectorGroup title="Depth" summary={look.float ? "Floats" : "Flat"}>
            <Switch label="Float shadow" description="Lifts the notice off the screen." align="end" checked={look.float} onCheckedChange={(float) => set({ float })} />
          </InspectorGroup>
          <InspectorGroup title="Entrance" summary={`${Math.round(look.enter.time * 1000)}ms, ${num(look.enter.bounce)}`}>
            <SpringEditor label="Spring" value={look.enter} onValueChange={(enter) => set({ enter })} onValueCommit={replay} tier="expressive" checks={false} defaultMark={litt.enter} height={128} preview={false} />
          </InspectorGroup>
          <InspectorGroup title="Exit" defaultOpen={false}>
            <CurveEditor label="Easing" value={look.exit} onValueChange={(exit) => set({ exit })} onValueCommit={replay} defaultMark={litt.exit} height={160} preview={false} />
          </InspectorGroup>
        </Inspector>
      </div>
    </div>
  );
}

function TakeCardVersionsDemo() {
  const [card, setCard] = useState<CardLook>({ radius: 12, padding: 20, float: true });
  const set = (patch: Partial<CardLook>) => setCard((c) => ({ ...c, ...patch }));
  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <div
          className={"mx-auto grid w-full max-w-xs gap-1 bg-surface-1 " + (card.float ? "shadow-float" : CARD_EDGE)}
          style={{ borderRadius: card.radius, padding: card.padding }}
        >
          <p className="text-body font-title text-fg">take_04.wav</p>
          <p className="text-small text-fg-subtle">Interview by the road · 00M 47S 08F</p>
        </div>
        <Inspector
          title="Take card"
          value={card}
          onValueChange={setCard}
          defaultValue={CARD_DEFAULT}
          storageKey="litt-gallery:inspector-take-card"
          checks={(v) => [
            { ok: v.radius === 8, text: `Corners on the surface radius, 8px: ${v.radius}px` },
            { ok: v.padding % 4 === 0, text: `Padding on the 4px grid: ${v.padding}px` },
            { ok: !v.float, text: `A card sits on the page with a hairline, and only overlays float: ${v.float ? "floating" : "on the page"}` },
          ]}
          tokens={(v) =>
            [
              `:root {`,
              `  --card-radius: ${px(v.radius)};`,
              `  --card-padding: ${px(v.padding)};`,
              `  --card-shadow: ${v.float ? "var(--shadow-float)" : "inset 0 0 0 1px var(--line), var(--highlight)"};`,
              `}`,
            ].join("\n")
          }
          className="justify-self-center"
        >
          <InspectorGroup title="Shape" summary={`${card.radius}px, ${card.padding}px in`} defaultOpen={false}>
            <Slider label="Corner radius" value={card.radius} onValueChange={(radius) => set({ radius })} min={0} max={24} step={2} home={8} formatValue={px} />
            <Slider label="Padding" value={card.padding} onValueChange={(padding) => set({ padding })} min={8} max={40} step={2} home={24} formatValue={px} />
          </InspectorGroup>
          <InspectorGroup title="Depth" summary={card.float ? "Floats" : "On the page"} defaultOpen={false}>
            <Switch label="Float shadow" description="Lifts the card off the page, as an overlay." align="end" checked={card.float} onCheckedChange={(float) => set({ float })} />
          </InspectorGroup>
        </Inspector>
      </div>
    </div>
  );
}

function TakeCardInspectorTile() {
  const [card, setCard] = useState<CardLook>({ radius: 12, padding: 20, float: true });
  return (
    <div className="w-full max-w-xs">
      <Inspector title="Take card" value={card} onValueChange={setCard} defaultValue={CARD_DEFAULT}>
        <InspectorGroup title="Shape" summary={`${card.radius}px`}>
          <Slider label="Corner radius" value={card.radius} onValueChange={(radius) => setCard({ ...card, radius })} min={0} max={24} step={2} home={8} formatValue={px} />
        </InspectorGroup>
        <InspectorGroup title="Depth" summary={card.float ? "Floats" : "On the page"} defaultOpen={false}>
          <Switch label="Float shadow" align="end" checked={card.float} onCheckedChange={(float) => setCard({ ...card, float })} />
        </InspectorGroup>
      </Inspector>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): the note a small site shows when an issue goes out, and a post's card ---------- */

/** The sent note, leaving on its exit and entering on its spring each time `run` changes. */
function TunedSentNote({ look, run }: { look: ToastLook; run: number }) {
  const travel = useTravel();
  const { reduced } = useMotionDial();
  const still = useTransition("instant");
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (run) setShown(false);
  }, [run]);
  const ownEnter: Transition = { type: "spring", visualDuration: look.enter.time, bounce: look.enter.bounce }; // litt-allow: the note runs on the motion being tuned
  const ownExit: Transition = { type: "tween", duration: look.enter.time * LIMITS.exit, ease: look.exit }; // litt-allow: the note runs on the motion being tuned
  const enter = reduced ? still : ownEnter;
  const exit = reduced ? still : ownExit;
  return (
    <div className="grid min-h-28 w-full place-items-center">
      <AnimatePresence onExitComplete={() => setShown(true)}>
        {shown && (
          <motion.div
            key="note"
            initial={{ opacity: 0, y: travel }}
            animate={{ opacity: 1, y: 0, transition: enter }}
            exit={{ opacity: 0, y: travel / 2, transition: exit }}
            className={"flex w-full max-w-xs items-center gap-3 bg-surface-1 " + (look.float ? "shadow-float" : "shadow-[inset_0_0_0_1px_var(--line)]")}
            style={{ borderRadius: look.radius, padding: look.padding }}
          >
            <CheckCircleIcon className="shrink-0 text-success" />
            <p className="text-small text-fg">Issue 14 went out to 412 subscribers.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SentNoteInspectorDemo() {
  const { locked } = useMotionDial();
  const material = useMaterial();
  const litt = useLittToast();
  const surface = surfaceRadius(locked.radius);
  const presets: InspectorVersion<ToastLook>[] = [
    { label: "litt's note", value: litt },
    { label: "Lively", value: LIVELY },
  ];
  const [look, setLook] = useState<ToastLook>(LIVELY);
  const [run, setRun] = useState(0);
  const replay = () => setRun((r) => r + 1);
  const set = (patch: Partial<ToastLook>) => setLook((l) => ({ ...l, ...patch }));

  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <div className="grid gap-4 justify-items-center pt-4">
          <TunedSentNote look={look} run={run} />
          <Button size="sm" variant="ghost" icon={<RetryIcon />} onClick={replay}>
            Replay
          </Button>
        </div>
        <Inspector
          title="Sent note"
          value={look}
          onValueChange={(v) => {
            setLook(v);
            replay();
          }}
          defaultValue={litt}
          presets={presets}
          checks={(v) => toastChecks(v, surface, material)}
          tokens={toastTokens}
          className="justify-self-center"
        >
          <InspectorGroup title="Shape" summary={`${look.radius}px, ${look.padding}px in`}>
            <Slider label="Corner radius" value={look.radius} onValueChange={(radius) => set({ radius })} min={0} max={24} step={2} home={surface} formatValue={px} />
            <Slider label="Padding" value={look.padding} onValueChange={(padding) => set({ padding })} min={8} max={32} step={2} home={16} formatValue={px} />
          </InspectorGroup>
          <InspectorGroup title="Depth" summary={look.float ? "Floats" : "Flat"}>
            <Switch label="Float shadow" description="Lifts the note off the page." align="end" checked={look.float} onCheckedChange={(float) => set({ float })} />
          </InspectorGroup>
          <InspectorGroup title="Entrance" summary={`${Math.round(look.enter.time * 1000)}ms, ${num(look.enter.bounce)}`}>
            <SpringEditor label="Spring" value={look.enter} onValueChange={(enter) => set({ enter })} onValueCommit={replay} tier="expressive" checks={false} defaultMark={litt.enter} height={128} preview={false} />
          </InspectorGroup>
          <InspectorGroup title="Exit" defaultOpen={false}>
            <CurveEditor label="Easing" value={look.exit} onValueChange={(exit) => set({ exit })} onValueCommit={replay} defaultMark={litt.exit} height={160} preview={false} />
          </InspectorGroup>
        </Inspector>
      </div>
    </div>
  );
}

function PostCardInspectorTile() {
  const [card, setCard] = useState<CardLook>({ radius: 12, padding: 20, float: true });
  return (
    <div className="w-full max-w-xs">
      <Inspector title="Post card" value={card} onValueChange={setCard} defaultValue={CARD_DEFAULT}>
        <InspectorGroup title="Shape" summary={`${card.radius}px`}>
          <Slider label="Corner radius" value={card.radius} onValueChange={(radius) => setCard({ ...card, radius })} min={0} max={24} step={2} home={8} formatValue={px} />
        </InspectorGroup>
        <InspectorGroup title="Depth" summary={card.float ? "Floats" : "On the page"} defaultOpen={false}>
          <Switch label="Float shadow" align="end" checked={card.float} onCheckedChange={(float) => setCard({ ...card, float })} />
        </InspectorGroup>
      </Inspector>
    </div>
  );
}

/* ---------- Rack's own (proposals/rack.md): track channel strip inspector ---------- */

type TrackStrip = { gain: number; pan: number; mono: boolean };
const STRIP_DEFAULT: TrackStrip = { gain: -3, pan: 0, mono: false };

function TrackInspectorTile() {
  const [strip, setStrip] = useState<TrackStrip>(STRIP_DEFAULT);
  return (
    <div className="w-full max-w-xs">
      <Inspector title="Drums · Channel" value={strip} onValueChange={setStrip} defaultValue={STRIP_DEFAULT}>
        <InspectorGroup title="Output" summary={`${strip.gain < 0 ? "−" : ""}${Math.abs(strip.gain)} dB`}>
          <Slider label="Gain" value={strip.gain} onValueChange={(gain) => setStrip({ ...strip, gain })} min={-24} max={6} step={1} home={0} formatValue={(v) => `${v < 0 ? "−" : ""}${Math.abs(v)} dB`} />
        </InspectorGroup>
        <InspectorGroup title="Stereo" summary={strip.mono ? "Mono" : "Stereo"} defaultOpen={false}>
          <Switch label="Mono fold" align="end" checked={strip.mono} onCheckedChange={(mono) => setStrip({ ...strip, mono })} />
        </InspectorGroup>
      </Inspector>
    </div>
  );
}

/* The lead under Rack (plans/audits/rack.md, finding 3): a device on a track, its parameters set in one panel. */
type FilterType = "low" | "high" | "band";
type AutoFilter = { freq: number; res: number; type: FilterType; lfo: number; mix: number; on: boolean };
const FILTER_INIT: AutoFilter = { freq: 12000, res: 0, type: "low", lfo: 0, mix: 100, on: true };
const FILTER_SWEEP: AutoFilter = { freq: 3400, res: 45, type: "low", lfo: 30, mix: 100, on: true };
const FILTER_NAMES: Record<FilterType, string> = { low: "Low pass", high: "High pass", band: "Band pass" };

const hz = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz`);
const pct = (v: number) => `${v}%`;

function AutoFilterInspectorDemo() {
  const [f, setF] = useState<AutoFilter>(FILTER_SWEEP);
  const set = (patch: Partial<AutoFilter>) => setF((v) => ({ ...v, ...patch }));
  const values: [string, string][] = [
    ["Type", FILTER_NAMES[f.type]],
    ["Frequency", hz(f.freq)],
    ["Resonance", pct(f.res)],
    ["LFO", pct(f.lfo)],
    ["Dry/Wet", pct(f.mix)],
  ];
  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <div className="mx-auto grid w-full max-w-xs gap-2 rounded-surface border border-line-strong bg-surface-1 p-3 forced-colors:border">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-small font-title text-fg">Auto filter</p>
            <p className="text-caption text-fg-subtle">{f.on ? "Synth track" : "Synth track, off"}</p>
          </div>
          <dl className="grid grid-cols-2 gap-1">
            {values.map(([name, shown]) => (
              <div key={name} className="grid gap-0.5 rounded-control border border-line bg-surface-2 px-2 py-1.5">
                <dt className="text-caption text-fg-subtle">{name}</dt>
                <dd className={"font-mono text-caption tabular-nums " + (f.on ? "text-fg" : "text-fg-subtle")}>{shown}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Inspector
          title="Auto filter · Synth"
          value={f}
          onValueChange={setF}
          defaultValue={FILTER_INIT}
          presets={[
            { label: "Init", value: FILTER_INIT },
            { label: "Sweep into the drop", value: FILTER_SWEEP },
          ]}
          checks={(v) => [
            { ok: v.res <= 90, text: `Resonance at most 90%, so the filter does not ring: ${pct(v.res)}` },
            { ok: v.type !== "high" || v.freq <= 2000, text: `A high pass keeps the body under 2 kHz: ${v.type === "high" ? hz(v.freq) : "low or band pass"}` },
          ]}
          className="justify-self-center"
        >
          <InspectorGroup title="Filter" summary={`${FILTER_NAMES[f.type]}, ${hz(f.freq)}`}>
            <Segmented
              legend="Filter type"
              showLegend
              size="sm"
              block
              value={f.type}
              onValueChange={(type) => set({ type })}
              options={[
                { value: "low", label: "Low pass" },
                { value: "high", label: "High pass" },
                { value: "band", label: "Band pass" },
              ]}
            />
            <Slider label="Frequency" value={f.freq} onValueChange={(freq) => set({ freq })} min={100} max={12000} step={100} home={12000} formatValue={hz} />
            <Slider label="Resonance" value={f.res} onValueChange={(res) => set({ res })} min={0} max={100} step={1} home={0} formatValue={pct} />
          </InspectorGroup>
          <InspectorGroup title="Modulation" summary={`LFO ${pct(f.lfo)}`}>
            <Slider label="LFO amount" value={f.lfo} onValueChange={(lfo) => set({ lfo })} min={0} max={100} step={1} home={0} formatValue={pct} />
          </InspectorGroup>
          <InspectorGroup title="Output" summary={`${pct(f.mix)} wet${f.on ? "" : ", off"}`} defaultOpen={false}>
            <Slider label="Dry/Wet" value={f.mix} onValueChange={(mix) => set({ mix })} min={0} max={100} step={1} home={100} formatValue={pct} />
            <Switch label="Device on" align="end" checked={f.on} onCheckedChange={(on) => set({ on })} />
          </InspectorGroup>
        </Inspector>
      </div>
    </div>
  );
}

export default function InspectorPage() {
  return (
    <Page meta={meta} docs={docs} tile={<InspectorTile />} tileByWorld={{ device: <TakeCardInspectorTile />, flat: <PostCardInspectorTile />, rack: <TrackInspectorTile /> }}>
      <Stage
        title="Tune a toast"
        tier="responsive"
        code="ToastInspectorDemo"
        size="lg"
        align="start"
        caption="Every value of the toast in one panel: its corners and padding on Sliders, its shadow on a Switch, its entrance on a Spring editor and its exit on a Curve editor, which starts folded. Let go of a spring or a curve and the toast leaves on the exit and enters on the spring. The Rules group checks every value against litt and says Fits or Change; Lively breaks five of them. Pick litt's toast from the version list and every row fits. Copy tokens hands over CSS custom properties, and the Tokens group shows them. The chevrons turn on the responsive tier; a group snaps open and fades in, and nothing animates its height."
        byWorld={{
          flat: {
            demo: <SentNoteInspectorDemo />,
            title: "Tune a sent note",
            code: "SentNoteInspectorDemo",
            caption:
              "Every value of the note a small site shows when an issue goes out, in one panel: its corners and padding on Sliders, its shadow on a Switch, its entrance on a Spring editor and its exit on a Curve editor, which starts folded. Let go of a spring or a curve and the note leaves on the exit and enters on the spring. The Rules group checks every value against litt and says Fits or Change; Lively breaks five of them. Pick litt's note from the version list and every row fits. Copy tokens hands over CSS custom properties. A group snaps open, and nothing animates its height.",
          },
          device: {
            demo: <NoticeInspectorDemo />,
            title: "Tune an export notice",
            code: "NoticeInspectorDemo",
            caption:
              "Every value of the notice a recorder's app shows when a take is exported, in one panel: its corners and padding on Sliders, its shadow on a Switch, its entrance on a Spring editor and its exit on a Curve editor, which starts folded. Let go of a spring or a curve and the notice leaves on the exit and enters on the spring. The Rules group checks every value against litt and says Fits or Change; Lively breaks five of them. Pick litt's notice from the version list and every row fits. Copy tokens hands over CSS custom properties. A group snaps open, and nothing animates its height.",
          },
          rack: {
            demo: <AutoFilterInspectorDemo />,
            title: "Set a device",
            code: "AutoFilterInspectorDemo",
            caption:
              "Every parameter of the Auto filter on the synth track in one panel: its type on a Segmented control, its frequency and resonance on Sliders, the LFO's amount, and Dry/Wet and the device's power under Output, which starts folded. The device beside it shows each value in words as you set it. Init and Sweep into the drop are its presets, Save keeps a version of your own, and Reset goes back to Init. The Rules group says Fits or Change for each rule: push Resonance past 90% and the filter rings. A group cuts open, and nothing animates its height.",
          },
        }}
      >
        <ToastInspectorDemo />
      </Stage>

      <Stage
        title="Versions you keep"
        tier="responsive"
        code="CardVersionsDemo"
        align="start"
        caption="Save keeps the current value as Version 1, Version 2 and so on, and the version list puts any of them back; while the value matches none, it says Unsaved changes. This panel passes a storageKey, so its versions are still here after a reload. A picked version can be deleted with the trash button. The groups start folded, with their summaries in the rows, and the chevron in the header folds the whole panel to its title."
        byWorld={{ device: { demo: <TakeCardVersionsDemo />, code: "TakeCardVersionsDemo" } }}
      >
        <CardVersionsDemo />
      </Stage>
    </Page>
  );
}
