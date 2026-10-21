import {
  ArrowRightLeftIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  FolderKanbanIcon,
  HandshakeIcon,
  PlugIcon,
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
  StickyNoteIcon,
  Trash2Icon,
  UploadIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react"

import type { Tone } from "@/lib/constants"
import type { Activity, ActivityType } from "@/lib/types"

export const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; tone: Tone; label: string }> = {
  application_created: { icon: BriefcaseBusinessIcon, tone: "blue", label: "Applications" },
  application_status_changed: { icon: ArrowRightLeftIcon, tone: "violet", label: "Applications" },
  application_deleted: { icon: Trash2Icon, tone: "neutral", label: "Applications" },
  email_sent: { icon: SendIcon, tone: "teal", label: "Email" },
  resume_updated: { icon: FileTextIcon, tone: "amber", label: "Resumes" },
  document_uploaded: { icon: UploadIcon, tone: "blue", label: "Documents" },
  document_deleted: { icon: Trash2Icon, tone: "neutral", label: "Documents" },
  task_created: { icon: CheckCircle2Icon, tone: "neutral", label: "Tasks" },
  task_completed: { icon: CheckCircle2Icon, tone: "green", label: "Tasks" },
  referral_requested: { icon: HandshakeIcon, tone: "green", label: "Referrals" },
  interview_scheduled: { icon: CalendarClockIcon, tone: "violet", label: "Interviews" },
  note_created: { icon: StickyNoteIcon, tone: "amber", label: "Notes" },
  contact_added: { icon: UserPlusIcon, tone: "teal", label: "Contacts" },
  company_added: { icon: Building2Icon, tone: "neutral", label: "Companies" },
  project_updated: { icon: FolderKanbanIcon, tone: "blue", label: "Projects" },
  integration_connected: { icon: PlugIcon, tone: "green", label: "Integrations" },
  integration_disconnected: { icon: PlugIcon, tone: "red", label: "Integrations" },
  drive_synced: { icon: RefreshCwIcon, tone: "teal", label: "Integrations" },
  settings_updated: { icon: SettingsIcon, tone: "neutral", label: "Settings" },
}

export function activityHref(activity: Activity): string | undefined {
  const entity = activity.entity
  if (!entity) return undefined
  switch (entity.type) {
    case "application":
      return `/career/applications/${entity.id}`
    case "company":
      return `/career/companies/${entity.id}`
    case "contact":
      return `/career/contacts?contact=${entity.id}`
    case "referral":
      return "/career/referrals"
    case "interview":
      return "/career/interviews"
    case "resume":
      return `/career/resumes/${entity.id}`
    case "document":
      return `/documents?file=${entity.id}`
    case "email":
      return `/communication/email?folder=sent&email=${entity.id}`
    case "template":
      return "/communication/templates"
    case "project":
      return "/workspace/projects"
    case "task":
      return "/workspace/tasks"
    case "note":
      return `/workspace/notes?note=${entity.id}`
    case "integration":
      return "/integrations"
  }
}
