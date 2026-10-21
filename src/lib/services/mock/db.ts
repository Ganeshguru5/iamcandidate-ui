import { createSeedDatabase, type MockDatabase } from "@/lib/mock"
import type { Activity, Entity, ID } from "@/lib/types"
import { createId } from "@/lib/utils/id"

/**
 * In-browser "database" for the mock services. Seeded from `@/lib/mock`,
 * persisted to localStorage so the prototype survives reloads. Only the mock
 * service layer may import this module — UI code goes through services.
 */
const STORAGE_KEY = "pos:db:v1"

let db: MockDatabase | null = null

function load(): MockDatabase {
  if (db) return db
  const seed = createSeedDatabase()
  if (typeof window === "undefined") return seed
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    db = raw ? { ...seed, ...(JSON.parse(raw) as Partial<MockDatabase>) } : seed
  } catch {
    db = seed
  }
  persist()
  return db
}

function persist() {
  if (typeof window === "undefined" || !db) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or blocked — keep working in memory.
  }
}

export function read<K extends keyof MockDatabase>(key: K): MockDatabase[K] {
  return structuredClone(load()[key])
}

export function write<K extends keyof MockDatabase>(key: K, value: MockDatabase[K]) {
  load()[key] = structuredClone(value)
  persist()
}

export function resetDatabase() {
  db = createSeedDatabase()
  persist()
}

/* ------------------------------------------------------------------ */

export type CollectionKey = {
  [K in keyof MockDatabase]: MockDatabase[K] extends Entity[] ? K : never
}[keyof MockDatabase]

export type ItemOf<K extends CollectionKey> = MockDatabase[K][number]

export class NotFoundError extends Error {
  constructor(resource: string, id: ID) {
    super(`${resource} ${id} was not found`)
  }
}

/** Typed helpers for one collection in the mock database. */
export function collection<K extends CollectionKey>(key: K) {
  const all = () => read(key) as ItemOf<K>[]
  const save = (items: ItemOf<K>[]) => write(key, items as unknown as MockDatabase[K])

  return {
    all,
    find(id: ID): ItemOf<K> | undefined {
      return all().find((item) => item.id === id)
    },
    insert(item: ItemOf<K>): ItemOf<K> {
      save([item, ...all()])
      return item
    },
    patch(id: ID, patch: Partial<ItemOf<K>>): ItemOf<K> {
      const items = all()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) throw new NotFoundError(key, id)
      const next = { ...items[index], ...patch } as ItemOf<K>
      items[index] = next
      save(items)
      return next
    },
    replaceAll(items: ItemOf<K>[]) {
      save(items)
    },
    remove(id: ID) {
      save(all().filter((item) => item.id !== id))
    },
  }
}

export function logActivity(entry: Omit<Activity, "id" | "date">) {
  const activities = read("activities")
  write("activities", [
    { ...entry, id: createId("act"), date: new Date().toISOString() },
    ...activities,
  ].slice(0, 200))
}
