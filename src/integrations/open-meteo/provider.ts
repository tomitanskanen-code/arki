import "server-only"

import { cacheLife } from "next/cache"

import type { WeatherProvider } from "@/data/repositories"
import type { WeatherSnapshot } from "@/domain/types"
import { TIME_ZONE } from "@/lib/dates"

import { parseOpenMeteoResponse } from "./parse"

/**
 * Open-Meteo: ilmainen sääpalvelu ei-kaupalliseen käyttöön, ei API-avainta.
 * https://open-meteo.com/en/docs
 *
 * Haku tehdään palvelimella ja tulos pidetään välimuistissa 30 minuuttia
 * paikkakunnittain ("use cache"). Säätieto ei ole henkilökohtaista, joten
 * jaettu välimuisti on turvallinen.
 */
const ENDPOINT = "https://api.open-meteo.com/v1/forecast"
const TIMEOUT_MS = 5000

async function fetchWeather(
  latitude: number,
  longitude: number,
  placeName: string,
): Promise<WeatherSnapshot> {
  "use cache"
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 })

  const params = new URLSearchParams({
    latitude: latitude.toFixed(2),
    longitude: longitude.toFixed(2),
    current: "temperature_2m,weather_code,is_day",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: TIME_ZONE,
    forecast_days: "1",
  })
  const response = await fetch(`${ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Open-Meteo vastasi ${response.status}`)
  }
  return parseOpenMeteoResponse(await response.json(), placeName)
}

export const openMeteoWeatherProvider: WeatherProvider = {
  getToday(location) {
    return fetchWeather(location.latitude, location.longitude, location.name)
  },
}
