"use client"

import { useState, useTransition } from "react"

import type { FamilyMember } from "@/domain/types"

import { updateSourceMemberAction } from "./calendar-actions"

/**
 * Kalenterin "Kenelle"-valinta listassa. Tallentuu heti valittaessa;
 * tapahtumat saavat henkilönsä kalenterista, joten muutos näkyy heti.
 * Valinta on ohjattu (controlled): näytetty arvo pysyy valittuna
 * tallennuksen ajan, ja epäonnistuessa palautetaan edellinen arvo virheen kera.
 */
export function SourceMemberSelect({
  sourceId,
  sourceName,
  memberId,
  members,
}: {
  sourceId: string
  sourceName: string
  memberId: string | null
  members: FamilyMember[]
}) {
  const saved = memberId ?? "family"
  const [value, setValue] = useState(saved)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onChange(next: string) {
    const previous = value
    setValue(next)
    setError(null)
    startTransition(async () => {
      const result = await updateSourceMemberAction(sourceId, next)
      if (result.error) {
        setValue(previous)
        setError(result.error)
      }
    })
  }

  return (
    <>
      <label className="sr-only" htmlFor={`member-${sourceId}`}>
        Kenelle kalenteri {sourceName} kuuluu
      </label>
      <select
        id={`member-${sourceId}`}
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="-my-1 min-h-9 cursor-pointer rounded-md bg-transparent py-1 pr-1 text-sm text-foreground underline decoration-border decoration-dotted underline-offset-4 hover:decoration-foreground disabled:opacity-60"
      >
        <option value="family">Koko perhe</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
      {pending && <span className="ml-2 text-xs">Tallennetaan…</span>}
      {error && (
        <span role="alert" className="ml-2 text-xs text-destructive">
          {error}
        </span>
      )}
    </>
  )
}
