"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

import type { Entity, ID } from "@/lib/types"

/**
 * A tiny shared query cache (think: a minimal react-query). Every page that
 * reads the same key shares one cached result, so a mutation on one screen
 * immediately updates every other screen that displays that data.
 */

export type QueryStatus = "idle" | "loading" | "success" | "error"

export interface QueryState<T> {
  data: T | undefined
  status: QueryStatus
  error: string | null
  isFetching: boolean
}

const IDLE: QueryState<never> = { data: undefined, status: "idle", error: null, isFetching: false }

const states = new Map<string, QueryState<unknown>>()
const fetchers = new Map<string, () => Promise<unknown>>()
const listeners = new Map<string, Set<() => void>>()

function getState<T>(key: string): QueryState<T> {
  return (states.get(key) as QueryState<T> | undefined) ?? IDLE
}

function setState<T>(key: string, next: QueryState<T>) {
  states.set(key, next)
  listeners.get(key)?.forEach((listener) => listener())
}

function subscribeKey(key: string, listener: () => void) {
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
}

export async function fetchQuery(key: string): Promise<void> {
  const fetcher = fetchers.get(key)
  if (!fetcher) return
  const prev = getState(key)
  if (prev.isFetching) return
  setState(key, {
    ...prev,
    status: prev.data === undefined ? "loading" : prev.status,
    isFetching: true,
  })
  try {
    const data = await fetcher()
    setState(key, { data, status: "success", error: null, isFetching: false })
  } catch (error) {
    setState(key, { ...getState(key), status: "error", error: errorMessage(error), isFetching: false })
  }
}

export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const subscribe = useCallback((listener: () => void) => subscribeKey(key, listener), [key])
  const state = useSyncExternalStore(
    subscribe,
    () => getState<T>(key),
    () => IDLE as QueryState<T>,
  )

  useEffect(() => {
    fetchers.set(key, fetcher)
    if (getState(key).status === "idle") void fetchQuery(key)
  }, [key, fetcher])

  const refetch = useCallback(() => fetchQuery(key), [key])

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    isLoading: state.status === "idle" || state.status === "loading",
    isFetching: state.isFetching,
    refetch,
  }
}

/** Synchronously updates cached data (no-op if the key was never loaded). */
export function setQueryData<T>(key: string, updater: (prev: T) => T) {
  const prev = getState<T>(key)
  if (prev.data === undefined) return
  setState(key, { ...prev, data: updater(prev.data) })
}

export function upsertItem<T extends Entity>(key: string, item: T, position: "start" | "end" = "start") {
  setQueryData<T[]>(key, (list) =>
    list.some((x) => x.id === item.id)
      ? list.map((x) => (x.id === item.id ? item : x))
      : position === "start"
        ? [item, ...list]
        : [...list, item],
  )
}

export function removeItem<T extends Entity>(key: string, id: ID) {
  setQueryData<T[]>(key, (list) => list.filter((x) => x.id !== id))
}

/** Refetches keys that are loaded; marks unloaded keys stale so they load on next use. */
export function invalidateQueries(...keys: string[]) {
  for (const key of keys) {
    if (getState(key).status === "idle") continue
    void fetchQuery(key)
  }
}

/** Refetches every loaded key that starts with `prefix` (e.g. all Drive folders). */
export function invalidateQueriesByPrefix(prefix: string) {
  invalidateQueries(...[...states.keys()].filter((key) => key === prefix || key.startsWith(`${prefix}:`)))
}

export function resetQueryCache() {
  for (const key of [...states.keys()]) {
    setState(key, IDLE)
    void fetchQuery(key)
  }
}

/* ------------------------------------------------------------------ */

interface MutationOptions<TArgs extends unknown[], TResult> {
  onSuccess?: (result: TResult, ...args: TArgs) => void
  /** Rolls back optimistic changes when the request fails. */
  onError?: (error: Error, ...args: TArgs) => void
  /** Applied before the request resolves. */
  onMutate?: (...args: TArgs) => void
  success?: string | ((result: TResult, ...args: TArgs) => string)
  error?: string
  /**
   * Additional query keys to refetch after success. Derived data (activity,
   * dashboard, notifications) is always refreshed.
   */
  invalidates?: string[]
}

export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: MutationOptions<TArgs, TResult> = {},
) {
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (...args: TArgs): Promise<TResult | undefined> => {
    setPending(true)
    setError(null)
    options.onMutate?.(...args)
    try {
      const result = await fn(...args)
      options.onSuccess?.(result, ...args)
      invalidateQueries("activities", "dashboard", "notifications", ...(options.invalidates ?? []))
      if (options.success) {
        toast.success(
          typeof options.success === "function" ? options.success(result, ...args) : options.success,
        )
      }
      return result
    } catch (caught) {
      const message = errorMessage(caught)
      setError(message)
      options.onError?.(caught instanceof Error ? caught : new Error(message), ...args)
      toast.error(options.error ?? "Action failed", { description: message })
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { mutate, isPending, error, reset: () => setError(null) }
}
