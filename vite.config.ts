import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "dev-only-csp",
      apply: "serve",
      transformIndexHtml: (html) =>
        html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*\/>/, ""),
    },
  ],
  base: "./",
  cacheDir: ".vite-cache",
  server: {
    host: "127.0.0.1",
    proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: false } },
  },
});
