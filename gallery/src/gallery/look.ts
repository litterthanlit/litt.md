/**
 * A look: the accent, the material and motion's feel, the three Customize choices that can leave this browser. A link
 * carries one (?look=pink-flat-fun), and Copy setup turns one into the edits a project makes after it installs litt. Type
 * and shape stay out: litt's rules mark them Change (motion/rules.ts).
 *
 * Every word a look produces lives here. The file imports nothing, so scripts/test-look.mjs and scripts/gen-llms.mjs
 * run it alone under Node. index.html keeps a hand copy of the link's grammar for the first paint, and test-look runs
 * that copy against this one.
 */
/** "world" is the world's own accent (proposals/worlds.md, decision 14): Blue 4 on Press, the ink on Flat, orange on
    Device, tokens.css with no data-accent. The others ask for one accent in any world. */
export type Accent = "world" | "blue4" | "mono" | "pink";
/** The depth ladder said in press (raised blocks in sunken trays, lit from the top), flat (fill alone, on greys) or device
    (keys, wells and LCD glass on an aluminium body, proposals/device.md). */
export type Material = "press" | "flat" | "device";
export type Look = { readonly accent: Accent; readonly material: Material; readonly fun: boolean };
/** A look as a link names it: the world alone for its own accent (flat), else the accent, then -flat or -device (pink-flat;
    a look without a material is press), then -fun. One spelling per look, and no character URLSearchParams encodes. */
export type LookSlug = `${Material | `${Exclude<Accent, "world">}${"" | "-flat" | "-device"}`}${"" | "-fun"}`;
export type AccentInfo = {
  id: Accent;
  name: string;
  short?: string;
  note: string;
  /** The data-accent value tokens.css answers; null for the world's own, which is tokens.css with no attribute. */
  attribute: "blue" | "mono" | "pink" | null;
};

/** The accents a look can ask for, each said in words (R5). The world's own comes first and is named by its world. */
export const ACCENTS: readonly AccentInfo[] = [
  { id: "world", name: "The world's own", note: "Blue 4 on Press, the ink on Flat, orange on Device", attribute: null },
  { id: "blue4", name: "Blue 4", note: "Litt's cobalt, Press's own", attribute: "blue" },
  { id: "mono", name: "Monochrome", short: "Mono", note: "The primary action in the ink, Flat's own", attribute: "mono" },
  { id: "pink", name: "Pink", note: "A hot raspberry at Blue 4's weight", attribute: "pink" },
];
export const accentOf = (id: Accent) => ACCENTS.find((a) => a.id === id)!;

/**
 * What a world says about itself on its page (proposals/worlds.md): each is one short line, said in words (R5).
 * The gallery renders them as the Foundations cards; llms.txt ships them to agents.
 */
export type WorldFoundations = {
  color: string;
  type: string;
  light: string;
  shape: string;
  motion: string;
};
export type MaterialInfo = {
  id: Material;
  name: string;
  note: string;
  /** The data-material value tokens.css answers; null for Press, which is tokens.css with no attribute. */
  attribute: "flat" | "device" | null;
  /** The world's own accent, which it shows with no data-accent: an accent a look can ask for, or null for one only
      this world has (Device's orange). Asking for it in this world is the same as asking for nothing. */
  ownAccent: Exclude<Accent, "world"> | null;
  /** The own accent's name, said wherever the world's own is picked. */
  accentName: string;
  /** The world's own face, which it sets with no face chosen (typeface.ts has the stacks). */
  face: string;
  /** The world's one line, under its name on its page and on the home's hero. */
  tagline: string;
  /** Who the world is for, as the lede under the tagline. */
  audience: string;
  /** The world as a system, in one line: what it is like, then who it is for. Under its card on the Systems page. */
  line: string;
  /** The block page (src/gallery/pages/30-*.tsx, meta.block) the world opens on, live at real size. */
  hero: string;
  /** Its motion language in one line (foundations.md, Motion languages). */
  foundations: WorldFoundations;
  /** What only this world can do (proposals/worlds.md, Depth): three or four lines, each an ability, for Only here. */
  abilities: string[];
};
/**
 * The materials in the order every picker shows them. A material is a world (proposals/worlds.md, decision 3): a page
 * you arrive on, named after it, with the one component tree under it. The world page's id is the material's id, and
 * the current world is look.material, so nothing here is state.
 */
