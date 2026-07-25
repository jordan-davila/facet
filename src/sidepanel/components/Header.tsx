import { ClipboardCopy, Globe, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { reportToMarkdown } from '@/core/report-markdown'
import type { AuditReport } from '@/core/types'
import { cn } from '@/lib/utils'
import type { ActiveTab } from '../lib/scan'
import { scoreColor } from '../lib/score'

interface HeaderProps {
  tab: ActiveTab | null
  report: AuditReport | null
  scanning: boolean
  onRescan: () => void
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

async function copyReport(report: AuditReport): Promise<void> {
  try {
    await navigator.clipboard.writeText(
      reportToMarkdown(report, new Date(report.scannedAt || Date.now()))
    )
    toast.success('Report copied as Markdown')
  } catch {
    toast.error('Couldn’t copy — the panel needs focus to reach the clipboard.')
  }
}

export function Header({ tab, report, scanning, onRescan }: HeaderProps) {
  const [faviconError, setFaviconError] = useState(false)
  const host = tab ? hostOf(tab.url) : ''

  return (
    <header className="flex items-center gap-2.5 border-b bg-card px-3 py-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm">
        {tab?.favIconUrl && !faviconError ? (
          <img
            src={tab.favIconUrl}
            alt=""
            className="size-4"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <Globe className="size-4 text-muted-foreground" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] leading-tight font-semibold">
          {tab?.title || host || 'Facet'}
        </p>
        {/* The host is the page's own string, so it speaks in mono. */}
        <p className="truncate font-mono text-[11px] leading-tight text-muted-foreground">
          {host || '—'}
        </p>
      </div>
      {report && report.results.length > 0 && (
        <p className="shrink-0">
          <span className="sr-only">Page score </span>
          {/* Quiet on purpose: on Overview the gauge is the headline, and two
              loud copies of the same number would fight each other. */}
          <span
            className={cn(
              'rounded-sm bg-muted px-1.5 py-1 font-mono text-[11px] font-semibold',
              scoreColor(report.score)
            )}
          >
            {report.score}
          </span>
        </p>
      )}
      <span className="flex shrink-0 items-center">
        {report && report.results.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void copyReport(report)}
                aria-label="Copy report as Markdown"
              >
                <ClipboardCopy aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy report</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRescan}
              disabled={scanning}
              aria-label={scanning ? 'Scanning page' : 'Scan page again'}
            >
              <RefreshCw className={cn(scanning && 'animate-spin')} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Scan again</TooltipContent>
        </Tooltip>
      </span>
    </header>
  )
}
