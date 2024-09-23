import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import { fileURLToPath } from "url";

// @ts-ignore
const isProduction = process.env.NODE_ENV === "production";

const profiling = isProduction && {
  "react-dom/client": "react-dom/profiling",
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ["events"],
    }),
    react(),
  ],
  resolve: {
    alias: {
      ...profiling,
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
    },
  },
});
