import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings } from '@/core/settings'

describe('normalizeSettings', () => {
  it('returns the defaults for undefined input', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  })

  it('overrides scalar fields', () => {
    expect(normalizeSettings({ wcagLevel: 'AAA' }).wcagLevel).toBe('AAA')
  })

  it('merges partial enabled maps over the defaults', () => {
    const merged = normalizeSettings({ enabled: { contrast: false } as never })
    expect(merged.enabled.contrast).toBe(false)
    expect(merged.enabled.headings).toBe(true)
  })
})
