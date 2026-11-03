import type { Metadata } from "next"

import { PageContainer, PageHeader } from "@/components/layout/page"

export const metadata: Metadata = { title: "Asetukset" }

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Asetukset" />
    </PageContainer>
  )
}
