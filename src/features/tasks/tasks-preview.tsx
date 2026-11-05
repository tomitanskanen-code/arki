"use client"

import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { topTasksForHome } from "@/domain/tasks"
import type { FamilyMember, Task } from "@/domain/types"
import type { LocalDate } from "@/lib/dates"

import { membersByUserId } from "./task-meta"
import { TaskRow } from "./task-row"
import { TaskSheet } from "./task-sheet"
import { UndoToast } from "./undo-toast"
import { useTasks } from "./use-tasks"

const PREVIEW_COUNT = 5

/**
 * Etusivun Tehtävät-osio: avointen määrä, tärkeimmät avoimet (myöhässä,
 * pian erääntyvät, tärkeät), valmiiksi merkintä ja lisäys suoraan täältä.
 */
export function TasksPreview({
  members,
  today,
}: {
  members: FamilyMember[]
  today: LocalDate
}) {
  const state = useTasks()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const byUser = useMemo(() => membersByUserId(members), [members])

  const openCount = state.tasks.filter((t) => t.status === "open").length
  const top = topTasksForHome(state.tasks, today, PREVIEW_COUNT)

  function openSheet(task: Task | null) {
    setEditing(task)
    setSheetOpen(true)
  }

  if (state.loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-muted" />
  }

  return (
    <div>
      {state.error && (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {openCount === 0 ? (
        <p className="text-muted-foreground">Kaikki tehtävät hoidettu.</p>
      ) : (
        <p className="mb-1 text-sm text-muted-foreground">
          {openCount === 1
            ? "1 avoin tehtävä"
            : `${openCount} avointa tehtävää`}
        </p>
      )}
      {openCount > 0 && (
        <ul>
          {top.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              assignee={
                task.assignedTo ? byUser.get(task.assignedTo) : undefined
              }
              today={today}
              onToggle={() => state.complete(task)}
              onOpen={() => openSheet(task)}
            />
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => openSheet(null)}
          className="-ml-1 flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium"
        >
          <Plus aria-hidden className="size-4" />
          Lisää tehtävä
        </button>
        <Link
          href="/tehtavat"
          className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          {openCount > PREVIEW_COUNT
            ? `Kaikki ${openCount} tehtävää`
            : "Näytä kaikki"}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      <TaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={editing}
        members={members}
        today={today}
        onSave={(input) =>
          editing ? state.update(editing.id, input) : state.add(input)
        }
        onToggleStatus={(task) =>
          task.status === "done" ? state.reopen(task) : state.complete(task)
        }
        onDelete={(task) => state.remove(task.id)}
      />

      <UndoToast task={state.lastCompleted} onUndo={state.undoComplete} />
    </div>
  )
}
