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
check(L.LOOKS.length === 18 && new Set(L.LOOKS.map(L.encodeLook)).size === 18, `eighteen looks, eighteen spellings (${L.LOOKS.map(L.encodeLook).join(", ")})`);
check(L.encodeLook(L.GALLERY_LOOK) === "mono-flat" && L.encodeLook(L.REGISTRY_LOOK) === "blue4", "the gallery opens in mono-flat, the registry installs blue4");
check(L.sameLook(L.decodeLook("pink-fun"), { accent: "pink", material: "press", fun: true }), "a link from before Flat reads as press");
check(L.decodeLook("pink-fun-flat") === null, "the material comes before the motion in a slug");
check(L.decodeLook("pink-fun-device") === null && L.decodeLook("pink-flat-device") === null, "one material per slug, before the motion");
check(L.encodeLook({ accent: "mono", material: "device", fun: true }) === "mono-device-fun", "Device spells -device");
for (const look of L.LOOKS) {
  const back = L.decodeLook(L.encodeLook(look));
  check(back !== null && L.sameLook(back, look), `${L.encodeLook(look)} reads back as ${L.lookWords(look)}`);
  check(encodeURIComponent(L.encodeLook(look)) === L.encodeLook(look), `${L.encodeLook(look)} needs no encoding in an address`);
}
for (const raw of ["green", "pink-fun-x", "flat", "pink-flat-flat", "mono-press", "PINK", "", "fun", "pink,fun", "pink fun", " pink", "blue", "-fun", null, undefined]) {
  check(L.decodeLook(raw) === null, `${JSON.stringify(raw)} is not a look`);
}
check(L.sameLook(L.lookFromSearch("?status=ready&look=pink-fun"), { accent: "pink", material: "press", fun: true }), "the look reads from a query that holds other parameters");
check(L.lookSearch("?status=ready&look=mono-fun&q=x") === "?look=mono-fun", "a new page entry keeps the look and nothing else");
check(L.lookSearch("?status=ready&look=green") === "" && L.lookSearch("") === "", "a new page entry keeps nothing when the address names no look");
check(
  L.withLook("https://x.test/?status=ready#table", { accent: "pink", material: "press", fun: false }) === "https://x.test/?status=ready&look=pink#table",
  "setting the look keeps the other parameters and the hash",
);
check(L.withLook("https://x.test/?look=pink&status=ready#table", null) === "https://x.test/?status=ready#table", "removing the look keeps the other parameters and the hash");
check(L.withLook("https://x.test/?look=pink#button", null) === "https://x.test/#button", "removing the only parameter leaves no bare ?");
check(L.withLook("https://x.test/?q=a%20b#table", null) === "https://x.test/?q=a%20b#table", "an address with no look comes back as it was");

