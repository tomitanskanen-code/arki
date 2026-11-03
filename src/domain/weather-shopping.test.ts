import { describe, expect, it } from "vitest"

import { normalizeItemName, splitShoppingList } from "./shopping"
import type { ShoppingListItem } from "./types"
import { conditionFromWmoCode, formatTemperature } from "./weather"

describe("sää", () => {
  it("tulkitsee WMO-koodit", () => {
    expect(conditionFromWmoCode(0)).toBe("clear")
    expect(conditionFromWmoCode(3)).toBe("cloudy")
    expect(conditionFromWmoCode(63)).toBe("rain")
    expect(conditionFromWmoCode(73)).toBe("snow")
    expect(conditionFromWmoCode(96)).toBe("thunderstorm")
  })

  it("muotoilee lämpötilan", () => {
    expect(formatTemperature(-2.6)).toBe("−3°")
    expect(formatTemperature(4.4)).toBe("4°")
    expect(formatTemperature(-0.2)).toBe("0°")
  })
})

describe("kauppalista", () => {
  it("siistii tuotteen nimen", () => {
    expect(normalizeItemName("  maito   1 l ")).toBe("Maito 1 l")
    expect(normalizeItemName("   ")).toBeNull()
    expect(normalizeItemName("ä".repeat(100))).toHaveLength(80)
  })

  it("erottelee ostetut ja ostamattomat", () => {
    const item = (
      id: string,
      createdAt: string,
      purchasedAt: string | null = null,
    ): ShoppingListItem => ({
      id,
      name: id,
      isPurchased: purchasedAt !== null,
      purchasedAt,
      createdAt,
    })
    const { open, purchased } = splitShoppingList([
      item("a", "2026-11-01T10:00:00Z"),
      item("b", "2026-11-02T10:00:00Z"),
      item("c", "2026-11-01T10:00:00Z", "2026-11-02T08:00:00Z"),
      item("d", "2026-11-01T10:00:00Z", "2026-11-03T08:00:00Z"),
    ])
    expect(open.map((i) => i.id)).toEqual(["b", "a"])
    expect(purchased.map((i) => i.id)).toEqual(["d", "c"])
  })
})
