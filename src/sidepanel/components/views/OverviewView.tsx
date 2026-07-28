import { ArrowDown, ArrowUp, ChevronRight, SlidersHorizontal } from 'lucide-react'
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
  /** This page's score on the previous scan, when there was one. */
  previousScore: number | null
  onSelectFacet: (facet: FacetId) => void
  onOpenSettings: () => void
}

/**
 * How the score moved since the last scan of this page.
 *
 * The whole workflow is fix, re-scan, fix again, and until now the gauge slid
 * from one number to another with nothing to say that the developer had done
 * it. This is the only place the panel acknowledges progress.
 */
function ScoreDelta({ from, to }: { from: number; to: number }) {
  const change = to - from
  if (change === 0) return null
  const improved = change > 0
  return (
    <span
      // Solid fills, not tints. A 15% tint lightens the ground out from under
      // the text and drops it to 4.10:1; these pairs are the ones the token
      // system defines to carry their own foreground.
      className={cn(
        'inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-bold faceplate',
        improved
          ? 'bg-success text-success-foreground'
          : 'bg-destructive text-destructive-foreground'
      )}
    >
      {improved ? (
        <ArrowUp className="size-3" aria-hidden />
      ) : (
        <ArrowDown className="size-3" aria-hidden />
      )}
      {Math.abs(change)}
      <span className="sr-only">
        {improved ? ' points better than' : ' points worse than'} the last scan
      </span>
    </span>
  )
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
        className="flex w-full items-center gap-2.5 rounded-md border bg-card px-2.5 py-2.5 text-left transition-colors hover:bg-accent/60"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {/* No score bar here: the profile above is already that chart, and
            drawing it twice makes the list twice as long for no new fact. */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-none font-semibold">
            {result.label}
          </span>
          {/* The facet name and its findings are two different statements, so
              they get a gap. Set flush, the mono line read as a subtitle of the
              label rather than a separate fact about the page. */}
          <span
            className={cn(
              'mt-1.5 block truncate font-mono text-[11px] leading-none',
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

export function OverviewView({
  report,
  previousScore,
  onSelectFacet,
  onOpenSettings,
}: OverviewViewProps) {
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

  const { errors, warnings, passes } = report.totals

  return (
    <div className="space-y-4">
      {/* One hero block, not four. The gauge already states the score, so the
          prose beneath it carries the tally instead of repeating the number. */}
      <div className="flex items-center gap-3.5">
        <FacetGauge score={report.score} size={72} />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2">
            <span className={cn('text-lg leading-none font-semibold', scoreColor(report.score))}>
              {scoreLabel(report.score)}
            </span>
            {previousScore !== null && <ScoreDelta from={previousScore} to={report.score} />}
          </h2>
          <Tally errors={errors} warnings={warnings} passes={passes} />
        </div>
      </div>

      <Spectrum report={report} />

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
