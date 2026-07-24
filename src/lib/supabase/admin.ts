import { createClient } from "@supabase/supabase-js";

/** Cliente con service_role — bypassa RLS. Usar SÓLO en server actions/actions seguras.
 *  Nunca exponer la service_role key al cliente (no lleva NEXT_PUBLIC_). */
export async function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}