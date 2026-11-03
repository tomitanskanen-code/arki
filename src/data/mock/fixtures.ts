import type { CalendarSource, Family, FamilyMember } from "@/domain/types"

/**
 * Esimerkkiperhe. Nimet ovat keksittyjä; oikeat tiedot tulevat vaiheessa 2
 * tietokannasta.
 */
export const FAMILY_ID = "family-1"

export const MOCK_FAMILY: Family = {
  id: FAMILY_ID,
  name: "Perhe",
  timeZone: "Europe/Helsinki",
  home: { name: "Helsinki", latitude: 60.1699, longitude: 24.9384 },
}

export const MEMBER = {
  mikko: "member-mikko",
  laura: "member-laura",
  aino: "member-aino",
  eetu: "member-eetu",
} as const

export const MOCK_MEMBERS: FamilyMember[] = [
  {
    id: MEMBER.laura,
    familyId: FAMILY_ID,
    displayName: "Laura",
    role: "parent",
    color: "clay",
    userId: "user-laura",
    sortOrder: 1,
  },
  {
    id: MEMBER.mikko,
    familyId: FAMILY_ID,
    displayName: "Mikko",
    role: "parent",
    color: "slate",
    userId: "user-mikko",
    sortOrder: 2,
  },
  {
    id: MEMBER.aino,
    familyId: FAMILY_ID,
    displayName: "Aino",
    role: "child",
    color: "sage",
    userId: null,
    sortOrder: 3,
  },
  {
    id: MEMBER.eetu,
    familyId: FAMILY_ID,
    displayName: "Eetu",
    role: "child",
    color: "ochre",
    userId: null,
    sortOrder: 4,
  },
]

export const SOURCE = {
  family: "source-google-family",
  wilmaAino: "source-wilma-aino",
  wilmaEetu: "source-wilma-eetu",
  footballAino: "source-myclub-aino",
  swimmingEetu: "source-myclub-eetu",
} as const

const syncedAt = "2026-11-03T05:00:00.000Z"

export const MOCK_SOURCES: CalendarSource[] = [
  {
    id: SOURCE.family,
    familyId: FAMILY_ID,
    kind: "google",
    name: "Perheen kalenteri",
    memberId: null,
    enabled: true,
    syncStatus: "ok",
    lastSyncedAt: syncedAt,
    lastError: null,
  },
  {
    id: SOURCE.wilmaAino,
    familyId: FAMILY_ID,
    kind: "wilma",
    name: "Lukujärjestys 4B",
    memberId: MEMBER.aino,
    enabled: true,
    syncStatus: "ok",
    lastSyncedAt: syncedAt,
    lastError: null,
  },
  {
    id: SOURCE.wilmaEetu,
    familyId: FAMILY_ID,
    kind: "wilma",
    name: "Lukujärjestys 2A",
    memberId: MEMBER.eetu,
    enabled: true,
    syncStatus: "ok",
    lastSyncedAt: syncedAt,
    lastError: null,
  },
  {
    id: SOURCE.footballAino,
    familyId: FAMILY_ID,
    kind: "myclub",
    name: "Jalkapallo P/T2016",
    memberId: MEMBER.aino,
    enabled: true,
    syncStatus: "ok",
    lastSyncedAt: syncedAt,
    lastError: null,
  },
  {
    id: SOURCE.swimmingEetu,
    familyId: FAMILY_ID,
    kind: "myclub",
    name: "Uintikoulu",
    memberId: MEMBER.eetu,
    enabled: true,
    syncStatus: "stale",
    lastSyncedAt: "2026-11-02T05:00:00.000Z",
    lastError: "Syötteen päivitys viivästynyt",
  },
]
