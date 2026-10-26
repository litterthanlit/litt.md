import { Avatar } from "@/components/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/hover-card";
import { Tag } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "hover-card",
  title: "Hover card",
  lede: "A preview of what a link points at.",
  order: 9.5,
  group: "Overlays",
  verbs: ["hover"],
  summary:
    "A small card that previews what a link points at: a person behind their name, a project behind its link. It opens after the pointer rests on the link, or at once on keyboard focus, and stays while the pointer crosses into it. It grows from the link on the responsive tier, as a popover does. A touch never opens it, so the link must lead to the same thing.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["hover-card"],
  exports: ["HoverCard", "HoverCardTrigger", "HoverCardContent"],
  usage: `import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/hover-card";

// The trigger is a real link to the same thing: on a touch screen the card never opens, and the tap follows it.
<HoverCard>
  <HoverCardTrigger>
    <a href="/people/ines">Ines Duarte</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <p className="text-small font-title text-fg">Ines Duarte</p>
    <p className="text-small text-fg-subtle">Design lead, Halo Studio</p>
  </HoverCardContent>
</HoverCard>`,
  use: [
    "A name, a project or a commit in running text or a table, where a glance at its details saves a trip.",
    "A preview of something the link opens in full, so nothing in the card is only in the card.",
  ],
  skip: [
    "Anything someone must read or do. A touch screen never shows it: put it on the page, in a Popover or behind the link.",
    "A one-line label for an icon button. That is a Tooltip.",
    "A form or several actions. That is a Popover, which opens on a press and takes focus.",
  ],
  keyboard: [
    [["Tab"], "Focus on the trigger opens the card at once; leaving it closes the card. Focus never moves into the card."],
    [["Escape"], "Closes the card and keeps focus on the trigger."],
    [["Enter"], "Follows the trigger link, as it would without the card."],
  ],
  a11y: [
    "The card only previews: the trigger is a real link or button that leads to everything the card shows.",
    "It opens on keyboard focus as well as on hover, and Esc closes it, so it never sits over the page uninvited.",
    "Focus never moves into the card, and a tap never opens it, so touch and screen reader users lose nothing by not seeing it.",
    "It closes 200ms after the pointer leaves, so the pointer can cross the gap to a link inside it.",
    "Under reduced motion it appears and goes without moving.",
  ],
};

const link =
  "rounded-control text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function PersonDemo() {
  return (
    <p className="max-w-md text-reading text-fg-muted">
      Deployed to production by{" "}
      <HoverCard>
        <HoverCardTrigger>
          <a href="#hover-card" className={link}>
            Ines Duarte
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Avatar name="Ines Duarte" size="lg" decorative />
              <div className="grid gap-1">
                <p className="text-small font-title text-fg">Ines Duarte</p>
                <p className="text-small text-fg-subtle">Design lead, Halo Studio</p>
              </div>
            </div>
            <p className="text-small text-fg-muted">Lisbon. Owns the studio site and the Atlas portfolio.</p>
            <p className="tabular-nums text-caption font-normal text-fg-subtle">Joined March 2024 · 312 deploys</p>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      two hours ago, from main.
    </p>
  );
}

const PROJECTS = [
  { id: "halo", name: "Halo site", status: "Live", tone: "success", note: "Deployed 2 hours ago from main.", domain: "halo.studio" },
  { id: "atlas", name: "Atlas portfolio", status: "In review", tone: "warning", note: "Preview ready, waiting on Ines.", domain: "atlas-preview.litt.app" },
  { id: "kassa", name: "Kassa pitch deck", status: "Draft", tone: "neutral", note: "No deploy yet.", domain: "Not deployed" },
] as const;

function ProjectsDemo() {
  return (
    <ul aria-label="Projects" className="grid w-full max-w-md">
      {PROJECTS.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
          <HoverCard>
            <HoverCardTrigger>
              <a href="#hover-card" className={link + " text-small"}>
                {p.name}
              </a>
            </HoverCardTrigger>
            <HoverCardContent side="right" align="center">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-small font-title text-fg">{p.name}</p>
                  <Tag status={p.tone}>{p.status}</Tag>
                </div>
                <p className="text-small text-fg-muted">{p.note}</p>
                <p className="truncate text-caption font-normal text-fg-subtle">{p.domain}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <Tag status={p.tone}>{p.status}</Tag>
        </li>
      ))}
    </ul>
  );
}

export default function HoverCardPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A person behind their name"
        tier="responsive"
        align="start"
        code="PersonDemo"
        caption="Rest the pointer on the name for half a second, or Tab to it. The card grows from the link on the responsive tier and travels a quarter of the travel token from the side it opens on. Move into the card and it stays; leave both and it goes after 200ms. On a phone a tap just follows the link."
      >
        <PersonDemo />
      </Stage>

      <Stage
        title="A project behind its link"
        tier="responsive"
        align="start"
        code="ProjectsDemo"
        caption="Each project's card opens to the right, centered on its row, and flips when there is no room. Moving from one name to the next waits out the delay again, so sweeping down the list does not flash every card."
      >
        <ProjectsDemo />
      </Stage>
    </Page>
  );
}
