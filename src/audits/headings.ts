import type { AuditResult, Issue } from '@/core/types'
import { cssSelector, isHidden, normalizeText, truncate } from './dom'
import { buildResult } from './result'

export interface HeadingNode {
  level: number
  text: string
  /** Tag name (h1–h6) or `[role=heading]`. */
  tag: string
  selector: string
  /** Set when this heading jumps more than one level below the previous one. */
  skipped: boolean
  empty: boolean
}

export interface HeadingsData {
  outline: HeadingNode[]
  h1Count: number
}

const HEADING_QUERY = 'h1, h2, h3, h4, h5, h6, [role="heading"]'

function levelOf(el: Element): number {
  const tag = el.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) return Number(tag[1])
  const aria = Number(el.getAttribute('aria-level'))
  return Number.isFinite(aria) && aria >= 1 ? aria : 2
}

function tagOf(el: Element): string {
  const tag = el.tagName.toLowerCase()
  return /^h[1-6]$/.test(tag) ? tag : '[role=heading]'
}

export function auditHeadings(doc: Document): AuditResult<HeadingsData> {
  const issues: Issue[] = []
  const elements = Array.from(doc.querySelectorAll(HEADING_QUERY)).filter((el) => !isHidden(el))

  const outline: HeadingNode[] = elements.map((el) => ({
    level: levelOf(el),
    text: normalizeText(el.textContent),
    tag: tagOf(el),
    selector: cssSelector(el),
    skipped: false,
    empty: normalizeText(el.textContent).length === 0,
  }))

  const h1Count = outline.filter((h) => h.level === 1).length

  if (outline.length === 0) {
    issues.push({
      id: 'headings-none',
      severity: 'warning',
      title: 'No headings found',
      detail: 'Headings give the page a navigable outline for screen-reader and keyboard users.',
    })
    return buildResult('headings', issues, { outline, h1Count })
  }

  if (h1Count === 0) {
    issues.push({
      id: 'headings-no-h1',
      severity: 'error',
      title: 'Missing a top-level <h1>',
      detail: 'Every page should have exactly one <h1> describing its main content.',
    })
  } else if (h1Count > 1) {
    issues.push({
      id: 'headings-multiple-h1',
      severity: 'warning',
      title: `Multiple <h1> headings (${h1Count})`,
      detail: 'A single <h1> keeps the document outline unambiguous.',
    })
  } else {
    issues.push({ id: 'headings-single-h1', severity: 'pass', title: 'Exactly one <h1>' })
  }

  if (outline[0].level > 1) {
    issues.push({
      id: 'headings-first-not-h1',
      severity: 'warning',
      title: `First heading is <${outline[0].tag}>, not <h1>`,
      selector: outline[0].selector,
      snippet: truncate(outline[0].text || outline[0].tag),
    })
  }

  let previousLevel = outline[0].level
  let skips = 0
  outline.forEach((node, index) => {
    if (node.empty) {
      issues.push({
        id: `headings-empty-${index}`,
        severity: 'error',
        title: `Empty <${node.tag}> heading`,
        detail: 'A heading with no text still appears in the outline as a blank entry.',
        selector: node.selector,
      })
    }
    if (index > 0 && node.level > previousLevel + 1) {
      node.skipped = true
      skips += 1
      issues.push({
        id: `headings-skip-${index}`,
        severity: 'error',
        title: `Heading level skips from h${previousLevel} to h${node.level}`,
        detail: 'Skipping levels breaks the logical nesting of the outline.',
        selector: node.selector,
        snippet: truncate(node.text || node.tag),
      })
    }
    previousLevel = node.level
  })

  if (skips === 0) {
    issues.push({ id: 'headings-no-skips', severity: 'pass', title: 'No skipped heading levels' })
  }

  return buildResult('headings', issues, { outline, h1Count })
}
