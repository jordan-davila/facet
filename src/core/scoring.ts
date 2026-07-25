import { SCORE_PENALTY } from './constants'
import type { AuditResult, Issue } from './types'

/** Clamp a number into the inclusive [0, 100] range. */
export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Derive a 0–100 score from a set of issues. A clean facet scores 100; every
 * error and warning subtracts a fixed penalty. Info and pass findings never
 * lower the score.
 */
export function scoreFromIssues(issues: Issue[]): number {
  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === 'error') return total + SCORE_PENALTY.error
    if (issue.severity === 'warning') return total + SCORE_PENALTY.warning
    return total
  }, 0)
  return clampScore(100 - penalty)
}

/** Tally severities across a list of issues. */
export function countSeverities(issues: Issue[]): {
  errors: number
  warnings: number
  passes: number
} {
  return {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    passes: issues.filter((i) => i.severity === 'pass').length,
  }
}

/**
 * Overall page score: the mean of the individual facet scores. Facets that
 * produced no results (disabled) are excluded so they neither help nor hurt.
 */
export function overallScore(results: AuditResult[]): number {
  if (results.length === 0) return 100
  const total = results.reduce((sum, r) => sum + r.score, 0)
  return clampScore(total / results.length)
}
