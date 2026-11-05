import { Baby, House, type LucideIcon, ShoppingBag, Tag } from "lucide-react"

import type { FamilyMember, TaskCategory } from "@/domain/types"

export const CATEGORY_ICONS: Record<TaskCategory, LucideIcon> = {
  home: House,
  kids: Baby,
  errands: ShoppingBag,
  other: Tag,
}

/**
 * Vastuuhenkilöiksi kelpaavat perheenjäsenet: ne, joilla on kirjautumistunnus
 * (vanhemmat). Tehtävä viittaa tunnukseen (auth.users.id).
 */
export function assignableMembers(members: FamilyMember[]) {
  return members.filter((m): m is FamilyMember & { userId: string } =>
    Boolean(m.userId),
  )
}

export function membersByUserId(members: FamilyMember[]) {
  return new Map(assignableMembers(members).map((m) => [m.userId, m] as const))
}
