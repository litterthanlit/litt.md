/**
 * A look: the accent and motion's feel, the two Customize choices that can leave this browser. A link carries one
 * (?look=pink-fun), and Copy setup turns one into the edits a project makes after it installs litt. Type and shape stay
 * out: litt's rules mark them Change (motion/rules.ts).
 *
 * Every word a look produces lives here. The file imports nothing, so scripts/test-look.mjs and scripts/gen-llms.mjs
 * run it alone under Node. index.html keeps a hand copy of the link's grammar for the first paint, and test-look runs
 * that copy against this one.
 */
export type Accent = "mono" | "blue4" | "pink";
export type Look = { readonly accent: Accent; readonly fun: boolean };
/** A look as a link names it. One spelling per look, and no character URLSearchParams encodes. */
export type LookSlug = Accent | `${Accent}-fun`;
export type AccentInfo = {
  id: Accent;
  name: string;
  short?: string;
  note: string;
  /** The data-accent value tokens.css answers; null for Blue 4, which is tokens.css with no attribute. */
  attribute: "mono" | "pink" | null;
};

/** The accents in the order every picker shows them, each said in words (R5). */
export const ACCENTS: readonly AccentInfo[] = [
  { id: "mono", name: "Monochrome", short: "Mono", note: "The primary action in the ink", attribute: "mono" },
  { id: "blue4", name: "Blue 4", note: "Litt's cobalt, as the registry ships it", attribute: null },
  { id: "pink", name: "Pink", note: "A hot raspberry at Blue 4's weight", attribute: "pink" },
];
export const accentOf = (id: Accent) => ACCENTS.find((a) => a.id === id)!;

/** What the gallery opens in, and what Reset goes back to: a visitor meets the material before the color. */
export const GALLERY_LOOK: Look = { accent: "mono", fun: false };
/** What the registry installs: tokens.css with no attribute, and no <FunMode>. */
export const REGISTRY_LOOK: Look = { accent: "blue4", fun: false };
/** Every look, in picker order. */
export const LOOKS: readonly Look[] = ACCENTS.flatMap((a) => [
  { accent: a.id, fun: false },
  { accent: a.id, fun: true },
]);
/** The link's query parameter. Never one of the Table page's (status, q, sort, site, time). */
export const LOOK_PARAM = "look";

export const sameLook = (a: Look, b: Look) => a.accent === b.accent && a.fun === b.fun;
export const encodeLook = (look: Look): LookSlug => (look.fun ? `${look.accent}-fun` : look.accent);
/** Strict, because it reads the address: anything but a LookSlug is null, and the caller ignores it. */
export const decodeLook = (raw: string | null | undefined): Look | null => LOOKS.find((l) => encodeLook(l) === raw) ?? null;
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

const motionWords = (fun: boolean) => (fun ? "fun motion" : "calm motion");
/** In words (R5): "Pink, fun motion", "Monochrome, calm motion". */
export const lookWords = (look: Look) => `${accentOf(look.accent).name}, ${motionWords(look.fun)}`;

const REGISTRY_WORDS = `${accentOf(REGISTRY_LOOK.accent).name} and ${motionWords(REGISTRY_LOOK.fun)}`;

/** The edits a look asks for, one per choice that differs from the registry's, as numbered setup steps. */
function edits(look: Look): string[] {
  const out: string[] = [];
  const attribute = accentOf(look.accent).attribute;
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
  const attribute = accentOf(look.accent).attribute;
  const changes = [attribute && `data-accent="${attribute}" on <html>`, look.fun && "<FunMode> around the app"].filter(Boolean);
  return changes.length ? `In your app: ${changes.join(", and ")}.` : "This is what the registry installs. Nothing to change.";
}

/** The Install section's line, or null for the look the registry installs: "This page shows Monochrome, calm motion. The registry installs Blue 4." */
export function lookNote(look: Look): string | null {
  if (sameLook(look, REGISTRY_LOOK)) return null;
  const instead = [
    look.accent !== REGISTRY_LOOK.accent && accentOf(REGISTRY_LOOK.accent).name,
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
      ? `${head} The registry installs ${REGISTRY_WORDS}; this changes ${steps.length === 1 ? "one thing" : "two things"} and nothing else.`
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
    `The gallery's Customize panel picks an accent and a motion feel, and a link carries both: ${site}/?${LOOK_PARAM}=${encodeLook({ accent: "pink", fun: true })}#button. ` +
      `Read the look from the link's text and make its edits. The gallery is a single-page app, so fetching the link returns no look. ` +
      `The registry installs \`${encodeLook(REGISTRY_LOOK)}\`, ${motionWords(REGISTRY_LOOK.fun)}. The gallery opens in \`${encodeLook(GALLERY_LOOK)}\`.`,
    [
      `- The link: \`${LOOK_PARAM}=<accent>\` or \`${LOOK_PARAM}=<accent>-fun\`. Anything else is not a look.`,
      ...ACCENTS.map(
        (a) =>
          `- \`${a.id}\`, ${a.name} (${a.note.toLowerCase()}): ` +
          (a.attribute ? `\`data-accent="${a.attribute}"\` on \`<html>\`.` : "no attribute. It is what tokens.css ships."),
      ),
      `- \`-fun\`: wrap the app in \`<FunMode>\` from \`@/lib/litt/motion\` (the motion item). Fun mode is a trial: it changes how litt's parts move, never how they look at rest, and reduced motion turns it off.`,
      `- Put the attribute on \`<html>\` (Next.js app/layout.tsx, Vite index.html), never on a wrapper and never from an effect: there it reaches every portal and paints before any script, in light, dark and the system setting. An element that sets its own theme (\`class="dark"\`, \`class="light"\` or \`data-theme\`) needs it too. Never restate \`--litt-accent\` in CSS.`,
    ].join("\n"),
    `The six looks: ${LOOKS.map((l) => `\`${encodeLook(l)}\` (${lookWords(l)})`).join(", ")}.`,
  ].join("\n\n");
}
