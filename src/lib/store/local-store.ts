"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * localStorage-backed value shared across components (and tabs). Used for
 * client-only preferences: session, theme, sidebar state.
 */
const listeners = new Map<string, Set<() => void>>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener())
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key) {
      cache.delete(event.key)
      notify(event.key)
    }
  })
}

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    return fallback
  }
  const cached = cache.get(key)
  if (cached && cached.raw === raw) return cached.value as T
  let value: T = fallback
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = fallback
    }
  }
  cache.set(key, { raw, value })
  return value
}

export function writeLocal<T>(key: string, value: T | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore (private mode, quota)
  }
  cache.delete(key)
  notify(key)
}

export function useLocalValue<T>(key: string, fallback: T, serverValue: T = fallback) {
  const subscribe = useCallback((listener: () => void) => {
    let set = listeners.get(key)
    if (!set) {
      set = new Set()
      listeners.set(key, set)
    }
    set.add(listener)
    return () => {
      set.delete(listener)
    }
  }, [key])

  const value = useSyncExternalStore(
    subscribe,
    () => readLocal(key, fallback),
    () => serverValue,
  )
  const setValue = useCallback((next: T | null) => writeLocal(key, next), [key])
  return [value, setValue] as const
}

/** True once the component has hydrated on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

function noopSubscribe() {
  return () => {}
}

const MINUTE = 60_000
let nowValue = 0

function subscribeNow(listener: () => void) {
  const id = window.setInterval(listener, MINUTE)
  return () => window.clearInterval(id)
}

function getNow() {
  // Stable within a minute so useSyncExternalStore sees a consistent snapshot.
  const current = Math.floor(Date.now() / MINUTE) * MINUTE
  if (current !== nowValue) nowValue = current
  return nowValue
}

/**
 * Current time (minute precision) on the client, `null` during prerender.
 * Keeps time-dependent rendering out of the static shell.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeNow, getNow, () => null)
}
