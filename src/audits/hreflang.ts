import type { AuditResult, Issue } from '@/core/types'
import { cssSelector, truncate } from './dom'
import { buildResult } from './result'

export interface HreflangEntry {
  /** The hreflang value exactly as authored. */
  hreflang: string
  href: string | null
  /** Absolute form of href, when it could be resolved. */
  resolved: string | null
  /** Whether hreflang parses as a usable language tag (or x-default). */
  validTag: boolean
  isSelf: boolean
  isXDefault: boolean
  selector: string
}

export interface HreflangData {
  entries: HreflangEntry[]
  hasSelfReference: boolean
  hasXDefault: boolean
  /** Distinct locales annotated, x-default excluded. */
  locales: number
}

/**
 * Language tag shape per BCP-47, narrowed to what hreflang actually accepts:
 * a language, an optional script, and an optional region.
 */
const TAG_RE = /^([a-z]{2,3})(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/

/**
 * Region codes people reach for that ISO 3166-1 does not define. These are the
 * ones that silently drop a whole locale out of Google's index.
 */
const WRONG_REGIONS: Record<string, string> = {
  UK: 'GB',
  EU: 'a country code — EU is not a country',
  EN: 'a country code, not a language',
}

function isXDefault(value: string): boolean {
  return value.toLowerCase() === 'x-default'
}

/** Compare two URLs ignoring the trailing slash and the fragment. */
function sameDocument(a: string, b: string): boolean {
  try {
    const left = new URL(a)
    const right = new URL(b)
    left.hash = ''
    right.hash = ''
    return left.href.replace(/\/$/, '') === right.href.replace(/\/$/, '')
  } catch {
    return false
  }
}

function resolve(href: string, base: string): string | null {
  try {
    return new URL(href, base).href
  } catch {
    return null
  }
}

function readEntries(doc: Document, pageUrl: string): HreflangEntry[] {
  const links = doc.querySelectorAll<HTMLLinkElement>('link[rel~="alternate"][hreflang]')
  return [...links].map((link) => {
    const hreflang = (link.getAttribute('hreflang') ?? '').trim()
    const href = link.getAttribute('href')
    const resolved = href ? resolve(href, pageUrl) : null
    return {
      hreflang,
      href,
      resolved,
      validTag: isXDefault(hreflang) || TAG_RE.test(hreflang),
      isSelf: Boolean(resolved && sameDocument(resolved, pageUrl)),
      isXDefault: isXDefault(hreflang),
      selector: cssSelector(link),
    }
  })
}

/** The region subtag, when the tag carries one. */
function regionOf(hreflang: string): string | null {
  const match = /^[a-zA-Z]{2,3}(?:-[a-zA-Z]{4})?-([a-zA-Z]{2}|\d{3})$/.exec(hreflang)
  return match ? match[1].toUpperCase() : null
}

function tagIssues(entry: HreflangEntry, index: number): Issue[] {
  const issues: Issue[] = []
  const id = `hreflang-${index}`

  if (!entry.hreflang) {
    issues.push({
      id: `${id}-empty`,
      severity: 'error',
      title: 'Empty hreflang value',
      detail: 'The annotation is ignored without a language tag.',
      selector: entry.selector,
    })
    return issues
  }

  if (!entry.validTag) {
    issues.push({
      id: `${id}-tag`,
      severity: 'error',
      title: `“${entry.hreflang}” is not a valid language tag`,
      detail:
        'Use a language code, optionally with a region — for example en, en-GB, or zh-Hant-TW. ' +
        'Separate subtags with hyphens, not underscores.',
      selector: entry.selector,
    })
  } else {
    const region = regionOf(entry.hreflang)
    const correction = region ? WRONG_REGIONS[region] : undefined
    if (correction) {
      issues.push({
        id: `${id}-region`,
        severity: 'error',
        title: `“${entry.hreflang}” uses an invalid region`,
        detail: `${region} is not an ISO 3166-1 country code. Use ${correction}.`,
        selector: entry.selector,
      })
    }
  }

  if (!entry.href) {
    issues.push({
      id: `${id}-href`,
      severity: 'error',
      title: `“${entry.hreflang}” has no href`,
      selector: entry.selector,
    })
  } else if (!entry.resolved) {
    issues.push({
      id: `${id}-url`,
      severity: 'error',
      title: `“${entry.hreflang}” has an unparseable URL`,
      snippet: truncate(entry.href, 80),
      selector: entry.selector,
    })
  } else if (!/^https?:\/\//i.test(entry.href)) {
    issues.push({
      id: `${id}-relative`,
      severity: 'warning',
      title: `“${entry.hreflang}” uses a relative URL`,
      detail: 'Search engines expect fully-qualified URLs in hreflang annotations.',
      snippet: truncate(entry.href, 80),
      selector: entry.selector,
    })
  }

  return issues
}

/** Flag any language tag or target URL claimed more than once. */
function duplicateIssues(entries: HreflangEntry[]): Issue[] {
  const issues: Issue[] = []

  const byTag = new Map<string, HreflangEntry[]>()
  for (const entry of entries) {
    if (!entry.hreflang) continue
    const key = entry.hreflang.toLowerCase()
    byTag.set(key, [...(byTag.get(key) ?? []), entry])
  }
  for (const [tag, group] of byTag) {
    if (group.length < 2) continue
    const sameTarget = new Set(group.map((e) => e.resolved)).size === 1
    issues.push({
      id: `hreflang-dupe-${tag}`,
      severity: sameTarget ? 'warning' : 'error',
      title: `“${tag}” is declared ${group.length} times`,
      detail: sameTarget
        ? 'The duplicates point at the same URL; remove the extras.'
        : 'The duplicates point at different URLs, so search engines cannot tell which is correct.',
      selector: group[0].selector,
    })
  }

  const byHref = new Map<string, HreflangEntry[]>()
  for (const entry of entries) {
    if (!entry.resolved || entry.isXDefault) continue
    byHref.set(entry.resolved, [...(byHref.get(entry.resolved) ?? []), entry])
  }
  for (const [href, group] of byHref) {
    if (group.length < 2) continue
    issues.push({
      id: `hreflang-shared-${href}`,
      severity: 'warning',
      title: `${group.map((e) => e.hreflang).join(', ')} all point at the same URL`,
      detail: 'Each locale normally needs its own page for the annotation to mean anything.',
      snippet: truncate(href, 80),
      selector: group[0].selector,
    })
  }

  return issues
}

export function auditHreflang(doc: Document, pageUrl: string): AuditResult<HreflangData> {
  const entries = readEntries(doc, pageUrl)
  const hasSelfReference = entries.some((e) => e.isSelf)
  const hasXDefault = entries.some((e) => e.isXDefault)
  const data: HreflangData = {
    entries,
    hasSelfReference,
    hasXDefault,
    locales: new Set(entries.filter((e) => !e.isXDefault).map((e) => e.hreflang.toLowerCase()))
      .size,
  }

  // A page with no annotations is not multilingual; that is not a fault.
  if (entries.length === 0) {
    return buildResult(
      'hreflang',
      [
        {
          id: 'hreflang-none',
          severity: 'info',
          title: 'No hreflang annotations on this page',
          detail: 'Only needed when the same content exists in more than one language or region.',
        },
      ],
      data
    )
  }

  const issues: Issue[] = entries.flatMap((entry, index) => tagIssues(entry, index))
  issues.push(...duplicateIssues(entries))

  if (!hasSelfReference) {
    issues.push({
      id: 'hreflang-self',
      severity: 'error',
      title: 'No self-referencing hreflang',
      detail:
        'Each page in a set must list itself. Without it, search engines ignore the whole cluster.',
    })
  } else {
    issues.push({ id: 'hreflang-self-ok', severity: 'pass', title: 'Includes a self-reference' })
  }

  if (!hasXDefault) {
    issues.push({
      id: 'hreflang-xdefault',
      severity: 'warning',
      title: 'No x-default annotation',
      detail: 'x-default names the fallback for visitors whose locale matches nothing else.',
    })
  } else {
    issues.push({ id: 'hreflang-xdefault-ok', severity: 'pass', title: 'Declares an x-default' })
  }

  return buildResult('hreflang', issues, data)
}
