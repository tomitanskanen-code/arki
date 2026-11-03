import {
  CalendarDays,
  House,
  type LucideIcon,
  Settings2,
  ShoppingBasket,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Koti", icon: House },
  { href: "/kalenteri", label: "Kalenteri", icon: CalendarDays },
  { href: "/kauppalista", label: "Kauppalista", icon: ShoppingBasket },
  { href: "/asetukset", label: "Asetukset", icon: Settings2 },
]

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
