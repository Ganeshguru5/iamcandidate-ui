"use client"

import { useSyncExternalStore } from "react"

import type { ContactExtraction, ID, JobExtraction } from "@/lib/types"

/**
 * The chat's conversation. Kept in memory for the tab (it survives moving
 * between pages, not a reload), so job details aren't left behind in browser
 * storage on a shared device.
 */

/** A link (or typed email) being read, reviewed and saved. */
interface CardState<T> {
  id: string
  url: string
  status: "loading" | "ready" | "error"
  extraction?: T
  error?: string
  /** Set once saved. */
  savedId?: ID
  savedTitle?: string
}

export type JobItem = CardState<JobExtraction> & { type: "job" }
export type ContactItem = CardState<ContactExtraction> & { type: "contact" }
export type CardItem = JobItem | ContactItem

export type ChatItem =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "reply"; text: string }
  | CardItem

type CardPatch = Partial<Omit<CardState<JobExtraction | ContactExtraction>, "id">>

let state: { owner: string; items: ChatItem[] } = { owner: "", items: [] }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit() {
  for (const listener of listeners) listener()
}

const EMPTY: ChatItem[] = []

/** The conversation of `owner` (the signed-in user); another user starts empty. */
export function useChatItems(owner: string): ChatItem[] {
  return useSyncExternalStore(
    subscribe,
    () => (state.owner === owner ? state.items : EMPTY),
    () => EMPTY,
  )
}

export const chatStore = {
  add(owner: string, ...items: ChatItem[]) {
    const current = state.owner === owner ? state.items : []
    // Keep the conversation short enough to stay snappy.
    state = { owner, items: [...current, ...items].slice(-60) }
    emit()
  },
  update(owner: string, id: string, patch: CardPatch) {
    if (state.owner !== owner) return
    state = {
      owner,
      items: state.items.map((item) =>
        // A card's extraction always matches its type (set by the view that read it).
        item.id === id && item.type !== "user" && item.type !== "reply"
          ? ({ ...item, ...patch } as ChatItem)
          : item,
      ),
    }
    emit()
  },
  remove(owner: string, id: string) {
    if (state.owner !== owner) return
    state = { owner, items: state.items.filter((item) => item.id !== id) }
    emit()
  },
  clear() {
    state = { owner: "", items: [] }
    emit()
  },
}
