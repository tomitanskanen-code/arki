import { BottomNav, SideNav } from "./app-nav"

/**
 * Sovelluksen runko: mobiilissa alanavigaatio, iPadilla ja tietokoneella
 * sivupalkki. Sisällön alareunaan jätetään tila navigaatiolle ja safe arealle.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      <SideNav />
      <main className="min-w-0 flex-1 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)] md:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
