"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { splitShoppingList } from "@/domain/shopping"
import { useShoppingList } from "@/features/shopping/use-shopping-list"

const PREVIEW_COUNT = 5

/** Etusivun tiivis näkymä kauppalistan ostamattomista tuotteista. */
export function ShoppingPreview() {
  const { items, loading } = useShoppingList()
  const { open } = splitShoppingList(items)

  if (loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-muted" />
  }

  return (
    <div>
      {open.length === 0 ? (
        <p className="text-muted-foreground">Kaikki ostettu.</p>
      ) : (
        <ul className="space-y-1.5 text-[15px]">
          {open.slice(0, PREVIEW_COUNT).map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-foreground/30"
              />
              {item.name}
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/kauppalista"
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
      >
        {open.length > PREVIEW_COUNT
          ? `Kaikki ${open.length} tuotetta`
          : "Avaa lista"}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  )
}
