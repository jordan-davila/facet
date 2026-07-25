import { Badge } from '@/components/ui/badge'
import type { CanonicalData } from '@/audits/canonical'
import { plural } from '../../lib/score'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

export function CanonicalView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as CanonicalData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title="Canonical link">
        {data.href ? (
          <div className="space-y-2">
            <code className="block rounded-sm bg-muted px-2 py-1.5 text-xs break-all">
              {data.resolved ?? data.href}
            </code>
            <div className="flex flex-wrap gap-1.5">
              {data.isSelfReferencing ? (
                <Badge variant="success">Self-referencing</Badge>
              ) : (
                <Badge variant="info">Points elsewhere</Badge>
              )}
              {data.count > 1 && <Badge variant="destructive">{plural(data.count, 'tag')}</Badge>}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">No canonical link on this page.</p>
        )}
      </Section>
      <IssueList issues={result.issues} onHighlight={onHighlight} />
    </div>
  )
}
