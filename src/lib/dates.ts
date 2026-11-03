import { TZDate, tz } from "@date-fns/tz"
import { format, getISOWeek } from "date-fns"
import { fi } from "date-fns/locale"

/**
 * Ajan käsittely.
 *
 * Periaatteet:
 * - Ajanhetket (tapahtuman alku ja loppu) ovat aina UTC-muotoisia ISO-merkkijonoja
 *   tai Date-olioita. Näin ne tallennetaan myös tietokantaan (timestamptz).
 * - Kalenteripäivät ovat "YYYY-MM-DD"-merkkijonoja (LocalDate), jotka tulkitaan
 *   aina perheen aikavyöhykkeellä Europe/Helsinki.
 * - Palvelimen omalla aikavyöhykkeellä ei ole merkitystä (Vercel = UTC).
 */
export const TIME_ZONE = "Europe/Helsinki"

/** Kalenteripäivä muodossa YYYY-MM-DD Helsingin aikaa. */
export type LocalDate = string

const inHelsinki = tz(TIME_ZONE)
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parts(date: LocalDate) {
  const [year, month, day] = date.split("-").map(Number)
  return { year, month, day }
}

/** Palauttaa päivän keskipäivän Helsingin aikaa – turvallinen muotoiluun. */
function localNoon(date: LocalDate) {
  const { year, month, day } = parts(date)
  return new TZDate(year, month - 1, day, 12, 0, TIME_ZONE)
}

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string" || !LOCAL_DATE_PATTERN.test(value)) return false
  const { year, month, day } = parts(value)
  const check = new Date(Date.UTC(year, month - 1, day))
  return check.getUTCMonth() === month - 1 && check.getUTCDate() === day
}

/** Tämä päivä Helsingin aikaa. */
export function todayLocal(now: Date = new Date()): LocalDate {
  return format(now, "yyyy-MM-dd", { in: inHelsinki })
}

/** Ajanhetken kalenteripäivä Helsingin aikaa. */
export function toLocalDate(instant: Date | string): LocalDate {
  return format(new Date(instant), "yyyy-MM-dd", { in: inHelsinki })
}

/** Helsingin paikallinen päivä + kellonaika ("HH:mm") → ajanhetki (UTC). */
export function localDateTime(date: LocalDate, time: string): Date {
  const { year, month, day } = parts(date)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(
    new TZDate(year, month - 1, day, hours, minutes, TIME_ZONE).getTime(),
  )
}

/** Kalenteripäivien yhteenlasku. Ei riipu aikavyöhykkeestä eikä kesäajasta. */
export function addLocalDays(date: LocalDate, days: number): LocalDate {
  const { year, month, day } = parts(date)
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10)
}

/** 0 = maanantai … 6 = sunnuntai */
export function localWeekdayIndex(date: LocalDate): number {
  const { year, month, day } = parts(date)
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7
}

export function startOfLocalWeek(date: LocalDate): LocalDate {
  return addLocalDays(date, -localWeekdayIndex(date))
}

export function localWeekDays(date: LocalDate): LocalDate[] {
  const monday = startOfLocalWeek(date)
  return Array.from({ length: 7 }, (_, i) => addLocalDays(monday, i))
}

export interface InstantRange {
  start: Date
  end: Date
}

/** Päivän alku ja seuraavan päivän alku Helsingin aikaa (23–25 h). */
export function localDayRange(date: LocalDate): InstantRange {
  return {
    start: localDateTime(date, "00:00"),
    end: localDateTime(addLocalDays(date, 1), "00:00"),
  }
}

export function localWeekRange(date: LocalDate): InstantRange {
  const monday = startOfLocalWeek(date)
  return {
    start: localDateTime(monday, "00:00"),
    end: localDateTime(addLocalDays(monday, 7), "00:00"),
  }
}

export function isoWeekNumber(date: LocalDate): number {
  return getISOWeek(localNoon(date))
}

// --- Muotoilu suomeksi ---

/** "8.15" */
export function formatTime(instant: Date | string): string {
  return format(new Date(instant), "H.mm", { in: inHelsinki })
}

/** "tiistai" */
export function formatWeekday(date: LocalDate): string {
  // "cccc" = itsenäinen muoto ("tiistai"); "EEEE" antaisi "tiistaina".
  return format(localNoon(date), "cccc", { locale: fi, in: inHelsinki })
}

/** "ti" */
export function formatWeekdayShort(date: LocalDate): string {
  return format(localNoon(date), "cccccc", { locale: fi, in: inHelsinki })
}

/** "3. marraskuuta" */
export function formatDayMonth(date: LocalDate): string {
  return format(localNoon(date), "d. MMMM", { locale: fi, in: inHelsinki })
}

/** "3.11." */
export function formatShortDate(date: LocalDate): string {
  return format(localNoon(date), "d.M.", { in: inHelsinki })
}

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fi") + text.slice(1)
}
