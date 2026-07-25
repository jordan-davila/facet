import { Badge } from '@/components/ui/badge'
import { FACET_META } from '@/core/constants'
import type { AuditResult } from '@/core/types'
import { cn } from '@/lib/utils'
import { facetIcon } from '../lib/nav'
import { plural, scoreColor } from '../lib/score'

export function FacetHeader({ result }: { result: AuditResult }) {
  const Icon = facetIcon(result.facet)
  const clean = result.errors === 0 && result.warnings === 0

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-tight font-semibold">{result.label}</h2>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {FACET_META[result.facet].blurb}
          </p>
        </div>
        <p className="flex shrink-0 items-baseline gap-1">
          <span className="sr-only">Facet score</span>
          <span
            className={cn('text-base leading-none font-bold faceplate', scoreColor(result.score))}
          >
            {result.score}
          </span>
          <span className="eyebrow" aria-hidden>
            /100
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {result.errors > 0 && <Badge variant="destructive">{plural(result.errors, 'error')}</Badge>}
        {result.warnings > 0 && (
          <Badge variant="warning">{plural(result.warnings, 'warning')}</Badge>
        )}
        {clean && <Badge variant="success">All clear</Badge>}
        {result.passes > 0 && (
          <Badge variant="outline">{plural(result.passes, 'check')} passed</Badge>
        )}
      </div>
    </div>
  )
}
