"use client"

import { ChevronDown } from "lucide-react"
import { useActionState, useState } from "react"

import { HOME_PLACE_PRESETS } from "@/domain/places"

import { saveHomeLocation, type SaveHomeState } from "./actions"

export function HomeLocationForm({ current }: { current: string }) {
  const [value, setValue] = useState(current)
  const [state, formAction, pending] = useActionState<SaveHomeState, FormData>(
    saveHomeLocation,
    { status: "idle" },
  )
  const changed = value !== current

  return (
    <form action={formAction} className="flex items-center gap-3">
      <label htmlFor="paikkakunta" className="sr-only">
        Kotipaikkakunta
      </label>
      <div className="relative flex-1">
        <select
          id="paikkakunta"
          name="paikkakunta"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-input bg-surface pr-10 pl-4 text-base"
        >
          {HOME_PLACE_PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      <button
        type="submit"
        disabled={!changed || pending}
        className="h-12 shrink-0 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {pending ? "Tallennetaan…" : "Tallenna"}
      </button>
      <p className="sr-only" aria-live="polite">
        {state.message}
      </p>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  )
}
