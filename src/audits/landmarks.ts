import type { AuditResult, Issue } from '@/core/types'
import { cssSelector, isHidden, normalizeText } from './dom'
import { buildResult } from './result'

export interface Landmark {
  role: string
  name: string | null
  tag: string
  selector: string
  /** How many landmark ancestors this landmark is nested inside (0 = top-level). */
  depth: number
  /** Role of the nearest landmark ancestor, if any. */
  parentRole: string | null
}

export interface LandmarksData {
  landmarks: Landmark[]
}

const LANDMARK_ROLES = [
  'banner',
  'navigation',
  'main',
  'complementary',
  'contentinfo',
  'search',
  'form',
  'region',
]

const SECTIONING = 'article, aside, main, nav, section'

function landmarkName(el: Element): string | null {
  const label = normalizeText(el.getAttribute('aria-label'))
  if (label) return label
  const ids = el.getAttribute('aria-labelledby')
  if (ids) {
    const doc = el.ownerDocument
    const text = ids
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent ?? '')
      .join(' ')
    return normalizeText(text) || null
  }
  return null
}

function explicitLandmarkRole(el: Element): string | null {
  const role = el.getAttribute('role')
  if (!role) return null
  return (
    role
      .toLowerCase()
      .split(/\s+/)
      .find((r) => LANDMARK_ROLES.includes(r)) ?? null
  )
}

function implicitLandmarkRole(el: Element): string | null {
  switch (el.tagName.toLowerCase()) {
    case 'main':
      return 'main'
    case 'nav':
      return 'navigation'
    case 'aside':
      return 'complementary'
    case 'header':
      return el.closest(SECTIONING) ? null : 'banner'
    case 'footer':
      return el.closest(SECTIONING) ? null : 'contentinfo'
    case 'form':
      return landmarkName(el) ? 'form' : null
    case 'section':
      return landmarkName(el) ? 'region' : null
    default:
      return null
  }
}

interface RawLandmark {
  el: Element
  role: string
  name: string | null
}

function collectRawLandmarks(doc: Document): RawLandmark[] {
  const candidates = doc.querySelectorAll('header, nav, main, aside, footer, form, section, [role]')
  const raw: RawLandmark[] = []
  const seen = new Set<Element>()
  candidates.forEach((el) => {
    if (seen.has(el) || isHidden(el)) return
    const role = explicitLandmarkRole(el) ?? implicitLandmarkRole(el)
    if (!role) return
    seen.add(el)
    raw.push({ el, role, name: landmarkName(el) })
  })
  return raw
}

/** Resolve each landmark's nesting depth and nearest landmark ancestor. */
function toLandmarks(raw: RawLandmark[]): Landmark[] {
  const roleByElement = new Map(raw.map((r) => [r.el, r.role]))
  return raw.map((r) => {
    let depth = 0
    let parentRole: string | null = null
    let ancestor = r.el.parentElement
    while (ancestor) {
      const role = roleByElement.get(ancestor)
      if (role) {
        depth += 1
        if (parentRole === null) parentRole = role
      }
      ancestor = ancestor.parentElement
    }
    return {
      role: r.role,
      name: r.name,
      tag: r.el.tagName.toLowerCase(),
      selector: cssSelector(r.el),
      depth,
      parentRole,
    }
  })
}

function checkUniqueNames(
  landmarks: Landmark[],
  role: string,
  issues: Issue[],
  label: string
): void {
  const group = landmarks.filter((l) => l.role === role)
  if (group.length < 2) return
  const names = group.map((l) => l.name ?? '')
  const hasDuplicateOrMissing = names.some((n, i) => n === '' || names.indexOf(n) !== i)
  if (hasDuplicateOrMissing) {
    issues.push({
      id: `landmarks-${role}-labels`,
      severity: 'warning',
      title: `Multiple ${label} landmarks need unique labels`,
      detail: `Give each ${label} an aria-label so assistive tech can tell them apart.`,
    })
  }
}

/** banner, contentinfo and main lose their meaning when nested in a landmark. */
function checkTopLevel(landmarks: Landmark[], issues: Issue[]): void {
  landmarks.forEach((landmark, index) => {
    if (landmark.depth === 0) return
    if (landmark.role === 'banner' || landmark.role === 'contentinfo') {
      issues.push({
        id: `landmarks-${landmark.role}-nested-${index}`,
        severity: 'warning',
        title: `${landmark.role} landmark is not top-level`,
        detail: `It is nested inside a ${landmark.parentRole} landmark, which strips its role. Move it to the top level.`,
        selector: landmark.selector,
      })
    } else if (landmark.role === 'main') {
      issues.push({
        id: `landmarks-main-nested-${index}`,
        severity: 'warning',
        title: 'main landmark is nested inside another landmark',
        detail: `main should sit at the top level, not inside a ${landmark.parentRole} landmark.`,
        selector: landmark.selector,
      })
    }
  })
}

export function auditLandmarks(doc: Document): AuditResult<LandmarksData> {
  const issues: Issue[] = []
  const landmarks = toLandmarks(collectRawLandmarks(doc))

  const mainCount = landmarks.filter((l) => l.role === 'main').length
  if (mainCount === 0) {
    issues.push({
      id: 'landmarks-no-main',
      severity: 'error',
      title: 'No <main> landmark',
      detail: 'A single main landmark lets users skip straight to the primary content.',
    })
  } else if (mainCount > 1) {
    issues.push({
      id: 'landmarks-multiple-main',
      severity: 'error',
      title: `Multiple main landmarks (${mainCount})`,
      detail: 'Exactly one main landmark should exist per page.',
    })
  } else {
    issues.push({ id: 'landmarks-single-main', severity: 'pass', title: 'Single main landmark' })
  }

  if (landmarks.filter((l) => l.role === 'banner').length > 1) {
    issues.push({
      id: 'landmarks-multiple-banner',
      severity: 'warning',
      title: 'Multiple banner landmarks',
      detail: 'Only one top-level banner (site header) is expected.',
    })
  }
  if (landmarks.filter((l) => l.role === 'contentinfo').length > 1) {
    issues.push({
      id: 'landmarks-multiple-contentinfo',
      severity: 'warning',
      title: 'Multiple contentinfo landmarks',
      detail: 'Only one top-level contentinfo (site footer) is expected.',
    })
  }

  checkTopLevel(landmarks, issues)
  checkUniqueNames(landmarks, 'navigation', issues, 'navigation')
  checkUniqueNames(landmarks, 'region', issues, 'region')

  if (landmarks.length === 0) {
    issues.push({
      id: 'landmarks-none',
      severity: 'warning',
      title: 'No ARIA landmarks found',
      detail: 'Use <header>, <nav>, <main>, <aside> and <footer> to structure the page.',
    })
  }

  return buildResult('landmarks', issues, { landmarks })
}
