"use client"

import { useMemo, useState } from "react"

import type { AgendaItem } from "@/domain/calendar"
import type { CalendarSource, FamilyMember } from "@/domain/types"
import { MemberDots } from "@/features/family/member-dot"
import type { LocalDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

import { createLookup, describeItem } from "./describe"
import { EventDetailsSheet } from "./event-details-sheet"

interface AgendaProps {
  items: AgendaItem[]
  date: LocalDate
  members: FamilyMember[]
  sources: CalendarSource[]
  emptyText?: string
  dense?: boolean
  /** false, kun agenda näytetään jo valmiiksi yhden lapsen otsikon alla. */
  showSchoolOwner?: boolean
}

/** Päivän tapahtumat aikajärjestyksessä. Napautus avaa lisätiedot. */
export function Agenda({
  items,
  date,
  members,
  sources,
  emptyText = "Ei tapahtumia.",
  dense = false,
  showSchoolOwner = true,
}: AgendaProps) {
  const lookup = useMemo(
    () => createLookup(members, sources),
    [members, sources],
  )
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const [open, setOpen] = useState(false)

  if (items.length === 0) {
    return (
      <p className={cn("text-muted-foreground", dense ? "text-sm" : "py-1")}>
        {emptyText}
      </p>
    )
  }

  return (
    <>
      <ul className="-mx-2">
        {items.map((item) => {
          const view = describeItem(item, lookup, { showSchoolOwner })
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => {
                  setSelected(item)
                  setOpen(true)
                }}
                className={cn(
                  "flex min-h-11 w-full items-start gap-4 rounded-lg px-2 text-left transition-colors hover:bg-accent/60 active:bg-accent",
                  dense ? "py-1.5" : "py-2.5",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 pt-px tabular-nums",
                    dense ? "w-11 text-sm" : "w-12 text-[15px]",
                  )}
                >
                  {view.start ?? (
                    <span className="text-[13px] text-muted-foreground">
                      koko päivä
                    </span>
                  )}
                  {view.end && !dense && (
                    <span className="block text-[13px] text-muted-foreground">
                      {view.end}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex items-center gap-2 leading-snug font-medium",
                      dense ? "text-sm" : "text-[15px]",
                    )}
                  >
                    <MemberDots members={view.members} />
                    <span className="truncate">{view.title}</span>
                  </span>
                  {view.subtitle && !dense && (
                    <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                      {view.subtitle}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <EventDetailsSheet
        item={selected}
        date={date}
        lookup={lookup}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
