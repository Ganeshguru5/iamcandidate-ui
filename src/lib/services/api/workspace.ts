import { apiClient, toPatch } from "@/lib/api/client"
import type {
  BoardItem,
  BoardItemInput,
  Bookmark,
  BookmarkInput,
  Certification,
  CertificationInput,
  ID,
  Note,
  NoteInput,
  Project,
  ProjectInput,
  Skill,
  SkillInput,
  Task,
  TaskInput,
} from "@/lib/types"

import type { TaskService } from "../contracts"
import { ApiCrudService } from "./crud"

const enc = encodeURIComponent

export class ApiProjectService extends ApiCrudService<Project, ProjectInput> {
  constructor() {
    super("/projects")
  }
}

export class ApiNoteService extends ApiCrudService<Note, NoteInput> {
  constructor() {
    super("/notes")
  }
}

export class ApiBoardService extends ApiCrudService<BoardItem, BoardItemInput> {
  constructor() {
    super("/board")
  }
}

export class ApiSkillService extends ApiCrudService<Skill, SkillInput> {
  constructor() {
    super("/skills")
  }
}

export class ApiCertificationService extends ApiCrudService<Certification, CertificationInput> {
  constructor() {
    super("/certifications")
  }
}

/** Bookmarks are served from `/links`. */
export class ApiBookmarkService extends ApiCrudService<Bookmark, BookmarkInput> {
  constructor() {
    super("/links")
  }
}

export class ApiTaskService implements TaskService {
  getTasks(): Promise<Task[]> {
    return apiClient.get("/tasks")
  }

  createTask(input: TaskInput): Promise<Task> {
    return apiClient.post("/tasks", input)
  }

  updateTask(id: ID, patch: Partial<TaskInput>): Promise<Task> {
    return apiClient.put(`/tasks/${enc(id)}`, toPatch(patch))
  }

  toggleComplete(id: ID): Promise<Task> {
    return apiClient.post(`/tasks/${enc(id)}/toggle`)
  }

  deleteTask(id: ID): Promise<void> {
    return apiClient.delete(`/tasks/${enc(id)}`)
  }
}
