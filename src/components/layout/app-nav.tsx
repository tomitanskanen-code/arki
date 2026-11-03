"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { hidesNav, isActive, NAV_ITEMS } from "./nav-items"

/** Mobiilin alanavigaatio. Huomioi iPhonen kotipalkin (safe area). */
export function BottomNav() {
  const pathname = usePathname()
  if (hidesNav(pathname)) return null

  return (
    <nav
      aria-label="Päävalikko"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-safe backdrop-blur-sm md:hidden"
    >
      <ul className="mx-auto grid h-(--nav-height) max-w-xl grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className="size-[22px]"
                  strokeWidth={active ? 2 : 1.6}
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** iPadin ja tietokoneen sivupalkki. */
export function SideNav() {
  const pathname = usePathname()
  if (hidesNav(pathname)) return null

  return (
    <nav
      aria-label="Päävalikko"
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r px-4 pt-safe md:flex"
    >
      <p className="px-3 pt-8 pb-8 text-lg font-semibold tracking-tight">
        Arki
      </p>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors",
                  active
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className="size-5"
                  strokeWidth={active ? 2 : 1.6}
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
