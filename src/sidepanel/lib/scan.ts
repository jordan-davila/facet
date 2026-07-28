import type { AuditReport, Settings } from '@/core/types'
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
  return result.data
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
