#!/usr/bin/env node
/**
 * A look and its link, under Node, with no build: src/gallery/look.ts, the hand copy of its grammar that paints
 * index.html before any script, and the accents tokens.css answers.
 *
 *   npm run test:look
 *
 * It fails when:
 * - a look does not survive its own link, or anything but the six spellings reads as a look,
 * - the address keeps more than the look on a new page entry, or loses another parameter when the look changes,
 * - index.html's scripts before #root paint another accent than look.ts and the saved choices give, for a link, a
 *   saved accent, both or neither,
 * - tokens.css answers a data-accent that ACCENTS does not name, or ACCENTS names one tokens.css does not answer,
 * - a look's Copy setup asks for an edit it does not need, or misses one it does.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

/* look.ts imports nothing, so a plain transpile runs it, as gen-llms.mjs runs copy-prompt.ts. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "litt-look-"));
const file = path.join(tmp, "look.mjs");
fs.writeFileSync(file, ts.transpileModule(read("src/gallery/look.ts"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
const L = await import(pathToFileURL(file).href);
fs.rmSync(tmp, { recursive: true, force: true });

const problems = [];
const passed = [];
const check = (ok, claim) => (ok ? passed : problems).push(claim);
const SITE = "https://littmd.vercel.app";

/* ---------- the link ---------- */
check(L.LOOKS.length === 6 && new Set(L.LOOKS.map(L.encodeLook)).size === 6, `six looks, six spellings (${L.LOOKS.map(L.encodeLook).join(", ")})`);
for (const look of L.LOOKS) {
  const back = L.decodeLook(L.encodeLook(look));
  check(back !== null && L.sameLook(back, look), `${L.encodeLook(look)} reads back as ${L.lookWords(look)}`);
  check(encodeURIComponent(L.encodeLook(look)) === L.encodeLook(look), `${L.encodeLook(look)} needs no encoding in an address`);
}
for (const raw of ["green", "pink-fun-x", "PINK", "", "fun", "pink,fun", "pink fun", " pink", "blue", "-fun", null, undefined]) {
  check(L.decodeLook(raw) === null, `${JSON.stringify(raw)} is not a look`);
}
check(L.sameLook(L.lookFromSearch("?status=ready&look=pink-fun"), { accent: "pink", fun: true }), "the look reads from a query that holds other parameters");
check(L.lookSearch("?status=ready&look=mono-fun&q=x") === "?look=mono-fun", "a new page entry keeps the look and nothing else");
check(L.lookSearch("?status=ready&look=green") === "" && L.lookSearch("") === "", "a new page entry keeps nothing when the address names no look");
check(
  L.withLook("https://x.test/?status=ready#table", { accent: "pink", fun: false }) === "https://x.test/?status=ready&look=pink#table",
  "setting the look keeps the other parameters and the hash",
);
check(L.withLook("https://x.test/?look=pink&status=ready#table", null) === "https://x.test/?status=ready#table", "removing the look keeps the other parameters and the hash");
check(L.withLook("https://x.test/?look=pink#button", null) === "https://x.test/#button", "removing the only parameter leaves no bare ?");
check(L.withLook("https://x.test/?q=a%20b#table", null) === "https://x.test/?q=a%20b#table", "an address with no look comes back as it was");

