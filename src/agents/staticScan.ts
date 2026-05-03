import type { LLMProvider } from '../providers/base'
import { StaticScanSchema } from '../schemas'
import { parseJsonResponse } from '../pipeline/normalize'
import type { StaticScanResult } from '../types'

const SYSTEM = `You are a smart contract security scanner optimized for speed and accuracy.
Your goal is to detect COMMON and WELL-KNOWN vulnerabilities quickly.
Always respond with valid JSON matching the requested schema exactly.
Output pure JSON only — no markdown fences, no prose before or after.`

const TASK = `## TASK
Perform a fast security scan of the smart contract above.

Check ONLY for:
- Reentrancy
- Access control issues
- Integer overflow/underflow
- Unsafe external calls
- Missing input validation

## OUTPUT (STRICT JSON)
{
  "summary": "",
  "issues": [
    {
      "title": "",
      "severity": "low|medium|high|critical",
      "confidence": "low|medium|high",
      "description": "",
      "fix": ""
    }
  ]
}

## RULES
- Be fast and concise
- Do NOT speculate
- Only report high-confidence issues
- If no issues found, return an empty issues array`

export async function runStaticScan(
  contractCode: string,
  provider: LLMProvider
): Promise<StaticScanResult> {
  const raw = await provider.complete(SYSTEM, TASK, contractCode)
  return parseJsonResponse(raw, StaticScanSchema)
}
