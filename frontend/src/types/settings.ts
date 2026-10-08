export interface PersonalPreferences {
  period?: string | null
  view?: 'table' | 'split' | null
  cols?: Record<string, boolean>
  showClosed?: boolean
}

export interface OrgSettings {
  staleDays: number
  limit: {
    APR: number
  }
  hideClosed: boolean
  period: string
  euReason: 'all' | 'reason' | 'none'
  print: {
    EU: boolean
    ACC: boolean
    APR: boolean
  }
  reasons: Record<string, string[]>
}

export interface SettingLogEntry {
  dt: string
  t: string
  who: string
  role: string
  what: string
  o: string
  n: string
  ref: string
}
