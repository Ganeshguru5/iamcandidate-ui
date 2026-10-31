"use client"

import { useMemo } from "react"

import {
  activityService,
  applicationService,
  boardService,
  bookmarkService,
  certificationService,
  companyService,
  contactService,
  dashboardService,
  documentService,
  driveService,
  emailService,
  integrationService,
  interviewService,
  noteService,
  notificationService,
  portfolioService,
  projectService,
  referralService,
  resumeService,
  settingsService,
  skillService,
  smtpService,
  taskService,
  templateService,
  userService,
} from "@/lib/services"
import type { DriveItem, Entity, ID } from "@/lib/types"

import { useQuery } from "./query"

/** Query keys shared by readers and mutations. */
export const QK = {
  applications: "applications",
  companies: "companies",
  contacts: "contacts",
  referrals: "referrals",
  interviews: "interviews",
  resumes: "resumes",
  documents: "documents",
  drive: "drive",
  emails: "emails",
  templates: "templates",
  smtp: "smtp",
  projects: "projects",
  tasks: "tasks",
  notes: "notes",
  board: "board",
  skills: "skills",
  certifications: "certifications",
  bookmarks: "bookmarks",
  activities: "activities",
  dashboard: "dashboard",
  notifications: "notifications",
  integrations: "integrations",
  profile: "profile",
  autofill: "autofill",
  notificationPreferences: "notificationPreferences",
  users: "users",
  accessRequests: "accessRequests",
  portfolio: "portfolio",
} as const

// Fetchers are module-level so their identity is stable across renders.
const fetchers = {
  applications: () => applicationService.getApplications(),
  companies: () => companyService.getCompanies(),
  contacts: () => contactService.getContacts(),
  referrals: () => referralService.list(),
  interviews: () => interviewService.list(),
  resumes: () => resumeService.getResumes(),
  documents: () => documentService.getDocuments(),
  emails: () => emailService.getEmails(),
  templates: () => templateService.list(),
  smtp: () => smtpService.getConfig(),
  projects: () => projectService.list(),
  tasks: () => taskService.getTasks(),
  notes: () => noteService.list(),
  board: () => boardService.get(),
  skills: () => skillService.list(),
  certifications: () => certificationService.list(),
  bookmarks: () => bookmarkService.list(),
  activities: () => activityService.getActivities(),
  dashboard: () => dashboardService.getSummary(),
  notifications: () => notificationService.getNotifications(),
  integrations: () => integrationService.getIntegrations(),
  profile: () => settingsService.getProfile(),
  autofill: () => settingsService.getAutofill(),
  notificationPreferences: () => settingsService.getNotificationPreferences(),
  users: () => userService.list(),
  accessRequests: () => userService.listAccessRequests(),
  portfolio: () => portfolioService.get(),
}

export const useApplications = () => useQuery(QK.applications, fetchers.applications)
export const useCompanies = () => useQuery(QK.companies, fetchers.companies)
export const useContacts = () => useQuery(QK.contacts, fetchers.contacts)
export const useReferrals = () => useQuery(QK.referrals, fetchers.referrals)
export const useInterviews = () => useQuery(QK.interviews, fetchers.interviews)
export const useResumes = () => useQuery(QK.resumes, fetchers.resumes)
export const useDocuments = () => useQuery(QK.documents, fetchers.documents)
export const usePortfolio = () => useQuery(QK.portfolio, fetchers.portfolio)
const driveFetchers = new Map<string, () => Promise<DriveItem[]>>()

/**
 * One Drive folder (`null` = My Drive), cached per folder under `drive:<id>`.
 * Nothing is requested while `enabled` is false (e.g. Drive not connected).
 */
export function useDriveFolder(parentId: ID | null, enabled = true) {
  const key = enabled ? `${QK.drive}:${parentId ?? "root"}` : `${QK.drive}:disabled`
  let fetcher = driveFetchers.get(key)
  if (!fetcher) {
    fetcher = enabled ? () => driveService.listItems(parentId) : async () => []
    driveFetchers.set(key, fetcher)
  }
  return useQuery(key, fetcher)
}
export const useEmails = () => useQuery(QK.emails, fetchers.emails)
export const useTemplates = () => useQuery(QK.templates, fetchers.templates)
export const useSmtpConfig = () => useQuery(QK.smtp, fetchers.smtp)
export const useProjects = () => useQuery(QK.projects, fetchers.projects)
export const useTasks = () => useQuery(QK.tasks, fetchers.tasks)
export const useNotes = () => useQuery(QK.notes, fetchers.notes)
export const useBoard = () => useQuery(QK.board, fetchers.board)
export const useSkills = () => useQuery(QK.skills, fetchers.skills)
export const useCertifications = () => useQuery(QK.certifications, fetchers.certifications)
export const useBookmarks = () => useQuery(QK.bookmarks, fetchers.bookmarks)
export const useActivities = () => useQuery(QK.activities, fetchers.activities)
export const useDashboard = () => useQuery(QK.dashboard, fetchers.dashboard)
export const useNotifications = () => useQuery(QK.notifications, fetchers.notifications)
export const useIntegrations = () => useQuery(QK.integrations, fetchers.integrations)
export const useProfile = () => useQuery(QK.profile, fetchers.profile)
export const useAutofill = () => useQuery(QK.autofill, fetchers.autofill)
export const useNotificationPreferences = () =>
  useQuery(QK.notificationPreferences, fetchers.notificationPreferences)

export const useUsers = () => useQuery(QK.users, fetchers.users)
export const useAccessRequests = () => useQuery(QK.accessRequests, fetchers.accessRequests)

/** O(1) lookup map for an entity list. */
export function useById<T extends Entity>(items: T[] | undefined): Map<ID, T> {
  return useMemo(() => new Map((items ?? []).map((item) => [item.id, item])), [items])
}
