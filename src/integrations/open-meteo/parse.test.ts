import { describe, expect, it } from "vitest"

import { parseOpenMeteoResponse, WeatherParseError } from "./parse"

// Lyhennetty esimerkki Open-Meteon todellisesta vastauksesta
const sample = {
  latitude: 60.17,
  longitude: 24.94,
  timezone: "Europe/Helsinki",
  current: {
    time: "2026-11-03T14:00",
    temperature_2m: 3.4,
    weather_code: 61,
    is_day: 1,
  },
  daily: {
    time: ["2026-11-03"],
    temperature_2m_max: [5.1],
    temperature_2m_min: [-0.6],
    precipitation_probability_max: [80],
  },
}

describe("parseOpenMeteoResponse", () => {
  it("tulkitsee vastauksen", () => {
    expect(parseOpenMeteoResponse(sample, "Helsinki")).toEqual({
      placeName: "Helsinki",
      temperature: 3.4,
      condition: "rain",
      isDay: true,
      todayMax: 5.1,
      todayMin: -0.6,
      precipitationProbability: 80,
      observedAt: "2026-11-03T14:00",
    })
  })

  it("sallii puuttuvan sateen todennäköisyyden", () => {
    const { precipitation_probability_max: _, ...daily } = sample.daily
    void _
    const result = parseOpenMeteoResponse({ ...sample, daily }, "Helsinki")
    expect(result.precipitationProbability).toBeNull()
  })

  it("hylkää virheellisen vastauksen", () => {
    expect(() =>
      parseOpenMeteoResponse({ current: { temperature_2m: "kuuma" } }, "X"),
    ).toThrow(WeatherParseError)
    expect(() => parseOpenMeteoResponse(null, "X")).toThrow(WeatherParseError)
  })
})
