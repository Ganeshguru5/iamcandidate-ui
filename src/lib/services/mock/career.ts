import { applicationStatus, interviewType } from "@/lib/constants"
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Company,
  CompanyInput,
  Contact,
  ContactInput,
  ID,
  InterviewInput,
  ReferralInput,
  Resume,
  ResumeInput,
  TimelineEvent,
} from "@/lib/types"
import { delay, networkDelay } from "@/lib/utils/delay"
import { createId } from "@/lib/utils/id"
import { formatDateTime } from "@/lib/utils/dates"

import type {
  ApplicationService,
  CompanyService,
  ContactService,
  ResumeService,
} from "../contracts"
import { MockCrudService } from "./crud"
import { collection, logActivity, NotFoundError } from "./db"

const applications = collection("applications")
const companies = collection("companies")
const contacts = collection("contacts")
const resumes = collection("resumes")

function companyName(id: ID) {
  return companies.find(id)?.name ?? "Unknown company"
}

function event(title: string, type: TimelineEvent["type"], description?: string): TimelineEvent {
  return { id: createId("evt"), date: new Date().toISOString(), title, type, description }
}

/* ------------------------------------------------------------------ */

export class MockApplicationService implements ApplicationService {
  async getApplications(): Promise<Application[]> {
    await delay(350)
    return applications.all()
  }

  async getApplication(id: ID): Promise<Application | undefined> {
    await delay(250)
    return applications.find(id)
  }

  async createApplication(input: ApplicationInput): Promise<Application> {
    await networkDelay()
    const now = new Date().toISOString()
    const timeline: TimelineEvent[] = [event("Application created", "created")]
    if (input.status !== "wishlist") {
      timeline.push(event(`Status set to ${applicationStatus(input.status).label}`, "status"))
    }
    const app: Application = {
      ...input,
      id: createId("app"),
      appliedDate: input.appliedDate ?? (input.status === "wishlist" ? undefined : now),
      timeline,
      createdAt: now,
      updatedAt: now,
    }
    applications.insert(app)
    logActivity({
      type: "application_created",
      title: `${input.status === "wishlist" ? "Saved" : "Applied to"} ${companyName(app.companyId)} — ${app.role}`,
      entity: { type: "application", id: app.id },
    })
    return app
  }

  async updateApplication(id: ID, patch: Partial<ApplicationInput>): Promise<Application> {
    await networkDelay()
    const existing = applications.find(id)
    if (!existing) throw new NotFoundError("Application", id)
    const timeline = [...existing.timeline]
    if (patch.status && patch.status !== existing.status) {
      timeline.push(event(`Moved to ${applicationStatus(patch.status).label}`, "status"))
    }
    if (patch.nextFollowUp && patch.nextFollowUp !== existing.nextFollowUp) {
      timeline.push(event("Follow-up scheduled", "followup", formatDateTime(patch.nextFollowUp)))
    }
    return applications.patch(id, { ...patch, timeline, updatedAt: new Date().toISOString() })
  }

  async changeStatus(id: ID, status: ApplicationStatus): Promise<Application> {
    await delay(350)
    const existing = applications.find(id)
    if (!existing) throw new NotFoundError("Application", id)
    if (existing.status === status) return existing
    const label = applicationStatus(status).label
    const next = applications.patch(id, {
      status,
      appliedDate:
        existing.appliedDate ?? (status !== "wishlist" ? new Date().toISOString() : undefined),
      timeline: [...existing.timeline, event(`Moved to ${label}`, "status")],
      updatedAt: new Date().toISOString(),
    })
    logActivity({
      type: "application_status_changed",
      title: `${companyName(existing.companyId)} moved to ${label}`,
      description: existing.role,
      entity: { type: "application", id },
    })
    return next
  }

  async addTimelineEvent(id: ID, entry: Omit<TimelineEvent, "id">): Promise<Application> {
    await delay(300)
    const existing = applications.find(id)
    if (!existing) throw new NotFoundError("Application", id)
    return applications.patch(id, {
      timeline: [...existing.timeline, { ...entry, id: createId("evt") }],
      updatedAt: new Date().toISOString(),
    })
  }

  async deleteApplication(id: ID): Promise<void> {
    await networkDelay()
    const existing = applications.find(id)
    applications.remove(id)
    if (existing) {
      logActivity({
        type: "application_deleted",
        title: `Removed ${companyName(existing.companyId)} — ${existing.role}`,
      })
    }
  }
}

/* ------------------------------------------------------------------ */

export class MockCompanyService implements CompanyService {
  async getCompanies(): Promise<Company[]> {
    await delay(300)
    return companies.all()
  }

  async getCompany(id: ID): Promise<Company | undefined> {
    await delay(200)
    return companies.find(id)
  }

  async createCompany(input: CompanyInput): Promise<Company> {
    await networkDelay()
    const company = companies.insert({
      ...input,
      id: createId("cmp"),
      createdAt: new Date().toISOString(),
    })
    logActivity({
      type: "company_added",
      title: `Company added: ${company.name}`,
      entity: { type: "company", id: company.id },
    })
    return company
  }

