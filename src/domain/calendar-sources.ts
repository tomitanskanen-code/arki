import {
  addLocalDays,
  type InstantRange,
  localDateTime,
  localWeekdayIndex,
  toLocalDate,
} from "@/lib/dates"

import type {
  CalendarEvent,
  CalendarSourceKind,
  EventCategory,
  ManualScheduleEntry,
  TimedEvent,
} from "./types"

/** Käsin syötettyjen rytmien yhteinen lähdetunnus. */
export const MANUAL_SOURCE_ID = "manual"

/** Lähteen tyyppi määrää tapahtumien oletuskategorian. */
export function categoryForSourceKind(kind: CalendarSourceKind): EventCategory {
  switch (kind) {
    case "wilma":
    case "manual":
      return "school"
    case "myclub":
      return "hobby"
    case "google":
      return "family"
    case "ics":
      return "other"
  }
}

/** Viikkorytmi → yksittäiset tapahtumat annetulla aikavälillä. */
export function expandManualSchedules(
  entries: ManualScheduleEntry[],
  range: InstantRange,
): TimedEvent[] {
  const events: TimedEvent[] = []
  const first = toLocalDate(range.start)
  const last = toLocalDate(new Date(range.end.getTime() - 1))
  for (let date = first; date <= last; date = addLocalDays(date, 1)) {
    const isoWeekday = localWeekdayIndex(date) + 1
    for (const entry of entries) {
      if (entry.weekday !== isoWeekday) continue
      const start = localDateTime(date, entry.startTime)
      const end = localDateTime(date, entry.endTime)
      if (start >= range.end || end <= range.start) continue
      events.push({
        id: `${MANUAL_SOURCE_ID}:${entry.id}:${date}`,
        sourceId: MANUAL_SOURCE_ID,
        externalUid: `${entry.id}:${date}`,
        title: entry.title,
        location: null,
        description: null,
        memberIds: [entry.memberId],
        category: "school",
        allDay: false,
        start: start.toISOString(),
        end: end.toISOString(),
      })
    }
  }
  return events
}

function normalizeTitle(title: string) {
  return title.toLocaleLowerCase("fi").replace(/\s+/g, " ").trim()
}

function timingKey(event: CalendarEvent) {
  return event.allDay
    ? `d:${event.startDate}:${event.endDate}`
    : `t:${new Date(event.start).getTime()}:${new Date(event.end).getTime()}`
}

/**
 * Yhdistää eri lähteistä tulevat samat tapahtumat (sama otsikko ja sama aika),
 * esim. myClub-tapahtuma, joka on kopioitu myös Google-kalenteriin.
 * Ensimmäinen säilyy ja muiden lähteet kirjataan alsoInSourceIds-kenttään.
 * Saman lähteen sisäiset duplikaatit estetään jo tietokannassa.
 */
export function mergeDuplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  const byKey = new Map<string, CalendarEvent>()
  const result: CalendarEvent[] = []
  for (const event of events) {
    const key = `${normalizeTitle(event.title)}|${timingKey(event)}`
    const existing = byKey.get(key)
    if (!existing) {
      const copy = { ...event }
      byKey.set(key, copy)
      result.push(copy)
      continue
    }
    if (existing.sourceId === event.sourceId) continue
    const others = new Set(existing.alsoInSourceIds ?? [])
    others.add(event.sourceId)
    existing.alsoInSourceIds = [...others]
    // Henkilöt yhdistetään: jos toinen on koko perheen, säilytetään tarkempi.
    existing.memberIds = [
      ...new Set([...existing.memberIds, ...event.memberIds]),
    ]
  }
  return result
}
