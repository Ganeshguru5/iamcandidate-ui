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

interface GoogleDriveStatus {
  connected: boolean
  available: boolean
  account?: string
  connectedAt?: string
}

/**
 * SMTP and Google Drive reflect the real server state; the "coming soon"
 * integrations come from the mock catalogue.
 */
export class ApiIntegrationService implements IntegrationService {
  private readonly mock = new MockIntegrationService()
  private readonly smtp = new ApiSmtpService()

  private async withRealStatus(list: Integration[]): Promise<Integration[]> {
    const [config, drive] = await Promise.all([
      this.smtp.getConfig(),
      apiClient.get<GoogleDriveStatus>("/integrations/google-drive"),
    ])
    return list.map((integration): Integration => {
      if (integration.id === "smtp") {
        return {
          ...integration,
          status: config.hasPassword ? "connected" : "disconnected",
          account: config.hasPassword ? `${config.senderEmail} via ${config.host}` : undefined,
          lastSyncedAt: config.lastTestedAt,
        }
      }
      if (integration.id === "google_drive") {
        return {
          ...integration,
          status: drive.connected ? "connected" : "disconnected",
          account: drive.account,
          lastSyncedAt: drive.connectedAt,
        }
      }
      return integration
    })
  }

  async getIntegrations(): Promise<Integration[]> {
    return this.withRealStatus(await this.mock.getIntegrations())
  }

  private async integration(id: IntegrationId): Promise<Integration> {
    const list = await this.getIntegrations()
    return list.find((i) => i.id === id) as Integration
  }

  async connect(id: IntegrationId): Promise<Integration> {
    if (id === "smtp") throw new Error("Add your SMTP account under Settings → Email.")
    // Google Drive connects through a redirect (see ConnectDialog), not here.
    if (id === "google_drive") throw new Error("Use Connect to sign in with Google.")
    return this.mock.connect(id)
  }

  async disconnect(id: IntegrationId): Promise<Integration> {
    if (id === "smtp") await this.smtp.removeConfig()
    else if (id === "google_drive") await apiClient.delete("/integrations/google-drive")
    else return this.mock.disconnect(id)
    return this.integration(id)
  }

  /** Drive is browsed live, so "sync" just re-reads the status. */
  async sync(id: IntegrationId): Promise<Integration> {
    if (id === "smtp" || id === "google_drive") return this.integration(id)
    return this.mock.sync(id)
  }
}
