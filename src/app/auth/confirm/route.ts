import type { EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Sähköpostilinkin käsittely (varamenetelmä koodille).
 *
 * Supabase lähettää linkin mm. silloin, kun tunnusta ei ole vielä
 * vahvistettu ("Confirm signup"). Linkki toimii samassa selaimessa, josta
 * kirjautuminen aloitettiin. iPhonen kotinäyttösovelluksessa käytetään koodia.
 */
const ALLOWED_TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite"]

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const code = params.get("code")
  const tokenHash = params.get("token_hash")
  const type = params.get("type") as EmailOtpType | null

  const supabase = await createSupabaseServerClient()
  let ok = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  } else if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    ok = !error
  }

  // Ohjataan aina sovelluksen omaan osoitteeseen, ei parametrina annettuun.
  const target = ok ? "/" : "/kirjaudu?virhe=linkki"
  return NextResponse.redirect(new URL(target, request.url))
}
