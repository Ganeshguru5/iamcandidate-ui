import type { FieldErrors, FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

/**
 * Minimal Zod resolver for react-hook-form (avoids an extra dependency).
 * Supports flat and nested schemas.
 */
export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)
    if (result.success) return { values: result.data, errors: {} }

    const errors: Record<string, unknown> = {}
    for (const issue of result.error.issues) {
      let target = errors
      const path = issue.path.map(String)
      path.forEach((segment, index) => {
        if (index === path.length - 1) {
          if (!target[segment]) target[segment] = { type: issue.code, message: issue.message }
        } else {
          target[segment] = (target[segment] as Record<string, unknown> | undefined) ?? {}
          target = target[segment] as Record<string, unknown>
        }
      })
    }
    return { values: {}, errors: errors as FieldErrors<T> }
  }
}
