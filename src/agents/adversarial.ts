import type { LLMProvider } from '../providers/base'
import { AdversarialSchema } from '../schemas'
import { parseJsonResponse } from '../pipeline/normalize'
import type { AdversarialResult } from '../types'

const SYSTEM = `You are an elite smart contract security researcher conducting an adversarial audit.
Assume you are a malicious actor trying to steal funds or break invariants.
You have access to flash loans, MEV, and can manipulate transaction ordering.
Always respond with valid JSON matching the requested schema exactly.
Output pure JSON only — no markdown fences, no prose before or after.`

const TASK = `## TASK
Analyze the smart contract above and find exploit strategies.

1. Identify attack surfaces
2. Build realistic exploit scenarios
3. Chain multiple weaknesses when possible

Focus on:
- Reentrancy attacks
- Flash loan exploits
- Oracle manipulation
- Economic exploits (sandwich attacks, price manipulation)
- Privilege escalation
- MEV / transaction ordering attacks
- State machine violations

## OUTPUT (STRICT JSON)
{
  "attack_vectors": [
    {
      "name": "",
      "severity": "high|critical",
      "description": "",
      "steps": [],
      "required_conditions": [],
      "profit_potential": ""
    }
  ]
}

## RULES
- Be creative and adversarial
- Combine multiple vulnerabilities when possible
- If no real exploit exists, explain why in profit_potential and return severity=high
- Assume flash loans and MEV are always available`

export async function runAdversarial(
  contractCode: string,
  provider: LLMProvider
): Promise<AdversarialResult> {
  const raw = await provider.complete(SYSTEM, TASK, contractCode)
  return parseJsonResponse(raw, AdversarialSchema)
}
