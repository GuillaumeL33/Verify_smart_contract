import type { Severity, Verdict } from '../types'

const DEDUCTION: Record<Severity, number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2
}

const CAP: Record<Severity, number> = {
  critical: 50,
  high: 36,
  medium: 20,
  low: 10
}

/**
 * Compute a 0–100 score from a list of confirmed issues.
 * Multi-agent confirmation (sources.length > 1) increases the deduction by 50%.
 */
export function computeScore(issues: Array<{ severity: Severity; sources: string[] }>): number {
  const spent: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }

  for (const issue of issues) {
    const base = DEDUCTION[issue.severity]
    const multiplier = issue.sources.length > 1 ? 1.5 : 1
    const deduction = base * multiplier
    const remaining = CAP[issue.severity] - spent[issue.severity]

    if (remaining > 0) {
      spent[issue.severity] += Math.min(deduction, remaining)
    }
  }

  const total = Object.values(spent).reduce((a, b) => a + b, 0)
  return Math.max(0, Math.round(100 - total))
}

export function scoreToVerdict(score: number): Verdict {
  if (score >= 80) return 'safe'
  if (score >= 60) return 'medium risk'
  if (score >= 35) return 'high risk'
  return 'critical'
}
