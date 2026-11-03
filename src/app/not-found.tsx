import Link from "next/link"

import { PageContainer } from "@/components/layout/page"

export default function NotFound() {
  return (
    <PageContainer>
      <div className="pt-24 text-center">
        <h1 className="text-2xl font-light tracking-tight">
          Sivua ei löytynyt
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hakemaasi sivua ei ole olemassa.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Etusivulle
        </Link>
      </div>
    </PageContainer>
  )
}
