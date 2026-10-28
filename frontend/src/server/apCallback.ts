/**
 * Oracle AP callback item → outcome (v5.11). Pure; used by POST /api/ap/batches/:id/callback.
 *
 *   result: 'SUCCESS'        → Posted
 *   result: 'ALREADY_EXISTS' → Posted (already in Oracle AP, e.g. keyed in Oracle directly)
 *   result: 'ERROR'          → Import Failed (errorCode such as "404" is kept with the message)
 *   no `result`              → pre-v5.11 `success: boolean` (true = SUCCESS, false = ERROR)
 *   anything else            → null (the item is skipped and audited)
 */
export type CallbackOutcome = 'SUCCESS' | 'ALREADY_EXISTS' | 'ERROR'

export function callbackOutcome(item: unknown): CallbackOutcome | null {
  const it = (item && typeof item === 'object' ? item : {}) as { result?: unknown; success?: unknown }
  const r = typeof it.result === 'string' ? it.result.trim().toUpperCase() : null
  if (r === 'SUCCESS' || r === 'ALREADY_EXISTS' || r === 'ERROR') return r
  if (r) return null
  if (typeof it.success === 'boolean') return it.success ? 'SUCCESS' : 'ERROR'
  return null
}
