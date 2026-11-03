import { randomBytes } from "node:crypto"
import { describe, expect, it } from "vitest"

import {
  decryptSecret,
  encryptSecret,
  FeedKeyMissingError,
  parseEncryptionKey,
} from "./crypto"

const key = randomBytes(32)
const secret = "https://example.inschool.fi/schedule/export/x.ics?token=abc123"

describe("syöteosoitteen salaus", () => {
  it("salaa ja purkaa", () => {
    const encrypted = encryptSecret(secret, key)
    expect(encrypted).not.toContain("token")
    expect(encrypted.startsWith("v1:")).toBe(true)
    expect(decryptSecret(encrypted, key)).toBe(secret)
  })

  it("tuottaa joka kerta eri salatun muodon", () => {
    expect(encryptSecret(secret, key)).not.toBe(encryptSecret(secret, key))
  })

  it("hylkää väärän avaimen", () => {
    const encrypted = encryptSecret(secret, key)
    expect(() => decryptSecret(encrypted, randomBytes(32))).toThrow()
  })

  it("havaitsee muokatun salatun tekstin", () => {
    const parts = encryptSecret(secret, key).split(":")
    const data = Buffer.from(parts[3], "base64url")
    data[0] ^= 1
    parts[3] = data.toString("base64url")
    expect(() => decryptSecret(parts.join(":"), key)).toThrow()
  })

  it("vaatii 32-tavuisen avaimen", () => {
    expect(() => parseEncryptionKey(undefined)).toThrow(FeedKeyMissingError)
    expect(() => parseEncryptionKey("bHloeXQ=")).toThrow()
    expect(parseEncryptionKey(key.toString("base64"))).toHaveLength(32)
  })
})
