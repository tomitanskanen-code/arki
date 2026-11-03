import { connection } from "next/server"
import { Suspense } from "react"

import { PageContainer } from "@/components/layout/page"
import {
  calendarRepository,
  familyRepository,
  getSignedInEmail,
  schoolMenuLink,
  schoolMenuProvider,
  weatherProvider,
} from "@/data/server"
import { NoFamilyNotice } from "@/features/family/no-family-notice"
import { TodaySkeleton, TodayView } from "@/features/today/today-view"
import { isLocalDate, localDayRange, todayLocal } from "@/lib/dates"

export default function TodayPage({ searchParams }: PageProps<"/">) {
  return (
    <PageContainer>
      <Suspense fallback={<TodaySkeleton />}>
        <TodayContent searchParams={searchParams} />
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

async function TodayContent({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  // "Tänään" riippuu pyynnön ajankohdasta, joten sivu renderöidään pyynnön
  // aikana eikä build-vaiheessa (Cache Components).
  await connection()
  const today = todayLocal()
  // Selattu päivä osoitteesta (?paiva=YYYY-MM-DD); virheellinen → tänään.
  const { paiva } = await searchParams
  const date = isLocalDate(paiva) ? paiva : today

  const [family, members, sources, events, menu] = await Promise.all([
    familyRepository.getFamily(),
    familyRepository.getMembers(),
    calendarRepository.getSources(),
    calendarRepository.getEvents(localDayRange(date)),
    schoolMenuProvider
      ? optional(schoolMenuProvider.getMenu(date), "Ruokalistan haku")
      : undefined,
  ])
  if (!family) return <NoFamilyNotice email={await getSignedInEmail()} />
  // Sää on nykyhetken sää, joten se haetaan vain tälle päivälle.
  const weather =
    date === today
      ? await optional(weatherProvider.getToday(family.home), "Säähaku")
      : null

  return (
    <TodayView
      date={date}
      today={today}
      members={members}
      sources={sources}
      events={events}
      weather={weather}
      menu={menu}
      menuLink={schoolMenuLink}
    />
  )
}
