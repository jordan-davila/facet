import { describe, expect, it } from 'vitest'
import { auditHeadings } from '@/audits/headings'
import { parseBody } from './helpers'

const ids = (html: string) => auditHeadings(parseBody(html)).issues.map((i) => i.id)

describe('auditHeadings', () => {
  it('flags a missing h1', () => {
    expect(ids('<h2>Section</h2>')).toContain('headings-no-h1')
  })

  it('warns on multiple h1s', () => {
    expect(ids('<h1>A</h1><h1>B</h1>')).toContain('headings-multiple-h1')
  })

  it('flags a skipped level', () => {
    const result = auditHeadings(parseBody('<h1>A</h1><h4>B</h4>'))
    expect(result.issues.some((i) => i.id.startsWith('headings-skip'))).toBe(true)
    expect(result.data.outline[1].skipped).toBe(true)
  })

  it('flags an empty heading', () => {
    expect(ids('<h1></h1>')).toContain('headings-empty-0')
  })

  it('passes a well-formed outline', () => {
    const result = auditHeadings(parseBody('<h1>A</h1><h2>B</h2><h3>C</h3>'))
    expect(result.errors).toBe(0)
    const passIds = result.issues.map((i) => i.id)
    expect(passIds).toContain('headings-single-h1')
    expect(passIds).toContain('headings-no-skips')
    expect(result.data.outline).toHaveLength(3)
  })

  it('reads aria-level on role=heading', () => {
    const result = auditHeadings(parseBody('<h1>A</h1><div role="heading" aria-level="2">B</div>'))
    expect(result.data.outline[1].level).toBe(2)
  })
})
