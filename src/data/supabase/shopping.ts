import type { ShoppingListRepository } from "@/data/repositories"
import { normalizeItemName } from "@/domain/shopping"
import type { ShoppingListItem } from "@/domain/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Kauppalista Supabasessa. Toimii selaimessa kirjautuneen käyttäjän
 * istunnolla; RLS rajaa rivit omaan perheeseen. Realtime ilmoittaa
 * toisen vanhemman tekemistä muutoksista, jolloin lista luetaan uudelleen.
 */

interface ItemRow {
  id: string
  name: string
  is_purchased: boolean
  purchased_at: string | null
  created_at: string
}

const COLUMNS = "id, name, is_purchased, purchased_at, created_at"

function toItem(row: ItemRow): ShoppingListItem {
  return {
    id: row.id,
    name: row.name,
    isPurchased: row.is_purchased,
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
  }
}

let familyId: Promise<string> | null = null

function currentFamilyId() {
  familyId ??= (async () => {
    const { data, error } = await getSupabaseBrowserClient()
      .from("families")
      .select("id")
      .single<{ id: string }>()
    if (error) {
      familyId = null
      throw error
    }
    return data.id
  })()
  return familyId
}

export const supabaseShoppingListRepository: ShoppingListRepository = {
  async list() {
    const { data, error } = await getSupabaseBrowserClient()
      .from("shopping_list_items")
      .select(COLUMNS)
      .order("created_at")
      .returns<ItemRow[]>()
    if (error) throw error
    return data.map(toItem)
  },

  async add(rawName) {
    const name = normalizeItemName(rawName)
    if (!name) throw new Error("Tuotteen nimi puuttuu")
    const { data, error } = await getSupabaseBrowserClient()
      .from("shopping_list_items")
      .insert({ family_id: await currentFamilyId(), name })
      .select(COLUMNS)
      .single<ItemRow>()
    if (error) throw error
    return toItem(data)
  },

  async setPurchased(id, purchased) {
    const { error } = await getSupabaseBrowserClient()
      .from("shopping_list_items")
      .update({
        is_purchased: purchased,
        purchased_at: purchased ? new Date().toISOString() : null,
      })
      .eq("id", id)
    if (error) throw error
  },

  async remove(id) {
    const { error } = await getSupabaseBrowserClient()
      .from("shopping_list_items")
      .delete()
      .eq("id", id)
    if (error) throw error
  },

  subscribe(listener) {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`kauppalista-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list_items" },
        () => listener(),
      )
      .subscribe()

    // iPhone katkaisee yhteyden taustalla; luetaan lista, kun sovellus palaa.
    const onVisible = () => {
      if (document.visibilityState === "visible") listener()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      void supabase.removeChannel(channel)
    }
  },
}
