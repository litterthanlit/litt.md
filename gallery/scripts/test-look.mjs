#!/usr/bin/env node
/**
 * A look and its link, under Node, with no build: src/gallery/look.ts, the hand copy of its grammar that paints
 * index.html before any script, and the accents tokens.css answers.
 *
 *   npm run test:look
 *
 * It fails when:
 * - a look does not survive its own link, or anything but its spellings (and the links from before decision 14) reads as a look,
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
check(L.LOOKS.length === 28 && new Set(L.LOOKS.map(L.encodeLook)).size === 28, `twenty-eight looks, twenty-eight spellings (${L.LOOKS.map(L.encodeLook).join(", ")})`);
check(L.encodeLook(L.GALLERY_LOOK) === "flat" && L.encodeLook(L.REGISTRY_LOOK) === "press", "the gallery opens in flat, the registry installs press, each the world's own accent");
check(L.sameLook(L.decodeLook("pink-fun"), { accent: "pink", material: "press", fun: true }), "a link from before Flat reads as press");
check(L.encodeLook(L.decodeLook("blue4")) === "press" && L.encodeLook(L.decodeLook("mono-flat")) === "flat" && L.encodeLook(L.decodeLook("mono-flat-fun")) === "flat-fun", "a link from before decision 14 reads as the world's own: blue4 is press, mono-flat is flat");
check(L.encodeLook(L.decodeLook("blue4-flat")) === "blue4-flat" && L.encodeLook(L.decodeLook("blue4-device")) === "blue4-device", "Blue 4 asked for on Flat or Device is its own look");
check(L.sameLook({ accent: "mono", material: "flat", fun: false }, L.GALLERY_LOOK) && !L.sameLook({ accent: "mono", material: "press", fun: false }, L.REGISTRY_LOOK), "Monochrome asked for on Flat is Flat's own, and on Press is not");
check(L.accentName("world", "press") === "Blue 4" && L.accentName("world", "flat") === "Monochrome" && L.accentName("world", "device") === "Orange" && L.accentName("world", "rack") === "Yellow", "each world names its own accent");
check(L.accentsIn("press").map((a) => a.id).join() === "world,mono,pink" && L.accentsIn("flat").map((a) => a.id).join() === "world,blue4,pink" && L.accentsIn("device").map((a) => a.id).join() === "world,blue4,mono,pink", "a picker offers the world's own first, then every other accent");
check(L.decodeLook("pink-fun-flat") === null, "the material comes before the motion in a slug");
check(L.decodeLook("pink-fun-device") === null && L.decodeLook("pink-flat-device") === null, "one material per slug, before the motion");
check(L.encodeLook({ accent: "mono", material: "device", fun: true }) === "mono-device-fun", "Device spells -device");
check(L.encodeLook({ accent: "pink", material: "rack", fun: true }) === "pink-rack-fun" && L.encodeLook(L.decodeLook("rack")) === "rack" && L.decodeLook("pink-rack-device") === null, "Rack spells -rack, and one material per slug");
check(L.accentsIn("rack").map((a) => a.id).join() === "world,blue4,mono,pink", "Rack's yellow is its own, so it offers every other accent");
for (const look of L.LOOKS) {
  const back = L.decodeLook(L.encodeLook(look));
  check(back !== null && L.sameLook(back, look), `${L.encodeLook(look)} reads back as ${L.lookWords(look)}`);
  check(encodeURIComponent(L.encodeLook(look)) === L.encodeLook(look), `${L.encodeLook(look)} needs no encoding in an address`);
}
for (const raw of ["green", "pink-fun-x", "flat-flat", "press-flat", "world", "world-flat", "pink-flat-flat", "mono-press", "PINK", "", "fun", "pink,fun", "pink fun", " pink", "blue", "-fun", null, undefined]) {
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
/** What index.html's scripts paint before the app: the data-accent on <body> (none is the world's own) and the
    data-material on <html> (undefined is Press). */
