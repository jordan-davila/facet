import { describe, expect, test } from 'vitest'
import { reportToMarkdown } from '../src/core/report-markdown'
import type { AuditReport, AuditResult, Issue } from '../src/core/types'

const SCANNED_AT = new Date('2026-07-24T12:00:00.000Z')

function result(overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    facet: 'headings',
    label: 'Headings',
    errors: 0,
    warnings: 0,
    passes: 3,
    score: 100,
    issues: [],
    data: null,
    ...overrides,
  }
}

function report(results: AuditResult[], overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    page: { url: 'https://example.test/page', title: 'Example page', lang: 'en' },
    scannedAt: SCANNED_AT.getTime(),
    score: 80,
    totals: {
      errors: results.reduce((n, r) => n + r.errors, 0),
      warnings: results.reduce((n, r) => n + r.warnings, 0),
      passes: results.reduce((n, r) => n + r.passes, 0),
    },
    results,
    ...overrides,
  }
}

describe('reportToMarkdown', () => {
  test('leads with the page, the score and the totals', () => {
    const markdown = reportToMarkdown(report([result()]), SCANNED_AT)

    expect(markdown).toContain('# Facet report — Example page')
    expect(markdown).toContain('- URL: https://example.test/page')
    expect(markdown).toContain('- Scanned: 2026-07-24T12:00:00.000Z')
    expect(markdown).toContain('- Score: 80/100')
    expect(markdown).toContain('- Findings: 0 errors, 0 warnings, 3 passed')
  })

  test('summarises every check in a table', () => {
    const markdown = reportToMarkdown(
      report([result({ score: 55, errors: 2, warnings: 1 })]),
      SCANNED_AT
    )

    expect(markdown).toContain('| Check | Score | Errors | Warnings |')
    expect(markdown).toContain('| Headings | 55 | 2 | 1 |')
  })

  test('lists errors and warnings with their detail and selector', () => {
    const issues: Issue[] = [
      {
        id: '1',
        severity: 'error',
        title: 'Heading level skipped',
        detail: 'The outline jumps from h2 to h4.',
        selector: 'main > h4',
      },
    ]
    const markdown = reportToMarkdown(report([result({ issues, errors: 1 })]), SCANNED_AT)

    expect(markdown).toContain('- **error** — Heading level skipped')
    expect(markdown).toContain('  The outline jumps from h2 to h4.')
    expect(markdown).toContain('  `main > h4`')
  })

  test('omits passes and info, which are not work to do', () => {
    const issues: Issue[] = [
      { id: '1', severity: 'pass', title: 'Exactly one h1' },
      { id: '2', severity: 'info', title: 'Two navigation regions' },
      { id: '3', severity: 'warning', title: 'Empty heading' },
    ]
    const markdown = reportToMarkdown(report([result({ issues, warnings: 1 })]), SCANNED_AT)

    expect(markdown).toContain('Empty heading')
    expect(markdown).not.toContain('Exactly one h1')
    expect(markdown).not.toContain('Two navigation regions')
  })

  test('says so when a check found nothing', () => {
    const markdown = reportToMarkdown(report([result()]), SCANNED_AT)

    expect(markdown).toContain('### Headings — 100/100')
    expect(markdown).toContain('No findings.')
  })

  test('escapes pipes so a title cannot break the table', () => {
    const markdown = reportToMarkdown(
      report([result({ label: 'Meta | SEO' })], { page: { url: 'u', title: 'a|b', lang: null } }),
      SCANNED_AT
    )

    expect(markdown).toContain('# Facet report — a\\|b')
    expect(markdown).toContain('| Meta \\| SEO |')
  })

  test('falls back to the URL when the page has no title', () => {
    const markdown = reportToMarkdown(
      report([result()], { page: { url: 'https://example.test/x', title: '', lang: null } }),
      SCANNED_AT
    )

    expect(markdown).toContain('# Facet report — https://example.test/x')
  })

  test('ends with exactly one trailing newline', () => {
    const markdown = reportToMarkdown(report([result()]), SCANNED_AT)

    expect(markdown.endsWith('\n')).toBe(true)
    expect(markdown.endsWith('\n\n')).toBe(false)
  })
})
