import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Only PUBLIC config is read here. Never put a service-role key in VITE_* vars.
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;

export const supabaseConfigured = Boolean(url && key && /^https:\/\/[^\s]+$/.test(url));

let client: SupabaseClient | null = null;
/** Returns null when unconfigured — callers must fail closed. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  client ??= createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, flowType: "pkce", detectSessionInUrl: false } });
  return client;
}
