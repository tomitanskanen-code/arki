import {
  CalendarDays,
  House,
  ListTodo,
  type LucideIcon,
  Settings2,
  ShoppingBasket,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

/** Mobiilin alapalkki: neljä pääosiota. Asetukset etusivun rataskuvakkeesta. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Koti", icon: House },
  { href: "/kalenteri", label: "Kalenteri", icon: CalendarDays },
  { href: "/tehtavat", label: "Tehtävät", icon: ListTodo },
  { href: "/kauppalista", label: "Kauppalista", icon: ShoppingBasket },
]

/** iPadin ja tietokoneen sivupalkki: tilaa riittää myös Asetuksille. */
export const SIDE_NAV_ITEMS: NavItem[] = [
  ...NAV_ITEMS,
  { href: "/asetukset", label: "Asetukset", icon: Settings2 },
]

/** Sivut, joilla navigaatiota ei näytetä. */
export function hidesNav(pathname: string) {
  return pathname === "/kirjaudu"
}

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
