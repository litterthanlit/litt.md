#!/usr/bin/env node
/**
 * Class collisions: no class list may put two Tailwind utilities on one element that set the same properties under
 * the same variant chain. Tailwind gives both the same specificity, so the one it emits later wins, whatever order
 * the classes are written in, and it emits two such utilities by name. The Flat switch broke this way:
 * its pill carried `group-data-[state=checked]/pill:bg-fg` and tone="accent" appended
 * `group-data-[state=checked]/pill:bg-accent`; `bg-accent` comes first, so the ink won and the accent never showed.
 *
 *   node scripts/collisions.mjs               every className in src/ (npm run lint:collisions)
 *   node scripts/collisions.mjs FILE...       only these files
 *   node scripts/collisions.mjs --self-test   lint-fixtures/collisions-*.tsx (npm run test:collisions)
 *
 * It reads each `className` with the TypeScript compiler and works out every class that can land on that element:
 * strings joined with +, template strings, ternaries, `a && "…"`, constants (other files too), lookups in a Record
 * (`fills[tone]`), arrays joined, and what a local function returns. Each class remembers the conditions it sits
 * under, so two classes that can never land together are no collision: the two arms of one ternary, two keys of one
 * Record, `tone === "accent"` against `tone === "neutral"`, `on` against `!on`.
 *
 * What a class sets comes from Tailwind itself, compiled against the gallery's own stylesheet (src/app.css), not
 * from a table of names. Two classes collide when they compile to the same selector (the class aside) with the same
 * set of properties and a different value: `bg-fg` with `bg-accent`, `text-fg` with `text-fg-muted`, `flex` with
 * `hidden`. When one sets only part of what the other sets (`w-4` and `size-5`, or `text-small` and `text-caption`,
 * which sets a weight too), Tailwind emits the narrower one last on purpose, so the pair is a collision only when the
 * wider one is joined on later, the one meant to win. These are not collisions:
 *   - different properties: `text-small` (size) with `text-fg` (color);
 *   - a longer variant chain (`group-disabled/pill:group-data-[state=checked]/pill:bg-fg`): another selector, which
 *     wins or loses by specificity, not by order;
 *   - each sets something the other does not (`text-small` with `leading-none`, `text-caption` with `font-title`):
 *     Tailwind orders these by design;
 *   - `!important` on one side only.
 *
 * Out of sight: a class list that reaches the element through a prop (`className={base + className}`), a `let`, or a
 * function's parameter. Put `litt-allow` on either class's line (in a comment) to exempt a pair, with a reason.
 *
 * Collisions not yet fixed sit in KNOWN, each with the class that wins today. They print and do not fail the run, but
 * one that is gone, or whose winner has changed, does: the list pins today's picture and only shrinks.
 *
 * The self-test lints lint-fixtures/collisions-dirty.tsx, where every line that ends in `// expect: collision` must
 * fail and no other line may, and collisions-clean.tsx, which must be clean. The dirty fixture holds the old switch
 * pill, and the self-test fails if the check stops naming its two fills.
 *
 * Exit codes: 0 clean, 1 collisions (or a self-test problem), 2 usage error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { __unstable__loadDesignSystem } from "tailwindcss";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const fixtures = path.join(here, "lint-fixtures");

/* ============================================================================ what a class sets */

/** Tailwind's design system for the gallery's stylesheet: the one that says what each class compiles to. */
async function loadTailwind() {
  const entry = path.join(root, "src", "app.css");
  if (!fs.existsSync(path.join(root, "src", "styles", "litt.css"))) throw new Error("src/styles/litt.css is missing. Run npm run sync:tokens --prefix gallery first.");
  const resolve = (id, base) => (id.startsWith(".") ? path.resolve(base, id) : path.join(root, "node_modules", id === "tailwindcss" ? "tailwindcss/index.css" : id));
  return __unstable__loadDesignSystem(fs.readFileSync(entry, "utf8"), {
    base: path.dirname(entry),
    loadStylesheet: async (id, base) => {
      const file = resolve(id, base);
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
    },
  });
}

const unescapeIdent = (s) => s.replace(/\\([0-9a-fA-F]{1,6}) ?|\\(.)/g, (_, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : ch));

