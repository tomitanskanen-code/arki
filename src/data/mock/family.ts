import { cookies } from "next/headers"

import type { CalendarRepository, FamilyRepository } from "@/data/repositories"
import { findPreset } from "@/domain/places"

import "server-only"

import { generateMockEvents } from "./events"
import { MOCK_FAMILY, MOCK_MEMBERS, MOCK_SOURCES } from "./fixtures"

/**
 * Vaiheessa 1 kotipaikkakunta tallennetaan evästeeseen, jotta asetus toimii
 * ilman tietokantaa. Vaiheessa 2 se tallennetaan families-tauluun.
 */
const HOME_COOKIE = "arki-koti"

export const mockFamilyRepository: FamilyRepository = {
  async getFamily() {
    const stored = (await cookies()).get(HOME_COOKIE)?.value
    const home = (stored && findPreset(stored)) || MOCK_FAMILY.home
    return { ...MOCK_FAMILY, home }
  },

  async getMembers() {
    return [...MOCK_MEMBERS].sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async updateHomeLocation(location) {
    ;(await cookies()).set(HOME_COOKIE, location.name, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })
  },
}

export const mockCalendarRepository: CalendarRepository = {
  async getSources() {
    return MOCK_SOURCES
  },

  async getEvents(range) {
    return generateMockEvents(range)
  },
}
