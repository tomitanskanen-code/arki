"use client"

import { useActionState, useState } from "react"

import type { FamilyMember, ManualScheduleEntry } from "@/domain/types"
import { cn } from "@/lib/utils"

import { Field, Select } from "./add-source-form"
import { type FormState, saveManualScheduleAction } from "./calendar-actions"
import { fieldClass, primaryButtonClass } from "./form-styles"

const WEEKDAYS = ["ma", "ti", "ke", "to", "pe", "la", "su"]

/**
 * Käsin syötettävä viikkorytmi (esim. esikoulu), kun lapsella ei ole
 * Wilma-lukujärjestystä. Sama kellonaika valituille päiville.
 */
export function ManualScheduleForm({
  members,
  entries,
}: {
  members: FamilyMember[]
  entries: ManualScheduleEntry[]
}) {
  const [memberId, setMemberId] = useState(
    () => entries[0]?.memberId ?? members[members.length - 1]?.id ?? "",
  )
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveManualScheduleAction,
    { status: "idle" },
  )

  const own = entries.filter((e) => e.memberId === memberId)
  const first = own[0]

  return (
    // key: lomake alustetaan uudelleen, kun jäsen vaihtuu
    <form key={memberId} action={formAction} className="space-y-3">
      <Field label="Kenelle" htmlFor="schedule-member">
        <Select
          id="schedule-member"
          name="memberId"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nimi" htmlFor="schedule-title">
        <input
          id="schedule-title"
          name="title"
          maxLength={60}
          defaultValue={first?.title ?? "Esikoulu"}
          className={fieldClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Päivät</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((label, i) => (
            <label key={label} className="cursor-pointer">
              <input
                type="checkbox"
                name="weekday"
                value={i + 1}
                defaultChecked={
                  own.length > 0 ? own.some((e) => e.weekday === i + 1) : i < 5
                }
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border text-sm capitalize transition-colors",
                  "peer-checked:border-foreground/80 peer-checked:bg-foreground/[0.06] peer-checked:font-medium",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-ring",
                )}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Alkaa" htmlFor="schedule-start">
          <input
            id="schedule-start"
            name="startTime"
            type="time"
            defaultValue={first?.startTime ?? "08:00"}
            className={fieldClass}
          />
        </Field>
        <Field label="Päättyy" htmlFor="schedule-end">
          <input
            id="schedule-end"
            name="endTime"
            type="time"
            defaultValue={first?.endTime ?? "12:00"}
            className={fieldClass}
          />
        </Field>
      </div>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Tallennetaan…" : "Tallenna viikkorytmi"}
      </button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Poista rytmi tyhjentämällä kaikki päivät ja tallentamalla.
      </p>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