/**
 * The rules a class compiles to: Map<where, Map<property, { value, important }>>. `where` is the rule's at-rules and
 * its selector with the class itself written `&`, so two classes with the same `where` match the same elements in
 * the same states with the same specificity.
 */
function parseRules(css, cls) {
  const rules = new Map();
  const walk = (text, where) => {
    let depth = 0, start = 0, quote = "";
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quote) { if (c === "\\") i++; else if (c === quote) quote = ""; continue; }
      if (c === '"' || c === "'") quote = c;
      else if (c === "\\") i++;
      else if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (c === ";" && depth === 0) {
        const decl = text.slice(start, i), colon = decl.indexOf(":");
        if (colon > 0 && where) {
          const value = decl.slice(colon + 1).trim().replace(/\s+/g, " ");
          const important = /\s*!important$/.test(value);
          if (!rules.has(where)) rules.set(where, new Map());
          rules.get(where).set(decl.slice(0, colon).trim(), { value: value.replace(/\s*!important$/, ""), important });
        }
        start = i + 1;
      } else if (c === "{" && depth === 0) {
        let d = 1, j = i + 1;
        for (; j < text.length && d; j++) { if (text[j] === "\\") j++; else if (text[j] === "{") d++; else if (text[j] === "}") d--; }
        const prelude = text.slice(start, i).trim().replace(/\s+/g, " ");
        if (!/^@(?:property|keyframes)\b/.test(prelude)) {
          const self = prelude.replace(/\.((?:\\[0-9a-fA-F]{1,6} ?|\\.|[\w-]|[^\x00-\x7F])+)/g, (m, ident) => (unescapeIdent(ident) === cls ? "&" : m));
          walk(text.slice(i + 1, j - 1), where ? `${where} { ${self}` : self);
        }
        i = j - 1;
        start = j;
      }
    }
  };
  walk(css, "");
  return rules;
}

/** Reads classes through Tailwind, once each. A class Tailwind does not know (`peer`, `group/pill`) has no rules. */
function classReader(tailwind) {
  const known = new Map();
  const rulesOf = (cls) => {
    if (!known.has(cls)) {
      const css = tailwind.candidatesToCss([cls])[0];
      known.set(cls, css ? parseRules(css, cls) : null);
    }
    return known.get(cls);
  };
  const pairs = new Map();
  /** The properties two classes fight over, with the class Tailwind emits last (the one that wins), or null.
      `narrower` says one sets only part of what the other sets: Tailwind emits that one last on purpose. */
  const collision = (a, b) => {
    const key = a < b ? `${a} ${b}` : `${b} ${a}`;
    if (pairs.has(key)) return pairs.get(key);
    const ra = rulesOf(a), rb = rulesOf(b);
    let found = null;
    if (ra && rb) {
      for (const [where, da] of ra) {
        const db = rb.get(where);
        if (!db) continue;
        const [less, more] = da.size <= db.size ? [da, db] : [db, da];
        if ([...less.keys()].some((p) => !more.has(p))) continue; // each sets something the other does not: Tailwind's order is its design
        const differ = [...less].filter(([p, v]) => v.value !== more.get(p).value);
        if (!differ.length || differ.some(([p, v]) => v.important !== more.get(p).important)) continue;
        const [[, oa], [, ob]] = tailwind.getClassOrder([a, b]);
        const shown = differ.map(([p]) => p).filter((p) => !p.startsWith("--"));
        found = { properties: shown.length ? shown : differ.map(([p]) => p), wins: oa > ob ? a : b, narrower: less.size < more.size };
        break;
      }
    }
    pairs.set(key, found);
    return found;
  };
  return { rulesOf, collision };
}

/* ====================================================================== what lands on an element */

/* Guards: Map<subject, { bool?, eq?, neq? }>, the conditions a class sits under. A subject is a condition's text with
   the declaration of its first name, so `tone` in two components is two subjects. */

/** The guards with one more condition, or null when the two can never hold together. */
function guard(guards, subject, add) {
  const have = guards.get(subject) ?? {};
  if (add.bool !== undefined && have.bool !== undefined && add.bool !== have.bool) return null;
  if (add.eq !== undefined && ((have.eq !== undefined && have.eq !== add.eq) || have.neq?.has(add.eq))) return null;
  if (add.neq !== undefined && have.eq === add.neq) return null;
  const next = { ...have };
  if (add.bool !== undefined) next.bool = add.bool;
  if (add.eq !== undefined) next.eq = add.eq;
  if (add.neq !== undefined) next.neq = new Set([...(have.neq ?? []), add.neq]);
  return new Map(guards).set(subject, next);
}

