"use client"

import { PageSkeleton } from "@/components/shared/skeletons"
import { useNow } from "@/lib/store/local-store"

import { DashboardView } from "./dashboard-view"

export function DashboardScreen() {
  const now = useNow()
  if (now === null) return <PageSkeleton />
  return <DashboardView now={new Date(now)} />
}
