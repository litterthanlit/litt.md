#!/usr/bin/env node
/**
 * Read the gallery's components and write the data behind every docs page:
 * src/generated/docs.json, keyed by file stem ("button", "dialog-fields").
 * The file is generated and gitignored; predev, prebuild and verify run this
 * script, so a fresh clone and Vercel always have it. The gallery reads it
 * through src/gallery/docs-data.ts (that file holds the TypeScript shapes).
 *
 *   node scripts/gen-docs.mjs            write src/generated/docs.json
 *   node scripts/gen-docs.mjs --check    fail if the file is missing or stale
 *
 * For each src/components/*.tsx it records, with the TypeScript type checker:
 *   exports   exported PascalCase functions and consts (kind "component"),
 *             use* functions ("hook") and other camelCase functions such as
 *             toast() ("function"), in source order. Types and non-callable
 *             constants are skipped.
 *   props     only the properties declared in our own source (src/), with the
 *             type as written, whether it is required, the default from the
 *             destructuring in the signature, and the JSDoc. Hooks and
 *             functions list their parameters instead; a sole options object
 *             declared in our source is followed by its properties
 *             (`options.duration`). `ref` and `children` are skipped when they
 *             have no JSDoc, because they are rarely worth a row.
 *   extends   a short note when the props also take a DOM or library type
 *             ("Every <button> attribute", "Radix Dialog.Trigger props").
 *   files     the file plus its local imports ("@/..." and "./..."), as
 *             repo-relative paths. src/gallery, src/styles and src/generated
 *             can't be copied, so importing them is an error.
 *   packages  npm packages imported by those files, by package name.
 *
 * It also writes src/generated/changelog.json, the parsed gallery/CHANGELOG.md, for the Changelog page.
 *
 * It fails (exit 1, naming the file and export) on anything it can't resolve,
 * instead of writing partial data. The usual fix is a new case in libNotes().
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { readChangelog } from "./changelog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "..");
const srcDir = path.join(root, "src");
const componentsDir = path.join(srcDir, "components");
const outFile = path.join(srcDir, "generated", "docs.json");
const check = process.argv.includes("--check");
process.chdir(root);

const norm = (f) => f.split(path.sep).join("/");
const rel = (f) => norm(path.relative(repo, f));
const under = (f, dir) => norm(f).startsWith(norm(dir) + "/");
const isOurs = (sf) => under(sf.fileName, srcDir) && !norm(sf.fileName).includes("/node_modules/");
const collapse = (s) => s.replace(/\s+/g, " ").trim();
const fail = (msg) => { throw new Error(msg); };

/* ------------------------------------------------------------------ program */

const parsed = ts.getParsedCommandLineOfConfigFile(path.join(root, "tsconfig.json"), {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => fail(`tsconfig.json: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`),
});
const options = { ...parsed.options, noEmit: true };
const stems = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)).sort();
/* The motion engine installs as one registry item (gen-registry.mjs, motionFiles), so a component that uses any of
   it needs all of it, even a file its imports never reach (drag.ts imports index.tsx, not the other way round). The
   engine's files are roots of the program too, so one that no component imports yet is still read. */
const MOTION_ENGINE = ["index.tsx", "spring.ts", "tokens.ts", "rules.ts", "device.ts", "drag.ts", "hand.ts"].map((f) => path.join(srcDir, "motion", f));
const program = ts.createProgram({ rootNames: [...stems.map((s) => path.join(componentsDir, `${s}.tsx`)), ...MOTION_ENGINE], options });
const checker = program.getTypeChecker();
const resolveCache = ts.createModuleResolutionCache(root, (f) => f, options);

/* --------------------------------------------------------------------- JSDoc */

/** The text of a /** comment: tags dropped, lines joined into paragraphs. */
function cleanDoc(raw) {
  const lines = raw.replace(/^\/\*+/, "").replace(/\*+\/$/, "").split("\n").map((l) => l.replace(/^\s*\*\s?/, ""));
  const end = lines.findIndex((l) => /^\s*@\w/.test(l));
  const text = (end < 0 ? lines : lines.slice(0, end)).join("\n");
  const paras = text.split(/\n\s*\n/).map((p) => collapse(p.replace(/\{@link\s+([^}\s|]+)(?:[\s|][^}]*)?\}/g, "$1"))).filter(Boolean);
  return paras.join("\n\n") || undefined;
}

