import type { AuditResult, Issue } from '@/core/types'
import { accessibleName, cssSelector, isHidden, normalizeText, truncate } from './dom'
import { buildResult } from './result'

export interface LinksData {
  total: number
  withoutHref: number
  withoutName: number
  generic: number
  unsafeBlank: number
}

const GENERIC_TEXT = new Set([
  'click here',
  'click',
  'here',
  'read more',
  'read',
  'more',
  'learn more',
  'link',
  'this',
  'details',
  'continue',
  'go',
])

function isPlaceholderHref(href: string): boolean {
  const value = href.trim().toLowerCase()
  return value === '#' || value.startsWith('javascript:')
}

export function auditLinks(doc: Document): AuditResult<LinksData> {
  const issues: Issue[] = []
  const anchors = Array.from(doc.querySelectorAll('a')).filter(
    (a) => !isHidden(a)
  ) as HTMLAnchorElement[]

  let withoutHref = 0
  let withoutName = 0
  let generic = 0
  let unsafeBlank = 0
  const textToHrefs = new Map<string, Set<string>>()

  anchors.forEach((a, index) => {
    const hrefAttr = a.getAttribute('href')
    const name = accessibleName(a)

    if (hrefAttr === null) {
      // An <a> used only as a jump target is legitimate; a bare anchor is not.
      if (!a.id && !a.getAttribute('name')) {
        withoutHref += 1
        issues.push({
          id: `links-no-href-${index}`,
          severity: 'warning',
          title: 'Anchor without href',
          detail: 'Use a <button> for actions, or add an href to make it a real link.',
          selector: cssSelector(a),
          snippet: truncate(name || a.outerHTML, 60),
        })
      }
      return
    }

    if (name === '') {
      withoutName += 1
      issues.push({
        id: `links-empty-${index}`,
        severity: 'error',
        title: 'Link has no discernible text',
        detail: 'Add visible text, an aria-label, or alt text on a child image.',
        selector: cssSelector(a),
        snippet: truncate(hrefAttr, 60),
      })
    } else if (GENERIC_TEXT.has(name.toLowerCase())) {
      generic += 1
      issues.push({
        id: `links-generic-${index}`,
        severity: 'warning',
        title: `Ambiguous link text: "${truncate(name, 30)}"`,
        detail: 'Out of context, generic link text tells users nothing about the destination.',
        selector: cssSelector(a),
      })
    }

    if (a.getAttribute('target') === '_blank') {
      const rel = (a.getAttribute('rel') ?? '').toLowerCase()
      if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
        unsafeBlank += 1
        issues.push({
          id: `links-blank-${index}`,
          severity: 'warning',
          title: 'target="_blank" without rel="noopener"',
          detail: 'Add rel="noopener" to prevent the new page accessing window.opener.',
          selector: cssSelector(a),
          snippet: truncate(name || hrefAttr, 60),
        })
      }
    }

    const normalized = normalizeText(name).toLowerCase()
    if (normalized && !isPlaceholderHref(hrefAttr) && !GENERIC_TEXT.has(normalized)) {
      const set = textToHrefs.get(normalized) ?? new Set<string>()
      set.add(a.href)
      textToHrefs.set(normalized, set)
    }
  })

  let ambiguousReported = 0
  for (const [text, hrefs] of textToHrefs) {
    if (hrefs.size > 1 && ambiguousReported < 5) {
      ambiguousReported += 1
      issues.push({
        id: `links-dup-${ambiguousReported}`,
        severity: 'info',
        title: `"${truncate(text, 30)}" links to ${hrefs.size} different URLs`,
      })
    }
  }

  if (anchors.length > 0 && withoutName === 0 && !issues.some((i) => i.severity === 'error')) {
    issues.push({
      id: 'links-names-ok',
      severity: 'pass',
      title: 'All links have discernible text',
    })
  }

  return buildResult('links', issues, {
    total: anchors.length,
    withoutHref,
    withoutName,
    generic,
    unsafeBlank,
  })
}
