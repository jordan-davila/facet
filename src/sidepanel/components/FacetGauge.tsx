import { cn } from '@/lib/utils'
import { scoreColor } from '../lib/score'

interface FacetGaugeProps {
  score: number
  size?: number
  stroke?: number
}

/** Vertices of a regular octagon, flat edge on top, inset by half the stroke. */
function octagonPoints(size: number, stroke: number): string {
  const r = (size - stroke) / 2
  const c = size / 2
  return Array.from({ length: 8 }, (_, i) => {
    // Rotate by half a step so the shape rests on a flat edge rather than a point.
    const angle = (Math.PI / 4) * i + Math.PI / 8
    return `${(c + r * Math.sin(angle)).toFixed(2)},${(c - r * Math.cos(angle)).toFixed(2)}`
  }).join(' ')
}

/**
 * The page score, cut as an octagon — one edge per facet Facet inspects.
 * A circle would say nothing; eight sides say what is being counted.
 */
export function FacetGauge({ score, size = 88, stroke = 6 }: FacetGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const points = octagonPoints(size, stroke)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <polygon
          points={points}
          fill="none"
          strokeWidth={stroke}
          strokeLinejoin="round"
          className="stroke-border"
        />
        <polygon
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinejoin="round"
          strokeLinecap="round"
          // pathLength normalizes the perimeter to 100, so the dash offset is
          // literally the score — no arc-length maths to drift out of sync.
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - clamped}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', scoreColor(score))}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-2xl leading-none font-bold faceplate', scoreColor(score))}>
          {clamped}
        </span>
      </div>
    </div>
  )
}
