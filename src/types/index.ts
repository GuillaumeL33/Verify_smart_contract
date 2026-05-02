export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type Confidence = 'low' | 'medium' | 'high'
export type Verdict = 'safe' | 'medium risk' | 'high risk' | 'critical'
export type ProviderName = 'claude' | 'openai'

// ─── LLM Provider config ────────────────────────────────────────────────────

export interface AgentConfig {
  provider: ProviderName
  model: string
  apiKey?: string
}

export interface PipelineConfig {
  staticScan: AgentConfig
  functionalQA: AgentConfig
  adversarial: AgentConfig
  aggregator: AgentConfig
}

// ─── Agent 1: Static scan ───────────────────────────────────────────────────

export interface StaticIssue {
  title: string
  severity: Severity
  confidence: Confidence
  description: string
  fix: string
}

export interface StaticScanResult {
  summary: string
  issues: StaticIssue[]
}

// ─── Agent 2: Functional QA ─────────────────────────────────────────────────

export interface TestScenario {
  name: string
  steps: string[]
  expected_result: string
  risk_if_fail: string
}

export interface FunctionalQAResult {
  expected_behaviors: string[]
  test_scenarios: TestScenario[]
  logic_issues: string[]
}

// ─── Agent 3: Adversarial ───────────────────────────────────────────────────

export interface AttackVector {
  name: string
  severity: 'high' | 'critical'
  description: string
  steps: string[]
  required_conditions: string[]
  profit_potential: string
}

export interface AdversarialResult {
  attack_vectors: AttackVector[]
}

// ─── Agent 4: Aggregated output ─────────────────────────────────────────────

export interface ConfirmedIssue {
  title: string
  severity: Severity
  confidence: Confidence
  description: string
  fix: string
  sources: string[]
}

export interface AggregatedResult {
  final_score: number
  final_verdict: Verdict
  confirmed_issues: ConfirmedIssue[]
  rejected_issues: string[]
  attack_feasibility: string
  top_risks: string[]
}

// ─── Full pipeline report ───────────────────────────────────────────────────

export interface AuditReport {
  contract_hash: string
  timestamp: string
  agents_used: Record<keyof PipelineConfig, string>
  static_scan: StaticScanResult
  functional_qa: FunctionalQAResult
  adversarial: AdversarialResult
  aggregated: AggregatedResult
}
