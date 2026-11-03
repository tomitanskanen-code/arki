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

/**
 * Kehittäjän kytkin: NEXT_PUBLIC_ARKI_DEMO=1 pakottaa esittelytilan, vaikka
 * Supabase-avaimet olisivat .env.local-tiedostossa (ulkoasun tarkistus ilman
 * kirjautumista). Ei käytetä tuotannossa.
 */
const forceDemo = process.env.NEXT_PUBLIC_ARKI_DEMO === "1"

export const isSupabaseConfigured =
  !forceDemo && Boolean(supabaseUrl && supabasePublishableKey)
