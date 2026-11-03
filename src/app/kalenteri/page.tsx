import type { Metadata } from "next"

import { PageContainer, PageHeader } from "@/components/layout/page"

export const metadata: Metadata = { title: "Kalenteri" }

export default function CalendarPage() {
  return (
    <PageContainer>
      <PageHeader title="Kalenteri" />
    </PageContainer>
  )
}
