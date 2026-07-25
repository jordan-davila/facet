import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { auditContrast, resolveFromElements } from '@/audits/contrast'
import { DEFAULT_SETTINGS } from '@/core/settings'
import { parseBody } from './helpers'

function div(backgroundColor?: string): HTMLElement {
  const el = document.createElement('div')
  if (backgroundColor) el.style.backgroundColor = backgroundColor
  return el
}

// jsdom has no layout, so give elements a non-zero box for the area check.
const originalRect = Element.prototype.getBoundingClientRect
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function () {
    return {
      width: 120,
      height: 24,
      top: 0,
      left: 0,
      right: 120,
      bottom: 24,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect
  }
})
afterAll(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

describe('auditContrast (DOM)', () => {
  it('flags low-contrast text', () => {
    const doc = parseBody(
      '<p style="color: rgb(170, 170, 170); background-color: rgb(255, 255, 255)">hello world</p>'
    )
    const result = auditContrast(doc, DEFAULT_SETTINGS)
    expect(result.data.checked).toBeGreaterThanOrEqual(1)
    expect(result.data.failing).toBeGreaterThanOrEqual(1)
  })

  it('passes high-contrast text', () => {
    const doc = parseBody(
      '<p style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255)">hello world</p>'
    )
    const result = auditContrast(doc, DEFAULT_SETTINGS)
    expect(result.data.failing).toBe(0)
  })
})

describe('auditContrast (modern color spaces)', () => {
  it('passes white text on a dark oklch background', () => {
    const doc = parseBody(
      '<p style="color: oklch(1 0 0); background-color: oklch(0.2 0 0)">hello world</p>'
    )
    const result = auditContrast(doc, DEFAULT_SETTINGS)
    expect(result.data.checked).toBeGreaterThanOrEqual(1)
    expect(result.data.failing).toBe(0)
  })

  it('passes white text on a dark lab section (the real shadcn/ui regression)', () => {
    // Previously the lab() background was unparseable, so resolveBackground
    // walked to the root and defaulted to white → a false ~1:1 failure.
    const doc = parseBody(
      '<div style="background-color: lab(2.75381 0 0)">' +
        '<p style="color: rgb(255, 255, 255)">hello world</p></div>'
    )
    const result = auditContrast(doc, DEFAULT_SETTINGS)
    expect(result.data.checked).toBeGreaterThanOrEqual(1)
    expect(result.data.failing).toBe(0)
  })

  it('still fails low-contrast gray text on a white oklch background', () => {
    const doc = parseBody(
      '<p style="color: oklch(0.6 0 0); background-color: oklch(1 0 0)">hello world</p>'
    )
    const result = auditContrast(doc, DEFAULT_SETTINGS)
    expect(result.data.failing).toBeGreaterThanOrEqual(1)
  })

  it('counts an unresolvable background as undetermined, never a false failure', () => {
    // With no 2D canvas context (as in jsdom) the raster fallback must no-op,
    // and an unresolvable non-transparent background must be skipped, not
    // defaulted to white and failed.
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext
    try {
      const doc = parseBody(
        '<p style="color: rgb(255, 255, 255); background-color: color(display-p3 0.1 0.1 0.1)">hello world</p>'
      )
      const result = auditContrast(doc, DEFAULT_SETTINGS)
      expect(result.data.failing).toBe(0)
      expect(result.data.undetermined).toBeGreaterThanOrEqual(1)
    } finally {
      HTMLCanvasElement.prototype.getContext = originalGetContext
    }
  })
})

describe('resolveFromElements (paint stack)', () => {
  it('is undetermined when an image sits behind a translucent overlay', () => {
    const stack = [
      document.createElement('h1'), // transparent text element
      div(), // transparent content wrapper
      div('rgba(0, 0, 0, 0.55)'), // dark overlay
      document.createElement('img'), // image we cannot sample
    ]
    expect(resolveFromElements(stack)).toBeNull()
  })

  it('composites a translucent overlay over an opaque section', () => {
    const bg = resolveFromElements([
      document.createElement('p'),
      div('rgba(255, 255, 255, 0.2)'), // 20% white overlay
      div('rgb(0, 0, 0)'), // opaque black section
    ])
    expect(bg).not.toBeNull()
    expect(bg?.r).toBe(51) // 0.2 * 255
  })

  it('stops at the first opaque layer and ignores an image below it', () => {
    const bg = resolveFromElements([
      document.createElement('span'),
      div('rgb(255, 255, 255)'), // opaque white card occludes anything behind
      document.createElement('img'),
    ])
    expect(bg).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('defaults to white when every layer is transparent', () => {
    expect(resolveFromElements([document.createElement('p'), div()])).toEqual({
      r: 255,
      g: 255,
      b: 255,
    })
  })
})
