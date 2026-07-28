import { FACET_ORDER } from '@/core/constants'
import type { Settings } from '@/core/types'
import { fixtureReport } from './fixture'

/** States the preview can be forced into with ?state= in the URL. */
export type PreviewState = 'ready' | 'loading' | 'error' | 'unsupported' | 'clean'

const TAB = {
  ready: {
    url: 'https://loupe.example/field-notes',
    title: 'Field notes on cut and clarity — Loupe',
  },
  unsupported: { url: 'chrome://extensions', title: 'Extensions' },
}

/**
 * Just enough of the extension APIs for the side panel to run in a plain tab.
 * Preview-only — never imported by the extension build.
 */
export function installChromeStub(state: PreviewState = 'ready'): void {
  const listeners = { activated: new Set<() => void>(), updated: new Set<() => void>() }
  let stored: Record<string, unknown> = {}

  const tab = state === 'unsupported' ? TAB.unsupported : TAB.ready

  const stub = {
    runtime: {
      getManifest: () => ({
        version: '0.1.0-preview',
        content_scripts: [{ js: ['src/content/index.ts'] }],
      }),
      onMessage: { addListener: () => {}, removeListener: () => {} },
      // Stands in for the service worker's URL check.
      sendMessage: async (message: { type: string; urls?: string[] }) => {
        if (message.type !== 'checkUrls') return { ok: true, data: null }
        return {
          ok: true,
          data: (message.urls ?? []).map((url, i) => ({
            url,
            status: i === 1 ? 404 : 200,
          })),
        }
      },
    },
    storage: {
      sync: {
        get: async (key: string) => ({ [key]: stored[key] }),
        set: async (patch: Record<string, unknown>) => {
          stored = { ...stored, ...patch }
        },
      },
    },
    tabs: {
      query: async () => [{ id: 1, ...tab, favIconUrl: '' }],
      sendMessage: async (_id: number, message: { type: string; settings?: Settings }) => {
        if (message.type !== 'runAudit') return { ok: true, data: null }
        if (state === 'loading') await new Promise(() => {})
        if (state === 'error') {
          return { ok: false, error: 'Could not reach the page. It may still be loading.' }
        }
        const enabled = message.settings?.enabled
        const facets = FACET_ORDER.filter((facet) => enabled?.[facet] !== false)
        return { ok: true, data: fixtureReport(facets, { clean: state === 'clean' }) }
      },
      onActivated: {
        addListener: (fn: () => void) => listeners.activated.add(fn),
        removeListener: (fn: () => void) => listeners.activated.delete(fn),
      },
      onUpdated: {
        addListener: (fn: () => void) => listeners.updated.add(fn),
        removeListener: (fn: () => void) => listeners.updated.delete(fn),
      },
    },
    scripting: { executeScript: async () => [] },
  }

  Object.assign(globalThis, { chrome: stub })
}
