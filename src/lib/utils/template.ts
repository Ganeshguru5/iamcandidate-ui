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

export function fillTemplate(source: string, values: Record<string, string | undefined>): string {
  return source.replace(VARIABLE_PATTERN, (whole, key: string) => {
    const value = values[key]
    return value && value.length > 0 ? value : whole
  })
}