export const MATERIALS: readonly MaterialInfo[] = [
  {
    id: "press",
    name: "Press",
    note: "Raised blocks in sunken trays, lit from the top",
    attribute: null,
    ownAccent: "blue4",
    accentName: "Blue 4",
    face: "Helvetica Neue",
    tagline: "Lit from above. Objects you can hold.",
    audience: "Product UI, settings and dashboards. What the registry installs.",
    line: "Lit and solid, for product UI, settings and dashboards",
    hero: "dashboard",
    foundations: {
      color: "Warm stone neutrals at one hue, and Blue 4, its own accent, as the one fill. A project may ask for monochrome or pink.",
      type: "Helvetica Neue in three weights by role: text 400, titles 500, 12px labels 600. Nothing above 18px.",
      light: "One light from the top. Blocks rise from sunken trays, caps ride in slots, glass floats over the page.",
      shape: "Controls 4px, surfaces 8px, pills only for avatars and icon-only buttons, every corner concentric.",
      motion: "Things have weight. A set settles into place from above on the expressive spring; an overlay rises and settles. Nothing flies.",
    },
    abilities: [
      "One light from above: every raised thing catches it on its top edge and casts below.",
      "Glass that floats: overlays are frosted, lit and ringed, over anything.",
      "Caps in slots: a slider's cap rides in a slot and casts 3px, a thing you can hold.",
      "A press that sinks: a pressed block goes half a pixel down and its cast tightens.",
    ],
  },
  {
    id: "flat",
    name: "Flat",
    note: "Grey fills and hairlines, nothing casts",
    attribute: "flat",
    ownAccent: "mono",
    accentName: "Monochrome",
    face: "Geist",
    tagline: "Grey is the object. Nothing casts.",
    audience: "Sites, portfolios and reading. What the gallery opens in.",
    line: "Grey and quiet, for sites, portfolios and reading",
    hero: "case-study",
    foundations: {
      color: "The same neutrals at chroma 0: neutral grey, nothing warm. Its own accent is the ink, so the primary action is black on white. A project may ask for Blue 4 or pink; the data hues are unchanged.",
      type: "Geist in three weights by role: text 400, titles 500, 12px labels 600. Nothing above 18px.",
      light: "None. The depth ladder is said by fill alone: grey is the object, a hairline is the place.",
      shape: "As Press: 4px, 8px and the pill, concentric.",
      motion: "Things come from where you touched them. A set deals out of what opened it and gathers back; an overlay grows from its opener.",
    },
    abilities: [
      "Soft focus on a hand: a swap you cause arrives out of focus and settles, never on scroll.",
      "Deal and gather: a set comes out of what you touched and goes back into it.",
      "The pill: one shape for every control, a circle for a one-symbol key.",
      "No lines between things: grey is the object, a hairline is the place.",
    ],
  },
  {
    id: "device",
    name: "Device",
    note: "Keys and dark LCD screens on an aluminium body, full mono, an orange accent",
    attribute: "device",
    ownAccent: null,
    accentName: "Orange",
    face: "Geist Mono",
    tagline: "Hardware. Keys, wells and LCD glass, every word in the mono.",
    audience: "Agents, terminals and tools.",
    line: "Keys and glass, for agents, terminals and tools",
    hero: "agent",
    foundations: {
      color: "A cool aluminium body, dark LCD screens for panels and overlays, orange as its own accent, the hues retuned to the body. A project may ask for Blue 4, monochrome or pink.",
      type: "Geist Mono for every word, in the three role weights. 12px labels are engraved capitals.",
      light: "Hardware. Plates on the body, wells cut into it, keys on a 2px skirt that sink the whole 2px, fields behind glass.",
      shape: "As Press: 4px, 8px and the pill, concentric.",
      motion: "Things are mechanisms. A set switches on in place in steps, as a display's segments light; an overlay switches on where it stands. Nothing fades or travels.",
    },
    abilities: [
      "LCD readouts: what you type and what the machine says sit behind dark glass, light ink in the mono.",
      "Keys on a skirt: every button is a key that sinks its whole 2px when pressed.",
      "Engraved labels: 12px labels are capitals cut into the body.",
      "Mechanisms for an agent at work: segments, a tuner, meters, a dot matrix, step lights and tape reels, moving only while tokens arrive.",
    ],
  },
];
export const materialOf = (id: Material) => MATERIALS.find((m) => m.id === id)!;
/** One spelling per look: the world's own accent asked for by name is the world's own. */
export const canonicalAccent = (accent: Accent, material: Material): Accent => (accent === materialOf(material).ownAccent ? "world" : accent);
/** An accent's name in a material: the world's own is named by its world (Blue 4, Monochrome, Orange). */
export const accentName = (accent: Accent, material: Material, short = false) => {
  const a = canonicalAccent(accent, material);
  if (a === "world") return materialOf(material).accentName;
  return short ? (accentOf(a).short ?? accentOf(a).name) : accentOf(a).name;
};
/** The accents a picker offers in a material, the world's own first, then every other it can ask for. */
export const accentsIn = (material: Material): readonly AccentInfo[] => ACCENTS.filter((a) => a.id !== materialOf(material).ownAccent);
/** The data-accent a look puts on <html>: none for the world's own. */
export const accentAttribute = (accent: Accent, material: Material) => accentOf(canonicalAccent(accent, material)).attribute;

