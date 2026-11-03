import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type Rollup } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The footer names the litt.md version the tokens come from. Read it from the
// tokens.css header ("litt.md tokens · v0.5") so it can never drift.
const littVersion = /tokens\s*·\s*v([\d.]+)/.exec(fs.readFileSync(here("../skills/litt-md/assets/tokens.css"), "utf8"))?.[1];
if (!littVersion) throw new Error("skills/litt-md/assets/tokens.css: no 'tokens · vX.Y' header to read the version from");
const gallery = JSON.parse(fs.readFileSync(here("./package.json"), "utf8")) as { version: string };

// The `{ … }` that starts at src[start], found by counting braces (strings and comments skipped).
function objectAt(src: string, start: number) {
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
}

type Meta = { id: string; order: number } & Record<string, unknown>;

// A page's `export const meta = { … }`, read from its source as plain data. Throws the message a build should show.
function readPageMeta(file: string): Meta {
  const where = path.relative(here("./"), file);
  const fail = (why: string): never => {
    throw new Error(`${where}: ${why}. Every file in src/gallery/pages/ is a page: it exports its meta as an object literal, \`export const meta: PageMeta = { … }\`, and a default component. Put helpers outside that folder.`);
  };
  const src = fs.readFileSync(file, "utf8");
  // For `export const meta: PageMeta = {`, only the literal is taken, so the annotation drops away.
  const head = /^export\s+const\s+meta\b[^=]*=\s*(?=\{)/m.exec(src); // line start, so a commented-out copy never matches
  if (!head) return fail("no `export const meta = { … }` found");
  const literal = objectAt(src, head.index + head[0].length);
  if (!literal) return fail("the meta object never closes");
  try {
    return new Function(`return (${literal})`)() as Meta; // plain data only: an import in there fails here, not in the browser
  } catch (e) {
    return fail(`meta is not a plain object literal (${(e as Error).message})`);
  }
}

// The nav needs every page's `meta` at once, but not every page's code. This serves
// `pages/x.tsx?page-meta` as a module holding only that page's `export const meta`,
// so the registry can read all of them eagerly while each page stays a lazy chunk.
// Pages are written as before: `export const meta` plus a default component.
function pageMeta(): Plugin {
  return {
    name: "litt-page-meta",
    enforce: "pre",
    load(id) {
      if (!/\.tsx\?(?:.*&)?page-meta(?:&|$)/.test(id)) return null;
      try {
        return `export const meta = ${JSON.stringify(readPageMeta(id.slice(0, id.indexOf("?"))))};`;
      } catch (e) {
        return this.error((e as Error).message);
      }
    },
  };
}

const PAGES = here("./src/gallery/pages/");

// The page a visit opens is named by the hash, and its chunk is asked for only once the main chunk has run, so on a
// slow phone it downloads after it. This writes each page's chunk files into index.html with a script that preloads
// the current page's, so the two download together. No hash, or one that names no page, opens the first page, as
// the app does. Dev serves modules as they are asked for and has no bundle, so it gets nothing.
function pagePreload(): Plugin {
  let base = "/";
  return {
    name: "litt-page-preload",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, { bundle }) {
        if (!bundle) return;
        const chunks = Object.values(bundle).filter((c): c is Rollup.OutputChunk => c.type === "chunk");
        const entry = chunks.find((c) => c.isEntry);
        if (!entry) return;
        const shared = new Set([entry.fileName, ...entry.imports]);
        const files: Record<string, string[]> = {};
        let first: Meta | undefined;
        for (const chunk of chunks) {
          const file = chunk.facadeModuleId;
          if (!file || !file.startsWith(PAGES) || file.includes("?")) continue;
          const meta = readPageMeta(file);
          if (!first || meta.order < first.order) first = meta;
          const own: string[] = [];
          const walk = (name: string) => {
            if (shared.has(name) || own.includes(name)) return;
            own.push(name);
            const dep = bundle[name];
            if (dep?.type === "chunk") dep.imports.forEach(walk);
          };
          walk(chunk.fileName);
          files[meta.id] = own;
        }
        if (!first) return;
        /* Every chunk is `assets/<name>-<hash>.js`; the map keeps the names only, so it weighs a tenth of the main chunk's gzip. */
        const dir = entry.fileName.slice(0, entry.fileName.lastIndexOf("/") + 1);
        const name = (f: string) => {
          if (!f.startsWith(dir) || !f.endsWith(".js")) throw new Error(`${f}: a chunk outside ${dir}*.js, which the page preload map cannot name`);
          return f.slice(dir.length, -3);
        };
        const names = Object.fromEntries(Object.entries(files).map(([id, own]) => [id, own.map(name)]));
        const script = `(function(){var m=${JSON.stringify(names)};var h="";try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}(m[h]||m[${JSON.stringify(first.id)}]).forEach(function(f){var l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href=${JSON.stringify(base + dir)}+f+".js";document.head.appendChild(l)})})();`;
        /* Before the first stylesheet: a script after one waits for it, and the fonts' is a round trip to Google. */
        const at = /<link\b[^>]*rel="stylesheet"/.exec(html)?.index ?? html.indexOf("</head>");
        return `${html.slice(0, at)}<script>${script}</script>\n${html.slice(at)}`;
      },
    },
  };
}

// base "/": the gallery is served from the root of its Vercel deployment and
// routes by hash, so there is no nested path to get wrong.
export default defineConfig({
  base: "/",
  plugins: [pageMeta(), pagePreload(), react(), tailwindcss()],
  resolve: { alias: { "@": here("./src") } },
  build: {
    rollupOptions: {
      output: {
        /* React and Motion in chunks of their own: every page needs them, they change only with their package, and a
           deploy that touches any page would otherwise send them again inside the main chunk. */
        manualChunks(id) {
          if (/\/node_modules\/(?:react|react-dom|scheduler)\//.test(id)) return "react";
          if (/\/node_modules\/(?:motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return "motion";
          return undefined;
        },
      },
    },
  },
  define: {
    __LITT_MD_VERSION__: JSON.stringify(littVersion),
    __GALLERY_VERSION__: JSON.stringify(gallery.version),
  },
});
