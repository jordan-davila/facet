import type { AuditResult } from '@/core/types'

/**
 * Score bands, in one place so color, label and grade can never disagree.
 *
 * 'Good' gets beryl rather than green on purpose: a page in the 75–89 range
 * still has findings, and painting it the same green as a clean page would
 * quietly tell the reader there is nothing left to do.
 */
const BANDS = [
  { min: 90, tone: 'success', label: 'Excellent' },
  { min: 75, tone: 'spectral', label: 'Good' },
  { min: 60, tone: 'warning', label: 'Needs work' },
  { min: 0, tone: 'destructive', label: 'Poor' },
] as const

type Tone = (typeof BANDS)[number]['tone']

// Spelled out rather than interpolated: Tailwind only ships classes it can
// find literally in the source.
const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  spectral: 'text-spectral',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

const TONE_BG: Record<Tone, string> = {
  success: 'bg-success',
  spectral: 'bg-spectral',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

function band(score: number) {
  return BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]
}

/** Text color utility for a 0–100 score. */
export function scoreColor(score: number): string {
  return TONE_TEXT[band(score).tone]
}

/** Fill color utility for a 0–100 score, for bars and gauges. */
export function scoreBg(score: number): string {
  return TONE_BG[band(score).tone]
}

/** Short qualitative descriptor, spoken as-is by screen readers. */
export function scoreLabel(score: number): string {
  return band(score).label
}

export type FacetState = 'flawed' | 'watch' | 'clear'

/** A facet's headline condition, derived from its findings rather than its score. */
export function facetState(result: AuditResult): FacetState {
  if (result.errors > 0) return 'flawed'
  if (result.warnings > 0) return 'watch'
  return 'clear'
}

export const STATE_TEXT: Record<FacetState, string> = {
  flawed: 'text-destructive',
  watch: 'text-warning',
  clear: 'text-success',
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** "2 errors · 1 warning", or "All clear" when a facet has nothing to report. */
export function findingsSummary(errors: number, warnings: number): string {
  const parts: string[] = []
  if (errors > 0) parts.push(plural(errors, 'error'))
  if (warnings > 0) parts.push(plural(warnings, 'warning'))
  return parts.length > 0 ? parts.join(' · ') : 'All clear'
}

export { plural }
