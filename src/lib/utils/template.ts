const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export const TEMPLATE_VARIABLES = [
  "name",
  "company",
  "role",
  "jobUrl",
  "jobId",
  "senderName",
] as const

export function extractVariables(...sources: string[]): string[] {
  const found = new Set<string>()
  for (const source of sources) {
    for (const match of source.matchAll(VARIABLE_PATTERN)) {
      if (match[1]) found.add(match[1])
    }
  }
  return [...found]
}

/**
 * Copies text, falling back to a hidden textarea where the async Clipboard API
 * is unavailable or blocked (plain-http hosts, some embedded browsers).
 */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // Fall through to the legacy path.
  }
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand("copy")
  area.remove()
  if (!ok) throw new Error("Copy failed")
}

/** LinkedIn's limit for the note on a connection request. */
export const LINKEDIN_NOTE_LIMIT = 300

/** Templates from before channels existed are email templates. */
export function templateChannel(template: { channel?: "email" | "linkedin" }): "email" | "linkedin" {
  return template.channel ?? "email"
}

export function fillTemplate(source: string, values: Record<string, string | undefined>): string {
  return source.replace(VARIABLE_PATTERN, (whole, key: string) => {
    const value = values[key]
    return value && value.length > 0 ? value : whole
  })
}
