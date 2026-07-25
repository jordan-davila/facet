import { describe, expect, it } from 'vitest'
import { auditMeta } from '@/audits/meta'
import { parse, parseBody } from './helpers'

const GOOD_HEAD = `
  <title>${'x'.repeat(40)}</title>
  <meta name="description" content="${'y'.repeat(100)}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta charset="utf-8">
  <meta property="og:title" content="Title">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://example.com/i.png">
  <meta property="og:url" content="https://example.com/">
`

const idsFor = (doc: Document) => auditMeta(doc).issues.map((i) => i.id)

describe('auditMeta', () => {
  it('passes a complete head', () => {
    const result = auditMeta(parseBody('', GOOD_HEAD))
    expect(result.errors).toBe(0)
    const ids = result.issues.map((i) => i.id)
    expect(ids).toContain('meta-title-ok')
    expect(ids).toContain('meta-description-ok')
    expect(ids).toContain('meta-og-ok')
  })

  it('flags a missing title', () => {
    expect(idsFor(parseBody('', ''))).toContain('meta-title-missing')
  })

  it('flags a missing lang', () => {
    const doc = parse(
      '<!doctype html><html><head><title>abcdefghijklmnopqrstuvwxyz012345</title></head><body></body></html>'
    )
    expect(idsFor(doc)).toContain('meta-lang-missing')
  })

  it('warns on a short title', () => {
    expect(idsFor(parseBody('', '<title>Short</title>'))).toContain('meta-title-short')
  })

  it('warns on noindex', () => {
    const head = `${GOOD_HEAD}<meta name="robots" content="noindex, nofollow">`
    expect(idsFor(parseBody('', head))).toContain('meta-robots-noindex')
  })

  it('reads the resolved values into data', () => {
    const data = auditMeta(parseBody('', GOOD_HEAD)).data
    expect(data.ogImage).toBe('https://example.com/i.png')
    expect(data.openGraph).toHaveLength(4)
  })
})
