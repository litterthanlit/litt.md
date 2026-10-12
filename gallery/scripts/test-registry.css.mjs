/**
 * Helper for test-registry.mjs: read a global stylesheet and find litt blocks that were
 * written twice, the failure you get when a second `shadcn add` appends instead of merging.
 *
 * A tiny CSS reader, not a validator. It splits statements (`@import "x";`), blocks
 * (`@layer base { ... }`, `:root { ... }`) and declarations, honouring strings, comments
 * and parentheses, so `url(data:...;base64,...)` and `"a;b"` do not confuse it.
 */

const collapse = (s) => s.replace(/\s+/g, " ").trim();

/** Parse CSS text into nodes: {kind:"stmt"|"decl"|"block", ...}. Blocks hold `children`. */
export function parseCss(src) {
  let i = 0;

  const skipTrivia = () => {
    while (i < src.length) {
      if (/\s/.test(src[i])) i++;
      else if (src[i] === "/" && src[i + 1] === "*") {
        const end = src.indexOf("*/", i + 2);
        i = end < 0 ? src.length : end + 2;
      } else break;
    }
  };

  const readText = () => {
    // Everything up to the next `;`, `{` or `}` that is outside strings, comments and parentheses.
    const start = i;
    let paren = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'") {
        i++;
        while (i < src.length && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      } else if (c === "/" && src[i + 1] === "*") {
        const end = src.indexOf("*/", i + 2);
        i = end < 0 ? src.length : end + 1;
      } else if (c === "(") paren++;
      else if (c === ")") paren--;
      else if (paren <= 0 && (c === ";" || c === "{" || c === "}")) break;
      i++;
    }
    return collapse(src.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, ""));
  };

  const readList = (nested) => {
    const nodes = [];
    while (i < src.length) {
      skipTrivia();
      if (i >= src.length) break;
      if (src[i] === "}") {
        i++;
        if (nested) return nodes;
        continue;
      }
      if (src[i] === ";") {
        i++;
        continue;
      }
      const text = readText();
      if (src[i] === "{") {
        i++;
        nodes.push({ kind: "block", prelude: text, children: readList(true) });
      } else {
        if (src[i] === ";") i++;
        if (!text) continue;
        if (text.startsWith("@")) nodes.push({ kind: "stmt", text });
        else {
          const colon = text.indexOf(":");
          nodes.push(
            colon < 0 ? { kind: "stmt", text } : { kind: "decl", prop: text.slice(0, colon).trim(), value: collapse(text.slice(colon + 1)) },
          );
        }
      }
    }
    return nodes;
  };

  return readList(false);
}

/** A canonical one-line form of a node, used to compare blocks. */
export function serialize(node) {
  if (node.kind === "stmt") return node.text + ";";
  if (node.kind === "decl") return `${node.prop}:${node.value};`;
  return `${node.prelude}{${node.children.map(serialize).join("")}}`;
}

const isLitt = (node) => /litt/i.test(serialize(node));

/**
 * Problems in a stylesheet that point at a block being added more than once:
 *   - the same statement twice at one level (`@import "x"` twice),
 *   - two identical blocks side by side,
 *   - two blocks with the same prelude that both mention litt,
 *   - one block declaring a --litt-* property more than once.
 * Returns {problems: string[], stats: {littBlocks, littDecls}}.
 */
export function findDuplicateLittBlocks(src) {
  const problems = [];
  const stats = { littBlocks: 0, littDecls: 0 };
  const short = (s) => (s.length > 90 ? s.slice(0, 87) + "..." : s);

  const walk = (nodes, where) => {
    const stmts = new Map();
    const blocksBySerial = new Map();
    const littByPrelude = new Map();
    for (const n of nodes) {
      if (n.kind === "stmt") {
        stmts.set(n.text, (stmts.get(n.text) ?? 0) + 1);
      } else if (n.kind === "block") {
        const serial = serialize(n);
        blocksBySerial.set(serial, (blocksBySerial.get(serial) ?? 0) + 1);
        if (isLitt(n)) {
          stats.littBlocks++;
          littByPrelude.set(n.prelude, (littByPrelude.get(n.prelude) ?? 0) + 1);
        }
        walk(n.children, `${where}${where ? " > " : ""}${n.prelude}`);
      }
    }
    for (const [text, count] of stmts) if (count > 1) problems.push(`${where || "top level"}: "${short(text)}" appears ${count} times`);
    for (const [serial, count] of blocksBySerial)
      if (count > 1) problems.push(`${where || "top level"}: identical block appears ${count} times: ${short(serial)}`);
    for (const [prelude, count] of littByPrelude) {
      // Identical copies are reported above; here, different blocks that share a prelude and both carry litt rules.
      const identical = [...blocksBySerial].some(([s, c]) => c > 1 && s.startsWith(prelude + "{"));
      if (count > 1 && !identical)
        problems.push(
          `${where || "top level"}: ${count} separate "${short(prelude)}" blocks both carry litt rules (a second add appended instead of merging)`,
        );
    }

    // Declarations: a --litt-* property repeated inside one block.
    const decls = nodes.filter((n) => n.kind === "decl");
    const seenProps = new Map();
    for (const d of decls) {
      if (!d.prop.startsWith("--litt-")) continue;
      stats.littDecls++;
      seenProps.set(d.prop, (seenProps.get(d.prop) ?? 0) + 1);
    }
    for (const [prop, count] of seenProps) if (count > 1) problems.push(`${where || "top level"}: ${prop} declared ${count} times in one block`);
  };

  walk(parseCss(src), "");
  return { problems, stats };
}
