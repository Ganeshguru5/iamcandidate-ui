import { apiClient, tzQuery } from "@/lib/api/client"
import type {
  AwsBackupInput,
  AwsBackupStatus,
  BackupProgress,
  GitHubActivity,
  GitHubRepo,
  GitHubStatus,
  GoogleCalendarStatus,
  IntegrationsOverview,
  LinkedInImportResult,
  LinkedInStatus,
  Project,
} from "@/lib/types"

/**
 * Server-side integrations beyond Drive and SMTP. They need the iamcandidate-server
 * backend (API mode); in mock mode their pages explain that instead.
 */
export const integrationsApi = {
  overview: () => apiClient.get<IntegrationsOverview>("/integrations"),

  calendar: {
    status: () => apiClient.get<GoogleCalendarStatus>("/integrations/google-calendar"),
    async authUrl(): Promise<string> {
      const { url } = await apiClient.get<{ url: string }>("/integrations/google-calendar/auth-url")
      return url
    },
    connect: (code: string, state: string) =>
      apiClient.post<GoogleCalendarStatus>("/integrations/google-calendar/connect", { code, state }),
    sync: () =>
      apiClient.post<GoogleCalendarStatus>("/integrations/google-calendar/sync", undefined, tzQuery()),
    disconnect: (removeEvents: boolean) =>
      apiClient.deleteJson<GoogleCalendarStatus>("/integrations/google-calendar", {
        removeEvents: String(removeEvents),
      }),
  },

  github: {
    status: () => apiClient.get<GitHubStatus>("/integrations/github"),
    connect: (token: string) => apiClient.put<GitHubStatus>("/integrations/github", { token }),
    disconnect: () => apiClient.deleteJson<GitHubStatus>("/integrations/github"),
    repos: () => apiClient.get<GitHubRepo[]>("/integrations/github/repos"),
    activity: (repo: string) => apiClient.get<GitHubActivity>("/integrations/github/activity", { repo }),
    importRepo: (repo: string) => apiClient.post<Project>("/integrations/github/import", { repo }),
  },

  linkedin: {
    status: () => apiClient.get<LinkedInStatus>("/integrations/linkedin"),
    import: (csv: string, dryRun: boolean) =>
      apiClient.post<LinkedInImportResult>("/integrations/linkedin/import", { csv, dryRun }),
  },

  aws: {
    status: () => apiClient.get<AwsBackupStatus>("/integrations/aws-s3"),
    connect: (input: AwsBackupInput) => apiClient.put<AwsBackupStatus>("/integrations/aws-s3", input),
    disconnect: () => apiClient.deleteJson<AwsBackupStatus>("/integrations/aws-s3"),
    backupStep: (cursor?: string) =>
      apiClient.post<BackupProgress>("/integrations/aws-s3/backup", cursor ? { cursor } : {}),
  },
}
