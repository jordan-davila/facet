import { describe, expect, it } from 'vitest'
import { evaluateContrast, isLargeText, requiredRatio } from '@/audits/contrast'

describe('isLargeText', () => {
  it('treats 24px and up as large', () => {
    expect(isLargeText(24, 400)).toBe(true)
    expect(isLargeText(23, 400)).toBe(false)
  })

  it('treats 18.66px bold as large', () => {
    expect(isLargeText(19, 700)).toBe(true)
    expect(isLargeText(19, 400)).toBe(false)
  })
})

describe('requiredRatio', () => {
  it('uses WCAG AA thresholds', () => {
    expect(requiredRatio('AA', false)).toBe(4.5)
    expect(requiredRatio('AA', true)).toBe(3)
  })

  it('uses WCAG AAA thresholds', () => {
    expect(requiredRatio('AAA', false)).toBe(7)
    expect(requiredRatio('AAA', true)).toBe(4.5)
  })
})

describe('evaluateContrast', () => {
  const black = { r: 0, g: 0, b: 0 }
  const white = { r: 255, g: 255, b: 255 }
  const gray = { r: 150, g: 150, b: 150 }

  it('passes black on white for normal AA text', () => {
    const verdict = evaluateContrast(black, white, 16, 400, 'AA')
    expect(verdict.pass).toBe(true)
    expect(verdict.ratio).toBe(21)
    expect(verdict.required).toBe(4.5)
  })

  it('fails mid-gray on white for normal text', () => {
    const verdict = evaluateContrast(gray, white, 16, 400, 'AA')
    expect(verdict.pass).toBe(false)
  })

  it('applies the relaxed large-text threshold', () => {
    const normal = evaluateContrast(gray, white, 16, 400, 'AA')
    const large = evaluateContrast(gray, white, 30, 400, 'AA')
    expect(normal.required).toBe(4.5)
    expect(large.required).toBe(3)
  })
})
