import { describe, expect, it } from 'vitest'
import { computeZoom, MIN_ZOOM } from '../lib/uiZoom'

describe('v5.10.2 fit-to-screen zoom', () => {
  it('never zooms in on a large screen', () => {
    expect(computeZoom(2560, 1440)).toBe(1)
    expect(computeZoom(1920, 1000)).toBe(1)
  })
  it('scales by the tighter of width / height', () => {
    expect(computeZoom(1536, 1000)).toBe(0.8)
    expect(computeZoom(1920, 800)).toBe(0.8)
  })
  it('clamps to MIN_ZOOM on small laptops', () => {
    expect(computeZoom(1280, 600)).toBe(MIN_ZOOM)
  })
  it('does not scale phones / tablets and bad input', () => {
    expect(computeZoom(800, 600)).toBe(1)
    expect(computeZoom(0, 0)).toBe(1)
    expect(computeZoom(NaN, 900)).toBe(1)
  })
})
