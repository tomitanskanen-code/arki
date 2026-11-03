import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

/**
 * Edellinen/seuraava-nuolet ja paluu tähän päivään. Käytössä kalenterissa
 * ja etusivulla, jotta selaus näyttää ja toimii kaikkialla samoin.
 */
export function StepNav({
  prevHref,
  nextHref,
  todayHref,
  prevLabel,
  nextLabel,
}: {
  prevHref: string
  nextHref: string
  /** null, kun ollaan jo tässä päivässä/viikossa */
  todayHref: string | null
  prevLabel: string
  nextLabel: string
}) {
  return (
    <div className="flex items-center">
      {todayHref && (
        <Link
          href={todayHref}
          className="mr-1 flex min-h-11 items-center px-3 text-sm font-medium"
        >
          Tänään
        </Link>
      )}
      <Link
        href={prevHref}
        aria-label={prevLabel}
        className="flex size-11 items-center justify-center rounded-full hover:bg-accent"
      >
        <ChevronLeft aria-hidden className="size-5" />
      </Link>
      <Link
        href={nextHref}
        aria-label={nextLabel}
        className="flex size-11 items-center justify-center rounded-full hover:bg-accent"
      >
        <ChevronRight aria-hidden className="size-5" />
      </Link>
    </div>
  )
}
