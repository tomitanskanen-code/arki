"use client"

import { useRef } from "react"

import type { FamilyMember } from "@/domain/types"

import { updateSourceMemberAction } from "./calendar-actions"

/**
 * Kalenterin "Kenelle"-valinta listassa. Tallentuu heti valittaessa;
 * tapahtumat saavat henkilönsä kalenterista, joten muutos näkyy heti.
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
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form ref={formRef} action={updateSourceMemberAction} className="inline">
      <input type="hidden" name="id" value={sourceId} />
      <label className="sr-only" htmlFor={`member-${sourceId}`}>
        Kenelle kalenteri {sourceName} kuuluu
      </label>
      <select
        id={`member-${sourceId}`}
        name="memberId"
        defaultValue={memberId ?? "family"}
        onChange={() => formRef.current?.requestSubmit()}
        className="-my-1 min-h-9 cursor-pointer rounded-md bg-transparent py-1 pr-1 text-sm text-foreground underline decoration-border decoration-dotted underline-offset-4 hover:decoration-foreground"
      >
        <option value="family">Koko perhe</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
    </form>
  )
}
