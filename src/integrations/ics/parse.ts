import ICAL from "ical.js"

import {
  addLocalDays,
  type InstantRange,
  localDateTime,
  type LocalDate,
  toLocalDate,
} from "@/lib/dates"

/**
 * ICS-syötteen jäsennys yhteiseen muotoon.
 *
 * - Toistuvat tapahtumat (RRULE) puretaan annetulle aikavälille, poikkeukset
 *   (EXDATE, RECURRENCE-ID) huomioidaan.
 * - Aikavyöhykkeet: syötteen omat VTIMEZONE-määrittelyt otetaan käyttöön;
 *   Europe/Helsinki on lisäksi aina tunnettu (kaikki syötteet eivät määrittele
 *   sitä). Aikavyöhykkeettömät ("kelluvat") ajat tulkitaan Helsingin ajaksi.
 * - Peruutetut tapahtumat (STATUS:CANCELLED) ohitetaan.
 */

export class IcsParseError extends Error {}

export interface ParsedEvent {
  uid: string
  /** Esiintymän yksilöivä tunniste saman UID:n sisällä. */
  occurrenceKey: string
  title: string
  location: string | null
  description: string | null
  allDay: boolean
  /** Ajastetuilla tapahtumilla UTC ISO */
  start?: string
  end?: string
  /** Koko päivän tapahtumilla; endDate ei kuulu tapahtumaan */
  startDate?: LocalDate
  endDate?: LocalDate
}

const MAX_OCCURRENCES_PER_EVENT = 1000
const MAX_EVENTS = 5000

const HELSINKI_VTIMEZONE = `BEGIN:VCALENDAR
BEGIN:VTIMEZONE
TZID:Europe/Helsinki
BEGIN:STANDARD
DTSTART:19701025T040000
TZOFFSETFROM:+0300
TZOFFSETTO:+0200
TZNAME:EET
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T030000
TZOFFSETFROM:+0200
TZOFFSETTO:+0300
TZNAME:EEST
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
END:VTIMEZONE
END:VCALENDAR`

function registerHelsinki() {
  if (ICAL.TimezoneService.has("Europe/Helsinki")) return
  const calendar = new ICAL.Component(ICAL.parse(HELSINKI_VTIMEZONE))
  const vtimezone = calendar.getFirstSubcomponent("vtimezone")
  if (vtimezone) ICAL.TimezoneService.register(vtimezone)
}

const pad = (n: number) => String(n).padStart(2, "0")

function toLocalDateString(time: ICAL.Time): LocalDate {
  return `${time.year}-${pad(time.month)}-${pad(time.day)}`
}

function toInstant(time: ICAL.Time): Date {
  const tzid = time.zone?.tzid
  if (!tzid || tzid === "floating") {
    return localDateTime(
      toLocalDateString(time),
      `${pad(time.hour)}:${pad(time.minute)}`,
    )
  }
  return new Date(time.toUnixTime() * 1000)
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function isCancelled(event: ICAL.Event) {
  return (
    String(
      event.component.getFirstPropertyValue("status") ?? "",
    ).toUpperCase() === "CANCELLED"
  )
}

function buildOccurrence(
  event: ICAL.Event,
  key: string,
  start: ICAL.Time,
  end: ICAL.Time | null,
  window: InstantRange,
): ParsedEvent | null {
  if (isCancelled(event)) return null
  const base = {
    uid: event.uid,
    occurrenceKey: key,
    title: text(event.summary, 200) ?? "(ei otsikkoa)",
    location: text(event.location, 200),
    description: text(event.description, 2000),
  }

  if (start.isDate) {
    const startDate = toLocalDateString(start)
    let endDate = end ? toLocalDateString(end) : addLocalDays(startDate, 1)
    if (endDate <= startDate) endDate = addLocalDays(startDate, 1)
    const windowStart = toLocalDate(window.start)
    const windowEnd = toLocalDate(window.end)
    if (endDate <= windowStart || startDate > windowEnd) return null
    return { ...base, allDay: true, startDate, endDate }
  }

  const startAt = toInstant(start)
  let endAt = end && !end.isDate ? toInstant(end) : startAt
  if (endAt < startAt) endAt = startAt
  if (endAt < window.start || startAt >= window.end) return null
  return {
    ...base,
    allDay: false,
    start: startAt.toISOString(),
    end: endAt.toISOString(),
  }
}

export function parseIcs(input: string, window: InstantRange): ParsedEvent[] {
  let calendar: ICAL.Component
  try {
    calendar = new ICAL.Component(ICAL.parse(input))
  } catch {
    throw new IcsParseError("Kalenterisyötettä ei voitu lukea.")
  }

  registerHelsinki()
  for (const vtimezone of calendar.getAllSubcomponents("vtimezone")) {
    ICAL.TimezoneService.register(vtimezone)
  }

  // Ryhmitellään UID:n mukaan: perustapahtuma + sen muokatut esiintymät.
  const masters = new Map<string, ICAL.Event>()
  const exceptions: ICAL.Event[] = []
  for (const component of calendar.getAllSubcomponents("vevent")) {
    const event = new ICAL.Event(component)
    if (!event.uid || !event.startDate) continue
    if (event.isRecurrenceException()) {
      exceptions.push(event)
    } else {
      masters.set(event.uid, event)
    }
  }
  const orphans: ICAL.Event[] = []
  for (const exception of exceptions) {
    const master = masters.get(exception.uid)
    if (master) master.relateException(exception)
    else orphans.push(exception)
  }

  const windowEnd = ICAL.Time.fromJSDate(window.end, true)
  const results: ParsedEvent[] = []

  for (const event of masters.values()) {
    if (results.length >= MAX_EVENTS) break
    if (!event.isRecurring()) {
      const occurrence = buildOccurrence(
        event,
        event.startDate.toString(),
        event.startDate,
        event.endDate,
        window,
      )
      if (occurrence) results.push(occurrence)
      continue
    }

    const iterator = event.iterator()
    for (let i = 0; i < MAX_OCCURRENCES_PER_EVENT; i++) {
      const next = iterator.next()
      if (!next || next.compare(windowEnd) > 0) break
      const details = event.getOccurrenceDetails(next)
      const occurrence = buildOccurrence(
        details.item,
        details.recurrenceId.toString(),
        details.startDate,
        details.endDate,
        window,
      )
      if (occurrence) results.push(occurrence)
    }
  }

  // Muokattu esiintymä ilman perustapahtumaa käsitellään yksittäisenä.
  for (const event of orphans) {
    const occurrence = buildOccurrence(
      event,
      event.recurrenceId?.toString() ?? event.startDate.toString(),
      event.startDate,
      event.endDate,
      window,
    )
    if (occurrence) results.push(occurrence)
  }

  return results
}
