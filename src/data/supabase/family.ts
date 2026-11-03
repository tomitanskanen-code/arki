import "server-only"

import type { FamilyRepository } from "@/data/repositories"
import type { Family, FamilyMember } from "@/domain/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Perhe ja jäsenet Supabasesta. Kyselyissä ei rajata perhettä erikseen:
 * RLS-käytännöt palauttavat vain kirjautuneen käyttäjän oman perheen rivit.
 */

interface FamilyRow {
  id: string
  name: string
  time_zone: string
  home_place_name: string
  home_latitude: number
  home_longitude: number
}

interface MemberRow {
  id: string
  family_id: string
  display_name: string
  role: FamilyMember["role"]
  color: FamilyMember["color"]
  user_id: string | null
  sort_order: number
}

function toFamily(row: FamilyRow): Family {
  return {
    id: row.id,
    name: row.name,
    timeZone: row.time_zone,
    home: {
      name: row.home_place_name,
      latitude: row.home_latitude,
      longitude: row.home_longitude,
    },
  }
}

function toMember(row: MemberRow): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    displayName: row.display_name,
    role: row.role,
    color: row.color,
    userId: row.user_id,
    sortOrder: row.sort_order,
  }
}

async function getFamily() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("families")
    .select(
      "id, name, time_zone, home_place_name, home_latitude, home_longitude",
    )
    .maybeSingle<FamilyRow>()
  if (error) throw error
  return data ? toFamily(data) : null
}

export const supabaseFamilyRepository: FamilyRepository = {
  getFamily,

  async getMembers() {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("family_members")
      .select("id, family_id, display_name, role, color, user_id, sort_order")
      .order("sort_order")
      .returns<MemberRow[]>()
    if (error) throw error
    return data.map(toMember)
  },

  async updateHomeLocation(location) {
    const family = await getFamily()
    if (!family) throw new Error("Käyttäjää ei ole liitetty perheeseen")
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from("families")
      .update({
        home_place_name: location.name,
        home_latitude: location.latitude,
        home_longitude: location.longitude,
      })
      .eq("id", family.id)
    if (error) throw error
  },
}
