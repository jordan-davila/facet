import { FACET_META } from '@/core/constants'
import type { AuditReport, AuditResult, FacetId, Issue } from '@/core/types'

/** Canned findings that exercise every severity and every facet view. */
const ISSUES: Partial<Record<FacetId, Issue[]>> = {
  headings: [
    {
      id: 'h-1',
      severity: 'error',
      title: 'Heading level skipped',
      detail: 'The outline jumps from h2 to h4, so assistive tech reports a missing section.',
      selector: 'h4',
      snippet: '<h4>Shipping and returns</h4>',
    },
    {
      id: 'h-2',
      severity: 'warning',
      title: 'Empty heading',
      detail: 'A heading with no text still creates an entry in the outline.',
      selector: 'h3:nth-of-type(2)',
    },
  ],
  contrast: [
    {
      id: 'c-1',
      severity: 'error',
      title: 'Contrast 2.8:1 — needs 4.5:1',
      detail: '#8a8a8a on #ffffff at 14px.',
      selector: '.footer-note',
      snippet: 'All prices include VAT where applicable',
    },
  ],
  images: [
    { id: 'i-1', severity: 'error', title: 'Image is missing alt text', selector: 'img.hero' },
    {
      id: 'i-2',
      severity: 'warning',
      title: 'Alt text repeats the file name',
      detail: 'Describe what the image shows instead.',
      selector: 'img[src$="IMG_4821.jpg"]',
      snippet: 'alt="IMG_4821.jpg"',
    },
  ],
  meta: [
    {
      id: 'm-1',
      severity: 'warning',
      title: 'Meta description is 18 characters',
      detail: 'Aim for 50–160 so search results show a useful summary.',
    },
  ],
  links: [
    {
      id: 'l-1',
      severity: 'warning',
      title: '4 links read only “Read more”',
      detail: 'Out of context these give no idea where they lead.',
      selector: 'a.more',
    },
  ],
  landmarks: [
    { id: 'lm-1', severity: 'info', title: 'Two <nav> regions share no accessible name' },
  ],
}

const SCORES: Record<FacetId, { score: number; errors: number; warnings: number; passes: number }> =
  {
    headings: { score: 68, errors: 1, warnings: 1, passes: 4 },
    landmarks: { score: 92, errors: 0, warnings: 0, passes: 7 },
    contrast: { score: 55, errors: 1, warnings: 0, passes: 2 },
    meta: { score: 82, errors: 0, warnings: 1, passes: 9 },
    canonical: { score: 100, errors: 0, warnings: 0, passes: 3 },
    images: { score: 47, errors: 1, warnings: 1, passes: 6 },
    links: { score: 78, errors: 0, warnings: 1, passes: 5 },
    'structured-data': { score: 90, errors: 0, warnings: 0, passes: 4 },
  }

const DATA: Record<FacetId, unknown> = {
  headings: {
    outline: [
      { tag: 'h1', level: 1, text: 'Field notes on cut and clarity', selector: 'h1' },
      { tag: 'h2', level: 2, text: 'How a facet is measured', selector: 'h2:nth-of-type(1)' },
      { tag: 'h3', level: 3, text: 'Refractive index', selector: 'h3:nth-of-type(1)' },
      { tag: 'h3', level: 3, text: '', empty: true, selector: 'h3:nth-of-type(2)' },
      { tag: 'h4', level: 4, text: 'Shipping and returns', skipped: true, selector: 'h4' },
      { tag: 'div', level: 2, text: 'Related reading', selector: '[role=heading]' },
    ],
  },
  landmarks: {
    landmarks: [
      { role: 'banner', tag: 'header', name: null, depth: 0, selector: 'header' },
      { role: 'navigation', tag: 'nav', name: 'Primary', depth: 1, selector: 'nav.primary' },
      { role: 'main', tag: 'main', name: null, depth: 0, selector: 'main' },
      { role: 'complementary', tag: 'aside', name: 'Related', depth: 1, selector: 'aside' },
      { role: 'contentinfo', tag: 'footer', name: null, depth: 0, selector: 'footer' },
    ],
  },
  contrast: { level: 'AA', checked: 214, failing: 1, undetermined: 12 },
  meta: {
    title: 'Field notes on cut and clarity — Loupe',
    description: 'A short guide.',
    canonical: 'https://loupe.example/field-notes',
    lang: 'en',
    viewport: 'width=device-width, initial-scale=1',
    charset: 'utf-8',
    robots: null,
    ogImage: null,
    openGraph: [
      { key: 'og:title', value: 'Field notes on cut and clarity' },
      { key: 'og:type', value: 'article' },
    ],
    twitter: [{ key: 'twitter:card', value: 'summary' }],
  },
  canonical: {
    href: '/field-notes',
    resolved: 'https://loupe.example/field-notes',
    isSelfReferencing: true,
    count: 1,
  },
  images: {
    total: 8,
    images: Array.from({ length: 8 }, (_, i) => ({
      src: '',
      alt: i % 3 === 0 ? '' : 'A cut stone under raking light',
      status: (['missing', 'ok', 'decorative', 'flagged'] as const)[i % 4],
      selector: `img:nth-of-type(${i + 1})`,
    })),
  },
  links: { total: 63, withoutName: 0, withoutHref: 2, generic: 4, unsafeBlank: 1 },
  'structured-data': {
    typesFound: ['Article', 'BreadcrumbList', 'Organization'],
    blocks: [
      {
        index: 0,
        valid: true,
        json: '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Field notes on cut and clarity"\n}',
        nodes: [
          {
            types: ['Article'],
            requiredFields: [
              { name: 'headline', present: true },
              { name: 'image', present: false },
            ],
            recommendedFields: [
              { name: 'author', present: true },
              { name: 'datePublished', present: false },
            ],
            missingRequired: ['image'],
            missingAnyOf: [],
          },
        ],
      },
    ],
  },
}

interface FixtureOptions {
  /** Drop every finding, to preview the all-clear state. */
  clean?: boolean
}

function toResult(facet: FacetId, { clean }: FixtureOptions): AuditResult {
  const { score, errors, warnings, passes } = SCORES[facet]
  return {
    facet,
    label: FACET_META[facet].label,
    score: clean ? 100 : score,
    errors: clean ? 0 : errors,
    warnings: clean ? 0 : warnings,
    passes: passes + (clean ? errors + warnings : 0),
    issues: clean ? [] : (ISSUES[facet] ?? []),
    data: DATA[facet],
  }
}

export function fixtureReport(facets: FacetId[], options: FixtureOptions = {}): AuditReport {
  const results = facets.map((facet) => toResult(facet, options))
  const totals = {
    errors: results.reduce((n, r) => n + r.errors, 0),
    warnings: results.reduce((n, r) => n + r.warnings, 0),
    passes: results.reduce((n, r) => n + r.passes, 0),
  }
  return {
    page: { url: 'https://loupe.example/field-notes', title: 'Field notes', lang: 'en' },
    scannedAt: 0,
    score: options.clean ? 100 : 76,
    totals,
    results,
  }
}