/** Can a class under `a` and a class under `b` land on the element in the same render? */
function together(a, b) {
  for (const [subject, x] of a) {
    const y = b.get(subject);
    if (!y) continue;
    if (x.bool !== undefined && y.bool !== undefined && x.bool !== y.bool) return false;
    if (x.eq !== undefined && y.eq !== undefined && x.eq !== y.eq) return false;
    if ((x.eq !== undefined && y.neq?.has(x.eq)) || (y.eq !== undefined && x.neq?.has(y.eq))) return false;
  }
  return true;
}

const CLASS_HELPER = /^(?:cn|cx|clsx|classNames|classnames|twMerge|twJoin)$/;
const PASS_THROUGH = new Set(["join", "filter", "concat", "trim", "flat", "toString"]);

/** Reads the classes of every `className` in a program's files: [{ cls, file, pos, line, guards }] per element. */
function elementReader(program) {
  const checker = program.getTypeChecker();
  let calls = 0;

  const unwrap = (e) => {
    while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression(e)) e = e.expression;
    return e;
  };
  const declarationOf = (name) => {
    let symbol = checker.getSymbolAtLocation(name);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    return symbol?.valueDeclaration ?? symbol?.declarations?.[0] ?? null;
  };
  const constInit = (name) => {
    const d = declarationOf(name);
    return d && ts.isVariableDeclaration(d) && d.initializer && d.parent.flags & ts.NodeFlags.Const ? d : null;
  };
  const subject = (e) => {
    let first = null;
    const visit = (n) => { if (!first) { if (ts.isIdentifier(n)) first = n; else n.forEachChild(visit); } };
    visit(e);
    const d = first && declarationOf(first);
    return `${e.getText().replace(/\s+/g, " ")}@${d ? `${d.getSourceFile().fileName}:${d.pos}` : e.getSourceFile().fileName}`;
  };
  const literal = (e) => (ts.isStringLiteralLike(e) || ts.isNumericLiteral(e) ? e.text
    : e.kind === ts.SyntaxKind.TrueKeyword ? "true" : e.kind === ts.SyntaxKind.FalseKeyword ? "false" : e.kind === ts.SyntaxKind.NullKeyword ? "null" : undefined);

  /** The guards with `cond` taken as true or false, or null when that cannot be. */
  function assume(cond, truth, guards) {
    cond = unwrap(cond);
    if (ts.isPrefixUnaryExpression(cond) && cond.operator === ts.SyntaxKind.ExclamationToken) return assume(cond.operand, !truth, guards);
    if (ts.isBinaryExpression(cond)) {
      const op = cond.operatorToken.kind;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken || op === ts.SyntaxKind.BarBarToken) {
        /* The whole condition is a subject too, so the two arms of `a && b ? x : y` never land together. */
        const whole = guard(guards, subject(cond), { bool: truth });
        if (!whole || (op === ts.SyntaxKind.AmpersandAmpersandToken) !== truth) return whole;
        const left = assume(cond.left, truth, whole);
        return left && assume(cond.right, truth, left);
      }
      const equal = op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken;
      if (equal || op === ts.SyntaxKind.ExclamationEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken) {
        const l = unwrap(cond.left), r = unwrap(cond.right);
        const value = literal(r) ?? literal(l);
        if (value !== undefined) return guard(guards, subject(literal(r) !== undefined ? l : r), equal === truth ? { eq: value } : { neq: value });
      }
    }
    return guard(guards, subject(cond), { bool: truth });
  }

  /** The classes written in one piece of string text that starts at `at` in its file. */
  function words(text, node, at, guards, { openLeft = false, openRight = false } = {}) {
    const file = node.getSourceFile();
    const parts = [...text.matchAll(/\S+/g)];
    if (openLeft && parts.length && parts[0].index === 0) parts.shift(); // glued to a ${…}: not a whole class
    if (openRight && parts.length && parts.at(-1).index + parts.at(-1)[0].length === text.length) parts.pop();
    let from = at;
    return parts.map((m) => {
      const found = file.text.indexOf(m[0], from);
      const pos = found < 0 ? at : found;
      from = pos + m[0].length;
      return { cls: m[0], file: file.fileName, pos, line: file.getLineAndCharacterOfPosition(pos).line + 1, guards };
    });
  }

  /** The object literals an expression can be, each with its guards. */
  function objects(e, guards, seen) {
    e = unwrap(e);
    if (ts.isObjectLiteralExpression(e)) return [{ node: e, guards }];
    if (ts.isIdentifier(e)) {
      const d = constInit(e);
      if (!d || seen.has(d)) return [];
      seen.add(d);
      try { return objects(d.initializer, guards, seen); } finally { seen.delete(d); }
    }
    if (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e)) return members(e, guards, seen).flatMap((m) => objects(m.value, m.guards, seen));
    if (ts.isConditionalExpression(e)) return branches(e, guards).flatMap((b) => objects(b.value, b.guards, seen));
    return [];
  }

  /** The values `object.key` or `object[key]` can be: one for a written key, every member (guarded) for a computed one. */
  function members(access, guards, seen) {
    const key = ts.isPropertyAccessExpression(access) ? access.name.text : literal(unwrap(access.argumentExpression));
    const out = [];
    for (const o of objects(access.expression, guards, seen)) {
      for (const p of o.node.properties) {
        if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name) || ts.isNumericLiteral(p.name))) continue;
        if (key !== undefined) { if (p.name.text === key) out.push({ value: p.initializer, guards: o.guards }); continue; }
        const g = guard(o.guards, subject(unwrap(access.argumentExpression)), { eq: p.name.text });
        if (g) out.push({ value: p.initializer, guards: g });
      }
    }
    return out;
  }

  function branches(e, guards) {
    const yes = assume(e.condition, true, guards), no = assume(e.condition, false, guards);
    return [yes && { value: e.whenTrue, guards: yes }, no && { value: e.whenFalse, guards: no }].filter(Boolean);
  }

  /** What a function can return, each return under its own guard: a call returns once. */
  function returns(fn, guards) {
    if (!fn.body) return [];
    const found = [];
    if (ts.isBlock(fn.body)) {
      const visit = (n) => {
        if (ts.isFunctionLike(n)) return;
        if (ts.isReturnStatement(n) && n.expression) found.push(n.expression);
        n.forEachChild(visit);
      };
      fn.body.forEachChild(visit);
    } else found.push(fn.body);
    const call = `call ${++calls}`;
    return found.map((value, i) => ({ value, guards: guard(guards, call, { eq: String(i) }) }));
  }

  /** Every class an expression can put on the element. */
  function classes(e, guards, seen) {
    e = unwrap(e);
    const all = (list) => list.flatMap((x) => classes(x.value, x.guards, seen));
    if (ts.isStringLiteralLike(e)) return words(e.text, e, e.getStart() + 1, guards);
    if (ts.isTemplateExpression(e)) {
      const out = words(e.head.text, e, e.head.getStart() + 1, guards, { openRight: true });
      e.templateSpans.forEach((span, i) => {
        out.push(...classes(span.expression, guards, seen));
        out.push(...words(span.literal.text, e, span.literal.getStart() + 1, guards, { openLeft: true, openRight: i < e.templateSpans.length - 1 }));
      });
      return out;
    }
    if (ts.isBinaryExpression(e)) {
      const op = e.operatorToken.kind;
      if (op === ts.SyntaxKind.PlusToken) return [...classes(e.left, guards, seen), ...classes(e.right, guards, seen)];
      const yes = assume(e.left, true, guards), no = assume(e.left, false, guards);
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) return yes ? classes(e.right, yes, seen) : [];
      if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) return [...(yes ? classes(e.left, yes, seen) : []), ...(no ? classes(e.right, no, seen) : [])];
      return [];
    }
    if (ts.isConditionalExpression(e)) return all(branches(e, guards));
    if (ts.isIdentifier(e)) {
      const d = constInit(e);
      if (!d || seen.has(d)) return [];
      seen.add(d);
      try { return classes(d.initializer, guards, seen); } finally { seen.delete(d); }
    }
    if (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e)) return all(members(e, guards, seen));
    if (ts.isArrayLiteralExpression(e)) return e.elements.flatMap((x) => classes(ts.isSpreadElement(x) ? x.expression : x, guards, seen));
    if (ts.isObjectLiteralExpression(e)) { // cx({ "bg-surface-2": active })
      return e.properties.flatMap((p) => {
        if (!ts.isPropertyAssignment(p) || !ts.isStringLiteralLike(p.name)) return [];
        const g = assume(p.initializer, true, guards);
        return g ? words(p.name.text, p.name, p.name.getStart() + 1, g) : [];
      });
    }
    if (ts.isCallExpression(e)) {
      const callee = unwrap(e.expression);
      const args = () => e.arguments.flatMap((x) => classes(ts.isSpreadElement(x) ? x.expression : x, guards, seen));
      if (ts.isPropertyAccessExpression(callee) && PASS_THROUGH.has(callee.name.text)) return [...classes(callee.expression, guards, seen), ...(callee.name.text === "concat" ? args() : [])];
      if (!ts.isIdentifier(callee)) return [];
      if (CLASS_HELPER.test(callee.text)) return args();
      const d = declarationOf(callee);
      const fn = d && (ts.isFunctionDeclaration(d) ? d : ts.isVariableDeclaration(d) && d.initializer && (ts.isArrowFunction(unwrap(d.initializer)) || ts.isFunctionExpression(unwrap(d.initializer))) ? unwrap(d.initializer) : null);
      if (!fn || seen.has(fn)) return [];
      seen.add(fn);
      try { return all(returns(fn, guards).filter((r) => r.guards)); } finally { seen.delete(fn); }
    }
    return [];
  }

  /** Every element's classes in one file. */
  return function elements(file) {
    const out = [];
    const visit = (n) => {
      if (ts.isJsxAttribute(n) && ts.isIdentifier(n.name) && (n.name.text === "className" || n.name.text === "class") && n.initializer) {
        const value = ts.isJsxExpression(n.initializer) ? n.initializer.expression : n.initializer;
        if (value) out.push(classes(value, new Map(), new Set()));
      }
      n.forEachChild(visit);
    };
    visit(file);
    return out;
  };
}

