"use client"

import { startTransition, useEffect, useOptimistic, useState } from "react"

import { shoppingListRepository as repo } from "@/data/client"
import { normalizeItemName } from "@/domain/shopping"
import type { ShoppingListItem } from "@/domain/types"

type Change =
  | { type: "add"; item: ShoppingListItem }
  | { type: "purchased"; id: string; purchased: boolean }
  | { type: "remove"; id: string }

function applyChange(items: ShoppingListItem[], change: Change) {
  switch (change.type) {
    case "add":
      return [...items, change.item]
    case "purchased":
      return items.map((item) =>
        item.id === change.id
          ? {
              ...item,
              isPurchased: change.purchased,
              purchasedAt: change.purchased ? new Date().toISOString() : null,
            }
          : item,
      )
    case "remove":
      return items.filter((item) => item.id !== change.id)
  }
}

/**
 * Kauppalistan tila optimistisella päivityksellä:
 * muutos näkyy heti (useOptimistic), tallennus tapahtuu taustalla ja
 * lopuksi tila luetaan uudelleen tietolähteestä. Jos tallennus epäonnistuu,
 * optimistinen muutos perutaan automaattisesti ja käyttäjälle näytetään virhe.
 */
export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [optimisticItems, addOptimistic] = useOptimistic(
    items ?? [],
    applyChange,
  )

  useEffect(() => {
    let active = true
    const refresh = () =>
      repo.list().then((fresh) => {
        if (active) setItems(fresh)
      })
    refresh()
    const unsubscribe = repo.subscribe(refresh)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  function run(change: Change, save: () => Promise<unknown>) {
    setError(null)
    startTransition(async () => {
      addOptimistic(change)
      try {
        await save()
      } catch {
        setError("Muutosta ei voitu tallentaa. Yritä uudelleen.")
      }
      const fresh = await repo.list()
      startTransition(() => setItems(fresh))
    })
  }

  return {
    items: optimisticItems,
    loading: items === null,
    error,
    add(rawName: string) {
      const name = normalizeItemName(rawName)
      if (!name) return false
      const temp: ShoppingListItem = {
        id: `temp-${crypto.randomUUID()}`,
        name,
        isPurchased: false,
        purchasedAt: null,
        createdAt: new Date().toISOString(),
      }
      run({ type: "add", item: temp }, () => repo.add(name))
      return true
    },
    setPurchased(id: string, purchased: boolean) {
      run({ type: "purchased", id, purchased }, () =>
        repo.setPurchased(id, purchased),
      )
    },
    remove(id: string) {
      run({ type: "remove", id }, () => repo.remove(id))
    },
  }
}
