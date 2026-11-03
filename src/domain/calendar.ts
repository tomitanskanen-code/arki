import { type LocalDate, localDayRange, toLocalDate } from "@/lib/dates"

import type {
  AllDayEvent,
  CalendarEvent,
  CalendarSourceKind,
  TimedEvent,
} from "./types"

export const SOURCE_KIND_LABELS: Record<CalendarSourceKind, string> = {
  google: "Google",
  wilma: "Wilma",
  myclub: "myClub",
  ics: "Kalenterisyöte",
  manual: "Oma merkintä",
}

/** Koskeeko tapahtuma annettua kalenteripäivää (Helsingin aikaa)? */
export function eventOverlapsDay(event: CalendarEvent, date: LocalDate) {
  if (event.allDay) {
    return event.startDate <= date && date < event.endDate
  }
  const day = localDayRange(date)
  const start = new Date(event.start)
  const end = new Date(event.end)
  // Nollan mittainen tapahtuma (alku = loppu) näytetään alkamispäivänään.
  if (start.getTime() === end.getTime()) return toLocalDate(start) === date
  return start < day.end && end > day.start
}

/** Koko päivän tapahtumat ensin, sitten alkamisajan ja otsikon mukaan. */
export function compareEvents(a: CalendarEvent, b: CalendarEvent) {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  if (!a.allDay && !b.allDay && a.start !== b.start) {
    return a.start < b.start ? -1 : 1
  }
  return a.title.localeCompare(b.title, "fi")
}

export function eventsForDay(events: CalendarEvent[], date: LocalDate) {
  return events.filter((e) => eventOverlapsDay(e, date)).sort(compareEvents)
}

/**
 * Suodattaa tapahtumat valittujen perheenjäsenten mukaan.
 * Koko perheen yhteiset tapahtumat (memberIds tyhjä) näytetään aina.
 * selected = null tarkoittaa "kaikki".
 */
export function filterByMembers(
  events: CalendarEvent[],
  selected: ReadonlySet<string> | null,
) {
  if (!selected) return events
  return events.filter(
    (e) =>
      e.memberIds.length === 0 || e.memberIds.some((id) => selected.has(id)),
  )
}

// --- Koulupäivät ---

export interface SchoolDaySummary {
  memberId: string
  date: LocalDate
  /** Ensimmäisen oppitunnin alku ja viimeisen loppu; null jos ei oppitunteja. */
  start: string | null
  end: string | null
  lessons: TimedEvent[]
  /** Koulun koko päivän merkinnät, esim. retkipäivä. */
  notes: AllDayEvent[]
}

export function summarizeSchoolDay(
  events: CalendarEvent[],
  memberId: string,
  date: LocalDate,
): SchoolDaySummary | null {
  const own = eventsForDay(events, date).filter(
    (e) => e.category === "school" && e.memberIds.includes(memberId),
  )
  const lessons = own.filter((e): e is TimedEvent => !e.allDay)
  const notes = own.filter((e): e is AllDayEvent => e.allDay)
  if (lessons.length === 0 && notes.length === 0) return null

  const end = lessons.reduce<string | null>(
    (latest, l) => (latest === null || l.end > latest ? l.end : latest),
    null,
  )
  return {
    memberId,
    date,
    start: lessons[0]?.start ?? null,
    end,
    lessons,
    notes,
  }
}

// --- Päivän agenda ---

export type AgendaItem =
  | { type: "event"; key: string; event: CalendarEvent }
  | { type: "school"; key: string; summary: SchoolDaySummary }

function agendaSortKey(item: AgendaItem): [number, string] {
  if (item.type === "event") {
    return item.event.allDay ? [0, ""] : [1, item.event.start]
  }
  return item.summary.start ? [1, item.summary.start] : [0, ""]
}

/**
 * Rakentaa päivän agendan: koulun yksittäiset oppitunnit kootaan yhdeksi
 * "koulupäivä"-riviksi lasta kohden, jotta näkymä pysyy rauhallisena.
 */
export function buildDayAgenda(
  events: CalendarEvent[],
  date: LocalDate,
): AgendaItem[] {
  const dayEvents = eventsForDay(events, date)
  const items: AgendaItem[] = []
  const schoolMembers = new Set<string>()

  for (const event of dayEvents) {
    if (event.category === "school" && event.memberIds.length > 0) {
      event.memberIds.forEach((id) => schoolMembers.add(id))
    } else {
      items.push({ type: "event", key: event.id, event })
    }
  }

  for (const memberId of schoolMembers) {
    const summary = summarizeSchoolDay(dayEvents, memberId, date)
    if (summary) {
      items.push({ type: "school", key: `school:${memberId}:${date}`, summary })
    }
  }

  return items.sort((a, b) => {
    const [ga, ta] = agendaSortKey(a)
    const [gb, tb] = agendaSortKey(b)
    return ga - gb || (ta < tb ? -1 : ta > tb ? 1 : 0)
  })
}
