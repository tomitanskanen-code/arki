import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { PageContainer } from "@/components/layout/page"
import { calendarRepository, familyRepository } from "@/data/server"
import {
  CalendarSkeleton,
  CalendarView,
} from "@/features/calendar/calendar-view"
import {
  isLocalDate,
  localDayRange,
  localWeekRange,
  todayLocal,
} from "@/lib/dates"

export const metadata: Metadata = { title: "Kalenteri" }

export default function CalendarPage({
  searchParams,
}: PageProps<"/kalenteri">) {
  return (
    <PageContainer>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  )
}

async function CalendarContent({
  searchParams,
}: Pick<PageProps<"/kalenteri">, "searchParams">) {
  await connection()
  const params = await searchParams
  const today = todayLocal()
  // URL-parametrit validoidaan: virheellinen päivä → tänään.
  const date = isLocalDate(params.paiva) ? params.paiva : today
  const view = params.nakyma === "viikko" ? "week" : "day"
  const range = view === "week" ? localWeekRange(date) : localDayRange(date)

  const [members, sources, events] = await Promise.all([
    familyRepository.getMembers(),
    calendarRepository.getSources(),
    calendarRepository.getEvents(range),
  ])

  return (
    <CalendarView
      view={view}
      date={date}
      today={today}
      events={events}
      members={members}
      sources={sources}
    />
  )
}
