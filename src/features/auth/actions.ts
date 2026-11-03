"use server"

import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface LoginState {
  email?: string
  error?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Kirjautuminen sähköpostilla ja salasanalla.
 *
 * Tunnukset luodaan ylläpitäjänä Supabasen hallintapaneelissa; sovelluksessa
 * ei ole rekisteröitymistä. Sähköposteja ei lähetetä, joten kirjautuminen
 * toimii samoin selaimessa ja iPhonen kotinäyttösovelluksessa.
 */
export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!EMAIL_PATTERN.test(email) || email.length > 254 || !password) {
    return { email, error: "Anna sähköposti ja salasana." }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error?.status === 429) {
    return {
      email,
      error: "Liian monta yritystä. Odota hetki ja yritä uudelleen.",
    }
  }
  if (error) {
    // Ei kerrota, kumpi tieto oli väärin.
    return { email, error: "Sähköposti tai salasana on väärin." }
  }
  redirect("/")
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/kirjaudu")
}
