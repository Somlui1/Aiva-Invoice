/**
 * v5.17 — the user's layout preference (queue size, detail : PDF split, legacy mode).
 *
 * Stored per browser in localStorage (`aiva.layout.v1`), shared by QueuePage, the layout menu and
 * the PDF splitter through `useSyncExternalStore` — no provider needed. The snapshot is re-read from
 * localStorage on every call and memoised by its raw text, so a cleared storage (tests, another tab
 * after a reload) is picked up without a stale cache.
 */
import { useSyncExternalStore } from 'react'
import { DEFAULT_LAYOUT_PREFS, sanitizeLayoutPrefs, type LayoutPrefs, type QueueLayout } from './queueLayout'

export const LAYOUT_PREFS_KEY = 'aiva.layout.v1'

let memoRaw: string | null | undefined
let memo: LayoutPrefs = { ...DEFAULT_LAYOUT_PREFS }
/** Fallback when localStorage is unavailable (private mode, blocked storage). */
let memoryOnly: LayoutPrefs | null = null
const listeners = new Set<() => void>()

function readRaw(): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(LAYOUT_PREFS_KEY) : null
  } catch {
    return null
  }
}

export function getLayoutPrefs(): LayoutPrefs {
  if (memoryOnly) return memoryOnly
  const raw = readRaw()
  if (raw !== memoRaw) {
    memoRaw = raw
    let parsed: unknown = null
    try {
      parsed = raw ? JSON.parse(raw) : null
    } catch {
      parsed = null
    }
    memo = sanitizeLayoutPrefs(parsed)
  }
  return memo
}

function emit() {
  for (const l of listeners) l()
}

/** Merge a change into the preference and persist it. Returns the stored value. */
export function saveLayoutPrefs(patch: Partial<LayoutPrefs>): LayoutPrefs {
  const next = sanitizeLayoutPrefs({ ...getLayoutPrefs(), ...patch })
  try {
    window.localStorage.setItem(LAYOUT_PREFS_KEY, JSON.stringify(next))
    memoryOnly = null
  } catch {
    memoryOnly = next
  }
  emit()
  return next
}

export function resetLayoutPrefs(): LayoutPrefs {
  try {
    window.localStorage.removeItem(LAYOUT_PREFS_KEY)
  } catch {}
  memoryOnly = null
  memoRaw = undefined
  emit()
  return getLayoutPrefs()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === LAYOUT_PREFS_KEY) cb()
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}

export function useLayoutPrefs(): LayoutPrefs {
  return useSyncExternalStore(subscribe, getLayoutPrefs, () => DEFAULT_LAYOUT_PREFS as LayoutPrefs)
}

// ---- effective layout (runtime only, never persisted) — lets the menu say what is used right now ----
export interface EffectiveLayout extends QueueLayout {
  workWidth: number
  pdfOpen: boolean
}
let effective: EffectiveLayout | null = null
const effListeners = new Set<() => void>()

export function publishEffectiveLayout(e: EffectiveLayout | null) {
  const same =
    effective &&
    e &&
    effective.queueWidth === e.queueWidth &&
    effective.queue === e.queue &&
    effective.ratio === e.ratio &&
    effective.detailHidden === e.detailHidden &&
    effective.workWidth === e.workWidth &&
    effective.pdfOpen === e.pdfOpen &&
    effective.notes.join('|') === e.notes.join('|')
  if (same || (!effective && !e)) return
  effective = e
  for (const l of effListeners) l()
}

export function useEffectiveLayout(): EffectiveLayout | null {
  return useSyncExternalStore(
    cb => {
      effListeners.add(cb)
      return () => effListeners.delete(cb)
    },
    () => effective,
    () => null,
  )
}
