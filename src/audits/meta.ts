import { SEO_LIMITS } from '@/core/constants'
import type { AuditResult, Issue } from '@/core/types'
import { normalizeText } from './dom'
import { buildResult } from './result'

export interface MetaTag {
  key: string
  value: string
}

export interface MetaData {
  title: string | null
  description: string | null
  lang: string | null
  viewport: string | null
  charset: string | null
  robots: string | null
  canonical: string | null
  ogImage: string | null
  openGraph: MetaTag[]
  twitter: MetaTag[]
}

function metaContent(doc: Document, selector: string): string | null {
  const el = doc.querySelector(selector)
  const content = el?.getAttribute('content')
  return content !== undefined && content !== null ? normalizeText(content) : null
}

function collectPrefixed(doc: Document, attr: 'property' | 'name', prefix: string): MetaTag[] {
  return Array.from(doc.querySelectorAll(`meta[${attr}^="${prefix}"]`)).map((el) => ({
    key: el.getAttribute(attr) ?? '',
    value: normalizeText(el.getAttribute('content')),
  }))
}

function readData(doc: Document): MetaData {
  const charsetEl = doc.querySelector('meta[charset]')
  return {
    title: normalizeText(doc.querySelector('title')?.textContent) || null,
    description: metaContent(doc, 'meta[name="description"]'),
    lang: doc.documentElement.getAttribute('lang'),
    viewport: metaContent(doc, 'meta[name="viewport"]'),
    charset: charsetEl?.getAttribute('charset') ?? null,
    robots: metaContent(doc, 'meta[name="robots"]'),
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    ogImage: metaContent(doc, 'meta[property="og:image"]'),
    openGraph: collectPrefixed(doc, 'property', 'og:'),
    twitter: collectPrefixed(doc, 'name', 'twitter:'),
  }
}

function checkTitle(title: string | null, issues: Issue[]): void {
  if (!title) {
    issues.push({ id: 'meta-title-missing', severity: 'error', title: 'Missing <title>' })
    return
  }
  const len = title.length
  if (len < SEO_LIMITS.titleMin) {
    issues.push({
      id: 'meta-title-short',
      severity: 'warning',
      title: `Title is short (${len} chars)`,
      detail: `Aim for ${SEO_LIMITS.titleMin}–${SEO_LIMITS.titleMax} characters.`,
    })
  } else if (len > SEO_LIMITS.titleMax) {
    issues.push({
      id: 'meta-title-long',
      severity: 'warning',
      title: `Title may be truncated in search (${len} chars)`,
      detail: `Aim for ${SEO_LIMITS.titleMin}–${SEO_LIMITS.titleMax} characters.`,
    })
  } else {
    issues.push({ id: 'meta-title-ok', severity: 'pass', title: 'Title present and well-sized' })
  }
}

function checkDescription(description: string | null, issues: Issue[]): void {
  if (!description) {
    issues.push({
      id: 'meta-description-missing',
      severity: 'warning',
      title: 'Missing meta description',
      detail: 'Search engines use this as the results snippet.',
    })
    return
  }
  const len = description.length
  if (len < SEO_LIMITS.descriptionMin || len > SEO_LIMITS.descriptionMax) {
    issues.push({
      id: 'meta-description-length',
      severity: 'warning',
      title: `Description length is off (${len} chars)`,
      detail: `Aim for ${SEO_LIMITS.descriptionMin}–${SEO_LIMITS.descriptionMax} characters.`,
    })
  } else {
    issues.push({ id: 'meta-description-ok', severity: 'pass', title: 'Meta description present' })
  }
}

function checkBasics(data: MetaData, issues: Issue[]): void {
  if (!data.lang) {
    issues.push({
      id: 'meta-lang-missing',
      severity: 'error',
      title: 'Missing lang on <html>',
      detail: 'Set <html lang="…"> so screen readers use the right pronunciation.',
    })
  } else if (!/^[a-z]{2,3}(-[a-z0-9]+)*$/i.test(data.lang)) {
    issues.push({
      id: 'meta-lang-invalid',
      severity: 'warning',
      title: `Unusual lang value "${data.lang}"`,
    })
  }
  if (!data.viewport) {
    issues.push({
      id: 'meta-viewport-missing',
      severity: 'warning',
      title: 'Missing viewport meta',
      detail: 'Required for responsive rendering on mobile.',
    })
  }
  if (!data.charset) {
    issues.push({
      id: 'meta-charset-missing',
      severity: 'warning',
      title: 'Missing charset declaration',
    })
  }
  if (data.robots && /noindex/i.test(data.robots)) {
    issues.push({
      id: 'meta-robots-noindex',
      severity: 'warning',
      title: 'Page is set to noindex',
      detail: 'Search engines will exclude this page from results.',
    })
  }
}

function checkSocial(data: MetaData, issues: Issue[]): void {
  const ogMap = new Map(data.openGraph.map((t) => [t.key, t.value]))
  const requiredOg = ['og:title', 'og:type', 'og:image', 'og:url']
  const missingOg = requiredOg.filter((key) => !ogMap.get(key))
  if (data.openGraph.length === 0) {
    issues.push({
      id: 'meta-og-none',
      severity: 'info',
      title: 'No Open Graph tags',
      detail: 'og:title/type/image/url control link previews on social platforms.',
    })
  } else if (missingOg.length > 0) {
    issues.push({
      id: 'meta-og-missing',
      severity: 'warning',
      title: `Missing Open Graph tags: ${missingOg.join(', ')}`,
    })
  } else {
    issues.push({ id: 'meta-og-ok', severity: 'pass', title: 'Core Open Graph tags present' })
  }

  const twitterMap = new Map(data.twitter.map((t) => [t.key, t.value]))
  if (data.twitter.length > 0 && !twitterMap.get('twitter:card')) {
    issues.push({
      id: 'meta-twitter-card',
      severity: 'warning',
      title: 'Twitter tags present but twitter:card is missing',
    })
  }
}

export function auditMeta(doc: Document): AuditResult<MetaData> {
  const issues: Issue[] = []
  const data = readData(doc)
  checkTitle(data.title, issues)
  checkDescription(data.description, issues)
  checkBasics(data, issues)
  checkSocial(data, issues)
  return buildResult('meta', issues, data)
}
