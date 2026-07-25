import {
  BOLD_WEIGHT,
  CONTRAST_THRESHOLDS,
  LARGE_TEXT_BOLD_PX,
  LARGE_TEXT_PX,
} from '@/core/constants'
import type { AuditResult, Issue, Settings, WcagLevel } from '@/core/types'
import { type Rgb, type Rgba, compositeOver, contrastRatio, formatRatio, parseColor } from './color'
import { cssSelector, isHidden, truncate } from './dom'
import { rasterizeColor } from './raster'
import { buildResult } from './result'

/** Resolve a computed color string, falling back to canvas for exotic spaces. */
function resolveColor(raw: string): Rgba | null {
  return parseColor(raw) ?? rasterizeColor(raw)
}

export interface ContrastData {
  level: WcagLevel
  checked: number
  failing: number
  undetermined: number
}

/** WCAG large-text test: ≥18pt, or ≥14pt when bold. */
export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  if (fontSizePx >= LARGE_TEXT_PX) return true
  return fontSizePx >= LARGE_TEXT_BOLD_PX && fontWeight >= BOLD_WEIGHT
}

export function requiredRatio(level: WcagLevel, large: boolean): number {
  const thresholds = CONTRAST_THRESHOLDS[level]
  return large ? thresholds.large : thresholds.normal
}

export interface ContrastVerdict {
  ratio: number
  required: number
  large: boolean
  pass: boolean
}

/** Pure contrast decision for a foreground/background pair at a given size. */
export function evaluateContrast(
  foreground: Rgb,
  background: Rgb,
  fontSizePx: number,
  fontWeight: number,
  level: WcagLevel
): ContrastVerdict {
  const large = isLargeText(fontSizePx, fontWeight)
  const required = requiredRatio(level, large)
  const ratio = contrastRatio(foreground, background)
  return { ratio: formatRatio(ratio), required, large, pass: ratio >= required }
}

const MEDIA_TAGS = new Set(['IMG', 'VIDEO', 'CANVAS', 'PICTURE'])

/** A layer that paints image/media content whose color we cannot sample. */
function isImageLayer(el: Element, style: CSSStyleDeclaration): boolean {
  if (MEDIA_TAGS.has(el.tagName)) return true
  const image = style.backgroundImage
  return image !== '' && image !== 'none'
}

/**
 * Reduce an ordered list of paint layers (front-most first) to the effective
 * background color: stop at the first opaque layer, composite the translucent
 * layers above it, and return null (undetermined) when an image is reached
 * before any opaque color — an image behind translucent text can't be sampled,
 * so it must not be treated as white and fabricate a failure.
 */
export function resolveFromElements(elements: Element[]): Rgb | null {
  const layers: Rgba[] = []
  let base: Rgb | null = null
  for (const node of elements) {
    const style = getComputedStyle(node)
    if (isImageLayer(node, style)) return null
    const color = resolveColor(style.backgroundColor)
    if (!color) return null
    if (color.a > 0) {
      if (color.a >= 1) {
        base = { r: color.r, g: color.g, b: color.b }
        break
      }
      layers.push(color)
    }
  }
  let result: Rgb = base ?? { r: 255, g: 255, b: 255 }
  for (let i = layers.length - 1; i >= 0; i--) {
    result = compositeOver(layers[i], result)
  }
  return result
}

/**
 * The elements painted at the text's center, front-most first, starting at the
 * text element. Hit-testing catches overlays and absolutely-positioned images
 * that sit behind the text without being DOM ancestors. Returns null when
 * hit-testing is unavailable or the element is off-screen, so the caller can
 * fall back to the ancestor chain.
 */
function paintStackElements(el: Element): Element[] | null {
  if (typeof document.elementsFromPoint !== 'function') return null
  const rect = el.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return null
  let stack: Element[]
  try {
    const hit = document.elementsFromPoint(x, y)
    if (!Array.isArray(hit) || hit.length === 0) return null
    stack = hit
  } catch {
    return null
  }
  // A real hit-test always includes the element itself; if it doesn't, the
  // result is unreliable (e.g. a jsdom stub) — fall back to the ancestor chain.
  const index = stack.indexOf(el)
  if (index === -1) return null
  return stack.slice(index)
}

function ancestorElements(el: Element): Element[] {
  const chain: Element[] = []
  let node: Element | null = el
  while (node) {
    chain.push(node)
    node = node.parentElement
  }
  return chain
}

/** Effective background behind an element's text, or null when undetermined. */
function resolveBackground(el: Element): Rgb | null {
  return resolveFromElements(paintStackElements(el) ?? ancestorElements(el))
}

function directTextElements(doc: Document): Element[] {
  const walker = doc.createTreeWalker(doc.body ?? doc.documentElement, NodeFilter.SHOW_TEXT)
  const seen = new Set<Element>()
  const elements: Element[] = []
  let node = walker.nextNode()
  const MAX = 4000
  let visited = 0
  while (node && visited < MAX) {
    visited += 1
    const text = node.textContent ?? ''
    const parent = node.parentElement
    if (parent && text.trim().length > 0 && !seen.has(parent)) {
      const tag = parent.tagName.toLowerCase()
      if (tag !== 'script' && tag !== 'style' && tag !== 'noscript') {
        seen.add(parent)
        elements.push(parent)
      }
    }
    node = walker.nextNode()
  }
  return elements
}

function hasZeroArea(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  return rect.width < 1 || rect.height < 1
}

export function auditContrast(doc: Document, settings: Settings): AuditResult<ContrastData> {
  const level = settings.wcagLevel
  const issues: Issue[] = []
  let checked = 0
  let failing = 0
  let undetermined = 0

  for (const el of directTextElements(doc)) {
    if (isHidden(el) || hasZeroArea(el)) continue
    const style = getComputedStyle(el)
    const fg = resolveColor(style.color)
    if (!fg || fg.a === 0) continue
    const background = resolveBackground(el)
    if (!background) {
      undetermined += 1
      continue
    }
    const foreground = fg.a < 1 ? compositeOver(fg, background) : { r: fg.r, g: fg.g, b: fg.b }
    const fontSize = parseFloat(style.fontSize) || 16
    const fontWeight = parseInt(style.fontWeight, 10) || 400
    const verdict = evaluateContrast(foreground, background, fontSize, fontWeight, level)
    checked += 1
    if (verdict.pass) continue
    failing += 1
    if (issues.length < settings.contrastMaxIssues) {
      issues.push({
        id: `contrast-${issues.length}`,
        severity: 'error',
        title: `Low contrast ${verdict.ratio.toFixed(2)}:1 (needs ${verdict.required}:1)`,
        detail: `${verdict.large ? 'Large' : 'Normal'} text at ${Math.round(fontSize)}px.`,
        selector: cssSelector(el),
        snippet: truncate(el.textContent ?? '', 60),
      })
    }
  }

  if (failing === 0 && checked > 0) {
    issues.push({
      id: 'contrast-pass',
      severity: 'pass',
      title: `All ${checked} text samples meet ${level} contrast`,
    })
  }
  if (failing > settings.contrastMaxIssues) {
    issues.push({
      id: 'contrast-truncated',
      severity: 'info',
      title: `Showing first ${settings.contrastMaxIssues} of ${failing} contrast failures`,
    })
  }
  if (undetermined > 0) {
    issues.push({
      id: 'contrast-undetermined',
      severity: 'info',
      title: `${undetermined} element(s) skipped — text over an image, overlay, or unresolved color`,
    })
  }

  return buildResult('contrast', issues, { level, checked, failing, undetermined })
}
