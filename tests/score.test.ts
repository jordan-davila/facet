import { describe, expect, test } from 'vitest'
import type { AuditResult } from '../src/core/types'
import {
  facetState,
  findingsSummary,
  plural,
  scoreBg,
  scoreColor,
  scoreLabel,
} from '../src/sidepanel/lib/score'

function result(errors: number, warnings: number): AuditResult {
  return {
    facet: 'headings',
    label: 'Headings',
    errors,
    warnings,
    passes: 0,
    score: 100,
    issues: [],
    data: null,
  }
}

describe('scoreLabel', () => {
  test('names each band at its boundary', () => {
    expect(scoreLabel(100)).toBe('Excellent')
    expect(scoreLabel(90)).toBe('Excellent')
    expect(scoreLabel(89)).toBe('Good')
    expect(scoreLabel(75)).toBe('Good')
    expect(scoreLabel(74)).toBe('Needs work')
    expect(scoreLabel(60)).toBe('Needs work')
    expect(scoreLabel(59)).toBe('Poor')
    expect(scoreLabel(0)).toBe('Poor')
  })
})

describe('scoreColor and scoreBg', () => {
  test('agree with the band the score falls in', () => {
    expect(scoreColor(95)).toBe('text-success')
    expect(scoreBg(95)).toBe('bg-success')
    expect(scoreColor(80)).toBe('text-spectral')
    expect(scoreBg(80)).toBe('bg-spectral')
    expect(scoreColor(65)).toBe('text-warning')
    expect(scoreBg(65)).toBe('bg-warning')
    expect(scoreColor(10)).toBe('text-destructive')
    expect(scoreBg(10)).toBe('bg-destructive')
  })

  test('falls back to the lowest band for out-of-range scores', () => {
    expect(scoreColor(-5)).toBe('text-destructive')
    expect(scoreLabel(-5)).toBe('Poor')
  })
})

describe('facetState', () => {
  test('reports flawed when any error is present, even alongside warnings', () => {
    expect(facetState(result(1, 3))).toBe('flawed')
  })

  test('reports watch when only warnings are present', () => {
    expect(facetState(result(0, 2))).toBe('watch')
  })

  test('reports clear when nothing was found', () => {
    expect(facetState(result(0, 0))).toBe('clear')
  })
})

describe('findingsSummary', () => {
  test('joins both counts when errors and warnings are present', () => {
    expect(findingsSummary(2, 3)).toBe('2 errors · 3 warnings')
  })

  test('singularises a count of one', () => {
    expect(findingsSummary(1, 1)).toBe('1 error · 1 warning')
  })

  test('omits a zero count', () => {
    expect(findingsSummary(0, 4)).toBe('4 warnings')
    expect(findingsSummary(5, 0)).toBe('5 errors')
  })

  test('says all clear when there is nothing to report', () => {
    expect(findingsSummary(0, 0)).toBe('All clear')
  })
})

describe('plural', () => {
  test('adds an s to every count except one', () => {
    expect(plural(0, 'tag')).toBe('0 tags')
    expect(plural(1, 'tag')).toBe('1 tag')
    expect(plural(2, 'tag')).toBe('2 tags')
  })
})