/** What the gallery opens in, and what Reset goes back to: Flat's own, so a visitor meets the material before the color. */
export const GALLERY_LOOK: Look = { accent: "world", material: "flat", fun: false };
/** What the registry installs: tokens.css with no attribute (Press, Blue 4), and no <FunMode>. */
export const REGISTRY_LOOK: Look = { accent: "world", material: "press", fun: false };
/** Every look, in picker order: material, then its accents (its own first), then motion. */
export const LOOKS: readonly Look[] = MATERIALS.flatMap((m) =>
  accentsIn(m.id).flatMap((a) => [
    { accent: a.id, material: m.id, fun: false },
    { accent: a.id, material: m.id, fun: true },
  ]),
);
/** The link's query parameter. Never one of the Table page's (status, q, sort, site, time). */
export const LOOK_PARAM = "look";

/** The same look on screen: Monochrome asked for on Flat is Flat's own. */
export const sameLook = (a: Look, b: Look) =>
  a.material === b.material && a.fun === b.fun && canonicalAccent(a.accent, a.material) === canonicalAccent(b.accent, b.material);
export const encodeLook = (look: Look): LookSlug => {
  const accent = canonicalAccent(look.accent, look.material);
  const head = accent === "world" ? look.material : `${accent}${look.material === "press" ? "" : `-${look.material}`}`;
  return `${head}${look.fun ? "-fun" : ""}` as LookSlug;
};
/** The link's grammar. index.html keeps a hand copy for the first paint, and test-look runs it against this one. */
const SLUG = /^(?:(press|flat|device)|(blue4|mono|pink)(?:-(flat|device))?)(-fun)?$/;
/** Strict, because it reads the address: anything but the grammar is null, and the caller ignores it. A link from before
    decision 14 still reads: blue4 is press, mono-flat is flat, each the world's own. */
export const decodeLook = (raw: string | null | undefined): Look | null => {
  const m = SLUG.exec(raw ?? "");
  if (!m) return null;
  const material = (m[1] ?? m[3] ?? "press") as Material;
  return { accent: canonicalAccent((m[2] ?? "world") as Accent, material), material, fun: !!m[4] };
};
export const lookFromSearch = (search: string) => decodeLook(new URLSearchParams(search).get(LOOK_PARAM));

/** The query a new page entry keeps (route.ts): the look, and nothing else. */
export function lookSearch(search: string): "" | `?look=${LookSlug}` {
  const look = lookFromSearch(search);
  return look ? (`?${LOOK_PARAM}=${encodeLook(look)}` as const) : "";
}

/** An absolute href with the look set, or removed for null. Every other parameter and the hash stay. */
export function withLook(href: string, look: Look | null): string {
  const url = new URL(href);
  if (look) url.searchParams.set(LOOK_PARAM, encodeLook(look));
  else if (url.searchParams.has(LOOK_PARAM)) url.searchParams.delete(LOOK_PARAM);
  else return href;
  return url.href;
}

/**
 * The attributes that draw a part of the page in one look, whatever <html> and <body> run: the theme the part is in (a
 * [data-theme] root declares Blue 4 and the press material again), its accent and its material. A preview, a chip and
 * anything else that sets its own theme spreads these.
 */
export function lookAttributes(look: Pick<Look, "accent" | "material">, dark: boolean) {
  const out: { "data-theme": "light" | "dark"; "data-accent"?: "blue" | "mono" | "pink"; "data-material"?: "flat" | "device" } = { "data-theme": dark ? "dark" : "light" };
  const accent = accentAttribute(look.accent, look.material), material = materialOf(look.material).attribute;
  if (accent) out["data-accent"] = accent;
  if (material) out["data-material"] = material;
  return out;
}

