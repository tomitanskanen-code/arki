"use client"

import type { Task } from "@/domain/types"

/**
 * "Merkitty valmiiksi · Kumoa" – näkyy hetken alanavigaation yläpuolella.
 * Kesto hallitaan useTasks-hookissa (lastCompleted).
 */
export function UndoToast({
  task,
  onUndo,
}: {
  task: Task | null
  onUndo: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.75rem)] z-50 flex justify-center px-4 md:bottom-6"
    >
      {task && (
        <div className="pointer-events-auto flex max-w-md min-w-0 animate-in items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-4 text-sm text-primary-foreground shadow-lg duration-200 fade-in slide-in-from-bottom-2">
          <span className="min-w-0 truncate">
            Valmis: <span className="font-medium">{task.title}</span>
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="min-h-9 shrink-0 rounded-full px-3 font-semibold underline-offset-2 hover:underline"
          >
            Kumoa
          </button>
        </div>
      )}
    </div>
  )
}
