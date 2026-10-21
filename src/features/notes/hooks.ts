"use client"

import { noteService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { ID, Note, NoteInput } from "@/lib/types"

export function useCreateNote() {
  return useMutation((input: NoteInput) => noteService.create(input), {
    onSuccess: (note) => upsertItem(QK.notes, note),
    success: "Note created",
    error: "Couldn't create note",
  })
}

export function useUpdateNote(options: { silent?: boolean } = {}) {
  return useMutation((id: ID, patch: Partial<NoteInput>) => noteService.update(id, patch), {
    onSuccess: (note) => upsertItem(QK.notes, note),
    success: options.silent ? undefined : "Note saved",
    error: "Couldn't save note",
  })
}

export function useToggleNoteFavorite() {
  return useMutation((note: Note) => noteService.update(note.id, { favorite: !note.favorite }), {
    onMutate: (note) =>
      setQueryData<Note[]>(QK.notes, (list) =>
        list.map((n) => (n.id === note.id ? { ...n, favorite: !n.favorite } : n)),
      ),
    onSuccess: (note) => upsertItem(QK.notes, note),
  })
}

export function useDeleteNote() {
  return useMutation((id: ID) => noteService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.notes, id),
    success: "Note deleted",
    error: "Couldn't delete note",
  })
}