const motionWords = (fun: boolean) => (fun ? "fun motion" : "calm motion");
const materialWords = (material: Material) => `${material} material`;
/** In words (R5): "Pink, flat material, fun motion", "Monochrome, press material, calm motion". */
export const lookWords = (look: Look) => `${accentName(look.accent, look.material)}, ${materialWords(look.material)}, ${motionWords(look.fun)}`;

const REGISTRY_WORDS = `${accentName(REGISTRY_LOOK.accent, REGISTRY_LOOK.material)} in ${materialOf(REGISTRY_LOOK.material).face}, ${materialWords(REGISTRY_LOOK.material)} and ${motionWords(REGISTRY_LOOK.fun)}`;
const COUNT = ["no things", "one thing", "two things", "three things"];

/** The edits a look asks for, one per choice that differs from the registry's, as numbered setup steps. */
function edits(look: Look): string[] {
  const out: string[] = [];
  const attribute = accentAttribute(look.accent, look.material);
  if (attribute) {
    const attr = `data-accent="${attribute}"`;
    out.push(
      [
        `The accent: ${attr} on <html>.`,
        `   Next.js, app/layout.tsx: <html lang="en" ${attr}>    Vite, index.html: <html lang="en" ${attr}>`,
        `   On <html> it reaches every portal and paints before any script, in light, dark and the system setting. Never set it from an effect, and never restate --litt-accent in CSS.`,
        `   An element that sets its own theme (class="dark", class="light" or data-theme) needs ${attr} too.`,
      ].join("\n"),
    );
  }
  const material = materialOf(look.material).attribute;
  if (material) {
    const attr = `data-material="${material}"`;
    out.push(
      [
        `The material: ${attr} on <html>.`,
        `   Next.js, app/layout.tsx: <html lang="en" ${attr}>    Vite, index.html: <html lang="en" ${attr}>`,
        material === "flat"
          ? `   Flat says the depth ladder by fill alone, on neutral greys: nothing casts and nothing catches the light. Its own accent is the ink and its face Geist (load it at 400, 500 and 600). Never set it from an effect.`
          : `   Device says the depth ladder in hardware: an aluminium body, keys that sink 2px, dark LCD screens for panels and overlays, orange as its own accent, and every word in Geist Mono (load it at 400, 500 and 600). Never set it from an effect.`,
        `   An element that sets its own theme (class="dark", class="light" or data-theme) needs ${attr} too.`,
      ].join("\n"),
    );
  }
  if (look.fun) {
    out.push(
      [
        `The motion: fun mode, a trial. import { FunMode } from "@/lib/litt/motion"`,
        `   Next.js, app/layout.tsx: <body><FunMode>{children}</FunMode></body>    Vite, src/main.tsx: <FunMode><App /></FunMode>`,
        `   It changes how litt's parts move, never how they look at rest, and reduced motion turns it off. If the trial ends, the changelog says so, and removing the wrapper is the whole change.`,
      ].join("\n"),
    );
  }
  return out;
}

const seeIt = (look: Look, site: string) => `See it: ${site}/?${LOOK_PARAM}=${encodeLook(look)}`;
const installLine = (items: string[], site: string) => `npx shadcn@latest add ${items.map((i) => `${site}/r/${i}.json`).join(" ")}`;

/** The Customize panel's one line: what a project changes for this look. */
export function lookInApp(look: Look): string {
  const attributes = [accentAttribute(look.accent, look.material), materialOf(look.material).attribute]
    .map((value, i) => value && `data-${i ? "material" : "accent"}="${value}"`)
    .filter(Boolean);
  const changes = [attributes.length && `${attributes.join(" and ")} on <html>`, look.fun && "<FunMode> around the app"].filter(Boolean);
  return changes.length ? `In your app: ${changes.join(", and ")}.` : "This is what the registry installs. Nothing to change.";
}

/** The Install section's line, or null for the look the registry installs: "This page shows Monochrome, calm motion. The registry installs Blue 4." */
export function lookNote(look: Look): string | null {
  if (sameLook(look, REGISTRY_LOOK)) return null;
  const instead = [
    accentName(look.accent, look.material) !== accentName(REGISTRY_LOOK.accent, REGISTRY_LOOK.material) && accentName(REGISTRY_LOOK.accent, REGISTRY_LOOK.material),
    look.material !== REGISTRY_LOOK.material && materialWords(REGISTRY_LOOK.material),
    look.fun !== REGISTRY_LOOK.fun && motionWords(REGISTRY_LOOK.fun),
  ].filter(Boolean);
  return `This page shows ${lookWords(look)}. The registry installs ${instead.join(" and ")}.`;
}

