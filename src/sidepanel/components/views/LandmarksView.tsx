import type { LandmarksData } from '@/audits/landmarks'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

/** Indent per nesting level, in px. */
const INDENT_STEP = 14

export function LandmarksView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as LandmarksData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title={`Landmarks (${data.landmarks.length})`}>
        {data.landmarks.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No landmark regions found.</p>
        ) : (
          <ul className="-mx-1 flex flex-col">
            {data.landmarks.map((landmark, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onHighlight(landmark.selector)}
                  aria-label={`${landmark.role} landmark, ${
                    landmark.name ? `labeled ${landmark.name}` : 'unlabeled'
                  }, <${landmark.tag}> element. Show on the page.`}
                  style={{ paddingLeft: `${landmark.depth * INDENT_STEP + 4}px` }}
                  className="flex w-full items-center gap-2 rounded-sm py-1.5 pr-1 text-left transition-colors hover:bg-accent/60"
                >
                  {landmark.depth > 0 && (
                    <span className="shrink-0 font-mono text-xs text-muted-foreground" aria-hidden>
                      ↳
                    </span>
                  )}
                  {/* Role and tag come from the page: mono. The fallback
                      "unlabeled" is Facet talking, so it stays in sans. */}
                  <span
                    className="shrink-0 rounded-[3px] bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-medium text-secondary-foreground"
                    aria-hidden
                  >
                    {landmark.role}
                  </span>
                  <span className="truncate text-[13px]" aria-hidden>
                    {landmark.name ?? (
                      <span className="text-muted-foreground italic">unlabeled</span>
                    )}
                  </span>
                  <span
                    className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground"
                    aria-hidden
                  >
                    &lt;{landmark.tag}&gt;
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <IssueList
        issues={result.issues}
        onHighlight={onHighlight}
        emptyLabel="Landmark structure looks good."
      />
    </div>
  )
}
