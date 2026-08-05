import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: projectRoot,
  plugins: [react()],

  // GitHub Pages Repository 名稱
  base: "/tarot2026/",

  test: {
    environment: "jsdom",
    setupFiles: fileURLToPath(new URL("./src/test/setup.ts", import.meta.url)),
  },
});
