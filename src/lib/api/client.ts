import { API_URL } from "./config"
import { clearSession, getSessionToken } from "./session-token"

/**
 * Centralized HTTP client for the knot-server API. Every response uses the
 * envelope `{ success, data, meta? }` / `{ success: false, error }`; this
 * client unwraps it and throws {@link ApiError} with a user-readable message.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type Query = Record<string, string | number | boolean | undefined>

interface RequestOptions {
  body?: unknown
  query?: Query
}

interface Envelope<T> {
  success: boolean
  data?: T
  meta?: Record<string, unknown>
  error?: { code: string; message: string; details?: unknown }
}

/** "Invalid request body" alone isn't actionable; name the fields that failed. */
function describeError(error: Envelope<unknown>["error"]): string | undefined {
  if (!error) return undefined
  if (error.code !== "VALIDATION_ERROR" || !Array.isArray(error.details)) return error.message
  const fields = (error.details as Array<{ path?: string; message?: string }>)
    .slice(0, 3)
    .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
    .filter(Boolean)
  return fields.length ? `${error.message} — ${fields.join("; ")}` : error.message
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_URL}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = getSessionToken()
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers["content-type"] = "application/json"
  if (token) headers.authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(`Can't reach the API at ${API_URL}. Is the backend running?`, 0, "NETWORK_ERROR")
  }

  if (response.status === 204) return undefined as T

  let envelope: Envelope<T> | undefined
  try {
    envelope = (await response.json()) as Envelope<T>
  } catch {
    // Non-JSON response (e.g. a gateway error page).
  }
  // An expired or revoked session: sign out so the shell shows the login page.
  if (response.status === 401 && token) clearSession()
  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      describeError(envelope?.error) ?? `Request failed (${response.status})`,
      response.status,
      envelope?.error?.code ?? "HTTP_ERROR",
      envelope?.error?.details,
    )
  }
  return envelope.data as T
}

export const apiClient = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>("POST", path, { body, query }),
  put: <T>(path: string, body?: unknown, query?: Query) => request<T>("PUT", path, { body, query }),
  delete: (path: string) => request<void>("DELETE", path),
  /** DELETE for routes that answer with a body (e.g. the updated status). */
  deleteJson: <T>(path: string, query?: Query) => request<T>("DELETE", path, { query }),
}

/** Resolves to `undefined` instead of throwing on 404 (for `get(id)` contracts). */
export async function orUndefined<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
}

/**
 * Converts a frontend partial update into an API patch: keys explicitly set to
 * `undefined` (a cleared optional field) are sent as `null`, which the API
 * treats as "remove this field".
 */
export function toPatch<T extends object>(patch: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, value ?? null]))
}

/** The caller's UTC offset, so the API computes "today"/weeks in local time. */
export function tzQuery() {
  return { tzOffset: new Date().getTimezoneOffset() }
}

/** PUTs a file to a presigned S3 URL, reporting upload progress. */
export function uploadToPresignedUrl(
  url: string,
  file: Blob,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError(`Upload failed (${xhr.status})`, xhr.status, "UPLOAD_FAILED"))
    xhr.onerror = () => reject(new ApiError("Upload failed — check your connection", 0, "UPLOAD_FAILED"))
    xhr.send(file)
  })
}
