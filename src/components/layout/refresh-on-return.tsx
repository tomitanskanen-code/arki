"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { todayLocal } from "@/lib/dates"

import { hidesNav } from "./nav-items"

/** Kuinka kauan sovellus saa olla taustalla ennen tietojen päivitystä. */
const STALE_AFTER_MS = 5 * 60_000

/**
 * iPhonen kotinäyttösovellus jää taustalle muistiin, ja palatessa näkyisi
 * vanha tila (esim. eilinen Tänään-näkymä). Kun sovellus palaa taustalta
 * yli viiden minuutin jälkeen tai päivä on vaihtunut, sivu haetaan uudelleen
 * palvelimelta. Kalenterisyötteet päivittyvät samalla tarvittaessa.
 */
export function RefreshOnReturn() {
  const router = useRouter()
  const pathname = usePathname()
  const hiddenAt = useRef<number | null>(null)
  const dayAtHide = useRef<string | null>(null)

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now()
        dayAtHide.current = todayLocal()
        return
      }
      if (hiddenAt.current === null || hidesNav(pathname)) return
      const away = Date.now() - hiddenAt.current
      const dayChanged = dayAtHide.current !== todayLocal()
      hiddenAt.current = null
      if (away > STALE_AFTER_MS || dayChanged) router.refresh()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [router, pathname])

  return null
}
