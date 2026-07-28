import { FACET_ORDER } from '@/core/constants'
import { overallScore } from '@/core/scoring'
import type { AuditReport, AuditResult, FacetId, PageInfo, Settings } from '@/core/types'
import { auditCanonical } from './canonical'
import { auditContrast } from './contrast'
import { auditHeadings } from './headings'
import { auditHreflang } from './hreflang'
import { auditImages } from './images'
import { auditJsonLd } from './jsonld'
import { auditLandmarks } from './landmarks'
import { auditLinks } from './links'
import { auditMeta } from './meta'
import { buildResult } from './result'

function pageInfo(doc: Document): PageInfo {
  return {
    url: doc.location?.href ?? '',
    title: doc.title ?? '',
    lang: doc.documentElement.getAttribute('lang'),
  }
}

function runOne(facet: FacetId, doc: Document, settings: Settings, page: PageInfo): AuditResult {
  switch (facet) {
    case 'headings':
      return auditHeadings(doc)
    case 'landmarks':
      return auditLandmarks(doc)
    case 'contrast':
      return auditContrast(doc, settings)
    case 'meta':
      return auditMeta(doc)
    case 'canonical':
      return auditCanonical(doc, page.url)
    case 'hreflang':
      return auditHreflang(doc, page.url)
    case 'images':
      return auditImages(doc)
    case 'links':
      return auditLinks(doc)
    case 'structured-data':
      return auditJsonLd(doc)
  }
}

/** Run every enabled auditor and assemble a full report for the page. */
export function runAllAudits(doc: Document, settings: Settings): AuditReport {
  const page = pageInfo(doc)
  const results: AuditResult[] = []

  for (const facet of FACET_ORDER) {
    if (!settings.enabled[facet]) continue
    try {
      results.push(runOne(facet, doc, settings, page))
    } catch (error) {
      // A single failing auditor must never abort the whole scan.
      const message = error instanceof Error ? error.message : 'Audit failed'
      results.push(
        buildResult(facet, [{ id: `${facet}-crash`, severity: 'error', title: message }], undefined)
      )
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      errors: acc.errors + r.errors,
      warnings: acc.warnings + r.warnings,
      passes: acc.passes + r.passes,
    }),
    { errors: 0, warnings: 0, passes: 0 }
  )

  return {
    page,
    scannedAt: Date.now(),
    score: overallScore(results),
    totals,
    results,
  }
}
