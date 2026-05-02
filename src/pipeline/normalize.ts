import { z } from 'zod'
import type { Severity, Confidence } from '../types'

/**
 * Extract JSON from an LLM response, handling markdown fences and leading prose.
 */
export function extractJson(raw: string): string {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()

  // Find the first { or [ and match its closing bracket
  const start = raw.search(/[{[]/)
  if (start === -1) throw new Error(`No JSON found in LLM response:\n${raw.slice(0, 300)}`)

  const openChar = raw[start]
  const closeChar = openChar === '{' ? '}' : ']'
  let depth = 0
  let end = -1

  for (let i = start; i < raw.length; i++) {
    if (raw[i] === openChar) depth++
    else if (raw[i] === closeChar) {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }

  if (end === -1) throw new Error(`Malformed JSON in LLM response (unmatched brackets)`)
  return raw.slice(start, end + 1)
}

/**
 * Parse and validate a raw LLM text response against a Zod schema.
 * Attempts field normalization before failing hard.
 */
export function parseJsonResponse<T>(raw: string, schema: z.ZodSchema<T>): T {
  let jsonStr: string
  try {
    jsonStr = extractJson(raw)
  } catch (e) {
    throw new Error(`JSON extraction failed: ${(e as Error).message}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(`JSON.parse failed.\nExtracted:\n${jsonStr.slice(0, 500)}`)
  }

  const first = schema.safeParse(parsed)
  if (first.success) return first.data

  // Attempt to normalize severity/confidence aliases before giving up
  const normalized = normalizeSeverityFields(parsed)
  const second = schema.safeParse(normalized)
  if (second.success) return second.data

  throw new Error(
    `Schema validation failed:\n${first.error.message}\n\nParsed object:\n${JSON.stringify(parsed, null, 2).slice(0, 600)}`
  )
}

const SEVERITY_MAP: Record<string, Severity> = {
  informational: 'low',
  info: 'low',
  warning: 'medium',
  warn: 'medium',
  error: 'high',
  severe: 'high',
  blocker: 'critical'
}

const CONFIDENCE_MAP: Record<string, Confidence> = {
  certain: 'high',
  confirmed: 'high',
  likely: 'medium',
  probable: 'medium',
  possible: 'low',
  speculative: 'low',
  unknown: 'low'
}

/**
 * Recursively walk an object and coerce non-standard severity/confidence strings
 * to the canonical values expected by our Zod schemas.
 */
export function normalizeSeverityFields(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(normalizeSeverityFields)

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === 'severity' && typeof value === 'string') {
        const lower = value.toLowerCase()
        result[key] = SEVERITY_MAP[lower] ?? lower
      } else if (key === 'confidence' && typeof value === 'string') {
        const lower = value.toLowerCase()
        result[key] = CONFIDENCE_MAP[lower] ?? lower
      } else {
        result[key] = normalizeSeverityFields(value)
      }
    }
    return result
  }

  return obj
}