/** The JSDoc directly above a node. A file header is not the doc of its first declaration. */
function docOf(node) {
  const sf = node.getSourceFile();
  const docs = (ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? []).filter((r) => sf.text.startsWith("/**", r.pos));
  const last = docs.at(-1);
  if (!last) return undefined;
  if (node.getFullStart() === 0 && docs.length === 1) return undefined;
  if (!/^[ \t]*\r?\n?[ \t]*$/.test(sf.text.slice(last.end, node.getStart(sf)))) return undefined;
  return cleanDoc(sf.text.slice(last.pos, last.end));
}

/* --------------------------------------------------------------- type text */

const unwrap = (e) => {
  while (e && (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e))) e = e.expression;
  return e;
};

/** The function behind an export: a declaration, an arrow, or one wrapped in forwardRef or memo. */
function fnOf(node) {
  if (ts.isFunctionDeclaration(node)) return node;
  const fromExpr = (e) => {
    e = unwrap(e);
    if (!e) return null;
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return e;
    if (ts.isCallExpression(e)) for (const a of e.arguments) { const f = fromExpr(a); if (f) return f; }
    return null;
  };
  return ts.isVariableDeclaration(node) ? fromExpr(node.initializer) : null;
}

/** The symbol a type or value name points at, followed through imports. */
function symbolOf(nameNode) {
  const id = ts.isIdentifier(nameNode) ? nameNode
    : ts.isQualifiedName(nameNode) ? nameNode.right
    : ts.isPropertyAccessExpression(nameNode) ? nameNode.name : null;
  let sym = id && checker.getSymbolAtLocation(id);
  if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
  return sym;
}

/** Members of a union of string or number literals, in source order, following our own aliases. */
function literals(node, depth = 0) {
  if (ts.isParenthesizedTypeNode(node)) return literals(node.type, depth);
  if (ts.isUnionTypeNode(node)) {
    const parts = node.types.map((t) => literals(t, depth));
    return parts.every(Boolean) ? parts.flat() : null;
  }
  if (ts.isLiteralTypeNode(node)) {
    if (ts.isStringLiteral(node.literal)) return [JSON.stringify(node.literal.text)];
    if (ts.isNumericLiteral(node.literal)) return [node.literal.getText()];
    return null;
  }
  if (ts.isTypeReferenceNode(node) && !node.typeArguments && depth < 5) {
    const d = symbolOf(node.typeName)?.declarations?.[0];
    if (d && ts.isTypeAliasDeclaration(d) && !d.typeParameters && isOurs(d.getSourceFile())) return literals(d.type, depth + 1);
  }
  return null;
}

/** A type as written, with the signature's own type parameters swapped for their constraints (T becomes string). */
function typeText(node, tps) {
  const base = node.getStart();
  let text = node.getText();
  const hits = [];
  (function visit(n) {
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && tps.has(n.typeName.text)) hits.push(n.typeName);
    ts.forEachChild(n, visit);
  })(node);
  for (const h of hits.sort((a, b) => b.getStart() - a.getStart())) {
    text = text.slice(0, h.getStart() - base) + tps.get(h.text) + text.slice(h.getEnd() - base);
  }
  return collapse(text);
}

const EXPAND_MAX = 80;
/** Unions of literals read as "a" | "b" even behind an alias; everything else keeps the name the author wrote. */
function propType(node, tps) {
  const lits = literals(node);
  if (lits) {
    const text = lits.join(" | ");
    if (text.length <= EXPAND_MAX || ts.isUnionTypeNode(node)) return text;
  }
  return typeText(node, tps);
}

/* ------------------------------------------------------------ extends notes */

const ELEMENTS = { Anchor: "a", UList: "ul", OList: "ol", LI: "li", Paragraph: "p", Image: "img", TextArea: "textarea" };
const pascal = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");

