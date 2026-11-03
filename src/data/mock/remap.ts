import type { CalendarRepository } from "@/data/repositories"
import type { FamilyMember } from "@/domain/types"

import { MOCK_MEMBERS } from "./fixtures"

/**
 * Siirtymävaihe (vaihe 2): perhe tulee tietokannasta, mutta kalenteri on
 * vielä esimerkkidataa. Esimerkkitapahtumat liitetään oikeisiin
 * perheenjäseniin roolin ja järjestyksen mukaan (1. vanhempi, 2. vanhempi,
 * 1. lapsi, 2. lapsi). Poistuu vaiheessa 3, kun oikeat syötteet tulevat.
 */
function buildMapping(real: FamilyMember[]) {
  const mapping = new Map<string, string>()
  for (const role of ["parent", "child"] as const) {
    const mock = MOCK_MEMBERS.filter((m) => m.role === role)
    const actual = real.filter((m) => m.role === role)
    mock.forEach((m, i) => {
      if (actual[i]) mapping.set(m.id, actual[i].id)
    })
  }
  return mapping
}

export function remapMockCalendar(
  base: CalendarRepository,
  getMembers: () => Promise<FamilyMember[]>,
): CalendarRepository {
  return {
    async getSources() {
      const mapping = buildMapping(await getMembers())
      return (await base.getSources()).map((s) => ({
        ...s,
        memberId: s.memberId ? (mapping.get(s.memberId) ?? null) : null,
      }))
    },

    async getEvents(range) {
      const mapping = buildMapping(await getMembers())
      return (await base.getEvents(range)).flatMap((e) => {
        const memberIds = e.memberIds
          .map((id) => mapping.get(id))
          .filter((id): id is string => id !== undefined)
        // Henkilön tapahtuma, jolle ei löydy vastinetta, jätetään pois
        // (muuten se näyttäisi koko perheen tapahtumalta).
        if (e.memberIds.length > 0 && memberIds.length === 0) return []
        return [{ ...e, memberIds }]
      })
    },
  }
}
