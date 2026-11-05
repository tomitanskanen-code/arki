import type { TaskRepository } from "@/data/repositories"
import { normalizeTaskTitle } from "@/domain/tasks"
import type { Task, TaskInput } from "@/domain/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Tehtävät Supabasessa. Toimii selaimessa kirjautuneen käyttäjän istunnolla;
 * RLS rajaa rivit omaan perheeseen ja vastuuhenkilön oman perheen
 * käyttäjiin. Realtime ilmoittaa toisen vanhemman muutoksista.
 * Valmistumistiedot (completed_at/by) asettaa tietokannan triggeri.
 */

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: Task["status"]
  priority: Task["priority"]
  category: Task["category"]
  due_date: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  completed_at: string | null
  completed_by: string | null
}

const COLUMNS =
  "id, title, description, status, priority, category, due_date, assigned_to, created_by, created_at, completed_at, completed_by"

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
  }
}

/** Sovelluksen kentät → tietokannan sarakkeet (vain annetut kentät). */
function toRow(input: Partial<TaskInput>) {
  const row: Record<string, unknown> = {}
  if (input.title !== undefined) {
    const title = normalizeTaskTitle(input.title)
    if (!title) throw new Error("Tehtävän nimi puuttuu")
    row.title = title
  }
  if (input.description !== undefined) {
    row.description = input.description?.trim() || null
  }
  if (input.priority !== undefined) row.priority = input.priority
  if (input.category !== undefined) row.category = input.category
  if (input.dueDate !== undefined) row.due_date = input.dueDate
  if (input.assignedTo !== undefined) row.assigned_to = input.assignedTo
  return row
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

export const supabaseTaskRepository: TaskRepository = {
  async list() {
    const { data, error } = await getSupabaseBrowserClient()
      .from("tasks")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .returns<TaskRow[]>()
    if (error) throw error
    return data.map(toTask)
  },

  async add(input) {
    const { data, error } = await getSupabaseBrowserClient()
      .from("tasks")
      .insert({ ...toRow(input), family_id: await currentFamilyId() })
      .select(COLUMNS)
      .single<TaskRow>()
    if (error) throw error
    return toTask(data)
  },

  async update(id, patch) {
    const { error } = await getSupabaseBrowserClient()
      .from("tasks")
      .update(toRow(patch))
      .eq("id", id)
    if (error) throw error
  },

  async setStatus(id, status) {
    const { error } = await getSupabaseBrowserClient()
      .from("tasks")
      .update({ status })
      .eq("id", id)
    if (error) throw error
  },

  async remove(id) {
    const { error } = await getSupabaseBrowserClient()
      .from("tasks")
      .delete()
      .eq("id", id)
    if (error) throw error
  },

  subscribe(listener) {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`tehtavat-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
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
