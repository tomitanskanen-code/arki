/**
 * Supabase-asetukset ympäristömuuttujista.
 *
 * Jos muuttujia ei ole asetettu, sovellus toimii esittelytilassa
 * esimerkkidatalla ilman kirjautumista (paikallinen kehitys ilman tunnuksia).
 * NEXT_PUBLIC_-arvot ovat julkisia: suojaus perustuu RLS-käytäntöihin.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
)
