/**
 * Pull one demo out of a page file, as source a reader can copy.
 *
 * Pure text in, text out, with no Vite or DOM, so it runs under plain Node for tests.
 * The page-meta plugin in vite.config.ts counts braces the same way: strings, comments
 * and template literals are skipped, so a `}` inside them never ends a function.
 *
 * What comes out, in order:
 *   1. the import lines the code uses (unused names dropped, "../kit" dropped),
 *   2. the page file's own top-level helpers and constants the demo reaches for,
 *   3. the demo function itself.
 */

/** The page-authoring kit is gallery plumbing, not something a reader copies. */
const DROPPED_MODULES = new Set(["../kit", "./kit"]);

/** Top-level names that belong to the page, not to any demo. */
const PAGE_EXPORTS = new Set(["meta", "docs"]);

type Spec = { imported: string; local: string; type: boolean };
type Import = { module: string; type: boolean; def?: string; ns?: string; named: Spec[]; text: string };
type Decl = { name: string; start: number; end: number; text: string };

const isIdent = (c: string | undefined) => c !== undefined && /[\w$]/.test(c);

/**
 * Walks source text from `from`, calling `visit` on every character that is real code
 * (not inside a string, comment or template literal). `visit` may return true to stop.
 * Returns the index where it stopped, or -1.
 */
function scan(src: string, from: number, visit: (ch: string, i: number) => boolean | void): number {
  const templates: number[] = []; // brace depth at each open `${`
  let depth = 0;
  let inTemplate = false;
  for (let i = from; i < src.length; i++) {
    const ch = src[i]!;
    if (inTemplate) {
      if (ch === "\\") i++;
      else if (ch === "`") inTemplate = false;
      else if (ch === "$" && src[i + 1] === "{") {
        templates.push(depth++);
        i++;
        inTemplate = false;
      }
      continue;
    }
    if (ch === "`") {
      inTemplate = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      /* An apostrophe straight after a letter is JSX text ("Nick's"), not a string. */
      if (ch === "'" && isIdent(src[i - 1])) continue;
      let j = i + 1;
      while (j < src.length && src[j] !== ch && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      if (src[j] === ch) {
        i = j;
        continue;
      }
      continue; // never closed on this line: it was a stray quote in text
    }
    if (ch === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      if (nl < 0) return -1;
      i = nl - 1;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (templates.length && templates[templates.length - 1] === depth) {
        templates.pop();
        inTemplate = true;
        continue;
      }
    }
    if (visit(ch, i)) return i;
  }
  return -1;
}

/** Index of the `}` that closes the first `{` at paren depth 0, starting at `from`. -1 when the body never closes. */
function bodyEnd(src: string, from: number): number {
  let paren = 0;
  let depth = 0;
  let started = false;
  return scan(src, from, (ch) => {
    if (!started) {
      if (ch === "(") paren++;
      else if (ch === ")") paren--;
      else if (ch === "{" && paren === 0) {
        started = true;
        depth = 1;
      }
      return false;
    }
    if (ch === "{") depth++;
    else if (ch === "}") return --depth === 0;
    return false;
  });
}

/** The index just past a `const`, `let` or `type` statement that starts at `from`. */
function statementEnd(src: string, from: number): number {
  let depth = 0;
  const hit = scan(src, from, (ch, i) => {
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (depth === 0 && ch === ";") return true;
    else if (depth === 0 && ch === "\n") {
      /* No semicolon: the statement ends where the next line starts at column 0. */
      const next = src[i + 1];
      if (next !== undefined && next !== "\n" && next !== " " && next !== "\t") return true;
    }
    return false;
  });
  return hit < 0 ? src.length : hit + 1;
}

/**
 * Every top-level declaration in the file, other than imports and the page's own exports.
 * A declaration counts only when it starts a line outside any bracket, string, comment or
 * template literal, so a `const` inside the `docs` usage snippet is never mistaken for one.
 */
function topLevel(src: string): Decl[] {
  const out: Decl[] = [];
  const start = /(export\s+(?:default\s+)?)?(?:async\s+)?(function\*?|const|let|var|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/y;
  let from = 0;
  while (from < src.length) {
    let depth = 0;
    let m: RegExpExecArray | null = null;
    const at = scan(src, from, (ch, i) => {
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") depth--;
      else if (depth === 0 && (i === 0 || src[i - 1] === "\n") && /[a-z]/.test(ch)) {
        start.lastIndex = i;
        m = start.exec(src);
        return m !== null;
      }
      return false;
    });
    if (at < 0 || !m) break;
    const [, exported, kind, name] = m as unknown as [string, string | undefined, string, string];
    const braced = kind.startsWith("function") || kind === "interface" || kind === "class" || kind === "enum";
    const close = braced ? bodyEnd(src, at) : -1;
    const end = braced ? (close < 0 ? -1 : close + 1) : statementEnd(src, at);
    if (end < 0) break;
    if (!exported && !PAGE_EXPORTS.has(name)) out.push({ name, start: at, end, text: src.slice(at, end) });
    from = end;
  }
  return out;
}

/** Split `{ a, b as c, type D }` into specifiers. */
function parseNamed(body: string, whole: boolean): Spec[] {
  return body
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const type = whole || /^type\s+/.test(s);
      const [imported, local] = s.replace(/^type\s+/, "").split(/\s+as\s+/);
      return { imported: imported!, local: local ?? imported!, type };
    });
}

