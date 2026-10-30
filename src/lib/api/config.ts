/**
 * Which backend the service layer talks to:
 * - `mock` (default): in-browser mock services, no backend needed.
 * - `api`: the AWS SAM backend (iamcandidate-server) at `NEXT_PUBLIC_API_URL`.
 *
 * Both are inlined at build time (see `.env.example`).
 */
export type ApiMode = "mock" | "api"

export const API_MODE: ApiMode = process.env.NEXT_PUBLIC_API_MODE === "api" ? "api" : "mock"

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "")

export const isApiMode = API_MODE === "api"
