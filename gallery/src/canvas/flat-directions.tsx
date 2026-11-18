/**
 * Flat, three directions and its own new parts (Nick, 2026-11-18: "I feel like we should design flat now, new components
 * fun airy easy approach colorful"). One airy screen, a person's own site and letter with no brand name, built from the
 * shipping Flat parts through their public props, three ways, each light over dark:
 *
 * - A · Soft colour: each kind of thing gets a pastel of its own as a fill (posts, readers, the letter, numbers,
 *   drafts); ink words, airy spacing, bigger rounded shapes.
 * - B · Colour pops: today's grey ground and white paper, plus six bright hues, one per object: avatars, a category's
 *   dot, the chart's bars, icon chips and an illustrated empty state.
 * - C · Playful: chunkier shapes and the fun icon set (flat-icons.tsx), colour blocks behind each section, stickers,
 *   and a springy press on what a hand presses (Flat's own expressive spring, only on a hand).
 *
 * Then `FlatNewParts`: parts Flat would have that the other worlds do not, drawn in B with C's press.
 *
 * Kept from what Nick approved (plans/024, Flat): the grey ground, paper with no edge or shadow, pills and circles, the
 * ink card, a status as a dot and a word. Each direction is a frame attribute (data-flat-dir) that flat-directions.css
 * reads, plus the few pieces of structure a direction adds. Candidate colours are in flat-directions-data.ts (litt-allow);
 * nothing in src/components, src/worlds or tokens.css changes. Nothing moves on load, and under reduced motion nothing
 * moves at all. Made-up data, no requests.
 */
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar, AvatarGroup, type AvatarHue } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { BarChart } from "@/components/chart";
import { TextField } from "@/components/input";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Segmented } from "@/components/segmented";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { Empty } from "@/components/states";
import { Switch } from "@/components/switch";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Tag } from "@/components/tag";
import { Toaster, useToast } from "@/components/toast";
import { MaterialProvider, OverlayRoot, useExit, useMotionDial, useTransition } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { BLOCKS, POPS, POP_MARKS, SOFT, SOFT_DEEP, paletteVars } from "./flat-directions-data";
import { FlatIcon } from "./flat-icons";
import "./flat-directions.css";

export type FlatDirection = "soft" | "pops" | "playful";

/* ---------------------------------------------------------------- the frame */

/** One Flat frame, its own theme and world whatever the gallery's look, holding its own overlays (a popover, a toast)
    the way the player's screen does: the frame is the OverlayRoot and a containing block for fixed boxes. */
