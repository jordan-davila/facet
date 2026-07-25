import type { Message, Result } from '@/core/messages'

/**
 * Send a message to a tab's content script and surface transport failures
 * (e.g. no content script on the page) as a rejected promise the caller can
 * catch, rather than an `undefined` response.
 */
export async function sendToTab<T = unknown>(tabId: number, message: Message): Promise<Result<T>> {
  const response = (await chrome.tabs.sendMessage(tabId, message)) as Result<T> | undefined
  if (!response) {
    return { ok: false, error: 'No response from the page.' }
  }
  return response
}
