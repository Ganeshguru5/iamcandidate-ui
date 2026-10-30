import type { Project } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

export function seedProjects(): Project[] {
  return [
    { id: "prj_pos", name: "iamcandidate", description: "A personal command center for documents, job search, communication and knowledge.", status: "development", progress: 64, technologies: ["Next.js", "TypeScript", "shadcn/ui", "Tailwind CSS"], repository: "https://github.com/iamcandidate-demo/iamcandidate", deployment: "https://iamcandidate.example.com", startedAt: daysFromNow(-45), updatedAt: daysFromNow(0, 8) },
    { id: "prj_gigloop", name: "Gigloop", description: "Marketplace for freelance engineering teams with escrow-based milestones.", status: "planning", progress: 22, technologies: ["Next.js", "Node.js", "PostgreSQL", "Stripe"], repository: "https://github.com/alexmorgan-demo/gigloop", startedAt: daysFromNow(-20), updatedAt: daysFromNow(-2) },
    { id: "prj_secure_api", name: "API Guard", description: "CLI and dashboard that audits OpenAPI specs for auth and rate-limit gaps.", status: "development", progress: 48, technologies: ["TypeScript", "Node.js", "Docker"], repository: "https://github.com/alexmorgan-demo/api-guard", startedAt: daysFromNow(-70), updatedAt: daysFromNow(-4) },
    { id: "prj_dms_ai", name: "DMS AI", description: "Document management with semantic search and auto-tagging using embeddings.", status: "idea", progress: 5, technologies: ["Python", "FastAPI", "pgvector", "React"], startedAt: daysFromNow(-6), updatedAt: daysFromNow(-6) },
    { id: "prj_portfolio", name: "Portfolio", description: "Personal site with writing, case studies and a project showcase.", status: "completed", progress: 100, technologies: ["Next.js", "MDX", "Vercel"], repository: "https://github.com/alexmorgan-demo/portfolio", deployment: "https://alexmorgan.example.com", startedAt: daysFromNow(-160), updatedAt: daysFromNow(-30) },
    { id: "prj_rn_expense", name: "Expense Tracker App", description: "Offline-first React Native expense tracker. Superseded by iamcandidate.", status: "archived", progress: 80, technologies: ["React Native", "Expo", "SQLite"], repository: "https://github.com/alexmorgan-demo/expense-tracker", startedAt: daysFromNow(-400), updatedAt: daysFromNow(-200) },
  ]
}
