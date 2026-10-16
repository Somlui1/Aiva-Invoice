export type RoleKey = 'EU' | 'ACC' | 'APR' | 'ADM' | 'SA'

export type Permission =
  | 'VIEW_OWN'
  | 'VIEW_CO'
  | 'DMS'
  | 'UPLOAD_NEW'
  | 'CONFIRM'
  | 'REVIEW'
  | 'HOLD'
  | 'REJECT'
  | 'MANUAL_REVIEW'
  | 'DUP_OVERRIDE'
  | 'UNCONFIRM'
  | 'POST'
  | 'RETURN_FAILED'
  | 'VIEW_AP'
  | 'MAP'
  | 'AUDIT'

export interface Role {
  n: string          // Thai display name
  c: string          // Text color
  bg: string         // Background pill color
  p: Permission[]    // Allowed permissions
  scope: 'receiver' | 'company' | 'none' | 'all'
  postMax?: number   // Max AP post threshold
}

export interface User {
  id: string
  n: string          // Thai name
  email: string
  role: RoleKey
  rcvName: string    // Oracle Receiver name
  emp: number | null
  co: string[]       // Company codes: AH, AHT, AHP, AM
  unit: string       // Department/Unit name
}

export interface AccountMapping {
  id: string
  user: string       // User ID (e.g., 'u1')
  acct: string       // Oracle account string (e.g., 'SOMSAK JAIDEE')
  by: string         // Created by
  at: string         // Date YYYY-MM-DD
  req: string        // Ticket/request ref (e.g. 'INC-0998')
}
