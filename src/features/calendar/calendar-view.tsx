"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { StepNav } from "@/components/layout/step-nav"
import { buildDayAgenda, filterByMembers } from "@/domain/calendar"
import type {
  CalendarEvent,
  CalendarSource,
  FamilyMember,
} from "@/domain/types"
import { MemberDot } from "@/features/family/member-dot"
import {
  addLocalDays,
  capitalize,
  formatDayMonth,
  formatShortDate,
  formatWeekday,
  formatWeekdayShort,
  isoWeekNumber,
  type LocalDate,
  localWeekDays,
} from "@/lib/dates"
import { cn } from "@/lib/utils"

import { Agenda } from "./agenda"

export type CalendarViewMode = "day" | "week"

interface Props {
  view: CalendarViewMode
  date: LocalDate
  today: LocalDate
  events: CalendarEvent[]
  members: FamilyMember[]
  sources: CalendarSource[]
}

export function calendarHref(date: LocalDate, view: CalendarViewMode) {
  const params = new URLSearchParams({ paiva: date })
  if (view === "week") params.set("nakyma", "viikko")
  return `/kalenteri?${params}`
}

export function CalendarView({
  view,
  date,
  today,
  events,
  members,
  sources,
}: Props) {
  const router = useRouter()
  // null = kaikki perheenjäsenet
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const step = view === "week" ? 7 : 1
  const prevHref = calendarHref(addLocalDays(date, -step), view)
  const nextHref = calendarHref(addLocalDays(date, step), view)
  const isCurrent =
    view === "week" ? localWeekDays(date).includes(today) : date === today

  const visible = filterByMembers(events, selected)
  const days = localWeekDays(date)
  const failing = sources.filter((s) => s.syncStatus === "error")

  function toggleMember(id: string) {
    setSelected((current) => {
      const next = new Set(current ?? [])
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next.size === 0 || next.size === members.length ? null : next
    })
  }

  // Pyyhkäisy vasemmalle/oikealle vaihtaa päivää tai viikkoa.
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
      router.push(dx < 0 ? nextHref : prevHref)
    }
  }

  return (
    <div>
      <header className="pt-8 pb-5 md:pt-12">
        <p className="text-sm text-muted-foreground">
          {view === "day" ? (
            <>
              {date === today && "Tänään · "}
              {formatDayMonth(date)} · viikko {isoWeekNumber(date)}
            </>
          ) : (
            `${formatShortDate(days[0])}–${formatShortDate(days[6])}`
          )}
        </p>
        <h1 className="mt-1 text-[2rem] leading-tight font-light tracking-tight">
          {view === "day"
            ? capitalize(formatWeekday(date))
            : `Viikko ${isoWeekNumber(date)}`}
        </h1>
        {failing.length > 0 && (
          <p role="status" className="mt-2 text-sm text-destructive">
            Päivitys epäonnistui: {failing.map((s) => s.name).join(", ")}.
            Näytetään viimeisin haettu tieto.
          </p>
        )}
      </header>

      <div className="flex items-center justify-between gap-3">
        <nav
          aria-label="Näkymä"
          className="inline-flex rounded-full bg-muted p-1 text-sm"
        >
          {(["day", "week"] as const).map((mode) => (
            <Link
              key={mode}
              href={calendarHref(date, mode)}
              aria-current={view === mode ? "page" : undefined}
              className={cn(
                "flex min-h-9 min-w-16 items-center justify-center rounded-full px-4 transition-colors",
                view === mode
                  ? "bg-surface font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode === "day" ? "Päivä" : "Viikko"}
            </Link>
          ))}
        </nav>

        <StepNav
          prevHref={prevHref}
          nextHref={nextHref}
          todayHref={isCurrent ? null : calendarHref(today, view)}
          prevLabel={view === "week" ? "Edellinen viikko" : "Edellinen päivä"}
          nextLabel={view === "week" ? "Seuraava viikko" : "Seuraava päivä"}
        />
      </div>

      <div
        role="group"
        aria-label="Näytä perheenjäsenet"
        className="-mx-5 mt-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0"
      >
        <FilterChip
          active={selected === null}
          onClick={() => setSelected(null)}
        >
          Kaikki
        </FilterChip>
        {members.map((m) => (
          <FilterChip
            key={m.id}
            active={selected?.has(m.id) ?? false}
            onClick={() => toggleMember(m.id)}
          >
            <MemberDot member={m} />
            {m.displayName}
          </FilterChip>
        ))}
      </div>

      <div
        className="mt-4 min-h-[50dvh]"
        onTouchStart={(e) => {
          touchStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
        }}
        onTouchEnd={onTouchEnd}
      >
        {view === "day" ? (
          <div className="border-t pt-3">
            <Agenda
              items={buildDayAgenda(visible, date)}
              date={date}
              members={members}
              sources={sources}
              emptyText="Ei tapahtumia tälle päivälle."
            />
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-x-10">
            {days.map((day) => (
              <section key={day} className="border-t py-3">
                <h2 className="mb-1 flex items-center gap-2 text-sm">
                  <Link
                    href={calendarHref(day, "day")}
                    className={cn(
                      "flex min-h-9 items-center gap-2",
                      day === today ? "font-semibold" : "font-medium",
                    )}
                  >
                    {capitalize(formatWeekdayShort(day))} {formatShortDate(day)}
                  </Link>
                  {day === today && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                      Tänään
                    </span>
                  )}
                </h2>
                <Agenda
                  items={buildDayAgenda(visible, day)}
                  date={day}
                  members={members}
                  sources={sources}
                  emptyText="—"
                  dense
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
        active
          ? "border-foreground/80 bg-foreground/[0.04] font-medium text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function CalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ladataan" className="animate-pulse">
      <div className="pt-8 pb-5 md:pt-12">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-2 h-9 w-44 rounded bg-muted" />
      </div>
      <div className="h-11 w-full rounded-full bg-muted" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
