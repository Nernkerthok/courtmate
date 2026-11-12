import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
const valid =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) &&
  key.startsWith("sb_publishable_");

export const supabase = valid
  ? createClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal ?? AbortSignal.timeout(20000),
          }),
      },
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
