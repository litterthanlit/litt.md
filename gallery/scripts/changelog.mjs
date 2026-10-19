/**
 * The registry changelog: gallery/CHANGELOG.md, written by hand, read by three scripts.
 *   gen-docs.mjs      writes src/generated/changelog.json for the gallery's Changelog page
 *   gen-registry.mjs  gives every item its version (the newest release that names it) and keeps registry.lock.json
 *   gen-llms.mjs      serves the file at /changelog.md
 *
 * The format is strict, so a typo fails the build instead of shipping a wrong version:
 *
 *   ## 2026-10-19 · Staples, agent UI, versions      one release per date, newest first; its version is 2026.10.19
 *
 *   Optional paragraphs: what the release is about.
 *
 *   - **added** `combobox`, `date-picker`: what it is.
 *   - **changed** `menu`: what changed for someone who installed it.
 *   - **breaking** `litt`: what breaks.
 *     Migrate: what to change in your code.      an indented line continues the entry; "Migrate:" starts the steps
 *
 * Kinds: added, changed, fixed, breaking, removed. Every name is a registry item, except after removed.
 * Everything above the first release heading is the file's introduction.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** $LITT_CHANGELOG_FILE points the scripts at another file, for testing them; nothing else sets it. */
export const CHANGELOG_FILE = path.resolve(process.env.LITT_CHANGELOG_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "CHANGELOG.md"));
export const KINDS = ["added", "changed", "fixed", "breaking", "removed"];

const RELEASE = /^## (\d{4})-(\d{2})-(\d{2}) · (\S.*)$/;
const ENTRY = /^- \*\*([a-z]+)\*\* ((?:`[a-z0-9-]+`(?:, )?)+): (\S.*)$/;

/**
 * Parse the changelog text. Returns { intro, releases: [{ version, date, title, intro, entries: [{ kind, items, text, migrate? }] }] },
 * newest first. Throws with the line number on anything it does not understand.
 */
export function parseChangelog(text, where = "CHANGELOG.md") {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const fail = (n, msg) => { throw new Error(`${where}:${n + 1}: ${msg}`); };
  if (!/^# Changelog\s*$/.test(lines[0] ?? "")) fail(0, 'the file starts with "# Changelog"');

  const intro = [];
  const releases = [];
  let release = null;
  let entry = null;
  let para = [];
  const flushPara = () => {
    if (!para.length) return;
    (release ? release.intro : intro).push(para.join(" "));
    para = [];
  };

  for (let n = 1; n < lines.length; n++) {
    const line = lines[n];
    const head = RELEASE.exec(line);
    if (head) {
      flushPara();
      entry = null;
      const [, y, m, d, title] = head;
      const date = `${y}-${m}-${d}`;
      if (Number.isNaN(Date.parse(date + "T00:00:00Z")) || new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date) fail(n, `${date} is not a date`);
      release = { version: `${y}.${m}.${d}`, date, title: title.trim(), intro: [], entries: [] };
      releases.push(release);
      continue;
    }
    if (line.startsWith("#")) fail(n, 'a release heading reads "## YYYY-MM-DD · Title"');
    if (line.startsWith("- ")) {
      flushPara();
      if (!release) fail(n, "an entry comes after a release heading");
      const m = ENTRY.exec(line);
      if (!m) fail(n, 'an entry reads "- **kind** `item`, `item`: text"');
      const [, kind, names, body] = m;
      if (!KINDS.includes(kind)) fail(n, `"${kind}" is not one of ${KINDS.join(", ")}`);
      entry = { kind, items: [...names.matchAll(/`([a-z0-9-]+)`/g)].map((x) => x[1]), text: body.trim() };
      release.entries.push(entry);
      continue;
    }
    if (/^ {2}\S/.test(line)) {
      if (!entry) fail(n, "an indented line continues an entry");
      const rest = line.trim();
      if (rest.startsWith("Migrate:")) {
        if (entry.migrate) fail(n, "an entry has one Migrate line");
        entry.migrate = rest.slice("Migrate:".length).trim();
      } else if (entry.migrate) entry.migrate += " " + rest;
      else entry.text += " " + rest;
      continue;
    }
    if (line.trim() === "") { flushPara(); entry = null; continue; }
    if (entry) fail(n, "text right after an entry must be indented two spaces, or be its own paragraph after a blank line");
    para.push(line.trim());
  }
  flushPara();

  if (!releases.length) fail(lines.length - 1, "there is no release");
  for (let i = 1; i < releases.length; i++) {
    if (releases[i].date >= releases[i - 1].date) throw new Error(`${where}: releases go newest first, one per date (${releases[i - 1].date} then ${releases[i].date})`);
  }
  for (const r of releases) if (!r.entries.length) throw new Error(`${where}: the ${r.date} release has no entries`);
  return { intro, releases };
}

export function readChangelog() {
  return parseChangelog(fs.readFileSync(CHANGELOG_FILE, "utf8"));
}

/**
 * The version of each item: the newest release that names it in an entry other than removed.
 * Fails on a name that is not an item (removed entries may name items that are gone).
 */
export function itemVersions(changelog, itemNames) {
  const known = new Set(itemNames);
  const gone = new Set(); // removed in a newer release, so older entries may still name it
  const versions = new Map();
  for (const r of changelog.releases) {
    for (const e of r.entries) {
      for (const name of e.items) {
        if (e.kind === "removed") {
          if (known.has(name) && !versions.has(name)) throw new Error(`CHANGELOG.md: ${r.date} removes "${name}", but it is still an item and no later release adds it back`);
          gone.add(name);
          continue;
        }
        if (!known.has(name)) {
          if (gone.has(name)) continue;
          throw new Error(`CHANGELOG.md: ${r.date} names "${name}", which is not a registry item (${e.kind}). Use the item name from registry.json.`);
        }
        if (!versions.has(name)) versions.set(name, r.version);
      }
    }
  }
  const missing = itemNames.filter((n) => !versions.has(n));
  if (missing.length) throw new Error(`CHANGELOG.md: no release names ${missing.join(", ")}. Add an "added" entry under today's release.`);
  return versions;
}

/** Compare release versions: a positive number when a is newer. */
export const compareVersions = (a, b) => (a === b ? 0 : a > b ? 1 : -1);
