import { SEO_LIMITS } from '@/core/constants'
import type { AuditResult, Issue } from '@/core/types'
import { cssSelector, isHidden, normalizeText, truncate } from './dom'
import { buildResult } from './result'

export type ImageStatus = 'ok' | 'missing' | 'decorative' | 'flagged'

export interface ImageInfo {
  src: string
  alt: string | null
  status: ImageStatus
  note?: string
  selector: string
}

export interface ImagesData {
  images: ImageInfo[]
  total: number
  missing: number
}

const FILENAME_RE = /\.(jpe?g|png|gif|webp|svg|avif|bmp|tiff?)$/i
const GENERATED_NAME_RE = /^(img|dsc|image|photo|screenshot|untitled)[-_ ]?\d+/i
const REDUNDANT_PREFIX_RE = /^(image|picture|photo|graphic) of\b/i

function isDecorative(img: Element): boolean {
  const role = img.getAttribute('role')
  return role === 'presentation' || role === 'none'
}

function altQualityNote(alt: string): string | null {
  if (FILENAME_RE.test(alt) || GENERATED_NAME_RE.test(alt)) return 'Alt text looks like a filename'
  if (alt.length > SEO_LIMITS.altMax) return `Alt text is very long (${alt.length} chars)`
  if (REDUNDANT_PREFIX_RE.test(alt)) return 'Alt text starts with a redundant phrase'
  return null
}

function classifyImg(img: HTMLImageElement): ImageInfo {
  const src = img.currentSrc || img.getAttribute('src') || ''
  const selector = cssSelector(img)
  const hasAria = Boolean(img.getAttribute('aria-label') || img.getAttribute('aria-labelledby'))

  if (!img.hasAttribute('alt')) {
    if (hasAria || isDecorative(img)) {
      return { src, alt: null, status: 'ok', selector }
    }
    return { src, alt: null, status: 'missing', selector }
  }

  const alt = normalizeText(img.getAttribute('alt'))
  if (alt === '') {
    return { src, alt: '', status: 'decorative', selector }
  }

  const note = altQualityNote(alt)
  if (note) return { src, alt, status: 'flagged', note, selector }
  return { src, alt, status: 'ok', selector }
}

export function auditImages(doc: Document): AuditResult<ImagesData> {
  const issues: Issue[] = []
  const imgs = Array.from(doc.querySelectorAll('img')).filter(
    (img) => !isHidden(img)
  ) as HTMLImageElement[]

  const images = imgs.map(classifyImg)
  const missing = images.filter((i) => i.status === 'missing').length

  images.forEach((info, index) => {
    if (info.status === 'missing') {
      issues.push({
        id: `images-missing-${index}`,
        severity: 'error',
        title: 'Image missing alt attribute',
        detail: 'Add descriptive alt text, or alt="" if the image is purely decorative.',
        selector: info.selector,
        snippet: truncate(info.src, 70),
      })
    } else if (info.status === 'flagged') {
      issues.push({
        id: `images-flagged-${index}`,
        severity: 'warning',
        title: info.note ?? 'Alt text needs review',
        selector: info.selector,
        snippet: truncate(info.alt ?? '', 70),
      })
    }
  })

  // Non-<img> images that also need alternative text.
  Array.from(doc.querySelectorAll('input[type="image"]')).forEach((input, index) => {
    if (isHidden(input)) return
    const hasName =
      input.getAttribute('alt') || input.getAttribute('aria-label') || input.getAttribute('title')
    if (!hasName) {
      issues.push({
        id: `images-input-${index}`,
        severity: 'error',
        title: 'Image button missing alt text',
        selector: cssSelector(input),
      })
    }
  })

  Array.from(doc.querySelectorAll('area')).forEach((area, index) => {
    if (!area.getAttribute('alt') && !area.getAttribute('aria-label')) {
      issues.push({
        id: `images-area-${index}`,
        severity: 'error',
        title: 'Image-map <area> missing alt text',
        selector: cssSelector(area),
      })
    }
  })

  if (imgs.length > 0 && missing === 0 && !issues.some((i) => i.severity === 'error')) {
    issues.push({
      id: 'images-alt-ok',
      severity: 'pass',
      title: `All ${imgs.length} images have alt text`,
    })
  }

  return buildResult('images', issues, { images, total: imgs.length, missing })
}
