"use client"

import { Check, ChevronDown, Plus, X } from "lucide-react"
import { useRef, useState } from "react"

import { MAX_ITEM_NAME_LENGTH, splitShoppingList } from "@/domain/shopping"
import type { ShoppingListItem } from "@/domain/types"
import { cn } from "@/lib/utils"

import { useShoppingList } from "./use-shopping-list"

export function ShoppingList() {
  const { items, loading, error, add, setPurchased, remove } = useShoppingList()
  const { open, purchased } = splitShoppingList(items)
  const [name, setName] = useState("")
  const [showPurchased, setShowPurchased] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (add(name)) setName("")
    inputRef.current?.focus()
  }

  return (
    <div>
      <p
        className="-mt-4 mb-6 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {loading
          ? " "
          : open.length === 0
            ? "Kaikki ostettu"
            : `${open.length} ostettavaa`}
      </p>

      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="new-item" className="sr-only">
          Uusi tuote
        </label>
        <input
          id="new-item"
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_ITEM_NAME_LENGTH}
          placeholder="Lisää tuote"
          autoComplete="off"
          enterKeyHint="done"
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-surface px-4 text-base placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Lisää"
          disabled={!name.trim()}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Plus aria-hidden className="size-5" />
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-label="Ladataan">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {open.length === 0 ? (
            <p className="mt-8 text-center text-muted-foreground">
              Lista on tyhjä.
            </p>
          ) : (
            <ul className="mt-4">
              {open.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  onToggle={() => setPurchased(item.id, true)}
                  onRemove={() => remove(item.id)}
                />
              ))}
            </ul>
          )}

          {purchased.length > 0 && (
            <section className="mt-8 border-t pt-2">
              <button
                type="button"
                aria-expanded={showPurchased}
                onClick={() => setShowPurchased((v) => !v)}
                className="flex min-h-11 w-full items-center justify-between text-sm text-muted-foreground"
              >
                Ostetut ({purchased.length})
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-4 transition-transform",
                    showPurchased && "rotate-180",
                  )}
                />
              </button>
              {showPurchased && (
                <ul>
                  {purchased.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      onToggle={() => setPurchased(item.id, false)}
                      onRemove={() => remove(item.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Item({
  item,
  onToggle,
  onRemove,
}: {
  item: ShoppingListItem
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <li className="flex items-center border-b border-border/70 last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.isPurchased}
        onClick={onToggle}
        className="flex min-h-13 flex-1 items-center gap-4 py-2 text-left"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            item.isPurchased
              ? "border-primary bg-primary text-primary-foreground"
              : "border-foreground/30",
          )}
        >
          {item.isPurchased && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span
          className={cn(
            "text-[17px]",
            item.isPurchased && "text-muted-foreground line-through",
          )}
        >
          {item.name}
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Poista ${item.name}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X aria-hidden className="size-4" />
      </button>
    </li>
  )
}
