import type { Metadata } from "next"

import { CalendarView } from "@/features/integrations/calendar-view"

export const metadata: Metadata = { title: "Google Calendar" }

export default function CalendarPage() {
  return <CalendarView />
}
