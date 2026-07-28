import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { PanelMessage } from '@/core/messages'
import type { AuditReport } from '@/core/types'
import { FacetView } from './components/FacetView'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ErrorState, LoadingState, UnsupportedState } from './components/States'
import { OverviewView } from './components/views/OverviewView'
import { SettingsView } from './components/views/SettingsView'
import { useScan } from './hooks/useScan'
import { useSettings } from './hooks/useSettings'
import { useTheme } from './hooks/useTheme'
import { type NavId, isFacetId } from './lib/nav'
import { findingsSummary } from './lib/score'

/** How long settings must settle before a change triggers a fresh scan. */
const SETTINGS_SCAN_DELAY_MS = 250

/** What a screen reader hears when a scan lands. */
function scanAnnouncement(report: AuditReport): string {
  return `Scan complete. Page score ${report.score} out of 100. ${findingsSummary(
    report.totals.errors,
    report.totals.warnings
  )}.`
}

export function App() {
  const { settings, ready, update, reset } = useSettings()
  const { state, run, highlight } = useScan()
  const [active, setActive] = useState<NavId>('overview')

  useTheme(settings.theme)

  // Scan on first load and whenever settings change (level, enabled checks…).
  // Debounced, because a settings change can arrive per keystroke and each scan
  // walks the whole DOM of the page under inspection.
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => void run(settings), SETTINGS_SCAN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [ready, settings, run])

  // Auto re-scan when the active tab changes or finishes navigating.
  useEffect(() => {
    if (!settings.autoScan) return
    const onActivated = () => void run(settings)
    const onUpdated = (_id: number, info: { status?: string }, tab: chrome.tabs.Tab) => {
      if (info.status === 'complete' && tab.active) void run(settings)
    }
    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [settings, run])

  const rescan = () => void run(settings)

  // The Alt+Shift+F command fires in the service worker; the scan runs here.
  useEffect(() => {
    const onMessage = (message: PanelMessage) => {
      if (message?.type === 'rescanCommand') void run(settings)
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [settings, run])

  function renderBody() {
    if (active === 'settings') {
      return <SettingsView settings={settings} update={update} reset={reset} />
    }
    if (state.status === 'unsupported') {
      return <UnsupportedState url={state.tab?.url ?? ''} />
    }
    if (state.status === 'error') {
      return <ErrorState message={state.error ?? 'Unknown error'} onRetry={rescan} />
    }
    if (!state.report) {
      return <LoadingState />
    }
    if (active === 'overview') {
      return (
        <OverviewView
          report={state.report}
          onSelectFacet={(facet) => setActive(facet)}
          onOpenSettings={() => setActive('settings')}
        />
      )
    }
    if (isFacetId(active)) {
      return (
        <FacetView
          facet={active}
          report={state.report}
          onHighlight={highlight}
          onOpenSettings={() => setActive('settings')}
        />
      )
    }
    return null
  }

  return (
    <TooltipProvider delayDuration={200}>
      <h1 className="sr-only">Facet — accessibility and SEO inspector</h1>
      {/* h-full, not h-screen: the panel fills whatever box hosts it, which
          keeps the design preview honest about its real width and height. */}
      <div className="flex h-full overflow-hidden">
        <Sidebar active={active} onSelect={setActive} report={state.report} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            tab={state.tab}
            report={state.report}
            scanning={state.status === 'scanning'}
            onRescan={rescan}
          />
          <ScrollArea className="min-h-0 flex-1">
            {/* key resets scroll position and focus context when the view changes */}
            <main key={active} id="facet-content" className="p-3">
              {renderBody()}
            </main>
          </ScrollArea>
        </div>
      </div>
      {/* A scan changes the whole panel silently; say what landed. */}
      <p aria-live="polite" className="sr-only">
        {state.status === 'ready' && state.report ? scanAnnouncement(state.report) : ''}
      </p>
      <Toaster position="bottom-center" theme={settings.theme} />
    </TooltipProvider>
  )
}
