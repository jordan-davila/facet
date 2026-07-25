import type { AuditReport, Settings } from './types'

/** Messages the side panel sends to a tab's content script. */
export type Message =
  | { type: 'ping' }
  | { type: 'runAudit'; settings: Settings }
  | { type: 'highlight'; selector: string }
  | { type: 'clearHighlight' }

/** Broadcasts the service worker sends to the side panel. */
export type PanelMessage = { type: 'rescanCommand' }

/** Discriminated result envelope returned by the content script. */
export type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string }

export type RunAuditResult = Result<AuditReport>
