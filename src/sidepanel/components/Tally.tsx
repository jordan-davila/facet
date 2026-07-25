import type { AuditReport } from '@/core/types'
import { cn } from '@/lib/utils'

interface CountProps {
  label: string
  value: number
  tone: string
}

function Count({ label, value, tone }: CountProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 py-2">
      <span
        className={cn(
          'text-xl leading-none font-bold faceplate',
          value === 0 && 'opacity-40',
          tone
        )}
      >
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  )
}

/**
 * The whole-page count, read as one line. Three numbers earn their place here;
 * the score already has the gauge and does not need a fourth box.
 */
export function Tally({ report }: { report: AuditReport }) {
  const { errors, warnings, passes } = report.totals
  return (
    <div className="flex divide-x rounded-md border bg-card">
      <Count label="Errors" value={errors} tone="text-destructive" />
      <Count label="Warnings" value={warnings} tone="text-warning" />
      <Count label="Passed" value={passes} tone="text-success" />
    </div>
  )
}
