import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Sivun sisältöalue: kapea palsta mobiilissa, leveämpi iPadilla. */
export function PageContainer({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-xl px-5 pt-safe md:max-w-4xl md:px-10",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  eyebrow,
  action,
}: {
  title: string
  eyebrow?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="flex items-end justify-between gap-4 pt-8 pb-6 md:pt-12">
      <div>
        {eyebrow && (
          <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="text-[2rem] leading-tight font-light tracking-tight">
          {title}
        </h1>
      </div>
      {action}
    </header>
  )
}

export type SectionTone = "slate" | "sage" | "ochre" | "clay" | "neutral"

// Täydet luokkanimet, jotta Tailwind tunnistaa ne.
const TONE_CLASSES: Record<SectionTone, { panel: string; icon: string }> = {
  slate: { panel: "bg-tint-slate", icon: "text-member-slate" },
  sage: { panel: "bg-tint-sage", icon: "text-member-sage" },
  ochre: { panel: "bg-tint-ochre", icon: "text-member-ochre" },
  clay: { panel: "bg-tint-clay", icon: "text-member-clay" },
  neutral: { panel: "border bg-surface", icon: "text-muted-foreground" },
}

/**
 * Osio: oletuksena hillitty otsikko ja ohut viiva. Sävyn (tone) kanssa
 * pyöristetty, vaaleasti sävytetty paneeli – etusivulla osiot erottuvat
 * toisistaan silmäiltäessä.
 */
export function Section({
  title,
  action,
  tone,
  icon: Icon,
  className,
  children,
}: {
  title: string
  action?: React.ReactNode
  tone?: SectionTone
  icon?: LucideIcon
  className?: string
  children: React.ReactNode
}) {
  const toneClasses = tone ? TONE_CLASSES[tone] : null
  return (
    <section
      className={cn(
        toneClasses
          ? cn("mb-3 rounded-2xl px-4 py-4", toneClasses.panel)
          : "border-t py-5",
        className,
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2
          className={cn(
            "flex items-center gap-2 text-xs font-medium tracking-[0.08em] uppercase",
            toneClasses ? "text-foreground/80" : "text-muted-foreground",
          )}
        >
          {Icon && (
            <Icon
              aria-hidden
              className={cn("size-4 shrink-0", toneClasses?.icon)}
            />
          )}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
