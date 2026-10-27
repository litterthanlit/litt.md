import { Tag, type TagHue, type TagStatus } from "@/components/tag";
import { TokenInput } from "@/components/token-input";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tag",
  title: "Tag",
  lede: "A small label that names, files or reports.",
  order: 6, group: "Controls",
  summary:
    "A small flat label at the control radius that names a thing, files it under a category or reports its state. A status tag colors its text, never the fill, and always says the status in words. A category can take one of the five data hues. A value in a field, one you can lift back out, is a raised tag. Nothing about it moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["tag"],
  exports: ["Tag"],
  usage: `import { Tag, type TagStatus } from "@/components/tag";

// A plain label: the kind of thing, the client, the platform.
<Tag>Framer</Tag>

// A status: the text takes the status color, never the fill.
<Tag status="success">Live</Tag>
<Tag status="warning">In review</Tag>
<Tag status="danger">Failed</Tag>

// Neutral for states with no color. Two of them differ by their words.
<Tag status="neutral">Draft</Tag>
<Tag status="neutral">Idea</Tag>

// A category, filed under one of the five data hues: a tint and the hue's text tone.
<Tag hue="amber">Finance</Tag>
<Tag hue="blue">Clients</Tag>

// A value in a field that you can lift back out: a raised block. Token input and Combobox draw theirs this way.
<Tag raised>Identity</Tag>`,
  use: [
    "A short word names what something is: a kind (Framer, Landing), a client or a platform.",
    "A state is worth scanning for in a list: Live, In review, Failed. Put the tag next to the thing it describes.",
    "The label is one or two words. A tag never wraps, so a longer one runs out of room.",
    "Several tags sit on one item, such as a project card. Keep one status tag and let the rest be plain.",
    "Items fall into a few categories that people sort by eye, such as mail labels. Give each category one hue and keep it everywhere in the view.",
    "A value sits in a field and can be taken out again, as in a token field of your own. Set raised, so it stands up out of the field.",
  ],
  skip: [
    "People press it to filter or select. Use the filter chips in List and cards, or a Button, because a tag is not a control and takes no focus.",
    "It would hold a sentence, or something that needs to be read. Put it in body text.",
    "It tells someone what just happened, such as saved or failed. Use Toast.",
    "It names a keyboard shortcut. Use Kbd.",
    "You want the accent. There is no accent tag, because the accent changes per project and its text is not promised 4.5:1 for caption text. A category takes a data hue instead.",
    "Every item gets its own hue, or the hue is only there to brighten the row. A hue carries a category (R7): with more than five categories, leave them plain.",
  ],
  keyboard: [[["Tab"], "Skips it. A tag is a label, so it never takes focus and has no key of its own."]],
  a11y: [
    "A tag is a plain span of text, so a screen reader reads its label like any other text.",
    "The status is the word, never the color alone. Write \"Failed\", not \"Red\", and check that the label would still make sense in grayscale.",
    "Every status color reaches 4.5:1 on the tag's surface-1 fill in light and dark, so the caption text is readable.",
    "A hue tag's text is the hue's text tone, which reaches 4.5:1 on its own tint in light and dark (check.mjs checks every pair). The category is in the word, so the hue is never the only signal.",
    "At 24px a tag is too small to be a touch target. If it must be pressed, build a chip or a Button at 32 or 44px.",
    "Nothing moves, so there is nothing to reduce under reduced motion.",
  ],
};

const WORK = [
  { name: "Founder landing", client: "Marlow Labs", tags: ["Framer", "Landing"] },
  { name: "Framer template 14", client: "Litt Templates", tags: ["Template", "Framer"] },
  { name: "Type foundry site", client: "Grotta Type", tags: ["Site", "Type", "Research"] },
];