/* ---------- the first paint ---------- */
const html = read("index.html");
const body = html.slice(html.indexOf("<body>"), html.indexOf('<div id="root">'));
const scripts = [...body.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
/** The data-accent on <body> after index.html's scripts run, as a browser would before the app: undefined is Blue 4. */
function paint(search, saved) {
  const dataset = {};
  const document = {
    body: { dataset, style: { setProperty() {} } },
    head: { appendChild() {} },
    createElement: () => ({ setAttribute() {} }),
  };
  const localStorage = { getItem: (k) => (k === "litt-gallery:customize" && saved ? JSON.stringify(saved) : null) };
  const context = vm.createContext({ document, localStorage, location: { search }, URLSearchParams });
  for (const s of scripts) vm.runInContext(s, context);
  return dataset.accent;
}
const attributeOf = (accent) => L.ACCENTS.find((a) => a.id === accent).attribute ?? undefined;
const firstPaint = [
  ...L.LOOKS.map((l) => [`?look=${L.encodeLook(l)}`, null, attributeOf(l.accent)]),
  ["?look=mono", { accent: "blue4" }, "mono"],
  ["?status=ready&look=pink", { accent: "blue4" }, "pink"],
  ["?look=blue4", { accent: "pink" }, undefined],
  ["", { accent: "pink" }, "pink"],
  ["", { accent: "blue4" }, undefined],
  ["?look=PINK", { accent: "pink" }, "pink"],
  ["?look=green", { accent: "pink" }, "pink"],
  ["?look=pink-fun-x", null, "mono"],
  ["", null, "mono"],
];
check(scripts.length >= 2, `index.html paints with ${scripts.length} scripts before #root`);
for (const [search, saved, want] of firstPaint) {
  const got = paint(search, saved);
  const own = saved?.accent ?? L.GALLERY_LOOK.accent;
  const model = attributeOf(L.lookFromSearch(search)?.accent ?? own);
  check(got === want && model === want, `"${search}" with ${saved ? `${saved.accent} saved` : "nothing saved"} paints ${want ?? "Blue 4 (no attribute)"} (index.html: ${got ?? "none"}, look.ts: ${model ?? "none"})`);
}

/* ---------- the accents tokens.css answers ---------- */
const answered = new Set([...read("../skills/litt-md/assets/tokens.css").matchAll(/\[data-accent="([^"]+)"\]/g)].map((m) => m[1]));
const named = L.ACCENTS.map((a) => a.attribute).filter((a) => a !== null);
check(L.ACCENTS.filter((a) => a.attribute === null).length === 1, "exactly one accent is tokens.css with no attribute");
check([...answered].every((x) => named.includes(x)), `every data-accent tokens.css answers is an accent here (${[...answered].join(", ")})`);
check(named.every((x) => answered.has(x)), `every accent's data-accent has its block in tokens.css (${named.join(", ")})`);
check(L.ACCENTS.find((a) => a.id === L.REGISTRY_LOOK.accent)?.attribute === null, "the registry's look is the accent with no attribute");

/* ---------- what a look asks a project to change ---------- */
check(L.lookStep(L.REGISTRY_LOOK, SITE) === null && L.lookNote(L.REGISTRY_LOOK) === null, "the registry's own look asks for no step and no note");
for (const look of L.LOOKS) {
  const slug = L.encodeLook(look);
  const attribute = L.ACCENTS.find((a) => a.id === look.accent).attribute;
  const setup = L.lookSetup(look, SITE);
  const asks = (text) => [/data-accent="(\w+)"/.exec(text)?.[1] ?? null, text.includes("<FunMode>")];
  const [setupAttr, setupFun] = asks(setup);
  check(setupAttr === attribute && setupFun === look.fun, `${slug}: Copy setup asks for ${attribute ? `data-accent="${attribute}"` : "no attribute"} and ${look.fun ? "<FunMode>" : "no <FunMode>"}`);
  check(setup.includes(`${SITE}/r/litt.json`) && setup.includes(`${SITE}/r/motion.json`) === look.fun, `${slug}: Copy setup installs litt${look.fun ? " and motion" : ""}`);
  /* Measured in built hosts: each of these on a nested element puts Blue 4 back under it. */
  if (attribute) check(['class="dark"', 'class="light"', "data-theme"].every((root) => setup.includes(root)), `${slug}: Copy setup says a nested class="dark", class="light" or data-theme needs the attribute too`);
  check(setup.endsWith(`See it: ${SITE}/?look=${slug}`), `${slug}: Copy setup ends with the link to the look`);
  const step = L.lookStep(look, SITE);
  if (L.sameLook(look, L.REGISTRY_LOOK)) continue;
  const [stepAttr, stepFun] = asks(step);
  check(stepAttr === attribute && stepFun === look.fun, `${slug}: the Copy prompt's step asks for the same edits`);
}
check(L.lookInApp({ accent: "pink", fun: true }) === 'In your app: data-accent="pink" on <html>, and <FunMode> around the app.', "the panel says Pink and fun mode's edits in one line");
check(L.lookNote(L.GALLERY_LOOK) === "This page shows Monochrome, calm motion. The registry installs Blue 4.", "the Install note says what the gallery shows and what the registry installs instead");

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nlook: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nlook: ${passed.length} claims hold.`);