/** "Radix Tabs.List" for `typeof TabsPrimitive.List` or `RadixDialog.Trigger`. */
function radixPart(expr) {
  const ns = ts.isQualifiedName(expr) ? expr.left : ts.isPropertyAccessExpression(expr) ? expr.expression : null;
  const part = ts.isQualifiedName(expr) ? expr.right.text : ts.isPropertyAccessExpression(expr) ? expr.name.text : null;
  const d = ns && ts.isIdentifier(ns) ? checker.getSymbolAtLocation(ns)?.declarations?.[0] : null;
  const spec = d && ts.isNamespaceImport(d) ? d.parent.parent.moduleSpecifier.text : "";
  const m = /^@radix-ui\/react-(.+)$/.exec(spec);
  return m && part ? `Radix ${pascal(m[1])}.${part} props` : null;
}

function omitted(node) {
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text];
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(omitted);
  return fail(`Omit<…, ${node.getText()}>: only string literal keys are supported`);
}

/** Notes for the library types a props type is built from; our own types are followed into. */
function libNotes(node, seen = new Set()) {
  if (ts.isParenthesizedTypeNode(node)) return libNotes(node.type, seen);
  if (ts.isIntersectionTypeNode(node)) return node.types.flatMap((t) => libNotes(t, seen));
  if (ts.isTypeLiteralNode(node)) return [];
  if (!ts.isTypeReferenceNode(node) && !ts.isExpressionWithTypeArguments(node)) {
    return fail(`can't describe the props type \`${collapse(node.getText())}\` (add a case to libNotes in scripts/gen-docs.mjs)`);
  }
  const nameNode = ts.isTypeReferenceNode(node) ? node.typeName : node.expression;
  const name = ts.isQualifiedName(nameNode) ? nameNode.right.text : ts.isPropertyAccessExpression(nameNode) ? nameNode.name.text : nameNode.text;
  const args = node.typeArguments ?? [];
  const decl = symbolOf(nameNode)?.declarations?.[0];
  if (!decl) return fail(`can't resolve the type \`${name}\``);

  if (isOurs(decl.getSourceFile())) {
    if (seen.has(decl)) return [];
    seen.add(decl);
    if (ts.isTypeAliasDeclaration(decl)) return libNotes(decl.type, seen);
    if (ts.isInterfaceDeclaration(decl)) {
      return (decl.heritageClauses ?? []).filter((h) => h.token === ts.SyntaxKind.ExtendsKeyword).flatMap((h) => h.types.flatMap((t) => libNotes(t, seen)));
    }
    return [];
  }

  const tagOf = (el) => {
    const m = el && ts.isTypeReferenceNode(el) && ts.isIdentifier(el.typeName) ? /^(HTML|SVG)(\w*)Element$/.exec(el.typeName.text) : null;
    if (!m) return null;
    return m[2] ? ELEMENTS[m[2]] ?? m[2].toLowerCase() : `${m[1]} element`;
  };
  const every = (tag) => (/ element$/.test(tag) ? `Every ${tag.split(" ")[0]} attribute` : `Every <${tag}> attribute`);

  if (name === "Partial" || name === "Required" || name === "Readonly" || name === "DetailedHTMLProps") return libNotes(args[0], seen);
  // Is the first type argument itself a library type (not one of ours that happens to extend one)?
  const argIsLib = () => {
    const d = ts.isTypeReferenceNode(args[0]) ? symbolOf(args[0].typeName)?.declarations?.[0] : null;
    return !!d && !isOurs(d.getSourceFile());
  };
  if (name === "Pick") return argIsLib() ? fail("Pick of a library type isn't supported") : [];
  if (name === "Omit") {
    const inner = libNotes(args[0], seen);
    return argIsLib() ? inner.map((n) => `${n} except ${omitted(args[1]).join(", ")}`) : inner;
  }
  if (/^(?:\w*HTML|SVG)(?:Attributes|Props)$/.test(name)) {
    const tag = tagOf(args[0]) ?? (/^([A-Z][a-z]+)HTMLAttributes$/.exec(name)?.[1].toLowerCase());
    return tag ? [every(tag)] : fail(`\`${name}\` needs an element type argument, for example ${name}<HTMLDivElement>`);
  }
  if (/^ComponentProps(?:WithoutRef|WithRef)?$/.test(name)) {
    const a = args[0];
    if (a && ts.isLiteralTypeNode(a) && ts.isStringLiteral(a.literal)) return [every(a.literal.text)];
    const radix = a && ts.isTypeQueryNode(a) ? radixPart(a.exprName) : null;
    if (radix) return [radix];
  }
  return fail(`can't describe the library type \`${collapse(node.getText())}\` (add a case to libNotes in scripts/gen-docs.mjs)`);
}

