import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/page"
import { LoginForm } from "@/features/auth/login-form"

export const metadata: Metadata = { title: "Kirjaudu" }

export default function LoginPage() {
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
      <LoginForm />
    </PageContainer>
  )
}
