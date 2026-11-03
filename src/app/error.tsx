"use client"

import { useEffect } from "react"

import { PageContainer } from "@/components/layout/page"

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageContainer>
      <div className="pt-24 text-center">
        <h1 className="text-2xl font-light tracking-tight">
          Jokin meni pieleen
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tietoja ei voitu näyttää. Yritä hetken kuluttua uudelleen.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Yritä uudelleen
        </button>
      </div>
    </PageContainer>
  )
}
