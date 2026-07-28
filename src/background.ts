// Facet runs from the side panel. The service worker wires the toolbar icon,
// relays the keyboard command, and is the one place that touches the network.
import type { UrlStatus } from '@/audits/hreflang-reachability'
import type { PanelMessage, WorkerMessage } from '@/core/messages'

function openPanelOnClick(): void {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Older Chrome without setPanelBehavior — the action falls back gracefully.
  })
}

/**
 * The keyboard command fires in the worker, but the scan lives in the panel.
 * Relay it; if the panel is closed there is no receiver and nothing to do.
 */
chrome.commands?.onCommand.addListener((command) => {
  if (command !== 'rescan') return
  const message: PanelMessage = { type: 'rescanCommand' }
  chrome.runtime.sendMessage(message).catch(() => {
    // No side panel open to receive it.
  })
})

/** Give up on a slow target rather than holding the whole report. */
const REQUEST_TIMEOUT_MS = 8000

/** Enough to cover a normal annotation set without hammering a host. */
const MAX_URLS = 40

/** Requests in flight at once. */
const CONCURRENCY = 6

/**
 * Ask for one URL's status.
 *
 * HEAD first because the body is irrelevant here, falling back to a ranged GET
 * for the servers that answer HEAD with 405. `redirect: 'follow'` means the
 * status reported is the one a search engine would land on.
 */
async function statusOf(url: string): Promise<UrlStatus> {
  const attempt = async (method: 'HEAD' | 'GET'): Promise<Response> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      return await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
        // Only the first bytes are needed to learn the status.
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : undefined,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    let response = await attempt('HEAD')
    if (response.status === 405 || response.status === 501) response = await attempt('GET')
    return { url, status: response.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return { url, status: null, error: message === 'Failed to fetch' ? 'No response' : message }
  }
}

/** Resolve statuses for a batch, a few at a time. */
async function checkUrls(urls: string[]): Promise<UrlStatus[]> {
  const queue = urls.slice(0, MAX_URLS)
  const results: UrlStatus[] = []
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < queue.length) {
      const index = cursor++
      results[index] = await statusOf(queue[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
  return results
}

chrome.runtime.onMessage.addListener((message: WorkerMessage, _sender, sendResponse) => {
  if (message?.type !== 'checkUrls') return undefined
  checkUrls(message.urls)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error: unknown) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Check failed' })
    })
  // Keep the channel open for the async reply.
  return true
})

chrome.runtime.onInstalled.addListener(openPanelOnClick)
chrome.runtime.onStartup.addListener(openPanelOnClick)
openPanelOnClick()
