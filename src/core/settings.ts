import { FACET_ORDER } from './constants'
import type { FacetId, Settings } from './types'

const STORAGE_KEY = 'facet:settings'

function allFacetsEnabled(): Record<FacetId, boolean> {
  return FACET_ORDER.reduce(
    (acc, facet) => ({ ...acc, [facet]: true }),
    {} as Record<FacetId, boolean>
  )
}

export const DEFAULT_SETTINGS: Settings = {
  wcagLevel: 'AA',
  theme: 'system',
  enabled: allFacetsEnabled(),
  contrastMaxIssues: 100,
  autoScan: true,
}

/** Merge stored settings over the defaults so new facets/fields are filled in. */
export function normalizeSettings(stored: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    enabled: { ...DEFAULT_SETTINGS.enabled, ...stored?.enabled },
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.sync.get(STORAGE_KEY)
    return normalizeSettings(stored[STORAGE_KEY] as Partial<Settings> | undefined)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings })
}
