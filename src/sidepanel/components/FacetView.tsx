import { Button } from '@/components/ui/button'
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
  onOpenSettings: () => void
}

export function FacetView({ facet, report, onHighlight, onOpenSettings }: FacetViewRouterProps) {
  const result = report.results.find((r) => r.facet === facet)
  if (!result) {
    // Same repair path the Overview empty state offers; a dead end here was
    // the only place in the panel that named a fix without offering it.
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-5 text-center">
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-semibold">{FACET_META[facet].label} is turned off</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Turn it on to include this check in the score.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenSettings}>
          Open settings
        </Button>
      </div>
    )
  }
  const View = VIEWS[facet]
  return <View result={result} onHighlight={onHighlight} />
}
