import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { AppShell } from "@/components/layout/app-shell"
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration"
import "./globals.css"

// next/font lataa fontin build-vaiheessa ja tarjoilee sen omalta palvelimelta:
// käyttäjän selain ei ota yhteyttä Googleen.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: { default: "Arki", template: "%s · Arki" },
  description: "Perheen yhteinen arki yhdessä näkymässä.",
  applicationName: "Arki",
  appleWebApp: {
    capable: true,
    title: "Arki",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f4ee",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fi" className={`${inter.variable} antialiased`}>
      <body>
        <AppShell>{children}</AppShell>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
