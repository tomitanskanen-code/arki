import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { PageContainer } from "@/components/layout/page"
import { familyRepository, getSignedInUserId } from "@/data/server"
import { TasksView } from "@/features/tasks/tasks-view"
import { todayLocal } from "@/lib/dates"

export const metadata: Metadata = { title: "Tehtävät" }

export default function TasksPage() {
  return (
    <PageContainer className="md:max-w-2xl">
      <Suspense fallback={<TasksSkeleton />}>
        <TasksContent />
      </Suspense>
    </PageContainer>
  )
}

async function TasksContent() {
  // Kirjautunut käyttäjä ja tämä päivä ovat pyyntökohtaisia (Cache Components).
  await connection()
  const [members, currentUserId] = await Promise.all([
    familyRepository.getMembers(),
    getSignedInUserId(),
  ])
  return (
    <TasksView
      members={members}
      currentUserId={currentUserId}
      today={todayLocal()}
    />
  )
}

function TasksSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ladataan" className="animate-pulse">
      <div className="pt-8 pb-6 md:pt-12">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-2 h-9 w-40 rounded bg-muted" />
      </div>
      <div className="h-9 w-full rounded-full bg-muted" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
