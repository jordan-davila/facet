// CSS Color 4 → sRGB conversions. Pure maths, no DOM, fully unit-testable.
//
// `getComputedStyle` on modern sites (Tailwind v4 / shadcn, anything using CSS
// Color 4) returns colors as `hsl()`, `lab()`, `lch()`, `oklab()`, `oklch()` or
// `color(srgb …)` rather than `rgb()`. These converters turn the already-parsed
// numeric components into an opaque sRGB color (0–255); the caller in `color.ts`
// handles the CSS function syntax and alpha.
import type { Rgb } from './color'

type Matrix = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
]

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function applyMatrix(m: Matrix, v: readonly [number, number, number]): [number, number, number] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ]
}

/** Encode one linear-light sRGB channel (0–1) to gamma sRGB scaled to 0–255. */
function encodeChannel(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
  return clamp255(c * 255)
}

function linearSrgbToRgb(r: number, g: number, b: number): Rgb {
  return { r: encodeChannel(r), g: encodeChannel(g), b: encodeChannel(b) }
}

function hueSextant(hue: number, c: number, x: number): [number, number, number] {
  if (hue < 60) return [c, x, 0]
  if (hue < 120) return [x, c, 0]
  if (hue < 180) return [0, c, x]
  if (hue < 240) return [0, x, c]
  if (hue < 300) return [x, 0, c]
  return [c, 0, x]
}

/** hsl → sRGB. `h` in degrees, `s` and `l` in 0–1. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r1, g1, b1] = hueSextant(hue, c, x)
  return { r: clamp255((r1 + m) * 255), g: clamp255((g1 + m) * 255), b: clamp255((b1 + m) * 255) }
}

/** OKLab → sRGB (Björn Ottosson's reference transform). `L` in 0–1. */
export function oklabToRgb(L: number, a: number, b: number): Rgb {
  const lRoot = L + 0.3963377774 * a + 0.2158037573 * b
  const mRoot = L - 0.1055613458 * a - 0.0638541728 * b
  const sRoot = L - 0.0894841775 * a - 1.291485548 * b
  const l = lRoot * lRoot * lRoot
  const m = mRoot * mRoot * mRoot
  const s = sRoot * sRoot * sRoot
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return linearSrgbToRgb(lr, lg, lb)
}

/** OKLCh → sRGB. `L` in 0–1, `C` chroma, `h` hue in degrees. */
export function oklchToRgb(L: number, C: number, h: number): Rgb {
  const rad = (h * Math.PI) / 180
  return oklabToRgb(L, C * Math.cos(rad), C * Math.sin(rad))
}

const KAPPA = 24389 / 27
const EPSILON = 216 / 24389
// CIE Lab in CSS Color 4 is relative to the D50 white point.
const D50: readonly [number, number, number] = [
  0.3457 / 0.3585,
  1.0,
  (1 - 0.3457 - 0.3585) / 0.3585,
]

// Bradford chromatic adaptation, D50 → D65 (CSS Color 4 reference values).
const BRADFORD_D50_TO_D65: Matrix = [
  [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
  [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
  [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
]

// XYZ (D65) → linear-light sRGB (CSS Color 4 reference values).
const XYZ_D65_TO_LINEAR_SRGB: Matrix = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
]

function labToXyzD50(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200
  const fx3 = fx * fx * fx
  const fz3 = fz * fz * fz
  const xr = fx3 > EPSILON ? fx3 : (116 * fx - 16) / KAPPA
  const yr = L > KAPPA * EPSILON ? fy * fy * fy : L / KAPPA
  const zr = fz3 > EPSILON ? fz3 : (116 * fz - 16) / KAPPA
  return [xr * D50[0], yr * D50[1], zr * D50[2]]
}

/** CIE Lab (D50) → sRGB. `L` in 0–100. */
export function labToRgb(L: number, a: number, b: number): Rgb {
  const xyzD65 = applyMatrix(BRADFORD_D50_TO_D65, labToXyzD50(L, a, b))
  const [lr, lg, lb] = applyMatrix(XYZ_D65_TO_LINEAR_SRGB, xyzD65)
  return linearSrgbToRgb(lr, lg, lb)
}

/** CIE LCh (D50) → sRGB. `L` in 0–100, `C` chroma, `h` hue in degrees. */
export function lchToRgb(L: number, C: number, h: number): Rgb {
  const rad = (h * Math.PI) / 180
  return labToRgb(L, C * Math.cos(rad), C * Math.sin(rad))
}

function componentValue(token: string): number {
  if (token === 'none') return 0
  const n = parseFloat(token)
  return Number.isNaN(n) ? 0 : n
}

/** hsl S/L: percentage → 0–1, clamped. */
function fraction(token: string): number {
  return clamp01(componentValue(token) / 100)
}

/** OKLab/OKLCh lightness: `%` maps to 0–1, otherwise taken as-is. */
function lightness01(token: string): number {
  const v = componentValue(token)
  return token.endsWith('%') ? v / 100 : v
}

/** A `color(space …)` channel: `%` maps to 0–1, otherwise already 0–1. */
function colorChannel(token: string): number {
  const v = componentValue(token)
  return token.endsWith('%') ? v / 100 : v
}

function colorSpaceToRgb(tokens: readonly string[]): Rgb | null {
  if (tokens.length < 4) return null
  const [r, g, b] = [colorChannel(tokens[1]), colorChannel(tokens[2]), colorChannel(tokens[3])]
  if (tokens[0] === 'srgb') {
    return { r: clamp255(r * 255), g: clamp255(g * 255), b: clamp255(b * 255) }
  }
  if (tokens[0] === 'srgb-linear') return linearSrgbToRgb(r, g, b)
  return null
}

/**
 * Convert a parsed CSS color function (name + component tokens, alpha already
 * stripped) to opaque sRGB. Returns `null` for functions/color spaces we do not
 * model, so the caller can fall back or skip.
 */
export function colorFunctionToRgb(name: string, tokens: readonly string[]): Rgb | null {
  if (tokens.length < 3 && name !== 'color') return null
  switch (name) {
    case 'hsl':
    case 'hsla':
      return hslToRgb(componentValue(tokens[0]), fraction(tokens[1]), fraction(tokens[2]))
    case 'lab':
      return labToRgb(
        componentValue(tokens[0]),
        componentValue(tokens[1]),
        componentValue(tokens[2])
      )
    case 'lch':
      return lchToRgb(
        componentValue(tokens[0]),
        componentValue(tokens[1]),
        componentValue(tokens[2])
      )
    case 'oklab':
      return oklabToRgb(
        lightness01(tokens[0]),
        componentValue(tokens[1]),
        componentValue(tokens[2])
      )
    case 'oklch':
      return oklchToRgb(
        lightness01(tokens[0]),
        componentValue(tokens[1]),
        componentValue(tokens[2])
      )
    case 'color':
      return colorSpaceToRgb(tokens)
    default:
      return null
  }
}
