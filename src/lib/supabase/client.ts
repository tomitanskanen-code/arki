import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { supabasePublishableKey, supabaseUrl } from "./config"

let client: SupabaseClient | null = null

/** Selaimen Supabase-asiakas (yksi jaettu instanssi). */
export function getSupabaseBrowserClient() {
  client ??= createBrowserClient(supabaseUrl, supabasePublishableKey)
  return client
}
