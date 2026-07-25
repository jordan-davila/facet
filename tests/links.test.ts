import { describe, expect, it } from 'vitest'
import { auditLinks } from '@/audits/links'
import { parseBody } from './helpers'

const ids = (html: string) => auditLinks(parseBody(html)).issues.map((i) => i.id)

describe('auditLinks', () => {
  it('errors when a link has no discernible text', () => {
    expect(ids('<a href="/x"></a>').some((id) => id.startsWith('links-empty'))).toBe(true)
  })

  it('warns on ambiguous link text', () => {
    expect(ids('<a href="/x">click here</a>').some((id) => id.startsWith('links-generic'))).toBe(
      true
    )
  })

  it('warns on a bare anchor with no href', () => {
    expect(ids('<a>orphan</a>').some((id) => id.startsWith('links-no-href'))).toBe(true)
  })

  it('does not warn on an anchor used as a jump target', () => {
    expect(ids('<a id="top"></a>').some((id) => id.startsWith('links-no-href'))).toBe(false)
  })

  it('warns on target=_blank without rel=noopener', () => {
    expect(
      ids('<a href="/x" target="_blank">Open the annual report</a>').some((id) =>
        id.startsWith('links-blank')
      )
    ).toBe(true)
  })

  it('passes descriptive links', () => {
    const result = auditLinks(parseBody('<a href="/report">Read the 2026 annual report</a>'))
    expect(result.errors).toBe(0)
    expect(result.issues.map((i) => i.id)).toContain('links-names-ok')
  })
})
