import { describe, expect, it } from "vitest"

import { localWeekRange } from "@/lib/dates"

import {
  expandManualSchedules,
  MANUAL_SOURCE_ID,
  mergeDuplicateEvents,
} from "./calendar-sources"
import type { CalendarEvent, ManualScheduleEntry } from "./types"

describe("expandManualSchedules", () => {
  const preschool: ManualScheduleEntry[] = [1, 2, 3, 4, 5].map((weekday) => ({
    id: `e${weekday}`,
    memberId: "noel",
    title: "Esikoulu",
    weekday,
    startTime: "08:00",
    endTime: "12:00",
  }))

  it("luo arkipäiville tapahtumat Helsingin aikaan", () => {
    // Viikko 45/2026: ma 2.11.–su 8.11. (talviaika, UTC+2)
    const events = expandManualSchedules(
      preschool,
      localWeekRange("2026-11-04"),
    )
    expect(events).toHaveLength(5)
    expect(events[0]).toMatchObject({
      sourceId: MANUAL_SOURCE_ID,
      title: "Esikoulu",
      memberIds: ["noel"],
      category: "school",
      start: "2026-11-02T06:00:00.000Z",
      end: "2026-11-02T10:00:00.000Z",
    })
  })

  it("huomioi kesäajan", () => {
    const events = expandManualSchedules(
      preschool,
      localWeekRange("2026-10-21"),
    )
    expect(events[0].start).toBe("2026-10-19T05:00:00.000Z")
  })
})

describe("mergeDuplicateEvents", () => {
  const base = {
    externalUid: "x",
    location: null,
    description: null,
    category: "hobby" as const,
    allDay: false as const,
    start: "2026-11-03T15:00:00.000Z",
    end: "2026-11-03T16:30:00.000Z",
  }
  const events: CalendarEvent[] = [
    {
      ...base,
      id: "a",
      sourceId: "myclub",
      title: "Jalkapallo",
      memberIds: ["hugo"],
    },
    {
      ...base,
      id: "b",
      sourceId: "google",
      title: " jalkapallo ",
      memberIds: [],
    },
    { ...base, id: "c", sourceId: "google", title: "Uinti", memberIds: [] },
  ]

  it("yhdistää saman tapahtuman eri lähteistä", () => {
    const merged = mergeDuplicateEvents(events)
    expect(merged.map((e) => e.id)).toEqual(["a", "c"])
    expect(merged[0].alsoInSourceIds).toEqual(["google"])
    expect(merged[0].memberIds).toEqual(["hugo"])
  })

  it("ei muuta alkuperäisiä olioita", () => {
    mergeDuplicateEvents(events)
    expect(events[0].alsoInSourceIds).toBeUndefined()
  })
})
