import { describe, expect, it } from "vitest"

import {
  dueLabel,
  filterTasks,
  normalizeTaskTitle,
  sortOpenTasks,
  topTasksForHome,
} from "./tasks"
import type { Task } from "./types"

const today = "2026-11-05" // torstai

function task(id: string, extra: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    description: null,
    status: "open",
    priority: "normal",
    category: null,
    dueDate: null,
    assignedTo: null,
    createdBy: "tomi",
    createdAt: "2026-11-01T10:00:00Z",
    completedAt: null,
    completedBy: null,
    ...extra,
  }
}

const tasks: Task[] = [
  task("ei-pvm-vanha", { createdAt: "2026-10-01T10:00:00Z" }),
  task("ei-pvm-uusi", { createdAt: "2026-11-04T10:00:00Z" }),
  task("tarkea", { priority: "high" }),
  task("myohassa", { dueDate: "2026-11-03", assignedTo: "tarja" }),
  task("myohassa-eniten", { dueDate: "2026-10-30" }),
  task("huomenna", { dueDate: "2026-11-06", assignedTo: "tomi" }),
  task("ensi-kuussa", { dueDate: "2026-12-10" }),
  task("valmis", {
    status: "done",
    completedAt: "2026-11-04T08:00:00Z",
  }),
  task("valmis-uusin", {
    status: "done",
    completedAt: "2026-11-05T08:00:00Z",
  }),
]

describe("sortOpenTasks", () => {
  it("myöhässä → lähestyvät → tärkeät → muut", () => {
    expect(sortOpenTasks(tasks, today).map((t) => t.id)).toEqual([
      "myohassa-eniten",
      "myohassa",
      "huomenna",
      "tarkea",
      "ensi-kuussa",
      "ei-pvm-uusi",
      "ei-pvm-vanha",
    ])
  })

  it("asettaa tärkeän tasapelissä ensin", () => {
    const sorted = sortOpenTasks(
      [
        task("normaali", { dueDate: "2026-11-06" }),
        task("tarkea", { dueDate: "2026-11-06", priority: "high" }),
      ],
      today,
    )
    expect(sorted.map((t) => t.id)).toEqual(["tarkea", "normaali"])
  })
})

describe("filterTasks", () => {
  const ids = (filter: Parameters<typeof filterTasks>[1]) =>
    filterTasks(tasks, filter, "tomi", today).map((t) => t.id)

  it("suodattaa vastuuhenkilön mukaan", () => {
    expect(ids({ type: "mine" })).toEqual(["huomenna"])
    expect(ids({ type: "member", userId: "tarja" })).toEqual(["myohassa"])
    expect(ids({ type: "unassigned" })).not.toContain("myohassa")
  })

  it("näyttää valmiit viimeksi valmistunut ensin", () => {
    expect(ids({ type: "done" })).toEqual(["valmis-uusin", "valmis"])
  })

  it("ei näytä valmiita avoimissa", () => {
    expect(ids({ type: "open" })).not.toContain("valmis")
  })
})

describe("topTasksForHome", () => {
  it("palauttaa viisi tärkeintä", () => {
    expect(topTasksForHome(tasks, today).map((t) => t.id)).toEqual([
      "myohassa-eniten",
      "myohassa",
      "huomenna",
      "tarkea",
      "ensi-kuussa",
    ])
  })
})

describe("dueLabel", () => {
  it("muotoilee määräpäivän", () => {
    expect(dueLabel("2026-11-04", today)).toEqual({
      text: "Myöhässä 1 pv",
      state: "overdue",
    })
    expect(dueLabel("2026-10-30", today).text).toBe("Myöhässä 6 pv")
    expect(dueLabel(today, today)).toEqual({ text: "Tänään", state: "today" })
    expect(dueLabel("2026-11-06", today).text).toBe("Huomenna")
    expect(dueLabel("2026-11-09", today)).toEqual({
      text: "ma 9.11.",
      state: "soon",
    })
    expect(dueLabel("2026-12-10", today).state).toBe("later")
  })
})

describe("normalizeTaskTitle", () => {
  it("siistii nimen", () => {
    expect(normalizeTaskTitle("  varaa   auton huolto ")).toBe(
      "Varaa auton huolto",
    )
    expect(normalizeTaskTitle("   ")).toBeNull()
  })
})
