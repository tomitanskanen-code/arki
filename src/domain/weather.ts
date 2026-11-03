import type { WeatherCondition } from "./types"

/**
 * WMO-säätilakoodit (käytössä mm. Open-Meteossa) → Arkin säätila.
 * https://open-meteo.com/en/docs (kohta "WMO Weather interpretation codes")
 */
export function conditionFromWmoCode(code: number): WeatherCondition {
  if (code === 0) return "clear"
  if (code === 1) return "mostly-clear"
  if (code === 2) return "partly-cloudy"
  if (code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code >= 51 && code <= 55) return "drizzle"
  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return "freezing-rain"
  }
  if (code >= 61 && code <= 65) return "rain"
  if (code >= 71 && code <= 77) return "snow"
  if (code >= 80 && code <= 82) return "rain-showers"
  if (code === 85 || code === 86) return "snow-showers"
  if (code >= 95) return "thunderstorm"
  return "cloudy"
}

export const CONDITION_LABELS: Record<WeatherCondition, string> = {
  clear: "Selkeää",
  "mostly-clear": "Enimmäkseen selkeää",
  "partly-cloudy": "Puolipilvistä",
  cloudy: "Pilvistä",
  fog: "Sumua",
  drizzle: "Tihkusadetta",
  rain: "Sadetta",
  "freezing-rain": "Jäätävää sadetta",
  snow: "Lumisadetta",
  "rain-showers": "Sadekuuroja",
  "snow-showers": "Lumikuuroja",
  thunderstorm: "Ukkosta",
}

/** "−3°" – oikea miinusmerkki ja pyöristys kokonaisluvuksi. */
export function formatTemperature(value: number): string {
  const rounded = Math.round(value)
  return `${rounded < 0 ? "−" : ""}${Math.abs(rounded)}°`
}
