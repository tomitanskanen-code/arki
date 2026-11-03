import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { categoryForSourceKind } from "@/domain/calendar-sources"
import type { CalendarSourceKind } from "@/domain/types"
import { FeedFetchError, fetchFeed } from "@/integrations/ics/fetch"
import { IcsParseError, parseIcs } from "@/integrations/ics/parse"
import {
  decryptSecret,
  FeedKeyMissingError,
  feedEncryptionKey,
} from "@/lib/crypto"

/**
 * Yhden kalenterisyötteen synkronointi tietokantaan.
 *
 * 1. Lukitus: vain yksi haku kerrallaan per lähde (last_attempt_at).
 * 2. Osoite puretaan, syöte haetaan turvallisesti ja jäsennetään.
 * 3. Tapahtumat tallennetaan (upsert) uudella kierrostunnuksella, ja
 *    syötteestä poistuneet tapahtumat poistetaan.
 * 4. Virhetilanteessa vanhat tapahtumat säilyvät ja virhe kirjataan
 *    lähteelle – käyttäjä näkee viimeisimmän onnistuneen tiedon.
 */
export const STALE_AFTER_MS = 15 * 60_000
const LOCK_MS = 2 * 60_000
const PAST_DAYS = 30
const FUTURE_DAYS = 120
const BATCH_SIZE = 500
const DAY_MS = 86_400_000

interface ClaimedSource {
  id: string
  family_id: string
  kind: Exclude<CalendarSourceKind, "manual">
  encrypted_url: string
}

function userMessage(error: unknown) {
  if (
    error instanceof FeedFetchError ||
    error instanceof IcsParseError ||
    error instanceof FeedKeyMissingError
  ) {
    return error.message
  }
  return "Päivitys epäonnistui."
}

export async function syncSource(
  supabase: SupabaseClient,
  sourceId: string,
): Promise<{ error: string | null }> {
  const now = Date.now()
  const { data: source } = await supabase
    .from("calendar_sources")
    .update({ last_attempt_at: new Date(now).toISOString() })
    .eq("id", sourceId)
    .or(
      `last_attempt_at.is.null,last_attempt_at.lt."${new Date(now - LOCK_MS).toISOString()}"`,
    )
    .select("id, family_id, kind, encrypted_url")
    .maybeSingle<ClaimedSource>()

  // Toinen pyyntö hakee jo tätä lähdettä.
  if (!source) return { error: null }

  try {
    const url = decryptSecret(source.encrypted_url, feedEncryptionKey())
    const parsed = parseIcs(await fetchFeed(url), {
      start: new Date(now - PAST_DAYS * DAY_MS),
      end: new Date(now + FUTURE_DAYS * DAY_MS),
    })

    const token = crypto.randomUUID()
    const category = categoryForSourceKind(source.kind)
    const rows = new Map<string, Record<string, unknown>>()
    for (const event of parsed) {
      // Sama UID + esiintymä vain kerran (muuten upsert epäonnistuu).
      rows.set(`${event.uid}|${event.occurrenceKey}`, {
        family_id: source.family_id,
        source_id: source.id,
        external_uid: event.uid,
        occurrence_key: event.occurrenceKey,
        title: event.title,
        location: event.location,
        description: event.description,
        category,
        all_day: event.allDay,
        starts_at: event.start ?? null,
        ends_at: event.end ?? null,
        start_date: event.startDate ?? null,
        end_date: event.endDate ?? null,
        sync_token: token,
      })
    }

    const all = [...rows.values()]
    for (let i = 0; i < all.length; i += BATCH_SIZE) {
      const { error } = await supabase
        .from("calendar_events")
        .upsert(all.slice(i, i + BATCH_SIZE), {
          onConflict: "source_id,external_uid,occurrence_key",
        })
      if (error) throw error
    }

    const { error: deleteError } = await supabase
      .from("calendar_events")
      .delete()
      .eq("source_id", source.id)
      .neq("sync_token", token)
    if (deleteError) throw deleteError

    await supabase
      .from("calendar_sources")
      .update({
        sync_status: "ok",
        last_synced_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", source.id)
    return { error: null }
  } catch (error) {
    const message = userMessage(error)
    console.error(`Kalenterisyötteen ${source.id} päivitys epäonnistui`, error)
    await supabase
      .from("calendar_sources")
      .update({ sync_status: "error", last_error: message })
      .eq("id", source.id)
    return { error: message }
  }
}
