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
        "pt-safe mx-auto w-full max-w-xl px-5 md:max-w-4xl md:px-10",
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

/** Hillitty osio-otsikko korttien sijaan. */
export function Section({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("border-t py-5", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
