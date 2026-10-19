import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      "/api":
        loadEnv(mode, ".", "TM_").TM_API_TARGET || "http://localhost:8080",
    },
  },
}));
