import type { AuditReport, AuditResult, Issue, Severity } from './types'

/** Severities worth writing down; passes and info are noise in a bug report. */
const REPORTED: Severity[] = ['error', 'warning']

const SEVERITY_MARK: Record<Severity, string> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  pass: 'pass',
}

function escapePipes(text: string): string {
  return text.replace(/\|/g, '\\|')
}

function issueLines(issue: Issue): string[] {
  const lines = [`- **${SEVERITY_MARK[issue.severity]}** — ${issue.title}`]
  if (issue.detail) lines.push(`  ${issue.detail}`)
  if (issue.selector) lines.push(`  \`${issue.selector}\``)
  return lines
}

function facetSection(result: AuditResult): string[] {
  const reported = result.issues.filter((issue) => REPORTED.includes(issue.severity))
  const lines = [`### ${result.label} — ${result.score}/100`]
  if (reported.length === 0) {
    lines.push('', 'No findings.')
    return lines
  }
  lines.push('')
  for (const issue of reported) lines.push(...issueLines(issue))
  return lines
}

/**
 * Render a report as Markdown, for pasting into an issue or a pull request.
 * Only errors and warnings are listed — a reader wants what to fix, not a
 * transcript of everything that passed.
 */
export function reportToMarkdown(report: AuditReport, scannedAt: Date): string {
  const { errors, warnings, passes } = report.totals
  const lines = [
    `# Facet report — ${escapePipes(report.page.title || report.page.url)}`,
    '',
    `- URL: ${report.page.url}`,
    `- Scanned: ${scannedAt.toISOString()}`,
    `- Score: ${report.score}/100`,
    `- Findings: ${errors} errors, ${warnings} warnings, ${passes} passed`,
    '',
    '| Check | Score | Errors | Warnings |',
    '| --- | ---: | ---: | ---: |',
    ...report.results.map(
      (r) => `| ${escapePipes(r.label)} | ${r.score} | ${r.errors} | ${r.warnings} |`
    ),
    '',
  ]
  for (const result of report.results) {
    lines.push(...facetSection(result), '')
  }
  return `${lines.join('\n').trimEnd()}\n`
}
