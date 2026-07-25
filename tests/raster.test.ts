import { afterEach, describe, expect, it } from 'vitest'
import { rasterizeColor } from '@/audits/raster'

const originalGetContext = HTMLCanvasElement.prototype.getContext

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
})

interface FakeContextOptions {
  /** Mimics the browser: `fillStyle` only updates for values it can parse. */
  accept: (value: string) => boolean
  pixel: readonly [number, number, number, number]
}

function stubContext({ accept, pixel }: FakeContextOptions): void {
  let fill = '#000000'
  const ctx = {
    set fillStyle(value: string) {
      if (accept(value)) fill = value
    },
    get fillStyle(): string {
      return fill
    },
    fillRect(): void {},
    getImageData(): { data: Uint8ClampedArray } {
      return { data: Uint8ClampedArray.from(pixel) }
    },
  }
  HTMLCanvasElement.prototype.getContext = (() =>
    ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
}

describe('rasterizeColor', () => {
  it('returns null when no 2D context is available (jsdom)', () => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext
    expect(rasterizeColor('red')).toBeNull()
  })

  it('reads back the pixel for a color the browser accepts', () => {
    stubContext({ accept: () => true, pixel: [128, 64, 32, 255] })
    expect(rasterizeColor('color(display-p3 1 0 0)')).toEqual({ r: 128, g: 64, b: 32, a: 1 })
  })

  it('preserves alpha from the rasterised pixel', () => {
    stubContext({ accept: () => true, pixel: [10, 20, 30, 128] })
    expect(rasterizeColor('color(display-p3 0 0 0 / 0.5)')?.a).toBeCloseTo(128 / 255, 3)
  })

  it('returns null when the browser rejects the color', () => {
    stubContext({ accept: (v) => v === '#000000' || v === '#ffffff', pixel: [0, 0, 0, 255] })
    expect(rasterizeColor('definitely-not-a-color')).toBeNull()
  })
})
