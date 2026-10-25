import type { BoardItem } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<BoardItem, "createdAt" | "updatedAt"> & { age: number }

export function seedBoard(): BoardItem[] {
  const seeds: Seed[] = [
    { id: "brd_1", title: "Dev machine setup", kind: "code", color: "teal", pinned: true, tags: ["setup"], age: 1, content: "git config --global pull.rebase true\nnpm i -g pnpm tsx\ncode --install-extension dbaeumer.vscode-eslint" },
    { id: "brd_2", title: "Staging dashboard", kind: "link", color: "blue", pinned: false, tags: ["work"], age: 3, content: "https://staging.example.com/admin" },
    { id: "brd_3", title: "Standup notes", kind: "text", color: "amber", pinned: false, tags: [], age: 0, content: "Yesterday: finished the board sync API.\nToday: wire the UI and test on the laptop." },
  ]
  return seeds.map(({ age, ...seed }) => ({ ...seed, createdAt: daysFromNow(-age), updatedAt: daysFromNow(-age) }))
}
