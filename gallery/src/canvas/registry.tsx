/**
 * What is on the brainstorm canvas: "how do we make litt more fun and playful?". Each idea is a row, today on the left
 * and the playful version beside it, with everything but the one idea kept the same (data, words, size).
 *
 * To add, rename or remove an item, edit this list. Ids are stable (the saved layout is keyed by them); names are what
 * the canvas shows and copies, so keep them unique and readable: "Button press · squish".
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { Avatar, type AvatarHue } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card, CardBody, CardDescription, CardTitle } from "@/components/card";
import { Checkbox } from "@/components/checkbox";
import { RetryIcon } from "@/components/icons";
import { Segmented } from "@/components/segmented";
import { SlideConfirm } from "@/components/slide-confirm";
import { Empty } from "@/components/states";
import { Switch } from "@/components/switch";
import { Tag } from "@/components/tag";
import { BOUNCY, Burst, DotTick, DrawnCheckbox, Entrance, SpringySegmented, Squish, StretchSwitch } from "./experiments";

export type CanvasItem = {
  /** Stable, lowercase and dashed. The saved layout is keyed by it. */
  id: string;
  /** Shown above the preview and copied when pressed. Unique. */
  name: string;
  /** Where it starts, in canvas px. A move is saved over it. */
  x: number;
  y: number;
  /** The preview's own size, in px. */
  width: number;
  height: number;
  /** The live preview. Synthetic data only. */
  render: () => ReactNode;
};

/* ------------------------------------------------------------------ fixtures */

const CHOICES = [
  { label: "Email me when a deploy fails", checked: true },
  { label: "Weekly summary", checked: false },
  { label: "Comments on my sites", checked: true },
];
const SWITCHES = [
  { label: "Preview deploys", checked: true },
  { label: "Password protection", checked: false },
];
const VIEWS = ["List", "Grid", "Board"];
const TEAM: { name: string; role: string; team: "Design" | "Engineering" | "Studio" }[] = [
  { name: "Ines Duarte", role: "Designer", team: "Design" },
  { name: "Tomas Berg", role: "Engineer", team: "Engineering" },
  { name: "Ava Okafor", role: "Designer", team: "Design" },
  { name: "Nick", role: "Founder", team: "Studio" },
];
const TEAM_HUE = { Design: "violet", Engineering: "blue", Studio: "amber" } as const;

/* ------------------------------------------------------------------ previews */

function Buttons({ squish }: { squish: boolean }) {
  const wrap = (node: ReactNode) => (squish ? <Squish>{node}</Squish> : node);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {wrap(<Button variant="primary">Deploy</Button>)}
      {wrap(<Button>Preview</Button>)}
      {wrap(<Button variant="ghost">Cancel</Button>)}
    </div>
  );
}

function Toast({ bounce }: { bounce?: number }) {
  const [play, setPlay] = useState(0);
  return (
    <div className="grid h-full content-between gap-4">
      <Entrance play={play} bounce={bounce}>
        <div className="grid gap-1 rounded-surface bg-surface-2 p-4 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]">
          <p className="text-small font-title text-fg">Deploy is live</p>
          <p className="text-small text-fg-subtle">litt.design v3 is on production.</p>
        </div>
      </Entrance>
      <div>
        <Button size="sm" icon={<RetryIcon />} onClick={() => setPlay((n) => n + 1)}>
          Replay
        </Button>
      </div>
    </div>
  );
}

