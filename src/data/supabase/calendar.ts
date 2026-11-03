import "server-only"

import { after } from "next/server"

import type {
  CalendarAdminRepository,
  CalendarRepository,
} from "@/data/repositories"
import {
  expandManualSchedules,
  MANUAL_SOURCE_ID,
  mergeDuplicateEvents,
} from "@/domain/calendar-sources"
import type {
  CalendarEvent,
  CalendarSource,
  EventCategory,
  ManualScheduleEntry,
} from "@/domain/types"
import { validateFeedUrl } from "@/integrations/ics/url"
import { encryptSecret, feedEncryptionKey } from "@/lib/crypto"
import { toLocalDate } from "@/lib/dates"
import {
  createSupabaseBackgroundClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server"

import { STALE_AFTER_MS, syncSource } from "./calendar-sync"

/**
 * Kalenteri Supabasesta. RLS rajaa kaikki kyselyt omaan perheeseen.
 * Syöteosoitetta (encrypted_url) ei lueta tässä tiedostossa koskaan
 * selaimeen menevään dataan.
 */

interface SourceRow {
  id: string
  family_id: string
  kind: CalendarSource["kind"]
  name: string
  member_id: string | null
  url_host: string
  enabled: boolean
  sync_status: CalendarSource["syncStatus"]
  last_synced_at: string | null
  last_attempt_at: string | null
  last_error: string | null
}

interface EventRow {
  id: string
  source_id: string
  external_uid: string
  title: string
  location: string | null
  description: string | null
  category: EventCategory
  all_day: boolean
  starts_at: string | null
  ends_at: string | null
  start_date: string | null
  end_date: string | null
}

interface ScheduleRow {
  id: string
  member_id: string
  title: string
  weekday: number
  start_time: string
  end_time: string
}

const SOURCE_COLUMNS =
  "id, family_id, kind, name, member_id, url_host, enabled, sync_status, last_synced_at, last_attempt_at, last_error"

// Lähteiden järjestys duplikaatteja yhdistettäessä: tarkin lähde ensin.
const KIND_PRIORITY: Record<CalendarSource["kind"], number> = {
  wilma: 0,
  manual: 1,
  myclub: 2,
  ics: 3,
  google: 4,
}

function toSource(row: SourceRow): CalendarSource {
  return {
    id: row.id,
    familyId: row.family_id,
    kind: row.kind,
    name: row.name,
    memberId: row.member_id,
    enabled: row.enabled,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    urlHost: row.url_host,
  }
}

function toSchedule(row: ScheduleRow): ManualScheduleEntry {
  return {
    id: row.id,
    memberId: row.member_id,
    title: row.title,
    weekday: row.weekday,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  }
}

async function loadSources() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("calendar_sources")
    .select(SOURCE_COLUMNS)
    .order("created_at")
    .returns<SourceRow[]>()
  if (error) throw error
  return data
}

async function loadSchedules() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("manual_schedules")
    .select("id, member_id, title, weekday, start_time, end_time")
    .order("weekday")
    .returns<ScheduleRow[]>()
  if (error) throw error
  return data.map(toSchedule)
}

/**
 * Päivittää vanhentuneet syötteet. Ensimmäistä kertaa haettava lähde
 * haetaan heti; muut taustalla vastauksen jälkeen, jotta näkymä aukeaa
 * nopeasti viimeisimmällä tallennetulla tiedolla.
 */
async function refreshStaleSources(sources: SourceRow[]) {
  const now = Date.now()
  const stale = sources.filter(
    (s) =>
      s.enabled &&
      (!s.last_attempt_at ||
        now - new Date(s.last_attempt_at).getTime() > STALE_AFTER_MS),
  )
  if (stale.length === 0) return

  const firstTime = stale.filter((s) => !s.last_synced_at)
  if (firstTime.length > 0) {
    const supabase = await createSupabaseServerClient()
    await Promise.all(firstTime.map((s) => syncSource(supabase, s.id)))
  }

  const background = stale.filter((s) => s.last_synced_at)
  if (background.length > 0) {
    const client = await createSupabaseBackgroundClient()
    after(async () => {
      await Promise.all(background.map((s) => syncSource(client, s.id)))
    })
  }
}

