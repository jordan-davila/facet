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
  hreflang: [
    {
      id: 'hf-1',
      severity: 'error',
      title: '“en-UK” uses an invalid region',
      detail: 'UK is not an ISO 3166-1 country code. Use GB.',
      selector: 'link[hreflang="en-UK"]',
    },
    {
      id: 'hf-2',
      severity: 'warning',
      title: 'No x-default annotation',
      detail: 'x-default names the fallback for visitors whose locale matches nothing else.',
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
    {
      id: 'lm-1',
      severity: 'info',
      title: 'Two <nav> regions share no accessible name',
      detail: 'Give each one an aria-label so they can be told apart.',
      selector: 'nav.primary',
    },
  ],
  'structured-data': [
    {
      id: 'sd-1',
      severity: 'error',
      title: 'Article is missing required field(s): image',
      detail: 'Google needs an image to show this as a rich result.',
    },
  ],
}

const SCORES: Record<FacetId, { score: number; errors: number; warnings: number; passes: number }> =
  {
    headings: { score: 68, errors: 1, warnings: 1, passes: 4 },
    landmarks: { score: 92, errors: 0, warnings: 0, passes: 7 },
    contrast: { score: 55, errors: 1, warnings: 0, passes: 2 },
    meta: { score: 82, errors: 0, warnings: 1, passes: 9 },
    canonical: { score: 100, errors: 0, warnings: 0, passes: 3 },
    hreflang: { score: 80, errors: 1, warnings: 1, passes: 1 },
    images: { score: 47, errors: 1, warnings: 1, passes: 6 },
    links: { score: 78, errors: 0, warnings: 1, passes: 5 },
    'structured-data': { score: 85, errors: 1, warnings: 0, passes: 4 },
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
  hreflang: {
    entries: [
      {
        hreflang: 'en',
        href: 'https://loupe.example/field-notes',
        resolved: 'https://loupe.example/field-notes',
        validTag: true,
        isSelf: true,
        isXDefault: false,
        selector: 'link[hreflang="en"]',
      },
      {
        hreflang: 'fr',
        href: '/fr/notes-de-terrain',
        resolved: 'https://loupe.example/fr/notes-de-terrain',
        validTag: true,
        isSelf: false,
        isXDefault: false,
        selector: 'link[hreflang="fr"]',
      },
      {
        hreflang: 'en-UK',
        href: 'https://loupe.example/uk/field-notes',
        resolved: 'https://loupe.example/uk/field-notes',
        validTag: true,
        isSelf: false,
        isXDefault: false,
        selector: 'link[hreflang="en-UK"]',
      },
      {
        hreflang: 'ja-JP',
        href: 'https://loupe.example/ja/field-notes',
        resolved: 'https://loupe.example/ja/field-notes',
        validTag: true,
        isSelf: false,
        isXDefault: false,
        selector: 'link[hreflang="ja-JP"]',
      },
    ],
    hasSelfReference: true,
    hasXDefault: false,
    locales: 4,
  },
  images: {
    total: 8,
    images: [
      { alt: null, status: 'missing', note: undefined },
      { alt: 'A brilliant-cut sapphire held in tweezers under raking light', status: 'ok' },
      { alt: '', status: 'decorative' },
      { alt: 'IMG_4821.jpg', status: 'flagged', note: 'Alt text looks like a filename' },
      { alt: 'Loupe', status: 'ok' },
      {
        alt: 'image of a jeweler grading a stone',
        status: 'flagged',
        note: 'Alt text starts with a redundant phrase',
      },
      { alt: null, status: 'missing' },
      { alt: 'Refractive index chart comparing corundum, beryl and quartz', status: 'ok' },
    ].map((image, i) => ({ ...image, src: '', selector: `img:nth-of-type(${i + 1})` })),
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
  // Derived, not hardcoded: a fixed score made the preview claim the same 76
  // no matter which checks ran, so turning one off changed nothing on screen.
  const score =
    results.length === 0
      ? 100
      : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)

  return {
    page: { url: 'https://loupe.example/field-notes', title: 'Field notes', lang: 'en' },
    scannedAt: Date.now(),
    score,
    totals,
    results,
  }
}
