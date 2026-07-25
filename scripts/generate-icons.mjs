// Generates the Facet toolbar icons — a faceted indigo gem — with no external
// dependencies. Renders each size supersampled 4× for clean anti-aliasing and
// encodes a PNG by hand (zlib + CRC32 from the Node standard library).
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'icons')
const SIZES = [16, 32, 48, 128, 512]
const SUPERSAMPLE = 4

// --- geometry / color -------------------------------------------------------
const GRADIENT_TOP = [124, 116, 255] // indigo-ish top
const GRADIENT_BOTTOM = [67, 56, 202] // deep indigo bottom
const GEM_LIGHT = [255, 255, 255]
const GEM_TINT = [199, 210, 254] // indigo-200
const FACET_EDGE = [129, 140, 248] // indigo-400
const GEM_HALF_WIDTH = 0.4
const GEM_HALF_HEIGHT = 0.5

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpColor(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/** Signed-distance test for a rounded square filling the canvas. */
function insideRoundedSquare(x, y, size) {
  const radius = size * 0.2245
  const half = size / 2
  const dx = Math.abs(x - half) - (half - radius)
  const dy = Math.abs(y - half) - (half - radius)
  if (dx <= 0 || dy <= 0) return Math.max(dx, dy) <= 0
  return dx * dx + dy * dy <= radius * radius
}

/** Color of the faceted gem for a point inside the rhombus. */
function gemColor(u, v) {
  if (Math.abs(Math.abs(u) - Math.abs(v)) < 0.03) return FACET_EDGE
  let shade
  if (v <= -Math.abs(u)) shade = 0.98
  else if (v >= Math.abs(u)) shade = 0.68
  else if (u < 0) shade = 0.9
  else shade = 0.82
  return lerpColor(GEM_TINT, GEM_LIGHT, shade)
}

/** Sample one (supersampled) pixel: returns [r, g, b, a]. */
function sample(x, y, size) {
  if (!insideRoundedSquare(x, y, size)) return [0, 0, 0, 0]
  const bg = lerpColor(GRADIENT_TOP, GRADIENT_BOTTOM, y / size)
  const nx = (x / size) * 2 - 1
  const ny = (y / size) * 2 - 1
  const u = nx / GEM_HALF_WIDTH
  const v = ny / GEM_HALF_HEIGHT
  if (Math.abs(u) + Math.abs(v) <= 1) {
    const [r, g, b] = gemColor(u, v)
    return [r, g, b, 255]
  }
  return [bg[0], bg[1], bg[2], 255]
}

/** Render an RGBA buffer for a target size, supersampled and box-downsampled. */
function renderRgba(size) {
  const s = size * SUPERSAMPLE
  const out = Buffer.alloc(size * size * 4)
  const samples = SUPERSAMPLE * SUPERSAMPLE
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const [sr, sg, sb, sa] = sample(
            px * SUPERSAMPLE + sx + 0.5,
            py * SUPERSAMPLE + sy + 0.5,
            s
          )
          const alpha = sa / 255
          r += sr * alpha
          g += sg * alpha
          b += sb * alpha
          a += sa
        }
      }
      const coverage = a / (samples * 255)
      const idx = (py * size + px) * 4
      // Un-premultiply so partially covered edge pixels keep their color.
      out[idx] = coverage > 0 ? Math.round(r / (coverage * samples)) : 0
      out[idx + 1] = coverage > 0 ? Math.round(g / (coverage * samples)) : 0
      out[idx + 2] = coverage > 0 ? Math.round(b / (coverage * samples)) : 0
      out[idx + 3] = Math.round(a / samples)
    }
  }
  return out
}

// --- PNG encoding ------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(size, rgba) {
  const rowBytes = size * 4
  const raw = Buffer.alloc((rowBytes + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (rowBytes + 1)] = 0 // filter type: none
    rgba.copy(raw, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of SIZES) {
  const png = encodePng(size, renderRgba(size))
  writeFileSync(resolve(OUT_DIR, `icon${size}.png`), png)
  console.log(`icons/icon${size}.png (${png.length} bytes)`)
}
