import { cn } from '@/lib/utils'

interface TallyProps {
  errors: number
  warnings: number
  passes: number
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={cn('text-sm font-bold faceplate', value === 0 ? 'opacity-40' : tone)}>
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </span>
  )
}

/**
 * The whole-page count, on one line beside the gauge.
 *
 * This used to be a three-column card of its own, which made the Overview open
 * with four separate devices all describing the same scan before reaching a
 * single actionable row. Inline, it says the same thing and gives the checks
 * list roughly seventy pixels back.
 */
export function Tally({ errors, warnings, passes }: TallyProps) {
  return (
    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <Count label="err" value={errors} tone="text-destructive" />
      <Count label="warn" value={warnings} tone="text-warning" />
      <Count label="pass" value={passes} tone="text-success" />
    </p>
  )
}
