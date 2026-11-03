import type { Metadata } from "next"
import { Suspense } from "react"

import { PageContainer } from "@/components/layout/page"
import { LoginForm } from "@/features/auth/login-form"

export const metadata: Metadata = { title: "Kirjaudu" }

const ERRORS: Record<string, string> = {
  linkki:
    "Kirjautumislinkki oli vanhentunut tai virheellinen. Pyydä uusi koodi.",
}

export default function LoginPage({ searchParams }: PageProps<"/kirjaudu">) {
  return (
    <PageContainer className="max-w-sm md:max-w-sm">
      <div className="pt-20 pb-10">
        <h1 className="text-[2.5rem] leading-none font-light tracking-tight">
          Arki
        </h1>
        <p className="mt-3 text-muted-foreground">
          Perheen yhteinen arki. Kirjaudu sähköpostiin lähetettävällä koodilla.
        </p>
      </div>
      <Suspense fallback={<LoginForm />}>
        <LoginWithError searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  )
}

async function LoginWithError({
  searchParams,
}: Pick<PageProps<"/kirjaudu">, "searchParams">) {
  const { virhe } = await searchParams
  const error = typeof virhe === "string" ? ERRORS[virhe] : undefined
  return <LoginForm initialError={error} />
}
