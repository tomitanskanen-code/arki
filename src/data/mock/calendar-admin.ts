import type { CalendarAdminRepository } from "@/data/repositories"

const notAvailable = () => {
  throw new Error("Kalenterien hallinta ei ole käytettävissä esittelytilassa.")
}

/** Esittelytilassa kalentereita ei voi lisätä (ei tietokantaa). */
export const mockCalendarAdmin: CalendarAdminRepository = {
  addSource: async () => ({
    error: "Kalenterien lisääminen vaatii Supabase-yhteyden.",
  }),
  removeSource: async () => notAvailable(),
  refreshSource: async () => notAvailable(),
  getManualSchedules: async () => [],
  setManualSchedule: async () => notAvailable(),
}
