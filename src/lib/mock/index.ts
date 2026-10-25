import type {
  Activity,
  Application,
  Bookmark,
  Certification,
  Company,
  Contact,
  DocumentFile,
  DriveItem,
  Email,
  EmailTemplate,
  Integration,
  Interview,
  BoardItem,
  Note,
  NotificationPreferences,
  PortfolioContent,
  PricingConfig,
  Project,
  Referral,
  Resume,
  Skill,
  SmtpConfig,
  Task,
  UserProfile,
} from "@/lib/types"

import { seedApplications } from "./applications"
import { seedBoard } from "./board"
import { seedCompanies } from "./companies"
import { seedContacts } from "./contacts"
import { seedDocuments, seedDriveItems } from "./documents"
import { seedEmails, seedEmailTemplates, seedSmtpConfig } from "./emails"
import { seedActivities, seedIntegrations } from "./integrations"
import { seedInterviews } from "./interviews"
import { seedBookmarks, seedCertifications, seedSkills } from "./knowledge"
import { seedNotes } from "./notes"
import { seedProjects } from "./projects"
import { seedReferrals } from "./referrals"
import { seedPricing } from "./pricing"
import { seedResumes } from "./resumes"
import { seedTasks } from "./tasks"
import { mockNotificationPreferences, mockUser } from "./user"

export { DEMO_CREDENTIALS, mockUser } from "./user"

/** Every collection the mock backend knows about. */
export interface MockDatabase {
  applications: Application[]
  companies: Company[]
  contacts: Contact[]
  referrals: Referral[]
  interviews: Interview[]
  resumes: Resume[]
  documents: DocumentFile[]
  driveItems: DriveItem[]
  emails: Email[]
  templates: EmailTemplate[]
  projects: Project[]
  tasks: Task[]
  notes: Note[]
  board: BoardItem[]
  skills: Skill[]
  certifications: Certification[]
  bookmarks: Bookmark[]
  activities: Activity[]
  integrations: Integration[]
  smtp: SmtpConfig
  profile: UserProfile
  notificationPreferences: NotificationPreferences
  pricing: PricingConfig
  /** Null until saved once, like the API. */
  portfolio: PortfolioContent | null
}

/** Builds a fresh copy of all seed data with dates relative to "now". */
export function createSeedDatabase(): MockDatabase {
  return {
    applications: seedApplications(),
    companies: seedCompanies(),
    contacts: seedContacts(),
    referrals: seedReferrals(),
    interviews: seedInterviews(),
    resumes: seedResumes(),
    documents: seedDocuments(),
    driveItems: seedDriveItems(),
    emails: seedEmails(),
    templates: seedEmailTemplates(),
    projects: seedProjects(),
    tasks: seedTasks(),
    notes: seedNotes(),
    board: seedBoard(),
    skills: seedSkills(),
    certifications: seedCertifications(),
    bookmarks: seedBookmarks(),
    activities: seedActivities(),
    integrations: seedIntegrations(),
    smtp: seedSmtpConfig(),
    profile: { ...mockUser },
    notificationPreferences: { ...mockNotificationPreferences },
    pricing: seedPricing(),
    portfolio: null,
  }
}
