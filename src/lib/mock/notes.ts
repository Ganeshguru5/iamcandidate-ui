import type { Note } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<Note, "createdAt" | "updatedAt" | "favorite"> & { age: number; favorite?: boolean }

export function seedNotes(): Note[] {
  const seeds: Seed[] = [
    { id: "note_1", title: "Sliding window patterns", category: "dsa", tags: ["arrays", "two-pointers"], favorite: true, age: 2, content: "Use when the problem asks for a contiguous subarray/substring that satisfies a constraint.\n\n1. Expand the right pointer and add to window state.\n2. While the window is invalid, shrink from the left.\n3. Record the answer after each valid expansion.\n\nClassic problems: longest substring without repeats, minimum window substring, max sum subarray of size k." },
    { id: "note_2", title: "Designing a rate limiter", category: "system_design", tags: ["scalability", "redis"], favorite: true, age: 4, content: "Algorithms: token bucket (bursty), leaky bucket (smooth), fixed window (simple, edge spikes), sliding log (accurate, memory heavy), sliding window counter (good trade-off).\n\nStore counters in Redis with INCR + EXPIRE. Return 429 with Retry-After." },
    { id: "note_3", title: "React Server Components mental model", category: "react", tags: ["rsc", "performance"], age: 6, content: "Server components render on the server and send a serialized tree. They can't use state or effects. Client components are islands of interactivity marked with 'use client'. Pass server data down as props; keep client boundaries small." },
    { id: "note_4", title: "Next.js caching with Cache Components", category: "nextjs", tags: ["caching", "ppr"], age: 3, content: "With cacheComponents, data fetching is dynamic by default. Mark cacheable work with 'use cache' and control lifetime via cacheLife. The static shell is prerendered; dynamic holes stream in behind Suspense." },
    { id: "note_5", title: "Node.js event loop phases", category: "nodejs", tags: ["runtime"], age: 20, content: "timers → pending callbacks → idle/prepare → poll → check (setImmediate) → close callbacks. process.nextTick and promise microtasks run between each phase." },
    { id: "note_6", title: "Prompting checklist for coding agents", category: "ai", tags: ["llm", "workflow"], age: 9, content: "Give the goal and constraints, point to existing conventions, ask for verification steps (typecheck, lint, build) and ask for a short summary of trade-offs." },
    { id: "note_7", title: "Salary negotiation script", category: "career", tags: ["offers", "negotiation"], favorite: true, age: 1, content: "Thank them, express excitement, anchor with market data, ask about flexibility on base vs. joining bonus, and never accept on the call — ask for 48 hours." },
    { id: "note_8", title: "Personal OS — v1 scope", category: "projects", tags: ["personal-os", "planning"], age: 12, content: "v1: dashboard, applications kanban, contacts CRM, documents, email templates. v2: real backend, Drive sync, calendar integration." },
    { id: "note_9", title: "Weekly review template", category: "personal", tags: ["habits"], age: 30, content: "Wins, misses, what I learned, next week's top 3, people to follow up with." },
  ]
  return seeds.map(({ age, ...seed }) => ({
    favorite: false,
    ...seed,
    createdAt: daysFromNow(-age - 5),
    updatedAt: daysFromNow(-age, 9),
  }))
}
