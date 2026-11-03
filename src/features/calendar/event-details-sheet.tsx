"use client"

import { CalendarDays, MapPin, Users } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SOURCE_KIND_LABELS, type AgendaItem } from "@/domain/calendar"
import { MemberDot } from "@/features/family/member-dot"
import {
  capitalize,
  formatShortDate,
  formatTime,
  formatWeekday,
  type LocalDate,
} from "@/lib/dates"

import { type AgendaLookup, describeItem } from "./describe"

interface Props {
  item: AgendaItem | null
  date: LocalDate
  lookup: AgendaLookup
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Tapahtuman lisätiedot alhaalta avautuvassa paneelissa. */
export function EventDetailsSheet({
  item,
  date,
  lookup,
  open,
  onOpenChange,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] w-full max-w-xl gap-0 overflow-y-auto rounded-t-2xl border-x bg-surface pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        {item && <Details item={item} date={date} lookup={lookup} />}
      </SheetContent>
    </Sheet>
  )
}

function Details({
  item,
  date,
  lookup,
}: {
  item: AgendaItem
  date: LocalDate
  lookup: AgendaLookup
}) {
  const view = describeItem(item, lookup)
  const day = `${capitalize(formatWeekday(date))} ${formatShortDate(date)}`
  const time = view.start
    ? `${view.start}${view.end ? `–${view.end}` : ""}`
    : "Koko päivä"
  const location = item.type === "event" ? item.event.location : null
  const description = item.type === "event" ? item.event.description : null
  const alsoIn =
    item.type === "event"
      ? (item.event.alsoInSourceIds ?? [])
          .map((id) => lookup.sources.get(id)?.name)
          .filter((name): name is string => Boolean(name))
      : []

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle className="pr-8 text-xl font-medium tracking-tight">
          {view.title}
        </SheetTitle>
        <SheetDescription className="text-[15px]">
          {day} · {time}
        </SheetDescription>
      </SheetHeader>

      <dl className="space-y-3 border-t px-6 py-4 text-[15px]">
        {location && (
          <Row icon={<MapPin className="size-4" />} label="Paikka">
            {location}
          </Row>
        )}
        <Row icon={<Users className="size-4" />} label="Kenelle">
          {view.members.length === 0 ? (
            "Koko perhe"
          ) : (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {view.members.map((m) => (
                <span key={m.id} className="flex items-center gap-2">
                  <MemberDot member={m} />
                  {m.displayName}
                </span>
              ))}
            </span>
          )}
        </Row>
        {view.source && (
          <Row icon={<CalendarDays className="size-4" />} label="Lähde">
            {view.source.name}
            <span className="text-muted-foreground">
              {" "}
              · {SOURCE_KIND_LABELS[view.source.kind]}
            </span>
            {alsoIn.length > 0 && (
              <span className="block text-sm text-muted-foreground">
                Myös: {alsoIn.join(", ")}
              </span>
            )}
          </Row>
        )}
      </dl>

      {description && (
        <p className="border-t px-6 py-4 text-[15px] leading-relaxed">
          {description}
        </p>
      )}

      {item.type === "school" && (
        <div className="border-t px-6 py-4">
          {item.summary.notes.map((note) => (
            <p key={note.id} className="mb-3 text-[15px] font-medium">
              {note.title}
            </p>
          ))}
          {item.summary.lessons.length > 0 && (
            <ol className="space-y-2">
              {item.summary.lessons.map((lesson) => (
                <li key={lesson.id} className="flex gap-4 text-[15px]">
                  <span className="w-24 shrink-0 text-muted-foreground tabular-nums">
                    {formatTime(lesson.start)}–{formatTime(lesson.end)}
                  </span>
                  <span className="min-w-0 truncate">{lesson.title}</span>
                  {lesson.location && (
                    <span className="ml-auto shrink-0 text-sm whitespace-nowrap text-muted-foreground">
                      {lesson.location}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <dt className="mt-1 text-muted-foreground">
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}
