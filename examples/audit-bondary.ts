#!/usr/bin/env tsx
/**
 * Demo: run the audit pipeline on all Bondary contracts.
 *
 * Usage:
 *   BONDARY_PATH=/path/to/bondary/src tsx examples/audit-bondary.ts
 *
 * Defaults BONDARY_PATH to ../../bondary/src (sibling repo checkout).
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { runAuditPipeline } from '../src/pipeline/orchestrator'
import { defaultConfig } from '../config/default'

const BONDARY_SRC = process.env.BONDARY_PATH ?? path.resolve(__dirname, '../../bondary/src')

const CONTRACTS = [
  'BondVault.sol',
  'BondaryMarketplace.sol',
  'BondVaultFactory.sol',
  'BondaryFeeCollector.sol',
  'BondaryWhitelist.sol'
]

async function main() {
  const bar = '═'.repeat(60)

  for (const name of CONTRACTS) {
    const filePath = path.join(BONDARY_SRC, name)

    if (!fs.existsSync(filePath)) {
      console.log(`[skip] ${name} not found at ${filePath}`)
      continue
    }

    console.log(`\n${bar}`)
    console.log(`  Auditing: ${name}`)
    console.log(bar)

    const contractCode = fs.readFileSync(filePath, 'utf8')
    const report = await runAuditPipeline(contractCode, defaultConfig)

    const outPath = path.resolve(
      __dirname,
      `audit-${name.replace('.sol', '')}-${Date.now()}.json`
    )
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

    console.log(`  Score  : ${report.aggregated.final_score}/100 — ${report.aggregated.final_verdict}`)
    console.log(`  Issues : ${report.aggregated.confirmed_issues.length} confirmed`)
    console.log(`  Report : ${outPath}`)
  }

  console.log('\nAll contracts audited.')
}

main().catch(err => {
  console.error('[bondary-demo] Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
