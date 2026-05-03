import crypto from 'crypto'
import type { PipelineConfig, AuditReport } from '../types'
import { createProvider } from '../providers/factory'
import { runStaticScan } from '../agents/staticScan'
import { runFunctionalQA } from '../agents/functionalQA'
import { runAdversarial } from '../agents/adversarial'
import { runAggregator } from '../agents/aggregator'

/**
 * Main pipeline entry point.
 *
 * Agents 1-3 run in parallel (they are fully independent — same contract, different lenses).
 * Agent 4 (aggregator) runs after, consuming the three reports.
 */
export async function runAuditPipeline(
  contractCode: string,
  config: PipelineConfig
): Promise<AuditReport> {
  const providers = {
    staticScan: createProvider(config.staticScan),
    functionalQA: createProvider(config.functionalQA),
    adversarial: createProvider(config.adversarial),
    aggregator: createProvider(config.aggregator)
  }

  console.log('[pipeline] Starting multi-agent audit...')
  console.log(`  [1/4] static scan   → ${providers.staticScan.name}/${providers.staticScan.model}`)
  console.log(`  [2/4] functional QA → ${providers.functionalQA.name}/${providers.functionalQA.model}`)
  console.log(`  [3/4] adversarial   → ${providers.adversarial.name}/${providers.adversarial.model}`)
  console.log(`  [4/4] aggregator    → ${providers.aggregator.name}/${providers.aggregator.model}`)

  const [staticScan, functionalQA, adversarial] = await Promise.all([
    runStaticScan(contractCode, providers.staticScan),
    runFunctionalQA(contractCode, providers.functionalQA),
    runAdversarial(contractCode, providers.adversarial)
  ])

  console.log(`[pipeline] Agents 1-3 done:`)
  console.log(`  static_scan  → ${staticScan.issues.length} issues`)
  console.log(`  functional_qa → ${functionalQA.logic_issues.length} logic issues, ${functionalQA.test_scenarios.length} scenarios`)
  console.log(`  adversarial  → ${adversarial.attack_vectors.length} attack vectors`)

  const aggregated = await runAggregator(staticScan, functionalQA, adversarial, providers.aggregator)

  console.log(`[pipeline] Aggregation done → score: ${aggregated.final_score}/100 (${aggregated.final_verdict})`)

  const contractHash = crypto
    .createHash('sha256')
    .update(contractCode)
    .digest('hex')
    .slice(0, 16)

  return {
    contract_hash: contractHash,
    timestamp: new Date().toISOString(),
    agents_used: {
      staticScan: `${providers.staticScan.name}/${providers.staticScan.model}`,
      functionalQA: `${providers.functionalQA.name}/${providers.functionalQA.model}`,
      adversarial: `${providers.adversarial.name}/${providers.adversarial.model}`,
      aggregator: `${providers.aggregator.name}/${providers.aggregator.model}`
    },
    static_scan: staticScan,
    functional_qa: functionalQA,
    adversarial,
    aggregated
  }
}
