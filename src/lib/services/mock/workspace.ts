import type {
  BookmarkInput,
  CertificationInput,
  ID,
  NoteInput,
  ProjectInput,
  SkillInput,
  Task,
  TaskInput,
} from "@/lib/types"
import { delay, networkDelay } from "@/lib/utils/delay"
import { createId } from "@/lib/utils/id"

import type { TaskService } from "../contracts"
import { MockCrudService } from "./crud"
import { collection, logActivity, NotFoundError } from "./db"

const tasks = collection("tasks")

export class MockProjectService extends MockCrudService<"projects", ProjectInput> {
  constructor() {
    super({
      key: "projects",
      idPrefix: "prj",
      build: (input, id, now) => ({ ...input, id, updatedAt: now }),
      touch: (_item, now) => ({ updatedAt: now }),
      onCreate: (project) => ({
        type: "project_updated",
        title: `Project created: ${project.name}`,
        entity: { type: "project", id: project.id },
      }),
    })
  }
}

export class MockNoteService extends MockCrudService<"notes", NoteInput> {
  constructor() {
    super({
      key: "notes",
      idPrefix: "note",
      build: (input, id, now) => ({ ...input, id, createdAt: now, updatedAt: now }),
      touch: (_item, now) => ({ updatedAt: now }),
      onCreate: (note) => ({
        type: "note_created",
        title: "Note created",
        description: note.title,
        entity: { type: "note", id: note.id },
      }),
    })
  }
}

export class MockSkillService extends MockCrudService<"skills", SkillInput> {
  constructor() {
    super({ key: "skills", idPrefix: "sk", build: (input, id) => ({ ...input, id }) })
  }
}

export class MockCertificationService extends MockCrudService<"certifications", CertificationInput> {
  constructor() {
    super({ key: "certifications", idPrefix: "cert", build: (input, id) => ({ ...input, id }) })
  }
}

export class MockBookmarkService extends MockCrudService<"bookmarks", BookmarkInput> {
  constructor() {
    super({
      key: "bookmarks",
      idPrefix: "bm",
      build: (input, id, now) => ({ ...input, id, createdAt: now }),
    })
  }
}

export class MockTaskService implements TaskService {
  async getTasks(): Promise<Task[]> {
    await delay(300)
    return tasks.all()
  }

  async createTask(input: TaskInput): Promise<Task> {
    await networkDelay()
    const task = tasks.insert({
      ...input,
      id: createId("tsk"),
      createdAt: new Date().toISOString(),
      completedAt: input.status === "done" ? new Date().toISOString() : undefined,
    })
    logActivity({
      type: "task_created",
      title: "Task created",
      description: task.title,
      entity: { type: "task", id: task.id },
    })
    return task
  }

  async updateTask(id: ID, patch: Partial<TaskInput>): Promise<Task> {
    await networkDelay()
    const existing = tasks.find(id)
    if (!existing) throw new NotFoundError("Task", id)
    const completedAt =
      patch.status === undefined
        ? existing.completedAt
        : patch.status === "done"
          ? (existing.completedAt ?? new Date().toISOString())
          : undefined
    return tasks.patch(id, { ...patch, completedAt })
  }

  async toggleComplete(id: ID): Promise<Task> {
    await delay(250)
    const existing = tasks.find(id)
    if (!existing) throw new NotFoundError("Task", id)
    const done = existing.status !== "done"
    const next = tasks.patch(id, {
      status: done ? "done" : "todo",
      completedAt: done ? new Date().toISOString() : undefined,
    })
    if (done) {
      logActivity({
        type: "task_completed",
        title: "Task completed",
        description: existing.title,
        entity: { type: "task", id },
      })
    }
    return next
  }

  async deleteTask(id: ID): Promise<void> {
    await networkDelay()
    tasks.remove(id)
  }
}
