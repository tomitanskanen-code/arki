"use server"

import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface LoginState {
  step: "email" | "code"
  email?: string
  error?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_PATTERN = /^\d{6,10}$/

/**
 * Kaksivaiheinen kirjautuminen sähköpostikoodilla (OTP).
 * Koodi toimii myös iPhonen kotinäyttösovelluksessa, toisin kuin
 * sähköpostin kirjautumislinkki, joka avautuisi Safariin.
 */
export async function loginAction(
  previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const intent = formData.get("intent")

  if (intent === "back") return { step: "email" }

  if (intent === "send") {
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return { step: "email", error: "Tarkista sähköpostiosoite." }
    }
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Uusia tunnuksia ei luoda: vain kutsutut käyttäjät voivat kirjautua.
      options: { shouldCreateUser: false },
    })
    if (error?.status === 429) {
      return {
        step: "email",
        error: "Liian monta yritystä. Odota hetki ja yritä uudelleen.",
      }
    }
    if (error) {
      // Ei kerrota, onko osoitteella tunnusta. Virhe kirjataan palvelimelle.
      console.warn("Kirjautumiskoodin lähetys epäonnistui:", error.message)
    }
    return { step: "code", email }
  }

  if (intent === "verify") {
    const email = previous.email ?? ""
    const token = String(formData.get("code") ?? "").replace(/\s/g, "")
    if (!email) return { step: "email" }
    if (!CODE_PATTERN.test(token)) {
      return {
        step: "code",
        email,
        error: "Syötä sähköpostissa saamasi koodi.",
      }
    }
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })
    if (error) {
      return {
        step: "code",
        email,
        error: "Koodi on virheellinen tai vanhentunut.",
      }
    }
    redirect("/")
  }

  return { step: "email" }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/kirjaudu")
}
