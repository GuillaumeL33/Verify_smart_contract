import { z } from 'zod'

const severity = z.enum(['low', 'medium', 'high', 'critical'])
const confidence = z.enum(['low', 'medium', 'high'])

export const StaticScanSchema = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      title: z.string(),
      severity,
      confidence,
      description: z.string(),
      fix: z.string()
    })
  )
})

export const FunctionalQASchema = z.object({
  expected_behaviors: z.array(z.string()),
  test_scenarios: z.array(
    z.object({
      name: z.string(),
      steps: z.array(z.string()),
      expected_result: z.string(),
      risk_if_fail: z.string()
    })
  ),
  logic_issues: z.array(z.string())
})

export const AdversarialSchema = z.object({
  attack_vectors: z.array(
    z.object({
      name: z.string(),
      severity: z.enum(['high', 'critical']),
      description: z.string(),
      steps: z.array(z.string()),
      required_conditions: z.array(z.string()),
      profit_potential: z.string()
    })
  )
})

export const AggregatedSchema = z.object({
  final_score: z.number().min(0).max(100),
  final_verdict: z.enum(['safe', 'medium risk', 'high risk', 'critical']),
  confirmed_issues: z.array(
    z.object({
      title: z.string(),
      severity,
      confidence,
      description: z.string(),
      fix: z.string(),
      sources: z.array(z.string())
    })
  ),
  rejected_issues: z.array(z.string()),
  attack_feasibility: z.string(),
  top_risks: z.array(z.string())
})
