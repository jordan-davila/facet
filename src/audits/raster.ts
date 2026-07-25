// In-browser fallback for colors the pure parser cannot resolve (exotic
// `color()` spaces, named colors). Rasterises the color on a 1×1 canvas and
// reads the pixel back. No-ops gracefully wherever a 2D canvas context is
// unavailable — notably jsdom — so callers fall back to the pure parser.
import type { Rgba } from './color'

/**
 * Resolve any browser-accepted CSS color string to sRGB via canvas, or `null`
 * when there is no 2D context (jsdom) or the browser rejects the color.
 */
export function rasterizeColor(input: string): Rgba | null {
  try {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // fillStyle only changes when the browser can parse the value. Probing with
    // two different sentinels distinguishes an unparseable color from one that
    // happens to equal a single sentinel.
    ctx.fillStyle = '#000000'
    ctx.fillStyle = input
    const first = ctx.fillStyle
    ctx.fillStyle = '#ffffff'
    ctx.fillStyle = input
    if (first !== ctx.fillStyle) return null

    ctx.fillRect(0, 0, 1, 1)
    const { data } = ctx.getImageData(0, 0, 1, 1)
    return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 }
  } catch {
    return null
  }
}
