import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Kehitystilan "N"-merkki pois mobiilin alanavigaation päältä.
  devIndicators: { position: "top-right" },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
