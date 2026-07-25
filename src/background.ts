// Facet runs entirely from the side panel; the service worker only wires the
// toolbar icon to open it and relays the keyboard command.
import type { PanelMessage } from '@/core/messages'

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

chrome.runtime.onInstalled.addListener(openPanelOnClick)
chrome.runtime.onStartup.addListener(openPanelOnClick)
openPanelOnClick()
