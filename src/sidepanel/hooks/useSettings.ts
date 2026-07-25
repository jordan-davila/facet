import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings, saveSettings } from '@/core/settings'
import type { Settings } from '@/core/types'

export interface UseSettings {
  settings: Settings
  ready: boolean
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    loadSettings().then((loaded) => {
      if (!active) return
      setSettings(loaded)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = normalizeSettings({ ...prev, ...patch })
      void saveSettings(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    void saveSettings(DEFAULT_SETTINGS)
  }, [])

  return { settings, ready, update, reset }
}
