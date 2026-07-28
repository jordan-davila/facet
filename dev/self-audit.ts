import { auditContrast } from '@/audits/contrast'
import { DEFAULT_SETTINGS } from '@/core/settings'
import type { ThemePreference } from '@/core/types'

export interface SelfAuditFinding {
  view: string
  theme: ThemePreference
  title: string
  detail?: string
  selector?: string
  snippet?: string
}

export interface SelfAuditResult {
  contrast: SelfAuditFinding[]
  unnamed: string[]
}

function railButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('nav button')]
}

/** True when an element exposes a name assistive tech can announce. */
function hasAccessibleName(el: Element): boolean {
  const label = el.getAttribute('aria-label')
  if (label?.trim()) return true
  if (el.getAttribute('aria-labelledby')) return true
  if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true
  return Boolean((el as HTMLElement).innerText?.trim())
}

const NAMEABLE = 'button, a[href], input, select, textarea, [role="switch"]'

function unnamedControls(view: string): string[] {
  return [...document.querySelectorAll(NAMEABLE)]
    .filter((el) => (el as HTMLElement).offsetParent && !el.closest('[aria-hidden="true"]'))
    .filter((el) => !hasAccessibleName(el))
    .map((el) => `${view}: <${el.tagName.toLowerCase()}>`)
}

/**
 * Wait for the render and for any running transition to finish. Sampling a
 * color mid-transition reads an interpolated value and reports contrast
 * failures that never appear on screen.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, TRANSITION_SETTLE_MS))
  // Raced against a deadline: looping animations (the scan spinner) never
  // finish, so awaiting them outright would hang the sweep.
  await Promise.race([
    Promise.allSettled(document.getAnimations().map((a) => a.finished)),
    new Promise((resolve) => setTimeout(resolve, TRANSITION_SETTLE_MS)),
  ])
}

/** Comfortably longer than the slowest transition in the panel. */
const TRANSITION_SETTLE_MS = 400

const VIEWS = [
  'Overview',
  'Headings',
  'Landmarks',
  'Contrast',
  'Meta',
  'Canonical',
  'Hreflang',
  'Images',
  'Links',
  'Structured',
  'Settings',
]

/**
 * Facet auditing Facet. Walks every view in both themes and runs the
 * extension's own contrast auditor over the panel — the same code path, and the
 * same thresholds, that it applies to the pages it inspects.
 */
export async function selfAudit(level: 'AA' | 'AAA' = 'AA'): Promise<SelfAuditResult> {
  const settings = { ...DEFAULT_SETTINGS, wcagLevel: level, contrastMaxIssues: 1000 }
  const contrast: SelfAuditFinding[] = []
  const unnamed: string[] = []

  for (const theme of ['light', 'dark'] as const) {
    document.documentElement.setAttribute('data-theme', theme)
    await settle()
    for (const view of VIEWS) {
      const button = railButtons().find((b) => b.getAttribute('aria-label')?.startsWith(view))
      button?.click()
      await settle()

      unnamed.push(...unnamedControls(view))
      for (const issue of auditContrast(document, settings).issues) {
        if (issue.severity !== 'error' && issue.severity !== 'warning') continue
        const { title, detail, selector, snippet } = issue
        contrast.push({ view, theme, title, detail, selector, snippet })
      }
    }
  }

  document.documentElement.removeAttribute('data-theme')
  return { contrast, unnamed: [...new Set(unnamed)] }
}
