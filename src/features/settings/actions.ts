"use server"

import { familyRepository } from "@/data/server"
import { findPreset } from "@/domain/places"

export interface SaveHomeState {
  status: "idle" | "saved" | "error"
  message?: string
}

/**
 * Server Action: ajetaan aina palvelimella. Selaimelta tuleva arvo
 * tarkistetaan sallittujen paikkakuntien listaa vasten.
 */
export async function saveHomeLocation(
  _previous: SaveHomeState,
  formData: FormData,
): Promise<SaveHomeState> {
  const name = formData.get("paikkakunta")
  const preset = typeof name === "string" ? findPreset(name) : undefined
  if (!preset) {
    return { status: "error", message: "Valitse paikkakunta listalta." }
  }
  await familyRepository.updateHomeLocation(preset)
  return { status: "saved", message: `Kotipaikkakunta: ${preset.name}` }
}
