import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// @ts-ignore
const isProduction = process.env.NODE_ENV === "production";

const profiling = isProduction && {
  "react-dom/client": "react-dom/profiling",
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...profiling,
    },
  },
});