/* ------------------------------------------------------------------ exports */

/** Defaults written in the destructuring of the first parameter: `{ size = "md" }`. */
function defaultsOf(fn) {
  const map = new Map();
  const pattern = fn?.parameters[0]?.name;
  if (!pattern || !ts.isObjectBindingPattern(pattern)) return map;
  for (const el of pattern.elements) {
    const key = el.propertyName ?? el.name;
    if (el.dotDotDotToken || !el.initializer || !(ts.isIdentifier(key) || ts.isStringLiteral(key))) continue;
    map.set(key.text, collapse(el.initializer.getText()));
  }
  return map;
}

const posKey = (d) => [d.getSourceFile().fileName, d.getStart()];

function describeProps(type, fn, tps) {
  const defaults = defaultsOf(fn);
  const all = checker.getPropertiesOfType(type);
  const own = [], foreign = [];
  for (const prop of all) {
    const decls = (prop.declarations ?? []).filter((d) => isOurs(d.getSourceFile()));
    (decls.length ? own : foreign).push([prop, decls]);
  }
  const files = [];
  const order = own.map(([prop, decls]) => {
    const [file, pos] = posKey(decls[0]);
    if (!files.includes(file)) files.push(file);
    return { prop, decls, at: files.indexOf(file) * 1e9 + pos };
  }).sort((a, b) => a.at - b.at);

  const props = [];
  for (const { prop, decls } of order) {
    const d = decls[0];
    const doc = decls.map(docOf).find(Boolean);
    if ((prop.name === "ref" || prop.name === "children") && !doc) continue;
    const t = checker.getTypeOfSymbolAtLocation(prop, d);
    const optional = !!(prop.flags & ts.SymbolFlags.Optional);
    const text = (ts.isPropertySignature(d) || ts.isPropertyDeclaration(d)) && d.type
      ? propType(d.type, tps)
      : collapse(checker.typeToString(optional ? checker.getNonNullableType(t) : t, d, ts.TypeFormatFlags.NoTruncation));
    props.push({
      name: prop.name,
      type: text,
      required: !optional,
      ...(defaults.has(prop.name) && { default: defaults.get(prop.name) }),
      ...(doc && { description: doc }),
    });
  }
  return { props, foreign: foreign.map(([p]) => p.name) };
}

/** The properties of a sole parameter whose type is an object declared in our source (an options bag), as `options.duration`. */
function nestedProps(p, tps) {
  if (!p.type || !ts.isIdentifier(p.name)) return [];
  const type = checker.getNonNullableType(checker.getTypeFromTypeNode(p.type));
  if (type.isUnion() || !(type.flags & ts.TypeFlags.Object)) return [];
  const { props, foreign } = describeProps(type, null, tps);
  return foreign.length ? [] : props.map((q) => ({ ...q, name: `${p.name.text}.${q.name}` }));
}

/** Hooks and plain functions list their parameters, a sole options object is followed by its properties. */
function describeParams(fn, sig, tps) {
  const params = fn ? [...fn.parameters] : sig.parameters.map((s) => s.valueDeclaration);
  if (!params.every((p) => p && ts.isParameter(p))) fail("can't read its parameters");
  return params.flatMap((p) => {
    const tag = ts.getJSDocParameterTags(p)[0];
    const doc = tag && ts.getTextOfJSDocComment(tag.comment)?.replace(/^-\s*/, "");
    return [{
      name: (p.dotDotDotToken ? "..." : "") + collapse(p.name.getText()),
      type: p.type ? propType(p.type, tps) : collapse(checker.typeToString(checker.getTypeAtLocation(p), p, ts.TypeFormatFlags.NoTruncation)),
      required: !p.questionToken && !p.initializer && !p.dotDotDotToken,
      ...(p.initializer && { default: collapse(p.initializer.getText()) }),
      ...(doc && { description: collapse(doc) }),
    }, ...(params.length === 1 ? nestedProps(p, tps) : [])];
  });
}

