"use client"

import { useEffect } from "react"

/** Rekisteröi service workerin vain tuotantoversiossa. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) =>
        console.error("Service workerin rekisteröinti epäonnistui", error),
      )
  }, [])
  return null
}
