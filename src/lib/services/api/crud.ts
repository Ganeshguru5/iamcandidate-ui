import { apiClient, orUndefined, toPatch } from "@/lib/api/client"
import type { Entity, ID } from "@/lib/types"

import type { CrudService } from "../contracts"

/** {@link CrudService} over a standard REST resource (`/base`, `/base/{id}`). */
export class ApiCrudService<T extends Entity, TInput extends object> implements CrudService<T, TInput> {
  constructor(protected readonly base: string) {}

  protected path(id?: ID) {
    return id === undefined ? this.base : `${this.base}/${encodeURIComponent(id)}`
  }

  list(): Promise<T[]> {
    return apiClient.get<T[]>(this.path())
  }

  get(id: ID): Promise<T | undefined> {
    return orUndefined(apiClient.get<T>(this.path(id)))
  }

  create(input: TInput): Promise<T> {
    return apiClient.post<T>(this.path(), input)
  }

  update(id: ID, patch: Partial<TInput>): Promise<T> {
    return apiClient.put<T>(this.path(id), toPatch(patch))
  }

  remove(id: ID): Promise<void> {
    return apiClient.delete(this.path(id))
  }
}
