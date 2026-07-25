import { FACET_META } from '@/core/constants'
import { countSeverities, scoreFromIssues } from '@/core/scoring'
import type { AuditResult, FacetId, Issue } from '@/core/types'

/** Assemble an AuditResult from a facet's issues, deriving counts and score. */
export function buildResult<Data>(facet: FacetId, issues: Issue[], data: Data): AuditResult<Data> {
  const { errors, warnings, passes } = countSeverities(issues)
  return {
    facet,
    label: FACET_META[facet].label,
    errors,
    warnings,
    passes,
    score: scoreFromIssues(issues),
    issues,
    data,
  }
}
