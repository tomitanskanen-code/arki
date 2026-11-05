"use client"

import { Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { PageHeader } from "@/components/layout/page"
import { filterTasks, type TaskFilter } from "@/domain/tasks"
import type { FamilyMember, Task } from "@/domain/types"
import { FilterChip } from "@/features/calendar/calendar-view"
import { MemberDot } from "@/features/family/member-dot"
import type { LocalDate } from "@/lib/dates"

import { assignableMembers, membersByUserId } from "./task-meta"
import { TaskRow } from "./task-row"
import { TaskSheet } from "./task-sheet"
import { UndoToast } from "./undo-toast"
import { useTasks } from "./use-tasks"

const EMPTY_TEXT: Record<TaskFilter["type"], string> = {
  open: "Ei avoimia tehtäviä.",
  mine: "Sinulle ei ole avoimia tehtäviä.",
  unassigned: "Ei tehtäviä ilman vastuuhenkilöä.",
  done: "Ei vielä valmiita tehtäviä.",
  member: "Ei avoimia tehtäviä.",
}

function sameFilter(a: TaskFilter, b: TaskFilter) {
  return (
    a.type === b.type &&
    (a.type !== "member" || (b.type === "member" && a.userId === b.userId))
  )
}

/** Tehtävät-päänäkymä: otsikko, suodattimet, lista ja lisäyspaneeli. */
export function TasksView({
  members,
  currentUserId,
  today,
}: {
  members: FamilyMember[]
  currentUserId: string | null
  today: LocalDate
}) {
  const state = useTasks()
  const [filter, setFilter] = useState<TaskFilter>({ type: "open" })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const byUser = useMemo(() => membersByUserId(members), [members])
  const others = assignableMembers(members).filter(
    (m) => m.userId !== currentUserId,
  )
  const openCount = state.tasks.filter((t) => t.status === "open").length
  const visible = filterTasks(state.tasks, filter, currentUserId, today)

  function openSheet(task: Task | null) {
    setEditing(task)
    setSheetOpen(true)
  }

  const chips: { label: React.ReactNode; filter: TaskFilter }[] = [
    { label: "Kaikki avoimet", filter: { type: "open" } },
    ...(currentUserId
      ? [{ label: "Minun", filter: { type: "mine" } as TaskFilter }]
      : []),
    { label: "Ilman vastuuhenkilöä", filter: { type: "unassigned" } },
    ...others.map((m) => ({
      label: (
        <>
          <MemberDot member={m} />
          {m.displayName}
        </>
      ),
      filter: { type: "member", userId: m.userId } as TaskFilter,
    })),
    { label: "Valmiit", filter: { type: "done" } },
  ]

  return (
    <>
      <PageHeader
        title="Tehtävät"
        eyebrow={
          state.loading
            ? " "
            : openCount === 0
              ? "Kaikki hoidettu"
              : `${openCount} avointa`
        }
        action={
          <button
            type="button"
            onClick={() => openSheet(null)}
            className="flex h-11 items-center gap-1.5 rounded-full bg-primary pr-4 pl-3 text-sm font-medium text-primary-foreground"
          >
            <Plus aria-hidden className="size-4" />
            Lisää
          </button>
        }
      />

      <div
        role="group"
        aria-label="Suodata tehtäviä"
        className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        {chips.map((chip, i) => (
          <FilterChip
            key={i}
            active={sameFilter(chip.filter, filter)}
            onClick={() => setFilter(chip.filter)}
          >
            {chip.label}
          </FilterChip>
        ))}
      </div>

      {state.error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {state.loading ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-label="Ladataan">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          {EMPTY_TEXT[filter.type]}
        </p>
      ) : (
        <ul className="mt-3">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              assignee={
                task.assignedTo ? byUser.get(task.assignedTo) : undefined
              }
              today={today}
              onToggle={() =>
                task.status === "done"
                  ? state.reopen(task)
                  : state.complete(task)
              }
              onOpen={() => openSheet(task)}
            />
          ))}
        </ul>
      )}

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
    </>
  )
}
