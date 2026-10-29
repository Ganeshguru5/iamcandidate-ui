"use client"

import { isApiMode } from "@/lib/api/config"
import { SESSION_KEY } from "@/lib/api/session-token"
import { authService } from "@/lib/services"
import type { Session } from "@/lib/types"

import { resetQueryCache } from "./query"
import { readLocal, useLocalValue, writeLocal } from "./local-store"
/** Sentinel used during SSR/hydration so the shell can render a skeleton. */
export const SESSION_PENDING = "pending" as const

export function useSession() {
  const [session] = useLocalValue<Session | null | typeof SESSION_PENDING>(
    SESSION_KEY,
    null,
    SESSION_PENDING,
  )
  return session
}

/** Admins manage users; that needs the API backend. */
export function useIsAdmin(): boolean {
  const session = useSession()
  return isApiMode && session !== null && session !== SESSION_PENDING && session.role === "admin"
}

/** Admin role in any mode (pricing also works on demo data). */
export function useIsAdminRole(): boolean {
  const session = useSession()
  return session !== null && session !== SESSION_PENDING && session.role === "admin"
}

/** The signed-in account can read but not change anything (the API rejects writes). */
export function useIsReadOnly(): boolean {
  const session = useSession()
  return session !== null && session !== SESSION_PENDING && session.readOnly === true
}

export async function signIn(email: string, password: string): Promise<Session> {
  const session = await authService.login(email, password)
  writeLocal(SESSION_KEY, session)
  // Drop anything cached for a previous user.
  resetQueryCache()
  return session
}

/** Refresh at most this often; tokens last a year, so any daily use keeps the session alive. */
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * Rolling sessions: swaps a token that's more than a day old for a fresh one,
 * so you stay signed in until you sign out. Failures are ignored — a token the
 * server rejects (401) already signs you out via the API client.
 */
export async function refreshSessionIfStale(session: Session) {
  if (Date.now() - new Date(session.createdAt).getTime() < REFRESH_AFTER_MS) return
  try {
    const next = await authService.refresh(session)
    // Don't resurrect a session that was signed out (or switched) meanwhile.
    if (readLocal<Session | null>(SESSION_KEY, null)?.token === session.token) {
      writeLocal(SESSION_KEY, next)
    }
  } catch {
    // Offline or server error: try again next time.
  }
}

export async function signOut() {
  await authService.logout()
  writeLocal(SESSION_KEY, null)
  resetQueryCache()
}
