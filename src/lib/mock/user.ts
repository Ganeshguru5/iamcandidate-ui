import type { NotificationPreferences, UserProfile } from "@/lib/types"

export const DEMO_CREDENTIALS = {
  email: "demo@example.com",
  password: "demo123",
} as const

export const mockUser: UserProfile = {
  name: "Ganeshguru",
  email: "demo@example.com",
  role: "Frontend Engineer",
  bio: "Frontend engineer focused on React, Next.js and React Native. Building calm, fast interfaces — and knot, to run my job search.",
  location: "Chennai, India",
}

export const mockNotificationPreferences: NotificationPreferences = {
  emailNotifications: true,
  interviewReminders: true,
  taskReminders: true,
  followUpReminders: true,
  weeklyDigest: false,
}
