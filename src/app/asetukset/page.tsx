import { Plus } from "lucide-react"
import type { Metadata } from "next"
import { Suspense } from "react"

import { PageContainer, PageHeader, Section } from "@/components/layout/page"
import {
  authEnabled,
  calendarRepository,
  familyRepository,
  getSignedInEmail,
} from "@/data/server"
import { SOURCE_KIND_LABELS } from "@/domain/calendar"
import type { SyncStatus } from "@/domain/types"
import { signOutAction } from "@/features/auth/actions"
import { MemberDot } from "@/features/family/member-dot"
import { NoFamilyNotice } from "@/features/family/no-family-notice"
import { HomeLocationForm } from "@/features/settings/home-location-form"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Asetukset" }

const STATUS_LABELS: Record<SyncStatus, string> = {
  ok: "Ajan tasalla",
  stale: "Päivitys viivästynyt",
  error: "Virhe",
  pending: "Odottaa",
}

export default function SettingsPage() {
  return (
    <PageContainer className="md:max-w-2xl">
      <PageHeader title="Asetukset" />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </PageContainer>
  )
}

async function SettingsContent() {
  const [family, members, sources, email] = await Promise.all([
    familyRepository.getFamily(),
    familyRepository.getMembers(),
    calendarRepository.getSources(),
    getSignedInEmail(),
  ])
  if (!family) return <NoFamilyNotice email={email} />
  const memberName = new Map(members.map((m) => [m.id, m.displayName]))

  return (
    <>
      <Section title="Kotipaikkakunta">
        <p className="mb-3 text-sm text-muted-foreground">
          Sää haetaan tälle paikkakunnalle. Sijaintia ei seurata.
        </p>
        <HomeLocationForm current={family.home.name} />
      </Section>

      <Section title="Perhe">
        <ul>
          {members.map((m) => (
            <li key={m.id} className="flex min-h-12 items-center gap-3">
              <MemberDot member={m} className="size-2.5" />
              <span className="text-[15px]">{m.displayName}</span>
              <span className="ml-auto text-sm text-muted-foreground">
                {m.role === "parent" ? "Vanhempi" : "Lapsi"}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Kalenterit">
        <ul className="divide-y divide-border/70">
          {sources.map((s) => (
            <li key={s.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {SOURCE_KIND_LABELS[s.kind]}
                  {s.memberId
                    ? ` · ${memberName.get(s.memberId)}`
                    : " · Koko perhe"}
                </p>
              </div>
              <span
                className={cn(
                  "mt-0.5 shrink-0 text-sm",
                  s.syncStatus === "ok"
                    ? "text-muted-foreground"
                    : "font-medium text-destructive",
                )}
              >
                {STATUS_LABELS[s.syncStatus]}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Esimerkkikalenterit. Oikeat syötteet otetaan käyttöön vaiheessa 3.
        </p>
        <button
          type="button"
          disabled
          className="mt-3 flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
        >
          <Plus aria-hidden className="size-4" />
          Lisää kalenterisyöte
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            tulossa
          </span>
        </button>
      </Section>

      {authEnabled && (
        <Section title="Tili">
          <div className="flex items-center justify-between gap-4">
            <p className="min-w-0 truncate text-[15px]">{email}</p>
            <form action={signOutAction}>
              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl border border-input px-4 text-sm font-medium"
              >
                Kirjaudu ulos
              </button>
            </form>
          </div>
        </Section>
      )}

      <Section title="Tietoa">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Arki · versio 0.2 ·{" "}
          {authEnabled
            ? "perhe ja kauppalista tietokannassa, sää Open-Meteosta."
            : "esittelytila: esimerkkidata, ei kirjautumista."}{" "}
          Kalenterit ja ruokalista ovat vielä esimerkkidataa.
        </p>
      </Section>
    </>
  )
}

function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ladataan" className="animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 border-t py-5">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-12 w-full rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  )
}
