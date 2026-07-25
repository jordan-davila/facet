import { describe, expect, it } from 'vitest'
import { auditCanonical } from '@/audits/canonical'
import { parseBody } from './helpers'

const PAGE = 'https://example.com/page'

function run(head: string, url = PAGE) {
  return auditCanonical(parseBody('', head), url)
}

describe('auditCanonical', () => {
  it('warns when no canonical is present', () => {
    expect(run('<title>t</title>').issues.map((i) => i.id)).toContain('canonical-missing')
  })

  it('passes a self-referencing canonical', () => {
    const result = run(`<link rel="canonical" href="${PAGE}">`)
    expect(result.data.isSelfReferencing).toBe(true)
    expect(result.issues.map((i) => i.id)).toContain('canonical-self')
  })

  it('surfaces a canonical pointing elsewhere', () => {
    const result = run('<link rel="canonical" href="https://other.com/">')
    expect(result.data.isSelfReferencing).toBe(false)
    expect(result.issues.map((i) => i.id)).toContain('canonical-different')
  })

  it('errors on multiple canonicals', () => {
    const head = `<link rel="canonical" href="${PAGE}"><link rel="canonical" href="${PAGE}?a=1">`
    expect(run(head).issues.map((i) => i.id)).toContain('canonical-multiple')
  })

  it('warns on a relative canonical and still resolves it', () => {
    const result = run('<link rel="canonical" href="/page">')
    expect(result.issues.map((i) => i.id)).toContain('canonical-relative')
    expect(result.data.resolved).toBe(PAGE)
  })
})
