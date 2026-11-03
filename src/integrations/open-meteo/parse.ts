import type { WeatherSnapshot } from "@/domain/types"
import { conditionFromWmoCode } from "@/domain/weather"

/**
 * Open-Meteo-vastauksen tulkinta. Erillään verkkokutsusta, jotta sen voi
 * testata. Ulkoiseen dataan ei luoteta sokeasti: puuttuvat tai väärän
 * tyyppiset kentät aiheuttavat virheen eivätkä rikkinäistä näkymää.
 */
export class WeatherParseError extends Error {}

function num(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new WeatherParseError(`Kenttä ${field} puuttuu tai on virheellinen`)
  }
  return value
}

function firstNum(value: unknown, field: string): number {
  return num(Array.isArray(value) ? value[0] : undefined, field)
}

export function parseOpenMeteoResponse(
  json: unknown,
  placeName: string,
): WeatherSnapshot {
  if (typeof json !== "object" || json === null) {
    throw new WeatherParseError("Vastaus ei ole JSON-olio")
  }
  const data = json as {
    current?: Record<string, unknown>
    daily?: Record<string, unknown>
  }
  const current = data.current ?? {}
  const daily = data.daily ?? {}

  const probability = Array.isArray(daily.precipitation_probability_max)
    ? daily.precipitation_probability_max[0]
    : null

  return {
    placeName,
    temperature: num(current.temperature_2m, "current.temperature_2m"),
    condition: conditionFromWmoCode(
      num(current.weather_code, "current.weather_code"),
    ),
    isDay: current.is_day !== 0,
    todayMax: firstNum(daily.temperature_2m_max, "daily.temperature_2m_max"),
    todayMin: firstNum(daily.temperature_2m_min, "daily.temperature_2m_min"),
    precipitationProbability:
      typeof probability === "number" && Number.isFinite(probability)
        ? probability
        : null,
    observedAt:
      typeof current.time === "string"
        ? current.time
        : new Date().toISOString(),
  }
}
