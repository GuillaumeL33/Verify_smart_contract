import type { LLMProvider } from '../providers/base'
import { FunctionalQASchema } from '../schemas'
import { parseJsonResponse } from '../pipeline/normalize'
import type { FunctionalQAResult } from '../types'

const SYSTEM = `You are a smart contract QA engineer.
Your job is to verify that the contract behaves correctly under normal and edge-case conditions.
Always respond with valid JSON matching the requested schema exactly.
Output pure JSON only — no markdown fences, no prose before or after.`

const TASK = `## TASK
Analyze the smart contract above.

1. Identify expected behaviors
2. Identify edge cases
3. Simulate test scenarios

Focus on:
- State transitions (lifecycle)
- Function correctness
- Edge cases (zero values, max values, repeated calls)
- Failure conditions

## OUTPUT (STRICT JSON)
{
  "expected_behaviors": [],
  "test_scenarios": [
    {
      "name": "",
      "steps": [],
      "expected_result": "",
      "risk_if_fail": ""
    }
  ],
  "logic_issues": []
}

## RULES
- Think like a QA tester, not a hacker
- Focus on correctness, not exploits
- logic_issues = bugs or incorrect behaviors, not security vulnerabilities`

export async function runFunctionalQA(
  contractCode: string,
  provider: LLMProvider
): Promise<FunctionalQAResult> {
  const raw = await provider.complete(SYSTEM, TASK, contractCode)
  return parseJsonResponse(raw, FunctionalQASchema)
}
