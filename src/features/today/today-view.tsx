import {
  ArrowUpRight,
  Backpack,
  CalendarDays,
  ListTodo,
  Settings2,
  ShoppingCart,
  Utensils,
} from "lucide-react"
import Link from "next/link"

import { Section } from "@/components/layout/page"
import { StepNav } from "@/components/layout/step-nav"
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
  addLocalDays,
  capitalize,
  formatDayMonth,
  formatWeekday,
  isoWeekNumber,
  type LocalDate,
} from "@/lib/dates"

import { TasksPreview } from "@/features/tasks/tasks-preview"

import { ShoppingPreview } from "./shopping-preview"

export interface TodayData {
  /** Näytettävä päivä (selattavissa nuolilla) */
  date: LocalDate
  /** Kuluva päivä Helsingin aikaa */
  today: LocalDate
  members: FamilyMember[]
  sources: CalendarSource[]
  events: CalendarEvent[]
  weather: WeatherSnapshot | null
  /** undefined = ruokalistalähdettä ei ole, osio piilotetaan */
  menu: SchoolMenuDay | null | undefined
  /** Linkki koulun ruokalistasivulle, jos syötettä ei ole */
  menuLink?: string | null
}

/** Koskeeko tapahtuma vain lapsia (koulu tai lasten harrastus)? */
function isChildrenOnly(event: CalendarEvent, childIds: Set<string>) {
  return (
    event.memberIds.length > 0 &&
    event.memberIds.every((id) => childIds.has(id))
  )
}

/** Etusivun osoite päivälle; tänään = pelkkä "/". */
function dayHref(date: LocalDate, today: LocalDate) {
  return date === today ? "/" : `/?paiva=${date}`
}

export function TodayView({
  date,
  today,
  members,
  sources,
  events,
  weather,
  menu,
  menuLink,
}: TodayData) {
  const children = members.filter((m) => m.role === "child")
  const childIds = new Set(children.map((c) => c.id))

  // Menot: kaikki paitsi lasten oma koulu ja harrastukset, jotka ovat omassa osiossaan.
  const familyEvents = events.filter(
    (e) =>
      !(e.category === "school" || e.category === "hobby") ||
      !isChildrenOnly(e, childIds),
  )

  const isToday = date === today

  return (
    <>
      <header className="pt-10 pb-6 md:pt-14">
        <div className="flex min-h-6 items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {isToday && "Tänään · "}
            {formatDayMonth(date)} · viikko {isoWeekNumber(date)}
          </p>
          {/* Paluu tähän päivään täällä, jotta otsikon viereen mahtuvat
              nuolet pisimmälläkin päivän nimellä (Keskiviikko). */}
          <div className="-my-2.5 flex items-center">
            {!isToday && (
              <Link
                href="/"
                className="flex min-h-11 items-center px-1 text-sm font-medium"
              >
                Tänään
              </Link>
            )}
            {/* Mobiilissa Asetukset on täällä; iPadilla sivupalkissa. */}
            <Link
              href="/asetukset"
              aria-label="Asetukset"
              className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Settings2 aria-hidden className="size-5" />
            </Link>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h1 className="text-[2.5rem] leading-none font-light tracking-tight">
            {capitalize(formatWeekday(date))}
          </h1>
          <StepNav
            prevHref={dayHref(addLocalDays(date, -1), today)}
            nextHref={dayHref(addLocalDays(date, 1), today)}
            todayHref={null}
            prevLabel="Edellinen päivä"
            nextLabel="Seuraava päivä"
          />
        </div>
      </header>

      {isToday && (
        <p className="-mt-2 mb-6 flex items-center gap-2 text-[15px] text-muted-foreground">
          {weather ? (
            <>
              <WeatherIcon
                condition={weather.condition}
                isDay={weather.isDay}
                className="size-5 shrink-0 text-foreground/70"
              />
              <span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatTemperature(weather.temperature)}
                </span>{" "}
                · {CONDITION_LABELS[weather.condition]} ·{" "}
                {formatTemperature(weather.todayMax)} /{" "}
                {formatTemperature(weather.todayMin)}
                {weather.precipitationProbability !== null &&
                  ` · sade ${weather.precipitationProbability} %`}{" "}
                · {weather.placeName}
              </span>
            </>
          ) : (
            "Säätietoja ei juuri nyt saatu."
          )}
        </p>
      )}

      <div className="md:grid md:grid-cols-2 md:gap-x-4">
        <div>
          <Section title="Menot" tone="slate" icon={CalendarDays}>
            <Agenda
              items={buildDayAgenda(familyEvents, date)}
              date={date}
              members={members}
              sources={sources}
              emptyText={
                isToday ? "Ei muita menoja tänään." : "Ei muita menoja."
              }
            />
          </Section>

          <Section title="Lapset" tone="sage" icon={Backpack}>
            <div className="space-y-5">
              {children.map((child) => {
                const own = events.filter((e) => e.memberIds.includes(child.id))
                const items = buildDayAgenda(
                  own.filter(
                    (e) => e.category === "school" || e.category === "hobby",
                  ),
                  date,
                )
                return (
                  <div key={child.id}>
                    <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <MemberDot member={child} />
                      {child.displayName}
                    </p>
                    <Agenda
                      items={items}
                      date={date}
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
          {/* Tehtävät eivät ole päiväkohtaisia: aina tämän päivän tilanne. */}
          <Section title="Tehtävät" tone="ochre" icon={ListTodo}>
            <TasksPreview members={members} today={today} />
          </Section>

          {menu !== undefined && (
            <Section title="Ruokalista" tone="clay" icon={Utensils}>
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
                <p className="text-muted-foreground">
                  {isToday ? "Ei kouluruokaa tänään." : "Ei kouluruokaa."}
                </p>
              )}
            </Section>
          )}
          {menu === undefined && menuLink && (
            <Section title="Ruokalista" tone="clay" icon={Utensils}>
              <a
                href={menuLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-foreground/80 hover:text-foreground"
              >
                Kouluruokalista
                <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only">(avautuu uuteen ikkunaan)</span>
              </a>
            </Section>
          )}

          <Section title="Kauppalista" tone="neutral" icon={ShoppingCart}>
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
        <div
          key={i}
          className="mb-3 space-y-3 rounded-2xl bg-muted/60 px-4 py-4"
        >
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
