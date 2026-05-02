import type { LLMProvider } from '../providers/base'
import { AggregatedSchema } from '../schemas'
import { parseJsonResponse } from '../pipeline/normalize'
import type {
  AggregatedResult,
  StaticScanResult,
  FunctionalQAResult,
  AdversarialResult
} from '../types'

const SYSTEM = `You are a lead security auditor reviewing three independent audit reports.
Your job is to produce a final, reliable verdict by merging and cross-validating the findings.
Always respond with valid JSON matching the requested schema exactly.
Output pure JSON only — no markdown fences, no prose before or after.`

function buildTask(
  staticScan: StaticScanResult,
  functionalQA: FunctionalQAResult,
  adversarial: AdversarialResult
): string {
  return `## INPUT: Three independent audit reports

### Report 1 — Static Scan
${JSON.stringify(staticScan, null, 2)}

### Report 2 — Functional QA
${JSON.stringify(functionalQA, null, 2)}

### Report 3 — Adversarial Analysis
${JSON.stringify(adversarial, null, 2)}

## TASK
- Merge all findings across the three reports
- Deduplicate: same vulnerability found by multiple agents → higher confidence, keep once
- Resolve contradictions conservatively (assume the risk is real when in doubt)
- Assign final severity to each confirmed issue
- Compute global risk score (0 = critical/broken, 100 = fully safe)

## SCORING GUIDE
- Start at 100
- Critical confirmed issue: -25 (capped at -50 total)
- High confirmed issue: -12 (capped at -36 total)
- Medium confirmed issue: -5 (capped at -20 total)
- Low confirmed issue: -2 (capped at -10 total)
- Multi-agent confirmation adds weight (increase severity by one level if 2+ agents agree)

## OUTPUT (STRICT JSON)
{
  "final_score": 0,
  "final_verdict": "safe|medium risk|high risk|critical",
  "confirmed_issues": [
    {
      "title": "",
      "severity": "low|medium|high|critical",
      "confidence": "low|medium|high",
      "description": "",
      "fix": "",
      "sources": ["static_scan", "functional_qa", "adversarial"]
    }
  ],
  "rejected_issues": [],
  "attack_feasibility": "",
  "top_risks": []
}

## RULES
- Be conservative: err on the side of flagging issues
- rejected_issues = titles of issues you considered but dismissed with reason
- attack_feasibility = one paragraph on overall exploit difficulty
- top_risks = 3-5 highest-priority actionable items for the team`
}

export async function runAggregator(
  staticScan: StaticScanResult,
  functionalQA: FunctionalQAResult,
  adversarial: AdversarialResult,
  provider: LLMProvider
): Promise<AggregatedResult> {
  const task = buildTask(staticScan, functionalQA, adversarial)
  // No contractCode here — aggregator works on the agent outputs, not the raw source
  const raw = await provider.complete(SYSTEM, task)
  return parseJsonResponse(raw, AggregatedSchema)
}
