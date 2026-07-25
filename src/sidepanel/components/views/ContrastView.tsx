import type { ContrastData } from '@/audits/contrast'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Metrics } from '../Metrics'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

export function ContrastView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as ContrastData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title={`WCAG ${data.level} contrast`}>
        <Metrics
          items={[
            { label: 'Samples', value: data.checked },
            { label: 'Failing', value: data.failing },
            { label: 'Skipped', value: data.undetermined },
          ]}
        />
      </Section>
      <IssueList
        issues={result.issues}
        onHighlight={onHighlight}
        emptyLabel="All sampled text meets the contrast threshold."
      />
    </div>
  )
}
