import type { Resume, ResumeEducation, ResumeExperience } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

const experience: ResumeExperience[] = [
  {
    id: "exp_1",
    company: "Northwind Labs",
    title: "Frontend Engineer",
    period: "2023 — Present",
    highlights: [
      "Led migration of a 120-screen admin suite to Next.js App Router, cutting LCP by 38%.",
      "Built a shared component library on shadcn/ui used by 4 product teams.",
      "Introduced typed service layer and mock adapters so UI work ships ahead of APIs.",
    ],
  },
  {
    id: "exp_2",
    company: "Cedar & Pine Studio",
    title: "Software Engineer",
    period: "2021 — 2023",
    highlights: [
      "Shipped a React Native field-service app to 8k monthly users.",
      "Owned offline sync and background uploads for photos and documents.",
    ],
  },
]

const education: ResumeEducation[] = [
  { id: "edu_1", school: "State Technical University", degree: "B.E. Computer Science", period: "2017 — 2021" },
]

export function seedResumes(): Resume[] {
  return [
    { id: "res_frontend", title: "Frontend Engineer", targetRole: "Frontend Engineer", version: "v3.2", isDefault: true, summary: "Frontend engineer with 4+ years building fast, accessible React and Next.js products. Comfortable owning design systems, performance and DX.", skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Testing Library", "Web Performance"], experience, education, documentId: "doc_resume_fe", createdAt: daysFromNow(-120), updatedAt: daysFromNow(-2) },
    { id: "res_rn", title: "React Native Developer", targetRole: "React Native Developer", version: "v2.0", isDefault: false, summary: "Mobile-focused engineer shipping React Native apps with offline-first data and native modules.", skills: ["React Native", "Expo", "TypeScript", "Redux Toolkit", "Reanimated"], experience, education, createdAt: daysFromNow(-90), updatedAt: daysFromNow(-14) },
    { id: "res_fullstack", title: "Full Stack Developer", targetRole: "Full Stack Engineer", version: "v1.4", isDefault: false, summary: "Full stack engineer comfortable across Next.js, Node.js and PostgreSQL, with a product mindset.", skills: ["Next.js", "Node.js", "PostgreSQL", "Prisma", "AWS", "Docker"], experience, education, documentId: "doc_resume_fs", createdAt: daysFromNow(-80), updatedAt: daysFromNow(-6) },
    { id: "res_swe", title: "Software Engineer", targetRole: "Software Engineer", version: "v1.1", isDefault: false, summary: "Generalist software engineer with strong fundamentals in data structures, systems and web.", skills: ["TypeScript", "Python", "System Design", "React", "Git"], experience, education, createdAt: daysFromNow(-60), updatedAt: daysFromNow(-21) },
  ]
}
