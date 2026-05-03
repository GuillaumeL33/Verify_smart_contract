import 'dotenv/config'
import express from 'express'
import { runAuditPipeline } from '../pipeline/orchestrator'
import { defaultConfig } from '../../config/default'
import type { PipelineConfig } from '../types'

const app = express()
app.use(express.json({ limit: '2mb' }))

/**
 * POST /audit
 *
 * Body:
 *   contractCode : string  (required) — raw Solidity source
 *   config       : Partial<PipelineConfig>  (optional) — per-agent LLM overrides
 *
 * Returns: AuditReport JSON
 */
app.post('/audit', async (req, res) => {
  const { contractCode, config } = req.body as {
    contractCode?: string
    config?: Partial<PipelineConfig>
  }

  if (!contractCode || typeof contractCode !== 'string') {
    return res.status(400).json({ error: 'contractCode (string) is required' })
  }
  if (contractCode.length > 500_000) {
    return res.status(400).json({ error: 'Contract too large (max 500 KB)' })
  }

  const pipelineConfig: PipelineConfig = { ...defaultConfig, ...config }

  try {
    const report = await runAuditPipeline(contractCode, pipelineConfig)
    return res.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api] Audit failed:', message)
    return res.status(500).json({ error: message })
  }
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = Number(process.env.PORT ?? 3000)
app.listen(PORT, () => console.log(`[api] verify-smart-contract listening on :${PORT}`))

export default app
