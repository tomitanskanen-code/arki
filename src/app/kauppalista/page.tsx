import type { Metadata } from "next"

import { PageContainer, PageHeader } from "@/components/layout/page"

export const metadata: Metadata = { title: "Kauppalista" }

export default function ShoppingPage() {
  return (
    <PageContainer>
      <PageHeader title="Kauppalista" />
    </PageContainer>
  )
}
