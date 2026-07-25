import { useCallback, useRef, useState } from 'react'
import type { AuditReport, Settings } from '@/core/types'
import { type ActiveTab, getActiveTab, highlightOnPage, isSupported, runScan } from '../lib/scan'

export type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error' | 'unsupported'

export interface ScanState {
  status: ScanStatus
  report: AuditReport | null
  error: string | null
  tab: ActiveTab | null
}

export interface UseScan {
  state: ScanState
  run: (settings: Settings) => Promise<void>
  highlight: (selector: string) => void
}

const INITIAL: ScanState = { status: 'idle', report: null, error: null, tab: null }

export function useScan(): UseScan {
  const [state, setState] = useState<ScanState>(INITIAL)
  const tabIdRef = useRef<number | null>(null)
  // Latest-wins. Dropping an overlapping scan instead would strand the panel on
  // results from the settings the user just changed away from.
  const requestRef = useRef(0)

  const run = useCallback(async (settings: Settings) => {
    const request = ++requestRef.current
    const isCurrent = () => request === requestRef.current

    setState((prev) => ({ ...prev, status: 'scanning', error: null }))
    try {
      const tab = await getActiveTab()
      if (!isCurrent()) return
      if (!tab) {
        setState({ status: 'error', report: null, error: 'No active tab found.', tab: null })
        return
      }
      tabIdRef.current = tab.id
      // Commit the tab before the scan runs: if the scan then fails, the header
      // must still say which page failed rather than falling back to "Facet".
      setState((prev) => ({ ...prev, tab }))
      if (!isSupported(tab.url)) {
        setState({ status: 'unsupported', report: null, error: null, tab })
        return
      }
      const report = await runScan(tab.id, settings)
      if (!isCurrent()) return
      setState({ status: 'ready', report, error: null, tab })
    } catch (error) {
      if (!isCurrent()) return
      const message = error instanceof Error ? error.message : 'Scan failed.'
      setState((prev) => ({ status: 'error', report: null, error: message, tab: prev.tab }))
    }
  }, [])

  const highlight = useCallback((selector: string) => {
    if (tabIdRef.current !== null) void highlightOnPage(tabIdRef.current, selector)
  }, [])

  return { state, run, highlight }
}
