import type { LinksData } from '@/audits/links'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Metrics } from '../Metrics'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

export function LinksView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as LinksData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title={`Links (${data.total})`}>
        <Metrics
          items={[
            { label: 'No name', value: data.withoutName },
            { label: 'No href', value: data.withoutHref },
            { label: 'Generic', value: data.generic },
            { label: 'Unsafe blank', value: data.unsafeBlank },
          ]}
        />
      </Section>
      <IssueList issues={result.issues} onHighlight={onHighlight} emptyLabel="Links look good." />
    </div>
  )
}
