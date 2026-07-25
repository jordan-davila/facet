import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AuditReport, AuditResult, FacetId } from '@/core/types'
import { cn } from '@/lib/utils'
import { facetIcon } from '../../lib/nav'
import { STATE_TEXT, facetState, findingsSummary, scoreColor, scoreLabel } from '../../lib/score'
import { FacetGauge } from '../FacetGauge'
import { Spectrum } from '../Spectrum'
import { Tally } from '../Tally'

interface OverviewViewProps {
  report: AuditReport
  onSelectFacet: (facet: FacetId) => void
  onOpenSettings: () => void
}

function FacetRow({
  result,
  onSelect,
}: {
  result: AuditResult
  onSelect: (facet: FacetId) => void
}) {
  const Icon = facetIcon(result.facet)
  const summary = findingsSummary(result.errors, result.warnings)
  const state = facetState(result)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(result.facet)}
        aria-label={`${result.label}: score ${result.score}, ${summary}`}
        className="flex w-full items-center gap-2.5 rounded-md border bg-card px-2.5 py-2 text-left transition-colors hover:bg-accent/60"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {/* No score bar here: the profile above is already that chart, and
            drawing it twice makes the list twice as long for no new fact. */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-tight font-semibold">
            {result.label}
          </span>
          <span
            className={cn(
              'block truncate font-mono text-[11px] leading-tight',
              state === 'clear' ? 'text-muted-foreground' : STATE_TEXT[state]
            )}
            aria-hidden
          >
            {summary}
          </span>
        </span>
        <span
          className={cn('shrink-0 text-sm font-bold faceplate', scoreColor(result.score))}
          aria-hidden
        >
          {result.score}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  )
}

export function OverviewView({ report, onSelectFacet, onOpenSettings }: OverviewViewProps) {
  // With nothing enabled the mean of zero facets is 100, which would claim a
  // perfect page nobody checked. Say what actually happened instead.
  if (report.results.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-5 text-center">
        <SlidersHorizontal className="size-7 text-muted-foreground" aria-hidden />
        <div className="space-y-1.5">
          <h2 className="text-[13px] font-semibold">No checks are turned on</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Facet has nothing to measure. Turn on at least one check to score this page.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenSettings}>
          Open settings
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3.5">
        <FacetGauge score={report.score} />
        <div className="min-w-0">
          <h2 className={cn('text-lg leading-tight font-semibold', scoreColor(report.score))}>
            {scoreLabel(report.score)}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Scored {report.score} out of 100 across {report.results.length}{' '}
            {report.results.length === 1 ? 'check' : 'checks'}.
          </p>
        </div>
      </div>

      <Spectrum report={report} />

      <Tally report={report} />

      <section aria-labelledby="facet-list-heading">
        <h3 id="facet-list-heading" className="mb-2 eyebrow">
          Checks
        </h3>
        <ul className="space-y-1.5">
          {report.results.map((result) => (
            <FacetRow key={result.facet} result={result} onSelect={onSelectFacet} />
          ))}
        </ul>
      </section>
    </div>
  )
}
