import { describe, expect, it } from "vitest"

import { IcsParseError, parseIcs } from "./parse"

// Keksitty testiaineisto. Ei oikeita kalentereita.
const window = {
  start: new Date("2026-10-01T00:00:00Z"),
  end: new Date("2026-12-31T00:00:00Z"),
}

function calendar(body: string, extra = "") {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Testi//FI",
    extra,
    body,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n")
}

function vevent(lines: string[]) {
  return ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n")
}

describe("parseIcs: ajat ja aikavyöhykkeet", () => {
  it("TZID=Europe/Helsinki ilman VTIMEZONE-määrittelyä (Wilma-tyyli)", () => {
    const [event] = parseIcs(
      calendar(
        vevent([
          "UID:mat-1",
          "DTSTART;TZID=Europe/Helsinki:20261103T081500",
          "DTEND;TZID=Europe/Helsinki:20261103T090000",
          "SUMMARY:Matematiikka",
          "LOCATION:A112",
        ]),
      ),
      window,
    )
    expect(event).toMatchObject({
      uid: "mat-1",
      title: "Matematiikka",
      location: "A112",
      allDay: false,
      start: "2026-11-03T06:15:00.000Z",
      end: "2026-11-03T07:00:00.000Z",
    })
  })

  it("UTC-aika ja kelluva aika", () => {
    const events = parseIcs(
      calendar(
        [
          vevent([
            "UID:utc",
            "DTSTART:20261103T150000Z",
            "DTEND:20261103T163000Z",
            "SUMMARY:Treenit",
          ]),
          vevent([
            "UID:floating",
            "DTSTART:20261103T170000",
            "DTEND:20261103T180000",
            "SUMMARY:Kelluva",
          ]),
        ].join("\r\n"),
      ),
      window,
    )
    const byUid = Object.fromEntries(events.map((e) => [e.uid, e]))
    expect(byUid.utc.start).toBe("2026-11-03T15:00:00.000Z")
    // Kelluva 17.00 tulkitaan Helsingin ajaksi (UTC+2)
    expect(byUid.floating.start).toBe("2026-11-03T15:00:00.000Z")
  })

  it("koko päivän ja monipäiväiset tapahtumat", () => {
    const events = parseIcs(
      calendar(
        [
          vevent([
            "UID:retki",
            "DTSTART;VALUE=DATE:20261106",
            "DTEND;VALUE=DATE:20261107",
            "SUMMARY:Retkipäivä",
          ]),
          vevent([
            "UID:loma",
            "DTSTART;VALUE=DATE:20261019",
            "SUMMARY:Syysloma",
            "DTEND;VALUE=DATE:20261024",
          ]),
          vevent([
            "UID:ilman-loppua",
            "DTSTART;VALUE=DATE:20261110",
            "SUMMARY:Valokuvaus",
          ]),
        ].join("\r\n"),
      ),
      window,
    )
    const byUid = Object.fromEntries(events.map((e) => [e.uid, e]))
    expect(byUid.retki).toMatchObject({
      allDay: true,
      startDate: "2026-11-06",
      endDate: "2026-11-07",
    })
    expect(byUid.loma.endDate).toBe("2026-10-24")
    expect(byUid["ilman-loppua"].endDate).toBe("2026-11-11")
  })
})

describe("parseIcs: toistuvat tapahtumat", () => {
  const recurring = calendar(
    [
      vevent([
        "UID:jalkapallo",
        "DTSTART;TZID=Europe/Helsinki:20261020T170000",
        "DTEND;TZID=Europe/Helsinki:20261020T183000",
        "RRULE:FREQ=WEEKLY;COUNT=5",
        "EXDATE;TZID=Europe/Helsinki:20261103T170000",
        "SUMMARY:Jalkapallotreenit",
      ]),
      vevent([
        "UID:jalkapallo",
        "RECURRENCE-ID;TZID=Europe/Helsinki:20261110T170000",
        "DTSTART;TZID=Europe/Helsinki:20261110T180000",
        "DTEND;TZID=Europe/Helsinki:20261110T193000",
        "SUMMARY:Jalkapallotreenit (siirretty)",
      ]),
    ].join("\r\n"),
  )

  it("purkaa toistot, poikkeukset ja kesäajan vaihtumisen", () => {
    const events = parseIcs(recurring, window)
    expect(events.map((e) => [e.start, e.title])).toEqual([
      ["2026-10-20T14:00:00.000Z", "Jalkapallotreenit"], // kesäaika UTC+3
      ["2026-10-27T15:00:00.000Z", "Jalkapallotreenit"], // talviaika UTC+2
      // 3.11. poistettu (EXDATE)
      ["2026-11-10T16:00:00.000Z", "Jalkapallotreenit (siirretty)"],
      ["2026-11-17T15:00:00.000Z", "Jalkapallotreenit"],
    ])
    // Esiintymien tunnisteet ovat yksilöllisiä
    expect(new Set(events.map((e) => e.occurrenceKey)).size).toBe(4)
  })

  it("rajaa aikavälille", () => {
    const events = parseIcs(recurring, {
      start: new Date("2026-11-01T00:00:00Z"),
      end: new Date("2026-11-15T00:00:00Z"),
    })
    expect(events).toHaveLength(1)
  })
})

describe("parseIcs: virheet ja rajatapaukset", () => {
  it("ohittaa peruutetut tapahtumat", () => {
    const events = parseIcs(
      calendar(
        vevent([
          "UID:peruttu",
          "DTSTART:20261103T150000Z",
          "DTEND:20261103T160000Z",
          "STATUS:CANCELLED",
          "SUMMARY:Peruttu",
        ]),
      ),
      window,
    )
    expect(events).toEqual([])
  })

  it("käyttää syötteen omaa aikavyöhykemäärittelyä (Google-tyyli)", () => {
    const vtimezone = [
      "BEGIN:VTIMEZONE",
      "TZID:Europe/Stockholm",
      "BEGIN:STANDARD",
      "DTSTART:19701025T030000",
      "TZOFFSETFROM:+0200",
      "TZOFFSETTO:+0100",
      "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      "END:STANDARD",
      "BEGIN:DAYLIGHT",
      "DTSTART:19700329T020000",
      "TZOFFSETFROM:+0100",
      "TZOFFSETTO:+0200",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      "END:DAYLIGHT",
      "END:VTIMEZONE",
    ].join("\r\n")
    const [event] = parseIcs(
      calendar(
        vevent([
          "UID:tukholma",
          "DTSTART;TZID=Europe/Stockholm:20261103T100000",
          "DTEND;TZID=Europe/Stockholm:20261103T110000",
          "SUMMARY:Palaveri",
        ]),
        vtimezone,
      ),
      window,
    )
    expect(event.start).toBe("2026-11-03T09:00:00.000Z")
  })

  it("hylkää virheellisen syötteen", () => {
    expect(() => parseIcs("<html>ei kalenteri</html>", window)).toThrow(
      IcsParseError,
    )
  })
})
