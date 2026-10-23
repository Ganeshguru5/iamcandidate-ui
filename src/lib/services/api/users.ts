import { apiClient } from "@/lib/api/client"
import type { AppUser, CreateUserInput, ID, Session, UpdateUserInput } from "@/lib/types"

import type { AuthService, UserService } from "../contracts"

const enc = encodeURIComponent

interface LoginResponse {
  token: string
  expiresIn: number
  user: AppUser
}

function toSession({ token, user }: LoginResponse): Session {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
    createdAt: new Date().toISOString(),
  }
}

export class ApiAuthService implements AuthService {
  async login(email: string, password: string): Promise<Session> {
    return toSession(await apiClient.post<LoginResponse>("/auth/login", { email, password }))
  }

  /** Uses the current token (sent by apiClient) to get a fresh one. */
  async refresh(): Promise<Session> {
    return toSession(await apiClient.post<LoginResponse>("/auth/refresh"))
  }

  /** Tokens are stateless; signing out just forgets the token locally. */
  async logout(): Promise<void> {}

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.put("/auth/password", { currentPassword, newPassword })
  }
}

export class ApiUserService implements UserService {
  list(): Promise<AppUser[]> {
    return apiClient.get("/users")
  }

  create(input: CreateUserInput): Promise<AppUser> {
    return apiClient.post("/users", input)
  }

  update(id: ID, patch: UpdateUserInput): Promise<AppUser> {
    return apiClient.put(`/users/${enc(id)}`, patch)
  }

  remove(id: ID): Promise<void> {
    return apiClient.delete(`/users/${enc(id)}`)
  }
}