/* ==================================================================================== the check */

const variantsOf = (cls) => {
  let depth = 0, cut = -1;
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] === "[" || cls[i] === "(") depth++;
    else if (cls[i] === "]" || cls[i] === ")") depth--;
    else if (cls[i] === ":" && depth === 0) cut = i;
  }
  return cut < 0 ? "" : cls.slice(0, cut + 1);
};

/* Collisions the check knows about and has not fixed yet. `wins` is the class Tailwind emits last today, `loses` the
   one it beats on the same element. Most are right only by that order: the class joined on for the narrower case
   happens to sort last. Two are not, and say so: the class joined on is the one that loses, so it does nothing. */
const KNOWN = [
  { file: "src/components/agent-indicator.tsx", wins: "rounded-surface", loses: "rounded-control", why: "the reel's window joins the surface radius onto the LCD's own control radius" },
  { file: "src/components/agent-indicator.tsx", wins: "flex", loses: "block", why: "the empty layer writes block before the LCD's flex, and block does nothing" },
  { file: "src/components/bodies/card-picker.device.tsx", wins: "forced-colors:border-2", loses: "forced-colors:border", why: "a latched plate joins its 2px forced-colors border onto the 1px every plate has" },
  { file: "src/components/bodies/input.device.tsx", wins: "font-mono", loses: "font-field", why: "mono joins font-mono onto the glass's font-field" },
  { file: "src/components/bodies/legend.device.tsx", wins: "forced-colors:border-2", loses: "forced-colors:border", why: "a shown key joins its 2px forced-colors border onto the 1px every key has" },
  { file: "src/components/bodies/number-field.device.tsx", wins: "shadow-[inset_0_0_0_1px_var(--danger),var(--tray-shade)]", loses: "shadow-(--tray-shade)", why: "an error joins the danger line onto the well's shade" },
  { file: "src/components/bodies/option-picker.device.tsx", wins: "forced-colors:border-2", loses: "forced-colors:border", why: "the chosen key joins its 2px forced-colors border onto the 1px every key has" },
  { file: "src/components/bodies/switch.device.tsx", wins: "bg-surface-2", loses: "bg-block", why: "disabled joins the flat key's fill onto the standing key's" },
  { file: "src/components/bodies/switch.device.tsx", wins: "shadow-[inset_0_0_0_1px_var(--line)]", loses: "shadow-(--key-lift)", why: "disabled joins the flat key's line onto the standing key's lift" },
  { file: "src/components/option-picker.tsx", wins: "forced-colors:border-2", loses: "forced-colors:border", why: "the chosen swatch joins its 2px forced-colors border onto the 1px every swatch has" },
  { file: "src/components/slider.tsx", wins: "transition-transform", loses: "transition-colors", why: "a glide joins its transform transition onto the face's color fade, so the face does not fade while it glides" },
  { file: "src/components/slider.tsx", wins: "duration-(--dur-responsive)", loses: "duration-(--dur-instant)", why: "the glide's duration joined onto the face's fade" },
  { file: "src/components/slider.tsx", wins: "ease-responsive", loses: "ease-litt", why: "the glide's ease joined onto the face's fade" },
  { file: "src/components/switch.tsx", wins: "text-fg-disabled", loses: "text-fg", why: "disabled joins its ink onto the floor word's" },
  { file: "src/components/steps.tsx", wins: "pb-6", loses: "pb-0", why: "the last step joins pb-0 onto pb-6 and loses, so it keeps its 24px foot; whether it should is a look call" },
  { file: "src/components/button.tsx", wins: "bg-clip-padding", loses: "bg-clip-border", why: "ghost joins bg-clip-border onto the base's bg-clip-padding and loses, so its hover fill stops inside the 3px plate; whether it should is a look call" },
];
const knownFor = (f) => KNOWN.find((k) => k.file === f.file && k.wins === f.wins && f.classes.includes(k.loses));

