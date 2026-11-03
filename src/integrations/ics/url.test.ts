import { describe, expect, it } from "vitest"

import { isPrivateAddress, validateFeedUrl } from "./url"

describe("validateFeedUrl", () => {
  it("hyväksyy tuetut palvelut", () => {
    const cases = [
      ["https://porvoo.inschool.fi/schedule/export/x.ics?token=t", "wilma"],
      ["https://example.myclub.fi/ical/abc", "myclub"],
      [
        "https://calendar.google.com/calendar/ical/x/private-y/basic.ics",
        "google",
      ],
      ["webcal://porvoo.inschool.fi/x.ics", "wilma"],
    ] as const
    for (const [url, kind] of cases) {
      const result = validateFeedUrl(url)
      expect(result.ok, url).toBe(true)
      if (result.ok) expect(result.suggestedKind).toBe(kind)
    }
  })

  it("hylkää muut osoitteet", () => {
    const rejected = [
      "http://porvoo.inschool.fi/x.ics", // ei https
      "https://evil.example.com/x.ics", // ei sallittu palvelin
      "https://inschool.fi.evil.com/x.ics", // huijausnimi
      "https://notmyclub.fi/x.ics", // huijausnimi
      "https://169.254.169.254/latest/meta-data", // IP
      "https://user:pass@porvoo.inschool.fi/x.ics", // tunnukset
      "https://porvoo.inschool.fi:8443/x.ics", // portti
      "file:///etc/passwd",
      "ei osoite",
    ]
    for (const url of rejected) {
      expect(validateFeedUrl(url).ok, url).toBe(false)
    }
  })
})

describe("isPrivateAddress", () => {
  it("tunnistaa yksityiset osoitteet", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true)
    }
  })

  it("päästää julkiset osoitteet", () => {
    for (const ip of ["142.250.74.46", "2a00:1450:400f:80d::200e"]) {
      expect(isPrivateAddress(ip), ip).toBe(false)
    }
  })
})