function DirFrame({ dir, dark, children }: { dir: FlatDirection; dark: boolean; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const vars = {
    ...paletteVars("soft", SOFT, dark),
    ...paletteVars("soft-deep", SOFT_DEEP, dark),
    ...paletteVars("pop", POPS, dark),
    ...paletteVars("pop-mark", POP_MARKS, dark),
    ...paletteVars("block", BLOCKS, dark),
  };
  return (
    <div
      ref={setEl}
      {...lookAttributes({ accent: "world", material: "flat" }, dark)}
      data-flat-dir={dir}
      style={vars}
      className="relative grid content-start gap-6 rounded-surface bg-canvas p-8 text-fg contain-layout"
    >
      <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
      <MaterialProvider material="flat">
        <OverlayRoot container={el}>
          <Toaster>{children}</Toaster>
        </OverlayRoot>
      </MaterialProvider>
    </div>
  );
}

/* ---------------------------------------------------------------- motion, only on a hand */

/** A springy press: the object dips on a hand and comes back on Flat's expressive spring (0.28). Never on load, never
    by a script, and under reduced motion it does not move at all. */
function Press({ on = true, className = "", children }: { on?: boolean; className?: string; children: ReactNode }) {
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  if (!on || reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div whileTap={{ scale: 0.94 }} transition={spring} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- the content, one set for every direction */

type Kind = "posts" | "readers" | "letter" | "numbers" | "drafts";
type Pop = keyof typeof POPS;

/** Which pop each kind of thing takes in B (and which sticker in C): one hue per object. */
const KIND_POP: Record<Kind, Pop> = { posts: "sky", readers: "grape", letter: "sun", numbers: "tomato", drafts: "grass" };
const KIND_ICON: Record<Kind, string> = { posts: "Post", readers: "Users", letter: "Mail", numbers: "ChartBar", drafts: "Edit" };

const POSTS = [
  { name: "Open water", note: "Spring series · 4 min read", status: "Published", tone: "success", icon: "Image", pop: "sky" },
  { name: "Notes on grey", note: "Goes out Friday at 9:00", status: "Scheduled", tone: "warning", icon: "Clock", pop: "sun" },
  { name: "Issue 15", note: "Three lines so far", status: "Draft", tone: "neutral", icon: "Issue", pop: "grape" },
] as const;

const READERS: { name: string; hue: AvatarHue; pop: Pop }[] = [
  { name: "Ines Duarte", hue: "violet", pop: "grape" },
  { name: "Tom Okafor", hue: "teal", pop: "grass" },
  { name: "Mia Laine", hue: "rose", pop: "bubblegum" },
  { name: "Sam Reyes", hue: "amber", pop: "sun" },
  { name: "Ada Brook", hue: "blue", pop: "sky" },
];

const REACTIONS = [
  { icon: "Heart", label: "Loved it", count: 24, pop: "bubblegum" },
  { icon: "Smiley", label: "Made me smile", count: 12, pop: "sun" },
  { icon: "Coffee", label: "Read with coffee", count: 8, pop: "tomato" },
] as const;

const TOPICS = [
  { name: "Pictures", hue: "blue", pop: "sky" },
  { name: "Notes", hue: "amber", pop: "sun" },
  { name: "Letters", hue: "teal", pop: "grass" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const READS = [140, 162, 155, 188, 240, 171, 148];
const WEEK = [820, 904, 870, 990, 1040, 1118, 1204];

const popVar = (pop: Pop): CSSProperties => ({ "--pop-color": `var(--pop-${pop})` }) as CSSProperties;

/** An icon in a circle: in B a pop with the ink on it, in A the pastel's deeper step, in C a white chip. */
function IconChip({ icon, pop, size = 32 }: { icon: string; pop: Pop; size?: number }) {
  return (
    <span data-chip="" style={{ ...popVar(pop), width: size, height: size }} className="inline-grid shrink-0 place-items-center rounded-pill">
      <FlatIcon name={icon} size={size >= 40 ? 20 : 16} />
    </span>
  );
}

/** A sticker (C): a small rotated badge in a pop, with a mark and a word or two. Decorative: the words are said nearby. */
function Sticker({ pop, icon, children, tilt, className = "" }: { pop: Pop; icon?: string; children?: ReactNode; tilt: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-sticker=""
      style={{ ...popVar(pop), transform: `rotate(${tilt}deg)` }}
      className={"pointer-events-none absolute z-10 inline-flex h-9 items-center gap-1.5 rounded-pill px-3 text-small font-title " + className}
    >
      {icon && <FlatIcon name={icon} size={16} />}
      {children}
    </span>
  );
}

/** A section of the screen: paper on the ground (B), a pastel by kind (A) or a colour block (C). */
function Section({ dir, kind, title, aside, sticker, children }: { dir: FlatDirection; kind: Kind; title: string; aside?: ReactNode; sticker?: ReactNode; children: ReactNode }) {
  return (
    <section data-kind={kind} aria-label={title} className="litt-paper relative grid content-start gap-4 rounded-surface bg-surface-1 p-6">
      {dir === "playful" && sticker}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {dir === "soft" ? <FlatIcon name={KIND_ICON[kind]} size={20} /> : <IconChip icon={KIND_ICON[kind]} pop={KIND_POP[kind]} size={dir === "playful" ? 40 : 32} />}
          <h3 data-dir-title="" className="text-body font-title text-fg">
            {title}
          </h3>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Header({ dir }: { dir: FlatDirection }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const { toast } = useToast();
  const big = dir === "playful";
  return (
    <header data-kind="header" className="relative grid gap-5 rounded-surface">
      {dir === "playful" && (
        <Sticker pop="tomato" icon="Spark" tilt={-6} className="-top-3 right-56">
          New issue
        </Sticker>
      )}
      <div className="flex items-center gap-3">
        <Avatar name="You" hue="neutral" size={big ? "lg" : "md"} decorative />
        <p className="text-small text-fg-subtle">Good morning. Your site had a calm week.</p>
      </div>
      <h2 data-dir-headline="" className="max-w-[22ch] text-h1 text-balance text-fg">
        Issue 14 goes out Friday.
      </h2>
      <p className="max-w-[52ch] text-body text-fg-muted">Twelve pictures from the coast, and a few lines on how each one was made.</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Press on={big}>
            <Button
              variant="primary"
              size={big ? "lg" : "md"}
              icon={<FlatIcon name="Send" />}
              onClick={() => toast({ title: "Test sent to you", description: "Issue 14 is in your inbox. It goes to 412 readers on Friday." })}
            >
              Send a test
            </Button>
          </Press>
          <Popover>
            <PopoverTrigger asChild>
              <Button size={big ? "lg" : "md"} icon={<FlatIcon name="Share" />}>
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent label="Share a preview" size="sm">
              <div className="grid gap-3">
                <p className="text-small text-fg-muted">Anyone with the link can read the draft of issue 14.</p>
                <p className="truncate rounded-control bg-block px-4 py-2 text-small text-fg">example.com/issue-14</p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" data-autofocus icon={<FlatIcon name="Link" />}>
                    Copy link
                  </Button>
                  <PopoverClose asChild>
                    <Button size="sm" variant="ghost">
                      Done
                    </Button>
                  </PopoverClose>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Segmented legend="Range" value={range} onValueChange={setRange} options={[{ value: "week", label: "This week" }, { value: "month", label: "This month" }]} />
      </div>
    </header>
  );
}

function ReadersCard({ dir }: { dir: FlatDirection }) {
  return (
    <div className="relative">
      {dir === "playful" && (
        <Sticker pop="bubblegum" icon="Heart" tilt={8} className="-top-4 -right-3">
          24
        </Sticker>
      )}
      <Card tone="ink" className="p-6">
        <Stat label="Readers this week" value="1,204" delta="Up 86 on last week" trend={<Sparkline label="Readers this week, last 7 days" values={WEEK} hue="blue" />} />
      </Card>
    </div>
  );
}

function Numbers({ dir }: { dir: FlatDirection }) {
  return (
    <Section dir={dir} kind="numbers" title="Reads a day">
      <div data-dir-chart="" className="rounded-control">
        <BarChart label="Reads a day, this week" labels={DAYS} series={[{ name: "Reads", values: READS, hue: dir === "soft" ? undefined : "blue" }]} unit="reads" xTitle="Day" height={180} highlight={dir === "pops" ? "none" : "last"} entrance={false} />
      </div>
    </Section>
  );
}

function PostRow({ dir, post }: { dir: FlatDirection; post: (typeof POSTS)[number] }) {
  return (
    <li>
      <Press on={dir === "playful"}>
        <div data-dir-row="" className="flex items-center gap-3 rounded-control py-2">
        {dir === "soft" ? (
          <span data-chip="" className="inline-grid size-8 shrink-0 place-items-center rounded-pill">
            <FlatIcon name={post.icon} />
          </span>
        ) : (
          <IconChip icon={post.icon} pop={post.pop} size={dir === "playful" ? 40 : 32} />
        )}
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-small font-title text-fg">{post.name}</span>
          <span className="truncate text-caption text-fg-subtle">{post.note}</span>
        </span>
        <Tag status={post.tone}>{post.status}</Tag>
        </div>
      </Press>
    </li>
  );
}

function Posts({ dir }: { dir: FlatDirection }) {
  return (
    <Section
      dir={dir}
      kind="posts"
      title="Your posts"
      sticker={
        <Sticker pop="sun" icon="Smiley" tilt={-8} className="-top-4 right-6">
          3 this week
        </Sticker>
      }
    >
      <Tabs defaultValue="posts" variant="segmented">
        <TabsList aria-label="Your posts">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
        </TabsList>
        <TabsPanels>
          <TabsPanel value="posts">
            <ul className="grid gap-1 pt-3">
              {POSTS.map((p) => (
                <PostRow key={p.name} dir={dir} post={p} />
              ))}
            </ul>
          </TabsPanel>
          <TabsPanel value="series">
            <p className="pt-3 text-small text-fg-muted">Spring series · twelve pictures from the coast, six posted.</p>
          </TabsPanel>
        </TabsPanels>
      </Tabs>
    </Section>
  );
}

/** A reaction count. A hand can add one in C, where it is a button with a springy press. */
function Reaction({ dir, r }: { dir: FlatDirection; r: (typeof REACTIONS)[number] }) {
  const [mine, setMine] = useState(false);
  const body = (
    <>
      <FlatIcon name={r.icon} />
      <span className="tabular-nums">{r.count + (mine ? 1 : 0)}</span>
    </>
  );
  const cls = "inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-small font-title text-fg";
  if (dir !== "playful")
    return (
      <span data-reaction="" style={popVar(r.pop)} aria-label={`${r.label}, ${r.count}`} role="img" className={cls}>
        {body}
      </span>
    );
  return (
    <Press>
      <button type="button" data-reaction="" style={popVar(r.pop)} aria-pressed={mine} aria-label={`${r.label}, ${r.count + (mine ? 1 : 0)}`} onClick={() => setMine(!mine)} className={cls + " cursor-pointer"}>
        {body}
      </button>
    </Press>
  );
}

function Readers({ dir }: { dir: FlatDirection }) {
  return (
    <Section dir={dir} kind="readers" title="Readers wrote back">
      <div className="flex items-center gap-3">
        <AvatarGroup label="Readers who wrote back, 9 people" total={9} max={5} size={dir === "playful" ? "lg" : "md"} ring="surface-1">
          {READERS.map((r) => (
            <Avatar key={r.name} name={r.name} hue={r.hue} data-pop="" style={popVar(r.pop)} />
          ))}
        </AvatarGroup>
        <span className="text-small text-fg-muted">9 replies to issue 13</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => (
          <Reaction key={r.icon} dir={dir} r={r} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) =>
          dir === "pops" ? (
            <Tag key={t.name}>
              <span className="inline-flex items-center gap-2">
                <span data-pop-dot="" style={popVar(t.pop)} className="size-2 rounded-pill" />
                {t.name}
              </span>
            </Tag>
          ) : (
            <Tag key={t.name} hue={t.hue}>
              {t.name}
            </Tag>
          ),
        )}
      </div>
    </Section>
  );
}

function Letter({ dir }: { dir: FlatDirection }) {
  return (
    <Section dir={dir} kind="letter" title="The letter">
      <TextField label="Replies go to" type="email" defaultValue="you@example.com" />
      <Switch align="end" label="Send on Fridays at 9:00" defaultChecked />
      <Switch align="end" label="Show likes under each post" />
    </Section>
  );
}

/** What the empty state draws: nothing in A (words alone, on mint), blobs and a page in B, a sticker pile in C. */
function EmptyArt({ dir }: { dir: FlatDirection }) {
  if (dir === "soft") return null;
  if (dir === "pops")
    return (
      <div aria-hidden="true" className="relative h-28 w-full">
        <span data-blob="" style={popVar("grass")} className="absolute top-3 left-0 size-20 rounded-pill" />
        <span data-blob="" style={popVar("sun")} className="absolute top-14 left-28 size-12 rounded-pill" />
        <span data-blob="" style={popVar("sky")} className="absolute top-0 left-32 size-8 rounded-pill" />
        <span className="absolute top-4 left-12 grid h-22 w-18 rotate-[-6deg] content-start gap-2 rounded-control bg-surface-3 p-3 text-fg">
          <FlatIcon name="Post" size={20} />
          <span className="h-1.5 w-10 rounded-pill bg-fg-disabled" />
          <span className="h-1.5 w-7 rounded-pill bg-fg-disabled" />
        </span>
      </div>
    );
  return (
    <div aria-hidden="true" className="relative h-28 w-full">
      <span data-blob="" style={{ ...popVar("sun"), transform: "rotate(-10deg)" }} className="absolute top-2 left-4 grid size-20 place-items-center rounded-pill text-fg">
        <FlatIcon name="Smiley" size={40} />
      </span>
      <span data-blob="" style={{ ...popVar("bubblegum"), transform: "rotate(12deg)" }} className="absolute top-12 left-24 grid size-12 place-items-center rounded-pill">
        <FlatIcon name="Heart" size={24} />
      </span>
      <span data-blob="" style={{ ...popVar("sky"), transform: "rotate(-4deg)" }} className="absolute top-0 left-36 grid size-10 place-items-center rounded-pill">
        <FlatIcon name="Spark" size={20} />
      </span>
    </div>
  );
}

function Drafts({ dir }: { dir: FlatDirection }) {
  return (
    <Section dir={dir} kind="drafts" title="Drafts">
      <EmptyArt dir={dir} />
      <Empty bare title="No drafts yet" action={<Button size="sm" icon={<FlatIcon name="Plus" />}>New draft</Button>}>
        Write a few lines. They wait here until you are ready.
      </Empty>
    </Section>
  );
}

/** The screen: the header, then three airy columns. */
function Screen({ dir }: { dir: FlatDirection }) {
  return (
    <div data-dir-screen="" className="grid gap-8">
      <Header dir={dir} />
      <div data-dir-columns="" className="grid grid-cols-3 items-start gap-6">
        <div className="grid gap-6">
          <ReadersCard dir={dir} />
          <Numbers dir={dir} />
        </div>
        <div className="grid gap-6">
          <Posts dir={dir} />
          <Readers dir={dir} />
        </div>
        <div className="grid gap-6">
          <Letter dir={dir} />
          <Drafts dir={dir} />
        </div>
      </div>
    </div>
  );
}

const ABOUT: Record<FlatDirection, string> = {
  soft:
    "A · Soft colour. Each kind of thing gets its own pastel as a fill: posts sky, readers lilac, the letter butter, numbers peach, drafts mint. Ink words on every pastel, the ink card kept, more room between things and rounder surfaces (28px).",
  pops:
    "B · Colour pops. Today's grey ground and white paper, plus six bright hues, one per object: each reader's avatar, a topic's dot, an icon's chip, the chart's bars, the empty state's drawing. Black words on every pop.",
  playful:
    "C · Playful. Chunkier: larger controls, a 40px headline, 32px surfaces and the fun icon set. A colour block behind each section, stickers on the corners, and a springy press (Flat's 0.28 spring) on what a hand presses; tap a reaction.",
};

/** One direction, light over dark. */
export function FlatDirectionPreview({ dir }: { dir: FlatDirection }) {
  return (
    <div data-flat-direction={dir} className="grid gap-6">
      <p className="max-w-[90ch] text-small text-fg-muted">{ABOUT[dir]}</p>
      <DirFrame dir={dir} dark={false}>
        <Screen dir={dir} />
      </DirFrame>
      <DirFrame dir={dir} dark>
        <Screen dir={dir} />
      </DirFrame>
    </div>
  );
}

/* ================================================================ Flat's own new parts */

/** Particles out of a point, on a hand only: none under reduced motion. Each flies on the expressive spring and fades on
    the exit tween. `pops` colours them one each. */
function Burst({ shot, pops, reach = 36 }: { shot: number; pops: Pop[]; reach?: number }) {
  const spring = useTransition("expressive");
  const fade = useExit("expressive");
  const { reduced } = useMotionDial();
  /* The flight on the spring, the fade on the exit tween. */
  const flight = { ...spring, opacity: fade };
  if (reduced || shot === 0) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
      <AnimatePresence>
        {pops.map((pop, i) => {
          const a = (i / pops.length) * Math.PI * 2 + shot;
          return (
            <motion.span
              key={`${shot}-${i}`}
              data-burst=""
              style={popVar(pop)}
              className="absolute size-2 rounded-pill"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{ x: Math.cos(a) * reach, y: Math.sin(a) * reach, opacity: 0, scale: 1 }}
              transition={flight}
            />
          );
        })}
      </AnimatePresence>
    </span>
  );
}

/** 1. A reaction bar: a reader answers a post with a mark; one press adds one, a second takes it back. */
function ReactionBar() {
  const [mine, setMine] = useState<string | null>("Heart");
  const items = [
    { icon: "Heart", label: "Loved it", count: 23, pop: "bubblegum" },
    { icon: "Smiley", label: "Made me smile", count: 11, pop: "sun" },
    { icon: "Spark", label: "New to me", count: 6, pop: "sky" },
    { icon: "Coffee", label: "Read with coffee", count: 8, pop: "tomato" },
  ] as const;
  return (
    <div role="group" aria-label="React to Open water" className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = mine === it.icon;
        const n = it.count + (on ? 1 : 0);
        return (
          <Press key={it.icon}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${it.label}, ${n}`}
              data-reaction=""
              data-on={on || undefined}
              style={popVar(it.pop)}
              onClick={() => setMine(on ? null : it.icon)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill px-4 text-small font-title text-fg"
            >
              <FlatIcon name={it.icon} />
              <span className="tabular-nums">{n}</span>
            </button>
          </Press>
        );
      })}
    </div>
  );
}

/** 2. Stickers and badges: a round badge for a number, a tilted label for news. */
function Stickers() {
  return (
    <div className="relative flex h-24 items-center gap-6">
      <span data-badge="" style={popVar("sun")} className="grid size-20 rotate-[-8deg] place-content-center justify-items-center rounded-pill text-fg">
        <span className="text-h3 font-title tabular-nums">14</span>
        <span className="text-caption">issues</span>
      </span>
      <span data-badge="" style={{ ...popVar("grass"), transform: "rotate(5deg)" }} className="inline-flex h-10 items-center gap-2 rounded-pill px-4 text-small font-title text-fg">
        <FlatIcon name="Spark" />
        New post
      </span>
      <span data-badge="" style={{ ...popVar("grape"), transform: "rotate(-4deg)" }} className="inline-flex h-10 items-center gap-2 rounded-pill px-4 text-small font-title text-fg">
        <FlatIcon name="Heart" />
        Reader's pick
      </span>
    </div>
  );
}

/** 3. A mood picker: how the week went, five faces as one radio group. */
const MOODS = [
  { id: "low", label: "Low", mouth: "M5.5 11a3 3 0 0 1 5 0", pop: "sky" },
  { id: "meh", label: "So-so", mouth: "M5.5 10.5h5", pop: "grape" },
  { id: "ok", label: "Fine", mouth: "M5.75 9.75a2.75 2 0 0 0 4.5 0", pop: "grass" },
  { id: "good", label: "Good", mouth: "M5 9.25a3 3 0 0 0 6 0", pop: "sun" },
  { id: "great", label: "Great", mouth: "M4.75 9h6.5a3.25 3.25 0 0 1-6.5 0z", pop: "tomato" },
] as const;

function Face({ mouth }: { mouth: string }) {
  return (
    <svg width={28} height={28} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 8a6 6 0 1 0 12 0A6 6 0 1 0 2 8z" />
      <path d={mouth} />
      <path d="M6 6.25v.5M10 6.25v.5" strokeWidth={1.75} />
    </svg>
  );
}

function MoodPicker() {
  const [mood, setMood] = useState("good");
  return (
    <fieldset className="grid gap-3">
      <legend className="pb-3 text-small font-title text-fg">How did the week go?</legend>
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <Press key={m.id}>
            <label data-mood="" data-on={mood === m.id || undefined} style={popVar(m.pop)} className="grid w-14 cursor-pointer justify-items-center gap-1 rounded-control py-2 text-caption text-fg has-focus-visible:outline-2 has-focus-visible:outline-focus">
              <input type="radio" name="mood" value={m.id} checked={mood === m.id} onChange={() => setMood(m.id)} className="sr-only" />
              <Face mouth={m.mouth} />
              {m.label}
            </label>
          </Press>
        ))}
      </div>
    </fieldset>
  );
}

/** 4. A colour-tag picker: give a topic one of the six pops; the tag shows it as its dot. */
const PICKABLE: Pop[] = ["tomato", "sun", "grass", "sky", "grape", "bubblegum"];
const POP_NAMES: Record<Pop, string> = { tomato: "Tomato", sun: "Sun", grass: "Grass", sky: "Sky", grape: "Grape", bubblegum: "Bubblegum" };

function ColourTagPicker() {
  const [pick, setPick] = useState<Pop>("grass");
  return (
    <div className="grid gap-3">
      <fieldset className="flex items-center gap-2">
        <legend className="pb-3 text-small font-title text-fg">Colour for “Garden notes”</legend>
        {PICKABLE.map((p) => (
          <label key={p} data-swatch="" data-on={pick === p || undefined} style={popVar(p)} className="relative grid size-9 cursor-pointer place-items-center rounded-pill has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus">
            <input type="radio" name="tag-colour" value={p} checked={pick === p} onChange={() => setPick(p)} aria-label={POP_NAMES[p]} className="sr-only" />
            {pick === p && <FlatIcon name="Check" />}
          </label>
        ))}
      </fieldset>
      <div>
        <Tag>
          <span className="inline-flex items-center gap-2">
            <span data-pop-dot="" style={popVar(pick)} className="size-2 rounded-pill" />
            Garden notes
          </span>
        </Tag>
      </div>
    </div>
  );
}

/** 5. A progress blob: a soft shape that fills from the bottom as the parts of an issue get done. */
const BLOB = "M48 6c18 0 38 10 40 32s-10 46-36 48S8 74 8 50 30 6 48 6z";
function ProgressBlob() {
  const [done, setDone] = useState(3);
  const clip = useId();
  const total = 5;
  const h = 92 * (done / total);
  return (
    <div className="flex items-center gap-5">
      <svg width={96} height={96} viewBox="0 0 96 96" role="img" aria-label={`Issue 14, ${done} of ${total} parts ready`}>
        <defs>
          <clipPath id={clip}>
            <path d={BLOB} />
          </clipPath>
        </defs>
        <path d={BLOB} data-blob-track="" />
        <rect x={0} y={96 - h - 2} width={96} height={h + 2} clipPath={`url(#${clip})`} data-blob-fill="" style={popVar("grass")} />
      </svg>
      <div className="grid gap-2">
        <p className="text-small font-title text-fg">
          <span className="tabular-nums">{done} of {total}</span> parts of issue 14 are ready
        </p>
        <p className="text-small text-fg-muted">{done === total ? "Everything is done. It can go." : `${total - done} to go: the links and a last read.`}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setDone(Math.max(0, done - 1))} disabled={done === 0}>
            Undo
          </Button>
          <Button size="sm" variant="primary" onClick={() => setDone(Math.min(total, done + 1))} disabled={done === total}>
            Mark one done
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 6. A friendly empty state: the blobs and a page, one action. */
function FriendlyEmpty() {
  return (
    <div className="grid justify-items-start gap-2">
      <EmptyArt dir="pops" />
      <Empty bare title="Nobody has written back yet" action={<Button size="sm" icon={<FlatIcon name="Mail" />}>Ask a question in issue 14</Button>}>
        Replies to the letter land here, newest first.
      </Empty>
    </div>
  );
}

/** 7. The like heart: a press fills it and throws a few dots out of it, once, from the hand. */
function LikeHeart() {
  const [liked, setLiked] = useState(false);
  const [shot, setShot] = useState(0);
  return (
    <div className="flex items-center gap-4">
      <Press>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Liked Open water, 25" : "Like Open water, 24"}
          data-heart=""
          data-on={liked || undefined}
          style={popVar("bubblegum")}
          onClick={() => {
            if (!liked) setShot((s) => s + 1);
            setLiked(!liked);
          }}
          className="relative grid size-14 cursor-pointer place-items-center rounded-pill text-fg"
        >
          <FlatIcon name="Heart" size={24} />
          <Burst shot={shot} pops={["bubblegum", "tomato", "sun", "grape", "sky", "grass"]} />
        </button>
      </Press>
      <p className="text-small text-fg-muted">
        <span className="font-title text-fg tabular-nums">{liked ? 25 : 24}</span> readers liked Open water
      </p>
    </div>
  );
}

/** 8. A sticky note: a reminder on the page, tilted a little, in the sun's colour. */
function StickyNote() {
  return (
    <figure data-note="" style={{ ...popVar("sun"), transform: "rotate(-2deg)" }} className="grid w-60 gap-2 rounded-control p-5 text-fg">
      <FlatIcon name="Pin" />
      <blockquote className="text-body">Put the sea pictures first, then the garden. Say thanks to Mia.</blockquote>
      <figcaption className="text-caption">Note to self · Tuesday</figcaption>
    </figure>
  );
}

/** 9. An emoji avatar stack: readers who asked for no picture get a mark in a pop. */
const MARKS: { name: string; icon: string; pop: Pop }[] = [
  { name: "A reader who likes the sea", icon: "Smiley", pop: "sun" },
  { name: "A reader with a cat", icon: "Paw", pop: "grape" },
  { name: "A reader who reads in the morning", icon: "Coffee", pop: "tomato" },
  { name: "A quiet reader", icon: "Ghost", pop: "sky" },
];

function EmojiStack() {
  return (
    <div className="flex items-center gap-3">
      <span role="group" aria-label="New readers this week, 9" className="isolate inline-flex items-center">
        {MARKS.map((m, i) => (
          <span
            key={m.name}
            role="img"
            aria-label={m.name}
            data-emoji-avatar=""
            style={{ ...popVar(m.pop), zIndex: MARKS.length - i }}
            className={"relative grid size-11 place-items-center rounded-pill text-fg " + (i > 0 ? "-ml-3" : "")}
          >
            <FlatIcon name={m.icon} size={20} />
          </span>
        ))}
        <span data-emoji-more="" className="relative -ml-3 grid h-11 min-w-11 place-items-center rounded-pill bg-surface-3 px-2 text-small text-fg-muted tabular-nums">
          +5
        </span>
      </span>
      <span className="text-small text-fg-muted">9 new readers</span>
    </div>
  );
}

/** 10. A confetti toast: sending an issue throws confetti from the button (on the hand only) and says so in a toast. */
function ConfettiSend() {
  const { toast } = useToast();
  const [shot, setShot] = useState(0);
  return (
    <div className="flex items-center gap-4">
      <span className="relative inline-grid">
        <Press>
          <Button
            variant="primary"
            icon={<FlatIcon name="Send" />}
            onClick={() => {
              setShot((s) => s + 1);
              toast({ title: "Issue 14 is on its way", description: "412 readers will have it by 9:05.", tone: "success" });
            }}
          >
            Send issue 14
          </Button>
        </Press>
        <Burst shot={shot} reach={64} pops={["tomato", "sun", "grass", "sky", "grape", "bubblegum", "sun", "sky", "tomato", "grass"]} />
      </span>
      <span className="text-small text-fg-muted">Goes to 412 readers</span>
    </div>
  );
}

const NEW_PARTS: { name: string; line: string; render: () => ReactNode; wide?: boolean }[] = [
  { name: "Reaction bar", line: "A reader answers with a mark. One hue per mark; on, it fills.", render: () => <ReactionBar /> },
  { name: "Sticker and badge", line: "A number or a bit of news, tilted, in one pop.", render: () => <Stickers /> },
  { name: "Mood picker", line: "Five faces, one radio group. The chosen one takes its pop.", render: () => <MoodPicker /> },
  { name: "Colour tag picker", line: "Give a topic one of the six pops; the tag shows it as its dot.", render: () => <ColourTagPicker /> },
  { name: "Progress blob", line: "A soft shape that fills as the parts of an issue get done.", render: () => <ProgressBlob /> },
  { name: "Friendly empty state", line: "A small drawing in three pops, a sentence and one action.", render: () => <FriendlyEmpty /> },
  { name: "Like heart", line: "A press fills the heart and throws six dots, once, from the hand.", render: () => <LikeHeart /> },
  { name: "Sticky note", line: "A reminder on the page, tilted a little, in the sun.", render: () => <StickyNote /> },
  { name: "Emoji avatar stack", line: "Readers with no picture get a mark in a pop.", render: () => <EmojiStack /> },
  { name: "Confetti toast", line: "Sending throws confetti from the button and a toast says it went.", render: () => <ConfettiSend /> },
];

function NewPartsGrid() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {NEW_PARTS.map((p) => (
        <section key={p.name} aria-label={p.name} className="litt-paper grid content-start gap-5 rounded-surface bg-surface-1 p-6">
          <div className="grid gap-1">
            <h3 className="text-body font-title text-fg">{p.name}</h3>
            <p className="text-small text-fg-muted">{p.line}</p>
          </div>
          {p.render()}
        </section>
      ))}
    </div>
  );
}

/** Flat's own new parts, in B (colour pops) with C's springy press, light over dark. */
export function FlatNewParts() {
  return (
    <div data-flat-new-parts="" className="grid gap-6">
      <p className="max-w-[90ch] text-small text-fg-muted">
        New parts Flat would have and the other worlds would not, drawn in B (colour pops: the grey ground, white paper, one
        pop per object, black words on each) with C's springy press on a hand. Canvas only, not registry items. Press them:
        the heart and Send issue 14 throw dots once, from the hand; under reduced motion nothing moves.
      </p>
      <DirFrame dir="pops" dark={false}>
        <NewPartsGrid />
      </DirFrame>
      <DirFrame dir="pops" dark>
        <NewPartsGrid />
      </DirFrame>
    </div>
  );
}
