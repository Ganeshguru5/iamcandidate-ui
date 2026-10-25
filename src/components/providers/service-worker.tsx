"use client"

import { useEffect } from "react"

/**
 * Registers public/sw.js in production builds. Skipped in `next dev` so cached
 * assets never mask hot reloads.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      console.warn("Service worker registration failed", error)
    })
  }, [])
  return null
}
