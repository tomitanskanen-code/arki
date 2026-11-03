import type { SchoolMenuProvider } from "@/data/repositories"
import { localWeekdayIndex } from "@/lib/dates"

/** Esimerkkiruokalista: sama viikkokierto joka viikko. */
const WEEK: [main: string, vegetarian: string][] = [
  ["Broileri-kookoskastike ja riisi", "Kikherne-kookoskastike"],
  ["Lohikeitto ja ruisleipä", "Kasvissosekeitto"],
  ["Jauhelihaspasta", "Linssibolognese"],
  ["Hernekeitto ja pannukakku", "Kasvishernekeitto ja pannukakku"],
  ["Kalaleike ja perunamuusi", "Kasvispihvit ja perunamuusi"],
]

export const mockSchoolMenuProvider: SchoolMenuProvider = {
  async getMenu(date) {
    const weekday = localWeekdayIndex(date)
    if (weekday > 4) return null
    const [mainDish, vegetarianDish] = WEEK[weekday]
    return { date, schoolName: "Esimerkkikoulu", mainDish, vegetarianDish }
  },
}
