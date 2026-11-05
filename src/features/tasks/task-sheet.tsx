"use client"

import {
  CalendarDays,
  Check,
  Flag,
  RotateCcw,
  Shapes,
  Trash2,
  User,
} from "lucide-react"
import { useRef, useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  dueLabel,
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASK_TITLE_LENGTH,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
} from "@/domain/tasks"
import type {
  FamilyMember,
  Task,
  TaskCategory,
  TaskInput,
} from "@/domain/types"
import { MemberDot } from "@/features/family/member-dot"
import { addLocalDays, type LocalDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

import { assignableMembers, CATEGORY_ICONS } from "./task-meta"

type Picker = "assignee" | "due" | "category" | null

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = uusi tehtävä */
  task: Task | null
  members: FamilyMember[]
  today: LocalDate
  onSave: (input: TaskInput) => boolean
  onToggleStatus: (task: Task) => void
  onDelete: (task: Task) => void
}

/**
 * Tehtävän lisäys ja muokkaus alhaalta avautuvassa paneelissa.
 * Nimi riittää: Enter tallentaa. Muut tiedot ovat kevyitä valintanappeja,
 * jotka avaavat valinnat suoraan rivin alle.
 */
export function TaskSheet(props: Props) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && (
        // key: lomake alustetaan aina avattaessa (uusi / muokattava tehtävä)
        <TaskSheetContent key={props.task?.id ?? "uusi"} {...props} />
      )}
    </Sheet>
  )
}

