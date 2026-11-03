import type { WeatherProvider } from "@/data/repositories"
import type { WeatherCondition } from "@/domain/types"
import { todayLocal } from "@/lib/dates"

/**
 * Esimerkkisää: vaihtelee päivän ja paikkakunnan mukaan, mutta on saman päivän
 * aikana aina sama. Vaiheessa 2 tilalle tulee Open-Meteo-integraatio.
 */
const CONDITIONS: WeatherCondition[] = [
  "cloudy",
  "partly-cloudy",
  "drizzle",
  "cloudy",
  "rain",
  "mostly-clear",
  "fog",
]

function hash(text: string) {
  let h = 0
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0
  return h
}

export const mockWeatherProvider: WeatherProvider = {
  async getToday(location) {
    const today = todayLocal()
    const seed = hash(`${today}:${location.name}`)
    const base = 5 - (location.latitude - 60) * 1.2
    const max = Math.round(base + (seed % 4))
    const min = max - 3 - (seed % 3)
    let condition = CONDITIONS[seed % CONDITIONS.length]
    if (max <= 1 && (condition === "rain" || condition === "drizzle")) {
      condition = "snow"
    }
    const wet = ["rain", "drizzle", "snow"].includes(condition)

    return {
      placeName: location.name,
      temperature: min + Math.round((max - min) * 0.6),
      condition,
      isDay: true,
      todayMax: max,
      todayMin: min,
      precipitationProbability: wet ? 60 + (seed % 30) : seed % 25,
      observedAt: new Date().toISOString(),
    }
  },
}
