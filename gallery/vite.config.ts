import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The footer names the litt.md version the tokens come from. Read it from the
// tokens.css header ("litt.md tokens · v0.5") so it can never drift.
const littVersion = /tokens\s*·\s*v([\d.]+)/.exec(fs.readFileSync(here("../skills/litt-md/assets/tokens.css"), "utf8"))?.[1];
if (!littVersion) throw new Error("skills/litt-md/assets/tokens.css: no 'tokens · vX.Y' header to read the version from");
const gallery = JSON.parse(fs.readFileSync(here("./package.json"), "utf8")) as { version: string };

// The nav needs every page's `meta` at once, but not every page's code. This serves
// `pages/x.tsx?page-meta` as a module holding only that page's `export const meta`,
// so the registry can read all of them eagerly while each page stays a lazy chunk.
// Pages are written as before: `export const meta` plus a default component.
function pageMeta(): Plugin {
  // The `{ … }` that starts at src[start], found by counting braces (strings and comments skipped).
  const objectAt = (src: string, start: number) => {
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      const ch = src[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        for (i++; i < src.length && src[i] !== ch; i++) if (src[i] === "\\") i++;
      } else if (ch === "/" && src[i + 1] === "/") {
        i = src.indexOf("\n", i);
        if (i < 0) break;
      } else if (ch === "/" && src[i + 1] === "*") {
        i = src.indexOf("*/", i) + 1;
        if (i < 1) break;
      } else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) return src.slice(start, i + 1);
    }
    return null;
  };
  return {
    name: "litt-page-meta",
    enforce: "pre",
    load(id) {
      if (!/\.tsx\?(?:.*&)?page-meta(?:&|$)/.test(id)) return null;
      const file = id.slice(0, id.indexOf("?"));
      const where = path.relative(here("./"), file);
      const fail = (why: string): never =>
        this.error(`${where}: ${why}. Every file in src/gallery/pages/ is a page: it exports its meta as an object literal, \`export const meta: PageMeta = { … }\`, and a default component. Put helpers outside that folder.`);
      const src = fs.readFileSync(file, "utf8");
      // For `export const meta: PageMeta = {`, only the literal is taken, so the annotation drops away.
      const head = /^export\s+const\s+meta\b[^=]*=\s*(?=\{)/m.exec(src); // line start, so a commented-out copy never matches
      if (!head) return fail("no `export const meta = { … }` found");
      const literal = objectAt(src, head.index + head[0].length);
      if (!literal) return fail("the meta object never closes");
      let meta: unknown;
      try {
        meta = new Function(`return (${literal})`)(); // plain data only: an import in there fails here, not in the browser
      } catch (e) {
        return fail(`meta is not a plain object literal (${(e as Error).message})`);
      }
      return `export const meta = ${JSON.stringify(meta)};`;
    },
  };
}

// base "/": the gallery is served from the root of its Vercel deployment and
// routes by hash, so there is no nested path to get wrong.
export default defineConfig({
  base: "/",
  plugins: [pageMeta(), react(), tailwindcss()],
  resolve: { alias: { "@": here("./src") } },
  define: {
    __LITT_MD_VERSION__: JSON.stringify(littVersion),
    __GALLERY_VERSION__: JSON.stringify(gallery.version),
  },
});
