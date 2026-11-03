import { describe, expect, it } from "vitest"

import {
  addLocalDays,
  formatDayMonth,
  formatTime,
  formatWeekday,
  formatWeekdayShort,
  isLocalDate,
  isoWeekNumber,
  localDateTime,
  localDayRange,
  localWeekDays,
  todayLocal,
  toLocalDate,
} from "./dates"

describe("Helsingin aika", () => {
  it("muuntaa paikallisen ajan UTC:ksi kesä- ja talviaikana", () => {
    // Kesäaika (UTC+3) päättyi 25.10.2026
    expect(localDateTime("2026-10-23", "08:00").toISOString()).toBe(
      "2026-10-23T05:00:00.000Z",
    )
    expect(localDateTime("2026-10-26", "08:00").toISOString()).toBe(
      "2026-10-26T06:00:00.000Z",
    )
  })

  it("vaihtaa päivän Helsingin keskiyöllä, ei UTC-keskiyöllä", () => {
    // 22.30 UTC on jo seuraava päivä Helsingissä (UTC+2)
    expect(todayLocal(new Date("2026-11-03T22:30:00Z"))).toBe("2026-11-04")
    expect(toLocalDate("2026-11-03T21:59:00Z")).toBe("2026-11-03")
  })

  it("kesäajan vaihtopäivä on 25 tuntia pitkä", () => {
    const { start, end } = localDayRange("2026-10-25")
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25)
  })

  it("laskee kalenteripäiviä kuukauden ja vuoden yli", () => {
    expect(addLocalDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addLocalDays("2026-03-01", -1)).toBe("2026-02-28")
  })

  it("viikko alkaa maanantaista", () => {
    const days = localWeekDays("2026-11-05") // torstai
    expect(days[0]).toBe("2026-11-02")
    expect(days[6]).toBe("2026-11-08")
    expect(isoWeekNumber("2026-11-05")).toBe(45)
  })

  it("validoi päivämäärät", () => {
    expect(isLocalDate("2026-11-03")).toBe(true)
    expect(isLocalDate("2026-02-30")).toBe(false)
    expect(isLocalDate("3.11.2026")).toBe(false)
    expect(isLocalDate(undefined)).toBe(false)
  })
})

describe("suomenkielinen muotoilu", () => {
  it("muotoilee ajat ja päivät", () => {
    expect(formatTime("2026-11-03T06:15:00Z")).toBe("8.15")
    expect(formatWeekday("2026-11-03")).toBe("tiistai")
    expect(formatDayMonth("2026-11-03")).toBe("3. marraskuuta")
    expect(formatWeekdayShort("2026-11-03")).toBe("ti")
  })
})
