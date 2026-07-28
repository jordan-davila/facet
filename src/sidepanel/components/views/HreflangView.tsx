import { CircleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { HreflangData, HreflangEntry } from '@/audits/hreflang'
import { cn } from '@/lib/utils'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

function EntryRow({
  entry,
  onHighlight,
}: {
  entry: HreflangEntry
  onHighlight: (selector: string) => void
}) {
  const target = entry.resolved ?? entry.href
  const label = entry.hreflang || '(empty)'

  return (
    <li>
      <button
        type="button"
        onClick={() => onHighlight(entry.selector)}
        aria-label={`${label} points to ${target ?? 'no URL'}${
          entry.isSelf ? ', this page' : ''
        }. Show on the page.`}
        className="flex w-full items-start gap-2 rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-accent/60"
      >
        {/* The tag and the URL are the page's own strings, so both use mono. */}
        <span
          className={cn(
            'shrink-0 rounded-[3px] px-1.5 py-0.5 font-mono text-[11px] font-medium',
            entry.validTag
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-destructive/15 text-destructive'
          )}
          aria-hidden
        >
          {label}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[11px] text-muted-foreground" aria-hidden>
            {target ?? 'no href'}
          </span>
        </span>
        {entry.isSelf && (
          <span className="shrink-0 pt-1 eyebrow text-success" aria-hidden>
            self
          </span>
        )}
      </button>
    </li>
  )
}

export function HreflangView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as HreflangData

  return (
    <div className="space-y-3">
      <FacetHeader result={result} />

      {data.entries.length === 0 ? (
        <Section title="Annotations">
          <p className="text-[13px] text-muted-foreground">
            This page declares no alternate languages. That is only a problem if the same content
            exists in another language or region.
          </p>
        </Section>
      ) : (
        <Section
          title={`Annotations (${data.entries.length})`}
          action={
            <div className="flex gap-1.5">
              {data.hasXDefault && <Badge variant="secondary">x-default</Badge>}
              {!data.hasSelfReference && (
                <Badge variant="destructive" className="gap-1">
                  <CircleAlert className="size-3" aria-hidden />
                  no self-ref
                </Badge>
              )}
            </div>
          }
        >
          <ul className="-mx-1 flex flex-col">
            {data.entries.map((entry, index) => (
              <EntryRow key={index} entry={entry} onHighlight={onHighlight} />
            ))}
          </ul>
        </Section>
      )}

      <IssueList
        issues={result.issues}
        onHighlight={onHighlight}
        emptyLabel="Hreflang annotations look good."
      />
    </div>
  )
}
