import "server-only"

import { openMeteoWeatherProvider } from "@/integrations/open-meteo/provider"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import { mockCalendarAdmin } from "./mock/calendar-admin"
import { mockCalendarRepository, mockFamilyRepository } from "./mock/family"
import { mockSchoolMenuProvider } from "./mock/school-menu"
import type {
  CalendarAdminRepository,
  CalendarRepository,
  FamilyRepository,
  SchoolMenuProvider,
  WeatherProvider,
} from "./repositories"
import {
  supabaseCalendarAdmin,
  supabaseCalendarRepository,
} from "./supabase/calendar"
import { supabaseFamilyRepository } from "./supabase/family"

/**
 * Palvelinpuolen tietolähteet. Tämä on ainoa kohta, jossa valitaan
 * toteutus. "server-only" estää tiedoston päätymisen selaimen koodiin.
 *
 * - Supabase määritelty → perhe ja kalenterit tietokannasta, kirjautuminen
 *   pakollinen.
 * - Ei määritelty → esittelytila esimerkkidatalla (paikallinen kehitys).
 * Ruokalista on vielä esimerkkidataa (vaihe 4).
 */
export const familyRepository: FamilyRepository = isSupabaseConfigured
  ? supabaseFamilyRepository
  : mockFamilyRepository

export const calendarRepository: CalendarRepository = isSupabaseConfigured
  ? supabaseCalendarRepository
  : mockCalendarRepository

export const calendarAdmin: CalendarAdminRepository = isSupabaseConfigured
  ? supabaseCalendarAdmin
  : mockCalendarAdmin

export const weatherProvider: WeatherProvider = openMeteoWeatherProvider
export const schoolMenuProvider: SchoolMenuProvider = mockSchoolMenuProvider

export const authEnabled = isSupabaseConfigured

/** Kirjautuneen käyttäjän sähköposti, tai null esittelytilassa. */
export async function getSignedInEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email
  return typeof email === "string" ? email : null
}
