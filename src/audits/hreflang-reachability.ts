import type { Issue } from '@/core/types'
import { truncate } from './dom'
import type { HreflangEntry } from './hreflang'

/** The outcome of asking for one URL. */
export interface UrlStatus {
  url: string
  /** HTTP status, or null when the request never produced a response. */
  status: number | null
  /** Set when the request itself failed rather than returning a status. */
  error?: string
}

/** Every distinct absolute target in a set of annotations. */
export function reachabilityTargets(entries: HreflangEntry[]): string[] {
  const urls = entries.map((entry) => entry.resolved).filter((url): url is string => Boolean(url))
  return [...new Set(urls)]
}

function labelFor(entries: HreflangEntry[], url: string): string {
  const tags = entries.filter((e) => e.resolved === url).map((e) => e.hreflang || '(empty)')
  return tags.join(', ') || url
}

function selectorFor(entries: HreflangEntry[], url: string): string | undefined {
  return entries.find((e) => e.resolved === url)?.selector
}

/**
 * Turn fetched statuses into findings.
 *
 * A status Facet actually received is treated as fact; a request that never
 * completed is only a warning, because from inside a browser extension a
 * failure is as likely to be the network or a bot filter as a broken page.
 */
export function reachabilityIssues(entries: HreflangEntry[], statuses: UrlStatus[]): Issue[] {
  const issues: Issue[] = []

  for (const [index, result] of statuses.entries()) {
    const label = labelFor(entries, result.url)
    const selector = selectorFor(entries, result.url)
    const id = `hreflang-reach-${index}`

    if (result.status === null) {
      issues.push({
        id,
        severity: 'warning',
        title: `Couldn’t reach the ${label} page`,
        detail: result.error
          ? `${result.error}. The page may still be fine — a server can refuse an automated request.`
          : 'The page may still be fine — a server can refuse an automated request.',
        snippet: truncate(result.url, 80),
        selector,
      })
      continue
    }

    if (result.status >= 400) {
      issues.push({
        id,
        severity: 'error',
        title: `${label} points at a page returning ${result.status}`,
        detail: 'Search engines drop the whole annotation set when a target is unreachable.',
        snippet: truncate(result.url, 80),
        selector,
      })
      continue
    }

    if (result.status >= 300) {
      issues.push({
        id,
        severity: 'warning',
        title: `${label} redirects (${result.status})`,
        detail: 'Annotate the final URL so the target and the annotation agree.',
        snippet: truncate(result.url, 80),
        selector,
      })
    }
  }

  if (issues.length === 0 && statuses.length > 0) {
    issues.push({
      id: 'hreflang-reach-ok',
      severity: 'pass',
      title: `All ${statuses.length} annotated ${statuses.length === 1 ? 'page' : 'pages'} responded`,
    })
  }

  return issues
}
