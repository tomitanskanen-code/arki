import type { ShoppingListItem } from "./types"

export const MAX_ITEM_NAME_LENGTH = 80

/** Siistii käyttäjän syötteen. Palauttaa null, jos nimi on tyhjä. */
export function normalizeItemName(input: string): string | null {
  const name = input.replace(/\s+/g, " ").trim().slice(0, MAX_ITEM_NAME_LENGTH)
  if (!name) return null
  return name.charAt(0).toLocaleUpperCase("fi") + name.slice(1)
}

/** Ostamattomat (uusin ensin) ja ostetut (viimeksi ostettu ensin). */
export function splitShoppingList(items: ShoppingListItem[]) {
  const open = items
    .filter((i) => !i.isPurchased)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const purchased = items
    .filter((i) => i.isPurchased)
    .sort((a, b) => (b.purchasedAt ?? "").localeCompare(a.purchasedAt ?? ""))
  return { open, purchased }
}