/* ---------- the first paint ---------- */
const html = read("index.html");
const body = html.slice(html.indexOf("<body>"), html.indexOf('<div id="root">'));
const scripts = [...body.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
/** What index.html's scripts paint before the app: the data-accent on <body> (undefined is Blue 4) and the
    data-material on <html> (undefined is Press). */
function paint(search, saved) {
  const dataset = {}, rootDataset = {};
  const document = {
    body: { dataset, style: { setProperty() {} } },
    documentElement: { dataset: rootDataset },
    head: { appendChild() {} },
    createElement: () => ({ setAttribute() {} }),
  };
  const localStorage = { getItem: (k) => (k === "litt-gallery:customize" && saved ? JSON.stringify(saved) : null) };
  const context = vm.createContext({ document, localStorage, location: { search }, URLSearchParams });
  for (const s of scripts) vm.runInContext(s, context);
  return `${dataset.accent ?? "blue4"}/${rootDataset.material ?? "press"}`;
}
const attributeOf = (accent) => L.ACCENTS.find((a) => a.id === accent).attribute ?? undefined;
/** What look.ts says the page shows, in paint()'s spelling. */
const modelOf = (search, saved) => {
  const look = L.lookFromSearch(search) ?? {
    accent: L.ACCENTS.some((a) => a.id === saved?.accent) ? saved.accent : L.GALLERY_LOOK.accent,
    material: L.MATERIALS.some((m) => m.id === saved?.material) ? saved.material : L.GALLERY_LOOK.material,
  };
  return `${attributeOf(look.accent) ?? "blue4"}/${look.material}`;
};
const firstPaint = [
  ...L.LOOKS.map((l) => [`?look=${L.encodeLook(l)}`, null, `${attributeOf(l.accent) ?? "blue4"}/${l.material}`]),
  ["?look=mono", { accent: "blue4" }, "mono/press"],
  ["?status=ready&look=pink", { accent: "blue4" }, "pink/press"],
  ["?look=blue4", { accent: "pink", material: "flat" }, "blue4/press"],
  ["?look=pink-flat-fun", { material: "press" }, "pink/flat"],
  ["", { accent: "pink" }, "pink/flat"],
  ["", { material: "press" }, "mono/press"],
  ["", { accent: "blue4" }, "blue4/flat"],
  ["?look=PINK", { accent: "pink" }, "pink/flat"],
  ["?look=green", { accent: "pink" }, "pink/flat"],
  ["?look=pink-fun-x", null, "mono/flat"],
  ["?look=pink-device", { material: "flat" }, "pink/device"],
  ["?look=mono", { material: "device" }, "mono/press"],
  ["", { material: "device" }, "mono/device"],
  ["", { accent: "pink", material: "device" }, "pink/device"],
  ["?look=blue4-flat-device", { material: "device" }, "mono/device"],
  ["", null, "mono/flat"],
];
check(scripts.length >= 2, `index.html paints with ${scripts.length} scripts before #root`);
for (const [search, saved, want] of firstPaint) {
  const got = paint(search, saved);
  const model = modelOf(search, saved);
  check(got === want && model === want, `"${search}" with ${saved ? JSON.stringify(saved) : "nothing"} saved paints ${want} (index.html: ${got}, look.ts: ${model})`);
}

/* ---------- the accents tokens.css answers ---------- */
const answered = new Set([...read("../skills/litt-md/assets/tokens.css").matchAll(/\[data-accent="([^"]+)"\]/g)].map((m) => m[1]));
const named = L.ACCENTS.map((a) => a.attribute).filter((a) => a !== null);
check(L.ACCENTS.filter((a) => a.attribute === null).length === 1, "exactly one accent is tokens.css with no attribute");
check([...answered].every((x) => named.includes(x)), `every data-accent tokens.css answers is an accent here (${[...answered].join(", ")})`);
check(named.every((x) => answered.has(x)), `every accent's data-accent has its block in tokens.css (${named.join(", ")})`);
check(L.ACCENTS.find((a) => a.id === L.REGISTRY_LOOK.accent)?.attribute === null, "the registry's look is the accent with no attribute");
const materialsAnswered = new Set([...read("../skills/litt-md/assets/tokens.css").matchAll(/\[data-material="(\w+)"\]/g)].map((m) => m[1]));
const materialsNamed = L.MATERIALS.map((m) => m.attribute).filter((a) => a !== null);
check(materialsNamed.length === materialsAnswered.size && materialsNamed.every((x) => materialsAnswered.has(x)), `tokens.css answers exactly the materials here (${[...materialsAnswered].join(", ")})`);
check(L.MATERIALS.find((m) => m.id === L.REGISTRY_LOOK.material)?.attribute === null, "the registry's look is the material with no attribute");
check(JSON.stringify(L.lookAttributes({ accent: "mono", material: "flat" }, true)) === JSON.stringify({ "data-theme": "dark", "data-accent": "mono", "data-material": "flat" }), "a nested scope carries the material");
check(JSON.stringify(L.lookAttributes({ accent: "pink", material: "device" }, false)) === JSON.stringify({ "data-theme": "light", "data-accent": "pink", "data-material": "device" }), "a nested scope carries Device");
check(JSON.stringify(L.lookAttributes({ accent: "blue4", material: "press" }, false)) === JSON.stringify({ "data-theme": "light" }), "Blue 4 on press is a theme and nothing else");

/* ---------- what a look asks a project to change ---------- */
check(L.lookStep(L.REGISTRY_LOOK, SITE) === null && L.lookNote(L.REGISTRY_LOOK) === null, "the registry's own look asks for no step and no note");
for (const look of L.LOOKS) {
  const slug = L.encodeLook(look);
  const attribute = L.ACCENTS.find((a) => a.id === look.accent).attribute;
  const setup = L.lookSetup(look, SITE);
  const asks = (text) => [/data-accent="(\w+)"/.exec(text)?.[1] ?? null, text.includes("<FunMode>"), /data-material="(\w+)"/.exec(text)?.[1] ?? "press"];
  const [setupAttr, setupFun, setupMaterial] = asks(setup);
  check(setupMaterial === look.material, `${slug}: Copy setup asks for data-material="${look.material}" exactly when the look is ${look.material}`);
  if (look.material !== "press") check(new RegExp(`needs data-material="${look.material}" too`).test(setup), `${slug}: Copy setup says a nested theme needs data-material too`);
  if (look.material === "device") check(setup.includes("Geist Mono"), `${slug}: Copy setup says Device sets the glass in Geist Mono`);
  check(setupAttr === attribute && setupFun === look.fun, `${slug}: Copy setup asks for ${attribute ? `data-accent="${attribute}"` : "no attribute"} and ${look.fun ? "<FunMode>" : "no <FunMode>"}`);
  check(setup.includes(`${SITE}/r/litt.json`) && setup.includes(`${SITE}/r/motion.json`) === look.fun, `${slug}: Copy setup installs litt${look.fun ? " and motion" : ""}`);
  /* Measured in built hosts: each of these on a nested element puts Blue 4 back under it. */
  if (attribute) check(['class="dark"', 'class="light"', "data-theme"].every((root) => setup.includes(root)), `${slug}: Copy setup says a nested class="dark", class="light" or data-theme needs the attribute too`);
  check(setup.endsWith(`See it: ${SITE}/?look=${slug}`), `${slug}: Copy setup ends with the link to the look`);
  const step = L.lookStep(look, SITE);
  if (L.sameLook(look, L.REGISTRY_LOOK)) continue;
  const [stepAttr, stepFun, stepMaterial] = asks(step);
  check(stepAttr === attribute && stepFun === look.fun && stepMaterial === look.material, `${slug}: the Copy prompt's step asks for the same edits`);
}
check(L.lookInApp({ accent: "pink", material: "press", fun: true }) === 'In your app: data-accent="pink" on <html>, and <FunMode> around the app.', "the panel says Pink and fun mode's edits in one line");
check(L.lookInApp({ accent: "pink", material: "flat", fun: true }) === 'In your app: data-accent="pink" and data-material="flat" on <html>, and <FunMode> around the app.', "the panel says all three edits in one line");
check(L.lookNote(L.GALLERY_LOOK) === "This page shows Monochrome, flat material, calm motion. The registry installs Blue 4 and press material.", "the Install note names the material");

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nlook: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nlook: ${passed.length} claims hold.`);
