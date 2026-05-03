import type { StaticIssue } from '../types'

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an|of|in|on|at|to|for|with|by|from|is|are|was|were|be|been)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' ').filter(Boolean))
  const setB = new Set(b.split(' ').filter(Boolean))
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

const DEDUP_THRESHOLD = 0.45

const SEVERITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 } as const

/**
 * Merge issues from multiple agents, grouping similar ones by title.
 * Higher severity wins. Multi-agent confirmation is tracked in sources[].
 */
export function deduplicateIssues(
  issues: Array<StaticIssue & { source: string }>
): Array<StaticIssue & { sources: string[] }> {
  const groups: Array<{
    canonical: StaticIssue & { source: string }
    sources: string[]
  }> = []

  for (const issue of issues) {
    const normTitle = normalizeTitle(issue.title)
    const match = groups.find(
      g => jaccardSimilarity(normalizeTitle(g.canonical.title), normTitle) >= DEDUP_THRESHOLD
    )

    if (match) {
      if (!match.sources.includes(issue.source)) match.sources.push(issue.source)
      if (SEVERITY_ORDER[issue.severity] > SEVERITY_ORDER[match.canonical.severity]) {
        match.canonical = issue
      }
    } else {
      groups.push({ canonical: issue, sources: [issue.source] })
    }
  }

  return groups.map(g => ({ ...g.canonical, sources: g.sources }))
}
