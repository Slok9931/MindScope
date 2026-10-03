import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": "/src" } },
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.js"], testTimeout: 30000, css: false },
});
