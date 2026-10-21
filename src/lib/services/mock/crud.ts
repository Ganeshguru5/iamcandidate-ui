import type { Activity, ID } from "@/lib/types"
import { createId } from "@/lib/utils/id"
import { delay, networkDelay } from "@/lib/utils/delay"

import type { CrudService } from "../contracts"
import { collection, logActivity, NotFoundError, type CollectionKey, type ItemOf } from "./db"

interface MockCrudOptions<K extends CollectionKey, TInput> {
  key: K
  idPrefix: string
  build: (input: TInput, id: ID, now: string) => ItemOf<K>
  touch?: (item: ItemOf<K>, now: string) => Partial<ItemOf<K>>
  onCreate?: (item: ItemOf<K>) => Omit<Activity, "id" | "date"> | undefined
}

/** Generic mock implementation of {@link CrudService} over one collection. */
export class MockCrudService<K extends CollectionKey, TInput>
  implements CrudService<ItemOf<K>, TInput>
{
  protected readonly store
  constructor(protected readonly options: MockCrudOptions<K, TInput>) {
    this.store = collection(options.key)
  }

  async list(): Promise<ItemOf<K>[]> {
    await delay(300)
    return this.store.all()
  }

  async get(id: ID): Promise<ItemOf<K> | undefined> {
    await delay(200)
    return this.store.find(id)
  }

  async create(input: TInput): Promise<ItemOf<K>> {
    await networkDelay()
    const now = new Date().toISOString()
    const item = this.store.insert(this.options.build(input, createId(this.options.idPrefix), now))
    const activity = this.options.onCreate?.(item)
    if (activity) logActivity(activity)
    return item
  }

  async update(id: ID, patch: Partial<TInput>): Promise<ItemOf<K>> {
    await networkDelay()
    const existing = this.store.find(id)
    if (!existing) throw new NotFoundError(this.options.key, id)
    const now = new Date().toISOString()
    return this.store.patch(id, {
      ...(patch as Partial<ItemOf<K>>),
      ...this.options.touch?.(existing, now),
    })
  }

  async remove(id: ID): Promise<void> {
    await networkDelay()
    this.store.remove(id)
  }
}
