import { describe, expect, it } from "vitest"

import {
  buildDayAgenda,
  eventOverlapsDay,
  filterByMembers,
  summarizeSchoolDay,
} from "./calendar"
import type { AllDayEvent, CalendarEvent, TimedEvent } from "./types"

function timed(
  id: string,
  start: string,
  end: string,
  extra: Partial<TimedEvent> = {},
): TimedEvent {
  return {
    id,
    sourceId: "s",
    externalUid: id,
    title: id,
    location: null,
    description: null,
    memberIds: [],
    category: "family",
    allDay: false,
    start,
    end,
    ...extra,
  }
}

function allDay(
  id: string,
  startDate: string,
  endDate: string,
  extra: Partial<AllDayEvent> = {},
): AllDayEvent {
  return {
    id,
    sourceId: "s",
    externalUid: id,
    title: id,
    location: null,
    description: null,
    memberIds: [],
    category: "family",
    allDay: true,
    startDate,
    endDate,
    ...extra,
  }
}

describe("eventOverlapsDay", () => {
  it("huomioi Helsingin päivärajan", () => {
    // 23.30–00.30 Helsingin aikaa 3.–4.11.
    const e = timed("myöhä", "2026-11-03T21:30:00Z", "2026-11-03T22:30:00Z")
    expect(eventOverlapsDay(e, "2026-11-03")).toBe(true)
    expect(eventOverlapsDay(e, "2026-11-04")).toBe(true)
    expect(eventOverlapsDay(e, "2026-11-05")).toBe(false)
  })

  it("koko päivän tapahtuman loppupäivä ei kuulu tapahtumaan", () => {
    const e = allDay("loma", "2026-11-03", "2026-11-05")
    expect(eventOverlapsDay(e, "2026-11-03")).toBe(true)
    expect(eventOverlapsDay(e, "2026-11-04")).toBe(true)
    expect(eventOverlapsDay(e, "2026-11-05")).toBe(false)
  })

  it("päättyy keskiyöllä → ei näy seuraavana päivänä", () => {
    const e = timed("ilta", "2026-11-03T19:00:00Z", "2026-11-03T22:00:00Z")
    expect(eventOverlapsDay(e, "2026-11-04")).toBe(false)
  })
})

describe("filterByMembers", () => {
  const events: CalendarEvent[] = [
    timed("aino", "2026-11-03T10:00:00Z", "2026-11-03T11:00:00Z", {
      memberIds: ["aino"],
    }),
    timed("eetu", "2026-11-03T10:00:00Z", "2026-11-03T11:00:00Z", {
      memberIds: ["eetu"],
    }),
    timed("perhe", "2026-11-03T10:00:00Z", "2026-11-03T11:00:00Z"),
  ]

  it("näyttää valitut ja koko perheen tapahtumat", () => {
    const ids = filterByMembers(events, new Set(["aino"])).map((e) => e.id)
    expect(ids).toEqual(["aino", "perhe"])
  })

  it("null = kaikki", () => {
    expect(filterByMembers(events, null)).toHaveLength(3)
  })
})

describe("koulupäivä ja agenda", () => {
  const school = { category: "school" as const, memberIds: ["aino"] }
  const events: CalendarEvent[] = [
    timed("matikka", "2026-11-03T07:00:00Z", "2026-11-03T07:45:00Z", school),
    timed("äikkä", "2026-11-03T06:15:00Z", "2026-11-03T07:00:00Z", school),
    allDay("retki", "2026-11-03", "2026-11-04", school),
    timed("treenit", "2026-11-03T15:00:00Z", "2026-11-03T16:30:00Z", {
      category: "hobby",
      memberIds: ["aino"],
    }),
    allDay("mummo", "2026-11-03", "2026-11-04"),
  ]

  it("kokoaa oppitunnit yhteen", () => {
    const summary = summarizeSchoolDay(events, "aino", "2026-11-03")
    expect(summary?.start).toBe("2026-11-03T06:15:00Z")
    expect(summary?.end).toBe("2026-11-03T07:45:00Z")
    expect(summary?.lessons.map((l) => l.id)).toEqual(["äikkä", "matikka"])
    expect(summary?.notes.map((n) => n.id)).toEqual(["retki"])
  })

  it("palauttaa null, jos lapsella ei ole koulua", () => {
    expect(summarizeSchoolDay(events, "eetu", "2026-11-03")).toBeNull()
  })

  it("järjestää agendan: koko päivä ensin, sitten aika", () => {
    const agenda = buildDayAgenda(events, "2026-11-03")
    expect(agenda.map((i) => i.key)).toEqual([
      "mummo",
      "school:aino:2026-11-03",
      "treenit",
    ])
  })
})
