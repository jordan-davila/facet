import { describe, expect, it } from 'vitest'
import type { HreflangEntry } from '@/audits/hreflang'
import {
  type UrlStatus,
  reachabilityIssues,
  reachabilityTargets,
} from '@/audits/hreflang-reachability'

function entry(hreflang: string, resolved: string | null): HreflangEntry {
  return {
    hreflang,
    href: resolved,
    resolved,
    validTag: true,
    isSelf: false,
    isXDefault: hreflang === 'x-default',
    selector: `link[hreflang="${hreflang}"]`,
  }
}

const ENTRIES = [entry('en', 'https://example.com/en/'), entry('fr', 'https://example.com/fr/')]

describe('reachabilityTargets', () => {
  it('collects the distinct absolute targets', () => {
    expect(reachabilityTargets(ENTRIES)).toEqual([
      'https://example.com/en/',
      'https://example.com/fr/',
    ])
  })

  it('drops annotations that never resolved to a URL', () => {
    expect(reachabilityTargets([entry('en', null)])).toEqual([])
  })

  it('does not request the same URL twice', () => {
    const shared = [entry('en', 'https://example.com/x/'), entry('fr', 'https://example.com/x/')]

    expect(reachabilityTargets(shared)).toEqual(['https://example.com/x/'])
  })
})

describe('reachabilityIssues', () => {
  const ok: UrlStatus[] = [
    { url: 'https://example.com/en/', status: 200 },
    { url: 'https://example.com/fr/', status: 200 },
  ]

  it('records a pass when every target responded', () => {
    const issues = reachabilityIssues(ENTRIES, ok)

    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('pass')
    expect(issues[0].title).toContain('2 annotated pages responded')
  })

  it('errors on a 404 and names the language that points at it', () => {
    const issues = reachabilityIssues(ENTRIES, [
      { url: 'https://example.com/en/', status: 200 },
      { url: 'https://example.com/fr/', status: 404 },
    ])

    expect(issues[0].severity).toBe('error')
    expect(issues[0].title).toBe('fr points at a page returning 404')
    expect(issues[0].selector).toBe('link[hreflang="fr"]')
  })

  it('errors on a server error too', () => {
    const issues = reachabilityIssues(ENTRIES, [{ url: 'https://example.com/fr/', status: 503 }])

    expect(issues[0].severity).toBe('error')
  })

  it('only warns about a redirect, since the page does exist', () => {
    const issues = reachabilityIssues(ENTRIES, [{ url: 'https://example.com/fr/', status: 301 }])

    expect(issues[0].severity).toBe('warning')
    expect(issues[0].title).toContain('redirects')
  })

  it('only warns when the request never completed, and says why', () => {
    const issues = reachabilityIssues(ENTRIES, [
      { url: 'https://example.com/fr/', status: null, error: 'No response' },
    ])

    expect(issues[0].severity).toBe('warning')
    expect(issues[0].detail).toContain('No response')
    expect(issues[0].detail).toContain('may still be fine')
  })

  it('names every language sharing a broken target', () => {
    const shared = [entry('en', 'https://example.com/x/'), entry('fr', 'https://example.com/x/')]
    const issues = reachabilityIssues(shared, [{ url: 'https://example.com/x/', status: 404 }])

    expect(issues[0].title).toBe('en, fr points at a page returning 404')
  })

  it('reports nothing at all when there was nothing to check', () => {
    expect(reachabilityIssues(ENTRIES, [])).toEqual([])
  })
})
