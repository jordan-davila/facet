import type { FacetId, WcagLevel } from './types'

/** Display order of the audit facets in the sidebar and overview. */
export const FACET_ORDER: FacetId[] = [
  'headings',
  'landmarks',
  'contrast',
  'meta',
  'canonical',
  'hreflang',
  'images',
  'links',
  'structured-data',
]

export interface FacetMeta {
  label: string
  /** One-line description shown in the overview and settings. */
  blurb: string
}

export const FACET_META: Record<FacetId, FacetMeta> = {
  headings: {
    label: 'Headings',
    blurb: 'Document outline and heading-level structure.',
  },
  landmarks: {
    label: 'Landmarks',
    blurb: 'WAI-ARIA landmark regions and roles.',
  },
  contrast: {
    label: 'Contrast',
    blurb: 'Text color contrast against WCAG thresholds.',
  },
  meta: {
    label: 'Meta & SEO',
    blurb: 'Title, description, viewport, Open Graph and Twitter tags.',
  },
  canonical: {
    label: 'Canonical',
    blurb: 'Canonical link presence and correctness.',
  },
  hreflang: {
    label: 'Hreflang',
    blurb: 'Language and region annotations for multilingual pages.',
  },
  images: {
    label: 'Images',
    blurb: 'Missing or low-quality alternative text.',
  },
  links: {
    label: 'Links',
    blurb: 'Broken, empty or ambiguous links.',
  },
  'structured-data': {
    label: 'Structured Data',
    blurb: 'JSON-LD schema.org validity for rich results.',
  },
}

/** WCAG 2.1 contrast thresholds keyed by level, then normal vs large text. */
export const CONTRAST_THRESHOLDS: Record<WcagLevel, { normal: number; large: number }> = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
}

/** WCAG "large text" boundaries in CSS pixels (18pt = 24px, 14pt bold = 18.66px). */
export const LARGE_TEXT_PX = 24
export const LARGE_TEXT_BOLD_PX = 18.66
export const BOLD_WEIGHT = 700

/** Recommended lengths for SEO fields (characters). */
export const SEO_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descriptionMin: 50,
  descriptionMax: 160,
  altMax: 125,
}

/** Score penalties per finding, used by the scoring module. */
export const SCORE_PENALTY = { error: 15, warning: 5 }
