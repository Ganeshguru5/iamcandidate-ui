import type { Contact } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<Contact, "createdAt" | "notes"> & { notes?: string }

export function seedContacts(): Contact[] {
  const seeds: Seed[] = [
    { id: "ct_anivar", name: "Anivar A Aravind", role: "Senior Software Engineer", companyId: "cmp_hm", email: "anivar@example.com", linkedin: "https://linkedin.com/in/anivar", relationship: "referral", lastContacted: daysFromNow(-3), nextFollowUp: daysFromNow(2), notes: "Former colleague. Happy to refer for frontend roles on the checkout team." },
    { id: "ct_priya", name: "Priya Raman", role: "Technical Recruiter", companyId: "cmp_hm", email: "priya.raman@example.com", linkedin: "https://linkedin.com/in/priyaraman", relationship: "recruiter", lastContacted: daysFromNow(-1), nextFollowUp: daysFromNow(3) },
    { id: "ct_lukas", name: "Lukas Meyer", role: "Engineering Manager", companyId: "cmp_tether", email: "lukas@example.com", linkedin: "https://linkedin.com/in/lukasmeyer", relationship: "hiring_manager", lastContacted: daysFromNow(-5), nextFollowUp: daysFromNow(1) },
    { id: "ct_sofia", name: "Sofia Alvarez", role: "Talent Partner", companyId: "cmp_nomni", email: "sofia@example.com", relationship: "recruiter", lastContacted: daysFromNow(-2), nextFollowUp: daysFromNow(4) },
    { id: "ct_karthik", name: "Karthik Subramanian", role: "Frontend Lead", companyId: "cmp_apeiron", email: "karthik@example.com", linkedin: "https://linkedin.com/in/karthiks", relationship: "employee", lastContacted: daysFromNow(-8) },
    { id: "ct_divya", name: "Divya Menon", role: "HR Business Partner", companyId: "cmp_apeiron", email: "divya.menon@example.com", relationship: "recruiter", lastContacted: daysFromNow(-1), nextFollowUp: daysFromNow(0) },
    { id: "ct_arjun", name: "Arjun Krishnan", role: "Software Engineer II", companyId: "cmp_freshworks", email: "arjun.k@example.com", linkedin: "https://linkedin.com/in/arjunk", relationship: "referral", lastContacted: daysFromNow(-12), nextFollowUp: daysFromNow(-1) },
    { id: "ct_meera", name: "Meera Iyer", role: "Product Designer", companyId: "cmp_zoho", email: "meera@example.com", relationship: "friend", lastContacted: daysFromNow(-20) },
    { id: "ct_rahul", name: "Rahul Verma", role: "Staff Engineer", companyId: "cmp_razorpay", email: "rahul.v@example.com", linkedin: "https://linkedin.com/in/rahulverma", relationship: "professional", lastContacted: daysFromNow(-45) },
    { id: "ct_neha", name: "Neha Sharma", role: "Technical Recruiter", companyId: "cmp_freshworks", email: "neha.sharma@example.com", relationship: "recruiter", lastContacted: daysFromNow(-6), nextFollowUp: daysFromNow(5) },
    { id: "ct_vikram", name: "Vikram Rao", role: "Engineering Manager", companyId: "cmp_zoho", email: "vikram.rao@example.com", relationship: "hiring_manager" },
    { id: "ct_emma", name: "Emma Clarke", role: "Developer Advocate", companyId: "cmp_postman", email: "emma@example.com", linkedin: "https://linkedin.com/in/emmaclarke", relationship: "professional", lastContacted: daysFromNow(-25) },
  ]
  return seeds.map((seed) => ({ notes: "", ...seed, createdAt: daysFromNow(-30) }))
}
