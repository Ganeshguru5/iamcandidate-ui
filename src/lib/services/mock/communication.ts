import type {
  ComposeEmailInput,
  Email,
  EmailTemplateInput,
  ID,
  SmtpConfig,
} from "@/lib/types"
import { seedEmailTemplates } from "@/lib/mock/emails"
import { delay, networkDelay } from "@/lib/utils/delay"
import { createId } from "@/lib/utils/id"

import type { EmailService, SmtpService, TemplateService } from "../contracts"
import { MockCrudService } from "./crud"
import { collection, logActivity, NotFoundError, read, write } from "./db"

const emails = collection("emails")
const templates = collection("templates")
const contacts = collection("contacts")

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sender() {
  const smtp = read("smtp")
  return { name: smtp.senderName, email: smtp.senderEmail }
}

export class MockEmailService implements EmailService {
  async getEmails(): Promise<Email[]> {
    await delay(350)
    return emails.all()
  }

  async sendEmail(input: ComposeEmailInput): Promise<Email> {
    await delay(1200)
    const invalid = [...input.to, ...input.cc].find((address) => !EMAIL_PATTERN.test(address))
    if (invalid) throw new Error(`"${invalid}" is not a valid email address`)
    if (read("integrations").find((i) => i.id === "smtp")?.status !== "connected") {
      throw new Error("SMTP is disconnected. Reconnect it in Integrations.")
    }
    const email = emails.insert({
      ...input,
      id: createId("em"),
      folder: "sent",
      from: sender(),
      date: new Date().toISOString(),
      read: true,
      starred: false,
    })
    if (input.templateId) {
      const template = templates.find(input.templateId)
      if (template) templates.patch(template.id, { usageCount: template.usageCount + 1 })
    }
    const recipient =
      contacts.all().find((c) => c.email === input.to[0])?.name ?? input.to[0]
    if (input.contactId) {
      contacts.patch(input.contactId, { lastContacted: email.date })
    }
    logActivity({
      type: "email_sent",
      title: `Email sent to ${recipient}`,
      description: input.subject,
      entity: { type: "email", id: email.id },
    })
    return email
  }

  async saveDraft(input: ComposeEmailInput, draftId?: ID): Promise<Email> {
    await delay(500)
    const base = {
      ...input,
      folder: "drafts" as const,
      from: sender(),
      date: new Date().toISOString(),
      read: true,
      starred: false,
    }
    if (draftId && emails.find(draftId)) return emails.patch(draftId, base)
    return emails.insert({ ...base, id: createId("em") })
  }

  async markRead(id: ID, isRead: boolean): Promise<Email> {
    await delay(120)
    return emails.patch(id, { read: isRead })
  }

  async toggleStar(id: ID): Promise<Email> {
    await delay(150)
    const existing = emails.find(id)
    if (!existing) throw new NotFoundError("Email", id)
    return emails.patch(id, { starred: !existing.starred })
  }

  async deleteEmail(id: ID): Promise<void> {
    await delay(400)
    emails.remove(id)
  }
}

export class MockTemplateService
  extends MockCrudService<"templates", EmailTemplateInput>
  implements TemplateService
{
  constructor() {
    super({
      key: "templates",
      idPrefix: "tpl",
      build: (input, id, now) => ({
        ...input,
        channel: input.channel ?? "email",
        id,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      }),
      touch: (_item, now) => ({ updatedAt: now }),
    })
  }

  async duplicate(id: ID) {
    await networkDelay()
    const existing = templates.find(id)
    if (!existing) throw new NotFoundError("Template", id)
    const now = new Date().toISOString()
    return templates.insert({
      ...existing,
      id: createId("tpl"),
      name: `${existing.name} (copy)`,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    })
  }

  /** Mock mode's defaults are the demo templates. */
  async restoreDefaults() {
    await networkDelay()
    const existing = templates.all()
    const ids = new Set(existing.map((t) => t.id))
    const key = (t: { channel?: string; name: string }) => `${t.channel ?? "email"}:${t.name.toLowerCase()}`
    const names = new Set(existing.map(key))
    const missing = seedEmailTemplates().filter((t) => !ids.has(t.id) && !names.has(key(t)))
    for (const template of missing) templates.insert({ ...template, usageCount: 0 })
    return { added: missing.length, templates: templates.all() }
  }
}

export class MockSmtpService implements SmtpService {
  async getConfig(): Promise<SmtpConfig> {
    await delay(250)
    return read("smtp")
  }

  async saveConfig(config: SmtpConfig): Promise<SmtpConfig> {
    await networkDelay()
    write("smtp", config)
    return config
  }

  async testConnection(config: SmtpConfig): Promise<{ ok: true; latencyMs: number }> {
    await delay(1600)
    if (!config.host.includes(".")) throw new Error(`Could not resolve host "${config.host}"`)
    if (![25, 465, 587, 2525].includes(config.port)) {
      throw new Error(`Connection refused on port ${config.port}`)
    }
    if (!config.password) throw new Error("Authentication failed: password is required")
    write("smtp", { ...read("smtp"), lastTestedAt: new Date().toISOString() })
    return { ok: true, latencyMs: 120 + Math.round(Math.random() * 80) }
  }
}