function LabelsDemo() {
  return (
    <ul aria-label="Projects" className="grid w-full max-w-3xl gap-8 sm:grid-cols-3">
      {WORK.map((p) => (
        <li key={p.name} className="grid content-start gap-4">
          <div className="grid gap-1">
            <span className="text-body font-title text-fg">{p.name}</span>
            <span className="text-caption text-fg-subtle">{p.client}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

const STATES = [
  { tag: <Tag status="success">Live</Tag>, means: "Published and reachable. Also Passed and Synced." },
  { tag: <Tag status="warning">In review</Tag>, means: "Waiting on someone. Also Building and Stale." },
  { tag: <Tag status="danger">Failed</Tag>, means: "Needs action. Also Blocked and Overdue." },
  { tag: <Tag status="neutral">Draft</Tag>, means: "Nothing to report. Also Archived." },
  { tag: <Tag status="neutral">Idea</Tag>, means: "Not started. The word tells it from Draft." },
];

function StatusDemo() {
  return (
    <dl className="grid w-full max-w-xl gap-3">
      {STATES.map(({ tag, means }) => (
        <div key={means} className="grid grid-cols-[7.5rem_1fr] items-center gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
          <dt className="flex">{tag}</dt>
          <dd className="text-small text-fg-subtle">{means}</dd>
        </div>
      ))}
    </dl>
  );
}

const DEPLOYS: { site: string; env: string; status: TagStatus; label: string; when: string }[] = [
  { site: "atelier-nord.com", env: "Production", status: "success", label: "Live", when: "2 min ago" },
  { site: "founder-landing.framer.website", env: "Preview", status: "warning", label: "Building", when: "Just now" },
  { site: "gallery-identity.framer.website", env: "Preview", status: "danger", label: "Failed", when: "1 h ago" },
];

function DeploysDemo() {
  return (
    <ul aria-label="Recent deploys" className="w-full max-w-2xl rounded-surface p-1 shadow-[inset_0_0_0_1px_var(--line)]">
      {DEPLOYS.map((d) => (
        <li
          key={d.site}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-4 last:border-b-0"
        >
          <span className="min-w-0 basis-full truncate text-body font-title text-fg sm:flex-1 sm:basis-0">{d.site}</span>
          <span className="flex sm:w-24">
            <Tag>{d.env}</Tag>
          </span>
          <span className="flex sm:w-24">
            <Tag status={d.status}>{d.label}</Tag>
          </span>
          <span className="ml-auto text-right text-caption text-fg-subtle sm:ml-0 sm:w-20">{d.when}</span>
        </li>
      ))}
    </ul>
  );
}

const LABELS: { name: string; hue: TagHue; mail: string; from: string }[] = [
  { name: "Finance", hue: "amber", mail: "Invoice #4821 is ready", from: "Stripe" },
  { name: "Clients", hue: "blue", mail: "Round two of the landing page", from: "Marlow Labs" },
  { name: "Hiring", hue: "teal", mail: "Portfolio for the motion role", from: "Ines Duarte" },
  { name: "Press", hue: "violet", mail: "Feature on studio tools", from: "Sidebar Weekly" },
  { name: "Finance", hue: "amber", mail: "March statement", from: "Ramp" },
];

function RaisedDemo() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <div className="flex flex-wrap gap-2">
        <Tag raised>Identity</Tag>
        <Tag raised>Framer</Tag>
        <Tag raised>Type</Tag>
      </div>
      <TokenInput label="Project tags" defaultValue={["Identity", "Framer", "Type"]} placeholder="Add a tag" />
    </div>
  );
}

function CategoriesDemo() {
  return (
    <ul aria-label="Inbox" className="w-full max-w-2xl">
      {LABELS.map((m) => (
        <li key={m.mail} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
          <span className="w-28 shrink-0 truncate text-small text-fg">{m.from}</span>
          <span className="w-0 min-w-0 flex-1 truncate text-small text-fg-subtle">{m.mail}</span>
          <Tag hue={m.hue}>{m.name}</Tag>
        </li>
      ))}
    </ul>
  );
}

export default function TagPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Labels"
        caption="A plain tag is 24px tall at the control radius: flat, a surface-1 fill with an inset hairline and the top highlight, and the sans at the caption size and the label weight in fg-muted. It names a kind or a platform and never asks to be pressed. Nothing moves."
        align="start"
        code="LabelsDemo"
      >
        <LabelsDemo />
      </Stage>

      <Stage
        title="Status"
        caption="Only the text takes the status color. The fill stays surface-1, so a row of tags stays calm. There is no dot: every tag says its state in words, and neutral Draft and Idea differ by theirs."
        code="StatusDemo"
      >
        <StatusDemo />
      </Stage>

      <Stage
        title="Categories"
        caption="A hue tag files mail under a label. Each label keeps one of the five data hues everywhere in the view, so Finance reads as amber at a glance, and the word still says it. The fill is the hue's tint and the text its text tone, so it stays readable in both themes."
        align="start"
        code="CategoriesDemo"
      >
        <CategoriesDemo />
      </Stage>

      <Stage
        title="Raised, in a field"
        caption="A value someone put in a field and can lift back out is the raised block: the block's fill and its lift, the label in fg, and corners 2px tighter than the field's so they sit concentric inside it. Token input and Combobox draw their values this way, standing up out of the cut. A disabled field lays them flat again."
        align="start"
        code="RaisedDemo"
      >
        <RaisedDemo />
      </Stage>

      <Stage
        title="In a list of deploys"
        caption="A plain tag says where a build went and a status tag says how it did. Read in grayscale, the words still tell the story."
        align="start"
        code="DeploysDemo"
      >
        <DeploysDemo />
      </Stage>

      <TryIt of="Tag" component={Tag} props={{ children: "In review" }} />
    </Page>
  );
}
