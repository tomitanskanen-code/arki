"use client"

import { RefreshCw, Trash2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { refreshSourceAction, removeSourceAction } from "./calendar-actions"

const iconButton =
  "flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"

function RefreshButton({ name }: { name: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Päivitä ${name}`}
      className={iconButton}
    >
      <RefreshCw
        aria-hidden
        className={`size-4 ${pending ? "animate-spin" : ""}`}
      />
    </button>
  )
}

/** Lähteen päivitys- ja poistopainikkeet. */
export function SourceActions({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex shrink-0">
      <form action={refreshSourceAction}>
        <input type="hidden" name="id" value={id} />
        <RefreshButton name={name} />
      </form>
      <form
        action={removeSourceAction}
        onSubmit={(e) => {
          if (!confirm(`Poistetaanko kalenteri "${name}" ja sen tapahtumat?`)) {
            e.preventDefault()
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={`Poista ${name}`}
          className={iconButton}
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  )
}