function TaskSheetContent({
  onOpenChange,
  task,
  members,
  today,
  onSave,
  onToggleStatus,
  onDelete,
}: Props) {
  const titleRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(task?.title ?? "")
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo ?? null)
  const [dueDate, setDueDate] = useState(task?.dueDate ?? null)
  const [priority, setPriority] = useState(task?.priority ?? "normal")
  const [category, setCategory] = useState<TaskCategory | null>(
    task?.category ?? null,
  )
  const [description, setDescription] = useState(task?.description ?? "")
  const [showDescription, setShowDescription] = useState(
    Boolean(task?.description),
  )
  const [picker, setPicker] = useState<Picker>(null)

  const people = assignableMembers(members)
  const assignee = people.find((m) => m.userId === assignedTo)
  const CategoryIcon = category ? CATEGORY_ICONS[category] : Shapes
  const canSave = title.trim().length > 0

  function save(e: React.FormEvent) {
    e.preventDefault()
    const saved = onSave({
      title,
      assignedTo,
      dueDate,
      priority,
      category,
      description: description.trim() || null,
    })
    if (saved) onOpenChange(false)
  }

  function togglePicker(next: Picker) {
    setPicker((current) => (current === next ? null : next))
  }

  return (
    <SheetContent
      side="bottom"
      initialFocus={task ? undefined : titleRef}
      className="mx-auto max-h-[90dvh] w-full max-w-xl gap-0 overflow-y-auto rounded-t-2xl border-x bg-surface pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      <form
        onSubmit={save}
        // iOS: napautus sulkisi ensin näppäimistön, jolloin paneeli liukuu
        // alas ja napautus osuu ohi painikkeesta. Estetään painikkeiden
        // painalluksen kohdistusmuutos, jotta näppäimistö pysyy auki ja
        // klikkaus osuu. Tekstikentät toimivat normaalisti.
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) e.preventDefault()
        }}
        className="px-5 pt-5"
      >
        <SheetTitle className="mb-3 text-sm font-medium text-muted-foreground">
          {task ? "Muokkaa tehtävää" : "Uusi tehtävä"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Vain nimi on pakollinen. Muut tiedot ovat vapaaehtoisia.
        </SheetDescription>

        <label htmlFor="task-title" className="sr-only">
          Tehtävä
        </label>
        <input
          id="task-title"
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TASK_TITLE_LENGTH}
          placeholder="Mitä pitää tehdä?"
          autoComplete="off"
          enterKeyHint="done"
          className="w-full bg-transparent py-1 pr-8 text-xl font-medium placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-none"
        />

        {/* Valinnaiset tiedot kevyinä nappeina */}
        <div className="-mx-1 mt-4 flex flex-wrap gap-2">
          <OptionPill
            active={picker === "assignee"}
            selected={Boolean(assignee)}
            onClick={() => togglePicker("assignee")}
            icon={
              assignee ? (
                <MemberDot member={assignee} />
              ) : (
                <User aria-hidden className="size-4" />
              )
            }
          >
            {assignee?.displayName ?? "Kenelle"}
          </OptionPill>
          <OptionPill
            active={picker === "due"}
            selected={Boolean(dueDate)}
            onClick={() => togglePicker("due")}
            icon={<CalendarDays aria-hidden className="size-4" />}
          >
            {dueDate ? dueLabel(dueDate, today).text : "Määräpäivä"}
          </OptionPill>
          <OptionPill
            selected={priority === "high"}
            pressed={priority === "high"}
            onClick={() =>
              setPriority((p) => (p === "high" ? "normal" : "high"))
            }
            icon={
              <Flag
                aria-hidden
                className={cn(
                  "size-4",
                  priority === "high" && "fill-member-ochre text-member-ochre",
                )}
              />
            }
          >
            Tärkeä
          </OptionPill>
          <OptionPill
            active={picker === "category"}
            selected={Boolean(category)}
            onClick={() => togglePicker("category")}
            icon={<CategoryIcon aria-hidden className="size-4" />}
          >
            {category ? TASK_CATEGORY_LABELS[category] : "Kategoria"}
          </OptionPill>
        </div>

        {picker === "assignee" && (
          <ChoiceRow label="Kenelle">
            <Choice
              selected={assignedTo === null}
              onClick={() => setAssignedTo(null)}
            >
              Koko perhe
            </Choice>
            {people.map((m) => (
              <Choice
                key={m.userId}
                selected={assignedTo === m.userId}
                onClick={() => setAssignedTo(m.userId)}
              >
                <MemberDot member={m} />
                {m.displayName}
              </Choice>
            ))}
          </ChoiceRow>
        )}

        {picker === "due" && (
          <ChoiceRow label="Määräpäivä">
            <Choice
              selected={dueDate === null}
              onClick={() => setDueDate(null)}
            >
              Ei määräpäivää
            </Choice>
            <Choice
              selected={dueDate === today}
              onClick={() => setDueDate(today)}
            >
              Tänään
            </Choice>
            <Choice
              selected={dueDate === addLocalDays(today, 1)}
              onClick={() => setDueDate(addLocalDays(today, 1))}
            >
              Huomenna
            </Choice>
            <label className="flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-sm">
              <span className="sr-only">Valitse päivä</span>
              <input
                type="date"
                value={dueDate ?? ""}
                onChange={(e) => setDueDate(e.target.value || null)}
                className="bg-transparent text-sm"
              />
            </label>
          </ChoiceRow>
        )}

        {picker === "category" && (
          <ChoiceRow label="Kategoria">
            <Choice
              selected={category === null}
              onClick={() => setCategory(null)}
            >
              Ei kategoriaa
            </Choice>
            {TASK_CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c]
              return (
                <Choice
                  key={c}
                  selected={category === c}
                  onClick={() => setCategory(c)}
                >
                  <Icon aria-hidden className="size-4" />
                  {TASK_CATEGORY_LABELS[c]}
                </Choice>
              )
            })}
          </ChoiceRow>
        )}

        {showDescription ? (
          <div className="mt-4">
            <label
              htmlFor="task-description"
              className="mb-1.5 block text-sm font-medium"
            >
              Lisätiedot
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_TASK_DESCRIPTION_LENGTH}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-base"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="mt-2 min-h-11 text-sm text-muted-foreground hover:text-foreground"
          >
            + Lisätiedot
          </button>
        )}

        <button
          type="submit"
          disabled={!canSave}
          className="mt-4 h-12 w-full rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-opacity disabled:opacity-40"
        >
          {task ? "Tallenna" : "Lisää tehtävä"}
        </button>

        {task && (
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onToggleStatus(task)
                onOpenChange(false)
              }}
              className="flex min-h-11 items-center gap-2 px-1 text-sm font-medium"
            >
              {task.status === "done" ? (
                <>
                  <RotateCcw aria-hidden className="size-4" />
                  Palauta avoimeksi
                </>
              ) : (
                <>
                  <Check aria-hidden className="size-4" />
                  Merkitse valmiiksi
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Poistetaanko tehtävä "${task.title}"?`)) {
                  onDelete(task)
                  onOpenChange(false)
                }
              }}
              className="flex min-h-11 items-center gap-2 px-1 text-sm text-destructive"
            >
              <Trash2 aria-hidden className="size-4" />
              Poista
            </button>
          </div>
        )}
      </form>
    </SheetContent>
  )
}

function OptionPill({
  active = false,
  selected,
  pressed,
  onClick,
  icon,
  children,
}: {
  active?: boolean
  selected: boolean
  pressed?: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={pressed === undefined ? active : undefined}
      aria-pressed={pressed}
      className={cn(
        "flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
        selected || active
          ? "border-foreground/70 font-medium text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
        active && "bg-accent",
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function ChoiceRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-1 mt-3 flex flex-wrap gap-2 rounded-2xl bg-background p-2"
    >
      {children}
    </div>
  )
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm transition-colors",
        selected
          ? "bg-primary font-medium text-primary-foreground"
          : "text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  )
}
