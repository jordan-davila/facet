import { FACET_ORDER } from '@/core/constants'
import { cn } from '@/lib/utils'
import { scoreColor } from '../lib/score'

interface FacetGaugeProps {
  score: number
  /** Edges to cut. Defaults to one per facet, which is the whole point. */
  sides?: number
  size?: number
  stroke?: number
}

/** Below this the shape stops reading as a cut stone and starts reading as an arrow. */
const MIN_SIDES = 5

/** Vertices of a regular polygon, flat edge on top, inset by half the stroke. */
function polygonPoints(size: number, stroke: number, sides: number): string {
  const r = (size - stroke) / 2
  const c = size / 2
  const step = (Math.PI * 2) / sides
  return Array.from({ length: sides }, (_, i) => {
    // Rotate by half a step so the shape rests on a flat edge rather than a point.
    const angle = step * i + step / 2
    return `${(c + r * Math.sin(angle)).toFixed(2)},${(c - r * Math.cos(angle)).toFixed(2)}`
  }).join(' ')
}

/**
 * The page score, cut as a polygon with one edge per facet Facet inspects.
 *
 * The side count is derived rather than fixed: the shape's whole claim is that
 * it counts something, so it has to keep counting correctly when a facet is
 * added. It started life as an octagon because there were eight checks.
 */
export function FacetGauge({
  score,
  sides = FACET_ORDER.length,
  size = 88,
  stroke = 6,
}: FacetGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const points = polygonPoints(size, stroke, Math.max(MIN_SIDES, sides))

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
