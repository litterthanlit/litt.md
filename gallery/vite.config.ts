import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// base "./" so the build runs from any folder (preview artifacts, Vercel, a file).
export default defineConfig({
  base: "./",
  // Radix + Motion in one chunk is fine for a gallery.
  build: { chunkSizeWarningLimit: 800 },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
