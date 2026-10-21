"use client"

import type { CrudService } from "@/lib/services"
import type { Entity, ID } from "@/lib/types"

import { removeItem, upsertItem, useMutation } from "./query"

/** Standard create/update/delete mutation hooks for a simple CRUD resource. */
export function createCrudHooks<T extends Entity, TInput>(
  service: CrudService<T, TInput>,
  key: string,
  noun: string,
) {
  const lower = noun.toLowerCase()
  return {
    useCreate: () =>
      useMutation((input: TInput) => service.create(input), {
        onSuccess: (item) => upsertItem(key, item),
        success: `${noun} added`,
        error: `Couldn't add ${lower}`,
      }),
    useUpdate: (options: { silent?: boolean } = {}) =>
      useMutation((id: ID, patch: Partial<TInput>) => service.update(id, patch), {
        onSuccess: (item) => upsertItem(key, item),
        success: options.silent ? undefined : `${noun} updated`,
        error: `Couldn't update ${lower}`,
      }),
    useDelete: () =>
      useMutation((id: ID) => service.remove(id), {
        onSuccess: (_, id) => removeItem(key, id),
        success: `${noun} deleted`,
        error: `Couldn't delete ${lower}`,
      }),
  }
}
