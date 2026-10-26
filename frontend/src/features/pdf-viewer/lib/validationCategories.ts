/**
 * Validation Category Theme Definitions & Color Palette.
 * Design: docs/plans/2026-10-11-validation-evidence-pdf-linking-design.md
 */

export type ValidationCategory = 'missing' | 'mismatch' | 'calculation' | 'duplicate'

export interface CategoryTheme {
  nameTh: string
  borderColor: string
  bgColor: string
  glowColor: string
  tagBg: string
  tagColor: string
}

export const VALIDATION_CATEGORY_THEMES: Record<ValidationCategory, CategoryTheme> = {
  missing: {
    nameTh: 'ข้อมูลไม่ครบถ้วน',
    borderColor: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.15)',
    glowColor: 'rgba(217, 119, 6, 0.40)',
    tagBg: '#FEF3C7',
    tagColor: '#92400E',
  },
  mismatch: {
    nameTh: 'ราคา/จำนวนไม่ตรงกับใบรับ',
    borderColor: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
    glowColor: 'rgba(220, 38, 38, 0.40)',
    tagBg: '#FEE2E2',
    tagColor: '#991B1B',
  },
  calculation: {
    nameTh: 'การคำนวณและภาษี',
    borderColor: '#0284C7',
    bgColor: 'rgba(2, 132, 199, 0.15)',
    glowColor: 'rgba(2, 132, 199, 0.40)',
    tagBg: '#E0F2FE',
    tagColor: '#075985',
  },
  duplicate: {
    nameTh: 'เอกสาร/รายการซ้ำ',
    borderColor: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.15)',
    glowColor: 'rgba(124, 58, 237, 0.40)',
    tagBg: '#EDE9FE',
    tagColor: '#5B21B6',
  },
}

export function getValidationCategory(code?: string | null, ruleId?: string | null): ValidationCategory {
  if (ruleId === 'duplicate') return 'duplicate'
  // The Engine raises E11 in V-07 when a line was paired *by description* — a matching question, not
  // a duplicate document. Only an E11 without that context keeps the purple "duplicate" colour.
  if (code === 'E11' && ruleId === 'V-07') return 'mismatch'
  if (code === 'E11') return 'duplicate'
  if (['E01', 'E05', 'E08'].includes(code || '') || ['V-01', 'V-04', 'V-06'].includes(ruleId || '')) {
    return 'missing'
  }
  if (
    ['E02', 'E03', 'E04', 'E14', 'E15'].includes(code || '') ||
    ['V-02', 'V-03', 'V-08', 'V-09'].includes(ruleId || '')
  ) {
    return 'calculation'
  }
  if (
    ['E07', 'E09', 'E10', 'E12', 'E13'].includes(code || '') ||
    ['V-05', 'V-07'].includes(ruleId || '')
  ) {
    return 'mismatch'
  }
  return 'mismatch'
}