function Confirm({ burst }: { burst: boolean }) {
  const [round, setRound] = useState(0);
  const [play, setPlay] = useState(0);
  return (
    <div className="grid gap-4">
      <div className="relative">
        <SlideConfirm key={round} label="Slide to publish Halden Gallery" confirmedLabel="Published" onConfirm={() => burst && setPlay((n) => n + 1)} />
        {burst && <Burst play={play} />}
      </div>
      <div>
        <Button size="sm" variant="ghost" icon={<RetryIcon />} onClick={() => setRound((n) => n + 1)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function EmptyDeploys({ dots, warm }: { dots: boolean; warm: boolean }) {
  const [play, setPlay] = useState(0);
  return (
    <div className="grid gap-3">
      <Empty
        title={warm ? "Nothing failed this week." : "No failed deploys."}
        action={<Button size="sm">View all deploys</Button>}
      >
        {warm ? "Enjoy it. When a deploy fails, it shows up here with its log." : "When a deploy fails, it shows up here with its log."}
      </Empty>
      {dots && (
        <div className="flex items-center justify-between">
          <DotTick play={play} />
          <Button size="sm" variant="ghost" icon={<RetryIcon />} onClick={() => setPlay((n) => n + 1)}>
            Replay
          </Button>
        </div>
      )}
    </div>
  );
}

function Team({ hues }: { hues: boolean }) {
  return (
    <ul className="grid">
      {TEAM.map((p) => (
        <li key={p.name} className="flex h-control-md items-center gap-3 border-b border-line last:border-b-0">
          <Avatar name={p.name} size="sm" decorative hue={hues ? undefined : ("neutral" satisfies AvatarHue)} />
          <span className="flex-1 text-small text-fg">{p.name}</span>
          <span className="text-small text-fg-subtle">{p.role}</span>
          <Tag hue={hues ? TEAM_HUE[p.team] : undefined}>{p.team}</Tag>
        </li>
      ))}
    </ul>
  );
}

function ProjectCard({ rounder }: { rounder: boolean }) {
  /* The radius tokens, raised for this card only: the controls 6 and the surfaces 12. */
  const style = rounder ? ({ "--radius-control": "6px", "--radius-surface": "12px" } as CSSProperties) : undefined; // litt-allow: canvas experiment, a rounder scale
  return (
    <div style={style}>
      <Card>
        <CardBody>
          <CardTitle>Halden Gallery</CardTitle>
          <CardDescription>A gallery site for a Bergen studio. Live since September.</CardDescription>
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" variant="primary">
              Open site
            </Button>
            <Tag status="success">Live</Tag>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ the canvas */

/* Two lanes of ideas, so the canvas is wider than tall: touch and feel on the left, moments and identity on the right.
   In a lane, column 0 is today and the next columns are the playful versions. Positions are canvas px. */
const LANE = [0, 1000];
const COL = 440;
const at = (lane: number, col: number) => LANE[lane]! + col * COL;
const ROW_A = [0, 200, 420, 600, 780];
const ROW_B = [0, 260, 620, 920];

export const ITEMS: CanvasItem[] = [
  { id: "press-today", name: "Button press · today", x: at(0, 0), y: ROW_A[0], width: 400, height: 120, render: () => <Buttons squish={false} /> },
  { id: "press-squish", name: "Button press · squish", x: at(0, 1), y: ROW_A[0], width: 400, height: 120, render: () => <Buttons squish /> },

  {
    id: "checkbox-today",
    name: "Checkbox · today",
    x: at(0, 0),
    y: ROW_A[1],
    width: 400,
    height: 160,
    render: () => (
      <div className="grid">
        {CHOICES.map((c) => (
          <Checkbox key={c.label} label={c.label} defaultChecked={c.checked} />
        ))}
      </div>
    ),
  },
  {
    id: "checkbox-drawn",
    name: "Checkbox · tick draws in",
    x: at(0, 1),
    y: ROW_A[1],
    width: 400,
    height: 160,
    render: () => (
      <div className="grid">
        {CHOICES.map((c) => (
          <DrawnCheckbox key={c.label} label={c.label} defaultChecked={c.checked} />
        ))}
      </div>
    ),
  },

  {
    id: "switch-today",
    name: "Switch · today",
    x: at(0, 0),
    y: ROW_A[2],
    width: 400,
    height: 120,
    render: () => (
      <div className="grid gap-1">
        {SWITCHES.map((s) => (
          <Switch key={s.label} label={s.label} defaultChecked={s.checked} />
        ))}
      </div>
    ),
  },
  {
    id: "switch-stretch",
    name: "Switch · thumb stretches",
    x: at(0, 1),
    y: ROW_A[2],
    width: 400,
    height: 120,
    render: () => (
      <div className="grid gap-1">
        {SWITCHES.map((s) => (
          <StretchSwitch key={s.label} label={s.label} defaultChecked={s.checked} />
        ))}
      </div>
    ),
  },

  {
    id: "segmented-today",
    name: "Segmented · today",
    x: at(0, 0),
    y: ROW_A[3],
    width: 400,
    height: 120,
    render: () => <Segmented legend="View" size="sm" options={VIEWS.map((v) => ({ value: v, label: v }))} />,
  },
  { id: "segmented-springy", name: "Segmented · springy thumb", x: at(0, 1), y: ROW_A[3], width: 400, height: 120, render: () => <SpringySegmented legend="View" options={VIEWS} /> },

  { id: "moment-today", name: "Toast entrance · bounce 0.12", x: at(0, 0), y: ROW_A[4], width: 400, height: 220, render: () => <Toast /> },
  { id: "moment-bouncy", name: `Toast entrance · bounce ${BOUNCY}`, x: at(0, 1), y: ROW_A[4], width: 400, height: 220, render: () => <Toast bounce={BOUNCY} /> },

  { id: "confirm-today", name: "Slide to confirm · today", x: at(1, 0), y: ROW_B[0], width: 400, height: 180, render: () => <Confirm burst={false} /> },
  { id: "confirm-burst", name: "Slide to confirm · burst of data dots", x: at(1, 1), y: ROW_B[0], width: 400, height: 180, render: () => <Confirm burst /> },

  { id: "empty-today", name: "Empty state · today", x: at(1, 0), y: ROW_B[1], width: 400, height: 300, render: () => <EmptyDeploys dots={false} warm={false} /> },
  { id: "empty-dots", name: "Empty state · dot drawing", x: at(1, 1), y: ROW_B[1], width: 400, height: 300, render: () => <EmptyDeploys dots warm={false} /> },
  { id: "empty-dots-words", name: "Empty state · dot drawing, warmer words", x: at(1, 2), y: ROW_B[1], width: 400, height: 300, render: () => <EmptyDeploys dots warm /> },

  { id: "team-today", name: "Team list · neutral", x: at(1, 0), y: ROW_B[2], width: 400, height: 240, render: () => <Team hues={false} /> },
  { id: "team-hues", name: "Team list · identity hues", x: at(1, 1), y: ROW_B[2], width: 400, height: 240, render: () => <Team hues /> },

  { id: "card-today", name: "Card · 4 and 8 radius", x: at(1, 0), y: ROW_B[3], width: 400, height: 220, render: () => <ProjectCard rounder={false} /> },
  { id: "card-rounder", name: "Card · 6 and 12 radius", x: at(1, 1), y: ROW_B[3], width: 400, height: 220, render: () => <ProjectCard rounder /> },
];
