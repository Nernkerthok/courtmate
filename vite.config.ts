import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const endpoint = env.VITE_SUPABASE_URL?.trim() || "";
  const cloudOrigin = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(endpoint)
    ? new URL(endpoint).origin
    : "";
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "cloud-csp",
        transformIndexHtml: (html) =>
          cloudOrigin
            ? html.replace(
                "connect-src 'self';",
                `connect-src 'self' ${cloudOrigin};`,
              )
            : html,
      },
      {
        name: "dev-only-csp",
        apply: "serve",
        transformIndexHtml: (html) =>
          html.replace(
            /<meta\s+http-equiv="Content-Security-Policy"[^>]*\/>/,
            "",
          ),
      },
    ],
    base: "./",
    cacheDir: ".vite-cache",
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": { target: "http://127.0.0.1:8000", changeOrigin: false },
      },
    },
  };
});