/** Copy setup: what a person pastes into their coding agent, or follows by hand. `site` is where the gallery is served. */
export function lookSetup(look: Look, site: string): string {
  const steps = edits(look);
  const head = `Set up the litt.md look "${lookWords(look)}" in this project.`;
  return [
    steps.length
      ? `${head} The registry installs ${REGISTRY_WORDS}; this changes ${COUNT[steps.length]} and nothing else.`
      : `${head} It is what the registry installs.`,
    `1. ${installLine(look.fun ? ["litt", "motion"] : ["litt"], site)}   (skip what is installed)`,
    ...steps.map((s, i) => `${i + 2}. ${s}`),
    ...(steps.length ? [] : ["That is the whole look."]),
    seeIt(look, site),
  ].join("\n");
}

/** The Copy prompt's "Match the look" step, after the install; null for the look the registry installs. */
export function lookStep(look: Look, site: string): string | null {
  if (sameLook(look, REGISTRY_LOOK)) return null;
  return [
    `The page showed ${lookWords(look)}. The registry installs ${REGISTRY_WORDS}, so make these edits too.`,
    ...(look.fun ? [`Fun mode needs litt's motion engine: ${installLine(["motion"], site)}   (skip it if it is installed)`] : []),
    ...edits(look).map((s) => `- ${s}`),
    seeIt(look, site),
  ].join("\n");
}

/** llms.txt's "## Looks" section, for an agent handed a gallery link. */
export function looksDoc(site: string): string {
  return [
    `A look is the gallery's material (its world, chosen in the nav or on the deck), accent and motion feel (the Customize panel), and a link carries all three: ${site}/?${LOOK_PARAM}=${encodeLook({ accent: "pink", material: "flat", fun: true })}#button. ` +
      `Read the look from the link's text and make its edits. The gallery is a single-page app, so fetching the link returns no look. ` +
      `The registry installs \`${encodeLook(REGISTRY_LOOK)}\`, ${materialWords(REGISTRY_LOOK.material)}, ${motionWords(REGISTRY_LOOK.fun)}. The gallery opens in \`${encodeLook(GALLERY_LOOK)}\`.`,
    [
      `- The link: the world alone for its own accent (\`flat\`, \`device-fun\`), or \`${LOOK_PARAM}=<accent>\`, then \`-flat\` or \`-device\` for the material, then \`-fun\` for fun mode, in that order (\`pink-flat-fun\`, \`mono-device\`). Anything else is not a look, and an accent without a material is press.`,
      `- Each world has its own accent and face, with no attribute: ${MATERIALS.map((m) => `${m.name} is ${m.accentName} in ${m.face}`).join(", ")}. An accent asked for wins in every world.`,
      ...ACCENTS.filter((a) => a.attribute).map(
        (a) => `- \`${a.id}\`, ${a.name} (${a.note[0]!.toLowerCase() + a.note.slice(1)}): \`data-accent="${a.attribute}"\` on \`<html>\`, except in the world whose own it is, which needs nothing.`,
      ),
      ...MATERIALS.map(
        (m) =>
          `- ${m.attribute ? `\`-${m.attribute}\`` : "No material"}, ${m.name} (${m.note[0]!.toLowerCase() + m.note.slice(1)}): ` +
          (m.attribute ? `\`data-material="${m.attribute}"\` on \`<html>\`.` : "no attribute. It is what tokens.css ships."),
      ),
      `- \`-fun\`: wrap the app in \`<FunMode>\` from \`@/lib/litt/motion\` (the motion item). Fun mode is a trial: it changes how litt's parts move, never how they look at rest, and reduced motion turns it off.`,
      `- Put each attribute on \`<html>\` (Next.js app/layout.tsx, Vite index.html), never on a wrapper and never from an effect: there it reaches every portal and paints before any script, in light, dark and the system setting. An element that sets its own theme (\`class="dark"\`, \`class="light"\` or \`data-theme\`) needs them too. Never restate \`--litt-accent\` or the neutrals in CSS.`,
    ].join("\n"),
    `The ${LOOKS.length} looks: ${LOOKS.map((l) => `\`${encodeLook(l)}\` (${lookWords(l)})`).join(", ")}.`,
  ].join("\n\n");
}
