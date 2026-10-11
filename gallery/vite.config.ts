import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The footer names the litt.md version the tokens come from. Read it from the
// tokens.css header ("litt.md tokens · v0.5") so it can never drift.
const littVersion = /tokens\s*·\s*v([\d.]+)/.exec(fs.readFileSync(here("../skills/litt-md/assets/tokens.css"), "utf8"))?.[1];
if (!littVersion) throw new Error("skills/litt-md/assets/tokens.css: no 'tokens · vX.Y' header to read the version from");
const gallery = JSON.parse(fs.readFileSync(here("./package.json"), "utf8")) as { version: string };

// base "/": the gallery is served from the root of its Vercel deployment and
// routes by hash, so there is no nested path to get wrong.
export default defineConfig({
  base: "/",
  // Radix + Motion in one chunk is fine for a gallery.
  build: { chunkSizeWarningLimit: 800 },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": here("./src") } },
  define: {
    __LITT_MD_VERSION__: JSON.stringify(littVersion),
    __GALLERY_VERSION__: JSON.stringify(gallery.version),
  },
});
