import { InvoiceStatus } from './invoice'

export interface SimRecord {
  doc: string
  company: string
  vendor: string
  stax: string
  inv: string
  dt: string
  total: number
  po?: string
  receiver?: string
  receiverActive?: boolean
  status: InvoiceStatus
  up: string
  codes: string[]
  unres?: boolean
}

export interface SimTraceStep {
  name: string
  status: 'ok' | 'warn' | 'bad' | 'info'
  detail: string
}

export interface ScenarioPreset {
  id: string
  title: string
  desc: string
  payload: Record<string, unknown>
}

export interface SimState {
  preset: string
  json: string
  recs: SimRecord[]
  trace: SimTraceStep[]
  lastResult?: {
    http: number
    status: string
    recommendation: string
    errors: string[]
    warnings: string[]
  }
}
