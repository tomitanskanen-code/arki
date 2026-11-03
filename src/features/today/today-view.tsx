import { Section } from "@/components/layout/page"
import { buildDayAgenda } from "@/domain/calendar"
import type {
  CalendarEvent,
  CalendarSource,
  FamilyMember,
  SchoolMenuDay,
  WeatherSnapshot,
} from "@/domain/types"
import { CONDITION_LABELS, formatTemperature } from "@/domain/weather"
import { Agenda } from "@/features/calendar/agenda"
import { MemberDot } from "@/features/family/member-dot"
import { WeatherIcon } from "@/features/weather/weather-icon"
import {
  capitalize,
  formatDayMonth,
  formatWeekday,
  isoWeekNumber,
  type LocalDate,
} from "@/lib/dates"

import { ShoppingPreview } from "./shopping-preview"

export interface TodayData {
  today: LocalDate
  members: FamilyMember[]
  sources: CalendarSource[]
  events: CalendarEvent[]
  weather: WeatherSnapshot | null
  /** undefined = ruokalistalähdettä ei ole, osio piilotetaan */
  menu: SchoolMenuDay | null | undefined
}

/** Koskeeko tapahtuma vain lapsia (koulu tai lasten harrastus)? */
function isChildrenOnly(event: CalendarEvent, childIds: Set<string>) {
  return (
    event.memberIds.length > 0 &&
    event.memberIds.every((id) => childIds.has(id))
  )
}

export function TodayView({
  today,
  members,
  sources,
  events,
  weather,
  menu,
}: TodayData) {
  const children = members.filter((m) => m.role === "child")
  const childIds = new Set(children.map((c) => c.id))

  // Menot: kaikki paitsi lasten oma koulu ja harrastukset, jotka ovat omassa osiossaan.
  const familyEvents = events.filter(
    (e) =>
      !(e.category === "school" || e.category === "hobby") ||
      !isChildrenOnly(e, childIds),
  )

  return (
    <>
      <header className="flex items-start justify-between gap-4 pt-10 pb-6 md:pt-14">
        <div>
          <p className="text-sm text-muted-foreground">
            {formatDayMonth(today)} · viikko {isoWeekNumber(today)}
          </p>
          <h1 className="mt-1 text-[2.5rem] leading-none font-light tracking-tight">
            {capitalize(formatWeekday(today))}
          </h1>
        </div>
        {weather && (
          <div className="flex items-center gap-2 pt-4">
            <WeatherIcon
              condition={weather.condition}
              isDay={weather.isDay}
              className="size-7 text-foreground/70"
            />
            <span className="text-3xl font-light tabular-nums">
              {formatTemperature(weather.temperature)}
            </span>
          </div>
        )}
      </header>

      <p className="-mt-2 mb-6 text-[15px] text-muted-foreground">
        {weather ? (
          <>
            {CONDITION_LABELS[weather.condition]} ·{" "}
            {formatTemperature(weather.todayMax)} /{" "}
            {formatTemperature(weather.todayMin)}
            {weather.precipitationProbability !== null &&
              ` · sade ${weather.precipitationProbability} %`}{" "}
            · {weather.placeName}
          </>
        ) : (
          "Säätietoja ei juuri nyt saatu."
        )}
      </p>

      <div className="md:grid md:grid-cols-2 md:gap-x-12">
        <div>
          <Section title="Menot">
            <Agenda
              items={buildDayAgenda(familyEvents, today)}
              date={today}
              members={members}
              sources={sources}
              emptyText="Ei muita menoja tänään."
            />
          </Section>

          <Section title="Lapset">
            <div className="space-y-5">
              {children.map((child) => {
                const own = events.filter((e) => e.memberIds.includes(child.id))
                const items = buildDayAgenda(
                  own.filter(
                    (e) => e.category === "school" || e.category === "hobby",
                  ),
                  today,
                )
                return (
                  <div key={child.id}>
                    <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <MemberDot member={child} />
                      {child.displayName}
                    </p>
                    <Agenda
                      items={items}
                      date={today}
                      members={members}
                      sources={sources}
                      emptyText="Ei koulua eikä harrastuksia."
                      showSchoolOwner={false}
                    />
                  </div>
                )
              })}
            </div>
          </Section>
        </div>

        <div>
          {menu !== undefined && (
            <Section title="Ruokalista">
              {menu ? (
                <div className="text-[15px]">
                  <p>{menu.mainDish}</p>
                  {menu.vegetarianDish && (
                    <p className="mt-1 text-muted-foreground">
                      Kasvisvaihtoehto: {menu.vegetarianDish}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Ei kouluruokaa tänään.</p>
              )}
            </Section>
          )}

          <Section title="Kauppalista">
            <ShoppingPreview />
          </Section>
        </div>
      </div>
    </>
  )
}

export function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Ladataan" className="animate-pulse">
      <div className="pt-10 pb-6 md:pt-14">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-3 h-10 w-48 rounded bg-muted" />
      </div>
      <div className="mb-8 h-4 w-64 rounded bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 border-t py-5">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
