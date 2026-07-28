import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio, formatRatio, parseColor } from '@/audits/color'
import type { Rgb } from '@/audits/color'

/**
 * The palette's contract, enforced rather than asserted in a comment.
 *
 * globals.css claims each severity colour "is chosen to clear 4.5:1 against
 * --background as text and to carry --*-foreground at 4.5:1 as a fill". That
 * claim was false for one pair and nothing caught it, because the panel only
 * rendered the failing combination in a state the self-audit rarely reached.
 * Reading the stylesheet directly checks every pair on every run instead.
 */

const CSS = readFileSync(resolve(import.meta.dirname, '../src/styles/globals.css'), 'utf8')

type Scheme = 'light' | 'dark'

/** Pull `--name: light-dark(a, b)` (or a plain value) out of the stylesheet. */
function token(name: string, scheme: Scheme): Rgb {
  const declaration = new RegExp(`\\n\\s*--${name}:\\s*([^;]+);`).exec(CSS)
  if (!declaration) throw new Error(`Token --${name} is not declared`)

  const raw = declaration[1].trim()
  const pair = /^light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)$/s.exec(raw)
  const value = pair ? (scheme === 'light' ? pair[1] : pair[2]) : raw

  const parsed = parseColor(value)
  if (!parsed) throw new Error(`Token --${name} (${scheme}) is not a parseable colour: ${value}`)
  return parsed
}

function ratio(a: string, b: string, scheme: Scheme): number {
  return formatRatio(contrastRatio(token(a, scheme), token(b, scheme)))
}

const SCHEMES: Scheme[] = ['light', 'dark']
const SEVERITIES = ['destructive', 'success', 'warning', 'info'] as const

/** WCAG AA for normal-sized text — the bar Facet holds itself to. */
const AA = 4.5

describe.each(SCHEMES)('design tokens (%s)', (scheme) => {
  it.each(SEVERITIES)('%s reads as text on the page background', (name) => {
    expect(ratio(name, 'background', scheme)).toBeGreaterThanOrEqual(AA)
  })

  it.each(SEVERITIES)('%s reads as text on a card', (name) => {
    expect(ratio(name, 'card', scheme)).toBeGreaterThanOrEqual(AA)
  })

  it.each(SEVERITIES)('%s reads as text on a muted surface', (name) => {
    expect(ratio(name, 'muted', scheme)).toBeGreaterThanOrEqual(AA)
  })

  it.each(SEVERITIES)('%s carries its own foreground as a solid fill', (name) => {
    expect(ratio(name, `${name}-foreground`, scheme)).toBeGreaterThanOrEqual(AA)
  })

  it('primary carries its foreground', () => {
    expect(ratio('primary', 'primary-foreground', scheme)).toBeGreaterThanOrEqual(AA)
  })

  it('body text reads on every surface it sits on', () => {
    expect(ratio('foreground', 'background', scheme)).toBeGreaterThanOrEqual(AA)
    expect(ratio('foreground', 'card', scheme)).toBeGreaterThanOrEqual(AA)
    expect(ratio('muted-foreground', 'background', scheme)).toBeGreaterThanOrEqual(AA)
    expect(ratio('muted-foreground', 'card', scheme)).toBeGreaterThanOrEqual(AA)
  })

  it('the spectral accent reads as a score', () => {
    expect(ratio('spectral', 'background', scheme)).toBeGreaterThanOrEqual(AA)
    expect(ratio('spectral', 'card', scheme)).toBeGreaterThanOrEqual(AA)
    expect(ratio('spectral', 'muted', scheme)).toBeGreaterThanOrEqual(AA)
  })

  it('the tip jar carries its own text', () => {
    expect(ratio('support', 'support-foreground', scheme)).toBeGreaterThanOrEqual(AA)
  })
})
