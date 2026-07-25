import type { HeadingNode, HeadingsData } from '@/audits/headings'
import { cn } from '@/lib/utils'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

/** Indent per outline level, in px. Tight enough that h6 still has room to read. */
const INDENT_STEP = 13

function tagLabel(node: HeadingNode): string {
  // A non-heading element carrying an ARIA heading role is marked with *.
  return node.tag.startsWith('h') ? node.tag : `h${node.level}*`
}

function OutlineRow({
  node,
  onHighlight,
}: {
  node: HeadingNode
  onHighlight: (selector: string) => void
}) {
  const text = node.empty ? '(empty heading)' : node.text
  const notes = [node.skipped && 'skipped level', node.empty && 'empty'].filter(Boolean).join(', ')

  return (
    <li>
      <button
        type="button"
        onClick={() => onHighlight(node.selector)}
        aria-label={`${tagLabel(node)}: ${text}${notes ? ` — ${notes}` : ''}. Show on the page.`}
        style={{ paddingLeft: `${(node.level - 1) * INDENT_STEP + 4}px` }}
        className="flex w-full items-center gap-2 rounded-sm py-1 pr-1 text-left transition-colors hover:bg-accent/60"
      >
        <span
          className={cn(
            'shrink-0 rounded-[3px] px-1 py-0.5 font-mono text-[10px] font-semibold',
            node.skipped ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'
          )}
          aria-hidden
        >
          {tagLabel(node)}
        </span>
        <span
          className={cn('truncate text-[13px]', node.empty && 'text-muted-foreground italic')}
          aria-hidden
        >
          {text}
        </span>
      </button>
    </li>
  )
}

export function HeadingsView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as HeadingsData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title={`Document outline (${data.outline.length})`}>
        {data.outline.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No headings on this page.</p>
        ) : (
          <ul className="-mx-1">
            {data.outline.map((node, index) => (
              <OutlineRow key={index} node={node} onHighlight={onHighlight} />
            ))}
          </ul>
        )}
      </Section>
      <IssueList
        issues={result.issues}
        onHighlight={onHighlight}
        emptyLabel="Heading structure looks good."
      />
    </div>
  )
}
