import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],

  // GitHub Pages Repository 名稱
  base: "/tarot2026/",

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
