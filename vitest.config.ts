import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Ajetaan testit tarkoituksella UTC-ajassa (kuten Vercelin palvelimet),
    // jotta Helsinki-aikavyöhykkeen käsittely tulee oikeasti testattua.
    env: { TZ: "UTC" },
  },
})
