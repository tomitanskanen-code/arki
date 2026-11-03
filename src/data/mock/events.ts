import type {
  AllDayEvent,
  CalendarEvent,
  EventCategory,
  TimedEvent,
} from "@/domain/types"
import {
  addLocalDays,
  type InstantRange,
  isoWeekNumber,
  type LocalDate,
  localDateTime,
  localWeekdayIndex,
  toLocalDate,
} from "@/lib/dates"

import { MEMBER, SOURCE } from "./fixtures"

/**
 * Esimerkkitapahtumien generaattori. Tapahtumat luodaan viikonpäivän
 * perusteella mille tahansa päivälle, joten data näyttää aina ajankohtaiselta.
 * Vaiheessa 3 tämä korvautuu oikeilla Google-, Wilma- ja myClub-syötteillä.
 */

type Lesson = [time: string, subject: string]

const LESSON_MINUTES = 45

// Maanantai–perjantai
const AINO_LESSONS: Lesson[][] = [
  [
    ["08:15", "Äidinkieli"],
    ["09:00", "Matematiikka"],
    ["10:15", "Englanti"],
    ["11:30", "Ympäristöoppi"],
    ["12:15", "Kuvataide"],
  ],
  [
    ["08:15", "Elämänkatsomustieto"],
    ["09:00", "Äidinkieli"],
    ["10:15", "Liikunta"],
    ["11:00", "Liikunta"],
    ["12:15", "Musiikki"],
    ["13:00", "Matematiikka"],
  ],
  [
    ["08:15", "Matematiikka"],
    ["09:00", "Englanti"],
    ["10:15", "Äidinkieli"],
    ["11:30", "Käsityö"],
    ["12:15", "Käsityö"],
  ],
  [
    ["09:00", "Ympäristöoppi"],
    ["10:15", "Matematiikka"],
    ["11:30", "Äidinkieli"],
    ["12:15", "Historia"],
  ],
  [
    ["08:15", "Äidinkieli"],
    ["09:00", "Liikunta"],
    ["10:15", "Englanti"],
    ["11:30", "Matematiikka"],
  ],
]

const EETU_LESSONS: Lesson[][] = [
  [
    ["09:00", "Äidinkieli"],
    ["10:15", "Matematiikka"],
    ["11:30", "Ympäristöoppi"],
    ["12:15", "Musiikki"],
  ],
  [
    ["08:15", "Matematiikka"],
    ["09:00", "Äidinkieli"],
    ["10:15", "Liikunta"],
    ["11:30", "Kuvataide"],
  ],
  [
    ["09:00", "Äidinkieli"],
    ["10:15", "Englanti"],
    ["11:30", "Matematiikka"],
  ],
  [
    ["08:15", "Liikunta"],
    ["09:00", "Matematiikka"],
    ["10:15", "Äidinkieli"],
    ["11:30", "Käsityö"],
  ],
  [
    ["09:00", "Ympäristöoppi"],
    ["10:15", "Äidinkieli"],
    ["11:30", "Matematiikka"],
  ],
]

interface TimedSpec {
  sourceId: string
  slug: string
  title: string
  start: string
  end: string
  memberIds: string[]
  category: EventCategory
  location?: string
  description?: string
}

function timed(date: LocalDate, spec: TimedSpec): TimedEvent {
  const uid = `${spec.sourceId}:${date}:${spec.slug}`
  return {
    id: uid,
    externalUid: uid,
    sourceId: spec.sourceId,
    title: spec.title,
    location: spec.location ?? null,
    description: spec.description ?? null,
    memberIds: spec.memberIds,
    category: spec.category,
    allDay: false,
    start: localDateTime(date, spec.start).toISOString(),
    end: localDateTime(date, spec.end).toISOString(),
  }
}

