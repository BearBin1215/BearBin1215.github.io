import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { plugin as mdPlugin, Mode } from "vite-plugin-markdown";

export default defineConfig({
  plugins: [react(), svgr(), tailwindcss(), mdPlugin({ mode: [Mode.MARKDOWN] })],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 750,
  },
  server: {
    port: 9029,
    host: true,
  },
});
