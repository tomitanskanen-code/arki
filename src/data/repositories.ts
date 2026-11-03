import type {
  CalendarEvent,
  CalendarSource,
  CalendarSourceKind,
  Family,
  FamilyMember,
  HomeLocation,
  ManualScheduleEntry,
  SchoolMenuDay,
  ShoppingListItem,
  WeatherSnapshot,
} from "@/domain/types"
import type { InstantRange, LocalDate } from "@/lib/dates"

/**
 * Tietokerroksen rajapinnat.
 *
 * Käyttöliittymä keskustelee vain näiden rajapintojen kanssa. Vaiheessa 1
 * toteutuksena on esimerkkidata (src/data/mock), vaiheessa 2 Supabase ja
 * vaiheessa 3 kalenteri-integraatiot. Käyttöliittymää ei tarvitse muuttaa.
 */

export interface FamilyRepository {
  /** null, jos kirjautunutta käyttäjää ei ole vielä liitetty perheeseen. */
  getFamily(): Promise<Family | null>
  getMembers(): Promise<FamilyMember[]>
  updateHomeLocation(location: HomeLocation): Promise<void>
}

export interface CalendarRepository {
  getSources(): Promise<CalendarSource[]>
  /** Tapahtumat, jotka osuvat annetulle aikavälille. */
  getEvents(range: InstantRange): Promise<CalendarEvent[]>
}

export interface NewCalendarSource {
  kind: Exclude<CalendarSourceKind, "manual">
  name: string
  memberId: string | null
  /** Syötteen osoite. Salataan ennen tallennusta, ei palauteta koskaan. */
  url: string
}

export interface ManualScheduleInput {
  memberId: string
  title: string
  days: { weekday: number; startTime: string; endTime: string }[]
}

/** Kalenterilähteiden hallinta (vain palvelimella, Server Actioneista). */
export interface CalendarAdminRepository {
  /** Lisää lähteen ja hakee sen heti. Palauttaa virheen tekstinä. */
  addSource(input: NewCalendarSource): Promise<{ error: string | null }>
  removeSource(id: string): Promise<void>
  /** Vaihtaa, kenelle kalenteri kuuluu (null = koko perhe). */
  updateSourceMember(id: string, memberId: string | null): Promise<void>
  refreshSource(id: string): Promise<void>
  getManualSchedules(): Promise<ManualScheduleEntry[]>
  /** Korvaa jäsenen koko viikkorytmin. Tyhjä days poistaa rytmin. */
  setManualSchedule(input: ManualScheduleInput): Promise<void>
}

export interface WeatherProvider {
  getToday(location: HomeLocation): Promise<WeatherSnapshot>
}

/**
 * Kouluruokalistan lähde. Lähde riippuu koulusta ja kunnasta, joten oikea
 * toteutus valitaan myöhemmin (esim. kunnan avoin rajapinta tai Jamix).
 */
export interface SchoolMenuProvider {
  /** Palauttaa null, jos päivälle ei ole ruokalistaa (viikonloppu, loma). */
  getMenu(date: LocalDate): Promise<SchoolMenuDay | null>
}

/** Kauppalista toimii selaimessa, jotta muutokset näkyvät heti. */
export interface ShoppingListRepository {
  list(): Promise<ShoppingListItem[]>
  add(name: string): Promise<ShoppingListItem>
  setPurchased(id: string, purchased: boolean): Promise<void>
  remove(id: string): Promise<void>
  /** Kutsuu kuuntelijaa, kun lista muuttuu muualla. Palauttaa peruutusfunktion. */
  subscribe(listener: () => void): () => void
}
