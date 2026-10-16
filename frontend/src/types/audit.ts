export interface AuditEntry {
  id?: string
  dt: string
  t: string
  category?: string
  who: string
  role: string
  act: string
  doc: string
  detail: string
  metadataJson?: string | null
}
