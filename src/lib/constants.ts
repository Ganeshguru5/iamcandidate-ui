import type {
  ApplicationStatus,
  CompanyStatus,
  DocumentCategory,
  InterviewStatus,
  InterviewType,
  LinkCategory,
  NoteCategory,
  Priority,
  ProjectStatus,
  ReferralStatus,
  Relationship,
  SkillGroup,
  TaskPriority,
  TaskStatus,
  TemplateCategory,
  WorkMode,
} from "@/lib/types"

/** Restrained set of semantic tones; each maps to tinted badge/dot styles. */
export type Tone = "neutral" | "blue" | "violet" | "amber" | "green" | "red" | "teal" | "orange"

export interface Option<T extends string> {
  value: T
  label: string
  tone: Tone
}

function lookup<T extends string>(options: readonly Option<T>[]) {
  const map = new Map(options.map((o) => [o.value, o]))
  return (value: T): Option<T> => map.get(value) ?? { value, label: value, tone: "neutral" }
}

export const APPLICATION_STATUSES: readonly Option<ApplicationStatus>[] = [
  { value: "wishlist", label: "Wishlist", tone: "neutral" },
  { value: "applied", label: "Applied", tone: "blue" },
  { value: "recruiter", label: "Recruiter", tone: "teal" },
  { value: "technical", label: "Technical Interview", tone: "violet" },
  { value: "hr", label: "HR", tone: "amber" },
  { value: "offer", label: "Offer", tone: "green" },
  { value: "rejected", label: "Rejected", tone: "red" },
]
export const applicationStatus = lookup(APPLICATION_STATUSES)

/** Statuses that count as "the company responded". */
export const RESPONDED_STATUSES: ApplicationStatus[] = ["recruiter", "technical", "hr", "offer"]
export const INTERVIEW_STAGE_STATUSES: ApplicationStatus[] = ["technical", "hr", "offer"]

export const WORK_MODES: readonly Option<WorkMode>[] = [
  { value: "remote", label: "Remote", tone: "teal" },
  { value: "hybrid", label: "Hybrid", tone: "blue" },
  { value: "onsite", label: "On-site", tone: "neutral" },
]
export const workMode = lookup(WORK_MODES)

export const PRIORITIES: readonly Option<Priority>[] = [
  { value: "low", label: "Low", tone: "neutral" },
  { value: "medium", label: "Medium", tone: "amber" },
  { value: "high", label: "High", tone: "red" },
]
export const priority = lookup(PRIORITIES)

export const COMPANY_STATUSES: readonly Option<CompanyStatus>[] = [
  { value: "researching", label: "Researching", tone: "neutral" },
  { value: "target", label: "Target", tone: "violet" },
  { value: "active", label: "Active", tone: "green" },
  { value: "paused", label: "Paused", tone: "amber" },
  { value: "closed", label: "Closed", tone: "red" },
]
export const companyStatus = lookup(COMPANY_STATUSES)

export const RELATIONSHIPS: readonly Option<Relationship>[] = [
  { value: "recruiter", label: "Recruiter", tone: "teal" },
  { value: "hiring_manager", label: "Hiring Manager", tone: "violet" },
  { value: "employee", label: "Employee", tone: "blue" },
  { value: "referral", label: "Referral", tone: "green" },
  { value: "friend", label: "Friend", tone: "amber" },
  { value: "professional", label: "Professional Connection", tone: "neutral" },
]
export const relationship = lookup(RELATIONSHIPS)

export const REFERRAL_STATUSES: readonly Option<ReferralStatus>[] = [
  { value: "not_contacted", label: "Not contacted", tone: "neutral" },
  { value: "request_sent", label: "Request sent", tone: "blue" },
  { value: "accepted", label: "Accepted", tone: "teal" },
  { value: "submitted", label: "Referral submitted", tone: "green" },
  { value: "declined", label: "Declined", tone: "red" },
  { value: "no_response", label: "No response", tone: "amber" },
]
export const referralStatus = lookup(REFERRAL_STATUSES)

export const INTERVIEW_TYPES: readonly Option<InterviewType>[] = [
  { value: "recruiter_screen", label: "Recruiter screen", tone: "teal" },
  { value: "technical", label: "Technical", tone: "violet" },
  { value: "system_design", label: "System design", tone: "blue" },
  { value: "behavioral", label: "Behavioral", tone: "amber" },
  { value: "hr", label: "HR", tone: "orange" },
  { value: "final", label: "Final round", tone: "green" },
]
export const interviewType = lookup(INTERVIEW_TYPES)

