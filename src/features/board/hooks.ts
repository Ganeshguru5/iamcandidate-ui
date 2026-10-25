"use client"

import { boardService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { BoardItem, BoardItemInput, ID } from "@/lib/types"

export function useCreateBoardItem() {
  return useMutation((input: BoardItemInput) => boardService.create(input), {
    onSuccess: (item) => upsertItem(QK.board, item),
    success: "Saved to board",
    error: "Couldn't save item",
  })
}

export function useUpdateBoardItem() {
  return useMutation((id: ID, patch: Partial<BoardItemInput>) => boardService.update(id, patch), {
    onSuccess: (item) => upsertItem(QK.board, item),
    success: "Item updated",
    error: "Couldn't update item",
  })
}

export function useToggleBoardPin() {
  return useMutation((item: BoardItem) => boardService.update(item.id, { pinned: !item.pinned }), {
    onMutate: (item) =>
      setQueryData<BoardItem[]>(QK.board, (list) =>
        list.map((i) => (i.id === item.id ? { ...i, pinned: !i.pinned } : i)),
      ),
    onSuccess: (item) => upsertItem(QK.board, item),
  })
}

export function useDeleteBoardItem() {
  return useMutation((id: ID) => boardService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.board, id),
    success: "Item deleted",
    error: "Couldn't delete item",
  })
}
