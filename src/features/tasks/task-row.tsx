"use client"

import { Check, Flag } from "lucide-react"
import { useState } from "react"

import { dueLabel, TASK_CATEGORY_LABELS } from "@/domain/tasks"
import type { FamilyMember, Task } from "@/domain/types"
import { MemberDot } from "@/features/family/member-dot"
import type { LocalDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

import { CATEGORY_ICONS } from "./task-meta"

/** Kuinka kauan merkitty rivi näkyy häivytettynä ennen siirtoa. */
const COMPLETE_DELAY_MS = 220

/**
 * Tehtävärivi: valintaympyrä (yksi kosketus = valmis / palauta), nimi ja
 * vain ne lisätiedot, jotka on määritelty. Napautus avaa muokkauksen.
 */
export function TaskRow({
  task,
  assignee,
  today,
  onToggle,
  onOpen,
}: {
  task: Task
  assignee: FamilyMember | undefined
  today: LocalDate
  onToggle: () => void
  onOpen: () => void
}) {
  const [completing, setCompleting] = useState(false)
  const done = task.status === "done"
  const checked = done || completing
  const due = task.dueDate ? dueLabel(task.dueDate, today) : null
  const CategoryIcon = task.category ? CATEGORY_ICONS[task.category] : null
  const hasMeta = Boolean(assignee || due || task.category)

  function toggle() {
    if (done) {
      onToggle()
      return
    }
    // Lyhyt häivytys: käyttäjä näkee merkinnän ennen kuin rivi poistuu.
    setCompleting(true)
    setTimeout(onToggle, COMPLETE_DELAY_MS)
  }

  return (
    <li
      className={cn(
        "flex items-start gap-1 border-b border-border/70 transition-opacity duration-200 last:border-b-0",
        completing && "opacity-40",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={
          done
            ? `Palauta avoimeksi: ${task.title}`
            : `Merkitse valmiiksi: ${task.title}`
        }
        onClick={toggle}
        className="-ml-2.5 flex size-11 shrink-0 items-center justify-center"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-150",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : task.priority === "high"
                ? "border-member-ochre"
                : "border-foreground/30",
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-h-11 min-w-0 flex-1 py-2.5 text-left"
      >
        <span
          className={cn(
            "flex items-start gap-1.5 text-[16px] leading-snug",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.priority === "high" && !done && (
            <Flag
              aria-label="Tärkeä"
              className="mt-[3px] size-3.5 shrink-0 fill-member-ochre text-member-ochre"
            />
          )}
          <span className="min-w-0 break-words">{task.title}</span>
        </span>
        {hasMeta && (
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            {assignee && (
              <span className="flex items-center gap-1.5">
                <MemberDot member={assignee} />
                {assignee.displayName}
              </span>
            )}
            {due && !done && (
              <span
                className={cn(
                  "tabular-nums",
                  due.state === "overdue" && "font-medium text-destructive",
                  due.state === "today" && "font-medium text-foreground",
                )}
              >
                {due.text}
              </span>
            )}
            {task.category && CategoryIcon && (
              <span className="flex items-center gap-1">
                <CategoryIcon aria-hidden className="size-3.5" />
                {TASK_CATEGORY_LABELS[task.category]}
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  )
}
