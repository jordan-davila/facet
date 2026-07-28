import { FACET_META } from '@/core/constants'
import type { AuditReport, FacetId } from '@/core/types'
import { CanonicalView } from './views/CanonicalView'
import { ContrastView } from './views/ContrastView'
import { HeadingsView } from './views/HeadingsView'
import { HreflangView } from './views/HreflangView'
import { ImagesView } from './views/ImagesView'
import { LandmarksView } from './views/LandmarksView'
import { LinksView } from './views/LinksView'
import { MetaView } from './views/MetaView'
import { StructuredDataView } from './views/StructuredDataView'
import type { FacetViewProps } from './views/types'

const VIEWS: Record<FacetId, React.ComponentType<FacetViewProps>> = {
  headings: HeadingsView,
  landmarks: LandmarksView,
  contrast: ContrastView,
  meta: MetaView,
  canonical: CanonicalView,
  hreflang: HreflangView,
  images: ImagesView,
  links: LinksView,
  'structured-data': StructuredDataView,
}

interface FacetViewRouterProps {
  facet: FacetId
  report: AuditReport
  onHighlight: (selector: string) => void
}

export function FacetView({ facet, report, onHighlight }: FacetViewRouterProps) {
  const result = report.results.find((r) => r.facet === facet)
  if (!result) {
    return (
      <div className="space-y-1.5 rounded-md border border-dashed px-4 py-8 text-center">
        <h2 className="text-[13px] font-semibold">{FACET_META[facet].label} is turned off</h2>
        <p className="text-xs text-muted-foreground">Turn it on in Settings to run this check.</p>
      </div>
    )
  }
  const View = VIEWS[facet]
  return <View result={result} onHighlight={onHighlight} />
}
