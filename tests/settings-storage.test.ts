import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/core/settings'

function mockChromeStorage() {
  const store: Record<string, unknown> = {}
  vi.stubGlobal('chrome', {
    storage: {
      sync: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (obj: Record<string, unknown>) => {
          Object.assign(store, obj)
        },
      },
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('settings persistence', () => {
  it('returns defaults when nothing is stored', async () => {
    mockChromeStorage()
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips saved settings', async () => {
    mockChromeStorage()
    await saveSettings({ ...DEFAULT_SETTINGS, wcagLevel: 'AAA', autoScan: false })
    const loaded = await loadSettings()
    expect(loaded.wcagLevel).toBe('AAA')
    expect(loaded.autoScan).toBe(false)
  })

  it('falls back to defaults when storage throws', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        sync: {
          get: async () => {
            throw new Error('no storage')
          },
        },
      },
    })
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
