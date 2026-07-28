import { describe, expect, it } from 'vitest'
import { auditHreflang } from '@/audits/hreflang'
import { parseBody } from './helpers'

const PAGE = 'https://example.com/en/page'

function run(head: string, url = PAGE) {
  return auditHreflang(parseBody('', head), url)
}

function alt(hreflang: string, href: string) {
  return `<link rel="alternate" hreflang="${hreflang}" href="${href}">`
}

const SELF = alt('en', PAGE)

describe('auditHreflang', () => {
  it('reports nothing to fix when a page has no annotations', () => {
    const result = run('<title>t</title>')

    expect(result.data.entries).toHaveLength(0)
    expect(result.errors).toBe(0)
    expect(result.warnings).toBe(0)
    expect(result.issues.map((i) => i.id)).toContain('hreflang-none')
  })

  it('reads each annotation and resolves relative URLs against the page', () => {
    const result = run(SELF + alt('fr', '/fr/page'))

    expect(result.data.entries).toHaveLength(2)
    expect(result.data.entries[1].resolved).toBe('https://example.com/fr/page')
  })

  it('warns about relative URLs even though it can resolve them', () => {
    expect(run(SELF + alt('fr', '/fr/page')).issues.map((i) => i.id)).toContain(
      'hreflang-1-relative'
    )
  })

  it('recognises the self-reference regardless of a trailing slash', () => {
    expect(run(alt('en', `${PAGE}/`)).data.hasSelfReference).toBe(true)
  })

  it('errors when the set never references itself', () => {
    const result = run(alt('fr', 'https://example.com/fr/page'))

    expect(result.data.hasSelfReference).toBe(false)
    expect(result.issues.map((i) => i.id)).toContain('hreflang-self')
  })

  it('accepts language, region and script subtags', () => {
    const result = run(
      SELF + alt('en-GB', 'https://example.com/gb/') + alt('zh-Hant-TW', 'https://example.com/tw/')
    )

    expect(result.data.entries.every((e) => e.validTag)).toBe(true)
  })

  it('accepts a lowercase region, which is valid and common', () => {
    // Regression: these are real, working annotations that an earlier
    // uppercase-only pattern reported as errors.
    const result = run(
      SELF +
        alt('en-ca', 'https://example.com/ca/') +
        alt('en-us', 'https://example.com/us/') +
        alt('EN-GB', 'https://example.com/gb/') +
        alt('zh-hant-tw', 'https://example.com/tw/')
    )

    expect(result.data.entries.every((e) => e.validTag)).toBe(true)
    expect(result.issues.some((i) => i.id.endsWith('-tag'))).toBe(false)
  })

  it('still catches a bad region regardless of its case', () => {
    const result = run(SELF + alt('en-uk', 'https://example.com/uk/'))

    expect(result.issues.find((i) => i.id === 'hreflang-1-region')?.detail).toContain('GB')
  })

  it('rejects an underscore separator', () => {
    const result = run(SELF + alt('en_US', 'https://example.com/us/'))

    expect(result.data.entries[1].validTag).toBe(false)
    expect(result.issues.map((i) => i.id)).toContain('hreflang-1-tag')
  })

  it('catches en-UK, which is not a country code', () => {
    const result = run(SELF + alt('en-UK', 'https://example.com/uk/'))
    const issue = result.issues.find((i) => i.id === 'hreflang-1-region')

    expect(issue?.detail).toContain('GB')
  })

  it('errors when the same language is declared twice with different targets', () => {
    const result = run(
      SELF + alt('fr', 'https://example.com/fr/') + alt('fr', 'https://example.com/fr-ca/')
    )
    const issue = result.issues.find((i) => i.id === 'hreflang-dupe-fr')

    expect(issue?.severity).toBe('error')
  })

  it('only warns when a duplicate points at the same target', () => {
    const result = run(
      SELF + alt('fr', 'https://example.com/fr/') + alt('fr', 'https://example.com/fr/')
    )

    expect(result.issues.find((i) => i.id === 'hreflang-dupe-fr')?.severity).toBe('warning')
  })

  it('warns when several locales share one URL', () => {
    const result = run(
      SELF + alt('fr', 'https://example.com/x/') + alt('de', 'https://example.com/x/')
    )

    expect(result.issues.some((i) => i.id.startsWith('hreflang-shared-'))).toBe(true)
  })

  it('warns when x-default is absent and passes when present', () => {
    expect(run(SELF).issues.map((i) => i.id)).toContain('hreflang-xdefault')

    const withDefault = run(SELF + alt('x-default', 'https://example.com/'))
    expect(withDefault.data.hasXDefault).toBe(true)
    expect(withDefault.issues.map((i) => i.id)).toContain('hreflang-xdefault-ok')
  })

  it('errors on an annotation with no href', () => {
    const result = auditHreflang(parseBody('', '<link rel="alternate" hreflang="fr">'), PAGE)

    expect(result.issues.map((i) => i.id)).toContain('hreflang-0-href')
  })

  it('counts locales without counting x-default as one', () => {
    const result = run(
      SELF + alt('fr', 'https://example.com/fr/') + alt('x-default', 'https://example.com/')
    )

    expect(result.data.locales).toBe(2)
  })
})
