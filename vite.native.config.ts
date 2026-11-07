import { defineConfig } from "vite";
import config from "./vite.config";
import { resolve } from "node:path";

export default defineConfig({
  ...config,
  build: {
    ...config.build,
    emptyOutDir: false,
    lib: {
      entry: {
        native: resolve(import.meta.dirname, "src/api/native.ts"),
        dev: resolve(import.meta.dirname, "src/api/dev.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        chunkFileNames: "native/[name]-[hash].js",
      },
    },
  },
});
