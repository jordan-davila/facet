import { describe, expect, it } from 'vitest'
import { clampScore, countSeverities, overallScore, scoreFromIssues } from '@/core/scoring'
import type { AuditResult, Issue } from '@/core/types'

const issue = (severity: Issue['severity']): Issue => ({ id: severity, severity, title: severity })

describe('clampScore', () => {
  it('clamps into 0–100 and rounds', () => {
    expect(clampScore(-10)).toBe(0)
    expect(clampScore(150)).toBe(100)
    expect(clampScore(72.6)).toBe(73)
    expect(clampScore(NaN)).toBe(0)
  })
})

describe('scoreFromIssues', () => {
  it('is 100 with no penalising issues', () => {
    expect(scoreFromIssues([issue('pass'), issue('info')])).toBe(100)
  })

  it('subtracts 15 per error and 5 per warning', () => {
    expect(scoreFromIssues([issue('error'), issue('warning')])).toBe(80)
  })

  it('never drops below zero', () => {
    expect(scoreFromIssues(Array.from({ length: 20 }, () => issue('error')))).toBe(0)
  })
})

describe('countSeverities', () => {
  it('tallies each severity', () => {
    const counts = countSeverities([
      issue('error'),
      issue('warning'),
      issue('warning'),
      issue('pass'),
    ])
    expect(counts).toEqual({ errors: 1, warnings: 2, passes: 1 })
  })
})

describe('overallScore', () => {
  const result = (score: number): AuditResult => ({
    facet: 'headings',
    label: 'x',
    errors: 0,
    warnings: 0,
    passes: 0,
    score,
    issues: [],
    data: null,
  })

  it('averages facet scores', () => {
    expect(overallScore([result(100), result(50)])).toBe(75)
  })

  it('is 100 when there are no results', () => {
    expect(overallScore([])).toBe(100)
  })
})
