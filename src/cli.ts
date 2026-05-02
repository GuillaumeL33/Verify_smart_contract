#!/usr/bin/env tsx
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { runAuditPipeline } from './pipeline/orchestrator'
import { defaultConfig } from '../config/default'

async function main() {
  const filePath = process.argv[2]

  if (!filePath) {
    console.error('Usage: tsx src/cli.ts <path-to-contract.sol>')
    process.exit(1)
  }

  const resolved = path.resolve(filePath)
  const contractCode = fs.readFileSync(resolved, 'utf8')
  console.log(`[cli] Auditing: ${path.basename(resolved)} (${contractCode.length} chars)\n`)

  const report = await runAuditPipeline(contractCode, defaultConfig)

  const outPath = path.resolve(
    path.dirname(resolved),
    `audit-${report.contract_hash}-${Date.now()}.json`
  )
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  const bar = '═'.repeat(50)
  console.log(`\n${bar}`)
  console.log(`  Score  : ${report.aggregated.final_score}/100`)
  console.log(`  Verdict: ${report.aggregated.final_verdict.toUpperCase()}`)
  console.log(`  Issues : ${report.aggregated.confirmed_issues.length} confirmed`)
  console.log(`${bar}`)

  if (report.aggregated.top_risks.length) {
    console.log('\nTop risks:')
    report.aggregated.top_risks.forEach((r, i) => console.log(`  ${i + 1}. ${r}`))
  }

  console.log(`\nFull report: ${outPath}\n`)
}

main().catch(err => {
  console.error('[cli] Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
