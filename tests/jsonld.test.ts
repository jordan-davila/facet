import { describe, expect, it } from 'vitest'
import { auditJsonLd } from '@/audits/jsonld'
import { parseBody } from './helpers'

const script = (json: string) => `<script type="application/ld+json">${json}</script>`

describe('auditJsonLd', () => {
  it('reports when no structured data exists', () => {
    expect(auditJsonLd(parseBody('')).issues.map((i) => i.id)).toContain('jsonld-none')
  })

  it('flags invalid JSON', () => {
    const result = auditJsonLd(parseBody(script('{ not valid')))
    expect(result.errors).toBeGreaterThan(0)
    expect(result.issues.some((i) => i.id.endsWith('invalid'))).toBe(true)
  })

  it('flags a Product missing required fields', () => {
    const result = auditJsonLd(
      parseBody(script('{"@context":"https://schema.org","@type":"Product"}'))
    )
    expect(result.errors).toBeGreaterThan(0)
    expect(result.issues.some((i) => i.id.endsWith('required'))).toBe(true)
  })

  it('accepts a well-formed Product', () => {
    const json =
      '{"@context":"https://schema.org","@type":"Product","name":"Widget","image":"https://x/i.png","offers":{"@type":"Offer","price":"9.99","priceCurrency":"USD"}}'
    const result = auditJsonLd(parseBody(script(json)))
    expect(result.errors).toBe(0)
    expect(result.data.typesFound).toContain('Product')
  })

  it('flattens @graph nodes', () => {
    const json =
      '{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"S","url":"https://x"},{"@type":"Organization","name":"O"}]}'
    const result = auditJsonLd(parseBody(script(json)))
    expect(result.data.typesFound).toEqual(expect.arrayContaining(['WebSite', 'Organization']))
  })

  it('reports per-field presence for the viewer', () => {
    const json =
      '{"@context":"https://schema.org","@type":"Product","name":"Widget","offers":{"@type":"Offer","price":"9.99"}}'
    const node = auditJsonLd(parseBody(script(json))).data.blocks[0].nodes[0]
    expect(node.requiredFields.find((f) => f.name === 'name')?.present).toBe(true)
    expect(node.recommendedFields.find((f) => f.name === 'image')?.present).toBe(false)
  })

  it('stores pretty-printed JSON for valid blocks', () => {
    const json = '{"@context":"https://schema.org","@type":"Organization","name":"Acme"}'
    const block = auditJsonLd(parseBody(script(json))).data.blocks[0]
    expect(block.json).toContain('"@type": "Organization"')
  })

  it('keeps the raw source for invalid blocks', () => {
    const block = auditJsonLd(parseBody(script('{ oops not json'))).data.blocks[0]
    expect(block.valid).toBe(false)
    expect(block.json).toContain('oops')
  })
})
