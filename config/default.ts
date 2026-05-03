import type { PipelineConfig } from '../src/types'

/**
 * Default pipeline configuration.
 *
 * All agents default to Claude. Override via:
 *   1. Environment variables (see .env.example)
 *   2. Pass a custom Partial<PipelineConfig> to runAuditPipeline()
 *   3. Edit this file directly
 *
 * Recommended LLM split for cost/quality balance:
 *   staticScan   → haiku   (fast, pattern matching, cheap)
 *   functionalQA → sonnet  (logic depth, balanced)
 *   adversarial  → opus    (creative attack chaining, best reasoning)
 *   aggregator   → sonnet  (synthesis, fast)
 *
 * Mixed-provider example (CertiK-style diversity):
 *   staticScan  → openai/gpt-4o-mini  (different bias than Claude)
 *   adversarial → openai/gpt-4o       (cross-validates Claude's findings)
 */
export const defaultConfig: PipelineConfig = {
  staticScan: {
    provider: (process.env.STATIC_SCAN_PROVIDER as 'claude' | 'openai') ?? 'claude',
    model: process.env.STATIC_SCAN_MODEL ?? 'claude-haiku-4-5-20251001'
  },
  functionalQA: {
    provider: (process.env.FUNCTIONAL_QA_PROVIDER as 'claude' | 'openai') ?? 'claude',
    model: process.env.FUNCTIONAL_QA_MODEL ?? 'claude-sonnet-4-6'
  },
  adversarial: {
    provider: (process.env.ADVERSARIAL_PROVIDER as 'claude' | 'openai') ?? 'claude',
    model: process.env.ADVERSARIAL_MODEL ?? 'claude-opus-4-7'
  },
  aggregator: {
    provider: (process.env.AGGREGATOR_PROVIDER as 'claude' | 'openai') ?? 'claude',
    model: process.env.AGGREGATOR_MODEL ?? 'claude-sonnet-4-6'
  }
}
