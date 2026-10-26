/**
 * Validation Category Theme Definitions & Palette Tests.
 * Design: docs/plans/2026-10-11-validation-evidence-pdf-linking-design.md
 * Plan:   docs/plans/2026-10-11-validation-evidence-pdf-linking.md
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  getValidationCategory,
  VALIDATION_CATEGORY_THEMES,
  type ValidationCategory,
} from '../features/pdf-viewer/lib/validationCategories'

describe('Task 2: Validation Category Theme Definitions & Color Palette', () => {
  it('maps exception codes to the correct validation category', () => {
    // missing: E01, E05, E08
    expect(getValidationCategory('E01')).toBe('missing')
    expect(getValidationCategory('E05')).toBe('missing')
    expect(getValidationCategory('E08')).toBe('missing')

    // mismatch: E07, E09, E10, E12, E13
    expect(getValidationCategory('E07')).toBe('mismatch')
    expect(getValidationCategory('E09')).toBe('mismatch')
    expect(getValidationCategory('E10')).toBe('mismatch')
    expect(getValidationCategory('E12')).toBe('mismatch')
    expect(getValidationCategory('E13')).toBe('mismatch')

    // calculation: E02, E03, E04, E14, E15
    expect(getValidationCategory('E02')).toBe('calculation')
    expect(getValidationCategory('E03')).toBe('calculation')
    expect(getValidationCategory('E04')).toBe('calculation')
    expect(getValidationCategory('E14')).toBe('calculation')
    expect(getValidationCategory('E15')).toBe('calculation')

    // duplicate: E11
    expect(getValidationCategory('E11')).toBe('duplicate')
  })

  it('E11 raised by V-07 (line paired by description) is a mismatch, not a duplicate', () => {
    expect(getValidationCategory('E11', 'V-07')).toBe('mismatch')
    expect(getValidationCategory('E11', 'duplicate')).toBe('duplicate')
    expect(getValidationCategory(null, 'duplicate')).toBe('duplicate')
  })

  it('maps rule IDs and fallback to appropriate categories', () => {
    expect(getValidationCategory(null, 'V-01')).toBe('missing')
    expect(getValidationCategory(null, 'V-04')).toBe('missing')
    expect(getValidationCategory(null, 'V-06')).toBe('missing')
    expect(getValidationCategory(null, 'V-07')).toBe('mismatch')
    expect(getValidationCategory(null, 'V-02')).toBe('calculation')
    expect(getValidationCategory(null, 'V-03')).toBe('calculation')
    expect(getValidationCategory(null, 'V-08')).toBe('calculation')
    expect(getValidationCategory(null, 'duplicate')).toBe('duplicate')
  })

  it('defines consistent theme tokens for all 4 categories', () => {
    const categories: ValidationCategory[] = ['missing', 'mismatch', 'calculation', 'duplicate']
    for (const cat of categories) {
      const theme = VALIDATION_CATEGORY_THEMES[cat]
      expect(theme).toBeDefined()
      expect(theme.nameTh).toBeTruthy()
      expect(theme.borderColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(theme.bgColor).toMatch(/^rgba\(/)
      expect(theme.glowColor).toMatch(/^rgba\(/)
      expect(theme.tagBg).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(theme.tagColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('declares category css classes in evidence.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/evidence.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    expect(cssContent).toMatch(/\.hl\.cat-missing/)
    expect(cssContent).toMatch(/\.hl\.cat-mismatch/)
    expect(cssContent).toMatch(/\.hl\.cat-calculation/)
    expect(cssContent).toMatch(/\.hl\.cat-duplicate/)
  })
})
