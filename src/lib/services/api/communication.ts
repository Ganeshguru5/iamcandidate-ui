import { apiClient, toPatch } from "@/lib/api/client"
import type {
  ComposeEmailInput,
  Email,
  EmailTemplate,
  EmailTemplateInput,
  ID,
  Integration,
  IntegrationId,
  SmtpConfig,
} from "@/lib/types"

import type { EmailService, IntegrationService, SmtpService, TemplateService } from "../contracts"
import { MockIntegrationService } from "../mock/system"
import { ApiCrudService } from "./crud"
import { integrationsApi } from "./integrations"

const enc = encodeURIComponent

/** Sends through the user's own SMTP account (configured in Settings → Email). */
export class ApiEmailService implements EmailService {
  getEmails(): Promise<Email[]> {
    return apiClient.get("/emails")
  }

  sendEmail(input: ComposeEmailInput): Promise<Email> {
    return apiClient.post("/emails/send", input)
  }

  saveDraft(input: ComposeEmailInput, draftId?: ID): Promise<Email> {
    return draftId
      ? apiClient.put(`/emails/drafts/${enc(draftId)}`, input)
      : apiClient.post("/emails/drafts", input)
  }

  markRead(id: ID, read: boolean): Promise<Email> {
    return apiClient.put(`/emails/${enc(id)}`, { read })
  }

  async toggleStar(id: ID): Promise<Email> {
    const email = await apiClient.get<Email>(`/emails/${enc(id)}`)
    return apiClient.put(`/emails/${enc(id)}`, { starred: !email.starred })
  }

  deleteEmail(id: ID): Promise<void> {
    return apiClient.delete(`/emails/${enc(id)}`)
  }
}

export class ApiTemplateService
  extends ApiCrudService<EmailTemplate, EmailTemplateInput>
  implements TemplateService
{
  constructor() {
    super("/templates")
  }

  duplicate(id: ID): Promise<EmailTemplate> {
    return apiClient.post(`/templates/${enc(id)}/duplicate`)
  }

  restoreDefaults(): Promise<{ added: number; templates: EmailTemplate[] }> {
    return apiClient.post("/templates/defaults")
  }

  override update(id: ID, patch: Partial<EmailTemplateInput>): Promise<EmailTemplate> {
    return apiClient.put(this.path(id), toPatch(patch))
  }
}

/** The password is write-only: the API returns "" plus `hasPassword`. */
export class ApiSmtpService implements SmtpService {
  getConfig(): Promise<SmtpConfig> {
    return apiClient.get("/settings/smtp")
  }

  saveConfig(config: SmtpConfig): Promise<SmtpConfig> {
    return apiClient.put("/settings/smtp", config)
  }

  testConnection(config: SmtpConfig): Promise<{ ok: true; latencyMs: number }> {
    return apiClient.post("/settings/smtp/test", config)
  }

  removeConfig(): Promise<void> {
    return apiClient.delete("/settings/smtp")
  }
}

/**
 * Every integration reflects the real server state; the names and
 * descriptions come from the shared catalogue.
 */
export class ApiIntegrationService implements IntegrationService {
  private readonly mock = new MockIntegrationService()
  private readonly smtp = new ApiSmtpService()

  private async withRealStatus(list: Integration[]): Promise<Integration[]> {
    const [config, overview] = await Promise.all([this.smtp.getConfig(), integrationsApi.overview()])
    const { googleDrive: drive, googleCalendar: calendar, github, linkedin, aws } = overview
    const state = (connected: boolean | undefined): Integration["status"] =>
      connected ? "connected" : "disconnected"
    return list.map((integration): Integration => {
      switch (integration.id) {
        case "smtp":
          return {
            ...integration,
            status: state(config.hasPassword),
            account: config.hasPassword ? `${config.senderEmail} via ${config.host}` : undefined,
            lastSyncedAt: config.lastTestedAt,
          }
        case "google_drive":
          return { ...integration, status: state(drive.connected), account: drive.account, lastSyncedAt: drive.connectedAt }
        case "google_calendar":
          return {
            ...integration,
            status: state(calendar.connected),
            account: calendar.account,
            lastSyncedAt: calendar.lastSyncedAt,
          }
        case "github":
          return {
            ...integration,
            status: state(github.connected),
            account: github.account ? `@${github.account}` : undefined,
            lastSyncedAt: github.connectedAt,
          }
        case "linkedin": {
          const imported = Object.values(linkedin.imports).reduce((sum, i) => sum + (i?.created ?? 0), 0)
          return {
            ...integration,
            // Nothing to connect: "connected" once something was imported.
            status: state(Boolean(linkedin.lastImportAt)),
            account: linkedin.lastImportAt ? `${imported} item${imported === 1 ? "" : "s"} imported` : undefined,
            lastSyncedAt: linkedin.lastImportAt,
          }
        }
        case "aws":
          return {
            ...integration,
            status: state(aws.connected),
            account: aws.connected ? `s3://${aws.bucket}/${aws.prefix ?? ""}` : undefined,
            lastSyncedAt: aws.lastBackup?.at,
          }
        default:
          return integration
      }
    })
  }

  async getIntegrations(): Promise<Integration[]> {
    return this.withRealStatus(await this.mock.getIntegrations())
  }

  private async integration(id: IntegrationId): Promise<Integration> {
    const list = await this.getIntegrations()
    return list.find((i) => i.id === id) as Integration
  }

  /** Real connections happen on each integration's own page (OAuth redirect, token or key forms). */
  async connect(id: IntegrationId): Promise<Integration> {
    if (id === "smtp") throw new Error("Add your SMTP account under Settings → Email.")
    throw new Error("Open the integration to connect it.")
  }

  async disconnect(id: IntegrationId): Promise<Integration> {
    switch (id) {
      case "smtp":
        await this.smtp.removeConfig()
        break
      case "google_drive":
        await apiClient.delete("/integrations/google-drive")
        break
      case "google_calendar":
        await integrationsApi.calendar.disconnect(false)
        break
      case "github":
        await integrationsApi.github.disconnect()
        break
      case "aws":
        await integrationsApi.aws.disconnect()
        break
      case "linkedin":
        throw new Error("LinkedIn imports can't be disconnected. Delete imported items in knot instead.")
    }
    return this.integration(id)
  }

  /** Calendar pushes events to Google; the others are live, so "sync" re-reads the status. */
  async sync(id: IntegrationId): Promise<Integration> {
    if (id === "google_calendar") await integrationsApi.calendar.sync()
    return this.integration(id)
  }
}
