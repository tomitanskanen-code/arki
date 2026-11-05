"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react"

import { taskRepository as repo } from "@/data/client"
import { normalizeTaskTitle } from "@/domain/tasks"
import type { Task, TaskInput, TaskStatus } from "@/domain/types"

type Change =
  | { type: "add"; task: Task }
  | { type: "update"; id: string; patch: Partial<Task> }
  | { type: "remove"; id: string }

function applyChange(tasks: Task[], change: Change) {
  switch (change.type) {
    case "add":
      return [change.task, ...tasks]
    case "update":
      return tasks.map((t) =>
        t.id === change.id ? { ...t, ...change.patch } : t,
      )
    case "remove":
      return tasks.filter((t) => t.id !== change.id)
  }
}

/** Sovelluksen syöte → optimistisesti näytettävät kentät. */
function inputToPatch(input: Partial<TaskInput>): Partial<Task> {
  const patch: Partial<Task> = {}
  if (input.title !== undefined) {
    patch.title = normalizeTaskTitle(input.title) ?? input.title
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null
  }
  if (input.priority !== undefined) patch.priority = input.priority
  if (input.category !== undefined) patch.category = input.category
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate
  if (input.assignedTo !== undefined) patch.assignedTo = input.assignedTo
  return patch
}

/**
 * Tehtävien tila optimistisella päivityksellä (kuten kauppalista):
 * muutos näkyy heti, tallennus taustalla, lopuksi tila luetaan uudelleen.
 * Epäonnistunut tallennus perutaan automaattisesti ja virhe näytetään.
 * Valmiiksi merkinnän voi kumota (undo).
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [optimisticTasks, addOptimistic] = useOptimistic(
    tasks ?? [],
    applyChange,
  )

  useEffect(() => {
    let active = true
    const refresh = () =>
      repo
        .list()
        .then((fresh) => {
          if (active) setTasks(fresh)
        })
        .catch(() => {
          if (active) {
            setTasks((current) => current ?? [])
            setError("Tehtäviä ei saatu haettua. Tarkista verkkoyhteys.")
          }
        })
    refresh()
    const unsubscribe = repo.subscribe(refresh)
    return () => {
      active = false
      unsubscribe()
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [])

  const run = useCallback(
    (change: Change, save: () => Promise<unknown>, failure: string) => {
      setError(null)
      startTransition(async () => {
        addOptimistic(change)
        try {
          await save()
        } catch {
          setError(failure)
        }
        try {
          const fresh = await repo.list()
          startTransition(() => setTasks(fresh))
        } catch {
          // Lista päivittyy seuraavasta muutosilmoituksesta.
        }
      })
    },
    [addOptimistic],
  )

  const setStatus = useCallback(
    (task: Task, status: TaskStatus) => {
      const now = new Date().toISOString()
      run(
        {
          type: "update",
          id: task.id,
          patch: { status, completedAt: status === "done" ? now : null },
        },
        () => repo.setStatus(task.id, status),
        status === "done"
          ? "Tehtävää ei voitu merkitä valmiiksi. Yritä uudelleen."
          : "Tehtävää ei voitu palauttaa. Yritä uudelleen.",
      )
      if (undoTimer.current) clearTimeout(undoTimer.current)
      if (status === "done") {
        setLastCompleted(task)
        undoTimer.current = setTimeout(() => setLastCompleted(null), 5000)
      } else {
        setLastCompleted(null)
      }
    },
    [run],
  )

  return {
    tasks: optimisticTasks,
    loading: tasks === null,
    error,
    dismissError: () => setError(null),
    /** Viimeksi valmiiksi merkitty tehtävä (kumoa-ilmoitusta varten). */
    lastCompleted,
    add(input: TaskInput) {
      const title = normalizeTaskTitle(input.title)
      if (!title) return false
      const temp: Task = {
        id: `temp-${crypto.randomUUID()}`,
        title,
        description: input.description?.trim() || null,
        status: "open",
        priority: input.priority ?? "normal",
        category: input.category ?? null,
        dueDate: input.dueDate ?? null,
        assignedTo: input.assignedTo ?? null,
        createdBy: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        completedBy: null,
      }
      run(
        { type: "add", task: temp },
        () => repo.add({ ...input, title }),
        "Tehtävää ei voitu tallentaa. Yritä uudelleen.",
      )
      return true
    },
    update(id: string, input: Partial<TaskInput>) {
      if (input.title !== undefined && !normalizeTaskTitle(input.title)) {
        return false
      }
      run(
        { type: "update", id, patch: inputToPatch(input) },
        () => repo.update(id, input),
        "Muutoksia ei voitu tallentaa. Yritä uudelleen.",
      )
      return true
    },
    complete: (task: Task) => setStatus(task, "done"),
    reopen: (task: Task) => setStatus(task, "open"),
    undoComplete() {
      if (lastCompleted) setStatus(lastCompleted, "open")
    },
    remove(id: string) {
      run(
        { type: "remove", id },
        () => repo.remove(id),
        "Tehtävää ei voitu poistaa. Yritä uudelleen.",
      )
    },
  }
}

export type TasksState = ReturnType<typeof useTasks>
