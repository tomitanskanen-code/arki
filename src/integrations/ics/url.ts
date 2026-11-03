import { isIP } from "node:net"

import type { CalendarSourceKind } from "@/domain/types"

/**
 * Syöteosoitteen tarkistus (SSRF-suojaus, osa 1/2).
 *
 * Palvelin hakee käyttäjän antamia osoitteita, joten ilman rajoituksia sitä
 * voisi käyttää hakemaan sisäverkon tai pilvipalvelun sisäisiä osoitteita.
 * Siksi sallitaan vain https ja tunnetut kalenteripalvelut.
 * Osa 2/2 (DNS-tarkistus ja uudelleenohjaukset) on tiedostossa fetch.ts.
 */

const ALLOWED_HOSTS: { suffix: string; kind: CalendarSourceKind }[] = [
  { suffix: ".inschool.fi", kind: "wilma" },
  { suffix: "myclub.fi", kind: "myclub" },
  { suffix: "calendar.google.com", kind: "google" },
]

export type FeedUrlResult =
  | { ok: true; url: URL; host: string; suggestedKind: CalendarSourceKind }
  | { ok: false; error: string }

function matchHost(host: string) {
  return ALLOWED_HOSTS.find(({ suffix }) =>
    suffix.startsWith(".")
      ? host.endsWith(suffix) && host.length > suffix.length
      : host === suffix || host.endsWith(`.${suffix}`),
  )
}

export function validateFeedUrl(raw: string): FeedUrlResult {
  let url: URL
  try {
    // webcal:// on yleinen kalenteritilauksen muoto; se on https-osoite.
    url = new URL(raw.trim().replace(/^webcal:\/\//i, "https://"))
  } catch {
    return { ok: false, error: "Osoite ei ole kelvollinen." }
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "Vain https-osoitteet ovat sallittuja." }
  }
  if (url.username || url.password) {
    return { ok: false, error: "Osoitteessa ei saa olla tunnuksia." }
  }
  if (url.port && url.port !== "443") {
    return { ok: false, error: "Osoitteessa ei saa olla porttia." }
  }
  const host = url.hostname.toLowerCase()
  if (isIP(host)) {
    return { ok: false, error: "IP-osoitteet eivät ole sallittuja." }
  }
  const match = matchHost(host)
  if (!match) {
    return {
      ok: false,
      error:
        "Palvelinta ei tueta. Sallittuja ovat Wilma (inschool.fi), myClub ja Google-kalenteri.",
    }
  }
  return { ok: true, url, host, suggestedKind: match.kind }
}

/** Yksityiset, paikalliset ja erikoiskäyttöiset IP-osoitteet. */
export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    )
  }
  if (isIP(address) === 6) {
    const lower = address.toLowerCase()
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    )
  }
  return true
}
