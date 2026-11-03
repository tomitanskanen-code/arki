import { connection } from "next/server"
import { Suspense } from "react"

import { PageContainer } from "@/components/layout/page"
import {
  calendarRepository,
  familyRepository,
  getSignedInEmail,
  schoolMenuProvider,
  weatherProvider,
} from "@/data/server"
import { NoFamilyNotice } from "@/features/family/no-family-notice"
import { TodaySkeleton, TodayView } from "@/features/today/today-view"
import { localDayRange, todayLocal } from "@/lib/dates"

export default function TodayPage() {
  return (
    <PageContainer>
      <Suspense fallback={<TodaySkeleton />}>
        <TodayContent />
      </Suspense>
    </PageContainer>
  )
}

/** Palauttaa null virheen sattuessa, jotta yksi lähde ei kaada koko näkymää. */
async function optional<T>(promise: Promise<T>, label: string) {
  try {
    return await promise
  } catch (error) {
    console.error(`${label} epäonnistui`, error)
    return null
  }
}

async function TodayContent() {
  // "Tänään" riippuu pyynnön ajankohdasta, joten sivu renderöidään pyynnön
  // aikana eikä build-vaiheessa (Cache Components).
  await connection()
  const today = todayLocal()

  const [family, members, sources, events, menu] = await Promise.all([
    familyRepository.getFamily(),
    familyRepository.getMembers(),
    calendarRepository.getSources(),
    calendarRepository.getEvents(localDayRange(today)),
    schoolMenuProvider
      ? optional(schoolMenuProvider.getMenu(today), "Ruokalistan haku")
      : undefined,
  ])
  if (!family) return <NoFamilyNotice email={await getSignedInEmail()} />
  const weather = await optional(
    weatherProvider.getToday(family.home),
    "Säähaku",
  )

  return (
    <TodayView
      today={today}
      members={members}
      sources={sources}
      events={events}
      weather={weather}
      menu={menu}
    />
  )
}
