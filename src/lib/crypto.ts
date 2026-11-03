import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * Kalenterisyötteiden osoitteiden salaus (AES-256-GCM).
 *
 * Syöteosoite sisältää tunnisteen, jolla kalenterin voi lukea ilman
 * kirjautumista, joten se on salaisuus. Tietokantaan tallennetaan vain
 * salattu muoto; avain on vain palvelimen ympäristömuuttujassa
 * FEED_ENCRYPTION_KEY. GCM tunnistaa myös muokatun salatun tekstin.
 *
 * Muoto: "v1:<iv>:<tag>:<data>" (base64url)
 */
const VERSION = "v1"

export class FeedKeyMissingError extends Error {
  constructor() {
    super("Salausavain puuttuu (FEED_ENCRYPTION_KEY)")
  }
}

export function parseEncryptionKey(base64: string | undefined): Buffer {
  if (!base64) throw new FeedKeyMissingError()
  const key = Buffer.from(base64, "base64")
  if (key.length !== 32) {
    throw new Error("FEED_ENCRYPTION_KEY:n pitää olla 32 tavua base64-muodossa")
  }
  return key
}

export function feedEncryptionKey(): Buffer {
  return parseEncryptionKey(process.env.FEED_ENCRYPTION_KEY)
}

export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv, tag, data]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url"),
    )
    .join(":")
}

export function decryptSecret(encrypted: string, key: Buffer): string {
  const [version, iv, tag, data] = encrypted.split(":")
  if (version !== VERSION || !iv || !tag || !data) {
    throw new Error("Tuntematon salausmuoto")
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64url"),
  )
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}