/** Lint files. Returns [{ file, line, rule: "collision", message, classes, wins }], one per pair of places in the source. */
function lint(files, { tailwind, options, rel }) {
  const program = ts.createProgram(files, options);
  const elements = elementReader(program);
  const reader = classReader(tailwind);
  const wanted = new Set(files.map((f) => path.resolve(f)));
  const lineOf = new Map();
  const allowed = (t) => {
    if (!lineOf.has(t.file)) lineOf.set(t.file, fs.readFileSync(t.file, "utf8").split("\n"));
    return lineOf.get(t.file)[t.line - 1]?.includes("litt-allow");
  };
  const fails = new Map();
  for (const file of program.getSourceFiles()) {
    if (!wanted.has(path.resolve(file.fileName))) continue;
    for (const element of elements(file)) {
      const list = element.filter((t) => reader.rulesOf(t.cls));
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          if (a.cls === b.cls) continue;
          const hit = reader.collision(a.cls, b.cls);
          if (!hit || !together(a.guards, b.guards) || allowed(a) || allowed(b)) continue;
          /* The class joined on later is the one meant to win, and its line is the one reported. */
          const meant = b, other = a;
          if (hit.narrower && hit.wins === meant.cls) continue; // the narrower class, written last, wins as Tailwind means it to
          const key = [`${meant.file}:${meant.pos}`, `${other.file}:${other.pos}`].sort().join("|");
          if (fails.has(key)) continue;
          const under = variantsOf(meant.cls);
          const where = other.file === meant.file ? `line ${other.line}` : `${rel(other.file)}:${other.line}`;
          fails.set(key, {
            file: rel(meant.file), line: meant.line, rule: "collision", classes: [meant.cls, other.cls], wins: hit.wins,
            message: `${meant.cls} and ${other.cls} (${where}) can land on one element and both set ${hit.properties.join(", ")}${under ? ` under ${under}` : ""}. ` +
              `Tailwind emits ${hit.wins} last, so it wins whatever order they are written in. Give each case its own string (a Record or a ternary), so only one lands`,
          });
        }
      }
    }
  }
  return [...fails.values()].sort((x, y) => x.file.localeCompare(y.file) || x.line - y.line);
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : /\.tsx$/.test(d.name) ? [p] : [];
});

