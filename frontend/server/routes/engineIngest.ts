import { Router } from 'express'
import { ingestEngineResult } from '../../src/server/ingestEngineResult'

export const engineIngestRouter = Router()

/**
 * POST /api/engine/ingest
 */
engineIngestRouter.post('/ingest', async (req, res) => {
  try {
    const raw = req.body
    const result = await ingestEngineResult(raw)
    return res.status(result.http).json(result)
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Internal server error during ingestion',
      http: 500,
    })
  }
})
