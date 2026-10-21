import { readLocal, writeLocal } from "@/lib/store/local-store"
import type { Session } from "@/lib/types"

/** localStorage key of the signed-in session (shared with `@/lib/store/session`). */
export const SESSION_KEY = "pos:session"

/** Bearer token of the current session, if signed in. */
export function getSessionToken(): string | undefined {
  const session = readLocal<Session | null>(SESSION_KEY, null)
  return session?.token
}

/** Drops the session; the app shell then redirects to the login page. */
export function clearSession() {
  writeLocal(SESSION_KEY, null)
}