/** The gallery's compiler options, so `@/…` and relative imports resolve to the constants they name. */
function galleryOptions() {
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
}

async function run(argv) {
  const selfTest = argv.includes("--self-test");
  const unknown = argv.find((a) => a.startsWith("--") && a !== "--self-test");
  if (unknown) { console.error(`collisions: unknown option ${unknown}\nusage: node collisions.mjs [files...] | --self-test`); return 2; }
  const tailwind = await loadTailwind();
  const options = { ...galleryOptions(), noEmit: true };
  if (selfTest) return runSelfTest(tailwind, options);

  const named = argv.filter((a) => !a.startsWith("--")).map((a) => path.resolve(a));
  const missing = named.find((f) => !fs.existsSync(f));
  if (missing) { console.error(`collisions: no such file: ${missing}`); return 2; }
  const files = named.length ? named : walk(path.join(root, "src"));
  const rel = (f) => path.relative(root, f).split(path.sep).join("/");
  const found = lint(files, { tailwind, options, rel });
  const fails = found.filter((f) => !knownFor(f));
  const linted = new Set(files.map(rel));
  let known = 0;
  for (const k of KNOWN.filter((k) => linted.has(k.file))) {
    const hits = found.filter((f) => knownFor(f) === k);
    known += hits.length;
    if (hits.length) console.log(`  · known ${k.file}:${[...new Set(hits.map((f) => f.line))].join(",")}  ${k.wins} over ${k.loses}: ${k.why}.`);
    else fails.push({ file: k.file, line: 0, message: `the known collision is gone, or ${k.loses} now wins (${k.wins} over ${k.loses}: ${k.why}). Take it out of KNOWN, or look at what changed` });
  }
  fails.forEach((f) => console.log(`  ✗ ${f.file}${f.line ? `:${f.line}` : ""}  ${f.message}`));
  console.log(fails.length ? `\n${fails.length} class collision problem(s) in ${files.length} files.` : `\nclass collisions: ${files.length} files, no two classes fight over a property${known ? ` but the ${known} known` : ""}.`);
  return fails.length ? 1 : 0;
}

