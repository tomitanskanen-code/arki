import type { Metadata } from "next"

import { PageContainer, PageHeader } from "@/components/layout/page"
import { ShoppingList } from "@/features/shopping/shopping-list"

export const metadata: Metadata = { title: "Kauppalista" }

export default function ShoppingPage() {
  return (
    <PageContainer className="md:max-w-xl">
      <PageHeader title="Kauppalista" />
      <ShoppingList />
    </PageContainer>
  )
}
