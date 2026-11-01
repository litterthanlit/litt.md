import { useState } from "react";
import { motion } from "motion/react";
import { useTravel } from "@/motion";
import { Button } from "@/components/button";
import { Tag } from "@/components/tag";
import { TuneRoot, useTune } from "@/components/tune";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tune",
  title: "Tune",
  lede: "One line that tunes a component against litt's rules.",
  order: 4.65,
  group: "Controls",
  verbs: ["drag", "press"],
  summary:
    "One call gives a component typed live values and an Inspector to tune them in. Each builder is a litt rule: a corner is checked against litt's corners, a space against the spacing scale and a spring against its tier, with a Fits or Change row each as you drag. Values come back as litt's own token var()s while they sit on a token, so the shipped component follows the theme. Copy tokens writes them with litt's names, versions keep the takes, and the panels show only in development unless you turn them on. The panel's chevrons turn on the responsive tier; nothing animates a height.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["tune"],
  exports: ["useTune", "TuneRoot"],
  usage: `// Once, around the app (Next.js app/layout.tsx, Vite main.tsx)
import { TuneRoot } from "@/components/litt/tune";
<TuneRoot>{children}</TuneRoot>

// Any component: one call
import { useTune } from "@/components/litt/tune";
const card = useTune("Plan card", (t) => ({
  radius: t.radius("surface"),            // a CSS length: litt's surface radius token while it sits there, else "12px"
  padding: t.space(24),                   // a CSS length: the spacing token while on the scale, else "20px"
  size: t.choice(["sm", "md"], "sm"),     // "sm" | "md"
  float: t.toggle(false),                 // boolean
  enter: t.spring("expressive"),          // a Motion Transition, still under reduced motion
  leave: t.easing("out"),                 // [x1, y1, x2, y2] for Motion's ease
  blur: t.number(8, { min: 0, max: 40, unit: "px" }),
  replay: t.action("Replay", () => setRun((r) => r + 1)), // a button; not in card
}));

<div style={{ borderRadius: card.radius, padding: card.padding }}>…</div>`,
  use: [
    "You are building one component and want it to feel right by dragging, not by editing numbers and reloading. One call gives the values and the panel.",
    "The values must keep to litt. A corner, a space or a spring says Fits or Change as you drag, and once they fit, the component holds litt's own tokens.",
    "The result has to leave the browser. Copy tokens writes CSS custom properties that hold litt's token names, and the Props comment lists the choices that belong in the call.",
    "Many copies of one component, such as a list of cards, should follow one panel. Give them the same name.",
  ],
  skip: [
    "A panel for tuning anything other than the component in your code, such as a settings screen. Use an Inspector, with the controls you place yourself.",
    "litt's own motion and radii. They are tokens in tokens.css; tune them on the Playground and lock them there.",
    "Code you ship. The panels hide in production, but the code still ships wherever tune is imported. Once the values fit, paste the tokens and remove the call.",
  ],
  keyboard: [
    [["Tab"], "Moves through each panel's header, the version list and Save, the controls, the actions, and the Rules and Tokens rows."],
    [["Arrow keys"], "On a slider, move it one step. On a Segmented choice, pick the next option."],
    [["Enter", "Space"], "On a fold's row, fold or open it. On an action, run it."],
  ],
  a11y: [
    "Each panel is the Inspector: a region named by the name you pass to useTune, with its fold button, version list, Rules and Tokens as the Inspector page describes.",
    "Every control is a litt control with its label: the key in words, or the label you pass.",
    "Each rule row starts with the field's label and says Fits or Change in words.",
    "With the panels hidden, nothing is drawn and nothing is announced; the component renders with its defaults.",
  ],
};

/* ---------- a plan card, tuned ---------- */

function PlanCard() {
  const travel = useTravel();
  const [run, setRun] = useState(0);
  const card = useTune("Plan card", (t) => ({
    radius: t.radius(12),
    padding: t.space(20),
    size: t.choice(["sm", "md"], "md"),
    badge: t.toggle(true, { label: "Most picked badge" }),
    enter: t.spring("expressive", { label: "Entrance" }),
    replay: t.action("Replay", () => setRun((r) => r + 1)),
  }));
  return (
    <motion.div
      key={run}
      initial={run === 0 ? false : { opacity: 0, y: travel }}
      animate={{ opacity: 1, y: 0, transition: card.enter }}
      className="grid w-full max-w-xs gap-4 bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]"
      style={{ borderRadius: card.radius, padding: card.padding }}
    >
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-body font-title text-fg">Studio</p>
          {card.badge && <Tag>Most picked</Tag>}
        </div>
        <p className="text-small text-fg-subtle">Every project, review links for clients and your own domain.</p>
      </div>
      <p className="text-small text-fg-muted">
        <span className="text-h4 text-fg">$24</span> a month
      </p>
      <Button size={card.size} block>
        Choose Studio
      </Button>
    </motion.div>
  );
}

function PlanCardDemo() {
  return (
    <div className="@container w-full">
      <div className="grid w-full items-start gap-6 @2xl:grid-cols-[1fr_auto]">
        <TuneRoot inline enabled className="justify-self-center">
          <div className="grid w-full justify-items-center pt-4">
            <PlanCard />
          </div>
        </TuneRoot>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function NoteCard() {
  const card = useTune("Note card", (t) => ({ radius: t.radius(12), padding: t.space(24) }));
  return (
    <div className="grid gap-1 bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]" style={{ borderRadius: card.radius, padding: card.padding }}>
      <p className="text-body font-title text-fg">Atelier Nord</p>
      <p className="text-small text-fg-subtle">Homepage, due Thursday</p>
    </div>
  );
}

function TuneTile() {
  return (
    <div className="grid w-full max-w-xs gap-3">
      <TuneRoot inline enabled>
        <NoteCard />
      </TuneRoot>
    </div>
  );
}

export default function TunePage() {
  return (
    <Page meta={meta} docs={docs} tile={<TuneTile />}>
      <Stage
        title="Tune a card"
        tier="responsive"
        code="PlanCardDemo"
        size="lg"
        align="start"
        caption="One useTune call gives the card its corner, its padding, its button size, its badge and its entrance, and builds the panel beside it. The corner starts at 12px and the padding at 20px, so Rules says 2 to change: drag the radius to 8px and the padding to 24px and every row fits, and the card now holds litt's own surface radius and spacing tokens. The size is a Segmented choice typed as the Button's size, the badge a Switch, and the entrance a Spring editor on the expressive tier; Replay runs it. Copy tokens writes it all with litt's names, and Save keeps a version."
      >
        <PlanCardDemo />
      </Stage>
    </Page>
  );
}