function describeExport({ name, kind, sym, decl }) {
  const fn = fnOf(decl);
  const sig = checker.getTypeOfSymbolAtLocation(sym, decl).getCallSignatures()[0];
  const tps = new Map((sig.getTypeParameters() ?? []).map((tp) => {
    const c = tp.getConstraint();
    return [tp.symbol.name, c ? checker.typeToString(c) : "unknown"];
  }));
  const statement = ts.isVariableDeclaration(decl) ? decl.parent.parent : decl;
  const out = { name, kind, props: [] };
  const description = docOf(statement);

  const first = fn?.parameters[0];
  if (kind !== "component" && !(first && ts.isObjectBindingPattern(first.name))) {
    out.props = describeParams(fn, sig, tps);
  } else if (sig.parameters.length) {
    const param = sig.parameters[0];
    let type = checker.getTypeOfSymbolAtLocation(param, param.valueDeclaration ?? decl);
    type = checker.getNonNullableType(type);
    if (type.flags & ts.TypeFlags.Any) fail("the props type resolves to any");
    if (type.isUnion() || !(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection))) {
      fail(`the first parameter has the type \`${checker.typeToString(type)}\`; props must be one object type`);
    }
    const { props, foreign } = describeProps(type, fn, tps);
    out.props = props;

    let notes = [];
    if (first?.type) notes = libNotes(first.type);
    else if (!fn && ts.isVariableDeclaration(decl) && decl.initializer) {
      const init = unwrap(decl.initializer);
      const note = ts.isPropertyAccessExpression(init) ? radixPart(init) : null;
      if (note) notes = [note];
    }
    notes = [...new Set(notes)];
    if (foreign.length && !notes.length) {
      fail(`takes library props (${foreign.slice(0, 3).join(", ")}…) that can't be described; annotate the first parameter with a known type or add a case to libNotes in scripts/gen-docs.mjs`);
    }
    if (notes.length) out.extends = notes.join("; ");
  }
  if (description) out.description = description;
  return out;
}

function exportsOf(sf) {
  const mod = checker.getSymbolAtLocation(sf);
  if (!mod) return [];
  const found = [];
  for (const exp of checker.getExportsOfModule(mod)) {
    const kind = /^use[A-Z0-9_]/.test(exp.name) ? "hook"
      : /^[A-Z][A-Za-z0-9]*$/.test(exp.name) && /[a-z]/.test(exp.name) ? "component"
      : /^[a-z][A-Za-z0-9]*$/.test(exp.name) ? "function" : null;
    if (!kind) continue;
    const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    if (!(sym.flags & ts.SymbolFlags.Value)) continue; // a type
    const decl = sym.valueDeclaration;
    if (!decl) { found.push({ name: exp.name, error: "can't find its declaration" }); continue; }
    if (!checker.getTypeOfSymbolAtLocation(sym, decl).getCallSignatures().length) continue; // a constant or a context, not something to call
    const at = exp.declarations?.[0] ?? decl;
    found.push({ name: exp.name, kind, sym, decl, at: at.getSourceFile() === sf ? at.getStart() : 0 });
  }
  return found.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
}

/* ------------------------------------------------------------ files, packages */

const pkgName = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
const importCache = new Map();

/** Every module specifier in a file: import and export-from, import(), and `typeof import("…")`. */
function specifiersOf(sf) {
  const specs = [];
  (function visit(n) {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) specs.push(n.moduleSpecifier.text);
    else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteralLike(n.arguments[0])) specs.push(n.arguments[0].text);
    else if (ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument) && ts.isStringLiteral(n.argument.literal)) specs.push(n.argument.literal.text);
    ts.forEachChild(n, visit);
  })(sf);
  return specs;
}