  async updateCompany(id: ID, patch: Partial<CompanyInput>): Promise<Company> {
    await networkDelay()
    return companies.patch(id, patch)
  }

  async deleteCompany(id: ID): Promise<void> {
    await networkDelay()
    companies.remove(id)
  }
}

/* ------------------------------------------------------------------ */

export class MockContactService implements ContactService {
  async getContacts(): Promise<Contact[]> {
    await delay(300)
    return contacts.all()
  }

  async getContact(id: ID): Promise<Contact | undefined> {
    await delay(200)
    return contacts.find(id)
  }

  async createContact(input: ContactInput): Promise<Contact> {
    await networkDelay()
    const contact = contacts.insert({
      ...input,
      id: createId("ct"),
      createdAt: new Date().toISOString(),
    })
    logActivity({
      type: "contact_added",
      title: `Contact added: ${contact.name}`,
      description: contact.companyId ? companyName(contact.companyId) : contact.role,
      entity: { type: "contact", id: contact.id },
    })
    return contact
  }

  async updateContact(id: ID, patch: Partial<ContactInput>): Promise<Contact> {
    await networkDelay()
    return contacts.patch(id, patch)
  }

  async deleteContact(id: ID): Promise<void> {
    await networkDelay()
    contacts.remove(id)
  }
}

/* ------------------------------------------------------------------ */

export class MockReferralService extends MockCrudService<"referrals", ReferralInput> {
  constructor() {
    super({
      key: "referrals",
      idPrefix: "ref",
      build: (input, id, now) => ({ ...input, id, createdAt: now }),
      onCreate: (referral) => {
        if (referral.status === "not_contacted") return undefined
        const person = contacts.find(referral.contactId)?.name ?? "contact"
        return {
          type: "referral_requested",
          title: `Referral request sent to ${person.split(" ")[0]}`,
          description: `${companyName(referral.companyId)} — ${referral.role}`,
          entity: { type: "referral", id: referral.id },
        }
      },
    })
  }
}

export class MockInterviewService extends MockCrudService<"interviews", InterviewInput> {
  constructor() {
    super({
      key: "interviews",
      idPrefix: "int",
      build: (input, id, now) => ({ ...input, id, createdAt: now }),
      onCreate: (interview) => {
        const app = applications.find(interview.applicationId)
        if (app) {
          applications.patch(app.id, {
            timeline: [
              ...app.timeline,
              event(
                `${interviewType(interview.type).label} interview scheduled`,
                "interview",
                formatDateTime(interview.scheduledAt),
              ),
            ],
          })
        }
        return {
          type: "interview_scheduled",
          title: "Interview scheduled",
          description: app
            ? `${companyName(app.companyId)} — ${interviewType(interview.type).label}`
            : interviewType(interview.type).label,
          entity: { type: "interview", id: interview.id },
        }
      },
    })
  }
}

/* ------------------------------------------------------------------ */

function bumpVersion(version: string): string {
  const match = /^v(\d+)\.(\d+)$/.exec(version)
  if (!match) return version
  return `v${match[1]}.${Number(match[2]) + 1}`
}

export class MockResumeService implements ResumeService {
  async getResumes(): Promise<Resume[]> {
    await delay(300)
    return resumes.all()
  }

  async getResume(id: ID): Promise<Resume | undefined> {
    await delay(200)
    return resumes.find(id)
  }

  async createResume(input: ResumeInput): Promise<Resume> {
    await networkDelay()
    const now = new Date().toISOString()
    return resumes.insert({ ...input, id: createId("res"), createdAt: now, updatedAt: now })
  }

  async updateResume(id: ID, patch: Partial<ResumeInput>): Promise<Resume> {
    await networkDelay()
    const existing = resumes.find(id)
    if (!existing) throw new NotFoundError("Resume", id)
    const next = resumes.patch(id, {
      ...patch,
      version: patch.version ?? bumpVersion(existing.version),
      updatedAt: new Date().toISOString(),
    })
    logActivity({
      type: "resume_updated",
      title: "Resume updated",
      description: `${next.title} → ${next.version}`,
      entity: { type: "resume", id },
    })
    return next
  }

  async duplicateResume(id: ID): Promise<Resume> {
    await networkDelay()
    const existing = resumes.find(id)
    if (!existing) throw new NotFoundError("Resume", id)
    const now = new Date().toISOString()
    return resumes.insert({
      ...existing,
      id: createId("res"),
      title: `${existing.title} (copy)`,
      version: "v1.0",
      isDefault: false,
      documentId: undefined,
      createdAt: now,
      updatedAt: now,
    })
  }

  async setDefaultResume(id: ID): Promise<Resume[]> {
    await delay(400)
    const next = resumes.all().map((r) => ({ ...r, isDefault: r.id === id }))
    resumes.replaceAll(next)
    return next
  }

  async compileLatex(): Promise<Blob> {
    await delay(300)
    throw new Error("Compiling LaTeX needs the API backend (NEXT_PUBLIC_API_MODE=api).")
  }

  async deleteResume(id: ID): Promise<void> {
    await networkDelay()
    resumes.remove(id)
  }
}
