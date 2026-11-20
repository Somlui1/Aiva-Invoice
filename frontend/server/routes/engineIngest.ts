import { Router } from 'express'
import { findIngestReceipt, ingestEngineResult } from '../../src/server/ingestEngineResult'
import { ingestStats, instanceIdOf } from '../../src/server/runtime'
import { log, errText, bytes } from '../../src/server/log'
import { documentPresence } from '../../src/server/presence'
import { parsePresenceRequest } from '../../src/server/presenceCore'

export const engineIngestRouter = Router()

/** Pick what identifies the payload, without trusting its shape (it is validated later). */
function ids(raw: any) {
  const req = raw && typeof raw === 'object' ? raw.request ?? {} : {}
  const pkg = raw && typeof raw === 'object' ? raw.package ?? {} : {}
  return {
    doc: String(req.dms_doc_id ?? pkg.dms_doc_id ?? '?'),
    vid: String(req.validation_id ?? '?'),
  }
}

/**
 * POST /api/engine/ingest
 *
 * v5.16: one log line per ingest (✓ created · ↺ replay · ✗ rejected/failed) with the time it took,
 * and the response carries `portal_instance` so the Engine can log WHICH Portal stored the document.
 */
engineIngestRouter.post('/ingest', async (req, res) => {
  const t0 = Date.now()
  const raw = req.body
  const { doc, vid } = ids(raw)
  const size = Number(req.headers['content-length'] || 0)
  ingestStats.received++
  ingestStats.lastAt = t0
  ingestStats.lastDocId = doc
  res.locals.logged = true // the request logger stays quiet: this route logs itself
  log.debug('ingest', `← ${doc} ${vid} · ${bytes(size)} · queue ${ingestStats.queued}`)
  try {
    const result = await ingestEngineResult(raw)
    const ms = Date.now() - t0
    if (result.ok) {
      if (result.idempotent_replay) {
        ingestStats.replayed++
        log.info('ingest', `↺ ${doc} ALREADY_PROCESSED (same validation_id) → ${result.portalDocId} · ${result.status} · ${ms}ms`)
      } else {
        ingestStats.created++
        const extra = [
          result.applied_rule,
          result.identity_status,
          result.supersedes ? `supersedes ${result.supersedes}` : '',
          result.duplicate_of ? `duplicate of ${result.duplicate_of}` : '',
        ].filter(Boolean)
        log.info(
          'ingest',
          `✓ ${doc} CREATED → ${result.portalDocId} · ${result.status} · ${extra.join(' · ') || '—'} · ${ms}ms · live→${result.live_notified ?? 0}`,
        )
      }
      ingestStats.lastResult = result.result
    } else {
      if (result.http >= 500) ingestStats.failed++
      else ingestStats.rejected++
      ingestStats.lastResult = `HTTP ${result.http}`
      const why = [result.code, result.error, (result.issues ?? []).slice(0, 3).join(' | ')].filter(Boolean).join(' · ')
      const line = `✗ ${doc} ${vid} HTTP ${result.http} · ${why.slice(0, 400)} · ${ms}ms`
      if (result.http >= 500) log.error('ingest', line)
      else log.warn('ingest', line)
    }
    return res.status(result.http).json({ ...result, portal_instance: instanceIdOf() })
  } catch (err: any) {
    ingestStats.failed++
    ingestStats.lastResult = 'HTTP 500'
    log.error('ingest', `✗ ${doc} ${vid} crashed · ${errText(err)} · ${Date.now() - t0}ms`)
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Internal server error during ingestion',
      http: 500,
      portal_instance: instanceIdOf(),
    })
  }
})

/**
 * GET /api/engine/ingest/:validationId — v5.16 delivery receipt for the Engine.
 * 200 { found: true, portalDocId, status } only when the row is committed in THIS Portal's database;
 * 404 { found: false } otherwise. The Engine marks a Paperless document PROCESSED only after this.
 */
engineIngestRouter.get('/ingest/:validationId', async (req, res) => {
  res.locals.logged = true
  const vid = String(req.params.validationId || '')
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(vid)) {
    return res.status(400).json({ ok: false, found: false, error: 'invalid validation_id', portal_instance: instanceIdOf() })
  }
  try {
    const receipt = await findIngestReceipt(vid)
    if (!receipt) {
      log.warn('ingest', `? receipt check: ${vid} NOT in the database`)
      return res.status(404).json({ ok: true, found: false, validationId: vid, portal_instance: instanceIdOf() })
    }
    log.debug('ingest', `receipt check: ${vid} → ${receipt.portalDocId} · ${receipt.status}`)
    return res.json({ ok: true, found: true, validationId: vid, ...receipt, portal_instance: instanceIdOf() })
  } catch (err) {
    log.error('ingest', `receipt check ${vid} failed · ${errText(err)}`)
    return res.status(503).json({ ok: false, found: false, error: 'database unavailable', portal_instance: instanceIdOf() })
  }
})

/**
 * POST /api/engine/presence — v5.17, read-only. Body `{ dms_doc_ids: ["DMS-12", …] }` (≤ 500).
 * Answers, from THIS Portal's database, which documents exist, whether the queue can read them and
 * whether a new Engine delivery would be accepted. The Engine's reconciler uses it to find Paperless
 * documents tagged "AIVA processed" that never arrived here, and sends only those back for processing.
 */
engineIngestRouter.post('/presence', async (req, res) => {
  res.locals.logged = true
  const parsed = parsePresenceRequest(req.body)
  if (!parsed.ok) {
    return res.status(400).json({ ok: false, error: parsed.error, portal_instance: instanceIdOf() })
  }
  try {
    const documents = await documentPresence(parsed.ids)
    const missing = parsed.ids.filter(id => !documents[id]?.found)
    const unreadable = parsed.ids.filter(id => documents[id]?.found && documents[id]?.readable === false)
    if (missing.length || unreadable.length) {
      log.warn(
        'ingest',
        `presence: ${parsed.ids.length} asked · missing ${missing.length}${missing.length ? ` (${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ' …' : ''})` : ''} · unreadable ${unreadable.length}`,
      )
    } else {
      log.debug('ingest', `presence: ${parsed.ids.length} asked · all present`)
    }
    return res.json({ ok: true, portal_instance: instanceIdOf(), documents })
  } catch (err) {
    log.error('ingest', `presence check failed · ${errText(err)}`)
    // 503 = "cannot tell" — the Engine must not treat it as "missing"
    return res.status(503).json({ ok: false, error: 'database unavailable', portal_instance: instanceIdOf() })
  }
})

