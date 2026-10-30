import type { DocumentFile, DriveItem } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<DocumentFile, "uploadedAt" | "updatedAt" | "starred" | "source"> & {
  age: number
  starred?: boolean
  source?: DocumentFile["source"]
}

export function seedDocuments(): DocumentFile[] {
  const seeds: Seed[] = [
    { id: "doc_resume_fe", name: "Alex_Morgan_Frontend_Resume.pdf", category: "resume", kind: "pdf", sizeBytes: 182_400, age: 2, starred: true, description: "Frontend resume v3.2 — default." },
    { id: "doc_resume_fs", name: "Alex_Morgan_FullStack_Resume.pdf", category: "resume", kind: "pdf", sizeBytes: 196_800, age: 6 },
    { id: "doc_resume_rn", name: "Alex_Morgan_ReactNative_Resume.pdf", category: "resume", kind: "pdf", sizeBytes: 171_200, age: 14 },
    { id: "doc_cover", name: "Cover_Letter_Template.docx", category: "resume", kind: "docx", sizeBytes: 38_900, age: 30 },
    { id: "doc_react_cert", name: "React_Certificate.pdf", category: "certificates", kind: "pdf", sizeBytes: 640_000, age: 90, starred: true },
    { id: "doc_google_ux", name: "Google_UIUX_Certificate.pdf", category: "certificates", kind: "pdf", sizeBytes: 812_000, age: 150 },
    { id: "doc_fcc_rwd", name: "FreeCodeCamp_Responsive_Web_Design.pdf", category: "certificates", kind: "pdf", sizeBytes: 402_000, age: 400 },
    { id: "doc_exp_letter", name: "Experience_Letter.pdf", category: "experience", kind: "pdf", sizeBytes: 254_000, age: 45 },
    { id: "doc_relieving", name: "Relieving_Letter_CedarPine.pdf", category: "experience", kind: "pdf", sizeBytes: 221_000, age: 420 },
    { id: "doc_payslips", name: "Payslips_2025.zip", category: "experience", kind: "zip", sizeBytes: 3_400_000, age: 60 },
    { id: "doc_passport", name: "Passport_Scan.png", category: "personal", kind: "image", sizeBytes: 1_250_000, age: 200 },
    { id: "doc_degree", name: "Degree_Certificate.pdf", category: "personal", kind: "pdf", sizeBytes: 980_000, age: 500 },
    { id: "doc_pos_arch", name: "Personal_OS_Architecture.pdf", category: "projects", kind: "pdf", sizeBytes: 1_820_000, age: 5, starred: true, source: "drive" },
    { id: "doc_gigloop_deck", name: "Gigloop_Pitch_Deck.pdf", category: "projects", kind: "pdf", sizeBytes: 5_600_000, age: 18, source: "drive" },
    { id: "doc_salary", name: "Salary_Benchmarks_2026.xlsx", category: "other", kind: "sheet", sizeBytes: 88_000, age: 10 },
    { id: "doc_interview_prep", name: "Interview_Prep_Checklist.docx", category: "other", kind: "docx", sizeBytes: 41_000, age: 3 },
  ]
  return seeds.map(({ age, ...seed }) => ({
    starred: false,
    source: "local",
    ...seed,
    uploadedAt: daysFromNow(-age, 10),
    updatedAt: daysFromNow(-age, 10),
  }))
}

export function seedDriveItems(): DriveItem[] {
  const f = (id: string, name: string, parentId: string | null, age: number): DriveItem => ({
    id,
    name,
    type: "folder",
    parentId,
    modifiedAt: daysFromNow(-age),
  })
  const file = (
    id: string,
    name: string,
    parentId: string,
    kind: DriveItem["kind"],
    sizeBytes: number,
    age: number,
  ): DriveItem => ({ id, name, type: "file", parentId, kind, sizeBytes, modifiedAt: daysFromNow(-age) })

  return [
    f("drv_resumes", "Resumes", null, 2),
    f("drv_certs", "Certificates", null, 40),
    f("drv_projects", "Projects", null, 5),
    f("drv_docs", "Documents", null, 12),
    file("drv_r1", "Frontend_Resume_v3.pdf", "drv_resumes", "pdf", 182_400, 2),
    file("drv_r2", "FullStack_Resume_v1.4.pdf", "drv_resumes", "pdf", 196_800, 6),
    file("drv_r3", "Resume_Archive_2024.zip", "drv_resumes", "zip", 2_300_000, 210),
    file("drv_c1", "React_Certificate.pdf", "drv_certs", "pdf", 640_000, 90),
    file("drv_c2", "Google_UX_Design.pdf", "drv_certs", "pdf", 812_000, 150),
    f("drv_p_pos", "iamcandidate", "drv_projects", 5),
    file("drv_p1", "Personal_OS_Architecture.pdf", "drv_p_pos", "pdf", 1_820_000, 5),
    file("drv_p2", "Wireframes.png", "drv_p_pos", "image", 2_100_000, 9),
    file("drv_p3", "Gigloop_Pitch_Deck.pdf", "drv_projects", "pdf", 5_600_000, 18),
    file("drv_d1", "Offer_Letter_Northwind.pdf", "drv_docs", "pdf", 310_000, 1),
    file("drv_d2", "Tax_Declaration_2026.pdf", "drv_docs", "pdf", 145_000, 30),
    file("drv_d3", "Job_Search_Tracker.xlsx", "drv_docs", "sheet", 64_000, 12),
  ]
}
