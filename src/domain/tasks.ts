import {
  addLocalDays,
  formatShortDate,
  formatWeekdayShort,
  type LocalDate,
} from "@/lib/dates"

import type { Task, TaskCategory } from "./types"

export const MAX_TASK_TITLE_LENGTH = 200
export const MAX_TASK_DESCRIPTION_LENGTH = 2000

/** Määräpäivä, jota pidetään "lähestyvänä" (päivinä tästä päivästä). */
const SOON_DAYS = 7

export const TASK_CATEGORIES: TaskCategory[] = [
  "home",
  "kids",
  "errands",
  "other",
]

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  home: "Koti",
  kids: "Lapset",
  errands: "Asiointi",
  other: "Muut",
}

/** Siistii nimen. Palauttaa null, jos nimi on tyhjä. */
export function normalizeTaskTitle(input: string): string | null {
  const title = input
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TASK_TITLE_LENGTH)
  if (!title) return null
  return title.charAt(0).toLocaleUpperCase("fi") + title.slice(1)
}

export function isOverdue(task: Task, today: LocalDate) {
  return task.status === "open" && task.dueDate !== null && task.dueDate < today
}

/**
 * Järjestysryhmä:
 * 0 myöhässä, 1 määräpäivä lähipäivinä, 2 muut tärkeät, 3 muut.
 */
function sortGroup(task: Task, today: LocalDate): number {
  if (task.dueDate !== null && task.dueDate < today) return 0
  if (task.dueDate !== null && task.dueDate <= addLocalDays(today, SOON_DAYS)) {
    return 1
  }
  if (task.priority === "high") return 2
  return 3
}

/**
 * Avointen tehtävien oletusjärjestys: myöhässä → lähestyvä määräpäivä →
 * muut tärkeät → muut. Ryhmän sisällä määräpäivän mukaan (ilman
 * määräpäivää viimeisenä, uusin ensin); tasapelissä tärkeä ensin.
 */
export function sortOpenTasks(tasks: Task[], today: LocalDate): Task[] {
  return tasks
    .filter((t) => t.status === "open")
    .sort((a, b) => {
      const group = sortGroup(a, today) - sortGroup(b, today)
      if (group !== 0) return group
      if (a.dueDate !== b.dueDate) {
        if (a.dueDate === null) return 1
        if (b.dueDate === null) return -1
        return a.dueDate < b.dueDate ? -1 : 1
      }
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export type TaskFilter =
  | { type: "open" }
  | { type: "mine" }
  | { type: "unassigned" }
  | { type: "done" }
  | { type: "member"; userId: string }

/** Suodatus ja järjestys samalla kertaa. */
export function filterTasks(
  tasks: Task[],
  filter: TaskFilter,
  currentUserId: string | null,
  today: LocalDate,
): Task[] {
  if (filter.type === "done") {
    return tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
  }
  const open = sortOpenTasks(tasks, today)
  switch (filter.type) {
    case "open":
      return open
    case "mine":
      return currentUserId
        ? open.filter((t) => t.assignedTo === currentUserId)
        : []
    case "unassigned":
      return open.filter((t) => t.assignedTo === null)
    case "member":
      return open.filter((t) => t.assignedTo === filter.userId)
  }
}

/** Etusivun nosto: tärkeimmät avoimet tehtävät. */
export function topTasksForHome(
  tasks: Task[],
  today: LocalDate,
  count = 5,
): Task[] {
  return sortOpenTasks(tasks, today).slice(0, count)
}

export type DueState = "overdue" | "today" | "soon" | "later"

/** Määräpäivän teksti ja tila: "Myöhässä 2 pv", "Tänään", "Huomenna", "pe 7.11." */
export function dueLabel(
  dueDate: LocalDate,
  today: LocalDate,
): { text: string; state: DueState } {
  if (dueDate < today) {
    let days = 0
    for (let d = dueDate; d < today; d = addLocalDays(d, 1)) days++
    return {
      text: days === 1 ? "Myöhässä 1 pv" : `Myöhässä ${days} pv`,
      state: "overdue",
    }
  }
  if (dueDate === today) return { text: "Tänään", state: "today" }
  if (dueDate === addLocalDays(today, 1)) {
    return { text: "Huomenna", state: "soon" }
  }
  const text = `${formatWeekdayShort(dueDate)} ${formatShortDate(dueDate)}`
  return {
    text,
    state: dueDate <= addLocalDays(today, SOON_DAYS) ? "soon" : "later",
  }
}
