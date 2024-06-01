import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/main.ts",
      name: "prettier-plugin-edgejs",
      fileName: "main",
    },
  },
});
