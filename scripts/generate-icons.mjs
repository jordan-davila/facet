// Generates the Facet toolbar icons — a brilliant-cut sapphire — with no
// external dependencies. Renders each size supersampled 4x for clean
// anti-aliasing and encodes a PNG by hand (zlib + CRC32 from the Node library).
//
// Drawn procedurally rather than exported from a raster: at 16px a generated
// bitmap loses every facet and collapses into a blob, whereas geometry stays
// crisp at any size. Everything here is therefore sized in fractions of the
// canvas, and no detail is finer than an eighth of it — the limit below which
// a 16px render turns to mush.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'icons')
const SIZES = [16, 32, 48, 128, 512]
const SUPERSAMPLE = 4

// --- geometry / color -------------------------------------------------------
// Violet, top to bottom. Deliberately all-purple rather than purple-to-pink:
// a pink lower stop pulled the mark toward a consumer app, and the deeper
// bottom keeps the white stone reading as the brightest thing in the square.
const GRADIENT_TOP = [167, 85, 247] // violet
const GRADIENT_BOTTOM = [76, 29, 149] // deep violet
const GEM_LIGHT = [255, 255, 255]
const GEM_TINT = [233, 222, 253] // pale lavender
const FACET_EDGE = [70, 22, 130] // the cut lines, dark enough to hold at 16px

// A brilliant cut seen face-on: flat table, crown flaring to the girdle, then
// a pavilion tapering to the culet.
const TABLE_HALF = 0.24 // half-width of the flat top
const GIRDLE_HALF = 0.5 // half-width at the widest point
const TABLE_Y = -0.54 // top edge
const GIRDLE_Y = -0.22 // widest point
const CULET_Y = 0.62 // the point

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpColor(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/**
 * Signed-distance test for a rounded square filling the canvas.
 *
 * Only the four corners are rounded. A point is outside just when it sits past
 * the radius in BOTH axes at once — testing the axes together instead cut
 * notches out of all four straight edges, which is what made the old icon look
 * like a cross.
 */
function insideRoundedSquare(x, y, size) {
  const radius = size * 0.2245
  const half = size / 2
  const dx = Math.abs(x - half) - (half - radius)
  const dy = Math.abs(y - half) - (half - radius)
  if (dx <= 0 || dy <= 0) return true
  return dx * dx + dy * dy <= radius * radius
}

/** Half-width of the stone at a given height, or 0 outside it. */
function halfWidthAt(v) {
  if (v < TABLE_Y || v > CULET_Y) return 0
  if (v <= GIRDLE_Y) {
    // Crown: flares from the table out to the girdle.
    const t = (v - TABLE_Y) / (GIRDLE_Y - TABLE_Y)
    return lerp(TABLE_HALF, GIRDLE_HALF, t)
  }
  // Pavilion: tapers from the girdle to the culet.
  const t = (v - GIRDLE_Y) / (CULET_Y - GIRDLE_Y)
  return lerp(GIRDLE_HALF, 0, t)
}

function insideGem(u, v) {
  return Math.abs(u) <= halfWidthAt(v)
}

/** Perpendicular distance from a point to a segment. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

/**
 * The cuts of a brilliant, and only these: two crown divisions, the girdle,
 * and two pavilion divisions meeting at the culet. Five lines is already the
 * most a 16px render can hold.
 */
const CUTS = [
  [-TABLE_HALF, TABLE_Y, -TABLE_HALF, GIRDLE_Y],
  [TABLE_HALF, TABLE_Y, TABLE_HALF, GIRDLE_Y],
  [-GIRDLE_HALF, GIRDLE_Y, GIRDLE_HALF, GIRDLE_Y],
  [-TABLE_HALF, GIRDLE_Y, 0, CULET_Y],
  [TABLE_HALF, GIRDLE_Y, 0, CULET_Y],
]

function onCutLine(u, v) {
  return CUTS.some(([ax, ay, bx, by]) => distanceToSegment(u, v, ax, ay, bx, by) < 0.038)
}

/**
 * Color of the stone at a point inside it. The planes differ just enough to
 * read as a cut rather than a flat shape, without adding detail that would
 * vanish when the icon is drawn 16 pixels wide.
 */
function gemColor(u, v) {
  if (onCutLine(u, v)) return FACET_EDGE
  if (v < GIRDLE_Y) {
    if (Math.abs(u) < TABLE_HALF) return GEM_LIGHT
    return lerpColor(GEM_TINT, GEM_LIGHT, u < 0 ? 0.75 : 0.35)
  }
  return lerpColor(GEM_TINT, GEM_LIGHT, u < 0 ? 0.55 : 0.1)
}

/**
 * Optical sizing: at and below this, the stone is drawn larger relative to the
 * canvas. Every size draws the *same* cuts — an earlier version swapped in a
 * plain silhouette here, which made the toolbar and the store listing look
 * like two different marks. The problem was never the detail, it was that the
 * stone was only half the canvas with nothing left over for it.
 */
const ENLARGE_AT_OR_BELOW = 16

/** How much bigger the stone sits in a small canvas. */
const SMALL_SCALE = 1.34

/** Sample one (supersampled) pixel: returns [r, g, b, a]. */
function sample(x, y, size, targetSize) {
  if (!insideRoundedSquare(x, y, size)) return [0, 0, 0, 0]
  const bg = lerpColor(GRADIENT_TOP, GRADIENT_BOTTOM, y / size)
  const scale = targetSize <= ENLARGE_AT_OR_BELOW ? SMALL_SCALE : 1
  const u = ((x / size) * 2 - 1) / scale
  const v = ((y / size) * 2 - 1) / scale
  if (insideGem(u, v)) {
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
            s,
            size
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
