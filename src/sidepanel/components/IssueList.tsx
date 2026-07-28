import { CircleCheck, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Issue } from '@/core/types'
import { cn } from '@/lib/utils'
import { SEVERITY_META, sortIssues } from '../lib/severity'

interface IssueListProps {
  issues: Issue[]
  onHighlight?: (selector: string) => void
  emptyLabel?: string
}

export function IssueList({
  issues,
  onHighlight,
  emptyLabel = 'Nothing to report.',
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-center text-[13px] text-muted-foreground">
        <CircleCheck className="size-4 shrink-0 text-success" aria-hidden />
        {emptyLabel}
      </p>
    )
  }

  const sorted = sortIssues(issues)

  return (
    <section aria-labelledby="findings-heading">
      <h3 id="findings-heading" className="mb-2 eyebrow">
        Findings ({sorted.length})
      </h3>
      <ul className="flex flex-col gap-1.5">
        {sorted.map((issue) => {
          const meta = SEVERITY_META[issue.severity]
          const { Icon } = meta
          return (
            <li
              key={issue.id}
              className={cn('rounded-md border border-l-[3px] bg-card p-2.5', meta.accent)}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn('mt-px size-4 shrink-0', meta.text)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug font-medium">
                    <span className="sr-only">{meta.label}: </span>
                    {issue.title}
                  </p>
                  {issue.detail && (
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {issue.detail}
                    </p>
                  )}
                  {issue.snippet && (
                    <code className="mt-1.5 block truncate rounded-sm bg-muted px-1.5 py-1 text-[11px] text-muted-foreground">
                      {issue.snippet}
                    </code>
                  )}
                </div>
                {issue.selector && onHighlight && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Reaching the element is the whole promise, so this
                          gets a resting surface rather than a bare glyph. */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={`Show "${issue.title}" on the page`}
                        onClick={() => onHighlight(issue.selector!)}
                      >
                        <Crosshair aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Show on page</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
