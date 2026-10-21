"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"

import type { ThemePreference } from "@/lib/types"

import { useLocalValue } from "./local-store"

export const THEME_STORAGE_KEY = "pos:theme"

/** Inline script for <head> — applies the theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var t=JSON.parse(localStorage.getItem('${THEME_STORAGE_KEY}')||'"system"');var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'}catch(e){}})()`

const media = "(prefers-color-scheme: dark)"

function subscribeSystem(listener: () => void) {
  const mql = window.matchMedia(media)
  mql.addEventListener("change", listener)
  return () => mql.removeEventListener("change", listener)
}

export function useTheme() {
  const [theme, setStored] = useLocalValue<ThemePreference>(THEME_STORAGE_KEY, "system")
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia(media).matches,
    () => false,
  )
  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme

  const setTheme = useCallback((next: ThemePreference) => setStored(next), [setStored])
  return { theme, resolvedTheme, setTheme }
}

/** Keeps <html class="dark"> in sync with the stored preference. */
export function useApplyTheme() {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])
}
