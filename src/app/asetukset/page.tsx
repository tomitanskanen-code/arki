import { formatDistanceToNowStrict } from "date-fns"
import { fi } from "date-fns/locale"
import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { PageContainer, PageHeader, Section } from "@/components/layout/page"
import {
  authEnabled,
  calendarAdmin,
  calendarRepository,
  familyRepository,
  getSignedInEmail,
} from "@/data/server"
import { SOURCE_KIND_LABELS } from "@/domain/calendar"
import type { SyncStatus } from "@/domain/types"
import { signOutAction } from "@/features/auth/actions"
import { MemberDot } from "@/features/family/member-dot"
import { NoFamilyNotice } from "@/features/family/no-family-notice"
import { AddSourceForm } from "@/features/settings/add-source-form"
import { HomeLocationForm } from "@/features/settings/home-location-form"
import { ManualScheduleForm } from "@/features/settings/manual-schedule-form"
import { SourceActions } from "@/features/settings/source-actions"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Asetukset" }

function syncDescription(
  status: SyncStatus,
  lastSyncedAt: string | null,
  lastError: string | null,
) {
  const ago = lastSyncedAt
    ? formatDistanceToNowStrict(new Date(lastSyncedAt), {
        locale: fi,
        addSuffix: true,
      })
    : null
  switch (status) {
    case "error":
      return `${lastError ?? "Päivitys epäonnistui."}${ago ? ` Viimeisin onnistunut ${ago}.` : ""}`
    case "pending":
      return "Odottaa ensimmäistä hakua"
    default:
      return ago ? `Päivitetty ${ago}` : "Ajan tasalla"
  }
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
  // Kirjautuneen käyttäjän tiedot ovat pyyntökohtaisia (Cache Components).
  await connection()
  const [family, members, sources, email, schedules] = await Promise.all([
    familyRepository.getFamily(),
    familyRepository.getMembers(),
    calendarRepository.getSources(),
    getSignedInEmail(),
    calendarAdmin.getManualSchedules(),
  ])
  if (!family) return <NoFamilyNotice email={email} />
  const memberName = new Map(members.map((m) => [m.id, m.displayName]))
  const feeds = sources.filter((s) => s.kind !== "manual")
  const children = members.filter((m) => m.role === "child")

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
        {feeds.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ei vielä kalentereita. Lisää Wilma-, myClub- tai Google-kalenterin
            tilauslinkki.
          </p>
        )}
        <ul className="divide-y divide-border/70">
          {feeds.map((s) => (
            <li key={s.id} className="flex items-start gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {SOURCE_KIND_LABELS[s.kind]}
                  {s.memberId
                    ? ` · ${memberName.get(s.memberId)}`
                    : " · Koko perhe"}
                  {s.urlHost && ` · ${s.urlHost}`}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    s.syncStatus === "error"
                      ? "font-medium text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {syncDescription(s.syncStatus, s.lastSyncedAt, s.lastError)}
                </p>
              </div>
              {authEnabled && <SourceActions id={s.id} name={s.name} />}
            </li>
          ))}
        </ul>
        {authEnabled ? (
          <AddSourceForm members={members} />
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Esittelytila: esimerkkikalenterit. Kalentereita voi lisätä, kun
            Supabase on käytössä.
          </p>
        )}
      </Section>

      {authEnabled && children.length > 0 && (
        <Section title="Viikkorytmi">
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Esim. esikoulu, kun lapsella ei ole Wilma-lukujärjestystä. Näkyy
            kalenterissa ja Tänään-näkymässä koulupäivän tavoin.
          </p>
          <ManualScheduleForm members={children} entries={schedules} />
        </Section>
      )}

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
          Arki · versio 0.3 ·{" "}
          {authEnabled
            ? "perhe, kauppalista ja kalenterit tietokannassa, sää Open-Meteosta."
            : "esittelytila: esimerkkidata, ei kirjautumista."}{" "}
          Kouluruokalista on vielä esimerkkidataa.
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
