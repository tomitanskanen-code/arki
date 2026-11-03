import "server-only"

import { lookup } from "node:dns/promises"

import { isPrivateAddress, validateFeedUrl } from "./url"

/**
 * Kalenterisyötteen haku palvelimella (SSRF-suojaus, osa 2/2).
 *
 * - Osoite tarkistetaan (https, sallitut palvelimet) ennen jokaista pyyntöä.
 * - Palvelimen nimi ratkaistaan ja yksityiset IP-osoitteet hylätään.
 * - Uudelleenohjaukset seurataan itse ja jokainen kohde tarkistetaan.
 * - Aikakatkaisu ja kokoraja estävät jumittumisen ja muistin loppumisen.
 */
const TIMEOUT_MS = 10_000
const MAX_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 3

export class FeedFetchError extends Error {}

async function assertPublicHost(host: string) {
  let addresses: { address: string }[]
  try {
    addresses = await lookup(host, { all: true })
  } catch {
    throw new FeedFetchError("Palvelinta ei löytynyt.")
  }
  if (
    addresses.length === 0 ||
    addresses.some((a) => isPrivateAddress(a.address))
  ) {
    throw new FeedFetchError("Palvelimen osoite ei ole sallittu.")
  }
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ""
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new FeedFetchError("Kalenterisyöte on liian suuri.")
    }
    chunks.push(value)
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks))
}

export async function fetchFeed(rawUrl: string): Promise<string> {
  let current = rawUrl
  const signal = AbortSignal.timeout(TIMEOUT_MS)

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const checked = validateFeedUrl(current)
    if (!checked.ok) throw new FeedFetchError(checked.error)
    await assertPublicHost(checked.host)

    let response: Response
    try {
      response = await fetch(checked.url, {
        redirect: "manual",
        signal,
        cache: "no-store",
        headers: {
          Accept: "text/calendar, text/plain;q=0.8",
          "User-Agent": "Arki-perhekalenteri/1.0",
        },
      })
    } catch {
      throw new FeedFetchError(
        signal.aborted ? "Haku aikakatkaistiin." : "Syötettä ei saatu haettua.",
      )
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location) throw new FeedFetchError("Virheellinen uudelleenohjaus.")
      current = new URL(location, checked.url).toString()
      continue
    }
    if (response.status === 401 || response.status === 403) {
      throw new FeedFetchError(
        "Palvelu ei salli hakua. Linkki voi olla vanhentunut.",
      )
    }
    if (response.status === 404) {
      throw new FeedFetchError("Syötettä ei löytynyt. Tarkista linkki.")
    }
    if (!response.ok) {
      throw new FeedFetchError(
        `Palvelu vastasi virheellä (${response.status}).`,
      )
    }

    const text = await readLimited(response)
    if (!text.includes("BEGIN:VCALENDAR")) {
      throw new FeedFetchError("Osoite ei palauttanut kalenteria.")
    }
    return text
  }
  throw new FeedFetchError("Liian monta uudelleenohjausta.")
}
