import type { Activity, Integration } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

export function seedIntegrations(): Integration[] {
  return [
    { id: "google_drive", name: "Google Drive", description: "Browse and sync resumes, certificates and project files from Drive.", category: "Storage", status: "connected", account: "ganeshguru@example.com", lastSyncedAt: daysFromNow(0, 7, 30) },
    { id: "smtp", name: "SMTP", description: "Send outreach and follow-up emails from your own mailbox.", category: "Email", status: "connected", account: "smtp.example.com", lastSyncedAt: daysFromNow(-2, 10) },
    { id: "github", name: "GitHub", description: "Link repositories to projects and track recent activity.", category: "Developer", status: "coming_soon" },
    { id: "google_calendar", name: "Google Calendar", description: "Sync interviews and follow-ups to your calendar.", category: "Calendar", status: "coming_soon" },
    { id: "linkedin", name: "LinkedIn", description: "Import contacts and saved jobs.", category: "Career", status: "coming_soon" },
    { id: "aws", name: "AWS S3", description: "Back up documents to your own S3 bucket.", category: "Storage", status: "coming_soon" },
  ]
}

export function seedActivities(): Activity[] {
  return [
    { id: "act_1", type: "email_sent", title: "Email sent to Anivar A Aravind", description: "Referral request — Mobile Engineer (HM-48877)", date: daysFromNow(-1, 9, 45), entity: { type: "email", id: "em_7" } },
    { id: "act_2", type: "referral_requested", title: "Referral request sent to Anivar", description: "H&M — Mobile Engineer — React Native", date: daysFromNow(-1, 9, 46), entity: { type: "referral", id: "ref_2" } },
    { id: "act_3", type: "interview_scheduled", title: "Interview scheduled", description: "H&M — Technical interview", date: daysFromNow(-3, 16, 20), entity: { type: "interview", id: "int_1" } },
    { id: "act_4", type: "resume_updated", title: "Resume updated", description: "Frontend Engineer resume → v3.2", date: daysFromNow(-2, 11, 0), entity: { type: "resume", id: "res_frontend" } },
    { id: "act_5", type: "application_created", title: "Applied to H&M — Frontend Engineer", date: daysFromNow(-9, 11, 0), entity: { type: "application", id: "app_hm_fe" } },
    { id: "act_6", type: "document_uploaded", title: "Document uploaded", description: "Personal_OS_Architecture.pdf", date: daysFromNow(-5, 10, 0), entity: { type: "document", id: "doc_pos_arch" } },
    { id: "act_7", type: "application_status_changed", title: "Apeiron moved to Offer", description: "Frontend Engineer", date: daysFromNow(-1, 17, 45), entity: { type: "application", id: "app_apeiron_fe" } },
    { id: "act_8", type: "task_completed", title: "Task completed", description: "Submit Tether take-home", date: daysFromNow(-2, 21, 0), entity: { type: "task", id: "tsk_10" } },
    { id: "act_9", type: "note_created", title: "Note created", description: "Salary negotiation script", date: daysFromNow(-1, 8, 30), entity: { type: "note", id: "note_7" } },
    { id: "act_10", type: "application_created", title: "Applied to Postman — Software Engineer, Web", date: daysFromNow(-2, 11, 0), entity: { type: "application", id: "app_postman_fe" } },
    { id: "act_11", type: "drive_synced", title: "Google Drive synced", description: "16 files up to date", date: daysFromNow(0, 7, 30), entity: { type: "integration", id: "google_drive" } },
    { id: "act_12", type: "email_sent", title: "Email sent to Neha Sharma", description: "Following up — Software Engineer, Frontend", date: daysFromNow(-3, 10, 0), entity: { type: "email", id: "em_9" } },
    { id: "act_13", type: "application_status_changed", title: "Nomni moved to HR", description: "Full Stack Engineer", date: daysFromNow(-3, 15, 5), entity: { type: "application", id: "app_nomni_fs" } },
    { id: "act_14", type: "contact_added", title: "Contact added", description: "Sofia Alvarez · Nomni", date: daysFromNow(-12, 12, 0), entity: { type: "contact", id: "ct_sofia" } },
  ]
}
