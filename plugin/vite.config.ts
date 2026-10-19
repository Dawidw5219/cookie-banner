import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
	plugins: [preact(), tailwindcss()],
	build: {
		outDir: "assets/admin",
		emptyOutDir: true,
		rollupOptions: {
			input: resolve(__dirname, "src/main.tsx"),
			output: {
				entryFileNames: "admin.js",
				assetFileNames: "admin[extname]",
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
