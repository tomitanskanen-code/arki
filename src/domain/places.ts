import type { HomeLocation } from "./types"

/** Valmiit kotipaikkakunnat asetuksiin. GPS-paikannusta ei käytetä. */
export const HOME_PLACE_PRESETS: HomeLocation[] = [
  { name: "Helsinki", latitude: 60.1699, longitude: 24.9384 },
  { name: "Espoo", latitude: 60.2055, longitude: 24.6559 },
  { name: "Vantaa", latitude: 60.2934, longitude: 25.0378 },
  { name: "Tampere", latitude: 61.4978, longitude: 23.761 },
  { name: "Turku", latitude: 60.4518, longitude: 22.2666 },
  { name: "Oulu", latitude: 65.0121, longitude: 25.4651 },
  { name: "Jyväskylä", latitude: 62.2426, longitude: 25.7473 },
  { name: "Kuopio", latitude: 62.8924, longitude: 27.677 },
  { name: "Lahti", latitude: 60.9827, longitude: 25.6612 },
  { name: "Porvoo", latitude: 60.3923, longitude: 25.6651 },
]

export function findPreset(name: string): HomeLocation | undefined {
  return HOME_PLACE_PRESETS.find((p) => p.name === name)
}
