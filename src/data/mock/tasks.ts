import type { TaskRepository } from "@/data/repositories"
import { normalizeTaskTitle } from "@/domain/tasks"
import type { Task } from "@/domain/types"
import { addLocalDays, todayLocal } from "@/lib/dates"

/**
 * Esittelytilan tehtävät selaimen localStoragessa. Synkronoituu
 * välilehtien välillä kuten kauppalista. Käyttäjät vastaavat
 * esimerkkiperheen vanhempia (fixtures.ts: user-laura, user-mikko).
 */
const STORAGE_KEY = "arki.tehtavat.v1"
const LATENCY_MS = 250
const DEMO_USER = "user-mikko"

const listeners = new Set<() => void>()

function seed(): Task[] {
  const today = todayLocal()
  const base = {
    description: null,
    status: "open" as const,
    priority: "normal" as const,
    category: null,
    dueDate: null,
    assignedTo: null,
    createdBy: DEMO_USER,
    completedAt: null,
    completedBy: null,
  }
  const at = (minutesAgo: number) =>
    new Date(Date.now() - minutesAgo * 60_000).toISOString()
  return [
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Korjaa alakerran WC:n lamppu",
      category: "home",
      createdAt: at(60),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Osta uudet jalkapallokengät",
      category: "kids",
      assignedTo: "user-laura",
      dueDate: addLocalDays(today, 2),
      createdAt: at(120),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Varaa auton huolto",
      category: "errands",
      assignedTo: DEMO_USER,
      dueDate: addLocalDays(today, -1),
      createdAt: at(3000),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Hoida lasten passien uusiminen",
      category: "errands",
      priority: "high",
      createdAt: at(4000),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Ilmoita jalkapalloleirille",
      category: "kids",
      dueDate: addLocalDays(today, 14),
      createdAt: at(5000),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Siivoa varasto",
      category: "home",
      createdAt: at(9000),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: "Palauta kirjaston kirjat",
      status: "done",
      completedAt: at(30),
      completedBy: DEMO_USER,
      createdAt: at(6000),
    },
  ]
}

function read(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Task[]
  } catch {
    // Vioittunut tai estetty tallennus → aloitetaan esimerkkidatalla.
  }
  const initial = seed()
  write(initial)
  return initial
}

function write(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // Esim. yksityinen selaustila: toimii, mutta ei säily.
  }
  listeners.forEach((listener) => listener())
}

const delay = () => new Promise((r) => setTimeout(r, LATENCY_MS))

export const localTaskRepository: TaskRepository = {
  async list() {
    return read()
  },

  async add(input) {
    await delay()
    const title = normalizeTaskTitle(input.title)
    if (!title) throw new Error("Tehtävän nimi puuttuu")
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      description: input.description?.trim() || null,
      status: "open",
      priority: input.priority ?? "normal",
      category: input.category ?? null,
      dueDate: input.dueDate ?? null,
      assignedTo: input.assignedTo ?? null,
      createdBy: DEMO_USER,
      createdAt: new Date().toISOString(),
      completedAt: null,
      completedBy: null,
    }
    write([task, ...read()])
    return task
  },

  async update(id, patch) {
    await delay()
    write(
      read().map((t) => {
        if (t.id !== id) return t
        const title =
          patch.title !== undefined ? normalizeTaskTitle(patch.title) : t.title
        if (!title) throw new Error("Tehtävän nimi puuttuu")
        return {
          ...t,
          title,
          description:
            patch.description !== undefined
              ? patch.description?.trim() || null
              : t.description,
          priority: patch.priority ?? t.priority,
          category: patch.category !== undefined ? patch.category : t.category,
          dueDate: patch.dueDate !== undefined ? patch.dueDate : t.dueDate,
          assignedTo:
            patch.assignedTo !== undefined ? patch.assignedTo : t.assignedTo,
        }
      }),
    )
  },

  async setStatus(id, status) {
    await delay()
    write(
      read().map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === "done" ? new Date().toISOString() : null,
              completedBy: status === "done" ? DEMO_USER : null,
            }
          : t,
      ),
    )
  },

  async remove(id) {
    await delay()
    write(read().filter((t) => t.id !== id))
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

/** Esittelytilan "kirjautunut" käyttäjä (Minun tehtäväni -suodatin). */
export const DEMO_TASK_USER = DEMO_USER
