import { describe, expect, it } from 'vitest'
import { auditImages } from '@/audits/images'
import { parseBody } from './helpers'

describe('auditImages', () => {
  it('flags an image with no alt attribute', () => {
    const result = auditImages(parseBody('<img src="a.jpg">'))
    expect(result.data.missing).toBe(1)
    expect(result.issues.some((i) => i.id.startsWith('images-missing'))).toBe(true)
  })

  it('treats empty alt as decorative, not an error', () => {
    const result = auditImages(parseBody('<img src="a.jpg" alt="">'))
    expect(result.errors).toBe(0)
    expect(result.data.images[0].status).toBe('decorative')
  })

  it('warns when alt looks like a filename', () => {
    const result = auditImages(parseBody('<img src="a.jpg" alt="IMG_1024.JPG">'))
    expect(result.warnings).toBeGreaterThan(0)
    expect(result.data.images[0].status).toBe('flagged')
  })

  it('accepts descriptive alt text', () => {
    const result = auditImages(parseBody('<img src="a.jpg" alt="A red bicycle by a brick wall">'))
    expect(result.errors).toBe(0)
    expect(result.issues.map((i) => i.id)).toContain('images-alt-ok')
  })

  it('accepts an aria-labeled image without alt', () => {
    const result = auditImages(parseBody('<img src="a.jpg" aria-label="Company logo">'))
    expect(result.data.missing).toBe(0)
  })
})
