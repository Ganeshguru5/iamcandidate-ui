import {
  ActivityIcon,
  AwardIcon,
  BookmarkIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarClockIcon,
  CheckSquareIcon,
  FileTextIcon,
  FolderKanbanIcon,
  FolderOpenIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MailIcon,
  PlugIcon,
  SettingsIcon,
  SparklesIcon,
  StickyNoteIcon,
  UserCogIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  /** Only shown to admins (API mode). */
  adminOnly?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      { title: "Documents", href: "/documents", icon: FolderOpenIcon },
    ],
  },
  {
    label: "Career",
    items: [
      { title: "Applications", href: "/career/applications", icon: BriefcaseBusinessIcon },
      { title: "Companies", href: "/career/companies", icon: Building2Icon },
      { title: "Contacts", href: "/career/contacts", icon: UsersIcon },
      { title: "Referrals", href: "/career/referrals", icon: HandshakeIcon },
      { title: "Interviews", href: "/career/interviews", icon: CalendarClockIcon },
      { title: "Resumes", href: "/career/resumes", icon: FileTextIcon },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Email", href: "/communication/email", icon: MailIcon },
      { title: "Templates", href: "/communication/templates", icon: LayoutTemplateIcon },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Projects", href: "/workspace/projects", icon: FolderKanbanIcon },
      { title: "Tasks", href: "/workspace/tasks", icon: CheckSquareIcon },
      { title: "Notes", href: "/workspace/notes", icon: StickyNoteIcon },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { title: "Skills", href: "/knowledge/skills", icon: SparklesIcon },
      { title: "Certifications", href: "/knowledge/certifications", icon: AwardIcon },
      { title: "Links", href: "/knowledge/links", icon: BookmarkIcon },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Integrations", href: "/integrations", icon: PlugIcon },
      { title: "Activity", href: "/activity", icon: ActivityIcon },
      { title: "Users", href: "/admin/users", icon: UserCogIcon, adminOnly: true },
      { title: "Settings", href: "/settings", icon: SettingsIcon },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

/** Hides admin-only entries from everyone else. */
export function visibleNavItems(items: NavItem[], isAdmin: boolean): NavItem[] {
  return isAdmin ? items : items.filter((item) => !item.adminOnly)
}

export function findNavItem(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
