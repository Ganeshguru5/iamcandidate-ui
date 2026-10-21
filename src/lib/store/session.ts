"use client"

import { isApiMode } from "@/lib/api/config"
import { SESSION_KEY } from "@/lib/api/session-token"
import { authService } from "@/lib/services"
import type { Session } from "@/lib/types"

import { resetQueryCache } from "./query"
import { useLocalValue, writeLocal } from "./local-store"
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

export async function signIn(email: string, password: string): Promise<Session> {
  const session = await authService.login(email, password)
  writeLocal(SESSION_KEY, session)
  // Drop anything cached for a previous user.
  resetQueryCache()
  return session
}

export async function signOut() {
  await authService.logout()
  writeLocal(SESSION_KEY, null)
  resetQueryCache()
}
