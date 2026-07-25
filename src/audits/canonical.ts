import type { AuditResult, Issue } from '@/core/types'
import { buildResult } from './result'

export interface CanonicalData {
  href: string | null
  resolved: string | null
  isSelfReferencing: boolean
  count: number
}

function stripHash(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    return u.href
  } catch {
    return url
  }
}

export function auditCanonical(doc: Document, pageUrl: string): AuditResult<CanonicalData> {
  const issues: Issue[] = []
  const links = Array.from(doc.querySelectorAll('link[rel~="canonical"]'))
  const first = links[0] ?? null
  const href = first?.getAttribute('href')?.trim() ?? null

  const data: CanonicalData = {
    href,
    resolved: null,
    isSelfReferencing: false,
    count: links.length,
  }

  if (links.length === 0) {
    issues.push({
      id: 'canonical-missing',
      severity: 'warning',
      title: 'No canonical link',
      detail: 'Add <link rel="canonical"> to signal the preferred URL and avoid duplicate content.',
    })
    return buildResult('canonical', issues, data)
  }

  if (links.length > 1) {
    issues.push({
      id: 'canonical-multiple',
      severity: 'error',
      title: `Multiple canonical links (${links.length})`,
      detail: 'Search engines may ignore all of them when more than one is present.',
    })
  }

  if (first && !first.closest('head')) {
    issues.push({
      id: 'canonical-outside-head',
      severity: 'warning',
      title: 'Canonical link is outside <head>',
      detail: 'Canonical links in the body are ignored by most crawlers.',
    })
  }

  if (!href) {
    issues.push({
      id: 'canonical-empty',
      severity: 'error',
      title: 'Canonical link has an empty href',
    })
    return buildResult('canonical', issues, data)
  }

  const isAbsolute = /^https?:\/\//i.test(href)
  if (!isAbsolute) {
    issues.push({
      id: 'canonical-relative',
      severity: 'warning',
      title: 'Canonical URL is relative',
      detail: 'Use an absolute https URL for the canonical link.',
    })
  }

  try {
    const resolved = new URL(href, pageUrl)
    data.resolved = resolved.href
    data.isSelfReferencing = stripHash(resolved.href) === stripHash(pageUrl)

    if (pageUrl.startsWith('https://') && resolved.protocol === 'http:') {
      issues.push({
        id: 'canonical-insecure',
        severity: 'warning',
        title: 'Canonical points to an http URL on an https page',
      })
    }

    if (data.isSelfReferencing) {
      issues.push({
        id: 'canonical-self',
        severity: 'pass',
        title: 'Self-referencing canonical',
      })
    } else {
      issues.push({
        id: 'canonical-different',
        severity: 'info',
        title: 'Canonical points to a different URL',
        detail: resolved.href,
      })
    }
  } catch {
    issues.push({
      id: 'canonical-invalid',
      severity: 'error',
      title: 'Canonical href is not a valid URL',
      detail: href,
    })
  }

  return buildResult('canonical', issues, data)
}
