// Pure color maths for WCAG contrast. No DOM access — fully unit-testable.
import { colorFunctionToRgb } from './color-spaces'

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Rgba extends Rgb {
  /** Alpha in the 0–1 range. */
  a: number
}

const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function parseChannel(token: string): number {
  const trimmed = token.trim()
  if (trimmed.endsWith('%')) {
    return clampChannel((parseFloat(trimmed) / 100) * 255)
  }
  return clampChannel(parseFloat(trimmed))
}

function parseAlpha(token: string | undefined): number {
  if (token === undefined) return 1
  const trimmed = token.trim()
  if (trimmed === '') return 1
  const value = trimmed.endsWith('%') ? parseFloat(trimmed) / 100 : parseFloat(trimmed)
  if (Number.isNaN(value)) return 1
  return Math.max(0, Math.min(1, value))
}

/**
 * A CSS color function split into its name, component tokens and alpha. Alpha
 * is taken from the `/ a` slash form or the legacy fourth `hsla()` value.
 */
function parseColorFunction(
  value: string
): { name: string; tokens: string[]; alpha: number } | null {
  const open = value.indexOf('(')
  if (open === -1 || !value.endsWith(')')) return null
  const name = value.slice(0, open)
  const [main, slashAlpha] = value.slice(open + 1, -1).split('/')
  const tokens = main.split(/[\s,]+/).filter(Boolean)
  if (tokens.length === 0) return null
  let alphaToken: string | undefined = slashAlpha
  // Legacy comma syntax carries alpha as a fourth value: hsla(h, s, l, a).
  if (alphaToken === undefined && (name === 'hsl' || name === 'hsla') && tokens.length === 4) {
    alphaToken = tokens.pop()
  }
  return { name, tokens, alpha: parseAlpha(alphaToken) }
}

/**
 * Parse a CSS color string into RGBA. Handles the forms `getComputedStyle`
 * actually returns: `rgb()` / `rgba()`, hex and `transparent`, plus the CSS
 * Color 4 functions modern sites emit — `hsl()`, `lab()`, `lch()`, `oklab()`,
 * `oklch()` and `color(srgb …)` — normalizing them to sRGB. Returns `null` only
 * for formats we cannot resolve here (named colors, wide-gamut `color()`
 * spaces), letting callers fall back or skip them.
 */
export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase()
  if (value === '' || value === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  const short = HEX_SHORT.exec(value)
  if (short) {
    return {
      r: parseInt(short[1] + short[1], 16),
      g: parseInt(short[2] + short[2], 16),
      b: parseInt(short[3] + short[3], 16),
      a: short[4] ? parseInt(short[4] + short[4], 16) / 255 : 1,
    }
  }

  const long = HEX_LONG.exec(value)
  if (long) {
    return {
      r: parseInt(long[1], 16),
      g: parseInt(long[2], 16),
      b: parseInt(long[3], 16),
      a: long[4] ? parseInt(long[4], 16) / 255 : 1,
    }
  }

  if (value.startsWith('rgb')) {
    const inner = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'))
    // Split on the alpha separator first, then on commas/whitespace.
    const [rgbPart, alphaPart] = inner.split('/')
    const parts = rgbPart.split(/[\s,]+/).filter(Boolean)
    if (parts.length < 3) return null
    const alphaToken = alphaPart ?? (parts.length >= 4 ? parts[3] : undefined)
    return {
      r: parseChannel(parts[0]),
      g: parseChannel(parts[1]),
      b: parseChannel(parts[2]),
      a: parseAlpha(alphaToken),
    }
  }

  const fn = parseColorFunction(value)
  if (fn) {
    const rgb = colorFunctionToRgb(fn.name, fn.tokens)
    if (rgb) return { ...rgb, a: fn.alpha }
  }

  return null
}

/** Composite a translucent color over an opaque backdrop (straight alpha). */
export function compositeOver(top: Rgba, bottom: Rgb): Rgb {
  const a = top.a
  return {
    r: clampChannel(top.r * a + bottom.r * (1 - a)),
    g: clampChannel(top.g * a + bottom.g * (1 - a)),
    b: clampChannel(top.b * a + bottom.b * (1 - a)),
  }
}

function linearize(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance of an opaque color. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG contrast ratio between two opaque colors (1–21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Round a contrast ratio to two decimals for display. */
export function formatRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100
}
