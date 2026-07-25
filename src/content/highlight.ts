// A lightweight, page-CSS-proof overlay that outlines an element the user
// selected in the side panel, scrolls it into view, then fades out.

const OVERLAY_ID = 'facet-highlight-overlay'
const VISIBLE_MS = 2600

// Facet's sapphire, as sRGB — the panel's own tokens don't reach the page.
const ACCENT = '#1f5fb8'
const ACCENT_WASH = 'rgba(31, 95, 184, 0.16)'

let overlay: HTMLDivElement | null = null
let hideTimer: number | null = null
let target: Element | null = null

function ensureOverlay(): HTMLDivElement {
  if (overlay && overlay.isConnected) return overlay
  overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  Object.assign(overlay.style, {
    position: 'absolute',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: `2px solid ${ACCENT}`,
    borderRadius: '3px',
    background: ACCENT_WASH,
    // A light halo so the outline survives on dark page backgrounds too.
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.65)',
    transition: 'top 0.12s ease-out, left 0.12s ease-out, width 0.12s, height 0.12s',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(overlay)
  return overlay
}

function reposition(): void {
  if (!target || !target.isConnected) return
  const rect = target.getBoundingClientRect()
  const el = ensureOverlay()
  el.style.display = 'block'
  el.style.top = `${rect.top + window.scrollY}px`
  el.style.left = `${rect.left + window.scrollX}px`
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
}

export function highlight(selector: string): boolean {
  let found: Element | null = null
  try {
    found = document.querySelector(selector)
  } catch {
    found = null
  }
  if (!found) return false

  target = found
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  found.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
  reposition()
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition, true)
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(clearHighlight, VISIBLE_MS)
  return true
}

export function clearHighlight(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition, true)
  target = null
  if (overlay) overlay.style.display = 'none'
}