function allDay(
  date: LocalDate,
  spec: Omit<TimedSpec, "start" | "end">,
): AllDayEvent {
  const uid = `${spec.sourceId}:${date}:${spec.slug}`
  return {
    id: uid,
    externalUid: uid,
    sourceId: spec.sourceId,
    title: spec.title,
    location: spec.location ?? null,
    description: spec.description ?? null,
    memberIds: spec.memberIds,
    category: spec.category,
    allDay: true,
    startDate: date,
    endDate: addLocalDays(date, 1),
  }
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function lessons(
  date: LocalDate,
  sourceId: string,
  memberId: string,
  room: string,
  schedule: Lesson[],
) {
  return schedule.map(([time, subject], i) =>
    timed(date, {
      sourceId,
      slug: `oppitunti-${i + 1}`,
      title: subject,
      start: time,
      end: addMinutes(time, LESSON_MINUTES),
      memberIds: [memberId],
      category: "school",
      location: room,
    }),
  )
}

function eventsForDate(date: LocalDate): CalendarEvent[] {
  const weekday = localWeekdayIndex(date) // 0 = ma
  const evenWeek = isoWeekNumber(date) % 2 === 0
  const events: CalendarEvent[] = []

  // --- Koulu (Wilma) ---
  if (weekday < 5) {
    events.push(
      ...lessons(
        date,
        SOURCE.wilmaAino,
        MEMBER.aino,
        "Luokka 4B",
        AINO_LESSONS[weekday],
      ),
      ...lessons(
        date,
        SOURCE.wilmaEetu,
        MEMBER.eetu,
        "Luokka 2A",
        EETU_LESSONS[weekday],
      ),
    )
  }
  if (weekday === 4 && evenWeek) {
    events.push(
      allDay(date, {
        sourceId: SOURCE.wilmaAino,
        slug: "retkipaiva",
        title: "Retkipäivä – omat eväät mukaan",
        memberIds: [MEMBER.aino],
        category: "school",
        description: "Luokka retkeilee Keskuspuistossa. Säänmukainen vaatetus.",
      }),
    )
  }
  if (weekday === 2 && !evenWeek) {
    events.push(
      allDay(date, {
        sourceId: SOURCE.wilmaEetu,
        slug: "kirjastopaiva",
        title: "Kirjastopäivä – palauta lainat",
        memberIds: [MEMBER.eetu],
        category: "school",
      }),
    )
  }

  // --- Harrastukset (myClub) ---
  if (weekday === 1 || weekday === 3) {
    events.push(
      timed(date, {
        sourceId: SOURCE.footballAino,
        slug: "treenit",
        title: "Jalkapallotreenit",
        start: "17:00",
        end: "18:30",
        memberIds: [MEMBER.aino],
        category: "hobby",
        location: "Kontulan tekonurmi",
        description: "Juomapullo ja säärisuojat mukaan.",
      }),
    )
  }
  if (weekday === 5) {
    events.push(
      timed(date, {
        sourceId: SOURCE.footballAino,
        slug: "ottelu",
        title: "Ottelu: FC Esimerkki – PK-35",
        start: "10:00",
        end: "11:30",
        memberIds: [MEMBER.aino],
        category: "hobby",
        location: "Tapulikaupungin kenttä",
        description: "Kokoontuminen klo 9.30. Pelipaita mukaan.",
      }),
    )
  }
  if (weekday === 0 || weekday === 2) {
    events.push(
      timed(date, {
        sourceId: SOURCE.swimmingEetu,
        slug: "uinti",
        title: "Uintikoulu",
        start: "17:30",
        end: "18:15",
        memberIds: [MEMBER.eetu],
        category: "hobby",
        location: "Itäkeskuksen uimahalli",
        description: "Uimalakki ja pyyhe mukaan.",
      }),
    )
  }

  // --- Perheen kalenteri (Google) ---
  const family = SOURCE.family
  if (weekday === 0) {
    events.push(
      timed(date, {
        sourceId: family,
        slug: "sulkapallo",
        title: "Sulkapallo",
        start: "19:30",
        end: "21:00",
        memberIds: [MEMBER.mikko],
        category: "hobby",
        location: "Liikuntamylly",
      }),
    )
  }
  if (weekday === 1) {
    events.push(
      timed(date, {
        sourceId: family,
        slug: "hammaslaakari",
        title: "Eetun hammastarkastus",
        start: "15:30",
        end: "16:00",
        memberIds: [MEMBER.eetu, MEMBER.laura],
        category: "family",
        location: "Itäkeskuksen hammashoitola",
      }),
    )
    if (evenWeek) {
      events.push(
        timed(date, {
          sourceId: family,
          slug: "aamupalaveri",
          title: "Aamupalaveri toimistolla",
          start: "08:00",
          end: "09:00",
          memberIds: [MEMBER.mikko],
          category: "work",
        }),
      )
    }
  }
  if (weekday === 2 && evenWeek) {
    events.push(
      timed(date, {
        sourceId: family,
        slug: "vanhempainilta",
        title: "Vanhempainilta",
        start: "18:00",
        end: "19:30",
        memberIds: [MEMBER.laura],
        category: "family",
        location: "Koulun auditorio",
        description: "Aiheena syksyn retket ja leirikoulu.",
      }),
    )
  }
  if (weekday === 3) {
    events.push(
      timed(date, {
        sourceId: family,
        slug: "jooga",
        title: "Jooga",
        start: "19:00",
        end: "20:15",
        memberIds: [MEMBER.laura],
        category: "hobby",
      }),
    )
  }
  if (weekday === 4) {
    events.push(
      timed(date, {
        sourceId: family,
        slug: "pizzailta",
        title: "Pizzailta",
        start: "18:00",
        end: "19:30",
        memberIds: [],
        category: "family",
      }),
    )
  }
  if (weekday === 6) {
    events.push(
      timed(date, {
        sourceId: family,
        slug: "mummola",
        title: "Mummolassa",
        start: "13:00",
        end: "16:00",
        memberIds: [],
        category: "family",
        location: "Porvoo",
      }),
    )
  }

  return events
}

export function generateMockEvents(range: InstantRange): CalendarEvent[] {
  const first = toLocalDate(range.start)
  const last = toLocalDate(new Date(range.end.getTime() - 1))
  const events: CalendarEvent[] = []
  for (let date = first; date <= last; date = addLocalDays(date, 1)) {
    events.push(...eventsForDate(date))
  }
  return events
}