export const supabaseCalendarRepository: CalendarRepository = {
  async getSources() {
    const [rows, schedules] = await Promise.all([
      loadSources(),
      loadSchedules(),
    ])
    const sources = rows.map(toSource)
    if (schedules.length > 0) {
      sources.push({
        id: MANUAL_SOURCE_ID,
        familyId: rows[0]?.family_id ?? "",
        kind: "manual",
        name: "Oma viikkorytmi",
        memberId: null,
        enabled: true,
        syncStatus: "ok",
        lastSyncedAt: null,
        lastError: null,
      })
    }
    return sources
  },

  async getEvents(range) {
    const sources = await loadSources()
    await refreshStaleSources(sources)

    const supabase = await createSupabaseServerClient()
    const startDate = toLocalDate(range.start)
    const endDate = toLocalDate(new Date(range.end.getTime() - 1))
    const [{ data, error }, schedules] = await Promise.all([
      supabase
        .from("calendar_events")
        .select(
          "id, source_id, external_uid, title, location, description, category, all_day, starts_at, ends_at, start_date, end_date",
        )
        .or(
          [
            `and(all_day.eq.false,starts_at.lt."${range.end.toISOString()}",ends_at.gte."${range.start.toISOString()}")`,
            `and(all_day.eq.true,start_date.lte.${endDate},end_date.gt.${startDate})`,
          ].join(","),
        )
        .returns<EventRow[]>(),
      loadSchedules(),
    ])
    if (error) throw error

    const byId = new Map(sources.map((s) => [s.id, s]))
    const events: CalendarEvent[] = []
    for (const row of data) {
      const source = byId.get(row.source_id)
      if (!source?.enabled) continue
      const base = {
        id: row.id,
        sourceId: row.source_id,
        externalUid: row.external_uid,
        title: row.title,
        location: row.location,
        description: row.description,
        memberIds: source.member_id ? [source.member_id] : [],
        category: row.category,
      }
      events.push(
        row.all_day
          ? {
              ...base,
              allDay: true,
              startDate: row.start_date!,
              endDate: row.end_date!,
            }
          : {
              ...base,
              allDay: false,
              start: new Date(row.starts_at!).toISOString(),
              end: new Date(row.ends_at!).toISOString(),
            },
      )
    }
    events.push(...expandManualSchedules(schedules, range))

    const kindOf = (e: CalendarEvent) =>
      e.sourceId === MANUAL_SOURCE_ID
        ? "manual"
        : (byId.get(e.sourceId)?.kind ?? "ics")
    events.sort((a, b) => KIND_PRIORITY[kindOf(a)] - KIND_PRIORITY[kindOf(b)])
    return mergeDuplicateEvents(events)
  },
}

export const supabaseCalendarAdmin: CalendarAdminRepository = {
  async addSource(input) {
    const checked = validateFeedUrl(input.url)
    if (!checked.ok) return { error: checked.error }

    const supabase = await createSupabaseServerClient()
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id")
      .single<{ id: string }>()
    if (familyError) throw familyError

    const { data, error } = await supabase
      .from("calendar_sources")
      .insert({
        family_id: family.id,
        kind: input.kind,
        name: input.name,
        member_id: input.memberId,
        encrypted_url: encryptSecret(
          checked.url.toString(),
          feedEncryptionKey(),
        ),
        url_host: checked.host,
      })
      .select("id")
      .single<{ id: string }>()
    if (error) throw error

    return syncSource(supabase, data.id)
  },

  async removeSource(id) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from("calendar_sources")
      .delete()
      .eq("id", id)
    if (error) throw error
  },

  async updateSourceMember(id, memberId) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("calendar_sources")
      .update({ member_id: memberId })
      .eq("id", id)
      .select("id, member_id")
    if (error) throw error
    // RLS voi estää päivityksen ilman virhettä: varmistetaan, että rivi muuttui.
    if (data.length !== 1 || data[0].member_id !== memberId) {
      throw new Error(`Kalenterin ${id} henkilön päivitys ei tallentunut`)
    }
  },

  async refreshSource(id) {
    const supabase = await createSupabaseServerClient()
    await supabase
      .from("calendar_sources")
      .update({ last_attempt_at: null })
      .eq("id", id)
    await syncSource(supabase, id)
  },

  getManualSchedules: loadSchedules,

  async setManualSchedule({ memberId, title, days }) {
    const supabase = await createSupabaseServerClient()
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id")
      .single<{ id: string }>()
    if (familyError) throw familyError

    const { error: deleteError } = await supabase
      .from("manual_schedules")
      .delete()
      .eq("member_id", memberId)
    if (deleteError) throw deleteError
    if (days.length === 0) return

    const { error } = await supabase.from("manual_schedules").insert(
      days.map((day) => ({
        family_id: family.id,
        member_id: memberId,
        title,
        weekday: day.weekday,
        start_time: day.startTime,
        end_time: day.endTime,
      })),
    )
    if (error) throw error
  },
}
