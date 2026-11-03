"use client"

import { ChevronDown, Plus } from "lucide-react"
import { useActionState, useEffect, useRef, useState } from "react"

import type { FamilyMember } from "@/domain/types"

import { addSourceAction, type FormState } from "./calendar-actions"
import { fieldClass, primaryButtonClass } from "./form-styles"

const KIND_OPTIONS = [
  { value: "wilma", label: "Wilma (lukujärjestys)" },
  { value: "myclub", label: "myClub (harrastus)" },
  { value: "google", label: "Google-kalenteri" },
  { value: "ics", label: "Muu kalenterisyöte" },
]

export function AddSourceForm({ members }: { members: FamilyMember[] }) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    addSourceAction,
    { status: "idle" },
  )

  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset()
  }, [state])

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2 text-sm font-medium"
      >
        <Plus aria-hidden className="size-4" />
        Lisää kalenterisyöte
      </button>

      {open && (
        <form ref={formRef} action={formAction} className="mt-2 space-y-3">
          <Field label="Tyyppi" htmlFor="kind">
            <Select id="kind" name="kind" defaultValue="wilma">
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nimi" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              maxLength={60}
              placeholder="esim. Hugon lukujärjestys"
              className={fieldClass}
            />
          </Field>
          <Field label="Kenelle" htmlFor="memberId">
            <Select id="memberId" name="memberId" defaultValue="">
              <option value="">Koko perhe</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kalenterin osoite" htmlFor="url">
            <input
              id="url"
              name="url"
              type="url"
              required
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
              placeholder="https://…"
              className={fieldClass}
            />
            <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
              Osoite tallennetaan salattuna eikä sitä näytetä enää
              sovelluksessa.
            </span>
          </Field>
          <button
            type="submit"
            disabled={pending}
            className={primaryButtonClass}
          >
            {pending ? "Haetaan kalenteria…" : "Lisää ja hae"}
          </button>
        </form>
      )}

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "mt-3 text-sm text-destructive"
              : "mt-3 text-sm text-muted-foreground"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

export function Select(props: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`${fieldClass} appearance-none pr-10`} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
