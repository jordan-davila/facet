import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '@/core/settings'
import { runAllAudits } from '@/audits'
import { parseBody } from './helpers'

describe('runAllAudits', () => {
  it('produces a report for every enabled facet', () => {
    const doc = parseBody('<h1>Title</h1><main><img src="a.jpg"><a href="/x">click here</a></main>')
    const report = runAllAudits(doc, DEFAULT_SETTINGS)
    expect(report.results).toHaveLength(8)
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
    expect(report.totals.errors).toBeGreaterThan(0) // missing alt + generic link
  })

  it('skips disabled facets', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      enabled: { ...DEFAULT_SETTINGS.enabled, contrast: false, images: false },
    }
    const report = runAllAudits(parseBody('<h1>x</h1>'), settings)
    expect(report.results).toHaveLength(6)
    expect(report.results.find((r) => r.facet === 'contrast')).toBeUndefined()
  })
})
