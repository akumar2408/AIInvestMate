// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"), // <— change from dist/public to dist
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:5001", changeOrigin: true } },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "client/src") } },
});
