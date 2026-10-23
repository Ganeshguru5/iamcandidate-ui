import type { Contact } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<Contact, "createdAt" | "notes"> & { notes?: string }

export function seedContacts(): Contact[] {
  const seeds: Seed[] = [
    { id: "ct_jordan", name: "Jordan Reyes", role: "Senior Software Engineer", companyId: "cmp_brightwave", email: "jordan.reyes@example.com", linkedin: "https://linkedin.com/in/knot-demo-jordan-reyes", relationship: "referral", lastContacted: daysFromNow(-3), nextFollowUp: daysFromNow(2), notes: "Former colleague. Happy to refer for frontend roles on the checkout team." },
    { id: "ct_maya", name: "Maya Patel", role: "Technical Recruiter", companyId: "cmp_brightwave", email: "maya.patel@example.com", linkedin: "https://linkedin.com/in/knot-demo-maya-patel", relationship: "recruiter", lastContacted: daysFromNow(-1), nextFollowUp: daysFromNow(3) },
    { id: "ct_elias", name: "Elias Weber", role: "Engineering Manager", companyId: "cmp_ledgerline", email: "elias@example.com", linkedin: "https://linkedin.com/in/knot-demo-elias-weber", relationship: "hiring_manager", lastContacted: daysFromNow(-5), nextFollowUp: daysFromNow(1) },
    { id: "ct_sofia", name: "Sofia Marin", role: "Talent Partner", companyId: "cmp_hearthly", email: "sofia@example.com", relationship: "recruiter", lastContacted: daysFromNow(-2), nextFollowUp: daysFromNow(4) },
    { id: "ct_ravi", name: "Ravi Natarajan", role: "Frontend Lead", companyId: "cmp_northwind", email: "ravi@example.com", linkedin: "https://linkedin.com/in/knot-demo-ravi-natarajan", relationship: "employee", lastContacted: daysFromNow(-8) },
    { id: "ct_nina", name: "Nina Kapoor", role: "HR Business Partner", companyId: "cmp_northwind", email: "nina.kapoor@example.com", relationship: "recruiter", lastContacted: daysFromNow(-1), nextFollowUp: daysFromNow(0) },
    { id: "ct_dev", name: "Dev Malhotra", role: "Software Engineer II", companyId: "cmp_freshpath", email: "dev.m@example.com", linkedin: "https://linkedin.com/in/knot-demo-dev-malhotra", relationship: "referral", lastContacted: daysFromNow(-12), nextFollowUp: daysFromNow(-1) },
    { id: "ct_tara", name: "Tara Joshi", role: "Product Designer", companyId: "cmp_cobalt", email: "tara@example.com", relationship: "friend", lastContacted: daysFromNow(-20) },
    { id: "ct_sam", name: "Sam Okafor", role: "Staff Engineer", companyId: "cmp_paywise", email: "sam.o@example.com", linkedin: "https://linkedin.com/in/knot-demo-sam-okafor", relationship: "professional", lastContacted: daysFromNow(-45) },
    { id: "ct_leah", name: "Leah Fernandes", role: "Technical Recruiter", companyId: "cmp_freshpath", email: "leah.f@example.com", relationship: "recruiter", lastContacted: daysFromNow(-6), nextFollowUp: daysFromNow(5) },
    { id: "ct_omar", name: "Omar Haddad", role: "Engineering Manager", companyId: "cmp_cobalt", email: "omar.h@example.com", relationship: "hiring_manager" },
    { id: "ct_emma", name: "Emma Lindqvist", role: "Developer Advocate", companyId: "cmp_relay", email: "emma@example.com", linkedin: "https://linkedin.com/in/knot-demo-emma-lindqvist", relationship: "professional", lastContacted: daysFromNow(-25) },
  ]
  return seeds.map((seed) => ({ notes: "", ...seed, createdAt: daysFromNow(-30) }))
}