/** The import statements at the top of the file. They stop at the first line of anything else, so an `import` inside a template string is never read. */
function parseImports(src: string): Import[] {
  const out: Import[] = [];
  const re = /import\s+(type\s+)?([^;"']+?)\s+from\s+(["'])([^"']+)\3[ \t]*;?/y;
  const gap = /(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/y; // blank lines and comments between imports
  let at = 0;
  for (;;) {
    gap.lastIndex = at;
    at = gap.exec(src)![0].length + at;
    re.lastIndex = at;
    const m = re.exec(src);
    if (!m) break;
    at = re.lastIndex;
    const [text, type, clause, , module] = m as unknown as [string, string | undefined, string, string, string];
    const imp: Import = { module, type: !!type, named: [], text };
    let rest = clause.trim();
    const ns = /^\*\s+as\s+([\w$]+)$/.exec(rest);
    if (ns) imp.ns = ns[1];
    else {
      const braces = /\{([\s\S]*)\}/.exec(rest);
      if (braces) {
        imp.named = parseNamed(braces[1]!, !!type);
        rest = rest.replace(braces[0], "").replace(/,\s*$/, "").trim();
      }
      if (rest) imp.def = rest;
    }
    out.push(imp);
  }
  return out;
}

/**
 * The code alone: comments and the text of strings and template literals become spaces (code inside a template's
 * `${}` stays), so a name in a comment ("needs a <Toaster> above it") or a class ("size-full") is not a use of it.
 */
function codeOnly(src: string): string {
  const out: string[] = Array.from(src, (c) => (c === "\n" ? "\n" : " "));
  scan(src, 0, (ch, i) => {
    out[i] = ch;
  });
  return out.join("");
}

const uses = (code: string, name: string) =>
  new RegExp(`(?<![\\w$.])${name.replace(/[$]/g, "\\$&")}(?![\\w$])`).test(codeOnly(code));

/** One import line with only the names the code uses, or null when it uses none. */
function trimImport(imp: Import, code: string): string | null {
  const keepDef = imp.def && uses(code, imp.def) ? imp.def : undefined;
  const keepNs = imp.ns && uses(code, imp.ns) ? imp.ns : undefined;
  const kept = imp.named.filter((s) => uses(code, s.local));
  if (!keepDef && !keepNs && !kept.length) return null;
  if (kept.length === imp.named.length && (keepDef || !imp.def) && (keepNs || !imp.ns)) return imp.text.replace(/\s+$/, ""); // nothing to trim: keep the author's line
  const names = kept.map((s) => (s.type && !imp.type ? "type " : "") + (s.imported === s.local ? s.local : `${s.imported} as ${s.local}`));
  const parts = [keepDef, keepNs && `* as ${keepNs}`, names.length ? `{ ${names.join(", ")} }` : undefined].filter(Boolean);
  return `import ${imp.type ? "type " : ""}${parts.join(", ")} from "${imp.module}";`;
}

/** Throws a message an author can act on when `name` is not a top-level function in `src`. */
export function extractDemo(src: string, name: string, where = "the page file"): string {
  const decls = topLevel(src);
  const demo = decls.find((d) => d.name === name && d.text.trimStart().startsWith("function"));
  if (!demo) {
    const known = decls.filter((d) => d.text.startsWith("function")).map((d) => d.name);
    throw new Error(
      `No top-level \`function ${name}(\` in ${where}. A Stage's code prop names a function declared at the top level of the page file` +
        (known.length ? ` (found: ${known.join(", ")}).` : "."),
    );
  }

  /* The demo's own helpers and constants: any other top-level declaration it names, and
     what those name in turn. Kept in file order so a constant lands above its use. */
  const wanted = new Set([demo.name]);
  let code = demo.text;
  for (let grew = true; grew; ) {
    grew = false;
    for (const d of decls) {
      if (wanted.has(d.name) || !uses(code, d.name)) continue;
      wanted.add(d.name);
      code += "\n" + d.text;
      grew = true;
    }
  }
  const body = decls
    .filter((d) => wanted.has(d.name) && d.name !== demo.name)
    .concat(demo)
    .sort((a, b) => a.start - b.start)
    .map((d) => d.text)
    .join("\n\n");

  const lines = parseImports(src)
    .filter((imp) => !DROPPED_MODULES.has(imp.module))
    .map((imp) => trimImport(imp, code))
    .filter((l): l is string => l !== null);
  return (lines.length ? lines.join("\n") + "\n\n" : "") + body;
}
