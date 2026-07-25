// DOM helpers shared across the structural auditors. These run inside the
// content script against the live page document.

/** True when an element is hidden from assistive tech (and thus most audits). */
export function isHidden(el: Element): boolean {
  if (el.hasAttribute('hidden')) return true
  if (el.getAttribute('aria-hidden') === 'true') return true
  if (el.closest('[aria-hidden="true"]')) return true
  const style = getComputedStyle(el)
  if (style.display === 'none') return true
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return true
  return false
}

function escapeIdent(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

/**
 * Build a reasonably unique CSS selector for an element so the content script
 * can re-find and highlight it. Prefers ids, falls back to an `nth-of-type`
 * path capped at a few levels.
 */
export function cssSelector(el: Element): string {
  if (el.id) return `#${escapeIdent(el.id)}`
  const parts: string[] = []
  let node: Element | null = el
  while (node && node.nodeType === 1 && parts.length < 6) {
    if (node.id) {
      parts.unshift(`#${escapeIdent(node.id)}`)
      break
    }
    let part = node.tagName.toLowerCase()
    const parent: Element | null = node.parentElement
    if (parent) {
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === node!.tagName)
      if (sameTag.length > 1) {
        part += `:nth-of-type(${sameTag.indexOf(node) + 1})`
      }
    }
    parts.unshift(part)
    node = node.parentElement
  }
  return parts.join(' > ')
}

/** Collapse whitespace and trim. */
export function normalizeText(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

/** Truncate a string for display, appending an ellipsis when clipped. */
export function truncate(text: string, max = 80): string {
  const clean = normalizeText(text)
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/** A short opening-tag snippet (no children) for context in the UI. */
export function openingTag(el: Element): string {
  const clone = el.cloneNode(false) as Element
  const html = clone.outerHTML
  const end = html.indexOf('>')
  return truncate(end === -1 ? html : html.slice(0, end + 1), 100)
}

function textFromLabelledBy(el: Element): string {
  const ids = el.getAttribute('aria-labelledby')
  if (!ids) return ''
  const doc = el.ownerDocument
  return ids
    .split(/\s+/)
    .map((id) => doc.getElementById(id)?.textContent ?? '')
    .join(' ')
}

/**
 * A pragmatic accessible-name computation covering the cases the link and image
 * auditors care about: aria-labelledby, aria-label, nested image alt text, SVG
 * titles, and visible text. Not a full ACCNAME implementation.
 */
export function accessibleName(el: Element): string {
  const labeled = normalizeText(textFromLabelledBy(el))
  if (labeled) return labeled

  const ariaLabel = normalizeText(el.getAttribute('aria-label'))
  if (ariaLabel) return ariaLabel

  const parts: string[] = [normalizeText(el.textContent)]
  el.querySelectorAll('img[alt]').forEach((img) =>
    parts.push(normalizeText(img.getAttribute('alt')))
  )
  el.querySelectorAll('svg[aria-label]').forEach((svg) =>
    parts.push(normalizeText(svg.getAttribute('aria-label')))
  )
  el.querySelectorAll('svg title').forEach((title) => parts.push(normalizeText(title.textContent)))
  const combined = normalizeText(parts.join(' '))
  if (combined) return combined

  return normalizeText(el.getAttribute('title'))
}
