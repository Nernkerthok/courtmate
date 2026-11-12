import { createClient } from "@supabase/supabase-js";
import { authCallback } from "./authRedirect";

export const initialAuthReturn = authCallback(location.href);

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

export async function googleProviderEnabled(
  signal?: AbortSignal,
): Promise<boolean> {
  if (!valid) return false;
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: signal ?? AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("auth-settings");
  const settings = await response.json();
  return settings?.external?.google === true;
}
