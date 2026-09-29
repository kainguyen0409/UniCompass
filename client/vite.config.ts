import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Proxy API requests to the Express server during development
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001"
    }
  },
  test: {
    environment: "jsdom"
  }
});
