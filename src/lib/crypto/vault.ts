"use client"

import { useSyncExternalStore } from "react"

/**
 * Client-side vault for secret board items.
 *
 * Secrets are sealed with AES-GCM under a key derived from the user's
 * passphrase (PBKDF2-SHA-256), and stored as `v1.<salt>.<iv>.<data>` in
 * base64url. The passphrase and keys live only in this tab's memory: the
 * server, localStorage and other devices only ever see the envelope, and the
 * vault locks itself after a period of inactivity.
 */

const VERSION = "v1"
const ITERATIONS = 310_000
const AUTO_LOCK_MS = 15 * 60_000

interface VaultState {
  unlocked: boolean
}

let passphrase: string | null = null
/** Salt used for new secrets this session, so one derived key serves them all. */
let sessionSalt: Uint8Array | null = null
const keys = new Map<string, Promise<CryptoKey>>()
let lockTimer: ReturnType<typeof setTimeout> | undefined

let state: VaultState = { unlocked: false }
const listeners = new Set<() => void>()

function emit(next: VaultState) {
  state = next
  listeners.forEach((listener) => listener())
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const id = toBase64Url(salt)
  let key = keys.get(id)
  if (!key) {
    const secret = passphrase
    if (secret === null) throw new VaultLockedError()
    key = crypto.subtle
      .importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveKey"])
      .then((base) =>
        crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: new Uint8Array(salt), iterations: ITERATIONS, hash: "SHA-256" },
          base,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"],
        ),
      )
    keys.set(id, key)
  }
  return key
}

/** Restarts the inactivity countdown; called on every vault use. */
function touch() {
  clearTimeout(lockTimer)
  lockTimer = setTimeout(lockVault, AUTO_LOCK_MS)
}

export class VaultLockedError extends Error {
  constructor() {
    super("Unlock the vault first")
  }
}

export function isSealed(content: string): boolean {
  return content.startsWith(`${VERSION}.`) && content.split(".").length === 4
}

/** Encrypts `plain` for storage. */
export async function seal(plain: string): Promise<string> {
  if (passphrase === null) throw new VaultLockedError()
  touch()
  sessionSalt ??= crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(sessionSalt)
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plain)))
  return [VERSION, toBase64Url(sessionSalt), toBase64Url(iv), toBase64Url(data)].join(".")
}

/** Decrypts an envelope from {@link seal}; throws if the passphrase is wrong. */
export async function unseal(envelope: string): Promise<string> {
  if (passphrase === null) throw new VaultLockedError()
  touch()
  const [version, salt, iv, data] = envelope.split(".")
  if (version !== VERSION || !salt || !iv || !data) throw new Error("Unrecognised secret format")
  const key = await deriveKey(fromBase64Url(salt))
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(iv) }, key, fromBase64Url(data))
  return decoder.decode(plain)
}

/**
 * Unlocks with `secret`. When an existing envelope is given it must decrypt,
 * which proves the passphrase matches the one used on other devices.
 */
export async function unlockVault(secret: string, sample?: string): Promise<boolean> {
  passphrase = secret
  keys.clear()
  sessionSalt = null
  if (sample) {
    try {
      await unseal(sample)
      // Reuse the existing salt so new secrets share the key already derived.
      sessionSalt = fromBase64Url(sample.split(".")[1] ?? "")
    } catch {
      passphrase = null
      keys.clear()
      return false
    }
  }
  touch()
  emit({ unlocked: true })
  return true
}

export function lockVault() {
  clearTimeout(lockTimer)
  passphrase = null
  sessionSalt = null
  keys.clear()
  emit({ unlocked: false })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const serverState: VaultState = { unlocked: false }

export function useVault(): VaultState {
  return useSyncExternalStore(subscribe, () => state, () => serverState)
}