export const INTERVIEW_STATUSES: readonly Option<InterviewStatus>[] = [
  { value: "scheduled", label: "Scheduled", tone: "blue" },
  { value: "completed", label: "Completed", tone: "green" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
]
export const interviewStatus = lookup(INTERVIEW_STATUSES)

export const DOCUMENT_CATEGORIES: readonly Option<DocumentCategory>[] = [
  { value: "resume", label: "Resume", tone: "blue" },
  { value: "certificates", label: "Certificates", tone: "green" },
  { value: "experience", label: "Experience", tone: "violet" },
  { value: "personal", label: "Personal", tone: "amber" },
  { value: "projects", label: "Projects", tone: "teal" },
  { value: "other", label: "Other", tone: "neutral" },
]
export const documentCategory = lookup(DOCUMENT_CATEGORIES)

export const TEMPLATE_CATEGORIES: readonly Option<TemplateCategory>[] = [
  { value: "referral", label: "Referral", tone: "green" },
  { value: "outreach", label: "Outreach", tone: "blue" },
  { value: "follow_up", label: "Follow-up", tone: "amber" },
  { value: "interview", label: "Interview", tone: "violet" },
  { value: "other", label: "Other", tone: "neutral" },
]
export const templateCategory = lookup(TEMPLATE_CATEGORIES)

export const PROJECT_STATUSES: readonly Option<ProjectStatus>[] = [
  { value: "idea", label: "Idea", tone: "neutral" },
  { value: "planning", label: "Planning", tone: "amber" },
  { value: "development", label: "Development", tone: "blue" },
  { value: "completed", label: "Completed", tone: "green" },
  { value: "archived", label: "Archived", tone: "neutral" },
]
export const projectStatus = lookup(PROJECT_STATUSES)

export const TASK_PRIORITIES: readonly Option<TaskPriority>[] = [
  { value: "low", label: "Low", tone: "neutral" },
  { value: "medium", label: "Medium", tone: "blue" },
  { value: "high", label: "High", tone: "amber" },
  { value: "critical", label: "Critical", tone: "red" },
]
export const taskPriority = lookup(TASK_PRIORITIES)

export const TASK_STATUSES: readonly Option<TaskStatus>[] = [
  { value: "todo", label: "To do", tone: "neutral" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "done", label: "Done", tone: "green" },
]
export const taskStatus = lookup(TASK_STATUSES)

export const NOTE_CATEGORIES: readonly Option<NoteCategory>[] = [
  { value: "dsa", label: "DSA", tone: "violet" },
  { value: "system_design", label: "System Design", tone: "blue" },
  { value: "react", label: "React", tone: "teal" },
  { value: "nextjs", label: "Next.js", tone: "neutral" },
  { value: "nodejs", label: "Node.js", tone: "green" },
  { value: "ai", label: "AI", tone: "orange" },
  { value: "career", label: "Career", tone: "amber" },
  { value: "projects", label: "Projects", tone: "blue" },
  { value: "personal", label: "Personal", tone: "red" },
]
export const noteCategory = lookup(NOTE_CATEGORIES)

export const SKILL_GROUPS: readonly Option<SkillGroup>[] = [
  { value: "frontend", label: "Frontend", tone: "blue" },
  { value: "backend", label: "Backend", tone: "green" },
  { value: "mobile", label: "Mobile", tone: "violet" },
  { value: "database", label: "Database", tone: "amber" },
  { value: "cloud", label: "Cloud", tone: "teal" },
  { value: "ai", label: "AI", tone: "orange" },
  { value: "tools", label: "Tools", tone: "neutral" },
]
export const skillGroup = lookup(SKILL_GROUPS)

export function proficiencyLabel(value: number): string {
  if (value >= 85) return "Expert"
  if (value >= 70) return "Advanced"
  if (value >= 50) return "Intermediate"
  return "Beginner"
}

export const LINK_CATEGORIES: readonly Option<LinkCategory>[] = [
  { value: "jobs", label: "Jobs", tone: "blue" },
  { value: "learning", label: "Learning", tone: "violet" },
  { value: "tools", label: "Tools", tone: "teal" },
  { value: "documentation", label: "Documentation", tone: "neutral" },
  { value: "career", label: "Career", tone: "amber" },
  { value: "projects", label: "Projects", tone: "green" },
  { value: "resources", label: "Resources", tone: "orange" },
]
export const linkCategory = lookup(LINK_CATEGORIES)
