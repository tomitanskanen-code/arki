import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { supabasePublishableKey, supabaseUrl } from "./config"

/**
 * Asiakas taustatyölle (next/server `after`), joka ajetaan vastauksen
 * jälkeen. Evästeet luetaan valmiiksi, koska palvelinkomponentti ei saa
 * lukea niitä after-kutsun sisällä. Istuntoa ei päivitetä (proxy hoitaa).
 */
export async function createSupabaseBackgroundClient() {
  const snapshot = (await cookies()).getAll()
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => snapshot,
      setAll: () => {},
    },
  })
}

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
