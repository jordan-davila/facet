import type { HreflangData } from '@/audits/hreflang'
import {
  type UrlStatus,
  reachabilityIssues,
  reachabilityTargets,
} from '@/audits/hreflang-reachability'
import { buildResult } from '@/audits/result'
import type { Result, WorkerMessage } from '@/core/messages'
import { overallScore } from '@/core/scoring'
import type { AuditReport, AuditResult, Settings } from '@/core/types'
import { sendToTab } from '@/lib/messaging'

export interface ActiveTab {
  id: number
  url: string
  title: string
  favIconUrl?: string
}

const RESTRICTED_HOSTS = [
  /^https:\/\/chromewebstore\.google\.com/,
  /^https:\/\/chrome\.google\.com\/webstore/,
]

/** Pages Facet cannot script (browser-internal or the Web Store). */
export function isSupported(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false
  return !RESTRICTED_HOSTS.some((re) => re.test(url))
}

export async function getActiveTab(): Promise<ActiveTab | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (!tab || tab.id === undefined) return null
  return { id: tab.id, url: tab.url ?? '', title: tab.title ?? '', favIconUrl: tab.favIconUrl }
}

/** Make sure the content script is live, injecting it into already-open tabs. */
async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'ping' })
    return
  } catch {
    const path = chrome.runtime.getManifest().content_scripts?.[0]?.js?.[0]
    if (!path) throw new Error('Content script is unavailable.')
    await chrome.scripting.executeScript({ target: { tabId }, files: [path] })
  }
}

export async function runScan(tabId: number, settings: Settings): Promise<AuditReport> {
  await ensureContentScript(tabId)
  const result = await sendToTab<AuditReport>(tabId, { type: 'runAudit', settings })
  if (!result.ok) throw new Error(result.error)
  if (!settings.checkHreflangUrls) return result.data
  return withHreflangReachability(result.data)
}

/**
 * Fold hreflang reachability into a finished report.
 *
 * Deliberately a second pass rather than part of the audit engine: the engine
 * stays synchronous and pure, and the one feature that touches the network is
 * the one feature that can be skipped without touching anything else.
 */
async function withHreflangReachability(report: AuditReport): Promise<AuditReport> {
  const index = report.results.findIndex((r) => r.facet === 'hreflang')
  if (index === -1) return report

  const hreflang = report.results[index] as AuditResult<HreflangData>
  const urls = reachabilityTargets(hreflang.data.entries)
  if (urls.length === 0) return report

  const statuses = await checkUrlsInWorker(urls)
  if (statuses.length === 0) return report

  const merged = buildResult(
    'hreflang',
    [...hreflang.issues, ...reachabilityIssues(hreflang.data.entries, statuses)],
    hreflang.data
  )
  const results = report.results.map((r, i) => (i === index ? merged : r))
  return { ...report, results, score: overallScore(results), totals: totalsOf(results) }
}

function totalsOf(results: AuditResult[]): AuditReport['totals'] {
  return results.reduce(
    (acc, r) => ({
      errors: acc.errors + r.errors,
      warnings: acc.warnings + r.warnings,
      passes: acc.passes + r.passes,
    }),
    { errors: 0, warnings: 0, passes: 0 }
  )
}

/** Ask the service worker to fetch statuses; it holds the host permissions. */
async function checkUrlsInWorker(urls: string[]): Promise<UrlStatus[]> {
  try {
    const message: WorkerMessage = { type: 'checkUrls', urls }
    const response = (await chrome.runtime.sendMessage(message)) as Result<UrlStatus[]> | undefined
    return response?.ok ? response.data : []
  } catch {
    // Without a reachable worker the rest of the report is still valid.
    return []
  }
}

/** True when the element was found and outlined on the page. */
export async function highlightOnPage(tabId: number, selector: string): Promise<boolean> {
  try {
    const result = await sendToTab<boolean>(tabId, { type: 'highlight', selector })
    return result.ok && result.data === true
  } catch {
    // The page may have navigated away, or the content script may be gone.
    return false
  }
}
