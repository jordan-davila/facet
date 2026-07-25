import { describe, expect, it } from 'vitest'
import { auditLandmarks } from '@/audits/landmarks'
import { parseBody } from './helpers'

const roles = (html: string) => auditLandmarks(parseBody(html)).data.landmarks.map((l) => l.role)
const ids = (html: string) => auditLandmarks(parseBody(html)).issues.map((i) => i.id)

describe('auditLandmarks', () => {
  it('flags a missing main', () => {
    expect(ids('<div>content</div>')).toContain('landmarks-no-main')
  })

  it('flags multiple mains', () => {
    expect(ids('<main>1</main><main>2</main>')).toContain('landmarks-multiple-main')
  })

  it('detects implicit roles', () => {
    const found = roles(
      '<header>top</header><nav>n</nav><main>m</main><aside>a</aside><footer>f</footer>'
    )
    expect(found).toEqual(
      expect.arrayContaining(['banner', 'navigation', 'main', 'complementary', 'contentinfo'])
    )
  })

  it('does not treat a header inside main as a banner', () => {
    expect(roles('<main><header>h</header>x</main>')).not.toContain('banner')
  })

  it('honours explicit roles', () => {
    expect(roles('<div role="search">s</div><main>m</main>')).toContain('search')
  })

  it('warns when duplicate navs lack unique names', () => {
    expect(ids('<main>m</main><nav>one</nav><nav>two</nav>')).toContain(
      'landmarks-navigation-labels'
    )
  })

  it('passes a single labeled main', () => {
    const result = auditLandmarks(parseBody('<main>content</main>'))
    expect(result.issues.map((i) => i.id)).toContain('landmarks-single-main')
  })

  it('records nesting depth and parent role', () => {
    const data = auditLandmarks(parseBody('<main><nav>x</nav></main>')).data
    const nav = data.landmarks.find((l) => l.role === 'navigation')
    expect(nav?.depth).toBe(1)
    expect(nav?.parentRole).toBe('main')
  })

  it('warns when a banner is nested inside another landmark', () => {
    expect(
      ids('<main><div role="banner">b</div></main>').some((id) =>
        id.startsWith('landmarks-banner-nested')
      )
    ).toBe(true)
  })

  it('warns when main is nested inside another landmark', () => {
    expect(
      ids('<aside><div role="main">m</div></aside>').some((id) =>
        id.startsWith('landmarks-main-nested')
      )
    ).toBe(true)
  })

  it('does not flag a top-level main as nested', () => {
    expect(ids('<main>content</main>').some((id) => id.includes('nested'))).toBe(false)
  })
})
