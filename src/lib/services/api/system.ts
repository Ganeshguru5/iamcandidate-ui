import { apiClient, tzQuery } from "@/lib/api/client"
import type {
  Activity,
  AppNotification,
  DashboardSummary,
  NotificationPreferences,
  UserProfile,
} from "@/lib/types"

import type {
  ActivityService,
  DashboardService,
  NotificationService,
  SettingsService,
} from "../contracts"

export class ApiActivityService implements ActivityService {
  getActivities(): Promise<Activity[]> {
    return apiClient.get("/activities", { limit: 200 })
  }
}

export class ApiDashboardService implements DashboardService {
  getSummary(): Promise<DashboardSummary> {
    return apiClient.get("/dashboard", tzQuery())
  }
}

export class ApiNotificationService implements NotificationService {
  getNotifications(): Promise<AppNotification[]> {
    return apiClient.get("/notifications", tzQuery())
  }

  markRead(id: string): Promise<void> {
    return apiClient.put(`/notifications/${encodeURIComponent(id)}/read`)
  }

  markAllRead(): Promise<AppNotification[]> {
    return apiClient.put("/notifications/read-all", undefined, tzQuery())
  }
}

export class ApiSettingsService implements SettingsService {
  getProfile(): Promise<UserProfile> {
    return apiClient.get("/settings/profile")
  }

  updateProfile(profile: UserProfile): Promise<UserProfile> {
    return apiClient.put("/settings/profile", profile)
  }

  getNotificationPreferences(): Promise<NotificationPreferences> {
    return apiClient.get("/settings/notifications")
  }

  updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    return apiClient.put("/settings/notifications", prefs)
  }

  async resetDemoData(): Promise<void> {
    throw new Error("Resetting data is only available in mock mode.")
  }
}
