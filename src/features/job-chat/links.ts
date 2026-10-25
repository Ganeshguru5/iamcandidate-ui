/** At most this many links are read from one message. */
export const MAX_LINKS = 5

const LINK_PATTERN = /\bhttps?:\/\/[^\s<>"'`]+|\bwww\.[^\s<>"'`]+/gi

/**
 * Job links in free text ("check this https://… and www.…"), in order,
 * without duplicates or trailing punctuation.
 */
export function findLinks(text: string): string[] {
  const seen = new Set<string>()
  const links: string[] = []
  for (const match of text.matchAll(LINK_PATTERN)) {
    let raw = match[0].replace(/[.,;:!?'")\]}>]+$/, "")
    // Keep a closing parenthesis that belongs to the URL (wiki-style links).
    if (match[0].length > raw.length && raw.includes("(") && !raw.includes(")")) raw += ")"
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      continue
    }
    const key = normUrl(url.toString())
    if (seen.has(key)) continue
    seen.add(key)
    links.push(url.toString())
  }
  return links
}

const GITHUB_PAGES =
  /^(orgs|topics|features|pricing|about|enterprise|marketplace|explore|settings|login|join|sponsors|collections|trending|search|issues|pulls|notifications|apps|site|security|customer-stories|readme|team|contact)$/i

/** Person profiles (LinkedIn /in/…, github.com/<user>) become contacts; other links are jobs. */
export function linkKind(value: string): "job" | "contact" {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")
    if (host.endsWith("linkedin.com") && /^\/in\/[^/]+/.test(url.pathname)) return "contact"
    const segments = url.pathname.split("/").filter(Boolean)
    if (host === "github.com" && segments.length === 1 && !GITHUB_PAGES.test(segments[0] ?? "")) return "contact"
  } catch {
    // fall through
  }
  return "job"
}

/** Email addresses typed in the message (outside of links). */
export function findEmails(text: string): string[] {
  const withoutLinks = text.replace(LINK_PATTERN, " ")
  const found = withoutLinks.match(/[^\s<>()"',;:]+@[^\s<>()"',;:]+\.[a-z]{2,}/gi) ?? []
  return [...new Set(found.map((email) => email.replace(/^mailto:/i, "").toLowerCase()))]
}

/** Host + path, lower-cased, for "same job link" checks. */
export function normUrl(value: string | undefined): string {
  if (!value) return ""
  try {
    const url = new URL(value)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`.toLowerCase()
  } catch {
    return ""
  }
}

/** Company name key: case, punctuation and legal suffixes ignored. */
export function normName(value: string | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|co|pvt|private|plc|gmbh)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