function importsOf(file) {
  if (importCache.has(file)) return importCache.get(file);
  const sf = program.getSourceFile(file);
  if (!sf) fail(`${rel(file)}: not part of the TypeScript program`);
  const locals = new Set(), pkgs = new Set();
  for (const spec of specifiersOf(sf)) {
    const hit = ts.resolveModuleName(spec, file, options, ts.sys, resolveCache).resolvedModule;
    if (hit?.isExternalLibraryImport) pkgs.add(pkgName(spec));
    else if (hit && under(hit.resolvedFileName, srcDir)) locals.add(path.normalize(hit.resolvedFileName));
    else if (!hit && (spec.startsWith(".") || spec.startsWith("@/"))) {
      // Not TypeScript (a stylesheet, an image): take it if the file is there.
      const guess = spec.startsWith("@/") ? path.join(srcDir, spec.slice(2)) : path.resolve(path.dirname(file), spec);
      if (fs.existsSync(guess) && fs.statSync(guess).isFile()) locals.add(guess);
      else fail(`${rel(file)}: can't resolve the import "${spec}"`);
    } else fail(`${rel(file)}: can't resolve the import "${spec}"${hit ? " (it resolves outside gallery/src)" : ""}`);
  }
  const result = { locals: [...locals], pkgs: [...pkgs] };
  importCache.set(file, result);
  return result;
}

function closure(entry) {
  const files = new Set(), pkgs = new Set();
  const stack = [[entry, null]];
  while (stack.length) {
    const [file, from] = stack.pop();
    if (files.has(file)) continue;
    for (const bad of ["gallery", "styles", "generated"]) {
      if (under(file, path.join(srcDir, bad))) fail(`${rel(from ?? file)} imports ${rel(file)}, which can't be copied with the component (src/${bad}/ is not part of the library)`);
    }
    files.add(file);
    if (under(file, path.join(srcDir, "motion")) && MOTION_ENGINE.includes(path.normalize(file))) MOTION_ENGINE.forEach((f) => stack.push([f, file]));
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    if (/\.[jt]sx$/.test(file)) pkgs.add("react");
    const { locals, pkgs: p } = importsOf(file);
    p.forEach((x) => pkgs.add(x));
    locals.forEach((l) => stack.push([l, file]));
  }
  return { files: [...files].map(rel).sort(), packages: [...pkgs].sort() };
}

/* --------------------------------------------------------------------- main */

function main() {
  const docs = {};
  let nExports = 0, nProps = 0;
  for (const stem of stems) {
    const file = path.join(componentsDir, `${stem}.tsx`);
    const sf = program.getSourceFile(file);
    const exports = exportsOf(sf).map((e) => {
      try {
        if (e.error) fail(e.error);
        return describeExport(e);
      } catch (err) {
        throw new Error(`${rel(file)}, export ${e.name}: ${err.message}`);
      }
    });
    nExports += exports.length;
    nProps += exports.reduce((n, e) => n + e.props.length, 0);
    docs[stem] = { stem, file: rel(file), exports, ...closure(file) };
  }
  writeChangelog();
  const text = JSON.stringify(docs, null, 2) + "\n";
  const dest = rel(outFile).replace(/^gallery\//, "");
  const summary = `${stems.length} files, ${nExports} exports, ${nProps} props`;
  if (check) {
    const cur = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "";
    if (cur !== text) { console.log(`✗ ${dest} differs from the components (run npm run gen:docs)`); process.exit(1); }
    console.log(`✓ ${dest} (${summary})`);
    return;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  // Rewrite only when the data changed, so a running dev server isn't poked for nothing.
  if (!fs.existsSync(outFile) || fs.readFileSync(outFile, "utf8") !== text) fs.writeFileSync(outFile, text);
  console.log(`generated ${dest} (${summary})`);
}

/** The changelog the gallery's Changelog page reads. Item names are checked by gen-registry, which knows the items. */
function writeChangelog() {
  const file = path.join(srcDir, "generated", "changelog.json");
  const text = JSON.stringify(readChangelog(), null, 2) + "\n";
  const cur = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (check) {
    if (cur !== text) { console.log("✗ src/generated/changelog.json differs from CHANGELOG.md (run npm run gen:docs)"); process.exit(1); }
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (cur !== text) fs.writeFileSync(file, text);
}

try {
  main();
} catch (err) {
  console.error(`gen-docs: ${err.message}`);
  process.exit(1);
}
