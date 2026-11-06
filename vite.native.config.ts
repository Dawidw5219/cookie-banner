import { defineConfig } from "vite";
import config from "./vite.config";
import { resolve } from "node:path";

export default defineConfig({
	...config,
	build: {
		...config.build,
		emptyOutDir: false,
		lib: {
			entry: resolve(import.meta.dirname, "src/native.ts"),
			formats: ["es"],
			fileName: () => "native.js",
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: false,
				chunkFileNames: "native/[name]-[hash].js",
			},
		},
	},
});
