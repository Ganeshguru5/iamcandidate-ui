"use client"

import { isApiMode } from "@/lib/api/config"
import { SESSION_PENDING, useSession } from "@/lib/store/session"

/** The only account the API lets save the portfolio. */
export const OWNER_EMAIL = "ganeshguru8681@gmail.com"

/** The API only accepts the owner; demo mode lets any admin try it out. */
export function useIsPortfolioOwner(): boolean {
  const session = useSession()
  if (session === null || session === SESSION_PENDING) return false
  return isApiMode ? session.email.trim().toLowerCase() === OWNER_EMAIL : session.role === "admin"
}
