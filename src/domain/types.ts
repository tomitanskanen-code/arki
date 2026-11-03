import type { LocalDate } from "@/lib/dates"

/**
 * Arkin yhteinen tietomalli. Vastaa vaiheen 2 tietokantataulujen rakennetta,
 * mutta kenttänimet ovat TypeScriptin tyyliin (camelCase).
 */

export interface HomeLocation {
  name: string
  latitude: number
  longitude: number
}

export interface Family {
  id: string
  name: string
  timeZone: string
  home: HomeLocation
}

export type MemberRole = "parent" | "child"
export type MemberColor = "sage" | "clay" | "slate" | "ochre"

export interface FamilyMember {
  id: string
  familyId: string
  displayName: string
  role: MemberRole
  color: MemberColor
  /** Kirjautumistunnus (vain vanhemmilla). Lapsilla ei ole tunnuksia. */
  userId: string | null
  sortOrder: number
}

// --- Kalenteri ---

export type CalendarSourceKind =
  "google" | "wilma" | "myclub" | "ics" | "manual"
export type SyncStatus = "ok" | "stale" | "error" | "pending"

/** Yksi kalenterisyöte. Syötteen URL on salaisuus eikä koskaan tule selaimeen. */
export interface CalendarSource {
  id: string
  familyId: string
  kind: CalendarSourceKind
  name: string
  /** Kenen kalenteri; null = koko perheen yhteinen. */
  memberId: string | null
  enabled: boolean
  syncStatus: SyncStatus
  lastSyncedAt: string | null
  lastError: string | null
}

export type EventCategory = "school" | "hobby" | "work" | "family" | "other"

interface BaseEvent {
  id: string
  sourceId: string
  /** Lähdejärjestelmän tunniste (ICS UID). Käytetään duplikaattien estoon. */
  externalUid: string
  title: string
  location: string | null
  description: string | null
  /** Ketä tapahtuma koskee; tyhjä = koko perhe. */
  memberIds: string[]
  category: EventCategory
}

export interface TimedEvent extends BaseEvent {
  allDay: false
  /** UTC ISO -aikaleima */
  start: string
  end: string
}

export interface AllDayEvent extends BaseEvent {
  allDay: true
  startDate: LocalDate
  /** Ensimmäinen päivä, jota tapahtuma EI enää koske (kuten iCal-standardissa). */
  endDate: LocalDate
}

/** Yhteinen normalisoitu tapahtumamalli kaikille lähteille. */
export type CalendarEvent = TimedEvent | AllDayEvent

// --- Sää ---

export type WeatherCondition =
  | "clear"
  | "mostly-clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing-rain"
  | "snow"
  | "rain-showers"
  | "snow-showers"
  | "thunderstorm"

export interface WeatherSnapshot {
  placeName: string
  temperature: number
  condition: WeatherCondition
  isDay: boolean
  todayMax: number
  todayMin: number
  /** Päivän suurin sateen todennäköisyys prosentteina, jos saatavilla. */
  precipitationProbability: number | null
  observedAt: string
}

// --- Kouluruokalista ---

export interface SchoolMenuDay {
  date: LocalDate
  schoolName: string
  mainDish: string
  vegetarianDish: string | null
}

// --- Kauppalista ---

export interface ShoppingListItem {
  id: string
  name: string
  isPurchased: boolean
  purchasedAt: string | null
  createdAt: string
}
