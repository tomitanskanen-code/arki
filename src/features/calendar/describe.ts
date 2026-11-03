import { SOURCE_KIND_LABELS, type AgendaItem } from "@/domain/calendar"
import type { CalendarSource, FamilyMember } from "@/domain/types"
import { formatTime } from "@/lib/dates"

export interface AgendaLookup {
  members: Map<string, FamilyMember>
  sources: Map<string, CalendarSource>
}

export function createLookup(
  members: FamilyMember[],
  sources: CalendarSource[],
): AgendaLookup {
  return {
    members: new Map(members.map((m) => [m.id, m])),
    sources: new Map(sources.map((s) => [s.id, s])),
  }
}

export interface AgendaItemView {
  title: string
  start: string | null
  end: string | null
  subtitle: string
  members: FamilyMember[]
  source: CalendarSource | null
}

function lessonCount(count: number) {
  return count === 1 ? "1 oppitunti" : `${count} oppituntia`
}

/** Muuntaa agendan rivin näytettävään muotoon. */
export function describeItem(
  item: AgendaItem,
  lookup: AgendaLookup,
  { showSchoolOwner = true } = {},
): AgendaItemView {
  if (item.type === "school") {
    const { summary } = item
    const member = lookup.members.get(summary.memberId)
    const sourceId = summary.lessons[0]?.sourceId ?? summary.notes[0]?.sourceId
    const source = sourceId ? (lookup.sources.get(sourceId) ?? null) : null
    const details = [
      summary.lessons.length > 0 ? lessonCount(summary.lessons.length) : null,
      ...summary.notes.map((n) => n.title),
      source && SOURCE_KIND_LABELS[source.kind],
    ].filter(Boolean)
    return {
      title:
        showSchoolOwner && member ? `${member.displayName}: koulu` : "Koulu",
      start: summary.start && formatTime(summary.start),
      end: summary.end && formatTime(summary.end),
      subtitle: details.join(" · "),
      members: member ? [member] : [],
      source,
    }
  }

  const { event } = item
  const source = lookup.sources.get(event.sourceId) ?? null
  return {
    title: event.title,
    start: event.allDay ? null : formatTime(event.start),
    end: event.allDay ? null : formatTime(event.end),
    subtitle: [event.location, source && SOURCE_KIND_LABELS[source.kind]]
      .filter(Boolean)
      .join(" · "),
    members: event.memberIds
      .map((id) => lookup.members.get(id))
      .filter((m): m is FamilyMember => m !== undefined),
    source,
  }
}
