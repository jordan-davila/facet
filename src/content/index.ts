import type { Message, Result } from '@/core/messages'
import { runAllAudits } from '@/audits'
import { clearHighlight, highlight } from './highlight'

function handle(message: Message): Result {
  switch (message.type) {
    case 'ping':
      return { ok: true, data: 'pong' }
    case 'runAudit':
      return { ok: true, data: runAllAudits(document, message.settings) }
    case 'highlight':
      return { ok: true, data: highlight(message.selector) }
    case 'clearHighlight':
      clearHighlight()
      return { ok: true, data: null }
    default:
      return { ok: false, error: 'Unknown message' }
  }
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  try {
    sendResponse(handle(message))
  } catch (error) {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Audit failed' })
  }
  // Responses are produced synchronously, so the channel can close immediately.
})
