// Shared types for the audit engine and UI.

export type Severity = 'error' | 'warning' | 'info' | 'pass'

/** The audit categories, one per tool the extension exposes. */
export type FacetId =
  | 'headings'
  | 'landmarks'
  | 'contrast'
  | 'meta'
  | 'canonical'
  | 'hreflang'
  | 'images'
  | 'links'
  | 'structured-data'

/** A single finding produced by an auditor. */
export interface Issue {
  /** Stable within a report so React keys and highlight targets are consistent. */
  id: string
  severity: Severity
  /** Short, human-readable headline. */
  title: string
  /** Optional longer explanation / remediation hint. */
  detail?: string
  /** CSS selector used to locate + highlight the offending element on the page. */
  selector?: string
  /** Small text/markup excerpt shown for context. */
  snippet?: string
}

/** The outcome of running one auditor. */
export interface AuditResult<Data = unknown> {
  facet: FacetId
  label: string
  errors: number
  warnings: number
  passes: number
  /** 0–100 health score for this facet. */
  score: number
  issues: Issue[]
  /** Facet-specific structured payload (outline tree, meta preview, …). */
  data: Data
}

export interface PageInfo {
  url: string
  title: string
  lang: string | null
}

/** The complete result of scanning a page. */
export interface AuditReport {
  page: PageInfo
  scannedAt: number
  score: number
  totals: { errors: number; warnings: number; passes: number }
  results: AuditResult[]
}

export type WcagLevel = 'AA' | 'AAA'

/** Appearance preference. 'system' follows the OS setting. */
export type ThemePreference = 'system' | 'light' | 'dark'

/** User-configurable options, persisted to chrome.storage.sync. */
export interface Settings {
  wcagLevel: WcagLevel
  theme: ThemePreference
  /** Whether each facet participates in a scan. */
  enabled: Record<FacetId, boolean>
  /** Cap on reported contrast issues to keep the list manageable. */
  contrastMaxIssues: number
  /** Re-run the scan automatically when the active tab navigates. */
  autoScan: boolean
  /**
   * Request each hreflang target to see whether it responds.
   *
   * Off by default and the only setting that causes Facet to touch the
   * network at all — everything else runs entirely inside the page.
   */
  checkHreflangUrls: boolean
}
