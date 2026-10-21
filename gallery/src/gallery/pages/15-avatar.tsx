import { Avatar, AvatarGroup, type AvatarHue } from "@/components/avatar";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "avatar",
  title: "Avatar",
  lede: "A round mark for a person or a company.",
  order: 15.1,
  group: "Layout",
  summary:
    "A round mark for a person, a client or a company: a photo, or initials on the tint of one of the five data hues. The hue follows from the name, so the same name looks the same everywhere. A group overlaps them and counts the rest. Nothing about it moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["avatar"],
  exports: ["Avatar", "AvatarGroup"],
  usage: `import { Avatar, AvatarGroup } from "@/components/avatar";

// Initials, on a hue that comes from the name. The same name gets the same hue everywhere.
<Avatar name="Ines Duarte" />

// The name is written beside it, so hide the avatar from screen readers.
<div className="flex items-center gap-3">
  <Avatar name="Stripe" decorative />
  <span>Stripe</span>
</div>

// A photo, with the initials as the fallback if it fails to load.
<Avatar name="Ines Duarte" src="/people/ines.jpg" size="lg" />

// A stack: pass the first few, and the total for the "+N" pill.
<AvatarGroup label="Project team, 26 people" total={26} ring="surface-1">
  <Avatar name="Ines Duarte" />
  <Avatar name="Tomas Berg" />
  <Avatar name="Ava Okafor" />
</AvatarGroup>`,
  use: [
    "A person, a client or a company needs a face: a list of senders, an owner column, a profile header.",
    "A row of names is easier to scan with a mark beside each one. The hue is the same every time, so the eye learns it.",
    "A project card shows who works on it. A group shows the first few and counts the rest.",
    "You only have a name. Initials on a hue are a finished mark, not a placeholder, and a photo can replace them later.",
  ],
  skip: [
    "The mark would say how something stands, such as live or failed. Use a Tag with a status. A color on a face is who it is, never a state.",
    "You need every person told apart by color alone. Five hues cannot do it, so two names can share one. Keep the name beside the avatar, or use photos.",
    "It would decorate a heading or a button. An avatar means a who, so use an icon for anything else.",
    "The avatar itself must open a profile. Wrap it in a link or a Button yourself, because an Avatar takes no focus and has no hover.",
  ],
  keyboard: [[["Tab"], "Skips it. An avatar is a mark, so it never takes focus and has no key of its own."]],
  a11y: [
    "Initials are a role=\"img\" named by the name, so a screen reader says \"Ines Duarte\". A photo is an img whose alt is the name.",
    "When the name is written beside the avatar, set decorative. It is hidden from assistive tech and the name is read once. The caller still has to write the name.",
    "A group is a labelled group, such as \"Project team, 26 people\", and the \"+N\" pill is an image named \"22 more\". Write the label for the whole team, not only the faces shown.",
    "The initials are the hue's text tone on its tint, which reaches 4.5:1 in light and dark (check.mjs checks every pair). Neutral is fg-muted on surface-2.",
    "The hue is never the only signal. The name or the initials say who it is, and a hue shared by two names changes nothing for someone who cannot see color.",
    "A photo gets an inset line hairline, so a white photo keeps its edge on a white card. A photo that fails to load falls back to the initials.",
    "Nothing moves and nothing takes focus. At 24px an avatar is too small to press, so if it must be a control, give the control a 32 or 44px target.",
  ],
};

const SENDERS = [
  { name: "Stripe", subject: "Invoice #4821 is ready", when: "9:41" },
  { name: "Ramp", subject: "Your March statement", when: "9:12" },
  { name: "Brex", subject: "Card limit raised to 25,000 USD", when: "Yesterday" },
  { name: "Sidebar Weekly", subject: "Feature on studio tools", when: "Yesterday" },
  { name: "Vercel", subject: "Deploy ready: founder-landing", when: "Mon" },
];

function InboxDemo() {
  return (
    <ul aria-label="Inbox" className="w-full max-w-2xl">
      {SENDERS.map((m) => (
        <li key={m.name} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
          <Avatar name={m.name} decorative />
          <div className="grid min-w-0 flex-1 gap-1 sm:flex sm:items-center sm:gap-4">
            <span className="truncate text-small font-title text-fg sm:w-28 sm:shrink-0">{m.name}</span>
            <span className="truncate text-small text-fg-subtle sm:min-w-0 sm:flex-1">{m.subject}</span>
          </div>
          <span className="shrink-0 font-mono text-caption font-normal text-fg-subtle">{m.when}</span>
        </li>
      ))}
    </ul>
  );
}

const HUES: { hue: AvatarHue; name: string }[] = [
  { hue: "blue", name: "Northwind" },
  { hue: "amber", name: "Ramp" },
  { hue: "teal", name: "Stripe" },
  { hue: "violet", name: "Vercel" },
  { hue: "rose", name: "Brex" },
  { hue: "neutral", name: "Guest" },
];

function SizesAndHuesDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-8">
      <div className="flex flex-wrap items-end gap-8">
        {(["sm", "md", "lg"] as const).map((size, i) => (
          <div key={size} className="grid justify-items-center gap-2">
            <Avatar name="Ines Duarte" size={size} />
            <span className="font-mono text-caption font-normal text-fg-subtle">{["24", "32", "44"][i]}</span>
          </div>
        ))}
      </div>
      <ul aria-label="Hues" className="flex flex-wrap gap-8">
        {HUES.map(({ hue, name }) => (
          <li key={hue} className="grid justify-items-center gap-2">
            <Avatar name={name} hue={hue} size="lg" />
            <span className="font-mono text-caption font-normal text-fg-subtle">{hue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TEAM = ["Ines Duarte", "Tomas Berg", "Priya Nair", "Eli Brandt", "Ava Okafor", "Hana Ito"];

function TeamDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-8">
      <div className="litt-raised flex items-center justify-between gap-4 rounded-surface p-4">
        <div className="grid min-w-0 gap-1">
          <span className="truncate text-body font-title text-fg">Founder landing</span>
          <span className="truncate text-small text-fg-subtle">Marlow Labs, in review</span>
        </div>
        <AvatarGroup label="Project team, 26 people" total={26} ring="surface-1" className="shrink-0">
          {TEAM.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            { ring: "canvas", tile: "bg-canvas" },
            { ring: "surface-1", tile: "bg-surface-1" },
            { ring: "surface-2", tile: "bg-surface-2" },
          ] as const
        ).map(({ ring, tile }) => (
          <div key={ring} className="grid gap-3">
            <div className={`grid place-items-center rounded-surface p-6 shadow-[inset_0_0_0_1px_var(--line)] ${tile}`}>
              <AvatarGroup label={`Team on ${ring}`} ring={ring} max={3}>
                {TEAM.map((name) => (
                  <Avatar key={name} name={name} />
                ))}
              </AvatarGroup>
            </div>
            <span className="text-center font-mono text-caption font-normal text-fg-subtle">ring=&quot;{ring}&quot;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Small inline SVG portraits stand in for photos, so the page never fetches an image. */
function portrait(background: string, skin: string, hair: string, shirt: string) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${background}'/>` +
    `<path d='M10 64c0-13 9-21 22-21s22 8 22 21z' fill='${shirt}'/>` +
    `<circle cx='32' cy='27' r='11' fill='${skin}'/>` +
    `<path d='M20 27c0-9 5-14 13-14s12 5 11 14c-3-5-7-7-12-7s-9 2-12 7z' fill='${hair}'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const INES = portrait("lightsteelblue", "burlywood", "saddlebrown", "slategray");
const TOMAS = portrait("white", "peru", "black", "darkolivegreen");
const BROKEN = "data:image/png;base64,AAAA";

function PhotosDemo() {
  return (
    <ul aria-label="Photos" className="flex flex-wrap items-start gap-8">
      <li className="grid justify-items-center gap-2">
        <Avatar name="Ines Duarte" src={INES} size="lg" />
        <span className="font-mono text-caption font-normal text-fg-subtle">photo</span>
      </li>
      <li className="grid justify-items-center gap-2">
        <Avatar name="Tomas Berg" src={TOMAS} size="lg" />
        <span className="font-mono text-caption font-normal text-fg-subtle">white photo</span>
      </li>
      <li className="grid justify-items-center gap-2">
        <Avatar name="Ava Okafor" src={BROKEN} size="lg" />
        <span className="font-mono text-caption font-normal text-fg-subtle">fails to load</span>
      </li>
      <li className="grid justify-items-center gap-2">
        <AvatarGroup label="Photos and initials" size="lg" ring="surface-1">
          <Avatar name="Ines Duarte" src={INES} />
          <Avatar name="Tomas Berg" src={TOMAS} />
          <Avatar name="Priya Nair" />
        </AvatarGroup>
        <span className="font-mono text-caption font-normal text-fg-subtle">mixed</span>
      </li>
    </ul>
  );
}

export default function AvatarPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Senders in an inbox"
        align="start"
        code="InboxDemo"
        caption="The name is written beside each avatar, so the avatar is decorative and a screen reader hears the name once. Each sender keeps the hue its name gives it, so Stripe is the same color here as in every other list. The hue is who it is, not what the mail is about. Nothing moves."
      >
        <InboxDemo />
      </Stage>

      <Stage
        title="Sizes and hues"
        align="start"
        code="SizesAndHuesDemo"
        caption="Small is 24 for dense rows and md is 32 for list rows. Large is 44 for a profile header. Initials step from caption to small to body, always at weight 400. The fill is the hue's tint, the letters are its text tone, and a hairline of the hue edges the circle, like a hue tag. Neutral is for a mark with no identity color."
      >
        <SizesAndHuesDemo />
      </Stage>

      <Stage
        title="A team stack"
        align="start"
        code="TeamDemo"
        caption="Avatars overlap by a quarter of their size with the first on top. Each has a 2px ring in the surface it sits on, drawn as a zero-offset shadow, so the box never changes. The group shows the first few and counts the rest, from the total when only some are passed. Match the ring to the surface, or the cut-out shows."
      >
        <TeamDemo />
      </Stage>

      <Stage
        title="Photos"
        align="start"
        code="PhotosDemo"
        caption="A photo fills the circle and a line hairline sits over it, so a white photo keeps its edge. If the photo fails to load, the initials take its place. These portraits are small inline images, so the page fetches nothing."
      >
        <PhotosDemo />
      </Stage>
    </Page>
  );
}