/* ==================================================================================== self-test */

function runSelfTest(tailwind, options) {
  const problems = [], lines = [];
  const check = (name) => {
    const file = path.join(fixtures, name);
    if (!fs.existsSync(file)) { problems.push(`${name}: fixture is missing`); return []; }
    const fails = lint([file], { tailwind, options, rel: (f) => path.relative(fixtures, f) });
    const want = new Set(), got = new Map();
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => { if (/\/\/\s*expect:\s*collision\s*$/.test(line)) want.add(i + 1); });
    for (const f of fails) got.set(f.line, [...(got.get(f.line) ?? []), f.message]);
    for (const ln of want) if (!got.has(ln)) problems.push(`${name}:${ln}: expected a collision, got nothing`);
    for (const [ln, messages] of got) if (!want.has(ln)) problems.push(`${name}:${ln}: unexpected collision (${messages.join(" | ")})`);
    if (/clean\./.test(name) && want.size) problems.push(`${name}: a clean fixture must not carry expect markers`);
    if (/dirty\./.test(name) && !want.size) problems.push(`${name}: a dirty fixture needs expect markers`);
    lines.push(`${name}: ${want.size ? `${want.size} marked lines` : "no failures"}, ${fails.length} collision(s)`);
    return fails;
  };
  const dirty = check("collisions-dirty.tsx");
  check("collisions-clean.tsx");

  /* The bug this check exists for: the ink's checked fill and the accent's on the Flat switch's pill. */
  const fills = ["group-data-[state=checked]/pill:bg-accent", "group-data-[state=checked]/pill:bg-fg"];
  const switchBug = dirty.find((f) => fills.every((c) => f.classes.includes(c)));
  if (!switchBug) problems.push(`collisions-dirty.tsx: the old switch bug (${fills.join(" with ")}) was not caught`);
  else if (!switchBug.message.includes(`emits ${fills[1]} last`)) problems.push("collisions-dirty.tsx: the old switch bug no longer says the ink wins, so Tailwind's order has changed or the check misreads it");

  lines.forEach((l) => console.log(`  ${l}`));
  if (problems.length) {
    problems.forEach((p) => console.log(`  ✗ ${p}`));
    console.log(`\ncollisions self-test: ${problems.length} problem(s).`);
    return 1;
  }
  console.log("\ncollisions self-test: the old switch bug is caught, every dirty line fails, the clean fixture is clean.");
  return 0;
}

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (e) {
  console.error(e.stack ?? String(e));
  process.exitCode = 2;
}
