import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["test/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    passWithNoTests: true,
  },
});
