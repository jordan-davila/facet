import { describe, expect, it } from 'vitest'
import {
  type Rgba,
  compositeOver,
  contrastRatio,
  formatRatio,
  parseColor,
  relativeLuminance,
} from '@/audits/color'

/** Assert a color parses to the expected RGBA, allowing small rounding drift. */
function assertRgba(input: string, expected: Rgba, tolerance = 2): void {
  const actual = parseColor(input)
  expect(actual, `${input} should parse`).not.toBeNull()
  if (!actual) return
  expect(Math.abs(actual.r - expected.r), `${input} r`).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(actual.g - expected.g), `${input} g`).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(actual.b - expected.b), `${input} b`).toBeLessThanOrEqual(tolerance)
  expect(actual.a, `${input} a`).toBeCloseTo(expected.a, 3)
}

describe('parseColor', () => {
  it('parses comma-separated rgb', () => {
    expect(parseColor('rgb(255, 128, 0)')).toEqual({ r: 255, g: 128, b: 0, a: 1 })
  })

  it('parses rgba with alpha', () => {
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0, a: 0.5 })
  })

  it('parses space-separated rgb with slash alpha', () => {
    expect(parseColor('rgb(10 20 30 / 0.25)')).toEqual({ r: 10, g: 20, b: 30, a: 0.25 })
  })

  it('parses long and short hex', () => {
    expect(parseColor('#ff8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(parseColor('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
  })

  it('treats transparent as zero alpha', () => {
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it('returns null for genuinely unresolvable formats', () => {
    expect(parseColor('rebeccapurple')).toBeNull()
    expect(parseColor('color(display-p3 1 0 0)')).toBeNull()
    expect(parseColor('color(rec2020 1 0 0)')).toBeNull()
    expect(parseColor('hwb(0 0% 0%)')).toBeNull()
    expect(parseColor('not-a-color')).toBeNull()
  })
})

describe('parseColor (CSS Color 4)', () => {
  it('parses oklch black and white', () => {
    assertRgba('oklch(0 0 0)', { r: 0, g: 0, b: 0, a: 1 }, 1)
    assertRgba('oklch(1 0 0)', { r: 255, g: 255, b: 255, a: 1 }, 1)
  })

  it('parses hsl black and white', () => {
    assertRgba('hsl(0 0% 0%)', { r: 0, g: 0, b: 0, a: 1 }, 1)
    assertRgba('hsl(0 0% 100%)', { r: 255, g: 255, b: 255, a: 1 }, 1)
  })

  it('parses saturated hsl in space and legacy comma syntax', () => {
    assertRgba('hsl(120 50% 50%)', { r: 64, g: 191, b: 64, a: 1 })
    assertRgba('hsl(0, 100%, 50%)', { r: 255, g: 0, b: 0, a: 1 })
    assertRgba('hsla(240, 100%, 50%, 0.5)', { r: 0, g: 0, b: 255, a: 0.5 })
  })

  it('parses color(srgb …)', () => {
    assertRgba('color(srgb 0 0 0)', { r: 0, g: 0, b: 0, a: 1 }, 1)
    assertRgba('color(srgb 1 1 1)', { r: 255, g: 255, b: 255, a: 1 }, 1)
    assertRgba('color(srgb 0.5 0.25 0.75)', { r: 128, g: 64, b: 191, a: 1 })
  })

  it('parses the lab/oklab colors modern sites actually emit', () => {
    // Real serialized values sampled from shadcn/ui and tailwindcss.com.
    assertRgba('lab(2.75381 0 0)', { r: 10, g: 10, b: 10, a: 1 })
    assertRgba('lab(98.26 0 0)', { r: 250, g: 250, b: 250, a: 1 })
    assertRgba('lab(50 40 60)', { r: 191, g: 87, b: 0, a: 1 })
  })

  it('parses lch and color(srgb-linear …)', () => {
    assertRgba('lch(50 40 60)', { r: 162, g: 105, b: 60, a: 1 })
    assertRgba('color(srgb-linear 0 0 0)', { r: 0, g: 0, b: 0, a: 1 }, 1)
    assertRgba('color(srgb-linear 1 1 1)', { r: 255, g: 255, b: 255, a: 1 }, 1)
    assertRgba('color(srgb-linear 0.5 0.5 0.5)', { r: 188, g: 188, b: 188, a: 1 })
  })

  it('carries slash alpha through oklab and oklch', () => {
    assertRgba('oklab(0.999998 0 0 / 0.045)', { r: 255, g: 255, b: 255, a: 0.045 })
    assertRgba('oklch(0.7 0.15 200 / 0.5)', { r: 0, g: 185, b: 195, a: 0.5 })
  })
})

describe('luminance and contrast', () => {
  it('computes luminance extremes', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5)
  })

  it('black on white is 21:1', () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })
    expect(formatRatio(ratio)).toBe(21)
  })

  it('identical colors are 1:1', () => {
    expect(contrastRatio({ r: 120, g: 120, b: 120 }, { r: 120, g: 120, b: 120 })).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    const a = { r: 30, g: 60, b: 90 }
    const b = { r: 200, g: 210, b: 220 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })
})

describe('compositeOver', () => {
  it('50% black over white is mid gray', () => {
    expect(compositeOver({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255 })).toEqual({
      r: 128,
      g: 128,
      b: 128,
    })
  })

  it('opaque top ignores the backdrop', () => {
    expect(compositeOver({ r: 10, g: 20, b: 30, a: 1 }, { r: 255, g: 255, b: 255 })).toEqual({
      r: 10,
      g: 20,
      b: 30,
    })
  })
})
