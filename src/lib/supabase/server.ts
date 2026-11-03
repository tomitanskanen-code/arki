import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { supabasePublishableKey, supabaseUrl } from "./config"

/**
 * Supabase-asiakas palvelinkomponenteille ja Server Actioneille.
 * Luodaan pyyntökohtaisesti, koska se lukee pyynnön evästeet.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Palvelinkomponentti ei voi asettaa evästeitä. Istunnon päivitys
          // hoidetaan src/proxy.ts:ssä jokaisen pyynnön alussa.
        }
      },
    },
  })
}
