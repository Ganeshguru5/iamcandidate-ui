import type { Bookmark, Certification, Skill } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

export function seedSkills(): Skill[] {
  return [
    { id: "sk_react", name: "React", group: "frontend", proficiency: 92, years: 5 },
    { id: "sk_next", name: "Next.js", group: "frontend", proficiency: 88, years: 4 },
    { id: "sk_ts", name: "TypeScript", group: "frontend", proficiency: 90, years: 4 },
    { id: "sk_tailwind", name: "Tailwind CSS", group: "frontend", proficiency: 86, years: 3 },
    { id: "sk_a11y", name: "Accessibility", group: "frontend", proficiency: 70, years: 2 },
    { id: "sk_node", name: "Node.js", group: "backend", proficiency: 74, years: 3 },
    { id: "sk_express", name: "Express", group: "backend", proficiency: 70, years: 3 },
    { id: "sk_python", name: "Python", group: "backend", proficiency: 58, years: 2 },
    { id: "sk_rn", name: "React Native", group: "mobile", proficiency: 82, years: 3 },
    { id: "sk_expo", name: "Expo", group: "mobile", proficiency: 76, years: 2 },
    { id: "sk_pg", name: "PostgreSQL", group: "database", proficiency: 66, years: 2 },
    { id: "sk_mongo", name: "MongoDB", group: "database", proficiency: 62, years: 2 },
    { id: "sk_firebase", name: "Firebase", group: "database", proficiency: 72, years: 3 },
    { id: "sk_aws", name: "AWS", group: "cloud", proficiency: 50, years: 1 },
    { id: "sk_vercel", name: "Vercel", group: "cloud", proficiency: 80, years: 3 },
    { id: "sk_llm", name: "LLM integration", group: "ai", proficiency: 60, years: 1 },
    { id: "sk_rag", name: "RAG pipelines", group: "ai", proficiency: 42, years: 1 },
    { id: "sk_docker", name: "Docker", group: "tools", proficiency: 60, years: 2 },
    { id: "sk_git", name: "Git", group: "tools", proficiency: 88, years: 5 },
    { id: "sk_figma", name: "Figma", group: "tools", proficiency: 68, years: 3 },
  ]
}

export function seedCertifications(): Certification[] {
  return [
    { id: "cert_ux", name: "Google UX Design", issuer: "Google · Coursera", issueDate: daysFromNow(-150), credentialId: "GUX-8H2K4L", credentialUrl: "https://coursera.org/verify/GUX-8H2K4L", documentId: "doc_google_ux", skills: ["UX research", "Figma", "Prototyping"] },
    { id: "cert_rwd", name: "Responsive Web Design", issuer: "freeCodeCamp", issueDate: daysFromNow(-400), credentialId: "fcc-rwd-alexmorgan", credentialUrl: "https://freecodecamp.org/certification/alexmorgan-demo/responsive-web-design", documentId: "doc_fcc_rwd", skills: ["HTML", "CSS", "Flexbox", "Grid"] },
    { id: "cert_js", name: "JavaScript Algorithms and Data Structures", issuer: "freeCodeCamp", issueDate: daysFromNow(-360), credentialId: "fcc-jsads-alexmorgan", credentialUrl: "https://freecodecamp.org/certification/alexmorgan-demo/javascript-algorithms-and-data-structures", skills: ["JavaScript", "Algorithms"] },
    { id: "cert_fdl", name: "Front End Development Libraries", issuer: "freeCodeCamp", issueDate: daysFromNow(-320), credentialId: "fcc-fdl-alexmorgan", credentialUrl: "https://freecodecamp.org/certification/alexmorgan-demo/front-end-development-libraries", skills: ["React", "Redux", "Bootstrap"] },
    { id: "cert_d3", name: "Data Visualization with D3", issuer: "freeCodeCamp", issueDate: daysFromNow(-280), credentialId: "fcc-d3-alexmorgan", credentialUrl: "https://freecodecamp.org/certification/alexmorgan-demo/data-visualization", skills: ["D3", "SVG"] },
    { id: "cert_react", name: "Meta Front-End Developer: React", issuer: "Meta · Coursera", issueDate: daysFromNow(-90), credentialId: "META-RCT-77Q2", credentialUrl: "https://coursera.org/verify/META-RCT-77Q2", documentId: "doc_react_cert", skills: ["React", "Testing"] },
  ]
}

export function seedBookmarks(): Bookmark[] {
  const b = (bookmark: Omit<Bookmark, "createdAt" | "favorite"> & { favorite?: boolean; age: number }): Bookmark => {
    const { age, ...rest } = bookmark
    return { favorite: false, ...rest, createdAt: daysFromNow(-age) }
  }
  return [
    b({ id: "bm_1", title: "Wellfound — Remote frontend jobs", url: "https://wellfound.com/jobs", description: "Startup roles with salary ranges up front.", tags: ["remote", "startups"], category: "jobs", favorite: true, age: 10 }),
    b({ id: "bm_2", title: "LinkedIn Jobs — saved search", url: "https://linkedin.com/jobs", description: "Frontend Engineer · Chennai / Bengaluru / Remote", tags: ["search"], category: "jobs", age: 20 }),
    b({ id: "bm_3", title: "Next.js documentation", url: "https://nextjs.org/docs", description: "App Router, caching and Cache Components.", tags: ["nextjs", "docs"], category: "documentation", favorite: true, age: 40 }),
    b({ id: "bm_4", title: "React docs — Reference", url: "https://react.dev/reference/react", description: "Hooks, APIs and the new Activity component.", tags: ["react"], category: "documentation", age: 50 }),
    b({ id: "bm_5", title: "shadcn/ui", url: "https://ui.shadcn.com", description: "Component recipes built on Base UI.", tags: ["ui", "components"], category: "tools", favorite: true, age: 30 }),
    b({ id: "bm_6", title: "Excalidraw", url: "https://excalidraw.com", description: "Whiteboard for system design practice.", tags: ["diagrams"], category: "tools", age: 60 }),
    b({ id: "bm_7", title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", description: "Classic reading list for system design interviews.", tags: ["system-design"], category: "learning", favorite: true, age: 90 }),
    b({ id: "bm_8", title: "NeetCode 150", url: "https://neetcode.io/practice", description: "Curated DSA problem list.", tags: ["dsa"], category: "learning", age: 70 }),
    b({ id: "bm_9", title: "Levels.fyi — India", url: "https://levels.fyi", description: "Compensation benchmarks by company and level.", tags: ["salary"], category: "career", age: 15 }),
    b({ id: "bm_10", title: "Tech Interview Handbook", url: "https://techinterviewhandbook.org", description: "Behavioral questions and negotiation guides.", tags: ["interviews"], category: "career", age: 25 }),
    b({ id: "bm_11", title: "knot repository", url: "https://github.com/knot-demo/knot", description: "Source for this dashboard.", tags: ["knot"], category: "projects", age: 5 }),
    b({ id: "bm_12", title: "Refactoring UI", url: "https://refactoringui.com", description: "Practical visual design tactics for developers.", tags: ["design"], category: "resources", age: 120 }),
  ]
}
