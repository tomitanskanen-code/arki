"use server"

import { refresh } from "next/cache"

import { calendarAdmin, familyRepository } from "@/data/server"
import type { NewCalendarSource } from "@/data/repositories"
import { validateFeedUrl } from "@/integrations/ics/url"

/**
 * Kalenterien hallinnan Server Actionit. Kaikki selaimelta tulevat arvot
 * tarkistetaan täällä; tietokannan RLS on toinen suojakerros.
 */

export interface FormState {
  status: "idle" | "ok" | "error"
  message?: string
}

const KINDS: NewCalendarSource["kind"][] = ["wilma", "myclub", "google", "ics"]
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** Varmistaa, että jäsen kuuluu omaan perheeseen. */
async function validMemberId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value === "") return null
  const members = await familyRepository.getMembers()
  return members.some((m) => m.id === value) ? value : undefined
}

export async function addSourceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const kind = formData.get("kind") as NewCalendarSource["kind"]
  const name = String(formData.get("name") ?? "").trim()
  const url = String(formData.get("url") ?? "").trim()
  const memberId = await validMemberId(formData.get("memberId"))

  if (!KINDS.includes(kind)) {
    return { status: "error", message: "Valitse kalenterin tyyppi." }
  }
  if (name.length < 1 || name.length > 60) {
    return {
      status: "error",
      message: "Anna kalenterille nimi (enintään 60 merkkiä).",
    }
  }
  if (memberId === undefined) {
    return { status: "error", message: "Valitse perheenjäsen listalta." }
  }
  if (!url) return { status: "error", message: "Liitä kalenterin osoite." }
  const checked = validateFeedUrl(url)
  if (!checked.ok) return { status: "error", message: checked.error }

  try {
    const { error } = await calendarAdmin.addSource({
      kind,
      name,
      memberId,
      url,
    })
    refresh()
    if (error) {
      return {
        status: "error",
        message: `Kalenteri tallennettiin, mutta haku epäonnistui: ${error}`,
      }
    }
    return { status: "ok", message: "Kalenteri lisätty ja haettu." }
  } catch (error) {
    console.error("Kalenterin lisäys epäonnistui", error)
    return { status: "error", message: "Kalenterin lisäys epäonnistui." }
  }
}

export async function removeSourceAction(formData: FormData) {
  const id = formData.get("id")
  if (typeof id !== "string") return
  await calendarAdmin.removeSource(id)
  refresh()
}

export async function refreshSourceAction(formData: FormData) {
  const id = formData.get("id")
  if (typeof id !== "string") return
  await calendarAdmin.refreshSource(id)
  refresh()
}

export async function saveManualScheduleAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const memberId = await validMemberId(formData.get("memberId"))
  const title = String(formData.get("title") ?? "").trim() || "Esikoulu"
  const startTime = String(formData.get("startTime") ?? "")
  const endTime = String(formData.get("endTime") ?? "")
  const weekdays = formData
    .getAll("weekday")
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)

  if (!memberId) return { status: "error", message: "Valitse perheenjäsen." }
  if (title.length > 60) {
    return { status: "error", message: "Nimi on liian pitkä." }
  }
  if (weekdays.length > 0) {
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      return { status: "error", message: "Anna alkamis- ja päättymisaika." }
    }
    if (endTime <= startTime) {
      return {
        status: "error",
        message: "Päättymisajan pitää olla alkamisajan jälkeen.",
      }
    }
  }

  try {
    await calendarAdmin.setManualSchedule({
      memberId,
      title,
      days: [...new Set(weekdays)].map((weekday) => ({
        weekday,
        startTime,
        endTime,
      })),
    })
    refresh()
    return {
      status: "ok",
      message:
        weekdays.length > 0
          ? "Viikkorytmi tallennettu."
          : "Viikkorytmi poistettu.",
    }
  } catch (error) {
    console.error("Viikkorytmin tallennus epäonnistui", error)
    return { status: "error", message: "Tallennus epäonnistui." }
  }
}
