import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Providers } from "@/components/providers/providers"
import { SPLASH_SCREENS } from "@/lib/pwa/splash-screens"
import { themeInitScript } from "@/lib/store/theme"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "IamCandidate",
    template: "%s · IamCandidate",
  },
  description: "A personal command center for documents, job search, communication and knowledge.",
  applicationName: "IamCandidate",
  // Installed to the iOS home screen: full screen, content drawn under the
  // status bar (see the safe-area padding in the shell and headers).
  appleWebApp: {
    capable: true,
    title: "IamCandidate",
    statusBarStyle: "black-translucent",
    startupImage: SPLASH_SCREENS,
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#16171c" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
