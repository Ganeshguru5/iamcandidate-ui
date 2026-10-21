"use client"

import { taskService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { ID, Task, TaskInput } from "@/lib/types"

export function useCreateTask() {
  return useMutation((input: TaskInput) => taskService.createTask(input), {
    onSuccess: (task) => upsertItem(QK.tasks, task),
    success: "Task created",
    error: "Couldn't create task",
  })
}

export function useUpdateTask() {
  return useMutation((id: ID, patch: Partial<TaskInput>) => taskService.updateTask(id, patch), {
    onSuccess: (task) => upsertItem(QK.tasks, task),
    success: "Task updated",
    error: "Couldn't update task",
  })
}

/** Optimistic toggle so checkboxes feel instant. */
export function useToggleTask() {
  return useMutation((id: ID) => taskService.toggleComplete(id), {
    onMutate: (id) =>
      setQueryData<Task[]>(QK.tasks, (list) =>
        list.map((t) =>
          t.id === id
            ? {
                ...t,
                status: t.status === "done" ? "todo" : "done",
                completedAt: t.status === "done" ? undefined : new Date().toISOString(),
              }
            : t,
        ),
      ),
    onSuccess: (task) => upsertItem(QK.tasks, task),
    onError: () => invalidateQueries(QK.tasks),
    success: (task) => (task.status === "done" ? "Task completed" : "Task reopened"),
    error: "Couldn't update task",
  })
}

export function useDeleteTask() {
  return useMutation((id: ID) => taskService.deleteTask(id), {
    onSuccess: (_, id) => removeItem(QK.tasks, id),
    success: "Task deleted",
    error: "Couldn't delete task",
  })
}
