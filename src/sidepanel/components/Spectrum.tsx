import type { AuditReport, AuditResult } from '@/core/types'
import { cn } from '@/lib/utils'
import { facetIcon } from '../lib/nav'
import { scoreBg } from '../lib/score'

/** Floor the bar so a zero-score facet still reads as a facet, not a gap. */
const MIN_FILL = 6

/** Plot height in px. Tall enough that 47 and 92 are obviously different. */
const PLOT_HEIGHT = 56

function Bar({ result }: { result: AuditResult }) {
  const Icon = facetIcon(result.facet)
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      {/* No track behind the bar: an empty box carries as much visual weight as
          a filled one and flattens the profile it is supposed to show. */}
      <div className="flex items-end px-px" style={{ height: PLOT_HEIGHT }}>
        <div
          className={cn(
            'w-full rounded-t-[2px] transition-[height] duration-500 ease-out',
            scoreBg(result.score)
          )}
          style={{ height: `${Math.max(MIN_FILL, result.score)}%` }}
        />
      </div>
      <Icon className="mx-auto size-3 text-muted-foreground" />
    </div>
  )
}

/**
 * One bar per facet, height by score, standing on a shared baseline: the page's
 * cut profile, in a single look.
 *
 * Deliberately not interactive. The Checks list directly below states the same
 * eight scores in words and is the keyboard path to each facet — making the
 * bars buttons too would double every tab stop to reach the same destinations,
 * so this is hidden from assistive tech as a redundant graphic.
 */
export function Spectrum({ report }: { report: AuditReport }) {
  return (
    <section aria-hidden>
      <h3 className="mb-2 eyebrow">Facet profile</h3>
      <div className="relative flex items-end gap-1">
        {/* The baseline sits exactly where the bars stand, between the plot and
            the icon row, so it reads as an axis rather than an underline. */}
        <span className="absolute inset-x-0 border-b" style={{ top: PLOT_HEIGHT }} />
        {report.results.map((result) => (
          <Bar key={result.facet} result={result} />
        ))}
      </div>
    </section>
  )
}
