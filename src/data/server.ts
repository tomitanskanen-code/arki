import "server-only"

import { mockCalendarRepository, mockFamilyRepository } from "./mock/family"
import { mockSchoolMenuProvider } from "./mock/school-menu"
import { mockWeatherProvider } from "./mock/weather"
import type {
  CalendarRepository,
  FamilyRepository,
  SchoolMenuProvider,
  WeatherProvider,
} from "./repositories"

/**
 * Palvelinpuolen tietolähteet. Tämä on ainoa kohta, jossa valitaan
 * toteutus: vaiheessa 2 mock-toteutukset vaihdetaan Supabase-versioihin.
 * "server-only" estää tiedoston päätymisen selaimen koodiin.
 */
export const familyRepository: FamilyRepository = mockFamilyRepository
export const calendarRepository: CalendarRepository = mockCalendarRepository
export const weatherProvider: WeatherProvider = mockWeatherProvider
export const schoolMenuProvider: SchoolMenuProvider = mockSchoolMenuProvider