function paint(search, saved, hash = "") {
  const dataset = {}, rootDataset = {};
  const document = {
    body: { dataset, style: { setProperty() {} } },
    documentElement: { dataset: rootDataset, style: { setProperty() {} } },
    head: { appendChild() {} },
    createElement: () => ({ setAttribute() {} }),
  };
  const localStorage = { getItem: (k) => (k === "litt-gallery:customize" && saved ? JSON.stringify(saved) : null) };
  const context = vm.createContext({ document, localStorage, location: { search, hash }, URLSearchParams });
  for (const s of scripts) vm.runInContext(s, context);
  return `${dataset.accent ?? "none"}/${rootDataset.material ?? "press"}`;
}
/** What look.ts says the page shows, in paint()'s spelling. */
const modelOf = (search, saved, hash = "") => {
  const look = L.lookFromSearch(search) ?? {
    accent: L.ACCENTS.some((a) => a.id === saved?.accent) ? saved.accent : L.GALLERY_LOOK.accent,
    material: L.MATERIALS.some((m) => m.id === saved?.material) ? saved.material : L.GALLERY_LOOK.material,
  };
  const material = /^#(press|flat|device|rack)$/.exec(hash)?.[1] ?? look.material;
  return `${L.accentAttribute(look.accent, material) ?? "none"}/${material}`;
};
const firstPaint = [
  ...L.LOOKS.map((l) => [`?look=${L.encodeLook(l)}`, null, `${L.accentAttribute(l.accent, l.material) ?? "none"}/${l.material}`]),
  ["?look=mono", { accent: "blue4" }, "mono/press"],
  ["?status=ready&look=pink", { accent: "blue4" }, "pink/press"],
  ["?look=blue4", { accent: "pink", material: "flat" }, "none/press"],
  ["?look=press", { accent: "pink", material: "flat" }, "none/press"],
  ["?look=mono-flat", { accent: "pink" }, "none/flat"],
  ["?look=blue4-device", null, "blue/device"],
  ["?look=pink-flat-fun", { material: "press" }, "pink/flat"],
  ["", { accent: "pink" }, "pink/flat"],
  ["", { material: "press" }, "none/press"],
  ["", { accent: "blue4" }, "blue/flat"],
  ["", { accent: "blue4", material: "press" }, "none/press"],
  ["", { accent: "mono", material: "press" }, "mono/press"],
  ["?look=PINK", { accent: "pink" }, "pink/flat"],
  ["?look=green", { accent: "pink" }, "pink/flat"],
  ["?look=pink-fun-x", null, "none/flat"],
  ["?look=pink-device", { material: "flat" }, "pink/device"],
  ["?look=mono", { material: "device" }, "mono/press"],
  ["", { material: "device" }, "none/device"],
  ["", { accent: "mono", material: "device" }, "mono/device"],
  ["", { accent: "pink", material: "device" }, "pink/device"],
  ["", { material: "rack" }, "none/rack"],
  ["", { accent: "blue4", material: "rack" }, "blue/rack"],
  ["?look=blue4-flat-device", { material: "device" }, "none/device"],
  ["", null, "none/flat"],
];
check(scripts.length >= 2, `index.html paints with ${scripts.length} scripts before #root`);
for (const [search, saved, want] of firstPaint) {
  const got = paint(search, saved);
  const model = modelOf(search, saved);
  check(got === want && model === want, `"${search}" with ${saved ? JSON.stringify(saved) : "nothing"} saved paints ${want} (index.html: ${got}, look.ts: ${model})`);
}
/* A world page writes its material, and the accent follows the world: asked for stays asked for, the world's own stays its own. */
for (const [search, saved, hash, want] of [
  ["", { accent: "mono" }, "#device", "mono/device"],
  ["", { accent: "mono" }, "#press", "mono/press"],
  ["", null, "#device", "none/device"],
  ["?look=pink-flat", null, "#rack", "pink/rack"],
  ["", { accent: "blue4", material: "flat" }, "#press", "none/press"],
  ["?look=pink-flat", null, "#device", "pink/device"],
]) {
  const got = paint(search, saved, hash), model = modelOf(search, saved, hash);
  check(got === want && model === want, `${hash} with "${search}" and ${saved ? JSON.stringify(saved) : "nothing"} saved paints ${want} (index.html: ${got}, look.ts: ${model})`);
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
check(JSON.stringify(L.lookAttributes({ accent: "blue4", material: "flat" }, true)) === JSON.stringify({ "data-theme": "dark", "data-accent": "blue", "data-material": "flat" }), "a nested scope carries the material, and Blue 4 asked for on Flat");
check(JSON.stringify(L.lookAttributes({ accent: "mono", material: "flat" }, false)) === JSON.stringify({ "data-theme": "light", "data-material": "flat" }), "Monochrome on Flat is Flat's own: no data-accent");
check(JSON.stringify(L.lookAttributes({ accent: "pink", material: "device" }, false)) === JSON.stringify({ "data-theme": "light", "data-accent": "pink", "data-material": "device" }), "a nested scope carries Device");
check(JSON.stringify(L.lookAttributes({ accent: "blue4", material: "press" }, false)) === JSON.stringify({ "data-theme": "light" }), "Blue 4 on press is a theme and nothing else");
check(JSON.stringify(L.lookAttributes({ accent: "world", material: "device" }, false)) === JSON.stringify({ "data-theme": "light", "data-material": "device" }), "Device's own orange is the material and nothing else");

/* ---------- what a look asks a project to change ---------- */
check(L.lookStep(L.REGISTRY_LOOK, SITE) === null && L.lookNote(L.REGISTRY_LOOK) === null, "the registry's own look asks for no step and no note");
for (const look of L.LOOKS) {
  const slug = L.encodeLook(look);
  const attribute = L.accentAttribute(look.accent, look.material);
  const setup = L.lookSetup(look, SITE);
  const asks = (text) => [/data-accent="(\w+)"/.exec(text)?.[1] ?? null, text.includes("<FunMode>"), /data-material="(\w+)"/.exec(text)?.[1] ?? "press"];
  const [setupAttr, setupFun, setupMaterial] = asks(setup);
  check(setupMaterial === look.material, `${slug}: Copy setup asks for data-material="${look.material}" exactly when the look is ${look.material}`);
  if (look.material !== "press") check(new RegExp(`needs data-material="${look.material}" too`).test(setup), `${slug}: Copy setup says a nested theme needs data-material too`);
  if (look.material === "device") check(setup.includes("Geist Mono"), `${slug}: Copy setup says Device sets the glass in Geist Mono`);
  if (look.material === "rack") check(setup.includes("Inter"), `${slug}: Copy setup says Rack sets Inter`);
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
