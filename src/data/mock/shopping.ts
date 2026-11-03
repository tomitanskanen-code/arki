import type { ShoppingListRepository } from "@/data/repositories"
import { normalizeItemName } from "@/domain/shopping"
import type { ShoppingListItem } from "@/domain/types"

/**
 * Vaiheen 1 kauppalista selaimen localStoragessa. Toimii myös kahden
 * selainvälilehden välillä ("storage"-tapahtuma), mikä havainnollistaa
 * vaiheen 2 Supabase Realtime -synkronointia.
 *
 * Pieni keinotekoinen viive tekee optimistisen käyttöliittymän näkyväksi.
 */
const STORAGE_KEY = "arki.kauppalista.v1"
const LATENCY_MS = 300

const listeners = new Set<() => void>()

function now() {
  return new Date().toISOString()
}

function seed(): ShoppingListItem[] {
  const minutesAgo = (m: number) =>
    new Date(Date.now() - m * 60_000).toISOString()
  const item = (
    name: string,
    created: number,
    purchased: number | null = null,
  ): ShoppingListItem => ({
    id: crypto.randomUUID(),
    name,
    isPurchased: purchased !== null,
    purchasedAt: purchased === null ? null : minutesAgo(purchased),
    createdAt: minutesAgo(created),
  })
  return [
    item("Maito", 30),
    item("Ruisleipä", 90),
    item("Banaanit", 120),
    item("Kahvi", 300),
    item("Hammastahna", 600),
    item("Kaurahiutaleet", 900, 60),
    item("Kananmunat", 1000, 65),
  ]
}

function read(): ShoppingListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ShoppingListItem[]
  } catch {
    // Vioittunut tai estetty tallennus → aloitetaan esimerkkidatalla.
  }
  const initial = seed()
  write(initial)
  return initial
}

function write(items: ShoppingListItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Esim. yksityinen selaustila: lista toimii, mutta ei säily.
  }
  listeners.forEach((listener) => listener())
}

const delay = () => new Promise((r) => setTimeout(r, LATENCY_MS))

export const localShoppingListRepository: ShoppingListRepository = {
  async list() {
    return read()
  },

  async add(rawName) {
    await delay()
    const name = normalizeItemName(rawName)
    if (!name) throw new Error("Tuotteen nimi puuttuu")
    const item: ShoppingListItem = {
      id: crypto.randomUUID(),
      name,
      isPurchased: false,
      purchasedAt: null,
      createdAt: now(),
    }
    write([...read(), item])
    return item
  },

  async setPurchased(id, purchased) {
    await delay()
    write(
      read().map((item) =>
        item.id === id
          ? {
              ...item,
              isPurchased: purchased,
              purchasedAt: purchased ? now() : null,
            }
          : item,
      ),
    )
  },

  async remove(id) {
    await delay()
    write(read().filter((item) => item.id !== id))
  },

  subscribe(listener) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) listener()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", onStorage)
    }
  },
}
