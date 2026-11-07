import { defineConfig } from "vite";
import config from "../vite.config";

export default defineConfig({
  plugins: config.plugins,
  resolve: config.resolve,
});
